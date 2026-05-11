'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { CheckCheck, Package, ArrowLeft } from 'lucide-react';

export default function OrderSuccessPage() {
  const { t } = useTranslation();

  return (
    <div className="container-pvl py-20 text-center max-w-lg mx-auto">
      {/* Success animation */}
      <div className="mx-auto mb-8 w-16 h-16 rounded-full bg-green-50 flex items-center justify-center">
        <CheckCheck size={36} className="text-green-700" strokeWidth={1.5} />
      </div>

      <h1 className="font-display text-2xl md:text-3xl mb-4">
        Merci pour votre commande
      </h1>
      <p className="text-sm text-pvl-slate mb-2">
        Votre commande a bien été confirmée et sera traitée dans les plus brefs
        délais.
      </p>
      <p className="text-sm text-pvl-stone mb-8">
        Vous recevrez un email de confirmation à l&apos;adresse associée à votre
        compte.
      </p>

      {/* Order number placeholder */}
      <div className="bg-pvl-cream p-6 mb-8">
        <p className="text-[0.5625rem] uppercase tracking-[0.15em] text-pvl-stone mb-1">
          Numéro de commande
        </p>
        <p className="font-mono text-sm tracking-wider">PVL-2026-XXXX-XXXX</p>
      </div>

      {/* Summary */}
      <div className="text-left bg-pvl-cream p-6 mb-10 space-y-3">
        <h2 className="text-[0.6875rem] font-semibold uppercase tracking-[0.2em] mb-4">
          Récapitulatif
        </h2>
        <div className="flex justify-between text-sm">
          <span className="text-pvl-slate">Articles</span>
          <span>3 articles</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-pvl-slate">Total</span>
          <span className="font-medium">— €</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-pvl-slate">Livraison</span>
          <span className="text-green-700 text-[0.625rem] uppercase tracking-[0.1em]">
            Offerte
          </span>
        </div>
        <div className="pt-3 border-t border-pvl-black/8">
          <p className="text-[0.5625rem] uppercase tracking-[0.15em] text-pvl-stone">
            Adresse de livraison
          </p>
          <p className="text-sm mt-1">
            —<br />—
            <br />—
          </p>
        </div>
      </div>

      <div className="space-x-4">
        <Link
          href="/mon-compte/commandes"
          className="inline-block bg-pvl-black text-pvl-white px-8 py-3.5 text-[0.6875rem] font-medium uppercase tracking-[0.2em] hover:bg-pvl-charcoal transition-colors"
        >
          <Package size={14} className="inline mr-2" />
          Suivre ma commande
        </Link>
        <Link
          href="/homme"
          className="inline-block text-[0.625rem] uppercase tracking-[0.15em] text-pvl-slate hover:text-pvl-black transition-colors ml-4"
        >
          <ArrowLeft size={12} className="inline mr-1" />
          {t('cart.continuer-achats')}
        </Link>
      </div>
    </div>
  );
}
