// src/pages/member/Dashboard.tsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useDashboardStats } from '../../hooks/useDashboardStats';
import { useUpcomingEvents } from '../../hooks/useUpcomingEvents';
import { supabase } from '../../lib/supabaseClient';
import type { Product } from '../../types/database';

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
  <div className="bg-white rounded-[2px] border border-black/[0.06] p-[22px]">
    <p className="text-[9px] tracking-[0.25em] uppercase text-black/35 mb-[10px]">{label}</p>
    <p
      className={`font-display font-normal text-[42px] leading-none mb-1.5 ${green ? 'text-[oklch(57%_0.065_68)]' : 'text-black'}`}
      style={{ fontFamily: 'var(--font-display)' }}
    >
      {value}
    </p>
    <p className="text-[10px] text-black/30">{sub}</p>
    {trend && (
      <p className="flex items-center gap-1 text-[10px] text-[oklch(57%_0.065_68)] mt-1">
        <TrendingUp size={12} /> {trend}
      </p>
    )}
  </div>
);

const EventRow = ({
  day,
  month,
  name,
  meta,
}: {
  day: string;
  month: string;
  name: string;
  meta: string;
}) => (
  <div className="flex items-center gap-[14px] p-[14px] rounded-[2px] bg-white hover:bg-black/[0.04] transition-colors">
    <div className="w-11 h-11 rounded-[2px] bg-[#0a0a0a] flex flex-col items-center justify-center flex-shrink-0">
      <span className="text-[16px] font-normal text-white leading-none">{day}</span>
      <span className="text-[8px] tracking-[0.12em] uppercase text-white/50">{month}</span>
    </div>
    <div className="flex-1">
      <p className="text-[12px] font-normal text-black">{name}</p>
      <p className="text-[10px] text-black/38">{meta}</p>
    </div>
    <span className="text-[8px] tracking-[0.15em] uppercase px-2 py-[3px] rounded-[3px] bg-[oklch(75%_0.085_68)/10] text-[oklch(57%_0.065_68)]">
      Confirmé
    </span>
  </div>
);

const Dashboard = () => {
  const { user, subscription } = useAuth();
  const { stats, loading: statsLoading } = useDashboardStats();
  const { registrations, loading: eventsLoading } = useUpcomingEvents(3);
  const [products, setProducts] = useState<Product[]>([]);

  const firstName = user?.firstName || user?.email?.split('@')[0] || 'Membre';

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('products')
      .select('*')
      .eq('active', true)
      .in('category', ['shakes', 'wellness'])
      .order('name', { ascending: true })
      .limit(3)
      .then(({ data }: { data: Product[] | null }) => {
        setProducts(data ?? []);
      });
  }, []);

  const planLabel = subscription?.plan
    ? subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)
    : '—';

  const endDate = subscription?.endDate
    ? new Date(subscription.endDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
    : '—';

  return (
    <div>
      <h1
        className="font-display font-normal text-[38px] text-black leading-none mb-1"
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
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-9">
        <KPI
          label="Événements"
          value={statsLoading ? '…' : String(stats.eventsThisQuarter)}
          sub="ce trimestre"
        />
        <KPI
          label="Bilans"
          value={statsLoading ? '…' : String(stats.bilansTotal)}
          sub="bilans confirmés"
          green={stats.bilansTotal > 0}
        />
        <KPI
          label="Abonnement"
          value={planLabel}
          sub={subscription?.endDate ? `Renouvellement : ${endDate}` : 'Actif'}
        />
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4 mb-4">
        {/* Abonnement card */}
        <div className="bg-[#0a0a0a] rounded-[2px] p-6">
          <div className="flex justify-between items-start mb-5">
            <h3
              className="font-display font-normal text-white text-[24px] leading-[1.0]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Plan<br />
              <em className="italic text-white/55">{planLabel}</em>
            </h3>
            <span className="text-[8px] tracking-[0.2em] uppercase bg-[oklch(8%_0.005_55)] text-white px-[10px] py-1 rounded-[3px]">
              {subscription?.status === 'active' ? 'Actif' : subscription?.status ?? '—'}
            </span>
          </div>
          {[
            { label: 'Shakes à -10%', on: true },
            { label: '2 bilans/mois offerts', on: true },
            { label: 'Accès ateliers prioritaire', on: true },
            { label: 'Programme de parrainage Óra+', on: false },
          ].map((perk) => (
            <div
              key={perk.label}
              className={`flex items-center gap-2.5 text-[11px] mb-2.5 ${perk.on ? 'text-white/85' : 'text-white/25'}`}
            >
              <span className={perk.on ? 'text-[oklch(57%_0.065_68)]' : 'text-white/20'}>✓</span>
              {perk.label}
            </div>
          ))}
          <p className="text-[10px] text-white/22 mt-4">
            {subscription?.autoRenew ? 'Renouvellement automatique' : 'Sans renouvellement automatique'}
            {subscription?.endDate ? ` · ${endDate}` : ''}
          </p>
        </div>

        {/* Prochains événements */}
        <div className="bg-white rounded-[2px] border border-black/[0.06] p-6">
          <div className="flex justify-between items-center mb-5">
            <p className="text-[12px] font-normal text-black">Mes prochains événements</p>
            <Link
              to="/evenements"
              className="text-[10px] text-black/40 border-b border-black/20 pb-px"
            >
              Voir tout
            </Link>
          </div>
          {eventsLoading ? (
            <p className="text-[11px] text-black/30">Chargement…</p>
          ) : registrations.length === 0 ? (
            <p className="text-[11px] text-black/30 leading-relaxed">
              Aucun événement à venir.{' '}
              <Link to="/evenements" className="underline hover:text-black transition-colors">
                Voir les événements
              </Link>
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {registrations.map((reg) => {
                const d = new Date(reg.events.date + 'T00:00:00');
                return (
                  <EventRow
                    key={reg.id}
                    day={String(d.getDate())}
                    month={d.toLocaleDateString('fr-FR', { month: 'short' })}
                    name={reg.events.title}
                    meta={[
                      reg.events.heure?.slice(0, 5),
                      reg.events.location ?? reg.events.meeting_point,
                    ].filter(Boolean).join(' · ')}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Commander à nouveau */}
      <div className="bg-white rounded-[2px] border border-black/[0.06] p-6">
        <div className="flex justify-between items-center mb-5">
          <p className="text-[12px] font-normal text-black">Commander à nouveau</p>
          <Link
            to="/menu"
            className="text-[10px] text-black/40 border-b border-black/20 pb-px"
          >
            Voir la carte
          </Link>
        </div>
        {products.length === 0 ? (
          <p className="text-[11px] text-black/30">Chargement des produits…</p>
        ) : (
          <div className="flex flex-col gap-2.5">
            {products.map((product) => (
              <Link
                key={product.id}
                to="/menu"
                className="flex items-center gap-3 p-3 rounded-[2px] bg-white hover:bg-black/[0.04] transition-colors"
              >
                <div className="w-8 h-8 rounded-[2px] bg-gradient-to-b from-[oklch(22%_0.005_55)] to-[oklch(11%_0.004_55)] flex-shrink-0" />
                <p className="flex-1 text-[12px] font-normal text-black">{product.name}</p>
                <p className="text-[12px] text-black/40">
                  {product.price ? `${product.price.toFixed(2).replace('.', ',')}€` : '—'}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
