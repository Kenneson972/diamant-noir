import { useState, useCallback, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button, Tabs } from '@heroui/react';
import { useFadeUpWhenVisible } from '../lib/motionReveal';
import { ImageCard } from '../components/ui/ImageCard';
import { SectionTitle } from '../components/ui/SectionTitle';
import { HomeProductCarousel } from '../components/home/HomeProductCarousel';
import { HomeGoogleReviews } from '../components/home/HomeGoogleReviews';
import { OraPlusTeaserStrip } from '../components/common/OraPlusTeaserStrip';
import { publicAssetWithCache } from '../lib/publicAsset';

const UNIVERS = [
  {
    id: 'nutrition',
    eyebrow: 'Nutrition',
    title: 'Shakes',
    titleEm: '& gauffres',
    bgClass: 'bg-surface-product-well',
    variant: 'light' as const,
    path: '/menu',
  },
  {
    id: 'communaute',
    eyebrow: 'Communauté',
    title: 'Événements',
    titleEm: '',
    bgClass: 'bg-surface-hero',
    variant: 'dark' as const,
    path: '/evenements',
  },
  {
    id: 'bien-etre',
    eyebrow: 'Bien-être',
    title: 'Bilan',
    titleEm: '30 min',
    bgClass: 'bg-surface-muted',
    variant: 'light' as const,
    path: '/bilan-bien-etre',
  },
] as const;

const Home = () => {
  const navigate = useNavigate();
  const fadeUpEvents = useFadeUpWhenVisible();
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    document.title = 'PessÓra — Bar Protéiné & Bien-Être, Martinique';
  }, []);

  const goPrev = useCallback(() => {
    setActiveIdx((i) => (i - 1 + UNIVERS.length) % UNIVERS.length);
  }, []);
  const goNext = useCallback(() => {
    setActiveIdx((i) => (i + 1) % UNIVERS.length);
  }, []);

  const active = UNIVERS[activeIdx];

  return (
    <div className="min-h-screen bg-surface-page">
      {/* ─── Hero — fond vidéo ─── */}
      <section
        className="relative flex items-end overflow-hidden bg-noir"
        style={{ height: 'clamp(380px, 64svh, 680px)' }}
      >
        {/* Vidéo background */}
        <video
          className="absolute inset-0 h-full w-full object-cover"
          src="/hero-video.webm"
          autoPlay
          loop
          muted
          playsInline
          aria-hidden="true"
        />
        {/* Overlay gradient */}
        <div
          className="absolute inset-0"
          style={{
            background: [
              'radial-gradient(ellipse at 72% 32%, color-mix(in oklch, var(--color-noir) 45%, transparent) 0%, transparent 60%)',
              'linear-gradient(162deg, color-mix(in oklch, var(--color-noir) 70%, transparent) 0%, color-mix(in oklch, var(--color-noir) 30%, transparent) 50%, transparent 100%)',
            ].join(', '),
          }}
        />
        <div className="absolute top-0 left-4 md:left-10 lg:left-[72px] right-4 md:right-10 lg:right-[72px] h-px bg-gradient-to-r from-transparent via-gold/15 to-transparent" />

        <div className="relative z-10 w-full max-w-lg px-4 pb-12 pt-8 md:px-10 md:pb-14 lg:px-[72px] lg:pb-16">
          <p
            className="mb-5 max-w-[24rem] font-light leading-[1.45] tracking-[0.02em] text-white/88 sm:max-w-md"
            style={{ fontSize: 'clamp(14px, 2.6vw, 18px)' }}
          >
            <span className="block">Plus qu&apos;une boisson</span>
            <span className="mt-1.5 block">un style de vie</span>
          </p>
          <p className="mb-8 max-w-md text-[8px] font-light uppercase leading-relaxed tracking-[0.22em] text-white/50 [text-wrap:balance] sm:text-[9px] sm:tracking-[0.28em]">
            Performance{' '}
            <span className="text-white/35" aria-hidden>
              |
            </span>{' '}
            Protein bar{' '}
            <span className="text-white/35" aria-hidden>
              |
            </span>{' '}
            Nutricosmetics
          </p>
          <Button
            variant="ghost"
            size="lg"
            onPress={() => navigate('/menu')}
            aria-label="Voir le menu"
            className="inline-flex items-center gap-2 !border-0 !bg-transparent !shadow-none text-white hover:!bg-white/[0.08] active:!bg-white/[0.12]"
          >
            <span className="text-[9px] font-normal uppercase tracking-[0.22em]">Menu</span>
            <ChevronRight size={18} strokeWidth={1.3} aria-hidden />
          </Button>
        </div>
      </section>

      {/* ─── Boissons — carrousel coups de cœur ─── */}
      <HomeProductCarousel />

      <div className="bg-white px-4 pb-14 md:px-10 md:pb-16 lg:px-[72px]">
        <div className="mx-auto max-w-[1400px]">
          <OraPlusTeaserStrip variant="muted" />
        </div>
      </div>

      {/* ─── Nos univers — navigation manuelle (flèches) ─── */}
      <section className="bg-white px-4 py-20 md:px-10 md:py-[88px] lg:px-[72px]">
        <SectionTitle title="Nos univers" linkLabel="Tout explorer" linkTo="/menu" />

        <div
          className="relative rounded-[2px] outline-none focus-visible:ring-2 focus-visible:ring-noir/15 focus-visible:ring-offset-2"
          role="region"
          aria-roledescription="carrousel"
          aria-label="Nos univers"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'ArrowLeft') {
              e.preventDefault();
              goPrev();
            } else if (e.key === 'ArrowRight') {
              e.preventDefault();
              goNext();
            }
          }}
        >
          <Button
            isIconOnly
            type="button"
            variant="ghost"
            onPress={goPrev}
            aria-label="Univers précédent"
            className="absolute left-0 top-[42%] z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-noir/[0.12] bg-white/90 text-black/55 shadow-sm backdrop-blur-sm transition-colors hover:border-noir/25 hover:text-black md:left-2 lg:left-4"
          >
            <ChevronLeft size={22} strokeWidth={1.25} aria-hidden />
          </Button>
          <Button
            isIconOnly
            type="button"
            variant="ghost"
            onPress={goNext}
            aria-label="Univers suivant"
            className="absolute right-0 top-[42%] z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-noir/[0.12] bg-white/90 text-black/55 shadow-sm backdrop-blur-sm transition-colors hover:border-noir/25 hover:text-black md:right-2 lg:right-4"
          >
            <ChevronRight size={22} strokeWidth={1.25} aria-hidden />
          </Button>

          {/* Pas de fondu opacity sur le parent : WebKit assombrit ou masque la &lt;video&gt;. */}
          <div key={activeIdx}>
            <ImageCard
              eyebrow={active.eyebrow}
              title={active.title}
              titleEm={active.titleEm}
              bgClass={active.bgClass}
              variant={active.variant}
              bgVideoSrc={
                active.eyebrow === 'Communauté'
                  ? publicAssetWithCache('videos/evenements-communaute.mp4')
                  : undefined
              }
              bgVideoSrcWebm={
                active.eyebrow === 'Communauté'
                  ? publicAssetWithCache('videos/evenements-communaute.webm')
                  : undefined
              }
              bgVideoPosterSrc={
                active.eyebrow === 'Communauté'
                  ? publicAssetWithCache('videos/evenements-communaute-poster.jpg')
                  : undefined
              }
              aspectRatio="aspect-[3/2] md:aspect-[21/8]"
              onPress={() => navigate(active.path)}
            />
          </div>

          <div className="mt-5">
            <Tabs
              selectedKey={active.id}
              onSelectionChange={(key) => {
                const idx = UNIVERS.findIndex((u) => u.id === String(key));
                if (idx >= 0) setActiveIdx(idx);
              }}
              className="w-full"
            >
              <Tabs.List aria-label="Sélection univers">
                {UNIVERS.map((u) => (
                  <Tabs.Tab key={u.id} id={u.id}>
                    {u.eyebrow}
                  </Tabs.Tab>
                ))}
              </Tabs.List>
            </Tabs>
          </div>
        </div>
      </section>

      <HomeGoogleReviews />

      {/* ─── Événements — respiration typographique ─── */}
      <section className="bg-white px-4 py-[104px] md:px-10 md:py-[132px] lg:px-[72px]">
        <motion.div className="mx-auto max-w-[520px] text-center" {...fadeUpEvents}>
          <p className="mb-6 text-[9px] font-light uppercase tracking-[0.5em] text-black/45">
            Événements
          </p>
          <h2
            className="mb-10 font-display font-normal leading-[0.93] text-black"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(36px, 4.5vw, 56px)',
            }}
          >
            Rejoins la<br /><em className="italic text-black/45">communauté Pessóra</em>
          </h2>
          <Link
            to="/evenements"
            className="inline-flex min-h-[44px] items-center border-b border-noir/30 pb-px text-[10px] font-light uppercase tracking-[0.26em] text-black/65 transition-colors duration-200 hover:border-noir hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-noir/20 rounded-[1px]"
          >
            Voir les événements
          </Link>
        </motion.div>
      </section>

    </div>
  );
};

export default Home;
