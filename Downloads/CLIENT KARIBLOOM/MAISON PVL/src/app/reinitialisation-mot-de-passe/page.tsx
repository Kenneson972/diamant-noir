'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await resetPassword(email);
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
            <CheckCircle2 size={28} className="text-green-700" strokeWidth={1.5} />
          </div>
          <h1 className="font-display text-2xl mb-4">
            Email envoyé
          </h1>
          <p className="text-sm text-pvl-slate mb-8">
            Si un compte existe avec l&apos;adresse{' '}
            <span className="font-medium">{email}</span>, vous recevrez un
            email contenant les instructions pour réinitialiser votre mot de
            passe.
          </p>
          <Link
            href="/connexion"
            className="inline-block bg-pvl-black text-pvl-white px-8 py-3.5 text-[0.6875rem] font-medium uppercase tracking-[0.2em] hover:bg-pvl-charcoal transition-colors"
          >
            Retour à la connexion
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
          <h1 className="font-display text-2xl mb-2">
            Mot de passe oublié
          </h1>
          <p className="text-sm text-pvl-slate">
            Saisissez votre adresse email et nous vous enverrons un lien pour
            réinitialiser votre mot de passe.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="email"
              className="block text-[0.625rem] uppercase tracking-[0.15em] text-pvl-slate mb-2"
            >
              Adresse email
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
                placeholder="vous@exemple.com"
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
            {loading ? 'Envoi en cours...' : 'Envoyer le lien'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link
            href="/connexion"
            className="inline-flex items-center gap-1 text-[0.625rem] uppercase tracking-[0.15em] text-pvl-slate hover:text-pvl-black transition-colors"
          >
            <ArrowLeft size={12} />
            Retour à la connexion
          </Link>
        </div>
      </div>
    </div>
  );
}
