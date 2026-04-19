// src/hooks/useAdminEventRegistrations.ts
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import type { EventRegistration } from '../types/database';

export function useAdminEventRegistrations(eventId: string | null) {
  const { isAdmin } = useAuth();
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [loading, setLoading] = useState(false);

  const refetch = () => {
    if (!isAdmin || !eventId) { setRegistrations([]); return; }
    setLoading(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('event_registrations')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: true })
      .then(({ data }: { data: EventRegistration[] | null }) => {
        setRegistrations(data ?? []);
        setLoading(false);
      });
  };

  useEffect(() => { refetch(); }, [isAdmin, eventId]); // eslint-disable-line react-hooks/exhaustive-deps

  return { registrations, loading, refetch };
}
