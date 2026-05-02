import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  href?: string;
  trend?: {
    value: number;
    positive: boolean;
  };
  className?: string;
}

export function KpiCard({
  icon: Icon,
  label,
  value,
  href,
  trend,
  className,
}: KpiCardProps) {
  const content = (
    <div
      className={cn(
        "dashboard-card cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-md",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <span className="dashboard-eyebrow">{label}</span>
          <span className="font-display text-3xl font-bold text-navy-900">
            {value}
          </span>
          {trend && (
            <span
              className={cn(
                "inline-flex items-center gap-1 text-xs font-medium",
                trend.positive ? "text-emerald-600" : "text-red-500"
              )}
            >
              {trend.positive ? "↑" : "↓"} {Math.abs(trend.value)}%
            </span>
          )}
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-navy-900/5">
          <Icon className="h-5 w-5 text-navy-900/60" aria-hidden />
        </div>
      </div>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
