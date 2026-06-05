import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAuth, AuthError } from "@/lib/auth/server";
import { checkCsrf } from "@/lib/security";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const csrf = checkCsrf(request);
  if (csrf) return csrf;

  try {
    const userId = await requireAuth(request);

    const { bookingId } = await request.json();
    if (!bookingId) {
      return NextResponse.json({ error: "Missing bookingId" }, { status: 400 });
    }

    const admin = supabaseAdmin();

    const { data: booking, error: bookingError } = await admin
      .from("bookings")
      .select("id, villa_id")
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const { data: villa, error: villaError } = await admin
      .from("villas")
      .select("id, owner_id")
      .eq("id", booking.villa_id)
      .single();

    if (villaError || !villa) {
      return NextResponse.json({ error: "Villa not found" }, { status: 404 });
    }

    // Check admin role
    const { data: profile } = await admin
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .maybeSingle();

    const isAdmin = profile?.role === "admin";
    if (!isAdmin && villa.owner_id !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Soft delete — preserve history
    const { error: deleteError } = await admin
      .from("bookings")
      .update({
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
        cancelled_by: userId,
      })
      .eq("id", bookingId);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    await admin.from("admin_chat_logs").insert({
      message: `Suppression réservation ${bookingId}`,
      intent: "dashboard_delete_booking",
      action: "DELETE",
      response: "Réservation supprimée",
      success: true,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Server error" },
      { status: 500 }
    );
  }
}
