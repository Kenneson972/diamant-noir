"use client";

import type { ReactNode } from "react";
import { NumberValue } from "@heroui-pro/react";
import { cn } from "@/lib/utils";

type KayvilaNumberValueProps = {
  value: number;
  format?: "currency" | "decimal" | "percent" | "compact";
  /** Si true, `value` est en centimes (utile pour format currency). */
  cents?: boolean;
  currency?: string;
  className?: string;
  suffix?: ReactNode;
  maximumFractionDigits?: number;
};

export function KayvilaNumberValue({
  value,
  format = "decimal",
  cents = false,
  currency = "EUR",
  className,
  suffix,
  maximumFractionDigits,
}: KayvilaNumberValueProps) {
  const displayValue = cents ? value / 100 : value;
  const maxDigits = maximumFractionDigits ?? (format === "currency" ? 0 : format === "percent" ? 1 : 0);

  if (format === "compact") {
    return (
      <NumberValue
        value={displayValue}
        notation="compact"
        maximumFractionDigits={maxDigits}
        className={cn("tabular-nums", className)}
      />
    );
  }

  if (format === "percent") {
    return (
      <NumberValue
        value={displayValue}
        style="percent"
        maximumFractionDigits={maxDigits}
        className={cn("tabular-nums", className)}
      />
    );
  }

  if (format === "currency") {
    return (
      <NumberValue
        value={displayValue}
        style="currency"
        currency={currency}
        maximumFractionDigits={maxDigits}
        className={cn("tabular-nums", className)}
      >
        {suffix ? <NumberValue.Suffix>{suffix}</NumberValue.Suffix> : null}
      </NumberValue>
    );
  }

  return (
    <NumberValue
      value={displayValue}
      style="decimal"
      maximumFractionDigits={maxDigits}
      className={cn("tabular-nums", className)}
    >
      {suffix ? <NumberValue.Suffix>{suffix}</NumberValue.Suffix> : null}
    </NumberValue>
  );
}
