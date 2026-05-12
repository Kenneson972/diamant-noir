'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { XCircle, ShoppingBag, ArrowLeft } from 'lucide-react';

export default function OrderCancelledPage() {
  const { t } = useTranslation();

  return (
    <div className="container-pvl py-20 text-center max-w-lg mx-auto">
      <div className="mx-auto mb-8 w-16 h-16 rounded-full bg-pvl-error/10 flex items-center justify-center">
        <XCircle size={36} className="text-pvl-error" strokeWidth={1.5} />
      </div>

      <h1 className="font-display text-2xl md:text-3xl mb-4">
        Paiement annulé
      </h1>
      <p className="text-sm text-pvl-slate mb-2">
        Votre paiement n&apos;a pas pu aboutir. Aucun montant n&apos;a été
        prélevé.
      </p>
      <p className="text-sm text-pvl-stone mb-10">
        Vous pouvez réessayer ou contacter notre service client si le problème
        persiste.
      </p>

      <div className="space-y-4">
        <Link
          href="/checkout"
          className="block w-full bg-pvl-black text-pvl-white py-4 text-[0.6875rem] font-medium uppercase tracking-[0.2em] hover:bg-pvl-charcoal transition-colors"
        >
          <ShoppingBag size={14} className="inline mr-2" />
          Réessayer le paiement
        </Link>
        <Link
          href="/"
          className="block w-full border border-pvl-black/12 py-4 text-[0.6875rem] font-medium uppercase tracking-[0.2em] hover:bg-pvl-cream transition-colors"
        >
          Retour à l'accueil
        </Link>
        <Link
          href="/homme"
          className="block text-center text-[0.625rem] uppercase tracking-[0.15em] text-pvl-slate hover:text-pvl-black transition-colors pt-4"
        >
          <ArrowLeft size={12} className="inline mr-1" />
          {t('cart.continuer-achats')}
        </Link>
      </div>

      <div className="mt-12 pt-8 border-t border-pvl-black/8">
        <p className="text-[0.5625rem] uppercase tracking-[0.15em] text-pvl-stone mb-2">
          Besoin d&apos;aide ?
        </p>
        <Link
          href="/sav"
          className="text-[0.6875rem] text-pvl-slate hover:text-pvl-black transition-colors underline underline-offset-2"
        >
          Contacter le service client
        </Link>
      </div>
    </div>
  );
}
