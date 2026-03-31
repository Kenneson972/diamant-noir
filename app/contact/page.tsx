"use client";

import { useState } from "react";
import { Mail, MessageCircle, ChevronDown, ChevronUp } from "lucide-react";
import {
  LandingShell,
  LandingHero,
  LandingSection,
  LandingBlockTitle,
} from "@/components/marketing/landing-sections";

const faqItems = [
  {
    q: "Comment réserver une villa ?",
    a: "Consultez notre catalogue de villas, choisissez vos dates et remplissez le formulaire de réservation. Le paiement est sécurisé par Stripe.",
  },
  {
    q: "Quelle est la politique d'annulation ?",
    a: "Les conditions d'annulation varient selon les villas et sont détaillées sur chaque fiche. Consultez la section « Conditions d'annulation » avant de réserver.",
  },
  {
    q: "Proposez-vous des prestations d'entretien ?",
    a: "Oui. Nous proposons le nettoyage de piscine, l'entretien des jardins, le ménage et les états des lieux. Contactez-nous pour un devis personnalisé.",
  },
  {
    q: "Comment devenir propriétaire partenaire ?",
    a: "Rendez-vous sur la page « Soumettre ma villa » pour présenter votre bien. Notre équipe étudie chaque demande et vous recontacte sous peu.",
  },
];

export default function ContactPage() {
  const [formState, setFormState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    setFormState("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          email: data.get("email"),
          subject: data.get("subject"),
          message: data.get("message"),
        }),
      });
      if (res.ok) {
        setFormState("sent");
        form.reset();
      } else {
        setFormState("error");
      }
    } catch {
      setFormState("error");
    }
  };

  return (
    <LandingShell>
      <LandingHero
        eyebrow="Échange & support"
        title="Contact & FAQ"
        subtitle="Une question, une demande spéciale ? Notre équipe et le chatbot Diamant sont à votre écoute."
        variant="navy"
        align="split"
      />

      <LandingSection bg="white">
        <p className="mx-auto mb-12 max-w-2xl text-center text-sm leading-relaxed text-navy/65 md:mb-20 md:text-base">
          Écrivez-nous pour un projet sur mesure, ou parcourez les réponses rapides ci-dessous — le chatbot
          reste disponible en bas à droite.
        </p>

        <div className="grid gap-12 md:gap-14 lg:grid-cols-12 lg:gap-20">
          <div className="lg:col-span-6">
            <LandingBlockTitle title="Écrire au concierge" />
            <p className="-mt-4 mb-8 text-sm text-navy/70">
              Devis, séjour, partenariat : nous revenons vers vous sous 48h ouvrées.
            </p>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="name" className="mb-1 block text-sm font-medium text-navy">
                  Nom
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  className="w-full min-h-11 rounded-none border border-navy/20 bg-offwhite px-4 py-3 text-base text-navy focus:border-gold focus:outline-none md:text-sm"
                />
              </div>
              <div>
                <label htmlFor="email" className="mb-1 block text-sm font-medium text-navy">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="w-full min-h-11 rounded-none border border-navy/20 bg-offwhite px-4 py-3 text-base text-navy focus:border-gold focus:outline-none md:text-sm"
                />
              </div>
              <div>
                <label htmlFor="subject" className="mb-1 block text-sm font-medium text-navy">
                  Sujet
                </label>
                <input
                  id="subject"
                  name="subject"
                  type="text"
                  required
                  className="w-full min-h-11 rounded-none border border-navy/20 bg-offwhite px-4 py-3 text-base text-navy focus:border-gold focus:outline-none md:text-sm"
                />
              </div>
              <div>
                <label htmlFor="message" className="mb-1 block text-sm font-medium text-navy">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={5}
                  required
                  className="w-full resize-none rounded-none border border-navy/20 bg-offwhite px-4 py-3 text-base text-navy focus:border-gold focus:outline-none md:text-sm"
                />
              </div>
              {formState === "sent" && (
                <p className="text-sm text-green-700">Message envoyé. Nous vous recontacterons rapidement.</p>
              )}
              {formState === "error" && (
                <p className="text-sm text-red-600">
                  L&apos;envoi a échoué. Réessayez ou contactez-nous par email.
                </p>
              )}
              <button
                type="submit"
                disabled={formState === "sending"}
                className="tap-target inline-flex w-full items-center justify-center border border-navy bg-navy px-4 py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white transition-colors hover:border-gold hover:bg-gold hover:text-navy disabled:opacity-50"
              >
                {formState === "sending" ? "Envoi…" : "Envoyer"}
              </button>
            </form>
          </div>

          <div className="border-t border-navy/10 pt-16 lg:col-span-6 lg:border-l lg:border-t-0 lg:pl-16 lg:pt-0">
            <h2
              id="faq"
              className="mb-3 flex items-center gap-3 font-display text-2xl text-navy md:text-3xl"
            >
              <MessageCircle size={26} strokeWidth={1} className="shrink-0 text-gold" aria-hidden />
              Questions fréquentes
            </h2>
            <span className="mb-10 block h-px w-12 bg-gold" aria-hidden />
            <div className="space-y-2">
              {faqItems.map((item, i) => (
                <div key={item.q} className="overflow-hidden border border-navy/10 bg-offwhite/80">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left text-sm font-medium text-navy transition-colors hover:bg-white md:text-base"
                  >
                    <span className="min-w-0 flex-1 pr-2">{item.q}</span>
                    {openFaq === i ? (
                      <ChevronUp size={18} strokeWidth={1} className="shrink-0" aria-hidden />
                    ) : (
                      <ChevronDown size={18} strokeWidth={1} className="shrink-0" aria-hidden />
                    )}
                  </button>
                  {openFaq === i && <div className="border-t border-navy/5 px-4 pb-4 text-sm text-navy/75">{item.a}</div>}
                </div>
              ))}
            </div>
            <p className="mt-8 flex items-start gap-2 text-sm text-navy/55">
              <Mail size={18} strokeWidth={1} className="mt-0.5 shrink-0 text-gold" aria-hidden />
              Le chatbot Diamant répond aussi 24/7 depuis le coin inférieur droit.
            </p>
          </div>
        </div>
      </LandingSection>
    </LandingShell>
  );
}
