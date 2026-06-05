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
  avatar_url: string | null;
  created_at: string;
  suspended: boolean;
  villa_count: number;
  published_count: number;
  avg_commission: number;
  stripe_connect_account_id: string | null;
  stripe_connect_onboarding_completed: boolean;
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
    header: "Propriétaire",
    accessorKey: "full_name",
    isRowHeader: true,
    allowsSorting: true,
    pinned: "start",
    minWidth: 200,
    cell: (item) => (
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-navy/5 text-xs font-bold text-navy/60">
          {(item.full_name ?? item.email).charAt(0).toUpperCase()}
        </div>
        <div>
          <span className="font-medium text-navy">{item.full_name ?? "—"}</span>
          {item.suspended && (
            <Chip size="sm" variant="soft" className="ml-2 bg-red-100 text-red-700">
              Suspendu
            </Chip>
          )}
        </div>
      </div>
    ),
  },
  {
    id: "email",
    header: "Email",
    accessorKey: "email",
    allowsSorting: true,
    cell: (item) => <span className="text-sm text-muted">{item.email}</span>,
  },
  {
    id: "villas",
    header: "Villas",
    accessorKey: "villa_count",
    allowsSorting: true,
    align: "center",
    cell: (item) => (
      <div className="flex items-center gap-1.5">
        <Chip size="sm" variant="soft" className="bg-gold/10 text-navy">
          {item.villa_count}
        </Chip>
        {item.published_count > 0 && (
          <span className="text-[10px] text-muted">
            ({item.published_count} pub.)
          </span>
        )}
      </div>
    ),
  },
  {
    id: "stripe",
    header: "Stripe",
    accessorKey: "stripe_connect_onboarding_completed",
    allowsSorting: true,
    align: "center",
    cell: (item) =>
      item.stripe_connect_onboarding_completed ? (
        <Chip size="sm" variant="soft" className="bg-emerald-100 text-emerald-700">
          Connecté
        </Chip>
      ) : item.stripe_connect_account_id ? (
        <Chip size="sm" variant="soft" className="bg-amber-100 text-amber-700">
          En attente
        </Chip>
      ) : (
        <Chip size="sm" variant="soft" className="bg-gray-100 text-gray-500">
          Non configuré
        </Chip>
      ),
  },
  {
    id: "commission",
    header: "Commission",
    accessorKey: "avg_commission",
    allowsSorting: true,
    align: "center",
    cell: (item) => (
      <span className="text-sm text-navy">
        {Math.round(item.avg_commission * 100)}%
      </span>
    ),
  },
  {
    id: "created_at",
    header: "Inscrit le",
    accessorKey: "created_at",
    allowsSorting: true,
    cell: (item) => <span className="text-sm text-muted">{formatDate(item.created_at)}</span>,
  },
  {
    id: "actions",
    header: "",
    cell: (item) => (
      <Link
        href={`/admin/proprietaires/${item.id}`}
        className="text-sm font-medium text-gold hover:text-gold/80 transition-colors"
      >
        Détail →
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
