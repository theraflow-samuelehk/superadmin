import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTenantUserId } from "@/hooks/useTenantUserId";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export interface ServiceProduct {
  id: string;
  service_id: string;
  product_id: string;
  quantity_used: number;
  user_id: string;
  created_at: string;
  products?: { id: string; name: string; quantity: number };
}

export function useServiceProducts(serviceId?: string) {
  const { user } = useAuth();
  const { tenantUserId } = useTenantUserId();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["service_products", serviceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_products")
        .select("*, products(id, name, quantity)")
        .eq("service_id", serviceId!);
      if (error) throw error;
      return (data as unknown) as ServiceProduct[];
    },
    enabled: !!user && !!serviceId,
  });

  const addServiceProduct = useMutation({
    mutationFn: async (item: { service_id: string; product_id: string; quantity_used: number }) => {
      const { error } = await supabase
        .from("service_products")
        .insert({ ...item, user_id: tenantUserId! });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service_products"] });
      toast.success(t("inventory.productLinked"));
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const removeServiceProduct = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("service_products")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service_products"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  /** Deduct all linked products for a given service */
  const deductForService = async (svcId: string) => {
    const { data: links, error } = await supabase
      .from("service_products")
      .select("product_id, quantity_used")
      .eq("service_id", svcId);

    if (error || !links || links.length === 0) return;

    for (const link of links) {
      // Record movement
      await supabase
        .from("inventory_movements")
        .insert({
          product_id: link.product_id,
          movement_type: "internal_use" as const,
          quantity: link.quantity_used,
          notes: `Auto: servizio completato`,
          user_id: tenantUserId!,
        });

      // Update quantity
      const { data: product } = await supabase
        .from("products")
        .select("quantity")
        .eq("id", link.product_id)
        .single();

      if (product) {
        const newQty = Math.max(0, product.quantity - link.quantity_used);
        await supabase
          .from("products")
          .update({ quantity: newQty })
          .eq("id", link.product_id);
      }
    }

    queryClient.invalidateQueries({ queryKey: ["products"] });
  };

  return {
    serviceProducts: query.data ?? [],
    isLoading: query.isLoading,
    addServiceProduct,
    removeServiceProduct,
    deductForService,
  };
}
