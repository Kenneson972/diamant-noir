// src/pages/admin/AdminOverview.tsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';

interface OverviewStats {
  totalMembers: number;
  activeSubscriptions: number;
  newMembersThisMonth: number;
  nextEvent: { title: string; date: string; registrationCount: number } | null;
}

const AdminOverview = () => {
  const [stats, setStats] = useState<OverviewStats>({
    totalMembers: 0,
    activeSubscriptions: 0,
    newMembersThisMonth: 0,
    nextEvent: null,
  });
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
        .select('title, date, event_registrations(count)')
        .eq('active', true)
        .gte('date', today)
        .order('date', { ascending: true })
        .limit(1)
        .single(),
    ]).then(([membersRes, subsRes, newMembersRes, nextEvRes]: [
      { count: number | null },
      { count: number | null },
      { count: number | null },
      { data: { title: string; date: string; event_registrations: { count: number | string }[] } | null }
    ]) => {
      setStats({
        totalMembers: membersRes.count ?? 0,
        activeSubscriptions: subsRes.count ?? 0,
        newMembersThisMonth: newMembersRes.count ?? 0,
        nextEvent: nextEvRes.data
          ? {
              title: nextEvRes.data.title,
              date: nextEvRes.data.date,
              registrationCount: Number(nextEvRes.data.event_registrations?.[0]?.count ?? 0),
            }
          : null,
      });
      setLoading(false);
    });
  }, []);

  const Stat = ({ label, value }: { label: string; value: string | number }) => (
    <div className="bg-white rounded-[2px] border border-black/[0.06] p-6">
      <p className="text-[9px] tracking-[0.25em] uppercase text-black/35 mb-3">{label}</p>
      <p className="font-display font-normal text-[36px] leading-none text-black"
         style={{ fontFamily: 'var(--font-display)' }}>
        {loading ? '…' : value}
      </p>
    </div>
  );

  return (
    <div>
      <h1
        className="font-display font-normal text-[32px] text-black leading-none mb-8"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        Vue d'ensemble
      </h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <Stat label="Membres" value={stats.totalMembers} />
        <Stat label="Abonnements actifs" value={stats.activeSubscriptions} />
        <Stat label="Nouveaux ce mois" value={stats.newMembersThisMonth} />
        <Stat label="Prochain événement" value={stats.nextEvent?.title ?? '—'} />
      </div>

      {stats.nextEvent && (
        <div className="bg-[#0a0a0a] rounded-[2px] p-6 text-white max-w-md">
          <p className="text-[8px] font-light tracking-[0.32em] uppercase text-white/30 mb-2">
            Prochain événement
          </p>
          <p className="text-[16px] font-normal text-white mb-1">{stats.nextEvent.title}</p>
          <p className="text-[11px] font-light text-white/40">
            {new Date(stats.nextEvent.date + 'T00:00:00').toLocaleDateString('fr-FR', {
              weekday: 'long', day: 'numeric', month: 'long',
            })} · {stats.nextEvent.registrationCount} inscrit(s)
          </p>
        </div>
      )}

      <div className="mt-8 flex gap-3">
        <Link to="/admin/membres" className="text-[10px] font-light uppercase tracking-[0.12em] text-black/50 border-b border-black/20 pb-px hover:text-black hover:border-black transition-colors">
          Voir les membres →
        </Link>
        <Link to="/admin/evenements" className="text-[10px] font-light uppercase tracking-[0.12em] text-black/50 border-b border-black/20 pb-px hover:text-black hover:border-black transition-colors">
          Gérer les événements →
        </Link>
      </div>
    </div>
  );
};

export default AdminOverview;
