import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTenantUserId } from "@/hooks/useTenantUserId";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export interface Client {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  email: string | null;
  birth_date: string | null;
  notes: string | null;
  allergies: string | null;
  privacy_consent: boolean;
  source: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export type ClientInsert = Omit<Client, "id" | "created_at" | "updated_at" | "deleted_at" | "user_id">;

export function useClients() {
  const { user } = useAuth();
  const { tenantUserId } = useTenantUserId();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const clientsQuery = useQuery({
    queryKey: ["clients", tenantUserId],
    queryFn: async () => {
      const PAGE_SIZE = 1000;
      let allData: Client[] = [];
      let from = 0;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from("clients")
          .select("*")
          .eq("user_id", tenantUserId!)
          .order("last_name", { ascending: true })
          .range(from, from + PAGE_SIZE - 1);
        if (error) throw error;
        allData = allData.concat(data as Client[]);
        hasMore = (data?.length ?? 0) === PAGE_SIZE;
        from += PAGE_SIZE;
      }

      return allData;
    },
    enabled: !!user && !!tenantUserId,
  });

  const createClient = useMutation({
    mutationFn: async (client: ClientInsert) => {
      const { data, error } = await supabase
        .from("clients")
        .insert({ ...client, user_id: tenantUserId! })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast.success(t("clients.clientCreated"));
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateClient = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Client> & { id: string }) => {
      const { data, error } = await supabase
        .from("clients")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast.success(t("clients.clientUpdated"));
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const archiveClient = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("clients")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast.success(t("clients.clientArchived"));
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const restoreClient = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("clients")
        .update({ deleted_at: null })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast.success(t("clients.clientRestored"));
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return {
    clients: clientsQuery.data ?? [],
    isLoading: clientsQuery.isLoading,
    createClient,
    updateClient,
    archiveClient,
    restoreClient,
  };
}
