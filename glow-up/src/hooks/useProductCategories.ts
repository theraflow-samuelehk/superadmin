import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTenantUserId } from "@/hooks/useTenantUserId";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export interface ProductCategory {
  id: string;
  user_id: string;
  name: string;
  emoji: string | null;
  sort_order: number;
  deleted_at: string | null;
  created_at: string;
}

export type ProductCategoryInsert = Pick<ProductCategory, "name"> & {
  emoji?: string | null;
  sort_order?: number;
};

export function useProductCategories() {
  const { user } = useAuth();
  const { tenantUserId } = useTenantUserId();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["product_categories", tenantUserId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_categories")
        .select("*")
        .eq("user_id", tenantUserId!)
        .is("deleted_at", null)
        .order("sort_order");
      if (error) throw error;
      return data as ProductCategory[];
    },
    enabled: !!user && !!tenantUserId,
  });

  const createCategory = useMutation({
    mutationFn: async (cat: ProductCategoryInsert) => {
      const { error } = await supabase
        .from("product_categories")
        .insert({ ...cat, user_id: tenantUserId! });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product_categories"] });
      toast.success(t("inventory.categoryCreated"));
    },
    onError: () => toast.error(t("common.error")),
  });

  const updateCategory = useMutation({
    mutationFn: async ({ id, ...data }: { id: string; name: string; emoji?: string | null }) => {
      const { error } = await supabase
        .from("product_categories")
        .update({ name: data.name, emoji: data.emoji ?? null })
        .eq("id", id)
        .eq("user_id", tenantUserId!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product_categories"] });
      toast.success(t("services.categoryUpdated"));
    },
    onError: () => toast.error(t("common.error")),
  });

  const deleteCategory = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("product_categories")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id)
        .eq("user_id", tenantUserId!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product_categories"] });
      toast.success(t("services.categoryDeleted"));
    },
    onError: () => toast.error(t("common.error")),
  });

  return { categories, isLoading, createCategory, updateCategory, deleteCategory };
}
