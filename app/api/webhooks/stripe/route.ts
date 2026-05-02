import { NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || "";
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

const stripe = new Stripe(stripeSecretKey, { apiVersion: "2023-10-16" });

export async function POST(request: Request) {
  if (!stripeSecretKey || !webhookSecret) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
  }

  let body: string;
  try {
    body = await request.text();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const sig = request.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Stripe webhook signature verification failed:", message);
    return NextResponse.json({ error: `Webhook signature failed: ${message}` }, { status: 400 });
  }

  const supabase = supabaseAdmin();

  // ── Idempotence : si déjà traité, on renvoie 200 sans rien faire ──
  const { data: existing } = await supabase
    .from("stripe_events_processed")
    .select("event_id")
    .eq("event_id", event.id)
    .maybeSingle();
  if (existing) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const bookingId = session.metadata?.bookingId;
      if (!bookingId) {
        console.error("Stripe webhook: no bookingId in metadata");
        return NextResponse.json({ error: "Missing bookingId" }, { status: 400 });
      }

      // Lire le statut actuel pour l'historique
      const { data: currentBooking } = await supabase
        .from("bookings")
        .select("id, status")
        .eq("id", bookingId)
        .single();

      const oldStatus = currentBooking?.status || "pending";

      const guestEmail = session.customer_email || session.customer_details?.email || null;

      const { error: updateError } = await supabase
        .from("bookings")
        .update({
          status: "confirmed",
          payment_status: "paid",
          ...(guestEmail && { guest_email: guestEmail }),
        })
        .eq("id", bookingId);

      if (updateError) {
        console.error("Stripe webhook: failed to update booking", updateError);
        return NextResponse.json({ error: "Database update failed" }, { status: 500 });
      }

      // Enregistrer le changement de statut dans l'historique
      await supabase.from("order_status_history").insert({
        booking_id: bookingId,
        from_status: oldStatus,
        to_status: "confirmed",
        changed_by: "stripe_webhook",
        reason: "checkout.session.completed",
      });

      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
      const apiKey = process.env.API_SECRET_KEY;
      const authHeaders: Record<string, string> = apiKey
        ? { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" }
        : { "Content-Type": "application/json" };

      try {
        await fetch(`${baseUrl}/api/send-booking-confirmation`, {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify({ bookingId }),
        });
      } catch (e) {
        console.error("Send booking confirmation failed:", e);
      }

      try {
        await fetch(`${baseUrl}/api/notify-admin-booking`, {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify({ bookingId }),
        });
      } catch (e) {
        console.error("Notify admin failed:", e);
      }
    }

    if (event.type === "checkout.session.expired") {
      const session = event.data.object as Stripe.Checkout.Session;
      const bookingId = session.metadata?.bookingId;
      if (bookingId) {
        const { data: currentBooking } = await supabase
          .from("bookings")
          .select("id, status")
          .eq("id", bookingId)
          .single();

        if (currentBooking && currentBooking.status === "pending") {
          await supabase
            .from("bookings")
            .update({ status: "cancelled", payment_status: "unpaid" })
            .eq("id", bookingId);

          await supabase.from("order_status_history").insert({
            booking_id: bookingId,
            from_status: "pending",
            to_status: "cancelled",
            changed_by: "stripe_webhook",
            reason: "checkout.session.expired",
          });
        }
      }
    }

    // Marquer comme traité (idempotence)
    await supabase.from("stripe_events_processed").insert({
      event_id: event.id,
      event_type: event.type,
    });

    return NextResponse.json({ received: true });
  } catch (err) {
    // NE PAS marquer comme processed si erreur → Stripe retentera
    const message = err instanceof Error ? err.message : "Handler error";
    console.error("Stripe webhook handler error:", message);
    return NextResponse.json({ error: `Handler failed: ${message}` }, { status: 500 });
  }
}
