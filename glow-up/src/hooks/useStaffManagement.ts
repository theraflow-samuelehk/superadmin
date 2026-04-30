import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTenantUserId } from "@/hooks/useTenantUserId";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export interface OperatorShift {
  id: string;
  user_id: string;
  operator_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface OperatorAttendance {
  id: string;
  user_id: string;
  operator_id: string;
  date: string;
  clock_in: string | null;
  clock_out: string | null;
  break_minutes: number;
  notes: string | null;
  status: string;
  created_at: string;
  operators?: { name: string; calendar_color: string };
}

export interface OperatorGoal {
  id: string;
  user_id: string;
  operator_id: string;
  month: number;
  year: number;
  target_revenue: number;
  actual_revenue: number;
  target_appointments: number;
  actual_appointments: number;
  operators?: { name: string; calendar_color: string };
}

export function useOperatorShifts(operatorId?: string) {
  const { user } = useAuth();
  const { tenantUserId } = useTenantUserId();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const shiftsQuery = useQuery({
    queryKey: ["operator_shifts", tenantUserId, operatorId],
    queryFn: async () => {
      let q = supabase.from("operator_shifts").select("*").eq("user_id", tenantUserId!).order("day_of_week").order("start_time");
      if (operatorId) q = q.eq("operator_id", operatorId);
      const { data, error } = await q;
      if (error) throw error;
      return data as OperatorShift[];
    },
    enabled: !!user && !!tenantUserId,
  });

  const saveShifts = useMutation({
    mutationFn: async ({ operatorId, shifts }: { operatorId: string; shifts: { day_of_week: number; start_time: string; end_time: string; is_active: boolean }[] }) => {
      // Delete existing shifts for this operator
      await supabase.from("operator_shifts").delete().eq("operator_id", operatorId).eq("user_id", tenantUserId!);
      // Insert new ones
      if (shifts.length > 0) {
        const { error } = await supabase.from("operator_shifts").insert(
          shifts.map((s) => ({ ...s, operator_id: operatorId, user_id: tenantUserId! }))
        );
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["operator_shifts"] });
      toast.success(t("staff.shiftsSaved"));
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return { shifts: shiftsQuery.data ?? [], isLoading: shiftsQuery.isLoading, saveShifts };
}

export function useOperatorAttendance(dateRange?: { from: string; to: string }) {
  const { user } = useAuth();
  const { tenantUserId } = useTenantUserId();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const attendanceQuery = useQuery({
    queryKey: ["operator_attendance", tenantUserId, dateRange?.from, dateRange?.to],
    queryFn: async () => {
      let q = supabase.from("operator_attendance").select("*, operators(name, calendar_color)").eq("user_id", tenantUserId!).order("date", { ascending: false });
      if (dateRange?.from) q = q.gte("date", dateRange.from);
      if (dateRange?.to) q = q.lte("date", dateRange.to);
      const { data, error } = await q;
      if (error) throw error;
      return data as OperatorAttendance[];
    },
    enabled: !!user && !!tenantUserId,
  });

  const clockIn = useMutation({
    mutationFn: async (operatorId: string) => {
      const today = new Date().toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("operator_attendance")
        .insert({ user_id: tenantUserId!, operator_id: operatorId, date: today, clock_in: new Date().toISOString(), status: "present" })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["operator_attendance"] });
      toast.success(t("staff.clockedIn"));
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const clockOut = useMutation({
    mutationFn: async (attendanceId: string) => {
      const { error } = await supabase
        .from("operator_attendance")
        .update({ clock_out: new Date().toISOString() })
        .eq("id", attendanceId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["operator_attendance"] });
      toast.success(t("staff.clockedOut"));
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const markAbsent = useMutation({
    mutationFn: async ({ operatorId, date, status, notes }: { operatorId: string; date: string; status: string; notes?: string }) => {
      const { error } = await supabase
        .from("operator_attendance")
        .insert({ user_id: tenantUserId!, operator_id: operatorId, date, status, notes: notes || null })
        .select()
        .single();
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["operator_attendance"] });
      toast.success(t("staff.attendanceRecorded"));
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return {
    attendance: attendanceQuery.data ?? [],
    isLoading: attendanceQuery.isLoading,
    clockIn,
    clockOut,
    markAbsent,
  };
}

export function useOperatorGoals(month?: number, year?: number) {
  const { user } = useAuth();
  const { tenantUserId } = useTenantUserId();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const goalsQuery = useQuery({
    queryKey: ["operator_goals", tenantUserId, month, year],
    queryFn: async () => {
      let q = supabase.from("operator_goals").select("*, operators(name, calendar_color)").eq("user_id", tenantUserId!);
      if (month !== undefined) q = q.eq("month", month);
      if (year !== undefined) q = q.eq("year", year);
      const { data, error } = await q;
      if (error) throw error;
      return data as OperatorGoal[];
    },
    enabled: !!user && !!tenantUserId,
  });

  const upsertGoal = useMutation({
    mutationFn: async (input: { operator_id: string; month: number; year: number; target_revenue: number; target_appointments: number }) => {
      // Check if goal exists
      const { data: existing } = await supabase
        .from("operator_goals")
        .select("id")
        .eq("operator_id", input.operator_id)
        .eq("month", input.month)
        .eq("year", input.year)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("operator_goals")
          .update({ target_revenue: input.target_revenue, target_appointments: input.target_appointments })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("operator_goals")
          .insert({ ...input, user_id: tenantUserId! });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["operator_goals"] });
      toast.success(t("staff.goalSaved"));
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return { goals: goalsQuery.data ?? [], isLoading: goalsQuery.isLoading, upsertGoal };
}
