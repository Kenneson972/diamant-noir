'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { PageSEO } from '@/components/common/PageSEO';

const MOCK_ORDER = {
  id: 'PVL-2026-0001',
  date: '2026-04-15',
  status: 'delivered',
  statusLabel: 'Livrée',
  subtotal: 280.0,
  shipping_cost: 15.0,
  tax: 25.0,
  total: 320.0,
  shipping_address: {
    first_name: 'Marie',
    last_name: 'Dubois',
    line1: '12 Rue de la Paix',
    city: 'Paris',
    postal_code: '75002',
    country: 'France',
  },
  items: [
    {
      id: '1',
      product_name: 'Chemise en lin blanche',
      product_slug: 'chemise-lin-blanche',
      product_image: '',
      variant_size: 'M',
      variant_color: 'Blanc',
      price: 140.0,
      quantity: 2,
    },
  ],
  timeline: [
    { status: 'confirmée', date: '2026-04-15', done: true },
    { status: 'en préparation', date: '2026-04-16', done: true },
    { status: 'expédiée', date: '2026-04-18', done: true },
    { status: 'livrée', date: '2026-04-20', done: true },
  ],
};

function formatPrice(price: number) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(price);
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
}

export default function OrderDetailPage() {
  const params = useParams();
  const order = MOCK_ORDER;

  if (!order) {
    return (
      <div className="text-center py-16">
        <h2 className="font-display text-xl mb-4">Commande introuvable</h2>
        <Link
          href="/mon-compte/commandes"
          className="text-[0.6875rem] uppercase tracking-[0.2em] text-pvl-black border border-pvl-black/20 px-6 py-3 hover:bg-pvl-black hover:text-pvl-white transition-colors"
        >
          Retour aux commandes
        </Link>
      </div>
    );
  }

  return (
    <>
      <PageSEO title={`Commande ${order.id}`} />
      <div className="space-y-8">
        <div>
          <Link
            href="/mon-compte/commandes"
            className="text-[0.6875rem] uppercase tracking-[0.15em] text-pvl-slate hover:text-pvl-black transition-colors"
          >
            &larr; Retour aux commandes
          </Link>
        </div>

        {/* Order header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="font-display text-xl">
              Commande {order.id}
            </h2>
            <p className="text-sm text-pvl-slate mt-1">
              Passée le {formatDate(order.date)}
            </p>
          </div>
          <span className="text-[0.625rem] uppercase tracking-[0.1em] text-pvl-success bg-pvl-success/10 px-3 py-1.5 self-start">
            {order.statusLabel}
          </span>
        </div>

        {/* Timeline */}
        <div className="bg-pvl-cream p-6">
          <h3 className="text-[0.6875rem] uppercase tracking-[0.15em] text-pvl-slate mb-4">
            Suivi de commande
          </h3>
          <div className="space-y-3">
            {order.timeline.map((step, index) => (
              <div key={step.status} className="flex items-center gap-3">
                <div
                  className={`w-2 h-2 rounded-full ${
                    step.done ? 'bg-pvl-success' : 'bg-pvl-stone'
                  }`}
                />
                <div className="flex-1 flex justify-between">
                  <span
                    className={`text-sm ${
                      step.done ? 'text-pvl-black' : 'text-pvl-stone'
                    }`}
                  >
                    {step.status.charAt(0).toUpperCase() + step.status.slice(1)}
                  </span>
                  {step.date && (
                    <span className="text-xs text-pvl-slate">
                      {formatDate(step.date)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Items */}
        <div>
          <h3 className="text-[0.6875rem] uppercase tracking-[0.15em] text-pvl-slate mb-4">
            Articles
          </h3>
          <div className="divide-y divide-pvl-black/6">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center gap-4 py-4">
                <div className="w-16 h-20 bg-pvl-cream flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/produit/${item.product_slug}`}
                    className="text-sm font-medium hover:text-pvl-slate transition-colors"
                  >
                    {item.product_name}
                  </Link>
                  <p className="text-xs text-pvl-slate mt-0.5">
                    {item.variant_color} — {item.variant_size}
                  </p>
                  <p className="text-xs text-pvl-slate">
                    Qté: {item.quantity}
                  </p>
                </div>
                <p className="text-sm">{formatPrice(item.price)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Shipping address & totals */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          <div>
            <h3 className="text-[0.6875rem] uppercase tracking-[0.15em] text-pvl-slate mb-3">
              Adresse de livraison
            </h3>
            <div className="text-sm leading-relaxed">
              <p>
                {order.shipping_address.first_name}{' '}
                {order.shipping_address.last_name}
              </p>
              <p>{order.shipping_address.line1}</p>
              <p>
                {order.shipping_address.postal_code}{' '}
                {order.shipping_address.city}
              </p>
              <p>{order.shipping_address.country}</p>
            </div>
          </div>

          <div>
            <h3 className="text-[0.6875rem] uppercase tracking-[0.15em] text-pvl-slate mb-3">
              Récapitulatif
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-pvl-slate">Sous-total</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-pvl-slate">Livraison</span>
                <span>{formatPrice(order.shipping_cost)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-pvl-slate">TVA</span>
                <span>{formatPrice(order.tax)}</span>
              </div>
              <div className="flex justify-between border-t border-pvl-black/10 pt-2 font-medium">
                <span>Total</span>
                <span>{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
