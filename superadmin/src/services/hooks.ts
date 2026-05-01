/**
 * Hook React per fetching dati.
 *
 * Comportamento:
 *   - Se Supabase è configurato → fa la query vera.
 *   - Se non è configurato       → ritorna i mock locali immediatamente.
 *
 * In questo modo le pagine possono usare gli stessi hook senza sapere
 * se siamo in modalità demo o produzione.
 */

import { useEffect, useState, useCallback } from "react";
import { isSupabaseConfigured } from "../lib/supabase";
import { WorkspacesDB } from "./db/workspaces";
import { ProjectsDB } from "./db/projects";
import { UsersDB } from "./db/users";
import { ActivityDB } from "./db/activity";
import { InvitesDB } from "./db/invites";
import type { Database } from "../lib/database.types";

import {
  workspaces as mockWorkspaces,
  projects as mockProjects,
  users as mockUsers,
  activity as mockActivity,
  membersByWorkspace as mockMembersByWs,
  type Workspace as MockWorkspace,
  type Project as MockProject,
  type User as MockUser,
  type ActivityEvent as MockActivity,
} from "../lib/mock";

type DbWorkspace = Database["public"]["Tables"]["workspaces"]["Row"];
type DbProject = Database["public"]["Tables"]["projects"]["Row"];
type DbProfile = Database["public"]["Tables"]["profiles"]["Row"];
type DbActivity = Database["public"]["Tables"]["activity"]["Row"];
type DbInvite = Database["public"]["Tables"]["invites"]["Row"];

interface QueryState<T> {
  data: T;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/** Generico: esegue il loader async una volta + permette refetch */
function useAsync<T>(loader: () => Promise<T>, fallback: T, deps: unknown[] = []): QueryState<T> {
  const [data, setData] = useState<T>(fallback);
  const [loading, setLoading] = useState<boolean>(isSupabaseConfigured);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setData(fallback);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await loader();
      setData(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Errore caricamento dati");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    void run();
  }, [run]);

  return { data, loading, error, refetch: run };
}

// ============================================================================
// HOOK: i tipi sono unione DB | Mock per facilitare la transizione.
// Le pagine vedono i campi "minimi" comuni (id, name, slug, ecc.).
// ============================================================================

export function useWorkspaces() {
  return useAsync<(DbWorkspace | MockWorkspace)[]>(
    () => WorkspacesDB.list(),
    mockWorkspaces
  );
}

export function useWorkspace(id: string | undefined) {
  return useAsync<DbWorkspace | MockWorkspace | null>(
    async () => (id ? WorkspacesDB.get(id) : null),
    id ? mockWorkspaces.find((w) => w.id === id) ?? null : null,
    [id]
  );
}

export function useProjects() {
  return useAsync<(DbProject | MockProject)[]>(
    () => ProjectsDB.list(),
    mockProjects
  );
}

export function useProjectsByWorkspace(workspaceId: string | undefined) {
  return useAsync<(DbProject | MockProject)[]>(
    async () => (workspaceId ? ProjectsDB.listByWorkspace(workspaceId) : []),
    workspaceId ? mockProjects.filter((p) => p.workspaceId === workspaceId) : [],
    [workspaceId]
  );
}

export function useUsers() {
  return useAsync<(DbProfile | MockUser)[]>(() => UsersDB.list(), mockUsers);
}

export function useWorkspaceMembers(workspaceId: string | undefined) {
  return useAsync<unknown[]>(
    async () => (workspaceId ? UsersDB.listMembers(workspaceId) : []),
    workspaceId ? mockMembersByWs(workspaceId) : [],
    [workspaceId]
  );
}

export function useRecentActivity(limit = 30) {
  return useAsync<(DbActivity | MockActivity)[]>(
    () => ActivityDB.recent(limit),
    mockActivity.slice(0, limit),
    [limit]
  );
}

export function usePendingInvites() {
  return useAsync<DbInvite[]>(() => InvitesDB.listPending(), []);
}
