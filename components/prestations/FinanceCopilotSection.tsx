import Link from "next/link";
import { ArrowRight, Bot, Check } from "lucide-react";

const COPILOT_FEATURES: { title: string; desc: string }[] = [
  {
    title: "Questions en langage naturel",
    desc: "Posez vos questions — l'IA répond avec vos vraies données en temps réel.",
  },
  {
    title: "Stats et revenus en temps réel",
    desc: "Taux d'occupation, RevPAR, revenus nets — tout sous les yeux.",
  },
  {
    title: "Alertes proactives",
    desc: "Le copilot signale les problèmes avant qu'ils n'arrivent.",
  },
  {
    title: "Planning semaine glissante",
    desc: "Arrivées, départs et tâches en un coup d'œil.",
  },
];

const TERMINAL_EXCHANGES = [
  {
    question: "Quelles sont mes réservations cette semaine ?",
    lines: [
      { text: "3 check-ins prévus :", bright: true },
      { text: "Villa Le Rocher · Lun → Jeu (3 nuits)", bright: false },
      { text: "Villa Anse Noire · Mar → Sam (5 nuits)", bright: false },
      { text: "Villa Diamant · Mer → Dim (5 nuits)", bright: false },
    ],
    alert: "Ménage non planifié pour lundi — action requise.",
  },
  {
    question: "Combien j'ai gagné ce mois ?",
    lines: [
      { text: "Avril 2026 — 4 220 € nets reversés", bright: true },
      { text: "Taux d'occupation : 74% · RevPAR : 89 €", bright: false },
      { text: "↑ +18 % vs. mars 2026", bright: false },
    ],
    alert: null as string | null,
  },
];

export function FinanceCopilotSection() {
  return (
    <section className="overflow-hidden bg-offwhite px-5 py-20 sm:px-6 md:py-28">
      <div className="mx-auto max-w-7xl">
        {/* ── En-tête ── */}
        <div className="mb-14 text-center md:mb-20">
          <div className="mb-4 inline-flex items-center gap-2 border border-navy/10 bg-white px-4 py-2">
            <Bot size={13} strokeWidth={1.5} className="text-navy/55" aria-hidden />
            <span className="text-[9px] font-bold uppercase tracking-[0.4em] text-navy/45">Espace propriétaire</span>
          </div>
          <h2 className="font-display text-3xl font-light leading-[1.08] text-navy md:text-4xl">
            Assistant IA <span className="font-normal text-navy/55">24h/24</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-navy/45">
            Un copilot intelligent qui répond avec vos données réelles — sans attente, sans formulaire.
          </p>
        </div>

        <div className="grid items-start gap-14 md:grid-cols-2 md:gap-20">
          {/* ── Colonne gauche — features ── */}
          <div>
            <div className="divide-y divide-navy/[0.04]">
              {COPILOT_FEATURES.map(({ title, desc }) => (
                <div key={title} className="py-5 first:pt-0 last:pb-0">
                  <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-navy/60">
                    {title}
                  </p>
                  <p className="mt-1.5 max-w-xs text-[13px] leading-relaxed text-navy/55">
                    {desc}
                  </p>
                </div>
              ))}
            </div>
            <div className="pt-10">
              <Link
                href="/login"
                className="inline-flex min-h-[48px] items-center gap-3 border border-navy bg-navy px-7 py-3 text-[10px] font-bold uppercase tracking-[0.24em] text-white transition-colors hover:bg-navy/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy"
              >
                Accéder à mon espace <ArrowRight size={14} aria-hidden />
              </Link>
            </div>
          </div>

          {/* ── Colonne droite — carte simulateur ── */}
          <div className="border border-navy/[0.06] bg-white">
            {/* Barre titre */}
            <div className="flex items-center gap-2 border-b border-navy/[0.04] px-5 py-3">
              <span className="h-2 w-2 rounded-full bg-navy/10" aria-hidden />
              <span className="h-2 w-2 rounded-full bg-navy/10" aria-hidden />
              <span className="h-2 w-2 rounded-full bg-navy/10" aria-hidden />
              <span className="ml-3 text-[9px] font-bold uppercase tracking-[0.4em] text-navy/25">Diamant Copilot</span>
              <span className="ml-auto flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500/60" aria-hidden />
                <span className="text-[8px] uppercase tracking-widest text-navy/25">En ligne</span>
              </span>
            </div>

            {/* Messages — style éditorial propre */}
            <div className="space-y-6 px-5 py-6 text-[13px] leading-relaxed">
              {TERMINAL_EXCHANGES.map(({ question, lines, alert }, i) => (
                <div key={question} className={i > 0 ? "border-t border-navy/[0.04] pt-6" : ""}>
                  <p className="flex items-start gap-2.5 text-navy/50">
                    <span className="mt-0.5 shrink-0 font-mono text-gold/60">❯</span>
                    <span className="text-navy/70">{question}</span>
                  </p>
                  <div className="mt-3 space-y-1 pl-5">
                    {lines.map(({ text, bright }) => (
                      <p key={text} className={bright ? "text-navy/80" : "text-navy/50"}>
                        {text}
                      </p>
                    ))}
                  </div>
                  {alert && (
                    <p className="mt-3 flex items-start gap-2.5 pl-5 text-amber-600/70">
                      <span className="mt-0.5 shrink-0 text-[10px] font-bold" aria-hidden>!</span>
                      <span>{alert}</span>
                    </p>
                  )}
                </div>
              ))}
              <div className="flex items-center gap-2 border-t border-navy/[0.04] pt-4">
                <span className="font-mono text-navy/30">❯</span>
                <span className="inline-block h-[14px] w-0.5 animate-pulse bg-navy/30" aria-hidden />
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-navy/[0.04] px-5 py-2.5">
              <span className="text-[8px] uppercase tracking-widest text-navy/20">
                Données en temps réel · Kayvila Copilot v2
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
