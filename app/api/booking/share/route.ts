import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getSupabaseServer } from "@/lib/supabase-server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { bookingId } = await request.json();
    if (!bookingId || typeof bookingId !== "string") {
      return NextResponse.json({ error: "bookingId requis" }, { status: 400 });
    }

    const supabase = await getSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.email) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const admin = supabaseAdmin();
    const { data: booking, error: bookingError } = await admin
      .from("bookings")
      .select("id, guest_email, status")
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: "Réservation introuvable" }, { status: 404 });
    }
    if (booking.guest_email !== user.email) {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
    }
    if (!["confirmed", "pending"].includes(booking.status)) {
      return NextResponse.json({ error: "Séjour non partageable" }, { status: 422 });
    }

    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 86400000).toISOString();

    const { error: upsertError } = await admin.from("booking_shares").upsert(
      { booking_id: bookingId, token, expires_at: expiresAt },
      { onConflict: "booking_id" }
    );

    if (upsertError) {
      return NextResponse.json({ error: upsertError.message }, { status: 500 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
    const shareUrl = `${baseUrl}/share/${token}`;

    return NextResponse.json({ ok: true, shareUrl, token, expiresAt });
  } catch (err) {
    console.error("[booking/share]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
