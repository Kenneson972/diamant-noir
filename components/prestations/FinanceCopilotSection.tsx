import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BarChart2,
  Bot,
  Calendar,
  MessageCircle,
} from "lucide-react";

const COPILOT_FEATURES: { icon: typeof MessageCircle; title: string; desc: string }[] = [
  {
    icon: MessageCircle,
    title: "Questions en langage naturel",
    desc: "Posez vos questions — l'IA répond avec vos vraies données en temps réel.",
  },
  {
    icon: BarChart2,
    title: "Stats et revenus en temps réel",
    desc: "Taux d'occupation, RevPAR, revenus nets — tout sous les yeux.",
  },
  {
    icon: AlertTriangle,
    title: "Alertes proactives",
    desc: "Le copilot signale les problèmes avant qu'ils n'arrivent.",
  },
  {
    icon: Calendar,
    title: "Planning semaine glissante",
    desc: "Arrivées, départs et tâches en un coup d'œil.",
  },
];

const TERMINAL_EXCHANGES = [
  {
    question: "Quelles sont mes réservations cette semaine ?",
    lines: [
      { text: "\u25C6 3 check-ins prévus :", bright: true },
      { text: "— Villa Le Rocher · Lun \u2192 Jeu (3 nuits)", bright: false },
      { text: "— Villa Anse Noire · Mar \u2192 Sam (5 nuits)", bright: false },
      { text: "— Villa Diamant · Mer \u2192 Dim (5 nuits)", bright: false },
    ],
    alert: "\u26A1 Ménage non planifié pour lundi — action requise.",
  },
  {
    question: "Combien j'ai gagné ce mois ?",
    lines: [
      { text: "\u25C6 Avril 2026 — 4 220 \u20AC nets reversés", bright: true },
      { text: "Taux d'occupation : 74%  ·  RevPAR : 89 \u20AC", bright: false },
      { text: "\u2191 +18 % vs. mars 2026", bright: false },
    ],
    alert: null as string | null,
  },
];

/** Bloc Copilot + démo terminal — réservé à la page Finance (reporté depuis le hub Prestations). */
export function FinanceCopilotSection() {
  return (
    <section className="overflow-hidden bg-navy px-5 py-20 text-white sm:px-6 md:py-28">
      <div className="mx-auto max-w-7xl">
        <div className="grid items-center gap-14 md:grid-cols-2 md:gap-20">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 border border-gold/25 bg-gold/10 px-4 py-2">
              <Bot size={14} strokeWidth={1.5} className="text-gold" aria-hidden />
              <span className="text-[10px] font-bold uppercase tracking-[0.35em] text-gold">Espace propriétaire</span>
            </div>
            <h2 className="font-display text-3xl md:text-4xl">
              Assistant IA
              <br />
              disponible 24h/24
            </h2>
            <span className="mt-6 block h-px w-12 bg-gold" aria-hidden />
            <p className="mt-8 text-[15px] leading-relaxed text-white/60">
              Accédez à un espace intelligent : posez vos questions, l&apos;IA répond avec vos vraies données en temps réel.
            </p>
            <ul className="mt-10 space-y-7">
              {COPILOT_FEATURES.map(({ icon: Icon, title, desc }) => (
                <li key={title} className="flex gap-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center border border-gold/20">
                    <Icon size={16} strokeWidth={1.25} className="text-gold" aria-hidden />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white">{title}</p>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-white/50">{desc}</p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-12">
              <Link
                href="/login"
                className="inline-flex min-h-[48px] items-center gap-3 border border-gold bg-gold px-7 py-3 text-[10px] font-bold uppercase tracking-[0.24em] text-navy transition-colors hover:bg-gold/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              >
                Accéder à mon espace <ArrowRight size={14} aria-hidden />
              </Link>
            </div>
          </div>
          <div className="border border-white/10 bg-black/40 backdrop-blur-sm">
            <div className="flex items-center gap-2 border-b border-white/10 px-5 py-3">
              <span className="h-2 w-2 rounded-full bg-white/15" aria-hidden />
              <span className="h-2 w-2 rounded-full bg-white/15" aria-hidden />
              <span className="h-2 w-2 rounded-full bg-white/15" aria-hidden />
              <span className="ml-3 text-[10px] font-bold uppercase tracking-[0.35em] text-white/25">Diamant Intelligence</span>
              <span className="ml-auto flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/70" aria-hidden />
                <span className="text-[9px] uppercase tracking-widest text-white/25">En ligne</span>
              </span>
            </div>
            <div className="space-y-6 px-6 py-7 font-mono text-[12px]">
              {TERMINAL_EXCHANGES.map(({ question, lines, alert }, i) => (
                <div key={question} className={i > 0 ? "border-t border-white/[0.06] pt-6" : ""}>
                  <p className="text-gold/70">
                    <span className="mr-2 text-white/20">›</span>
                    {question}
                  </p>
                  <div className="mt-3 space-y-1 pl-4">
                    {lines.map(({ text, bright }) => (
                      <p key={text} className={bright ? "text-white/85" : "text-white/45"}>
                        {text}
                      </p>
                    ))}
                  </div>
                  {alert && <p className="mt-3 pl-4 text-amber-400/80">{alert}</p>}
                </div>
              ))}
              <div className="flex items-center gap-2 pt-1">
                <span className="text-white/20">›</span>
                <span className="inline-block h-[14px] w-0.5 animate-pulse bg-gold/60" aria-hidden />
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-white/[0.06] px-5 py-2.5">
              <span className="text-[9px] uppercase tracking-widest text-white/20">Données en temps réel · Martinique</span>
              <span className="text-[9px] uppercase tracking-widest text-white/20">Copilot propriétaire</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
