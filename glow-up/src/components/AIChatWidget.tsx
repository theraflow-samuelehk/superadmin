import { useState, useRef, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSpotlight, type GuideStep } from "@/hooks/useSpotlight";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Send, Loader2, Mic, MicOff, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { FeatherMascot } from "@/components/FeatherMascot";

type Msg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-onboarding-chat`;
const GENERIC_APPOINTMENT_QUERIES = new Set([
  "text:nome_cliente",
  "text:appuntamento",
  "text:appointment",
]);

function normalizeGuideSteps(rawSteps: GuideStep[]): GuideStep[] {
  const normalized = rawSteps.map((step) => {
    const normalizedQuery = step.query.trim().toLowerCase();

    if (GENERIC_APPOINTMENT_QUERIES.has(normalizedQuery)) {
      return {
        ...step,
        query: 'css:[data-glowup-role="appointment-card"], [data-glowup-role="appointment-list-item"]',
      };
    }

    return step;
  });

  return normalized.filter((step, index, arr) => {
    const currentQuery = step.query.trim().toLowerCase();
    const prevQuery = arr[index - 1]?.query.trim().toLowerCase();

    if (
      (currentQuery === "btn:modifica" || currentQuery === "btn:edit") &&
      prevQuery === 'css:[data-glowup-role="appointment-card"], [data-glowup-role="appointment-list-item"]'
    ) {
      return false;
    }

    return true;
  });
}

function buildDeterministicGuide(message: string): GuideStep[] | null {
  const normalized = message.trim().toLowerCase();

  // ── Clienti ──
  if (/come (aggiungo|creo|inserisco).*client/.test(normalized)) {
    return [
      { description: "Vai nella sezione Clienti", query: "id:nav-clienti" },
      { description: "Clicca su Nuovo cliente", query: "id:clients-new-client", mode: "click" },
      { description: "Inserisci i dati del cliente nel modulo e conferma direttamente da lì.", query: "id:client-form-dialog", mode: "interact" },
    ];
  }

  // ── Agenda: Modificare appuntamento ──
  if (/(come|dove).*(modifico|cambio|edito|aggiorno).*(appuntamento|evento|prenotazione)/.test(normalized)) {
    return [
      { description: "Vai nella sezione Agenda", query: "id:nav-agenda" },
      { description: "Tocca un appuntamento nell'agenda per aprirlo", query: 'css:[data-glowup-role="appointment-card"], [data-glowup-role="appointment-list-item"]', mode: "click" },
      { description: "Modifica i dati e salva. Se cambi orario o operatore ti verrà chiesta conferma.", query: "id:appointment-form-dialog", mode: "interact" },
    ];
  }

  // ── Agenda: Creare appuntamento (click su griglia) ──
  if (/(come|dove).*(creo|aggiungo|inserisco|faccio|prenoto).*(appuntamento|evento|prenotazione)/.test(normalized)) {
    return [
      { description: "Vai nell'Agenda", query: "id:nav-agenda" },
      { description: "Clicca su uno slot vuoto nella griglia per creare un appuntamento con data/ora precompilati, oppure usa il pulsante + per lo Smart Booking guidato.", query: "css:.agenda-cell, [data-tour='add-btn']", mode: "click" },
      { description: "Compila il form: scegli operatore, servizio e cliente, poi salva.", query: "id:appointment-form-dialog", mode: "interact" },
    ];
  }

  // ── Agenda: Cancellare appuntamento ──
  if (/(come|dove).*(cancell|elimin|annull).*(appuntamento|evento|prenotazione)/.test(normalized)) {
    return [
      { description: "Vai nell'Agenda", query: "id:nav-agenda" },
      { description: "Clicca sull'appuntamento da cancellare", query: 'css:[data-glowup-role="appointment-card"], [data-glowup-role="appointment-list-item"]', mode: "click" },
      { description: "Nel form, clicca il pulsante 🗑️ Cancella e conferma l'eliminazione.", query: "id:appointment-form-dialog", mode: "interact" },
    ];
  }

  // ── Agenda: Spostare appuntamento (drag & drop) ──
  if (/(come|dove).*(spost|trascin|drag).*(appuntamento|evento)/.test(normalized)) {
    return [
      { description: "Vai nell'Agenda", query: "id:nav-agenda" },
      { description: "Tieni premuto su un appuntamento e trascinalo nel nuovo slot orario o su un'altra colonna operatore. Verrà chiesta conferma.", query: 'css:[data-glowup-role="appointment-card"]', mode: "interact" },
    ];
  }

  // ── Agenda: Smart Booking ──
  if (/(smart booking|prenotazione (rapida|guidata|intelligente))/.test(normalized)) {
    return [
      { description: "Vai nell'Agenda", query: "id:nav-agenda" },
      { description: "Clicca il pulsante + in alto a destra per aprire lo Smart Booking", query: "css:[data-tour='add-btn']", mode: "click" },
      { description: "Segui i 4 step: Servizio → Operatore → Data/Ora → Cliente", query: "css:[role='dialog']", mode: "interact" },
    ];
  }

  // ── Agenda: Vista mese ──
  if (/(vista|visualizza).*(mese|mensile)/.test(normalized) || /come (vedo|passo).*(mese|mensile)/.test(normalized)) {
    return [
      { description: "Vai nell'Agenda", query: "id:nav-agenda" },
      { description: "Clicca su 'Mese' in alto a destra per passare alla vista mensile", query: "css:[data-tour='view-toggle']", mode: "click" },
    ];
  }

  // ── Agenda: Dove trovo ──
  if (/(dove|come).*(trovo|accedo|apro|vado).*(agenda|calendario|appuntament)/.test(normalized)) {
    return [
      { description: "Clicca su Agenda nel menu laterale", query: "id:nav-agenda" },
    ];
  }

  // ── Agenda: Checkout / Cassa da appuntamento ──
  if (/(come|dove).*(checkout|incass|pago|pagament).*(appuntamento|evento)?/.test(normalized) || /(come|dove).*(appuntamento|evento).*(checkout|incass|cassa)/.test(normalized)) {
    return [
      { description: "Vai nell'Agenda", query: "id:nav-agenda" },
      { description: "Trova un appuntamento completato (verde) e clicca l'icona 💰 per andare al checkout in Cassa con i dati precompilati.", query: 'css:[data-glowup-role="appointment-list-item"]', mode: "interact" },
    ];
  }

  return null;
}

// Parse [[guide]]...[[/guide]] blocks and legacy [[highlight:id]] markers
function parseGuide(text: string): { clean: string; steps: GuideStep[] } {
  const steps: GuideStep[] = [];
  const guideMatch = text.match(/\[\[guide\]\]\s*\n?([\s\S]*?)\[\[\/guide\]\]/i);
  if (guideMatch) {
    const lines = guideMatch[1].trim().split("\n").filter(Boolean);
    for (const line of lines) {
      const parts = line.split("||");
      if (parts.length >= 2) {
        steps.push({ description: parts[0].trim(), query: parts[1].trim() });
      }
    }
    const clean = text.replace(/\[\[guide\]\][\s\S]*?\[\[\/guide\]\]/i, "").trim();
    return { clean, steps: normalizeGuideSteps(steps) };
  }
  const clean = text.replace(/\[\[highlight:([a-z0-9-]+)\]\]/gi, (_, id) => {
    steps.push({ description: "Clicca qui!", query: `id:${id}` });
    return "";
  });
  return { clean: clean.trim(), steps: normalizeGuideSteps(steps) };
}

async function streamChat({
  messages, token, conversationId, context, onDelta, onDone, onError, signal,
}: {
  messages: Msg[]; token: string; conversationId?: string; context?: string;
  onDelta: (text: string) => void; onDone: () => void; onError: (err: string) => void; signal?: AbortSignal;
}) {
  const resp = await fetch(CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    },
    body: JSON.stringify({ messages, conversationId, context }),
    signal,
  });

  if (!resp.ok) {
    const body = await resp.text();
    try { const j = JSON.parse(body); onError(j.error || `Errore ${resp.status}`); }
    catch { onError(`Errore ${resp.status}`); }
    return;
  }

  if (!resp.body) { onError("Nessuna risposta dal server"); return; }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let textBuffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    textBuffer += decoder.decode(value, { stream: true });
    let newlineIndex: number;
    while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
      let line = textBuffer.slice(0, newlineIndex);
      textBuffer = textBuffer.slice(newlineIndex + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (line.startsWith(":") || line.trim() === "") continue;
      if (!line.startsWith("data: ")) continue;
      const jsonStr = line.slice(6).trim();
      if (jsonStr === "[DONE]") { onDone(); return; }
      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) onDelta(content);
      } catch {
        textBuffer = line + "\n" + textBuffer;
        break;
      }
    }
  }

  if (textBuffer.trim()) {
    for (let raw of textBuffer.split("\n")) {
      if (!raw) continue;
      if (raw.endsWith("\r")) raw = raw.slice(0, -1);
      if (raw.startsWith(":") || raw.trim() === "") continue;
      if (!raw.startsWith("data: ")) continue;
      const jsonStr = raw.slice(6).trim();
      if (jsonStr === "[DONE]") continue;
      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) onDelta(content);
      } catch {}
    }
  }
  onDone();
}

// ─── Voice Input ─────────────────────────────────────────
function useVoiceInput(onResult: (text: string) => void) {
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  const toggle = useCallback(() => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const recognition = new SR();
    recognition.lang = "it-IT";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (transcript) onResult(transcript);
      setIsRecording(false);
    };
    recognition.onerror = () => setIsRecording(false);
    recognition.onend = () => setIsRecording(false);
    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  }, [isRecording, onResult]);

  const supported = typeof window !== "undefined" && !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
  return { isRecording, toggle, supported };
}

interface AIChatWidgetProps {
  context?: "admin" | "client_portal";
}

/**
 * Feather mascot AI widget — rests bottom-right, opens a minimal input.
 * AI responds with guide steps → feather moves to guide the user visually.
 */
export function AIChatWidget({ context = "admin" }: AIChatWidgetProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, session } = useAuth();
  const { startGuide, highlight, steps: activeSteps } = useSpotlight();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const { isRecording, toggle: toggleVoice, supported: voiceSupported } = useVoiceInput(
    useCallback((text: string) => setInput((prev) => prev + (prev ? " " : "") + text), [])
  );

  // Focus input when opened
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  // Hide input bubble when guide is active
  const guideActive = activeSteps.length > 0;
  const [onboardingLocked, setOnboardingLocked] = useState(false);

  useEffect(() => {
    const readOnboardingLock = () => {
      const modalOpen = document.querySelector('[data-onboarding-active="true"]');
      setOnboardingLocked(!!modalOpen);
    };

    readOnboardingLock();
    const observer = new MutationObserver(readOnboardingLock);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true });
    return () => observer.disconnect();
  }, []);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || isLoading || !session?.access_token) return;

    const deterministicGuide = buildDeterministicGuide(text);
    if (deterministicGuide) {
      setInput("");
      setError(null);
      setOpen(false);
      setTimeout(() => startGuide(deterministicGuide), 150);
      return;
    }

    setInput("");
    setError(null);
    setIsLoading(true);

    const messages: Msg[] = [{ role: "user", content: text }];
    let assistantSoFar = "";

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      await streamChat({
        messages,
        token: session.access_token,
        context: context === "client_portal" ? "client_portal" : undefined,
        onDelta: (chunk) => { assistantSoFar += chunk; },
        onDone: () => {
          setIsLoading(false);
          const { steps } = parseGuide(assistantSoFar);
          if (steps.length > 0) {
            setOpen(false);
            setTimeout(() => {
              if (steps.length === 1 && steps[0].description === "Clicca qui!") {
                highlight(steps[0].query.replace("id:", ""));
              } else {
                startGuide(steps);
              }
            }, 300);
          } else {
            // No guide steps — show a brief toast or just close
            setError("Non ho trovato una guida per questa azione. Prova a riformulare!");
          }
        },
        onError: (err) => { setError(err); setIsLoading(false); },
        signal: controller.signal,
      });
    } catch (e: any) {
      if (e.name !== "AbortError") setError(e.message || "Errore di connessione");
      setIsLoading(false);
    }
  }, [input, isLoading, session?.access_token, highlight, startGuide, context]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") { e.preventDefault(); send(); }
    if (e.key === "Escape") setOpen(false);
  };

  if (!user || onboardingLocked) return null;

  // Don't show the resting feather while a guide is running
  if (guideActive) return null;

  return (
    <>
      {/* ── Resting feather mascot ── */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-20 sm:bottom-6 right-4 z-50 cursor-pointer bg-transparent border-none p-0"
            aria-label={t("aiChat.title")}
          >
            <FeatherMascot size={56} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Minimal input bubble ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-20 sm:bottom-6 right-4 z-50 w-[calc(100vw-2rem)] sm:w-80"
          >
            <div className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 border-b border-border">
                <FeatherMascot size={28} blinking={false} />
                <p className="text-sm font-medium text-foreground flex-1">Cosa vuoi fare?</p>
                <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Quick suggestions */}
              <div className="px-3 py-2 flex flex-wrap gap-1.5">
                {[
                  "Come modifico un appuntamento?",
                  "Come aggiungo un cliente?",
                  "Dove trovo le impostazioni?",
                ].map((q) => (
                  <button
                    key={q}
                    onClick={() => { setInput(q); setTimeout(() => inputRef.current?.focus(), 50); }}
                    className="text-xs px-2.5 py-1 bg-muted rounded-full hover:bg-muted/80 text-foreground transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>

              {/* Input */}
              <div className="px-3 py-2 border-t border-border">
                {error && (
                  <p className="text-xs text-destructive mb-2 bg-destructive/10 px-2 py-1 rounded">{error}</p>
                )}
                <div className="flex items-center gap-2">
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Descrivi cosa vuoi fare..."
                    className="flex-1 bg-muted rounded-lg px-3 py-2 text-sm outline-none placeholder:text-muted-foreground"
                    disabled={isLoading}
                  />
                  {voiceSupported && (
                    <Button
                      size="icon"
                      variant={isRecording ? "destructive" : "outline"}
                      onClick={toggleVoice}
                      className="h-8 w-8 rounded-lg shrink-0"
                      disabled={isLoading}
                    >
                      {isRecording ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                    </Button>
                  )}
                  <Button
                    size="icon"
                    onClick={send}
                    disabled={!input.trim() || isLoading}
                    className="h-8 w-8 rounded-lg shrink-0"
                  >
                    {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
