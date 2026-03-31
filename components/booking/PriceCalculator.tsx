"use client";

/**
 * PriceCalculator — Diamant Noir
 * ────────────────────────────────
 * Widget de calcul de prix live. À placer sur la fiche villa.
 * Calcule automatiquement le total dès que les dates sont choisies.
 *
 * Props :
 *   pricePerNight  — Prix par nuit en €
 *   villaId        — Pour rediriger vers /book
 *   cleaningFee    — Frais de ménage (défaut : 150 €)
 *   conciergeRate  — % frais conciergerie (défaut : 0, ajustable)
 */

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Users, ChevronRight } from "lucide-react";

interface PriceCalculatorProps {
  pricePerNight: number;
  villaId: string;
  cleaningFee?: number;
  conciergeRate?: number; // 0.0 → 1.0
}

function parseDate(str: string): Date | null {
  if (!str) return null;
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

function diffNights(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

function fmt(n: number) {
  return n.toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
}

export function PriceCalculator({
  pricePerNight,
  villaId,
  cleaningFee = 150,
  conciergeRate = 0,
}: PriceCalculatorProps) {
  const router = useRouter();
  const today = new Date().toISOString().split("T")[0];

  const [checkin, setCheckin] = useState("");
  const [checkout, setCheckout] = useState("");
  const [guests, setGuests] = useState(2);

  const calc = useMemo(() => {
    const a = parseDate(checkin);
    const b = parseDate(checkout);
    if (!a || !b || b <= a) return null;
    const nights = diffNights(a, b);
    const base = nights * pricePerNight;
    const concierge = Math.round(base * conciergeRate);
    const total = base + cleaningFee + concierge;
    return { nights, base, cleaningFee, concierge, total };
  }, [checkin, checkout, pricePerNight, cleaningFee, conciergeRate]);

  function handleBook() {
    const params = new URLSearchParams({
      villa: villaId,
      checkin,
      checkout,
      guests: String(guests),
    });
    router.push(`/book?${params.toString()}`);
  }

  return (
    <div className="border border-navy/10 bg-white p-6 shadow-sm space-y-5">
      {/* Header */}
      <div className="flex items-baseline gap-2">
        <span className="font-display text-2xl font-normal text-navy">
          {fmt(pricePerNight)}
        </span>
        <span className="text-xs text-navy/40 tracking-wide">/ nuit</span>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-px bg-navy/10 border border-navy/10">
        {/* Arrivée */}
        <div className="bg-white px-4 py-3">
          <label className="block text-[9px] uppercase tracking-[0.2em] text-navy/40 mb-1.5">
            Arrivée
          </label>
          <input
            type="date"
            min={today}
            value={checkin}
            onChange={(e) => {
              setCheckin(e.target.value);
              if (checkout && e.target.value >= checkout) setCheckout("");
            }}
            className="w-full bg-transparent text-sm text-navy focus:outline-none cursor-pointer"
          />
        </div>
        {/* Départ */}
        <div className="bg-white px-4 py-3">
          <label className="block text-[9px] uppercase tracking-[0.2em] text-navy/40 mb-1.5">
            Départ
          </label>
          <input
            type="date"
            min={checkin || today}
            value={checkout}
            onChange={(e) => setCheckout(e.target.value)}
            className="w-full bg-transparent text-sm text-navy focus:outline-none cursor-pointer"
          />
        </div>
      </div>

      {/* Voyageurs */}
      <div className="flex items-center gap-3 border border-navy/10 px-4 py-3">
        <Users size={14} className="text-navy/40 shrink-0" />
        <label className="text-[9px] uppercase tracking-[0.2em] text-navy/40 flex-1">
          Voyageurs
        </label>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setGuests((g) => Math.max(1, g - 1))}
            className="w-6 h-6 flex items-center justify-center border border-navy/15 text-navy hover:border-gold hover:text-gold transition-colors text-sm"
          >
            −
          </button>
          <span className="text-sm font-medium text-navy w-4 text-center tabular-nums">
            {guests}
          </span>
          <button
            onClick={() => setGuests((g) => Math.min(20, g + 1))}
            className="w-6 h-6 flex items-center justify-center border border-navy/15 text-navy hover:border-gold hover:text-gold transition-colors text-sm"
          >
            +
          </button>
        </div>
      </div>

      {/* Détail du prix — apparaît uniquement si dates valides */}
      {calc && (
        <div className="space-y-2.5 border-t border-navy/[0.07] pt-4 text-sm">
          <div className="flex justify-between text-navy/70">
            <span>
              {fmt(pricePerNight)} × {calc.nights} nuit{calc.nights > 1 ? "s" : ""}
            </span>
            <span className="tabular-nums">{fmt(calc.base)}</span>
          </div>
          <div className="flex justify-between text-navy/70">
            <span>Frais de ménage</span>
            <span className="tabular-nums">{fmt(calc.cleaningFee)}</span>
          </div>
          {calc.concierge > 0 && (
            <div className="flex justify-between text-navy/70">
              <span>Frais de conciergerie</span>
              <span className="tabular-nums">{fmt(calc.concierge)}</span>
            </div>
          )}
          <div className="flex justify-between font-semibold text-navy border-t border-navy/[0.07] pt-2.5 mt-1">
            <span>Total</span>
            <span className="tabular-nums text-base">{fmt(calc.total)}</span>
          </div>
          <p className="text-[10px] text-navy/35 tracking-wide">
            Taxes incluses · Paiement sécurisé
          </p>
        </div>
      )}

      {/* CTA */}
      <button
        onClick={handleBook}
        disabled={!calc}
        className={`
          w-full flex items-center justify-center gap-2
          py-4 text-[11px] font-bold uppercase tracking-[0.25em]
          transition-all duration-300
          ${calc
            ? "bg-navy text-white hover:bg-gold hover:text-navy cursor-pointer"
            : "bg-navy/10 text-navy/30 cursor-not-allowed"
          }
        `}
      >
        {calc ? (
          <>
            Réserver <ChevronRight size={13} />
          </>
        ) : (
          <>
            <Calendar size={13} /> Choisir les dates
          </>
        )}
      </button>

      {/* Hint discret */}
      {!calc && (
        <p className="text-center text-[10px] text-navy/35 tracking-wide -mt-2">
          Sélectionnez vos dates pour voir le prix total
        </p>
      )}
    </div>
  );
}
