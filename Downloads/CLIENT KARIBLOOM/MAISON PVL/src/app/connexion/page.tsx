'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const { t } = useTranslation();
  const { signIn } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = await signIn(email, password);
    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      router.push('/mon-compte');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-pvl-white">
      <div className="w-full max-w-sm">
        <Link
          href="/"
          className="font-display text-xl block text-center mb-10"
        >
          Maison PVL
        </Link>

        <h1 className="font-display text-2xl text-center mb-8">
          {t('actions.connecter')}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-[0.5625rem] uppercase tracking-[0.15em] text-pvl-slate mb-1.5"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-pvl-black/12 px-4 py-3 text-sm focus:outline-none focus:border-pvl-black transition-colors"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-[0.5625rem] uppercase tracking-[0.15em] text-pvl-slate mb-1.5"
            >
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border border-pvl-black/12 px-4 py-3 text-sm focus:outline-none focus:border-pvl-black transition-colors"
            />
          </div>

          {error && (
            <p className="text-[0.6875rem] text-pvl-error">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-pvl-black text-pvl-white py-3.5 text-[0.6875rem] font-medium uppercase tracking-[0.2em] hover:bg-pvl-charcoal transition-colors disabled:opacity-50"
          >
            {loading ? '...' : t('actions.connecter')}
          </button>
        </form>

        <div className="mt-6 text-center space-y-3">
          <Link
            href="/reinitialisation-mot-de-passe"
            className="block text-[0.625rem] text-pvl-slate hover:text-pvl-black transition-colors"
          >
            Mot de passe oublié ?
          </Link>
          <Link
            href="/inscription"
            className="block text-[0.625rem] text-pvl-slate hover:text-pvl-black transition-colors"
          >
            {t('actions.inscrire')}
          </Link>
        </div>
      </div>
    </div>
  );
}
