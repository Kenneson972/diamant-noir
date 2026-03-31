"use client";

import { ListChecks, AlertCircle, CheckCircle2, Clock } from "lucide-react";

export function MaintenanceView({ data }: { data: any }) {
  const tasks = data?.rawTasks || [];
  const villas = data?.rawVillas || [];

  const pending = tasks.filter((t: any) => t.status === 'pending');
  const completed = tasks.filter((t: any) => t.status === 'completed');

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-3xl text-white">Logistique & Entretien</h3>
          <p className="text-white/40 text-sm">{pending.length} interventions nécessaires</p>
        </div>
        <div className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center text-gold border border-white/10">
          <ListChecks size={24} />
        </div>
      </div>

      <div className="grid gap-8">
        {/* Urgent / Pending Section */}
        <section className="space-y-4">
          <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold flex items-center gap-2">
            <AlertCircle size={14} /> À traiter en priorité
          </h4>
          <div className="grid gap-4">
            {pending.length > 0 ? pending.map((t: any, i: number) => {
              const villa = villas.find((v: any) => v.id === t.villa_id);
              return (
                <div key={i} className="group flex items-center justify-between rounded-3xl bg-[#0D0D14] border border-white/5 p-6 hover:border-gold/30 transition-all">
                  <div className="flex items-center gap-6">
                    <div className="h-12 w-12 rounded-2xl bg-gold/10 flex items-center justify-center text-gold">
                      <Clock size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-white text-lg">{t.content}</p>
                      <p className="text-[10px] text-white/30 uppercase tracking-widest">{villa?.name || "Toute la flotte"}</p>
                    </div>
                  </div>
                  <button className="rounded-xl border border-white/10 px-6 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-white hover:text-navy transition-all">
                    Marquer Fait
                  </button>
                </div>
              );
            }) : (
              <div className="py-12 text-center text-white/20 italic rounded-3xl border border-dashed border-white/10 bg-white/[0.01]">
                Aucune tâche urgente pour le moment.
              </div>
            )}
          </div>
        </section>

        {/* Recently Completed */}
        {completed.length > 0 && (
          <section className="space-y-4 pt-8">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 flex items-center gap-2">
              <CheckCircle2 size={14} /> Terminé récemment
            </h4>
            <div className="grid gap-3 opacity-50">
              {completed.slice(0, 3).map((t: any, i: number) => (
                <div key={i} className="flex items-center gap-4 px-6 py-4 rounded-2xl bg-white/[0.02] border border-white/5">
                  <CheckCircle2 size={16} className="text-emerald-500" />
                  <span className="text-sm text-white/60 line-through">{t.content}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
