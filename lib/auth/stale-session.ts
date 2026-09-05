/**
 * Expiration des cookies de session Supabase — logique partagée entre le
 * middleware (coupe-circuit automatique) et la route `/auth/reset` (purge
 * manuelle déclenchée par l'utilisateur).
 */

/** Erreurs gotrue signalant un refresh token définitivement inutilisable. */
export function isStaleAuthError(
  error: { message?: string; code?: string; status?: number } | null | undefined
): boolean {
  if (!error) return false;
  if (error.code === "refresh_token_not_found") return true;
  const message = error.message ?? "";
  // « Invalid Refresh Token: Refresh Token Not Found », « crypto: refresh token
  // length is not valid » (cookie tronqué), « Already Used »…
  if (/refresh token/i.test(message)) return true;
  // Un JWT expiré dont le refresh a échoué remonte en AuthSessionMissingError.
  if (error.code === "session_not_found") return true;
  return false;
}

/**
 * Sérialise les `Set-Cookie` d'expiration pour chaque cookie `sb-*`.
 *
 * Deux portées sont émises par cookie quand un domaine est configuré : un
 * `Set-Cookie` d'expiration ne supprime que le cookie dont le couple
 * (domaine, chemin) correspond EXACTEMENT. Les cookies host-only écrits avant
 * la bascule sur `.kayvila.com` (commit c45cf30) ne partiraient pas sans la
 * variante sans domaine.
 *
 * On sérialise à la main car `response.cookies.set()` indexe par NOM seul :
 * poser la variante domain-scopée écraserait la variante host-only.
 */
export function buildAuthCookiePurge(
  cookieNames: string[],
  options: { domain?: string; secure: boolean }
): string[] {
  const domains: (string | undefined)[] = options.domain
    ? [undefined, options.domain]
    : [undefined];

  const headers: string[] = [];
  for (const name of cookieNames) {
    if (!name.startsWith("sb-")) continue;
    for (const domain of domains) {
      const attrs = [
        `${name}=`,
        "Path=/",
        "Max-Age=0",
        "Expires=Thu, 01 Jan 1970 00:00:00 GMT",
        "SameSite=Lax",
      ];
      if (domain) attrs.push(`Domain=${domain}`);
      // Un cookie `Secure` posé en http est rejeté : en local la purge doit
      // rester effective, donc l'attribut suit le protocole de la requête.
      if (options.secure) attrs.push("Secure");
      headers.push(attrs.join("; "));
    }
  }
  return headers;
}

/** Normalise `SUPABASE_COOKIE_DOMAIN` en domaine cross-sous-domaine. */
export function normalizeCookieDomain(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  return `.${raw.replace(/^\./, "")}`;
}
