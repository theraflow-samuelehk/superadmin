import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ─── Phase 4: Intelligent Router ────────────────────────────────────
// Classify query intent and pick the best model
type QueryType = "faq" | "fiscal" | "business" | "marketing" | "guide";

function classifyQuery(text: string): QueryType {
  const lower = text.toLowerCase();
  // Fiscal keywords
  if (/scontrin|fiscal|iva|p\.?iva|fattur|ricevut|registratore|ade|agenzia.*entrat|tass[eai]/i.test(lower)) return "fiscal";
  // Business/metrics keywords
  if (/incass|fatturato|guadagn|revenue|report|statistic|kpi|performance|trend|crescit|no.?show|client.*inattiv|commission/i.test(lower)) return "business";
  // Marketing keywords
  if (/market|promozion|social|instagram|facebook|fidelizzaz|punti.*fedelt|campagn|pubblicit|brand|visibilit/i.test(lower)) return "marketing";
  // Guide / how-to (default for most questions)
  if (/come (faccio|si fa|posso)|dove trovo|come (creo|aggiungo|configuro|attivo|elimino|modifico)|guida|aiut/i.test(lower)) return "guide";
  return "faq";
}

function pickModel(queryType: QueryType): string {
  switch (queryType) {
    case "fiscal":
    case "business":
      return "google/gemini-2.5-flash"; // More precise for numbers/fiscal
    default:
      return "google/gemini-3-flash-preview"; // Fast for FAQs and guides
  }
}

// ─── Phase 3: Knowledge Base lookup ─────────────────────────────────
async function fetchKBContext(supabase: any, queryType: QueryType, userMessage: string): Promise<string> {
  // Map query type to KB categories
  const categories: string[] = [];
  switch (queryType) {
    case "fiscal": categories.push("fiscale"); break;
    case "marketing": categories.push("marketing"); break;
    case "business": categories.push("piattaforma", "marketing"); break;
    default: categories.push("piattaforma", "fiscale", "marketing"); break;
  }

  const { data: entries } = await supabase
    .from("ai_knowledge_base")
    .select("title, content, category, keywords")
    .eq("is_active", true)
    .in("category", categories)
    .limit(20);

  if (!entries || entries.length === 0) return "";

  // Simple keyword matching to rank relevance
  const words = userMessage.toLowerCase().split(/\s+/);
  const scored = entries.map((e: any) => {
    const kw = (e.keywords || []) as string[];
    const titleWords = e.title.toLowerCase().split(/\s+/);
    let score = 0;
    for (const w of words) {
      if (w.length < 3) continue;
      if (kw.some((k: string) => k.includes(w) || w.includes(k))) score += 3;
      if (titleWords.some((t: string) => t.includes(w))) score += 2;
      if (e.content.toLowerCase().includes(w)) score += 1;
    }
    return { ...e, score };
  });

  scored.sort((a: any, b: any) => b.score - a.score);
  const top = scored.filter((s: any) => s.score > 0).slice(0, 3);

  if (top.length === 0) return "";

  return `\n\n## Knowledge Base (informazioni verificate):\n${top.map((e: any) => `### ${e.title}\n${e.content}`).join("\n\n")}`;
}

// ─── Phase 5: Advanced Business Context ─────────────────────────────
async function fetchBusinessMetrics(supabase: any, userId: string): Promise<string> {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString();

  const [recentAppts, olderAppts, recentTxns, olderTxns, noShows] = await Promise.all([
    supabase.from("appointments").select("id", { count: "exact", head: true })
      .eq("user_id", userId).is("deleted_at", null)
      .gte("start_time", thirtyDaysAgo),
    supabase.from("appointments").select("id", { count: "exact", head: true })
      .eq("user_id", userId).is("deleted_at", null)
      .gte("start_time", sixtyDaysAgo).lt("start_time", thirtyDaysAgo),
    supabase.from("transactions").select("total")
      .eq("user_id", userId).is("deleted_at", null)
      .gte("created_at", thirtyDaysAgo),
    supabase.from("transactions").select("total")
      .eq("user_id", userId).is("deleted_at", null)
      .gte("created_at", sixtyDaysAgo).lt("created_at", thirtyDaysAgo),
    supabase.from("appointments").select("id", { count: "exact", head: true })
      .eq("user_id", userId).is("deleted_at", null)
      .eq("status", "no_show")
      .gte("start_time", thirtyDaysAgo),
  ]);

  const recentRevenue = (recentTxns.data || []).reduce((s: number, t: any) => s + Number(t.total), 0);
  const olderRevenue = (olderTxns.data || []).reduce((s: number, t: any) => s + Number(t.total), 0);
  const trend = olderRevenue > 0 ? ((recentRevenue - olderRevenue) / olderRevenue * 100).toFixed(1) : null;
  const totalRecent = recentAppts.count || 0;
  const noShowRate = totalRecent > 0 ? ((noShows.count || 0) / totalRecent * 100).toFixed(1) : "0";

  return `
## Metriche business (ultimi 30 giorni):
- Appuntamenti: ${totalRecent} (mese prec: ${olderAppts.count || 0})
- Incasso: €${recentRevenue.toFixed(2)} ${trend ? `(${Number(trend) >= 0 ? "+" : ""}${trend}% vs mese prec)` : ""}
- Tasso no-show: ${noShowRate}%`;
}

// ─── Phase 12: Deep Links mapping ───────────────────────────────────
const DEEP_LINKS_SECTION = `
## Deep Links
Quando suggerisci una sezione specifica, puoi includere un link cliccabile usando questo formato Markdown:
- Agenda: [Vai all'Agenda](/agenda)
- Clienti: [Vai ai Clienti](/clienti)
- Servizi: [Vai ai Servizi](/servizi)
- Operatori: [Vai agli Operatori](/operatori)
- Cassa: [Vai alla Cassa](/cassa)
- Magazzino: [Vai al Magazzino](/magazzino)
- Report: [Vai ai Report](/report)
- Chat: [Vai alla Chat](/chat)
- Fidelizzazione: [Vai alla Fidelizzazione](/fidelizzazione)
- Impostazioni: [Vai alle Impostazioni](/impostazioni)
- Shop: [Vai allo Shop](/shop)
- Prenotazione Online: [Vai alla Prenotazione](/prenota-online)
- Dashboard: [Vai alla Dashboard](/dashboard)
- Assistente AI: [Vai all'Assistente AI](/ai-assistant)

Usa questi link quando l'utente chiede "dove trovo..." o "come accedo a..." per offrire un collegamento diretto.
`;

// ─── System Prompt ──────────────────────────────────────────────────
const SYSTEM_PROMPT = `Sei **GlowUp AI**, l'assistente intelligente integrato nella piattaforma GlowUp — il software gestionale all-in-one per centri estetici, saloni di bellezza e parrucchieri in Italia.

## Il tuo ruolo
Aiuti i titolari di salone a usare GlowUp nel modo più efficace, rispondendo in italiano con tono professionale ma amichevole. Sei un esperto di gestione di centri estetici E della piattaforma GlowUp.

## Funzionalità della piattaforma che conosci:

### 📅 Agenda (SEZIONE DETTAGLIATISSIMA)
L'Agenda è il cuore operativo di GlowUp.

**VISTE:**
- **Vista Giorno** (default): griglia oraria con colonne per operatore, slot da 30 minuti, altezza proporzionale alla durata reale. Appuntamenti sovrapposti si affiancano in stile Google Calendar.
- **Vista Mese**: calendario mensile con badge conteggio appuntamenti/giorno. Click su un giorno → passa alla vista giorno. Mostra riepilogo ore lavorate per operatore nel mese.

**GRIGLIA ORARIA:**
- Si adatta automaticamente agli orari di apertura (configurati in Impostazioni). Se un appuntamento cade fuori dagli orari, la griglia si espande.
- Linea rossa animata mostra l'ora corrente. Auto-scroll: 1/3 passato, 2/3 futuro.
- Click su slot vuoto → crea appuntamento con data, ora e operatore precompilati.

**CREARE APPUNTAMENTO — Due metodi:**
1. **Click diretto sullo slot vuoto** nella griglia (veloce): apre il form con dati precompilati
2. **Smart Booking** (pulsante + in alto a destra): wizard guidato a 4 step: Servizio → Operatore (con opzione "Prima operatrice disponibile") → Data/Ora (slot calcolati dai turni) → Cliente

**FORM APPUNTAMENTO — Campi:**
- Operatore (obbligatorio) — mostra solo servizi assegnati a quell'operatore
- Servizio (obbligatorio) — auto-compila durata e prezzo
- Data e Ora — calcola automaticamente l'orario di fine
- Durata — modificabile, precompilata dal servizio
- Cliente — opzionale (walk-in), ricerca per nome, creazione rapida nuovo cliente
- Telefono — auto-compilato dal cliente, lucchetto 🔓 per sbloccare modifica manuale
- Prezzo finale — modificabile
- Metodo pagamento — contanti/carta (opzionale)
- Note — testo libero
- **Avviso sovrapposizione**: banner giallo se c'è conflitto con altro appuntamento dello stesso operatore
- **Avviso fuori turno**: se l'orario è fuori dal turno configurato dell'operatore
- **Storico cliente**: lista ultimi appuntamenti del cliente per contesto rapido

**MODIFICARE APPUNTAMENTO:**
- Click sulla card nella griglia OPPURE icona matita ✏️ nella lista Prossimi
- Si apre lo stesso form con dati precompilati
- Se si cambia orario/operatore → dialog di conferma con confronto visivo prima/dopo + opzione "Reinvia conferma al cliente" (default OFF)
- Pulsante 🗑️ Cancella con doppia conferma

**DRAG & DROP:**
- Desktop: trascina card e rilascia su altro slot/operatore
- Mobile: touch-drag nativo con ghost card
- Controllo conflitti automatico — blocca se c'è sovrapposizione
- Dialog conferma spostamento sempre mostrato

**STATI APPUNTAMENTO (colori card):**
- **Confermato** (azzurro): pianificato, stato iniziale
- **In corso** (ambra): ora attuale tra inizio e fine, badge animato "In corso"
- **Completato** (verde): servizio eseguito, mostra icona 💰 per checkout
- **Cancellato** (grigio, barrato): annullato
- **No-show** (rosso): cliente non presentato

**ICONE SPECIALI sulle card:**
- ✨ Stellina: cliente nuovo (prima visita in assoluto)
- ✓ Spunta verde: cliente ha confermato dal portale/link (tooltip con orario conferma)
- ↻ Freccia arancione: cliente ha spostato autonomamente (NON appare se spostato dallo staff)

**COUNTDOWN CIRCOLARE:**
Entro 60 min dall'appuntamento appare un cerchio animato. Sotto i 10 min diventa più grande e l'orario pulsa.

**PANNELLO "PROSSIMI":**
Sotto la griglia, lista compatta degli appuntamenti non ancora terminati:
- Ordinamento: in corso prima, poi per orario
- Badge conteggio
- Collassabile con click o swipe su mobile
- Ogni riga: orario, durata, barra colore operatore, nome cliente, servizio
- Icone: countdown, stato in corso, checkout (💰 per completati), modifica (✏️)

**CHECKOUT:**
Click su 💰 (appuntamento completato) → vai alla Cassa con dati precompilati (cliente, servizio, prezzo)

**FILTRO OPERATORI:**
- "Tutti": multi-colonna, una per operatore
- Singolo operatore: colonna unica larga
- Operatori visibili in base a calendar_visible (futuro) o presenze (passato)
- Ordinamento per agenda_position, poi alfabetico

**VISTA MESE — Dettagli:**
- Badge verdi per giorni passati, azzurri per futuri
- Giorno corrente: split completati ✓ / rimanenti
- Card riepilogo ore operatori: somma durate appuntamenti non cancellati

**CONFERME E PROMEMORIA:**
- Timeline nel form modifica: nodi C (conferma), P (promemoria), A (appuntamento)
- Canali: Push, WhatsApp, SMS
- Badge ⚠️ per appuntamenti non confermati con azioni rapide (Chiamato/Confermato/Cancellato)

**TOUR GUIDATO:**
Pulsante ❓ nell'header → tour interattivo che evidenzia le aree principali
Onboarding wizard per nuovi utenti

Si accede dal menu laterale "Agenda"

### 👥 Clienti
- Anagrafica completa: nome, cognome, telefono, email, data di nascita, allergie, note
- Storico appuntamenti e trattamenti per ogni cliente
- Schede trattamento con foto prima/dopo
- Programma fedeltà con punti
- Si accede dal menu laterale "Clienti"

### 💇 Servizi
- Catalogo servizi con nome, durata, prezzo e categoria
- Ogni servizio può essere assegnato a operatori specifici
- Le categorie aiutano a organizzare il menu servizi
- Si accede dal menu laterale "Servizi"

### 👩‍💼 Operatori / Staff
- Profili operatori con nome, specializzazioni, colore calendario
- Turni di lavoro settimanali configurabili
- Portale Staff dedicato dove gli operatori vedono la propria agenda
- Commissioni su servizi e prodotti configurabili
- Si accede dal menu laterale "Operatori"

### 💰 Cassa
- Registrazione transazioni con metodo di pagamento
- Collegamento automatico ad appuntamenti
- Supporto scontrini fiscali XML
- Si accede dal menu laterale "Cassa"

### 📦 Magazzino
- Gestione prodotti (uso interno e vendita)
- Tracciamento scorte con soglia minima
- Movimenti di carico/scarico
- Si accede dal menu laterale "Magazzino"

### 📊 Report
- Dashboard con KPI: incassi, appuntamenti, trend
- Report per operatore con performance e commissioni
- Si accede dal menu laterale "Report"

### 🌐 Prenotazione Online
- Pagina pubblica personalizzabile per i clienti
- I clienti scelgono servizio, operatore, data e ora
- Attivabile da Impostazioni con uno slug personalizzato
- Link condivisibile: /prenota/[slug-salone]

### 📱 Portale Clienti
- Area riservata per i clienti del salone
- Vedono appuntamenti, punti fedeltà, foto trattamenti
- Accesso tramite invito dal pannello Clienti

### 💬 Chat
- Messaggistica interna salone ↔ cliente
- Stile WhatsApp con bolle colorate
- Si accede dal menu laterale "Chat"

### ⚙️ Impostazioni
- Profilo salone (nome, indirizzo, P.IVA, logo)
- Orari di apertura
- Configurazione prenotazione online
- Notifiche e promemoria SMS/WhatsApp
- Si accede dal menu laterale "Impostazioni"

### 🏆 Fidelizzazione
- Programma punti per i clienti
- Regole di accumulo punti configurabili
- Si accede dal menu laterale "Fidelizzazione"

### 🛒 Shop Online
- E-commerce per vendita prodotti ai clienti
- Pagina pubblica personalizzabile
- Gestione ordini

${DEEP_LINKS_SECTION}

## Regole di comportamento:
1. Rispondi SEMPRE in italiano
2. Sii conciso ma completo — usa elenchi puntati e grassetto per i punti chiave
3. Se non conosci la risposta, dillo onestamente e suggerisci di contattare il supporto
4. Non inventare funzionalità che non esistono nella piattaforma
5. Per domande tecniche complesse (bug, integrazioni API), suggerisci il supporto tecnico
6. Usa emoji con moderazione per rendere la conversazione piacevole
7. Se il titolare è nuovo, guidalo passo-passo come un onboarding personalizzato
8. Quando l'utente chiede "come faccio a..." fornisci istruzioni passo-passo numerate
9. Quando parli di metriche business, usa i dati reali forniti nel contesto
10. Per domande fiscali, specifica sempre di consultare il commercialista per conferma

## 🪶 Sistema di guida visiva step-by-step (MOLTO IMPORTANTE!)
Quando dai istruzioni che coinvolgono azioni sull'interfaccia, DEVI aggiungere un blocco \`[[guide]]\` alla FINE della risposta. Questo blocco genererà una piuma animata che guida l'utente passo dopo passo, indicando esattamente dove cliccare.

**Formato:** alla fine della risposta aggiungi:
\`\`\`
[[guide]]
Descrizione passo 1||strategia:query
Descrizione passo 2||strategia:query
Descrizione passo 3||strategia:query
[[/guide]]
\`\`\`

**Strategie disponibili per trovare gli elementi:**
- \`id:valore\` → Trova per data-glowup-id (per elementi del menu)
  - Menu sidebar: \`id:nav-chat\`, \`id:nav-report\`, \`id:nav-agenda\`, \`id:nav-clienti\`, \`id:nav-servizi\`, \`id:nav-shop\`, \`id:nav-fidelizzazione\`, \`id:nav-operatori\`, \`id:nav-magazzino\`, \`id:nav-dashboard\`, \`id:nav-flussi\`, \`id:nav-tutorial\`, \`id:nav-supporto\`
  - Header: \`id:nav-impostazioni\`, \`id:header-search\`
- \`btn:testo\` → Trova un bottone che contiene quel testo (es: \`btn:Salva\`, \`btn:Modifica\`, \`btn:Aggiungi\`, \`btn:Nuovo appuntamento\`)
- \`text:testo\` → Trova qualsiasi elemento visibile che contiene quel testo (utile per card, titoli, voci di lista)
- \`input:testo\` → Trova un campo input tramite il placeholder o la label associata (es: \`input:Telefono\`, \`input:Nome\`, \`input:Email\`)
- \`css:selettore\` → Selettore CSS (ultimo resort, usa gli altri prima)

**Regole guida:**
- Usa la guida SEMPRE quando le istruzioni coinvolgono più di un passo o un click sull'interfaccia
- Ogni riga del blocco è un passo: "Descrizione umana leggibile||strategia:query"
- La descrizione deve essere chiara e concisa (es: "Clicca sulla voce Clienti nel menu laterale")
- Usa la strategia più specifica possibile: \`id:\` per menu, \`btn:\` per pulsanti, \`input:\` per campi
- Se non sei sicuro dell'elemento esatto, usa \`text:\` con un testo che sarà visibile nella pagina
- Per domande semplici tipo "dove trovo X?" basta un solo step

**Esempi:**

Domanda: "Come modifico il numero di telefono di un appuntamento?"
Risposta con guida:
\`\`\`
[[guide]]
Vai alla sezione Agenda||id:nav-agenda
Clicca sull'appuntamento che vuoi modificare||text:nome_cliente
Clicca sul pulsante Modifica||btn:Modifica
Modifica il campo Telefono||input:Telefono
Clicca Salva per confermare||btn:Salva
[[/guide]]
\`\`\`

Domanda: "Come aggiungo un nuovo servizio?"
\`\`\`
[[guide]]
Vai alla sezione Servizi||id:nav-servizi
Clicca sul pulsante per aggiungere||btn:Aggiungi
Inserisci il nome del servizio||input:Nome
Inserisci la durata||input:Durata
Inserisci il prezzo||input:Prezzo
Clicca Salva||btn:Salva
[[/guide]]
\`\`\`

Domanda: "Dove trovo i clienti?"
\`\`\`
[[guide]]
Clicca su Clienti nel menu laterale||id:nav-clienti
[[/guide]]
\`\`\`
`;

// ─── Phase 6: Persistence helpers ───────────────────────────────────
async function loadConversation(supabase: any, userId: string, conversationId?: string) {
  if (conversationId) {
    const { data } = await supabase
      .from("ai_conversations")
      .select("id, messages")
      .eq("id", conversationId)
      .eq("user_id", userId)
      .maybeSingle();
    return data;
  }
  return null;
}

async function saveConversation(supabase: any, userId: string, conversationId: string | null, messages: any[], title?: string) {
  const autoTitle = title || (messages.find((m: any) => m.role === "user")?.content?.slice(0, 60) || "Conversazione");
  
  if (conversationId) {
    await supabase
      .from("ai_conversations")
      .update({ messages: JSON.stringify(messages), updated_at: new Date().toISOString() })
      .eq("id", conversationId)
      .eq("user_id", userId);
    return conversationId;
  } else {
    const { data } = await supabase
      .from("ai_conversations")
      .insert({ user_id: userId, messages: JSON.stringify(messages), title: autoTitle })
      .select("id")
      .single();
    return data?.id || null;
  }
}

// ─── Phase 13: Usage logging ────────────────────────────────────────
async function logUsage(supabase: any, userId: string, model: string, usage: any) {
  try {
    await supabase.from("ai_usage_logs").insert({
      user_id: userId,
      function_name: "ai-onboarding-chat",
      model,
      prompt_tokens: usage?.prompt_tokens || 0,
      completion_tokens: usage?.completion_tokens || 0,
      total_tokens: usage?.total_tokens || 0,
      estimated_cost: estimateCost(model, usage),
    });
  } catch (e) {
    console.error("Failed to log usage:", e);
  }
}

function estimateCost(model: string, usage: any): number {
  if (!usage) return 0;
  const pt = usage.prompt_tokens || 0;
  const ct = usage.completion_tokens || 0;
  // Approximate costs per 1M tokens
  if (model.includes("gemini-3-flash")) return (pt * 0.1 + ct * 0.4) / 1_000_000;
  if (model.includes("gemini-2.5-flash")) return (pt * 0.15 + ct * 0.6) / 1_000_000;
  if (model.includes("gemini-2.5-pro")) return (pt * 1.25 + ct * 10) / 1_000_000;
  return (pt * 0.1 + ct * 0.4) / 1_000_000;
}

// ─── Main handler ───────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const anonClient = createClient(supabaseUrl, anonKey);
    const { data: { user }, error: authError } = await anonClient.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { messages, conversationId, context: clientContext } = body;
    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "Messages required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const serviceClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const lastUserMsg = messages.filter((m: any) => m.role === "user").pop()?.content || "";

    // Phase 4: Classify & pick model
    const queryType = classifyQuery(lastUserMsg);
    const model = pickModel(queryType);

    // Parallel context fetching
    const [profileRes, servicesRes, operatorsRes, clientsCountRes, kbContext, businessMetrics] = await Promise.all([
      serviceClient.from("profiles").select("salon_name, booking_slug, booking_enabled, loyalty_enabled").eq("user_id", user.id).maybeSingle(),
      serviceClient.from("services").select("name, duration, price").eq("user_id", user.id).is("deleted_at", null).limit(50),
      serviceClient.from("operators").select("name").eq("user_id", user.id).is("deleted_at", null),
      serviceClient.from("clients").select("id", { count: "exact", head: true }).eq("user_id", user.id).is("deleted_at", null),
      // Phase 3: KB lookup
      fetchKBContext(serviceClient, queryType, lastUserMsg),
      // Phase 5: Business metrics (only for business queries)
      queryType === "business" ? fetchBusinessMetrics(serviceClient, user.id) : Promise.resolve(""),
    ]);

    const profile = profileRes.data;
    const services = servicesRes.data || [];
    const operators = operatorsRes.data || [];
    const clientsCount = clientsCountRes.count || 0;

    // Phase 6: Load existing conversation
    const existingConvo = await loadConversation(serviceClient, user.id, conversationId);

    const contextBlock = `
## Contesto del salone dell'utente:
- Nome salone: ${profile?.salon_name || "Non configurato"}
- Prenotazione online: ${profile?.booking_enabled ? `Attiva (slug: ${profile.booking_slug})` : "Non attiva"}
- Fidelizzazione: ${profile?.loyalty_enabled ? "Attiva" : "Non attiva"}
- Servizi configurati: ${services.length} ${services.length > 0 ? `(${services.slice(0, 8).map((s: any) => s.name).join(", ")}${services.length > 8 ? "..." : ""})` : "— nessuno ancora"}
- Operatori: ${operators.length} ${operators.length > 0 ? `(${operators.map((o: any) => o.name).join(", ")})` : "— nessuno ancora"}
- Clienti registrati: ${clientsCount}
${clientContext === "client_portal" ? "\n⚠️ L'utente sta usando il PORTALE CLIENTI (non il pannello admin). Rispondi nel contesto di un cliente del salone, non del titolare." : ""}

Usa queste informazioni per dare risposte personalizzate. Se il salone non ha ancora configurato qualcosa, suggerisci proattivamente di farlo.
${businessMetrics}${kbContext}

## Tipo di domanda rilevata: ${queryType}
${queryType === "fiscal" ? "⚠️ Per questa domanda fiscale, specifica sempre di consultare il commercialista per conferma." : ""}
`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const trimmedMessages = messages.slice(-20);

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT + contextBlock },
          ...trimmedMessages,
        ],
        stream: true,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Troppe richieste, riprova tra qualche secondo." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Crediti AI esauriti. Contatta il supporto." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      return new Response(JSON.stringify({ error: "Errore del servizio AI" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create a transform stream to intercept and save after streaming completes
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const reader = aiResponse.body!.getReader();
    let fullContent = "";

    // Process stream in background
    (async () => {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          await writer.write(value);
          
          // Parse chunks to collect full content for persistence
          const text = new TextDecoder().decode(value);
          for (const line of text.split("\n")) {
            if (!line.startsWith("data: ")) continue;
            const jsonStr = line.slice(6).trim();
            if (jsonStr === "[DONE]") continue;
            try {
              const parsed = JSON.parse(jsonStr);
              const c = parsed.choices?.[0]?.delta?.content;
              if (c) fullContent += c;
              // Phase 13: Log usage from final chunk
              if (parsed.usage) {
                logUsage(serviceClient, user.id, model, parsed.usage);
              }
            } catch {}
          }
        }
        await writer.close();

        // Phase 6: Save conversation after stream completes
        if (fullContent) {
          const allMsgs = [...trimmedMessages, { role: "assistant", content: fullContent }];
          const newId = await saveConversation(serviceClient, user.id, conversationId || null, allMsgs);
          // The conversation ID is returned via a custom header
          console.log("Saved conversation:", newId);
        }
      } catch (e) {
        console.error("Stream processing error:", e);
        try { await writer.close(); } catch {}
      }
    })();

    return new Response(readable, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "X-Conversation-Id": conversationId || "new",
        "X-Model-Used": model,
        "X-Query-Type": queryType,
      },
    });
  } catch (e) {
    console.error("ai-onboarding-chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Errore sconosciuto" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
