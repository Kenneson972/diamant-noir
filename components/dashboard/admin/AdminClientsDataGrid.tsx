"use client";

import Link from "next/link";
import type { DataGridColumn } from "@heroui-pro/react/data-grid";
import { KayvilaDataGrid } from "@/components/ui/pro";

export type AdminClientRow = {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  created_at: string;
  bookingCount: number;
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const columns: DataGridColumn<AdminClientRow>[] = [
  {
    id: "full_name",
    header: "Nom",
    accessorKey: "full_name",
    isRowHeader: true,
    allowsSorting: true,
    pinned: "start",
    minWidth: 160,
    cell: (item) => <span className="font-medium text-navy">{item.full_name ?? "—"}</span>,
  },
  {
    id: "email",
    header: "Email",
    accessorKey: "email",
    allowsSorting: true,
    cell: (item) => <span className="text-muted">{item.email}</span>,
  },
  {
    id: "phone",
    header: "Téléphone",
    accessorKey: "phone",
    cell: (item) => <span className="text-muted">{item.phone ?? "—"}</span>,
  },
  {
    id: "bookingCount",
    header: "Séjours",
    accessorKey: "bookingCount",
    allowsSorting: true,
    align: "center",
    cell: (item) => <span className="font-medium text-navy">{item.bookingCount}</span>,
  },
  {
    id: "created_at",
    header: "Inscrit le",
    accessorKey: "created_at",
    allowsSorting: true,
    cell: (item) => <span className="text-muted">{formatDate(item.created_at)}</span>,
  },
  {
    id: "actions",
    header: "Actions",
    cell: (item) => (
      <Link href={`/admin/clients/${item.id}`} className="text-sm font-medium text-gold hover:text-gold/80">
        Fiche 360°
      </Link>
    ),
  },
];

export function AdminClientsDataGrid({ rows }: { rows: AdminClientRow[] }) {
  return (
    <KayvilaDataGrid
      aria-label="Liste des clients"
      columns={columns}
      data={rows}
      getRowId={(item) => item.id}
      selectionMode="multiple"
      showSelectionCheckboxes
    />
  );
}
