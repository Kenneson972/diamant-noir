import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, ArrowUpRight, Users, CalendarDays, Package, Heart, CupSoda } from 'lucide-react';
import { KPI, NumberValue, TrendChip } from '@heroui-pro/react';
import { supabase } from '../../lib/supabaseClient';
import {
  DashCard, DashEyebrow, DashPageHeader,
  DashBtn, DashRule, DashStatusBadge,
  AreaChart,
} from '../../components/dashboard/primitives';
import { DASH_MAIN_PAD } from '../../components/dashboard/layoutClasses';
import type { OrderWithItems } from '../../hooks/useOrders';

const STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  preparing: 'En préparation',
  ready: 'Prêt',
  completed: 'Retiré',
  cancelled: 'Annulé',
};

const STATUS_ACTIONS: Record<string, { label: string; next: string } | null> = {
  pending: { label: 'Préparer', next: 'preparing' },
  preparing: { label: 'Marquer prêt', next: 'ready' },
  ready: { label: 'Retiré', next: 'completed' },
  completed: null,
  cancelled: null,
};

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

interface OverviewStats {
  totalMembers: number;
  activeSubscriptions: number;
  newMembersThisMonth: number;
  nextEvent: { title: string; date: string; registrationCount: number; cap: number } | null;
  totalProducts: number;
}

interface EventRow {
  id: string;
  title: string;
  date: string;
  heure: string | null;
  registration_count: number;
  capacity: number | null;
  active: boolean;
}

interface ExpiredSub {
  userId: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  expiredSince: string; // updated_at de la subscription
}

// Static placeholder series (no revenue DB in PESSORA)
const ACQUISITION = [34, 41, 38, 52, 48, 57, 63, 70, 66, 72, 78, 82];
const MONTHS_SHORT = ['Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc', 'Jan', 'Fév', 'Mar', 'Avr'];

const ACTIVITY = [
  { icon: Users, text: 'Nouveau membre inscrit', ago: 'il y a 12 min' },
  { icon: CalendarDays, text: 'Inscription : prochain événement', ago: 'il y a 38 min' },
  { icon: Package, text: 'Produit mis à jour', ago: 'il y a 1 h' },
  { icon: Heart, text: 'Bilan demandé', ago: 'il y a 3 h' },
  { icon: Users, text: 'Renouvellement abonnement', ago: 'il y a 4 h' },
];

const AdminOverview = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<OverviewStats>({
    totalMembers: 0,
    activeSubscriptions: 0,
    newMembersThisMonth: 0,
    nextEvent: null,
    totalProducts: 0,
  });
  const [events, setEvents] = useState<EventRow[]>([]);
  const [pendingOrders, setPendingOrders] = useState<OrderWithItems[]>([]);
  const [expiredSubs, setExpiredSubs] = useState<ExpiredSub[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
    const today = new Date().toISOString().split('T')[0];

    Promise.all([
      db.from('profiles').select('id', { count: 'exact' }).neq('role', 'admin'),
      db.from('subscriptions').select('id', { count: 'exact' }).eq('status', 'active'),
      db.from('profiles').select('id', { count: 'exact' }).gte('created_at', monthStart).neq('role', 'admin'),
      db.from('events')
        .select('id, title, date, heure, places_max, active, event_registrations(count)')
        .eq('active', true)
        .gte('date', today)
        .order('date', { ascending: true })
        .limit(4),
      db.from('products').select('id', { count: 'exact' }).eq('active', true),
      db.from('orders')
        .select('*, order_items(*)')
        .in('status', ['pending', 'preparing', 'ready'])
        .order('pickup_time', { ascending: true }),
      db.from('subscriptions')
        .select('user_id, updated_at, profiles!inner(first_name, last_name, email)')
        .eq('status', 'expired')
        .order('updated_at', { ascending: false })
        .limit(10),
    ]).then(([membersRes, subsRes, newMembersRes, eventsRes, productsRes, ordersRes, expiredRes]: [
      { count: number | null },
      { count: number | null },
      { count: number | null },
      { data: Array<{ id: string; title: string; date: string; heure: string | null; places_max: number | null; active: boolean; event_registrations: { count: number | string }[] }> | null },
      { count: number | null },
      { data: OrderWithItems[] | null },
      { data: Array<{ user_id: string; updated_at: string; profiles: { first_name: string | null; last_name: string | null; email: string | null } | null }> | null },
    ]) => {
      const evList = (eventsRes.data ?? []).map((e) => ({
        id: e.id,
        title: e.title,
        date: e.date,
        heure: e.heure,
        registration_count: Number(e.event_registrations?.[0]?.count ?? 0),
        capacity: e.places_max,
        active: e.active,
      }));

      const nextEv = evList[0]
        ? {
            title: evList[0].title,
            date: evList[0].date,
            registrationCount: evList[0].registration_count,
            cap: evList[0].capacity ?? 0,
          }
        : null;

      setStats({
        totalMembers: membersRes.count ?? 0,
        activeSubscriptions: subsRes.count ?? 0,
        newMembersThisMonth: newMembersRes.count ?? 0,
        nextEvent: nextEv,
        totalProducts: productsRes.count ?? 0,
      });
      setEvents(evList);
      setPendingOrders((ordersRes.data ?? []) as OrderWithItems[]);
      const expiredList = ((expiredRes as any).data ?? []).map((row: any) => ({
        userId: row.user_id,
        firstName: row.profiles?.first_name ?? null,
        lastName: row.profiles?.last_name ?? null,
        email: row.profiles?.email ?? null,
        expiredSince: row.updated_at,
      }));
      setExpiredSubs(expiredList);
      setLoading(false);
    });
  }, []);

  const handleOrderAction = async (orderId: string, nextStatus: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('orders')
      .update({ status: nextStatus, ...(nextStatus === 'completed' ? { picked_up_at: new Date().toISOString() } : {}) })
      .eq('id', orderId);
    // Optimistic update
    setPendingOrders((prev) =>
      nextStatus === 'completed'
        ? prev.filter((o) => o.id !== orderId)
        : prev.map((o) => (o.id === orderId ? { ...o, status: nextStatus } as OrderWithItems : o)),
    );
  };

  const L = loading;

  return (
    <div>
      <DashPageHeader
        breadcrumb="Administration"
        title="Vue d'ensemble"
        subtitle="Indicateurs clés · Événements · Activité"
        action={
          <DashBtn onClick={() => navigate('/admin/evenements')} className="gap-2">
            <Plus size={14} /> Nouvel événement
          </DashBtn>
        }
      />

      <div className={DASH_MAIN_PAD}>
        <div className="grid grid-cols-1 gap-[18px] md:grid-cols-12">

          {/* ── KPI strip (HeroUI Pro) ────────────────────────────── */}
          <div className="col-span-1 md:col-span-3">
            <KPI>
              <KPI.Header>
                <KPI.Title>Total membres</KPI.Title>
              </KPI.Header>
              <KPI.Content>
                <KPI.Value maximumFractionDigits={0} value={L ? 0 : stats.totalMembers} />
                <KPI.Trend trend={computeTrend(ACQUISITION).trend}>
                  {computeTrend(ACQUISITION).label}
                </KPI.Trend>
              </KPI.Content>
              <KPI.Chart color="var(--color-noir)" data={toChartData(ACQUISITION)} height={42} />
            </KPI>
          </div>
          <div className="col-span-1 md:col-span-3">
            <KPI>
              <KPI.Header>
                <KPI.Title>Abonnements actifs</KPI.Title>
              </KPI.Header>
              <KPI.Content>
                <KPI.Value maximumFractionDigits={0} value={L ? 0 : stats.activeSubscriptions} />
              </KPI.Content>
              <KPI.Chart
                color="var(--color-noir)"
                data={toChartData([8, 9, 8, 10, 11, 12, 13, 14])}
                height={42}
              />
            </KPI>
          </div>
          <div className="col-span-1 md:col-span-3">
            <KPI>
              <KPI.Header>
                <KPI.Title>Nouveaux ce mois</KPI.Title>
              </KPI.Header>
              <KPI.Content>
                <KPI.Value maximumFractionDigits={0} value={L ? 0 : stats.newMembersThisMonth} />
                <KPI.Trend trend={computeTrend(ACQUISITION.slice(-6)).trend}>
                  {computeTrend(ACQUISITION.slice(-6)).label}
                </KPI.Trend>
              </KPI.Content>
              <KPI.Chart
                color="var(--color-noir)"
                data={toChartData(ACQUISITION.slice(-6))}
                height={42}
              />
            </KPI>
          </div>
          {/* Dark card: next event — identité éditoriale PessÓra, conservée */}
          <div className="col-span-1 md:col-span-3">
            {stats.nextEvent ? (
              <DashCard dark pad={18} className="min-h-[108px] flex flex-col justify-between">
                <DashEyebrow light>Prochain événement</DashEyebrow>
                <div>
                  <div className="font-display text-[18px] leading-snug text-[#F5F2EC] mt-2 line-clamp-2">
                    {stats.nextEvent.title}
                  </div>
                  <div className="flex justify-between items-end mt-3">
                    <span className="italic font-display text-[14px] text-white/60">
                      {new Date(stats.nextEvent.date + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                    </span>
                    <span className="text-[11px] font-medium text-white/70">
                      {stats.nextEvent.registrationCount}/{stats.nextEvent.cap || '?'}
                    </span>
                  </div>
                </div>
              </DashCard>
            ) : (
              <KPI>
                <KPI.Header>
                  <KPI.Title>Produits actifs</KPI.Title>
                </KPI.Header>
                <KPI.Content>
                  <KPI.Value maximumFractionDigits={0} value={L ? 0 : stats.totalProducts} />
                </KPI.Content>
              </KPI>
            )}
          </div>

          {/* ── MRR ───────────────────────────────────────────────── */}
          <div className="col-span-1 md:col-span-3">
            <KPI>
              <KPI.Header>
                <KPI.Title>MRR</KPI.Title>
              </KPI.Header>
              <KPI.Content>
                <KPI.Value maximumFractionDigits={2} value={L ? 0 : stats.activeSubscriptions * 24.90} />
              </KPI.Content>
              <KPI.Chart color="var(--color-noir)" data={toChartData([8, 9, 8, 10, 11, 12, 13, 14])} height={42} />
            </KPI>
          </div>

          {/* ── Paiements échoués ─────────────────────────────── */}
          {!L && expiredSubs.length > 0 && (
            <div className="col-span-1 md:col-span-12">
              <DashCard>
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-display text-[22px] tracking-[-0.01em]">
                    Paiements <em className="italic">échoués</em>
                  </h3>
                  <span className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-[10px] py-[5px] text-[9px] uppercase tracking-[0.14em] font-medium text-red-600">
                    ● {expiredSubs.length} expiré{expiredSubs.length > 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex flex-col divide-y divide-noir/[0.04]">
                  {expiredSubs.map((sub) => {
                    const name = [sub.firstName, sub.lastName].filter(Boolean).join(' ') || sub.email || 'Membre';
                    const daysSince = Math.floor((Date.now() - new Date(sub.expiredSince).getTime()) / 86400000);
                    return (
                      <div key={sub.userId} className="flex items-center justify-between py-3">
                        <div className="min-w-0">
                          <span className="text-[13px] font-light text-noir truncate">{name}</span>
                          {sub.email && (
                            <span className="ml-2 text-[11px] text-black/40">{sub.email}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 shrink-0">
                          <span className="text-[11px] text-red-500">
                            expiré · {daysSince}j
                          </span>
                          <a
                            href={`/admin/membres/${sub.userId}`}
                            className="text-[10px] uppercase tracking-[0.1em] text-black/40 hover:text-noir transition-colors"
                          >
                            Voir →
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </DashCard>
            </div>
          )}

          {/* ── Commandes en attente (12) ──────────────────────── */}
          {pendingOrders.length > 0 && (
          <div className="col-span-1 md:col-span-12">
            <DashCard>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-display text-[22px] tracking-[-0.01em]">
                  Commandes <em className="italic">en cours</em>
                </h3>
                <span className="inline-flex items-center rounded-full border border-noir/15 px-[10px] py-[5px] text-[9px] uppercase tracking-[0.14em] font-medium text-black/55">
                  ● {pendingOrders.length} en attente
                </span>
              </div>
              <div className="flex flex-col">
                {pendingOrders.map((order, i) => {
                  const items = order.order_items ?? [];
                  const itemNames = items.map((it) => `${it.quantity}× ${it.product_name}`).join(', ');
                  const pickupLabel = order.pickup_time
                    ? new Date(order.pickup_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
                    : '—';
                  const action = STATUS_ACTIONS[order.status];
                  return (
                    <div
                      key={order.id}
                      className={`flex flex-col sm:flex-row sm:items-center gap-3 py-[14px] ${i > 0 ? 'border-t border-noir/[0.06]' : ''}`}
                    >
                      <div className="w-[38px] h-[38px] rounded-[2px] bg-noir/[0.05] flex items-center justify-center shrink-0">
                        <CupSoda size={18} strokeWidth={1.35} className="text-black/45" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium truncate">{itemNames || '—'}</p>
                        <p className="text-[10.5px] text-black/45 mt-[2px]">
                          Retrait {pickupLabel} · {order.total.toFixed(2).replace('.', ',')}€
                          {order.user_id ? ' · Client #' + order.user_id.slice(0, 8) : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className={`text-[9px] font-medium uppercase tracking-[0.12em] px-2 py-1 rounded-[2px] ${
                          order.status === 'pending' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          order.status === 'preparing' ? 'bg-sky-50 text-sky-700 border border-sky-200' :
                          order.status === 'ready' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          'bg-noir/[0.05] text-black/45'
                        }`}>
                          {STATUS_LABELS[order.status] ?? order.status}
                        </span>
                        {action && (
                          <button
                            type="button"
                            onClick={() => handleOrderAction(order.id, action.next)}
                            className="min-h-[36px] rounded-[2px] border border-noir/15 px-3 py-1.5 text-[10px] font-normal uppercase tracking-[0.12em] text-black/55 hover:border-noir/30 hover:text-noir transition-colors"
                          >
                            {action.label}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </DashCard>
          </div>
          )}

          {/* ── MRR area chart (8) ──────────────────────────────── */}
          <div className="col-span-1 md:col-span-8">
            <DashCard pad={24}>
              <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <DashEyebrow className="mb-2">Acquisition membres · 12 mois</DashEyebrow>
                  <div className="flex flex-wrap items-baseline gap-2 sm:gap-4">
                    {L ? (
                      <div className="font-display text-[clamp(1.75rem,6vw,2.625rem)] leading-none tracking-[-0.02em] md:text-[42px]">
                        —
                      </div>
                    ) : (
                      <NumberValue
                        className="font-display text-[clamp(1.75rem,6vw,2.625rem)] leading-none tracking-[-0.02em] md:text-[42px]"
                        value={stats.newMembersThisMonth}
                        signDisplay="always"
                        maximumFractionDigits={0}
                      />
                    )}
                    {(() => {
                      const t = computeTrend(ACQUISITION);
                      return (
                        <TrendChip trend={t.trend} size="sm">
                          {t.label}
                          <TrendChip.Suffix>vs mois-1</TrendChip.Suffix>
                        </TrendChip>
                      );
                    })()}
                    <span className="font-display text-[13px] italic text-black/40">progression</span>
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap gap-[8px]">
                  {['3M', '6M', '1A'].map((p, i) => (
                    <span
                      key={p}
                      className={`inline-flex cursor-pointer items-center rounded-full border px-3 py-[6px] text-[11px] font-medium transition-colors ${
                        i === 2
                          ? 'border-noir bg-noir text-white'
                          : 'border-noir/10 bg-transparent text-black/40 hover:border-noir/20'
                      }`}
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>
              <AreaChart data={ACQUISITION} h={180} labels={MONTHS_SHORT} />
              <div className="mt-2 overflow-x-auto">
                <div className="flex min-w-[520px] justify-between gap-1 px-0.5">
                  {MONTHS_SHORT.map((m) => (
                    <span key={m} className="text-[9.5px] text-black/30">
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            </DashCard>
          </div>

          {/* ── Plan distribution (4) ──────────────────────────── */}
          <div className="col-span-1 md:col-span-4">
            <DashCard pad={22} className="h-full">
              <DashEyebrow className="mb-5">Répartition des plans</DashEyebrow>
              <div className="flex flex-col gap-[14px]">
                {[
                  { plan: 'Signature',   count: '—', pct: 58, fill: 'bg-noir' },
                  { plan: 'Essentiel',   count: '—', pct: 28, fill: 'bg-noir/40' },
                  { plan: 'Découverte',  count: '—', pct: 14, fill: 'bg-noir/20' },
                ].map((p) => (
                  <div key={p.plan}>
                    <div className="flex justify-between items-baseline mb-[6px]">
                      <span className="font-display text-[17px]">{p.plan}</span>
                      <div>
                        <span className="text-[11px] text-black/40">{p.count} · </span>
                        <span className="font-display text-[17px]">{p.pct}<span className="text-[10px] text-black/40">%</span></span>
                      </div>
                    </div>
                    <div className="h-[6px] rounded-full bg-noir/[0.06]">
                      <div className={`h-full rounded-full ${p.fill}`} style={{ width: `${p.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <DashRule className="my-[22px]" />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <DashEyebrow className="mb-[6px]">Actifs</DashEyebrow>
                  <div className="font-display text-[22px]">{L ? '…' : stats.activeSubscriptions.toLocaleString('fr-FR')}</div>
                </div>
                <div>
                  <DashEyebrow className="mb-[6px]">Churn · 30j</DashEyebrow>
                  <div className="font-display text-[22px]">—<span className="text-[12px] text-black/40">%</span></div>
                </div>
              </div>
            </DashCard>
          </div>

          {/* ── Events table (7) ───────────────────────────────── */}
          <div className="col-span-1 md:col-span-7">
            <DashCard pad={22}>
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="font-display text-[22px]">
                  Événements <em className="italic">à venir</em>
                </h3>
                <DashBtn variant="ghost" size="sm" onClick={() => navigate('/admin/evenements')} className="shrink-0 self-start sm:self-auto">
                  Gérer <ArrowUpRight size={13} />
                </DashBtn>
              </div>

              <div className="-mx-1 overflow-x-auto md:mx-0">
                <div className="min-w-[560px] px-1 md:min-w-0 md:px-0">
                  {/* Table header */}
                  <div
                    className="grid border-b border-noir/[0.06] pb-[10px] text-[10px] uppercase tracking-[0.14em] text-black/35"
                    style={{ gridTemplateColumns: '1fr 1fr 1.2fr 0.8fr 90px' }}
                  >
                    <div>Titre</div>
                    <div>Date</div>
                    <div>Inscrits</div>
                    <div>Statut</div>
                    <div />
                  </div>

                  {events.length === 0 && !loading ? (
                    <p className="py-6 text-[12px] text-black/30">Aucun événement à venir.</p>
                  ) : (
                    events.map((ev) => {
                      const pct = ev.capacity ? Math.round((ev.registration_count / ev.capacity) * 100) : 0;
                      const dateStr = new Date(ev.date + 'T00:00:00').toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                      });
                      return (
                        <div
                          key={ev.id}
                          className="grid items-center border-b border-noir/[0.04] py-[14px] text-[13px]"
                          style={{ gridTemplateColumns: '1fr 1fr 1.2fr 0.8fr 90px' }}
                        >
                          <div className="truncate pr-2 font-medium">{ev.title}</div>
                          <div className="font-display text-[13px] italic text-black/45">
                            {dateStr}
                            {ev.heure ? ` · ${ev.heure.slice(0, 5)}` : ''}
                          </div>
                          <div className="flex items-center gap-[10px]">
                            <span className="text-[11px] text-black/55">
                              {ev.registration_count}/{ev.capacity ?? '?'}
                            </span>
                            {ev.capacity ? (
                              <div className="h-[4px] max-w-[80px] flex-1 rounded-full bg-noir/[0.06]">
                                <div className="h-full rounded-full bg-noir" style={{ width: `${pct}%` }} />
                              </div>
                            ) : null}
                          </div>
                          <div>
                            <DashStatusBadge status="active" />
                          </div>
                          <div className="text-right">
                            <Link
                              to="/admin/evenements"
                              className="text-[12px] text-black/40 underline transition-colors hover:text-noir"
                            >
                              Gérer
                            </Link>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </DashCard>
          </div>

          {/* ── Activity feed (5) ──────────────────────────────── */}
          <div className="col-span-1 md:col-span-5">
            <DashCard pad={22} className="h-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-display text-[22px]">
                  Activité <em className="italic">en direct</em>
                </h3>
                <span className="inline-flex items-center rounded-full border border-noir/15 px-[10px] py-[5px] text-[9px] uppercase tracking-[0.14em] font-medium text-black/55">
                  ● En direct
                </span>
              </div>
              <div>
                {ACTIVITY.map((a, i) => (
                  <div
                    key={i}
                    className={`flex gap-[14px] items-center py-[12px] ${i > 0 ? 'border-t border-noir/[0.06]' : ''}`}
                  >
                    <div className="w-[34px] h-[34px] rounded-full bg-surface-muted border border-noir/[0.06] flex items-center justify-center shrink-0">
                      <a.icon size={15} strokeWidth={1.5} className="text-black/50" />
                    </div>
                    <div className="text-[12.5px] flex-1">{a.text}</div>
                    <div className="text-[10px] text-black/30 whitespace-nowrap">{a.ago}</div>
                  </div>
                ))}
              </div>

              <DashRule className="my-4" />
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Membres', to: '/admin/membres' },
                  { label: 'Bilans', to: '/admin/bilans' },
                  { label: 'Produits', to: '/admin/produits' },
                  { label: 'Communication', to: '/admin/communication' },
                ].map((lnk) => (
                  <Link
                    key={lnk.to}
                    to={lnk.to}
                    className="flex items-center justify-between rounded-[2px] bg-surface-muted px-3 py-[10px] text-[11px] font-medium text-black/60 hover:text-noir hover:bg-noir/[0.06] transition-colors"
                  >
                    {lnk.label} <ArrowUpRight size={12} />
                  </Link>
                ))}
              </div>
            </DashCard>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AdminOverview;
