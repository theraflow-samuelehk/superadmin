import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTenantUserId } from "@/hooks/useTenantUserId";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

// Columns safe to fetch client-side (excludes stripe_secret_key, paypal_client_id)
const SAFE_COLUMNS = "id,user_id,hero_title,hero_subtitle,hero_image_url,primary_color,accent_color,logo_url,footer_text,is_published,shop_name,banner_sections,navigation_menu,shipping_info,footer_links,footer_about,social_links,created_at,updated_at" as const;

export interface ShopSettings {
  id: string;
  user_id: string;
  hero_title: string;
  hero_subtitle: string;
  hero_image_url: string | null;
  primary_color: string;
  accent_color: string;
  logo_url: string | null;
  footer_text: string | null;
  is_published: boolean;
  shop_name: string | null;
  banner_sections: any[];
  navigation_menu: any[];
  shipping_info: Record<string, any>;
  footer_links: any[];
  footer_about: string | null;
  social_links: Record<string, string>;
  created_at: string;
  updated_at: string;
}

export function useShopSettings() {
  const { user } = useAuth();
  const { tenantUserId } = useTenantUserId();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["shop_settings", tenantUserId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shop_settings")
        .select(SAFE_COLUMNS)
        .eq("user_id", tenantUserId!)
        .maybeSingle();
      if (error) throw error;
      return data as ShopSettings | null;
    },
    enabled: !!user && !!tenantUserId,
  });

  const upsert = useMutation({
    mutationFn: async (updates: Partial<ShopSettings>) => {
      if (query.data?.id) {
        const { error } = await supabase
          .from("shop_settings")
          .update(updates)
          .eq("id", query.data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("shop_settings")
          .insert({ ...updates, user_id: tenantUserId! });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shop_settings"] });
      toast.success(t("shop.settingsSaved"));
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return { settings: query.data, isLoading: query.isLoading, upsert };
}
