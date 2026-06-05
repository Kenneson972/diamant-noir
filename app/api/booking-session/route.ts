import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireStripeServer } from "@/lib/stripe/server";
import {
  lookupClientUserIdByEmail,
  resolveBookingGuestEmail,
} from "@/lib/booking-tenant";

export const dynamic = "force-dynamic";

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 30;
const rateLimitBuckets: Map<string, { count: number; resetAt: number }> =
  (globalThis as any).__dn_booking_session_rl ??
  (((globalThis as any).__dn_booking_session_rl = new Map()) as Map<string, { count: number; resetAt: number }>);

const BOOKING_SELECT =
  "id, villa_id, start_date, end_date, status, payment_status, price" as const;

function ipFromRequest(request: Request) {
  const xf = request.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0]?.trim() || "unknown";
  const xr = request.headers.get("x-real-ip");
  return xr || "unknown";
}

function isLikelyStripeSessionId(id: string) {
  return /^cs_(test|live)_[A-Za-z0-9]+$/.test(id);
}

async function fetchVillaForBooking(
  supabase: ReturnType<typeof supabaseAdmin>,
  villaId: string
) {
  const { data: villa } = await supabase
    .from("villas")
    .select("id, name, location")
    .eq("id", villaId)
    .maybeSingle();
  return villa;
}

/** Sync local booking when Stripe Checkout is paid but webhook is delayed (typical en local). */
async function syncBookingFromStripeSession(
  supabase: ReturnType<typeof supabaseAdmin>,
  sessionId: string,
  bookingId: string
) {
  if (!process.env.STRIPE_SECRET_KEY) return false;

  try {
    const { data: currentBooking } = await supabase
      .from("bookings")
      .select("guest_email, client_user_id")
      .eq("id", bookingId)
      .maybeSingle();

    const stripe = requireStripeServer();
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== "paid") return false;

    const stripeEmail =
      session.customer_email || session.customer_details?.email || null;
    const guestEmail = resolveBookingGuestEmail(
      currentBooking?.guest_email,
      stripeEmail
    );
    const clientUserId =
      currentBooking?.client_user_id ??
      (await lookupClientUserIdByEmail(supabase, guestEmail));

    let paymentIntentId: string | null = null;
    if (session.payment_intent) {
      paymentIntentId =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent.id;
    }

    const updateData: Record<string, string> = {
      status: "confirmed",
      payment_status: "paid",
    };
    if (guestEmail) updateData.guest_email = guestEmail;
    if (clientUserId) updateData.client_user_id = clientUserId;
    if (paymentIntentId) updateData.stripe_payment_intent_id = paymentIntentId;

    const { error } = await supabase
      .from("bookings")
      .update(updateData)
      .eq("id", bookingId);

    return !error;
  } catch (err) {
    console.error("[booking-session] Stripe sync failed:", err);
    return false;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("session_id");
  if (!sessionId) {
    return NextResponse.json({ error: "Missing session_id" }, { status: 400 });
  }
  if (!isLikelyStripeSessionId(sessionId)) {
    return NextResponse.json({ error: "Invalid session_id" }, { status: 400 });
  }

  const ip = ipFromRequest(request);
  const now = Date.now();
  const bucket = rateLimitBuckets.get(ip);
  if (!bucket || bucket.resetAt <= now) {
    rateLimitBuckets.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
  } else {
    bucket.count += 1;
    if (bucket.count > RATE_LIMIT_MAX) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }
  }

  const supabase = supabaseAdmin();
  let { data: booking } = await supabase
    .from("bookings")
    .select(BOOKING_SELECT)
    .eq("stripe_session_id", sessionId)
    .maybeSingle();

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  const isConfirmed =
    booking.payment_status === "paid" && booking.status === "confirmed";

  if (!isConfirmed) {
    const synced = await syncBookingFromStripeSession(
      supabase,
      sessionId,
      booking.id
    );
    if (synced) {
      const { data: refreshed } = await supabase
        .from("bookings")
        .select(BOOKING_SELECT)
        .eq("id", booking.id)
        .maybeSingle();
      if (refreshed) booking = refreshed;
    }
  }

  const confirmed =
    booking.payment_status === "paid" && booking.status === "confirmed";
  const villa = await fetchVillaForBooking(supabase, booking.villa_id);

  if (!confirmed) {
    return NextResponse.json(
      { booking, villa, pending: true },
      { status: 202 }
    );
  }

  return NextResponse.json({ booking, villa, pending: false });
}
