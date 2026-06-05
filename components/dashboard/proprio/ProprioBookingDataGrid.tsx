"use client";

import Link from "next/link";
import type { DataGridColumn } from "@heroui-pro/react";
import type { Booking } from "@/types/domain";
import { BookingStatusBadge } from "@/components/dashboard/proprio/BookingStatusBadge";
import { KayvilaDataGrid } from "@/components/ui/pro";
import { formatCurrency, getBookingPriceCents } from "@/lib/utils";

type BookingRow = Pick<
  Booking,
  "id" | "start_date" | "end_date" | "guest_name" | "status" | "price" | "total_price_cents"
>;

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
