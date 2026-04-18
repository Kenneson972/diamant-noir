import { useState } from 'react';
import { Link } from 'react-router-dom';
import { SectionTitle } from '../components/ui/SectionTitle';
import { ProductCard } from '../components/ui/ProductCard';
import {
  menuItems,
  wellnessItems,
  energieItems,
  shakesItems,
  coffeeItems,
  categoryNames,
  type MenuItem,
} from '../data/menuData';

const TABS = ['Tout', 'Wellness', 'Énergie Drink', 'Shakes Protéinés', 'Coffee'];
const FILTERS = ['Tout', 'Protéine ↑', 'Faible calories', 'Végétalien', 'Sans gluten', 'Énergie'];

const CATEGORY_BG: Record<MenuItem['category'], string> = {
  wellness: 'bg-gradient-to-b from-[#3d6b3e] to-[#2c4e2d]',
  energie: 'bg-gradient-to-b from-[#4a7c35] to-[#3a6028]',
  shakes: 'bg-gradient-to-b from-[#2c4e2d] to-[#1a3a1b]',
  coffee: 'bg-gradient-to-b from-[#3d2b1f] to-[#1a120a]',
};

const TAB_TO_CATEGORY: Record<string, MenuItem['category'] | null> = {
  Tout: null,
  Wellness: 'wellness',
  'Énergie Drink': 'energie',
  'Shakes Protéinés': 'shakes',
  Coffee: 'coffee',
};

function applyFilter(items: MenuItem[], filter: string): MenuItem[] {
  switch (filter) {
    case 'Protéine ↑':
      return items.filter((i) => i.protein && i.protein >= 18);
    case 'Faible calories':
      return items.filter((i) => i.calories !== undefined && i.calories <= 50);
    case 'Végétalien':
      return items.filter((i) => i.badges?.includes('vegan'));
    case 'Sans gluten':
      return items.filter((i) => i.badges?.includes('glutenfree'));
    case 'Énergie':
      return items.filter((i) => i.category === 'energie');
    default:
      return items;
  }
}

function formatPrice(price: number): string {
  return `${price.toLocaleString('fr-FR')}€`;
}

function formatMacros(item: MenuItem): string | undefined {
  const parts: string[] = [];
  if (item.protein) parts.push(`${item.protein}g protéines`);
  if (item.calories) parts.push(`${item.calories} kcal`);
  return parts.length ? parts.join(' · ') : undefined;
}

const CATEGORY_GROUPS = [
  { label: 'Wellness', key: 'wellness' as const, base: wellnessItems, grid: 'grid-cols-3' },
  { label: 'Énergie Drink', key: 'energie' as const, base: energieItems, grid: 'grid-cols-3' },
  { label: 'Shakes Protéinés', key: 'shakes' as const, base: shakesItems, grid: 'grid-cols-3' },
  { label: 'Coffee', key: 'coffee' as const, base: coffeeItems, grid: 'grid-cols-2' },
];

const Menu = () => {
  const [activeFilter, setActiveFilter] = useState('Tout');
  const [activeTab, setActiveTab] = useState('Tout');

  const renderCard = (item: MenuItem) => (
    <ProductCard
      key={item.id}
      tag={categoryNames[item.category]}
      name={item.name}
      description={item.description}
      macros={formatMacros(item)}
      price={formatPrice(item.price)}
      bgClass={CATEGORY_BG[item.category]}
      linkTo={`/menu/${item.id}`}
    />
  );

  const activeCategory = TAB_TO_CATEGORY[activeTab];
  const singleItems = activeCategory
    ? applyFilter(
        menuItems.filter((i) => i.category === activeCategory),
        activeFilter
      )
    : [];

  return (
    <div className="min-h-screen">
      {/* Hero banner */}
      <section className="bg-[#0a0a0a] px-[60px] py-[56px]">
        <p className="text-[9px] font-normal tracking-[0.42em] uppercase text-white/[0.28] mb-[14px]">
          Bar Protéiné · Fort-de-France
        </p>
        <h1
          className="font-display font-light text-white leading-[0.95] tracking-[-0.02em]"
          style={{ fontFamily: 'var(--font-display)', fontSize: '58px' }}
        >
          La<br /><em className="italic text-white/60">carte</em>
        </h1>
        <p className="text-[10px] text-white/[0.28] tracking-[0.15em] uppercase mt-5">
          Shakes · Wellness · Énergie · Coffee
        </p>
      </section>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-black/[0.08] px-[60px]">
        <div className="flex gap-0 h-[60px]">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`h-full px-[18px] text-[12px] font-normal tracking-[0.02em] border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-black text-black'
                  : 'border-transparent text-black/60 hover:text-black'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Secondary filter chips */}
      <div className="bg-[#faf9f7] px-[60px] py-4 flex items-center gap-2 flex-wrap">
        <span className="text-[11px] text-black/35 mr-1">Filtrer par :</span>
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`text-[11px] h-7 px-3 rounded-full border transition-colors ${
              activeFilter === f
                ? 'bg-[#3d6b3e] text-white border-[#3d6b3e]'
                : 'bg-transparent text-black/55 border-black/15 hover:border-black/30'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Products */}
      <div className="bg-[#faf9f7] px-[60px] pb-[52px]">
        {activeTab === 'Tout' ? (
          CATEGORY_GROUPS.map(({ label, key, base, grid }) => {
            const items = applyFilter(base, activeFilter);
            if (items.length === 0) return null;
            return (
              <section key={key} className="py-[32px]">
                <SectionTitle title={label} />
                <div className={`grid ${grid} gap-3`}>
                  {items.map(renderCard)}
                </div>
              </section>
            );
          })
        ) : (
          <section className="py-[32px]">
            <SectionTitle title={activeTab} />
            {singleItems.length > 0 ? (
              <div className="grid grid-cols-3 gap-3">
                {singleItems.map(renderCard)}
              </div>
            ) : (
              <p className="text-[12px] text-black/40 py-12 text-center">
                Aucun produit pour ce filtre.
              </p>
            )}
          </section>
        )}
      </div>

      {/* Bilan CTA banner */}
      <div className="mx-[60px] mb-16 rounded-[16px] overflow-hidden bg-[#0a0a0a] flex items-center px-[52px] py-10 gap-10">
        <div className="flex-1">
          <p className="text-[9px] tracking-[0.4em] uppercase text-white/[0.28] mb-[10px]">Bilan Bien-être</p>
          <h3
            className="font-display font-light text-white leading-[1.05]"
            style={{ fontFamily: 'var(--font-display)', fontSize: '34px' }}
          >
            30 minutes<br /><em className="italic text-white/60">offertes</em>
          </h3>
        </div>
        <Link
          to="/bilan-bien-etre"
          className="inline-flex items-center justify-center rounded-full bg-white text-black text-[11px] font-normal tracking-[0.1em] uppercase px-7 h-11 flex-shrink-0 hover:bg-white/90 transition-colors"
        >
          Réserver mon bilan
        </Link>
      </div>
    </div>
  );
};

export default Menu;
