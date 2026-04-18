// src/pages/member/Dashboard.tsx
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@heroui/react';
import { TrendingUp } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const KPI = ({
  label,
  value,
  sub,
  green = false,
  trend,
}: {
  label: string;
  value: string;
  sub: string;
  green?: boolean;
  trend?: string;
}) => (
  <Card className="bg-white rounded-[14px] border border-black/[0.06] shadow-none">
    <CardContent className="p-[22px] gap-0">
      <p className="text-[9px] tracking-[0.25em] uppercase text-black/35 mb-[10px]">{label}</p>
      <p
        className={`font-display font-light text-[42px] leading-none mb-1.5 ${green ? 'text-[#3d6b3e]' : 'text-black'}`}
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {value}
      </p>
      <p className="text-[10px] text-black/30">{sub}</p>
      {trend && (
        <p className="flex items-center gap-1 text-[10px] text-[#3d6b3e] mt-1">
          <TrendingUp size={12} /> {trend}
        </p>
      )}
    </CardContent>
  </Card>
);

const EventRow = ({
  day,
  month,
  name,
  meta,
  status,
}: {
  day: string;
  month: string;
  name: string;
  meta: string;
  status: 'confirmed' | 'pending';
}) => (
  <div className="flex items-center gap-[14px] p-[14px] rounded-[10px] bg-[#faf9f7] hover:bg-[#f0f0ee] transition-colors cursor-pointer">
    <div className="w-11 h-11 rounded-[10px] bg-[#0a0a0a] flex flex-col items-center justify-center flex-shrink-0">
      <span className="text-[16px] font-normal text-white leading-none">{day}</span>
      <span className="text-[8px] tracking-[0.12em] uppercase text-white/50">{month}</span>
    </div>
    <div className="flex-1">
      <p className="text-[12px] font-normal text-black">{name}</p>
      <p className="text-[10px] text-black/38">{meta}</p>
    </div>
    <span
      className={`text-[8px] tracking-[0.15em] uppercase px-2 py-[3px] rounded-[3px] ${
        status === 'confirmed'
          ? 'bg-[rgba(61,107,62,0.1)] text-[#3d6b3e]'
          : 'bg-black/5 text-black/40'
      }`}
    >
      {status === 'confirmed' ? 'Confirmé' : 'En attente'}
    </span>
  </div>
);

const Dashboard = () => {
  const { user } = useAuth();
  const firstName = user?.firstName || user?.email?.split('@')[0] || 'Membre';

  return (
    <div>
      <h1
        className="font-display font-light text-[38px] text-black leading-none mb-1"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        Bonjour,{' '}
        <em className="italic text-black/40">{firstName}</em>
      </h1>
      <p className="text-[11px] text-black/35 tracking-[0.05em] mb-9">
        {new Date().toLocaleDateString('fr-FR', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })}
      </p>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3 mb-9">
        <KPI label="Événements" value="7" sub="ce trimestre" trend="+2 vs dernier" />
        <KPI label="Run Club" value="12" sub="sessions complétées" green trend="Régulière" />
        <KPI label="Bilans" value="3" sub="bilans réalisés" />
        <KPI label="Abonnement" value="Premium" sub="Renouvellement : 1 mai" />
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-[1.4fr_1fr] gap-4 mb-4">
        {/* Abonnement card */}
        <div className="bg-[#0a0a0a] rounded-[14px] p-6">
          <div className="flex justify-between items-start mb-5">
            <h3
              className="font-display font-light text-white text-[24px] leading-[1.0]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Plan<br />
              <em className="italic text-white/55">Premium</em>
            </h3>
            <span className="text-[8px] tracking-[0.2em] uppercase bg-[#3d6b3e] text-white px-[10px] py-1 rounded-[3px]">
              Actif
            </span>
          </div>
          {[
            { label: 'Shakes à -10%', on: true },
            { label: 'Accès Run Club illimité', on: true },
            { label: '2 bilans/mois offerts', on: true },
            { label: 'Accès ateliers prioritaire', on: false },
          ].map((perk) => (
            <div
              key={perk.label}
              className={`flex items-center gap-2.5 text-[11px] mb-2.5 ${
                perk.on ? 'text-white/85' : 'text-white/25'
              }`}
            >
              <span className={perk.on ? 'text-[#3d6b3e]' : 'text-white/20'}>✓</span>
              {perk.label}
            </div>
          ))}
          <p className="text-[10px] text-white/22 mt-4">
            Renouvellement automatique · 1 mai 2026
          </p>
        </div>

        {/* Prochains événements */}
        <Card className="bg-white rounded-[14px] border border-black/[0.06] shadow-none">
          <CardContent className="p-6 gap-0">
            <div className="flex justify-between items-center mb-5">
              <p className="text-[12px] font-normal text-black">Mes prochains événements</p>
              <Link
                to="/mon-espace/historique"
                className="text-[10px] text-black/40 border-b border-black/20 pb-px"
              >
                Tout voir
              </Link>
            </div>
            <div className="flex flex-col gap-3">
              <EventRow
                day="23"
                month="Avr"
                name="Run Club · Mercredi"
                meta="6h00 · Départ Pessóra"
                status="confirmed"
              />
              <EventRow
                day="28"
                month="Avr"
                name="Bilan Bien-être"
                meta="10h30 · Pessóra Bar"
                status="confirmed"
              />
              <EventRow
                day="3"
                month="Mai"
                name="Pop-up GigaFit"
                meta="9h00 – 13h00 · Lamentin"
                status="pending"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Commande rapide */}
      <Card className="bg-white rounded-[14px] border border-black/[0.06] shadow-none">
        <CardContent className="p-6 gap-0">
          <div className="flex justify-between items-center mb-5">
            <p className="text-[12px] font-normal text-black">Commander à nouveau</p>
            <Link
              to="/menu"
              className="text-[10px] text-black/40 border-b border-black/20 pb-px"
            >
              Voir la carte
            </Link>
          </div>
          <div className="flex flex-col gap-2.5">
            {[
              { name: 'Vanilla Boost', price: '6,21€', bg: 'from-[#2c4e2d] to-[#1a3a1b]' },
              { name: 'Chocolat Power', price: '6,21€', bg: 'from-[#3d6b3e] to-[#2a4a2b]' },
              { name: 'Gauffre Nature', price: '4,05€', bg: 'from-[#111] to-[#1a1a1a]' },
            ].map((item) => (
              <div
                key={item.name}
                className="flex items-center gap-3 p-3 rounded-[10px] bg-[#faf9f7] hover:bg-[#f0f0ee] transition-colors cursor-pointer"
              >
                <div
                  className={`w-8 h-8 rounded-lg bg-gradient-to-b ${item.bg} flex-shrink-0`}
                />
                <p className="flex-1 text-[12px] font-normal text-black">{item.name}</p>
                <p className="text-[12px] text-black/40">
                  {item.price}{' '}
                  <span className="text-[9px] text-black/25">-10%</span>
                </p>
                <button className="w-7 h-7 rounded-full bg-black text-white flex items-center justify-center text-[18px] leading-none flex-shrink-0">
                  +
                </button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
