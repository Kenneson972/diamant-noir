'use client';

import { useState } from 'react';
import { User } from 'lucide-react';

export default function ProfilePage() {
  const [form, setForm] = useState({
    first_name: 'Marie',
    last_name: 'Dubois',
    email: 'marie.dubois@email.com',
    phone: '+33 6 12 34 56 78',
  });

  const [saved, setSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 bg-pvl-cream rounded-full flex items-center justify-center">
          <User size={24} className="text-pvl-stone" />
        </div>
        <div>
          <h2 className="font-display text-xl">Mon profil</h2>
          <p className="text-sm text-pvl-slate">
            Gérez vos informations personnelles
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-lg space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-[0.6875rem] uppercase tracking-[0.1em] text-pvl-slate block mb-1">
              Prénom
            </label>
            <input
              type="text"
              value={form.first_name}
              onChange={(e) => updateField('first_name', e.target.value)}
              required
              className="w-full border border-pvl-black/10 px-3 py-2.5 text-sm bg-transparent focus:outline-none focus:border-pvl-black transition-colors"
            />
          </div>
          <div>
            <label className="text-[0.6875rem] uppercase tracking-[0.1em] text-pvl-slate block mb-1">
              Nom
            </label>
            <input
              type="text"
              value={form.last_name}
              onChange={(e) => updateField('last_name', e.target.value)}
              required
              className="w-full border border-pvl-black/10 px-3 py-2.5 text-sm bg-transparent focus:outline-none focus:border-pvl-black transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="text-[0.6875rem] uppercase tracking-[0.1em] text-pvl-slate block mb-1">
            Email
          </label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => updateField('email', e.target.value)}
            required
            className="w-full border border-pvl-black/10 px-3 py-2.5 text-sm bg-transparent focus:outline-none focus:border-pvl-black transition-colors"
          />
        </div>

        <div>
          <label className="text-[0.6875rem] uppercase tracking-[0.1em] text-pvl-slate block mb-1">
            Téléphone
          </label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => updateField('phone', e.target.value)}
            className="w-full border border-pvl-black/10 px-3 py-2.5 text-sm bg-transparent focus:outline-none focus:border-pvl-black transition-colors"
          />
        </div>

        <div className="pt-2">
          <button
            type="submit"
            className="text-[0.6875rem] uppercase tracking-[0.2em] text-pvl-white bg-pvl-black px-8 py-3.5 hover:bg-pvl-charcoal transition-colors"
          >
            Enregistrer
          </button>
          {saved && (
            <span className="ml-4 text-xs text-pvl-success">
              Modifications enregistrées
            </span>
          )}
        </div>
      </form>

      <hr className="border-pvl-black/6" />

      <div>
        <h3 className="font-display text-lg mb-3">Mot de passe</h3>
        <a
          href="/reinitialisation"
          className="text-[0.6875rem] uppercase tracking-[0.15em] text-pvl-slate hover:text-pvl-black transition-colors"
        >
          Modifier mon mot de passe
        </a>
      </div>
    </div>
  );
}
