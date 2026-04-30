export interface Lead {
  id: string;
  fb_lead_id: string;
  fb_form_id: string | null;
  fb_page_id: string | null;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  status: string;
  notes: string | null;
  lead_data: any;
  created_at: string;
  facebook_page_id: string | null;
  user_id: string;
  assigned_agent_id: string | null;
  appointment_date: string | null;
  callback_date: string | null;
  callback_agent_id: string | null;
  call_attempts: number;
  last_called_at: string | null;
  next_reminder_at: string | null;
  priority: string;
  source: string;
  agent_name?: string | null;
}

export interface Agent {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  is_active: boolean;
  role: string;
  created_at: string;
}

export const AGENT_ROLES = [
  { value: "call_center", label: "Call Center" },
  { value: "onboarding", label: "Onboarding" },
];

export interface AgentAvailability {
  id: string;
  agent_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
  dual_slot: boolean;
  start_time_2: string | null;
  end_time_2: string | null;
}

export interface CallLog {
  id: string;
  lead_id: string;
  agent_id: string;
  outcome: string;
  notes: string | null;
  called_at: string;
  agent_name?: string;
}

export const STATUS_OPTIONS = [
  { value: "new", label: "Nuovo", color: "bg-blue-500" },
  { value: "da_chiamare", label: "Da chiamare", color: "bg-indigo-500" },
  { value: "non_risponde", label: "Non risponde", color: "bg-orange-500" },
  { value: "richiamato", label: "Richiamato", color: "bg-cyan-500" },
  { value: "inviare_whatsapp", label: "Inviare msg WhatsApp", color: "bg-green-500" },
  { value: "appuntamento_fissato", label: "Appuntamento fissato", color: "bg-emerald-500" },
  { value: "qualificato", label: "Qualificato", color: "bg-green-600" },
  { value: "convertito", label: "Convertito", color: "bg-primary" },
  { value: "inizio_prova", label: "Inizio prova", color: "bg-violet-500" },
  { value: "non_interessato", label: "Non interessato", color: "bg-zinc-400" },
  { value: "annullato", label: "Annullato", color: "bg-destructive" },
];

export const PRIORITY_OPTIONS = [
  { value: "low", label: "Bassa", color: "text-muted-foreground" },
  { value: "normal", label: "Normale", color: "text-foreground" },
  { value: "high", label: "Alta", color: "text-orange-500" },
  { value: "urgent", label: "Urgente", color: "text-destructive" },
];

export const CALL_OUTCOMES = [
  { value: "no_answer", label: "Non risponde" },
  { value: "callback", label: "Da richiamare" },
  { value: "appointment_set", label: "Appuntamento fissato" },
  { value: "not_interested", label: "Non interessato" },
  { value: "info_sent", label: "Info inviate" },
  { value: "voicemail", label: "Segreteria" },
];

export const DAY_NAMES = ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"];
