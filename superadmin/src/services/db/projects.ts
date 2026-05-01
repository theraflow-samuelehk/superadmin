/**
 * Projects — CRUD su Supabase.
 * RLS filtra: super admin vede tutto, admin solo il suo workspace.
 */

import { requireSupabase } from "../../lib/supabase";
import type { Database } from "../../lib/database.types";

type Project = Database["public"]["Tables"]["projects"]["Row"];
type ProjectInsert = Database["public"]["Tables"]["projects"]["Insert"];
type ProjectUpdate = Database["public"]["Tables"]["projects"]["Update"];

export const ProjectsDB = {
  async list(): Promise<Project[]> {
    const sb = requireSupabase();
    const { data, error } = await sb
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  async listByWorkspace(workspaceId: string): Promise<Project[]> {
    const sb = requireSupabase();
    const { data, error } = await sb
      .from("projects")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  async get(id: string): Promise<Project | null> {
    const sb = requireSupabase();
    const { data, error } = await sb.from("projects").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    return data;
  },

  async create(input: ProjectInsert): Promise<Project> {
    const sb = requireSupabase();
    const { data, error } = await sb.from("projects").insert(input).select().single();
    if (error) throw error;
    return data;
  },

  async update(id: string, patch: ProjectUpdate): Promise<Project> {
    const sb = requireSupabase();
    const { data, error } = await sb
      .from("projects")
      .update(patch)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async remove(id: string): Promise<void> {
    const sb = requireSupabase();
    const { error } = await sb.from("projects").delete().eq("id", id);
    if (error) throw error;
  },
};
