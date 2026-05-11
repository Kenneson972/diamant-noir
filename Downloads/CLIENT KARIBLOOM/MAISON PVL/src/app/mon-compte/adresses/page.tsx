'use client';

import { useState, type FormEvent } from 'react';
import { MapPin, Plus, Pencil, Trash2 } from 'lucide-react';

interface Address {
  id: string;
  first_name: string;
  last_name: string;
  line1: string;
  line2?: string;
  city: string;
  postal_code: string;
  country: string;
  phone?: string;
  is_default: boolean;
}

const PLACEHOLDER_ADDRESSES: Address[] = [
  {
    id: '1',
    first_name: 'Jean',
    last_name: 'Dupont',
    line1: '12 Rue de la Paix',
    city: 'Paris',
    postal_code: '75001',
    country: 'France',
    phone: '+33 6 12 34 56 78',
    is_default: true,
  },
];

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>(PLACEHOLDER_ADDRESSES);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    line1: '',
    line2: '',
    city: '',
    postal_code: '',
    country: 'France',
    phone: '',
    is_default: false,
  });

  const resetForm = () => {
    setForm({
      first_name: '',
      last_name: '',
      line1: '',
      line2: '',
      city: '',
      postal_code: '',
      country: 'France',
      phone: '',
      is_default: false,
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (editingId) {
      setAddresses((prev) =>
        prev.map((a) =>
          a.id === editingId ? { ...form, id: editingId } : a
        )
      );
    } else {
      setAddresses((prev) => [
        ...prev.map((a) => (form.is_default ? { ...a, is_default: false } : a)),
        { ...form, id: Date.now().toString() },
      ]);
    }
    resetForm();
  };

  const handleEdit = (address: Address) => {
    setForm({
      first_name: address.first_name,
      last_name: address.last_name,
      line1: address.line1,
      line2: address.line2 || '',
      city: address.city,
      postal_code: address.postal_code,
      country: address.country,
      phone: address.phone || '',
      is_default: address.is_default,
    });
    setEditingId(address.id);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    setAddresses((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="font-display text-2xl md:text-3xl mb-2">
            Mes adresses
          </h2>
          <p className="text-sm text-pvl-slate">
            Gérez vos adresses de livraison.
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-pvl-black text-pvl-white px-5 py-2.5 text-[0.6875rem] font-medium uppercase tracking-[0.2em] hover:bg-pvl-charcoal transition-colors"
          >
            <Plus size={14} />
            Ajouter
          </button>
        )}
      </div>

      {addresses.length === 0 && !showForm ? (
        <div className="text-center py-16">
          <MapPin size={40} className="mx-auto text-pvl-stone mb-6" strokeWidth={1.5} />
          <h3 className="font-display text-xl mb-2">
            Aucune adresse enregistrée
          </h3>
          <p className="text-sm text-pvl-slate mb-8">
            Ajoutez une adresse pour faciliter vos futurs achats.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-block bg-pvl-black text-pvl-white px-8 py-3 text-[0.6875rem] font-medium uppercase tracking-[0.2em] hover:bg-pvl-charcoal transition-colors"
          >
            Ajouter une adresse
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {addresses.map((address) => (
            <div
              key={address.id}
              className="border border-pvl-black/12 p-6 relative"
            >
              {address.is_default && (
                <span className="inline-block text-[0.5625rem] font-medium uppercase tracking-[0.15em] text-pvl-white bg-pvl-black px-2.5 py-1 mb-3">
                  Adresse par défaut
                </span>
              )}
              <div className="text-sm leading-relaxed mb-4">
                <p className="font-medium">
                  {address.first_name} {address.last_name}
                </p>
                <p className="text-pvl-slate">{address.line1}</p>
                {address.line2 && (
                  <p className="text-pvl-slate">{address.line2}</p>
                )}
                <p className="text-pvl-slate">
                  {address.postal_code} {address.city}
                </p>
                <p className="text-pvl-slate">{address.country}</p>
                {address.phone && (
                  <p className="text-pvl-stone mt-1 text-xs">{address.phone}</p>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => handleEdit(address)}
                  className="flex items-center gap-1.5 text-[0.625rem] uppercase tracking-[0.1em] text-pvl-slate hover:text-pvl-black transition-colors"
                >
                  <Pencil size={12} />
                  Modifier
                </button>
                <button
                  onClick={() => handleDelete(address.id)}
                  className="flex items-center gap-1.5 text-[0.625rem] uppercase tracking-[0.1em] text-pvl-stone hover:text-pvl-error transition-colors"
                >
                  <Trash2 size={12} />
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Address form */}
      {showForm && (
        <div className="mt-8 border border-pvl-black/12 p-6 md:p-8">
          <h3 className="text-[0.6875rem] font-semibold uppercase tracking-[0.2em] mb-6">
            {editingId ? "Modifier l'adresse" : 'Nouvelle adresse'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="firstName"
                  className="block text-[0.625rem] uppercase tracking-[0.15em] text-pvl-slate mb-2"
                >
                  Prénom
                </label>
                <input
                  id="firstName"
                  type="text"
                  value={form.first_name}
                  onChange={(e) =>
                    setForm({ ...form, first_name: e.target.value })
                  }
                  required
                  className="w-full border border-pvl-black/12 px-4 py-3 text-sm focus:outline-none focus:border-pvl-black transition-colors"
                />
              </div>
              <div>
                <label
                  htmlFor="lastName"
                  className="block text-[0.625rem] uppercase tracking-[0.15em] text-pvl-slate mb-2"
                >
                  Nom
                </label>
                <input
                  id="lastName"
                  type="text"
                  value={form.last_name}
                  onChange={(e) =>
                    setForm({ ...form, last_name: e.target.value })
                  }
                  required
                  className="w-full border border-pvl-black/12 px-4 py-3 text-sm focus:outline-none focus:border-pvl-black transition-colors"
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="line1"
                className="block text-[0.625rem] uppercase tracking-[0.15em] text-pvl-slate mb-2"
              >
                Adresse
              </label>
              <input
                id="line1"
                type="text"
                value={form.line1}
                onChange={(e) => setForm({ ...form, line1: e.target.value })}
                required
                className="w-full border border-pvl-black/12 px-4 py-3 text-sm focus:outline-none focus:border-pvl-black transition-colors"
              />
            </div>
            <div>
              <label
                htmlFor="line2"
                className="block text-[0.625rem] uppercase tracking-[0.15em] text-pvl-slate mb-2"
              >
                Complément d&apos;adresse (optionnel)
              </label>
              <input
                id="line2"
                type="text"
                value={form.line2}
                onChange={(e) => setForm({ ...form, line2: e.target.value })}
                className="w-full border border-pvl-black/12 px-4 py-3 text-sm focus:outline-none focus:border-pvl-black transition-colors"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label
                  htmlFor="postalCode"
                  className="block text-[0.625rem] uppercase tracking-[0.15em] text-pvl-slate mb-2"
                >
                  Code postal
                </label>
                <input
                  id="postalCode"
                  type="text"
                  value={form.postal_code}
                  onChange={(e) =>
                    setForm({ ...form, postal_code: e.target.value })
                  }
                  required
                  className="w-full border border-pvl-black/12 px-4 py-3 text-sm focus:outline-none focus:border-pvl-black transition-colors"
                />
              </div>
              <div>
                <label
                  htmlFor="city"
                  className="block text-[0.625rem] uppercase tracking-[0.15em] text-pvl-slate mb-2"
                >
                  Ville
                </label>
                <input
                  id="city"
                  type="text"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  required
                  className="w-full border border-pvl-black/12 px-4 py-3 text-sm focus:outline-none focus:border-pvl-black transition-colors"
                />
              </div>
              <div>
                <label
                  htmlFor="country"
                  className="block text-[0.625rem] uppercase tracking-[0.15em] text-pvl-slate mb-2"
                >
                  Pays
                </label>
                <input
                  id="country"
                  type="text"
                  value={form.country}
                  onChange={(e) =>
                    setForm({ ...form, country: e.target.value })
                  }
                  required
                  className="w-full border border-pvl-black/12 px-4 py-3 text-sm focus:outline-none focus:border-pvl-black transition-colors"
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="phone"
                className="block text-[0.625rem] uppercase tracking-[0.15em] text-pvl-slate mb-2"
              >
                Téléphone (optionnel)
              </label>
              <input
                id="phone"
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full border border-pvl-black/12 px-4 py-3 text-sm focus:outline-none focus:border-pvl-black transition-colors"
              />
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_default}
                onChange={(e) =>
                  setForm({ ...form, is_default: e.target.checked })
                }
                className="w-4 h-4 accent-pvl-black"
              />
              <span className="text-sm text-pvl-slate">
                Définir comme adresse par défaut
              </span>
            </label>
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                className="bg-pvl-black text-pvl-white px-8 py-3 text-[0.6875rem] font-medium uppercase tracking-[0.2em] hover:bg-pvl-charcoal transition-colors"
              >
                {editingId ? 'Enregistrer' : 'Ajouter'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="border border-pvl-black/20 px-8 py-3 text-[0.6875rem] font-medium uppercase tracking-[0.2em] hover:bg-pvl-cream transition-colors"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
