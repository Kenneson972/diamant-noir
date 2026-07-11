"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { KayvilaPngIcon } from "@/components/icons/KayvilaPngIcon";
import { ScrollReveal } from "@/components/ScrollReveal";
import { useHomeAudience } from "@/contexts/HomeAudienceContext";
import { useLocale } from "@/contexts/LocaleContext";

function formatIsoDate(d: string) {
  try {
    return new Date(d + "T00:00:00").toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return d;
  }
}

type Props = {
  catalogueHref: string;
  hasDateOnly: boolean;
  checkin: string;
  checkout: string;
  guestsParam: number;
};

export function BookLandingMarketing({
  catalogueHref,
  hasDateOnly,
  checkin,
  checkout,
  guestsParam,
}: Props) {
  const { audience } = useHomeAudience();
  const { t } = useLocale();

  if (audience === "proprietaire") {
    return (
      <>
        <section className="relative min-h-[220px] w-full overflow-hidden bg-navy xs:min-h-[260px] md:min-h-[min(68vh,680px)]">
          <div
            className="absolute inset-0 bg-[url('/villa-hero.jpg')] bg-cover bg-center opacity-40"
            aria-hidden
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/40 to-offwhite" />

          <div className="relative z-10 flex min-h-[220px] flex-col justify-end px-5 pb-8 pt-24 xs:min-h-[260px] md:min-h-[min(68vh,680px)] md:pb-20 md:pt-24 sm:px-6">
            <div className="mx-auto w-full max-w-4xl space-y-5 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
              <p className="text-[10px] font-bold uppercase tracking-[0.45em] text-white/65">
                {t("booking.landing_owner_eyebrow")}
              </p>
              <h1 className="font-display text-4xl leading-[1.08] text-white md:text-6xl lg:text-7xl">
                {t("booking.landing_owner_title")}
              </h1>
              <p className="mx-auto max-w-lg text-sm font-light tracking-[0.12em] text-white/70">
                {t("booking.landing_owner_subtitle")}
              </p>
            </div>

            <div className="mx-auto mt-10 w-full max-w-4xl animate-in fade-in duration-700">
              <div className="flex flex-col divide-y divide-black/10 border border-white/20 bg-white/[0.97] text-navy shadow-[0_20px_50px_rgba(0,0,0,0.18)] sm:flex-row sm:divide-x sm:divide-y-0">
                <Link
                  href="/soumettre-ma-villa"
                  className="group flex flex-1 items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-navy/[0.03] sm:py-5"
                >
                  <KayvilaPngIcon name="location" size={18} alt="" className="shrink-0 opacity-60" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-navy/55">{t("booking.landing_step2")}</p>
                    <p className="mt-1 text-sm text-navy/70">{t("booking.landing_owner_submit_villa")}</p>
                  </div>
                </Link>
                <Link
                  href={catalogueHref}
                  className="flex min-h-[52px] items-center justify-center bg-navy px-8 py-4 text-center text-[10px] font-bold uppercase tracking-[0.28em] text-white transition-colors hover:bg-navy/90 sm:min-w-[10rem]"
                >
                  <Search className="mr-2 h-3.5 w-3.5" strokeWidth={1.25} aria-hidden />
                  {t("booking.landing_owner_catalogue_cta")}
                  <KayvilaPngIcon name="arrow-right" size={18} alt="" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {hasDateOnly && (
          <section className="border-b border-black/8 bg-white px-5 py-6 sm:px-6">
            <div className="mx-auto flex max-w-3xl flex-col gap-3 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
              <div className="flex items-start gap-3 sm:items-center">
                <KayvilaPngIcon name="users" size={20} alt="" className="mt-0.5 shrink-0 opacity-60" />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-navy/45">{t("booking.landing_dates_indicated")}</p>
                  <p className="text-sm text-navy">
                    {t("booking.landing_dates_range").replace("{{checkin}}", formatIsoDate(checkin)).replace("{{checkout}}", formatIsoDate(checkout))}
                    {guestsParam > 1 ? ` · ${guestsParam} ${t("villas.travelers")}` : ""}
                  </p>
                </div>
              </div>
              <Link
                href={catalogueHref}
                className="inline-flex shrink-0 items-center justify-center border border-navy bg-navy px-5 py-2.5 text-[10px] font-bold uppercase tracking-[0.22em] text-white transition-colors hover:bg-navy/90"
              >
                {t("booking.landing_view_catalogue")}
              </Link>
            </div>
          </section>
        )}

        <section className="relative z-10 mx-auto max-w-2xl scroll-mt-28 px-5 pb-20 pt-12 sm:px-6 md:pt-16">
          <div className="space-y-6 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-navy/80">{t("booking.landing_owner_showcase_eyebrow")}</p>
            <h2 className="font-display text-2xl text-navy md:text-3xl">{t("booking.landing_owner_showcase_title")}</h2>
            <p className="text-sm leading-relaxed text-navy/80">
              {t("booking.landing_owner_showcase_desc_prefix")} <span className="font-medium text-navy">{t("booking.landing_our_villas")}</span> {t("booking.landing_owner_showcase_desc_suffix")}
            </p>
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/proprietaires"
                className="inline-flex items-center gap-2 border border-navy bg-navy px-8 py-3.5 text-[10px] font-bold uppercase tracking-[0.28em] text-white transition-colors hover:bg-navy/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy"
              >
                {t("booking.landing_owner_offer_cta")}
                <KayvilaPngIcon name="arrow-right" size={18} alt="" />
              </Link>
              <Link
                href={catalogueHref}
                className="inline-flex items-center gap-2 border border-navy bg-white px-8 py-3.5 text-[10px] font-bold uppercase tracking-[0.28em] text-navy transition-colors hover:bg-navy hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-navy"
              >
                {t("booking.landing_open_catalogue")}
                <KayvilaPngIcon name="arrow-right" size={18} alt="" />
              </Link>
            </div>
          </div>
        </section>

        <section className="border-t border-black/8 bg-white px-5 py-20 sm:px-6 md:py-28">
          <ScrollReveal delay={0}>
            <div className="mx-auto max-w-2xl space-y-8 text-center">
              <KayvilaPngIcon name="message" size={28} alt="" className="mx-auto" />
              <h2 className="font-display text-3xl leading-tight text-navy md:text-4xl">
                {t("booking.landing_owner_contact_title")}
              </h2>
              <p className="text-base font-light leading-relaxed text-navy/80">
                {t("booking.landing_owner_contact_desc")}
              </p>
              <div className="pt-2">
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 border border-navy bg-navy px-8 py-3.5 text-[10px] font-bold uppercase tracking-[0.28em] text-white transition-colors hover:bg-navy/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2"
                >
                  {t("booking.landing_contact_us")}
                  <KayvilaPngIcon name="arrow-right" size={18} alt="" />
                </Link>
              </div>
            </div>
          </ScrollReveal>
        </section>
      </>
    );
  }

  return (
    <>
      <section className="relative min-h-[220px] w-full overflow-hidden bg-navy xs:min-h-[260px] md:min-h-[min(68vh,680px)]">
        <div
          className="absolute inset-0 bg-[url('/villa-hero.jpg')] bg-cover bg-center opacity-40"
          aria-hidden
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/40 to-offwhite" />

        <div className="relative z-10 flex min-h-[220px] flex-col justify-end px-5 pb-8 pt-24 xs:min-h-[260px] md:min-h-[min(68vh,680px)] md:pb-20 md:pt-24 sm:px-6">
          <div className="mx-auto w-full max-w-4xl space-y-5 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
            <p className="text-[10px] font-bold uppercase tracking-[0.45em] text-white/65">{t("booking.landing_eyebrow")}</p>
            <h1 className="font-display text-4xl leading-[1.08] text-white md:text-6xl lg:text-7xl">
              {t("villa.book_your_stay")}
            </h1>
            <p className="mx-auto max-w-lg text-sm font-light tracking-[0.12em] text-white/70">
              {t("booking.landing_subtitle")}
            </p>
          </div>

          <div className="mx-auto mt-10 w-full max-w-4xl animate-in fade-in duration-700">
            <div className="flex flex-col divide-y divide-black/10 border border-white/20 bg-white/[0.97] text-navy shadow-[0_20px_50px_rgba(0,0,0,0.18)] sm:flex-row sm:divide-x sm:divide-y-0">
              <Link
                href={catalogueHref}
                className="group flex flex-1 items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-navy/[0.03] sm:py-5"
              >
                <KayvilaPngIcon name="location" size={18} alt="" className="shrink-0 opacity-60" />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-navy/55">{t("booking.landing_step1")}</p>
                  <p className="mt-1 text-sm font-medium text-navy">{t("booking.landing_browse_catalogue")}</p>
                </div>
              </Link>
              <Link
                href={catalogueHref}
                className="group flex flex-1 items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-navy/[0.03] sm:py-5"
              >
                <KayvilaPngIcon name="calendar" size={18} alt="" className="shrink-0 opacity-60" />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-navy/55">{t("booking.landing_step2")}</p>
                  <p className="mt-1 text-sm text-navy/70">{t("booking.landing_dates_on_sheet")}</p>
                </div>
              </Link>
              <Link
                href={catalogueHref}
                className="flex min-h-[52px] items-center justify-center bg-navy px-8 py-4 text-center text-[10px] font-bold uppercase tracking-[0.28em] text-white transition-colors hover:bg-navy/90 sm:min-w-[10rem]"
              >
                <Search className="mr-2 h-3.5 w-3.5" strokeWidth={1.25} aria-hidden />
                {t("booking.landing_view_villas")}
                <KayvilaPngIcon name="arrow-right" size={18} alt="" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {hasDateOnly && (
        <section className="border-b border-black/8 bg-white px-5 py-6 sm:px-6">
          <div className="mx-auto flex max-w-3xl flex-col gap-3 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
            <div className="flex items-start gap-3 sm:items-center">
              <KayvilaPngIcon name="users" size={20} alt="" className="mt-0.5 shrink-0 opacity-60" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-navy/45">{t("booking.landing_dates_indicated")}</p>
                <p className="text-sm text-navy">
                  {t("booking.landing_dates_range").replace("{{checkin}}", formatIsoDate(checkin)).replace("{{checkout}}", formatIsoDate(checkout))}
                  {guestsParam > 1 ? ` · ${guestsParam} ${t("villas.travelers")}` : ""}
                </p>
              </div>
            </div>
            <Link
              href={catalogueHref}
              className="inline-flex shrink-0 items-center justify-center border border-navy bg-navy px-5 py-2.5 text-[10px] font-bold uppercase tracking-[0.22em] text-white transition-colors hover:bg-navy/90"
            >
              {t("booking.landing_choose_villa")}
            </Link>
          </div>
        </section>
      )}

      <section className="relative z-10 mx-auto max-w-2xl scroll-mt-28 px-5 pb-20 pt-12 sm:px-6 md:pt-16">
        <div className="space-y-6 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-navy/80">{t("booking.landing_single_catalogue_eyebrow")}</p>
          <h2 className="font-display text-2xl text-navy md:text-3xl">{t("booking.landing_single_catalogue_title")}</h2>
          <p className="text-sm leading-relaxed text-navy/80">
            {t("booking.landing_single_catalogue_desc_prefix")} <span className="font-medium text-navy">{t("booking.landing_our_villas")}</span> {t("booking.landing_single_catalogue_desc_suffix")}
          </p>
          <Link
            href={catalogueHref}
            className="inline-flex items-center gap-2 border border-navy bg-white px-8 py-3.5 text-[10px] font-bold uppercase tracking-[0.28em] text-navy transition-colors hover:bg-navy hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-navy"
          >
            {t("booking.landing_open_catalogue")}
            <KayvilaPngIcon name="arrow-right" size={18} alt="" />
          </Link>
        </div>
      </section>

      <section className="border-t border-black/8 bg-white px-5 py-20 sm:px-6 md:py-28">
        <ScrollReveal delay={0}>
          <div className="mx-auto max-w-2xl space-y-8 text-center">
            <KayvilaPngIcon name="message" size={28} alt="" className="mx-auto" />
            <h2 className="font-display text-3xl leading-tight text-navy md:text-4xl">{t("booking.landing_tailored_title")}</h2>
            <p className="text-base font-light leading-relaxed text-navy/80">
              {t("booking.landing_tailored_desc")}
            </p>
            <div className="pt-2">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 border border-navy bg-navy px-8 py-3.5 text-[10px] font-bold uppercase tracking-[0.28em] text-white transition-colors hover:bg-navy/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2"
              >
                {t("villa.contact_cta")}
                <KayvilaPngIcon name="arrow-right" size={18} alt="" />
              </Link>
            </div>
          </div>
        </ScrollReveal>
      </section>
    </>
  );
}
