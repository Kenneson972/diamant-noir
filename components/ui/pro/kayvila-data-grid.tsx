"use client";

import type { DataGridColumn, DataGridProps } from "@heroui-pro/react/data-grid";
import type { Selection } from "react-aria-components";
import { DataGrid } from "@heroui-pro/react/data-grid";
import { cn } from "@/lib/utils";

type KayvilaDataGridProps<T extends object> = Omit<DataGridProps<T>, "className"> & {
  className?: string;
  selectedKeys?: Selection;
  onSelectionChange?: (keys: Selection) => void;
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
