import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { MapPin, Clock, Users, Calendar, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import type { Event } from '../types/database';

const schema = z.object({
  nom: z.string().min(2, 'Nom requis'),
  prenom: z.string().min(2, 'Prénom requis'),
  telephone: z.string().min(8, 'Téléphone requis'),
  nb_personnes: z.string(),
  souhait_info: z.string(),
});

type FormData = z.infer<typeof schema>;

const NB_OPTIONS = [
  { value: 'Je viens seul', label: 'Je viens seul(e)' },
  { value: '+1 personne', label: '+1 personne' },
  { value: '+2 personnes', label: '+2 personnes' },
  { value: '+3 personnes ou plus', label: '+3 personnes ou plus' },
];

const INFO_OPTIONS = [
  { value: 'Oui avec plaisir 🔥', label: 'Oui avec plaisir 🔥' },
  { value: 'Non merci', label: 'Non merci' },
];

const TYPE_LABELS: Record<Event['type'], string> = {
  run_club: '🏃 Course',
  popup: '📍 Pop-up',
  atelier: '🌿 Atelier',
  event: '🎉 Événement',
  partenariat: '🤝 Partenariat',
  bilan: '💚 Bilan',
};

const inputClass =
  'w-full border-0 border-b border-black/10 bg-transparent py-4 text-[14px] text-[#111] placeholder:text-black/30 focus:outline-none focus:border-[oklch(8%_0.005_55)] transition-colors';

// Append T00:00:00 so JS parses as local time (Martinique UTC-4), not UTC midnight
const formatDate = (dateStr: string) =>
  new Date(dateStr + 'T00:00:00').toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

const formatDateShort = (dateStr: string) =>
  new Date(dateStr + 'T00:00:00').toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

interface EventWithCount extends Event {
  registrationCount: number;
}

const EvenementDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const [event, setEvent] = useState<EventWithCount | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'duplicate' | 'full' | 'error'>('idle');

  const { control, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      nom: user?.lastName ?? '',
      prenom: user?.firstName ?? '',
      telephone: user?.phone ?? '',
      nb_personnes: 'Je viens seul',
      souhait_info: 'Non merci',
    },
  });

  useEffect(() => {
    if (!slug) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    let cancelled = false;
    const fetchEvent = async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('events')
        .select('*, event_registrations(count)')
        .eq('slug', slug)
        .eq('active', true)
        .single() as { data: (Event & { event_registrations: { count: number | string }[] }) | null; error: { code?: string } | null };

      if (cancelled) return;

      if (error && !data) {
        if (error.code === 'PGRST116') {
          setNotFound(true);
        } else {
          setFetchError('Impossible de charger cet événement.');
        }
      } else if (!data) {
        setNotFound(true);
      } else {
        setEvent({
          ...data,
          registrationCount: Number(data.event_registrations?.[0]?.count ?? 0),
        });
      }
      setLoading(false);
    };
    fetchEvent();
    return () => { cancelled = true; };
  }, [slug]);

  useEffect(() => {
    if (user) {
      reset({
        nom: user.lastName ?? '',
        prenom: user.firstName ?? '',
        telephone: user.phone ?? '',
        nb_personnes: 'Je viens seul',
        souhait_info: 'Non merci',
      }, { keepDirty: true });
    }
  }, [user, reset]);

  const onSubmit = async (data: FormData) => {
    if (!event) return;

    if (event.registration_open === false) {
      setSubmitStatus('error');
      return;
    }

    if (event.places_max && event.registrationCount >= event.places_max) {
      setSubmitStatus('full');
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from('event_registrations').insert({
      event_id: event.id,
      user_id: user?.id ?? null,
      nom: data.nom,
      prenom: data.prenom,
      telephone: data.telephone,
      nb_personnes: data.nb_personnes,
      souhait_info: data.souhait_info,
    });

    if (error) {
      if (error.code === '23505') {
        setSubmitStatus('duplicate');
      } else {
        setSubmitStatus('error');
      }
      return;
    }

    setSubmitStatus('success');
    setEvent(prev => prev ? { ...prev, registrationCount: prev.registrationCount + 1 } : null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-black/20 border-t-[#111] rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !event) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-6xl mx-auto px-[72px] text-center py-32">
          <h1
            className="font-display font-light text-[#111] mb-4"
            style={{ fontFamily: 'var(--font-display)', fontSize: '40px' }}
          >
            Événement introuvable
          </h1>
          <Link to="/evenements" className="text-[oklch(57%_0.065_68)] text-[12px] underline">
            Voir tous les événements
          </Link>
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-6xl mx-auto px-[72px] text-center py-32">
          <p className="text-black/50 text-[14px] mb-4">{fetchError}</p>
          <Link to="/evenements" className="text-[oklch(57%_0.065_68)] text-[12px] underline">
            Voir tous les événements
          </Link>
        </div>
      </div>
    );
  }

  const placesDispo = event.places_max ? event.places_max - event.registrationCount : null;
  const isFull = placesDispo !== null && placesDispo <= 0;

  return (
    <div className="min-h-screen bg-white">

      {/* Hero image */}
      <div className="relative h-[55vh] min-h-[380px] overflow-hidden">
        {event.image_url ? (
          <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[oklch(22%_0.005_55)] to-[#0a0a0a]" aria-hidden="true" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 px-[72px] pb-[48px]">
          <Link
            to="/evenements"
            className="inline-flex items-center gap-2 text-white/60 hover:text-white text-[10px] font-normal uppercase tracking-[0.15em] mb-6 transition-colors"
          >
            <ArrowLeft size={12} aria-hidden="true" /> Tous les événements
          </Link>
          <div>
            <span className="inline-block text-[8px] font-normal tracking-[0.2em] uppercase bg-[oklch(8%_0.005_55)] text-white px-[10px] py-[4px] rounded-[3px] mb-4">
              {TYPE_LABELS[event.type] ?? event.type}
            </span>
            <h1
              className="font-display font-light text-white leading-[1.0]"
              style={{ fontFamily: 'var(--font-display)', fontSize: '52px' }}
            >
              {event.title}
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-[72px] py-[64px]">
        <div className="grid grid-cols-2 gap-16 items-start">

          {/* Infos événement */}
          <div className="space-y-8">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3 text-black/55">
                <Calendar size={15} strokeWidth={1.5} aria-hidden="true" />
                <span className="capitalize text-[13px]">{formatDate(event.date)}</span>
              </div>
              {event.heure && (
                <div className="flex items-center gap-3 text-black/55">
                  <Clock size={15} strokeWidth={1.5} aria-hidden="true" />
                  <span className="text-[13px]">{event.heure.slice(0, 5)}</span>
                </div>
              )}
              {event.location && (
                <div className="flex items-center gap-3 text-black/55">
                  <MapPin size={15} strokeWidth={1.5} aria-hidden="true" />
                  <span className="text-[13px]">{event.location}</span>
                </div>
              )}
              {event.places_max && (
                <div className="flex items-center gap-3 text-black/55">
                  <Users size={15} strokeWidth={1.5} aria-hidden="true" />
                  <span className="text-[13px]">
                    {event.registrationCount} inscrit{event.registrationCount > 1 ? 's' : ''}
                    {placesDispo !== null && (
                      <span className={`ml-2 ${placesDispo <= 5 ? 'text-orange-500' : 'text-black/35'}`}>
                        · {placesDispo} place{placesDispo > 1 ? 's' : ''} restante{placesDispo > 1 ? 's' : ''}
                      </span>
                    )}
                  </span>
                </div>
              )}
            </div>

            {event.description && (
              <p className="text-[14px] text-black/55 leading-[1.8]">
                {event.description}
              </p>
            )}
          </div>

          {/* Formulaire d'inscription */}
          <div className="bg-white rounded-[16px] p-[40px] border border-black/[0.06]">
            <h2
              className="font-display font-light text-[#111] mb-8"
              style={{ fontFamily: 'var(--font-display)', fontSize: '26px' }}
            >
              {submitStatus === 'success' ? 'Inscription confirmée !' : "Je m'inscris"}
            </h2>

            {submitStatus === 'success' && (
              <div aria-live="polite" className="flex flex-col items-center text-center gap-4 py-8">
                <CheckCircle size={48} strokeWidth={1} className="text-[oklch(57%_0.065_68)]" aria-hidden="true" />
                <p className="text-[13px] text-black/60">
                  Tu es inscrit(e) au <strong className="text-[#111]">{event.title}</strong>.
                </p>
                <p className="text-[12px] text-black/40">
                  RDV le{' '}
                  <span className="capitalize">{formatDateShort(event.date)}</span>
                  {event.heure && <> à {event.heure.slice(0, 5)}</>}.
                </p>
              </div>
            )}

            {submitStatus === 'duplicate' && (
              <div className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-100 rounded-[10px] mb-6 text-[12px] text-orange-700" role="alert">
                <AlertCircle size={15} className="shrink-0 mt-0.5" aria-hidden="true" />
                Ce numéro est déjà inscrit à cet événement. Tu es déjà dans la liste !
              </div>
            )}

            {submitStatus === 'full' && (
              <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-[10px] mb-6 text-[12px] text-red-700" role="alert">
                <AlertCircle size={15} className="shrink-0 mt-0.5" aria-hidden="true" />
                Cet événement est complet. Suis-nous sur Instagram pour les prochaines dates.
              </div>
            )}

            {submitStatus === 'error' && (
              <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-[10px] mb-6 text-[12px] text-red-700" role="alert">
                <AlertCircle size={15} className="shrink-0 mt-0.5" aria-hidden="true" />
                Une erreur est survenue. Réessaie ou contacte-nous sur Instagram.
              </div>
            )}

            {event.registration_open === false ? (
              <div className="text-center py-8">
                <p className="text-[13px] font-normal text-black mb-2">Inscriptions fermées</p>
                <p className="text-[11px] font-light text-black/40">
                  Les inscriptions pour cet événement ne sont plus disponibles.
                </p>
              </div>
            ) : submitStatus !== 'success' && !isFull && (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
                <div className="grid grid-cols-2 gap-4">
                  <Controller name="prenom" control={control} render={({ field }) => (
                    <div className="space-y-1">
                      <label htmlFor="prenom" className="text-[9px] font-normal uppercase tracking-[0.2em] text-black/40 block">Prénom *</label>
                      <input id="prenom" {...field} placeholder="Jean" className={inputClass} />
                      {errors.prenom?.message && <p className="text-[11px] text-red-600">{errors.prenom.message}</p>}
                    </div>
                  )} />
                  <Controller name="nom" control={control} render={({ field }) => (
                    <div className="space-y-1">
                      <label htmlFor="nom" className="text-[9px] font-normal uppercase tracking-[0.2em] text-black/40 block">Nom *</label>
                      <input id="nom" {...field} placeholder="Dupont" className={inputClass} />
                      {errors.nom?.message && <p className="text-[11px] text-red-600">{errors.nom.message}</p>}
                    </div>
                  )} />
                </div>

                <Controller name="telephone" control={control} render={({ field }) => (
                  <div className="space-y-1">
                    <label htmlFor="telephone" className="text-[9px] font-normal uppercase tracking-[0.2em] text-black/40 block">
                      Téléphone * <span className="normal-case text-black/25">(WhatsApp de préférence)</span>
                    </label>
                    <input id="telephone" {...field} type="tel" placeholder="0696 XX XX XX" className={inputClass} />
                    {errors.telephone?.message && <p className="text-[11px] text-red-600">{errors.telephone.message}</p>}
                  </div>
                )} />

                <Controller name="nb_personnes" control={control} render={({ field }) => (
                  <div className="space-y-1">
                    <label htmlFor="nb_personnes" className="text-[9px] font-normal uppercase tracking-[0.2em] text-black/40 block">
                      Combien de personnes ?
                    </label>
                    <select
                      id="nb_personnes"
                      {...field}
                      className="w-full border-0 border-b border-black/10 bg-transparent py-4 text-[14px] text-[#111] focus:outline-none focus:border-[oklch(8%_0.005_55)] transition-colors"
                    >
                      {NB_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                )} />

                <div className="space-y-3">
                  <p className="text-[9px] font-normal uppercase tracking-[0.2em] text-black/40">
                    Souhaites-tu rester informé(e) des prochains événements ?
                  </p>
                  <Controller name="souhait_info" control={control} render={({ field }) => (
                    <div className="space-y-2" role="radiogroup" aria-label="Souhait d'information">
                      {INFO_OPTIONS.map(o => (
                        <label key={o.value} className="flex items-center gap-3 cursor-pointer group">
                          <input
                            type="radio"
                            name="souhait_info"
                            value={o.value}
                            checked={field.value === o.value}
                            onChange={() => field.onChange(o.value)}
                            className="accent-[oklch(57%_0.065_68)]"
                          />
                          <span className="text-[13px] text-black/60 group-hover:text-[#111] transition-colors">{o.label}</span>
                        </label>
                      ))}
                    </div>
                  )} />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#0a0a0a] text-white py-4 rounded-full font-normal uppercase tracking-[0.1em] text-[11px] hover:bg-[#222] transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Inscription en cours…' : "Je m'inscris gratuitement"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EvenementDetail;
