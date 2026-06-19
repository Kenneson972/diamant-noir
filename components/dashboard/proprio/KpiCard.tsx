"use client";

import Link from "next/link";
import { KPI } from "@heroui-pro/react";
import { cn } from "@/lib/utils";
import { resolveKpiIcon, type KpiIconName } from "./kpi-icons";

interface KpiCardProps {
  icon: KpiIconName;
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
  icon: iconName,
  label,
  value,
  href,
  trend,
  className,
}: KpiCardProps) {
  const Icon = resolveKpiIcon(iconName);
  const numericValue =
    typeof value === "number"
      ? value
      : Number.parseFloat(String(value).replace(/[^\d.,-]/g, "").replace(",", "."));

  const content = (
    <KPI
      className={cn(
        "border border-border-subtle bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md",
        href && "cursor-pointer",
        className
      )}
    >
      <KPI.Header>
        <KPI.Icon>
          <Icon className="size-5 text-navy/80" aria-hidden />
        </KPI.Icon>
        <KPI.Title className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted">
          {label}
        </KPI.Title>
      </KPI.Header>
      <KPI.Content>
        {Number.isFinite(numericValue) && !String(value).includes("/") && !String(value).includes("%") ? (
          <KPI.Value
            value={numericValue}
            style="decimal"
            maximumFractionDigits={0}
            className="font-display text-3xl font-bold text-navy"
          />
        ) : (
          <span className="font-display text-3xl font-bold text-navy">{value}</span>
        )}
        {trend ? (
          <KPI.Trend trend={trend.positive ? "up" : "down"}>
            {trend.positive ? "+" : "-"}
            {Math.abs(trend.value)}%
          </KPI.Trend>
        ) : null}
      </KPI.Content>
    </KPI>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
