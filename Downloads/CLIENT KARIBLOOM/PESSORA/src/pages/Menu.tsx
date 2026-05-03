import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button, Card, Separator, Skeleton, cn } from '@heroui/react';
import { EmptyState, Segment } from '@heroui-pro/react';
import { ShoppingBag } from 'lucide-react';
import { SectionTitle } from '../components/ui/SectionTitle';
import { ProductCard } from '../components/ui/ProductCard';
import { categoryNames, type MenuItem } from '../data/menuData';
import { useMenuCatalog } from '../hooks/useMenuCatalog';
import { useFadeUpWhenVisible, useStaggerReveal } from '../lib/motionReveal';
import { formatEurFr } from '../lib/oraPricing';
import { useIsOraPlus } from '../hooks/useIsOraPlus';
import { OraPlusTeaserStrip } from '../components/common/OraPlusTeaserStrip';
import { DrinkOptionsModal } from '../components/cart/DrinkOptionsModal';

const TAB_TO_CATEGORY: Record<string, MenuItem['category'] | null> = {
  Tout: null,
  Wellness: 'wellness',
  'Énergie': 'energie',
  'Shakes': 'shakes',
  Coffee: 'coffee',
};

const GAMME_TO_TAB: Record<string, string> = {
  wellness: 'Wellness',
  energie: 'Énergie',
  shakes: 'Shakes',
  coffee: 'Coffee',
};

function normalizeStr(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function itemMatchesQuery(item: MenuItem, query: string): boolean {
  const q = normalizeStr(query.trim());
  if (!q) return true;
  const blob = normalizeStr(
    [item.name, item.description ?? '', categoryNames[item.category]].join(' ')
  );
  return blob.includes(q);
}

function formatMacros(item: MenuItem): string | undefined {
  const parts: string[] = [];
  if (item.protein)  parts.push(`${item.protein}g protéines`);
  if (item.calories) parts.push(`${item.calories} kcal`);
  return parts.length ? parts.join(' · ') : undefined;
}

/** Ordre d'affichage des sections « Tout » (grille unique, même densité pour toutes les gammes). */
const CATEGORY_GROUPS = [
  { label: 'Wellness', key: 'wellness' as const },
  { label: 'Énergie Drink', key: 'energie' as const },
  { label: 'Shakes Protéinés', key: 'shakes' as const },
  { label: 'Coffee', key: 'coffee' as const },
];

const MENU_TABS = [
  { label: 'Tout', gamme: null },
  { label: 'Wellness', gamme: 'wellness' },
  { label: 'Énergie', gamme: 'energie' },
  { label: 'Shakes', gamme: 'shakes' },
  { label: 'Coffee', gamme: 'coffee' },
] as const;

/**
 * auto-fill + largeur max par colonne : les gammes avec peu de produits ne s'étirent plus
 * sur toute la ligne (effet « seuls les shakes sont compacts »). justify-start = pas d'étirement fantôme.
 */
const PRODUCT_GRID_CLASS =
  'flex flex-nowrap gap-3 overflow-x-auto pb-2 snap-x snap-mandatory px-4 -mx-4 sm:grid sm:grid-cols-[repeat(auto-fill,minmax(min(100%,190px),280px))] sm:justify-start sm:gap-x-4 sm:gap-y-9 sm:overflow-visible sm:pb-0 sm:px-0 sm:-mx-0 md:gap-y-10';

const CARD_ITEM_CLASS = 'w-[200px] shrink-0 snap-start sm:w-auto sm:min-w-0';

const NO_SCROLLBAR = { scrollbarWidth: 'none' as const, msOverflowStyle: 'none' as const };

function MenuGridSkeleton() {
  return (
    <div className={PRODUCT_GRID_CLASS} style={NO_SCROLLBAR}>
      {Array.from({ length: 8 }).map((_, index) => (
        <Card key={index} className={`${CARD_ITEM_CLASS} overflow-hidden rounded-[2px] border border-noir/[0.08] bg-white`}>
          <Skeleton className="aspect-square w-full rounded-none bg-noir/[0.06]" />
          <Card.Content className="space-y-3 p-4">
            <Skeleton className="h-3 w-2/3 rounded-[2px] bg-noir/[0.08]" />
            <Skeleton className="h-3 w-1/2 rounded-[2px] bg-noir/[0.06]" />
            <Skeleton className="h-3 w-1/4 rounded-[2px] bg-noir/[0.06]" />
          </Card.Content>
        </Card>
      ))}
    </div>
  );
}

const Menu = () => {
  const { items: catalogItems, loading } = useMenuCatalog();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedSizes, setSelectedSizes] = useState<Record<string, 'small' | 'medium' | 'large'>>({});
  const [optionsItem, setOptionsItem] = useState<MenuItem | null>(null);
  const { container: staggerContainer, item: staggerItem, isReducedMotion } = useStaggerReveal();
  const fadeCta = useFadeUpWhenVisible();
  const { effectiveUnitPrice } = useIsOraPlus();

  const searchQuery = (searchParams.get('q') ?? '').trim();
  const isSearchMode = searchQuery.length > 0;

  const activeTab = useMemo(() => {
    const g = searchParams.get('gamme');
    if (!g) return 'Tout';
    return GAMME_TO_TAB[g] ?? 'Tout';
  }, [searchParams]);

  const activeCategory = TAB_TO_CATEGORY[activeTab];

  const clearSearch = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('q');
    setSearchParams(next, { replace: true });
  };

  /** En recherche, respecter ?gamme= : une seule section si filtre actif (sinon toutes les gammes). */
  const searchSections = useMemo(() => {
    if (!isSearchMode) return [];
    const groups = activeCategory
      ? CATEGORY_GROUPS.filter((g) => g.key === activeCategory)
      : CATEGORY_GROUPS;
    return groups
      .map(({ label, key }) => {
        const items = catalogItems
          .filter((i) => i.category === key)
          .filter((i) => itemMatchesQuery(i, searchQuery));
        return { label, key, items };
      })
      .filter((s) => s.items.length > 0);
  }, [isSearchMode, searchQuery, catalogItems, activeCategory]);

  const searchTotalCount = useMemo(
    () => searchSections.reduce((n, s) => n + s.items.length, 0),
    [searchSections]
  );

  const renderCard = (menuItem: MenuItem) => {
    const hasSizes =
      menuItem.price_small != null &&
      menuItem.price_medium != null &&
      menuItem.price_large != null;
    const selectedSize = hasSizes ? (selectedSizes[menuItem.id] ?? 'medium') : null;
    const effectivePrice = hasSizes
      ? selectedSize === 'small'
        ? menuItem.price_small!
        : selectedSize === 'large'
        ? menuItem.price_large!
        : menuItem.price_medium!
      : menuItem.price;

    const cardFooter = (
      <div className="mt-1 border-t border-noir/[0.06] pt-2">
        {hasSizes && (
          <div className="mb-2 flex gap-1">
            {(['small', 'medium', 'large'] as const).map((s) => {
              const sPrice =
                s === 'small'
                  ? menuItem.price_small!
                  : s === 'medium'
                  ? menuItem.price_medium!
                  : menuItem.price_large!;
              const sLabel = s === 'small' ? 'Petit' : s === 'medium' ? 'Moyen' : 'Grand';
              const isSelected = selectedSize === s;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSelectedSizes((prev) => ({ ...prev, [menuItem.id]: s }))}
                  className={cn(
                    'flex min-h-[44px] flex-1 items-center justify-center rounded-[2px] border py-2 text-[8px] font-normal uppercase leading-tight tracking-[0.1em] transition-colors',
                    isSelected
                      ? 'border-noir bg-noir text-white'
                      : 'border-noir/15 text-black/45 hover:border-noir/30 hover:text-black',
                  )}
                  aria-pressed={isSelected}
                >
                  {sLabel}
                  <br />
                  {sPrice}€
                </button>
              );
            })}
          </div>
        )}
        <button
          type="button"
          onClick={() => setOptionsItem(menuItem)}
          className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full border border-noir/[0.12] text-[10px] font-normal uppercase tracking-[0.12em] text-black/55 transition-colors hover:border-noir hover:bg-noir hover:text-white"
        >
          <ShoppingBag className="h-3.5 w-3.5" strokeWidth={1.3} aria-hidden />
          Ajouter
        </button>
      </div>
    );

    return (
      <motion.div key={menuItem.id} variants={staggerItem} className={CARD_ITEM_CLASS}>
        <ProductCard
          tag={categoryNames[menuItem.category]}
          name={menuItem.name}
          description={menuItem.description}
          macros={formatMacros(menuItem)}
          price={`${effectivePrice}€`}
          oraMemberHint={formatEurFr(effectiveUnitPrice(effectivePrice))}
          icon={menuItem.icon}
          linkTo={`/menu/${menuItem.id}`}
          density="compact"
          footer={cardFooter}
        />
      </motion.div>
    );
  };

  const productGridMotionProps = {
    variants: staggerContainer,
    initial: isReducedMotion ? (false as const) : ('hidden' as const),
    whileInView: 'visible' as const,
    viewport: { once: true, amount: 0.12 as const, margin: '0px 0px -32px 0px' as const },
  };

  const singleItems = activeCategory ? catalogItems.filter((i) => i.category === activeCategory) : [];

  return (
    <div className="min-h-screen bg-white">
      <h1 className="sr-only">La carte</h1>

      {isSearchMode && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-noir/[0.06] bg-surface-muted px-4 py-3.5 md:px-10 lg:px-[72px]">
          <p className="text-[11px] font-light tracking-[0.03em] text-black/55">
            {searchTotalCount > 0 ? (
              <>
                <span className="text-black/35">
                  {searchTotalCount} résultat{searchTotalCount !== 1 ? 's' : ''} pour{' '}
                </span>
                <span className="font-normal text-black">« {searchQuery} »</span>
              </>
            ) : (
              <>
                <span className="text-black/35">Aucun résultat pour </span>
                <span className="font-normal text-black">« {searchQuery} »</span>
              </>
            )}
          </p>
          <Button
            type="button"
            variant="ghost"
            onPress={clearSearch}
            className="h-10 min-h-10 rounded-full border border-noir/12 px-4 text-[10px] font-light uppercase tracking-[0.14em] text-black/50 hover:text-black"
          >
            Effacer
          </Button>
        </div>
      )}

      {/* Filtre par gamme — Segment HeroUI, centré dans la page */}
      {!isSearchMode && (
        <div className="border-b border-noir/[0.06] bg-white px-4 py-4 md:px-10 lg:px-[72px]">
          <div className="flex justify-center">
            <Segment
              size="sm"
              selectedKey={activeTab}
              onSelectionChange={(k) => {
                const next = new URLSearchParams(searchParams);
                if (!k || k === 'Tout') next.delete('gamme');
                else {
                  const gamme = MENU_TABS.find((t) => t.label === k)?.gamme;
                  if (gamme) next.set('gamme', gamme);
                  else next.delete('gamme');
                }
                setSearchParams(next, { replace: true });
              }}
              aria-label="Filtrer par gamme"
            >
              {MENU_TABS.map(({ label }) => (
                <Segment.Item key={label} id={label}>
                  <Segment.Separator />
                  {label}
                </Segment.Item>
              ))}
            </Segment>
          </div>
        </div>
      )}

      <div className="bg-white px-4 pb-5 md:px-10 lg:px-[72px]">
        <div className="mx-auto max-w-7xl">
          <OraPlusTeaserStrip variant="muted" />
        </div>
      </div>

      {/* Products — largeur max pour rythme éditorial ; grilles denses */}
      <div className="bg-white px-4 pb-16 md:px-10 lg:px-[72px]">
        <div className="mx-auto max-w-7xl">
        {loading ? (
          <section className="pt-10 first:pt-6 md:pt-12 md:first:pt-8">
            <SectionTitle title="Chargement de la carte" />
            <MenuGridSkeleton />
          </section>
        ) : isSearchMode ? (
          searchSections.length > 0 ? (
            searchSections.map(({ label, key, items }) => (
              <section key={key} className="pt-10 first:pt-6 md:pt-12 md:first:pt-8">
                <Separator className="mb-8 bg-noir/[0.06]" />
                <SectionTitle title={label} />
                <motion.div key={`search-${key}`} className={PRODUCT_GRID_CLASS} style={NO_SCROLLBAR} {...productGridMotionProps}>
                  {items.map(renderCard)}
                </motion.div>
              </section>
            ))
          ) : (
            <EmptyState className="my-10 rounded-[2px] border border-noir/[0.08] bg-neutral-50 px-6 py-12 md:py-14">
              <EmptyState.Header>
                <EmptyState.Title className="font-display text-[16px] font-normal text-black/75">
                  Aucun résultat
                </EmptyState.Title>
                <EmptyState.Description className="text-[12px] font-light text-black/45">
                  Essayez un autre mot-clé ou effacez la recherche.
                </EmptyState.Description>
              </EmptyState.Header>
              <EmptyState.Content>
                <Button
                  type="button"
                  variant="ghost"
                  onPress={clearSearch}
                  className="h-10 rounded-full border border-noir/15 px-5 text-[10px] font-light uppercase tracking-[0.14em] text-black/55 transition-colors hover:border-noir/30 hover:text-noir"
                >
                  Effacer la recherche
                </Button>
              </EmptyState.Content>
            </EmptyState>
          )
        ) : activeTab === 'Tout' ? (
          CATEGORY_GROUPS.map(({ label, key }) => {
            const items = catalogItems.filter((i) => i.category === key);
            if (items.length === 0) return null;
            return (
              <section key={key} className="pt-10 first:pt-6 md:pt-12 md:first:pt-8">
                <Separator className="mb-8 bg-noir/[0.06]" />
                <SectionTitle title={label} />
                <motion.div key={`all-${key}`} className={PRODUCT_GRID_CLASS} style={NO_SCROLLBAR} {...productGridMotionProps}>
                  {items.map(renderCard)}
                </motion.div>
              </section>
            );
          })
        ) : (
          <section className="pt-10 first:pt-6 md:pt-12 md:first:pt-8">
            <Separator className="mb-8 bg-noir/[0.06]" />
            <SectionTitle title={activeTab} />
            {singleItems.length > 0 ? (
              <motion.div key={`single-${activeCategory ?? 'none'}`} className={PRODUCT_GRID_CLASS} style={NO_SCROLLBAR} {...productGridMotionProps}>
                {singleItems.map(renderCard)}
              </motion.div>
            ) : (
              <EmptyState className="my-10 rounded-[2px] border border-noir/[0.08] bg-neutral-50 px-6 py-12 md:py-14">
                <EmptyState.Header>
                  <EmptyState.Title className="font-display text-[16px] font-normal text-black/75">
                    Aucun produit
                  </EmptyState.Title>
                  <EmptyState.Description className="text-[12px] font-light text-black/45">
                    Cette gamme n'affiche aucun produit pour le moment.
                  </EmptyState.Description>
                </EmptyState.Header>
              </EmptyState>
            )}
          </section>
        )}
        </div>
      </div>

      <DrinkOptionsModal item={optionsItem} onClose={() => setOptionsItem(null)} />

      {/* Bilan CTA — même langage que Home (clair + lien filet) */}
      <div className="mx-4 mb-[72px] bg-surface-muted px-8 py-16 md:mx-10 md:px-[56px] lg:mx-[72px]">
        <motion.div
          className="mx-auto max-w-lg text-center md:mx-0 md:max-w-none md:flex md:items-end md:justify-between md:gap-10 md:text-left"
          {...fadeCta}
        >
          <div>
            <p className="mb-3 text-[8px] font-light uppercase tracking-[0.48em] text-black/40">Bilan Bien-être</p>
            <h3
              className="font-display font-normal leading-[1.0] text-black"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(28px, 3vw, 38px)',
              }}
            >
              30 minutes<br /><em className="italic text-black/45">offertes</em>
            </h3>
          </div>
          <Link to="/bilan-bien-etre" className="text-editorial-link-underline mt-8 inline-block md:mt-0 md:flex-shrink-0">
            Réserver mon bilan
          </Link>
        </motion.div>
      </div>

    </div>
  );
};

export default Menu;
