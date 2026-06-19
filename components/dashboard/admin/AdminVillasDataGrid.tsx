"use client";

import { useState } from "react";
import Link from "next/link";
import type { DataGridColumn } from "@heroui-pro/react";
import { Calendar } from "lucide-react";
import { KayvilaDataGrid, KayvilaNumberValue } from "@/components/ui/pro";
import { VillaPastBookingsDrawer } from "@/components/dashboard/VillaPastBookingsDrawer";
import { VillaThumb } from "@/components/dashboard/admin/VillaThumb";
import { cn } from "@/lib/utils";

export type AdminVillaRow = {
  id: string;
  name: string;
  location: string | null;
  price_per_night: number;
  capacity: number | null;
  collection_tier: string | null;
  owner_id: string | null;
  is_published: boolean;
  image_url: string | null;
  image_urls?: string[] | null;
  owner_name: string | null;
  bookingCount: number;
  confirmedRevenue: number;
};

function formatRevenue(amount: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function AdminVillasDataGrid({ rows }: { rows: AdminVillaRow[] }) {
  const [drawerVilla, setDrawerVilla] = useState<{ id: string; name: string } | null>(null);

  const columns: DataGridColumn<AdminVillaRow>[] = [
    {
      id: "image",
      header: "",
      width: 220,
      minWidth: 220,
      cell: (item) => (
        <VillaThumb
          src={item.image_url ?? item.image_urls?.[0]}
          alt={item.name}
          size={180}
        />
      ),
    },
    {
      id: "name",
      header: "Nom",
      accessorKey: "name",
      isRowHeader: true,
      allowsSorting: true,
      pinned: "start",
      cell: (item) => <span className="font-medium text-navy">{item.name}</span>,
    },
    {
      id: "location",
      header: "Localisation",
      accessorKey: "location",
      allowsSorting: true,
      cell: (item) => <span className="text-muted">{item.location ?? "—"}</span>,
    },
    {
      id: "price_per_night",
      header: "Prix",
      accessorKey: "price_per_night",
      allowsSorting: true,
      cell: (item) => (
        <KayvilaNumberValue
          value={item.price_per_night}
          format="currency"
          className="text-navy"
          suffix=" / nuit"
        />
      ),
    },
    {
      id: "capacity",
      header: "Cap.",
      accessorKey: "capacity",
      allowsSorting: true,
      align: "center",
      cell: (item) => (
        <span className="text-muted">
          {item.capacity != null ? `${item.capacity}` : "—"}
        </span>
      ),
    },
    {
      id: "collection_tier",
      header: "Tier",
      accessorKey: "collection_tier",
      width: 70,
      cell: (item) =>
        item.collection_tier ? (
          <span className="text-sm font-medium text-gold">{item.collection_tier}</span>
        ) : (
          <span className="text-muted">—</span>
        ),
    },
    {
      id: "owner_name",
      header: "Proprio",
      cell: (item) =>
        item.owner_name ? (
          <Link
            href={`/admin/membres/${item.owner_id}`}
            className="text-sm font-medium text-gold hover:text-gold/80"
          >
            {item.owner_name}
          </Link>
        ) : (
          <span className="text-muted">—</span>
        ),
    },
    {
      id: "is_published",
      header: "Pub.",
      accessorKey: "is_published",
      allowsSorting: true,
      align: "center",
      width: 70,
      cell: (item) => (
        <span
          className={cn(
            "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
            item.is_published ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"
          )}
        >
          {item.is_published ? "Oui" : "Non"}
        </span>
      ),
    },
    {
      id: "bookingCount",
      header: "Résa",
      accessorKey: "bookingCount",
      allowsSorting: true,
      align: "center",
      width: 60,
      cell: (item) => (
        <button
          type="button"
          onClick={() => setDrawerVilla({ id: item.id, name: item.name })}
          className="text-sm font-medium text-gold underline underline-offset-2 hover:text-gold/70"
        >
          {item.bookingCount}
        </button>
      ),
    },
    {
      id: "confirmedRevenue",
      header: "Revenus",
      accessorKey: "confirmedRevenue",
      allowsSorting: true,
      width: 100,
      cell: (item) => (
        <span className="font-medium text-navy">{formatRevenue(item.confirmedRevenue)}</span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      pinned: "end",
      width: 220,
      cell: (item) => (
        <div className="flex items-center gap-3">
          <Link href={`/admin/villas/${item.id}`} className="text-sm font-medium text-gold hover:text-gold/80">
            Modifier
          </Link>
          <Link
            href={`/admin/reservations?villa=${item.id}&view=calendar`}
            className="inline-flex items-center gap-1 text-sm text-muted hover:text-navy"
            title="Calendrier des disponibilités"
          >
            <Calendar size={14} />
            Calendrier
          </Link>
          <a
            href={`/villas/${item.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted hover:text-navy"
            aria-label={`Voir ${item.name} sur le site`}
          >
            Voir ↗
          </a>
        </div>
      ),
    },
  ];

  return (
    <>
      <KayvilaDataGrid
        aria-label="Catalogue des villas"
        columns={columns}
        data={rows}
        getRowId={(item) => item.id}
        rowHeight={216}
      />
      {drawerVilla ? (
        <VillaPastBookingsDrawer
          villaId={drawerVilla.id}
          villaName={drawerVilla.name}
          open
          onClose={() => setDrawerVilla(null)}
        />
      ) : null}
    </>
  );
}
