import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button, Form, Input, TextArea, cn } from '@heroui/react';
import { supabase } from '../lib/supabaseClient';

type MenuCategory = 'wellness' | 'energie' | 'shakes' | 'coffee';
type EventType = 'popup' | 'event';

const Admin = () => {
  const [productForm, setProductForm] = useState({
    name: '',
    category: 'wellness' as MenuCategory,
    price: '',
    calories: '',
    protein: '',
    description: '',
    ingredients: '',
    benefits: ''
  });

  const [eventForm, setEventForm] = useState({
    title: '',
    date: '',
    location: '',
    type: 'popup' as EventType,
    description: ''
  });

  const [productImageFile, setProductImageFile] = useState<File | null>(null);
  const [eventImageFile, setEventImageFile] = useState<File | null>(null);
  const [products, setProducts] = useState<Array<{ name: string; category: MenuCategory; price?: string | number | null; [key: string]: unknown }>>([]);
  const [events, setEvents] = useState<Array<{ title: string; date?: string | null; location?: string | null; type: EventType; description?: string | null; [key: string]: unknown }>>([]);
  const [loadingProduct, setLoadingProduct] = useState(false);
  const [loadingEvent, setLoadingEvent] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const uploadImage = async (file: File) => {
    const ext = file.name.split('.').pop();
    const path = `admin/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('pessora-media').upload(path, file, { upsert: true });
    if (error) throw new Error(error.message);
    const { data } = supabase.storage.from('pessora-media').getPublicUrl(path);
    return data.publicUrl;
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name.trim()) return;
    setLoadingProduct(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const imageUrl = productImageFile ? await uploadImage(productImageFile) : '';
      const payload = {
        name: productForm.name,
        category: productForm.category,
        price: productForm.price ? Number(productForm.price) : null,
        calories: productForm.calories ? Number(productForm.calories) : null,
        protein: productForm.protein ? Number(productForm.protein) : null,
        description: productForm.description || null,
        ingredients: productForm.ingredients
          ? productForm.ingredients.split(',').map((i) => i.trim()).filter(Boolean)
          : [],
        benefits: productForm.benefits
          ? productForm.benefits.split(',').map((b) => b.trim()).filter(Boolean)
          : [],
        image_url: imageUrl || null
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: insertErr } = await supabase.from('products').insert(payload as any);
      if (insertErr) throw new Error(insertErr.message);

      setProducts((prev) => [payload, ...prev]);
      setSuccessMessage('Produit ajouté avec succès.');
      setProductForm({
        name: '',
        category: 'wellness',
        price: '',
        calories: '',
        protein: '',
        description: '',
        ingredients: '',
        benefits: ''
      });
      setProductImageFile(null);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Erreur lors de l’ajout du produit.');
    } finally {
      setLoadingProduct(false);
    }
  };

  const handleEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventForm.title.trim()) return;
    setLoadingEvent(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const imageUrl = eventImageFile ? await uploadImage(eventImageFile) : '';
      const payload = {
        title: eventForm.title,
        date: eventForm.date || null,
        location: eventForm.location || null,
        type: eventForm.type,
        description: eventForm.description || null,
        image_url: imageUrl || null
      };

      const eventRow = { ...payload, slug: eventForm.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''), heure: null, places_max: null, active: true };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: insertErr } = await supabase.from('events').insert(eventRow as any);
      if (insertErr) throw new Error(insertErr.message);

      setEvents((prev) => [payload, ...prev]);
      setSuccessMessage('Événement ajouté avec succès.');
      setEventForm({
        title: '',
        date: '',
        location: '',
        type: 'popup',
        description: ''
      });
      setEventImageFile(null);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Erreur lors de l’ajout de l’événement.');
    } finally {
      setLoadingEvent(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F7F2] pt-[10.25rem] pb-24 font-sans selection:bg-primary-forest/20">
      <div className="container-custom">
        <div className="mb-16">
          <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-primary/40 mb-4 block">Espace Admin</span>
          <h1 className="text-5xl md:text-7xl font-serif text-primary tracking-tighter">
            Gestion <span className="italic text-primary-forest">PessÓra</span>
          </h1>
          <p className="text-primary/60 mt-4 max-w-2xl font-light">
            Ajoutez vos produits et événements. Les images sont envoyées via l’API (o2switch) et les URLs stockées en base.
          </p>
          {(errorMessage || successMessage) && (
            <div className={`mt-6 px-4 py-3 rounded-2xl text-sm ${errorMessage ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-800'}`}>
              {errorMessage || successMessage}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* --- PRODUITS --- */}
          <section className="space-y-8">
            <h2 className="text-3xl font-serif text-primary">Ajouter un produit</h2>
            <Form
              onSubmit={handleProductSubmit}
              className="space-y-6 rounded-3xl border border-primary/5 bg-white p-8 shadow-sm"
            >
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <Input
                  type="text"
                  placeholder="Nom du produit"
                  variant="secondary"
                  className={cn(
                    'w-full rounded-2xl border border-primary/10 bg-[#F5F0E8] px-4 py-3',
                    'focus-visible:ring-2 focus-visible:ring-primary/10'
                  )}
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                />
                <select
                  className="w-full rounded-2xl border border-primary/10 px-4 py-3 bg-[#F5F0E8] focus:outline-none focus:ring-2 focus:ring-primary/10"
                  value={productForm.category}
                  onChange={(e) => setProductForm({ ...productForm, category: e.target.value as MenuCategory })}
                >
                  <option value="wellness">Wellness</option>
                  <option value="energie">Énergie</option>
                  <option value="shakes">Shakes</option>
                  <option value="coffee">Coffee</option>
                </select>
                <Input
                  type="text"
                  placeholder="Prix (€)"
                  variant="secondary"
                  className={cn(
                    'w-full rounded-2xl border border-primary/10 bg-[#F5F0E8] px-4 py-3',
                    'focus-visible:ring-2 focus-visible:ring-primary/10'
                  )}
                  value={productForm.price}
                  onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                />
                <Input
                  type="text"
                  placeholder="Calories"
                  variant="secondary"
                  className={cn(
                    'w-full rounded-2xl border border-primary/10 bg-[#F5F0E8] px-4 py-3',
                    'focus-visible:ring-2 focus-visible:ring-primary/10'
                  )}
                  value={productForm.calories}
                  onChange={(e) => setProductForm({ ...productForm, calories: e.target.value })}
                />
                <Input
                  type="text"
                  placeholder="Protéines (g)"
                  variant="secondary"
                  className={cn(
                    'w-full rounded-2xl border border-primary/10 bg-[#F5F0E8] px-4 py-3',
                    'focus-visible:ring-2 focus-visible:ring-primary/10'
                  )}
                  value={productForm.protein}
                  onChange={(e) => setProductForm({ ...productForm, protein: e.target.value })}
                />
              </div>

              <TextArea
                placeholder="Description courte"
                variant="secondary"
                className={cn(
                  'w-full rounded-2xl border border-primary/10 bg-[#F5F0E8] px-4 py-3',
                  'focus-visible:ring-2 focus-visible:ring-primary/10'
                )}
                value={productForm.description}
                onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
              />
              <TextArea
                placeholder="Ingrédients (séparés par des virgules)"
                variant="secondary"
                className={cn(
                  'w-full rounded-2xl border border-primary/10 bg-[#F5F0E8] px-4 py-3',
                  'focus-visible:ring-2 focus-visible:ring-primary/10'
                )}
                value={productForm.ingredients}
                onChange={(e) => setProductForm({ ...productForm, ingredients: e.target.value })}
              />
              <TextArea
                placeholder="Bénéfices (séparés par des virgules)"
                variant="secondary"
                className={cn(
                  'w-full rounded-2xl border border-primary/10 bg-[#F5F0E8] px-4 py-3',
                  'focus-visible:ring-2 focus-visible:ring-primary/10'
                )}
                value={productForm.benefits}
                onChange={(e) => setProductForm({ ...productForm, benefits: e.target.value })}
              />
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-primary/40">Image produit</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setProductImageFile(e.target.files?.[0] || null)}
                  className="w-full text-sm"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                isDisabled={loadingProduct}
                className="flex items-center gap-2 bg-primary-forest text-white hover:bg-primary"
              >
                <Plus size={16} /> {loadingProduct ? 'Ajout en cours...' : 'Ajouter le produit'}
              </Button>
            </Form>

            <div className="space-y-4">
              {products.map((p, i) => (
                <div key={`${p.name}-${i}`} className="bg-white/70 rounded-2xl p-4 border border-primary/5 flex items-center justify-between">
                  <div>
                    <p className="font-serif text-primary">{p.name}</p>
                    <p className="text-xs text-primary/50 uppercase tracking-widest">{p.category} • {p.price || '—'}€</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    isIconOnly
                    aria-label="Retirer de la liste"
                    onPress={() => setProducts((prev) => prev.filter((_, idx) => idx !== i))}
                    className="text-primary/40 hover:text-red-500"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              ))}
            </div>
          </section>

          {/* --- ÉVÉNEMENTS --- */}
          <section className="space-y-8">
            <h2 className="text-3xl font-serif text-primary">Ajouter un événement</h2>
            <Form
              onSubmit={handleEventSubmit}
              className="space-y-6 rounded-3xl border border-primary/5 bg-white p-8 shadow-sm"
            >
              <Input
                type="text"
                placeholder="Titre de l'événement"
                variant="secondary"
                className={cn(
                  'w-full rounded-2xl border border-primary/10 bg-[#F5F0E8] px-4 py-3',
                  'focus-visible:ring-2 focus-visible:ring-primary/10'
                )}
                value={eventForm.title}
                onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
              />
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <Input
                  type="text"
                  placeholder="Date (ex: 12/03/2026)"
                  variant="secondary"
                  className={cn(
                    'w-full rounded-2xl border border-primary/10 bg-[#F5F0E8] px-4 py-3',
                    'focus-visible:ring-2 focus-visible:ring-primary/10'
                  )}
                  value={eventForm.date}
                  onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
                />
                <Input
                  type="text"
                  placeholder="Lieu"
                  variant="secondary"
                  className={cn(
                    'w-full rounded-2xl border border-primary/10 bg-[#F5F0E8] px-4 py-3',
                    'focus-visible:ring-2 focus-visible:ring-primary/10'
                  )}
                  value={eventForm.location}
                  onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                />
                <select
                  className="w-full rounded-2xl border border-primary/10 px-4 py-3 bg-[#F5F0E8] focus:outline-none focus:ring-2 focus:ring-primary/10"
                  value={eventForm.type}
                  onChange={(e) => setEventForm({ ...eventForm, type: e.target.value as EventType })}
                >
                  <option value="popup">Pop-up</option>
                  <option value="event">Événement</option>
                </select>
              </div>
              <TextArea
                placeholder="Description"
                variant="secondary"
                className={cn(
                  'w-full rounded-2xl border border-primary/10 bg-[#F5F0E8] px-4 py-3',
                  'focus-visible:ring-2 focus-visible:ring-primary/10'
                )}
                value={eventForm.description}
                onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
              />
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-primary/40">Image événement</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setEventImageFile(e.target.files?.[0] || null)}
                  className="w-full text-sm"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                isDisabled={loadingEvent}
                className="flex items-center gap-2 bg-primary-forest text-white hover:bg-primary"
              >
                <Plus size={16} /> {loadingEvent ? 'Ajout en cours...' : "Ajouter l'événement"}
              </Button>
            </Form>

            <div className="space-y-4">
              {events.map((ev, i) => (
                <div key={`${ev.title}-${i}`} className="bg-white/70 rounded-2xl p-4 border border-primary/5 flex items-center justify-between">
                  <div>
                    <p className="font-serif text-primary">{ev.title}</p>
                    <p className="text-xs text-primary/50 uppercase tracking-widest">{ev.date || '—'} • {ev.location || '—'}</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    isIconOnly
                    aria-label="Retirer de la liste"
                    onPress={() => setEvents((prev) => prev.filter((_, idx) => idx !== i))}
                    className="text-primary/40 hover:text-red-500"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Admin;
