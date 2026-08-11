"use client";

import Link from "next/link";
import { ListView } from "@heroui-pro/react/list-view";
import { Chip } from "@heroui/react";

export type DashboardStayRow = {
  id: string;
  guestName: string;
  villaName: string;
};

type DashboardStayListProps = {
  items: DashboardStayRow[];
  kind: "check-in" | "check-out";
  emptyLabel: string;
};

export function DashboardStayList({ items, kind, emptyLabel }: DashboardStayListProps) {
  if (items.length === 0) {
    return <p className="text-sm text-muted">{emptyLabel}</p>;
  }

  const chipLabel = kind === "check-in" ? "Arrivée" : "Départ";
  const chipClass =
    kind === "check-in"
      ? "bg-emerald-50 text-emerald-700"
      : "bg-amber-50 text-amber-700";

  return (
    <ListView
      aria-label={kind === "check-in" ? "Arrivées du jour" : "Départs du jour"}
      items={items}
      selectionMode="none"
      variant="secondary"
    >
      {(row) => (
        <ListView.Item id={row.id} textValue={row.guestName}>
          <ListView.ItemContent>
            <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
              <div className="min-w-0">
                <ListView.Title className="text-sm font-medium text-navy">
                  {row.guestName}
                </ListView.Title>
                <ListView.Description className="text-[11px] text-navy/50">
                  {row.villaName}
                </ListView.Description>
              </div>
              <Chip className={chipClass} size="sm" variant="soft">
                {chipLabel}
              </Chip>
            </div>
          </ListView.ItemContent>
        </ListView.Item>
      )}
    </ListView>
  );
}

export type DashboardFavoriteRow = {
  id: string;
  name: string;
  count: number;
  rank: number;
};

export function DashboardFavoritesList({ items }: { items: DashboardFavoriteRow[] }) {
  return (
    <ListView
      aria-label="Villas les plus aimées"
      items={items}
      selectionMode="none"
      variant="secondary"
    >
      {(row) => (
        <ListView.Item id={row.id} textValue={row.name}>
          <ListView.ItemContent>
            <Link
              href={`/admin/villas/${row.id}`}
              className="flex min-w-0 flex-1 items-center gap-3 no-underline"
            >
              <span className="w-5 shrink-0 text-[11px] font-bold text-gold">{row.rank}</span>
              <div className="min-w-0 flex-1">
                <ListView.Title className="truncate text-sm text-navy">{row.name}</ListView.Title>
                <ListView.Description className="text-[11px] text-navy/40">
                  {row.count} favori{row.count > 1 ? "s" : ""}
                </ListView.Description>
              </div>
            </Link>
          </ListView.ItemContent>
        </ListView.Item>
      )}
    </ListView>
  );
}
