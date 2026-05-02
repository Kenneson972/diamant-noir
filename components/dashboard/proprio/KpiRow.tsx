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
}

export function KpiRow({ items }: KpiRowProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
