import { useEffect, useId, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button, cn, Avatar } from '@heroui/react';
import { CellSlider } from '@heroui-pro/react';
import { useFadeUpWhenVisible, useStaggerReveal } from '../lib/motionReveal';
import { PageShell } from '../components/layout/PageShell';
import {
  oraPlusHero,
  oraPlusStats,
  oraPlusCompare,
  oraPlusCalculator,
  oraPlusQuote,
  oraPlusFinalCta,
  oraPlusPrivilegeCards,
  type OraPlusMetric,
} from '../data/oraPlusData';

const renderMetricTemplate = (m: OraPlusMetric, emphasisClass: string) => {
  const parts = m.template.split('{n}');
  return (
    <>
      {parts.map((part, j) => (
        <span key={j}>
          {part}
          {j < parts.length - 1 && (
            <em className={cn('italic font-light', emphasisClass)}>{m.emphasis}</em>
          )}
        </span>
      ))}
    </>
  );
};

const fmtEur0 = (n: number) =>
  `${Math.round(n).toLocaleString('fr-FR')} €`;

const fmtEur2 = (n: number) =>
  `${n.toLocaleString('fr-FR', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 })} €`;

type CalcSliderProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  displayValue: string;
  hint?: string;
  onChange: (v: number) => void;
};

function CalcSlider({ label, value, min, max, step = 1, displayValue, hint, onChange }: CalcSliderProps) {
  const hintId = useId();
  const hintText = hint?.trim() ?? '';
  return (
    <div className="mb-8 last:mb-0">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <span className="text-[10px] font-medium uppercase tracking-[0.26em] text-noir/65">
          {label}
        </span>
        <span
          className="font-display font-normal leading-none text-noir"
          style={{ fontSize: 'clamp(22px, 2vw, 28px)', letterSpacing: '-0.01em' }}
          aria-hidden="true"
        >
          {displayValue}
        </span>
      </div>
      <CellSlider
        aria-label={label}
        {...(hintText ? { 'aria-describedby': hintId } : {})}
        minValue={min}
        maxValue={max}
        step={step}
        value={value}
        onChange={(v) => onChange(Array.isArray(v) ? (v[0] ?? min) : (v as number))}
        variant="secondary"
        className="ora-cell-slider w-full"
      >
        <CellSlider.Track>
          <CellSlider.Fill />
          <CellSlider.Thumb />
          <CellSlider.Label className="sr-only">{label}</CellSlider.Label>
          <CellSlider.Output className="sr-only" />
        </CellSlider.Track>
      </CellSlider>
      {hintText ? (
        <p
          id={hintId}
          className="mt-4 max-w-[42ch] text-[12px] font-light italic leading-[1.55] text-noir/60"
        >
          {hintText}
        </p>
      ) : null}
    </div>
  );
}

function CalcRow({ label, value, total }: { label: string; value: string; total?: boolean }) {
  return (
    <div
      className={cn(
        'flex items-baseline justify-between gap-4 py-2.5 text-[12px]',
        total
          ? 'mt-3 border-t border-noir/12 pt-5 font-medium text-noir'
          : 'text-noir/55'
      )}
    >
      <span className="min-w-0 flex-1 leading-snug">{label}</span>
      <span className="shrink-0 text-right tabular-nums">{value}</span>
    </div>
  );
}

type CalcBlockProps = {
  data: typeof oraPlusCalculator;
};

function OraPlusCalculatorBlock({ data }: CalcBlockProps) {
  const [drinks, setDrinks] = useState<number>(data.sliders.drinks.default);
  const [avgPrice, setAvgPrice] = useState<number>(data.sliders.avgPrice.default);
  const weeks = data.weeksPerYear;

  const calc = useMemo(() => {
    const SUB = data.subscriptionPrice;
    const DISCOUNT = data.memberDiscount;
    const yearWithout = drinks * avgPrice * weeks;
    const yearWithOra = drinks * (avgPrice * (1 - DISCOUNT)) * weeks + SUB * 12;
    const savings = Math.max(0, yearWithout - yearWithOra);
    return { savings };
  }, [drinks, avgPrice, weeks, data]);

  const R = data.result;

  return (
    <div className="grid overflow-hidden rounded-[2px] border border-noir/[0.12] bg-white lg:grid-cols-2">
      <div className="flex flex-col border-b border-noir/[0.08] p-8 md:p-10 lg:border-b-0 lg:border-r">
        <CalcSlider
          label="Boissons par semaine"
          value={drinks}
          min={data.sliders.drinks.min}
          max={data.sliders.drinks.max}
          step={data.sliders.drinks.step}
          displayValue={String(drinks)}
          hint={data.sliders.drinks.hint}
          onChange={setDrinks}
        />
        <CalcSlider
          label="Prix moyen · plein tarif"
          value={avgPrice}
          min={data.sliders.avgPrice.min}
          max={data.sliders.avgPrice.max}
          step={data.sliders.avgPrice.step}
          displayValue={fmtEur2(avgPrice)}
          hint={data.sliders.avgPrice.hint}
          onChange={setAvgPrice}
        />
      </div>

      <div className="relative overflow-hidden bg-surface-muted p-8 md:p-10 lg:border-l lg:border-noir/[0.08]">
        <div className="relative">
          <div className="mb-2 text-[10px] font-medium uppercase tracking-[0.28em] text-noir/55">
            {R.headline}
          </div>
          <div
            className="mb-8 font-display font-normal leading-none text-noir"
            style={{
              fontSize: 'clamp(54px, 6.5vw, 80px)',
              letterSpacing: '-0.025em',
            }}
          >
            <em className="font-light italic text-noir">
              {Math.round(calc.savings).toLocaleString('fr-FR')}
            </em>
            <span aria-hidden>{'\u202f'}</span>
            €
          </div>

          <div>
            <CalcRow label={R.rowTotal} value={fmtEur0(calc.savings)} total />
          </div>
        </div>
      </div>
    </div>
  );
}

const OraPlus = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [subLoading, setSubLoading] = useState(false);
  const [subError, setSubError] = useState<string | null>(null);

  const handleSubscribe = async () => {
    setSubLoading(true);
    setSubError(null);
    try {
      const { data, error } = await supabase.functions.invoke('create-subscription-session', {
        body: { email: user?.email },
      });
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data?.error ?? 'URL manquante');
      }
    } catch (err) {
      setSubError(err instanceof Error ? err.message : 'Impossible de démarrer le paiement');
      setSubLoading(false);
    }
  };

  const fadeBlock = useFadeUpWhenVisible();
  const { container, isReducedMotion } = useStaggerReveal();

  useEffect(() => { document.title = 'Óra+ · PessÓra'; }, []);

  return (
    <div className="min-h-screen bg-white pb-20 md:pb-0">
      {/* ───────────────────────────── 1 · HERO ───────────────────────────── */}
      <section className="border-b border-noir/[0.06] bg-white">
        <PageShell className="pb-9 pt-10 md:pb-11 md:pt-14">
          <div className="grid gap-8 lg:grid-cols-2 lg:gap-16">
            <div>
              <p className="mb-4 text-[9px] font-normal uppercase tracking-[0.22em] text-noir/35">
                {oraPlusHero.eyebrow}
              </p>
              <h1
                className="font-display font-normal text-noir"
                style={{ fontSize: 'clamp(32px, 4vw, 52px)' }}
              >
                {oraPlusHero.titleHead}
                <em className="font-light italic text-noir/55">{oraPlusHero.titleEmphasis}</em>
              </h1>
              <p className="mt-3 max-w-xl text-[13px] font-light leading-relaxed text-noir/45">
                {oraPlusHero.sub}
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Button
                  variant="primary"
                  size="md"
                  onPress={() => void handleSubscribe()}
                  isDisabled={subLoading}
                  className="group inline-flex items-center gap-2 rounded-[2px] bg-noir px-6 py-3.5 text-[10px] font-normal uppercase tracking-[0.24em] text-white transition-colors hover:bg-anthracite"
                >
                  {oraPlusHero.ctaPrimary.label}
                  <ArrowRight size={13} strokeWidth={1.5} className="transition-transform group-hover:translate-x-0.5" aria-hidden />
                </Button>
                <Button
                  variant="ghost"
                  size="md"
                  onPress={() => navigate(oraPlusHero.ctaSecondary.href)}
                  className="inline-flex items-center gap-2 rounded-[2px] border border-noir/15 px-6 py-3.5 text-[10px] font-normal uppercase tracking-[0.24em] text-noir/70 transition-colors hover:border-noir/30 hover:text-noir"
                >
                  {oraPlusHero.ctaSecondary.label}
                </Button>
              </div>
              {subError && (
                <p className="mt-3 text-[11px] text-red-500">{subError}</p>
              )}
            </div>
            <div className="block aspect-[16/9] overflow-hidden rounded-[2px] md:aspect-[4/3] lg:block lg:aspect-auto">
              <img
                src={oraPlusHero.image.src}
                alt={oraPlusHero.image.alt}
                className="h-full w-full object-cover bg-surface-product-well"
                loading="eager"
              />
            </div>
          </div>
        </PageShell>
      </section>

      {/* ───────────────────────────── 2 · STATS ───────────────────────────── */}
      <div className="border-b border-noir/[0.06] bg-surface-muted">
        <PageShell className="py-8 md:py-9">
          <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-[1fr_auto_auto_auto] md:gap-12">
            <span className="max-w-[260px] font-display text-[14px] font-light italic leading-snug text-noir/55">
              {oraPlusStats.label}
            </span>
            <div className="grid grid-cols-2 gap-6 md:flex md:gap-12">
            {oraPlusStats.items.map((s, i) => (
              <div key={i} className="flex flex-col gap-1">
                <span
                  className="font-display font-normal leading-none text-noir"
                  style={{ fontSize: 'clamp(26px, 2.6vw, 34px)', letterSpacing: '-0.01em' }}
                >
                  {renderMetricTemplate(s, 'text-noir/90')}
                </span>
                <span className="text-[11px] font-normal uppercase tracking-[0.24em] text-noir/50">
                  {s.label}
                </span>
              </div>
            ))}
            </div>
          </div>
        </PageShell>
      </div>

      {/* ───────────────────────────── 3 · PRIVILÈGES (CARDS VISUELLES) ───────────────────────────── */}
      <section className="border-b border-noir/[0.06] bg-white py-20 md:py-28">
        <PageShell>
          <motion.header {...fadeBlock} className="mb-14 grid items-end gap-10 lg:grid-cols-2 lg:gap-20">
            <div>
              <span className="mb-4 block text-[10px] font-normal uppercase tracking-[0.28em] text-noir/60">
                Les privilèges
              </span>
              <h2
                className="m-0 font-display font-normal text-noir"
                style={{
                  fontSize: 'clamp(32px, 4vw, 56px)',
                  lineHeight: 1,
                  letterSpacing: '-0.02em',
                }}
              >
                En tant que{' '}
                <em className="font-light italic text-editorial-badge">membre Óra+,</em>
                <br />
                vous recevez…
              </h2>
            </div>
            <p
              className="m-0 max-w-[460px] font-display font-light italic text-noir/65"
              style={{ fontSize: 'clamp(15px, 1.2vw, 18px)', lineHeight: 1.55 }}
            >
              −50 % sur les boissons, bilan offert, événements prioritaires — sans engagement.
            </p>
          </motion.header>

          <motion.div
            variants={container}
            initial={isReducedMotion ? false : 'hidden'}
            whileInView="visible"
            viewport={{ once: true, amount: 0.15, margin: '0px 0px -80px 0px' }}
            className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6"
          >
            {oraPlusPrivilegeCards.map((card) => (
              <div
                key={card.num}
                className="group relative overflow-hidden rounded-[2px] border border-noir/[0.08] bg-white transition-shadow hover:shadow-editorial-sm"
              >
                <div className="grid md:grid-cols-[1fr_1fr]">
                  {/* Image side */}
                  <div className="relative aspect-[4/3] overflow-hidden bg-surface-product-well md:aspect-auto">
                    <div
                      className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-[1.03]"
                      style={{ backgroundImage: `url(${card.image.src})` }}
                      role="img"
                      aria-label={card.image.alt}
                    />
                  </div>

                  {/* Content side */}
                  <div className="flex flex-col justify-between p-6 md:p-7">
                    <div>
                      <span className="mb-3 inline-block rounded-[2px] border border-noir/15 bg-surface-muted px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.2em] text-noir/70">
                        {card.accent}
                      </span>
                      <h3
                        className="m-0 mb-3 font-display font-normal text-noir"
                        style={{ fontSize: 'clamp(18px, 1.6vw, 22px)', lineHeight: 1.15, letterSpacing: '-0.01em' }}
                      >
                        {card.titleHead}
                        <em className="font-light italic text-editorial-badge">{card.titleEmphasis}</em>
                        {card.titleTail}
                      </h3>
                      <p className="text-[12.5px] leading-[1.6] text-noir/60">
                        {card.body}
                      </p>
                    </div>

                    <div className="mt-6 flex items-baseline gap-2 border-t border-noir/[0.06] pt-4">
                      <span className="font-display text-[26px] font-normal leading-none text-noir">
                        {card.metric.value}
                        {card.metric.unit ? (
                          <em className="font-light italic text-editorial-badge">{card.metric.unit}</em>
                        ) : null}
                      </span>
                      <span className="text-[9px] font-normal uppercase tracking-[0.2em] text-noir/55">
                        {card.metric.sublabel}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        </PageShell>
      </section>

      {/* ───────────────────────────── 4 · ÉCONOMIES (Comparator + Calculator réunis) ───────────────────────────── */}
      <section className="bg-surface-muted py-20 md:py-28" aria-labelledby="ora-plus-eco-title">
        <PageShell>
          <motion.header {...fadeBlock} className="mb-14 grid items-end gap-10 lg:grid-cols-2 lg:gap-20">
            <div>
              <span className="mb-4 block text-[10px] font-normal uppercase tracking-[0.28em] text-noir/60">Votre économie</span>
              <h2 id="ora-plus-eco-title" className="m-0 font-display font-normal text-noir" style={{ fontSize: 'clamp(32px, 4vw, 56px)', lineHeight: 1, letterSpacing: '-0.02em' }}>
                Le prix,<br />
                <em className="font-light italic text-editorial-badge">avant et après.</em>
              </h2>
            </div>
            <p className="m-0 max-w-[420px] font-display font-light italic text-noir/65 lg:justify-self-end lg:text-right" style={{ fontSize: 'clamp(14px, 1.1vw, 17px)', lineHeight: 1.5 }}>
              Exemples sur la carte + simulateur personnalisé ci-dessous.
            </p>
          </motion.header>

          {/* Comparateur visuel compact */}
          <motion.div {...fadeBlock} className="mb-10 grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4">
            {oraPlusCompare.rows.map((r) => (
              <div key={r.name} className="rounded-[2px] border border-noir/[0.08] bg-white p-5 md:p-6">
                <span className="mb-0.5 text-[9px] font-normal uppercase tracking-[0.22em] text-noir/50">{r.category}</span>
                <h3 className="m-0 mb-3 font-display text-[17px] font-normal leading-snug text-noir md:text-[19px]">{r.name}</h3>
                <div className="flex items-end justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-normal uppercase tracking-[0.2em] text-noir/45">Public</span>
                    <p className="m-0 mt-0.5 font-display text-[16px] leading-none text-noir/40 line-through md:text-[18px]">{r.priceRetail}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-normal uppercase tracking-[0.2em] text-noir/60">Óra+</span>
                    <p className="m-0 mt-0.5 font-display text-[22px] italic font-light leading-none text-noir md:text-[26px]">{r.priceOraPlus}</p>
                  </div>
                </div>
                <div className="mt-3 border-t border-noir/[0.06] pt-2.5 text-right">
                  <span className="font-display text-[13px] italic text-editorial-badge md:text-[14px]">Économie {r.savings}</span>
                </div>
              </div>
            ))}
          </motion.div>

          {/* Simulateur interactif */}
          <motion.div {...fadeBlock}>
            <OraPlusCalculatorBlock data={oraPlusCalculator} />
          </motion.div>

          <p className="mt-6 text-center font-display text-[11px] italic leading-relaxed text-noir/50">Simulation indicative — consommation réelle variable. * Tarifs indicatifs carte 2026.</p>
        </PageShell>
      </section>

      {/* ───────────────────────────── 5 · QUOTE RENFORCÉE ───────────────────────────── */}
      <section className="bg-surface-muted py-20 md:py-28">
        <PageShell>
          <motion.div {...fadeBlock} className="mx-auto flex max-w-[880px] flex-col items-center gap-10 text-center md:flex-row md:gap-14 md:text-left">
            <div className="shrink-0">
              {oraPlusQuote.avatar ? (
                <Avatar className="h-28 w-28 border-2 border-noir/10 md:h-32 md:w-32">
                  <Avatar.Image
                    alt={oraPlusQuote.author}
                    src={oraPlusQuote.avatar}
                  />
                  <Avatar.Fallback className="text-[14px] font-medium uppercase tracking-[0.2em]">
                    {oraPlusQuote.author.charAt(0)}
                  </Avatar.Fallback>
                </Avatar>
              ) : (
                <div className="flex h-28 w-28 items-center justify-center rounded-full bg-surface-card text-[14px] font-medium uppercase tracking-[0.2em] text-noir/40 md:h-32 md:w-32">
                  {oraPlusQuote.author.charAt(0)}
                </div>
              )}
            </div>

            <div>
              <div
                aria-hidden
                className="mb-2 font-display text-[80px] italic leading-[0.5] text-editorial-badge/15 md:text-[120px]"
              >
                „
              </div>
              <blockquote
                className="m-0 font-display font-normal text-noir"
                style={{
                  fontSize: 'clamp(24px, 3vw, 38px)',
                  lineHeight: 1.25,
                  letterSpacing: '-0.01em',
                }}
              >
                {oraPlusQuote.quoteHead}
                <em className="font-light italic text-editorial-badge">{oraPlusQuote.quoteEmphasis}</em>
                {oraPlusQuote.quoteTail}
              </blockquote>
              <div className="mt-6 text-[10px] font-normal uppercase tracking-[0.28em] text-noir/45">
                {oraPlusQuote.author}
                {oraPlusQuote.memberSince && (
                  <><em className="mx-2.5 font-display text-[13px] normal-case tracking-normal italic text-noir/60">·</em>{oraPlusQuote.memberSince}</>
                )}
                <em className="mx-2.5 font-display text-[13px] normal-case tracking-normal italic text-noir/60">·</em>
                {oraPlusQuote.location}
              </div>
            </div>
          </motion.div>
        </PageShell>
      </section>

      {/* ───────────────────────────── 6 · FINAL CTA (fond noir) ───────────────────────────── */}
      <section className="relative overflow-hidden bg-noir py-24 text-center md:py-32">
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.04] to-transparent" aria-hidden />
        <PageShell className="relative">
          <motion.div {...fadeBlock} className="mx-auto max-w-[720px]">
            <h2 className="m-0 font-display font-normal text-white" style={{ fontSize: 'clamp(40px, 5.5vw, 72px)', lineHeight: 1, letterSpacing: '-0.025em' }}>
              {oraPlusFinalCta.titleHead}
              <em className="font-light italic text-white/65">{oraPlusFinalCta.titleEmphasis}</em>
            </h2>
            <p className="mx-auto my-8 max-w-[520px] font-display font-light italic text-white/60" style={{ fontSize: 'clamp(15px, 1.2vw, 18px)', lineHeight: 1.55 }}>
              {oraPlusFinalCta.body}
            </p>
            <Button
              variant="ghost"
              size="md"
              onPress={() => void handleSubscribe()}
              isDisabled={subLoading}
              className="group inline-flex items-center gap-3 rounded-[2px] border border-white/35 bg-white/15 px-10 py-4 text-[11px] font-normal uppercase tracking-[0.24em] text-white transition-colors hover:border-white/50 hover:bg-white/25"
            >
              {oraPlusFinalCta.cta.label}
              <ArrowRight size={14} strokeWidth={1.5} className="transition-transform group-hover:translate-x-0.5" aria-hidden />
            </Button>
          </motion.div>
        </PageShell>
      </section>

      {/* ───────────────────────────── STICKY CTA MOBILE ───────────────────────────── */}
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-noir/[0.08] bg-white/95 backdrop-blur-sm md:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <PageShell className="py-3">
          <Button
            variant="ghost"
            size="md"
            onPress={() => void handleSubscribe()}
            isDisabled={subLoading}
            className="flex w-full items-center justify-center gap-3 rounded-[2px] border border-noir/20 bg-noir px-6 py-3.5 text-[10px] font-normal uppercase tracking-[0.24em] text-white transition-colors hover:bg-anthracite"
          >
            {oraPlusFinalCta.cta.label}
            <ArrowRight size={13} strokeWidth={1.5} aria-hidden />
          </Button>
        </PageShell>
      </div>
    </div>
  );
};

export default OraPlus;
