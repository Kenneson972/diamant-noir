"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { formatCurrency, getBookingPriceCents } from "@/lib/utils";
import { getSupabaseBrowser } from "@/lib/supabase";
import {
  Check,
  ExternalLink,
  PartyPopper,
} from "lucide-react";
import { KayvilaPngIcon } from "@/components/icons/KayvilaPngIcon";
import { useLocale } from "@/contexts/LocaleContext";

function SuccessContent() {
  const { t, locale } = useLocale();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const bookingId = searchParams.get("bookingId");
  const emailParam = searchParams.get("email");
  const [data, setData] = useState<{ booking: any; villa: any } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [awaitingPayment, setAwaitingPayment] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [guestEmail, setGuestEmail] = useState<string>("");
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [magicLoading, setMagicLoading] = useState(false);
  const [magicError, setMagicError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const sleep = (ms: number) =>
      new Promise<void>((resolve) => {
        setTimeout(resolve, ms);
      });

    const fetchData = async () => {
      const supabase = getSupabaseBrowser();

      if (supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setIsLoggedIn(true);
        }
      }

      if (emailParam) setGuestEmail(emailParam);

      if (sessionId) {
        const maxAttempts = 20;
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
          if (cancelled) return;
          try {
            const res = await fetch(
              `/api/booking-session?session_id=${encodeURIComponent(sessionId)}`
            );
            const json = await res.json().catch(() => null);

            if (res.ok && json && !json.pending) {
              setData(json);
              setLoading(false);
              return;
            }

            if (res.status === 202 && json?.pending) {
              if (attempt < maxAttempts - 1) {
                await sleep(2000);
                continue;
              }
              setError(t("success.payment_pending"));
              setLoading(false);
              return;
            }

            if (res.status === 404 && attempt < 4) {
              await sleep(1500);
              continue;
            }

            throw new Error("Not found");
          } catch {
            if (attempt >= maxAttempts - 1) {
              setError(t("success.booking_not_found"));
              setLoading(false);
              return;
            }
            await sleep(2000);
          }
        }
        return;
      }

      if (bookingId) {
        // Vérification serveur du statut réel — ne jamais afficher la confirmation
        // sur la seule foi du paramètre d'URL (P0 audit préprod 2026-07-11).
        try {
          const res = await fetch(
            `/api/booking-session?bookingId=${encodeURIComponent(bookingId)}`
          );
          const json = await res.json().catch(() => null);
          if (cancelled) return;

          if (res.ok && json && !json.pending) {
            setData(json);
            setLoading(false);
            return;
          }
          if (res.status === 202 && json?.pending) {
            setData(json);
            setAwaitingPayment(true);
            setLoading(false);
            return;
          }
          setError(t("success.booking_not_found"));
          setLoading(false);
        } catch {
          if (cancelled) return;
          setError(t("success.booking_not_found"));
          setLoading(false);
        }
        return;
      }

      setError(t("success.missing_params"));
      setLoading(false);
    };

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [sessionId, bookingId, emailParam, locale]);

  const handleSendMagicLink = async () => {
    if (!guestEmail) return;
    setMagicLoading(true);
    setMagicError(null);
    try {
      const supabase = getSupabaseBrowser();
      if (!supabase) throw new Error(t("success.supabase_unavailable"));
      const { error } = await supabase.auth.signInWithOtp({
        email: guestEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/espace-client`,
        },
      });
      if (error) throw error;
      setMagicLinkSent(true);
    } catch (err) {
      setMagicError(err instanceof Error ? err.message : t("success.send_error"));
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
              <span className="sr-only">{t("success.loading_confirmation")}</span>
            </div>
            <p className="mt-6 text-sm text-navy/60">{t("success.checking_booking")}</p>
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
          <p className="mb-2 text-lg font-semibold text-navy">{t("success.oops")}</p>
          <p className="mb-8 text-sm text-navy/80">{error || t("common.error")}</p>
          <Link
            href="/villas"
            className="inline-flex items-center gap-2 rounded-full bg-navy px-6 py-3 text-[11px] font-bold uppercase tracking-[0.2em] text-white transition-all hover:bg-gold hover:text-navy"
          >
            {t("home.hero_cta")}
            <KayvilaPngIcon name="arrow-right" size={18} alt="" />
          </Link>
        </div>
      </main>
    );
  }

  if (awaitingPayment) {
    return (
      <main className="min-h-dvh bg-offwhite">
        <div className="mx-auto max-w-lg px-6 pt-32 pb-20 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-amber-50">
            <span className="text-2xl text-amber-500">⏳</span>
          </div>
          <p className="mb-2 text-lg font-semibold text-navy">
            {t("success.awaiting_payment_title")}
          </p>
          <p className="mb-8 text-sm leading-relaxed text-navy/80">
            {t("success.awaiting_payment_desc")}
          </p>
          <Link
            href="/villas"
            className="inline-flex items-center gap-2 rounded-full bg-navy px-6 py-3 text-[11px] font-bold uppercase tracking-[0.2em] text-white transition-all hover:bg-gold hover:text-navy"
          >
            {t("home.hero_cta")}
            <KayvilaPngIcon name="arrow-right" size={18} alt="" />
          </Link>
        </div>
      </main>
    );
  }

  const { booking, villa } = data;

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
            <PartyPopper className="h-9 w-9 text-emerald-500" strokeWidth={1.5} size={18} />
          </div>
          <h1 className="font-display text-3xl text-navy sm:text-4xl">
            {t("success.title")}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-navy/80">
            {isLoggedIn
              ? t("success.stay_saved")
              : t("success.email_sent").replace("{{email}}", guestEmail || t("success.your_address"))}
          </p>
        </div>

        {/* ── Booking details card ── */}
        <div className="mt-10 overflow-hidden rounded-3xl border border-navy/10 bg-white shadow-sm">
          {/* Villa preview */}
          {villa?.name && (
            <div className="border-b border-navy/5 bg-gradient-to-br from-navy/5 to-transparent px-6 py-5 sm:px-8">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gold/10 text-gold">
                  <KayvilaPngIcon name="location" size={20} alt="" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-navy/60">
                    {t("success.villa_label")}
                  </p>
                  <h2 className="mt-1 font-display text-xl text-navy">{villa.name}</h2>
                  {villa.location && (
                    <p className="mt-0.5 text-sm text-navy/60">{villa.location}</p>
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
                  <KayvilaPngIcon name="calendar" size={20} alt="" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-navy/60">
                    {t("success.stay_dates")}
                  </p>
                  <p className="mt-0.5 text-sm font-medium text-navy">
                    {t("booking.landing_dates_range").replace("{{checkin}}", startDate ?? "").replace("{{checkout}}", endDate ?? "")}
                  </p>
                  {nights && (
                    <p className="text-xs text-navy/60">{nights} {nights > 1 ? t("common.nights_plural") : t("common.nights")}</p>
                  )}
                </div>
              </div>
            )}

            {booking?.price != null && (
              <div className="flex items-center gap-4 pt-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-500">
                  <KayvilaPngIcon name="credit-card" size={20} alt="" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-navy/60">
                    {t("success.amount_paid")}
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
                  <KayvilaPngIcon name="lock" size={20} alt="" />
                </div>
                <div className="flex-1">
                  <h3 className="font-display text-lg text-navy">{t("success.create_account_title")}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-navy/80">
                    {t("success.create_account_desc")}
                  </p>

                  <div className="mt-5 flex items-center gap-3 rounded-2xl border border-navy/10 bg-white px-4 py-3">
                    <KayvilaPngIcon name="mail" size={18} alt="" className="shrink-0" />
                    <span className="text-sm font-medium text-navy">{guestEmail}</span>
                  </div>

                  {magicLinkSent ? (
                    <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4">
                      <div className="flex items-center gap-3">
                        <Check size={16} strokeWidth={1.5} className="shrink-0 text-emerald-500" />
                        <p className="text-sm text-emerald-700">
                          {t("success.magic_link_sent")}
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
                            <span className="sr-only">{t("success.sending")}</span>
                          </div>
                          {t("success.sending")}
                        </>
                      ) : (
                        <>
                          <KayvilaPngIcon name="login" size={18} alt="" />
                          {t("success.receive_magic_link")}
                        </>
                      )}
                    </button>
                  )}

                  {magicError && (
                    <p className="mt-2 text-xs text-red-500">{magicError}</p>
                  )}

                  <p className="mt-3 text-xs text-navy/60">
                    {t("success.magic_link_desc")}
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
              <ExternalLink size={16} strokeWidth={1.5} />
              {t("success.access_client_space")}
            </Link>
          </div>
        )}

        {/* ── What's next section ── */}
        <div className="mt-14">
          <h3 className="text-center font-display text-xl text-navy">{t("success.next_steps")}</h3>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-navy/10 bg-white p-5 text-center">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-gold/10 text-gold">
                <KayvilaPngIcon name="mail" size={20} alt="" />
              </div>
              <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-navy">{t("success.email_confirmed")}</p>
              <p className="mt-1 text-xs text-navy/60">
                {t("success.email_confirmed_desc")}
              </p>
            </div>
            <div className="rounded-2xl border border-navy/10 bg-white p-5 text-center">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-gold/10 text-gold">
                <KayvilaPngIcon name="shield-check" size={20} alt="" />
              </div>
              <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-navy">{t("booking.secure")}</p>
              <p className="mt-1 text-xs text-navy/60">
                {t("success.payment_secure_desc")}
              </p>
            </div>
            <div className="rounded-2xl border border-navy/10 bg-white p-5 text-center">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-gold/10 text-gold">
                <KayvilaPngIcon name="calendar" size={20} alt="" />
              </div>
              <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-navy">{t("success.prepare_stay")}</p>
              <p className="mt-1 text-xs text-navy/60">
                {t("success.prepare_stay_desc")}
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
            {t("home.hero_cta")}
            <KayvilaPngIcon name="arrow-right" size={18} alt="" />
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full bg-navy/5 px-6 py-3 text-[11px] font-bold uppercase tracking-[0.2em] text-navy/60 transition-all hover:bg-navy/10"
          >
            {t("success.back_to_home")}
          </Link>
        </div>
      </div>
    </main>
  );
}

function SuccessFallback() {
  const { t } = useLocale();
  return (
    <main className="min-h-dvh bg-offwhite">
      <div className="mx-auto flex min-h-[60vh] max-w-2xl items-center justify-center px-6">
        <div className="text-center">
          <div
            role="status"
            className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-gold border-t-transparent"
          >
            <span className="sr-only">{t("common.loading")}</span>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<SuccessFallback />}>
      <SuccessContent />
    </Suspense>
  );
}
