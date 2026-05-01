import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

/**
 * Client Supabase. Singleton.
 * Le chiavi vengono da .env.local (mai committate).
 *
 * Se le env vars mancano, ritorna null e i services usano i mock locali
 * (utile per la demo senza backend).
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

let _client: SupabaseClient<Database> | null = null;

export function getSupabase(): SupabaseClient<Database> | null {
  if (!isSupabaseConfigured) return null;
  if (!_client) {
    _client = createClient<Database>(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        lock: async (_name, _acquireTimeout, fn) => fn(),
      },
    });
  }
  return _client;
}

/** Throw se Supabase non è configurato. Usa solo nei service di scrittura. */
export function requireSupabase(): SupabaseClient<Database> {
  const c = getSupabase();
  if (!c) {
    throw new Error(
      "Supabase non configurato. Aggiungi VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY in .env.local"
    );
  }
  return c;
}
