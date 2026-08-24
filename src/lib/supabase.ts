import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Client-safe environment variables (if provided)
const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || "";

let supabaseClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (supabaseClient) return supabaseClient;

  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    try {
      supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } catch (err) {
      console.warn("[DealTiki] Supabase client initialization failed:", err);
    }
  }

  return supabaseClient;
}
