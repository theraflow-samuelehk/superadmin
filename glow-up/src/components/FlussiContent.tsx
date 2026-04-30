import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Loader2, Workflow, BarChart3, CheckCircle2, ChevronDown, MessageSquareText, ListChecks, Star, Info } from "lucide-react";
import ReminderFlowDiagram from "@/components/settings/ReminderFlowDiagram";
import ReminderFlowAnalytics from "@/components/settings/ReminderFlowAnalytics";
import ReminderFlowQueue from "@/components/settings/ReminderFlowQueue";
import SmsTemplateEditor from "@/components/settings/SmsTemplateEditor";
import { useTenantUserId } from "@/hooks/useTenantUserId";
import { useNavigate } from "react-router-dom";

export default function FlussiContent() {
  const { t } = useTranslation();
  const { isSuperAdmin } = useAuth();
  const { tenantUserId } = useTenantUserId();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string>("");
  const [flowOpen, setFlowOpen] = useState(false);
  const [smsOpen, setSmsOpen] = useState(false);
  const [queueOpen, setQueueOpen] = useState(false);

  // Check if user has premium automatic reminders enabled
  const { data: integrations, isLoading: intLoading } = useQuery({
    queryKey: ["salon-integrations", tenantUserId],
    queryFn: async () => {
      if (!tenantUserId) return null;
      const { data } = await supabase
        .from("salon_integrations")
        .select("whatsapp_enabled, sms_enabled")
        .eq("user_id", tenantUserId)
        .maybeSingle();
      return data;
    },
    enabled: !!tenantUserId && !isSuperAdmin,
  });

  const hasPremiumReminders = isSuperAdmin || integrations?.whatsapp_enabled || integrations?.sms_enabled;

  const { data: models, isLoading } = useQuery({
    queryKey: ["reminder-flow-models"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reminder_flow_models")
        .select("*");
      if (error) throw error;
      return (data || []).sort((a: any, b: any) => {
        const aIsGP = a.name?.toLowerCase().includes("glowup");
        const bIsGP = b.name?.toLowerCase().includes("glowup");
        if (aIsGP && !bIsGP) return 1;
        if (!aIsGP && bIsGP) return -1;
        return (a.name || "").localeCompare(b.name || "");
      });
    },
  });

  const activateModel = useMutation({
    mutationFn: async (modelId: string) => {
      const { error: deactErr } = await supabase
        .from("reminder_flow_models")
        .update({ is_active: false })
        .neq("id", modelId);
      if (deactErr) throw deactErr;
      const { error } = await supabase
        .from("reminder_flow_models")
        .update({ is_active: true })
        .eq("id", modelId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reminder-flow-models"] });
      toast.success(
        isSuperAdmin
          ? t("reminderFlow.setAsStandard", "Flusso impostato come standard per i nuovi centri")
          : t("reminderFlow.activated", "Flusso attivato con successo")
      );
    },
    onError: () => {
      toast.error(t("reminderFlow.activateError", "Errore nell'attivazione del flusso"));
    },
  });

  const activeModel = models?.find((m: any) => m.is_active);
  const currentId = selectedId || activeModel?.id || "";
  const currentModel = models?.find((m: any) => m.id === currentId) || activeModel;
  const isCurrentActive = currentModel?.is_active;

  if (isLoading || intLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!hasPremiumReminders) {
    navigate("/reminder-whatsapp", { replace: true });
    return null;
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-serif font-bold text-foreground flex items-center gap-2">
          <Workflow className="h-6 w-6 text-primary" />
          {t("reminderFlow.pageTitle", "Flussi")}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t("reminderFlow.pageSubtitle", "Gestisci i modelli di promemoria, i template SMS e monitora la coda notifiche.")}
        </p>
      </div>

      {/* ─── FLOW MODEL SELECTOR ─── */}
      <Collapsible open={flowOpen} onOpenChange={setFlowOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Workflow className="h-5 w-5 text-primary" />
                    <CardTitle className="font-serif text-base">
                      {t("reminderFlow.title", "Flussi Reminder")}
                    </CardTitle>
                  </div>
                  {activeModel && (
                    <Badge variant="outline" className="text-xs font-normal">
                      {activeModel.name}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {isCurrentActive && (
                    <Badge className={isSuperAdmin
                      ? "bg-primary/10 text-primary border-primary/20 text-xs"
                      : "bg-green-100 text-green-700 border-green-200 text-xs"
                    }>
                      {isSuperAdmin ? (
                        <><Star className="w-3 h-3 mr-1" />{t("reminderFlow.standard", "Standard")}</>
                      ) : (
                        <><CheckCircle2 className="w-3 h-3 mr-1" />{t("common.active", "Attivo")}</>
                      )}
                    </Badge>
                  )}
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${flowOpen ? "rotate-180" : ""}`} />
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0 space-y-4">
              {isSuperAdmin && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/40 border border-border/50">
                  <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <p className="text-xs text-muted-foreground">
                    {t("reminderFlow.standardExplanation", "Il flusso standard viene pre-assegnato ai nuovi centri che si registrano. I centri esistenti mantengono il flusso attualmente in uso e possono cambiarlo autonomamente.")}
                  </p>
                </div>
              )}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <Select value={currentId} onValueChange={setSelectedId}>
                  <SelectTrigger className="w-full sm:w-[240px]">
                    <SelectValue placeholder={t("reminderFlow.selectModel", "Seleziona modello")} />
                  </SelectTrigger>
                  <SelectContent>
                    {models?.map((m: any) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name}
                        {m.is_active && (isSuperAdmin ? " ★" : " ✓")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!isCurrentActive && currentModel && (
                  <Button
                    size="sm"
                    onClick={() => activateModel.mutate(currentModel.id)}
                    disabled={activateModel.isPending}
                  >
                    {activateModel.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-1" />
                    ) : isSuperAdmin ? (
                      <Star className="w-4 h-4 mr-1" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                    )}
                    {isSuperAdmin
                      ? t("reminderFlow.setStandard", "Imposta come standard")
                      : t("reminderFlow.activate", "Attiva questo flusso")}
                  </Button>
                )}
              </div>
              {currentModel?.description && (
                <p className="text-sm text-muted-foreground">{currentModel.description}</p>
              )}
              <ReminderFlowDiagram
                flowConfig={currentModel?.flow_config as any}
                modelId={currentModel?.id}
                readOnly={!isSuperAdmin}
              />
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* ─── NOTIFICATION TEMPLATES ─── */}
      <Collapsible open={smsOpen} onOpenChange={setSmsOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquareText className="h-5 w-5 text-primary" />
                  <CardTitle className="font-serif text-base">
                    {t("reminderFlow.notificationTemplates", "Template Notifiche")}
                  </CardTitle>
                </div>
                <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${smsOpen ? "rotate-180" : ""}`} />
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0">
              <SmsTemplateEditor model={currentModel as any} readOnly={!isSuperAdmin} />
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* ─── NOTIFICATION QUEUE ─── */}
      <Collapsible open={queueOpen} onOpenChange={setQueueOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ListChecks className="h-5 w-5 text-primary" />
                  <CardTitle className="font-serif text-base">
                    {t("reminderFlow.queue", "Coda Notifiche")}
                  </CardTitle>
                </div>
                <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${queueOpen ? "rotate-180" : ""}`} />
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0">
              <ReminderFlowQueue />
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* ─── ANALYTICS ─── */}
      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-base flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            {t("reminderFlow.analytics", "Analytics")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ReminderFlowAnalytics />
        </CardContent>
      </Card>
    </div>
  );
}
