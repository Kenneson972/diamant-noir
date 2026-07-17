import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";

/**
 * Route appelée par Supabase Auth après :
 * - Confirmation d'email (signup)
 * - Magic link (login sans mot de passe)
 * - Réinitialisation de mot de passe
 *
 * Elle finalise l'authentification puis redirige vers la page demandée.
 * Deux flux sont supportés :
 * - `?code=…` : flux PKCE (déclenché par l'app elle-même, avec code verifier local).
 * - `?token_hash=…&type=…` : flux OTP/lien email (recovery, invite, magic link),
 *   notamment les liens envoyés depuis le Dashboard Supabase — sans code verifier.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);

  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/espace-client";

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  if ((code || (tokenHash && type)) && supabaseUrl && supabaseAnonKey) {
    const response = NextResponse.redirect(`${origin}${next}`);

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

    const { error } = code
      ? await supabase.auth.exchangeCodeForSession(code)
      : await supabase.auth.verifyOtp({ type: type!, token_hash: tokenHash! });

    if (!error) {
      return response;
    }
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent("Supabase non configuré")}`
    );
  }

  // En cas d'erreur, rediriger vers login
  return NextResponse.redirect(
    `${origin}/login?error=${encodeURIComponent(
      searchParams.get("error_description") || "Impossible de finaliser l'authentification"
    )}`
  );
}
