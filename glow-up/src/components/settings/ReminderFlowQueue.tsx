import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, ListOrdered, CheckCircle2, Clock, AlertTriangle, Send, MessageSquare, Smartphone, Bell, Store } from "lucide-react";
import { useTranslation } from "react-i18next";
import { format, parseISO, isPast } from "date-fns";
import { it } from "date-fns/locale";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

interface FlowNode {
  id: string;
  node_type: string;
  message_key: string | null;
  status: string;
  scheduled_at: string;
  push_sent_at: string | null;
  push_delivered_at: string | null;
  whatsapp_sent_at: string | null;
  whatsapp_delivered_at: string | null;
  sms_sent_at: string | null;
  sms_delivered_at: string | null;
  only_if_confirmed: boolean;
  only_if_no_response: boolean;
  flow: {
    id: string;
    status: string;
    client_action: string | null;
    flow_case: string;
    appointment_id: string;
    user_id: string;
    appointment: {
      start_time: string;
      end_time: string;
      user_id: string;
      client: { first_name: string; last_name: string | null; phone: string | null } | null;
    } | null;
  };
  salon_name?: string;
}

const statusConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  pending: { icon: Clock, color: "bg-amber-100 text-amber-700 border-amber-200", label: "In attesa" },
  in_progress: { icon: Send, color: "bg-blue-100 text-blue-700 border-blue-200", label: "In corso" },
  completed: { icon: CheckCircle2, color: "bg-green-100 text-green-700 border-green-200", label: "Completato" },
};

const nodeTypeLabels: Record<string, string> = {
  immediate_confirmation: "Conferma",
  reminder: "Promemoria",
  day_before: "Giorno prima",
  hours_before: "Ore prima",
  admin_escalation: "Escalation Admin",
  mid_treatment_link: "Link App",
};

function ChannelIcon({ pushDelivered, waDelivered, smsDelivered, waSent, smsSent }: {
  pushDelivered: string | null;
  waDelivered: string | null;
  smsDelivered: string | null;
  waSent: string | null;
  smsSent: string | null;
  status: string;
}) {
  const icons: React.ReactNode[] = [];

  if (pushDelivered) {
    icons.push(
      <span key="push" title={`Push consegnata · ${format(parseISO(pushDelivered), "HH:mm:ss")}`}>
        <Bell className="h-4 w-4 text-green-600 fill-green-600/15" />
      </span>
    );
  }

  if (waDelivered) {
    icons.push(
      <span key="wa-d" title={`WhatsApp consegnato · ${format(parseISO(waDelivered), "HH:mm:ss")}`}>
        <MessageSquare className="h-4 w-4 text-green-600 fill-green-600/15" />
      </span>
    );
  } else if (waSent) {
    icons.push(
      <span key="wa-s" title={`WhatsApp inviato · ${format(parseISO(waSent), "HH:mm:ss")}`}>
        <MessageSquare className="h-4 w-4 text-green-500 fill-green-500/10" />
      </span>
    );
  }

  if (smsDelivered) {
    icons.push(
      <span key="sms-d" title={`SMS consegnato · ${format(parseISO(smsDelivered), "HH:mm:ss")}`}>
        <Smartphone className="h-4 w-4 text-amber-500 fill-amber-500/15" />
      </span>
    );
  } else if (smsSent) {
    icons.push(
      <span key="sms-s" title={`SMS inviato · ${format(parseISO(smsSent), "HH:mm:ss")}`}>
        <Smartphone className="h-4 w-4 text-amber-500 fill-amber-500/10" />
      </span>
    );
  }

  if (icons.length > 0) {
    return <span className="flex items-center gap-0.5">{icons}</span>;
  }

  return <span className="text-muted-foreground/40">—</span>;
}

export default function ReminderFlowQueue() {
  const { t } = useTranslation();
  const { isSuperAdmin } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: nodes, isLoading } = useQuery({
    queryKey: ["reminder-flow-queue"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reminder_flow_nodes")
        .select(`
          id, node_type, message_key, status, scheduled_at,
          push_sent_at, push_delivered_at, whatsapp_sent_at, whatsapp_delivered_at, sms_sent_at, sms_delivered_at,
          only_if_confirmed, only_if_no_response,
          flow:reminder_flows!inner(
            id, status, client_action, flow_case, appointment_id, user_id,
            appointment:appointments!reminder_flows_appointment_id_fkey(
              start_time,
              end_time,
              user_id,
              client:clients(first_name, last_name, phone)
            )
          )
        `)
        .in("status", ["pending", "in_progress", "completed"])
        .in("flow.status", ["active", "completed", "cancelled"])
        .order("scheduled_at", { ascending: false })
        .limit(200);
      if (error) throw error;

      const rawNodes = (data || []) as unknown as FlowNode[];

      // For super admin, fetch salon names
      if (isSuperAdmin && rawNodes.length > 0) {
        const userIds = [...new Set(rawNodes.map(n => {
          const flow = n.flow as any;
          return flow?.user_id || flow?.appointment?.user_id;
        }).filter(Boolean))];

        if (userIds.length > 0) {
          const { data: profiles } = await supabase
            .from("profiles")
            .select("user_id, salon_name")
            .in("user_id", userIds);

          const nameMap = new Map<string, string>();
          (profiles || []).forEach((p: any) => {
            nameMap.set(p.user_id, p.salon_name || "—");
          });

          rawNodes.forEach(n => {
            const flow = n.flow as any;
            const uid = flow?.user_id || flow?.appointment?.user_id;
            n.salon_name = nameMap.get(uid) || "—";
          });
        }
      }

      return rawNodes;
    },
    refetchInterval: 30000,
  });

  const filtered = nodes?.filter((n) => {
    if (statusFilter === "all") return true;
    if (statusFilter === "pending") return n.status === "pending" || n.status === "in_progress";
    return n.status === statusFilter;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-24">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  const pendingCount = nodes?.filter((n) => n.status === "pending" || n.status === "in_progress").length || 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="font-serif flex items-center gap-2">
              <ListOrdered className="h-5 w-5 text-primary" />
              {t("reminderFlow.queue", "Coda Notifiche")}
              {pendingCount > 0 && (
                <Badge className="bg-amber-100 text-amber-700 border-amber-200 ml-1">{pendingCount}</Badge>
              )}
            </CardTitle>
            <CardDescription className="mt-1">
              {t("reminderFlow.queueDesc", "Tutti i messaggi programmati dei flussi attivi.")}
            </CardDescription>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("common.all", "Tutti")}</SelectItem>
              <SelectItem value="pending">{t("reminderFlow.queuePending", "Da inviare")}</SelectItem>
              <SelectItem value="completed">{t("reminderFlow.queueCompleted", "Completati")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {!filtered || filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            {t("reminderFlow.queueEmpty", "Nessun messaggio in coda.")}
          </p>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="space-y-1.5 sm:hidden">
              {filtered.map((node) => {
                const s = statusConfig[node.status] || statusConfig.pending;
                const Icon = s.icon;
                const flow = node.flow as any;
                const apt = flow?.appointment;
                const client = apt?.client;
                const isOverdue = node.status === "pending" && isPast(parseISO(node.scheduled_at));
                return (
                  <div key={node.id} className={`px-2.5 py-2 rounded-lg border ${isOverdue ? "border-destructive/50 bg-destructive/5" : "border-border/50"}`}>
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Icon className={`h-3.5 w-3.5 shrink-0 ${s.color.includes("amber") ? "text-amber-600" : s.color.includes("green") ? "text-green-600" : s.color.includes("blue") ? "text-blue-600" : "text-muted-foreground"}`} />
                        <span className="text-sm font-medium truncate">{client?.first_name} {client?.last_name || ""}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <ChannelIcon pushDelivered={node.push_delivered_at} waDelivered={node.whatsapp_delivered_at} smsDelivered={node.sms_delivered_at} waSent={node.whatsapp_sent_at} smsSent={node.sms_sent_at} status={node.status} />
                        <span className={`text-[11px] ${isOverdue ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                          {format(parseISO(node.scheduled_at), "dd/MM HH:mm", { locale: it })}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-muted-foreground">
                      {isSuperAdmin && node.salon_name && (
                        <>
                          <span className="flex items-center gap-0.5">
                            <Store className="h-3 w-3" />
                            {node.salon_name}
                          </span>
                          <span>·</span>
                        </>
                      )}
                      <span>{nodeTypeLabels[node.node_type] || node.node_type}</span>
                      <span>·</span>
                      <span>{flow?.flow_case}</span>
                      {apt && <><span>·</span><span>Apt {format(parseISO(apt.start_time), "dd/MM HH:mm", { locale: it })}</span></>}
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
                    <TableHead>{t("common.status", "Stato")}</TableHead>
                    {isSuperAdmin && <TableHead>{t("common.center", "Centro")}</TableHead>}
                    <TableHead>{t("common.client", "Cliente")}</TableHead>
                    <TableHead>{t("reminderFlow.nodeType", "Tipo")}</TableHead>
                    <TableHead>{t("reminderFlow.case", "Caso")}</TableHead>
                    <TableHead>{t("reminderFlow.scheduledAt", "Programmato")}</TableHead>
                    <TableHead>{t("reminderFlow.aptTime", "Appuntamento")}</TableHead>
                    <TableHead>{t("reminderFlow.channel", "Canale")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((node) => {
                    const s = statusConfig[node.status] || statusConfig.pending;
                    const Icon = s.icon;
                    const flow = node.flow as any;
                    const apt = flow?.appointment;
                    const client = apt?.client;
                    const isOverdue = node.status === "pending" && isPast(parseISO(node.scheduled_at));
                    return (
                      <TableRow key={node.id} className={`${isOverdue ? "bg-destructive/5" : ""} h-9`}>
                        <TableCell className="py-1.5">
                          <Badge className={`text-[11px] px-1.5 py-0 ${s.color}`}>
                            <Icon className="h-3 w-3 mr-0.5" />{s.label}
                          </Badge>
                        </TableCell>
                        {isSuperAdmin && (
                          <TableCell className="text-xs py-1.5">
                            <span className="flex items-center gap-1">
                              <Store className="h-3 w-3 text-muted-foreground" />
                              {node.salon_name || "—"}
                            </span>
                          </TableCell>
                        )}
                        <TableCell className="font-medium text-sm py-1.5">
                          {client?.first_name} {client?.last_name || ""}
                        </TableCell>
                        <TableCell className="text-xs py-1.5">{nodeTypeLabels[node.node_type] || node.node_type}</TableCell>
                        <TableCell className="py-1.5">
                          <Badge variant="outline" className="text-[11px] px-1.5 py-0">{flow?.flow_case}</Badge>
                        </TableCell>
                        <TableCell className="text-xs py-1.5">
                          <span className={isOverdue ? "text-destructive font-medium" : ""}>
                            {format(parseISO(node.scheduled_at), "dd/MM HH:mm", { locale: it })}
                          </span>
                          {isOverdue && <AlertTriangle className="h-3 w-3 text-destructive inline ml-1" />}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground py-1.5">
                          {apt ? format(parseISO(apt.start_time), "dd/MM HH:mm", { locale: it }) : "-"}
                        </TableCell>
                        <TableCell className="py-1.5">
                          <ChannelIcon pushDelivered={node.push_delivered_at} waDelivered={node.whatsapp_delivered_at} smsDelivered={node.sms_delivered_at} waSent={node.whatsapp_sent_at} smsSent={node.sms_sent_at} status={node.status} />
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
  );
}
