"use client";

import { useLocale } from "@/contexts/LocaleContext";

export function PriceDisplay({ amount, perNight }: { amount: number; perNight?: boolean }) {
  const { formatPrice } = useLocale();
  return (
    <span>
      {formatPrice(amount)}
      {perNight && <span className="text-navy/60 text-sm font-normal"> / nuit</span>}
    </span>
  );
}
