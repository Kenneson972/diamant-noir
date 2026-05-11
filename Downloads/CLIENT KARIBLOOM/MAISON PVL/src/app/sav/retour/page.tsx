'use client';

import { useState, type FormEvent } from 'react';
import { RotateCcw, Package, Upload, CheckCircle2 } from 'lucide-react';

const RETURN_REASONS = [
  'Taille incorrecte',
  'Article ne correspond pas à la description',
  'Défaut de fabrication',
  'Article endommagé pendant le transport',
  'Couleur différente de la photo',
  'Délai de livraison trop long',
  'Autre motif',
];

export default function ReturnPage() {
  const [orderNumber, setOrderNumber] = useState('');
  const [reason, setReason] = useState('');
  const [comment, setComment] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call
    await new Promise((r) => setTimeout(r, 1500));
    setLoading(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="container-pvl py-section-md md:py-section-lg">
        <div className="max-w-lg mx-auto text-center">
          <div className="mx-auto mb-6 w-16 h-16 rounded-full bg-green-50 flex items-center justify-center">
            <CheckCircle2 size={36} className="text-green-700" strokeWidth={1.5} />
          </div>
          <h1 className="font-display text-2xl md:text-3xl mb-4">
            Demande envoyée
          </h1>
          <p className="text-sm text-pvl-slate mb-6">
            Votre demande de retour pour la commande{' '}
            <span className="font-medium">{orderNumber}</span> a bien été
            reçue. Nous vous enverrons un email sous 24h ouvrées avec les
            instructions pour retourner votre colis.
          </p>
          <p className="text-xs text-pvl-stone mb-8">
            Référence de retour : RET-{Date.now().toString(36).toUpperCase()}
          </p>
          <a
            href="/sav"
            className="inline-block bg-pvl-black text-pvl-white px-8 py-3 text-[0.6875rem] font-medium uppercase tracking-[0.2em] hover:bg-pvl-charcoal transition-colors"
          >
            Retour au service client
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="container-pvl py-section-md md:py-section-lg">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <RotateCcw size={20} className="text-pvl-slate" strokeWidth={1.5} />
            <span className="text-pvl-kicker">Retours & Échanges</span>
          </div>
          <h1 className="text-pvl-section-title mb-3">
            Demande de retour
          </h1>
          <p className="text-sm text-pvl-slate">
            Vous souhaitez retourner un article ? Remplissez le formulaire
            ci-dessous et nous vous guiderons dans les étapes à suivre.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Order number */}
          <div>
            <label
              htmlFor="orderNumber"
              className="block text-[0.625rem] uppercase tracking-[0.15em] text-pvl-slate mb-2"
            >
              Numéro de commande
            </label>
            <div className="relative">
              <Package
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-pvl-stone"
              />
              <input
                id="orderNumber"
                type="text"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                placeholder="Ex: PVL-2026-XXXX"
                required
                className="w-full border border-pvl-black/12 pl-9 pr-4 py-3 text-sm focus:outline-none focus:border-pvl-black transition-colors"
              />
            </div>
          </div>

          {/* Reason */}
          <div>
            <label
              htmlFor="reason"
              className="block text-[0.625rem] uppercase tracking-[0.15em] text-pvl-slate mb-2"
            >
              Motif du retour
            </label>
            <select
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              className="w-full border border-pvl-black/12 px-4 py-3 text-sm focus:outline-none focus:border-pvl-black transition-colors bg-pvl-white"
            >
              <option value="" disabled>
                Sélectionnez un motif
              </option>
              {RETURN_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Comment */}
          <div>
            <label
              htmlFor="comment"
              className="block text-[0.625rem] uppercase tracking-[0.15em] text-pvl-slate mb-2"
            >
              Commentaire (optionnel)
            </label>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              className="w-full border border-pvl-black/12 px-4 py-3 text-sm focus:outline-none focus:border-pvl-black transition-colors resize-none"
              placeholder="Décrivez le problème rencontré..."
            />
          </div>

          {/* File upload */}
          <div>
            <label className="block text-[0.625rem] uppercase tracking-[0.15em] text-pvl-slate mb-2">
              Photo (optionnelle)
            </label>
            <label className="flex flex-col items-center justify-center border border-dashed border-pvl-black/20 p-8 cursor-pointer hover:border-pvl-black transition-colors">
              <Upload
                size={24}
                className="text-pvl-stone mb-3"
                strokeWidth={1.5}
              />
              {file ? (
                <p className="text-sm text-pvl-black">{file.name}</p>
              ) : (
                <>
                  <p className="text-sm text-pvl-slate mb-1">
                    Cliquez pour ajouter une photo
                  </p>
                  <p className="text-xs text-pvl-stone">
                    JPG, PNG ou WebP (max. 5 Mo)
                  </p>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="hidden"
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-pvl-black text-pvl-white py-4 text-[0.6875rem] font-medium uppercase tracking-[0.2em] hover:bg-pvl-charcoal transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Envoi en cours...' : 'Valider la demande'}
          </button>

          <p className="text-xs text-pvl-stone text-center">
            Vous recevrez une confirmation par email sous 24h ouvrées.
          </p>
        </form>
      </div>
    </div>
  );
}
