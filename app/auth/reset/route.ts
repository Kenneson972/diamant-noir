import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  buildAuthCookiePurge,
  normalizeCookieDomain,
} from "@/lib/auth/stale-session";

const SUPABASE_COOKIE_DOMAIN = normalizeCookieDomain(process.env.SUPABASE_COOKIE_DOMAIN);

/**
 * Purge de l'état d'authentification local — l'équivalent supporté de
 * « réessayer en navigation privée ».
 *
 * Un utilisateur peut se retrouver coincé par un cookie `sb-*` résiduel sans
 * pouvoir s'en sortir depuis l'interface :
 * - une session encore valide le fait sortir de `/login` (middleware) avant
 *   qu'il n'atteigne le bouton « Continuer avec Google » ;
 * - un `code_verifier` orphelin fait échouer l'échange PKCE ;
 * - un cookie host-only écrit avant la bascule sur `.kayvila.com`
 *   (commit c45cf30) n'est réécrit ni supprimé par aucun code de l'app, donc
 *   il survit indéfiniment.
 *
 * On expire donc CHAQUE cookie `sb-*` présent, dans les DEUX portées possibles
 * (host-only et domain-scopée) : un `Set-Cookie` d'expiration ne supprime que
 * le cookie dont le couple (domaine, chemin) correspond exactement, donc il
 * faut émettre les deux variantes pour couvrir les deux générations.
 *
 * Route volontairement non authentifiée : elle ne fait que détruire de l'état
 * côté client, ne lit aucune donnée et ne peut donc pas servir à en exfiltrer.
 * Son seul effet hostile possible est de déconnecter la victime d'un CSRF —
 * sans conséquence, `/logout` étant de toute façon à sa disposition.
 */
export async function GET(request: NextRequest) {
  const { origin } = new URL(request.url);
  const response = NextResponse.redirect(`${origin}/login?reset=1`);

  const staleNames = request.cookies
    .getAll()
    .map((cookie) => cookie.name)
    .filter((name) => name.startsWith("sb-"));


  // Sérialisation partagée avec le coupe-circuit du middleware.
  for (const header of buildAuthCookiePurge(staleNames, {
    domain: SUPABASE_COOKIE_DOMAIN,
    secure: new URL(request.url).protocol === "https:",
  })) {
    response.headers.append("set-cookie", header);
  }

  // Empêche tout cache (CDN ou navigateur) de resservir cette réponse sans
  // ses en-têtes Set-Cookie, ce qui rendrait la purge silencieusement inopérante.
  response.headers.set("Cache-Control", "no-store, max-age=0");

  return response;
}
