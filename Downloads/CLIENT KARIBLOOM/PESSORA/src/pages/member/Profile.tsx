// src/pages/member/Profile.tsx
import { useState } from 'react';
import { User, Mail, Phone, Shield, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';

const Profile = () => {
  const { user, logout, updateProfile } = useAuth();

  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [prefs, setPrefs] = useState({
    notifications: true,
    newsletter: true,
  });

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    : '—';

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    try {
      await updateProfile({ firstName, lastName, phone });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('profiles')
        .update({ preferences: prefs })
        .eq('id', user?.id);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const togglePref = (key: 'notifications' | 'newsletter') => {
    setPrefs(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Left — Identity */}
      <div className="lg:col-span-4 flex flex-col gap-4">
        <div className="bg-white rounded-[2px] p-8 text-center border border-black/[0.06]">
          <div className="w-24 h-24 bg-black/[0.04] rounded-full mx-auto mb-6 flex items-center justify-center">
            <span
              className="text-3xl font-light text-black/40"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {(firstName[0] ?? user?.email?.[0] ?? '?').toUpperCase()}
            </span>
          </div>
          <h2
            className="font-display font-normal text-[22px] text-black mb-1"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {firstName} {lastName}
          </h2>
          <p className="text-[10px] font-normal uppercase tracking-[0.2em] text-black/35 mb-6">
            Membre depuis {memberSince}
          </p>
        </div>

        <div className="bg-[oklch(8%_0.005_55)] rounded-[2px] p-6 text-white">
          <p className="text-[9px] font-normal uppercase tracking-[0.2em] text-white/30 mb-5">
            Préférences
          </p>
          <div className="flex flex-col gap-4">
            {([
              { key: 'notifications' as const, label: 'Notifications' },
              { key: 'newsletter' as const, label: 'Newsletter' },
            ]).map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-[12px] font-light text-white/65">{label}</span>
                <button
                  type="button"
                  aria-label={`${label} ${prefs[key] ? 'activé' : 'désactivé'}`}
                  onClick={() => togglePref(key)}
                  className={`w-9 h-5 rounded-full p-[3px] transition-colors duration-200 flex items-center ${prefs[key] ? 'bg-[oklch(57%_0.065_68)]' : 'bg-white/15'}`}
                >
                  <div className={`w-3.5 h-3.5 bg-white rounded-full transition-transform duration-200 ${prefs[key] ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — Forms */}
      <div className="lg:col-span-8 flex flex-col gap-4">
        <div className="bg-white rounded-[2px] p-8 border border-black/[0.06]">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-[13px] font-normal text-black">Informations Personnelles</h3>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="text-[10px] font-normal uppercase tracking-[0.1em] text-black/35 hover:text-black transition-colors duration-200 disabled:opacity-40"
            >
              {saving ? 'Sauvegarde…' : saveSuccess ? 'Sauvegardé ✓' : 'Sauvegarder'}
            </button>
          </div>

          {saveError && (
            <p className="text-[11px] text-red-500/80 mb-4">{saveError}</p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[
              { label: 'Prénom', Icon: User, value: firstName, onChange: setFirstName, type: 'text' },
              { label: 'Nom', Icon: User, value: lastName, onChange: setLastName, type: 'text' },
            ].map((field) => (
              <div key={field.label} className="flex flex-col gap-2">
                <label className="text-[9px] font-normal uppercase tracking-[0.2em] text-black/35 flex items-center gap-1.5">
                  <field.Icon size={11} strokeWidth={1.3} />
                  {field.label}
                </label>
                <input
                  type={field.type}
                  value={field.value}
                  onChange={e => field.onChange(e.target.value)}
                  className="w-full h-11 bg-black/[0.03] rounded-[2px] px-4 text-[13px] font-normal text-black border border-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 transition-colors duration-200"
                />
              </div>
            ))}
            <div className="flex flex-col gap-2">
              <label className="text-[9px] font-normal uppercase tracking-[0.2em] text-black/35 flex items-center gap-1.5">
                <Mail size={11} strokeWidth={1.3} /> Email
              </label>
              <input
                type="email"
                value={user?.email ?? ''}
                disabled
                className="w-full h-11 bg-black/[0.03] rounded-[2px] px-4 text-[13px] font-normal text-black/40 border border-transparent cursor-not-allowed"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[9px] font-normal uppercase tracking-[0.2em] text-black/35 flex items-center gap-1.5">
                <Phone size={11} strokeWidth={1.3} /> Téléphone
              </label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+596 696 00 00 00"
                className="w-full h-11 bg-black/[0.03] rounded-[2px] px-4 text-[13px] font-normal text-black border border-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 transition-colors duration-200"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button className="bg-white rounded-[2px] p-6 text-left hover:bg-black/[0.02] transition-colors duration-200 border border-black/[0.06]">
            <div className="w-9 h-9 bg-black/[0.04] rounded-[2px] flex items-center justify-center text-black/50 mb-4">
              <Shield size={17} strokeWidth={1.3} />
            </div>
            <h4 className="text-[13px] font-normal text-black mb-1">Sécurité</h4>
            <p className="text-[11px] font-light text-black/40">Changer mot de passe</p>
          </button>

          <button
            onClick={logout}
            className="bg-white rounded-[2px] p-6 text-left hover:bg-red-50/40 transition-colors duration-200 border border-black/[0.06] group"
          >
            <div className="w-9 h-9 bg-black/[0.04] rounded-[2px] flex items-center justify-center text-black/50 mb-4 group-hover:bg-red-50 group-hover:text-red-500 transition-colors duration-200">
              <LogOut size={17} strokeWidth={1.3} />
            </div>
            <h4 className="text-[13px] font-normal text-black mb-1 group-hover:text-red-600 transition-colors duration-200">
              Déconnexion
            </h4>
            <p className="text-[11px] font-light text-black/40">Se déconnecter</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
