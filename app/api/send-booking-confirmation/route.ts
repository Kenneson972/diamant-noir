import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { extractToken } from "@/lib/security";

export const runtime = "nodejs";

const BOOKING_CONFIRMATION_WEBHOOK = process.env.BOOKING_CONFIRMATION_WEBHOOK || process.env.N8N_WEBHOOK_URL;

export async function POST(request: Request) {
  // Protection par API key interne
  const apiKey = process.env.API_SECRET_KEY;
  const token = extractToken(request);
  if (apiKey && (!token || token !== apiKey)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const { bookingId } = await request.json();
    if (!bookingId) {
      return NextResponse.json({ error: "Missing bookingId" }, { status: 400 });
    }

    const supabase = supabaseAdmin();
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("id, villa_id, start_date, end_date, guest_name, guest_email, price, status")
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const { data: villa } = await supabase
      .from("villas")
      .select("name, location")
      .eq("id", booking.villa_id)
      .single();

    const payload = {
      type: "booking_confirmation",
      bookingId: booking.id,
      guestName: booking.guest_name,
      guestEmail: booking.guest_email || undefined,
      villaName: villa?.name,
      location: villa?.location,
      startDate: booking.start_date,
      endDate: booking.end_date,
      price: booking.price,
      status: booking.status,
    };

    if (BOOKING_CONFIRMATION_WEBHOOK) {
      const res = await fetch(BOOKING_CONFIRMATION_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        console.error("Booking confirmation webhook failed:", res.status);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Send booking confirmation error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
