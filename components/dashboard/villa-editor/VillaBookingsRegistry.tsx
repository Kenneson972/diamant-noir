"use client"

import { Filter, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { ReactNode } from "react"
import { CreditCard } from "lucide-react"

export type VillaBookingRow = {
  id: string
  guest_name?: string | null
  start_date: string
  end_date: string
  source?: string | null
  price: number | string
  payment_status?: string | null
  status?: string | null
}

export function VillaBookingsRegistry({
  bookingsTotal,
  filteredBookings,
  bookingSearch,
  onBookingSearchChange,
  bookingStatusFilter,
  onBookingStatusFilterChange,
  bookingSourceFilter,
  onBookingSourceFilterChange,
  onExportCsv,
  renderRowActions,
}: {
  bookingsTotal: number
  filteredBookings: VillaBookingRow[]
  bookingSearch: string
  onBookingSearchChange: (v: string) => void
  bookingStatusFilter: "all" | "confirmed" | "pending"
  onBookingStatusFilterChange: (v: "all" | "confirmed" | "pending") => void
  bookingSourceFilter: "all" | "airbnb" | "other"
  onBookingSourceFilterChange: (v: "all" | "airbnb" | "other") => void
  onExportCsv: () => void
  renderRowActions: (booking: VillaBookingRow) => ReactNode
}) {
  return (
    <div className="rounded-[40px] border border-navy/5 bg-white p-8 shadow-sm mt-8">
      <div className="flex flex-col gap-4 mb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="font-display text-3xl text-navy">Registre des réservations</h3>
            <p className="text-sm text-navy/40">
              {filteredBookings.length === bookingsTotal
                ? "Tous les séjours enregistrés pour cette villa."
                : `${filteredBookings.length} réservation(s) affichée(s) sur ${bookingsTotal}.`}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-full border-navy/10 gap-2 h-10 shrink-0 px-6 text-[10px] font-bold uppercase tracking-widest"
            onClick={onExportCsv}
            disabled={filteredBookings.length === 0}
          >
            <Download size={14} /> Exporter CSV
          </Button>
        </div>
        <div
          className="flex flex-col gap-3 rounded-2xl border border-navy/8 bg-offwhite/60 p-4 lg:flex-row lg:flex-wrap lg:items-center"
          role="search"
          aria-label="Filtrer les réservations"
        >
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-navy/40">
            <Filter size={14} aria-hidden />
            Filtrer
          </div>
          <Input
            value={bookingSearch}
            onChange={(e) => onBookingSearchChange(e.target.value)}
            placeholder="Rechercher un client ou un ID…"
            className="max-w-md rounded-xl bg-white"
            aria-label="Recherche client"
          />
          <select
            value={bookingStatusFilter}
            onChange={(e) => onBookingStatusFilterChange(e.target.value as "all" | "confirmed" | "pending")}
            className="h-10 rounded-xl border border-navy/10 bg-white px-3 text-xs font-medium text-navy"
            aria-label="Filtrer par statut"
          >
            <option value="all">Tous les statuts</option>
            <option value="confirmed">Confirmé</option>
            <option value="pending">En attente</option>
          </select>
          <select
            value={bookingSourceFilter}
            onChange={(e) => onBookingSourceFilterChange(e.target.value as "all" | "airbnb" | "other")}
            className="h-10 rounded-xl border border-navy/10 bg-white px-3 text-xs font-medium text-navy"
            aria-label="Filtrer par provenance"
          >
            <option value="all">Toutes les provenances</option>
            <option value="airbnb">Airbnb</option>
            <option value="other">Autre / Direct</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-navy/5 text-[10px] font-bold uppercase tracking-[0.2em] text-navy/40">
              <th className="pb-4 pl-4 font-bold">Client</th>
              <th className="pb-4 font-bold">Dates</th>
              <th className="pb-4 font-bold">Provenance</th>
              <th className="pb-4 font-bold">Prix</th>
              <th className="pb-4 font-bold">Paiement</th>
              <th className="pb-4 font-bold">Statut</th>
              <th className="pb-4 pr-4 text-right font-bold">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy/5">
            {filteredBookings.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-sm text-navy/45">
                  {bookingsTotal === 0
                    ? "Aucune réservation enregistrée pour cette villa."
                    : "Aucune réservation ne correspond aux filtres."}
                </td>
              </tr>
            ) : (
              filteredBookings.map((booking) => (
                <tr key={booking.id} className="group hover:bg-offwhite transition-colors">
                  <td className="py-5 pl-4">
                    <p className="font-bold text-navy">{booking.guest_name || "Client Privé"}</p>
                    <p className="text-[10px] text-navy/40 uppercase tracking-widest">ID: {booking.id.slice(0, 8)}</p>
                  </td>
                  <td className="py-5">
                    <p className="text-sm text-navy">
                      {new Date(booking.start_date).toLocaleDateString("fr-FR")} -{" "}
                      {new Date(booking.end_date).toLocaleDateString("fr-FR")}
                    </p>
                  </td>
                  <td className="py-5">
                    <span
                      className={`inline-block rounded-full px-3 py-1 text-[8px] font-bold uppercase tracking-widest ${
                        booking.source === "airbnb" ? "bg-rose-50 text-rose-600" : "bg-blue-50 text-blue-600"
                      }`}
                    >
                      {booking.source || "Direct"}
                    </span>
                  </td>
                  <td className="py-5">
                    <p className="font-bold text-navy">€{Number(booking.price).toLocaleString()}</p>
                  </td>
                  <td className="py-5">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[8px] font-bold uppercase tracking-widest ${
                        booking.payment_status === "paid" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                      }`}
                    >
                      <CreditCard size={10} />
                      {booking.payment_status === "paid" ? "Payé" : "À payer"}
                    </span>
                  </td>
                  <td className="py-5">
                    <span
                      className={`inline-block h-2 w-2 rounded-full mr-2 ${
                        booking.status === "confirmed" ? "bg-emerald-500" : "bg-amber-500"
                      }`}
                    />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-navy/60">
                      {booking.status === "confirmed" ? "Confirmé" : "En attente"}
                    </span>
                  </td>
                  <td className="py-5 pr-4 text-right">{renderRowActions(booking)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
