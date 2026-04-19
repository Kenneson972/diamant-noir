// src/pages/member/MesEvenements.tsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import type { Event } from '../../types/database';

interface RegistrationWithEvent {
  id: string;
  event_id: string;
  nom: string;
  prenom: string;
  nb_personnes: string;
  created_at: string;
  events: Event;
}

const TYPE_LABELS: Record<Event['type'], string> = {
  run_club: 'Course',
  popup: 'Pop-up',
  atelier: 'Atelier',
  event: 'Événement',
  partenariat: 'Partenariat',
  bilan: 'Bilan',
};

const MesEvenements = () => {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState<RegistrationWithEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('event_registrations')
      .select('*, events(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }: { data: RegistrationWithEvent[] | null }) => {
        setRegistrations(data ?? []);
        setLoading(false);
      });
  }, [user?.id]);

  const today = new Date().toISOString().split('T')[0];
  const upcoming = registrations.filter(r => r.events?.date >= today);
  const past = registrations.filter(r => r.events?.date < today);

  const EventCard = ({ reg }: { reg: RegistrationWithEvent }) => {
    const ev = reg.events;
    if (!ev) return null;
    const d = new Date(ev.date + 'T00:00:00');
    const isPast = ev.date < today;
    return (
      <Link
        to={`/evenements/${ev.slug}`}
        className={`flex items-center gap-4 p-5 rounded-[2px] border transition-colors group ${
          isPast ? 'bg-white border-black/[0.04] opacity-60' : 'bg-white border-black/[0.06] hover:border-black/15'
        }`}
      >
        <div className={`w-14 h-14 rounded-[2px] flex flex-col items-center justify-center flex-shrink-0 ${isPast ? 'bg-black/[0.06]' : 'bg-[#0a0a0a]'}`}>
          <span className={`text-[20px] font-normal leading-none ${isPast ? 'text-black/40' : 'text-white'}`}>
            {d.getDate()}
          </span>
          <span className={`text-[8px] tracking-[0.12em] uppercase ${isPast ? 'text-black/25' : 'text-white/50'}`}>
            {d.toLocaleDateString('fr-FR', { month: 'short' })}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-[13px] font-normal text-black truncate">{ev.title}</p>
            <span className="text-[8px] font-light uppercase tracking-[0.18em] text-black/30 shrink-0">
              {TYPE_LABELS[ev.type]}
            </span>
          </div>
          <p className="text-[10px] font-light text-black/40">
            {[ev.heure?.slice(0, 5), ev.location ?? ev.meeting_point].filter(Boolean).join(' · ')}
          </p>
          {Number(reg.nb_personnes) > 1 && (
            <p className="text-[9px] font-light text-black/30 mt-0.5">{reg.nb_personnes} personnes</p>
          )}
        </div>
        <span className={`text-[8px] font-normal uppercase tracking-[0.15em] px-2.5 py-1 rounded-[2px] shrink-0 ${
          isPast
            ? 'bg-black/5 text-black/30'
            : 'bg-[oklch(75%_0.085_68)/10] text-[oklch(57%_0.065_68)]'
        }`}>
          {isPast ? 'Passé' : 'Confirmé'}
        </span>
      </Link>
    );
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1
          className="font-display font-normal text-[28px] text-black leading-none"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Mes événements
        </h1>
        <Link
          to="/evenements"
          className="text-[10px] font-light uppercase tracking-[0.12em] text-black/40 border-b border-black/20 pb-px hover:text-black hover:border-black transition-colors"
        >
          Voir tous les événements
        </Link>
      </div>

      {loading ? (
        <p className="text-[11px] text-black/30">Chargement…</p>
      ) : registrations.length === 0 ? (
        <div className="bg-white rounded-[2px] border border-black/[0.06] p-12 text-center">
          <p className="text-[13px] font-normal text-black mb-2">Aucune inscription</p>
          <p className="text-[11px] font-light text-black/40 mb-6">
            Tu n'es inscrit(e) à aucun événement pour l'instant.
          </p>
          <Link
            to="/evenements"
            className="inline-block h-10 px-6 bg-black text-white rounded-[2px] text-[10px] font-normal uppercase tracking-[0.12em] hover:bg-black/85 transition-colors leading-10"
          >
            Voir les événements
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {upcoming.length > 0 && (
            <div>
              <p className="text-[9px] font-normal uppercase tracking-[0.28em] text-black/35 mb-3">
                À venir · {upcoming.length}
              </p>
              <div className="flex flex-col gap-2">
                {upcoming.map(r => <EventCard key={r.id} reg={r} />)}
              </div>
            </div>
          )}

          {past.length > 0 && (
            <div>
              <p className="text-[9px] font-normal uppercase tracking-[0.28em] text-black/35 mb-3">
                Passés · {past.length}
              </p>
              <div className="flex flex-col gap-2">
                {past.map(r => <EventCard key={r.id} reg={r} />)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MesEvenements;
