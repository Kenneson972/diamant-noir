import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button, Card, CardContent, CardFooter } from '@heroui/react';
import { supabase } from '../lib/supabaseClient';
import { today, getLocalTimeZone } from '@internationalized/date';
import { ArrowBtn } from '../components/ui/ArrowBtn';
import type { Event } from '../types/database';

interface EventWithCount extends Event {
  event_registrations: { count: number | string }[];
}

const TYPE_LABELS: Record<Event['type'], string> = {
  run_club:    'Course',
  popup:       'Pop-up',
  atelier:     'Atelier',
  event:       'Événement',
  partenariat: 'Partenariat',
  bilan:       'Bilan',
};

const TYPE_FILTER: Record<string, string> = {
  'Pop-up':      'popup',
  'Atelier':     'atelier',
  'Partenariats':'partenariat',
};

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

const Evenements = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [events, setEvents]       = useState<EventWithCount[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);

  const typeFromUrl = searchParams.get('type');
  const activeType =
    typeFromUrl && Object.values(TYPE_FILTER).includes(typeFromUrl) ? typeFromUrl : null;

  useEffect(() => {
    let cancelled = false;
    const todayStr = today(getLocalTimeZone()).toString();
    supabase
      .from('events')
      .select('*, event_registrations(count)')
      .eq('active', true)
      .gte('date', todayStr)
      .order('date', { ascending: true })
      .then(({ data, error: queryError }) => {
        if (!cancelled) {
          if (queryError) setError('Impossible de charger les événements.');
          else if (data)  setEvents(data as EventWithCount[]);
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, []);

  const featured      = events[0];
  const rest          = events.slice(1);
  const filteredRest  = activeType ? rest.filter((ev) => ev.type === activeType) : rest;

  const setTypeFilter = (tab: string) => {
    if (tab === 'Tous') {
      setSearchParams({});
      return;
    }
    const v = TYPE_FILTER[tab];
    if (v) setSearchParams({ type: v });
  };

  return (
    <div className="min-h-screen bg-white">
      <section className="bg-white px-4 py-10 md:px-10 md:py-12 lg:px-[72px]">
        <p className="mb-2 text-[10px] font-light uppercase tracking-[0.28em] text-black/35">
          Communauté · Fort-de-France
        </p>
        <h1
          className="font-display font-normal leading-tight tracking-[-0.02em] text-black"
          style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(32px, 4vw, 44px)' }}
        >
          Événements
        </h1>
        <p className="mt-2 max-w-xl text-[12px] font-light leading-relaxed text-black/45">
          Ateliers, pop-ups, partenariats : filtrez par type depuis la barre sous le menu.
        </p>
      </section>

      {/* Filtres locaux (doublent la sub-nav pour accessibilité mobile hors header) */}
      <div className="flex gap-2 overflow-x-auto border-b border-black/[0.06] bg-white px-4 py-3 md:hidden md:px-10">
        {['Tous', 'Pop-up', 'Atelier', 'Partenariats'].map((tab) => {
          const isActive = tab === 'Tous' ? activeType === null : activeType === TYPE_FILTER[tab];
          return (
            <Button
              key={tab}
              type="button"
              variant="ghost"
              onPress={() => setTypeFilter(tab)}
              className={`h-8 min-h-8 shrink-0 whitespace-nowrap rounded-full px-4 text-[10px] font-light tracking-[0.06em] transition-colors duration-200 ${
                isActive
                  ? 'bg-[oklch(8%_0.005_55)] font-normal text-white'
                  : 'border border-black/15 text-black/50 hover:border-black/30 hover:text-black'
              }`}
            >
              {tab}
            </Button>
          );
        })}
      </div>

      {/* ─── Prochain événement — grande card ─── */}
      {featured && (
        <div
          className="mx-4 md:mx-10 lg:mx-[72px] mt-10 rounded-[2px] overflow-hidden grid grid-cols-1 md:grid-cols-2 bg-[oklch(8%_0.005_55)]"
          style={{ minHeight: '360px' }}
        >
          <div className="bg-gradient-to-br from-[oklch(18%_0.008_55)] to-[oklch(8%_0.005_55)] flex items-center justify-center min-h-[280px]">
            {featured.image_url ? (
              <img src={featured.image_url} alt={featured.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-[64px] h-[64px] rounded-full border border-white/[0.08] opacity-25" />
            )}
          </div>
          <div className="px-[56px] py-[52px] flex flex-col justify-between">
            <div>
              <span className="inline-block text-[8px] font-light tracking-[0.32em] uppercase text-[oklch(75%_0.085_68)] mb-5">
                Prochain événement
              </span>
              <h2
                className="font-display font-normal text-white leading-[0.97] mb-5"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(36px, 3.8vw, 50px)',
                }}
              >
                {featured.title}<br />
                <em className="italic text-white/48">{TYPE_LABELS[featured.type]}</em>
              </h2>
              <p className="text-[9px] font-light tracking-[0.22em] uppercase text-white/35 leading-[2.2] mb-9">
                {formatDate(featured.date)}
                {featured.heure    ? ` · ${featured.heure.slice(0, 5)}` : ''}
                {featured.location ? ` · ${featured.location}` : ''}
              </p>
            </div>
            <Link
              to={`/evenements/${featured.slug}`}
              className="inline-flex items-center justify-center rounded-full border border-white/22 text-white text-[10px] font-light tracking-[0.18em] uppercase px-8 h-[44px] self-start hover:bg-white hover:text-black transition-colors duration-300"
            >
              S'inscrire
            </Link>
          </div>
        </div>
      )}

      {/* ─── Grille événements ─── */}
      <section className="px-4 md:px-10 lg:px-[72px] py-[56px]">
        {error && <p className="text-[11px] font-light text-red-500/80 mb-5">{error}</p>}

        {filteredRest.length > 0 && (
          <h2
            className="font-display font-normal text-[38px] text-black mb-8 leading-none"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Tous les événements
          </h2>
        )}

        {loading ? (
          <p className="text-[11px] font-light text-black/35 tracking-[0.04em]">Chargement…</p>
        ) : filteredRest.length === 0 && !featured ? (
          <p className="text-[11px] font-light text-black/35 tracking-[0.04em]">Aucun événement à venir.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRest.map((ev) => {
              const regCount = Number(ev.event_registrations?.[0]?.count ?? 0);
              const spots    = ev.places_max ? ev.places_max - regCount : null;
              const isFull   = spots !== null && spots <= 0;
              return (
                <Card
                  key={ev.id}
                  className={`bg-white rounded-[2px] border border-black/[0.06] shadow-none overflow-hidden cursor-pointer hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)] transition-colors duration-300 ${isFull ? 'opacity-55' : ''}`}
                  onClick={() => !isFull && navigate(`/evenements/${ev.slug}`)}
                >
                  <div className="relative overflow-hidden" style={{ aspectRatio: '16/9' }}>
                    {ev.image_url ? (
                      <img src={ev.image_url} alt={ev.title} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-[oklch(18%_0.008_55)] to-[oklch(8%_0.005_55)]" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
                    <p className="absolute bottom-[14px] left-[16px] text-[8px] font-light tracking-[0.28em] uppercase text-white/68">
                      {TYPE_LABELS[ev.type]} · {formatDate(ev.date)}
                    </p>
                    {isFull && (
                      <span className="absolute top-[14px] right-[14px] text-[8px] font-light tracking-[0.22em] uppercase bg-black/60 text-white/65 px-[10px] py-[5px] rounded-[2px]">
                        Complet
                      </span>
                    )}
                  </div>
                  <CardContent className="px-5 pt-5 pb-0 gap-0">
                    <p className="text-[8px] font-light tracking-[0.28em] uppercase text-[oklch(57%_0.065_68)] mb-2.5">
                      {TYPE_LABELS[ev.type]}
                    </p>
                    <h3
                      className="font-display font-normal text-[22px] leading-[1.05] text-black mb-3"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      {ev.title}
                    </h3>
                    <p className="text-[10px] font-light text-black/35 leading-[1.9]">
                      {formatDate(ev.date)}
                      {ev.heure ? ` · ${ev.heure.slice(0, 5)}` : ''}
                      <br />{ev.location ?? 'Fort-de-France'}
                    </p>
                  </CardContent>
                  <CardFooter className="px-5 pb-[18px] pt-3 flex items-center justify-between">
                    <p className="text-[10px] font-light text-black/32">
                      {spots !== null ? (
                        isFull ? 'Complet' : (
                          <><span className="text-[oklch(57%_0.065_68)] font-normal">{spots} places</span>{' '}disponibles</>
                        )
                      ) : (
                        <span className="text-[oklch(57%_0.065_68)] font-normal">Entrée libre</span>
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


    </div>
  );
};

export default Evenements;
