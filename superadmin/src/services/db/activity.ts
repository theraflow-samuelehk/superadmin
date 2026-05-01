/**
 * Activity log — letture filtrate da RLS, scritture limitate.
 */

import { requireSupabase } from "../../lib/supabase";
import type { Database } from "../../lib/database.types";

type ActivityRow = Database["public"]["Tables"]["activity"]["Row"];
type ActivityInsert = Database["public"]["Tables"]["activity"]["Insert"];

export const ActivityDB = {
  /** Ultimi N eventi globali (filtrati da RLS in base al ruolo) */
  async recent(limit = 30): Promise<ActivityRow[]> {
    const sb = requireSupabase();
    const { data, error } = await sb
      .from("activity")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data ?? [];
  },

  /** Eventi di un workspace */
  async byWorkspace(workspaceId: string, limit = 30): Promise<ActivityRow[]> {
    const sb = requireSupabase();
    const { data, error } = await sb
      .from("activity")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data ?? [];
  },

  /** Inserisce un nuovo evento */
  async log(event: ActivityInsert): Promise<ActivityRow> {
    const sb = requireSupabase();
    const { data, error } = await sb.from("activity").insert(event).select().single();
    if (error) throw error;
    return data;
  },
};
