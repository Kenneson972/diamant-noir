import { createBrowserClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

let supabaseBrowserClient: ReturnType<typeof createBrowserClient> | null = null;

/**
 * Domaine des cookies de session, côté NAVIGATEUR.
 *
 * Le login se fait côté client (`signInWithPassword`), donc c'est CE client qui
 * écrit le cookie `sb-*`. Sans domaine explicite le cookie est host-only sur
 * kayvila.com et reste invisible sur admin.kayvila.com → le layout admin ne voit
 * pas de session et renvoie vers /login, qui re-redirige vers l'admin : boucle.
 * `SUPABASE_COOKIE_DOMAIN` (serveur/middleware) n'est pas exposé au navigateur,
 * on dérive donc le domaine du host courant.
 *
 * On ne pose un domaine que si l'on est bien sur le domaine du site (ou un de
 * ses sous-domaines) : en local et sur les previews *.vercel.app, on garde le
 * comportement host-only (un cookie `.vercel.app` serait de toute façon rejeté).
 */
function getBrowserCookieDomain(): string | undefined {
  if (typeof window === "undefined") return undefined;

  const siteHost = (() => {
    try {
      return new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://kayvila.com").hostname;
    } catch {
      return "kayvila.com";
    }
  })();

  const host = window.location.hostname;
  if (host === siteHost || host.endsWith(`.${siteHost}`)) {
    return `.${siteHost}`;
  }
  return undefined;
}

export const getSupabaseBrowser = () => {
  if (supabaseBrowserClient) return supabaseBrowserClient;

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  const domain = getBrowserCookieDomain();
  supabaseBrowserClient = createBrowserClient(
    supabaseUrl,
    supabaseAnonKey,
    domain ? { cookieOptions: { domain } } : undefined
  );
  return supabaseBrowserClient;
};

let staleSessionPurge: Promise<void> | null = null;

/**
 * Un refresh token périmé fait échouer getUser()/getSession() pour CHAQUE
 * consommateur monté (AuthContext, Navbar, wishlist, pages…). Chacun relance un
 * refresh, gotrue vole le verrou des autres, et le navigateur a émis ~110
 * requêtes /auth/v1/token en 10 s avant que Supabase rate-limite l'IP : le login
 * légitime échouait alors en 429 (audit préprod 2026-08-29).
 *
 * On purge donc la session locale au premier échec, une seule fois par page
 * (la promesse est mémorisée), ce qui coupe la boucle et laisse l'utilisateur
 * dans un état déconnecté propre plutôt que bloqué au login.
 */
export function isStaleRefreshTokenError(
  error: { message?: string; code?: string } | null | undefined
): boolean {
  if (!error) return false;
  return error.code === "refresh_token_not_found" || /refresh token/i.test(error.message ?? "");
}

export function purgeStaleSession(): Promise<void> {
  if (staleSessionPurge) return staleSessionPurge;
  const supabase = getSupabaseBrowser();
  if (!supabase) return Promise.resolve();
  const purge: Promise<void> = supabase.auth
    .signOut({ scope: "local" })
    .then(() => undefined)
    .catch(() => undefined);
  staleSessionPurge = purge;
  return purge;
}

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
