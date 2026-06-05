import { NextResponse } from "next/server";
import { z } from "zod";
import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAdmin, AuthError } from "@/lib/auth/server";
import { logAdminAction } from "@/lib/admin/audit-log";
import { ipFromRequest } from "@/lib/security";

export const runtime = "nodejs";

const refundSchema = z.object({
  bookingId: z.string().uuid(),
  reason: z.string().max(500).optional(),
});

const stripeSecretKey = process.env.STRIPE_SECRET_KEY ?? "";

export async function POST(request: Request) {
  if (!stripeSecretKey) {
    return NextResponse.json({ error: "Stripe non configuré" }, { status: 500 });
  }

  try {
    await requireAdmin(request);

    const parsed = refundSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Données invalides" },
        { status: 400 }
      );
    }

    const { bookingId, reason } = parsed.data;
    const supabase = supabaseAdmin();

    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("id, stripe_payment_intent_id, payment_status, status")
      .eq("id", bookingId)
      .maybeSingle();

    if (bookingError || !booking) {
      return NextResponse.json({ error: "Réservation introuvable" }, { status: 404 });
    }

    if (!booking.stripe_payment_intent_id) {
      return NextResponse.json(
        { error: "Aucun paiement Stripe associé à cette réservation" },
        { status: 400 }
      );
    }

    if (booking.payment_status === "refunded") {
      return NextResponse.json({ error: "Cette réservation est déjà remboursée" }, { status: 409 });
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2025-03-31.basil" as Stripe.StripeConfig["apiVersion"],
    });

    const refund = await stripe.refunds.create({
      payment_intent: booking.stripe_payment_intent_id,
      reverse_transfer: true,
      metadata: {
        bookingId: booking.id,
        reason: reason ?? "admin_refund",
      },
    });

    await supabase
      .from("bookings")
      .update({
        payment_status: "refunded",
        ...(booking.status === "confirmed" || booking.status === "paid"
          ? { status: "cancelled" }
          : {}),
      })
      .eq("id", booking.id);

    await supabase.from("order_status_history").insert({
      booking_id: booking.id,
      from_status: booking.status,
      to_status: booking.status === "confirmed" || booking.status === "paid" ? "cancelled" : booking.status,
      changed_by: "admin_refund",
      reason: reason ?? "Remboursement admin",
    });

    await logAdminAction(
      "stripe.admin_refund",
      { bookingId: booking.id, refundId: refund.id, amount: refund.amount },
      ipFromRequest(request)
    );

    return NextResponse.json({ ok: true, refundId: refund.id, amount: refund.amount });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[admin-refund]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Échec du remboursement" },
      { status: 500 }
    );
  }
}
