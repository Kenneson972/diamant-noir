import { NextResponse } from "next/server";
import Stripe from "stripe";
import { calculatePrice } from "@/lib/price-engine";
import { supabaseAdmin } from "@/lib/supabase";
import { checkRateLimit, ipFromRequest } from "@/lib/security";

export const runtime = "nodejs";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || "";
const baseUrl =
  process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2023-10-16",
});

export async function POST(request: Request) {
  // Rate limiting : 10 req / 60s par IP
  if (!checkRateLimit(`booking:${ipFromRequest(request)}`, 10, 60_000)) {
    return NextResponse.json({ error: "Trop de requêtes. Réessayez plus tard." }, { status: 429 });
  }

  try {
    const { startDate, endDate, villaId, guests, guestName } = await request.json();

    // Validation basique des champs requis
    if (!startDate || !endDate || !villaId) {
      return NextResponse.json(
        { error: "Informations de réservation incomplètes" },
        { status: 400 }
      );
    }

    // Validation du format des dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json({ error: "Format de date invalide" }, { status: 400 });
    }
    if (start >= end) {
      return NextResponse.json({ error: "La date de départ doit être postérieure à l'arrivée" }, { status: 400 });
    }
    if (start < new Date(new Date().toDateString())) {
      return NextResponse.json({ error: "La date d'arrivée ne peut pas être dans le passé" }, { status: 400 });
    }

    const supabase = supabaseAdmin();

    // Fetch villa details for price and name
    const { data: villa, error: villaError } = await supabase
      .from("villas")
      .select("id, name, price_per_night, capacity")
      .eq("id", villaId)
      .single();

    if (villaError || !villa) {
      return NextResponse.json({ error: "Villa introuvable" }, { status: 404 });
    }

    // Validate guests count
    if (guests && guests > villa.capacity) {
      return NextResponse.json(
        { error: `La capacité maximale est de ${villa.capacity} voyageurs` },
        { status: 400 }
      );
    }

    // Vérifier les conflits de dates avec les réservations existantes
    const { data: existingBookings, error: conflictError } = await supabase
      .from("bookings")
      .select("id, start_date, end_date, status")
      .eq("villa_id", villaId)
      .in("status", ["pending", "confirmed", "paid"])
      .or(`start_date.lt.${endDate},end_date.gt.${startDate}`);

    if (conflictError) {
      throw new Error(`Erreur de vérification des disponibilités: ${conflictError.message}`);
    }

    if (existingBookings && existingBookings.length > 0) {
      return NextResponse.json(
        { error: "Cette villa n'est pas disponible pour les dates sélectionnées" },
        { status: 409 }
      );
    }

    const price = calculatePrice({
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      basePrice: villa.price_per_night
    });

    if (price.total <= 0) {
      return NextResponse.json(
        { error: "Période invalide" },
        { status: 400 }
      );
    }

    // 1. Create the booking in DB first
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .insert({
        villa_id: villaId,
        start_date: startDate,
        end_date: endDate,
        status: "pending",
        payment_status: "unpaid",
        source: "direct",
        price: price.total,
        guest_name: guestName || "Client Site Web"
      })
      .select()
      .single();

    if (bookingError) {
      throw new Error(`Database error: ${bookingError.message}`);
    }

    // 2. If Stripe is not configured yet, just return the booking info (simulation)
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ 
        warning: "Stripe non configuré. Réservation créée en attente.",
        bookingId: booking.id,
        url: `${baseUrl}/success?bookingId=${booking.id}` 
      });
    }

    // 3. Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/villas?canceled=true&bookingId=${booking.id}`,
      metadata: {
        bookingId: booking.id,
        villaId: villaId
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "eur",
            unit_amount: Math.round(price.total * 100),
            product_data: {
              name: `Séjour - ${villa.name}`,
              description: `Du ${startDate} au ${endDate} (${price.nights} nuits)`,
            },
          },
        },
      ],
    });

    // 4. Link Stripe session ID to the booking
    await supabase
      .from("bookings")
      .update({ stripe_session_id: session.id })
      .eq("id", booking.id);

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Booking error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur serveur" },
      { status: 500 }
    );
  }
}
