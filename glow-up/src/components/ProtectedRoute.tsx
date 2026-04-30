import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useImpersonation } from "@/lib/impersonation";

const BYPASS_AUTH = false;

interface ProtectedRouteProps {
  children: React.ReactNode;
  portalRoute?: boolean;
  operatorPortalRoute?: boolean;
  affiliatePortalRoute?: boolean;
}

/** Roles that grant access to the owner/retailer dashboard */
const OWNER_ROLES = new Set(["user", "super_admin", "admin", "owner", "manager"]);

export function ProtectedRoute({ children, portalRoute, operatorPortalRoute, affiliatePortalRoute }: ProtectedRouteProps) {
  if (BYPASS_AUTH) return <>{children}</>;
  const { user, loading, isSuperAdmin, roles } = useAuth();
  const { isImpersonating } = useImpersonation();

  if (loading) {
    return (
      <div className="h-full overflow-auto flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Caricamento...</div>
      </div>
    );
  }

  if (!user) {
    if (affiliatePortalRoute) return <Navigate to="/affiliate-portal/login" replace />;
    if (operatorPortalRoute) return <Navigate to="/staff-portal/login" replace />;
    if (portalRoute) return <Navigate to="/portal/login" replace />;
    return <Navigate to="/auth" replace />;
  }

  // Super admin impersonating can access retailer dashboard
  if (isSuperAdmin && isImpersonating) {
    return <>{children}</>;
  }

  // Super admin NOT impersonating should only access /admin
  if (isSuperAdmin && !portalRoute && !operatorPortalRoute && !affiliatePortalRoute) {
    return <Navigate to="/admin" replace />;
  }

  // Portal-specific routes: verify matching role
  if (portalRoute) {
    if (!roles.includes("client")) return <Navigate to="/dashboard" replace />;
    return <>{children}</>;
  }
  if (operatorPortalRoute) {
    if (!roles.includes("operator")) return <Navigate to="/dashboard" replace />;
    return <>{children}</>;
  }
  if (affiliatePortalRoute) {
    if (!roles.includes("affiliate") && !roles.includes("affiliate_manager")) return <Navigate to="/dashboard" replace />;
    return <>{children}</>;
  }

  // Guard owner/retailer routes: block users who only have operator/client roles
  const hasOwnerRole = roles.some((r) => OWNER_ROLES.has(r));
  if (!hasOwnerRole) {
    // Redirect to the most appropriate portal
    if (roles.includes("operator")) return <Navigate to="/staff-portal" replace />;
    if (roles.includes("client")) return <Navigate to="/portal" replace />;
    if (roles.includes("affiliate") || roles.includes("affiliate_manager")) return <Navigate to="/affiliate-portal" replace />;
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}

export function AdminRoute({ children }: { children: React.ReactNode }) {
  if (BYPASS_AUTH) return <>{children}</>;
  const { user, loading, isSuperAdmin } = useAuth();

  if (loading) {
    return (
      <div className="h-full overflow-auto flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Caricamento...</div>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  if (!isSuperAdmin) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}
