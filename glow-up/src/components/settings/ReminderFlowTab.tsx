import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Workflow, BarChart3, CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import ReminderFlowDiagram from "./ReminderFlowDiagram";
import ReminderFlowAnalytics from "./ReminderFlowAnalytics";
import ReminderFlowQueue from "./ReminderFlowQueue";
import SmsTemplateEditor from "./SmsTemplateEditor";
import { useState } from "react";

export default function ReminderFlowTab() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string>("");

  const { data: models, isLoading } = useQuery({
    queryKey: ["reminder-flow-models"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reminder_flow_models")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const activateModel = useMutation({
    mutationFn: async (modelId: string) => {
      // Deactivate all models first
      const { error: deactErr } = await supabase
        .from("reminder_flow_models")
        .update({ is_active: false })
        .neq("id", modelId);
      if (deactErr) throw deactErr;
      // Activate selected
      const { error } = await supabase
        .from("reminder_flow_models")
        .update({ is_active: true })
        .eq("id", modelId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reminder-flow-models"] });
      toast.success(t("reminderFlow.activated", "Flusso attivato con successo"));
    },
    onError: () => {
      toast.error(t("reminderFlow.activateError", "Errore nell'attivazione del flusso"));
    },
  });

  const activeModel = models?.find((m: any) => m.is_active);
  const currentId = selectedId || activeModel?.id || "";
  const currentModel = models?.find((m: any) => m.id === currentId) || activeModel;
  const isCurrentActive = currentModel?.is_active;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Model selector */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="font-serif flex items-center gap-2">
                <Workflow className="h-5 w-5 text-primary" />
                {t("reminderFlow.title", "Flussi Reminder")}
              </CardTitle>
              <CardDescription className="mt-1">
                {t("reminderFlow.subtitle", "Visualizza e gestisci il modello di promemoria attivo per i tuoi appuntamenti.")}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={currentId} onValueChange={setSelectedId}>
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder={t("reminderFlow.selectModel", "Seleziona modello")} />
                </SelectTrigger>
                <SelectContent>
                  {models?.map((m: any) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                      {m.is_active && " ✓"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isCurrentActive ? (
                <Badge className="bg-green-100 text-green-700 border-green-200">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  {t("common.active", "Attivo")}
                </Badge>
              ) : currentModel && (
                <Button
                  size="sm"
                  onClick={() => activateModel.mutate(currentModel.id)}
                  disabled={activateModel.isPending}
                >
                  {activateModel.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-1" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 mr-1" />
                  )}
                  {t("reminderFlow.activate", "Attiva questo flusso")}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {currentModel?.description && (
            <p className="text-sm text-muted-foreground mb-4">{currentModel.description}</p>
          )}
          <ReminderFlowDiagram flowConfig={currentModel?.flow_config as any} modelId={currentModel?.id} />
        </CardContent>
      </Card>

      {/* SMS Template Editor */}
      <SmsTemplateEditor model={currentModel as any} />

      {/* Queue */}
      <ReminderFlowQueue />

      {/* Analytics */}
      <div>
        <h3 className="text-lg font-serif font-semibold flex items-center gap-2 mb-4">
          <BarChart3 className="h-5 w-5 text-primary" />
          {t("reminderFlow.analytics", "Analytics")}
        </h3>
        <ReminderFlowAnalytics />
      </div>
    </div>
  );
}
