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
  "/soumettre-ma-villa",
  "/success",
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
  "/api/sync-ota",
  "/api/import-airbnb",
  "/api/send-booking-confirmation",
  "/api/notify-admin-booking",
  "/api/analytics",
  "/api/villa-submissions",
  "/api/villa-photo-upload",
  "/api/chat",
];

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/fonts") ||
    /\.(?:jpg|jpeg|png|gif|svg|webp|avif|ico|webm|mp4|mov|woff2?|ttf|eot|otf|pdf|xml|txt)$/i.test(pathname)
  ) {
    return NextResponse.next();
  }

  const isPublic = publicPaths.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
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
      ? "/admin"
      : isOwnerRole(null, meta)
      ? "/dashboard"
      : "/espace-client";
    const redirectRes = NextResponse.redirect(new URL(dest, request.url));
    supabaseResponse.cookies.getAll().forEach(({ name, value }) => {
      redirectRes.cookies.set(name, value);
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
    // Copier les cookies rafraîchis par Supabase
    supabaseResponse.cookies.getAll().forEach(({ name, value }) => {
      redirectRes.cookies.set(name, value);
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
    supabaseResponse.cookies.getAll().forEach(({ name, value }) => {
      res.cookies.set(name, value);
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

  // Compte staff sur dashboard → admin
  if (adminUser && pathname.startsWith("/dashboard")) {
    return doRedirect("/admin");
  }

  // Staff sur espace-client → admin
  if (adminUser && pathname.startsWith("/espace-client")) {
    return doRedirect("/admin");
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
