// src/pages/admin/AdminEvenements.tsx
import { useState, useEffect } from 'react';
import { Plus, X, ChevronDown, ChevronUp, Users } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAdminEventRegistrations } from '../../hooks/useAdminEventRegistrations';
import type { Event } from '../../types/database';

interface EventWithCount extends Event {
  event_registrations: { count: number | string }[];
}

const EMPTY_FORM = {
  title: '',
  slug: '',
  type: 'event' as Event['type'],
  date: '',
  heure: '',
  location: '',
  meeting_point: '',
  description: '',
  places_max: '',
  image_url: '',
  price: '',
  is_free: true,
  registration_open: true,
  active: true,
};

type FormState = typeof EMPTY_FORM;

const TYPE_OPTIONS: Event['type'][] = ['event', 'popup', 'atelier', 'partenariat', 'bilan', 'run_club'];
const TYPE_LABELS: Record<Event['type'], string> = {
  event: 'Événement', popup: 'Pop-up', atelier: 'Atelier',
  partenariat: 'Partenariat', bilan: 'Bilan', run_club: 'Course',
};

function slugify(str: string) {
  return str.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const EventForm = ({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Partial<FormState>;
  onSave: (data: FormState) => Promise<void>;
  onCancel: () => void;
}) => {
  const [form, setForm] = useState<FormState>({ ...EMPTY_FORM, ...initial });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof FormState, value: string | boolean) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    if (!form.title || !form.date) { setError('Titre et date requis.'); return; }
    setSaving(true);
    setError(null);
    try {
      await onSave({ ...form, slug: form.slug || slugify(form.title) });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  const inputClass = 'w-full h-10 bg-[oklch(98.5%_0.004_55)] rounded-[2px] border border-black/[0.08] px-3 text-[12px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20';

  return (
    <div className="bg-white rounded-[2px] border border-black/[0.06] p-6 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="md:col-span-2">
          <label className="block text-[9px] uppercase tracking-[0.2em] text-black/35 mb-1.5">Titre *</label>
          <input className={inputClass} value={form.title}
            onChange={e => { set('title', e.target.value); if (!initial?.slug) set('slug', slugify(e.target.value)); }} />
        </div>
        <div>
          <label className="block text-[9px] uppercase tracking-[0.2em] text-black/35 mb-1.5">Type</label>
          <select className={inputClass} value={form.type}
            onChange={e => set('type', e.target.value)}>
            {TYPE_OPTIONS.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[9px] uppercase tracking-[0.2em] text-black/35 mb-1.5">Date *</label>
          <input type="date" className={inputClass} value={form.date}
            onChange={e => set('date', e.target.value)} />
        </div>
        <div>
          <label className="block text-[9px] uppercase tracking-[0.2em] text-black/35 mb-1.5">Heure</label>
          <input type="time" className={inputClass} value={form.heure}
            onChange={e => set('heure', e.target.value)} />
        </div>
        <div>
          <label className="block text-[9px] uppercase tracking-[0.2em] text-black/35 mb-1.5">Lieu</label>
          <input className={inputClass} value={form.location}
            onChange={e => set('location', e.target.value)} />
        </div>
        <div>
          <label className="block text-[9px] uppercase tracking-[0.2em] text-black/35 mb-1.5">Point de rendez-vous</label>
          <input className={inputClass} value={form.meeting_point}
            onChange={e => set('meeting_point', e.target.value)} />
        </div>
        <div>
          <label className="block text-[9px] uppercase tracking-[0.2em] text-black/35 mb-1.5">Capacité max</label>
          <input type="number" className={inputClass} value={form.places_max}
            onChange={e => set('places_max', e.target.value)} placeholder="Illimité" />
        </div>
        <div>
          <label className="block text-[9px] uppercase tracking-[0.2em] text-black/35 mb-1.5">Image URL</label>
          <input className={inputClass} value={form.image_url}
            onChange={e => set('image_url', e.target.value)} />
        </div>
        <div className="md:col-span-2">
          <label className="block text-[9px] uppercase tracking-[0.2em] text-black/35 mb-1.5">Description</label>
          <textarea className={`${inputClass} h-24 py-2.5 resize-none`} value={form.description}
            onChange={e => set('description', e.target.value)} />
        </div>
        <div className="flex items-center gap-6">
          {[
            { key: 'is_free' as const, label: 'Entrée libre' },
            { key: 'registration_open' as const, label: 'Inscriptions ouvertes' },
            { key: 'active' as const, label: 'Visible' },
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={!!form[key]}
                onChange={e => set(key, e.target.checked)}
                className="w-4 h-4 accent-black rounded-[2px]" />
              <span className="text-[11px] text-black/60">{label}</span>
            </label>
          ))}
        </div>
      </div>
      {error && <p className="text-[11px] text-red-500/80 mb-3">{error}</p>}
      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="h-10 px-6 bg-black text-white rounded-[2px] text-[10px] font-normal uppercase tracking-[0.12em] hover:bg-black/85 transition-colors disabled:opacity-40"
        >
          {saving ? 'Sauvegarde…' : 'Sauvegarder'}
        </button>
        <button
          onClick={onCancel}
          className="h-10 px-6 border border-black/15 rounded-[2px] text-[10px] font-light uppercase tracking-[0.12em] text-black/50 hover:border-black/30 hover:text-black transition-colors"
        >
          Annuler
        </button>
      </div>
    </div>
  );
};

const RegistrantsList = ({ eventId }: { eventId: string }) => {
  const { registrations, loading } = useAdminEventRegistrations(eventId);

  const exportCSV = () => {
    const rows = [
      ['Prénom', 'Nom', 'Téléphone', 'Nb personnes', 'Info souhaitée'],
      ...registrations.map(r => [r.prenom, r.nom, r.telephone, r.nb_personnes, r.souhait_info]),
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    a.download = `inscrits-${eventId}.csv`;
    a.click();
  };

  if (loading) return <p className="text-[11px] text-black/30 px-5 py-4">Chargement…</p>;

  return (
    <div className="border-t border-black/[0.05]">
      <div className="flex justify-between items-center px-5 py-3">
        <p className="text-[10px] font-normal text-black/50">{registrations.length} inscrit(s)</p>
        {registrations.length > 0 && (
          <button onClick={exportCSV}
            className="text-[9px] font-light uppercase tracking-[0.12em] text-black/40 hover:text-black border-b border-black/20 pb-px transition-colors">
            Exporter CSV
          </button>
        )}
      </div>
      {registrations.length > 0 && (
        <table className="w-full">
          <thead>
            <tr className="border-b border-black/[0.04]">
              {['Prénom', 'Nom', 'Téléphone', 'Groupe', 'Newsletter'].map(h => (
                <th key={h} className="px-5 py-2 text-left text-[8px] uppercase tracking-[0.2em] text-black/30">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {registrations.map(r => (
              <tr key={r.id} className="border-b border-black/[0.03] hover:bg-black/[0.015]">
                <td className="px-5 py-3 text-[11px] text-black">{r.prenom}</td>
                <td className="px-5 py-3 text-[11px] text-black">{r.nom}</td>
                <td className="px-5 py-3 text-[11px] text-black/60">{r.telephone}</td>
                <td className="px-5 py-3 text-[11px] text-black/60">{r.nb_personnes}</td>
                <td className="px-5 py-3 text-[11px] text-black/40">{r.souhait_info}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

const AdminEvenements = () => {
  const [events, setEvents] = useState<EventWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editEvent, setEditEvent] = useState<EventWithCount | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchEvents = () => {
    setLoading(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('events')
      .select('*, event_registrations(count)')
      .order('date', { ascending: true })
      .then(({ data }: { data: EventWithCount[] | null }) => {
        setEvents(data ?? []);
        setLoading(false);
      });
  };

  useEffect(() => { fetchEvents(); }, []);

  const handleCreate = async (form: FormState) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from('events').insert({
      title: form.title,
      slug: form.slug,
      type: form.type,
      date: form.date,
      heure: form.heure || null,
      location: form.location || null,
      meeting_point: form.meeting_point || null,
      description: form.description || null,
      places_max: form.places_max ? Number(form.places_max) : null,
      image_url: form.image_url || null,
      price: form.price ? Number(form.price) : 0,
      is_free: form.is_free,
      registration_open: form.registration_open,
      active: form.active,
    });
    if (error) throw new Error(error.message);
    setShowForm(false);
    fetchEvents();
  };

  const handleUpdate = async (form: FormState) => {
    if (!editEvent) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from('events').update({
      title: form.title,
      slug: form.slug,
      type: form.type,
      date: form.date,
      heure: form.heure || null,
      location: form.location || null,
      meeting_point: form.meeting_point || null,
      description: form.description || null,
      places_max: form.places_max ? Number(form.places_max) : null,
      image_url: form.image_url || null,
      price: form.price ? Number(form.price) : 0,
      is_free: form.is_free,
      registration_open: form.registration_open,
      active: form.active,
    }).eq('id', editEvent.id);
    if (error) throw new Error(error.message);
    setEditEvent(null);
    fetchEvents();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Supprimer cet événement ?')) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('events').delete().eq('id', id);
    fetchEvents();
  };

  const toggleRegistrationOpen = async (ev: EventWithCount) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('events')
      .update({ registration_open: !ev.registration_open })
      .eq('id', ev.id);
    fetchEvents();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="font-display font-normal text-[32px] text-black leading-none"
            style={{ fontFamily: 'var(--font-display)' }}>
          Événements
        </h1>
        <button
          onClick={() => { setShowForm(true); setEditEvent(null); }}
          className="flex items-center gap-2 h-10 px-5 bg-black text-white rounded-[2px] text-[10px] font-normal uppercase tracking-[0.12em] hover:bg-black/85 transition-colors"
        >
          <Plus size={14} /> Créer
        </button>
      </div>

      {showForm && !editEvent && (
        <EventForm onSave={handleCreate} onCancel={() => setShowForm(false)} />
      )}

      {loading ? (
        <p className="text-[11px] text-black/30">Chargement…</p>
      ) : (
        <div className="flex flex-col gap-3">
          {events.map(ev => {
            const count = Number(ev.event_registrations?.[0]?.count ?? 0);
            const isEditing = editEvent?.id === ev.id;
            const isExpanded = expandedId === ev.id;
            return (
              <div key={ev.id} className="bg-white rounded-[2px] border border-black/[0.06] overflow-hidden">
                {isEditing ? (
                  <div className="p-4">
                    <EventForm
                      initial={{
                        title: ev.title, slug: ev.slug, type: ev.type,
                        date: ev.date, heure: ev.heure ?? '',
                        location: ev.location ?? '', meeting_point: ev.meeting_point ?? '',
                        description: ev.description ?? '',
                        places_max: ev.places_max ? String(ev.places_max) : '',
                        image_url: ev.image_url ?? '',
                        price: ev.price ? String(ev.price) : '',
                        is_free: ev.is_free, registration_open: ev.registration_open,
                        active: ev.active,
                      }}
                      onSave={handleUpdate}
                      onCancel={() => setEditEvent(null)}
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-4 px-5 py-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-0.5">
                        <p className="text-[12px] font-normal text-black">{ev.title}</p>
                        <span className="text-[8px] font-light uppercase tracking-[0.2em] text-black/35">
                          {TYPE_LABELS[ev.type]}
                        </span>
                        {!ev.active && (
                          <span className="text-[8px] uppercase tracking-[0.15em] px-1.5 py-0.5 bg-black/5 text-black/30 rounded-[2px]">
                            Masqué
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] font-light text-black/40">
                        {new Date(ev.date + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                        {ev.heure ? ` · ${ev.heure.slice(0, 5)}` : ''}
                        {ev.location ? ` · ${ev.location}` : ''}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <button
                        onClick={() => toggleRegistrationOpen(ev)}
                        className={`text-[8px] font-normal uppercase tracking-[0.15em] px-2.5 py-1 rounded-[2px] transition-colors ${
                          ev.registration_open
                            ? 'bg-[oklch(57%_0.065_68)/10] text-[oklch(40%_0.065_68)]'
                            : 'bg-black/5 text-black/35'
                        }`}
                      >
                        {ev.registration_open ? 'Inscriptions ouvertes' : 'Fermées'}
                      </button>
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : ev.id)}
                        className="flex items-center gap-1 text-[10px] font-light text-black/40 hover:text-black transition-colors"
                      >
                        <Users size={13} /> {count}
                        {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                      </button>
                      <button
                        onClick={() => { setEditEvent(ev); setShowForm(false); }}
                        className="text-[10px] font-light text-black/40 hover:text-black transition-colors border-b border-black/20 pb-px"
                      >
                        Modifier
                      </button>
                      <button
                        onClick={() => handleDelete(ev.id)}
                        className="text-[10px] font-light text-red-400 hover:text-red-600 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                )}
                {isExpanded && !isEditing && <RegistrantsList eventId={ev.id} />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminEvenements;
