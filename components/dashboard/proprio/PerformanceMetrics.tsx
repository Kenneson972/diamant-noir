import { Percent, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

interface PerformanceMetricsProps {
  occupancyRate: number;
  totalNights: number;
  className?: string;
}

const metrics = [
  {
    icon: Percent,
    label: "Taux d'occupation",
    getValue: (p: PerformanceMetricsProps) => `${p.occupancyRate}%`,
  },
  {
    icon: Moon,
    label: "Nuits réservées",
    getValue: (p: PerformanceMetricsProps) => p.totalNights,
  },
] as const;

export function PerformanceMetrics(props: PerformanceMetricsProps) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {metrics.map((metric) => {
        const Icon = metric.icon;
        return (
          <div
            key={metric.label}
            className="rounded-lg border border-navy/5 bg-white p-5 shadow-sm"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/10">
              <Icon className="h-5 w-5 text-gold" aria-hidden />
            </div>
            <span className="mt-3 block text-sm font-medium text-navy/60">
              {metric.label}
            </span>
            <span className="mt-1 block text-2xl font-bold text-navy">
              {metric.getValue(props)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
