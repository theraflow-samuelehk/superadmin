import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenantUserId } from "@/hooks/useTenantUserId";

export function useSalonName() {
  const { tenantUserId: userId } = useTenantUserId();

  const { data: salonName } = useQuery({
    queryKey: ["salon-name", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("salon_name")
        .eq("user_id", userId!)
        .maybeSingle();
      return data?.salon_name || null;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  return salonName || "GlowUp";
}
