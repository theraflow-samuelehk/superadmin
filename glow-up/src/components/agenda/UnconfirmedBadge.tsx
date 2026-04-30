import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffectiveUserId } from "@/hooks/useEffectiveUserId";
import { AlertTriangle, Phone, X, CheckCircle2, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { toast } from "sonner";

interface UnconfirmedItem {
  id: string;
  appointment_id: string;
  escalated_at: string;
  resolved: boolean;
  resolution: string | null;
  appointment: {
    id: string;
    start_time: string;
    end_time: string;
    status: string;
    clients: { first_name: string; last_name: string } | null;
    services: { name: string } | null;
    operators: { name: string; calendar_color: string } | null;
  } | null;
}

export default function UnconfirmedBadge() {
  const { t } = useTranslation();
  const effectiveUserId = useEffectiveUserId();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: items = [] } = useQuery({
    queryKey: ["unconfirmed-appointments", effectiveUserId],
    queryFn: async () => {
      const { data } = await supabase
        .from("unconfirmed_appointments")
        .select(`
          id, appointment_id, escalated_at, resolved, resolution,
          appointments!inner(id, start_time, end_time, status,
            clients(first_name, last_name),
            services(name),
            operators(name, calendar_color)
          )
        `)
        .eq("user_id", effectiveUserId!)
        .eq("resolved", false)
        .order("escalated_at", { ascending: false });

      return (data || []).map((row: any) => ({
        ...row,
        appointment: row.appointments,
      })) as UnconfirmedItem[];
    },
    enabled: !!effectiveUserId,
    refetchInterval: 60_000,
  });

  const resolve = useMutation({
    mutationFn: async ({ id, resolution }: { id: string; resolution: string }) => {
      const { error } = await supabase
        .from("unconfirmed_appointments")
        .update({ resolved: true, resolved_at: new Date().toISOString(), resolution })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["unconfirmed-appointments"] });
      toast.success(t("agenda.unconfirmed.resolved"));
    },
  });

  const count = items.length;
  if (count === 0) return null;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className="relative flex items-center gap-1 px-2 py-1 rounded-lg bg-destructive/10 hover:bg-destructive/15 transition-colors">
          <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
          <span className="text-xs font-semibold text-destructive">{count}</span>
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            {t("agenda.unconfirmed.title")}
            <Badge variant="destructive" className="text-xs">{count}</Badge>
          </SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-3 overflow-y-auto max-h-[calc(100vh-120px)]">
          {items.map((item) => {
            const apt = item.appointment;
            if (!apt) return null;
            const operatorColor = apt.operators?.calendar_color || "hsl(var(--primary))";
            return (
              <div key={item.id} className="rounded-xl border border-border/50 p-3 space-y-2 bg-card shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-foreground truncate">
                      {apt.clients ? `${apt.clients.first_name} ${apt.clients.last_name}` : "—"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{apt.services?.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(apt.start_time), "EEEE d MMM · HH:mm", { locale: it })}
                    </p>
                    {apt.operators && (
                      <div className="flex items-center gap-1 mt-1">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: operatorColor }} />
                        <span className="text-[11px] text-muted-foreground">{apt.operators.name}</span>
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                    {format(new Date(item.escalated_at), "HH:mm")}
                  </span>
                </div>
                <div className="flex gap-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 h-7 text-xs gap-1"
                    onClick={() => resolve.mutate({ id: item.id, resolution: "called" })}
                  >
                    <Phone className="h-3 w-3" />
                    {t("agenda.unconfirmed.called")}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 h-7 text-xs gap-1 text-primary"
                    onClick={() => resolve.mutate({ id: item.id, resolution: "confirmed" })}
                  >
                    <CheckCircle2 className="h-3 w-3" />
                    {t("agenda.unconfirmed.confirm")}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 h-7 text-xs gap-1 text-destructive"
                    onClick={() => resolve.mutate({ id: item.id, resolution: "cancelled" })}
                  >
                    <X className="h-3 w-3" />
                    {t("agenda.unconfirmed.cancel")}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
