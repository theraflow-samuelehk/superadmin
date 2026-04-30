import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import { User, ChevronDown, ChevronUp, Clock, Phone, Mail, ArrowRight } from "lucide-react";

const STEP_LABELS = [
  "Hero", "Servizio", "Operatrice", "Orario", "Conferma",
  "Agenda", "Problema", "Reminder", "Risultati", "CTA",
];

interface FunnelEvent {
  session_id: string;
  step_index: number;
  step_name: string;
  event_type: string;
  cta_action: string | null;
  fb_lead_id: string | null;
  created_at: string;
}

interface FacebookLead {
  id: string;
  fb_lead_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  created_at: string;
}

interface LeadJourneyData {
  lead: FacebookLead;
  sessions: Map<string, FunnelEvent[]>;
  maxStep: number;
  hasCta: boolean;
  totalDurationSec: number;
}

interface Props {
  events: FunnelEvent[];
  loading: boolean;
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  if (min < 60) return `${min}m ${sec}s`;
  const h = Math.floor(min / 60);
  return `${h}h ${min % 60}m`;
}

function calcSessionDuration(events: FunnelEvent[]): number {
  if (events.length < 2) return 0;
  const sorted = [...events].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  return Math.round((new Date(sorted[sorted.length - 1].created_at).getTime() - new Date(sorted[0].created_at).getTime()) / 1000);
}

export default function FunnelLeadJourney({ events, loading }: Props) {
  const isMobile = useIsMobile();
  const [leads, setLeads] = useState<FacebookLead[]>([]);
  const [expandedLead, setExpandedLead] = useState<string | null>(null);

  const fbLeadIds = useMemo(() => {
    const ids = new Set<string>();
    events.forEach(e => { if (e.fb_lead_id) ids.add(e.fb_lead_id); });
    return Array.from(ids);
  }, [events]);

  useEffect(() => {
    if (fbLeadIds.length === 0) { setLeads([]); return; }
    supabase
      .from("facebook_leads")
      .select("id, fb_lead_id, full_name, email, phone, created_at")
      .in("fb_lead_id", fbLeadIds)
      .then(({ data }) => setLeads((data as FacebookLead[]) || []));
  }, [fbLeadIds]);

  const journeys = useMemo<LeadJourneyData[]>(() => {
    const leadEventsMap = new Map<string, FunnelEvent[]>();
    events.forEach(e => {
      if (!e.fb_lead_id) return;
      if (!leadEventsMap.has(e.fb_lead_id)) leadEventsMap.set(e.fb_lead_id, []);
      leadEventsMap.get(e.fb_lead_id)!.push(e);
    });

    const leadsMap = new Map(leads.map(l => [l.fb_lead_id, l]));

    return Array.from(new Set(fbLeadIds)).map(fbId => {
      const lead = leadsMap.get(fbId) || {
        id: fbId, fb_lead_id: fbId, full_name: null, email: null, phone: null, created_at: "",
      };

      const evts = leadEventsMap.get(fbId) || [];
      const sessions = new Map<string, FunnelEvent[]>();
      evts.forEach(e => {
        if (!sessions.has(e.session_id)) sessions.set(e.session_id, []);
        sessions.get(e.session_id)!.push(e);
      });

      const maxStep = Math.max(0, ...evts.filter(e => e.event_type === "step_view").map(e => e.step_index));
      const hasCta = evts.some(e => e.event_type === "cta_click");

      // Total duration across all sessions
      let totalDurationSec = 0;
      sessions.forEach(sessionEvts => {
        totalDurationSec += calcSessionDuration(sessionEvts);
      });

      return { lead, sessions, maxStep, hasCta, totalDurationSec };
    }).sort((a, b) => b.maxStep - a.maxStep);
  }, [events, leads, fbLeadIds]);

  if (loading) {
    return (
      <Card className="shadow-card border-border/50">
        <CardContent className="p-6">
          <div className="h-32 flex items-center justify-center text-muted-foreground animate-pulse">Caricamento...</div>
        </CardContent>
      </Card>
    );
  }

  if (journeys.length === 0) {
    return (
      <Card className="shadow-card border-border/50">
        <CardHeader>
          <CardTitle className="font-serif text-base flex items-center gap-2">
            <User className="h-4 w-4" /> Percorso Lead Facebook
          </CardTitle>
          <CardDescription>Traccia il percorso di ogni lead nel funnel</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-6">
            Nessun lead Facebook tracciato. Imposta il link della campagna con i parametri UTM corretti.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-card border-border/50">
      <CardHeader>
        <CardTitle className="font-serif text-base flex items-center gap-2">
          <User className="h-4 w-4" /> Percorso Lead Facebook
        </CardTitle>
        <CardDescription>{journeys.length} lead tracciati nel funnel</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {journeys.map(j => {
          const isExpanded = expandedLead === j.lead.fb_lead_id;
          const displayName = j.lead.full_name || j.lead.email || j.lead.phone || "Lead sconosciuto";

          return (
            <div key={j.lead.fb_lead_id} className="border border-border/50 rounded-lg overflow-hidden">
              {/* Lead header */}
              <button
                className="w-full flex items-center justify-between p-3 hover:bg-secondary/50 transition-colors text-left"
                onClick={() => setExpandedLead(isExpanded ? null : j.lead.fb_lead_id)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{displayName}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {j.lead.phone && (
                        <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{j.lead.phone}</span>
                      )}
                      {j.lead.email && !isMobile && (
                        <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{j.lead.email}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="outline" className="text-xs flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {formatDuration(j.totalDurationSec)}
                  </Badge>
                  <Badge variant={j.hasCta ? "default" : "secondary"} className="text-xs">
                    {j.hasCta ? "CTA ✓" : `Step ${j.maxStep + 1}/${STEP_LABELS.length}`}
                  </Badge>
                  {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </div>
              </button>

              {/* Expanded: step timeline */}
              {isExpanded && (
                <div className="border-t border-border/50 p-3 bg-secondary/20 space-y-3">
                  {/* Contact info */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {j.lead.full_name && (
                      <div><span className="text-muted-foreground">Nome:</span> <span className="font-medium text-foreground">{j.lead.full_name}</span></div>
                    )}
                    {j.lead.phone && (
                      <div><span className="text-muted-foreground">Tel:</span> <span className="font-medium text-foreground">{j.lead.phone}</span></div>
                    )}
                    {j.lead.email && (
                      <div><span className="text-muted-foreground">Email:</span> <span className="font-medium text-foreground">{j.lead.email}</span></div>
                    )}
                    <div><span className="text-muted-foreground">Tempo totale:</span> <span className="font-medium text-foreground">{formatDuration(j.totalDurationSec)}</span></div>
                  </div>

                  {/* Step progress bar */}
                  <div className="flex gap-1">
                    {STEP_LABELS.map((label, i) => {
                      const reached = i <= j.maxStep;
                      return (
                        <div key={i} className="flex-1 text-center">
                          <div className={`h-2 rounded-full mb-1 ${reached ? "bg-primary" : "bg-border"}`} />
                          <span className={`text-[9px] ${reached ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                            {isMobile ? (i + 1) : label}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Session details */}
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground font-medium">{j.sessions.size} sessione/i</p>
                    {Array.from(j.sessions.entries()).map(([sid, evts]) => {
                      const sorted = [...evts].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
                      const first = sorted[0];
                      const date = new Date(first.created_at).toLocaleString("it-IT", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
                      const steps = evts.filter(e => e.event_type === "step_view").map(e => e.step_index);
                      const maxS = Math.max(0, ...steps);
                      const cta = evts.find(e => e.event_type === "cta_click");
                      const duration = calcSessionDuration(sorted);

                      return (
                        <div key={sid} className="flex items-center justify-between text-xs p-2 rounded bg-background gap-2">
                          <span className="text-muted-foreground shrink-0">{date}</span>
                          <div className="flex items-center gap-2 flex-wrap justify-end">
                            <span className="text-foreground flex items-center gap-1">
                              <ArrowRight className="h-3 w-3" /> {STEP_LABELS[maxS] || `Step ${maxS}`}
                            </span>
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                              {formatDuration(duration)}
                            </Badge>
                            {cta && <Badge variant="default" className="text-[10px] px-1.5 py-0">CTA: {cta.cta_action}</Badge>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
