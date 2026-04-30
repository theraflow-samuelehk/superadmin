import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Loader2, Phone, Filter, RefreshCw, Upload, Headphones, BarChart3, Users, PhoneCall, Calendar, ClipboardList, ChevronDown, Archive, Settings, Trash2, FileText, PlayCircle } from "lucide-react";
import fbLogo from "@/assets/facebook-logo.png";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { useLocalization } from "@/hooks/useLocalization";
import { toast } from "sonner";
import LeadsCsvImportDialog from "./LeadsCsvImportDialog";
import LeadDetailDialog from "./callcenter/LeadDetailDialog";
import CallCenterAgentsTab from "./callcenter/CallCenterAgentsTab";
import CallCenterDashboard from "./callcenter/CallCenterDashboard";
import AdminLeadsConfigTab from "./AdminLeadsConfigTab";
import { Lead, Agent, STATUS_OPTIONS, PRIORITY_OPTIONS } from "./callcenter/types";

export default function AdminLeadsTab() {
  const { formatDate, formatTime } = useLocalization();
  const fmt = (d: Date) => `${formatDate(d)} ${formatTime(d)}`;

  const [leads, setLeads] = useState<Lead[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [agentFilter, setAgentFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("leads");

  const loadAgents = useCallback(async () => {
    const { data } = await supabase.from("call_center_agents").select("*").order("name");
    setAgents((data || []) as Agent[]);
  }, []);

  const loadLeads = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("facebook_leads")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);

    setLeads((data || []).map((l: any) => ({
      ...l,
      assigned_agent_id: l.assigned_agent_id || null,
      appointment_date: l.appointment_date || null,
      callback_date: l.callback_date || null,
      callback_agent_id: l.callback_agent_id || null,
      call_attempts: l.call_attempts || 0,
      last_called_at: l.last_called_at || null,
      next_reminder_at: l.next_reminder_at || null,
      priority: l.priority || "normal",
    })));
    setLoading(false);
  }, []);

  useEffect(() => { loadAgents(); loadLeads(); }, [loadAgents, loadLeads]);

  const cleanPhone = (phone: string | null) => phone?.replace(/^p:/, "") || null;

  const getWhatsAppUrl = (phone: string | null, name?: string | null, leadData?: any) => {
    const digits = cleanPhone(phone)?.replace(/[^0-9]/g, "") || "";
    const firstName = name?.split(" ")[0] || "";
    const problemKey = leadData ? Object.keys(leadData).find(k => k.toLowerCase().includes("problemi") || k.toLowerCase().includes("problem")) : undefined;
    const rawProblem = problemKey ? String(leadData[problemKey]).replace(/_/g, " ") : "";

    const PROBLEM_SOLUTIONS: Record<string, string> = {
      "gestione appuntamenti": "GlowUp è il gestionale all-in-one che elimina il caos degli appuntamenti: agenda digitale con prenotazioni online 24/7, promemoria automatici via WhatsApp che azzerano i no-show e una visione chiara di ogni giornata lavorativa.",
      "fidelizzazione clienti": "GlowUp ti aiuta a fidelizzare i clienti con un programma punti automatico, storico trattamenti, schede cliente dettagliate e comunicazioni personalizzate — così ogni cliente si sente unico e torna più spesso.",
      "gestione magazzino": "GlowUp tiene sotto controllo il tuo magazzino: scorte aggiornate in tempo reale, alert automatici quando un prodotto sta per finire, e movimenti tracciati per ridurre gli sprechi e non restare mai senza.",
      "marketing": "GlowUp automatizza il tuo marketing: promemoria WhatsApp, campagne mirate ai clienti giusti, e un portale prenotazioni brandizzato che trasforma i visitatori in clienti fissi.",
      "contabilità": "GlowUp semplifica la tua contabilità: cassa giornaliera, report incassi per operatore, gestione entrate e uscite e scontrini fiscali — tutto in un unico posto.",
      "gestione dipendenti": "GlowUp ti dà il controllo completo del tuo team: turni, presenze, obiettivi mensili, report performance per operatore e un portale dedicato dove ogni collaboratore vede la sua agenda.",
    };

    const greeting = `Buongiorno${firstName ? ` ${firstName}` : ""}`;
    const problemLower = rawProblem.toLowerCase();
    const matched = Object.entries(PROBLEM_SOLUTIONS).find(([key]) => problemLower.includes(key));

    let text: string;
    if (matched) {
      text = `${greeting},\n\nla contattiamo dal team GlowUp.\n\nDal questionario che ha compilato, ci ha indicato che sta affrontando difficoltà nella *${matched[0]}*.\n\n${matched[1]}\n\nCi piacerebbe mostrarle come funziona con una breve demo gratuita e senza impegno. Potrebbe indicarci un giorno e un orario comodo per essere ricontattata?\n\nRestiamo a disposizione.\n*GlowUp Team* 🚀`;
    } else if (rawProblem) {
      text = `${greeting},\n\nla contattiamo dal team GlowUp.\n\nDal questionario che ha compilato, ci ha indicato che sta affrontando difficoltà legate a: *${rawProblem}*.\n\nGlowUp è il gestionale all-in-one pensato per centri estetici e attività di benessere: agenda smart con prenotazioni online, promemoria automatici WhatsApp, gestione clienti, magazzino, cassa, fidelizzazione e marketing — tutto in un'unica piattaforma semplice da usare.\n\nCi piacerebbe mostrarle come funziona con una breve demo gratuita. Potrebbe indicarci un giorno e un orario comodo?\n\nRestiamo a disposizione.\n*GlowUp Team* 🚀`;
    } else {
      text = `${greeting},\n\nla contattiamo dal team GlowUp.\n\nGlowUp è il gestionale all-in-one per centri estetici: agenda smart, prenotazioni online, promemoria automatici WhatsApp, gestione clienti e magazzino, cassa, fidelizzazione e marketing — tutto in un'unica piattaforma.\n\nCi piacerebbe mostrarle come può semplificare la gestione della sua attività con una breve demo gratuita. Potrebbe indicarci un giorno e un orario comodo?\n\nRestiamo a disposizione.\n*GlowUp Team* 🚀`;
    }

    return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
  };

  const getAgentName = (agentId: string | null) => {
    if (!agentId) return null;
    return agents.find(a => a.id === agentId)?.name || null;
  };

  const appointmentLeads = leads.filter(l => l.appointment_date || l.callback_date);
  const trialLeads = leads.filter(l => l.status === "inizio_prova");
  const archivedLeads = leads.filter(l => l.status === "annullato");
  const activeLeads = leads.filter(l => {
    if (l.status === "annullato" || l.status === "inizio_prova") return false;
    if (l.appointment_date || l.callback_date) return false;
    return true;
  });

  const applyFilters = (list: Lead[]) => list.filter((lead) => {
    if (statusFilter !== "all" && lead.status !== statusFilter) return false;
    if (agentFilter !== "all" && lead.assigned_agent_id !== agentFilter) return false;
    if (priorityFilter !== "all" && lead.priority !== priorityFilter) return false;
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      (lead.full_name || "").toLowerCase().includes(s) ||
      (lead.email || "").toLowerCase().includes(s) ||
      (lead.phone || "").toLowerCase().includes(s)
    );
  });

  const filteredLeads = applyFilters(activeLeads);
  const filteredArchived = archivedLeads.filter((lead) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      (lead.full_name || "").toLowerCase().includes(s) ||
      (lead.email || "").toLowerCase().includes(s) ||
      (lead.phone || "").toLowerCase().includes(s)
    );
  });

  const handleLeadUpdated = (updated: Lead) => {
    setLeads(prev => prev.map(l => l.id === updated.id ? updated : l));
    setSelectedLead(updated);
  };

  const handleDeleteLead = async (e: React.MouseEvent, leadId: string) => {
    e.stopPropagation();
    if (!confirm("Eliminare questo lead? L'azione è irreversibile.")) return;
    const { error } = await supabase.from("facebook_leads").delete().eq("id", leadId);
    if (error) {
      toast.error("Errore: " + error.message);
    } else {
      toast.success("Lead eliminato");
      setLeads(prev => prev.filter(l => l.id !== leadId));
    }
  };

  const statusBadge = (status: string) => {
    const opt = STATUS_OPTIONS.find(o => o.value === status);
    return (
      <Badge variant="secondary" className="text-xs gap-1">
        <span className={`h-2 w-2 rounded-full ${opt?.color || "bg-muted"}`} />
        {opt?.label || status}
      </Badge>
    );
  };

  const priorityIndicator = (priority: string) => {
    const opt = PRIORITY_OPTIONS.find(o => o.value === priority);
    if (!opt || priority === "normal") return null;
    return <span className={`text-xs font-medium ${opt.color}`}>{opt.label}</span>;
  };

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

  const formatQuizValue = (val: string) => val.replace(/_/g, " ").replace(/,\s*/g, ", ");

  const quizBadges = (leadData: any) => {
    if (!leadData || typeof leadData !== "object") return null;
    const entries = Object.entries(leadData).filter(([k, v]) => v && QUIZ_LABEL_MAP[k]);
    if (entries.length === 0) return null;

    return (
      <div onClick={(e) => e.stopPropagation()}>
        <Collapsible>
          <CollapsibleTrigger className="flex items-center gap-1 text-[11px] text-primary/80 font-medium hover:text-primary transition-colors">
            <ClipboardList className="h-3 w-3" />
            Quiz ({entries.length})
            <ChevronDown className="h-3 w-3 transition-transform [[data-state=open]>&]:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-1 space-y-0.5 pl-4 border-l-2 border-primary/10">
            {entries.map(([k, v]) => (
              <p key={k} className="text-[11px] text-muted-foreground">
                <span className="font-medium text-foreground">{QUIZ_LABEL_MAP[k]}:</span>{" "}{formatQuizValue(String(v))}
              </p>
            ))}
          </CollapsibleContent>
        </Collapsible>
      </div>
    );

  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-lg sm:text-2xl font-serif font-bold text-foreground flex items-center gap-2">
            <Headphones className="h-5 w-5 sm:h-6 sm:w-6 text-primary shrink-0" />
            Call Center CRM
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Gestione lead e operatrici call center</p>
        </div>
        <div className="flex gap-1.5 sm:gap-2 shrink-0">
          <Button variant="outline" size="sm" className="h-8 px-2 sm:px-3" onClick={() => setImportOpen(true)}>
            <Upload className="h-4 w-4 sm:mr-1" /> <span className="hidden sm:inline">Importa CSV</span>
          </Button>
          <Button variant="outline" size="sm" className="h-8 px-2 sm:px-3" onClick={() => { loadLeads(); loadAgents(); }}>
            <RefreshCw className="h-4 w-4 sm:mr-1" /> <span className="hidden sm:inline">Aggiorna</span>
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-3 sm:space-y-4">
        <TabsList className="w-full grid grid-cols-4 sm:grid-cols-7 h-9 sm:h-10 sm:w-auto sm:inline-flex">
          <TabsTrigger value="dashboard" className="gap-1 text-xs sm:text-sm px-1 sm:px-3"><BarChart3 className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> <span className="hidden sm:inline">Dashboard</span><span className="sm:hidden">Stats</span></TabsTrigger>
          <TabsTrigger value="leads" className="gap-1 text-xs sm:text-sm px-1 sm:px-3"><FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> <span className="hidden sm:inline">Lead</span><span className="sm:hidden">Lead</span> <span className="text-[10px] sm:text-xs opacity-70">({activeLeads.length})</span></TabsTrigger>
          <TabsTrigger value="appointments" className="gap-1 text-xs sm:text-sm px-1 sm:px-3"><Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> <span className="hidden sm:inline">Appuntamenti</span><span className="sm:hidden">App.</span> <span className="text-[10px] sm:text-xs opacity-70">({appointmentLeads.length})</span></TabsTrigger>
          <TabsTrigger value="trial" className="gap-1 text-xs sm:text-sm px-1 sm:px-3"><PlayCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> <span className="hidden sm:inline">Inizio Prova</span><span className="sm:hidden">Prova</span> <span className="text-[10px] sm:text-xs opacity-70">({trialLeads.length})</span></TabsTrigger>
          <TabsTrigger value="archive" className="gap-1 text-xs sm:text-sm px-1 sm:px-3 hidden sm:flex"><Archive className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> <span>Archivio</span> <span className="text-[10px] sm:text-xs opacity-70">({archivedLeads.length})</span></TabsTrigger>
          <TabsTrigger value="agents" className="gap-1 text-xs sm:text-sm px-1 sm:px-3 hidden sm:flex"><Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> <span>Operatrici</span></TabsTrigger>
          <TabsTrigger value="config" className="gap-1 text-xs sm:text-sm px-1 sm:px-3 hidden sm:flex"><Settings className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> <span>Configurazione</span></TabsTrigger>
        </TabsList>
        {/* Mobile second row for remaining tabs */}
        <div className="grid grid-cols-3 gap-1 sm:hidden -mt-2">
          <Button variant={activeTab === "archive" ? "secondary" : "ghost"} size="sm" className="h-8 text-xs gap-1 justify-center" onClick={() => setActiveTab("archive")}>
            <Archive className="h-3.5 w-3.5" /> Arch. <span className="text-[10px] opacity-70">({archivedLeads.length})</span>
          </Button>
          <Button variant={activeTab === "agents" ? "secondary" : "ghost"} size="sm" className="h-8 text-xs gap-1 justify-center" onClick={() => setActiveTab("agents")}>
            <Users className="h-3.5 w-3.5" /> Team
          </Button>
          <Button variant={activeTab === "config" ? "secondary" : "ghost"} size="sm" className="h-8 text-xs gap-1 justify-center" onClick={() => setActiveTab("config")}>
            <Settings className="h-3.5 w-3.5" /> Config
          </Button>
        </div>

        <TabsContent value="dashboard">
          <CallCenterDashboard leads={leads} agents={agents} />
        </TabsContent>

        <TabsContent value="leads">
          {/* Filters */}
          <div className="flex flex-col gap-2 mb-3 sm:mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Cerca per nome, email, telefono..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9" />
            </div>
            <div className="grid grid-cols-3 gap-1.5 sm:flex sm:gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px] h-8 text-xs sm:text-sm">
                  <Filter className="h-3 w-3 mr-1 shrink-0" /><SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti gli stati</SelectItem>
                  {STATUS_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={agentFilter} onValueChange={setAgentFilter}>
                <SelectTrigger className="w-full sm:w-[180px] h-8 text-xs sm:text-sm">
                  <SelectValue placeholder="Operatrice" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Operatrici</SelectItem>
                  {agents.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-full sm:w-[140px] h-8 text-xs sm:text-sm">
                  <SelectValue placeholder="Priorità" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Priorità</SelectItem>
                  {PRIORITY_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Leads Table */}
          <Card className="shadow-card border-border/50">
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredLeads.length === 0 ? (
                <div className="text-center py-12">
                  <img src={fbLogo} alt="Facebook" className="h-10 w-10 object-contain opacity-30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    {search || statusFilter !== "all" ? "Nessun lead trovato con questi filtri" : "Nessun lead presente."}
                  </p>
                </div>
              ) : (
                <>
                  {/* Mobile cards */}
                   <div className="sm:hidden divide-y divide-border">
                     {filteredLeads.map(lead => {
                       const callbackAgent = getAgentName(lead.callback_agent_id);
                       const onboardAgent = getAgentName(lead.assigned_agent_id);
                       return (
                       <div key={lead.id} className="p-3 space-y-2 cursor-pointer hover:bg-secondary/30 transition-colors" onClick={() => setSelectedLead(lead)}>
                         <div className="flex items-center justify-between">
                            <span className="font-medium text-sm flex items-center gap-1">
                              <span className="inline-flex" title={lead.source === "tiktok" ? "TikTok" : "Facebook"}>{lead.source === "tiktok" ? <span className="text-[10px]">🎵</span> : <img src={fbLogo} alt="FB" className="h-3 w-3 object-contain" />}</span>
                              {lead.full_name || "Senza nome"}
                            </span>
                           {statusBadge(lead.status)}
                         </div>
                         <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                            {lead.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" /> {cleanPhone(lead.phone)}
                                <a
                                   href={getWhatsAppUrl(lead.phone, lead.full_name, lead.lead_data)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 transition-colors shrink-0 ml-0.5"
                                >
                                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-3 w-3"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                                </a>
                              </span>
                            )}
                           {priorityIndicator(lead.priority)}
                           <span className="flex items-center gap-0.5">📞 {lead.call_attempts}</span>
                           <span className="text-[10px] text-muted-foreground/70">{fmt(new Date(lead.created_at))}</span>
                         </div>
                          {/* Appointment indicators */}
                          <div className="flex flex-col gap-1.5">
                            {lead.callback_date && (() => {
                              const d = new Date(lead.callback_date);
                              return (
                                <div className="flex items-center gap-2 text-[11px] text-orange-600 dark:text-orange-400">
                                  <PhoneCall className="h-3 w-3 shrink-0" />
                                  <span>{formatDate(d)}</span>
                                  <span className="font-semibold">{formatTime(d)}</span>
                                  {callbackAgent && <Badge variant="outline" className="text-[10px] py-0 h-4 border-orange-200 text-orange-600">{callbackAgent}</Badge>}
                                </div>
                              );
                            })()}
                            {lead.appointment_date && (() => {
                              const d = new Date(lead.appointment_date);
                              return (
                                <div className="flex items-center gap-2 text-[11px] text-emerald-600 dark:text-emerald-400">
                                  <Calendar className="h-3 w-3 shrink-0" />
                                  <span>{formatDate(d)}</span>
                                  <span className="font-semibold">{formatTime(d)}</span>
                                  {onboardAgent && <Badge variant="outline" className="text-[10px] py-0 h-4 border-emerald-200 text-emerald-600">{onboardAgent}</Badge>}
                                </div>
                              );
                            })()}
                          </div>
                         {/* Quiz answers */}
                         {quizBadges(lead.lead_data)}
                         {/* Notes preview */}
                         {lead.notes && (
                           <p className="text-[11px] text-muted-foreground line-clamp-2 italic">📝 {lead.notes}</p>
                         )}
                         <div className="flex justify-end">
                           <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive/60 hover:text-destructive" onClick={(e) => handleDeleteLead(e, lead.id)}>
                             <Trash2 className="h-3.5 w-3.5" />
                           </Button>
                         </div>
                       </div>
                       );
                     })}
                  </div>

                  {/* Desktop table */}
                  <div className="hidden sm:block">
                    <Table>
                      <TableHeader>
                     <TableRow>
                         <TableHead>Nome</TableHead>
                          <TableHead>Telefono</TableHead>
                          <TableHead>Data ingresso</TableHead>
                          <TableHead>Stato</TableHead>
                          <TableHead>Appuntamenti</TableHead>
                          <TableHead>Operatrice</TableHead>
                          <TableHead className="text-center">Tentativi</TableHead>
                           <TableHead>Priorità</TableHead>
                           <TableHead>Quiz</TableHead>
                          <TableHead>Note</TableHead>
                          <TableHead>Reminder</TableHead>
                          <TableHead className="w-10"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredLeads.map(lead => {
                          const isOverdue = lead.next_reminder_at && new Date(lead.next_reminder_at) <= new Date();
                          return (
                            <TableRow key={lead.id} className={`cursor-pointer ${isOverdue ? "bg-orange-500/5" : ""}`} onClick={() => setSelectedLead(lead)}>
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-1.5">
                                  <span className="inline-flex" title={lead.source === "tiktok" ? "TikTok" : "Facebook"}>
                                    {lead.source === "tiktok" ? <span className="text-[10px]">🎵</span> : <img src={fbLogo} alt="FB" className="h-3 w-3 object-contain" />}
                                  </span>
                                  {lead.full_name || "—"}
                                </div>
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                <div className="flex items-center gap-1.5">
                                  <span>{cleanPhone(lead.phone) || "—"}</span>
                                  {lead.phone && (
                                    <a
                                       href={getWhatsAppUrl(lead.phone, lead.full_name, lead.lead_data)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 transition-colors shrink-0"
                                      title="WhatsApp"
                                    >
                                      <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                                    </a>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <span className="text-xs text-muted-foreground whitespace-nowrap">{fmt(new Date(lead.created_at))}</span>
                              </TableCell>
                              <TableCell>{statusBadge(lead.status)}</TableCell>
                              <TableCell>
                                <div className="flex flex-col gap-2">
                                   {lead.callback_date && (() => {
                                     const cbAgent = getAgentName(lead.callback_agent_id);
                                     const d = new Date(lead.callback_date);
                                     return (
                                       <div className="flex items-center gap-2 text-xs text-orange-500">
                                         <PhoneCall className="h-3.5 w-3.5 shrink-0" />
                                         <span>{formatDate(d)}</span>
                                         <span className="font-semibold">{formatTime(d)}</span>
                                         {cbAgent && <Badge variant="outline" className="text-[10px] py-0 h-4 shrink-0 border-orange-200 text-orange-600 ml-1">{cbAgent}</Badge>}
                                       </div>
                                     );
                                   })()}
                                   {lead.appointment_date && (() => {
                                     const obAgent = getAgentName(lead.assigned_agent_id);
                                     const d = new Date(lead.appointment_date);
                                     return (
                                       <div className="flex items-center gap-2 text-xs text-emerald-600">
                                         <Calendar className="h-3.5 w-3.5 shrink-0" />
                                         <span>{formatDate(d)}</span>
                                         <span className="font-semibold">{formatTime(d)}</span>
                                         {obAgent && <Badge variant="outline" className="text-[10px] py-0 h-4 shrink-0 border-emerald-200 text-emerald-600 ml-1">{obAgent}</Badge>}
                                       </div>
                                     );
                                   })()}
                                   {!lead.callback_date && !lead.appointment_date && <span className="text-xs text-muted-foreground">—</span>}
                                 </div>
                              </TableCell>
                              <TableCell>
                                {getAgentName(lead.assigned_agent_id)
                                  ? <Badge variant="outline" className="text-xs">{getAgentName(lead.assigned_agent_id)}</Badge>
                                  : <span className="text-xs text-muted-foreground">—</span>
                                }
                              </TableCell>
                              <TableCell className="text-center">{lead.call_attempts}</TableCell>
                              <TableCell>{priorityIndicator(lead.priority) || <span className="text-xs text-muted-foreground">—</span>}</TableCell>
                              <TableCell className="max-w-[280px]">{quizBadges(lead.lead_data) || <span className="text-xs text-muted-foreground">—</span>}</TableCell>
                              <TableCell>
                                {lead.notes
                                  ? <span className="text-xs text-muted-foreground line-clamp-1 max-w-[150px]">{lead.notes}</span>
                                  : <span className="text-xs text-muted-foreground">—</span>
                                }
                              </TableCell>
                              <TableCell>
                                {lead.next_reminder_at ? (
                                  <span className={`text-xs ${isOverdue ? "text-orange-500 font-medium" : "text-muted-foreground"}`}>
                                    {fmt(new Date(lead.next_reminder_at))}
                                  </span>
                                ) : "—"}
                              </TableCell>
                              <TableCell>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive/60 hover:text-destructive" onClick={(e) => handleDeleteLead(e, lead.id)}>
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appointments">
          <Card className="shadow-card border-border/50">
            <CardContent className="p-0">
              {appointmentLeads.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Nessun lead con appuntamento fissato</p>
                </div>
              ) : (
                <>
                  {/* Mobile */}
                  <div className="sm:hidden divide-y divide-border">
                    {appointmentLeads.map(lead => {
                      const callbackAgent = getAgentName(lead.callback_agent_id);
                      const onboardAgent = getAgentName(lead.assigned_agent_id);
                      return (
                        <div key={lead.id} className="p-3 space-y-2 cursor-pointer hover:bg-secondary/30 transition-colors" onClick={() => setSelectedLead(lead)}>
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm flex items-center gap-1">
                              <span className="inline-flex">{lead.source === "tiktok" ? <span className="text-[10px]">🎵</span> : <img src={fbLogo} alt="FB" className="h-3 w-3 object-contain" />}</span>
                              {lead.full_name || "Senza nome"}
                            </span>
                            {statusBadge(lead.status)}
                          </div>
                          <div className="flex flex-col gap-1.5">
                            {lead.callback_date && (() => {
                              const d = new Date(lead.callback_date);
                              return (
                                <div className="flex items-center gap-2 text-xs text-orange-600 dark:text-orange-400">
                                  <PhoneCall className="h-3.5 w-3.5 shrink-0" />
                                  <span>Richiamata:</span>
                                  <span>{formatDate(d)}</span>
                                  <span className="font-semibold">{formatTime(d)}</span>
                                  {callbackAgent && <Badge variant="outline" className="text-[10px] py-0 h-4 border-orange-200 text-orange-600">{callbackAgent}</Badge>}
                                </div>
                              );
                            })()}
                            {lead.appointment_date && (() => {
                              const d = new Date(lead.appointment_date);
                              return (
                                <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
                                  <Calendar className="h-3.5 w-3.5 shrink-0" />
                                  <span>Onboarding:</span>
                                  <span>{formatDate(d)}</span>
                                  <span className="font-semibold">{formatTime(d)}</span>
                                  {onboardAgent && <Badge variant="outline" className="text-[10px] py-0 h-4 border-emerald-200 text-emerald-600">{onboardAgent}</Badge>}
                                </div>
                              );
                            })()}
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                            {lead.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {cleanPhone(lead.phone)}</span>}
                            {lead.email && <span>{lead.email}</span>}
                          </div>
                          {lead.notes && <p className="text-[11px] text-muted-foreground line-clamp-2 italic">📝 {lead.notes}</p>}
                        </div>
                      );
                    })}
                  </div>
                  {/* Desktop */}
                  <div className="hidden sm:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead>Telefono</TableHead>
                          <TableHead>Stato</TableHead>
                          <TableHead>Richiamata</TableHead>
                          <TableHead>Onboarding</TableHead>
                          <TableHead>Operatrice</TableHead>
                          <TableHead>Note</TableHead>
                          <TableHead>Data ingresso</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {appointmentLeads.map(lead => {
                          const cbAgent = getAgentName(lead.callback_agent_id);
                          const obAgent = getAgentName(lead.assigned_agent_id);
                          return (
                            <TableRow key={lead.id} className="cursor-pointer" onClick={() => setSelectedLead(lead)}>
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-1.5">
                                  <span className="inline-flex">{lead.source === "tiktok" ? <span className="text-[10px]">🎵</span> : <img src={fbLogo} alt="FB" className="h-3 w-3 object-contain" />}</span>
                                  {lead.full_name || "—"}
                                </div>
                              </TableCell>
                              <TableCell className="text-muted-foreground">{cleanPhone(lead.phone) || "—"}</TableCell>
                              <TableCell>{statusBadge(lead.status)}</TableCell>
                              <TableCell>
                                {lead.callback_date ? (() => {
                                  const d = new Date(lead.callback_date);
                                  return (
                                    <div className="flex items-center gap-2 text-xs text-orange-500">
                                      <PhoneCall className="h-3.5 w-3.5 shrink-0" />
                                      <span>{formatDate(d)}</span>
                                      <span className="font-semibold">{formatTime(d)}</span>
                                      {cbAgent && <Badge variant="outline" className="text-[10px] py-0 h-4 border-orange-200 text-orange-600 ml-1">{cbAgent}</Badge>}
                                    </div>
                                  );
                                })() : <span className="text-xs text-muted-foreground">—</span>}
                              </TableCell>
                              <TableCell>
                                {lead.appointment_date ? (() => {
                                  const d = new Date(lead.appointment_date);
                                  return (
                                    <div className="flex items-center gap-2 text-xs text-emerald-600">
                                      <Calendar className="h-3.5 w-3.5 shrink-0" />
                                      <span>{formatDate(d)}</span>
                                      <span className="font-semibold">{formatTime(d)}</span>
                                      {obAgent && <Badge variant="outline" className="text-[10px] py-0 h-4 border-emerald-200 text-emerald-600 ml-1">{obAgent}</Badge>}
                                    </div>
                                  );
                                })() : <span className="text-xs text-muted-foreground">—</span>}
                              </TableCell>
                              <TableCell>
                                {obAgent
                                  ? <Badge variant="outline" className="text-xs">{obAgent}</Badge>
                                  : <span className="text-xs text-muted-foreground">—</span>
                                }
                              </TableCell>
                              <TableCell><span className="text-xs text-muted-foreground line-clamp-1 max-w-[150px]">{lead.notes || "—"}</span></TableCell>
                              <TableCell className="text-sm text-muted-foreground">{fmt(new Date(lead.created_at))}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trial">
          <Card className="shadow-card border-border/50">
            <CardContent className="p-0">
              {trialLeads.length === 0 ? (
                <div className="text-center py-12">
                  <PlayCircle className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Nessun lead ha iniziato la prova</p>
                </div>
              ) : (
                <>
                  {/* Mobile */}
                  <div className="sm:hidden divide-y divide-border">
                    {trialLeads.map(lead => (
                      <div key={lead.id} className="p-3 space-y-2 cursor-pointer hover:bg-secondary/30 transition-colors" onClick={() => setSelectedLead(lead)}>
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm flex items-center gap-1">
                            <span className="inline-flex">{lead.source === "tiktok" ? <span className="text-[10px]">🎵</span> : <img src={fbLogo} alt="FB" className="h-3 w-3 object-contain" />}</span>
                            {lead.full_name || "Senza nome"}
                          </span>
                          <Badge variant="secondary" className="text-xs gap-1 bg-violet-500/10 text-violet-600">
                            <PlayCircle className="h-3 w-3" /> Inizio prova
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          {lead.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {cleanPhone(lead.phone)}</span>}
                          {lead.email && <span>{lead.email}</span>}
                          <span className="text-[10px] text-muted-foreground/70">{fmt(new Date(lead.created_at))}</span>
                        </div>
                        {lead.notes && <p className="text-[11px] text-muted-foreground line-clamp-2 italic">📝 {lead.notes}</p>}
                        {quizBadges(lead.lead_data)}
                      </div>
                    ))}
                  </div>
                  {/* Desktop */}
                  <div className="hidden sm:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead>Telefono</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Operatrice</TableHead>
                          <TableHead>Quiz</TableHead>
                          <TableHead>Note</TableHead>
                          <TableHead>Data ingresso</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {trialLeads.map(lead => (
                          <TableRow key={lead.id} className="cursor-pointer" onClick={() => setSelectedLead(lead)}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-1.5">
                                <span className="inline-flex">{lead.source === "tiktok" ? <span className="text-[10px]">🎵</span> : <img src={fbLogo} alt="FB" className="h-3 w-3 object-contain" />}</span>
                                {lead.full_name || "—"}
                              </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground">{cleanPhone(lead.phone) || "—"}</TableCell>
                            <TableCell className="text-muted-foreground">{lead.email || "—"}</TableCell>
                            <TableCell>
                              {getAgentName(lead.assigned_agent_id)
                                ? <Badge variant="outline" className="text-xs">{getAgentName(lead.assigned_agent_id)}</Badge>
                                : <span className="text-xs text-muted-foreground">—</span>
                              }
                            </TableCell>
                            <TableCell className="max-w-[280px]">{quizBadges(lead.lead_data) || <span className="text-xs text-muted-foreground">—</span>}</TableCell>
                            <TableCell><span className="text-xs text-muted-foreground line-clamp-1 max-w-[150px]">{lead.notes || "—"}</span></TableCell>
                            <TableCell className="text-sm text-muted-foreground">{fmt(new Date(lead.created_at))}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="archive">
          <Card className="shadow-card border-border/50">
            <CardContent className="p-0">
              {filteredArchived.length === 0 ? (
                <div className="text-center py-12">
                  <Archive className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Nessun lead archiviato</p>
                </div>
              ) : (
                <>
                  {/* Mobile */}
                  <div className="sm:hidden divide-y divide-border">
                    {filteredArchived.map(lead => (
                      <div key={lead.id} className="p-3 space-y-2 cursor-pointer hover:bg-secondary/30 transition-colors" onClick={() => setSelectedLead(lead)}>
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm text-muted-foreground flex items-center gap-1">
                            <span className="inline-flex">{lead.source === "tiktok" ? <span className="text-[10px]">🎵</span> : <img src={fbLogo} alt="FB" className="h-3 w-3 object-contain" />}</span>
                            {lead.full_name || "Senza nome"}
                          </span>
                          {statusBadge(lead.status)}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          {lead.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {cleanPhone(lead.phone)}</span>}
                          {lead.notes && <p className="text-[11px] italic line-clamp-1">📝 {lead.notes}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Desktop */}
                  <div className="hidden sm:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead>Telefono</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Note</TableHead>
                          <TableHead>Data</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredArchived.map(lead => (
                          <TableRow key={lead.id} className="cursor-pointer opacity-70 hover:opacity-100" onClick={() => setSelectedLead(lead)}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-1.5">
                                <span className="inline-flex">{lead.source === "tiktok" ? <span className="text-[10px]">🎵</span> : <img src={fbLogo} alt="FB" className="h-3 w-3 object-contain" />}</span>
                                {lead.full_name || "—"}
                              </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground">{cleanPhone(lead.phone) || "—"}</TableCell>
                            <TableCell className="text-muted-foreground">{lead.email || "—"}</TableCell>
                            <TableCell><span className="text-xs text-muted-foreground line-clamp-1 max-w-[200px]">{lead.notes || "—"}</span></TableCell>
                            <TableCell className="text-sm text-muted-foreground">{fmt(new Date(lead.created_at))}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agents">
          <CallCenterAgentsTab agents={agents} onAgentsChanged={loadAgents} />
        </TabsContent>

        <TabsContent value="config">
          <AdminLeadsConfigTab />
        </TabsContent>
      </Tabs>

      {/* Lead detail dialog */}
      <LeadDetailDialog
        lead={selectedLead}
        agents={agents}
        onClose={() => setSelectedLead(null)}
        onUpdated={handleLeadUpdated}
        onDeleted={(id) => {
          setLeads(prev => prev.filter(l => l.id !== id));
          setSelectedLead(null);
        }}
      />

      <LeadsCsvImportDialog open={importOpen} onOpenChange={setImportOpen} onImported={loadLeads} />
    </div>
  );
}
