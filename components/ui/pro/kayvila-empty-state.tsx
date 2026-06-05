"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Button } from "@heroui/react";
import { EmptyState } from "@heroui-pro/react";

type KayvilaEmptyStateProps = {
  icon?: ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
};

export function KayvilaEmptyState({
  icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  className,
}: KayvilaEmptyStateProps) {
  return (
    <div className={className ?? "rounded-xl border border-dashed border-border-subtle bg-white p-8"}>
      <EmptyState size="md">
        <EmptyState.Header>
          {icon ? (
            <EmptyState.Media variant="icon" className="text-navy/30 [&_svg]:size-12">
              {icon}
            </EmptyState.Media>
          ) : null}
          <EmptyState.Title className="font-display text-lg text-navy">{title}</EmptyState.Title>
          {description ? (
            <EmptyState.Description className="text-sm text-muted">{description}</EmptyState.Description>
          ) : null}
        </EmptyState.Header>
        {actionLabel && (actionHref || onAction) ? (
          <EmptyState.Content>
            {actionHref ? (
              <Link
                href={actionHref}
                className="inline-flex h-9 items-center justify-center rounded-lg bg-navy px-4 text-sm font-medium text-white transition-colors hover:bg-navy/90"
              >
                {actionLabel}
              </Link>
            ) : (
              <Button variant="primary" size="sm" className="bg-navy text-white" onPress={onAction}>
                {actionLabel}
              </Button>
            )}
          </EmptyState.Content>
        ) : null}
      </EmptyState>
    </div>
  );
}
