"use client";

import { useState } from "react";
import { Zap, RefreshCcw, CheckCircle2, XCircle, Wifi, AlertTriangle, ExternalLink, Clock } from "lucide-react";
import Link from "next/link";

interface OTAChannel {
  source: string;
  ical_url: string;
  label?: string;
}

interface Villa {
  id: string;
  name: string;
  ota_channels: OTAChannel[] | null;
  ical_url: string | null;
  is_published: boolean;
}

interface SyncResult {
  villaId: string;
  channels: string[];
  totalInserted: number;
  totalDeleted: number;
  message?: string;
  error?: string;
  syncedAt?: string;
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const mins = Math.round((now.getTime() - date.getTime()) / 60000);
  if (mins < 1) return "À l'instant";
  if (mins < 60) return `Il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  return `Il y a ${days}j`;
}

export function SyncOtaAdminPage({ villas }: { villas: Villa[] }) {
  const [syncingVilla, setSyncingVilla] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, SyncResult>>({});

  const handleSync = async (villaId: string) => {
    setSyncingVilla(villaId);
    const syncedAt = new Date().toISOString();
    try {
      const res = await fetch("/api/sync-ota", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ villaId }),
      });
      const data = await res.json();
      setResults((prev) => ({
        ...prev,
        [villaId]: { ...data, villaId, channels: data.channels ?? [], syncedAt },
      }));
    } catch {
      setResults((prev) => ({
        ...prev,
        [villaId]: { villaId, channels: [], totalInserted: 0, totalDeleted: 0, error: "Erreur réseau", syncedAt },
      }));
    } finally {
      setSyncingVilla(null);
    }
  };

  const hasChannels = (villa: Villa): boolean => {
    return !!(villa.ota_channels?.length || villa.ical_url);
  };

  const villasWithOTA = villas.filter(hasChannels);
  const villasWithoutOTA = villas.filter((v) => !hasChannels(v));

  return (
    <div className="space-y-8">
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-emerald-700">
            Villas connectées
          </p>
          <p className="mt-2 text-2xl font-bold text-emerald-800">{villasWithOTA.length}</p>
        </div>
        <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-amber-700">
            Villas sans OTA
          </p>
          <p className="mt-2 text-2xl font-bold text-amber-800">{villasWithoutOTA.length}</p>
        </div>
        <div className="rounded-lg border border-navy/10 bg-white p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-navy/60">
            Total villas
          </p>
          <p className="mt-2 text-2xl font-bold text-navy">{villas.length}</p>
        </div>
        <div className="rounded-lg border border-navy/10 bg-white p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-navy/60">
            Dernière synchro globale
          </p>
          {(() => {
            const syncedResults = Object.values(results).filter((r) => r.syncedAt);
            if (syncedResults.length === 0) {
              return <p className="mt-2 text-sm text-navy/40">—</p>;
            }
            const latest = syncedResults.sort((a, b) => new Date(b.syncedAt!).getTime() - new Date(a.syncedAt!).getTime())[0];
            return (
              <p className="mt-2 text-sm font-medium text-navy">
                {timeAgo(latest.syncedAt!)}
              </p>
            );
          })()}
        </div>
      </div>

      {/* Villas avec OTA */}
      {villasWithOTA.length > 0 && (
        <div>
          <h2 className="mb-4 text-lg font-semibold text-navy">
            Villas avec canaux OTA
          </h2>
          <div className="space-y-3">
            {villasWithOTA.map((villa) => {
              const result = results[villa.id];
              const channels = villa.ota_channels ?? (villa.ical_url ? [{ source: "ical", ical_url: villa.ical_url, label: "iCal" }] : []);
              return (
                <div
                  key={villa.id}
                  className="rounded-lg border bg-white p-5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/admin/villas/${villa.id}`}
                        className="font-medium text-navy hover:text-gold transition-colors"
                      >
                        {villa.name}
                      </Link>
                      {villa.is_published ? (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                          Publiée
                        </span>
                      ) : (
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">
                          Brouillon
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex flex-wrap gap-1.5">
                        {channels.map((ch, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-medium capitalize"
                            title={ch.ical_url ?? ""}
                          >
                            <Wifi size={10} />
                            {ch.label ?? ch.source}
                          </span>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleSync(villa.id)}
                        disabled={syncingVilla === villa.id}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-navy px-3 py-1.5 text-xs font-medium text-white hover:bg-navy/80 transition-colors disabled:opacity-50"
                      >
                        <RefreshCcw
                          size={12}
                          className={syncingVilla === villa.id ? "animate-spin" : ""}
                        />
                        {syncingVilla === villa.id ? "Sync..." : "Sync"}
                      </button>
                    </div>
                  </div>

                  {/* Statut dernière synchro */}
                  {result?.syncedAt && (
                    <div className="mt-2 flex items-center gap-1.5 text-[11px] text-navy/40">
                      <Clock size={10} />
                      Dernière synchro : {timeAgo(result.syncedAt)}
                    </div>
                  )}
                  {!result?.syncedAt && (
                    <div className="mt-2 flex items-center gap-1.5 text-[11px] text-navy/30">
                      <Clock size={10} />
                      Aucune synchro effectuée
                    </div>
                  )}

                  {result && (
                    <div className={`mt-3 rounded-lg border p-3 text-sm ${
                      result.error
                        ? "border-red-200 bg-red-50 text-red-700"
                        : result.totalInserted > 0 || result.totalDeleted > 0
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-gray-200 bg-gray-50 text-gray-600"
                    }`}>
                      {result.error ? (
                        <div className="flex items-center gap-2">
                          <XCircle size={14} />
                          {result.error}
                        </div>
                      ) : (
                        <div className="flex items-center gap-4">
                          <CheckCircle2 size={14} />
                          <span>{result.totalInserted} importé{result.totalInserted > 1 ? "s" : ""}</span>
                          <span>{result.totalDeleted} supprimé{result.totalDeleted > 1 ? "s" : ""}</span>
                          {result.message && <span className="text-gray-500">&mdash; {result.message}</span>}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Villes sans OTA */}
      {villasWithoutOTA.length > 0 && (
        <div>
          <h2 className="mb-4 text-lg font-semibold text-navy">
            Villas sans connexion OTA
          </h2>
          <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center">
            <AlertTriangle className="mx-auto h-8 w-8 text-amber-400" />
            <p className="mt-3 text-sm text-gray-500">
              {villasWithoutOTA.length} villa{villasWithoutOTA.length > 1 ? "s" : ""} sans canal de synchronisation.
            </p>
            <p className="mt-1 text-xs text-gray-400">
              Configurez un canal OTA depuis la fiche de chaque villa.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {villasWithoutOTA.slice(0, 6).map((v) => (
                <Link
                  key={v.id}
                  href={`/admin/villas/${v.id}`}
                  className="inline-flex items-center gap-1 rounded-full border border-navy/10 px-3 py-1 text-xs text-navy/70 hover:border-gold/30 hover:text-gold transition-colors"
                >
                  {v.name}
                  <ExternalLink size={10} />
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
