import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAdmin, AuthError } from "@/lib/auth/server";
import Stripe from "stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || "";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request);
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }

  try {
    const { id } = await params;
    const supabase = supabaseAdmin();

    // 1. Profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("stripe_connect_account_id, stripe_connect_onboarding_completed")
      .eq("id", id)
      .single();

    if (profileError || !profile?.stripe_connect_account_id) {
      return NextResponse.json({
        chargesEnabled: false,
        payoutsEnabled: false,
        detailsSubmitted: false,
        disputes: [],
        payouts: [],
      });
    }

    // 2. Stripe API — statut Connect
    let chargesEnabled = false;
    let payoutsEnabled = false;
    let detailsSubmitted = false;
    let payouts: any[] = [];

    if (stripeSecretKey) {
      const stripe = new Stripe(stripeSecretKey, { apiVersion: "2025-03-31.basil" as any });

      try {
        const account = await stripe.accounts.retrieve(profile.stripe_connect_account_id);
        chargesEnabled = account.charges_enabled ?? false;
        payoutsEnabled = account.payouts_enabled ?? false;
        detailsSubmitted = account.details_submitted ?? false;
      } catch (e) {
        console.error("Failed to retrieve Stripe account:", e);
      }

      // Payouts
      try {
        const transfers = await stripe.transfers.list({
          destination: profile.stripe_connect_account_id,
          limit: 10,
        });
        payouts = transfers.data.map((t: any) => ({
          id: t.id,
          amount: t.amount,
          currency: t.currency,
          created: new Date(t.created * 1000).toISOString(),
        }));
      } catch (e) {
        console.error("Failed to list transfers:", e);
      }
    }

    // 3. Disputes from DB (table peut ne pas exister encore)
    let disputes: any[] = [];
    try {
      const { data: villas } = await supabase
        .from("villas")
        .select("id")
        .eq("owner_id", id);

      const villaIds = (villas ?? []).map((v) => v.id);

      if (villaIds.length > 0) {
        const { data: bookings } = await supabase
          .from("bookings")
          .select("id")
          .in("villa_id", villaIds);

        if (bookings?.length) {
          const { data: d } = await supabase
            .from("stripe_disputes")
            .select("*")
            .in("booking_id", bookings.map((b) => b.id));
          disputes = d ?? [];
        }
      }
    } catch {
      // Table stripe_disputes pas encore créée — ignoré
    }
    }

    return NextResponse.json({
      chargesEnabled,
      payoutsEnabled,
      detailsSubmitted,
      disputes,
      payouts,
    });
  } catch (err) {
    console.error("GET /api/admin/owners/[id]/stripe error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
