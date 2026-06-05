"use client";

import * as React from "react";
import { Dropdown, Label } from "@heroui/react";
import { MoreVertical } from "lucide-react";

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
    <Dropdown>
      <Dropdown.Trigger>
        <button
          type="button"
          aria-label="Menu d’actions"
          className="tap-target flex h-11 w-11 items-center justify-center rounded-full outline-none transition-colors hover:bg-navy/5 focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2"
        >
          {trigger || <MoreVertical size={18} className="text-navy/55" aria-hidden />}
        </button>
      </Dropdown.Trigger>
      <Dropdown.Popover className="min-w-[160px] border border-navy/5 bg-white p-0 shadow-xl">
        <Dropdown.Menu
          onAction={(key) => {
            const idx = Number(key);
            const item = items[idx];
            if (item) item.onClick();
          }}
        >
          {items.map((item, index) => (
            <Dropdown.Item
              key={index}
              id={String(index)}
              textValue={item.label}
              variant={item.variant === "danger" ? "danger" : undefined}
              className={
                item.variant === "danger"
                  ? "text-red-500"
                  : "text-navy"
              }
            >
              <span className="mr-2 opacity-60">{item.icon}</span>
              <Label>{item.label}</Label>
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}
