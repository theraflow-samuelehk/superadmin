import { Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import { ClientSidebar } from "./ClientSidebar";
import { Topbar } from "./Topbar";
import { ScrollProgress } from "../ui/ScrollProgress";
import { Toaster } from "../ui/Toaster";
import { NotificationsPanel } from "../ui/NotificationsPanel";
import { useAuth } from "../../lib/auth";
import { getSupabase } from "../../lib/supabase";
import type { Database } from "../../lib/database.types";

type Workspace = Database["public"]["Tables"]["workspaces"]["Row"];

interface ClientContext {
  workspace: Workspace | null;
  loading: boolean;
}

export function ClientLayout() {
  const { profile } = useAuth();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadWorkspace() {
      const sb = getSupabase();
      if (!sb || !profile) {
        setLoading(false);
        return;
      }

      // Carica il primo workspace dove l'utente è owner o membro
      // RLS già filtra automaticamente
      const { data, error } = await sb
        .from("workspaces")
        .select("*")
        .order("created_at", { ascending: true })
        .limit(1);

      if (error) {
        console.error("[ClientLayout] errore caricamento workspace", error);
      }
      setWorkspace(data?.[0] ?? null);
      setLoading(false);
    }
    void loadWorkspace();
  }, [profile]);

  return (
    <div className="flex min-h-screen text-slate-700 selection:bg-cyan-200 selection:text-cyan-900">
      <ScrollProgress />
      <ClientSidebar workspaceName={workspace?.name} />
      <main className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <div className="flex-1">
          <Outlet context={{ workspace, loading } satisfies ClientContext} />
        </div>
      </main>
      <NotificationsPanel />
      <Toaster />
    </div>
  );
}

export type { ClientContext };
