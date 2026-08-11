"use client";

import type { ReactNode } from "react";
import { Widget } from "@heroui-pro/react/widget";
import { cn } from "@/lib/utils";

type KayvilaWidgetProps = {
  title: string;
  children: ReactNode;
  className?: string;
  description?: string;
};

export function KayvilaWidget({ title, description, children, className }: KayvilaWidgetProps) {
  return (
    <Widget className={cn("rounded-xl border border-navy/5 bg-white shadow-sm", className)}>
      <Widget.Header>
        <Widget.Title className="font-display text-lg font-semibold text-navy">{title}</Widget.Title>
        {description ? (
          <Widget.Description className="text-sm text-muted">{description}</Widget.Description>
        ) : null}
      </Widget.Header>
      <Widget.Content>{children}</Widget.Content>
    </Widget>
  );
}
