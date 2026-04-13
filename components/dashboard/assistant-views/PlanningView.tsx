"use client";

import { Calendar, ArrowRight, LogIn, LogOut, Home } from "lucide-react";

type BookingEvent = {
  kind: string;
  villa_name: string;
  guest_name: string | null;
  start_date: string;
  end_date: string;
};

const KIND_CONFIG: Record<string, { label: string; icon: typeof LogIn; color: string }> = {
  checkin: { label: "Check-in", icon: LogIn, color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" },
  checkout: { label: "Check-out", icon: LogOut, color: "text-rose-400 bg-rose-400/10 border-rose-400/20" },
  staying: { label: "En séjour", icon: Home, color: "text-blue-400 bg-blue-400/10 border-blue-400/20" },
};

function fmt(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });
}

export function PlanningView({ data }: { data: any }) {
  const today: BookingEvent[] = data?.today || [];
  const bookings: any[] = data?.bookings || [];

  // Prochains 7 jours
  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);
  const in7 = new Date(todayDate.getTime() + 7 * 24 * 3_600_000);

  const upcoming = bookings
    .filter((b) => {
      const s = new Date(b.start_date);
      s.setHours(0, 0, 0, 0);
      return s >= todayDate && s <= in7;
    })
    .sort((a, b) => a.start_date.localeCompare(b.start_date))
    .slice(0, 12);

  const checkins7d = (data?.bookings_summary?.checkins_7d as number) ?? upcoming.length;
  const checkinsToday = (data?.bookings_summary?.checkins_today as number) ?? today.filter((t) => t.kind === "checkin").length;
  const checkoutsToday = (data?.bookings_summary?.checkouts_today as number) ?? today.filter((t) => t.kind === "checkout").length;

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-3xl text-white">Planning semaine</h3>
          <p className="text-sm text-white/40">Check-ins, séjours & départs à venir</p>
        </div>
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-emerald-400">
          <Calendar size={14} /> Semaine glissante
        </div>
      </div>

      {/* KPIs rapides */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border border-white/5 bg-[#0D0D14] p-6">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-white/30">Check-ins aujourd&apos;hui</p>
          <p className="font-display text-2xl text-emerald-400">{checkinsToday}</p>
        </div>
        <div className="rounded-3xl border border-white/5 bg-[#0D0D14] p-6">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-white/30">Départs aujourd&apos;hui</p>
          <p className="font-display text-2xl text-rose-400">{checkoutsToday}</p>
        </div>
        <div className="rounded-3xl border border-white/5 bg-[#0D0D14] p-6">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-white/30">Arrivées sous 7 jours</p>
          <p className="font-display text-2xl text-gold">{checkins7d}</p>
        </div>
      </div>

      {/* Aujourd'hui */}
      {today.length > 0 && (
        <div className="rounded-3xl border border-white/10 bg-[#0D0D14] p-6">
          <h4 className="mb-4 flex items-center gap-2 font-display text-lg text-white">
            <Calendar className="text-gold" size={18} /> Aujourd&apos;hui
          </h4>
          <ul className="space-y-3">
            {today.map((t, i) => {
              const cfg = KIND_CONFIG[t.kind] || { label: t.kind, icon: Calendar, color: "text-white/60 bg-white/5 border-white/10" };
              const Icon = cfg.icon;
              return (
                <li key={i} className="flex flex-wrap items-center gap-3 border-b border-white/5 pb-3 last:border-0 last:pb-0">
                  <span className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${cfg.color}`}>
                    <Icon size={10} /> {cfg.label}
                  </span>
                  <span className="text-sm font-bold text-white/80">{t.villa_name}</span>
                  {t.guest_name && (
                    <span className="text-xs text-white/40">· {t.guest_name}</span>
                  )}
                  <span className="ml-auto flex items-center gap-1 text-xs text-white/30">
                    {t.start_date?.slice(0, 10)}
                    <ArrowRight size={10} />
                    {t.end_date?.slice(0, 10)}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Prochains 7 jours */}
      {upcoming.length > 0 && (
        <div className="rounded-3xl border border-white/5 bg-[#0D0D14] p-6">
          <h4 className="mb-4 flex items-center gap-2 font-display text-lg text-white">
            <ArrowRight className="text-gold" size={18} /> Prochaines 7 jours
          </h4>
          <ul className="space-y-3">
            {upcoming.map((b, i) => (
              <li
                key={i}
                className="flex flex-wrap items-center gap-3 border-b border-white/5 pb-3 text-sm last:border-0 last:pb-0"
              >
                <span className="flex items-center gap-1 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                  <LogIn size={10} /> Check-in
                </span>
                <span className="font-bold text-white/80">{b.villa_name || `Villa #${b.villa_id?.slice(0, 6)}`}</span>
                {b.guest_name && <span className="text-white/40">· {b.guest_name}</span>}
                <span className="ml-auto text-xs text-white/30">{fmt(b.start_date)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {upcoming.length === 0 && today.length === 0 && (
        <div className="rounded-3xl border border-white/5 bg-[#0D0D14] p-10 text-center">
          <Calendar size={36} className="mx-auto mb-4 text-white/20" />
          <p className="text-sm text-white/40">Aucun mouvement prévu dans les 7 prochains jours.</p>
        </div>
      )}
    </div>
  );
}
