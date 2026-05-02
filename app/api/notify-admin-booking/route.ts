import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { extractToken } from "@/lib/security";

export const runtime = "nodejs";

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
    const { data: booking } = await supabase
      .from("bookings")
      .select("id, villa_id, start_date, end_date, guest_name, guest_email, price")
      .eq("id", bookingId)
      .single();

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const { data: villa } = await supabase
      .from("villas")
      .select("name, location")
      .eq("id", booking.villa_id)
      .single();

    const notificationUrl = process.env.N8N_WEBHOOK_URL || process.env.ADMIN_NOTIFICATION_WEBHOOK;
    if (notificationUrl) {
      await fetch(notificationUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "admin_booking_notification",
          bookingId: booking.id,
          guestName: booking.guest_name,
          guestEmail: booking.guest_email,
          villaName: villa?.name,
          location: villa?.location,
          startDate: booking.start_date,
          endDate: booking.end_date,
          price: booking.price,
        }),
      }).catch((e) => console.error("Notify admin webhook failed:", e));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Notify admin error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
