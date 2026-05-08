import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { postLoginDestination } from "@/lib/auth/admin-access";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/espace-client";

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.redirect(`${origin}/login?error=configuration`);
  }

  let response = NextResponse.redirect(`${origin}${next}`);

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("Auth callback error:", error.message);
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error.message)}&redirect=${next}`
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let destination = next;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    destination = postLoginDestination({
      requestedRedirect: next,
      profileRole: profile?.role ?? null,
      metadataRole: user.user_metadata?.role as string | undefined,
      email: user.email,
    });
  }

  if (destination !== next) {
    const res = NextResponse.redirect(`${origin}${destination}`);
    response.cookies.getAll().forEach(({ name, value }) => {
      res.cookies.set(name, value);
    });
    return res;
  }

  return response;
}
