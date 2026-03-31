"use client";

import { useState } from "react";
import Link from "next/link";
import { Home, Link as LinkIcon, ImageOff, ArrowRight, Check } from "lucide-react";

export default function SoumettreMaVillaPage() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [noPhotos, setNoPhotos] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    setStatus("sending");
    try {
      const res = await fetch("/api/villa-submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          email: data.get("email"),
          phone: data.get("phone") || undefined,
          villa_name: data.get("villa_name") || undefined,
          villa_location: data.get("villa_location") || undefined,
          villa_description: data.get("villa_description") || undefined,
          airbnb_url: data.get("airbnb_url") || undefined,
          no_photos: noPhotos,
          message: data.get("message") || undefined,
        }),
      });
      if (res.ok) {
        setStatus("sent");
        form.reset();
        setNoPhotos(false);
      } else {
        const err = await res.json().catch(() => ({}));
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  return (
    <main className="min-h-screen bg-offwhite">
      <section className="relative bg-navy py-24 px-6">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-gold mb-4">
            Devenez partenaire
          </p>
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl text-white mb-6">
            Soumettre ma villa
          </h1>
          <p className="text-white/70 text-lg max-w-2xl mx-auto">
            Rejoignez le programme propriétaire Diamant Noir. Présentez votre bien ou collez le lien de votre annonce Airbnb.
          </p>
        </div>
      </section>

      <section className="py-16 md:py-24 px-6">
        <div className="mx-auto max-w-2xl">
          <div className="mb-10 p-6 bg-gold/10 border border-gold/30 rounded-xl">
            <p className="text-navy/80 text-sm">
              Après étude de votre dossier, nous vous recontacterons. Une réponse automatique de confirmation vous sera envoyée par email. 
              Si votre villa est retenue, nous vous proposerons une collaboration officielle et, après validation, une inscription à l&apos;espace propriétaire.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-navy mb-1">Nom *</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  className="w-full rounded-lg border border-navy/20 bg-white px-4 py-3 text-navy focus:border-gold focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-navy mb-1">Email *</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="w-full rounded-lg border border-navy/20 bg-white px-4 py-3 text-navy focus:border-gold focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-navy mb-1">Téléphone</label>
              <input
                id="phone"
                name="phone"
                type="tel"
                className="w-full rounded-lg border border-navy/20 bg-white px-4 py-3 text-navy focus:border-gold focus:outline-none"
              />
            </div>

            <div className="border-t border-navy/10 pt-6">
              <p className="text-sm font-medium text-navy mb-3 flex items-center gap-2">
                <LinkIcon size={18} className="text-gold" />
                Lien Airbnb (optionnel)
              </p>
              <input
                id="airbnb_url"
                name="airbnb_url"
                type="url"
                placeholder="https://www.airbnb.fr/rooms/..."
                className="w-full rounded-lg border border-navy/20 bg-white px-4 py-3 text-navy focus:border-gold focus:outline-none"
              />
              <p className="text-xs text-navy/60 mt-1">
                Collez l&apos;URL de votre annonce Airbnb pour que nous récupérions automatiquement les détails et photos.
              </p>
            </div>

            <div className="border-t border-navy/10 pt-6">
              <p className="text-sm font-medium text-navy mb-3 flex items-center gap-2">
                <Home size={18} className="text-gold" />
                Ou décrivez votre villa
              </p>
              <div className="space-y-4">
                <input
                  id="villa_name"
                  name="villa_name"
                  type="text"
                  placeholder="Nom de la villa"
                  className="w-full rounded-lg border border-navy/20 bg-white px-4 py-3 text-navy focus:border-gold focus:outline-none"
                />
                <input
                  id="villa_location"
                  name="villa_location"
                  type="text"
                  placeholder="Localisation (ville, quartier)"
                  className="w-full rounded-lg border border-navy/20 bg-white px-4 py-3 text-navy focus:border-gold focus:outline-none"
                />
                <textarea
                  id="villa_description"
                  name="villa_description"
                  rows={3}
                  placeholder="Description courte (capacité, équipements...)"
                  className="w-full rounded-lg border border-navy/20 bg-white px-4 py-3 text-navy focus:border-gold focus:outline-none resize-none"
                />
              </div>
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={noPhotos}
                onChange={(e) => setNoPhotos(e.target.checked)}
                name="no_photos"
                className="rounded border-navy/30 text-gold focus:ring-gold"
              />
              <span className="text-navy/80 text-sm flex items-center gap-2">
                <ImageOff size={16} />
                Je n&apos;ai pas de photos — Diamant Noir s&apos;en charge (état des lieux + photos professionnelles)
              </span>
            </label>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-navy mb-1">Message complémentaire</label>
              <textarea
                id="message"
                name="message"
                rows={3}
                className="w-full rounded-lg border border-navy/20 bg-white px-4 py-3 text-navy focus:border-gold focus:outline-none resize-none"
              />
            </div>

            {status === "sent" && (
              <div className="flex items-center gap-2 text-green-600 bg-green-50 border border-green-200 rounded-lg p-4">
                <Check size={20} />
                <span>Demande envoyée. Vous allez recevoir un email de confirmation.</span>
              </div>
            )}
            {status === "error" && (
              <p className="text-red-600 text-sm">L&apos;envoi a échoué. Réessayez ou contactez-nous via la page Contact.</p>
            )}
            <button
              type="submit"
              disabled={status === "sending"}
              className="w-full rounded-full bg-navy text-white py-4 px-6 hover:bg-gold hover:text-navy transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {status === "sending" ? "Envoi en cours..." : "Envoyer ma demande"}
              <ArrowRight size={18} />
            </button>
          </form>

          <p className="mt-8 text-center text-navy/60 text-sm">
            <Link href="/contact" className="text-gold hover:underline">Nous contacter</Link> pour toute question.
          </p>
        </div>
      </section>
    </main>
  );
}
