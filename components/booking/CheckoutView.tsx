"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ChevronLeft,
  Calendar,
  Users,
  ShieldCheck,
  Info,
  CreditCard,
  Lock,
  ArrowRight
} from "lucide-react";
import { calculatePrice } from "@/lib/price-engine";
import { getSupabaseBrowser } from "@/lib/supabase";

interface CheckoutViewProps {
  villaId: string;
  checkin: string;
  checkout: string;
  guestsCount: number;
}

export const CheckoutView = ({ villaId, checkin, checkout, guestsCount }: CheckoutViewProps) => {
  const [villa, setVilla] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guestEmail, setGuestEmail] = useState<string | null>(null);

  useEffect(() => {
    const fetchVilla = async () => {
      const supabase = getSupabaseBrowser();
      if (!supabase) return;

      const { data: { session } } = await supabase.auth.getSession();
      setGuestEmail(session?.user?.email ?? null);

      const { data, error } = await supabase
        .from("villas")
        .select("*")
        .eq("id", villaId)
        .single();

      if (!error && data) {
        setVilla(data);
      }
      setLoading(false);
    };

    fetchVilla();
  }, [villaId]);

  const priceResult = villa ? calculatePrice({
    startDate: new Date(checkin),
    endDate: new Date(checkout),
    basePrice: villa.price_per_night
  }) : null;

  const handleConfirmBooking = async () => {
    setCheckoutLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          startDate: checkin, 
          endDate: checkout, 
          villaId,
          guests: guestsCount,
          guestName: guestEmail ?? "Invité"
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "La réservation a échoué");
      }
      window.location.href = payload.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "La réservation a échoué");
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div role="status" className="h-12 w-12 animate-spin rounded-full border-4 border-gold border-t-transparent">
          <span className="sr-only">Chargement en cours</span>
        </div>
      </div>
    );
  }

  if (!villa) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
        <p className="text-navy/60">Villa non trouvée</p>
        <Link href="/villas" className="text-gold underline">
          Retour au catalogue
        </Link>
      </div>
    );
  }

  const cleaningFee = 150;
  const serviceFee = priceResult ? Math.round(priceResult.total * 0.05) : 0;
  const totalAmount = priceResult ? priceResult.total + cleaningFee + serviceFee : 0;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-12 pb-24 sm:pb-12 lg:py-20">
      <div className="mb-12">
        <Link href={`/villas/${villaId}`} className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-navy/40 hover:text-navy transition-colors group">
          <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Modifier la sélection
        </Link>
        <h1 className="mt-6 font-display text-4xl text-navy lg:text-5xl">Confirmer et payer</h1>
      </div>

      {/* Mobile sticky CTA */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-black/10 bg-white p-4 sm:hidden"
        style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}
      >
        <button
          onClick={handleConfirmBooking}
          disabled={checkoutLoading}
          className="w-full bg-navy py-3 text-[11px] font-bold uppercase tracking-[0.3em] text-white transition-colors hover:bg-gold hover:text-navy disabled:opacity-50"
        >
          {checkoutLoading ? "Chargement…" : "Confirmer la réservation"}
        </button>
      </div>

      <div className="grid gap-16 lg:grid-cols-[1fr_400px]">
        {/* Left Column: Review Trip */}
        <div className="space-y-12">
          {/* Your Trip Section */}
          <section className="space-y-8">
            <h2 className="text-2xl font-semibold text-navy">Votre voyage</h2>
            
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="flex items-center justify-between rounded-2xl border border-navy/10 p-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold/10 text-gold">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-navy/40">Dates</p>
                    <p className="text-sm font-bold text-navy">
                      {new Date(checkin).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} - {new Date(checkout).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                <Link href={`/villas/${villaId}`} className="text-xs font-bold text-navy underline decoration-gold underline-offset-4">Modifier</Link>
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-navy/10 p-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold/10 text-gold">
                    <Users size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-navy/40">Voyageurs</p>
                    <p className="text-sm font-bold text-navy">{guestsCount} voyageur{guestsCount > 1 ? 's' : ''}</p>
                  </div>
                </div>
                <Link href={`/villas/${villaId}`} className="text-xs font-bold text-navy underline decoration-gold underline-offset-4">Modifier</Link>
              </div>
            </div>
          </section>

          <hr className="border-navy/5" />

          {/* Cancellation Policy */}
          <section className="space-y-4">
            <h3 className="text-xl font-semibold text-navy">Politique d'annulation</h3>
            <div className="flex gap-4">
              <div className="mt-1 shrink-0 text-gold">
                <ShieldCheck size={20} />
              </div>
              <p className="text-sm leading-relaxed text-navy/70">
                <span className="font-bold text-navy">Annulation gratuite pendant 48 heures.</span> Après cela, annulez avant le {new Date(new Date(checkin).getTime() - 7 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR')} pour obtenir un remboursement intégral, moins les frais de service.
              </p>
            </div>
          </section>

          <hr className="border-navy/5" />

          {/* Ground Rules */}
          <section className="space-y-4">
            <h3 className="text-xl font-semibold text-navy">Règles de la maison</h3>
            <p className="text-sm text-navy/70">Nous vous demandons de suivre ces règles simples pour être un voyageur d'exception :</p>
            <ul className="space-y-3 text-sm text-navy/70">
              <li className="flex items-center gap-3">
                <div className="h-1.5 w-1.5 rounded-full bg-gold" />
                Suivre les règles de la maison
              </li>
              <li className="flex items-center gap-3">
                <div className="h-1.5 w-1.5 rounded-full bg-gold" />
                Traiter le logement comme le vôtre
              </li>
            </ul>
          </section>

          <hr className="border-navy/5" />

          {/* Payment Info */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-navy">Paiement</h3>
              <div className="flex gap-2">
                <CreditCard size={20} className="text-navy/20" />
                <Lock size={20} className="text-navy/20" />
              </div>
            </div>
            <p className="text-xs text-navy/40">
              En sélectionnant le bouton ci-dessous, j'accepte les <Link href="/terms" className="underline hover:opacity-70 transition-opacity">Règles de la maison</Link>, les <span className="underline">Règles de sécurité pour les expériences</span> et la <span className="underline">Politique de remboursement des voyageurs</span>.
            </p>
            
            {error && (
              <div className="rounded-xl bg-red-50 p-4 text-xs text-red-500 border border-red-100 flex items-center gap-3">
                <Info size={16} />
                {error}
              </div>
            )}

            <button
              onClick={handleConfirmBooking}
              disabled={checkoutLoading}
              className="group relative flex w-full items-center justify-center gap-4 overflow-hidden rounded-2xl bg-navy py-5 text-[10px] font-bold uppercase tracking-[0.3em] text-white shadow-2xl transition-all hover:bg-gold hover:text-navy disabled:opacity-50 md:w-auto md:px-12"
            >
              {checkoutLoading ? (
                <div role="status" className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent">
                  <span className="sr-only">Chargement en cours</span>
                </div>
              ) : (
                <>
                  Confirmer et payer
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-2" />
                </>
              )}
            </button>
          </section>
        </div>

        {/* Right Column: Price Summary Sticky */}
        <div className="relative">
          <div className="sticky top-32 space-y-6">
            <div className="rounded-[32px] border border-navy/10 bg-white p-4 sm:p-6 shadow-xl lg:p-8">
              <div className="flex gap-4 pb-6 border-b border-navy/5">
                <div className="relative h-24 w-32 shrink-0 overflow-hidden rounded-xl">
                  <Image 
                    src={villa.image_url || villa.image_urls?.[0] || "/villa-hero.jpg"} 
                    alt={villa.name} 
                    fill 
                    className="object-cover" 
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-navy/40">{villa.location}</p>
                  <h4 className="font-display text-lg leading-tight text-navy">{villa.name}</h4>
                  {/* Rating masqué — données non dynamiques */}
                </div>
              </div>

              <div className="space-y-4 py-6">
                <h5 className="text-lg font-semibold text-navy">Détails du prix</h5>
                <div className="space-y-3 text-sm text-navy/70">
                  <div className="flex justify-between">
                    <span>€{villa.price_per_night.toLocaleString()} x {priceResult?.nights} nuits</span>
                    <span>€{priceResult?.total.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="underline decoration-navy/10 underline-offset-4 cursor-help">Frais de ménage</span>
                    <span>€{cleaningFee}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="underline decoration-navy/10 underline-offset-4 cursor-help">Frais de service Diamant Noir</span>
                    <span>€{serviceFee.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between border-t border-navy/10 pt-6 text-lg font-bold text-navy">
                <span>Total (EUR)</span>
                <span>€{totalAmount.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-2xl bg-offwhite p-6 border border-navy/5">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-gold shadow-sm">
                <Lock size={18} />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-navy">Paiement Sécurisé</p>
                <p className="text-[10px] text-navy/40">Données cryptées SSL</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
