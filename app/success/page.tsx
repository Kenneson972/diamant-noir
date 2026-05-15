"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { formatCurrency, getBookingPriceCents } from "@/lib/utils";
import { getSupabaseBrowser } from "@/lib/supabase";
import {
  Check,
  Calendar,
  MapPin,
  ArrowRight,
  Mail,
  Lock,
  ExternalLink,
  PartyPopper,
  CreditCard,
  ShieldCheck,
  LogIn,
} from "lucide-react";

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const bookingId = searchParams.get("bookingId");
  const emailParam = searchParams.get("email");
  const [data, setData] = useState<{ booking: any; villa: any } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [guestEmail, setGuestEmail] = useState<string>("");
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [magicLoading, setMagicLoading] = useState(false);
  const [magicError, setMagicError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const supabase = getSupabaseBrowser();
      let sessionEmail = "";

      if (supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setIsLoggedIn(true);
          sessionEmail = session.user.email ?? "";
        }
      }

      // Set guest email from URL param if present (passed from booking API)
      if (emailParam && !guestEmail) setGuestEmail(emailParam);

      if (sessionId) {
        try {
          const res = await fetch(`/api/booking-session?session_id=${encodeURIComponent(sessionId)}`);
          if (res.ok) {
            const json = await res.json();
            setData(json);
            // Use guest email from booking if available
            if (json.booking?.guest_email) setGuestEmail(json.booking.guest_email);
          } else {
            throw new Error("Not found");
          }
        } catch {
          setError("Réservation introuvable.");
        }
      } else if (bookingId) {
        setData({ booking: { id: bookingId }, villa: null });
      } else {
        setError("Paramètres de confirmation manquants.");
      }
      setLoading(false);
    };

    fetchData();
  }, [sessionId, bookingId]);

  const handleSendMagicLink = async () => {
    if (!guestEmail) return;
    setMagicLoading(true);
    setMagicError(null);
    try {
      const supabase = getSupabaseBrowser();
      if (!supabase) throw new Error("Supabase non disponible");
      const { error } = await supabase.auth.signInWithOtp({
        email: guestEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/espace-client`,
        },
      });
      if (error) throw error;
      setMagicLinkSent(true);
    } catch (err) {
      setMagicError(err instanceof Error ? err.message : "Erreur d'envoi");
    } finally {
      setMagicLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-dvh bg-offwhite">
        <div className="mx-auto flex min-h-[60vh] max-w-2xl items-center justify-center px-6">
          <div className="text-center">
            <div role="status" className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-gold border-t-transparent">
              <span className="sr-only">Chargement de votre confirmation...</span>
            </div>
            <p className="mt-6 text-sm text-navy/40">Vérification de votre réservation...</p>
          </div>
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="min-h-dvh bg-offwhite">
        <div className="mx-auto max-w-lg px-6 pt-32 pb-20 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
            <span className="text-2xl text-red-400">!</span>
          </div>
          <p className="mb-2 text-lg font-semibold text-navy">Oups</p>
          <p className="mb-8 text-sm text-navy/60">{error || "Une erreur est survenue."}</p>
          <Link
            href="/villas"
            className="inline-flex items-center gap-2 rounded-full bg-navy px-6 py-3 text-[11px] font-bold uppercase tracking-[0.2em] text-white transition-all hover:bg-gold hover:text-navy"
          >
            Découvrir nos villas
            <ArrowRight size={14} />
          </Link>
        </div>
      </main>
    );
  }

  const { booking, villa } = data;
  const isConfirmed = booking?.status === "confirmed" || booking?.payment_status === "paid";

  const startDate = booking?.start_date
    ? new Date(booking.start_date).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;
  const endDate = booking?.end_date
    ? new Date(booking.end_date).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;
  const nights = booking?.start_date && booking?.end_date
    ? Math.round(
        (new Date(booking.end_date).getTime() - new Date(booking.start_date).getTime()) / 86400000
      )
    : null;

  return (
    <main className="min-h-dvh bg-offwhite">
      <div className="mx-auto max-w-2xl px-6 pt-20 pb-32 sm:pt-28">
        {/* ── Success header ── */}
        <div className="text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50">
            <PartyPopper className="h-9 w-9 text-emerald-500" strokeWidth={1.5} />
          </div>
          <h1 className="font-display text-3xl text-navy sm:text-4xl">
            Réservation confirmée !
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-navy/60">
            {isLoggedIn
              ? "Votre séjour est enregistré. Retrouvez tous les détails dans votre espace client."
              : `Un email de confirmation a été envoyé à ${guestEmail || "votre adresse"}.`}
          </p>
        </div>

        {/* ── Booking details card ── */}
        <div className="mt-10 overflow-hidden rounded-3xl border border-navy/10 bg-white shadow-sm">
          {/* Villa preview */}
          {villa?.name && (
            <div className="border-b border-navy/5 bg-gradient-to-br from-navy/5 to-transparent px-6 py-5 sm:px-8">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gold/10 text-gold">
                  <MapPin size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-navy/30">
                    Villa
                  </p>
                  <h2 className="mt-1 font-display text-xl text-navy">{villa.name}</h2>
                  {villa.location && (
                    <p className="mt-0.5 text-sm text-navy/50">{villa.location}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Dates and details */}
          <div className="divide-y divide-navy/5 px-6 py-5 sm:px-8">
            {startDate && endDate && (
              <div className="flex items-center gap-4 pb-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gold/10 text-gold">
                  <Calendar size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-navy/30">
                    Dates du séjour
                  </p>
                  <p className="mt-0.5 text-sm font-medium text-navy">
                    Du {startDate} au {endDate}
                  </p>
                  {nights && (
                    <p className="text-xs text-navy/40">{nights} nuit{nights > 1 ? "s" : ""}</p>
                  )}
                </div>
              </div>
            )}

            {booking?.price != null && (
              <div className="flex items-center gap-4 pt-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-500">
                  <CreditCard size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-navy/30">
                    Montant réglé
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-navy">
                    {formatCurrency(getBookingPriceCents(booking))}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Guest onboarding (NOT logged in) ── */}
        {!isLoggedIn && guestEmail && (
          <div className="mt-10 overflow-hidden rounded-3xl border border-gold/20 bg-gradient-to-br from-gold/[0.03] to-white shadow-sm">
            <div className="px-6 py-7 sm:px-8">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gold/10 text-gold">
                  <Lock size={20} />
                </div>
                <div className="flex-1">
                  <h3 className="font-display text-lg text-navy">Créez votre espace client</h3>
                  <p className="mt-1 text-sm leading-relaxed text-navy/60">
                    Accédez à vos réservations, factures, livret d&apos;accueil et bien plus depuis
                    votre espace personnel. Un simple lien magique vous suffit.
                  </p>

                  <div className="mt-5 flex items-center gap-3 rounded-2xl border border-navy/10 bg-white px-4 py-3">
                    <Mail size={16} className="shrink-0 text-navy/30" />
                    <span className="text-sm font-medium text-navy">{guestEmail}</span>
                  </div>

                  {magicLinkSent ? (
                    <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4">
                      <div className="flex items-center gap-3">
                        <Check size={18} className="shrink-0 text-emerald-500" />
                        <p className="text-sm text-emerald-700">
                          Lien magique envoyé ! Vérifiez votre boîte de réception (et vos
                          spams). Le lien expire dans 1 heure.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={handleSendMagicLink}
                      disabled={magicLoading}
                      className="mt-4 inline-flex w-full items-center justify-center gap-3 rounded-2xl bg-navy py-4 text-[11px] font-bold uppercase tracking-[0.2em] text-white shadow-lg transition-all hover:bg-gold hover:text-navy disabled:opacity-50 sm:w-auto sm:px-8"
                    >
                      {magicLoading ? (
                        <>
                          <div
                            role="status"
                            className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
                          >
                            <span className="sr-only">Envoi en cours...</span>
                          </div>
                          Envoi en cours...
                        </>
                      ) : (
                        <>
                          <LogIn size={16} />
                          Recevoir mon lien magique
                        </>
                      )}
                    </button>
                  )}

                  {magicError && (
                    <p className="mt-2 text-xs text-red-500">{magicError}</p>
                  )}

                  <p className="mt-3 text-xs text-navy/30">
                    Un email avec un lien de connexion instantané. Sans mot de passe.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Logged in: direct link to espace-client ── */}
        {isLoggedIn && (
          <div className="mt-8 flex justify-center">
            <Link
              href="/espace-client"
              className="inline-flex items-center gap-3 rounded-2xl bg-navy px-8 py-4 text-[11px] font-bold uppercase tracking-[0.2em] text-white shadow-lg transition-all hover:bg-gold hover:text-navy"
            >
              <ExternalLink size={16} />
              Accéder à mon espace client
            </Link>
          </div>
        )}

        {/* ── What's next section ── */}
        <div className="mt-14">
          <h3 className="text-center font-display text-xl text-navy">Prochaines étapes</h3>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-navy/10 bg-white p-5 text-center">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-gold/10 text-gold">
                <Mail size={18} />
              </div>
              <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-navy">Email confirmé</p>
              <p className="mt-1 text-xs text-navy/50">
                Votre confirmation vous a été envoyée par email
              </p>
            </div>
            <div className="rounded-2xl border border-navy/10 bg-white p-5 text-center">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-gold/10 text-gold">
                <ShieldCheck size={18} />
              </div>
              <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-navy">Paiement sécurisé</p>
              <p className="mt-1 text-xs text-navy/50">
                Votre paiement a bien été traité par Stripe
              </p>
            </div>
            <div className="rounded-2xl border border-navy/10 bg-white p-5 text-center">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-gold/10 text-gold">
                <Calendar size={18} />
              </div>
              <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-navy">Préparez votre séjour</p>
              <p className="mt-1 text-xs text-navy/50">
                Consultez le livret d&apos;accueil et la checklist
              </p>
            </div>
          </div>
        </div>

        {/* ── CTA footer ── */}
        <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/villas"
            className="inline-flex items-center gap-2 rounded-full border border-navy/20 px-6 py-3 text-[11px] font-bold uppercase tracking-[0.2em] text-navy transition-all hover:bg-navy hover:text-white"
          >
            Découvrir nos villas
            <ArrowRight size={14} />
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full bg-navy/5 px-6 py-3 text-[11px] font-bold uppercase tracking-[0.2em] text-navy/40 transition-all hover:bg-navy/10"
          >
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-dvh bg-offwhite">
          <div className="mx-auto flex min-h-[60vh] max-w-2xl items-center justify-center px-6">
            <div className="text-center">
              <div
                role="status"
                className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-gold border-t-transparent"
              >
                <span className="sr-only">Chargement...</span>
              </div>
            </div>
          </div>
        </main>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
