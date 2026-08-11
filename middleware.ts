import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isOwnerRole, isStaffAdmin } from "@/lib/auth/admin-access";

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
  "/soumettre-ma-villa",
  "/success",
  "/update-password",
  // Auth
  "/login",
  "/register",
  "/auth/callback",
  "/auth/confirm",
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
      if (
        !isAdminRoute &&
        !pathname.startsWith("/api") &&
        !pathname.startsWith("/_next") &&
        !pathname.startsWith("/images") &&
        !pathname.startsWith("/fonts")
      ) {
        return NextResponse.redirect(new URL(pathname + request.nextUrl.search, PUBLIC_BASE));
      }
      return NextResponse.next();
    }
    // Domaine public : routes admin → 404 (aucun appelant externe, isolation totale)
    if (isAdminRoute) {
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
  } = await supabase.auth.getUser();

  // Utilisateur connecté sur /login → rediriger vers son espace
  if (user && pathname === "/login") {
    const meta = (user.user_metadata?.role as string | undefined) ?? "client";
    const dest = isStaffAdmin(null, meta, user.email)
      ? adminDashboardDest
      : isOwnerRole(null, meta)
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
    return supabaseResponse;
  }

  // Pages protégées : pas d'utilisateur → rediriger vers login
  if (!user) {
    const url = new URL("/login", request.url);
    url.searchParams.set("redirect", pathname);
    const redirectRes = NextResponse.redirect(url);
    // Copier les cookies rafraîchis par Supabase (avec leurs options : maxAge, sameSite, secure…)
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectRes.cookies.set(cookie);
    });
    return redirectRes;
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
