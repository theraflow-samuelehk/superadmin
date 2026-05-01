/**
 * Users / Profiles + Workspace Members — su Supabase.
 *
 * NB: la creazione di nuovi utenti avviene via Supabase Auth (signup o invite).
 * Qui leggiamo/aggiorniamo solo i profili applicativi.
 */

import { requireSupabase } from "../../lib/supabase";
import type { Database } from "../../lib/database.types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type Member = Database["public"]["Tables"]["workspace_members"]["Row"];
type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

export const UsersDB = {
  /** Lista profili visibili (super admin: tutti; user normale: solo il proprio + colleghi di workspace) */
  async list(): Promise<Profile[]> {
    const sb = requireSupabase();
    const { data, error } = await sb
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  async get(id: string): Promise<Profile | null> {
    const sb = requireSupabase();
    const { data, error } = await sb.from("profiles").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    return data;
  },

  async update(id: string, patch: ProfileUpdate): Promise<Profile> {
    const sb = requireSupabase();
    const { data, error } = await sb.from("profiles").update(patch).eq("id", id).select().single();
    if (error) throw error;
    return data;
  },

  /** Membri di un workspace con i profili joinati (2 query) */
  async listMembers(
    workspaceId: string
  ): Promise<(Member & { profile: Profile | null })[]> {
    const sb = requireSupabase();
    const { data: members, error: e1 } = await sb
      .from("workspace_members")
      .select("*")
      .eq("workspace_id", workspaceId);
    if (e1) throw e1;
    if (!members || members.length === 0) return [];

    const userIds = members.map((m) => m.user_id);
    const { data: profiles, error: e2 } = await sb
      .from("profiles")
      .select("*")
      .in("id", userIds);
    if (e2) throw e2;

    const map = new Map((profiles ?? []).map((p) => [p.id, p]));
    return members.map((m) => ({ ...m, profile: map.get(m.user_id) ?? null }));
  },
};
