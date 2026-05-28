"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { VillaEditorForm } from "@/components/dashboard/proprio/VillaEditorForm";
import { VillaImageManagerWrapper } from "@/components/dashboard/villa-editor/VillaImageManagerWrapper";
import { VillaBookingsRegistry } from "@/components/dashboard/villa-editor/VillaBookingsRegistry";
import type { VillaBookingRow } from "@/components/dashboard/villa-editor/VillaBookingsRegistry";
import { PlanningIcalSyncCard } from "@/components/dashboard/villa-editor/PlanningIcalSyncCard";
import { IcalConnectivityStatus } from "@/components/dashboard/villa-editor/IcalConnectivityStatus";
import { Save, Loader2, ChevronDown } from "lucide-react";

interface AdminVillaEditClientProps {
  villa: Record<string, unknown>;
  bookings: VillaBookingRow[];
}

export function AdminVillaEditClient({ villa, bookings }: AdminVillaEditClientProps) {
  const router = useRouter();
  const [cleaningFeeEuros, setCleaningFeeEuros] = useState(
    ((villa.cleaning_fee_cents as number) || 0) / 100
  );
  const [cleaningFeeSaving, setCleaningFeeSaving] = useState(false);
  const [bookingSearch, setBookingSearch] = useState("");
  const [bookingStatusFilter, setBookingStatusFilter] = useState<"all" | "confirmed" | "pending">("all");
  const [bookingSourceFilter, setBookingSourceFilter] = useState<"all" | "airbnb" | "other">("all");
  const [icalSaving, setIcalSaving] = useState(false);

  // Admin-only params
  const [adminOpen, setAdminOpen] = useState(false);
  const [isPublished, setIsPublished] = useState(!!villa.is_published);
  const [commissionRate, setCommissionRate] = useState(
    ((villa.commission_rate as number) || 25)
  );
  const [collectionTier, setCollectionTier] = useState(
    (villa.collection_tier as string) || "standard"
  );
  const [selectedOwnerId, setSelectedOwnerId] = useState(
    (villa.owner_id as string) || ""
  );
  const [owners, setOwners] = useState<{ id: string; full_name: string; email: string }[]>([]);
  const [adminSaving, setAdminSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/owners")
      .then((r) => r.json())
      .then((data) => {
        if (data.owners) setOwners(data.owners);
        else if (Array.isArray(data)) setOwners(data);
      })
      .catch(() => {});
  }, []);

  const handleSaveAdminParams = useCallback(async () => {
    setAdminSaving(true);
    try {
      const res = await fetch("/api/dashboard/update-villa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          villaId: villa.id,
          payload: {
            is_published: isPublished,
            commission_rate: Number(commissionRate) || 25,
            collection_tier: collectionTier,
            owner_id: selectedOwnerId || null,
          },
        }),
      });
      if (!res.ok) throw new Error("Erreur lors de la sauvegarde");
      router.refresh();
    } catch {
      // silent
    } finally {
      setAdminSaving(false);
    }
  }, [villa.id, isPublished, commissionRate, collectionTier, selectedOwnerId, router]);

  const photosRef = useRef<string[]>(
    Array.isArray(villa.image_urls)
      ? (villa.image_urls as string[])
      : villa.image_url
        ? [villa.image_url as string]
        : []
  );

  const filteredBookings = useMemo(
    () =>
      bookings.filter((b) => {
        const matchSearch =
          !bookingSearch ||
          (b.guest_name ?? "").toLowerCase().includes(bookingSearch.toLowerCase());
        const matchStatus =
          bookingStatusFilter === "all" || b.status === bookingStatusFilter;
        const matchSource =
          bookingSourceFilter === "all" ||
          (bookingSourceFilter === "airbnb" ? b.source === "airbnb" : b.source !== "airbnb");
        return matchSearch && matchStatus && matchSource;
      }),
    [bookings, bookingSearch, bookingStatusFilter, bookingSourceFilter]
  );

  const handleExportCsv = useCallback(() => {
    const rows = filteredBookings.map((b) =>
      [b.guest_name ?? "", b.start_date, b.end_date, b.status ?? "", b.source ?? ""].join(";")
    );
    const csv = ["Nom;Arrivée;Départ;Statut;Source", ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `reservations-${villa.id}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, [filteredBookings, villa.id]);

  const handleIcalSync = useCallback(async () => {
    setIcalSaving(true);
    try {
      await fetch("/api/sync-ota", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ villaId: villa.id }),
      });
    } finally {
      setIcalSaving(false);
    }
  }, [villa.id]);

  const handleSaveCleaningFee = useCallback(async () => {
    setCleaningFeeSaving(true);
    try {
      const res = await fetch("/api/dashboard/update-villa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          villaId: villa.id,
          payload: { cleaning_fee_cents: Math.round(cleaningFeeEuros * 100) },
        }),
      });
      if (!res.ok) throw new Error("Erreur lors de la sauvegarde");
      router.refresh();
    } catch {
      // silent
    } finally {
      setCleaningFeeSaving(false);
    }
  }, [villa.id, cleaningFeeEuros, router]);

  const icalUrl = villa.ical_url as string | null | undefined;
  const icalTone = icalUrl ? "ok" : "neutral";
  const icalBody = icalUrl
    ? `URL iCal connectée : ${icalUrl}`
    : "Aucune URL iCal configurée. Renseignez-la dans les informations générales.";

  return (
    <div className="space-y-8">
      {/* Section 1 : Formulaire + équipements + save sticky */}
      <VillaEditorForm villa={villa} photosRef={photosRef} />

      {/* Section admin : Paramètres admin (admin only) */}
      <div className="rounded-2xl border border-gold/20 bg-white p-6 shadow-sm">
        <button
          type="button"
          onClick={() => setAdminOpen(!adminOpen)}
          className="flex w-full items-center justify-between text-left"
        >
          <h3 className="font-display text-base font-semibold text-navy-900">
            🔧 Paramètres admin
          </h3>
          <ChevronDown
            className={`h-5 w-5 text-muted transition-transform ${adminOpen ? "rotate-180" : ""}`}
          />
        </button>
        {adminOpen && (
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {/* is_published toggle */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsPublished(!isPublished)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  isPublished ? "bg-emerald-600" : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isPublished ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
              <label className="text-sm font-medium text-navy-900">
                {isPublished ? "Publiée" : "Non publiée"}
              </label>
            </div>

            {/* commission_rate */}
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-muted" htmlFor="admin-commission">
                Commission (%)
              </label>
              <input
                id="admin-commission"
                type="number"
                min="0"
                max="100"
                step="1"
                value={commissionRate}
                onChange={(e) => setCommissionRate(Number(e.target.value))}
                className="w-full rounded-xl border border-navy/10 px-4 py-3 text-sm focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20"
              />
            </div>

            {/* collection_tier */}
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-muted" htmlFor="admin-tier">
                Niveau collection
              </label>
              <select
                id="admin-tier"
                value={collectionTier}
                onChange={(e) => setCollectionTier(e.target.value)}
                className="w-full rounded-xl border border-navy/10 px-4 py-3 text-sm focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20"
              >
                <option value="standard">Standard</option>
                <option value="premium">Premium</option>
                <option value="signature">Signature</option>
              </select>
            </div>

            {/* owner_id */}
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-muted" htmlFor="admin-owner">
                Propriétaire
              </label>
              <select
                id="admin-owner"
                value={selectedOwnerId}
                onChange={(e) => setSelectedOwnerId(e.target.value)}
                className="w-full rounded-xl border border-navy/10 px-4 py-3 text-sm focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20"
              >
                <option value="">— Sélectionner —</option>
                {owners.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.full_name || o.email}
                  </option>
                ))}
              </select>
            </div>

            {/* Save button */}
            <div className="sm:col-span-2 flex justify-end">
              <button
                type="button"
                onClick={handleSaveAdminParams}
                disabled={adminSaving}
                className="inline-flex items-center gap-2 rounded-xl bg-navy-900 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-navy-800 disabled:opacity-50"
              >
                {adminSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {adminSaving ? "Sauvegarde..." : "Enregistrer"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Section 1.5 : Frais de ménage */}
      <div className="rounded-2xl border border-navy/8 bg-white p-6 shadow-sm">
        <h3 className="mb-4 font-display-dashboard text-base font-semibold text-navy">
          Frais de ménage
        </h3>
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <label className="mb-1 block text-xs font-semibold text-navy" htmlFor="admin-cleaning-fee">
              Montant (EUR)
            </label>
            <input
              id="admin-cleaning-fee"
              type="number"
              min="0"
              step="0.01"
              value={cleaningFeeEuros}
              onChange={(e) => setCleaningFeeEuros(Number(e.target.value))}
              className="w-full rounded-xl border border-navy/10 px-4 py-3 text-sm focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20"
            />
            <p className="mt-1 text-[11px] text-navy/55">100 % reversé à Kayvila pour le ménage et la blanchisserie</p>
          </div>
          <button
            type="button"
            onClick={handleSaveCleaningFee}
            disabled={cleaningFeeSaving}
            className="inline-flex items-center gap-2 rounded-xl bg-navy-900 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-navy-800 disabled:opacity-50"
          >
            {cleaningFeeSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {cleaningFeeSaving ? "Sauvegarde..." : "Enregistrer"}
          </button>
        </div>
      </div>

      {/* Section 2 : Photos */}
      <VillaImageManagerWrapper
        villaId={villa.id as string}
        initialPhotos={photosRef.current}
        photosRef={photosRef}
      />

      {/* Section 3 : Registre réservations */}
      <VillaBookingsRegistry
        bookingsTotal={bookings.length}
        filteredBookings={filteredBookings}
        bookingSearch={bookingSearch}
        onBookingSearchChange={setBookingSearch}
        bookingStatusFilter={bookingStatusFilter}
        onBookingStatusFilterChange={setBookingStatusFilter}
        bookingSourceFilter={bookingSourceFilter}
        onBookingSourceFilterChange={setBookingSourceFilter}
        onExportCsv={handleExportCsv}
        renderRowActions={() => null}
      />

      {/* Section 4 : iCal */}
      <PlanningIcalSyncCard
        lastLine={icalUrl ? "iCal connecté" : null}
        body={icalBody}
        tone={icalTone}
        saving={icalSaving}
        onSync={handleIcalSync}
      />
      <IcalConnectivityStatus
        lastLine={icalUrl ? "Synchronisation active" : null}
        body={icalUrl ? "Les disponibilités sont synchronisées avec Airbnb." : "Pas de synchronisation configurée."}
        tone={icalTone}
      />
    </div>
  );
}
