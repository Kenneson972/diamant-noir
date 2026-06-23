"use client";

import { Fragment } from "react";
import { KPIGroup } from "@heroui-pro/react";
import { KpiCard } from "@/components/dashboard/proprio/KpiCard";
import type { KpiItem } from "@/components/dashboard/proprio/KpiRow";
import { cn } from "@/lib/utils";

type DashboardKpiGroupProps = {
  items: KpiItem[];
  className?: string;
};

export function DashboardKpiGroup({ items, className }: DashboardKpiGroupProps) {
  if (items.length === 0) return null;

  return (
    <KPIGroup
      className={cn(
        "rounded-xl border border-border-subtle bg-white p-1 shadow-sm",
        className
      )}
    >
      {items.map((item, index) => (
        <Fragment key={`${item.label}-${index}`}>
          {index > 0 ? <KPIGroup.Separator /> : null}
          <KpiCard
            icon={item.icon}
            label={item.label}
            value={item.value}
            href={item.href}
            trend={item.trend}
            subtitle={item.subtitle}
            chartData={item.chartData}
            progress={item.progress}
            className="border-0 shadow-none hover:shadow-none"
          />
        </Fragment>
      ))}
    </KPIGroup>
  );
}
