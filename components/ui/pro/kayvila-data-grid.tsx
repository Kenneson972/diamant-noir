"use client";

import type { DataGridColumn, DataGridProps } from "@heroui-pro/react";
import { DataGrid } from "@heroui-pro/react";
import { cn } from "@/lib/utils";

type KayvilaDataGridProps<T extends object> = Omit<DataGridProps<T>, "className"> & {
  className?: string;
};

export function KayvilaDataGrid<T extends object>({
  className,
  contentClassName,
  scrollContainerClassName,
  ...props
}: KayvilaDataGridProps<T>) {
  return (
    <div className={cn("overflow-hidden rounded-xl border border-border-subtle bg-white", className)}>
      <DataGrid
        {...props}
        variant="secondary"
        contentClassName={cn("min-w-full text-sm", contentClassName)}
        scrollContainerClassName={cn("overflow-x-auto", scrollContainerClassName)}
      />
    </div>
  );
}

export type { DataGridColumn };
