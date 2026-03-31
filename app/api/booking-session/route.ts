import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 30;
const rateLimitBuckets: Map<string, { count: number; resetAt: number }> =
  (globalThis as any).__dn_booking_session_rl ??
  (((globalThis as any).__dn_booking_session_rl = new Map()) as Map<string, { count: number; resetAt: number }>);

function ipFromRequest(request: Request) {
  const xf = request.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0]?.trim() || "unknown";
  const xr = request.headers.get("x-real-ip");
  return xr || "unknown";
}

function isLikelyStripeSessionId(id: string) {
  // Stripe Checkout session IDs are typically like "cs_test_..." / "cs_live_..."
  return /^cs_(test|live)_[A-Za-z0-9]+$/.test(id);
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

  const supabase = getSupabaseServer();
  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    // Security: never return PII here; session_id can leak via URLs/logs.
    .select("id, villa_id, start_date, end_date, status, payment_status, price")
    .eq("stripe_session_id", sessionId)
    .single();

  if (bookingError || !booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  // Only expose minimal info once paid/confirmed.
  if (booking.payment_status !== "paid" || booking.status !== "confirmed") {
    return NextResponse.json({ error: "Booking not available" }, { status: 404 });
  }

  const { data: villa, error: villaError } = await supabase
    .from("villas")
    .select("id, name, location")
    .eq("id", booking.villa_id)
    .single();

  if (villaError || !villa) {
    return NextResponse.json({ booking, villa: null });
  }

  return NextResponse.json({ booking, villa });
}
