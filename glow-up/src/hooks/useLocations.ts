import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTenantUserId } from "@/hooks/useTenantUserId";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export interface Location {
  id: string;
  user_id: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  is_primary: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export type LocationInsert = Omit<Location, "id" | "created_at" | "updated_at" | "deleted_at" | "user_id">;

export function useLocations() {
  const { user } = useAuth();
  const { tenantUserId } = useTenantUserId();
  const { t } = useTranslation();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["locations", tenantUserId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("locations")
        .select("*")
        .eq("user_id", tenantUserId!)
        .is("deleted_at", null)
        .order("is_primary", { ascending: false });
      if (error) throw error;
      return data as Location[];
    },
    enabled: !!user && !!tenantUserId,
  });

  const createLocation = useMutation({
    mutationFn: async (loc: LocationInsert) => {
      const { data, error } = await supabase
        .from("locations")
        .insert({ ...loc, user_id: tenantUserId! })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["locations"] });
      toast.success(t("locations.created"));
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateLocation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Location> & { id: string }) => {
      const { data, error } = await supabase
        .from("locations")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["locations"] });
      toast.success(t("locations.updated"));
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const archiveLocation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("locations")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["locations"] });
      toast.success(t("locations.archived"));
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return {
    locations: query.data ?? [],
    isLoading: query.isLoading,
    createLocation,
    updateLocation,
    archiveLocation,
  };
}
