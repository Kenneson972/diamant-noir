import { NextResponse } from "next/server";
import Stripe from "stripe";
import { calculatePrice } from "@/lib/price-engine";
import { supabaseAdmin } from "@/lib/supabase";
import { checkRateLimit, ipFromRequest } from "@/lib/security";
import { BookingRequestSchema } from "@/types/stripe";
import { calculateTransferAmounts } from "@/lib/stripe/connect";

export const runtime = "nodejs";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || "";
const baseUrl =
  process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

let stripeInstance: Stripe | null = null;
function getStripe(): Stripe | null {
  if (!stripeSecretKey) return null;
  if (!stripeInstance) {
    stripeInstance = new Stripe(stripeSecretKey, {
      apiVersion: "2025-01-27" as any,
    });
  }
  return stripeInstance;
}

/**
 * Récupère le compte Stripe Connect du propriétaire d'une villa.
 * Retourne l'ID du compte ou null si pas de Connect configuré.
 */
async function getOwnerConnectAccountId(
  supabase: ReturnType<typeof supabaseAdmin>,
  villaId: string
): Promise<string | null> {
  const { data: villa } = await supabase
    .from("villas")
    .select("owner_id")
    .eq("id", villaId)
    .single();

  if (!villa?.owner_id) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_connect_account_id, stripe_connect_onboarding_completed")
    .eq("id", villa.owner_id)
    .single();

  if (profile?.stripe_connect_onboarding_completed && profile.stripe_connect_account_id) {
    return profile.stripe_connect_account_id;
  }

  return null;
}

export async function POST(request: Request) {
  // Rate limiting : 10 req / 60s par IP
  if (!checkRateLimit(`booking:${ipFromRequest(request)}`, 10, 60_000)) {
    return NextResponse.json({ error: "Trop de requêtes. Réessayez plus tard." }, { status: 429 });
  }

  try {
    const raw = await request.json();

    // ── Zod validation ──
    const parsed = BookingRequestSchema.safeParse(raw);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return NextResponse.json(
        { error: firstError?.message || "Données de réservation invalides" },
        { status: 400 }
      );
    }

    const { startDate, endDate, villaId, guests, guestName, guestEmail, serviceFeePercent } = parsed.data;

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

    // Fetch villa details for price and name (include owner_id for Stripe Connect)
    const { data: villa, error: villaError } = await supabase
      .from("villas")
      .select("id, name, price_per_night, capacity, owner_id, cleaning_fee_cents")
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
      .lt("start_date", endDate)
      .gt("end_date", startDate);

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

    // ── Recalcul des frais côté serveur (sécurité : le client ne dicte pas le montant) ──
    const stayCents = Math.round(price.total * 100);
    const cleaningFeeCents = villa.cleaning_fee_cents || 0;
    const serviceFeeCents = Math.round(price.total * serviceFeePercent / 100 * 100);
    const totalCents = stayCents + cleaningFeeCents + serviceFeeCents;

    // Récupérer le compte Connect du propriétaire (si configuré)
    const ownerConnectAccountId = await getOwnerConnectAccountId(supabase, villaId);

    // Idempotency check: avoid duplicate bookings on double-click
    if (guestEmail) {
      const { data: existingBooking } = await supabase
        .from("bookings")
        .select("id, stripe_session_id, status")
        .eq("villa_id", villaId)
        .eq("start_date", startDate)
        .eq("end_date", endDate)
        .eq("guest_email", guestEmail)
        .eq("status", "pending")
        .maybeSingle();

      if (existingBooking) {
        if (existingBooking.stripe_session_id) {
          const stripe = getStripe();
          if (stripe) {
            try {
              const session = await stripe.checkout.sessions.retrieve(existingBooking.stripe_session_id);
              if (session.url) {
                return NextResponse.json({ url: session.url, bookingId: existingBooking.id });
              }
            } catch {
              // Session expired — fall through to create a new booking
            }
          }
        }
        return NextResponse.json({
          url: `${baseUrl}/success?bookingId=${existingBooking.id}${guestEmail ? `&email=${encodeURIComponent(guestEmail)}` : ""}`,
          bookingId: existingBooking.id,
        });
      }
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
        cleaning_fee: cleaningFeeCents / 100,
        service_fee: serviceFeeCents / 100,
        total_price_cents: totalCents,
        guest_name: guestName || "Client Site Web",
        guest_email: guestEmail || null,
      })
      .select()
      .single();

    if (bookingError) {
      throw new Error(`Database error: ${bookingError.message}`);
    }

    // 2. If Stripe is not configured yet, just return the booking info (simulation)
    const stripeInstance = getStripe();
    if (!stripeInstance) {
      return NextResponse.json({ 
        warning: "Stripe non configuré. Réservation créée en attente.",
        bookingId: booking.id,
        url: `${baseUrl}/success?bookingId=${booking.id}` 
      });
    }

    // Create or retrieve Stripe Customer
    let customerId: string | undefined;
    if (guestEmail) {
      try {
        const customers = await stripeInstance.customers.list({ email: guestEmail, limit: 1 });
        if (customers.data.length > 0) {
          customerId = customers.data[0].id;
        } else {
          const customer = await stripeInstance.customers.create({
            email: guestEmail,
            name: guestName || undefined,
            metadata: { source: "kayvila_booking" },
          });
          customerId = customer.id;
        }
      } catch (e) {
        console.error("Stripe customer lookup/create failed:", e);
      }
    }

    // ── Stripe Connect : split conforme FAQ Kayvila ──
    // Proprio : 75 % du séjour | Kayvila : 25 % séjour + 100 % ménage + 100 % service
    const { platformFeeCents } = calculateTransferAmounts(
      stayCents,
      cleaningFeeCents,
      serviceFeeCents,
      25
    );

    // 3. Create Stripe Checkout Session avec le total incluant tous les frais
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: "payment",
      success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}${guestEmail ? `&email=${encodeURIComponent(guestEmail)}` : ""}`,
      cancel_url: `${baseUrl}/villas?canceled=true&bookingId=${booking.id}`,
      ...(customerId
        ? { customer: customerId }
        : { customer_email: guestEmail || undefined }),
      metadata: {
        bookingId: booking.id,
        villaId: villaId,
        nights: String(price.nights),
        cleaningFeeCents: String(cleaningFeeCents),
        serviceFeeCents: String(serviceFeeCents),
        ownerConnectAccountId: ownerConnectAccountId || "",
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "eur",
            unit_amount: stayCents,
            product_data: {
              name: `Séjour - ${villa.name}`,
              description: `Du ${startDate} au ${endDate} (${price.nights} nuits)`,
            },
          },
        },
        ...(cleaningFeeCents > 0 ? [{
          quantity: 1,
          price_data: {
            currency: "eur",
            unit_amount: cleaningFeeCents,
            product_data: {
              name: "Frais de ménage",
              description: "Ménage professionnel après votre séjour",
            },
          },
        }] : []),
        {
          quantity: 1,
          price_data: {
            currency: "eur",
            unit_amount: serviceFeeCents,
            product_data: {
              name: "Frais de service Kayvila",
              description: "Protection réservation et support client",
            },
          },
        },
      ],
    };

    // Si le propriétaire a un compte Stripe Connect, ajouter le transfert automatique
    if (ownerConnectAccountId) {
      sessionParams.payment_intent_data = {
        transfer_data: {
          destination: ownerConnectAccountId,
        },
        application_fee_amount: platformFeeCents,
      };
    }

    const session = await stripeInstance.checkout.sessions.create(sessionParams);

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
