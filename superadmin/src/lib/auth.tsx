import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { getSupabase, isSupabaseConfigured } from "./supabase";
import type { Database, GlobalRole } from "./database.types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface AuthState {
  /** Sessione Supabase, null se non loggato */
  session: Session | null;
  /** Utente di Supabase Auth (id, email, ecc.) */
  user: User | null;
  /** Profilo applicativo (nome, ruolo globale, avatar) */
  profile: Profile | null;
  /** True mentre carichiamo lo stato iniziale */
  loading: boolean;
  /** True se Supabase è configurato (altrimenti modalità demo con mock) */
  configured: boolean;
  /** Login con email + password */
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  /** Login con magic link (email) */
  signInMagicLink: (email: string) => Promise<{ error: string | null }>;
  /** Logout */
  signOut: () => Promise<void>;
  /** Aggiorna manualmente il profilo (es. dopo edit) */
  refreshProfile: () => Promise<void>;
  /** True se l'utente è super admin */
  isSuperAdmin: boolean;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const supabase = getSupabase();
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Carica il profilo applicativo dopo che abbiamo l'auth user
  const loadProfile = useCallback(
    async (userId: string) => {
      if (!supabase) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
      if (error) {
        console.error("[auth] profile load error", error);
        return null;
      }
      return data;
    },
    [supabase]
  );

  const refreshProfile = useCallback(async () => {
    if (!session?.user.id) return;
    const p = await loadProfile(session.user.id);
    setProfile(p);
  }, [session?.user.id, loadProfile]);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    let mounted = true;

    // Carica sessione iniziale
    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      if (data.session?.user) {
        const p = await loadProfile(data.session.user.id);
        if (mounted) setProfile(p);
      }
      if (mounted) setLoading(false);
    });

    // Listener per cambi di stato (login/logout/refresh token)
    const { data: sub } = supabase.auth.onAuthStateChange(async (_evt, sess) => {
      if (!mounted) return;
      setSession(sess);
      if (sess?.user) {
        const p = await loadProfile(sess.user.id);
        if (mounted) setProfile(p);
      } else {
        if (mounted) setProfile(null);
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase, loadProfile]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      if (!supabase) return { error: "Supabase non configurato. Aggiungi le chiavi in .env.local" };
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (!error && data.user) {
        // touch last_seen_at (best effort, no await blocking)
        void supabase.from("profiles").update({ last_seen_at: new Date().toISOString() }).eq("id", data.user.id);
      }
      return { error: error?.message ?? null };
    },
    [supabase]
  );

  const signInMagicLink = useCallback(
    async (email: string) => {
      if (!supabase) return { error: "Supabase non configurato. Aggiungi le chiavi in .env.local" };
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: window.location.origin },
      });
      return { error: error?.message ?? null };
    },
    [supabase]
  );

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  }, [supabase]);

  const isSuperAdmin: boolean = profile?.global_role === ("superadmin" as GlobalRole);

  const value: AuthState = {
    session,
    user: session?.user ?? null,
    profile,
    loading,
    configured: isSupabaseConfigured,
    signIn,
    signInMagicLink,
    signOut,
    refreshProfile,
    isSuperAdmin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve essere usato dentro <AuthProvider>");
  return ctx;
}
