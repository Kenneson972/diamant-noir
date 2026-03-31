import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

const ADMIN_BOOKING_WEBHOOK = process.env.ADMIN_BOOKING_WEBHOOK || process.env.N8N_WEBHOOK_URL;

export async function POST(request: Request) {
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
      .select("name")
      .eq("id", booking.villa_id)
      .single();

    const payload = {
      type: "new_booking_admin",
      bookingId: booking.id,
      villaName: villa?.name,
      guestName: booking.guest_name,
      guestEmail: booking.guest_email || undefined,
      startDate: booking.start_date,
      endDate: booking.end_date,
      price: booking.price,
    };

    if (ADMIN_BOOKING_WEBHOOK) {
      await fetch(ADMIN_BOOKING_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Notify admin booking error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
