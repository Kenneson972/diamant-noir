import { KpiCard } from "./KpiCard";
import type { KpiIconName } from "./kpi-icons";

export type KpiItem = {
  icon: KpiIconName;
  label: string;
  value: string | number;
  href?: string;
  trend?: {
    value: number;
    positive: boolean;
  };
  subtitle?: string;
  chartData?: number[];
  progress?: number;
};

interface KpiRowProps {
  items: KpiItem[];
  cols?: 2 | 3 | 4;
}

export function KpiRow({ items, cols = 3 }: KpiRowProps) {
  const gridClass =
    cols === 2
      ? "grid grid-cols-1 gap-4 sm:grid-cols-2"
      : cols === 4
        ? "grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
        : "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3";
  return (
    <div className={gridClass}>
      {items.map((item, index) => (
        <KpiCard
          key={`${item.label}-${index}`}
          icon={item.icon}
          label={item.label}
          value={item.value}
          href={item.href}
          trend={item.trend}
          subtitle={item.subtitle}
          chartData={item.chartData}
          progress={item.progress}
        />
      ))}
    </div>
  );
}
