import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTenantUserId } from "@/hooks/useTenantUserId";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export type MovementType = "load" | "unload" | "sale" | "internal_use" | "adjustment";

export type ProductType = "retail" | "supply";

export interface Product {
  id: string;
  user_id: string;
  name: string;
  brand: string | null;
  category: string | null;
  quantity: number;
  min_quantity: number;
  sale_price: number;
  cost_price: number;
  barcode: string | null;
  supplier: string | null;
  notes: string | null;
  product_type: ProductType;
  deleted_at: string | null;
  description: string | null;
  image_url: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export type ProductInsert = Omit<Product, "id" | "created_at" | "updated_at" | "deleted_at" | "user_id">;

export interface InventoryMovement {
  id: string;
  user_id: string;
  product_id: string;
  movement_type: MovementType;
  quantity: number;
  notes: string | null;
  created_at: string;
}

export function useProducts() {
  const { user } = useAuth();
  const { tenantUserId } = useTenantUserId();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const productsQuery = useQuery({
    queryKey: ["products", tenantUserId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("user_id", tenantUserId!)
        .order("name", { ascending: true });
      if (error) throw error;
      return data as Product[];
    },
    enabled: !!user && !!tenantUserId,
  });

  const createProduct = useMutation({
    mutationFn: async (product: ProductInsert) => {
      const { data, error } = await supabase
        .from("products")
        .insert({ ...product, user_id: tenantUserId! })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success(t("inventory.productCreated"));
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateProduct = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Product> & { id: string }) => {
      const { data, error } = await supabase
        .from("products")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success(t("inventory.productUpdated"));
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const archiveProduct = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("products")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success(t("inventory.productArchived"));
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const restoreProduct = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("products")
        .update({ deleted_at: null })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success(t("inventory.productRestored"));
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const addMovement = useMutation({
    mutationFn: async (movement: { product_id: string; movement_type: MovementType; quantity: number; notes?: string }) => {
      // Insert movement
      const { error: moveError } = await supabase
        .from("inventory_movements")
        .insert({ ...movement, user_id: tenantUserId! });
      if (moveError) throw moveError;

      // Update product quantity
      const product = productsQuery.data?.find((p) => p.id === movement.product_id);
      if (!product) throw new Error("Product not found");

      const delta = ["load", "adjustment"].includes(movement.movement_type) ? movement.quantity : -movement.quantity;
      const newQty = Math.max(0, product.quantity + delta);

      const { error: updateError } = await supabase
        .from("products")
        .update({ quantity: newQty })
        .eq("id", movement.product_id);
      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success(t("inventory.movementRecorded"));
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return {
    products: productsQuery.data ?? [],
    isLoading: productsQuery.isLoading,
    createProduct,
    updateProduct,
    archiveProduct,
    restoreProduct,
    addMovement,
  };
}
