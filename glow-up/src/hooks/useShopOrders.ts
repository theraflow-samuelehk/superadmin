import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTenantUserId } from "@/hooks/useTenantUserId";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export interface ShopOrder {
  id: string;
  user_id: string;
  order_number: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  items: Array<{ product_id: string; name: string; quantity: number; price: number }>;
  subtotal: number;
  total: number;
  status: string;
  payment_method: string;
  delivery_method: string | null;
  shipping_address: Record<string, string> | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function useShopOrders() {
  const { user } = useAuth();
  const { tenantUserId } = useTenantUserId();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["shop_orders", tenantUserId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shop_orders")
        .select("*")
        .eq("user_id", tenantUserId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as ShopOrder[];
    },
    enabled: !!user && !!tenantUserId,
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("shop_orders")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shop_orders"] });
      toast.success(t("shop.orderUpdated"));
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return { orders: query.data ?? [], isLoading: query.isLoading, updateStatus };
}
