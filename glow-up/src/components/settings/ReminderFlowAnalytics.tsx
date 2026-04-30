import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingUp, CheckCircle, XCircle, AlertTriangle, MessageSquare, Phone, Bell } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";

interface FlowStats {
  total: number;
  confirmed: number;
  cancelled: number;
  pending: number;
  escalated: number;
  byCaseA: number;
  byCaseB: number;
  byCaseC: number;
  byCaseD: number;
  byCaseE: number;
  pushSent: number;
  whatsappSent: number;
  smsSent: number;
}

export default function ReminderFlowAnalytics() {
  const { t } = useTranslation();
  const { user } = useAuth();

  const { data: stats, isLoading } = useQuery<FlowStats>({
    queryKey: ["reminder-flow-analytics", user?.id],
    queryFn: async () => {
      // Fetch flows
      const { data: flows } = await supabase
        .from("reminder_flows")
        .select("id, flow_case, status, client_action");

      // Fetch nodes
      const { data: flowNodes } = await supabase
        .from("reminder_flow_nodes")
        .select("push_sent_at, whatsapp_sent_at, sms_sent_at, status, node_type");

      const f = flows || [];
      const n = flowNodes || [];

      return {
        total: f.length,
        confirmed: f.filter(fl => fl.client_action === "confirmed").length,
        cancelled: f.filter(fl => fl.client_action === "cancelled").length,
        pending: f.filter(fl => fl.status === "active").length,
        escalated: f.filter(fl => fl.status === "escalated").length,
        byCaseA: f.filter(fl => fl.flow_case === "A").length,
        byCaseB: f.filter(fl => fl.flow_case === "B").length,
        byCaseC: f.filter(fl => fl.flow_case === "C").length,
        byCaseD: f.filter(fl => fl.flow_case === "D").length,
        byCaseE: f.filter(fl => fl.flow_case === "E").length,
        pushSent: n.filter(nd => nd.push_sent_at).length,
        whatsappSent: n.filter(nd => nd.whatsapp_sent_at).length,
        smsSent: n.filter(nd => nd.sms_sent_at).length,
      };
    },
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!stats || stats.total === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-8 text-center text-muted-foreground">
          <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-40" />
          <p className="font-medium">{t("reminderFlow.noData", "Nessun dato disponibile")}</p>
          <p className="text-sm mt-1">{t("reminderFlow.noDataDesc", "Le statistiche appariranno quando i flussi di promemoria saranno attivi.")}</p>
        </CardContent>
      </Card>
    );
  }

  const confirmRate = stats.total > 0 ? Math.round((stats.confirmed / stats.total) * 100) : 0;
  const cancelRate = stats.total > 0 ? Math.round((stats.cancelled / stats.total) * 100) : 0;
  const escalationRate = stats.total > 0 ? Math.round((stats.escalated / stats.total) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Main KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground font-medium">{t("reminderFlow.totalFlows", "Flussi totali")}</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-xs text-muted-foreground font-medium">{t("reminderFlow.confirmRate", "Tasso conferma")}</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{confirmRate}%</p>
            <p className="text-xs text-muted-foreground">{stats.confirmed} {t("reminderFlow.of", "su")} {stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2 mb-1">
              <XCircle className="h-4 w-4 text-red-500" />
              <span className="text-xs text-muted-foreground font-medium">{t("reminderFlow.cancelRate", "Tasso annullamento")}</span>
            </div>
            <p className="text-2xl font-bold text-red-600">{cancelRate}%</p>
            <p className="text-xs text-muted-foreground">{stats.cancelled} {t("reminderFlow.of", "su")} {stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <span className="text-xs text-muted-foreground font-medium">{t("reminderFlow.escalationRate", "Escalation")}</span>
            </div>
            <p className="text-2xl font-bold text-amber-600">{escalationRate}%</p>
            <p className="text-xs text-muted-foreground">{stats.escalated} {t("reminderFlow.of", "su")} {stats.total}</p>
          </CardContent>
        </Card>
      </div>

      {/* Distribution and channels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Case distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t("reminderFlow.caseDistribution", "Distribuzione per caso")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { label: "Caso A (>24h)", count: stats.byCaseA, color: "bg-blue-500" },
              { label: "Caso B (12-24h)", count: stats.byCaseB, color: "bg-sky-500" },
              { label: "Caso C (4-12h)", count: stats.byCaseC, color: "bg-amber-500" },
              { label: "Caso D (2-4h)", count: stats.byCaseD, color: "bg-orange-500" },
              { label: "Caso E (<2h)", count: stats.byCaseE, color: "bg-gray-400" },
            ].map(c => {
              const pct = stats.total > 0 ? Math.round((c.count / stats.total) * 100) : 0;
              return (
                <div key={c.label} className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-28 shrink-0">{c.label}</span>
                  <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                    <div className={`h-full ${c.color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                  </div>
                  <Badge variant="outline" className="text-xs min-w-[3rem] justify-center">{c.count}</Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Channel effectiveness */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t("reminderFlow.channelEffectiveness", "Messaggi per canale")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { icon: Bell, label: "Push", count: stats.pushSent, color: "text-blue-500" },
              { icon: MessageSquare, label: "WhatsApp", count: stats.whatsappSent, color: "text-green-500" },
              { icon: Phone, label: "SMS", count: stats.smsSent, color: "text-purple-500" },
            ].map(ch => (
              <div key={ch.label} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                <ch.icon className={`h-5 w-5 ${ch.color}`} />
                <span className="text-sm font-medium flex-1">{ch.label}</span>
                <span className="text-lg font-bold">{ch.count}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
