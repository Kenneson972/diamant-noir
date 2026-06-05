import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { extractToken } from "@/lib/security";
import { sendAdminBookingNotificationEmail } from "@/lib/emails/send";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const apiKey = process.env.API_SECRET_KEY;
  if (!apiKey) {
    console.error("notify-admin-booking: API_SECRET_KEY not configured");
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }
  const token = extractToken(request);
  if (!token || token !== apiKey) {
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
      .select(
        "id, villa_id, start_date, end_date, guest_name, guest_email, price, total_price_cents"
      )
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

    const result = await sendAdminBookingNotificationEmail(booking, villa);

    return NextResponse.json({ success: true, emailSent: result.sent });
  } catch (error) {
    console.error("Notify admin error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
