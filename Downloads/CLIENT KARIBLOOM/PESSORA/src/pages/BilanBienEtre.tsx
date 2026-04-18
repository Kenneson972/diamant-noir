import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { CalendarDate, today, getLocalTimeZone } from '@internationalized/date';
import { Activity, Utensils, Sparkles, Target, CheckCircle, AlertCircle, Clock, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { Calendar } from '@heroui/react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import type { BilanSlot } from '../types/database';

const schema = z.object({
  nom: z.string().min(2, 'Nom requis'),
  prenom: z.string().min(2, 'Prénom requis'),
  telephone: z.string().min(8, 'Téléphone requis'),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const PROGRAMME = [
  { icon: Activity, title: 'Analyse corporelle', desc: 'Composition corporelle, IMC, masse musculaire et graisseuse' },
  { icon: Utensils, title: 'Bilan nutritionnel', desc: 'Habitudes alimentaires, apports, carences et recommandations personnalisées' },
  { icon: Sparkles, title: 'Skincare', desc: 'Analyse de peau, routine recommandée et produits adaptés à ton profil' },
  { icon: Target, title: 'Challenge 21 jours', desc: 'Programme personnalisé et objectifs concrets pour transformer tes habitudes' },
];

const inputClass =
  'w-full border-0 border-b border-primary/10 bg-transparent py-4 font-serif text-lg text-primary placeholder:text-primary/30 focus:outline-none focus:border-primary-forest';

const BilanBienEtre = () => {
  const { user } = useAuth();
  const [slots, setSlots] = useState<BilanSlot[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<CalendarDate | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<BilanSlot | null>(null);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [slotsLoading, setSlotsLoading] = useState(true);

  const { control, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      nom: user?.lastName ?? '',
      prenom: user?.firstName ?? '',
      telephone: user?.phone ?? '',
      email: user?.email ?? '',
      notes: '',
    },
  });

  useEffect(() => {
    let cancelled = false;
    const fetchSlots = async () => {
      const todayStr = today(getLocalTimeZone()).toString();
      const { data, error } = await supabase
        .from('bilan_slots')
        .select('*')
        .eq('disponible', true)
        .gte('date', todayStr)
        .order('date', { ascending: true })
        .order('heure', { ascending: true });

      if (cancelled) return;

      if (error) {
        setFetchError('Impossible de charger les créneaux. Réessaie plus tard.');
      } else {
        setSlots(data ?? []);
      }
      setSlotsLoading(false);
    };
    fetchSlots();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (user) {
      reset({
        nom: user.lastName ?? '',
        prenom: user.firstName ?? '',
        telephone: user.phone ?? '',
        email: user.email ?? '',
        notes: '',
      }, { keepDirty: true });
    }
  }, [user, reset]);

  const availableDates = new Set(slots.map(s => s.date));

  const isDateUnavailable = (date: CalendarDate) => {
    const dateStr = date.toString();
    return !availableDates.has(dateStr);
  };

  const timeSlotsForDate = selectedDate
    ? slots.filter(s => s.date === selectedDate.toString())
    : [];

  const onSubmit = async (data: FormData) => {
    if (!selectedSlot) return;
    setSubmitStatus('idle');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;
    const { error } = await db.from('bilan_bookings').insert({
      slot_id: selectedSlot.id,
      user_id: user?.id ?? null,
      nom: data.nom,
      prenom: data.prenom,
      telephone: data.telephone,
      email: data.email || null,
      date_rdv: selectedSlot.date,
      heure_rdv: selectedSlot.heure,
      statut: 'en_attente' as const,
      notes: data.notes || null,
    });

    if (error) {
      setSubmitStatus('error');
      return;
    }

    const { error: updateError } = await db.from('bilan_slots').update({ disponible: false } as any).eq('id', selectedSlot.id);
    if (updateError) {
      if (import.meta.env.DEV) console.error('[BilanBienEtre] slot update error:', updateError);
    }
    // Show success regardless — the booking is saved; slot will be cleaned up by admin if needed
    setSubmitStatus('success');
  };

  const minDate = today(getLocalTimeZone());

  return (
    <div className="min-h-screen pt-[10.25rem] pb-24 bg-[#EDE7DF]">
      <div className="container-custom">

        {/* Hero */}
        <div className="mb-24 text-center">
          <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-primary/40 mb-6 block">
            Gratuit · 30 minutes
          </span>
          <h1 className="text-6xl md:text-8xl font-serif text-primary tracking-tighter mb-6">
            Bilan <span className="italic text-primary-forest">Bien-être</span>
          </h1>
          <p className="text-xl text-primary/60 font-light max-w-2xl mx-auto font-serif italic">
            30 minutes pour comprendre ton corps, tes habitudes et définir un programme qui te ressemble vraiment.
          </p>
        </div>

        {/* 4 blocs programme */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-24">
          {PROGRAMME.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="p-8 bg-accent-cream-light rounded-3xl border border-primary/5 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                <Icon size={22} strokeWidth={1.5} className="text-primary" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-serif text-primary mb-3 tracking-tight">{title}</h3>
              <p className="text-sm text-primary/60 font-light leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        {/* Réservation */}
        {submitStatus === 'success' ? (
          <div className="max-w-xl mx-auto text-center py-16" aria-live="polite">
            <CheckCircle size={64} strokeWidth={1} className="text-primary-forest mx-auto mb-6" aria-hidden="true" />
            <h2 className="text-3xl font-serif text-primary mb-4">Réservation reçue !</h2>
            <p className="text-primary/60 font-light text-lg">
              L'équipe PessÓra te confirme ton rendez-vous par WhatsApp sous 24h.
            </p>
            {selectedSlot && (
              <p className="text-primary/40 text-sm mt-4 capitalize">
                {new Date(selectedSlot.date + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                {' '}à {selectedSlot.heure.slice(0, 5)}
              </p>
            )}
            <Link
              to="/evenements"
              className="inline-flex items-center gap-2 mt-8 text-primary-forest font-bold text-sm uppercase tracking-widest hover:underline"
            >
              Voir aussi nos événements <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
        ) : (
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-serif text-primary tracking-tight mb-12 text-center">
              Choisir mon créneau
            </h2>

            {submitStatus === 'error' && (
              <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl mb-8 text-sm text-red-700 max-w-lg mx-auto" role="alert">
                <AlertCircle size={18} className="shrink-0 mt-0.5" aria-hidden="true" />
                Une erreur est survenue. Réessaie ou contacte-nous sur Instagram.
              </div>
            )}

            {fetchError && (
              <div className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-100 rounded-2xl mb-8 text-sm text-orange-700 max-w-lg mx-auto" role="alert">
                <AlertCircle size={18} className="shrink-0 mt-0.5" aria-hidden="true" />
                {fetchError}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">

              {/* Calendrier + créneaux */}
              <div className="space-y-8">
                {slotsLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                  </div>
                ) : !fetchError && slots.length === 0 ? (
                  <div className="p-10 text-center bg-accent-cream-light rounded-3xl border border-primary/5">
                    <Clock size={36} strokeWidth={1} className="mx-auto text-primary/30 mb-4" aria-hidden="true" />
                    <p className="text-primary/60 font-light">
                      Aucun créneau disponible pour le moment. Contacte-nous sur Instagram.
                    </p>
                  </div>
                ) : !fetchError ? (
                  <>
                    {/* HeroUI v3 compound Calendar */}
                    <div className="rounded-3xl shadow-sm border border-primary/5 overflow-hidden bg-white mx-auto">
                      <Calendar.Root
                        value={selectedDate}
                        onChange={(date) => {
                          setSelectedDate(date as CalendarDate);
                          setSelectedSlot(null);
                        }}
                        minValue={minDate}
                        isDateUnavailable={(date) => isDateUnavailable(date as CalendarDate)}
                        className="w-full p-4"
                      >
                        <Calendar.Header className="flex items-center justify-between mb-4 px-2">
                          <Calendar.NavButton slot="previous" className="p-2 rounded-xl hover:bg-primary/5 transition-colors text-primary/60">
                            <ChevronLeft size={18} />
                          </Calendar.NavButton>
                          <Calendar.Heading className="text-sm font-bold uppercase tracking-widest text-primary" />
                          <Calendar.NavButton slot="next" className="p-2 rounded-xl hover:bg-primary/5 transition-colors text-primary/60">
                            <ChevronRight size={18} />
                          </Calendar.NavButton>
                        </Calendar.Header>
                        <Calendar.Grid className="w-full">
                          <Calendar.GridHeader>
                            {(day) => (
                              <Calendar.HeaderCell className="text-[10px] font-bold uppercase tracking-widest text-primary/30 pb-2 text-center">
                                {day}
                              </Calendar.HeaderCell>
                            )}
                          </Calendar.GridHeader>
                          <Calendar.GridBody>
                            {(date) => (
                              <Calendar.Cell
                                date={date}
                                className={({ isSelected, isDisabled, isUnavailable }) =>
                                  [
                                    'w-9 h-9 rounded-xl text-sm font-medium flex items-center justify-center transition-all mx-auto',
                                    isSelected ? 'bg-primary text-white shadow-sm' : '',
                                    isDisabled || isUnavailable ? 'text-primary/20 cursor-not-allowed' : 'text-primary hover:bg-primary/10 cursor-pointer',
                                  ].filter(Boolean).join(' ')
                                }
                              >
                                <Calendar.CellIndicator />
                              </Calendar.Cell>
                            )}
                          </Calendar.GridBody>
                        </Calendar.Grid>
                      </Calendar.Root>
                    </div>

                    {selectedDate && timeSlotsForDate.length > 0 && (
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-primary/40 mb-4">
                          Créneaux disponibles
                        </p>
                        <div className="grid grid-cols-3 gap-2" role="group" aria-label="Créneaux horaires disponibles">
                          {timeSlotsForDate.map(slot => (
                            <button
                              key={slot.id}
                              type="button"
                              onClick={() => setSelectedSlot(slot)}
                              aria-pressed={selectedSlot?.id === slot.id}
                              className={`py-3 px-4 rounded-2xl text-sm font-bold tracking-wide transition-all ${
                                selectedSlot?.id === slot.id
                                  ? 'bg-primary text-white shadow-md'
                                  : 'bg-accent-cream-light border border-primary/10 text-primary hover:border-primary/30'
                              }`}
                            >
                              {slot.heure.slice(0, 5)}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedDate && timeSlotsForDate.length === 0 && (
                      <p className="text-sm text-primary/50 text-center">
                        Aucun créneau disponible ce jour-là.
                      </p>
                    )}
                  </>
                ) : null}
              </div>

              {/* Formulaire */}
              <div className="bg-white rounded-3xl p-8 md:p-10 shadow-sm">
                <h3 className="text-xl font-serif text-primary mb-6">Tes coordonnées</h3>
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
                        Téléphone * <span className="normal-case font-normal text-primary/30">(WhatsApp)</span>
                      </label>
                      <input id="telephone" {...field} type="tel" placeholder="0696 XX XX XX" className={inputClass} />
                      {errors.telephone?.message && <p className="text-xs text-red-600">{errors.telephone.message}</p>}
                    </div>
                  )} />

                  <Controller name="email" control={control} render={({ field }) => (
                    <div className="space-y-1">
                      <label htmlFor="email" className="text-[10px] font-bold uppercase tracking-widest text-primary/40 block">
                        Email <span className="normal-case font-normal text-primary/30">(optionnel)</span>
                      </label>
                      <input id="email" {...field} type="email" placeholder="votre@email.com" className={inputClass} />
                      {errors.email?.message && <p className="text-xs text-red-600">{errors.email.message}</p>}
                    </div>
                  )} />

                  <Controller name="notes" control={control} render={({ field }) => (
                    <div className="space-y-1">
                      <label htmlFor="notes" className="text-[10px] font-bold uppercase tracking-widest text-primary/40 block">
                        Message <span className="normal-case font-normal text-primary/30">(optionnel)</span>
                      </label>
                      <textarea
                        id="notes"
                        {...field}
                        rows={3}
                        placeholder="Objectifs, questions, informations utiles..."
                        className="w-full border-b border-primary/10 bg-transparent py-3 font-serif text-base text-primary placeholder:text-primary/30 focus:outline-none focus:border-primary-forest resize-none"
                      />
                    </div>
                  )} />

                  {!selectedSlot && (
                    <p className="text-xs text-orange-600 font-medium" role="status">
                      Sélectionne d'abord une date et un créneau dans le calendrier.
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting || !selectedSlot}
                    className="w-full bg-primary text-white py-5 rounded-2xl font-bold uppercase tracking-widest text-sm hover:bg-primary-forest transition-colors disabled:opacity-40"
                  >
                    {isSubmitting ? 'Réservation...' : 'Confirmer mon Bilan Bien-être'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default BilanBienEtre;
