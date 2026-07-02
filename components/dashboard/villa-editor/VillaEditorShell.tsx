"use client";

import type { ReactNode } from "react";

export function VillaEditorShell({
  summary,
  children,
}: {
  summary: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:items-start lg:gap-8">
      {summary}
      <div className="min-w-0">{children}</div>
    </div>
  );
}
