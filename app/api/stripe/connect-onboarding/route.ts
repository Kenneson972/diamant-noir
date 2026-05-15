import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { createConnectAccount, createOnboardingLink } from "@/lib/stripe/connect";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { ownerId } = await request.json();

    if (!ownerId || typeof ownerId !== "string") {
      return NextResponse.json({ error: "ownerId requis" }, { status: 400 });
    }

    const supabase = supabaseAdmin();

    // Vérifier que le profil existe
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, email, stripe_connect_account_id, stripe_connect_onboarding_completed")
      .eq("id", ownerId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Propriétaire introuvable" }, { status: 404 });
    }

    // Si déjà onboardé, retourner directement
    if (profile.stripe_connect_onboarding_completed && profile.stripe_connect_account_id) {
      return NextResponse.json({
        already_onboarded: true,
        account_id: profile.stripe_connect_account_id,
      });
    }

    // S'il a déjà un compte Connect mais pas terminé, générer un nouveau lien
    let accountId = profile.stripe_connect_account_id;

    if (!accountId) {
      // Créer un compte Connect Express
      const { accountId: newAccountId } = await createConnectAccount(profile.email || "unknown@kayvila.com");
      accountId = newAccountId;

      // Sauvegarder l'ID du compte
      await supabase
        .from("profiles")
        .update({ stripe_connect_account_id: accountId })
        .eq("id", ownerId);
    }

    // Générer le lien d'onboarding
    const { url } = await createOnboardingLink(accountId);

    return NextResponse.json({ url, account_id: accountId });
  } catch (error) {
    console.error("Stripe Connect onboarding error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur serveur" },
      { status: 500 }
    );
  }
}
