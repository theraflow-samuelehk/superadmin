import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTenantUserId } from "@/hooks/useTenantUserId";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useServiceProducts } from "@/hooks/useServiceProducts";

export type AppointmentStatus = "confirmed" | "in_progress" | "completed" | "cancelled" | "no_show";

export interface Appointment {
  id: string;
  user_id: string;
  client_id: string;
  service_id: string;
  operator_id: string;
  start_time: string;
  end_time: string;
  status: AppointmentStatus;
  notes: string | null;
  final_price: number | null;
  payment_method: string | null;
  contact_phone: string | null;
  client_confirmed: boolean;
  client_confirmed_at: string | null;
  client_rescheduled_at: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  clients?: { first_name: string; last_name: string; phone: string | null };
  services?: { name: string; duration_minutes: number; price: number };
  operators?: { name: string; calendar_color: string };
}

export type AppointmentInsert = {
  client_id: string | null;
  service_id: string;
  operator_id: string;
  start_time: string;
  end_time: string;
  status?: AppointmentStatus;
  notes?: string;
  final_price?: number;
  payment_method?: string;
  contact_phone?: string | null;
  package_id?: string | null;
};

export function useAppointments(dateRange?: { from: string; to: string }) {
  const { user } = useAuth();
  const { tenantUserId } = useTenantUserId();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { deductForService } = useServiceProducts();

  const resolvedUserId = tenantUserId;

  const appointmentsQuery = useQuery({
    queryKey: ["appointments", resolvedUserId, dateRange?.from, dateRange?.to],
    queryFn: async () => {
      let query = supabase
        .from("appointments")
        .select(`
          *,
          clients(first_name, last_name, phone),
          services(name, duration_minutes, price),
          operators(name, calendar_color)
        `)
        .eq("user_id", resolvedUserId!)
        .is("deleted_at", null)
        .order("start_time", { ascending: true });

      if (dateRange?.from) {
        query = query.gte("start_time", dateRange.from);
      }
      if (dateRange?.to) {
        query = query.lte("start_time", dateRange.to);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Appointment[];
    },
    enabled: !!user && !!resolvedUserId,
  });

  const checkConflict = async (
    operatorId: string,
    startTime: string,
    endTime: string,
    excludeId?: string
  ): Promise<boolean> => {
    // Add 1-minute tolerance to avoid false conflicts at boundaries
    // (handles sub-second precision in stored timestamps)
    const startWithTolerance = new Date(new Date(startTime).getTime() + 60000).toISOString();
    const endWithTolerance = new Date(new Date(endTime).getTime() - 60000).toISOString();

    let query = supabase
      .from("appointments")
      .select("id")
      .eq("operator_id", operatorId)
      .is("deleted_at", null)
      .not("status", "in", '("cancelled","no_show")')
      .lt("start_time", endWithTolerance)
      .gt("end_time", startWithTolerance);

    if (excludeId) {
      query = query.neq("id", excludeId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data?.length ?? 0) > 0;
  };

  const createAppointment = useMutation({
    mutationFn: async (appointment: AppointmentInsert) => {
      const conflict = await checkConflict(
        appointment.operator_id,
        appointment.start_time,
        appointment.end_time
      );
      if (conflict) {
        throw new Error(t("agenda.conflictError"));
      }

      const { data, error } = await supabase
        .from("appointments")
        .insert({ ...appointment, user_id: resolvedUserId! } as any)
        .select()
        .single();
      if (error) throw error;

      // If linked to a package, increment used_sessions
      if (appointment.package_id) {
        const { data: pkg } = await supabase
          .from("client_packages")
          .select("used_sessions, total_sessions")
          .eq("id", appointment.package_id)
          .single();
        if (pkg) {
          const newUsed = pkg.used_sessions + 1;
          const updates: any = { used_sessions: newUsed };
          if (newUsed >= pkg.total_sessions) updates.status = "completed";
          await supabase.from("client_packages").update(updates).eq("id", appointment.package_id);
        }
      }

      // Auto treatment stamp on booking
      try {
        const { data: activeCards } = await supabase
          .from("treatment_cards")
          .select("id, stamps_count, threshold, completed_cycles")
          .eq("user_id", resolvedUserId!)
          .eq("client_id", appointment.client_id)
          .eq("is_active", true);

        if (activeCards && activeCards.length > 0) {
          const card = activeCards[0];
          const newStamps = card.stamps_count + 1;
          if (newStamps >= card.threshold) {
            await supabase.from("treatment_cards").update({ stamps_count: 0, completed_cycles: card.completed_cycles + 1 }).eq("id", card.id);
          } else {
            await supabase.from("treatment_cards").update({ stamps_count: newStamps }).eq("id", card.id);
          }
        }
      } catch (e) { console.warn("Auto treatment stamp error:", e); }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["treatment_cards"] });
      toast.success(t("agenda.appointmentCreated"));
      // Trigger reminder flow creation (is_new = true for new appointments)
      triggerReminderFlow(data.id, true);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateAppointment = useMutation({
    mutationFn: async ({ id, warnOnly, resendConfirmation, ...updates }: Partial<Appointment> & { id: string; warnOnly?: boolean; resendConfirmation?: boolean }) => {
      const isRescheduled = !!(updates.start_time || updates.end_time);
      let hasConflict = false;
      if (updates.operator_id && updates.start_time && updates.end_time) {
        hasConflict = await checkConflict(
          updates.operator_id,
          updates.start_time,
          updates.end_time,
          id
        );
        if (hasConflict) {
          throw new Error(t("agenda.conflictError"));
        }
      }

      const { data, error } = await supabase
        .from("appointments")
        .update(updates)
        .eq("id", id)
        .select("*, services(name, duration_minutes, price)")
        .single();
      if (error) throw error;

      // Auto-deduct inventory when completing an appointment
      if (updates.status === "completed" && data.service_id) {
        try {
          await deductForService(data.service_id);
        } catch (e) {
          console.warn("Auto-deduct failed:", e);
        }
      }

      // Re-trigger reminder flow if appointment was rescheduled
      if (isRescheduled) {
        const skipConfirmation = resendConfirmation === false;
        
        await triggerReminderFlow(id, !skipConfirmation, skipConfirmation);
      }

      return data;
    },
    onMutate: async ({ id, warnOnly, ...updates }) => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ["appointments"] });

      // Snapshot the previous value
      const previousAppointments = queryClient.getQueriesData({ queryKey: ["appointments"] });

      // Optimistically update only the dragged appointment
      queryClient.setQueriesData({ queryKey: ["appointments"] }, (old: any) => {
        if (!Array.isArray(old)) return old;
        return old.map((apt: Appointment) =>
          apt.id === id ? { ...apt, ...updates } : apt
        );
      });

      return { previousAppointments };
    },
    onSuccess: (serverData) => {
      // Merge server response into cache instead of full refetch to avoid flicker
      queryClient.setQueriesData({ queryKey: ["appointments"] }, (old: any) => {
        if (!Array.isArray(old)) return old;
        return old.map((apt: Appointment) =>
          apt.id === serverData.id ? { ...apt, ...serverData } : apt
        );
      });
      // Soft background refetch after a delay to sync joined data
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["appointments"] });
      }, 500);
    },
    onError: (err: Error, _vars, context) => {
      // Rollback on error
      if (context?.previousAppointments) {
        for (const [queryKey, data] of context.previousAppointments) {
          queryClient.setQueryData(queryKey, data);
        }
      }
      toast.error(err.message);
    },
  });

  const cancelAppointment = useMutation({
    mutationFn: async (id: string) => {
      // Fetch appointment with service price and package_id before cancelling
      const { data: apt } = await supabase
        .from("appointments")
        .select("client_id, service_id, package_id, services(price)")
        .eq("id", id)
        .single();

      const { error } = await supabase
        .from("appointments")
        .update({ status: "cancelled" as AppointmentStatus, deleted_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;

      // Rollback package session if this was a package appointment
      if (apt?.package_id) {
        try {
          const { data: pkg } = await supabase
            .from("client_packages")
            .select("id, used_sessions")
            .eq("id", apt.package_id)
            .single();
          if (pkg && pkg.used_sessions > 0) {
            await supabase
              .from("client_packages")
              .update({ used_sessions: pkg.used_sessions - 1, status: "active" })
              .eq("id", pkg.id);
          }
        } catch (e) { console.warn("Package session rollback error:", e); }
      }

      // Cancel any active reminder flow for this appointment
      try {
        const { data: activeFlow } = await supabase
          .from("reminder_flows")
          .select("id")
          .eq("appointment_id", id)
          .eq("status", "active")
          .maybeSingle();

        if (activeFlow) {
          await supabase
            .from("reminder_flows")
            .update({ status: "cancelled" })
            .eq("id", activeFlow.id);
          await supabase
            .from("reminder_flow_nodes")
            .update({ status: "skipped" })
            .eq("flow_id", activeFlow.id)
            .in("status", ["pending", "in_progress"]);
          
        }
      } catch (e) { console.warn("Cancel reminder flow error:", e); }

      // Auto remove treatment stamp on cancellation
      if (apt?.client_id) {
        try {
          const { data: activeCards } = await supabase
            .from("treatment_cards")
            .select("id, stamps_count")
            .eq("user_id", resolvedUserId!)
            .eq("client_id", apt.client_id)
            .eq("is_active", true);

          if (activeCards && activeCards.length > 0) {
            const card = activeCards[0];
            if (card.stamps_count > 0) {
              await supabase.from("treatment_cards").update({ stamps_count: card.stamps_count - 1 }).eq("id", card.id);
            }
          }
        } catch (e) { console.warn("Auto treatment stamp cancel error:", e); }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["treatment_cards"] });
      queryClient.invalidateQueries({ queryKey: ["client_packages"] });
      toast.success(t("agenda.appointmentCancelled"));
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const triggerReminderFlow = async (appointmentId: string, isNew = false, skipConfirmation = false) => {
    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const { data: { session } } = await supabase.auth.getSession();
      
      const resp = await fetch(
        `https://${projectId}.supabase.co/functions/v1/create-reminder-flow`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ appointment_id: appointmentId, is_new: isNew, skip_confirmation: skipConfirmation }),
        }
      );
      const result = await resp.json();
      
    } catch (e) {
      console.warn("Reminder flow trigger error:", e);
    }
  };

  return {
    appointments: appointmentsQuery.data ?? [],
    isLoading: appointmentsQuery.isLoading,
    createAppointment,
    updateAppointment,
    cancelAppointment,
    checkConflict,
  };
}
