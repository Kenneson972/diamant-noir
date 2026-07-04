"use client";

import { useEffect, useMemo, useState } from "react";
import { calculatePrice } from "@/lib/price-engine";
import { parseDateOnly } from "@/lib/utils";
import { getSupabaseBrowser } from "@/lib/supabase";
import { useLocale } from "@/contexts/LocaleContext";
import { NumberStepper } from "@heroui-pro/react";
import { KayvilaPressableButton } from "@/components/ui/pro";

type BookingDate = {
  start_date: string;
  end_date: string;
};

const dateToInput = (date: Date) => date.toISOString().slice(0, 10);

const isOverlapping = (start: string, end: string, range: BookingDate) =>
  start < range.end_date && end > range.start_date;

type BookingFormProps = {
  villaId: string;
  basePrice: number;
  capacity: number;
  checkInTime?: string;
  checkOutTime?: string;
  externalStart?: string;
  externalEnd?: string;
  cleaningFeeCents?: number | null;
  seasonalPrices?: { season: string; start: string; end: string; price: number }[];
};

export const BookingForm = ({
  villaId,
  basePrice,
  capacity,
  checkInTime = "17:00",
  checkOutTime = "10:00",
  externalStart,
  externalEnd,
  cleaningFeeCents,
  seasonalPrices,
}: BookingFormProps) => {
  const cleaningFee = (cleaningFeeCents || 0) / 100;
  const { formatPrice } = useLocale();
  const [start, setStart] = useState(externalStart || "");
  const [end, setEnd] = useState(externalEnd || "");

  // Synchroniser les dates externes (depuis le calendrier)
  useEffect(() => {
    if (externalStart) setStart(externalStart);
    if (externalEnd) setEnd(externalEnd);
  }, [externalStart, externalEnd]);
  const [guests, setGuests] = useState(1);
  const [booked, setBooked] = useState<BookingDate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadBookedDates = async () => {
      const supabaseBrowser = getSupabaseBrowser();
      if (!supabaseBrowser) {
        return;
      }

      const { data, error: fetchError } = await supabaseBrowser
        .from("booking_calendar_slots")
        .select("start_date,end_date")
        .eq("villa_id", villaId);

      if (fetchError) {
        setError("Impossible de charger les disponibilités");
        return;
      }

      setBooked(data || []);
    };

    loadBookedDates();
  }, [villaId]);

  const price = useMemo(() => {
    if (!start || !end) {
      return null;
    }
    return calculatePrice({
      startDate: new Date(start),
      endDate: new Date(end),
      basePrice: basePrice,
      seasonalPrices,
    });
  }, [start, end, basePrice, seasonalPrices]);

  const isSelectionUnavailable =
    start && end
      ? booked.some((range) => isOverlapping(start, end, range))
      : false;

  const minStart = dateToInput(new Date());
  const minEnd = start || minStart;

  const handleCheckout = () => {
    if (!start || !end) return;
    const url = `/book?villaId=${villaId}&checkin=${start}&checkout=${end}&guests=${guests}`;
    window.location.href = url;
  };

  const dateLabel = (value: string) =>
    parseDateOnly(value).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
    });

  return (
    <section className="w-full space-y-5">
      <div className="flex items-center justify-between pb-4 border-b border-navy/10">
        <div>
          <span className="font-display text-3xl text-navy">{formatPrice(basePrice)}</span>
          <span className="text-sm text-navy/80 font-medium"> / nuit</span>
        </div>
      </div>

      <div className="rounded-xl border border-navy/20 overflow-hidden shadow-sm">
        <div className="grid grid-cols-2">
          <label className="border-r border-b border-navy/20 p-3 hover:bg-offwhite transition-colors cursor-pointer">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-navy">Arrivée</span>
            <input
              type="date"
              min={minStart}
              value={start}
              className="w-full bg-transparent text-sm font-medium focus:outline-none mt-1"
              onChange={(event) => setStart(event.target.value)}
            />
          </label>
          <label className="border-b border-navy/20 p-3 hover:bg-offwhite transition-colors cursor-pointer">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-navy">Départ</span>
            <input
              type="date"
              min={minEnd}
              value={end}
              className="w-full bg-transparent text-sm font-medium focus:outline-none mt-1"
              onChange={(event) => setEnd(event.target.value)}
            />
          </label>
        </div>
        <div className="p-3 hover:bg-offwhite transition-colors">
          <span className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-navy">Voyageurs</span>
          <NumberStepper
            aria-label="Nombre de voyageurs"
            value={guests}
            onChange={setGuests}
            minValue={1}
            maxValue={capacity}
          >
            <NumberStepper.Group>
              <NumberStepper.DecrementButton />
              <NumberStepper.Value />
              <NumberStepper.IncrementButton />
            </NumberStepper.Group>
          </NumberStepper>
        </div>
      </div>

      <KayvilaPressableButton
        type="button"
        onClick={handleCheckout}
        disabled={!start || !end || loading || isSelectionUnavailable}
      >
        {loading ? "Chargement..." : isSelectionUnavailable ? "Indisponible" : "Réserver"}
      </KayvilaPressableButton>

      <p className="flex items-center gap-1.5 text-xs text-navy/50 justify-center mt-2">
        <svg className="w-3.5 h-3.5 text-green-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.955 11.955 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
        </svg>
        Paiement sécurisé · Aucun débit maintenant
      </p>

      {!start && !end && (
        <p className="text-sm text-navy/80 text-center mt-1">
          À partir de <span className="font-semibold text-navy">{formatPrice(basePrice)}</span> / nuit
        </p>
      )}

      {start && end ? (
        <p className="text-center text-xs text-navy/45">
          Séjour du {dateLabel(start)} au {dateLabel(end)} · Arrivée {checkInTime} · Départ {checkOutTime}
        </p>
      ) : (
        <p className="text-center text-xs text-navy/45">
          Arrivée à partir de {checkInTime} · Départ avant {checkOutTime}
        </p>
      )}

      {price ? (
        <div className="space-y-4 pt-4 text-sm text-navy/70 animate-in fade-in slide-in-from-top-2 duration-300">
          <p className="text-center text-xs text-navy/55 mb-4">Vous ne serez pas encore débité</p>
          <div className="flex justify-between">
            <span className="underline decoration-navy/20 underline-offset-4">{formatPrice(basePrice)} x {price.nights} nuits</span>
            <span>{formatPrice(price.total)}</span>
          </div>
          <div className="flex justify-between">
            <span className="underline decoration-navy/20 underline-offset-4">Frais de ménage</span>
            <span>{formatPrice(cleaningFee)}</span>
          </div>
          <div className="flex justify-between">
            <span className="underline decoration-navy/20 underline-offset-4">Frais de service Kayvila</span>
            <span>{formatPrice(Math.round(price.total * 0.05))}</span>
          </div>
          <div className="flex justify-between font-bold text-navy pt-4 border-t border-navy/10 text-lg">
            <span>Total</span>
            <span>{formatPrice(Math.round(price.total + cleaningFee + price.total * 0.05))}</span>
          </div>
        </div>
      ) : (
        <p className="text-center text-xs text-navy/55">Entrez vos dates pour voir le prix total</p>
      )}

      {error ? <p className="text-center text-xs text-red-500">{error}</p> : null}
    </section>
  );
};
