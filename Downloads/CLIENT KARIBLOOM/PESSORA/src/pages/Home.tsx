import { Link, useNavigate } from 'react-router-dom';
import { ArrowBtn } from '../components/ui/ArrowBtn';
import { ImageCard } from '../components/ui/ImageCard';
import { SectionTitle } from '../components/ui/SectionTitle';
import { ProductCard } from '../components/ui/ProductCard';
import { shakesItems } from '../data/menuData';

const FEATURED_SHAKES = shakesItems.slice(0, 4);

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section
        className="relative flex items-end overflow-hidden"
        style={{ height: '86vh', minHeight: '520px', background: '#0a0a0a' }}
      >
        <div
          className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse at 65% 40%, rgba(30,58,30,0.45) 0%, transparent 60%), linear-gradient(155deg, #1a2e1a 0%, #0a0a0a 55%, #111 100%)' }}
        />
        <div className="relative z-10 px-[60px] pb-20">
          <p className="text-[9px] font-normal tracking-[0.45em] uppercase text-white/35 mb-[18px]">
            Bar Protéiné · Fort-de-France
          </p>
          <h1
            className="font-display font-light text-white leading-[0.92] tracking-[-0.02em] mb-11"
            style={{ fontFamily: 'var(--font-display)', fontSize: '80px' }}
          >
            Nourris<br /><em className="italic text-white/65">l'essentiel</em>
          </h1>
          <ArrowBtn onDark size="lg" onPress={() => navigate('/menu')} />
        </div>
      </section>

      {/* Nos univers */}
      <section className="bg-[#faf9f7] px-[60px] py-[72px]">
        <SectionTitle title="Nos univers" linkLabel="Tout explorer" linkTo="/menu" />
        <div className="grid grid-cols-3 gap-[14px]">
          <ImageCard eyebrow="Nutrition" title="Shakes &" titleEm="gauffres" bgClass="bg-gradient-to-b from-[#1e3a1e] to-[#0a0a0a]" onPress={() => navigate('/menu')} />
          <ImageCard eyebrow="Communauté" title="Run" titleEm="Club" bgClass="bg-gradient-to-b from-[#111] to-[#1c2c1c]" onPress={() => navigate('/evenements')} />
          <ImageCard eyebrow="Bien-être" title="Bilan" titleEm="30 min" bgClass="bg-gradient-to-b from-[#0a0a0a] to-[#1a1a1a]" onPress={() => navigate('/bilan-bien-etre')} />
        </div>
      </section>

      {/* Découvrez nos shakes */}
      <section className="bg-white px-[60px] py-[72px]">
        <SectionTitle title="Découvrez nos shakes :" subtitle="Protéines haute qualité, fabriquées à Fort-de-France" linkLabel="Voir la carte" linkTo="/menu" />
        <div className="grid grid-cols-4 gap-3">
          {FEATURED_SHAKES.map((s) => (
            <ProductCard
              key={s.id}
              tag="Shakes Protéinés"
              name={s.name}
              description={s.description}
              macros={[s.protein ? `${s.protein}g protéines` : '', s.calories ? `${s.calories} kcal` : ''].filter(Boolean).join(' · ') || undefined}
              price={`${s.price}€`}
              bgClass="bg-gradient-to-b from-[#2c4e2d] to-[#1a3a1b]"
              linkTo={`/menu/${s.id}`}
            />
          ))}
        </div>
      </section>

      {/* Section vidéo Événements */}
      <section
        className="relative flex items-center justify-center overflow-hidden"
        style={{ height: '72vh', minHeight: '420px' }}
      >
        {/* En production : remplacer par <video autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover" /> */}
        <div
          className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse at 60% 40%, rgba(30,60,30,0.4) 0%, transparent 65%), linear-gradient(160deg, #0f1f0f 0%, #0a0a0a 40%, #111 70%, #0d1a0d 100%)' }}
        />
        <div
          className="relative z-10 mx-4 text-center rounded-[20px] px-16 py-[52px]"
          style={{
            background: 'rgba(255,255,255,0.07)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.12)',
            maxWidth: '620px',
          }}
        >
          <span className="inline-block text-[9px] font-normal tracking-[0.2em] uppercase bg-[#3d6b3e] text-white px-[14px] py-[5px] rounded-[4px] mb-6">
            Événements · Run Club
          </span>
          <h2
            className="font-display font-light text-white leading-[1.05] mb-7"
            style={{ fontFamily: 'var(--font-display)', fontSize: '46px' }}
          >
            Rejoins la<br />communauté Pessóra
          </h2>
          <Link
            to="/evenements"
            className="inline-flex items-center justify-center rounded-full bg-white text-black text-[11px] font-normal tracking-[0.12em] uppercase px-8 h-11 hover:bg-white/90 transition-colors"
          >
            Voir les événements
          </Link>
        </div>
      </section>

      {/* Nos actualités */}
      <section className="bg-[#faf9f7] px-[60px] py-[72px]">
        <SectionTitle title="Nos actualités" />
        <div className="grid grid-cols-2 gap-[14px]">
          <ImageCard eyebrow="Bilan Bien-être" title="30 minutes" titleEm="offertes" bgClass="bg-gradient-to-b from-[#1e3a1e] to-[#0f1f0f]" aspectRatio="aspect-[16/9]" onPress={() => navigate('/bilan-bien-etre')} />
          <ImageCard eyebrow="Pop-up · GigaFit" title="Nouveau" titleEm="point de vente" bgClass="bg-gradient-to-b from-[#0a0a0a] to-[#1a1a1a]" aspectRatio="aspect-[16/9]" onPress={() => navigate('/evenements')} />
        </div>
      </section>
    </div>
  );
};

export default Home;
