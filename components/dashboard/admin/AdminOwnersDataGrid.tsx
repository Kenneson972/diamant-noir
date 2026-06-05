"use client";

import Link from "next/link";
import type { DataGridColumn } from "@heroui-pro/react";
import { Chip } from "@heroui/react";
import { KayvilaDataGrid } from "@/components/ui/pro";

export type AdminOwnerRow = {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  created_at: string;
  villa_count: number;
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const columns: DataGridColumn<AdminOwnerRow>[] = [
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
    id: "villa_count",
    header: "Villas",
    accessorKey: "villa_count",
    allowsSorting: true,
    align: "center",
    cell: (item) => (
      <Chip size="sm" variant="soft" className="bg-gold/10 text-navy">
        {item.villa_count}
      </Chip>
    ),
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
      <Link href={`/admin/membres/${item.id}`} className="text-sm font-medium text-gold hover:text-gold/80">
        Voir
      </Link>
    ),
  },
];

export function AdminOwnersDataGrid({ rows }: { rows: AdminOwnerRow[] }) {
  return (
    <KayvilaDataGrid
      aria-label="Liste des propriétaires"
      columns={columns}
      data={rows}
      getRowId={(item) => item.id}
    />
  );
}
