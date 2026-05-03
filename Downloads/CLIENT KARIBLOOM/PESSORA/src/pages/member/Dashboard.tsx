import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowUpRight, MessageCircle, CupSoda } from 'lucide-react';
import { KPI, NumberValue } from '@heroui-pro/react';
import { useAuth } from '../../contexts/AuthContext';
import { useDashboardStats } from '../../hooks/useDashboardStats';
import { useUpcomingEvents } from '../../hooks/useUpcomingEvents';
import { useOrders } from '../../hooks/useOrders';
import {
  DashCard, DashEyebrow, DashPageHeader,
  DashBtn, DashRule, AreaChart,
} from '../../components/dashboard/primitives';
import { DASH_MAIN_PAD } from '../../components/dashboard/layoutClasses';
import { MemberDashboardKpiSkeleton } from '../../components/member/MemberPageSkeleton';

/** 12 derniers mois civils YYYY-MM (ancien → récent). */
function last12MonthKeys(): string[] {
  const keys: string[] = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return keys;
}

function ordersCountsLast12Months(orders: { created_at: string }[]): number[] {
  const keys = last12MonthKeys();
  const map = new Map<string, number>();
  for (const k of keys) map.set(k, 0);
  for (const o of orders) {
    const ym = o.created_at.slice(0, 7);
    if (map.has(ym)) map.set(ym, (map.get(ym) ?? 0) + 1);
  }
  return keys.map((k) => map.get(k) ?? 0);
}

const toChartData = (series: number[]): { value: number }[] =>
  series.map((value) => ({ value }));

const computeTrend = (series: number[]): { trend: 'up' | 'down' | 'neutral'; label: string } => {
  if (series.length < 2) return { trend: 'neutral', label: '—' };
  const last = series[series.length - 1];
  const prev = series[series.length - 2];
  if (prev === 0) return { trend: 'neutral', label: '—' };
  const pct = ((last - prev) / prev) * 100;
  if (Math.abs(pct) < 0.5) return { trend: 'neutral', label: '0.0%' };
  return {
    trend: pct > 0 ? 'up' : 'down',
    label: `${pct > 0 ? '+' : ''}${pct.toFixed(1)}%`,
  };
};

const Dashboard = () => {
  const { user, subscription } = useAuth();
  const { stats, loading: statsLoading } = useDashboardStats();
  const { orders, loading: ordersLoading } = useOrders();
  const { registrations, loading: eventsLoading } = useUpcomingEvents(3);
  const navigate = useNavigate();

  const firstName = user?.firstName || user?.email?.split('@')[0] || 'Membre';
  const prefix = window.location.pathname.startsWith('/demo-espace') ? '/demo-espace' : '/mon-espace';

  const PLAN_LABEL: Record<string, string> = { free: 'Gratuit', ora_plus: 'Óra+' };
  const planLabel = subscription?.plan ? (PLAN_LABEL[subscription.plan] ?? subscription.plan) : '—';

  const endDate = subscription?.endDate
    ? new Date(subscription.endDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  const today = new Date();
  const dayNum = String(today.getDate()).padStart(2, '0');

  const ordersMonthly = useMemo(() => ordersCountsLast12Months(orders), [orders]);
  const heroOrdersChartData = useMemo(
    () => (ordersMonthly.length >= 2 ? ordersMonthly : [0, 1]),
    [ordersMonthly],
  );

  const eventsTrend = useMemo(() => computeTrend(stats.eventsSparkline), [stats.eventsSparkline]);
  const bilansTrend = useMemo(() => computeTrend(stats.bilansSparkline), [stats.bilansSparkline]);
  const ordersTrend = useMemo(() => computeTrend(ordersMonthly), [ordersMonthly]);

  const PERKS: { label: string; on: boolean }[] = [
    { label: 'Tarifs préférentiels boissons',   on: true },
    { label: 'Bilan bien-être personnalisé',    on: true },
    { label: 'Accès privilégié événements',     on: true },
    { label: 'Programme de parrainage Óra+',    on: false },
  ];

  return (
    <div>
      <DashPageHeader
        breadcrumb={`N°${dayNum} · Édition du jour`}
        title={`Bonjour, ${firstName}.`}
        subtitle="Votre espace bien-être personnalisé."
      />

      <div className={DASH_MAIN_PAD}>
        <div className="grid grid-cols-1 gap-[18px] md:grid-cols-12">

          {/* ── Hero éditorial ─────────────────────────────────── */}
          <div className="col-span-1 md:col-span-12">
            <DashCard pad={0} className="overflow-hidden">
              <div className="grid min-h-[220px] grid-cols-1 md:grid-cols-[1.3fr_1fr]">
                {/* Left: greeting */}
                <div className="flex flex-col justify-between p-5 sm:p-8 md:p-10">
                  <div>
                    <h2
                      className="font-display text-[clamp(1.85rem,8vw,3.25rem)] leading-none tracking-[-0.02em] text-noir md:text-[52px]"
                      style={{ margin: 0 }}
                    >
                      Bonjour{' '}
                      <em className="italic text-black/50">{firstName}</em>.
                    </h2>
                    <p className="mt-4 max-w-[420px] text-[14px] leading-relaxed text-black/55 sm:text-[15px]">
                      {statsLoading
                        ? 'Chargement de vos données…'
                        : `Indice bien-être en progression — ${stats.eventsThisQuarter} événement${stats.eventsThisQuarter !== 1 ? 's' : ''} ce trimestre, ${stats.bilansTotal} bilan${stats.bilansTotal !== 1 ? 's' : ''} confirmé${stats.bilansTotal !== 1 ? 's' : ''}.`}
                    </p>
                  </div>
                  <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:gap-[10px]">
                    <DashBtn
                      variant="solid"
                      onClick={() => navigate(`${prefix}/evenements`)}
                      className="justify-center gap-2 sm:justify-start"
                    >
                      Mon agenda <ArrowUpRight size={14} />
                    </DashBtn>
                    <button type="button"
                      onClick={() => navigate(`${prefix}/pessobot`)}
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-noir/15 px-4 py-[10px] min-h-[44px] text-[13px] font-medium text-black/55 transition-all hover:border-noir/30 sm:justify-start"
                    >
                      <MessageCircle size={14} /> PessoBot
                    </button>
                  </div>
                </div>
                {/* Right: chart panel — hidden on mobile */}
                <div className="hidden md:flex p-7 flex-col justify-center border-l border-noir/[0.06] bg-surface-muted">
                  <DashEyebrow className="mb-3">Commandes · 12 mois</DashEyebrow>
                  <AreaChart data={heroOrdersChartData} h={130} stroke="var(--color-noir, #0A0A0A)" />
                  <div className="flex justify-between mt-3">
                    <div>
                      {statsLoading ? (
                        <div className="font-display text-[34px] leading-none text-noir">
                          —<span className="text-[14px] text-black/40 ml-1">évt.</span>
                        </div>
                      ) : (
                        <NumberValue
                          className="font-display text-[34px] leading-none text-noir"
                          value={stats.eventsThisQuarter}
                          maximumFractionDigits={0}
                        >
                          <NumberValue.Suffix>
                            <span className="text-[14px] text-black/40 ml-1">évt.</span>
                          </NumberValue.Suffix>
                        </NumberValue>
                      )}
                      <DashEyebrow className="mt-2">Ce trimestre</DashEyebrow>
                    </div>
                    <div>
                      {statsLoading ? (
                        <div className="font-display italic text-[24px] leading-none text-noir">—</div>
                      ) : (
                        <NumberValue
                          className="font-display italic text-[24px] leading-none text-noir"
                          value={stats.bilansTotal}
                          maximumFractionDigits={0}
                        />
                      )}
                      <DashEyebrow className="mt-2">Bilans</DashEyebrow>
                    </div>
                    <div>
                      <div className="font-display text-[24px] leading-none text-noir">{planLabel}</div>
                      <DashEyebrow className="mt-2">Plan</DashEyebrow>
                    </div>
                  </div>
                </div>
              </div>
            </DashCard>
          </div>

          {/* ── KPI strip (HeroUI Pro) ──────────────────────────── */}
          {statsLoading || ordersLoading ? (
            <MemberDashboardKpiSkeleton />
          ) : (
            <>
          <div className="col-span-1 md:col-span-3">
            <KPI>
              <KPI.Header>
                <KPI.Title>Événements · T2</KPI.Title>
              </KPI.Header>
              <KPI.Content>
                <KPI.Value maximumFractionDigits={0} value={stats.eventsThisQuarter} />
                <KPI.Trend trend={eventsTrend.trend}>
                  {eventsTrend.label}
                </KPI.Trend>
              </KPI.Content>
              <KPI.Chart color="var(--color-noir)" data={toChartData(stats.eventsSparkline)} height={42} />
            </KPI>
          </div>
          <div className="col-span-1 md:col-span-3">
            <KPI>
              <KPI.Header>
                <KPI.Title>Bilans confirmés</KPI.Title>
              </KPI.Header>
              <KPI.Content>
                <KPI.Value maximumFractionDigits={0} value={stats.bilansTotal} />
                <KPI.Trend trend={bilansTrend.trend}>
                  {bilansTrend.label}
                </KPI.Trend>
              </KPI.Content>
              <KPI.Chart color="var(--color-noir)" data={toChartData(stats.bilansSparkline)} height={42} />
            </KPI>
          </div>
          <div className="col-span-1 md:col-span-3">
            <KPI>
              <KPI.Header>
                <KPI.Title>Commandes</KPI.Title>
              </KPI.Header>
              <KPI.Content>
                <KPI.Value maximumFractionDigits={0} value={orders.length} />
                <KPI.Trend trend={ordersTrend.trend}>
                  {ordersTrend.label}
                </KPI.Trend>
              </KPI.Content>
              <KPI.Chart color="var(--color-noir)" data={toChartData(ordersMonthly)} height={42} />
            </KPI>
          </div>
          <div className="col-span-1 md:col-span-3">
            <DashCard className="min-h-[108px] flex flex-col gap-3" pad={18}>
              <DashEyebrow>Plan · {planLabel}</DashEyebrow>
              <div className="font-display leading-tight text-[22px] italic text-noir">
                Renouvellement<br />
                <span className="not-italic text-[16px] text-black/45">{endDate ?? '—'}</span>
              </div>
            </DashCard>
          </div>
            </>
          )}

          {/* ── Events (7) + Abonnement (5) ─────────────────────── */}
          <div className="col-span-1 md:col-span-7">
            <DashCard className="h-full">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="font-display text-[22px] tracking-[-0.01em]">
                  Agenda <em className="italic">à venir</em>
                </h3>
                <DashBtn variant="ghost" size="sm" onClick={() => navigate(`${prefix}/evenements`)} className="shrink-0 self-start sm:self-auto">
                  Tout voir
                </DashBtn>
              </div>

              {eventsLoading ? (
                <p className="text-[12px] text-black/30 py-4">Chargement…</p>
              ) : registrations.length === 0 ? (
                <p className="text-[12px] text-black/30 py-4 leading-relaxed">
                  Aucun événement à venir.{' '}
                  <Link to="/evenements" className="underline text-black/50">Parcourir</Link>
                </p>
              ) : (
                <div>
                  {registrations.map((reg, i) => {
                    const d = new Date(reg.events.date + 'T00:00:00');
                    const dayN = String(d.getDate());
                    const monthS = d.toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '').toUpperCase();
                    return (
                      <div
                        key={reg.id}
                        className={`grid grid-cols-[54px_minmax(0,1fr)] items-start gap-x-[14px] gap-y-2 py-[14px] sm:grid-cols-[54px_minmax(0,1fr)_auto] sm:items-center ${i > 0 ? 'border-t border-noir/[0.06]' : ''}`}
                      >
                        {/* Date tile */}
                        <div className="w-[54px] h-[54px] rounded-[10px] bg-surface-muted border border-noir/[0.06] flex flex-col items-center justify-center flex-shrink-0">
                          <span className="font-display text-[16px] leading-none">{dayN}</span>
                          <span className="text-[8.5px] tracking-[0.14em] text-black/40 mt-[2px]">{monthS}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-[14px] font-medium leading-snug">{reg.events.title}</p>
                          <p className="text-[11.5px] text-black/45 mt-1">
                            {[reg.events.heure?.slice(0, 5), reg.events.location ?? reg.events.meeting_point]
                              .filter(Boolean).join(' · ')}
                          </p>
                        </div>
                        <span className="col-span-2 inline-flex w-fit items-center rounded-full border border-noir/15 px-[10px] py-[5px] text-[9px] font-medium uppercase tracking-[0.14em] text-black/55 sm:col-span-1 sm:col-start-3 sm:row-start-1 sm:w-auto sm:justify-self-end">
                          Confirmé
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </DashCard>
          </div>

          <div className="col-span-1 md:col-span-5">
            <DashCard className="h-full flex flex-col">
              <DashEyebrow className="mb-2">Plan actuel</DashEyebrow>
              <div className="font-display text-[32px] leading-[1.05] tracking-[-0.02em] text-noir">
                {planLabel}<br />
                <em className="italic text-black/45 text-[22px]">
                  {subscription?.status === 'active' ? 'Actif' : subscription?.status ?? '—'}
                </em>
              </div>
              <p className="text-[12.5px] text-black/45 mt-3">
                {endDate ? `Renouvellement le ${endDate}` : 'Aucune date de renouvellement'}
              </p>
              <DashRule className="my-5" />
              <div className="flex flex-col gap-[10px] flex-1">
                {PERKS.map((perk) => (
                  <div
                    key={perk.label}
                    className={`flex items-center gap-[10px] text-[12px] ${perk.on ? 'text-black/70' : 'text-black/20'}`}
                  >
                    <span className={`text-[10px] ${perk.on ? 'text-black/40' : 'text-black/15'}`}>✓</span>
                    {perk.label}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => navigate(`${prefix}/abonnement`)}
                className="mt-6 w-full justify-center min-h-[44px] inline-flex items-center gap-2 rounded-[2px] border border-noir/15 bg-white px-5 py-3 text-[10px] font-normal uppercase tracking-[0.12em] text-black/55 transition-colors hover:border-noir/30 hover:text-noir"
              >
                Gérer l'abonnement <ArrowUpRight size={14} />
              </button>
            </DashCard>
          </div>

          {/* ── Mes dernières commandes ─────────────────────────── */}
          <div className="col-span-1 md:col-span-12">
            <DashCard>
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="font-display text-[22px] tracking-[-0.01em]">
                  Mes dernières <em className="italic">commandes</em>
                </h3>
                <DashBtn variant="ghost" size="sm" onClick={() => navigate(`${prefix}/historique`)} className="shrink-0 self-start sm:self-auto">
                  Toute l'histoire <ArrowUpRight size={14} />
                </DashBtn>
              </div>

              {ordersLoading ? (
                <p className="text-[12px] text-black/30 py-4">Chargement…</p>
              ) : orders.length === 0 ? (
                <p className="text-[12px] text-black/30 py-4 leading-relaxed">
                  Aucune commande pour le moment.{' '}
                  <Link to="/menu" className="underline text-black/50">Parcourir le catalogue</Link>
                </p>
              ) : (
                <div>
                  {orders.slice(0, 3).map((order, i) => {
                    const itemNames = order.order_items.map(item => item.product_name).join(', ');
                    const date = new Date(order.created_at).toLocaleDateString('fr-FR', {
                      day: 'numeric', month: 'short'
                    }).replace('.', '');
                    const pickupLabel = order.pickup_time
                      ? new Date(order.pickup_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
                      : null;
                    const statusColor =
                      order.status === 'pending' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                      order.status === 'preparing' ? 'bg-sky-50 text-sky-700 border border-sky-200' :
                      order.status === 'ready' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                      'bg-noir/[0.05] text-black/45';
                    const statusLabel =
                      order.status === 'pending' ? 'En attente' :
                      order.status === 'preparing' ? 'En préparation' :
                      order.status === 'ready' ? 'Prêt' :
                      order.status === 'completed' ? 'Retiré' :
                      order.status === 'cancelled' ? 'Annulé' : order.status;
                    return (
                      <div
                        key={order.id}
                        className={`grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-[14px] gap-y-2 py-[14px] ${i > 0 ? 'border-t border-noir/[0.06]' : ''}`}
                      >
                        <div className="w-[38px] h-[38px] rounded-[2px] bg-noir/[0.05] flex items-center justify-center flex-shrink-0">
                          <CupSoda size={18} strokeWidth={1.35} className="text-black/45" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-[13px] leading-snug">{itemNames || '—'}</p>
                          <p className="text-[10.5px] text-black/45 mt-[2px]">
                            {date}
                            {pickupLabel ? ` · Retrait ${pickupLabel}` : ''}
                            {order.status !== 'completed' && order.status !== 'cancelled' && order.status !== 'pending' ? (
                              <span className={`ml-2 inline-flex items-center px-[6px] py-[2px] text-[8px] font-medium uppercase tracking-[0.1em] rounded-[2px] ${statusColor}`}>
                                {statusLabel}
                              </span>
                            ) : null}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[14px] font-normal text-noir tabular-nums">
                            {order.total.toFixed(2).replace('.', ',')}€
                          </span>
                          <Link
                            to="/menu"
                            className="inline-flex items-center justify-center w-[32px] h-[32px] rounded-full border border-noir/15 text-black/40 hover:text-noir hover:border-noir/30 transition-colors"
                            aria-label={`Commander à nouveau — ${itemNames}`}
                          >
                            <ArrowUpRight size={13} />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                  <div className="border-t border-noir/[0.06] pt-4 mt-1">
                    <Link
                      to="/menu"
                      className="inline-flex items-center gap-1.5 text-[10.5px] text-black/40 hover:text-noir transition-colors"
                    >
                      <ArrowUpRight size={12} /> Commander à nouveau
                    </Link>
                  </div>
                </div>
              )}
            </DashCard>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;
