import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useImpersonation } from "@/lib/impersonation";
import { useSalonOwnerId } from "@/contexts/EmbeddedContext";
import { supabase } from "@/integrations/supabase/client";

/**
 * Single source of truth for the active tenant's user_id.
 *
 * Resolution order:
 * 1. Super Admin impersonating → impersonated retailer's user_id
 * 2. Operator in embedded mode → salonOwnerId from EmbeddedContext
 * 3. Normal owner/backoffice user → auth user.id
 * 4. Operator-only account (standalone) → resolved via RPC get_operator_salon_user_id
 */
export function useTenantUserId() {
  const { user, roles, isSuperAdmin } = useAuth();
  const { effectiveUserId, isImpersonating } = useImpersonation();
  const salonOwnerId = useSalonOwnerId();
  const isOperator = roles.includes("operator");
  const isOwner = roles.includes("user");

  // Resolve operator salon only for operator-only accounts
  const operatorSalonQuery = useQuery({
    queryKey: ["salon-user-id", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_operator_salon_user_id", {
        _auth_user_id: user!.id,
      });
      if (error) throw error;
      return data as string;
    },
    enabled: !!user && isOperator && !isOwner && !salonOwnerId,
    staleTime: Infinity,
  });

  let tenantUserId: string | undefined;

  if (isSuperAdmin && isImpersonating && effectiveUserId) {
    tenantUserId = effectiveUserId;
  } else if (salonOwnerId) {
    tenantUserId = salonOwnerId;
  } else if (isOwner) {
    tenantUserId = user?.id;
  } else if (isOperator) {
    tenantUserId = operatorSalonQuery.data ?? undefined;
  } else {
    tenantUserId = user?.id;
  }

  return {
    tenantUserId,
    isReady: !!tenantUserId,
    isImpersonating: isSuperAdmin && isImpersonating,
  };
}
