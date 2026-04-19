// src/pages/member/History.tsx
import { ChevronRight, Calendar, MapPin } from 'lucide-react';
import { useOrders } from '../../hooks/useOrders';

const History = () => {
  const { orders, loading, error, totalThisMonth, topProducts } = useOrders();

  const monthLabel = new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-8 flex flex-col gap-6">
        <h1
          className="font-display font-normal text-[28px] text-black leading-none"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Historique
        </h1>

        {error && (
          <p className="text-[11px] text-red-500/80">{error}</p>
        )}

        {loading ? (
          <p className="text-[11px] text-black/30">Chargement…</p>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-[2px] border border-black/[0.06] p-10 text-center">
            <p className="text-[13px] font-normal text-black mb-2">Aucune commande</p>
            <p className="text-[11px] font-light text-black/40">
              Votre historique de commandes apparaîtra ici.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-[2px] border border-black/[0.06] overflow-hidden">
            {orders.map((order, index) => {
              const itemNames = order.order_items.map(i => i.product_name).join(', ');
              const date = new Date(order.created_at).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
              });
              return (
                <div
                  key={order.id}
                  className={`group flex flex-col sm:flex-row items-start sm:items-center p-6 hover:bg-black/[0.02] transition-colors duration-200 gap-4 ${
                    index < orders.length - 1 ? 'border-b border-black/[0.05]' : ''
                  }`}
                >
                  <div className={`w-11 h-11 rounded-[2px] flex items-center justify-center text-xl shrink-0 ${
                    order.status === 'pending' ? 'bg-[oklch(57%_0.065_68)] text-white' : 'bg-black/[0.05]'
                  }`}>
                    🥤
                  </div>

                  <div className="flex-1 space-y-1">
                    <h4 className="text-[13px] font-normal text-black">{itemNames || '—'}</h4>
                    <div className="flex flex-wrap gap-4 text-[10px] font-light text-black/40">
                      <span className="flex items-center gap-1">
                        <Calendar size={11} strokeWidth={1.3} /> {date}
                      </span>
                      {order.status === 'pending' && (
                        <span className="flex items-center gap-1">
                          <MapPin size={11} strokeWidth={1.3} /> En cours
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    {order.status === 'pending' && (
                      <span className="text-[8px] font-normal uppercase tracking-[0.15em] text-[oklch(57%_0.065_68)] border border-[oklch(57%_0.065_68)]/30 px-2.5 py-1 rounded-[2px]">
                        En attente
                      </span>
                    )}
                    <p className="text-[15px] font-normal text-black">
                      {order.total.toFixed(2).replace('.', ',')}€
                    </p>
                    <ChevronRight size={15} strokeWidth={1.3} className="text-black/20 group-hover:translate-x-0.5 transition-transform duration-200" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Sidebar Stats */}
      <div className="lg:col-span-4 flex flex-col gap-4">
        <div className="bg-[oklch(8%_0.005_55)] rounded-[2px] p-8 text-white">
          <p className="text-[9px] font-normal uppercase tracking-[0.25em] text-white/30 mb-3">
            Total ({monthLabel})
          </p>
          <p
            className="font-display font-normal text-white leading-none mb-6"
            style={{ fontFamily: 'var(--font-display)', fontSize: '40px' }}
          >
            {totalThisMonth.toFixed(2).replace('.', ',')}€
          </p>
          <div className="border-t border-white/[0.08] pt-5 flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-light text-white/50">Commandes</span>
              <span className="text-[13px] font-normal text-white">{orders.length}</span>
            </div>
            {orders.length > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-light text-white/50">Moyenne</span>
                <span className="text-[13px] font-normal text-white">
                  {(orders.reduce((s, o) => s + o.total, 0) / orders.length).toFixed(2).replace('.', ',')}€
                </span>
              </div>
            )}
          </div>
        </div>

        {topProducts.length > 0 && (
          <div className="bg-white rounded-[2px] p-6 border border-black/[0.06]">
            <p className="text-[9px] font-normal uppercase tracking-[0.2em] text-black/35 mb-5">
              Produits favoris
            </p>
            <div className="flex flex-col divide-y divide-black/[0.05]">
              {topProducts.map((item, i) => (
                <div key={item.name} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-normal text-black/25 tabular-nums w-5">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="text-[12px] font-normal text-black">{item.name}</span>
                  </div>
                  <span className="text-[10px] font-normal text-black/35">{item.count}×</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default History;
