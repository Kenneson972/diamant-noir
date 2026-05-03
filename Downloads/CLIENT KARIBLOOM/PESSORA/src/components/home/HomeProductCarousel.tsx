import { useCallback, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Plus } from 'lucide-react';
import { Button, Card, Chip, cn } from '@heroui/react';
import { carouselBadgeLabel, type HomeCarouselBadge } from '../../data/homeProductCarousel';
import { type MenuItem } from '../../data/menuData';
import { useHomeCarouselRows } from '../../hooks/useHomeCarousel';
import { formatEurFr } from '../../lib/oraPricing';
import { useIsOraPlus } from '../../hooks/useIsOraPlus';
import { DrinkOptionsModal } from '../cart/DrinkOptionsModal';

function ProductBadge({ type }: { type: HomeCarouselBadge }) {
  return (
    <Chip
      className={cn(
        'pointer-events-none absolute left-2 top-2 z-[2] flex max-h-[72px] items-center justify-center px-1.5 py-2 text-[8px] font-medium uppercase leading-none tracking-[0.12em] text-white shadow-sm',
        '[writing-mode:vertical-rl] rotate-180',
        'bg-editorial-badge'
      )}
      color="default"
      variant="primary"
      size="sm"
      aria-label={carouselBadgeLabel(type)}
      role="status"
    >
      {carouselBadgeLabel(type)}
    </Chip>
  );
}

function ProductCard({
  item,
  imageSrc,
  badge,
  onAdd,
}: {
  item: MenuItem;
  imageSrc?: string | null;
  badge?: HomeCarouselBadge;
  onAdd: (item: MenuItem) => void;
}) {
  const { effectiveUnitPrice } = useIsOraPlus();
  const line = [item.pitch, item.protein != null ? `${item.protein}g protéines` : null, item.calories != null ? `${item.calories} kcal` : null]
    .filter(Boolean)
    .join(' · ')
    .toUpperCase();

  const detailPath = `/menu/${item.id}`;

  return (
    <article className="snap-start shrink-0 w-[calc(100vw-48px)] min-[400px]:w-[min(70vw,272px)] sm:w-[248px] scroll-ml-0">
      <Card className="group/sq relative overflow-hidden rounded-[2px] border border-noir/[0.08] bg-white">
        <Card.Header className="relative aspect-square overflow-hidden bg-surface-product-well p-0">
        {badge && <ProductBadge type={badge} />}
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={item.name}
            width={400}
            height={400}
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover/sq:scale-[1.03]"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-b from-surface-muted to-surface-product-well">
            {item.icon && <span className="text-[56px] leading-none opacity-[0.88]" aria-hidden>{item.icon}</span>}
          </div>
        )}
        <Link
          to={detailPath}
          className="absolute inset-0 z-[1] block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-noir/25"
          aria-label={`Voir la fiche : ${item.name}`}
        />
        <Button
          isIconOnly
          type="button"
          variant="ghost"
          aria-label={`Personnaliser et ajouter ${item.name} au panier`}
          onClick={() => onAdd(item)}
          className={cn(
            'absolute bottom-3 right-3 z-[3] flex h-11 w-11 items-center justify-center sm:h-10 sm:w-10 sm:bottom-3.5 sm:right-3.5',
            'rounded-full border border-noir/[0.08] bg-white/55 text-black/40 backdrop-blur-[6px]',
            'transition-[color,background-color,border-color,transform] duration-300 ease-out',
            'hover:border-noir/[0.14] hover:bg-white/80 hover:text-black/65',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-noir/20 focus-visible:ring-offset-2 focus-visible:ring-offset-white/80',
            'active:scale-[0.96]'
          )}
        >
          <Plus className="h-[15px] w-[15px]" strokeWidth={1} aria-hidden />
        </Button>
        </Card.Header>
        <Card.Content className="space-y-1.5 px-3.5 pb-4 pt-3.5">
          <Link
            to={detailPath}
            className="block space-y-1.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-noir/20 focus-visible:ring-offset-2"
          >
            <Card.Title className="text-editorial-product-name">{item.name}</Card.Title>
            <Card.Description className="line-clamp-2 text-editorial-product-meta">{line}</Card.Description>
            <p className="pt-0.5 text-editorial-price">{item.price.toFixed(2).replace('.', ',')} €</p>
            <p className="text-[9px] font-light text-gold-dim">
              Óra+ dès {formatEurFr(effectiveUnitPrice(item.price))}
            </p>
          </Link>
        </Card.Content>
      </Card>
    </article>
  );
}

export function HomeProductCarousel() {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const { rows } = useHomeCarouselRows();
  const [optionsItem, setOptionsItem] = useState<MenuItem | null>(null);

  const scrollNext = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>('a');
    const delta = card ? Math.min(card.offsetWidth + 16, 320) : 280;
    el.scrollBy({ left: delta, behavior: 'smooth' });
  }, []);

  return (
    <section
      className="bg-white px-4 py-16 md:px-10 md:py-[var(--space-section-y-md)] lg:px-[72px]"
      aria-labelledby="home-carousel-title"
    >
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-11 flex flex-col gap-4 border-b border-noir/[0.05] pb-8 sm:mb-12 sm:flex-row sm:items-end sm:justify-between sm:pb-9 md:mb-14">
          <h2 id="home-carousel-title" className="text-editorial-section-title">
            Nos coups de cœur
          </h2>
          <p className="max-w-[14rem] text-[9px] font-light uppercase leading-relaxed tracking-[0.26em] text-black/38 sm:text-right">
            Sélection maison · recettes courantes
          </p>
        </div>

        <div className="relative">
          <div
            ref={scrollerRef}
            className="scrollbar-hide flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 pl-4 pr-12 sm:pl-0 sm:pr-14 md:gap-5 md:pr-16"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {rows.map(({ entry, item }) => (
              <ProductCard key={item.id} item={item} imageSrc={entry.imageSrc} badge={entry.badge} onAdd={setOptionsItem} />
            ))}
          </div>

          <Button
            isIconOnly
            type="button"
            variant="ghost"
            onClick={scrollNext}
            className="absolute right-0 top-[min(40%,120px)] z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-noir/[0.12] bg-white text-black/70 shadow-[0_4px_24px_rgba(0,0,0,0.06)] transition-colors hover:border-noir/25 hover:text-black md:flex"
            aria-label="Faire défiler vers la droite"
          >
            <ChevronRight size={20} strokeWidth={1.25} aria-hidden />
          </Button>
        </div>

        <p className="mt-10 text-center md:mt-12">
          <Link to="/menu" className="text-editorial-link-underline inline-block">
            Voir toute la carte
          </Link>
        </p>
      </div>

      <DrinkOptionsModal item={optionsItem} onClose={() => setOptionsItem(null)} />
    </section>
  );
}
