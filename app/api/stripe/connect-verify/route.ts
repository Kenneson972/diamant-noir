import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getConnectAccount } from "@/lib/stripe/connect";
import { requireAuth, AuthError } from "@/lib/auth/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const userId = await requireAuth(request);

    const supabase = supabaseAdmin();

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, stripe_connect_account_id, stripe_connect_onboarding_completed")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Propriétaire introuvable" }, { status: 404 });
    }

    if (!profile.stripe_connect_account_id) {
      return NextResponse.json({ error: "Aucun compte Stripe Connect trouvé" }, { status: 400 });
    }

    if (profile.stripe_connect_onboarding_completed) {
      return NextResponse.json({ connected: true });
    }

    const account = await getConnectAccount(profile.stripe_connect_account_id);

    const onboarded = account.charges_enabled || account.details_submitted;

    if (onboarded) {
      await supabase
        .from("profiles")
        .update({ stripe_connect_onboarding_completed: true })
        .eq("id", userId);

      return NextResponse.json({ connected: true });
    }

    return NextResponse.json({
      connected: false,
      details_submitted: account.details_submitted,
      charges_enabled: account.charges_enabled,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Connect verify error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur serveur" },
      { status: 500 }
    );
  }
}
