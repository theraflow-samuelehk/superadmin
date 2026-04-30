import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTenantUserId } from "@/hooks/useTenantUserId";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export interface Operator {
  id: string;
  user_id: string;
  name: string;
  email: string | null;
  role: string | null;
  specializations: string[] | null;
  calendar_color: string;
  commission_service_pct: number;
  commission_product_pct: number;
  monthly_target: number;
  working_hours: any;
  photo_url: string | null;
  service_ids: string[] | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  agenda_position: number;
  calendar_visible: boolean;
}

export type OperatorInsert = Omit<Operator, "id" | "created_at" | "updated_at" | "deleted_at" | "user_id" | "commission_service_pct" | "commission_product_pct" | "monthly_target" | "photo_url" | "service_ids" | "agenda_position" | "calendar_visible"> & {
  commission_service_pct?: number;
  commission_product_pct?: number;
  monthly_target?: number;
  photo_url?: string | null;
  service_ids?: string[] | null;
  agenda_position?: number;
  calendar_visible?: boolean;
};

export function useOperators() {
  const { user } = useAuth();
  const { tenantUserId } = useTenantUserId();
  const { t } = useTranslation();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["operators", tenantUserId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("operators")
        .select("*")
        .eq("user_id", tenantUserId!)
        .order("name", { ascending: true });
      if (error) throw error;
      return data as Operator[];
    },
    enabled: !!user && !!tenantUserId,
  });

  const createOperator = useMutation({
    mutationFn: async (op: OperatorInsert) => {
      const { data, error } = await supabase
        .from("operators")
        .insert({ ...op, user_id: tenantUserId! })
        .select()
        .single();
      if (error) throw error;

      // Auto-create default shifts for the new operator
      const defaultShifts: { user_id: string; operator_id: string; day_of_week: number; start_time: string; end_time: string; is_active: boolean }[] = [];
      for (let day = 0; day <= 6; day++) {
        const isActive = day >= 1; // Mon-Sat active, Sun inactive
        defaultShifts.push(
          { user_id: tenantUserId!, operator_id: data.id, day_of_week: day, start_time: "09:00", end_time: "13:00", is_active: isActive },
          { user_id: tenantUserId!, operator_id: data.id, day_of_week: day, start_time: "14:00", end_time: "19:00", is_active: isActive },
        );
      }
      await supabase.from("operator_shifts").insert(defaultShifts);

      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["operators"] });
      qc.invalidateQueries({ queryKey: ["operator_shifts"] });
      toast.success(t("operators.operatorCreated"));
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateOperator = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Operator> & { id: string }) => {
      const { data, error } = await supabase
        .from("operators")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["operators"] });
      toast.success(t("operators.operatorUpdated"));
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const archiveOperator = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("operators")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["operators"] });
      toast.success(t("operators.operatorArchived"));
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const restoreOperator = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("operators")
        .update({ deleted_at: null })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["operators"] });
      toast.success(t("operators.operatorRestored"));
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return {
    operators: query.data ?? [],
    isLoading: query.isLoading,
    createOperator,
    updateOperator,
    archiveOperator,
    restoreOperator,
  };
}
