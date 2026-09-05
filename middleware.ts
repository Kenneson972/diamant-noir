import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isOwnerRole, isStaffAdmin } from "@/lib/auth/admin-access";
import { isStaleAuthError, buildAuthCookiePurge } from "@/lib/auth/stale-session";

const publicPaths = [
  // Pages marketing / info
  "/",
  "/villas",
  "/book",
  "/prestations",
  "/qui-sommes-nous",
  "/faq",
  "/contact",
  "/terms",
  "/mentions-legales",
  "/cgv",
  "/confidentialite",
  "/cookies",
  "/tarifs",
  "/experience",
  "/experiences",
  "/soumettre-ma-villa",
  "/success",
  "/update-password",
  // Auth
  "/login",
  "/register",
  "/auth/callback",
  "/auth/confirm",
  "/auth/reset",
  // API
  "/api/booking",
  "/api/booking-session",
  "/api/webhooks/stripe",
  "/api/stripe/connect-onboarding",
  "/api/stripe/connect-verify",
  "/api/contact",
  "/api/import-airbnb",
  "/api/send-booking-confirmation",
  "/api/notify-admin-booking",
  "/api/analytics",
  "/api/villa-submissions",
  "/api/villa-photo-upload",
  "/api/chat",
  "/api/concierge",
  "/api/agent",
  "/api/tenant/request-ack",
];

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// Domaine des cookies Supabase : normalisé avec le point en tête pour couvrir
// kayvila.com + tous les sous-domaines (admin.kayvila.com). En dev : host-only.
const SUPABASE_COOKIE_DOMAIN = process.env.SUPABASE_COOKIE_DOMAIN
  ? `.${process.env.SUPABASE_COOKIE_DOMAIN.replace(/^\./, "")}`
  : undefined; // undefined en local/preview → cookie host-only, comportement inchangé

export async function middleware(request: NextRequest) {
  const { pathname, hostname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/fonts") ||
    /\.(?:jpg|jpeg|png|gif|svg|webp|avif|ico|webm|mp4|mov|woff2?|ttf|eot|otf|pdf|xml|txt)$/i.test(pathname)
  ) {
    return NextResponse.next();
  }

  // === Routage admin / public (production uniquement) ===
  // Admin migré sur admin.kayvila.com. Les pages /admin et les routes API admin
  // deviennent inaccessibles sur le domaine public. Le dashboard propriétaire
  // (proprio) et les pages marketing/booking restent sur le domaine public.
  const isAdminHost = hostname.startsWith("admin.");
  const isAdminRoute =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api/admin") ||
    pathname.startsWith("/api/concierge/admin") ||
    pathname.startsWith("/api/stripe/admin-refund") ||
    pathname.startsWith("/api/agent/admin-context");

  // Cible admin : absolue en prod (cross-domaine), relative en dev
  const ADMIN_URL = process.env.NEXT_PUBLIC_ADMIN_URL || "https://admin.kayvila.com";
  const adminDashboardDest =
    process.env.NODE_ENV === "development" ? "/admin" : `${ADMIN_URL}/admin`;

  if (process.env.NODE_ENV !== "development") {
    const PUBLIC_BASE = process.env.NEXT_PUBLIC_SITE_URL || "https://kayvila.com";
    if (isAdminHost) {
      // Racine du sous-domaine admin → dashboard admin
      if (pathname === "/") {
        return NextResponse.redirect(new URL("/admin", request.url));
      }
      // Route publique sur le sous-domaine admin → URL ABSOLUE du domaine public
      // (jamais '/' relatif — boucle infinie sinon). Les assets et /api passent.
      // ⚠️ Les fetch RSC (Accept: text/x-component) NE SUIVENT PAS les redirects →
      // les servir localement pour ne pas casser la navigation client (leçon Kayvila).
      if (
        !isAdminRoute &&
        !pathname.startsWith("/api") &&
        !pathname.startsWith("/_next") &&
        !pathname.startsWith("/images") &&
        !pathname.startsWith("/fonts")
      ) {
        // Détecter TOUTES les variantes de requête RSC : le prefetch du Link Next
        // envoie `RSC: 1` + `Next-Router-Prefetch: 1` avec `Accept: */*` (et le
        // param `?_rsc=`), PAS `Accept: text/x-component` — tester l'Accept seul
        // laissait passer les prefetch en 307 → bloqués par la CSP connect-src.
        const isRSC =
          (request.headers.get("accept")?.includes("text/x-component") ?? false) ||
          request.headers.get("rsc") === "1" ||
          request.headers.has("next-router-prefetch") ||
          request.nextUrl.searchParams.has("_rsc");
        if (!isRSC) {
          return NextResponse.redirect(new URL(pathname + request.nextUrl.search, PUBLIC_BASE));
        }
        return NextResponse.next();
      }
      // Assets et routes API admin : laisser passer (les handlers API portent leur
      // propre contrôle d'accès).
      if (
        pathname.startsWith("/api") ||
        pathname.startsWith("/_next") ||
        pathname.startsWith("/images") ||
        pathname.startsWith("/fonts")
      ) {
        return NextResponse.next();
      }
      // ⚠️ NE PAS court-circuiter les PAGES admin ici : sans session, le middleware
      // doit émettre le 307 vers /login. Si on rend la main à Next, le layout
      // `app/(admin)/admin/layout.tsx` appelle bien redirect(), mais `loading.tsx` a
      // déjà flushé le shell → la réponse est committée en 200 et la redirection ne
      // part jamais : l'admin reste sur un squelette vide (« chargement infini »).
      // On tombe volontairement dans le bloc auth/RBAC ci-dessous.
    }
    // Domaine public UNIQUEMENT : routes admin → 404 (aucun appelant externe,
    // isolation totale). ⚠️ Le test `!isAdminHost` est indispensable : depuis que
    // les pages admin traversent le bloc ci-dessus au lieu de retourner, une route
    // admin servie sur admin.kayvila.com atteindrait ce 404 et rendrait tout
    // l'admin inaccessible.
    if (!isAdminHost && isAdminRoute) {
      return new NextResponse(null, { status: 404 });
    }
  }

  // Support des préfixes de langue /en et /es : vérifier si le chemin sans préfixe est public
  const langPrefixMatch = pathname.match(/^\/(en|es)(\/.*)?$/);
  if (langPrefixMatch) {
    const pathWithoutLang = langPrefixMatch[2] || "/";
    const isLangPublic = publicPaths.some(
      (p) => pathWithoutLang === p || pathWithoutLang.startsWith(p + "/")
    );
    if (isLangPublic) {
      const localeCookie = request.cookies.get("dn_locale");
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set("x-dn-locale", localeCookie?.value ?? langPrefixMatch[1]);
      return NextResponse.next({ request: { headers: requestHeaders } });
    }
  }

  const isPublic = publicPaths.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );

  // Inject locale from cookie → header for server components
  const localeCookie = request.cookies.get("dn_locale");
  const locale = localeCookie?.value ?? "fr";
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-dn-locale", locale);

  // Route /auth/callback gère elle-même l'échange (PKCE `code` ou `token_hash`).
  // Ne PAS lancer getUser() ici : le cookie `sb-*-auth-token-code-verifier`
  // contient "auth" et satisfait hasSupabaseAuthCookie ci-dessous, donc sans ce
  // retour anticipé le middleware ferait getUser() sur la requête callback.
  // Avec une session périmée, le refresh échoue (400/429) et supabase-js purge
  // `${storageKey}-code-verifier` (GoTrueClient.js _removeSession) AVANT
  // l'exchangeCodeForSession de la route → échec silencieux
  // « Impossible de finaliser l'authentification ».
  if (pathname === "/auth/callback") {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // Route /auth/reset : purge des cookies `sb-*`. Surtout ne PAS lancer
  // getUser() ici — il rafraîchirait la session et le `setAll` ci-dessous
  // ré-émettrait les cookies que la route s'apprête à expirer, dans la même
  // réponse. La purge serait alors silencieusement annulée.
  if (pathname === "/auth/reset") {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // Visiteur anonyme sur page publique : pas d'appel réseau Supabase Auth (getUser = ~100–300 ms/clic)
  const hasSupabaseAuthCookie = request.cookies
    .getAll()
    .some((c) => c.name.startsWith("sb-") && c.name.includes("auth"));
  if (isPublic && !hasSupabaseAuthCookie) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  let supabaseResponse = NextResponse.next({ request: { headers: requestHeaders } });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          // Le domaine cross-subdomain doit être posé ICI (et au logout : même
          // domaine que la création, sinon le cookie domain-scopé survit à la
          // déconnexion — leçon Shiine)
          const cookieOptions = SUPABASE_COOKIE_DOMAIN
            ? { ...options, domain: SUPABASE_COOKIE_DOMAIN }
            : options;
          supabaseResponse.cookies.set(name, value, cookieOptions);
        });
      },
    },
  });

  // getUser() valide le JWT côté serveur et rafraîchit le token si nécessaire
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  // Refresh token mort : couper la rafale AVANT qu'elle ne déclenche le 429.
  //
  // Le matcher couvre tout sauf les assets, donc chaque prefetch Next.js d'un
  // <Link> entrant dans le viewport invoque ce middleware. Chaque invocation
  // construit son PROPRE createServerClient : aucun verrou n'est partagé entre
  // elles, contrairement au client navigateur (singleton + refreshingDeferred).
  // Une grille de villas produisait ainsi ~15 POST /token par seconde avec le
  // même token mort ; Supabase rate-limitait l'IP et TOUT appel auth echouait
  // ensuite, y compris l'exchangeCodeForSession qui finalise le login Google
  // (constaté en prod le 2026-09-05 : 274 reponses 429 en 10 minutes).
  //
  // purgeStaleSession() ne traite que le navigateur : il ne pouvait rien pour
  // ce chemin serveur. On expire donc les cookies ici, ce qui ramene la rafale
  // a un seul refresh echoue — les requetes suivantes n'ont plus de cookie.
  //
  // ⚠️ On ne retourne PAS ici : rendre la main à Next sur une page protégée
  // court-circuiterait le bloc auth/RBAC ci-dessous et renverrait un 200 au
  // lieu du 307 vers /login — c'est exactement ce qui avait produit le
  // « chargement infini » de l'admin (935b2e8). On calcule les en-têtes et on
  // les attache aux réponses existantes, sans toucher au routage.
  const stalePurge =
    !user && hasSupabaseAuthCookie && isStaleAuthError(userError)
      ? buildAuthCookiePurge(
          request.cookies.getAll().map((c) => c.name),
          {
            domain: SUPABASE_COOKIE_DOMAIN,
            secure: request.nextUrl.protocol === "https:",
          }
        )
      : [];

  const withStalePurge = <T extends NextResponse>(response: T): T => {
    for (const header of stalePurge) response.headers.append("set-cookie", header);
    return response;
  };

  // Utilisateur connecté sur /login → rediriger vers son espace.
  // ⚠️ Le role JWT (user_metadata) peut être absent (compte créé via API admin).
  // On consulte le profile en base comme pour les routes protégées (leçon Kayvila).
  if (user && pathname === "/login") {
    const meta = (user.user_metadata?.role as string | undefined) ?? "client";
    let loginProfileRole: string | null = null;
    try {
      await supabase.auth.getSession();
      const { data: loginProfile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();
      loginProfileRole = loginProfile?.role ?? null;
    } catch (e) {
      console.error("[RBAC] login profile query error:", e);
    }
    const isAdminUser = isStaffAdmin(loginProfileRole, meta, user.email);
    // Garde anti-boucle : on arrive ici REJETÉ par admin.kayvila.com (?sso=retry)
    // alors qu'on a une session valide sur le domaine public. Le cookie de session
    // n'est donc pas visible sur le sous-domaine admin (scope host-only ou mauvais
    // domaine → vérifier SUPABASE_COOKIE_DOMAIN = "kayvila.com", sans "www").
    // Renvoyer vers l'admin ici produirait un ping-pong 307 infini : on affiche le
    // login avec une erreur explicite à la place.
    if (isAdminUser && request.nextUrl.searchParams.get("sso") === "retry") {
      return supabaseResponse;
    }
    const dest = isAdminUser
      ? adminDashboardDest
      : isOwnerRole(loginProfileRole, meta)
      ? "/dashboard"
      : "/espace-client";
    const redirectRes = NextResponse.redirect(new URL(dest, request.url));
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectRes.cookies.set(cookie);
    });
    return redirectRes;
  }

  // Pages publiques : laisser passer (la session a été rafraîchie)
  if (isPublic) {
    return withStalePurge(supabaseResponse);
  }

  // Pages protégées : pas d'utilisateur → rediriger vers login
  if (!user) {
    // Le login vit sur le domaine public : depuis admin.kayvila.com, pointer
    // directement dessus (sinon admin.kayvila.com/login part en second redirect).
    const loginBase =
      isAdminHost && process.env.NODE_ENV !== "development"
        ? process.env.NEXT_PUBLIC_SITE_URL || "https://kayvila.com"
        : request.url;
    const url = new URL("/login", loginBase);
    url.searchParams.set("redirect", pathname);
    // Marqueur lu plus haut (garde anti-boucle) : signale que le sous-domaine admin
    // n'a pas vu la session, pour ne pas y renvoyer en boucle depuis /login.
    if (isAdminHost && process.env.NODE_ENV !== "development") {
      url.searchParams.set("sso", "retry");
    }
    const redirectRes = NextResponse.redirect(url);
    // Copier les cookies rafraîchis par Supabase (avec leurs options : maxAge, sameSite, secure…)
    // ⚠️ Sauf quand le refresh vient d'échouer : ces cookies-là sont morts, et les
    // recopier via l'API `cookies` écrase les en-têtes de purge ajoutés ensuite
    // (même nom → une seule entrée survit, sans la variante host-only).
    if (stalePurge.length === 0) {
      supabaseResponse.cookies.getAll().forEach((cookie) => {
        redirectRes.cookies.set(cookie);
      });
    }
    return withStalePurge(redirectRes);
  }

  const metaRole =
    (user.user_metadata?.role as string | undefined) ?? "client";

  // ── RBAC ──
  const needsProfileForRbac =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/espace-client");

  let profileRole: string | null = null;
  if (needsProfileForRbac) {
    // Initialize session in memory so _getAccessToken() uses the user's JWT (not anon key) for DB queries
    await supabase.auth.getSession();

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    profileRole = profile?.role ?? null;
    if (profileError) {
      console.error(`[RBAC] profiles query error for ${user.id}:`, profileError.message, profileError.code);
    }
  }

  const adminUser = isStaffAdmin(profileRole, metaRole, user.email);
  const ownerUser = isOwnerRole(profileRole, metaRole);

  // Helper pour rediriger en copiant les cookies de session
  const doRedirect = (path: string) => {
    const url = new URL(path, request.url);
    const res = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      res.cookies.set(cookie);
    });
    return res;
  };

  // Zone /admin réservée au rôle admin (staff)
  if (pathname.startsWith("/admin")) {
    if (!adminUser) {
      if (ownerUser) return doRedirect("/dashboard");
      return doRedirect("/espace-client");
    }
  }

  // Compte staff sur dashboard → admin (absolu en prod)
  if (adminUser && pathname.startsWith("/dashboard")) {
    return doRedirect(adminDashboardDest);
  }

  // Staff sur espace-client → admin
  if (adminUser && pathname.startsWith("/espace-client")) {
    return doRedirect(adminDashboardDest);
  }

  // Propriétaire sur espace-client → dashboard
  if (ownerUser && pathname.startsWith("/espace-client")) {
    return doRedirect("/dashboard");
  }

  // Locataire sur dashboard → espace-client
  if (!adminUser && !ownerUser && pathname.startsWith("/dashboard")) {
    return doRedirect("/espace-client");
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|images/|fonts/).*)",
  ],
};
