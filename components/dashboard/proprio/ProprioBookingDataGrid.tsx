"use client";

import Link from "next/link";
import type { DataGridColumn } from "@heroui-pro/react";
import type { Booking } from "@/types/domain";
import { BookingStatusBadge } from "@/components/dashboard/proprio/BookingStatusBadge";
import { KayvilaDataGrid } from "@/components/ui/pro";
import { formatCurrency, getBookingPriceCents } from "@/lib/utils";
import { Globe, CreditCard, Users } from "lucide-react";

type BookingRow = Pick<
  Booking,
  "id" | "start_date" | "end_date" | "guest_name" | "status" | "price" | "total_price_cents" | "source" | "payment_status" | "guests"
>;

const SOURCE_LABELS: Record<string, string> = {
  airbnb: "Airbnb", expedia: "Expedia", booking: "Booking", vrbo: "Vrbo",
  trivago: "Trivago", ical: "iCal", direct: "Direct", manual: "Manuel", admin: "Admin",
};

const PAYMENT_LABELS: Record<string, string> = {
  unpaid: "En attente", paid: "Payé", refunded: "Remboursé", partially_refunded: "Remb. partiel", failed: "Échoué",
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("fr-FR");
}

type ProprioBookingDataGridProps = {
  bookings: BookingRow[];
  villaId: string;
};

export function ProprioBookingDataGrid({ bookings, villaId }: ProprioBookingDataGridProps) {
  const columns: DataGridColumn<BookingRow>[] = [
    {
      id: "guest_name",
      header: "Client",
      accessorKey: "guest_name",
      isRowHeader: true,
      allowsSorting: true,
      pinned: "start",
      cell: (item) => (
        <Link
          href={`/dashboard/reservations/${villaId}/${item.id}`}
          className="font-medium text-navy hover:text-gold"
        >
          {item.guest_name ?? "Anonyme"}
        </Link>
      ),
    },
    {
      id: "start_date",
      header: "Arrivée",
      accessorKey: "start_date",
      allowsSorting: true,
      cell: (item) => <span className="text-muted">{formatDate(item.start_date)}</span>,
    },
    {
      id: "end_date",
      header: "Départ",
      accessorKey: "end_date",
      allowsSorting: true,
      cell: (item) => <span className="text-muted">{formatDate(item.end_date)}</span>,
    },
    {
      id: "amount",
      header: "Montant",
      allowsSorting: true,
      cell: (item) => (
        <span className="font-medium text-navy">{formatCurrency(getBookingPriceCents(item))}</span>
      ),
    },
    {
      id: "source",
      header: "Source",
      accessorKey: "source",
      cell: (item) => (
        <span className="inline-flex items-center gap-1 text-xs text-navy/60">
          <Globe size={11} />
          {SOURCE_LABELS[(item as any).source] ?? (item as any).source ?? "—"}
        </span>
      ),
    },
    {
      id: "payment_status",
      header: "Paiement",
      accessorKey: "payment_status",
      cell: (item) => {
        const ps = (item as any).payment_status ?? "unpaid";
        return (
          <span className={`text-xs font-medium ${
            ps === "paid" ? "text-emerald-600" : ps === "refunded" || ps === "partially_refunded" ? "text-orange-600" : "text-amber-600"
          }`}>
            {PAYMENT_LABELS[ps] ?? ps}
          </span>
        );
      },
    },
    {
      id: "guests",
      header: "Voyageurs",
      cell: (item) => (
        <span className="inline-flex items-center gap-1 text-xs text-navy/60">
          <Users size={11} />
          {(item as any).guests ?? "—"}
        </span>
      ),
    },
    {
      id: "status",
      header: "Statut",
      accessorKey: "status",
      allowsSorting: true,
      cell: (item) => <BookingStatusBadge status={item.status} />,
    },
  ];

  return (
    <KayvilaDataGrid
      aria-label="Réservations de la villa"
      columns={columns}
      data={bookings}
      getRowId={(item) => item.id}
    />
  );
}
