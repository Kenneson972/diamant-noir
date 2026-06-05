import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getSupabaseServer } from "@/lib/supabase-server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { bookingId } = await request.json();
    if (!bookingId) {
      return NextResponse.json({ error: "Missing bookingId" }, { status: 400 });
    }

    // Vérifier la session du locataire
    const supabase = await getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const admin = supabaseAdmin();

    // Charger la réservation
    const { data: booking, error: bookingError } = await admin
      .from("bookings")
      .select("id, guest_email, status, start_date")
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: "Réservation introuvable" }, { status: 404 });
    }

    // Vérifier que la réservation appartient au locataire connecté
    if (booking.guest_email !== user.email) {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
    }

    // Vérifier que la réservation est annulable
    if (!["confirmed", "pending"].includes(booking.status)) {
      return NextResponse.json(
        { error: "Cette réservation ne peut pas être annulée" },
        { status: 422 }
      );
    }

    // Vérifier que le séjour n'a pas déjà commencé
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (new Date(booking.start_date) <= today) {
      return NextResponse.json(
        { error: "Impossible d'annuler une réservation dont le séjour a déjà commencé" },
        { status: 422 }
      );
    }

    // Annuler (soft — on ne supprime pas)
    const { error: updateError } = await admin
      .from("bookings")
      .update({ status: "cancelled" })
      .eq("id", bookingId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur serveur" },
      { status: 500 }
    );
  }
}
