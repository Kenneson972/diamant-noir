import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getConnectAccount } from "@/lib/stripe/connect";

export const runtime = "nodejs";

/**
 * Vérifie le statut du compte Stripe Connect d'un propriétaire
 * après son retour du flow d'onboarding.
 * Met à jour stripe_connect_onboarding_completed si charges_enabled.
 */
export async function POST(request: Request) {
  try {
    const { ownerId } = await request.json();

    if (!ownerId || typeof ownerId !== "string") {
      return NextResponse.json({ error: "ownerId requis" }, { status: 400 });
    }

    const supabase = supabaseAdmin();

    // Récupérer le profil
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, stripe_connect_account_id, stripe_connect_onboarding_completed")
      .eq("id", ownerId)
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

    // Vérifier le statut du compte Connect
    const account = await getConnectAccount(profile.stripe_connect_account_id);

    // Onboarding terminé si details_submitted OU charges_enabled
    // (en mode test, charges_enabled peut être false même si le formulaire est complet)
    const onboarded = account.charges_enabled || account.details_submitted;

    if (onboarded) {
      // Mettre à jour le profil
      await supabase
        .from("profiles")
        .update({ stripe_connect_onboarding_completed: true })
        .eq("id", ownerId);

      return NextResponse.json({ connected: true });
    }

    // L'onboarding n'est pas terminé
    return NextResponse.json({
      connected: false,
      details_submitted: account.details_submitted,
      charges_enabled: account.charges_enabled,
    });
  } catch (error) {
    console.error("Connect verify error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur serveur" },
      { status: 500 }
    );
  }
}
