import { useAuth } from "@/hooks/useAuth";
import { useImpersonation } from "@/lib/impersonation";

/**
 * Returns the effective user_id for data queries.
 * When a super_admin is impersonating a retailer, returns the retailer's user_id.
 * Otherwise returns the authenticated user's id.
 */
export function useEffectiveUserId(): string | undefined {
  const { user, isSuperAdmin } = useAuth();
  const { effectiveUserId, isImpersonating } = useImpersonation();

  if (isSuperAdmin && isImpersonating && effectiveUserId) {
    return effectiveUserId;
  }

  return user?.id;
}
