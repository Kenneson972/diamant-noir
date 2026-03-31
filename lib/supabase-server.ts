import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const getSupabaseServer = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase server client is not configured.");
  }
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      fetch: (url, options) => fetch(url, { ...options, cache: "no-store" }),
    },
    auth: {
      persistSession: false,
    },
  });
};
