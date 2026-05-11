'use client';

import Link from 'next/link';

const MOCK_ORDERS = [
  {
    id: 'PVL-2026-0001',
    date: '2026-04-15',
    status: 'delivered',
    total: 320.0,
    statusLabel: 'Livrée',
  },
  {
    id: 'PVL-2026-0002',
    date: '2026-05-02',
    status: 'processing',
    total: 190.0,
    statusLabel: 'En traitement',
  },
];

const STATUS_COLORS: Record<string, string> = {
  pending: 'text-pvl-warning',
  confirmed: 'text-pvl-gold',
  processing: 'text-pvl-slate',
  shipped: 'text-pvl-slate',
  delivered: 'text-pvl-success',
  cancelled: 'text-pvl-error',
  returned: 'text-pvl-error',
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

export default function OrdersPage() {
  if (MOCK_ORDERS.length === 0) {
    return (
      <div className="text-center py-16">
        <h2 className="font-display text-xl mb-4">Aucune commande</h2>
        <p className="text-sm text-pvl-slate mb-8">
          Vous n&rsquo;avez pas encore passé de commande.
        </p>
        <Link
          href="/homme"
          className="text-[0.6875rem] uppercase tracking-[0.2em] text-pvl-black border border-pvl-black/20 px-6 py-3 hover:bg-pvl-black hover:text-pvl-white transition-colors"
        >
          Découvrir la collection
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="font-display text-xl">Mes commandes</h2>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-pvl-black/10">
              <th className="text-left py-3 pr-4 font-medium text-pvl-slate text-[0.6875rem] uppercase tracking-[0.1em]">
                Commande
              </th>
              <th className="text-left py-3 pr-4 font-medium text-pvl-slate text-[0.6875rem] uppercase tracking-[0.1em]">
                Date
              </th>
              <th className="text-left py-3 pr-4 font-medium text-pvl-slate text-[0.6875rem] uppercase tracking-[0.1em]">
                Statut
              </th>
              <th className="text-right py-3 pr-4 font-medium text-pvl-slate text-[0.6875rem] uppercase tracking-[0.1em]">
                Total
              </th>
              <th className="text-right py-3 font-medium text-pvl-slate text-[0.6875rem] uppercase tracking-[0.1em]">
                Détails
              </th>
            </tr>
          </thead>
          <tbody>
            {MOCK_ORDERS.map((order) => (
              <tr key={order.id} className="border-b border-pvl-black/6">
                <td className="py-4 pr-4 font-medium">{order.id}</td>
                <td className="py-4 pr-4 text-pvl-slate">
                  {formatDate(order.date)}
                </td>
                <td className="py-4 pr-4">
                  <span
                    className={`text-[0.625rem] uppercase tracking-[0.1em] ${
                      STATUS_COLORS[order.status] || 'text-pvl-slate'
                    }`}
                  >
                    {order.statusLabel}
                  </span>
                </td>
                <td className="py-4 pr-4 text-right">
                  {formatPrice(order.total)}
                </td>
                <td className="py-4 text-right">
                  <Link
                    href={`/mon-compte/commandes/${order.id}`}
                    className="text-[0.6875rem] uppercase tracking-[0.15em] text-pvl-slate hover:text-pvl-black transition-colors"
                  >
                    Voir
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
