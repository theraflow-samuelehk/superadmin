/**
 * Workspaces — letture e scritture su Supabase.
 * RLS in DB filtra automaticamente cosa può vedere l'utente loggato.
 */

import { requireSupabase } from "../../lib/supabase";
import type { Database } from "../../lib/database.types";

type Workspace = Database["public"]["Tables"]["workspaces"]["Row"];
type WorkspaceInsert = Database["public"]["Tables"]["workspaces"]["Insert"];
type WorkspaceUpdate = Database["public"]["Tables"]["workspaces"]["Update"];

export const WorkspacesDB = {
  /** Tutti i workspace visibili all'utente loggato (filtrati da RLS) */
  async list(): Promise<Workspace[]> {
    const sb = requireSupabase();
    const { data, error } = await sb
      .from("workspaces")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  /** Workspace per ID */
  async get(id: string): Promise<Workspace | null> {
    const sb = requireSupabase();
    const { data, error } = await sb.from("workspaces").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    return data;
  },

  /** Workspace per slug */
  async getBySlug(slug: string): Promise<Workspace | null> {
    const sb = requireSupabase();
    const { data, error } = await sb
      .from("workspaces")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  /** Crea workspace (solo super admin via RLS) */
  async create(input: WorkspaceInsert): Promise<Workspace> {
    const sb = requireSupabase();
    const { data, error } = await sb.from("workspaces").insert(input).select().single();
    if (error) throw error;
    return data;
  },

  /** Aggiorna workspace */
  async update(id: string, patch: WorkspaceUpdate): Promise<Workspace> {
    const sb = requireSupabase();
    const { data, error } = await sb
      .from("workspaces")
      .update(patch)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  /** Elimina workspace (solo super admin) */
  async remove(id: string): Promise<void> {
    const sb = requireSupabase();
    const { error } = await sb.from("workspaces").delete().eq("id", id);
    if (error) throw error;
  },
};
