"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function AdminMain({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "";
  const fullBleed = pathname.startsWith("/admin/assistant");

  return (
    <main
      className={cn(
        "flex-1",
        fullBleed
          ? "h-[calc(100dvh-4rem)] overflow-hidden p-0 md:h-[calc(100dvh-4.25rem)]"
          : "px-4 py-6 md:px-8 md:py-8"
      )}
    >
      {children}
    </main>
  );
}
