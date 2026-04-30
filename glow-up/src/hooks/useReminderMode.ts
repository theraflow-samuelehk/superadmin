import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenantUserId } from "@/hooks/useTenantUserId";

/**
 * Determines if the salon uses automatic (premium) or manual reminder mode.
 * Manual = user opens WA/SMS manually with pre-filled message.
 * Automatic = system sends via API (Baileys/Twilio).
 */
export function useReminderMode() {
  const { tenantUserId } = useTenantUserId();

  const { data: integrations, isLoading } = useQuery({
    queryKey: ["salon-integrations-mode", tenantUserId],
    queryFn: async () => {
      const { data } = await supabase
        .from("salon_integrations")
        .select("whatsapp_enabled, sms_enabled")
        .eq("user_id", tenantUserId!)
        .maybeSingle();
      return data;
    },
    enabled: !!tenantUserId,
    staleTime: 5 * 60 * 1000,
  });

  const isAutomatic = Boolean(integrations?.whatsapp_enabled || integrations?.sms_enabled);

  return {
    isManual: !isAutomatic && !isLoading,
    isAutomatic,
    isLoading,
  };
}
