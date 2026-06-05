"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { PlanningIcalSyncCard } from "@/components/dashboard/villa-editor/PlanningIcalSyncCard";
import { IcalConnectivityStatus } from "@/components/dashboard/villa-editor/IcalConnectivityStatus";

type OTAChannel = {
  source: string;
  ical_url: string;
  label?: string;
};

type VillaIcalPanelProps = {
  villaId: string;
  icalUrl: string | null;
  otaChannels: OTAChannel[] | null;
};

export function VillaIcalPanel({ villaId, icalUrl, otaChannels }: VillaIcalPanelProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [adding, setAdding] = useState(false);
  const [addUrl, setAddUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  const channels = otaChannels ?? (icalUrl ? [{ source: "airbnb", ical_url: icalUrl, label: "iCal" }] : []);
  const hasChannels = channels.length > 0;
  const tone = hasChannels ? "ok" : "neutral";
  const body = hasChannels
    ? `${channels.length} flux connecté${channels.length > 1 ? "s" : ""} (Airbnb, Booking, etc.).`
    : "Collez l'URL iCal exportée depuis Airbnb ou Booking pour synchroniser vos disponibilités.";

  const handleSync = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/sync-ota", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ villaId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Échec de la synchronisation");
      }
    } catch {
      setError("Erreur réseau");
    } finally {
      setSaving(false);
    }
  }, [villaId]);

  const handleAddUrl = useCallback(async () => {
    const url = addUrl.trim();
    if (!url) return;
    setAdding(true);
    setError(null);
    try {
      const res = await fetch("/api/sync-ota", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ villaId, addUrl: url }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Impossible d'ajouter ce flux");
        return;
      }
      setAddUrl("");
      router.refresh();
    } catch {
      setError("Erreur réseau");
    } finally {
      setAdding(false);
    }
  }, [addUrl, router, villaId]);

  return (
    <div className="space-y-4">
      <div className="rounded-[32px] border border-navy/5 bg-white p-6 shadow-sm">
        <h4 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-navy/55">
          Lien iCal (Airbnb, Booking…)
        </h4>
        <p className="mb-4 text-xs leading-relaxed text-navy/60">
          Exportez le calendrier depuis votre plateforme OTA et collez l&apos;URL ici pour éviter les
          doubles réservations.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="url"
            value={addUrl}
            onChange={(e) => setAddUrl(e.target.value)}
            placeholder="https://www.airbnb.com/calendar/ical/…"
            className="min-h-[44px] flex-1 rounded-xl border border-navy/15 px-3 py-2 text-sm text-navy placeholder:text-navy/30 focus:border-gold focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/40"
          />
          <button
            type="button"
            onClick={handleAddUrl}
            disabled={adding || !addUrl.trim()}
            className="min-h-[44px] shrink-0 rounded-xl bg-navy px-5 text-[10px] font-bold uppercase tracking-widest text-white transition-colors hover:bg-gold hover:text-navy disabled:opacity-50"
          >
            {adding ? "Ajout…" : "Ajouter le flux"}
          </button>
        </div>
        {error ? (
          <p className="mt-3 text-xs text-red-600" role="alert">
            {error}
          </p>
        ) : null}
      </div>

      <PlanningIcalSyncCard
        lastLine={hasChannels ? "Flux iCal configuré" : null}
        body={body}
        tone={tone}
        saving={saving}
        onSync={handleSync}
      />
      <IcalConnectivityStatus
        lastLine={hasChannels ? "Synchronisation disponible" : null}
        body={
          hasChannels
            ? "Lancez une sync manuelle ou attendez le cron nocturne (3h)."
            : "Aucun flux — ajoutez une URL iCal ci-dessus."
        }
        tone={tone}
      />
    </div>
  );
}
