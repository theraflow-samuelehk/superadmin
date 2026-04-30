import express from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import QRCode from "qrcode";
import pino from "pino";
import { Boom } from "@hapi/boom";
import { makeWASocket, useMultiFileAuthState, DisconnectReason, Browsers, fetchLatestBaileysVersion } from "@whiskeysockets/baileys";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const API_KEY = process.env.API_KEY || "";
const RESET_SESSION = /^true$/i.test(process.env.RESET_SESSION || "");
const LOG_LEVEL = process.env.LOG_LEVEL || "info";
const AUTH_DIR = path.join(__dirname, "auth_info_baileys");

const app = express();
app.use(express.json({ limit: "1mb" }));

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-api-key");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }
  next();
});

const logger = pino({ level: LOG_LEVEL });

let sock = null;
let startupPromise = null;
let reconnectTimer = null;
let manualDisconnect = false;

let connectionState = "idle"; // idle | starting | qr | open | disconnected
let lastQrText = null;
let lastQrHtml = null;
let lastPairingCode = null;
let lastConnectedAt = null;
let lastDisconnectCode = null;
let lastDisconnectMessage = null;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function sanitizePhone(phone) {
  return String(phone || "").replace(/\D/g, "");
}

function escapeHtml(value) {
  return String(value || "").replace(/[&<>"']/g, (char) => {
    const map = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "\"": "&quot;",
      "'": "&#39;",
    };
    return map[char] || char;
  });
}

function clearReconnectTimer() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
}

function clearSessionFolder() {
  fs.rmSync(AUTH_DIR, { recursive: true, force: true });
}

function isRegistered() {
  return Boolean(sock?.authState?.creds?.registered);
}

function getDisconnectStatusCode(error) {
  if (!error) return null;
  if (typeof error?.output?.statusCode === "number") return error.output.statusCode;
  if (typeof error?.data?.statusCode === "number") return error.data.statusCode;
  if (error instanceof Boom && typeof error.output?.statusCode === "number") {
    return error.output.statusCode;
  }
  return null;
}

async function buildQrHtml(qrText) {
  const dataUrl = await QRCode.toDataURL(qrText, {
    margin: 1,
    width: 320,
  });

  return `
    <div style="min-height:100%;display:flex;align-items:center;justify-content:center;padding:24px;background:#ffffff;">
      <div style="text-align:center;font-family:Arial,sans-serif;">
        <img src="${dataUrl}" alt="QR Code WhatsApp" style="width:320px;height:320px;display:block;margin:0 auto 16px auto;" />
        <div style="font-size:18px;font-weight:700;color:#111827;margin-bottom:8px;">Scansiona il QR con WhatsApp</div>
        <div style="font-size:14px;color:#4b5563;">WhatsApp → Dispositivi collegati → Collega un dispositivo</div>
      </div>
    </div>
  `;
}

function authMiddleware(req, res, next) {
  if (!API_KEY) {
    return res.status(500).json({
      success: false,
      error: "API_KEY non configurata nel microservizio",
    });
  }

  const incomingKey = req.header("x-api-key");
  if (incomingKey !== API_KEY) {
    return res.status(401).json({
      success: false,
      error: "Non autorizzato",
    });
  }

  next();
}

function scheduleReconnect() {
  if (manualDisconnect || reconnectTimer) return;

  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    void ensureSocket().catch((error) => {
      console.error("[reconnect] errore:", error?.message || error);
    });
  }, 2000);
}

async function getSocketVersion() {
  try {
    const latest = await fetchLatestBaileysVersion();
    if (latest?.version) {
      console.log("[baileys] uso web version:", latest.version.join("."));
      return latest.version;
    }
  } catch (error) {
    console.warn("[baileys] impossibile leggere la latest version, continuo con default");
  }
  return undefined;
}

async function startSocket() {
  clearReconnectTimer();
  manualDisconnect = false;
  connectionState = "starting";
  lastQrText = null;
  lastQrHtml = null;
  lastPairingCode = null;
  lastDisconnectCode = null;
  lastDisconnectMessage = null;

  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  const version = await getSocketVersion();

  const nextSock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    browser: Browsers.ubuntu("Chrome"),
    logger,
    version,
    markOnlineOnConnect: false,
    syncFullHistory: false,
    shouldSyncHistoryMessage: () => false,
    generateHighQualityLinkPreview: false,
  });

  sock = nextSock;

  nextSock.ev.on("creds.update", saveCreds);

  nextSock.ev.on("connection.update", async (update) => {
    if (sock !== nextSock) return;

    const { connection, qr, lastDisconnect } = update;

    if (qr) {
      lastQrText = qr;
      lastQrHtml = await buildQrHtml(qr);
      connectionState = "qr";
      console.log("[baileys] QR generato");
    }

    if (connection === "open") {
      connectionState = "open";
      lastQrText = null;
      lastQrHtml = null;
      lastPairingCode = null;
      lastConnectedAt = new Date().toISOString();
      lastDisconnectCode = null;
      lastDisconnectMessage = null;
      console.log("[baileys] WhatsApp collegato");
    }

    if (connection === "close") {
      const statusCode = getDisconnectStatusCode(lastDisconnect?.error);
      const message =
        lastDisconnect?.error?.message ||
        "Connessione chiusa";

      lastDisconnectCode = statusCode;
      lastDisconnectMessage = message;

      console.warn("[baileys] connessione chiusa:", {
        statusCode,
        message,
      });

      const wasRegistered = Boolean(nextSock?.authState?.creds?.registered);

      sock = null;
      connectionState = "disconnected";
      lastQrText = null;
      lastQrHtml = null;

      const shouldReconnect =
        !manualDisconnect &&
        wasRegistered &&
        statusCode !== DisconnectReason.loggedOut &&
        statusCode !== 401;

      if (shouldReconnect) {
        scheduleReconnect();
      }
    }
  });

  return nextSock;
}

async function ensureSocket() {
  if (sock) return sock;
  if (startupPromise) return startupPromise;

  startupPromise = startSocket()
    .catch((error) => {
      sock = null;
      connectionState = "disconnected";
      lastDisconnectMessage = error?.message || "Errore avvio socket";
      throw error;
    })
    .finally(() => {
      startupPromise = null;
    });

  return startupPromise;
}

async function waitForQr(timeoutMs = 30000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    if (lastQrHtml) return true;
    if (isRegistered() || connectionState === "open") return false;
    await delay(500);
  }

  return Boolean(lastQrHtml);
}

async function disconnectAndReset() {
  manualDisconnect = true;
  clearReconnectTimer();

  try {
    if (sock) {
      try {
        await sock.logout();
      } catch (error) {
        console.warn("[disconnect] logout warning:", error?.message || error);
      }

      try {
        if (typeof sock.end === "function") {
          sock.end(new Error("manual_disconnect"));
        }
      } catch (error) {
        console.warn("[disconnect] end warning:", error?.message || error);
      }
    }
  } finally {
    sock = null;
    connectionState = "disconnected";
    lastQrText = null;
    lastQrHtml = null;
    lastPairingCode = null;
    await delay(500);
    clearSessionFolder();
  }
}

app.get("/", (_req, res) => {
  res.json({
    success: true,
    service: "glowup-whatsapp-service",
    status: "online",
    endpoints: ["/health", "/qr", "/pair", "/disconnect", "/send"],
  });
});

app.get("/health", authMiddleware, async (_req, res) => {
  if (!sock && !startupPromise) {
    void ensureSocket().catch((error) => {
      console.error("[health] bootstrap error:", error?.message || error);
    });
  }

  const connected = connectionState === "open";
  const registered = isRegistered();

  const whatsapp =
    connected
      ? "connected"
      : registered
        ? "registered"
        : lastQrHtml || connectionState === "qr" || connectionState === "starting"
          ? "connecting"
          : "disconnected";

  res.json({
    success: true,
    status: connected ? "connected" : "ok",
    service: "online",
    connected,
    whatsapp_connected: connected,
    whatsapp,
    registered,
    has_qr: Boolean(lastQrHtml),
    last_connected_at: lastConnectedAt,
    last_disconnect_code: lastDisconnectCode,
    last_disconnect_message: lastDisconnectMessage,
  });
});

app.get("/qr", authMiddleware, async (_req, res) => {
  try {
    await ensureSocket();

    if (isRegistered() || connectionState === "open") {
      return res.type("html").send(`
        <div style="padding:24px;text-align:center;font-family:Arial,sans-serif;">
          <div style="font-size:18px;font-weight:700;color:#111827;margin-bottom:8px;">WhatsApp già collegato</div>
          <div style="font-size:14px;color:#4b5563;">Se vuoi collegare un altro numero, clicca prima “Disconnetti”.</div>
        </div>
      `);
    }

    const ready = await waitForQr(15000);

    if (ready && lastQrHtml) {
      return res.type("html").send(lastQrHtml);
    }

    return res.type("html").send(`
      <div style="padding:24px;text-align:center;font-family:Arial,sans-serif;">
        <div style="font-size:18px;font-weight:700;color:#111827;margin-bottom:8px;">QR code in generazione</div>
        <div style="font-size:14px;color:#4b5563;">Ricarica tra qualche secondo.</div>
      </div>
    `);
  } catch (error) {
    return res.type("html").send(`
      <div style="padding:24px;text-align:center;font-family:Arial,sans-serif;">
        <div style="font-size:18px;font-weight:700;color:#b91c1c;margin-bottom:8px;">Errore QR</div>
        <div style="font-size:14px;color:#7f1d1d;">${escapeHtml(error?.message || "Errore sconosciuto")}</div>
      </div>
    `);
  }
});

app.post("/pair", authMiddleware, async (req, res) => {
  const phone = sanitizePhone(req.body?.phone);

  if (!phone) {
    return res.status(400).json({
      success: false,
      error: "Numero di telefono richiesto",
    });
  }

  if (phone.length < 8) {
    return res.status(400).json({
      success: false,
      error: "Numero di telefono non valido",
    });
  }

  try {
    await ensureSocket();

    if (isRegistered() || connectionState === "open") {
      return res.json({
        success: false,
        error: "WhatsApp già collegato. Clicca prima 'Disconnetti'.",
      });
    }

    const qrReady = await waitForQr(30000);

    if (!qrReady || !sock) {
      return res.status(409).json({
        success: false,
        error: "La sessione WhatsApp non è pronta. Riprova tra qualche secondo oppure usa il QR Code.",
      });
    }

    await delay(1500);

    const code = await sock.requestPairingCode(phone);
    lastPairingCode = code;

    console.log("[pair] codice generato per:", phone);

    return res.json({
      success: true,
      pairing_code: code,
    });
  } catch (error) {
    console.error("[pair] errore:", error?.message || error);

    return res.status(500).json({
      success: false,
      error: error?.message || "Errore nella generazione del codice",
    });
  }
});

app.post("/disconnect", authMiddleware, async (_req, res) => {
  try {
    await disconnectAndReset();

    return res.json({
      success: true,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error?.message || "Errore nella disconnessione",
    });
  }
});

app.post("/send", authMiddleware, async (req, res) => {
  const phone = sanitizePhone(req.body?.phone);
  const message = String(req.body?.message || "").trim();

  if (!phone || !message) {
    return res.status(400).json({
      sent: false,
      error: "phone e message sono obbligatori",
    });
  }

  try {
    await ensureSocket();

    if (!sock || connectionState !== "open") {
      return res.json({
        sent: false,
        reason: "whatsapp_not_connected",
      });
    }

    const jid = `${phone}@s.whatsapp.net`;

    const check = await sock.onWhatsApp(jid);
    if (!check?.[0]?.exists) {
      return res.json({
        sent: false,
        reason: "not_on_whatsapp",
      });
    }

    const result = await sock.sendMessage(jid, { text: message });

    return res.json({
      sent: true,
      message_id: result?.key?.id || null,
    });
  } catch (error) {
    console.error("[send] errore:", error?.message || error);

    return res.status(500).json({
      sent: false,
      error: error?.message || "Errore invio messaggio",
    });
  }
});

if (RESET_SESSION) {
  console.warn("[startup] RESET_SESSION=true -> elimino la sessione salvata");
  clearSessionFolder();
}

app.listen(PORT, () => {
  console.log(`WhatsApp service attivo sulla porta ${PORT}`);
  void ensureSocket().catch((error) => {
    console.error("[startup] errore avvio socket:", error?.message || error);
  });
});
