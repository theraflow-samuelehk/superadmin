// Web Push implementation using Web Crypto API (Deno compatible)
// Implements RFC 8291 (Message Encryption for Web Push) + VAPID (RFC 8292)

function base64UrlDecode(str: string): Uint8Array {
  const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(base64 + padding);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function base64UrlEncode(buffer: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < buffer.length; i++) binary += String.fromCharCode(buffer[i]);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function concatBuffers(...buffers: Uint8Array[]): Uint8Array {
  const totalLength = buffers.reduce((acc, b) => acc + b.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const buf of buffers) {
    result.set(buf, offset);
    offset += buf.length;
  }
  return result;
}

async function hkdf(
  salt: Uint8Array,
  ikm: Uint8Array,
  info: Uint8Array,
  length: number
): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey("raw", ikm, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const prk = new Uint8Array(await crypto.subtle.sign("HMAC", await crypto.subtle.importKey("raw", salt, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]), ikm));
  const infoWithCounter = concatBuffers(info, new Uint8Array([1]));
  const prkKey = await crypto.subtle.importKey("raw", prk, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const okm = new Uint8Array(await crypto.subtle.sign("HMAC", prkKey, infoWithCounter));
  return okm.slice(0, length);
}

async function createVapidJwt(
  audience: string,
  publicKeyB64: string,
  privateKeyD: string
): Promise<string> {
  const publicKeyRaw = base64UrlDecode(publicKeyB64);

  const jwk = {
    kty: "EC",
    crv: "P-256",
    d: privateKeyD,
    x: base64UrlEncode(publicKeyRaw.slice(1, 33)),
    y: base64UrlEncode(publicKeyRaw.slice(33, 65)),
  };

  const key = await crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );

  const header = base64UrlEncode(new TextEncoder().encode(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const payload = base64UrlEncode(
    new TextEncoder().encode(
      JSON.stringify({
        aud: audience,
        exp: Math.floor(Date.now() / 1000) + 12 * 3600,
        sub: "mailto:noreply@glowup.app",
      })
    )
  );

  const unsigned = `${header}.${payload}`;
  const signature = new Uint8Array(
    await crypto.subtle.sign(
      { name: "ECDSA", hash: "SHA-256" },
      key,
      new TextEncoder().encode(unsigned)
    )
  );

  return `${unsigned}.${base64UrlEncode(signature)}`;
}

async function encryptPayload(
  payload: Uint8Array,
  subscriberPublicKeyB64: string,
  subscriberAuthB64: string
): Promise<Uint8Array> {
  const subscriberPublicKey = base64UrlDecode(subscriberPublicKeyB64);
  const subscriberAuth = base64UrlDecode(subscriberAuthB64);

  // Generate local ECDH key pair
  const localKeyPair = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveBits"]
  );

  const localPublicKeyRaw = new Uint8Array(
    await crypto.subtle.exportKey("raw", localKeyPair.publicKey)
  );

  // Import subscriber public key
  const subscriberKey = await crypto.subtle.importKey(
    "raw",
    subscriberPublicKey,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    []
  );

  // Derive shared secret via ECDH
  const sharedSecret = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: "ECDH", public: subscriberKey },
      localKeyPair.privateKey,
      256
    )
  );

  // Generate random 16-byte salt
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // Derive IKM using auth secret
  const authInfo = concatBuffers(
    new TextEncoder().encode("WebPush: info\0"),
    subscriberPublicKey,
    localPublicKeyRaw
  );
  const ikm = await hkdf(subscriberAuth, sharedSecret, authInfo, 32);

  // Derive content encryption key and nonce
  const cekInfo = new TextEncoder().encode("Content-Encoding: aes128gcm\0");
  const contentKey = await hkdf(salt, ikm, cekInfo, 16);

  const nonceInfo = new TextEncoder().encode("Content-Encoding: nonce\0");
  const nonce = await hkdf(salt, ikm, nonceInfo, 12);

  // Pad payload with delimiter byte
  const paddedPayload = concatBuffers(payload, new Uint8Array([2]));

  // Encrypt
  const aesKey = await crypto.subtle.importKey("raw", contentKey, { name: "AES-GCM" }, false, [
    "encrypt",
  ]);
  const encrypted = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, aesKey, paddedPayload)
  );

  // Build aes128gcm body: salt(16) + rs(4) + idlen(1) + keyid(65) + encrypted
  const rs = 4096;
  const headerBuf = new Uint8Array(16 + 4 + 1 + localPublicKeyRaw.length);
  headerBuf.set(salt, 0);
  new DataView(headerBuf.buffer).setUint32(16, rs);
  headerBuf[20] = localPublicKeyRaw.length;
  headerBuf.set(localPublicKeyRaw, 21);

  return concatBuffers(headerBuf, encrypted);
}

export interface PushSubscription {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export async function sendWebPush(
  subscription: PushSubscription,
  payload: { title: string; body: string; data?: Record<string, unknown> },
  vapidPublicKey: string,
  vapidPrivateKey: string
): Promise<boolean> {
  try {
    const payloadBytes = new TextEncoder().encode(JSON.stringify(payload));
    const encrypted = await encryptPayload(payloadBytes, subscription.p256dh, subscription.auth);

    const endpoint = new URL(subscription.endpoint);
    const audience = `${endpoint.protocol}//${endpoint.host}`;
    const jwt = await createVapidJwt(audience, vapidPublicKey, vapidPrivateKey);

    const response = await fetch(subscription.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Encoding": "aes128gcm",
        Authorization: `vapid t=${jwt}, k=${vapidPublicKey}`,
        TTL: "86400",
        Urgency: "high",
      },
      body: encrypted,
    });

    if (response.status === 201 || response.status === 200) {
      return true;
    }

    // 404 or 410 means subscription is expired/invalid
    if (response.status === 404 || response.status === 410) {
      console.log("Push subscription expired:", subscription.endpoint.slice(0, 50));
      return false;
    }

    console.error("Push send failed:", response.status, await response.text());
    return false;
  } catch (e) {
    console.error("Push send error:", e);
    return false;
  }
}
