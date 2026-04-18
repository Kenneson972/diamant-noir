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
  'w-full border-0 border-b border-black/10 bg-transparent py-4 text-[14px] text-[#111] placeholder:text-black/30 focus:outline-none focus:border-[#3d6b3e] transition-colors';

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
    setSubmitStatus('success');
  };

  const minDate = today(getLocalTimeZone());

  return (
    <div className="min-h-screen">

      {/* Hero noir */}
      <section className="bg-[#0a0a0a] px-[60px] py-[56px]">
        <p className="text-[9px] font-normal tracking-[0.42em] uppercase text-white/[0.28] mb-[14px]">
          Gratuit · 30 minutes
        </p>
        <h1
          className="font-display font-light text-white leading-[0.95] tracking-[-0.02em] mb-5"
          style={{ fontFamily: 'var(--font-display)', fontSize: '64px' }}
        >
          Bilan<br /><em className="italic text-white/60">Bien-être</em>
        </h1>
        <p className="text-[12px] text-white/[0.38] max-w-md leading-[1.7]">
          30 minutes pour comprendre ton corps, tes habitudes et définir un programme qui te ressemble vraiment.
        </p>
      </section>

      {/* Programme */}
      <section className="bg-[#faf9f7] px-[60px] py-[56px]">
        <div className="grid grid-cols-4 gap-4 mb-[64px]">
          {PROGRAMME.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="p-6 bg-white rounded-[16px] border border-black/[0.06]">
              <div className="w-10 h-10 rounded-[10px] bg-black/[0.05] flex items-center justify-center mb-5">
                <Icon size={18} strokeWidth={1.5} className="text-[#111]" aria-hidden="true" />
              </div>
              <h3
                className="font-display font-light text-[#111] mb-2"
                style={{ fontFamily: 'var(--font-display)', fontSize: '18px' }}
              >
                {title}
              </h3>
              <p className="text-[11px] text-black/40 leading-[1.6]">{desc}</p>
            </div>
          ))}
        </div>

        {/* Réservation */}
        {submitStatus === 'success' ? (
          <div className="max-w-xl mx-auto text-center py-16" aria-live="polite">
            <CheckCircle size={52} strokeWidth={1} className="text-[#3d6b3e] mx-auto mb-6" aria-hidden="true" />
            <h2
              className="font-display font-light text-[#111] mb-4"
              style={{ fontFamily: 'var(--font-display)', fontSize: '36px' }}
            >
              Réservation reçue !
            </h2>
            <p className="text-[12px] text-black/50 leading-[1.7]">
              L'équipe PessÓra te confirme ton rendez-vous par WhatsApp sous 24h.
            </p>
            {selectedSlot && (
              <p className="text-[11px] text-black/30 mt-3 capitalize">
                {new Date(selectedSlot.date + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                {' '}à {selectedSlot.heure.slice(0, 5)}
              </p>
            )}
            <Link
              to="/evenements"
              className="inline-flex items-center gap-2 mt-8 text-[#3d6b3e] text-[11px] font-normal uppercase tracking-[0.12em] hover:opacity-70 transition-opacity"
            >
              Voir aussi nos événements <ArrowRight size={12} aria-hidden="true" />
            </Link>
          </div>
        ) : (
          <div className="max-w-5xl mx-auto">
            <h2
              className="font-display font-light text-[#111] tracking-[-0.01em] mb-[48px] text-center"
              style={{ fontFamily: 'var(--font-display)', fontSize: '36px' }}
            >
              Choisir mon créneau
            </h2>

            {submitStatus === 'error' && (
              <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-[12px] mb-8 text-[12px] text-red-700 max-w-lg mx-auto" role="alert">
                <AlertCircle size={16} className="shrink-0 mt-0.5" aria-hidden="true" />
                Une erreur est survenue. Réessaie ou contacte-nous sur Instagram.
              </div>
            )}

            {fetchError && (
              <div className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-100 rounded-[12px] mb-8 text-[12px] text-orange-700 max-w-lg mx-auto" role="alert">
                <AlertCircle size={16} className="shrink-0 mt-0.5" aria-hidden="true" />
                {fetchError}
              </div>
            )}

            <div className="grid grid-cols-2 gap-12 items-start">

              {/* Calendrier + créneaux */}
              <div className="space-y-8">
                {slotsLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <div className="w-6 h-6 border-2 border-black/20 border-t-[#111] rounded-full animate-spin" />
                  </div>
                ) : !fetchError && slots.length === 0 ? (
                  <div className="p-10 text-center bg-white rounded-[16px] border border-black/[0.06]">
                    <Clock size={32} strokeWidth={1} className="mx-auto text-black/25 mb-4" aria-hidden="true" />
                    <p className="text-[12px] text-black/40">
                      Aucun créneau disponible pour le moment. Contacte-nous sur Instagram.
                    </p>
                  </div>
                ) : !fetchError ? (
                  <>
                    <div className="rounded-[16px] border border-black/[0.06] overflow-hidden bg-white mx-auto">
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
                          <Calendar.NavButton slot="previous" className="p-2 rounded-[8px] hover:bg-black/[0.05] transition-colors text-black/50">
                            <ChevronLeft size={16} />
                          </Calendar.NavButton>
                          <Calendar.Heading className="text-[10px] font-normal uppercase tracking-[0.2em] text-[#111]" />
                          <Calendar.NavButton slot="next" className="p-2 rounded-[8px] hover:bg-black/[0.05] transition-colors text-black/50">
                            <ChevronRight size={16} />
                          </Calendar.NavButton>
                        </Calendar.Header>
                        <Calendar.Grid className="w-full">
                          <Calendar.GridHeader>
                            {(day) => (
                              <Calendar.HeaderCell className="text-[9px] font-normal uppercase tracking-[0.15em] text-black/30 pb-2 text-center">
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
                                    'w-9 h-9 rounded-[8px] text-[12px] font-normal flex items-center justify-center transition-all mx-auto',
                                    isSelected ? 'bg-[#0a0a0a] text-white' : '',
                                    isDisabled || isUnavailable ? 'text-black/20 cursor-not-allowed' : 'text-[#111] hover:bg-black/[0.05] cursor-pointer',
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
                        <p className="text-[9px] font-normal uppercase tracking-[0.2em] text-black/35 mb-4">
                          Créneaux disponibles
                        </p>
                        <div className="grid grid-cols-3 gap-2" role="group" aria-label="Créneaux horaires disponibles">
                          {timeSlotsForDate.map(slot => (
                            <button
                              key={slot.id}
                              type="button"
                              onClick={() => setSelectedSlot(slot)}
                              aria-pressed={selectedSlot?.id === slot.id}
                              className={`py-3 px-4 rounded-[10px] text-[12px] font-normal tracking-wide transition-all ${
                                selectedSlot?.id === slot.id
                                  ? 'bg-[#0a0a0a] text-white'
                                  : 'bg-white border border-black/10 text-[#111] hover:border-black/30'
                              }`}
                            >
                              {slot.heure.slice(0, 5)}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedDate && timeSlotsForDate.length === 0 && (
                      <p className="text-[12px] text-black/40 text-center">
                        Aucun créneau disponible ce jour-là.
                      </p>
                    )}
                  </>
                ) : null}
              </div>

              {/* Formulaire */}
              <div className="bg-white rounded-[16px] p-[40px] border border-black/[0.06]">
                <h3
                  className="font-display font-light text-[#111] mb-6"
                  style={{ fontFamily: 'var(--font-display)', fontSize: '22px' }}
                >
                  Tes coordonnées
                </h3>
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
                        Téléphone * <span className="normal-case text-black/25">(WhatsApp)</span>
                      </label>
                      <input id="telephone" {...field} type="tel" placeholder="0696 XX XX XX" className={inputClass} />
                      {errors.telephone?.message && <p className="text-[11px] text-red-600">{errors.telephone.message}</p>}
                    </div>
                  )} />

                  <Controller name="email" control={control} render={({ field }) => (
                    <div className="space-y-1">
                      <label htmlFor="email" className="text-[9px] font-normal uppercase tracking-[0.2em] text-black/40 block">
                        Email <span className="normal-case text-black/25">(optionnel)</span>
                      </label>
                      <input id="email" {...field} type="email" placeholder="votre@email.com" className={inputClass} />
                      {errors.email?.message && <p className="text-[11px] text-red-600">{errors.email.message}</p>}
                    </div>
                  )} />

                  <Controller name="notes" control={control} render={({ field }) => (
                    <div className="space-y-1">
                      <label htmlFor="notes" className="text-[9px] font-normal uppercase tracking-[0.2em] text-black/40 block">
                        Message <span className="normal-case text-black/25">(optionnel)</span>
                      </label>
                      <textarea
                        id="notes"
                        {...field}
                        rows={3}
                        placeholder="Objectifs, questions, informations utiles..."
                        className="w-full border-b border-black/10 bg-transparent py-3 text-[14px] text-[#111] placeholder:text-black/30 focus:outline-none focus:border-[#3d6b3e] transition-colors resize-none"
                      />
                    </div>
                  )} />

                  {!selectedSlot && (
                    <p className="text-[11px] text-orange-600" role="status">
                      Sélectionne d'abord une date et un créneau dans le calendrier.
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting || !selectedSlot}
                    className="w-full bg-[#0a0a0a] text-white py-4 rounded-full font-normal uppercase tracking-[0.1em] text-[11px] hover:bg-[#222] transition-colors disabled:opacity-40"
                  >
                    {isSubmitting ? 'Réservation…' : 'Confirmer mon Bilan Bien-être'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default BilanBienEtre;
