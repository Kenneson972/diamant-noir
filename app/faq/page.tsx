import type { Metadata } from "next";
import Link from "next/link";
import { ChevronDown, ArrowRight } from "lucide-react";
import { LandingShell, LandingSection, LandingBlockTitle } from "@/components/marketing/landing-sections";
import { CONCIERGERIE_FAQ } from "@/data/conciergerie-faq";
import { PageHero } from "@/components/marketing/PageHero";

export const metadata: Metadata = {
  title: "FAQ | Conciergerie Kayvila — Martinique",
  description:
    "Tout savoir sur notre commission, les services inclus, la gestion dynamique des prix, le pack de démarrage, les reversements et les modalités contractuelles.",
};

export default function FaqPage() {
  return (
    <LandingShell>
      <PageHero
        eyebrow="FAQ"
        title="Questions fréquentes"
        subtitle="Tout ce qu'il faut savoir sur notre conciergerie — commission, services, reversements et bien plus."
      />

      {/* FAQ */}
      <LandingSection bg="offwhite">
        <div className="mx-auto max-w-3xl">
          <div className="space-y-10">
            {CONCIERGERIE_FAQ.map((theme) => (
              <div key={theme.id}>
                <div className="mb-4 flex items-center gap-3">
                  <span className="font-display text-[0.65rem] font-bold tracking-[0.3em] text-navy/25">
                    {theme.label}
                  </span>
                  <div className="h-px flex-1 bg-navy/10" />
                  <span className="text-[9px] font-bold uppercase tracking-[0.28em] text-navy/55">
                    {theme.title}
                  </span>
                </div>
                <div className="space-y-0 border-t border-navy/10">
                  {theme.items.map(({ q, a }) => (
                    <details key={q} className="group border-b border-navy/10 py-4">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[12px] font-bold uppercase tracking-[0.18em] text-navy outline-none transition-colors hover:text-navy/70 [&::-webkit-details-marker]:hidden">
                        {q}
                        <ChevronDown
                          size={14}
                          strokeWidth={2}
                          className="shrink-0 text-navy/50 transition-transform duration-200 group-open:rotate-180"
                          aria-hidden
                        />
                      </summary>
                      <p className="mt-3 pl-1 text-sm leading-relaxed text-navy/60">{a}</p>
                    </details>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16 text-center">
            <div className="mx-auto mb-6 h-px w-8 bg-gold/50" aria-hidden />
            <p className="text-sm text-navy/50">
              Une question qui n&apos;est pas listée ici ?{" "}
              <Link href="/contact" className="font-medium text-navy underline-offset-4 hover:underline">
                Contactez-nous directement
              </Link>
            </p>
            <Link
              href="/prestations"
              className="mt-6 inline-flex min-h-[48px] items-center gap-2 border border-navy bg-navy px-6 py-3 text-[10px] font-bold uppercase tracking-[0.24em] text-white transition-colors hover:bg-navy/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/30"
            >
              Découvrir la conciergerie <ArrowRight size={14} aria-hidden />
            </Link>
          </div>
        </div>
      </LandingSection>
    </LandingShell>
  );
}
