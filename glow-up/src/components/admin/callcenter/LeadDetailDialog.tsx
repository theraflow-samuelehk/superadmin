import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Phone, Mail, Calendar, User, Clock, AlertTriangle, FileText, UserCheck, Trash2, Loader2, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLocalization } from "@/hooks/useLocalization";
import { toast } from "sonner";
import { Lead, Agent, AgentAvailability, STATUS_OPTIONS, PRIORITY_OPTIONS } from "./types";
import AppointmentCard, { ExistingBooking } from "./AppointmentCard";
import { Textarea as TextareaUI } from "@/components/ui/textarea";

const PROBLEM_SOLUTIONS: Record<string, string> = {
  "gestione appuntamenti": "GlowUp è il gestionale all-in-one che elimina il caos degli appuntamenti: agenda digitale con prenotazioni online 24/7, promemoria automatici via WhatsApp che azzerano i no-show e una visione chiara di ogni giornata lavorativa.",
  "fidelizzazione clienti": "GlowUp ti aiuta a fidelizzare i clienti con un programma punti automatico, storico trattamenti, schede cliente dettagliate e comunicazioni personalizzate — così ogni cliente si sente unico e torna più spesso.",
  "gestione magazzino": "GlowUp tiene sotto controllo il tuo magazzino: scorte aggiornate in tempo reale, alert automatici quando un prodotto sta per finire, e movimenti tracciati per ridurre gli sprechi e non restare mai senza.",
  "marketing": "GlowUp automatizza il tuo marketing: promemoria WhatsApp, campagne mirate ai clienti giusti, e un portale prenotazioni brandizzato che trasforma i visitatori in clienti fissi — il tutto senza dover imparare strumenti complicati.",
  "contabilità": "GlowUp semplifica la tua contabilità: cassa giornaliera, report incassi per operatore, gestione entrate e uscite e scontrini fiscali — tutto in un unico posto, senza fogli Excel.",
  "gestione dipendenti": "GlowUp ti dà il controllo completo del tuo team: turni, presenze, obiettivi mensili, report performance per operatore e un portale dedicato dove ogni collaboratore vede la sua agenda.",
};

function generateSmartWaMessage(firstName: string, rawProblem: string): string {
  const greeting = `Buongiorno${firstName ? ` ${firstName}` : ""}`;
  const problemLower = rawProblem.toLowerCase();
  
  const matchedSolution = Object.entries(PROBLEM_SOLUTIONS).find(([key]) => 
    problemLower.includes(key)
  );

  if (matchedSolution) {
    return `${greeting},\n\nla contattiamo dal team GlowUp.\n\nDal questionario che ha compilato, ci ha indicato che sta affrontando difficoltà nella *${matchedSolution[0]}*.\n\n${matchedSolution[1]}\n\nCi piacerebbe mostrarle come funziona con una breve demo gratuita e senza impegno. Potrebbe indicarci un giorno e un orario comodo per essere ricontattata?\n\nRestiamo a disposizione.\n*GlowUp Team* 🚀`;
  }

  if (rawProblem) {
    return `${greeting},\n\nla contattiamo dal team GlowUp.\n\nDal questionario che ha compilato, ci ha indicato che sta affrontando difficoltà legate a: *${rawProblem}*.\n\nGlowUp è il gestionale all-in-one pensato per centri estetici e attività di benessere: agenda smart con prenotazioni online, promemoria automatici WhatsApp, gestione clienti, magazzino, cassa, fidelizzazione e marketing — tutto in un'unica piattaforma semplice da usare.\n\nCi piacerebbe mostrarle come funziona con una breve demo gratuita. Potrebbe indicarci un giorno e un orario comodo?\n\nRestiamo a disposizione.\n*GlowUp Team* 🚀`;
  }

  return `${greeting},\n\nla contattiamo dal team GlowUp.\n\nAbbiamo provato a raggiungerla telefonicamente in quanto ha lasciato il suo recapito manifestando interesse.\n\nGlowUp è il gestionale all-in-one per centri estetici: agenda smart, prenotazioni online, promemoria automatici WhatsApp, gestione clienti e magazzino, cassa, fidelizzazione e marketing — tutto in un'unica piattaforma.\n\nCi piacerebbe mostrarle come può semplificare la gestione della sua attività con una breve demo gratuita. Potrebbe indicarci un giorno e un orario comodo?\n\nRestiamo a disposizione.\n*GlowUp Team* 🚀`;
}

interface LeadDetailDialogProps {
  lead: Lead | null;
  agents: Agent[];
  onClose: () => void;
  onUpdated: (lead: Lead) => void;
  onDeleted?: (leadId: string) => void;
}

export default function LeadDetailDialog({ lead, agents, onClose, onUpdated, onDeleted }: LeadDetailDialogProps) {
  const { formatDate, formatTime } = useLocalization();
  const fmt = (d: string) => `${formatDate(new Date(d))} ${formatTime(new Date(d))}`;

  const [editNotes, setEditNotes] = useState("");
  const [callbackDate, setCallbackDate] = useState("");
  const [callbackTime, setCallbackTime] = useState("");
  const [onboardingDate, setOnboardingDate] = useState("");
  const [onboardingTime, setOnboardingTime] = useState("");
  const [availabilities, setAvailabilities] = useState<AgentAvailability[]>([]);
  const [callbackBookings, setCallbackBookings] = useState<ExistingBooking[]>([]);
  const [onboardingBookings, setOnboardingBookings] = useState<ExistingBooking[]>([]);
  const [deleting, setDeleting] = useState(false);
  const [waMessage, setWaMessage] = useState("");
  const [sendingWa, setSendingWa] = useState(false);
  const [waTemplates, setWaTemplates] = useState<any[]>([]);

  useEffect(() => {
    if (lead) {
      setEditNotes(lead.notes || "");
      if (lead.callback_date) {
        const d = new Date(lead.callback_date);
        setCallbackDate(d.toISOString().slice(0, 10));
        setCallbackTime(d.toTimeString().slice(0, 5));
      } else {
        setCallbackDate("");
        setCallbackTime("");
      }
      if (lead.appointment_date) {
        const d = new Date(lead.appointment_date);
        setOnboardingDate(d.toISOString().slice(0, 10));
        setOnboardingTime(d.toTimeString().slice(0, 5));
      } else {
        setOnboardingDate("");
        setOnboardingTime("");
      }
    }
  }, [lead?.id]);

  // Load WA templates
  useEffect(() => {
    supabase
      .from("lead_wa_templates" as any)
      .select("id, name, body")
      .eq("is_active", true)
      .then(({ data }) => setWaTemplates(data || []));
  }, []);

  // Load availabilities and existing bookings
  useEffect(() => {
    const loadData = async () => {
      const [availRes, leadsRes] = await Promise.all([
        supabase.from("call_center_agent_availability").select("*"),
        supabase
          .from("facebook_leads")
          .select("id, callback_date, callback_agent_id, appointment_date, assigned_agent_id, status")
          .not("status", "in", '("annullato","non_interessato")'),
      ]);

      setAvailabilities((availRes.data || []) as AgentAvailability[]);

      const leads = leadsRes.data || [];
      const cbBookings: ExistingBooking[] = [];
      const obBookings: ExistingBooking[] = [];

      for (const l of leads) {
        // Skip current lead's own bookings so they don't block themselves
        if (lead && l.id === lead.id) continue;

        if (l.callback_date && l.callback_agent_id) {
          cbBookings.push({
            agent_id: l.callback_agent_id,
            date_time: l.callback_date,
          });
        }
        if (l.appointment_date && l.assigned_agent_id) {
          obBookings.push({
            agent_id: l.assigned_agent_id,
            date_time: l.appointment_date,
          });
        }
      }

      setCallbackBookings(cbBookings);
      setOnboardingBookings(obBookings);
    };

    if (lead) loadData();
  }, [lead?.id]);

  if (!lead) return null;

  const handleFieldUpdate = async (updates: Record<string, any>) => {
    await supabase.from("facebook_leads").update(updates as any).eq("id", lead.id);
    onUpdated({ ...lead, ...updates });
  };

  const handleSaveNotes = async () => {
    await handleFieldUpdate({ notes: editNotes });
    toast.success("Note salvate");
  };

  const handleDeleteLead = async () => {
    if (!confirm("Sei sicuro di voler eliminare questo lead? L'azione è irreversibile.")) return;
    setDeleting(true);
    const { error } = await supabase.from("facebook_leads").delete().eq("id", lead.id);
    setDeleting(false);
    if (error) {
      toast.error("Errore: " + error.message);
    } else {
      toast.success("Lead eliminato");
      onDeleted?.(lead.id);
      onClose();
    }
  };

  const handleBookCallback = async (agentId: string) => {
    if (!callbackDate || !callbackTime) return;
    const dateTime = new Date(`${callbackDate}T${callbackTime}`).toISOString();
    await handleFieldUpdate({
      callback_date: dateTime,
      callback_agent_id: agentId,
      status: "richiamato",
    });
    toast.success("Richiamata programmata!");
  };

  const handleClearCallback = async () => {
    await handleFieldUpdate({
      callback_date: null,
      callback_agent_id: null,
    });
    setCallbackDate("");
    setCallbackTime("");
    toast.success("Richiamata cancellata");
  };

  const handleBookOnboarding = async (agentId: string) => {
    if (!onboardingDate || !onboardingTime) return;
    const dateTime = new Date(`${onboardingDate}T${onboardingTime}`).toISOString();
    await handleFieldUpdate({
      appointment_date: dateTime,
      assigned_agent_id: agentId,
      status: "appuntamento_fissato",
    });
    toast.success("Appuntamento onboarding fissato!");
  };

  const handleClearOnboarding = async () => {
    await handleFieldUpdate({
      appointment_date: null,
      assigned_agent_id: null,
      status: "nuovo",
    });
    setOnboardingDate("");
    setOnboardingTime("");
    toast.success("Appuntamento onboarding cancellato");
  };

  const handleSendWa = async () => {
    if (!lead || !waMessage.trim()) return;
    setSendingWa(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-lead-whatsapp", {
        body: { lead_id: lead.id, custom_body: waMessage },
      });
      if (error) throw error;
      if (data?.sent) {
        toast.success("Messaggio WhatsApp inviato!");
        setWaMessage("");
      } else {
        toast.error(data?.error || "Invio fallito");
      }
    } catch (e: any) {
      toast.error(e.message || "Errore invio WhatsApp");
    } finally {
      setSendingWa(false);
    }
  };

  const applyWaTemplate = (templateId: string) => {
    const tpl = waTemplates.find((t) => t.id === templateId);
    if (!tpl || !lead) return;
    const nameParts = (lead.full_name || "").trim().split(/\s+/);
    const nome = nameParts[0] || "";
    const cognome = nameParts.slice(1).join(" ") || "";
    setWaMessage(
      tpl.body
        .replace(/\{\{nome\}\}/gi, nome)
        .replace(/\{\{cognome\}\}/gi, cognome)
        .replace(/\{\{telefono\}\}/gi, lead.phone || "")
        .replace(/\{\{email\}\}/gi, lead.email || "")
        .replace(/\{\{fonte\}\}/gi, lead.source || "")
    );
  };

  return (
    <Dialog open={!!lead} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-lg max-h-[90vh] overflow-y-auto overflow-x-hidden p-3 sm:p-6 [&>*]:min-w-0">
        <DialogHeader className="pr-6">
          <DialogTitle className="flex items-center gap-2 text-base truncate">
            <User className="h-4 w-4 shrink-0" />
            <span className="truncate">{lead.full_name || "Dettaglio Lead"}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 sm:space-y-4 min-w-0 w-full">
          {/* Contact info */}
          <div className="flex flex-wrap gap-2">
            {lead.phone && (
              <>
                <a href={`tel:${lead.phone.replace(/^p:/, "")}`} className="inline-flex items-center gap-1.5 text-xs sm:text-sm bg-primary/10 text-primary px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full hover:bg-primary/20 transition-colors truncate max-w-[160px] sm:max-w-none">
                  <Phone className="h-3 w-3 shrink-0" /> <span className="truncate">{lead.phone.replace(/^p:/, "")}</span>
                </a>
                <a
                  href={(() => {
                    const digits = lead.phone.replace(/^p:/, "").replace(/[^0-9]/g, "");
                    const firstName = lead.full_name?.split(" ")[0] || "";
                    const problemKey = Object.keys(lead.lead_data || {}).find(k => k.toLowerCase().includes("problemi") || k.toLowerCase().includes("problem"));
                    const rawProblem = problemKey ? String((lead.lead_data as any)[problemKey]).replace(/_/g, " ") : "";
                    const msg = encodeURIComponent(generateSmartWaMessage(firstName, rawProblem));
                    return `https://wa.me/${digits}?text=${msg}`;
                  })()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm bg-[#25D366]/10 text-[#25D366] px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full hover:bg-[#25D366]/20 transition-colors"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-3 w-3 shrink-0"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  <span>WhatsApp</span>
                </a>
              </>
            )}
            {lead.email && (
              <a href={`mailto:${lead.email}`} className="inline-flex items-center gap-1.5 text-xs sm:text-sm bg-secondary text-secondary-foreground px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full hover:bg-secondary/80 transition-colors truncate max-w-[160px] sm:max-w-none">
                <Mail className="h-3 w-3 shrink-0" /> <span className="truncate">{lead.email}</span>
              </a>
            )}
          </div>

          {/* ── INVIO WA VIA BAILEYS ── */}
          {lead.phone && (
            <div className="border rounded-lg p-3 space-y-2">
              <label className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <Send className="h-3 w-3" /> Invia WA via Baileys
              </label>
              {waTemplates.length > 0 && (
                <Select onValueChange={applyWaTemplate}>
                  <SelectTrigger className="text-xs h-8">
                    <SelectValue placeholder="Usa template..." />
                  </SelectTrigger>
                  <SelectContent>
                    {waTemplates.map((t: any) => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <TextareaUI
                value={waMessage}
                onChange={(e) => setWaMessage(e.target.value)}
                placeholder="Scrivi messaggio o seleziona un template..."
                rows={3}
                className="text-xs"
              />
              <Button
                size="sm"
                onClick={handleSendWa}
                disabled={!waMessage.trim() || sendingWa}
                className="w-full"
              >
                {sendingWa ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Send className="w-4 h-4 mr-1" />}
                Invia via Baileys
              </Button>
            </div>
          )}
          <div className="grid grid-cols-[1fr_auto] gap-2 min-w-0">
            <div className="space-y-1 min-w-0">
              <label className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">Stato</label>
              <Select value={lead.status} onValueChange={(val) => handleFieldUpdate({ status: val })}>
                <SelectTrigger className="text-xs sm:text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <span className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full shrink-0 ${opt.color}`} />
                        {opt.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 w-[100px] sm:w-[120px]">
              <label className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">Priorità</label>
              <Select value={lead.priority} onValueChange={(val) => handleFieldUpdate({ priority: val })}>
                <SelectTrigger className="text-xs sm:text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* ── ASSEGNATO A ── */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              <UserCheck className="h-3 w-3" /> Assegnato a
            </label>
            <Select
              value={lead.assigned_agent_id || "none"}
              onValueChange={(val) => handleFieldUpdate({ assigned_agent_id: val === "none" ? null : val })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— Nessuno —</SelectItem>
                {agents.filter(a => a.is_active).map(a => (
                  <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* ── RICHIAMATA ── */}
          <AppointmentCard
            type="callback"
            date={callbackDate}
            time={callbackTime}
            onDateChange={setCallbackDate}
            onTimeChange={setCallbackTime}
            agents={agents}
            availabilities={availabilities}
            assignedAgentId={lead.callback_agent_id}
            currentStatus={lead.status}
            onBook={handleBookCallback}
            onClear={handleClearCallback}
            existingBookings={callbackBookings}
            currentLeadId={lead.id}
          />

          {/* ── ONBOARDING ── */}
          <AppointmentCard
            type="onboarding"
            date={onboardingDate}
            time={onboardingTime}
            onDateChange={setOnboardingDate}
            onTimeChange={setOnboardingTime}
            agents={agents}
            availabilities={availabilities}
            assignedAgentId={lead.assigned_agent_id}
            currentStatus={lead.status}
            onBook={handleBookOnboarding}
            onClear={handleClearOnboarding}
            existingBookings={onboardingBookings}
            currentLeadId={lead.id}
          />

          {/* Call attempts */}
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <div className="flex items-center border rounded-md shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-r-none"
                disabled={lead.call_attempts <= 0}
                onClick={async () => {
                  const newAttempts = Math.max(0, lead.call_attempts - 1);
                  await handleFieldUpdate({ call_attempts: newAttempts });
                  toast.success("Tentativo rimosso");
                }}
              >
                −
              </Button>
              <span className="px-2 text-sm font-semibold min-w-[1.5rem] text-center">{lead.call_attempts}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-l-none"
                onClick={async () => {
                  const newAttempts = lead.call_attempts + 1;
                  const now = new Date().toISOString();
                  await handleFieldUpdate({ call_attempts: newAttempts, last_called_at: now });
                  toast.success(`Tentativo #${newAttempts} registrato`);
                }}
              >
                +
              </Button>
            </div>
            <span className="text-sm text-muted-foreground">Tentativi</span>
            {lead.last_called_at && <span className="text-[11px] text-muted-foreground flex items-center gap-1 truncate"><Clock className="h-3 w-3 shrink-0" /> {fmt(lead.last_called_at)}</span>}
          </div>

          {/* Meta info */}
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Creato: {fmt(lead.created_at)}</span>
            {lead.next_reminder_at && (
              <span className="flex items-center gap-1 text-orange-500">
                <AlertTriangle className="h-3 w-3" /> Reminder: {fmt(lead.next_reminder_at)}
              </span>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Note</label>
            <Textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} placeholder="Aggiungi note..." rows={2} />
            <Button variant="outline" size="sm" onClick={handleSaveNotes} className="mt-1">Salva note</Button>
          </div>

          {/* Quiz / Form responses */}
          {lead.lead_data && typeof lead.lead_data === "object" && Object.keys(lead.lead_data).length > 0 && (() => {
            const QUIZ_LABEL_MAP: Record<string, string> = {
              // Facebook format (snake_case)
              "sei_proprietario_di_un_centro_estetico?": "Proprietario",
              "quali_di_questi_problemi_stai_affrontando?": "Problemi",
              "quanti_dipendenti_lavorano_nel_tuo_centro?": "Dipendenti",
              "a_che_ora_preferisci_essere_contattato_da_un_consulente_per_informazioni,_costi_e_attivare_la_prova_gratuita_di_14_giorni?": "Orario contatto",
              // TikTok format (original text with spaces)
              "sei proprietario di un centro estetico?": "Proprietario",
              "quali di questi problemi stai affrontando?": "Problemi",
              "quanti dipendenti lavorano nel tuo centro?": "Dipendenti",
              "a che ora preferisci essere contattato da un consulente per informazioni, costi e attivare la prova gratuita di 14 giorni?": "Orario contatto",
            };
            const formatVal = (v: string) => v.replace(/_/g, " ").replace(/,\s*/g, ", ");
            const knownEntries = Object.entries(lead.lead_data).filter(([k, v]) => v && QUIZ_LABEL_MAP[k]);
            const otherEntries = Object.entries(lead.lead_data).filter(([k, v]) => v && !QUIZ_LABEL_MAP[k]);

            return (
              <div className="space-y-2">
                {knownEntries.length > 0 && (
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                      <FileText className="h-3 w-3" /> Risposte Quiz
                    </label>
                    <div className="bg-secondary/50 rounded-lg p-3 space-y-2">
                      {knownEntries.map(([k, v]) => (
                        <div key={k} className="flex flex-col gap-0.5">
                          <span className="text-[11px] font-semibold text-foreground">{QUIZ_LABEL_MAP[k]}</span>
                          <span className="text-xs text-muted-foreground">{formatVal(String(v))}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {otherEntries.length > 0 && (
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                      <FileText className="h-3 w-3" /> Altri dati
                    </label>
                    <div className="bg-secondary/50 rounded-lg p-3 space-y-2">
                      {otherEntries.map(([k, v]) => (
                        <div key={k} className="flex flex-col gap-0.5">
                          <span className="text-[11px] font-semibold text-foreground capitalize">{k.replace(/_/g, " ")}</span>
                          <span className="text-xs text-muted-foreground">{formatVal(String(v))}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
        <DialogFooter className="border-t pt-3">
          <Button
            variant="destructive"
            size="sm"
            className="gap-1"
            disabled={deleting}
            onClick={handleDeleteLead}
          >
            {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Elimina Lead
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
