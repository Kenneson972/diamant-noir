import { render } from "@react-email/render";
import BookingConfirmationEmail from "@/emails/booking-confirmation";
import CheckinReminderEmail from "@/emails/checkin-reminder";
import ReviewRequestEmail from "@/emails/review-request";
import OwnerNewBookingEmail from "@/emails/owner-new-booking";
import AdminDisputeAlertEmail from "@/emails/admin-dispute-alert";
import OwnerConnectOnboardedEmail from "@/emails/owner-connect-onboarded";
import AdminBookingNotificationEmail from "@/emails/admin-booking-notification";
import {
  ADMIN_NOTIFICATION_EMAIL,
  getResend,
  isResendConfigured,
  RESEND_FROM,
} from "@/lib/resend";
import { SITE_BRAND_DISPLAY } from "@/data/site-brand";
import {
  bookingNights,
  bookingTotalEuros,
  formatDateFr,
  formatEuros,
  getAppBaseUrl,
} from "@/lib/emails/format";
import { commissionCents, normalizeCommissionRate } from "@/lib/commission";

const BOOKING_CONFIRMATION_WEBHOOK =
  process.env.BOOKING_CONFIRMATION_WEBHOOK || process.env.N8N_WEBHOOK_URL;

export async function sendBookingConfirmationEmail(booking: {
  id: string;
  guest_name: string | null;
  guest_email: string | null;
  start_date: string;
  end_date: string;
  price?: number | null;
  total_price_cents?: number | null;
  status?: string | null;
  villa_id?: string | null;
}, villa: { name?: string | null; location?: string | null } | null) {
  const guestEmail = booking.guest_email;
  if (!guestEmail) {
    return { sent: false, reason: "missing_guest_email" as const };
  }

  const baseUrl = getAppBaseUrl();
  const totalPrice = bookingTotalEuros(booking);
  const nights = bookingNights(booking.start_date, booking.end_date);
  let emailSent = false;

  if (isResendConfigured()) {
    const html = await render(
      BookingConfirmationEmail({
        guestName: booking.guest_name || "voyageur",
        villaName: villa?.name || "Villa",
        startDate: booking.start_date,
        endDate: booking.end_date,
        nights,
        totalPrice,
        clientAreaUrl: `${baseUrl}/espace-client/reservations/${booking.id}`,
      })
    );

    const { error } = await getResend().emails.send({
      from: RESEND_FROM,
      to: [guestEmail],
      subject: `Confirmation — ${villa?.name || "Villa"} — ${SITE_BRAND_DISPLAY}`,
      html,
    });

    if (error) {
      console.error("Resend booking confirmation error:", error);
    } else {
      emailSent = true;
    }
  } else {
    console.warn("sendBookingConfirmationEmail: RESEND_API_KEY not configured");
  }

  if (BOOKING_CONFIRMATION_WEBHOOK) {
    try {
      const res = await fetch(BOOKING_CONFIRMATION_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "booking_confirmation",
          bookingId: booking.id,
          guestName: booking.guest_name,
          guestEmail,
          villaName: villa?.name,
          location: villa?.location,
          startDate: booking.start_date,
          endDate: booking.end_date,
          price: booking.price,
          status: booking.status,
        }),
      });
      if (!res.ok) {
        console.error("Booking confirmation n8n webhook failed:", res.status);
      }
    } catch (e) {
      console.error("Booking confirmation n8n webhook error:", e);
    }
  }

  return { sent: emailSent };
}

export async function sendAdminBookingNotificationEmail(
  booking: {
    id: string;
    guest_name: string | null;
    guest_email: string | null;
    start_date: string;
    end_date: string;
    price?: number | null;
    total_price_cents?: number | null;
  },
  villa: { name?: string | null; location?: string | null } | null
) {
  const adminEmail = ADMIN_NOTIFICATION_EMAIL;
  const total = formatEuros(bookingTotalEuros(booking));
  let emailSent = false;

  if (isResendConfigured()) {
    const html = await render(
      AdminBookingNotificationEmail({
        villaName: villa?.name ?? "—",
        guestName: booking.guest_name ?? "—",
        guestEmail: booking.guest_email ?? "—",
        startDate: booking.start_date,
        endDate: booking.end_date,
        total,
        bookingId: booking.id,
      })
    );

    const { error } = await getResend().emails.send({
      from: RESEND_FROM,
      to: [adminEmail],
      subject: `Nouvelle réservation — ${villa?.name ?? "Villa"} — ${SITE_BRAND_DISPLAY}`,
      html,
    });

    if (error) {
      console.error("Resend admin booking notification error:", error);
    } else {
      emailSent = true;
    }
  }

  const notificationUrl = process.env.N8N_WEBHOOK_URL || process.env.ADMIN_NOTIFICATION_WEBHOOK;
  if (notificationUrl) {
    try {
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
      });
    } catch (e) {
      console.error("Notify admin n8n webhook failed:", e);
    }
  }

  return { sent: emailSent };
}

export async function sendOwnerNewBookingEmail(
  booking: {
    id: string;
    guest_name: string | null;
    start_date: string;
    end_date: string;
    price?: number | null;
    total_price_cents?: number | null;
    villa_id?: string | null;
  },
  villa: {
    name?: string | null;
    owner_id?: string | null;
    commission_rate?: number | null;
  } | null,
  owner: { email?: string | null; full_name?: string | null } | null
) {
  const ownerEmail = owner?.email;
  if (!ownerEmail || !villa?.owner_id) {
    return { sent: false, reason: "missing_owner" as const };
  }

  if (!isResendConfigured()) {
    return { sent: false, reason: "resend_not_configured" as const };
  }

  const amountCents =
    booking.total_price_cents ?? Math.round((booking.price ?? 0) * 100);
  const commission = commissionCents(amountCents, villa.commission_rate);
  const ownerRevenue = (amountCents - commission) / 100;
  const amount = amountCents / 100;
  const baseUrl = getAppBaseUrl();

  const html = await render(
    OwnerNewBookingEmail({
      ownerName: owner.full_name || "propriétaire",
      villaName: villa.name || "Villa",
      guestName: booking.guest_name || "Voyageur",
      startDate: booking.start_date,
      endDate: booking.end_date,
      amount,
      ownerRevenue,
      dashboardUrl: `${baseUrl}/dashboard`,
    })
  );

  const rate = normalizeCommissionRate(villa.commission_rate);
  const ownerPct = Math.round((1 - rate) * 100);

  const { error } = await getResend().emails.send({
    from: RESEND_FROM,
    to: [ownerEmail],
    subject: `Nouvelle réservation — ${villa.name} (${ownerPct} % revenu)`,
    html,
  });

  if (error) {
    console.error("Resend owner booking notification error:", error);
    return { sent: false, reason: "resend_error" as const };
  }

  return { sent: true };
}

export async function sendOwnerConnectOnboardedEmail(owner: {
  email?: string | null;
  full_name?: string | null;
}) {
  const ownerEmail = owner.email;
  if (!ownerEmail) return { sent: false, reason: "missing_email" as const };
  if (!isResendConfigured()) return { sent: false, reason: "resend_not_configured" as const };

  const html = await render(
    OwnerConnectOnboardedEmail({
      ownerName: owner.full_name || "propriétaire",
      dashboardUrl: `${getAppBaseUrl()}/dashboard`,
    })
  );

  const { error } = await getResend().emails.send({
    from: RESEND_FROM,
    to: [ownerEmail],
    subject: `Stripe Connect validé — ${SITE_BRAND_DISPLAY}`,
    html,
  });

  if (error) {
    console.error("Resend owner connect onboarded error:", error);
    return { sent: false, reason: "resend_error" as const };
  }

  return { sent: true };
}

export async function sendAdminDisputeAlertEmail(dispute: {
  dispute_id: string;
  amount_cents: number;
  reason: string | null;
  evidence_due_by?: string | null;
  villaName?: string;
}) {
  if (!isResendConfigured()) return { sent: false, reason: "resend_not_configured" as const };

  const html = await render(
    AdminDisputeAlertEmail({
      disputeId: dispute.dispute_id,
      amount: dispute.amount_cents / 100,
      reason: dispute.reason || "non précisé",
      evidenceDueBy: dispute.evidence_due_by,
      villaName: dispute.villaName,
      stripeDisputeUrl: `https://dashboard.stripe.com/disputes/${dispute.dispute_id}`,
    })
  );

  const { error } = await getResend().emails.send({
    from: RESEND_FROM,
    to: [ADMIN_NOTIFICATION_EMAIL],
    subject: `Litige Stripe — ${formatEuros(dispute.amount_cents / 100)}`,
    html,
  });

  if (error) {
    console.error("Resend admin dispute alert error:", error);
    return { sent: false, reason: "resend_error" as const };
  }

  return { sent: true };
}

export async function sendCheckinReminderEmail(
  booking: {
    id: string;
    guest_name: string | null;
    guest_email: string | null;
    start_date: string;
  },
  villa: { name?: string | null; location?: string | null } | null,
  daysUntil: number
) {
  const guestEmail = booking.guest_email;
  if (!guestEmail) return { sent: false, reason: "missing_guest_email" as const };
  if (!isResendConfigured()) return { sent: false, reason: "resend_not_configured" as const };

  const html = await render(
    CheckinReminderEmail({
      guestName: booking.guest_name || "voyageur",
      villaName: villa?.name || "Villa",
      startDate: booking.start_date,
      daysUntil,
      clientAreaUrl: `${getAppBaseUrl()}/espace-client/reservations/${booking.id}`,
      directions: villa?.location ?? undefined,
    })
  );

  const { error } = await getResend().emails.send({
    from: RESEND_FROM,
    to: [guestEmail],
    subject: `J-${daysUntil} — votre arrivée à ${villa?.name ?? "la villa"}`,
    html,
  });

  if (error) {
    console.error("Resend checkin reminder error:", error);
    return { sent: false, reason: "resend_error" as const };
  }

  return { sent: true };
}

export async function sendReviewRequestEmail(
  booking: {
    id: string;
    guest_name: string | null;
    guest_email: string | null;
  },
  villa: { name?: string | null } | null
) {
  const guestEmail = booking.guest_email;
  if (!guestEmail) return { sent: false, reason: "missing_guest_email" as const };
  if (!isResendConfigured()) return { sent: false, reason: "resend_not_configured" as const };

  const html = await render(
    ReviewRequestEmail({
      guestName: booking.guest_name || "voyageur",
      villaName: villa?.name || "Villa",
      reviewUrl: `${getAppBaseUrl()}/espace-client`,
    })
  );

  const { error } = await getResend().emails.send({
    from: RESEND_FROM,
    to: [guestEmail],
    subject: `Votre avis sur ${villa?.name ?? "votre séjour"} — ${SITE_BRAND_DISPLAY}`,
    html,
  });

  if (error) {
    console.error("Resend review request error:", error);
    return { sent: false, reason: "resend_error" as const };
  }

  return { sent: true };
}
