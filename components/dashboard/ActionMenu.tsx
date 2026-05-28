"use client";

import * as React from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { MoreVertical, Edit, Trash2, ExternalLink, CheckCircle, XCircle } from "lucide-react";

type ActionMenuItem = {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  variant?: "default" | "danger";
};

type ActionMenuProps = {
  items: ActionMenuItem[];
  trigger?: React.ReactNode;
};

export function ActionMenu({ items, trigger }: ActionMenuProps) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          aria-label="Menu d’actions"
          className="tap-target flex h-11 w-11 items-center justify-center rounded-full outline-none transition-colors hover:bg-navy/5 focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2"
        >
          {trigger || <MoreVertical size={18} className="text-navy/55" aria-hidden />}
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="z-[100] min-w-[160px] overflow-hidden rounded-xl border border-navy/5 bg-white p-1 shadow-xl animate-in fade-in zoom-in-95 duration-100"
          sideOffset={5}
          align="end"
        >
          {items.map((item, index) => (
            <DropdownMenu.Item
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                item.onClick();
              }}
              className={`flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold outline-none transition-colors ${
                item.variant === "danger"
                  ? "text-red-500 hover:bg-red-50"
                  : "text-navy hover:bg-navy/5"
              }`}
            >
              <span className="opacity-60">{item.icon}</span>
              {item.label}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
