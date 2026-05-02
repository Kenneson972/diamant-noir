import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

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

  // Redirect old /dashboard/proprio/* to /dashboard/*
  if (pathname.startsWith("/dashboard/proprio")) {
    const newPath = pathname.replace("/dashboard/proprio", "/dashboard");
    return NextResponse.redirect(new URL(newPath, request.url));
  }

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

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|images/|fonts/).*)",
  ],
};
