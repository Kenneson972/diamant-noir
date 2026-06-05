import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { createConnectAccount, createOnboardingLink } from "@/lib/stripe/connect";
import { requireAuth, AuthError } from "@/lib/auth/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const userId = await requireAuth(request);

    const supabase = supabaseAdmin();

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, email, stripe_connect_account_id, stripe_connect_onboarding_completed")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Propriétaire introuvable" }, { status: 404 });
    }

    if (profile.stripe_connect_onboarding_completed && profile.stripe_connect_account_id) {
      return NextResponse.json({
        already_onboarded: true,
        account_id: profile.stripe_connect_account_id,
      });
    }

    let accountId = profile.stripe_connect_account_id;

    if (!accountId) {
      const { accountId: newAccountId } = await createConnectAccount(profile.email || "unknown@kayvila.com");
      accountId = newAccountId;

      await supabase
        .from("profiles")
        .update({ stripe_connect_account_id: accountId })
        .eq("id", userId);
    }

    const { url } = await createOnboardingLink(accountId);

    return NextResponse.json({ url, account_id: accountId });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Stripe Connect onboarding error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur serveur" },
      { status: 500 }
    );
  }
}
