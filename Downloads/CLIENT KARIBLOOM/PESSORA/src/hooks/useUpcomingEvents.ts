// src/hooks/useUpcomingEvents.ts
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import type { Event } from '../types/database';

export interface RegistrationWithEvent {
  id: string;
  event_id: string;
  user_id: string | null;
  nom: string;
  prenom: string;
  nb_personnes: string;
  created_at: string;
  events: Event;
}

export function useUpcomingEvents(limit = 5) {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState<RegistrationWithEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRegistrations([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    const today = new Date().toISOString().split('T')[0];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('event_registrations')
      .select('*, events!inner(*)')
      .eq('user_id', user.id)
      .gte('events.date', today)
      .order('events.date', { ascending: true })
      .limit(limit)
      .then(({ data }: { data: RegistrationWithEvent[] | null }) => {
        if (cancelled) return;
        setRegistrations(data ?? []);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [user?.id, limit]);

  return { registrations, loading };
}
