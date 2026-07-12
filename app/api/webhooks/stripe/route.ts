import { NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabase";
import {
  lookupClientUserIdByEmail,
  resolveBookingGuestEmail,
} from "@/lib/booking-tenant";
import {
  sendAdminDisputeAlertEmail,
  sendOwnerConnectOnboardedEmail,
  sendOwnerNewBookingEmail,
} from "@/lib/emails/send";

export const runtime = "nodejs";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || "";
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";
// Endpoint séparé « comptes connectés » (account.updated / deauthorized) :
// Stripe impose un endpoint par périmètre, chacun avec son propre secret.
const connectWebhookSecret = process.env.STRIPE_CONNECT_WEBHOOK_SECRET || "";

const stripe = new Stripe(stripeSecretKey, { apiVersion: "2025-03-31.basil" as any });

export async function POST(request: Request) {
  if (!stripeSecretKey || !webhookSecret) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
  }

  let body: string;
  try {
    body = await request.text();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const sig = request.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    // Signature invalide pour l'endpoint principal → tenter le secret de
    // l'endpoint « comptes connectés » s'il est configuré.
    if (connectWebhookSecret) {
      try {
        event = stripe.webhooks.constructEvent(body, sig, connectWebhookSecret);
      } catch {
        const message = err instanceof Error ? err.message : "Unknown error";
        console.error("Stripe webhook signature verification failed:", message);
        return NextResponse.json(
          { error: `Webhook signature failed: ${message}` },
          { status: 400 }
        );
      }
    } else {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error("Stripe webhook signature verification failed:", message);
      return NextResponse.json(
        { error: `Webhook signature failed: ${message}` },
        { status: 400 }
      );
    }
  }

  const supabase = supabaseAdmin();

  // ── Idempotence atomique : claim l'event avant traitement ──
  const { data: claimed, error: claimError } = await supabase
    .from("stripe_events_processed")
    .upsert(
      { event_id: event.id, event_type: event.type },
      { onConflict: "event_id", ignoreDuplicates: true }
    )
    .select("event_id")
    .maybeSingle();

  if (claimError) {
    console.error("Failed to claim stripe event:", claimError);
    return NextResponse.json({ error: "Failed to record event" }, { status: 500 });
  }
  if (!claimed) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const bookingId = session.metadata?.bookingId;
      if (!bookingId) {
        console.error("Stripe webhook: no bookingId in metadata");
        return NextResponse.json({ error: "Missing bookingId" }, { status: 400 });
      }

      // Lire le statut actuel pour l'historique
      const { data: currentBooking } = await supabase
        .from("bookings")
        .select("id, status, guest_email, client_user_id")
        .eq("id", bookingId)
        .single();

      const oldStatus = currentBooking?.status || "pending";

      const stripeEmail =
        session.customer_email || session.customer_details?.email || null;
      const guestEmail = resolveBookingGuestEmail(
        currentBooking?.guest_email,
        stripeEmail
      );
      const clientUserId =
        currentBooking?.client_user_id ??
        (await lookupClientUserIdByEmail(supabase, guestEmail));

      // Récupérer le PaymentIntent depuis la session
      let paymentIntentId: string | null = null;
      if (session.payment_intent) {
        paymentIntentId = typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent.id;
      }

      const updateData: Record<string, any> = {
        status: "confirmed",
        payment_status: "paid",
        ...(guestEmail && { guest_email: guestEmail }),
        ...(clientUserId && { client_user_id: clientUserId }),
      };
      if (paymentIntentId) {
        updateData.stripe_payment_intent_id = paymentIntentId;
      }

      const { error: updateError } = await supabase
        .from("bookings")
        .update(updateData)
        .eq("id", bookingId);

      if (updateError) {
        console.error("Stripe webhook: failed to update booking", updateError);
        return NextResponse.json({ error: "Database update failed" }, { status: 500 });
      }

      // Enregistrer le changement de statut dans l'historique
      await supabase.from("order_status_history").insert({
        booking_id: bookingId,
        from_status: oldStatus,
        to_status: "confirmed",
        changed_by: "stripe_webhook",
        reason: "checkout.session.completed",
      });

      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
      const apiKey = process.env.API_SECRET_KEY;
      const authHeaders: Record<string, string> = apiKey
        ? { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" }
        : { "Content-Type": "application/json" };

      // Envoi de l'email de confirmation. En cas d'échec (réseau, 5xx, ou
      // provider qui refuse) : alerte admin dans le dashboard via la table
      // notifications — le client a payé, il ne doit pas rester sans email
      // à l'insu de l'équipe (P1 audit préprod 2026-07-11).
      try {
        const confirmationRes = await fetch(`${baseUrl}/api/send-booking-confirmation`, {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify({ bookingId }),
        });
        const confirmationJson = await confirmationRes.json().catch(() => null);
        if (!confirmationRes.ok || confirmationJson?.emailSent === false) {
          throw new Error(
            `send-booking-confirmation → HTTP ${confirmationRes.status}, emailSent=${confirmationJson?.emailSent ?? "n/a"}`
          );
        }
      } catch (e) {
        console.error("Send booking confirmation failed:", e);
        const { error: notifError } = await supabase.from("notifications").insert({
          type: "system",
          title: "Email de confirmation non envoyé",
          body: `L'email de confirmation de la réservation ${bookingId} a échoué (${
            e instanceof Error ? e.message : "erreur inconnue"
          }). Le client a payé mais n'a pas reçu de confirmation — à renvoyer manuellement.`,
        });
        if (notifError) {
          console.error("Failed to insert email-failure notification:", notifError.message);
        }
      }

      try {
        await fetch(`${baseUrl}/api/notify-admin-booking`, {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify({ bookingId }),
        });
      } catch (e) {
        console.error("Notify admin failed:", e);
      }

      try {
        const { data: bookingForOwner } = await supabase
          .from("bookings")
          .select(
            "id, villa_id, start_date, end_date, guest_name, price, total_price_cents"
          )
          .eq("id", bookingId)
          .single();

        if (bookingForOwner?.villa_id) {
          const { data: villaForOwner } = await supabase
            .from("villas")
            .select("name, owner_id, commission_rate")
            .eq("id", bookingForOwner.villa_id)
            .single();

          if (villaForOwner?.owner_id) {
            const { data: ownerProfile } = await supabase
              .from("profiles")
              .select("email, full_name")
              .eq("id", villaForOwner.owner_id)
              .maybeSingle();

            await sendOwnerNewBookingEmail(
              bookingForOwner,
              villaForOwner,
              ownerProfile
            );
          }
        }
      } catch (e) {
        console.error("Notify owner booking email failed:", e);
      }

      // ── Créer un compte client automatique si pas déjà inscrit ──
      const clientEmail = guestEmail;
      if (clientEmail) {
        try {
          // Vérifier si un profil existe déjà pour cet email
          const { data: existingProfile } = await supabase
            .from("profiles")
            .select("id")
            .eq("email", clientEmail)
            .maybeSingle();

          if (!existingProfile) {
            // Créer un utilisateur via l'Admin API (email confirmé, pas de mot de passe)
            const { data: newUser, error: createUserError } = await supabase.auth.admin.createUser({
              email: clientEmail,
              email_confirm: true,
              user_metadata: {
                source: "booking",
              },
            });

            if (createUserError) {
              console.error("Auto-account creation failed:", createUserError);
            } else if (newUser?.user) {
              console.log(`Compte client créé automatiquement pour ${clientEmail}`);

              // Envoyer un magic link pour que le client définisse son mot de passe
              await supabase.auth.admin.inviteUserByEmail(clientEmail, {
                redirectTo: `${baseUrl}/espace-client`,
              });
            }
          }
        } catch (e) {
          // Échec non bloquant — la réservation est déjà confirmée
          console.error("Auto-account creation error (non-blocking):", e);
        }
      }
    }

    if (event.type === "checkout.session.expired") {
      const session = event.data.object as Stripe.Checkout.Session;
      const bookingId = session.metadata?.bookingId;
      if (bookingId) {
        const { data: currentBooking } = await supabase
          .from("bookings")
          .select("id, status, stripe_payment_intent_id, payment_status")
          .eq("id", bookingId)
          .single();

        if (currentBooking && currentBooking.status === "pending") {
          await supabase
            .from("bookings")
            .update({ status: "cancelled", payment_status: "unpaid" })
            .eq("id", bookingId);

          await supabase.from("order_status_history").insert({
            booking_id: bookingId,
            from_status: "pending",
            to_status: "cancelled",
            changed_by: "stripe_webhook",
            reason: "checkout.session.expired",
          });

          // Auto-refund if payment was already captured
          if (currentBooking.stripe_payment_intent_id && currentBooking.payment_status === "paid") {
            try {
              const paymentIntent = await stripe.paymentIntents.retrieve(
                currentBooking.stripe_payment_intent_id
              );
              if (paymentIntent.status === "succeeded") {
                await stripe.refunds.create({
                  payment_intent: currentBooking.stripe_payment_intent_id,
                  reverse_transfer: true,
                });
                await supabase
                  .from("bookings")
                  .update({ payment_status: "refunded" })
                  .eq("id", bookingId);
              }
            } catch (e) {
              console.error("Auto-refund failed for booking", bookingId, e);
            }
          }
        }
      }
    }

    if (event.type === "account.updated") {
      const account = event.data.object as Stripe.Account;
      if (account.charges_enabled && account.details_submitted) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id, email, full_name, stripe_connect_onboarding_completed")
          .eq("stripe_connect_account_id", account.id)
          .maybeSingle();

        if (profile) {
          const wasCompleted = Boolean(profile.stripe_connect_onboarding_completed);

          await supabase
            .from("profiles")
            .update({ stripe_connect_onboarding_completed: true } as any)
            .eq("id", profile.id);

          if (!wasCompleted) {
            try {
              await sendOwnerConnectOnboardedEmail(profile);
            } catch (e) {
              console.error("Owner connect onboarded email failed:", e);
            }
          }
        }
      }
    }

    // ── Payment Intent handlers (async payments: SEPA, SOFORT) ──
    if (event.type === "payment_intent.succeeded") {
      const pi = event.data.object as Stripe.PaymentIntent;
      if (pi.metadata?.bookingId) {
        const { data: current } = await supabase
          .from("bookings")
          .select("status")
          .eq("id", pi.metadata.bookingId)
          .single();

        await supabase
          .from("bookings")
          .update({ payment_status: "paid", status: "confirmed" })
          .eq("id", pi.metadata.bookingId)
          .eq("status", "pending");

        if (current && current.status === "pending") {
          await supabase.from("order_status_history").insert({
            booking_id: pi.metadata.bookingId,
            from_status: "pending",
            to_status: "confirmed",
            changed_by: "stripe_webhook",
            reason: "payment_intent.succeeded",
          });
        }
      }
    }

    if (event.type === "payment_intent.payment_failed") {
      const pi = event.data.object as Stripe.PaymentIntent;
      if (pi.metadata?.bookingId) {
        await supabase
          .from("bookings")
          .update({ payment_status: "failed" })
          .eq("id", pi.metadata.bookingId);
      }
    }

    // ── Connect account deauthorized ──
    if (event.type === "account.application.deauthorized") {
      const acct = event.data.object as any;
      const connectId = acct.id || acct.account;
      if (connectId) {
        await supabase
          .from("profiles")
          .update({ stripe_connect_onboarding_completed: false } as any)
          .eq("stripe_connect_account_id", connectId);
      }
    }

    if (event.type === "charge.dispute.created") {
      const dispute = event.data.object as Stripe.Dispute;
      const evidenceDueBy = dispute.evidence_details?.due_by
        ? new Date(dispute.evidence_details.due_by * 1000).toISOString()
        : null;

      // Chercher le booking lié avant d'insérer le dispute
      let bookingId: string | undefined;
      let villaName: string | undefined;
      try {
        const chargeId =
          typeof dispute.charge === "string" ? dispute.charge : dispute.charge?.id;
        if (chargeId) {
          const charge = await stripe.charges.retrieve(chargeId);
          const paymentIntentId =
            typeof charge.payment_intent === "string"
              ? charge.payment_intent
              : charge.payment_intent?.id;

          if (paymentIntentId) {
            const { data: booking } = await supabase
              .from("bookings")
              .select("id, villa_id")
              .eq("stripe_payment_intent_id", paymentIntentId)
              .maybeSingle();

            if (booking) {
              bookingId = booking.id;
              if (booking.villa_id) {
                const { data: villa } = await supabase
                  .from("villas")
                  .select("name")
                  .eq("id", booking.villa_id)
                  .maybeSingle();
                villaName = villa?.name ?? undefined;
              }
            }
          }
        }
      } catch (e) {
        console.error("Dispute booking lookup failed:", e);
      }

      await supabase.from("stripe_disputes").insert({
        dispute_id: dispute.id,
        charge_id: dispute.charge,
        booking_id: bookingId ?? null,
        amount_cents: dispute.amount,
        reason: dispute.reason,
        status: dispute.status,
        evidence_due_by: evidenceDueBy,
      });

      try {
        await sendAdminDisputeAlertEmail({
          dispute_id: dispute.id,
          amount_cents: dispute.amount,
          reason: dispute.reason,
          evidence_due_by: evidenceDueBy,
          villaName,
        });
      } catch (e) {
        console.error("Admin dispute alert email failed:", e);
      }
    }

    if (event.type === "charge.dispute.closed") {
      const dispute = event.data.object as Stripe.Dispute;
      await supabase
        .from("stripe_disputes")
        .update({ status: dispute.status, resolved_at: new Date().toISOString() })
        .eq("dispute_id", dispute.id);
    }

    if (event.type === "charge.dispute.funds_reinstated") {
      const dispute = event.data.object as Stripe.Dispute;
      await supabase
        .from("stripe_disputes")
        .update({ status: "won" })
        .eq("dispute_id", dispute.id);
    }

    if (event.type === "charge.dispute.funds_withdrawn") {
      const dispute = event.data.object as Stripe.Dispute;
      await supabase
        .from("stripe_disputes")
        .update({ status: "lost" })
        .eq("dispute_id", dispute.id);
    }

    if (event.type === "charge.refunded") {
      const charge = event.data.object as Stripe.Charge;
      if (charge.payment_intent) {
        const paymentIntentId =
          typeof charge.payment_intent === "string"
            ? charge.payment_intent
            : charge.payment_intent.id;

        const { data: booking } = await supabase
          .from("bookings")
          .select("id")
          .eq("stripe_payment_intent_id", paymentIntentId)
          .maybeSingle();

        if (booking) {
          const isFullRefund = charge.amount_refunded === charge.amount;
          await supabase
            .from("bookings")
            .update({
              payment_status: isFullRefund ? "refunded" : "partially_refunded",
            })
            .eq("id", booking.id);
        }
      }
    }

    if (event.type === "checkout.session.async_payment_failed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const bookingId = session.metadata?.bookingId;
      if (bookingId) {
        await supabase
          .from("bookings")
          .update({
            status: "cancelled",
            payment_status: "failed",
          })
          .eq("id", bookingId);
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    // Rollback le claim pour permettre le retry par Stripe
    await supabase
      .from("stripe_events_processed")
      .delete()
      .eq("event_id", event.id);

    const message = err instanceof Error ? err.message : "Handler error";
    console.error("Stripe webhook handler error:", message);
    return NextResponse.json({ error: `Handler failed: ${message}` }, { status: 500 });
  }
}
