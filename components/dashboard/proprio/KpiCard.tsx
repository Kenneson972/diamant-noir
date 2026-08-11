"use client";

import Link from "next/link";
import { KPI } from "@heroui-pro/react/kpi";
import { cn } from "@/lib/utils";
import { DollarSign, Percent, UserCircle } from "lucide-react";
import { toChartData, progressStatus } from "@/lib/dashboard/sparkline";
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
  subtitle?: string;
  chartData?: number[];
  progress?: number;
  className?: string;
  hideChart?: boolean;
}

function KpiIconRenderer({ iconName }: { iconName: KpiIconName }) {
  const pngName = getKpiPngName(iconName);
  if (pngName) {
    return <KayvilaPngIcon name={pngName} size={32} className="aria-hidden" />;
  }
  const lucideClass = "size-8 text-navy/80";
  switch (iconName) {
    case "dollarSign":
      return <DollarSign className={lucideClass} strokeWidth={1.5} aria-hidden />;
    case "percent":
      return <Percent className={lucideClass} strokeWidth={1.5} aria-hidden />;
    case "userCircle":
      return <UserCircle className={lucideClass} strokeWidth={1.5} aria-hidden />;
    default:
      return <DollarSign className={lucideClass} strokeWidth={1.5} aria-hidden />;
  }
}

export function KpiCard({
  icon: iconName,
  label,
  value,
  href,
  trend,
  subtitle,
  chartData,
  progress,
  className,
  hideChart,
}: KpiCardProps) {
  const numericValue =
    typeof value === "number"
      ? value
      : Number.parseFloat(String(value).replace(/[^\d.,-]/g, "").replace(",", "."));

  const showNumericValue =
    Number.isFinite(numericValue) &&
    !String(value).includes("/") &&
    !String(value).includes("%") &&
    !String(value).includes("€");

  const chartPoints =
    chartData && chartData.length >= 2 ? toChartData(chartData) : null;

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
        {showNumericValue ? (
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
        {subtitle ? (
          <p className="text-[11px] font-medium text-muted">{subtitle}</p>
        ) : null}
        {progress != null ? (
          <KPI.Progress
            value={Math.min(Math.max(progress, 0), 100)}
            status={progressStatus(progress)}
          />
        ) : null}
      </KPI.Content>
      {chartPoints && !hideChart ? (
        <KPI.Chart
          color="var(--color-accent)"
          data={chartPoints}
          height={48}
          strokeWidth={1.5}
        />
      ) : null}
    </KPI>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
