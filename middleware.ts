import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isOwnerRole, isStaffAdmin } from "@/lib/auth/admin-access";

/** Conserve les cookies posés par Supabase SSR (ex. refresh JWT) lors d'une redirection. */
function redirectWithSessionCookies(
  request: NextRequest,
  path: string,
  sessionResponse: NextResponse
): NextResponse {
  const res = NextResponse.redirect(new URL(path, request.url));
  sessionResponse.cookies.getAll().forEach(({ name, value }) => {
    res.cookies.set(name, value);
  });
  return res;
}

const publicPaths = [
  "/",
  "/villas",
  "/login",
  "/register",
  "/soumettre-ma-villa",
  "/api/booking",
  "/api/booking-session",
  "/api/webhooks/stripe",
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

export async function middleware(request: NextRequest) {
  let { pathname } = request.nextUrl;

  // Skip auth for public paths
  const isPublic = publicPaths.some(
    (p) => pathname === p || pathname.startsWith(p)
  );
  if (isPublic) {
    return NextResponse.next();
  }

  // Skip auth for Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/fonts")
  ) {
    return NextResponse.next();
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // Refresh session and get user — uses getUser() not getSession() for security
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const metaRole =
    (user.user_metadata?.role as string | undefined) ?? "client";

  const needsProfileForRbac =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/espace-client");

  let profileRole: string | null = null;
  if (needsProfileForRbac) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    profileRole = profile?.role ?? null;
  }

  const adminUser = isStaffAdmin(profileRole, metaRole, user.email);
  const ownerUser = isOwnerRole(profileRole, metaRole);

  // Zone /admin réservée au rôle admin (staff), pas aux propriétaires
  if (pathname.startsWith("/admin")) {
    if (!adminUser) {
      if (ownerUser) {
        return redirectWithSessionCookies(request, "/dashboard", response);
      }
      return redirectWithSessionCookies(request, "/espace-client", response);
    }
  }

  // Compte staff : tout le périmètre /dashboard* est le shell propriétaire → back-office /admin
  // (hub « classique » : /admin/hub-classique)
  if (adminUser && pathname.startsWith("/dashboard")) {
    return redirectWithSessionCookies(request, "/admin", response);
  }

  // ── RBAC : JWT seul est trompeur (défaut "client") ; on s'appuie sur profiles.role ──

  // Staff sur l'espace locataire → back-office
  if (adminUser && pathname.startsWith("/espace-client")) {
    return redirectWithSessionCookies(request, "/admin", response);
  }

  // Propriétaire sur l'espace locataire → dashboard proprio
  if (ownerUser && pathname.startsWith("/espace-client")) {
    return redirectWithSessionCookies(request, "/dashboard", response);
  }

  // Locataire / autre non-proprio sur le dashboard proprio → espace client
  if (!adminUser && !ownerUser && pathname.startsWith("/dashboard")) {
    return redirectWithSessionCookies(request, "/espace-client", response);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|images/|fonts/).*)",
  ],
};
