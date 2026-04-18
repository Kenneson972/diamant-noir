import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardFooter } from '@heroui/react';
import { supabase } from '../lib/supabaseClient';
import { today, getLocalTimeZone } from '@internationalized/date';
import { ArrowBtn } from '../components/ui/ArrowBtn';
import type { Event } from '../types/database';

interface EventWithCount extends Event {
  event_registrations: { count: number | string }[];
}

const TYPE_LABELS: Record<Event['type'], string> = {
  run_club: 'Run Club',
  popup: 'Pop-up',
  atelier: 'Atelier',
  event: 'Événement',
  partenariat: 'Partenariat',
};

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

const Evenements = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<EventWithCount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const todayStr = today(getLocalTimeZone()).toString();
    supabase
      .from('events')
      .select('*, event_registrations(count)')
      .eq('active', true)
      .gte('date', todayStr)
      .order('date', { ascending: true })
      .then(({ data }) => {
        if (!cancelled && data) setEvents(data as EventWithCount[]);
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const featured = events[0];
  const rest = events.slice(1);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section
        className="relative flex items-end overflow-hidden"
        style={{ height: '56vh', minHeight: '320px', background: '#0a0a0a' }}
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at 55% 40%, rgba(30,60,30,0.45) 0%, transparent 65%), linear-gradient(155deg, #0f1f0f 0%, #0a0a0a 50%, #111 100%)',
          }}
        />
        <div className="relative z-10 px-[60px] pb-[56px]">
          <p className="text-[9px] tracking-[0.45em] uppercase text-white/35 mb-[16px]">
            Communauté · Fort-de-France
          </p>
          <h1
            className="font-display font-light text-white leading-[0.93] tracking-[-0.02em]"
            style={{ fontFamily: 'var(--font-display)', fontSize: '68px' }}
          >
            Nos
            <br />
            <em className="italic text-white/60">événements</em>
          </h1>
        </div>
      </section>

      {/* Filter Tabs */}
      <div className="bg-white border-b border-black/[0.08] px-[60px] flex gap-0 h-[60px]">
        {['Tous', 'Run Club', 'Pop-up', 'Atelier', 'Partenariats'].map((tab, i) => (
          <button
            key={tab}
            className={`h-full px-[18px] text-[12px] font-normal transition-colors border-b-2 ${
              i === 0
                ? 'border-black text-black'
                : 'border-transparent text-black/60 hover:text-black hover:border-black/20'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Prochain événement — grande card */}
      {featured && (
        <div
          className="mx-[60px] mt-10 rounded-[20px] overflow-hidden grid grid-cols-2 bg-[#0a0a0a]"
          style={{ minHeight: '360px' }}
        >
          <div className="bg-gradient-to-br from-[#1e3a1e] to-[#0f1f0f] flex items-center justify-center min-h-[280px]">
            {featured.image_url ? (
              <img
                src={featured.image_url}
                alt={featured.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-[72px] h-[72px] rounded-full border border-white/10 opacity-30" />
            )}
          </div>
          <div className="px-[52px] py-[52px] flex flex-col justify-between">
            <div>
              <span className="inline-block text-[8px] tracking-[0.22em] uppercase bg-[#3d6b3e] text-white px-[10px] py-1 rounded-[3px] mb-5">
                Prochain événement
              </span>
              <h2
                className="font-display font-light text-white leading-[1.0] mb-5"
                style={{ fontFamily: 'var(--font-display)', fontSize: '46px' }}
              >
                {featured.title}
                <br />
                <em className="italic text-white/60">{TYPE_LABELS[featured.type]}</em>
              </h2>
              <p className="text-[10px] tracking-[0.2em] uppercase text-white/40 leading-[2.0] mb-9">
                {formatDate(featured.date)}
                {featured.heure ? ` · ${featured.heure.slice(0, 5)}` : ''}
                {featured.location ? ` · ${featured.location}` : ''}
              </p>
            </div>
            <Link
              to={`/evenements/${featured.slug}`}
              className="inline-flex items-center justify-center rounded-full bg-white text-black text-[11px] font-normal tracking-[0.12em] uppercase px-7 h-11 self-start hover:bg-white/90 transition-colors"
            >
              S'inscrire
            </Link>
          </div>
        </div>
      )}

      {/* Grille événements */}
      <section className="px-[60px] py-[52px]">
        <h2
          className="font-display font-light text-[36px] text-black mb-7"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Tous les événements
        </h2>

        {loading ? (
          <p className="text-[12px] text-black/38">Chargement…</p>
        ) : rest.length === 0 && !featured ? (
          <p className="text-[12px] text-black/38">Aucun événement à venir.</p>
        ) : (
          <div className="grid grid-cols-3 gap-[14px]">
            {rest.map((ev) => {
              const regCount = Number(ev.event_registrations?.[0]?.count ?? 0);
              const spots = ev.places_max ? ev.places_max - regCount : null;
              const isFull = spots !== null && spots <= 0;
              return (
                <Card
                  key={ev.id}
                  className={`bg-white rounded-[16px] border border-black/[0.06] shadow-none overflow-hidden cursor-pointer hover:shadow-lg transition-shadow ${isFull ? 'opacity-60' : ''}`}
                  onClick={() => !isFull && navigate(`/evenements/${ev.slug}`)}
                >
                  <div className="relative overflow-hidden" style={{ aspectRatio: '16/9' }}>
                    {ev.image_url ? (
                      <img
                        src={ev.image_url}
                        alt={ev.title}
                        className="absolute inset-0 w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-[#1e3a1e] to-[#0a0a0a]" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <p className="absolute bottom-[14px] left-[14px] text-[8px] tracking-[0.25em] uppercase text-white/75">
                      {TYPE_LABELS[ev.type]} · {formatDate(ev.date)}
                    </p>
                    {isFull && (
                      <span className="absolute top-[14px] right-[14px] text-[8px] tracking-[0.2em] uppercase bg-black/70 text-white/70 px-[10px] py-1 rounded-[4px]">
                        Complet
                      </span>
                    )}
                  </div>
                  <CardContent className="px-5 pt-5 pb-0 gap-0">
                    <p className="text-[8px] tracking-[0.22em] uppercase text-[#3d6b3e] mb-2">
                      {TYPE_LABELS[ev.type]}
                    </p>
                    <h3
                      className="font-display font-light text-[22px] leading-[1.1] text-black mb-3"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      {ev.title}
                    </h3>
                    <p className="text-[10px] text-black/38 leading-[1.8]">
                      {formatDate(ev.date)}
                      {ev.heure ? ` · ${ev.heure.slice(0, 5)}` : ''}
                      <br />
                      {ev.location ?? 'Fort-de-France'}
                    </p>
                  </CardContent>
                  <CardFooter className="px-5 pb-[18px] pt-3 flex items-center justify-between">
                    <p className="text-[10px] text-black/35">
                      {spots !== null ? (
                        isFull ? (
                          'Complet'
                        ) : (
                          <>
                            <span className="text-[#3d6b3e] font-normal">{spots} places</span>{' '}
                            disponibles
                          </>
                        )
                      ) : (
                        <span className="text-[#3d6b3e] font-normal">Entrée libre</span>
                      )}
                    </p>
                    <ArrowBtn size="sm" ariaLabel={`Voir ${ev.title}`} />
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* Run Club banner récurrent */}
      <div className="mx-[60px] mb-16 rounded-[20px] overflow-hidden bg-[#0a0a0a] flex items-center px-[60px] py-[52px] gap-[60px]">
        <div className="flex-1">
          <p className="text-[9px] tracking-[0.42em] uppercase text-white/28 mb-[14px]">
            Chaque semaine
          </p>
          <h3
            className="font-display font-light text-white leading-[1.0] mb-4"
            style={{ fontFamily: 'var(--font-display)', fontSize: '42px' }}
          >
            Run Club
            <br />
            <em className="italic text-white/55">Pessóra</em>
          </h3>
          <p className="text-[10px] text-white/40 tracking-[0.15em] uppercase">
            Tous les mercredis · 6h00 · Fort-de-France
          </p>
        </div>
        <Link
          to="/evenements"
          className="inline-flex items-center justify-center rounded-full bg-white text-black text-[11px] font-normal tracking-[0.12em] uppercase px-7 h-11 flex-shrink-0 hover:bg-white/90 transition-colors"
        >
          Rejoindre le club
        </Link>
      </div>
    </div>
  );
};

export default Evenements;
