"use client";

import type { Key } from "react";
import { Segment } from "@heroui-pro/react";
import { cn } from "@/lib/utils";

export type KayvilaSegmentOption<T extends string = string> = {
  id: T;
  label: string;
  icon?: React.ReactNode;
};

type KayvilaSegmentProps<T extends string> = {
  options: KayvilaSegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "ghost";
  "aria-label": string;
};

export function KayvilaSegment<T extends string>({
  options,
  value,
  onChange,
  className,
  size = "sm",
  variant = "ghost",
  "aria-label": ariaLabel,
}: KayvilaSegmentProps<T>) {
  return (
    <Segment
      aria-label={ariaLabel}
      className={cn("rounded-xl border border-navy/10 bg-white p-0.5", className)}
      selectedKey={value}
      size={size}
      variant={variant}
      onSelectionChange={(key: Key) => {
        if (typeof key === "string") onChange(key as T);
      }}
    >
      {options.map((option) => (
        <Segment.Item key={option.id} id={option.id}>
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap px-2 text-[11px] font-semibold uppercase tracking-[0.08em]">
            {option.icon}
            {option.label}
          </span>
        </Segment.Item>
      ))}
    </Segment>
  );
}
