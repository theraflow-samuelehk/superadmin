import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
  AreaChart, Area,
} from "recharts";
import {
  Users, Target, MousePointerClick, Clock, Monitor, Smartphone, Tablet,
  RefreshCw, Download, CalendarDays, ChevronDown, ChevronUp, User, Phone, Mail, ArrowRight,
} from "lucide-react";
import { exportToCsv } from "@/lib/exportCsv";
import { format } from "date-fns";
import { it } from "date-fns/locale";

const STEP_LABELS = [
  "Hero", "Servizio", "Operatrice", "Orario", "Conferma",
  "Agenda", "Problema", "Reminder", "Risultati", "CTA",
];

interface FunnelEvent {
  id: string;
  session_id: string;
  step_index: number;
  step_name: string;
  event_type: string;
  cta_action: string | null;
  referrer: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  device_type: string | null;
  screen_width: number | null;
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

type DatePreset = "today" | "yesterday" | "7d" | "30d" | "90d" | "custom";

function getDateRange(preset: DatePreset): { start: Date; end: Date } {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);

  switch (preset) {
    case "today":
      return { start: todayStart, end: todayEnd };
    case "yesterday": {
      const yStart = new Date(todayStart);
      yStart.setDate(yStart.getDate() - 1);
      return { start: yStart, end: todayStart };
    }
    case "7d": {
      const s = new Date(todayStart);
      s.setDate(s.getDate() - 7);
      return { start: s, end: todayEnd };
    }
    case "30d": {
      const s = new Date(todayStart);
      s.setDate(s.getDate() - 30);
      return { start: s, end: todayEnd };
    }
    case "90d": {
      const s = new Date(todayStart);
      s.setDate(s.getDate() - 90);
      return { start: s, end: todayEnd };
    }
    case "custom":
      return { start: todayStart, end: todayEnd };
  }
}

const PRESET_LABELS: Record<DatePreset, string> = {
  today: "Oggi",
  yesterday: "Ieri",
  "7d": "Ultimi 7 giorni",
  "30d": "Ultimi 30 giorni",
  "90d": "Ultimi 90 giorni",
  custom: "Personalizzato",
};

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

export default function AdminFunnelTab() {
  const isMobile = useIsMobile();
  const [events, setEvents] = useState<FunnelEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [datePreset, setDatePreset] = useState<DatePreset>("30d");
  const [customStart, setCustomStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [customEnd, setCustomEnd] = useState(() => new Date().toISOString().slice(0, 10));
  const [filterSource, setFilterSource] = useState<string>("fb");
  const [filterDevice, setFilterDevice] = useState<string>("all");

  // Lead-journey state
  const [fbLeads, setFbLeads] = useState<FacebookLead[]>([]);
  const [expandedLead, setExpandedLead] = useState<string | null>(null);

  const dateRange = useMemo(() => {
    if (datePreset === "custom") {
      return {
        start: new Date(customStart + "T00:00:00"),
        end: new Date(customEnd + "T23:59:59"),
      };
    }
    return getDateRange(datePreset);
  }, [datePreset, customStart, customEnd]);

  const dateLabel = useMemo(() => {
    if (datePreset !== "custom") return PRESET_LABELS[datePreset];
    return `${format(new Date(customStart), "dd/MM", { locale: it })} - ${format(new Date(customEnd), "dd/MM", { locale: it })}`;
  }, [datePreset, customStart, customEnd]);

  const fetchEvents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("funnel_events")
      .select("*")
      .gte("created_at", dateRange.start.toISOString())
      .lte("created_at", dateRange.end.toISOString())
      .order("created_at", { ascending: true });

    if (error) console.error("Funnel fetch error:", error);
    setEvents((data as FunnelEvent[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchEvents(); }, [dateRange.start.toISOString(), dateRange.end.toISOString()]);

  // Filter events by source
  const filtered = useMemo(() => {
    let f = events;
    if (filterSource === "fb") {
      f = f.filter(e => (e.utm_source || "").toLowerCase() === "fb");
    } else if (filterSource === "tiktok") {
      f = f.filter(e => (e.utm_source || "").toLowerCase() === "tiktok");
    } else if (filterSource === "other") {
      f = f.filter(e => {
        const src = (e.utm_source || "").toLowerCase();
        return src !== "fb" && src !== "tiktok";
      });
    }
    if (filterDevice !== "all") f = f.filter(e => e.device_type === filterDevice);
    return f;
  }, [events, filterDevice, filterSource]);

  // Session-level computations
  const sessionMap = useMemo(() => {
    const map = new Map<string, FunnelEvent[]>();
    filtered.forEach(e => {
      if (!map.has(e.session_id)) map.set(e.session_id, []);
      map.get(e.session_id)!.push(e);
    });
    return map;
  }, [filtered]);

  const totalSessions = sessionMap.size;

  const completedSessions = useMemo(() => {
    let count = 0;
    sessionMap.forEach(evts => {
      if (evts.some(e => e.step_index >= 9)) count++;
    });
    return count;
  }, [sessionMap]);

  const ctaClicks = useMemo(() =>
    filtered.filter(e => e.event_type === "cta_click").length
  , [filtered]);

  const ctaSessions = useMemo(() => {
    let count = 0;
    sessionMap.forEach(evts => {
      if (evts.some(e => e.event_type === "cta_click")) count++;
    });
    return count;
  }, [sessionMap]);

  const avgTimeInFunnel = useMemo(() => {
    if (sessionMap.size === 0) return 0;
    let totalMs = 0; let validCount = 0;
    sessionMap.forEach(evts => {
      if (evts.length < 2) return;
      const first = new Date(evts[0].created_at).getTime();
      const last = new Date(evts[evts.length - 1].created_at).getTime();
      const diff = last - first;
      if (diff > 0) { totalMs += diff; validCount++; }
    });
    return validCount > 0 ? Math.round(totalMs / validCount / 1000) : 0;
  }, [sessionMap]);

  // Funnel drop-off data
  const funnelData = useMemo(() => {
    const stepSessions = new Array(10).fill(0);
    sessionMap.forEach(evts => {
      const maxStep = Math.max(...evts.filter(e => e.event_type === "step_view").map(e => e.step_index));
      for (let i = 0; i <= Math.min(maxStep, 9); i++) {
        stepSessions[i]++;
      }
    });
    return STEP_LABELS.map((label, i) => ({
      step: label,
      sessions: stepSessions[i],
      dropoff: i > 0 && stepSessions[i - 1] > 0
        ? (((stepSessions[i - 1] - stepSessions[i]) / stepSessions[i - 1]) * 100).toFixed(1)
        : "0",
      pct: totalSessions > 0 ? ((stepSessions[i] / totalSessions) * 100).toFixed(0) : "0",
    }));
  }, [sessionMap, totalSessions]);

  // Device breakdown
  const deviceData = useMemo(() => {
    const map: Record<string, { total: number; completed: number }> = {};
    sessionMap.forEach(evts => {
      const device = evts[0]?.device_type || "unknown";
      if (!map[device]) map[device] = { total: 0, completed: 0 };
      map[device].total++;
      if (evts.some(e => e.step_index >= 9)) map[device].completed++;
    });
    const colors: Record<string, string> = {
      mobile: "hsl(var(--primary))",
      tablet: "hsl(var(--accent))",
      desktop: "hsl(var(--muted-foreground))",
      unknown: "hsl(var(--border))",
    };
    const icons: Record<string, typeof Monitor> = { mobile: Smartphone, tablet: Tablet, desktop: Monitor };
    return Object.entries(map).map(([name, v]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value: v.total,
      completed: v.completed,
      rate: v.total > 0 ? ((v.completed / v.total) * 100).toFixed(1) : "0",
      color: colors[name] || colors.unknown,
      Icon: icons[name] || Monitor,
    }));
  }, [sessionMap]);

  // UTM source breakdown
  const sourceData = useMemo(() => {
    const map: Record<string, { total: number; completed: number; cta: number }> = {};
    sessionMap.forEach(evts => {
      const source = evts[0]?.utm_source || "direct";
      if (!map[source]) map[source] = { total: 0, completed: 0, cta: 0 };
      map[source].total++;
      if (evts.some(e => e.step_index >= 9)) map[source].completed++;
      if (evts.some(e => e.event_type === "cta_click")) map[source].cta++;
    });
    return Object.entries(map)
      .map(([source, v]) => ({
        source,
        sessions: v.total,
        completed: v.completed,
        cta: v.cta,
        completionRate: v.total > 0 ? ((v.completed / v.total) * 100).toFixed(1) : "0",
        ctaRate: v.total > 0 ? ((v.cta / v.total) * 100).toFixed(1) : "0",
      }))
      .sort((a, b) => b.sessions - a.sessions);
  }, [sessionMap]);

  // Daily timeline
  const timeline = useMemo(() => {
    const dayMap: Record<string, { sessions: Set<string>; completed: Set<string> }> = {};
    filtered.forEach(e => {
      const day = new Date(e.created_at).toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit" });
      if (!dayMap[day]) dayMap[day] = { sessions: new Set(), completed: new Set() };
      dayMap[day].sessions.add(e.session_id);
      if (e.step_index >= 9) dayMap[day].completed.add(e.session_id);
    });
    return Object.entries(dayMap).map(([day, v]) => ({
      day,
      sessions: v.sessions.size,
      completed: v.completed.size,
      rate: v.sessions.size > 0 ? Math.round((v.completed.size / v.sessions.size) * 100) : 0,
    }));
  }, [filtered]);

  // === LEAD-FUNNEL CORRELATION ===
  // Get all fb_lead_ids from events + all facebook_leads in the date range
  const eventFbLeadIds = useMemo(() => {
    const ids = new Set<string>();
    filtered.forEach(e => { if (e.fb_lead_id) ids.add(e.fb_lead_id); });
    return Array.from(ids);
  }, [filtered]);

  useEffect(() => {
    // Fetch all facebook leads in the date range (regardless of funnel presence)
    const fetchLeads = async () => {
      const { data } = await supabase
        .from("facebook_leads")
        .select("id, fb_lead_id, full_name, email, phone, created_at")
        .gte("created_at", dateRange.start.toISOString())
        .lte("created_at", dateRange.end.toISOString())
        .order("created_at", { ascending: false });
      setFbLeads((data as FacebookLead[]) || []);
    };
    fetchLeads();
  }, [dateRange.start.toISOString(), dateRange.end.toISOString()]);

  // Build the lead-funnel correlation table
  const leadFunnelData = useMemo(() => {
    // Map fb_lead_id -> events
    const leadEventsMap = new Map<string, FunnelEvent[]>();
    filtered.forEach(e => {
      if (!e.fb_lead_id) return;
      if (!leadEventsMap.has(e.fb_lead_id)) leadEventsMap.set(e.fb_lead_id, []);
      leadEventsMap.get(e.fb_lead_id)!.push(e);
    });

    return fbLeads.map(lead => {
      const evts = leadEventsMap.get(lead.fb_lead_id) || [];
      const sessions = new Map<string, FunnelEvent[]>();
      evts.forEach(e => {
        if (!sessions.has(e.session_id)) sessions.set(e.session_id, []);
        sessions.get(e.session_id)!.push(e);
      });

      const maxStep = evts.length > 0
        ? Math.max(0, ...evts.filter(e => e.event_type === "step_view").map(e => e.step_index))
        : -1;
      const hasCta = evts.some(e => e.event_type === "cta_click");
      const enteredFunnel = evts.length > 0;

      let totalDuration = 0;
      sessions.forEach(s => { totalDuration += calcSessionDuration(s); });

      return {
        lead,
        events: evts,
        sessions,
        maxStep,
        hasCta,
        enteredFunnel,
        totalDuration,
      };
    });
  }, [fbLeads, filtered]);

  const leadsInFunnel = leadFunnelData.filter(d => d.enteredFunnel).length;
  const leadsCompleted = leadFunnelData.filter(d => d.maxStep >= 9).length;
  const leadsWithCta = leadFunnelData.filter(d => d.hasCta).length;

  const completionRate = totalSessions > 0 ? ((completedSessions / totalSessions) * 100).toFixed(1) : "0";
  const ctaRate = totalSessions > 0 ? ((ctaSessions / totalSessions) * 100).toFixed(1) : "0";
  const avgTimeLabel = avgTimeInFunnel < 60
    ? `${avgTimeInFunnel}s`
    : `${Math.floor(avgTimeInFunnel / 60)}m ${avgTimeInFunnel % 60}s`;

  const handleExport = () => {
    exportToCsv("funnel_events", filtered, [
      { header: "Session", accessor: r => r.session_id },
      { header: "Step", accessor: r => r.step_name },
      { header: "Tipo", accessor: r => r.event_type },
      { header: "UTM Source", accessor: r => r.utm_source },
      { header: "Device", accessor: r => r.device_type },
      { header: "Data", accessor: r => new Date(r.created_at).toLocaleString("it-IT") },
    ]);
  };

  const kpis = [
    { label: "Sessioni", value: String(totalSessions), icon: Users, color: "text-primary" },
    { label: "Completamento", value: `${completionRate}%`, icon: Target, color: "text-emerald-500" },
    { label: "CTA Click", value: `${ctaClicks} (${ctaRate}%)`, icon: MousePointerClick, color: "text-amber-500" },
    { label: "Tempo medio", value: avgTimeLabel, icon: Clock, color: "text-blue-500" },
  ];

  const tooltipStyle = {
    background: "hsl(var(--card))",
    border: "1px solid hsl(var(--border))",
    borderRadius: "var(--radius)",
    fontSize: 12,
  };

  return (
    <div className="space-y-6">
      {/* Header + filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-serif font-bold text-foreground">Funnel Analytics</h2>
          <p className="text-sm text-muted-foreground">Tracciamento demo prenotazione</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Date filter */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-9 gap-2 text-sm">
                <CalendarDays className="h-4 w-4" />
                {dateLabel}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 space-y-3" align="end">
              <div className="space-y-1">
                <Label className="text-xs font-medium text-muted-foreground">Presets</Label>
                <div className="grid grid-cols-2 gap-1.5">
                  {(["today", "yesterday", "7d", "30d", "90d"] as DatePreset[]).map(p => (
                    <Button
                      key={p}
                      variant={datePreset === p ? "default" : "outline"}
                      size="sm"
                      className="text-xs h-8"
                      onClick={() => setDatePreset(p)}
                    >
                      {PRESET_LABELS[p]}
                    </Button>
                  ))}
                  <Button
                    variant={datePreset === "custom" ? "default" : "outline"}
                    size="sm"
                    className="text-xs h-8"
                    onClick={() => setDatePreset("custom")}
                  >
                    Personalizzato
                  </Button>
                </div>
              </div>
              {datePreset === "custom" && (
                <div className="space-y-2 pt-2 border-t">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Da</Label>
                      <Input
                        type="date"
                        value={customStart}
                        onChange={e => setCustomStart(e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">A</Label>
                      <Input
                        type="date"
                        value={customEnd}
                        onChange={e => setCustomEnd(e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}
            </PopoverContent>
          </Popover>

          {/* Source filter */}
          <Select value={filterSource} onValueChange={setFilterSource}>
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fb">🔵 Facebook</SelectItem>
              <SelectItem value="tiktok">🎵 TikTok</SelectItem>
              <SelectItem value="other">Altro</SelectItem>
              <SelectItem value="all">Tutte le sorgenti</SelectItem>
            </SelectContent>
          </Select>

          {/* Device filter */}
          <Select value={filterDevice} onValueChange={setFilterDevice}>
            <SelectTrigger className="w-[120px] h-9">
              <SelectValue placeholder="Device" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti i device</SelectItem>
              <SelectItem value="mobile">Mobile</SelectItem>
              <SelectItem value="tablet">Tablet</SelectItem>
              <SelectItem value="desktop">Desktop</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="icon" className="h-9 w-9" onClick={fetchEvents}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button variant="outline" size="icon" className="h-9 w-9" onClick={handleExport}>
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map(k => (
          <Card key={k.label} className="shadow-card border-border/50">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] text-muted-foreground">{k.label}</p>
                  <p className="text-xl font-bold text-foreground mt-1">{loading ? "…" : k.value}</p>
                </div>
                <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                  <k.icon className={`h-4 w-4 ${k.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* === LEAD-FUNNEL CORRELATION TABLE === */}
      <Card className="shadow-card border-border/50">
        <CardHeader>
          <CardTitle className="font-serif text-base flex items-center gap-2">
            <User className="h-4 w-4" /> Lead & Percorso Funnel
          </CardTitle>
          <CardDescription>
            {fbLeads.length} lead ricevuti · {leadsInFunnel} hanno visitato il funnel · {leadsCompleted} completato · {leadsWithCta} CTA click
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-32 flex items-center justify-center text-muted-foreground animate-pulse">Caricamento...</div>
          ) : fbLeads.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Nessun lead Facebook nel periodo selezionato.
            </p>
          ) : (
            <div className="space-y-1">
              {/* Summary header row */}
              <div className="hidden sm:grid sm:grid-cols-[2fr_repeat(10,1fr)_80px] gap-0.5 px-3 py-2 text-[10px] text-muted-foreground font-medium uppercase tracking-wider border-b">
                <span>Lead</span>
                {STEP_LABELS.map(s => <span key={s} className="text-center truncate">{s}</span>)}
                <span className="text-center">Stato</span>
              </div>

              {leadFunnelData.map(item => {
                const isExpanded = expandedLead === item.lead.id;
                const displayName = item.lead.full_name || item.lead.email || item.lead.phone || "Sconosciuto";

                return (
                  <div key={item.lead.id} className="border border-border/40 rounded-lg overflow-hidden">
                    <button
                      className="w-full flex items-center sm:grid sm:grid-cols-[2fr_repeat(10,1fr)_80px] gap-0.5 px-3 py-2.5 hover:bg-secondary/50 transition-colors text-left"
                      onClick={() => setExpandedLead(isExpanded ? null : item.lead.id)}
                    >
                      {/* Lead name - mobile & desktop */}
                      <div className="flex items-center gap-2 min-w-0 flex-1 sm:flex-none">
                        <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <User className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{displayName}</p>
                          <p className="text-[10px] text-muted-foreground sm:hidden">
                            {item.enteredFunnel ? `Step ${item.maxStep + 1}/10` : "Non entrato"}
                          </p>
                        </div>
                      </div>

                      {/* Step indicators - desktop only */}
                      {STEP_LABELS.map((_, i) => {
                        const reached = item.enteredFunnel && i <= item.maxStep;
                        const isCta = i === 9 && item.hasCta;
                        return (
                          <div key={i} className="hidden sm:flex items-center justify-center">
                            <div className={`h-3 w-3 rounded-full ${
                              isCta ? "bg-emerald-500" :
                              reached ? "bg-primary" : "bg-border"
                            }`} />
                          </div>
                        );
                      })}

                      {/* Status badge */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {!item.enteredFunnel ? (
                          <Badge variant="outline" className="text-[10px]">Non entrato</Badge>
                        ) : item.hasCta ? (
                          <Badge variant="default" className="text-[10px] bg-emerald-600">CTA ✓</Badge>
                        ) : item.maxStep >= 9 ? (
                          <Badge variant="default" className="text-[10px]">Completato</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px]">Abbandonato</Badge>
                        )}
                        {isExpanded ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
                      </div>
                    </button>

                    {/* Expanded details */}
                    {isExpanded && (
                      <div className="border-t border-border/50 p-3 bg-secondary/20 space-y-3">
                        {/* Contact info */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                          {item.lead.full_name && (
                            <div><span className="text-muted-foreground">Nome:</span> <span className="font-medium text-foreground">{item.lead.full_name}</span></div>
                          )}
                          {item.lead.phone && (
                            <div className="flex items-center gap-1"><Phone className="h-3 w-3 text-muted-foreground" /> <span className="font-medium text-foreground">{item.lead.phone}</span></div>
                          )}
                          {item.lead.email && (
                            <div className="flex items-center gap-1"><Mail className="h-3 w-3 text-muted-foreground" /> <span className="font-medium text-foreground">{item.lead.email}</span></div>
                          )}
                          {item.enteredFunnel && (
                            <div className="flex items-center gap-1"><Clock className="h-3 w-3 text-muted-foreground" /> <span className="font-medium text-foreground">{formatDuration(item.totalDuration)}</span></div>
                          )}
                        </div>

                        {/* Step progress bar */}
                        {item.enteredFunnel && (
                          <>
                            <div className="flex gap-1">
                              {STEP_LABELS.map((label, i) => {
                                const reached = i <= item.maxStep;
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
                              <p className="text-xs text-muted-foreground font-medium">{item.sessions.size} sessione/i</p>
                              {Array.from(item.sessions.entries()).map(([sid, evts]) => {
                                const sorted = [...evts].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
                                const first = sorted[0];
                                const date = format(new Date(first.created_at), "dd/MM HH:mm", { locale: it });
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
                          </>
                        )}

                        {!item.enteredFunnel && (
                          <p className="text-xs text-muted-foreground italic">
                            Questo lead non ha visitato il funnel nel periodo selezionato.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Funnel Drop-off */}
      <Card className="shadow-card border-border/50">
        <CardHeader>
          <CardTitle className="font-serif text-base">Drop-off per Step</CardTitle>
          <CardDescription>Sessioni che raggiungono ogni step del funnel</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-64 flex items-center justify-center text-muted-foreground animate-pulse">Caricamento...</div>
          ) : (
            <ResponsiveContainer width="100%" height={isMobile ? 260 : 320}>
              <BarChart data={funnelData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="step"
                  tick={{ fontSize: isMobile ? 9 : 11, fill: "hsl(var(--muted-foreground))" }}
                  angle={isMobile ? -45 : 0}
                  textAnchor={isMobile ? "end" : "middle"}
                  height={isMobile ? 60 : 30}
                />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [v, "Sessioni"]} />
                <Bar dataKey="sessions" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
          {!loading && totalSessions > 0 && (
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-1 mt-4">
              {funnelData.map((s, i) => (
                <div key={i} className="text-center">
                  <p className="text-[10px] text-muted-foreground truncate">{s.step}</p>
                  <p className="text-xs font-bold text-foreground">{s.pct}%</p>
                  {i > 0 && Number(s.dropoff) > 0 && (
                    <p className="text-[10px] text-destructive">-{s.dropoff}%</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Timeline */}
        <Card className="shadow-card border-border/50">
          <CardHeader>
            <CardTitle className="font-serif text-base">Trend Giornaliero</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground animate-pulse">Caricamento...</div>
            ) : timeline.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Nessun dato</p>
            ) : (
              <ResponsiveContainer width="100%" height={isMobile ? 200 : 240}>
                <AreaChart data={timeline}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area type="monotone" dataKey="sessions" stroke="hsl(var(--primary))" fill="hsl(var(--primary)/0.15)" name="Sessioni" />
                  <Area type="monotone" dataKey="completed" stroke="hsl(var(--accent))" fill="hsl(var(--accent)/0.15)" name="Completate" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Device Breakdown */}
        <Card className="shadow-card border-border/50">
          <CardHeader>
            <CardTitle className="font-serif text-base">Dispositivi</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground animate-pulse">Caricamento...</div>
            ) : deviceData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Nessun dato</p>
            ) : (
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <ResponsiveContainer width={isMobile ? "100%" : "50%"} height={180}>
                  <PieChart>
                    <Pie data={deviceData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {deviceData.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-3 flex-1">
                  {deviceData.map(d => (
                    <div key={d.name} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <d.Icon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-foreground">{d.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-medium text-foreground">{d.value}</span>
                        <span className="text-xs text-muted-foreground ml-2">({d.rate}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* UTM Source Breakdown */}
      <Card className="shadow-card border-border/50">
        <CardHeader>
          <CardTitle className="font-serif text-base">Sorgenti di Traffico</CardTitle>
          <CardDescription>Performance per UTM source</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-32 flex items-center justify-center text-muted-foreground animate-pulse">Caricamento...</div>
          ) : sourceData.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nessun dato</p>
          ) : isMobile ? (
            <div className="space-y-3">
              {sourceData.map(s => (
                <div key={s.source} className="p-3 rounded-lg bg-secondary/50 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm text-foreground">{s.source}</span>
                    <Badge variant="secondary" className="text-xs">{s.sessions} sessioni</Badge>
                  </div>
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span>Completamento: <strong className="text-foreground">{s.completionRate}%</strong></span>
                    <span>CTA: <strong className="text-foreground">{s.ctaRate}%</strong></span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sorgente</TableHead>
                  <TableHead className="text-center">Sessioni</TableHead>
                  <TableHead className="text-center">Completate</TableHead>
                  <TableHead className="text-center">% Completamento</TableHead>
                  <TableHead className="text-center">CTA Click</TableHead>
                  <TableHead className="text-center">% CTA</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sourceData.map(s => (
                  <TableRow key={s.source}>
                    <TableCell className="font-medium">{s.source}</TableCell>
                    <TableCell className="text-center">{s.sessions}</TableCell>
                    <TableCell className="text-center">{s.completed}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={Number(s.completionRate) > 30 ? "default" : "secondary"} className="text-xs">
                        {s.completionRate}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">{s.cta}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={Number(s.ctaRate) > 20 ? "default" : "secondary"} className="text-xs">
                        {s.ctaRate}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
