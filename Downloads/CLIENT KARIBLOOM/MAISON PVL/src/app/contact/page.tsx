'use client';

import { useState, type FormEvent } from 'react';
import { Send, Mail, Phone, Clock, MapPin, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

const CONTACT_METHODS = [
  { icon: Mail, label: 'Email', value: 'contact@maisonpvl.com', href: 'mailto:contact@maisonpvl.com' },
  { icon: Phone, label: 'Téléphone', value: '+33 1 23 45 67 89', href: 'tel:+33123456789' },
  { icon: Clock, label: 'Horaires', value: 'Lun–Ven, 9h–18h' },
  { icon: MapPin, label: 'Boutique', value: '12 Rue de la Paix, 75001 Paris' },
];

const SUBJECTS = [
  'Question sur un produit',
  'Commande en cours',
  'Retour ou échange',
  'Livraison',
  'Service après-vente',
  'Suggestions',
  'Autre',
];

export default function ContactPage() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
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
            Message envoyé
          </h1>
          <p className="text-sm text-pvl-slate mb-8">
            Merci de nous avoir contacté. Notre équipe vous répondra sous 24h ouvrées.
          </p>
          <Link
            href="/"
            className="inline-block bg-pvl-black text-pvl-white px-8 py-3 text-[0.6875rem] font-medium uppercase tracking-[0.2em] hover:bg-pvl-charcoal transition-colors"
          >
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-pvl py-section-md md:py-section-lg">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
        {/* Left: Contact info */}
        <div>
          <p className="text-pvl-kicker mb-4">Nous contacter</p>
          <h1 className="text-pvl-section-title mb-4">
            Une question ?<br />
            Écrivons-nous.
          </h1>
          <p className="text-pvl-manifesto mb-10">
            Notre équipe est à votre disposition pour répondre à toutes vos
            questions. Nous nous engageons à vous répondre sous 24h ouvrées.
          </p>

          <div className="space-y-6">
            {CONTACT_METHODS.map(({ icon: Icon, label, value, href }) => (
              <div key={label} className="flex gap-4">
                <Icon
                  size={18}
                  className="text-pvl-slate mt-0.5 flex-shrink-0"
                  strokeWidth={1.5}
                />
                <div>
                  <p className="text-[0.625rem] uppercase tracking-[0.15em] text-pvl-stone mb-0.5">
                    {label}
                  </p>
                  {href ? (
                    <a
                      href={href}
                      className="text-sm font-medium hover:text-pvl-slate transition-colors"
                    >
                      {value}
                    </a>
                  ) : (
                    <p className="text-sm font-medium">{value}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 pt-8 border-t border-pvl-black/8">
            <Link
              href="/sav/faq"
              className="text-sm text-pvl-slate hover:text-pvl-black transition-colors"
            >
              Consultez notre FAQ →
            </Link>
          </div>
        </div>

        {/* Right: Form */}
        <div>
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
                htmlFor="subject"
                className="block text-[0.625rem] uppercase tracking-[0.15em] text-pvl-slate mb-2"
              >
                Sujet
              </label>
              <select
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                className="w-full border border-pvl-black/12 px-4 py-3 text-sm focus:outline-none focus:border-pvl-black transition-colors bg-pvl-white"
              >
                <option value="" disabled>
                  Sélectionnez un sujet
                </option>
                {SUBJECTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="message"
                className="block text-[0.625rem] uppercase tracking-[0.15em] text-pvl-slate mb-2"
              >
                Message
              </label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={6}
                className="w-full border border-pvl-black/12 px-4 py-3 text-sm focus:outline-none focus:border-pvl-black transition-colors resize-none"
                placeholder="Décrivez votre demande..."
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-pvl-black text-pvl-white py-4 text-[0.6875rem] font-medium uppercase tracking-[0.2em] hover:bg-pvl-charcoal transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={14} />
              {loading ? 'Envoi en cours...' : 'Envoyer le message'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
