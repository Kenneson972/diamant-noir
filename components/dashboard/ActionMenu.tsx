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
        <button className="tap-target flex h-11 w-11 items-center justify-center rounded-full hover:bg-navy/5 outline-none transition-colors">
          {trigger || <MoreVertical size={16} className="text-navy/40" />}
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
