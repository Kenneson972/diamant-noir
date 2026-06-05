"use client";

import { Calendar as CalendarIcon, Clock, CreditCard, ChevronRight } from "lucide-react";

export function BookingsView({ data }: { data: any }) {
  const bookings = data?.rawBookings || [];
  const villas = data?.rawVillas || [];

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-3xl text-white">Registre des Séjours</h3>
          <p className="text-white/40 text-sm">Gestion des flux clients</p>
        </div>
        <div className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center text-gold border border-white/10">
          <CalendarIcon size={24} />
        </div>
      </div>

      <div className="overflow-hidden rounded-[32px] border border-white/5 bg-[#0D0D14]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/5 bg-white/[0.02]">
              <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-white/30">Client & Villa</th>
              <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-white/30">Dates</th>
              <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-white/30">Paiement</th>
              <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-white/30 text-right">Montant</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {bookings.map((b: any, i: number) => {
              const villa = villas.find((v: any) => v.id === b.villa_id);
              return (
                <tr key={i} className="group hover:bg-white/[0.02] transition-colors cursor-pointer">
                  <td className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl bg-gold/10 flex items-center justify-center text-gold font-bold text-sm">
                        {b.guest_name?.[0] || "C"}
                      </div>
                      <div>
                        <p className="font-bold text-white group-hover:text-gold transition-colors">{b.guest_name || "Client Privé"}</p>
                        <p className="text-[10px] text-white/30 uppercase tracking-widest">{villa?.name || "Villa"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="flex items-center gap-2 text-white/60 text-sm">
                      <Clock size={14} className="text-gold" />
                      {new Date(b.start_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} 
                      <ChevronRight size={12} />
                      {new Date(b.end_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                    </div>
                  </td>
                  <td className="p-6">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[8px] font-bold uppercase tracking-widest ${
                      b.payment_status === 'paid' ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
                    }`}>
                      <CreditCard size={10} />
                      {b.payment_status === 'paid' ? 'Encaissé' : 'Attente'}
                    </span>
                  </td>
                  <td className="p-6 text-right">
                    <p className="font-display text-lg text-white font-bold">€{Number(b.price).toLocaleString()}</p>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
