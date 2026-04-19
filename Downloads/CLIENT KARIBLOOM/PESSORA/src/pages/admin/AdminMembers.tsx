// src/pages/admin/AdminMembers.tsx
import { useState } from 'react';
import { useAdminMembers } from '../../hooks/useAdminMembers';

const PLAN_COLORS: Record<string, string> = {
  free: 'text-black/40',
  starter: 'text-[oklch(57%_0.065_68)]',
  premium: 'text-[oklch(40%_0.08_68)]',
  vip: 'text-black',
};

const AdminMembers = () => {
  const { members, loading, error } = useAdminMembers();
  const [search, setSearch] = useState('');
  const [filterPlan, setFilterPlan] = useState<string>('all');

  const filtered = members.filter(m => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      `${m.first_name} ${m.last_name} ${m.email}`.toLowerCase().includes(q);
    const sub = m.subscriptions?.[0];
    const matchPlan = filterPlan === 'all' || sub?.plan === filterPlan;
    return matchSearch && matchPlan;
  });

  return (
    <div>
      <h1
        className="font-display font-normal text-[32px] text-black leading-none mb-8"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        Membres
      </h1>

      <div className="flex gap-3 mb-6">
        <input
          type="search"
          placeholder="Rechercher un membre…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="h-10 flex-1 max-w-xs bg-white rounded-[2px] border border-black/[0.08] px-4 text-[12px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
        />
        <select
          value={filterPlan}
          onChange={e => setFilterPlan(e.target.value)}
          className="h-10 bg-white rounded-[2px] border border-black/[0.08] px-3 text-[12px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
        >
          <option value="all">Tous les plans</option>
          <option value="free">Free</option>
          <option value="starter">Starter</option>
          <option value="premium">Premium</option>
          <option value="vip">VIP</option>
        </select>
      </div>

      {error && <p className="text-[11px] text-red-500/80 mb-4">{error}</p>}

      <div className="bg-white rounded-[2px] border border-black/[0.06] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-black/[0.05]">
              {['Membre', 'Email', 'Plan', 'Statut', 'Inscrit le'].map(h => (
                <th key={h} className="px-5 py-3 text-left text-[8px] font-normal uppercase tracking-[0.25em] text-black/35">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-5 py-6 text-[11px] text-black/30">Chargement…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5} className="px-5 py-6 text-[11px] text-black/30">Aucun membre trouvé.</td></tr>
            ) : (
              filtered.map(m => {
                const sub = m.subscriptions?.[0];
                return (
                  <tr key={m.id} className="border-b border-black/[0.04] hover:bg-black/[0.02] transition-colors">
                    <td className="px-5 py-4 text-[12px] font-normal text-black">
                      {m.first_name} {m.last_name}
                    </td>
                    <td className="px-5 py-4 text-[11px] font-light text-black/50">{m.email ?? '—'}</td>
                    <td className="px-5 py-4">
                      <span className={`text-[10px] font-normal uppercase tracking-[0.12em] ${PLAN_COLORS[sub?.plan ?? 'free'] ?? 'text-black/40'}`}>
                        {sub?.plan ?? 'free'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-[9px] font-normal uppercase tracking-[0.12em] px-2 py-[3px] rounded-[2px] ${
                        sub?.status === 'active' ? 'bg-[oklch(57%_0.065_68)/10] text-[oklch(40%_0.065_68)]' : 'bg-black/5 text-black/35'
                      }`}>
                        {sub?.status ?? '—'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-[11px] font-light text-black/40">
                      {new Date(m.created_at).toLocaleDateString('fr-FR')}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-[10px] font-light text-black/35">
        {filtered.length} membre{filtered.length !== 1 ? 's' : ''}
      </p>
    </div>
  );
};

export default AdminMembers;
