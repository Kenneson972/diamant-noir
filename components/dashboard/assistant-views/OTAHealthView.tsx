"use client";

import { Zap, CheckCircle2, XCircle, RefreshCcw, AlertTriangle, Wifi } from "lucide-react";

type OTAError = {
  villa_id: string;
  source: string;
  error: string;
  synced_at: string;
};

function fmtDate(s?: string | null) {
  if (!s) return "—";
  return new Date(s).toLocaleString("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const SOURCE_COLORS: Record<string, string> = {
  airbnb: "text-rose-400 bg-rose-400/10 border-rose-400/20",
  booking: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  vrbo: "text-purple-400 bg-purple-400/10 border-purple-400/20",
  direct: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
};

function sourceColor(s: string) {
  const key = s.toLowerCase();
  for (const [k, v] of Object.entries(SOURCE_COLORS)) {
    if (key.includes(k)) return v;
  }
  return "text-white/60 bg-white/5 border-white/10";
}

export function OTAHealthView({ data }: { data: any }) {
  const ota = data?.ota_health || {};
  const lastSync: string | null = ota.last_sync || null;
  const recentErrors: OTAError[] = ota.recent_errors || [];
  const channelsWithErrors: string[] = ota.channels_with_errors || [];
  const totalImported: number = ota.total_imported_last_sync || 0;

  const isHealthy = recentErrors.length === 0;
  const minutesSinceSync = lastSync
    ? Math.round((Date.now() - new Date(lastSync).getTime()) / 60000)
    : null;
  const syncFresh = minutesSinceSync !== null && minutesSinceSync < 120;

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-3xl text-white">Santé OTA</h3>
          <p className="text-sm text-white/40">Synchronisation calendriers & canaux de distribution</p>
        </div>
        <div
          className={`flex items-center gap-2 rounded-2xl border px-4 py-2 text-xs font-bold uppercase tracking-widest ${
            isHealthy
              ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-400"
              : "border-rose-400/20 bg-rose-400/10 text-rose-400"
          }`}
        >
          {isHealthy ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
          {isHealthy ? "Tout OK" : `${recentErrors.length} erreur(s)`}
        </div>
      </div>

      {/* Statut global */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div
          className={`rounded-3xl border p-6 ${
            syncFresh
              ? "border-emerald-400/20 bg-emerald-400/5"
              : "border-amber-400/20 bg-amber-400/5"
          }`}
        >
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-white/30">Dernière sync</p>
          <div className="flex items-center gap-2">
            <RefreshCcw
              size={16}
              className={syncFresh ? "text-emerald-400" : "text-amber-400"}
            />
            <p className={`text-sm font-bold ${syncFresh ? "text-emerald-400" : "text-amber-400"}`}>
              {lastSync ? fmtDate(lastSync) : "Jamais"}
            </p>
          </div>
          {minutesSinceSync !== null && (
            <p className="mt-1 text-[10px] text-white/30">
              Il y a {minutesSinceSync < 60 ? `${minutesSinceSync} min` : `${Math.round(minutesSinceSync / 60)}h`}
            </p>
          )}
        </div>

        <div className="rounded-3xl border border-white/5 bg-[#0D0D14] p-6">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-white/30">Importés (dernière sync)</p>
          <div className="flex items-center gap-2">
            <Wifi size={16} className="text-blue-400" />
            <p className="font-display text-2xl text-white">{totalImported}</p>
          </div>
          <p className="mt-1 text-[10px] text-white/30">réservations importées</p>
        </div>

        <div
          className={`rounded-3xl border p-6 ${
            recentErrors.length === 0
              ? "border-emerald-400/20 bg-emerald-400/5"
              : "border-rose-400/20 bg-rose-400/5"
          }`}
        >
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-white/30">Canaux en erreur</p>
          {channelsWithErrors.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {channelsWithErrors.map((c) => (
                <span
                  key={c}
                  className="rounded-full border border-rose-400/20 bg-rose-400/10 px-2 py-0.5 text-[10px] font-bold capitalize text-rose-400"
                >
                  {c}
                </span>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <CheckCircle2 size={18} className="text-emerald-400" />
              <p className="font-bold text-emerald-400">Aucun</p>
            </div>
          )}
        </div>
      </div>

      {/* Erreurs récentes */}
      {recentErrors.length > 0 ? (
        <div className="rounded-3xl border border-rose-400/20 bg-rose-400/5 p-6">
          <h4 className="mb-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-rose-400">
            <AlertTriangle size={14} /> Erreurs récentes
          </h4>
          <ul className="space-y-3">
            {recentErrors.map((err, i) => (
              <li
                key={i}
                className="flex flex-wrap items-start gap-3 border-b border-white/5 pb-3 last:border-0 last:pb-0"
              >
                <span
                  className={`mt-0.5 shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold capitalize ${sourceColor(err.source)}`}
                >
                  {err.source}
                </span>
                <div className="flex-1">
                  <p className="text-xs text-white/70">{err.error}</p>
                  <p className="mt-0.5 text-[10px] text-white/30">{fmtDate(err.synced_at)}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/5 p-10 text-center">
          <CheckCircle2 size={40} className="mx-auto mb-4 text-emerald-400" />
          <p className="font-display text-lg text-emerald-400">Synchronisation saine</p>
          <p className="mt-2 text-sm text-white/40">
            Aucune erreur sur les dernières synchronisations OTA.
          </p>
        </div>
      )}

      {/* Conseil */}
      {!syncFresh && minutesSinceSync !== null && (
        <div className="rounded-3xl border border-amber-400/20 bg-amber-400/5 p-5 text-sm text-amber-200/80">
          <span className="font-bold">⚡ Sync ancienne</span> — La dernière synchronisation date de plus de{" "}
          {Math.round(minutesSinceSync / 60)}h. Vérifiez la connexion n8n ou relancez manuellement.
        </div>
      )}
    </div>
  );
}
