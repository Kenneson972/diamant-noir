import { createBrowserClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

let supabaseBrowserClient: ReturnType<typeof createBrowserClient> | null = null;

export const getSupabaseBrowser = () => {
  if (supabaseBrowserClient) return supabaseBrowserClient;

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  supabaseBrowserClient = createBrowserClient(supabaseUrl, supabaseAnonKey);
  return supabaseBrowserClient;
};

/**
 * Client anon SANS cookies — pour les lectures publiques côté serveur
 * (pages ISR/statiques comme /villas/[id]). Ne PAS utiliser `getSupabaseServer`
 * pour ces pages : lire les cookies rend la page dynamique et provoque
 * `DYNAMIC_SERVER_USAGE` pour toute villa non pré-générée au build.
 */
export const supabasePublic = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase is not configured.");
  }
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
  });
};

export const supabaseAdmin = () => {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error("Supabase is not configured.");
  }
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
    },
  });
};
