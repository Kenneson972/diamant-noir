'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { Lock, Mail, User } from 'lucide-react';

export default function RegisterPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await signUp(email, password);
    if (error) {
      setError(error);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-20">
        <div className="w-full max-w-sm text-center">
          <div className="mx-auto mb-6 w-14 h-14 rounded-full bg-green-50 flex items-center justify-center">
            <Mail size={28} className="text-green-700" strokeWidth={1.5} />
          </div>
          <h1 className="font-display text-2xl mb-4">
            Vérifiez votre email
          </h1>
          <p className="text-sm text-pvl-slate mb-8">
            Un email de confirmation vous a été envoyé à{' '}
            <span className="font-medium">{email}</span>.
            <br />
            Cliquez sur le lien pour activer votre compte.
          </p>
          <Link
            href="/connexion"
            className="inline-block bg-pvl-black text-pvl-white px-8 py-3.5 text-[0.6875rem] font-medium uppercase tracking-[0.2em] hover:bg-pvl-charcoal transition-colors"
          >
            {t('actions.connecter')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-20">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <Link
            href="/"
            className="font-display text-xl tracking-wide inline-block mb-6"
          >
            Maison PVL
          </Link>
          <h1 className="font-display text-2xl">{t('actions.inscrire')}</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
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
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
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
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                className="w-full border border-pvl-black/12 px-4 py-3 text-sm focus:outline-none focus:border-pvl-black transition-colors"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-[0.625rem] uppercase tracking-[0.15em] text-pvl-slate mb-2"
            >
              Email
            </label>
            <div className="relative">
              <Mail
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-pvl-stone"
              />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full border border-pvl-black/12 pl-9 pr-4 py-3 text-sm focus:outline-none focus:border-pvl-black transition-colors"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-[0.625rem] uppercase tracking-[0.15em] text-pvl-slate mb-2"
            >
              Mot de passe
            </label>
            <div className="relative">
              <Lock
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-pvl-stone"
              />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full border border-pvl-black/12 pl-9 pr-4 py-3 text-sm focus:outline-none focus:border-pvl-black transition-colors"
              />
            </div>
          </div>

          {error && (
            <p className="text-[0.6875rem] text-pvl-error">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-pvl-black text-pvl-white py-4 text-[0.6875rem] font-medium uppercase tracking-[0.2em] hover:bg-pvl-charcoal transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading
              ? 'Inscription...'
              : t('actions.inscrire')}
          </button>
        </form>

        <p className="mt-6 text-center text-[0.6875rem] text-pvl-slate">
          Déjà un compte ?{' '}
          <Link
            href="/connexion"
            className="text-pvl-black font-medium hover:underline"
          >
            {t('actions.connecter')}
          </Link>
        </p>
      </div>
    </div>
  );
}
