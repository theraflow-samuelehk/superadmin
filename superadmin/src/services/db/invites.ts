/**
 * Invites — gestione inviti a workspace.
 */

import { requireSupabase } from "../../lib/supabase";
import type { Database, MemberRole } from "../../lib/database.types";

type Invite = Database["public"]["Tables"]["invites"]["Row"];

export const InvitesDB = {
  /** Tutti gli inviti pendenti visibili (RLS filtra) */
  async listPending(): Promise<Invite[]> {
    const sb = requireSupabase();
    const { data, error } = await sb
      .from("invites")
      .select("*")
      .is("accepted_at", null)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  async create(input: { workspace_id: string; email: string; role?: MemberRole }): Promise<Invite> {
    const sb = requireSupabase();
    const { data, error } = await sb
      .from("invites")
      .insert({
        workspace_id: input.workspace_id,
        email: input.email,
        role: input.role ?? "staff",
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async cancel(id: string): Promise<void> {
    const sb = requireSupabase();
    const { error } = await sb.from("invites").delete().eq("id", id);
    if (error) throw error;
  },
};
