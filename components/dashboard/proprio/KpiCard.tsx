"use client";

import Link from "next/link";
import { KPI } from "@heroui-pro/react";
import { cn } from "@/lib/utils";
import { DollarSign, Percent, UserCircle } from "lucide-react";
import { getKpiPngName, type KpiIconName } from "./kpi-icons";
import { KayvilaPngIcon } from "@/components/icons/KayvilaPngIcon";

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

function KpiIconRenderer({ iconName }: { iconName: KpiIconName }) {
  const pngName = getKpiPngName(iconName);
  if (pngName) {
    return <KayvilaPngIcon name={pngName} size={20} className="aria-hidden" />;
  }
  // Lucide fallback for icons without Kayvila PNG equivalent
  const lucideClass = "size-5 text-navy/80";
  switch (iconName) {
    case "dollarSign": return <DollarSign className={lucideClass} strokeWidth={1.5} aria-hidden />;
    case "percent": return <Percent className={lucideClass} strokeWidth={1.5} aria-hidden />;
    case "userCircle": return <UserCircle className={lucideClass} strokeWidth={1.5} aria-hidden />;
    default: return <DollarSign className={lucideClass} strokeWidth={1.5} aria-hidden />;
  }
}

export function KpiCard({
  icon: iconName,
  label,
  value,
  href,
  trend,
  className,
}: KpiCardProps) {
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
          <KpiIconRenderer iconName={iconName} />
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
