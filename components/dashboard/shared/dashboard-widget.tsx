"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Widget } from "@heroui-pro/react/widget";
import { cn } from "@/lib/utils";

type DashboardWidgetProps = {
  title: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
  children: ReactNode;
  className?: string;
};

export function DashboardWidget({
  title,
  description,
  actionHref,
  actionLabel = "Voir tout →",
  children,
  className,
}: DashboardWidgetProps) {
  return (
    <Widget className={cn("rounded-xl border border-navy/5 bg-white shadow-sm", className)}>
      <Widget.Header>
        <Widget.Title className="font-display text-lg font-semibold text-navy">
          {title}
        </Widget.Title>
        {description ? (
          <Widget.Description className="text-sm text-muted">{description}</Widget.Description>
        ) : null}
      </Widget.Header>
      <Widget.Content>{children}</Widget.Content>
      {actionHref ? (
        <Widget.Footer className="justify-end border-t border-navy/[0.06]">
          <Link
            href={actionHref}
            className="text-[11px] font-semibold uppercase tracking-wider text-gold no-underline hover:underline"
          >
            {actionLabel}
          </Link>
        </Widget.Footer>
      ) : null}
    </Widget>
  );
}
