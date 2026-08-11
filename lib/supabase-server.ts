import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { cache } from "react";
import type { Villa } from "@/types/domain";

// Mémoïsé par requête (React cache) : layout + page(s) appellent tous
// getSupabaseServer() indépendamment — sans ça, chaque appel recréait un
// client et refaisait auth.getSession(), multipliant la latence de chaque
// page du dashboard.
export const getSupabaseServer = cache(async function getSupabaseServer() {
  const cookieStore = await cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase server client is not configured.");
  }

  // Domaine des cookies : .kayvila.com en prod pour que la session Supabase
  // survive entre le domaine public et admin.kayvila.com (host-only en dev)
  const cookieDomain = process.env.SUPABASE_COOKIE_DOMAIN
    ? `.${process.env.SUPABASE_COOKIE_DOMAIN.replace(/^\./, "")}`
    : undefined;

  const client = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(
              name,
              value,
              cookieDomain ? { ...options, domain: cookieDomain } : options
            )
          );
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  });

  // Warm up session so _getAccessToken() uses the user's JWT for DB queries (not anon key)
  await client.auth.getSession();
  return client;
});

// Mémoïsé par requête : auth.getUser() fait un aller-retour réseau vers
// Supabase Auth (vérification JWT). Le layout du dashboard ET chaque page
// l'appelaient chacun séparément, doublant ce coût sur chaque navigation —
// utiliser ce helper partagé au lieu de `(await getSupabaseServer()).auth.getUser()`.
export const getCurrentUser = cache(async function getCurrentUser() {
  const supabase = await getSupabaseServer();
  return supabase.auth.getUser();
});

// Mémoïsé par requête : le layout du dashboard propriétaire ET quasi chaque
// page refaisaient chacun `select(...) from villas where owner_id = X` —
// chaque round-trip Supabase coûtant ~300ms, ces doublons multipliaient le
// temps de chargement de chaque navigation. `select("*")` couvre tous les
// besoins (les pages qui n'utilisaient que quelques colonnes en piochent un
// sous-ensemble), la déduplication par requête l'emporte sur le léger surcoût
// de sur-fetch (table villas = quelques lignes par propriétaire).
export const getOwnerVillas = cache(async function getOwnerVillas(ownerId: string) {
  const supabase = await getSupabaseServer();
  return supabase
    .from("villas")
    .select("*")
    .eq("owner_id", ownerId)
    .order("name")
    .returns<Villa[]>();
});
