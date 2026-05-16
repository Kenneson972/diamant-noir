"use client";

import { useState, useCallback } from "react";
import { VillaEditorForm } from "@/components/dashboard/proprio/VillaEditorForm";
import { VillaImageManagerWrapper } from "@/components/dashboard/villa-editor/VillaImageManagerWrapper";
import { VillaBookingsRegistry } from "@/components/dashboard/villa-editor/VillaBookingsRegistry";
import type { VillaBookingRow } from "@/components/dashboard/villa-editor/VillaBookingsRegistry";
import { PlanningIcalSyncCard } from "@/components/dashboard/villa-editor/PlanningIcalSyncCard";
import { IcalConnectivityStatus } from "@/components/dashboard/villa-editor/IcalConnectivityStatus";

interface AdminVillaEditClientProps {
  villa: Record<string, unknown>;
  bookings: VillaBookingRow[];
}

export function AdminVillaEditClient({ villa, bookings }: AdminVillaEditClientProps) {
  const [bookingSearch, setBookingSearch] = useState("");
  const [bookingStatusFilter, setBookingStatusFilter] = useState<"all" | "confirmed" | "pending">("all");
  const [bookingSourceFilter, setBookingSourceFilter] = useState<"all" | "airbnb" | "other">("all");
  const [icalSaving, setIcalSaving] = useState(false);

  const filteredBookings = bookings.filter((b) => {
    const matchSearch =
      !bookingSearch ||
      (b.guest_name ?? "").toLowerCase().includes(bookingSearch.toLowerCase());
    const matchStatus =
      bookingStatusFilter === "all" || b.status === bookingStatusFilter;
    const matchSource =
      bookingSourceFilter === "all" ||
      (bookingSourceFilter === "airbnb" ? b.source === "airbnb" : b.source !== "airbnb");
    return matchSearch && matchStatus && matchSource;
  });

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
      await fetch(`/api/villa/sync-ical?villaId=${villa.id}`, { method: "POST" });
    } finally {
      setIcalSaving(false);
    }
  }, [villa.id]);

  const icalUrl = villa.ical_url as string | null | undefined;
  const icalTone = icalUrl ? "ok" : "neutral";
  const icalBody = icalUrl
    ? `URL iCal connectée : ${icalUrl}`
    : "Aucune URL iCal configurée. Renseignez-la dans les informations générales.";

  return (
    <div className="space-y-8">
      {/* Section 1 : Formulaire + équipements + save sticky */}
      <VillaEditorForm villa={villa} />

      {/* Section 2 : Photos */}
      <VillaImageManagerWrapper
        villaId={villa.id as string}
        initialPhotos={
          Array.isArray(villa.photos)
            ? (villa.photos as string[])
            : villa.image_url
              ? [villa.image_url as string]
              : []
        }
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
