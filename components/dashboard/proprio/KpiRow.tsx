import type { LucideIcon } from "lucide-react";
import { KpiCard } from "./KpiCard";

interface KpiItem {
  icon: LucideIcon;
  label: string;
  value: string | number;
  href?: string;
  trend?: {
    value: number;
    positive: boolean;
  };
}

interface KpiRowProps {
  items: KpiItem[];
  cols?: 2 | 3;
}

export function KpiRow({ items, cols = 3 }: KpiRowProps) {
  const gridClass =
    cols === 2
      ? "grid grid-cols-1 gap-4 sm:grid-cols-2"
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
        />
      ))}
    </div>
  );
}
