'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, CheckCircle2 } from 'lucide-react';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }

    setLoading(true);

    // In a real app, this would call Supabase to update the password
    await new Promise((r) => setTimeout(r, 1500));

    setLoading(false);
    setSuccess(true);
  };

  if (success) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-20">
        <div className="w-full max-w-sm text-center">
          <div className="mx-auto mb-6 w-14 h-14 rounded-full bg-green-50 flex items-center justify-center">
            <CheckCircle2 size={28} className="text-green-700" strokeWidth={1.5} />
          </div>
          <h1 className="font-display text-2xl mb-4">
            Mot de passe réinitialisé
          </h1>
          <p className="text-sm text-pvl-slate mb-8">
            Votre mot de passe a été modifié avec succès. Vous pouvez
            maintenant vous connecter avec votre nouveau mot de passe.
          </p>
          <Link
            href="/connexion"
            className="inline-block bg-pvl-black text-pvl-white px-8 py-3.5 text-[0.6875rem] font-medium uppercase tracking-[0.2em] hover:bg-pvl-charcoal transition-colors"
          >
            Se connecter
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
          <h1 className="font-display text-2xl">
            Nouveau mot de passe
          </h1>
          <p className="text-sm text-pvl-slate mt-2">
            Choisissez un nouveau mot de passe sécurisé.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="password"
              className="block text-[0.625rem] uppercase tracking-[0.15em] text-pvl-slate mb-2"
            >
              Nouveau mot de passe
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
                minLength={8}
                className="w-full border border-pvl-black/12 pl-9 pr-4 py-3 text-sm focus:outline-none focus:border-pvl-black transition-colors"
                placeholder="Au moins 8 caractères"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-[0.625rem] uppercase tracking-[0.15em] text-pvl-slate mb-2"
            >
              Confirmer le mot de passe
            </label>
            <div className="relative">
              <Lock
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-pvl-stone"
              />
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
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
            {loading ? 'Réinitialisation...' : 'Réinitialiser le mot de passe'}
          </button>
        </form>

        <p className="mt-6 text-center text-[0.6875rem] text-pvl-slate">
          <Link
            href="/connexion"
            className="text-pvl-black font-medium hover:underline"
          >
            Retour à la connexion
          </Link>
        </p>
      </div>
    </div>
  );
}
