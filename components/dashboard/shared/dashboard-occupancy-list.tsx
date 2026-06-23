"use client";

import { KPI } from "@heroui-pro/react";
import { progressStatus } from "@/lib/dashboard/sparkline";
import { DashboardWidget } from "./dashboard-widget";

type OccupancyItem = { id: string; name: string; rate: number };

export function DashboardOccupancyList({
  title,
  items,
}: {
  title: string;
  items: OccupancyItem[];
}) {
  if (items.length === 0) return null;

  return (
    <DashboardWidget title={title}>
      <div className="space-y-4">
        {items.map((villa) => (
          <div key={villa.id} className="space-y-1">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-sm text-navy/80">{villa.name}</span>
              <span className="text-sm font-semibold text-navy">{villa.rate}%</span>
            </div>
            <KPI.Progress
              value={Math.min(villa.rate, 100)}
              status={progressStatus(villa.rate)}
            />
          </div>
        ))}
      </div>
    </DashboardWidget>
  );
}
