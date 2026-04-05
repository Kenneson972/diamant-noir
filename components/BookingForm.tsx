"use client";

import { useEffect, useMemo, useState } from "react";
import { calculatePrice } from "@/lib/price-engine";
import { getSupabaseBrowser } from "@/lib/supabase";
import { useLocale } from "@/contexts/LocaleContext";
import { Star } from "lucide-react";

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
};

export const BookingForm = ({
  villaId,
  basePrice,
  capacity,
  checkInTime = "17:00",
  checkOutTime = "10:00",
}: BookingFormProps) => {
  const { formatPrice } = useLocale();
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
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
    });
  }, [start, end, basePrice]);

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
    new Date(value).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
    });

  return (
    <section className="w-full space-y-5">
      <div className="flex items-center justify-between pb-4 border-b border-navy/10">
        <div>
          <span className="font-display text-3xl text-navy">{formatPrice(basePrice)}</span>
          <span className="text-sm text-navy/60 font-medium"> / nuit</span>
        </div>
        <div className="flex items-center gap-1 text-sm font-semibold">
          <Star size={14} className="fill-gold text-gold" />
          <span className="text-navy">4.98</span>
          <span className="text-navy/40 font-normal">· 128 avis</span>
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
        <div className="p-3 hover:bg-offwhite transition-colors cursor-pointer">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-navy">Voyageurs</span>
          <select 
            value={guests}
            onChange={(e) => setGuests(Number(e.target.value))}
            className="w-full bg-transparent text-sm font-medium focus:outline-none mt-1"
          >
            {Array.from({ length: capacity }, (_, i) => (
              <option key={i + 1} value={i + 1}>{i + 1} voyageur{i > 0 ? 's' : ''}</option>
            ))}
          </select>
        </div>
      </div>

      <button
        type="button"
        onClick={handleCheckout}
        disabled={!start || !end || loading || isSelectionUnavailable}
        className="w-full rounded-xl bg-gold py-4 text-sm font-bold uppercase tracking-widest text-navy transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50 disabled:grayscale shadow-lg shadow-gold/20"
      >
        {loading ? "Chargement..." : isSelectionUnavailable ? "Indisponible" : "Réserver"}
      </button>

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
          <p className="text-center text-xs text-navy/40 mb-4">Vous ne serez pas encore débité</p>
          <div className="flex justify-between">
            <span className="underline decoration-navy/20 underline-offset-4">{formatPrice(basePrice)} x {price.nights} nuits</span>
            <span>{formatPrice(price.total)}</span>
          </div>
          <div className="flex justify-between">
            <span className="underline decoration-navy/20 underline-offset-4">Frais de ménage</span>
            <span>{formatPrice(150)}</span>
          </div>
          <div className="flex justify-between">
            <span className="underline decoration-navy/20 underline-offset-4">Frais de service Diamant Noir</span>
            <span>{formatPrice(Math.round(price.total * 0.05))}</span>
          </div>
          <div className="flex justify-between font-bold text-navy pt-4 border-t border-navy/10 text-lg">
            <span>Total</span>
            <span>{formatPrice(Math.round(price.total + 150 + price.total * 0.05))}</span>
          </div>
        </div>
      ) : (
        <p className="text-center text-xs text-navy/40">Entrez vos dates pour voir le prix total</p>
      )}

      {error ? <p className="text-center text-xs text-red-500">{error}</p> : null}
    </section>
  );
};
