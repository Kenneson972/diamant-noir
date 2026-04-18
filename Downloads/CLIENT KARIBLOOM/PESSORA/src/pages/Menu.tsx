import { useState } from 'react';
import { Link } from 'react-router-dom';
import { SectionTitle } from '../components/ui/SectionTitle';
import { ProductCard } from '../components/ui/ProductCard';

const FILTERS = ['Tout', 'Protéine ↑', 'Faible calories', 'Végétalien', 'Sans lactose', 'Énergie'];

const SHAKES = [
  { tag: 'Protéine', name: 'Vanilla Boost', description: 'Notes vanille douce', macros: '30g protéines · 220 kcal', price: '6,90€', bgClass: 'bg-gradient-to-b from-[#2c4e2d] to-[#1a3a1b]' },
  { tag: 'Énergie', name: 'Chocolat Power', description: 'Cacao intense, magnésium', macros: '28g protéines · 240 kcal', price: '6,90€', bgClass: 'bg-gradient-to-b from-[#3d6b3e] to-[#2a4a2b]' },
  { tag: 'Légèreté', name: 'Fraise Légèreté', description: 'Fruité & rafraîchissant', macros: '22g protéines · 180 kcal', price: '6,90€', bgClass: 'bg-gradient-to-b from-[#1a2e1a] to-[#0f1f10]' },
  { tag: 'Récup', name: 'Mangue Caraïbe', description: 'Tropical, post-effort', macros: '25g protéines · 200 kcal', price: '6,90€', bgClass: 'bg-gradient-to-b from-[#4a7c35] to-[#3a6028]' },
  { tag: 'Énergie', name: 'Café Matin', description: 'Caféine naturelle & protéines', macros: '26g protéines · 210 kcal', price: '7,50€', bgClass: 'bg-gradient-to-b from-[#1e3a1e] to-[#0a1a0a]' },
];

const GAUFFRES = [
  { tag: 'Gauffre', name: 'Gauffre Nature', description: 'Sans sucre ajouté, croustillante', macros: '20g protéines · 190 kcal', price: '4,50€', bgClass: 'bg-gradient-to-b from-[#111] to-[#1a1a1a]' },
  { tag: 'Gauffre', name: 'Gauffre Chocolat', description: 'Pépites cacao, moelleuse', macros: '18g protéines · 210 kcal', price: '4,90€', bgClass: 'bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a]' },
  { tag: 'Gauffre', name: 'Gauffre Coco', description: "Noix de coco, éclats d'amande", macros: '17g protéines · 205 kcal', price: '4,90€', bgClass: 'bg-gradient-to-b from-[#0f0f0f] to-[#1a1a1a]' },
];

const Menu = () => {
  const [activeFilter, setActiveFilter] = useState('Tout');
  const [activeTab, setActiveTab] = useState('Tout');

  const tabs = ['Tout', 'Shakes protéinés', 'Gauffres', 'Compléments', 'Offres'];

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
          Shakes · Gauffres · Compléments
        </p>
      </section>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-black/[0.08] px-[60px]">
        <div className="flex gap-0 h-[60px]">
          {tabs.map((tab) => (
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

      {/* Shakes section */}
      <section className="px-[60px] py-[32px] pb-[52px] bg-[#faf9f7]">
        <SectionTitle title="Shakes protéinés" linkLabel="Tout voir" linkTo="/menu" />
        <div className="grid grid-cols-5 gap-3">
          {SHAKES.map((s) => (
            <ProductCard key={s.name} {...s} />
          ))}
        </div>
      </section>

      {/* Gauffres section */}
      <section className="px-[60px] pb-[52px] bg-[#faf9f7]">
        <SectionTitle title="Gauffres maison" />
        <div className="grid grid-cols-5 gap-3">
          {GAUFFRES.map((g) => (
            <ProductCard key={g.name} {...g} />
          ))}
        </div>
      </section>

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
