"use client";

import { Fragment } from "react";
import { KPIGroup } from "@heroui-pro/react/kpi-group";
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
    <>
      {/* Mobile : 2 colonnes, chiffre XXL — la donnée parle par la typographie */}
      <div className={cn("grid grid-cols-2 gap-2 md:hidden", className)}>
        {items.map((item, index) => (
          <KpiCard
            key={`m-${item.label}-${index}`}
            icon={item.icon}
            label={item.label}
            value={item.value}
            href={item.href}
            trend={item.trend}
            subtitle={item.subtitle}
            progress={item.progress}
            hideChart
          />
        ))}
      </div>

      {/* Desktop : KPIGroup HeroUI inchangé (sparklines conservées) */}
      <div className="hidden md:block">
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
      </div>
    </>
  );
}
