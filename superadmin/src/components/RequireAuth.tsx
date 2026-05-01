import { type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { BrandMark } from "./ui/Brand";

interface RequireAuthProps {
  children: ReactNode;
  /** Se true richiede ruolo superadmin (default: false → qualsiasi loggato passa) */
  superAdmin?: boolean;
}

/**
 * Wrapper che protegge le route private.
 * - Se Supabase non è configurato       → lascia passare (modalità demo con mock)
 * - Se non loggato                      → redirect a /login
 * - Se superAdmin=true e non lo è       → redirect a /app (pannello cliente)
 * - Se superAdmin=false e È super admin → redirect a / (pannello super admin)
 */
export function RequireAuth({ children, superAdmin = false }: RequireAuthProps) {
  const { configured, loading, session, profile, isSuperAdmin } = useAuth();
  const location = useLocation();

  // Modalità demo: nessun backend, lascia passare tutto
  if (!configured) return <>{children}</>;

  // Aspetta che sia la session SIA il profilo siano arrivati dal DB
  if (loading || (session && !profile)) {
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

  // Pannello super admin: solo super admin
  if (superAdmin && !isSuperAdmin) {
    return <Navigate to="/app" replace />;
  }

  // Pannello cliente: il super admin va nel suo pannello, non in quello cliente
  if (!superAdmin && isSuperAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
