"use client";

import type { ReactNode } from "react";
import { Widget } from "@heroui-pro/react";
import { cn } from "@/lib/utils";

type KayvilaTenantWidgetProps = {
  title: string;
  children: ReactNode;
  className?: string;
  description?: string;
  action?: ReactNode;
};

/** Widget espace client — éditorial Kayvila (angles droits, pas de shadow lourde). */
export function KayvilaTenantWidget({
  title,
  description,
  children,
  className,
  action,
}: KayvilaTenantWidgetProps) {
  return (
    <Widget className={cn("rounded-none border border-navy/8 bg-white shadow-none", className)}>
      <Widget.Header className="flex flex-row items-start justify-between gap-4 border-b border-navy/5 px-6 py-5">
        <div className="min-w-0 space-y-1">
          <Widget.Title className="font-display text-xl font-normal text-navy">{title}</Widget.Title>
          {description ? (
            <Widget.Description className="text-sm text-navy/55">{description}</Widget.Description>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </Widget.Header>
      <Widget.Content className="px-6 py-5">{children}</Widget.Content>
    </Widget>
  );
}
