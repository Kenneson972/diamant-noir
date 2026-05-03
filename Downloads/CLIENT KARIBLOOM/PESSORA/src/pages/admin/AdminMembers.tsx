// src/pages/admin/AdminMembers.tsx
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Download, Mail, Phone } from 'lucide-react';
import { Card, Skeleton } from '@heroui/react';
import { EmptyState, Segment } from '@heroui-pro/react';
import { useAdminMembers, type MemberWithSub } from '../../hooks/useAdminMembers';
import { usePersistentAdminState } from '../../hooks/usePersistentAdminState';
import { downloadCsv } from '../../lib/csvExport';
import { AdminErrorAlert } from '../../components/dashboard/AdminErrorAlert';
import { DashEyebrow, DashPageHeader } from '../../components/dashboard/primitives';
import { DASH_MAIN_PAD } from '../../components/dashboard/layoutClasses';

const PLANS = ['all', 'free', 'ora_plus'] as const;

const PLAN_LABEL: Record<string, string> = {
  free: 'Gratuit',
  ora_plus: 'Óra+',
};

const PLAN_BADGE_CLASS: Record<string, string> = {
  free: 'border-noir/10 bg-noir/[0.03] text-black/45',
  ora_plus: 'border-indigo-200/80 bg-indigo-50/80 text-indigo-900/80',
};

function memberInitials(m: MemberWithSub): string {
  const f = m.first_name?.trim();
  const l = m.last_name?.trim();
  if (f || l) {
    const a = (f?.[0] ?? '').toUpperCase();
    const b = (l?.[0] ?? (f && f.length > 1 ? f[1] : '') ?? '').toUpperCase();
    return (a + b) || '?';
  }
  const local = m.email?.split('@')[0] ?? '';
  return local.slice(0, 2).toUpperCase() || '?';
}

function displayName(m: MemberWithSub): string {
  const n = `${m.first_name ?? ''} ${m.last_name ?? ''}`.trim();
  return n || m.email || 'Membre';
}

function statusLabel(status: string | undefined): string {
  if (!status) return '—';
  const map: Record<string, string> = {
    active: 'Actif',
    cancelled: 'Annulé',
    canceled: 'Annulé',
    past_due: 'Impayé',
    trialing: 'Essai',
    paused: 'En pause',
    incomplete: 'Incomplet',
  };
  return map[status] ?? status;
}

function MemberCard({ m }: { m: MemberWithSub }) {
  const sub = m.subscriptions?.[0];
  const plan = sub?.plan ?? 'free';
  const planClass = PLAN_BADGE_CLASS[plan] ?? PLAN_BADGE_CLASS.free;
  const active = sub?.status === 'active';

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-[2px] border border-noir/[0.06] bg-white transition-shadow hover:border-noir/12 hover:shadow-[0_1px_0_rgba(0,0,0,0.06)]">
      <div className="flex items-start gap-3 border-b border-noir/[0.05] p-4">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-noir/[0.08] bg-gradient-to-br from-noir/[0.04] to-noir/[0.02] font-display text-[14px] font-normal tabular-nums text-black/80"
          style={{ fontFamily: 'var(--font-display)' }}
          aria-hidden
        >
          {memberInitials(m)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-[15px] font-normal leading-tight text-black" style={{ fontFamily: 'var(--font-display)' }}>
              {displayName(m)}
            </h2>
            {m.role === 'admin' && (
              <span className="rounded-[2px] bg-noir/[0.07] px-1.5 py-0.5 text-[8px] font-normal uppercase tracking-[0.12em] text-black/55">
                Admin
              </span>
            )}
          </div>
          {m.email && (
            <p className="mt-1.5 flex min-w-0 items-center gap-1.5 text-[11px] font-light text-black/45">
              <Mail size={12} strokeWidth={1.5} className="shrink-0 opacity-60" aria-hidden />
              <span className="truncate">{m.email}</span>
            </p>
          )}
          {m.phone && (
            <p className="mt-1 flex items-center gap-1.5 text-[11px] font-light text-black/38">
              <Phone size={12} strokeWidth={1.5} className="shrink-0 opacity-60" aria-hidden />
              {m.phone}
            </p>
          )}
        </div>
      </div>
      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 p-4 pt-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full border px-2.5 py-0.5 text-[9px] font-normal uppercase tracking-[0.1em] ${planClass}`}>
            {PLAN_LABEL[plan] ?? plan}
          </span>
          <span
            className={`rounded-[2px] px-2 py-0.5 text-[9px] font-normal uppercase tracking-[0.1em] ${
              active ? 'bg-gold-dim/12 text-gold-dim' : 'bg-noir/[0.05] text-black/40'
            }`}
          >
            {statusLabel(sub?.status)}
          </span>
        </div>
        <time className="text-[10px] font-light tabular-nums text-black/35" dateTime={m.created_at}>
          {new Date(m.created_at).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </time>
      </div>
    </article>
  );
}

function MemberGridSkeleton() {
  return (
    <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <li key={i}>
          <Card className="overflow-hidden rounded-[2px] border border-noir/[0.06] bg-white">
            <Card.Content className="flex gap-3 border-b border-noir/[0.05] p-4">
              <Skeleton className="h-12 w-12 shrink-0 rounded-full bg-noir/[0.06]" />
              <div className="flex-1 space-y-2 pt-0.5">
                <Skeleton className="h-4 w-[55%] max-w-[160px] rounded bg-noir/[0.06]" />
                <Skeleton className="h-3 w-[85%] rounded bg-noir/[0.05]" />
              </div>
            </Card.Content>
            <Card.Footer className="flex justify-between gap-3 p-4 pt-3">
              <Skeleton className="h-6 w-20 rounded-full bg-noir/[0.05]" />
              <Skeleton className="h-3 w-16 rounded bg-noir/[0.05]" />
            </Card.Footer>
          </Card>
        </li>
      ))}
    </ul>
  );
}

const DEFAULT_FILTERS = {
  search: '',
  filterPlan: 'all' as (typeof PLANS)[number],
  filterRole: 'all' as 'all' | 'member' | 'admin',
};

const AdminMembers = () => {
  const { members, loading, error, refetch } = useAdminMembers();
  const [filters, setFilters] = usePersistentAdminState('members_filters_v1', DEFAULT_FILTERS);
  const { search, filterPlan, filterRole } = filters;

  const filtered = useMemo(() => {
    return members.filter((m) => {
      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        `${m.first_name ?? ''} ${m.last_name ?? ''} ${m.email ?? ''} ${m.phone ?? ''}`.toLowerCase().includes(q);
      const sub = m.subscriptions?.[0];
      const matchPlan = filterPlan === 'all' || sub?.plan === filterPlan;
      const matchRole =
        filterRole === 'all' ||
        (filterRole === 'admin' && m.role === 'admin') ||
        (filterRole === 'member' && m.role !== 'admin');
      return matchSearch && matchPlan && matchRole;
    });
  }, [members, search, filterPlan, filterRole]);

  const exportCsv = () => {
    downloadCsv(
      `pessora-membres-${new Date().toISOString().slice(0, 10)}.csv`,
      ['Nom', 'Prénom', 'Email', 'Téléphone', 'Rôle', 'Plan', 'Statut abonnement', 'Créé le'],
      filtered.map((m) => {
        const sub = m.subscriptions?.[0];
        return [
          m.last_name ?? '',
          m.first_name ?? '',
          m.email ?? '',
          m.phone ?? '',
          m.role ?? '',
          sub?.plan ?? '',
          sub?.status ?? '',
          m.created_at ? new Date(m.created_at).toLocaleDateString('fr-FR') : '',
        ];
      }),
    );
  };

  return (
    <div>
      <DashPageHeader
        breadcrumb="Administration"
        title="Membres"
        subtitle="Plan, statut d’abonnement et contact en un coup d’œil."
      />
      <div className={DASH_MAIN_PAD}>
      <div className="mb-8 rounded-[2px] border border-noir/[0.06] bg-white p-5 sm:p-6">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <DashEyebrow className="mb-2">Recherche & filtres</DashEyebrow>
            <p className="text-[11px] text-black/40">Les filtres sont mémorisés sur cet appareil.</p>
          </div>
          {!loading && filtered.length > 0 && (
            <button
              type="button"
              onClick={exportCsv}
              className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-full border border-noir/15 px-4 text-[10px] font-normal uppercase tracking-[0.1em] text-black/60 transition-colors hover:border-noir/30 hover:text-noir"
            >
              <Download size={14} strokeWidth={1.5} aria-hidden />
              Exporter CSV ({filtered.length})
            </button>
          )}
        </div>
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <input
            type="search"
            placeholder="Rechercher (nom, e-mail, téléphone)…"
            value={search}
            onChange={(e) => setFilters({ search: e.target.value })}
            className="h-10 min-w-0 flex-1 max-w-md rounded-[2px] border border-noir/[0.08] bg-white px-4 text-[12px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-noir/20"
          />
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-3">
          <span className="text-[9px] font-normal uppercase tracking-[0.18em] text-black/30">
            Plan
          </span>
          <Segment
            size="sm"
            selectedKey={filterPlan}
            onSelectionChange={(k) =>
              setFilters({ filterPlan: ((k as typeof filterPlan) ?? 'all') })
            }
            aria-label="Filtrer par plan"
          >
            {PLANS.map((p) => (
              <Segment.Item key={p} id={p}>
                <Segment.Separator />
                {p === 'all' ? 'Tous les plans' : PLAN_LABEL[p] ?? p}
              </Segment.Item>
            ))}
          </Segment>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[9px] font-normal uppercase tracking-[0.18em] text-black/30">
            Rôle
          </span>
          <Segment
            size="sm"
            selectedKey={filterRole}
            onSelectionChange={(k) =>
              setFilters({ filterRole: ((k as typeof filterRole) ?? 'all') })
            }
            aria-label="Filtrer par rôle"
          >
            <Segment.Item id="all">
              <Segment.Separator />
              Tous
            </Segment.Item>
            <Segment.Item id="member">
              <Segment.Separator />
              Membres
            </Segment.Item>
            <Segment.Item id="admin">
              <Segment.Separator />
              Admins
            </Segment.Item>
          </Segment>
        </div>
      </div>

      {error && <AdminErrorAlert message={error} onRetry={refetch} />}

      {loading ? (
        <MemberGridSkeleton />
      ) : filtered.length === 0 ? (
        <EmptyState className="rounded-[2px] border border-dashed border-noir/15 bg-white">
          <EmptyState.Header>
            <EmptyState.Title className="font-display text-[16px] font-normal text-black/75">
              Aucun membre ne correspond
            </EmptyState.Title>
            <EmptyState.Description className="text-[12px] font-light text-black/45">
              Ajuste la recherche ou réinitialise les filtres pour voir tous les membres.
            </EmptyState.Description>
          </EmptyState.Header>
          <EmptyState.Content>
            <button
              type="button"
              onClick={() => setFilters(DEFAULT_FILTERS)}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-noir/15 px-4 text-[10px] font-normal uppercase tracking-[0.1em] text-black/60 transition-colors hover:border-noir/30 hover:text-noir"
            >
              Réinitialiser les filtres
            </button>
          </EmptyState.Content>
        </EmptyState>
      ) : (
        <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((m) => (
            <li key={m.id}>
              <Link
                to={`/admin/membres/${m.id}`}
                className="block h-full rounded-[2px] outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-noir/25"
              >
                <MemberCard m={m} />
              </Link>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-6 text-[10px] font-light text-black/35">
        {loading ? '…' : `${filtered.length} membre${filtered.length !== 1 ? 's' : ''}`}
      </p>
      </div>
    </div>
  );
};

export default AdminMembers;
