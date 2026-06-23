import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { ChevronDown } from "lucide-react";
import { KayvilaPngIcon } from "@/components/icons/KayvilaPngIcon";
import { LandingShell, LandingSection, LandingBlockTitle } from "@/components/marketing/landing-sections";
import { CONCIERGERIE_FAQ } from "@/data/conciergerie-faq";
import { PageHero } from "@/components/marketing/PageHero";
import { tServer } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "FAQ | Conciergerie Kayvila — Martinique",
  description:
    "Questions fréquentes sur la conciergerie Kayvila : réservation, annulation, services inclus, gestion locative en Martinique.",
  alternates: { canonical: "https://kayvila.com/faq" },
  openGraph: {
    images: [{ url: "https://kayvila.com/og-image.jpg", width: 1200, height: 630, alt: "FAQ Kayvila — Conciergerie Martinique" }],
  },
};

export default async function FaqPage() {
  const cookieStore = await cookies();
  const locale = (cookieStore.get("dn_locale")?.value ?? "fr") as "fr" | "en" | "es";

  return (
    <LandingShell>
      <PageHero
        imageSrc="/faq-hero.webp"
        eyebrow="FAQ"
        title={tServer(locale, "faq.title")}
        subtitle={tServer(locale, "faq.subtitle")}
      />

      {/* FAQ */}
      <LandingSection bg="offwhite">
        <div className="mx-auto max-w-3xl">
          <div className="space-y-10">
            {CONCIERGERIE_FAQ.map((theme) => (
              <div key={theme.id}>
                <div className="mb-4 flex items-center gap-3">
                  <span className="font-display text-[0.65rem] font-bold tracking-[0.3em] text-navy/60">
                    {theme.label}
                  </span>
                  <div className="h-px flex-1 bg-navy/10" />
                  <span className="text-[9px] font-bold uppercase tracking-[0.28em] text-navy/60">
                    {theme.title}
                  </span>
                </div>
                <div className="space-y-0 border-t border-navy/10">
                  {theme.items.map(({ q, a }) => (
                    <details key={q} className="group border-b border-navy/10 py-4">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[12px] font-bold uppercase tracking-[0.18em] text-navy outline-none transition-colors hover:text-navy/70 [&::-webkit-details-marker]:hidden">
                        {q}
                        <ChevronDown
                          size={16}
                          strokeWidth={1.5}
                          className="shrink-0 text-navy/60 transition-transform duration-200 group-open:rotate-180"
                          aria-hidden
                        />
                      </summary>
                      <p className="mt-3 pl-1 text-sm leading-relaxed text-navy/80">{a}</p>
                    </details>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16 text-center">
            <div className="mx-auto mb-6 h-px w-8 bg-gold/50" aria-hidden />
            <p className="text-sm text-navy/60">
              Une question qui n&apos;est pas listée ici ?{" "}
              <Link href="/contact" className="font-medium text-navy underline-offset-4 hover:underline">
                Contactez-nous directement
              </Link>
            </p>
            <Link
              href="/prestations"
              className="mt-6 inline-flex min-h-[48px] items-center gap-2 border border-navy bg-navy px-6 py-3 text-[10px] font-bold uppercase tracking-[0.24em] text-white transition-colors hover:bg-navy/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/30"
            >
              Découvrir la conciergerie <KayvilaPngIcon name="arrow-right" size={18} alt="" />
            </Link>
          </div>
        </div>
      </LandingSection>
    </LandingShell>
  );
}
