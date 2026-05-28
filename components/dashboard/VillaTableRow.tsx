"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Building2 } from "lucide-react";
import { VillaPastBookingsDrawer } from "@/components/dashboard/VillaPastBookingsDrawer";

interface VillaRow {
  id: string;
  name: string;
  location: string | null;
  price_per_night: number;
  capacity: number | null;
  collection_tier: string | null;
  owner_id: string | null;
  is_published: boolean;
  image_url: string | null;
  owner_name: string | null;
  bookingCount: number;
  confirmedRevenue: number;
}

export function VillaTableRow({ villa }: { villa: VillaRow }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <tr className="hover:bg-gray-50">
        <td className="px-4 py-3">
          {villa.image_url ? (
            <img
              src={villa.image_url}
              alt=""
              className="h-10 w-10 rounded object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded bg-navy/5">
              <Building2 className="h-5 w-5 text-navy/20" aria-hidden />
            </div>
          )}
        </td>
        <td className="px-4 py-3 font-medium text-gray-900">{villa.name}</td>
        <td className="px-4 py-3 text-gray-600">{villa.location ?? "—"}</td>
        <td className="px-4 py-3 text-gray-900">
          {villa.price_per_night.toLocaleString("fr-FR")} €
        </td>
        <td className="px-4 py-3 text-gray-600">
          {villa.capacity != null ? `${villa.capacity} pers.` : "—"}
        </td>
        <td className="px-4 py-3">
          {villa.collection_tier ? (
            <span className="text-sm font-medium text-gold">{villa.collection_tier}</span>
          ) : (
            <span className="text-gray-400">—</span>
          )}
        </td>
        <td className="px-4 py-3">
          {villa.owner_name ? (
            <Link
              href={`/admin/membres/${villa.owner_id}`}
              className="text-sm font-medium text-gold hover:text-gold/80 transition-colors"
            >
              {villa.owner_name}
            </Link>
          ) : (
            <span className="text-gray-400">—</span>
          )}
        </td>
        <td className="px-4 py-3">
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
              villa.is_published
                ? "bg-emerald-50 text-emerald-700"
                : "bg-gray-100 text-gray-500"
            )}
          >
            {villa.is_published ? "Oui" : "Non"}
          </span>
        </td>
        <td className="px-4 py-3">
          <button
            onClick={() => setDrawerOpen(true)}
            className="text-sm font-medium text-gold hover:text-gold/70 transition-colors underline underline-offset-2"
          >
            {villa.bookingCount}
          </button>
        </td>
        <td className="px-4 py-3 font-medium text-gray-900">
          {new Intl.NumberFormat("fr-FR", {
            style: "currency",
            currency: "EUR",
            maximumFractionDigits: 0,
          }).format(villa.confirmedRevenue)}
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-3">
            <Link
              href={`/admin/villas/${villa.id}`}
              className="text-sm text-gold hover:text-gold/80 font-medium"
            >
              Modifier
            </Link>
            <a
              href={`/villas/${villa.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-navy/55 hover:text-navy transition-colors"
              aria-label={`Voir ${villa.name} sur le site`}
            >
              Voir ↗
            </a>
          </div>
        </td>
      </tr>
      <VillaPastBookingsDrawer
        villaId={villa.id}
        villaName={villa.name}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </>
  );
}
