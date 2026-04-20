// src/pages/admin/AdminMembers.tsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone } from 'lucide-react';
import { useAdminMembers, type MemberWithSub } from '../../hooks/useAdminMembers';

const PLANS = ['all', 'free', 'starter', 'premium', 'vip'] as const;

const PLAN_LABEL: Record<string, string> = {
  free: 'Gratuit',
  starter: 'Starter',
  premium: 'Premium',
  vip: 'VIP',
};

const PLAN_BADGE_CLASS: Record<string, string> = {
  free: 'border-black/10 bg-black/[0.03] text-black/45',
  starter: 'border-amber-200/80 bg-amber-50/80 text-amber-900/80',
  premium: 'border-black/12 bg-black/[0.06] text-black/70',
  vip: 'border-black/20 bg-black text-white',
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
    <article className="flex h-full flex-col overflow-hidden rounded-[2px] border border-black/[0.06] bg-white transition-shadow hover:border-black/12 hover:shadow-[0_1px_0_rgba(0,0,0,0.06)]">
      <div className="flex items-start gap-3 border-b border-black/[0.05] p-4">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-black/[0.08] bg-gradient-to-br from-black/[0.04] to-black/[0.02] font-display text-[14px] font-normal tabular-nums text-black/80"
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
              <span className="rounded-[2px] bg-black/[0.07] px-1.5 py-0.5 text-[8px] font-normal uppercase tracking-[0.12em] text-black/55">
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
              active ? 'bg-gold-dim/12 text-gold-dim' : 'bg-black/[0.05] text-black/40'
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
          <div className="overflow-hidden rounded-[2px] border border-black/[0.06] bg-white">
            <div className="flex gap-3 border-b border-black/[0.05] p-4">
              <div className="h-12 w-12 shrink-0 animate-pulse rounded-full bg-black/[0.06]" />
              <div className="flex-1 space-y-2 pt-0.5">
                <div className="h-4 w-[55%] max-w-[160px] animate-pulse rounded bg-black/[0.06]" />
                <div className="h-3 w-[85%] animate-pulse rounded bg-black/[0.05]" />
              </div>
            </div>
            <div className="flex justify-between gap-3 p-4 pt-3">
              <div className="h-6 w-20 animate-pulse rounded-full bg-black/[0.05]" />
              <div className="h-3 w-16 animate-pulse rounded bg-black/[0.05]" />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

const AdminMembers = () => {
  const { members, loading, error } = useAdminMembers();
  const [search, setSearch] = useState('');
  const [filterPlan, setFilterPlan] = useState<(typeof PLANS)[number]>('all');
  const [filterRole, setFilterRole] = useState<'all' | 'member' | 'admin'>('all');

  const filtered = members.filter((m) => {
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

  return (
    <div className="max-w-[1400px]">
      <div className="mb-8 space-y-2">
        <h1 className="font-display text-[32px] font-normal leading-none text-black" style={{ fontFamily: 'var(--font-display)' }}>
          Membres
        </h1>
        <p className="max-w-md text-[12px] font-light leading-relaxed text-black/45">
          Vue en cartes : plan, statut d’abonnement et contact en un coup d’œil.
        </p>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <input
          type="search"
          placeholder="Rechercher (nom, e-mail, téléphone)…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-10 min-w-0 flex-1 max-w-md rounded-[2px] border border-black/[0.08] bg-white px-4 text-[12px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
        />
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        <span className="mr-1 self-center text-[9px] font-normal uppercase tracking-[0.18em] text-black/30">Plan</span>
        {PLANS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setFilterPlan(p)}
            className={`h-9 rounded-full px-4 text-[10px] font-light tracking-[0.06em] transition-colors ${
              filterPlan === p ? 'bg-black text-white' : 'border border-black/15 text-black/50 hover:border-black/30 hover:text-black'
            }`}
          >
            {p === 'all' ? 'Tous les plans' : PLAN_LABEL[p] ?? p}
          </button>
        ))}
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <span className="mr-1 self-center text-[9px] font-normal uppercase tracking-[0.18em] text-black/30">Rôle</span>
        {(
          [
            ['all', 'Tous'],
            ['member', 'Membres'],
            ['admin', 'Admins'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilterRole(key)}
            className={`h-9 rounded-full px-4 text-[10px] font-light tracking-[0.06em] transition-colors ${
              filterRole === key ? 'bg-black text-white' : 'border border-black/15 text-black/50 hover:border-black/30 hover:text-black'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {error && <p className="mb-4 text-[11px] text-red-500/80">{error}</p>}

      {loading ? (
        <MemberGridSkeleton />
      ) : filtered.length === 0 ? (
        <div className="rounded-[2px] border border-dashed border-black/15 bg-white px-8 py-16 text-center">
          <p className="text-[13px] font-light text-black/40">Aucun membre ne correspond à ces filtres.</p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((m) => (
            <li key={m.id}>
              <Link
                to={`/admin/membres/${m.id}`}
                className="block h-full rounded-[2px] outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-black/25"
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
  );
};

export default AdminMembers;
