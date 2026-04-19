// src/hooks/useAdminMembers.ts
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

export interface MemberWithSub {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  role: 'member' | 'admin' | null;
  created_at: string;
  subscriptions: Array<{
    plan: string;
    status: string;
    end_date: string | null;
  }>;
}

export function useAdminMembers() {
  const { isAdmin } = useAuth();
  const [members, setMembers] = useState<MemberWithSub[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin) { setLoading(false); return; }
    let cancelled = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('profiles')
      .select('*, subscriptions(plan, status, end_date)')
      .order('created_at', { ascending: false })
      .then(({ data, error: err }: { data: MemberWithSub[] | null; error: { message: string } | null }) => {
        if (cancelled) return;
        if (err) setError('Impossible de charger les membres.');
        else setMembers(data ?? []);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [isAdmin]);

  return { members, loading, error };
}
