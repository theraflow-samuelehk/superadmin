import { type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { BrandMark } from "./ui/Brand";

interface RequireAuthProps {
  children: ReactNode;
  /** Se true richiede ruolo superadmin (default: true per questa app) */
  superAdmin?: boolean;
}

/**
 * Wrapper che protegge le route private.
 * - Se Supabase non è configurato → lascia passare (modalità demo con mock)
 * - Se non loggato                 → redirect a /login
 * - Se richiesto superadmin e non lo è → redirect a /login con messaggio
 */
export function RequireAuth({ children, superAdmin = true }: RequireAuthProps) {
  const { configured, loading, session, isSuperAdmin } = useAuth();
  const location = useLocation();

  // Modalità demo: nessun backend, lascia passare tutto
  if (!configured) return <>{children}</>;

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-5 bg-slate-50">
        <BrandMark size={56} />
        <div className="flex items-center gap-2 text-[13px] text-slate-500 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
          Caricamento sessione…
        </div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (superAdmin && !isSuperAdmin) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ error: "Solo super admin possono accedere a questa console." }}
      />
    );
  }

  return <>{children}</>;
}
