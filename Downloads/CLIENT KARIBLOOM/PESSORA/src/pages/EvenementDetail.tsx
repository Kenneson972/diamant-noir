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
  { value: 'Oui, uniquement pour les Run Club', label: 'Oui, uniquement pour les Run Club' },
  { value: 'Non merci', label: 'Non merci' },
];

// Fix 3 — typed against Event['type'] instead of string
const TYPE_LABELS: Record<Event['type'], string> = {
  run_club: '🏃 Run Club',
  popup: '📍 Pop-up',
  atelier: '🌿 Atelier',
  event: '🎉 Événement',
};

const inputClass =
  'w-full border-0 border-b border-primary/10 bg-transparent py-4 font-serif text-lg text-primary placeholder:text-primary/30 focus:outline-none focus:border-primary-forest';

// Fix 5 — append T00:00:00 so JS parses as local time (Martinique UTC-4), not UTC midnight
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
  // Fix 1 — separate network/fetch error from genuine 404
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

  // Fix 7 — guard slug with early return instead of slug! assertion
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

      // Fix 1 — split genuine 404 (PGRST116) from other network errors
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

  // Fix 2 — keepDirty so already-typed values are not wiped when auth resolves
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
      <div className="min-h-screen pt-[10.25rem] bg-[#EDE7DF] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  // Fix 1 — genuine 404
  if (notFound || !event) {
    return (
      <div className="min-h-screen pt-[10.25rem] pb-24 bg-[#EDE7DF]">
        <div className="container-custom text-center py-32">
          <h1 className="text-4xl font-serif text-primary mb-4">Événement introuvable</h1>
          <Link to="/evenements" className="text-primary-forest font-bold underline">
            Voir tous les événements
          </Link>
        </div>
      </div>
    );
  }

  // Fix 1 — network/fetch error (not a 404)
  if (fetchError) {
    return (
      <div className="min-h-screen pt-[10.25rem] pb-24 bg-[#EDE7DF]">
        <div className="container-custom text-center py-32">
          <p className="text-primary/60 font-light mb-4">{fetchError}</p>
          <Link to="/evenements" className="text-primary-forest font-bold underline">
            Voir tous les événements
          </Link>
        </div>
      </div>
    );
  }

  const placesDispo = event.places_max ? event.places_max - event.registrationCount : null;
  const isFull = placesDispo !== null && placesDispo <= 0;

  return (
    <div className="min-h-screen bg-[#EDE7DF]">

      {/* Hero image */}
      <div className="relative h-[55vh] min-h-[380px] overflow-hidden">
        {event.image_url ? (
          <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary to-primary-forest" aria-hidden="true" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-16">
          <div className="container-custom">
            <Link
              to="/evenements"
              className="inline-flex items-center gap-2 text-white/70 hover:text-white text-xs font-bold uppercase tracking-widest mb-6 transition-colors"
            >
              <ArrowLeft size={14} aria-hidden="true" /> Tous les événements
            </Link>
            <span className="inline-block px-4 py-1.5 rounded-full bg-white/20 text-white text-[10px] font-bold uppercase tracking-widest mb-4">
              {TYPE_LABELS[event.type] ?? event.type}
            </span>
            <h1 className="text-4xl md:text-6xl font-serif text-white tracking-tight">{event.title}</h1>
          </div>
        </div>
      </div>

      <div className="container-custom py-16 md:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 max-w-6xl">

          {/* Infos événement */}
          <div className="space-y-8">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 text-primary/70">
                <Calendar size={18} strokeWidth={1.5} aria-hidden="true" />
                <span className="capitalize font-medium">{formatDate(event.date)}</span>
              </div>
              {event.heure && (
                <div className="flex items-center gap-3 text-primary/70">
                  <Clock size={18} strokeWidth={1.5} aria-hidden="true" />
                  <span>{event.heure.slice(0, 5)}</span>
                </div>
              )}
              {event.location && (
                <div className="flex items-center gap-3 text-primary/70">
                  <MapPin size={18} strokeWidth={1.5} aria-hidden="true" />
                  <span>{event.location}</span>
                </div>
              )}
              {event.places_max && (
                <div className="flex items-center gap-3 text-primary/70">
                  <Users size={18} strokeWidth={1.5} aria-hidden="true" />
                  <span>
                    {event.registrationCount} inscrit{event.registrationCount > 1 ? 's' : ''}
                    {placesDispo !== null && (
                      <span className={`ml-2 ${placesDispo <= 5 ? 'text-orange-500 font-bold' : 'text-primary/40'}`}>
                        · {placesDispo} place{placesDispo > 1 ? 's' : ''} restante{placesDispo > 1 ? 's' : ''}
                      </span>
                    )}
                  </span>
                </div>
              )}
            </div>

            {event.description && (
              <p className="text-primary/70 leading-relaxed text-lg font-light font-serif">
                {event.description}
              </p>
            )}
          </div>

          {/* Formulaire d'inscription */}
          <div className="bg-white rounded-3xl p-8 md:p-10 shadow-sm">
            <h2 className="text-2xl font-serif text-primary mb-8 tracking-tight">
              {submitStatus === 'success' ? 'Inscription confirmée !' : "Je m'inscris"}
            </h2>

            {/* Fix 6 — aria-live for screen-reader announcement on success */}
            {submitStatus === 'success' && (
              <div aria-live="polite" className="flex flex-col items-center text-center gap-4 py-8">
                <CheckCircle size={56} strokeWidth={1} className="text-primary-forest" aria-hidden="true" />
                <p className="text-primary/70 font-light text-lg">
                  Tu es inscrit(e) au <strong>{event.title}</strong>.
                </p>
                <p className="text-primary/50 text-sm">
                  RDV le{' '}
                  <span className="capitalize font-medium">{formatDateShort(event.date)}</span>
                  {event.heure && <> à {event.heure.slice(0, 5)}</>}.
                </p>
              </div>
            )}

            {submitStatus === 'duplicate' && (
              <div className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-100 rounded-2xl mb-6 text-sm text-orange-700" role="alert">
                <AlertCircle size={18} className="shrink-0 mt-0.5" aria-hidden="true" />
                Ce numéro est déjà inscrit à cet événement. Tu es déjà dans la liste !
              </div>
            )}

            {submitStatus === 'full' && (
              <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl mb-6 text-sm text-red-700" role="alert">
                <AlertCircle size={18} className="shrink-0 mt-0.5" aria-hidden="true" />
                Cet événement est complet. Suis-nous sur Instagram pour les prochaines dates.
              </div>
            )}

            {submitStatus === 'error' && (
              <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl mb-6 text-sm text-red-700" role="alert">
                <AlertCircle size={18} className="shrink-0 mt-0.5" aria-hidden="true" />
                Une erreur est survenue. Réessaie ou contacte-nous sur Instagram.
              </div>
            )}

            {submitStatus !== 'success' && !isFull && (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
                <div className="grid grid-cols-2 gap-4">
                  <Controller name="prenom" control={control} render={({ field }) => (
                    <div className="space-y-1">
                      <label htmlFor="prenom" className="text-[10px] font-bold uppercase tracking-widest text-primary/40 block">Prénom *</label>
                      <input id="prenom" {...field} placeholder="Jean" className={inputClass} />
                      {errors.prenom?.message && <p className="text-xs text-red-600">{errors.prenom.message}</p>}
                    </div>
                  )} />
                  <Controller name="nom" control={control} render={({ field }) => (
                    <div className="space-y-1">
                      <label htmlFor="nom" className="text-[10px] font-bold uppercase tracking-widest text-primary/40 block">Nom *</label>
                      <input id="nom" {...field} placeholder="Dupont" className={inputClass} />
                      {errors.nom?.message && <p className="text-xs text-red-600">{errors.nom.message}</p>}
                    </div>
                  )} />
                </div>

                <Controller name="telephone" control={control} render={({ field }) => (
                  <div className="space-y-1">
                    <label htmlFor="telephone" className="text-[10px] font-bold uppercase tracking-widest text-primary/40 block">
                      Téléphone * <span className="normal-case font-normal text-primary/30">(WhatsApp de préférence)</span>
                    </label>
                    <input id="telephone" {...field} type="tel" placeholder="0696 XX XX XX" className={inputClass} />
                    {errors.telephone?.message && <p className="text-xs text-red-600">{errors.telephone.message}</p>}
                  </div>
                )} />

                <Controller name="nb_personnes" control={control} render={({ field }) => (
                  <div className="space-y-1">
                    <label htmlFor="nb_personnes" className="text-[10px] font-bold uppercase tracking-widest text-primary/40 block">
                      Combien de personnes ?
                    </label>
                    <select
                      id="nb_personnes"
                      {...field}
                      className="w-full border-0 border-b border-primary/10 bg-transparent py-4 font-serif text-lg text-primary focus:outline-none focus:border-primary-forest"
                    >
                      {NB_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                )} />

                <div className="space-y-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-primary/40">
                    Souhaites-tu rester informé(e) des prochains événements ?
                  </p>
                  <Controller name="souhait_info" control={control} render={({ field }) => (
                    <div className="space-y-2" role="radiogroup" aria-label="Souhait d'information">
                      {INFO_OPTIONS.map(o => (
                        <label key={o.value} className="flex items-center gap-3 cursor-pointer group">
                          {/* Fix 4 — name attribute groups the radios properly */}
                          <input
                            type="radio"
                            name="souhait_info"
                            value={o.value}
                            checked={field.value === o.value}
                            onChange={() => field.onChange(o.value)}
                            className="accent-primary-forest"
                          />
                          <span className="text-sm text-primary/70 group-hover:text-primary transition-colors">{o.label}</span>
                        </label>
                      ))}
                    </div>
                  )} />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-primary text-white py-5 rounded-2xl font-bold uppercase tracking-widest text-sm hover:bg-primary-forest transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Inscription en cours...' : "Je m'inscris gratuitement"}
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
