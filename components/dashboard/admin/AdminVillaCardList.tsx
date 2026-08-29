"use client";

import { useState } from "react";
import Link from "next/link";
import { KayvilaPngIcon } from "@/components/icons/KayvilaPngIcon";
import { AdminVillaDeleteButton } from "@/components/dashboard/admin/AdminVillaDeleteButton";
import { VillaThumb } from "@/components/dashboard/admin/VillaThumb";
import { VillaPastBookingsDrawer } from "@/components/dashboard/VillaPastBookingsDrawer";
import type { AdminVillaRow } from "@/components/dashboard/admin/AdminVillasDataGrid";
import { cn } from "@/lib/utils";

const fmtEur = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

export function AdminVillaCardList({ rows }: { rows: AdminVillaRow[] }) {
  const [drawerVilla, setDrawerVilla] = useState<{ id: string; name: string } | null>(null);

  return (
    <>
      <ul className="space-y-3" data-testid="admin-villas-cards">
        {rows.map((villa) => (
          <li key={villa.id} className="border border-navy/8 bg-white">
            <div className="flex gap-3 p-4">
              <VillaThumb
                src={villa.image_url ?? villa.image_urls?.[0]}
                alt={villa.name}
                size={72}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-display-dashboard text-base font-semibold leading-snug text-navy">
                    {villa.name}
                  </p>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium",
                      villa.is_published
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-gray-100 text-gray-500"
                    )}
                  >
                    {villa.is_published ? "Publiée" : "Non publiée"}
                  </span>
                </div>
                <p className="mt-0.5 text-sm text-navy/55">{villa.location ?? "—"}</p>
                <p className="mt-1 text-sm font-medium text-navy">
                  {fmtEur.format(villa.price_per_night)} / nuit
                  {villa.capacity != null ? (
                    <span className="font-normal text-navy/45"> · {villa.capacity} pers.</span>
                  ) : null}
                </p>
                <p className="mt-1 text-[11px] text-navy/45">
                  {villa.owner_name ?? "Sans propriétaire"} · {fmtEur.format(villa.confirmedRevenue)} confirmés
                </p>
              </div>
            </div>
            <div className="grid grid-cols-3 divide-x divide-navy/8 border-t border-navy/8">
              <Link
                href={`/admin/villas/${villa.id}`}
                className="flex min-h-[48px] items-center justify-center text-sm font-semibold text-gold no-underline active:scale-[0.98]"
              >
                Modifier
              </Link>
              <button
                type="button"
                onClick={() => setDrawerVilla({ id: villa.id, name: villa.name })}
                className="flex min-h-[48px] items-center justify-center text-sm text-navy/70 active:scale-[0.98]"
              >
                {villa.bookingCount} résa{villa.bookingCount > 1 ? "s" : ""}
              </button>
              <Link
                href={`/admin/reservations?villa=${villa.id}&view=calendar`}
                className="flex min-h-[48px] items-center justify-center gap-1.5 text-sm text-navy/70 no-underline active:scale-[0.98]"
              >
                <KayvilaPngIcon name="calendar" size={18} alt="" />
                Calendrier
              </Link>
            </div>
            <div className="flex min-h-[48px] items-center justify-center border-t border-navy/8">
              <AdminVillaDeleteButton villaId={villa.id} villaName={villa.name} />
            </div>
          </li>
        ))}
      </ul>
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
