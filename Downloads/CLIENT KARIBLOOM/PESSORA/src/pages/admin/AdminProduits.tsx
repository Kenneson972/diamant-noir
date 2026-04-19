// src/pages/admin/AdminProduits.tsx
import { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import type { Product } from '../../types/database';

const CATEGORIES = ['wellness', 'energie', 'shakes', 'coffee'];

const EMPTY_FORM = {
  name: '',
  category: 'shakes',
  price: '',
  calories: '',
  protein: '',
  description: '',
  image_url: '',
  active: true,
};
type FormState = typeof EMPTY_FORM;

const ProductForm = ({
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
    if (!form.name) { setError('Nom requis.'); return; }
    setSaving(true);
    setError(null);
    try { await onSave(form); } catch (e) { setError(e instanceof Error ? e.message : 'Erreur'); }
    finally { setSaving(false); }
  };

  const inputClass = 'w-full h-10 bg-[oklch(98.5%_0.004_55)] rounded-[2px] border border-black/[0.08] px-3 text-[12px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20';

  return (
    <div className="bg-white rounded-[2px] border border-black/[0.06] p-6 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="md:col-span-2">
          <label className="block text-[9px] uppercase tracking-[0.2em] text-black/35 mb-1.5">Nom *</label>
          <input className={inputClass} value={form.name} onChange={e => set('name', e.target.value)} />
        </div>
        <div>
          <label className="block text-[9px] uppercase tracking-[0.2em] text-black/35 mb-1.5">Catégorie</label>
          <select className={inputClass} value={form.category} onChange={e => set('category', e.target.value)}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[9px] uppercase tracking-[0.2em] text-black/35 mb-1.5">Prix (€)</label>
          <input type="number" step="0.01" className={inputClass} value={form.price}
            onChange={e => set('price', e.target.value)} placeholder="0.00" />
        </div>
        <div>
          <label className="block text-[9px] uppercase tracking-[0.2em] text-black/35 mb-1.5">Calories</label>
          <input type="number" className={inputClass} value={form.calories}
            onChange={e => set('calories', e.target.value)} />
        </div>
        <div>
          <label className="block text-[9px] uppercase tracking-[0.2em] text-black/35 mb-1.5">Protéines (g)</label>
          <input type="number" className={inputClass} value={form.protein}
            onChange={e => set('protein', e.target.value)} />
        </div>
        <div className="md:col-span-3">
          <label className="block text-[9px] uppercase tracking-[0.2em] text-black/35 mb-1.5">Description</label>
          <textarea className={`${inputClass} h-20 py-2.5 resize-none`} value={form.description}
            onChange={e => set('description', e.target.value)} />
        </div>
        <div className="md:col-span-2">
          <label className="block text-[9px] uppercase tracking-[0.2em] text-black/35 mb-1.5">Image URL</label>
          <input className={inputClass} value={form.image_url} onChange={e => set('image_url', e.target.value)} />
        </div>
        <div className="flex items-end pb-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.active} onChange={e => set('active', e.target.checked)}
              className="w-4 h-4 accent-black" />
            <span className="text-[11px] text-black/60">Visible sur le menu</span>
          </label>
        </div>
      </div>
      {error && <p className="text-[11px] text-red-500/80 mb-3">{error}</p>}
      <div className="flex gap-3">
        <button onClick={handleSave} disabled={saving}
          className="h-10 px-6 bg-black text-white rounded-[2px] text-[10px] font-normal uppercase tracking-[0.12em] hover:bg-black/85 transition-colors disabled:opacity-40">
          {saving ? 'Sauvegarde…' : 'Sauvegarder'}
        </button>
        <button onClick={onCancel}
          className="h-10 px-6 border border-black/15 rounded-[2px] text-[10px] font-light uppercase tracking-[0.12em] text-black/50 hover:border-black/30 hover:text-black transition-colors">
          Annuler
        </button>
      </div>
    </div>
  );
};

const AdminProduits = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [filterCat, setFilterCat] = useState('all');

  const fetchProducts = () => {
    setLoading(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('products')
      .select('*')
      .order('category', { ascending: true })
      .order('name', { ascending: true })
      .then(({ data }: { data: Product[] | null }) => {
        setProducts(data ?? []);
        setLoading(false);
      });
  };

  useEffect(() => { fetchProducts(); }, []);

  const handleCreate = async (form: FormState) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from('products').insert({
      name: form.name,
      category: form.category,
      price: form.price ? Number(form.price) : null,
      calories: form.calories ? Number(form.calories) : null,
      protein: form.protein ? Number(form.protein) : null,
      description: form.description || null,
      image_url: form.image_url || null,
      active: form.active,
    });
    if (error) throw new Error(error.message);
    setShowForm(false);
    fetchProducts();
  };

  const handleUpdate = async (form: FormState) => {
    if (!editProduct) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from('products').update({
      name: form.name,
      category: form.category,
      price: form.price ? Number(form.price) : null,
      calories: form.calories ? Number(form.calories) : null,
      protein: form.protein ? Number(form.protein) : null,
      description: form.description || null,
      image_url: form.image_url || null,
      active: form.active,
    }).eq('id', editProduct.id);
    if (error) throw new Error(error.message);
    setEditProduct(null);
    fetchProducts();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Supprimer ce produit ?')) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('products').delete().eq('id', id);
    fetchProducts();
  };

  const filtered = filterCat === 'all' ? products : products.filter(p => p.category === filterCat);

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="font-display font-normal text-[32px] text-black leading-none"
            style={{ fontFamily: 'var(--font-display)' }}>
          Produits
        </h1>
        <button
          onClick={() => { setShowForm(true); setEditProduct(null); }}
          className="flex items-center gap-2 h-10 px-5 bg-black text-white rounded-[2px] text-[10px] font-normal uppercase tracking-[0.12em] hover:bg-black/85 transition-colors"
        >
          <Plus size={14} /> Ajouter
        </button>
      </div>

      {showForm && !editProduct && (
        <ProductForm onSave={handleCreate} onCancel={() => setShowForm(false)} />
      )}

      <div className="flex gap-2 mb-5">
        {['all', ...CATEGORIES].map(cat => (
          <button key={cat}
            onClick={() => setFilterCat(cat)}
            className={`h-8 px-4 rounded-full text-[10px] font-light tracking-[0.06em] transition-colors ${
              filterCat === cat
                ? 'bg-black text-white'
                : 'border border-black/15 text-black/50 hover:border-black/30 hover:text-black'
            }`}
          >
            {cat === 'all' ? 'Tous' : cat}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-[11px] text-black/30">Chargement…</p>
      ) : (
        <div className="bg-white rounded-[2px] border border-black/[0.06] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-black/[0.05]">
                {['Nom', 'Catégorie', 'Prix', 'Cal.', 'Prot.', 'Statut', ''].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-[8px] font-normal uppercase tracking-[0.25em] text-black/35">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-6 text-[11px] text-black/30">Aucun produit.</td></tr>
              ) : filtered.map(p => {
                const isEditing = editProduct?.id === p.id;
                if (isEditing) {
                  return (
                    <tr key={p.id}>
                      <td colSpan={7} className="p-4">
                        <ProductForm
                          initial={{
                            name: p.name, category: p.category,
                            price: p.price ? String(p.price) : '',
                            calories: p.calories ? String(p.calories) : '',
                            protein: p.protein ? String(p.protein) : '',
                            description: p.description ?? '',
                            image_url: p.image_url ?? '',
                            active: p.active,
                          }}
                          onSave={handleUpdate}
                          onCancel={() => setEditProduct(null)}
                        />
                      </td>
                    </tr>
                  );
                }
                return (
                  <tr key={p.id} className="border-b border-black/[0.04] hover:bg-black/[0.02]">
                    <td className="px-5 py-4 text-[12px] font-normal text-black">{p.name}</td>
                    <td className="px-5 py-4 text-[10px] text-black/40 uppercase tracking-[0.08em]">{p.category}</td>
                    <td className="px-5 py-4 text-[12px] text-black">{p.price ? `${p.price.toFixed(2).replace('.', ',')}€` : '—'}</td>
                    <td className="px-5 py-4 text-[11px] text-black/40">{p.calories ?? '—'}</td>
                    <td className="px-5 py-4 text-[11px] text-black/40">{p.protein ? `${p.protein}g` : '—'}</td>
                    <td className="px-5 py-4">
                      <span className={`text-[8px] uppercase tracking-[0.12em] px-2 py-[3px] rounded-[2px] ${
                        p.active ? 'bg-[oklch(57%_0.065_68)/10] text-[oklch(40%_0.065_68)]' : 'bg-black/5 text-black/30'
                      }`}>
                        {p.active ? 'Visible' : 'Masqué'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <button onClick={() => { setEditProduct(p); setShowForm(false); }}
                          className="text-[10px] font-light text-black/40 hover:text-black border-b border-black/20 pb-px transition-colors">
                          Modifier
                        </button>
                        <button onClick={() => handleDelete(p.id)}
                          className="text-red-400 hover:text-red-600 transition-colors">
                          <X size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminProduits;
