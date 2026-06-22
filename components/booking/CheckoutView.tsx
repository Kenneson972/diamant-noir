"use client";

import { useState, useEffect, useMemo } from "react";
import type { Session } from "@supabase/supabase-js";
import Link from "next/link";
import { useLocale } from "@/contexts/LocaleContext";
import { ChevronLeft } from "lucide-react";
import { KayvilaPngIcon } from "@/components/icons/KayvilaPngIcon";
import { calculatePrice } from "@/lib/price-engine";
import { getSupabaseBrowser } from "@/lib/supabase";
import { KayvilaPressableButton } from "@/components/ui/pro";
import { VillaCoverImage } from "@/components/ui/villa-cover-image";
import { pickVillaImageUrl } from "@/lib/villa-image";
import { CheckoutPriceSummary } from "@/components/booking/CheckoutPriceSummary";
import type { CheckoutVilla } from "@/components/booking/checkout-types";
import { LegalModal } from "@/components/legal/LegalModal";
import { CgvContent } from "@/components/legal/CgvContent";
import { ConfidentialiteContent } from "@/components/legal/ConfidentialiteContent";

type CheckoutViewProps = {
  villa: CheckoutVilla;
  checkin: string;
  checkout: string;
  guestsCount: number;
};

function formatTripDate(iso: string) {
  return new Date(iso + "T12:00:00").toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTripDateShort(iso: string) {
  return new Date(iso + "T12:00:00").toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
}

export function CheckoutView({ villa, checkin, checkout, guestsCount }: CheckoutViewProps) {
  const { t, formatPrice } = useLocale();
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guestEmail, setGuestEmail] = useState("");
  const [guestName, setGuestName] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [cgvAccepted, setCgvAccepted] = useState(false);
  const [openLegal, setOpenLegal] = useState<null | "cgv" | "confidentialite">(null);

  useEffect(() => {
    const supabase = getSupabaseBrowser();
    if (!supabase) return;

    supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
      if (!session?.user) return;
      setIsLoggedIn(true);
      setGuestEmail(session.user.email ?? "");
      setGuestName(session.user.user_metadata?.full_name || "");
    });
  }, []);

  const priceResult = useMemo(
    () =>
      calculatePrice({
        startDate: new Date(checkin),
        endDate: new Date(checkout),
        basePrice: villa.price_per_night,
      }),
    [checkin, checkout, villa.price_per_night]
  );

  const cleaningFee = (villa.cleaning_fee_cents ?? 0) / 100;
  const serviceFee = Math.round(priceResult.total * 0.05);
  const totalAmount = priceResult.total + cleaningFee + serviceFee;
  const nights = priceResult.nights;

  const heroImage = pickVillaImageUrl(villa.image_url, villa.image_urls);
  const editHref = `/villas/${villa.id}?checkin=${checkin}&checkout=${checkout}&guests=${guestsCount}`;

  const houseRules = useMemo(() => {
    if (villa.checkout_instructions?.trim()) {
      return villa.checkout_instructions
        .split(/\n+/)
        .map((line) => line.trim())
        .filter(Boolean);
    }
    return [
      "Arrivée à partir de 17h, départ avant 10h sauf accord conciergerie.",
      "Respect du voisinage et des équipements de la villa.",
      "Non-fumeur à l'intérieur. Animaux sur demande préalable.",
    ];
  }, [villa.checkout_instructions]);

  const handleConfirmBooking = async () => {
    if (!guestEmail.trim()) {
      setError(t("checkout.email_required"));
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail.trim())) {
      setError(t("checkout.invalid_email"));
      return;
    }
    if (!guestName.trim()) {
      setError(t("checkout.name_required"));
      return;
    }

    const minNights = villa.min_nights ?? 1;
    if (nights < minNights) {
      setError(
        `Cette villa nécessite un séjour minimum de ${minNights} nuit${minNights > 1 ? "s" : ""}.`
      );
      return;
    }

    if (!cgvAccepted) {
      setError("Veuillez accepter les CGV pour continuer");
      return;
    }

    setCheckoutLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/booking", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startDate: checkin,
          endDate: checkout,
          villaId: villa.id,
          guests: guestsCount,
          guestName: guestName.trim(),
          guestEmail: guestEmail.trim(),
          cgvAccepted: true,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || t("checkout.booking_failed"));
      }
      window.location.href = payload.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : t("checkout.booking_failed"));
    } finally {
      setCheckoutLoading(false);
    }
  };

  const priceSummaryProps = {
    villa,
    nights,
    stayTotal: priceResult.total,
    cleaningFee,
    serviceFee,
    totalAmount,
    formatPrice,
  };

  const cgvCheckbox = (
    <label className="flex cursor-pointer items-start gap-3 text-sm text-navy/70">
      <input
        type="checkbox"
        checked={cgvAccepted}
        onChange={(e) => setCgvAccepted(e.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 accent-navy"
        data-testid="cgv-checkbox"
      />
      <span>
        J&apos;ai lu et j&apos;accepte les{" "}
        <button
          type="button"
          onClick={() => setOpenLegal("cgv")}
          className="text-[#B8860B] underline-offset-2 hover:underline"
        >
          Conditions Générales de Vente
        </button>{" "}
        et la{" "}
        <button
          type="button"
          onClick={() => setOpenLegal("confidentialite")}
          className="text-[#B8860B] underline-offset-2 hover:underline"
        >
          Politique de confidentialité
        </button>{" "}
        de Kayvila Conciergerie.
      </span>
    </label>
  );

  return (
    <div className="min-h-dvh bg-offwhite">
      {/* Hero éditorial compact */}
      <header className="relative overflow-hidden bg-navy text-white">
        <VillaCoverImage
          src={heroImage}
          alt=""
          fill
          className="object-cover opacity-35"
          sizes="100vw"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/90 to-navy/70" aria-hidden />
        <div className="relative mx-auto max-w-7xl px-4 pb-10 pt-28 sm:px-6 sm:pb-12 sm:pt-32">
          <Link
            href={editHref}
            className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.28em] text-white/55 transition-colors hover:text-gold"
          >
            <ChevronLeft size={14} aria-hidden />
            Modifier la sélection
          </Link>
          <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.42em] text-gold">
            Finaliser votre séjour
          </p>
          <h1 className="mt-3 max-w-2xl font-display text-3xl font-normal leading-tight sm:text-4xl">
            {villa.name}
          </h1>
          {villa.location ? (
            <p className="mt-2 font-display text-base italic text-white/55">{villa.location}</p>
          ) : null}
          <span className="mt-5 block h-px w-10 bg-gold/60" aria-hidden />
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 pb-28 sm:px-6 sm:pb-16 lg:py-14">
        {/* Mobile : récap prix en premier */}
        <div className="mt-8 lg:hidden">
          <CheckoutPriceSummary {...priceSummaryProps} compact />
        </div>

        <div className="mt-10 grid gap-12 lg:mt-12 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-16 xl:grid-cols-[minmax(0,1fr)_400px]">
          <div className="space-y-12">
            {/* Séjour */}
            <section className="space-y-6">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.38em] text-navy/35">
                  Votre séjour
                </p>
                <h2 className="mt-2 font-display text-2xl text-navy">Dates et voyageurs</h2>
              </div>

              <div className="divide-y divide-navy/8 border border-navy/10 bg-white">
                <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-5 sm:px-6">
                  <div className="flex items-start gap-4">
                    <KayvilaPngIcon name="calendar" size={16} alt="" className="mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-navy/45">
                        Arrivée — Départ
                      </p>
                      <p className="mt-1 text-sm text-navy">
                        {formatTripDateShort(checkin)} → {formatTripDate(checkout)}
                      </p>
                      <p className="mt-0.5 text-xs text-navy/50">
                        {nights} nuit{nights > 1 ? "s" : ""}
                        {villa.check_in_time || villa.check_out_time
                          ? ` · Check-in ${villa.check_in_time ?? "17:00"} · Check-out ${villa.check_out_time ?? "10:00"}`
                          : null}
                      </p>
                    </div>
                  </div>
                  <Link
                    href={editHref}
                    className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#B8860B] no-underline hover:text-navy"
                  >
                    Modifier
                  </Link>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-5 sm:px-6">
                  <div className="flex items-start gap-4">
                    <KayvilaPngIcon name="users" size={16} alt="" className="mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-navy/45">
                        Voyageurs
                      </p>
                      <p className="mt-1 text-sm text-navy">
                        {guestsCount} voyageur{guestsCount > 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <Link
                    href={editHref}
                    className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#B8860B] no-underline hover:text-navy"
                  >
                    Modifier
                  </Link>
                </div>
              </div>
            </section>

            {/* Coordonnées */}
            {!isLoggedIn && (
              <section className="space-y-6">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.38em] text-navy/35">
                    Contact
                  </p>
                  <h2 className="mt-2 font-display text-2xl text-navy">Vos coordonnées</h2>
                  <p className="mt-2 max-w-lg text-sm text-navy/55">
                    Pour votre confirmation et l&apos;accès à votre espace client Kayvila.
                  </p>
                </div>

                <div className="space-y-5 border border-navy/10 bg-white p-5 sm:p-6">
                  <div>
                    <label
                      htmlFor="guestName"
                      className="mb-2 block text-[11px] font-bold uppercase tracking-[0.28em] text-navy/45"
                    >
                      Nom complet *
                    </label>
                    <div className="relative">
                      <KayvilaPngIcon
                        name="users"
                        size={16}
                        alt=""
                        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 opacity-30"
                      />
                      <input
                        id="guestName"
                        type="text"
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        placeholder="Marie Dupont"
                        autoComplete="name"
                        className="w-full border border-navy/12 bg-offwhite py-3.5 pl-11 pr-4 text-base text-navy outline-none transition-colors placeholder:text-navy/25 focus:border-gold focus:ring-1 focus:ring-gold"
                      />
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor="guestEmail"
                      className="mb-2 block text-[11px] font-bold uppercase tracking-[0.28em] text-navy/45"
                    >
                      Adresse email *
                    </label>
                    <div className="relative">
                      <KayvilaPngIcon
                        name="mail"
                        size={16}
                        alt=""
                        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 opacity-30"
                      />
                      <input
                        id="guestEmail"
                        type="email"
                        value={guestEmail}
                        onChange={(e) => setGuestEmail(e.target.value)}
                        placeholder="marie@exemple.fr"
                        autoComplete="email"
                        className="w-full border border-navy/12 bg-offwhite py-3.5 pl-11 pr-4 text-base text-navy outline-none transition-colors placeholder:text-navy/25 focus:border-gold focus:ring-1 focus:ring-gold"
                      />
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Annulation */}
            <section className="space-y-4 border-t border-navy/8 pt-10">
              <div className="flex items-start gap-3">
                <KayvilaPngIcon name="shield-check" size={20} alt="" className="mt-0.5 shrink-0" />
                <div className="space-y-3">
                  <h2 className="font-display text-xl text-navy">Politique d&apos;annulation Kayvila</h2>
                  <ul className="space-y-2 text-sm leading-relaxed text-navy/65">
                    <li>Plus de 30 jours avant l&apos;arrivée : remboursement intégral</li>
                    <li>Entre 30 et 14 jours : 50 % du montant du séjour</li>
                    <li>Entre 14 et 7 jours : 25 % du montant du séjour</li>
                    <li>Moins de 7 jours avant l&apos;arrivée : aucun remboursement</li>
                  </ul>
                  <p className="text-xs text-navy/45">
                    Détail complet dans nos{" "}
                    <Link href="/cgv" className="text-[#B8860B] underline-offset-2 hover:underline">
                      conditions générales
                    </Link>
                    .
                  </p>
                </div>
              </div>
            </section>

            {/* Règles */}
            <section className="space-y-4 border-t border-navy/8 pt-10">
              <h2 className="font-display text-xl text-navy">Règles de la maison</h2>
              <ul className="space-y-2 text-sm text-navy/65">
                {houseRules.map((rule) => (
                  <li key={rule} className="flex gap-3">
                    <span className="mt-2 h-px w-3 shrink-0 bg-gold" aria-hidden />
                    {rule}
                  </li>
                ))}
              </ul>
            </section>

            {/* Paiement desktop */}
            <section className="hidden space-y-5 border-t border-navy/8 pt-10 sm:block">
              <h2 className="font-display text-xl text-navy">Paiement sécurisé</h2>
              <p className="text-sm text-navy/55">
                En confirmant, vous acceptez les{" "}
                <Link href="/terms" className="text-[#B8860B] underline-offset-2 hover:underline">
                  conditions du séjour
                </Link>
                , nos{" "}
                <Link href="/cgv" className="text-[#B8860B] underline-offset-2 hover:underline">
                  CGV
                </Link>{" "}
                et notre{" "}
                <Link
                  href="/confidentialite"
                  className="text-[#B8860B] underline-offset-2 hover:underline"
                >
                  politique de confidentialité
                </Link>
                . Redirection vers Stripe pour le règlement.
              </p>

              {cgvCheckbox}

              {error ? (
                <div
                  role="alert"
                  className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                  {error}
                </div>
              ) : null}

              <KayvilaPressableButton
                variant="navy"
                onClick={handleConfirmBooking}
                disabled={checkoutLoading}
                className="max-w-md"
              >
                {checkoutLoading ? t("common.loading") : t("checkout.title")}
              </KayvilaPressableButton>
            </section>
          </div>

          {/* Desktop récap */}
          <div className="hidden lg:block">
            <div className="sticky top-28">
              <CheckoutPriceSummary {...priceSummaryProps} />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sticky CTA avec total */}
      <div
        className="fixed inset-x-0 bottom-0 z-40 border-t border-navy/10 bg-white/95 backdrop-blur-sm sm:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        {error ? (
          <div role="alert" className="border-b border-red-100 bg-red-50 px-4 py-2 text-xs text-red-700">
            {error}
          </div>
        ) : null}
        <div className="px-4 pt-3">{cgvCheckbox}</div>
        <div className="flex items-center gap-4 px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-navy/40">Total</p>
            <p className="font-display text-xl text-navy">{formatPrice(totalAmount)}</p>
          </div>
          <KayvilaPressableButton
            variant="navy"
            onClick={handleConfirmBooking}
            disabled={checkoutLoading}
            className="w-auto min-w-[10rem] shrink-0 px-6 py-3.5"
          >
            {checkoutLoading ? "…" : "Payer"}
          </KayvilaPressableButton>
        </div>
        <p className="px-4 pb-3 text-[10px] leading-relaxed text-navy/45">
          En confirmant, vous acceptez nos{" "}
          <Link href="/cgv" className="text-[#B8860B]">
            CGV
          </Link>
          .
        </p>
      </div>

      <LegalModal
        open={openLegal === "cgv"}
        onClose={() => setOpenLegal(null)}
        title="Conditions Générales de Vente"
      >
        <CgvContent />
      </LegalModal>
      <LegalModal
        open={openLegal === "confidentialite"}
        onClose={() => setOpenLegal(null)}
        title="Politique de confidentialité"
      >
        <ConfidentialiteContent />
      </LegalModal>
    </div>
  );
}
