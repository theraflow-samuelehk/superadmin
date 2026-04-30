import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  roles: string[];
  isSuperAdmin: boolean;
  refreshRoles: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  roles: [],
  isSuperAdmin: false,
  refreshRoles: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<string[]>([]);
  const [rolesLoaded, setRolesLoaded] = useState(false);
  // Prevents false logouts from onAuthStateChange firing before getSession completes (PWA resume race condition)
  const initialSessionRestored = useRef(false);
  // Track if we're currently refreshing to avoid concurrent refresh attempts
  const refreshingSession = useRef(false);
  // Only accept SIGNED_OUT when user explicitly clicked logout
  const manualSignOut = useRef(false);
  // Debounce login log inserts (prevent duplicates from session restore/token refresh)
  const lastLogInsert = useRef(0);
  // Always keep latest auth state available inside event listeners
  const currentUserRef = useRef<User | null>(null);
  const currentSessionRef = useRef<Session | null>(null);

  const setAuthenticatedState = useCallback((nextSession: Session) => {
    currentSessionRef.current = nextSession;
    currentUserRef.current = nextSession.user;
    setSession(nextSession);
    setUser(nextSession.user);
  }, []);

  const clearAuthenticatedState = useCallback(() => {
    currentSessionRef.current = null;
    currentUserRef.current = null;
    setSession(null);
    setUser(null);
    setRoles([]);
    setRolesLoaded(true);
  }, []);

  const fetchRoles = useCallback(async (userId: string) => {
    try {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);
      setRoles(data?.map((r) => r.role) || []);
    } catch (e) {
      console.error("Failed to fetch roles:", e);
      setRoles([]);
    } finally {
      setRolesLoaded(true);
    }
  }, []);

  useEffect(() => {
    // IMPORTANT: Do NOT await inside onAuthStateChange — it can deadlock.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        // Before initial session restore completes, ignore INITIAL_SESSION/null events.
        // getSession() is the source of truth for hydration; accepting early session events
        // can make queries run before the token is fully ready in PWAs.
        if (!initialSessionRestored.current) {
          if (event === "SIGNED_IN" && newSession?.user) {
            const previousUserId = currentUserRef.current?.id;
            setAuthenticatedState(newSession);
            if (previousUserId !== newSession.user.id) {
              setRolesLoaded(false);
              void fetchRoles(newSession.user.id);
            }
          }
          return;
        }

        // After initial restore, process all events normally
        if (newSession?.user) {
          const previousUserId = currentUserRef.current?.id;
          setAuthenticatedState(newSession);

          // Only reload roles if user actually changed (not on token refresh)
          if (previousUserId !== newSession.user.id) {
            setRolesLoaded(false);
            void fetchRoles(newSession.user.id);
          }
        } else if (event === "SIGNED_OUT" && manualSignOut.current) {
          manualSignOut.current = false;
          clearAuthenticatedState();
        }
        // For SIGNED_OUT without manual flag or null session with other events:
        // IGNORE — prevents involuntary logouts from token refresh failures.
        // The visibility change handler will attempt session recovery instead.

        // Fire-and-forget login/logout tracking
        if (event === "SIGNED_IN" && newSession?.user) {
          const now = Date.now();
          if (now - lastLogInsert.current > 60000) {
            lastLogInsert.current = now;
            supabase.from("login_logs").insert({
              user_id: newSession.user.id,
              event_type: "login",
              user_agent: navigator.userAgent,
            } as any).then(() => {});
          }
        }
      }
    );

    // Restore session from storage — with retry via refreshSession
    const restoreSession = async () => {
      try {
        const { data: { session: existingSession } } = await supabase.auth.getSession();
        if (existingSession?.user) {
          setAuthenticatedState(existingSession);
          await fetchRoles(existingSession.user.id);
        } else {
          // getSession returned null — tokens might be expired in storage.
          // Try refreshSession as a fallback (uses the refresh token directly).
          const { data: refreshData } = await supabase.auth.refreshSession();
          if (refreshData.session?.user) {
            setAuthenticatedState(refreshData.session);
            await fetchRoles(refreshData.session.user.id);
          } else {
            // Extra short retry for PWAs where storage hydration can lag on app resume/open.
            await new Promise((resolve) => window.setTimeout(resolve, 250));
            const { data: { session: lateSession } } = await supabase.auth.getSession();

            if (lateSession?.user) {
              setAuthenticatedState(lateSession);
              await fetchRoles(lateSession.user.id);
            } else {
              setRolesLoaded(true);
            }
          }
        }
      } catch (e) {
        console.error("Session restore failed:", e);
        setRolesLoaded(true);
      } finally {
        initialSessionRestored.current = true;
        setLoading(false);
      }
    };

    restoreSession();

    // PWA resume handler: refresh session when app comes back from background
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && initialSessionRestored.current && !refreshingSession.current) {
        refreshingSession.current = true;
        supabase.auth.getSession()
          .then(({ data: { session: currentSession } }) => {
            if (currentSession?.user) {
              setAuthenticatedState(currentSession);
            } else if (currentUserRef.current) {
              // Had a user but session is now null — try refresh
              return supabase.auth.refreshSession().then(({ data: refreshData }) => {
                if (refreshData.session?.user) {
                  setAuthenticatedState(refreshData.session);
                }
                // If refresh also fails, don't clear user immediately.
                // Let onAuthStateChange handle SIGNED_OUT if it fires.
              });
            }
          })
          .catch(() => {})
          .finally(() => {
            refreshingSession.current = false;
          });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      subscription.unsubscribe();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [clearAuthenticatedState, fetchRoles, setAuthenticatedState]);

  // loading = true until initial session + roles are loaded
  const isReady = !loading && rolesLoaded;

  const refreshRoles = useCallback(async () => {
    if (user) {
      await fetchRoles(user.id);
    }
  }, [user, fetchRoles]);

  const signOut = async () => {
    // Log logout before signing out (after sign-out we lose auth)
    if (user) {
      await supabase.from("login_logs").insert({
        user_id: user.id,
        event_type: "logout",
        user_agent: navigator.userAgent,
      } as any).then(() => {});
    }
    manualSignOut.current = true;
    await supabase.auth.signOut();
  };

  const isSuperAdmin = roles.includes("super_admin");

  return (
    <AuthContext.Provider value={{ user, session, loading: !isReady, roles, isSuperAdmin, refreshRoles, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
