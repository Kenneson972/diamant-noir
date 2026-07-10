"use client";

import Link from "next/link";
import { useLocale } from "@/contexts/LocaleContext";

export function HomeBottomCta() {
  const { t } = useLocale();
  return (
    <section className="py-20 text-center bg-offwhite px-6 md:py-28 lg:py-32">
      <div className="mx-auto max-w-3xl space-y-10">
        <div className="space-y-8">
          <h2 className="font-display text-4xl font-light text-navy md:text-6xl">{t("home.bottom_cta_title")}</h2>
          <p className="leading-relaxed text-navy/80">
            {t("home.bottom_cta_text")}
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-2">
            <Link href="/prestations" className="btn-luxury bg-navy text-white">
              {t("home.bottom_cta_prestations")}
            </Link>
            <Link
              href="/villas"
              className="inline-flex min-h-11 items-center justify-center border border-navy/25 px-6 text-[10px] font-bold uppercase tracking-[0.22em] text-navy transition-colors hover:bg-navy/[0.04] focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/30"
            >
              {t("home.bottom_cta_villas")}
            </Link>
          </div>
        </div>
        <p className="border-t border-black/10 pt-10 text-sm text-navy/50">
          {t("home.bottom_cta_owner_prompt")}{" "}
          <Link href="/login?redirect=/dashboard/proprio" className="font-medium text-navy underline-offset-4 hover:underline">
            {t("home.bottom_cta_owner_link")}
          </Link>
        </p>
      </div>
    </section>
  );
}
