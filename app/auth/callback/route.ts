import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Route appelée par Supabase Auth après :
 * - Confirmation d'email (signup)
 * - Magic link (login sans mot de passe)
 * - Réinitialisation de mot de passe
 *
 Elle échange le code d'authentification contre une session,
 * pose les cookies et redirige vers la page demandée.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);

  // Récupérer le code d'authentification et le paramètre next
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/espace-client";

  if (code) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent("Supabase non configuré")}`
      );
    }

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

    // Échanger le code contre une session
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return response;
    }
  }

  // En cas d'erreur, rediriger vers login
  return NextResponse.redirect(
    `${origin}/login?error=${encodeURIComponent(
      searchParams.get("error_description") || "Impossible de finaliser l'authentification"
    )}`
  );
}
