import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Clock, Users, ArrowRight, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import type { Event } from '../types/database';

const TYPE_LABELS: Record<Event['type'], string> = {
  run_club: '🏃 Run Club',
  popup: '📍 Pop-up',
  atelier: '🌿 Atelier',
  event: '🎉 Événement',
};

const TYPE_COLORS: Record<Event['type'], string> = {
  run_club: 'bg-primary-forest/15 text-primary-forest',
  popup: 'bg-primary/10 text-primary',
  atelier: 'bg-[#EBE6E8] text-rose-800',
  event: 'bg-accent-leaf/20 text-primary-forest',
};

interface EventWithCount extends Event {
  registrationCount: number;
}

const Evenements = () => {
  const [events, setEvents] = useState<EventWithCount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('events')
        .select('*, event_registrations(count)')
        .eq('active', true)
        .gte('date', today)
        .order('date', { ascending: true });

      if (!error && data) {
        const rows = data as unknown as (Event & { event_registrations: { count: number }[] })[];
        setEvents(
          rows.map((e) => ({
            ...e,
            registrationCount: e.event_registrations?.[0]?.count ?? 0,
          }))
        );
      }
      setLoading(false);
    };

    fetchEvents();
  }, []);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });

  return (
    <div className="min-h-screen pt-[10.25rem] pb-24 bg-[#EDE7DF]">
      <div className="container-custom">

        {/* Hero */}
        <div className="mb-24 text-center md:text-left">
          <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-primary/40 mb-6 block">
            Agenda PessÓra
          </span>
          <h1 className="text-6xl md:text-8xl font-serif text-primary tracking-tighter">
            Événements à <span className="italic text-primary-forest">venir</span>
          </h1>
          <div className="w-24 h-[1px] bg-primary/20 mt-12 mb-8 md:mx-0 mx-auto" />
          <p className="text-xl text-primary/60 font-light max-w-2xl font-serif italic">
            Rejoins la communauté PessÓra lors de nos runs, ateliers et pop-ups en Martinique.
          </p>
        </div>

        {/* Liste événements */}
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        ) : events.length === 0 ? (
          <div className="p-16 text-center bg-accent-cream-light rounded-3xl border border-primary/5 mb-16">
            <Calendar size={48} strokeWidth={1} className="mx-auto text-primary/30 mb-6" />
            <h3 className="text-2xl font-serif text-primary mb-4">Événements en préparation</h3>
            <p className="text-primary/60 font-light max-w-md mx-auto">
              De nouveaux événements seront bientôt annoncés. Suis-nous sur Instagram pour ne rien manquer.
            </p>
          </div>
        ) : (
          <div className="space-y-0 mb-32">
            {events.map((event, index) => (
              <div
                key={event.id}
                className={`flex flex-col ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} gap-0 border-b border-primary/5 last:border-0`}
              >
                {/* Image */}
                <div className="md:w-1/2 aspect-[4/3] md:aspect-auto overflow-hidden bg-primary/5">
                  {event.image_url ? (
                    <img
                      src={event.image_url}
                      alt={event.title}
                      className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full min-h-[320px] bg-gradient-to-br from-primary to-primary-forest flex items-center justify-center">
                      <span className="text-6xl">{TYPE_LABELS[event.type].split(' ')[0]}</span>
                    </div>
                  )}
                </div>

                {/* Infos */}
                <div className="md:w-1/2 p-12 md:p-16 lg:p-20 flex flex-col justify-center gap-6 bg-accent-cream-light">
                  <span className={`inline-flex w-fit px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${TYPE_COLORS[event.type]}`}>
                    {TYPE_LABELS[event.type]}
                  </span>

                  <h2 className="text-3xl md:text-4xl font-serif text-primary tracking-tight leading-tight">
                    {event.title}
                  </h2>

                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-primary/60 text-sm">
                      <Calendar size={15} strokeWidth={1.5} />
                      <span className="capitalize">{formatDate(event.date)}</span>
                      {event.heure && (
                        <>
                          <span className="text-primary/20">·</span>
                          <Clock size={15} strokeWidth={1.5} />
                          <span>{event.heure.slice(0, 5)}</span>
                        </>
                      )}
                    </div>
                    {event.location && (
                      <div className="flex items-center gap-2 text-primary/60 text-sm">
                        <MapPin size={15} strokeWidth={1.5} />
                        <span>{event.location}</span>
                      </div>
                    )}
                  </div>

                  {event.description && (
                    <p className="text-primary/70 leading-relaxed font-light max-w-md">
                      {event.description}
                    </p>
                  )}

                  <div className="flex items-center gap-6 pt-2">
                    {event.registrationCount > 0 && (
                      <div className="flex items-center gap-2 text-primary/50 text-sm">
                        <Users size={15} strokeWidth={1.5} />
                        <span>{event.registrationCount} inscrit{event.registrationCount > 1 ? 's' : ''}</span>
                        {event.places_max && (
                          <span className="text-primary/30">/ {event.places_max} places</span>
                        )}
                      </div>
                    )}
                  </div>

                  <Link
                    to={`/evenements/${event.slug}`}
                    className="inline-flex items-center gap-3 bg-primary text-white px-8 py-4 rounded-2xl text-sm font-bold uppercase tracking-widest w-fit hover:bg-primary-forest transition-colors"
                  >
                    Je m'inscris <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CTA Bilan Bien-être */}
        <div className="rounded-[2.5rem] bg-gradient-to-br from-primary via-[#2D472C] to-[#6B9544] p-12 md:p-16 text-white text-center mb-16">
          <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/50 mb-4 block">
            Nouveau
          </span>
          <h2 className="text-3xl md:text-5xl font-serif tracking-tight mb-4">
            Tu viens pour transpirer ?
          </h2>
          <p className="text-xl font-serif italic text-white/80 mb-8 max-w-xl mx-auto">
            Commence par comprendre ton corps. 30 minutes. Gratuit.
          </p>
          <Link
            to="/bilan-bien-etre"
            className="inline-flex items-center gap-3 bg-white text-primary px-8 py-4 rounded-2xl text-sm font-bold uppercase tracking-widest hover:bg-white/90 transition-colors"
          >
            Prendre mon Bilan Bien-être <ArrowRight size={16} />
          </Link>
        </div>

      </div>
    </div>
  );
};

export default Evenements;
