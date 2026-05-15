import type { Booking } from "@/types/domain";
import { BookingStatusBadge } from "@/components/dashboard/proprio/BookingStatusBadge";
import { formatCurrency, getBookingPriceCents } from "@/lib/utils";
import {
  CalendarDays,
  Building2,
  Receipt,
  CreditCard,
  Globe,
  Clock,
  User,
  Mail,
  Hash,
  Banknote,
} from "lucide-react";

interface BookingDetailCardProps {
  booking: Booking;
  villaName?: string;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getNights(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
}

const sourceLabels: Record<string, string> = {
  airbnb: "Airbnb",
  direct: "Direct (Kayvila)",
};

const paymentLabels: Record<string, string> = {
  unpaid: "Non payé",
  paid: "Payé",
  refunded: "Remboursé",
};

function DetailRow({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex items-start gap-3 ${className ?? ""}`}>
      <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-navy/5">
        <Icon className="h-4 w-4 text-navy/40" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium uppercase tracking-wider text-navy/40">
          {label}
        </p>
        <div className="mt-0.5 text-sm font-medium text-navy">{value}</div>
      </div>
    </div>
  );
}

export function BookingDetailCard({ booking, villaName }: BookingDetailCardProps) {
  const shortId = booking.id.slice(0, 8);
  const nights = getNights(booking.start_date, booking.end_date);
  const totalCents = getBookingPriceCents(booking);
  const pricePerNightCents = totalCents > 0 ? Math.round(totalCents / nights) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="overflow-hidden rounded-2xl border border-navy/5 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-navy/5 bg-navy/[0.02] px-6 py-4">
          <div>
            <h2 className="font-display text-lg font-semibold text-navy">
              Réservation #{shortId}
            </h2>
            <p className="text-sm text-navy/50">
              Créée le {formatDateTime(booking.created_at)}
            </p>
          </div>
          <BookingStatusBadge status={booking.status} />
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-1 gap-6 p-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Villa */}
          <DetailRow
            icon={Building2}
            label="Villa"
            value={villaName ?? "—"}
          />

          {/* Client */}
          <DetailRow
            icon={User}
            label="Client"
            value={booking.guest_name ?? "Anonyme"}
          />

          {/* Email */}
          <DetailRow
            icon={Mail}
            label="Email"
            value={booking.guest_email ?? "—"}
          />

          {/* Arrivée */}
          <DetailRow
            icon={CalendarDays}
            label="Arrivée"
            value={formatDate(booking.start_date)}
          />

          {/* Départ */}
          <DetailRow
            icon={CalendarDays}
            label="Départ"
            value={formatDate(booking.end_date)}
          />

          {/* Durée */}
          <DetailRow
            icon={Clock}
            label="Durée"
            value={`${nights} nuit${nights > 1 ? "s" : ""}`}
          />

          {/* Prix total */}
          <DetailRow
            icon={Receipt}
            label="Prix total"
            value={
              <span className="font-display text-base font-bold text-emerald-700">
                {formatCurrency(totalCents)}
              </span>
            }
          />

          {/* Prix par nuit */}
          {pricePerNightCents > 0 && (
            <DetailRow
              icon={Banknote}
              label="Prix par nuit"
              value={formatCurrency(pricePerNightCents)}
            />
          )}

          {/* Source */}
          <DetailRow
            icon={Globe}
            label="Source"
            value={sourceLabels[booking.source] ?? booking.source}
          />

          {/* Paiement */}
          <DetailRow
            icon={CreditCard}
            label="Paiement"
            value={
              <span
                className={
                  booking.payment_status === "paid"
                    ? "text-emerald-700"
                    : booking.payment_status === "refunded"
                      ? "text-orange-700"
                      : "text-navy/50"
                }
              >
                {paymentLabels[booking.payment_status] ?? booking.payment_status}
              </span>
            }
          />

          {/* ID Stripe */}
          {booking.stripe_session_id && (
            <DetailRow
              icon={Hash}
              label="Session Stripe"
              value={
                <code className="break-all text-xs text-navy/50">
                  {booking.stripe_session_id}
                </code>
              }
            />
          )}
        </div>
      </div>
    </div>
  );
}
