"use client";

import type { CheckoutVilla } from "@/components/booking/checkout-types";
import { VillaCoverImage } from "@/components/ui/villa-cover-image";
import { pickVillaImageUrl } from "@/lib/villa-image";
import { Lock } from "lucide-react";

type CheckoutPriceSummaryProps = {
  villa: CheckoutVilla;
  nights: number;
  stayTotal: number;
  cleaningFee: number;
  serviceFee: number;
  totalAmount: number;
  formatPrice: (amount: number) => string;
  compact?: boolean;
};

export function CheckoutPriceSummary({
  villa,
  nights,
  stayTotal,
  cleaningFee,
  serviceFee,
  totalAmount,
  formatPrice,
  compact = false,
}: CheckoutPriceSummaryProps) {
  const imageSrc = pickVillaImageUrl(villa.image_url, villa.image_urls);

  return (
    <aside
      className={
        compact
          ? "border border-navy/10 bg-white p-5"
          : "border border-navy/10 bg-white p-6 lg:p-8"
      }
    >
      {!compact && (
        <div className="mb-6 flex gap-4 border-b border-navy/8 pb-6">
          <div className="relative h-20 w-28 shrink-0 overflow-hidden">
            <VillaCoverImage src={imageSrc} alt={villa.name} fill className="object-cover" sizes="112px" />
          </div>
          <div className="min-w-0 space-y-1">
            {villa.location ? (
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-navy/45">
                {villa.location}
              </p>
            ) : null}
            <h2 className="font-display text-xl leading-snug text-navy">{villa.name}</h2>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-navy/40">
          Détail du séjour
        </p>
        <dl className="space-y-3 text-sm text-navy/70">
          <div className="flex justify-between gap-4">
            <dt>
              {formatPrice(villa.price_per_night)} × {nights} nuit{nights > 1 ? "s" : ""}
            </dt>
            <dd className="shrink-0 font-medium text-navy">{formatPrice(stayTotal)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt>Frais de ménage</dt>
            <dd className="shrink-0 font-medium text-navy">{formatPrice(cleaningFee)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt>Frais de conciergerie Kayvila (5 %)</dt>
            <dd className="shrink-0 font-medium text-navy">{formatPrice(serviceFee)}</dd>
          </div>
        </dl>
      </div>

      <div className="mt-6 flex items-baseline justify-between border-t border-navy/10 pt-5">
        <span className="font-display text-lg text-navy">Total</span>
        <span className="font-display text-2xl text-navy">{formatPrice(totalAmount)}</span>
      </div>

      {!compact && (
        <div className="mt-6 flex items-start gap-3 border-t border-navy/8 pt-5 text-navy/55">
          <Lock className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden />
          <p className="text-[11px] leading-relaxed">
            Paiement sécurisé par Stripe. Vos données bancaires ne sont jamais stockées sur nos
            serveurs.
          </p>
        </div>
      )}
    </aside>
  );
}
