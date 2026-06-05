"use client";

import Link from "next/link";
import type { DataGridColumn } from "@heroui-pro/react";
import type { Selection } from "react-aria-components";
import { KayvilaDataGrid, KayvilaNumberValue } from "@/components/ui/pro";
import { BOOKING_STATUS_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

export type AdminBookingRow = {
  id: string;
  guest_name: string | null;
  guest_email: string | null;
  villa_id: string;
  start_date: string;
  end_date: string;
  total_price_cents: number | null;
  status: string;
  villas?: { name: string } | null;
};

function nightsBetween(start: string, end: string): number {
  return Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86400000);
}

function statusClass(status: string): string {
  if (status === "confirmed") return "bg-emerald-50 text-emerald-700";
  if (status === "pending") return "bg-amber-50 text-amber-700";
  return "bg-red-50 text-red-700";
}

type AdminReservationsDataGridProps = {
  rows: AdminBookingRow[];
  filter: string;
  onConfirm: (id: string) => void;
  onCancel: (id: string) => void;
  selectedKeys?: Selection;
  onSelectionChange?: (keys: Selection) => void;
};

export function AdminReservationsDataGrid({
  rows,
  filter,
  onConfirm,
  onCancel,
  selectedKeys,
  onSelectionChange,
}: AdminReservationsDataGridProps) {
  const columns: DataGridColumn<AdminBookingRow>[] = [
    {
      id: "guest_name",
      header: "Client",
      accessorKey: "guest_name",
      isRowHeader: true,
      allowsSorting: true,
      pinned: "start",
      minWidth: 180,
      cell: (item) => (
        <div>
          <span className="font-medium text-navy">{item.guest_name || "Anonyme"}</span>
          {item.guest_email ? (
            <span className="block text-[11px] text-muted">{item.guest_email}</span>
          ) : null}
        </div>
      ),
    },
    {
      id: "villa",
      header: "Villa",
      allowsSorting: true,
      cell: (item) => (
        <span className="text-navy/70">{item.villas?.name ?? item.villa_id.slice(0, 8)}</span>
      ),
    },
    {
      id: "start_date",
      header: "Arrivée",
      accessorKey: "start_date",
      allowsSorting: true,
      cell: (item) => (
        <span className="text-navy/70">
          {formatDate(item.start_date, { day: "numeric", month: "short" })}
        </span>
      ),
    },
    {
      id: "end_date",
      header: "Départ",
      accessorKey: "end_date",
      allowsSorting: true,
      cell: (item) => (
        <span className="text-navy/70">
          {formatDate(item.end_date, { day: "numeric", month: "short" })}
        </span>
      ),
    },
    {
      id: "nights",
      header: "Nuits",
      align: "center",
      cell: (item) => (
        <span className="text-navy/70">{nightsBetween(item.start_date, item.end_date)} n.</span>
      ),
    },
    {
      id: "total_price_cents",
      header: "Montant",
      accessorKey: "total_price_cents",
      allowsSorting: true,
      cell: (item) => (
        <KayvilaNumberValue
          value={item.total_price_cents ?? 0}
          format="currency"
          cents
          className="font-medium text-navy"
        />
      ),
    },
    {
      id: "status",
      header: "Statut",
      accessorKey: "status",
      allowsSorting: true,
      cell: (item) => (
        <span
          className={cn(
            "inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold",
            statusClass(item.status)
          )}
        >
          {BOOKING_STATUS_LABELS[item.status] ?? item.status}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      pinned: "end",
      cell: (item) => (
        <div className="flex gap-1.5">
          <Link
            href={`/admin/reservations/${item.id}`}
            className="rounded bg-navy/5 px-2 py-1 text-[10px] font-semibold text-navy/70 hover:bg-navy/10"
          >
            Voir
          </Link>
          {filter !== "past" && (
            <>
              {item.status === "pending" && (
                <button
                  type="button"
                  onClick={() => onConfirm(item.id)}
                  className="rounded bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700 hover:bg-emerald-100"
                >
                  Confirmer
                </button>
              )}
              {(item.status === "pending" || item.status === "confirmed") && (
                <button
                  type="button"
                  onClick={() => onCancel(item.id)}
                  className="rounded bg-red-50 px-2 py-1 text-[10px] font-semibold text-red-700 hover:bg-red-100"
                >
                  Annuler
                </button>
              )}
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <KayvilaDataGrid
      aria-label="Liste des réservations"
      columns={columns}
      data={rows}
      getRowId={(item) => item.id}
      selectionMode="multiple"
      showSelectionCheckboxes
      selectedKeys={selectedKeys}
      onSelectionChange={onSelectionChange}
    />
  );
}
