'use client';

import { useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { cn } from '@/lib/cn';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const FAQS: FAQItem[] = [
  {
    category: 'Commandes',
    question: 'Comment passer une commande ?',
    answer:
      'Pour passer commande, parcourez notre collection, sélectionnez les articles souhaités en choisissant votre taille et couleur, puis ajoutez-les à votre panier. Une fois votre sélection terminée, suivez les étapes de validation jusqu\'au paiement sécurisé. Vous recevrez un email de confirmation dès que votre commande sera validée.',
  },
  {
    category: 'Commandes',
    question: 'Puis-je modifier ou annuler ma commande ?',
    answer:
      'Vous pouvez modifier ou annuler votre commande dans un délai d\'une heure après sa confirmation. Passé ce délai, votre commande est en cours de préparation et ne peut plus être modifiée. Contactez notre service client pour toute demande urgente.',
  },
  {
    category: 'Commandes',
    question: 'Comment suivre ma commande ?',
    answer:
      'Une fois votre commande expédiée, vous recevrez un email contenant votre numéro de suivi. Vous pouvez également suivre l\'évolution de vos commandes depuis votre espace personnel dans la rubrique "Mes commandes".',
  },
  {
    category: 'Livraison',
    question: 'Quels sont les délais de livraison ?',
    answer:
      'En France métropolitaine, comptez 3 à 5 jours ouvrés pour une livraison standard. Pour les livraisons express, comptez 24 à 48 heures. Les livraisons internationales peuvent prendre de 5 à 10 jours ouvrés selon la destination.',
  },
  {
    category: 'Livraison',
    question: 'La livraison est-elle offerte ?',
    answer:
      'Oui, la livraison est offerte en France métropolitaine pour toute commande supérieure à 200 €. Pour les commandes inférieures, les frais de port sont de 5,90 € en standard et 12,90 € en express.',
  },
  {
    category: 'Livraison',
    question: 'Livrez-vous à l\'international ?',
    answer:
      'Oui, nous livrons dans toute l\'Union européenne, ainsi qu\'au Royaume-Uni, en Suisse, au Canada et aux États-Unis. Les frais de port varient selon la destination et sont calculés lors du passage en caisse.',
  },
  {
    category: 'Retours & Échanges',
    question: 'Quel est le délai pour retourner un article ?',
    answer:
      'Vous disposez de 30 jours à compter de la réception de votre commande pour retourner un article. Les articles doivent être neufs, non portés, et dans leur emballage d\'origine avec les étiquettes.',
  },
  {
    category: 'Retours & Échanges',
    question: 'Comment retourner un article ?',
    answer:
      'Connectez-vous à votre espace personnel, rendez-vous dans "Mes commandes", sélectionnez la commande concernée et cliquez sur "Demander un retour". Suivez les instructions pour générer votre bon de retour. Vous recevrez une étiquette de retour par email.',
  },
  {
    category: 'Retours & Échanges',
    question: 'Quand serai-je remboursé ?',
    answer:
      'Le remboursement est effectué dans un délai de 14 jours suivant la réception de votre retour dans nos entrepôts. Le remboursement est effectué sur le même moyen de paiement que celui utilisé lors de l\'achat.',
  },
  {
    category: 'Produits & Entretien',
    question: 'Comment choisir ma taille ?',
    answer:
      'Consultez notre guide des tailles disponible sur chaque fiche produit. Vous y trouverez un tableau de correspondance détaillé. Si vous hésitez entre deux tailles, nous vous recommandons de choisir la plus grande pour un confort optimal.',
  },
  {
    category: 'Produits & Entretien',
    question: 'Comment entretenir mes vêtements ?',
    answer:
      'Chaque produit est livré avec des instructions d\'entretien détaillées. De manière générale, nous recommandons un lavage à froid, un séchage à l\'air libre et un repassage à température modérée. Les matières délicates comme la laine ou la soie nécessitent un nettoyage à sec.',
  },
  {
    category: 'Produits & Entretien',
    question: 'Proposez-vous des services de retouche ?',
    answer:
      'Oui, nous proposons un service de retouche pour nos vêtements sur mesure. Contactez notre service client pour obtenir un devis personnalisé. Les délais et tarifs varient selon la nature des retouches souhaitées.',
  },
];

const CATEGORIES = [...new Set(FAQS.map((f) => f.category))];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filteredFAQs = FAQS.filter((faq) => {
    const matchesSearch =
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory
      ? faq.category === activeCategory
      : true;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="container-pvl py-section-md md:py-section-lg">
      {/* Header */}
      <div className="max-w-2xl mb-12">
        <p className="text-pvl-kicker mb-4">Questions fréquentes</p>
        <h1 className="text-pvl-section-title mb-4">FAQ</h1>
        <p className="text-pvl-manifesto">
          Tout ce que vous devez savoir sur nos produits, la livraison, les
          retours et bien plus encore.
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-md mb-8">
        <Search
          size={16}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-pvl-stone"
          strokeWidth={1.5}
        />
        <input
          type="text"
          placeholder="Rechercher dans la FAQ..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full border border-pvl-black/12 pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-pvl-black transition-colors"
        />
      </div>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-2 mb-10">
        <button
          onClick={() => setActiveCategory(null)}
          className={cn(
            'px-4 py-2 text-[0.6875rem] font-medium uppercase tracking-[0.15em] transition-colors',
            activeCategory === null
              ? 'bg-pvl-black text-pvl-white'
              : 'border border-pvl-black/12 text-pvl-slate hover:border-pvl-black'
          )}
        >
          Toutes
        </button>
        {CATEGORIES.map((category) => (
          <button
            key={category}
            onClick={() =>
              setActiveCategory(
                activeCategory === category ? null : category
              )
            }
            className={cn(
              'px-4 py-2 text-[0.6875rem] font-medium uppercase tracking-[0.15em] transition-colors',
              activeCategory === category
                ? 'bg-pvl-black text-pvl-white'
                : 'border border-pvl-black/12 text-pvl-slate hover:border-pvl-black'
            )}
          >
            {category}
          </button>
        ))}
      </div>

      {/* FAQ Accordion */}
      {filteredFAQs.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm text-pvl-slate">
            Aucun résultat trouvé pour &quot;{searchQuery}&quot;.
          </p>
        </div>
      ) : (
        <div className="max-w-3xl border-t border-pvl-black/8 divide-y divide-pvl-black/8">
          {filteredFAQs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div key={index}>
                <button
                  onClick={() =>
                    setOpenIndex(isOpen ? null : index)
                  }
                  className="w-full flex items-center justify-between py-5 text-left hover:text-pvl-slate transition-colors group"
                >
                  <div>
                    <span className="text-[0.5625rem] uppercase tracking-[0.15em] text-pvl-stone mb-1 block">
                      {faq.category}
                    </span>
                    <span className="text-sm font-medium">{faq.question}</span>
                  </div>
                  <ChevronDown
                    size={16}
                    className={cn(
                      'flex-shrink-0 text-pvl-stone transition-transform duration-300',
                      isOpen && 'rotate-180'
                    )}
                    strokeWidth={1.5}
                  />
                </button>
                <div
                  className={cn(
                    'overflow-hidden transition-all duration-300',
                    isOpen ? 'max-h-96 pb-5' : 'max-h-0'
                  )}
                >
                  <p className="text-sm text-pvl-slate leading-relaxed pr-8">
                    {faq.answer}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
