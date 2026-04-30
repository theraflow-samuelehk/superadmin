import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTenantUserId } from "@/hooks/useTenantUserId";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export interface ServiceCategory {
  id: string;
  user_id: string;
  name: string;
  emoji: string | null;
  sort_order: number;
  deleted_at: string | null;
  created_at: string;
}

export interface Service {
  id: string;
  user_id: string;
  category_id: string | null;
  name: string;
  duration_minutes: number;
  price: number;
  description: string | null;
  is_package: boolean;
  package_sessions: number | null;
  package_price: number | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export type ServiceInsert = Omit<Service, "id" | "created_at" | "updated_at" | "deleted_at" | "user_id">;
export type CategoryInsert = Omit<ServiceCategory, "id" | "created_at" | "deleted_at" | "user_id">;

export function useServiceCategories() {
  const { user } = useAuth();
  const { tenantUserId } = useTenantUserId();
  const { t } = useTranslation();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["service_categories", tenantUserId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_categories")
        .select("*")
        .eq("user_id", tenantUserId!)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as ServiceCategory[];
    },
    enabled: !!user && !!tenantUserId,
  });

  const createCategory = useMutation({
    mutationFn: async (cat: CategoryInsert) => {
      const { data, error } = await supabase
        .from("service_categories")
        .insert({ ...cat, user_id: tenantUserId! })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["service_categories"] });
      toast.success(t("services.categoryCreated"));
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateCategory = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ServiceCategory> & { id: string }) => {
      const { error } = await supabase
        .from("service_categories")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["service_categories"] });
      toast.success(t("services.categoryUpdated"));
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteCategory = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("service_categories")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["service_categories"] });
      toast.success(t("services.categoryDeleted"));
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return { categories: query.data ?? [], isLoading: query.isLoading, createCategory, updateCategory, deleteCategory };
}

export function useServices() {
  const { user } = useAuth();
  const { tenantUserId } = useTenantUserId();
  const { t } = useTranslation();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["services", tenantUserId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("*, service_categories(name, emoji)")
        .eq("user_id", tenantUserId!)
        .order("name", { ascending: true });
      if (error) throw error;
      return data as (Service & { service_categories: { name: string; emoji: string | null } | null })[];
    },
    enabled: !!user && !!tenantUserId,
  });

  const createService = useMutation({
    mutationFn: async (svc: ServiceInsert) => {
      const { data, error } = await supabase
        .from("services")
        .insert({ ...svc, user_id: tenantUserId! })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["services"] });
      toast.success(t("services.serviceCreated"));
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateService = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Service> & { id: string }) => {
      const { data, error } = await supabase
        .from("services")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["services"] });
      toast.success(t("services.serviceUpdated"));
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const archiveService = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("services")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["services"] });
      toast.success(t("services.serviceArchived"));
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const restoreService = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("services")
        .update({ deleted_at: null })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["services"] });
      toast.success(t("services.serviceRestored"));
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return {
    services: query.data ?? [],
    isLoading: query.isLoading,
    createService,
    updateService,
    archiveService,
    restoreService,
  };
}
