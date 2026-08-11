"use client";

import type { ReactNode } from "react";
import { ActionBar } from "@heroui-pro/react/action-bar";
import { Button, Chip, Separator } from "@heroui/react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export type KayvilaActionBarAction = {
  label: string;
  onPress: () => void;
  icon?: ReactNode;
  variant?: "default" | "destructive";
};

type KayvilaActionBarProps = {
  selectedCount: number;
  actions: KayvilaActionBarAction[];
  onClear: () => void;
  className?: string;
};

export function KayvilaActionBar({
  selectedCount,
  actions,
  onClear,
  className,
}: KayvilaActionBarProps) {
  return (
    <ActionBar aria-label="Actions groupées" isOpen={selectedCount > 0} className={className}>
      <ActionBar.Prefix>
        <Chip size="sm" className="shrink-0 tabular-nums bg-gold/15 text-navy">
          {selectedCount}
        </Chip>
      </ActionBar.Prefix>
      <Separator />
      <ActionBar.Content>
        {actions.map((action) => (
          <Button
            key={action.label}
            size="sm"
            variant="ghost"
            aria-label={action.label}
            className={cn(
              action.variant === "destructive" && "bg-red-50 text-red-700 hover:bg-red-100"
            )}
            onPress={action.onPress}
          >
            {action.icon}
            <span className="action-bar__label">{action.label}</span>
          </Button>
        ))}
      </ActionBar.Content>
      <Separator />
      <ActionBar.Suffix>
        <Button isIconOnly size="sm" variant="ghost" aria-label="Effacer la sélection" onPress={onClear}>
          <X className="size-4" />
        </Button>
      </ActionBar.Suffix>
    </ActionBar>
  );
}
