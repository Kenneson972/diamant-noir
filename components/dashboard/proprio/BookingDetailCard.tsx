import type { Booking } from "@/types/domain";
import { BookingStatusBadge } from "@/components/dashboard/proprio/BookingStatusBadge";
import { formatCurrency, getBookingPriceCents } from "@/lib/utils";
import { getCommissionRate } from "@/lib/revenue/booking-revenue";
import {
  Receipt,
  User,
  Hash,
  Banknote,
  Globe,
} from "lucide-react";
import { KayvilaPngIcon } from "@/components/icons/KayvilaPngIcon";

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
  icon,
  label,
  value,
  className,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex items-start gap-3 ${className ?? ""}`}>
      <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-navy/5">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium uppercase tracking-wider text-navy/55">
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
  const commissionRate = getCommissionRate(booking.source);
  const commissionCents = Math.round(totalCents * (commissionRate / 100));
  const netCents = totalCents - commissionCents;

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
            icon={<KayvilaPngIcon name="villa" size={20} />}
            label="Villa"
            value={villaName ?? "—"}
          />

          {/* Client */}
          <DetailRow
            icon={<User className="h-4 w-4 text-navy/55" strokeWidth={1.5} />}
            label="Client"
            value={booking.guest_name ?? "Anonyme"}
          />

          {/* Email */}
          <DetailRow
            icon={<KayvilaPngIcon name="mail" size={20} />}
            label="Email"
            value={booking.guest_email ?? "—"}
          />

          {/* Arrivée */}
          <DetailRow
            icon={<KayvilaPngIcon name="calendar" size={20} />}
            label="Arrivée"
            value={formatDate(booking.start_date)}
          />

          {/* Départ */}
          <DetailRow
            icon={<KayvilaPngIcon name="calendar" size={20} />}
            label="Départ"
            value={formatDate(booking.end_date)}
          />

          {/* Durée */}
          <DetailRow
            icon={<KayvilaPngIcon name="clock" size={20} />}
            label="Durée"
            value={`${nights} nuit${nights > 1 ? "s" : ""}`}
          />

          {/* Prix total */}
          <DetailRow
            icon={<Receipt className="h-4 w-4 text-navy/55" strokeWidth={1.5} />}
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
              icon={<Banknote className="h-4 w-4 text-navy/55" strokeWidth={1.5} />}
              label="Prix par nuit"
              value={formatCurrency(pricePerNightCents)}
            />
          )}

          {/* Voyageurs */}
          <DetailRow
            icon={<KayvilaPngIcon name="users" size={20} />}
            label="Voyageurs"
            value={(booking as any).guests ? `${(booking as any).guests} personne${(booking as any).guests > 1 ? "s" : ""}` : "—"}
          />

          {/* Commission Kayvila */}
          <DetailRow
            icon={<KayvilaPngIcon name="trend-down" size={20} />}
            label={`Commission Kayvila (${commissionRate}%)`}
            value={
              <span className="text-amber-700">
                {formatCurrency(commissionCents)}
              </span>
            }
          />

          {/* Revenu net proprio */}
          <DetailRow
            icon={<KayvilaPngIcon name="trending-up" size={20} />}
            label="Revenu net propriétaire"
            value={
              <span className="font-display text-base font-bold text-emerald-700">
                {formatCurrency(netCents)}
              </span>
            }
          />

          {/* Source */}
          <DetailRow
            icon={<Globe className="h-4 w-4 text-navy/55" strokeWidth={1.5} />}
            label="Source"
            value={sourceLabels[booking.source] ?? booking.source}
          />

          {/* Paiement */}
          <DetailRow
            icon={<KayvilaPngIcon name="credit-card" size={20} />}
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
              icon={<Hash className="h-4 w-4 text-navy/55" strokeWidth={1.5} />}
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
