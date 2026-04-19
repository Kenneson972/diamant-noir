// src/hooks/useDashboardStats.ts
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

export interface DashboardStats {
  eventsThisQuarter: number;
  bilansTotal: number;
}

function getQuarterStart(): string {
  const now = new Date();
  const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
  return new Date(now.getFullYear(), quarterMonth, 1).toISOString().split('T')[0];
}

export function useDashboardStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({ eventsThisQuarter: 0, bilansTotal: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    let cancelled = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;
    const quarterStart = getQuarterStart();

    Promise.all([
      db.from('event_registrations')
        .select('*, events!inner(date)')
        .eq('user_id', user.id)
        .gte('events.date', quarterStart),
      db.from('bilan_bookings')
        .select('id')
        .eq('user_id', user.id)
        .eq('statut', 'confirme'),
    ]).then(([evRes, bilanRes]: [{ data: unknown[] | null }, { data: unknown[] | null }]) => {
      if (cancelled) return;
      setStats({
        eventsThisQuarter: evRes.data?.length ?? 0,
        bilansTotal: bilanRes.data?.length ?? 0,
      });
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [user?.id]);

  return { stats, loading };
}
