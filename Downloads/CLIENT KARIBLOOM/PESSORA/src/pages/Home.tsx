import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { cn } from '@heroui/react';
import { ArrowBtn } from '../components/ui/ArrowBtn';
import { ImageCard } from '../components/ui/ImageCard';
import { SectionTitle } from '../components/ui/SectionTitle';
import {
  homeDrinkShowcase,
  homeDrinkShowcaseOrder,
  type DrinkGamme,
} from '../data/homeDrinkShowcase';

/** Cellule image frameless (coins larges type Nespresso) */
function ShowcasePhoto({
  src,
  placeholderClass,
  alt,
  className,
}: {
  src: string | null;
  placeholderClass: string;
  alt: string;
  className?: string;
}) {
  return (
    <div className={cn('relative overflow-hidden rounded-[28px]', className)}>
      {src ? (
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-cover transition-transform duration-700 ease-out hover:scale-[1.03]"
          loading="lazy"
        />
      ) : (
        <div className={cn('absolute inset-0', placeholderClass)} aria-hidden />
      )}
    </div>
  );
}

const Home = () => {
  const navigate = useNavigate();
  const [activeGamme, setActiveGamme] = useState<DrinkGamme>('wellness');
  const entry = homeDrinkShowcase[activeGamme];
  const { images, placeholderClass, href, label } = entry;

  return (
    <div className="min-h-screen bg-surface-page">

      {/* ─── Hero — seul grand bloc sombre (anthracite chaud, pas noir pur) ─── */}
      <section
        className="relative flex items-end overflow-hidden bg-surface-hero"
        style={{
          height: 'clamp(380px, 64vh, 680px)',
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            background: [
              'radial-gradient(ellipse at 72% 32%, oklch(22% 0.01 55 / 0.35) 0%, transparent 55%)',
              'linear-gradient(162deg, oklch(14% 0.007 55) 0%, oklch(11% 0.006 55) 48%, oklch(13% 0.006 55) 100%)',
            ].join(', '),
          }}
        />
        <div className="absolute top-0 left-4 md:left-10 lg:left-[72px] right-4 md:right-10 lg:right-[72px] h-px bg-gradient-to-r from-transparent via-[oklch(75%_0.085_68)]/[0.15] to-transparent" />

        <div className="relative z-10 w-full max-w-3xl px-4 pb-12 pt-8 md:px-10 md:pb-14 lg:px-[72px] lg:pb-16">
          <p className="mb-5 text-[8px] font-light uppercase tracking-[0.55em] text-white/42">
            Bar Protéiné · Fort-de-France
          </p>
          <h1
            className="mb-8 font-display font-normal leading-[0.9] tracking-[-0.02em] text-white"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(42px, 6.5vw, 76px)',
            }}
          >
            Nourris<br /><em className="italic text-white/50">l'essentiel</em>
          </h1>
          <ArrowBtn onDark size="lg" onPress={() => navigate('/menu')} ariaLabel="Voir le menu" />
        </div>
      </section>

      {/* ─── Nos univers — cartes claires ─── */}
      <section className="bg-white px-4 md:px-10 lg:px-[72px] py-[88px]">
        <SectionTitle title="Nos univers" linkLabel="Tout explorer" linkTo="/menu" />
        <div className="grid grid-cols-1 gap-[2px] sm:grid-cols-3">
          <ImageCard
            eyebrow="Nutrition"
            title="Shakes &"
            titleEm="gauffres"
            onPress={() => navigate('/menu')}
          />
          <ImageCard
            eyebrow="Communauté"
            title="Run"
            titleEm="Club"
            onPress={() => navigate('/evenements')}
          />
          <ImageCard
            eyebrow="Bien-être"
            title="Bilan"
            titleEm="30 min"
            onPress={() => navigate('/bilan-bien-etre')}
          />
        </div>
      </section>

      {/* ─── Boissons — grille type Nespresso (onglets + 1 grand + 2 empilés) ─── */}
      <section className="bg-[oklch(98.5%_0.004_55)] px-4 py-[88px] md:px-10 lg:px-[72px]">
        <div className="mx-auto max-w-[1200px]">
          <div className="mb-10 text-center md:mb-12">
            <p className="mb-2 text-[9px] font-light uppercase tracking-[0.28em] text-black/38">La carte</p>
            <h2
              className="font-display font-normal tracking-[-0.02em] text-black"
              style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(26px, 3.2vw, 38px)' }}
            >
              Nos boissons par univers
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-[12px] font-light leading-relaxed text-black/45">
              Sélectionnez une gamme. Les photos se configurent dans le fichier de données dédié à cette section.
            </p>
          </div>

          {/* Pills — style Nespresso */}
          <div
            className="mb-8 flex flex-wrap items-center justify-center gap-2 md:mb-10 md:gap-3"
            role="tablist"
            aria-label="Gammes de boissons"
          >
            {homeDrinkShowcaseOrder.map((key) => {
              const item = homeDrinkShowcase[key];
              const selected = activeGamme === key;
              return (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setActiveGamme(key)}
                  className={cn(
                    'min-h-10 rounded-full px-5 py-2.5 text-[11px] font-light tracking-[0.06em] transition-colors duration-200 md:px-7',
                    selected
                      ? 'border border-black text-black'
                      : 'border border-black/[0.12] text-black/55 hover:border-black/25 hover:text-black/80',
                  )}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          {/* Grille asymétrique : grand à gauche, deux empilés à droite (type Nespresso) */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:items-stretch md:gap-5 lg:min-h-[min(70vh,620px)]">
            <Link
              to={href}
              className="group relative block min-h-[300px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/25 focus-visible:ring-offset-2 md:min-h-[480px] lg:min-h-[560px]"
              aria-label={`Voir la gamme ${label}`}
            >
              <ShowcasePhoto
                src={images.large}
                placeholderClass={placeholderClass}
                alt={`${label} — visuel principal`}
                className="h-full min-h-[300px]"
              />
              <div
                className="pointer-events-none absolute inset-x-0 bottom-0 h-28 rounded-b-[28px] bg-gradient-to-t from-black/35 to-transparent"
                aria-hidden
              />
              <span className="pointer-events-none absolute bottom-5 left-5 text-[9px] font-light uppercase tracking-[0.2em] text-white md:bottom-7 md:left-7">
                {label}
              </span>
            </Link>

            <div className="flex min-h-[420px] flex-col gap-4 md:min-h-0 md:gap-5 lg:min-h-[560px]">
              <Link
                to={href}
                className="group relative block min-h-[200px] flex-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/25 focus-visible:ring-offset-2"
                aria-label={`${label} — visuel 2`}
              >
                <ShowcasePhoto
                  src={images.stackedTop}
                  placeholderClass={placeholderClass}
                  alt={`${label} — détail`}
                  className="h-full min-h-[200px]"
                />
              </Link>
              <Link
                to={href}
                className="group relative block min-h-[200px] flex-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/25 focus-visible:ring-offset-2"
                aria-label={`${label} — visuel 3`}
              >
                <ShowcasePhoto
                  src={images.stackedBottom}
                  placeholderClass={placeholderClass}
                  alt={`${label} — ambiance`}
                  className="h-full min-h-[200px]"
                />
              </Link>
            </div>
          </div>

          <p className="mt-8 text-center">
            <Link
              to="/menu"
              className="inline-block border-b border-black/30 pb-px text-[9px] font-light uppercase tracking-[0.22em] text-black/55 transition-colors hover:border-black hover:text-black"
            >
              Voir toute la carte
            </Link>
          </p>
        </div>
      </section>

      {/* ─── Événements — section claire, respiration typographique ─── */}
      <section className="bg-white px-4 py-20 md:px-10 md:py-24 lg:px-[72px]">
        <div className="mx-auto max-w-[520px] text-center">
          <p className="mb-6 text-[8px] font-light uppercase tracking-[0.55em] text-black/40">
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
            className="inline-block border-b border-black/30 pb-px text-[9px] font-light uppercase tracking-[0.28em] text-black/60 transition-colors duration-200 hover:border-black hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 rounded-[1px]"
          >
            Voir les événements
          </Link>
        </div>
      </section>

      {/* ─── Actualités — cartes claires ─── */}
      <section className="bg-surface-muted px-4 md:px-10 lg:px-[72px] py-[88px]">
        <SectionTitle title="Nos actualités" />
        <div className="grid grid-cols-1 gap-[2px] sm:grid-cols-2">
          <ImageCard
            eyebrow="Bilan Bien-être"
            title="30 minutes"
            titleEm="offertes"
            aspectRatio="aspect-[16/9]"
            onPress={() => navigate('/bilan-bien-etre')}
          />
          <ImageCard
            eyebrow="Pop-up · GigaFit"
            title="Nouveau"
            titleEm="point de vente"
            aspectRatio="aspect-[16/9]"
            onPress={() => navigate('/evenements')}
          />
        </div>
      </section>

    </div>
  );
};

export default Home;
