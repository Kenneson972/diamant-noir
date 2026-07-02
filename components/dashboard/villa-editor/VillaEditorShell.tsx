"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function VillaEditorShell({
  sidebar,
  preview,
  children,
  compact,
}: {
  sidebar?: ReactNode;
  preview: ReactNode;
  children: ReactNode;
  compact?: boolean;
}) {
  const [mobileTab, setMobileTab] = useState<"edit" | "preview">("edit");
  const hasPreview = !compact;

  return (
    <div>
      {/* Onglets mobile */}
      <div className="sticky top-16 z-20 mb-4 flex gap-1 bg-offwhite pb-2 lg:hidden" role="tablist" aria-label="Vue éditeur">
        {(["edit", "preview"] as const).map((tab) => (
          <button
            key={tab}
            id={`ve-tab-${tab}`}
            type="button"
            role="tab"
            aria-selected={mobileTab === tab}
            aria-controls={`ve-panel-${tab}`}
            onClick={() => setMobileTab(tab)}
            className={cn(
              "flex-1 rounded-md py-2 text-sm font-semibold transition-colors",
              mobileTab === tab
                ? "bg-navy text-white"
                : "border border-navy/10 bg-white text-navy/55"
            )}
          >
            {tab === "edit" ? "Éditer" : "Aperçu"}
          </button>
        ))}
      </div>

      {/* Layout desktop */}
      <div className={cn("lg:gap-10", hasPreview ? "lg:grid lg:grid-cols-[1fr_380px]" : "")}>
        <div className={cn(sidebar ? "lg:grid lg:grid-cols-[56px_1fr] lg:gap-4" : "")}>
          {sidebar}
          <div
            id="ve-panel-edit"
            role="tabpanel"
            aria-labelledby="ve-tab-edit"
            className={cn(mobileTab !== "edit" && "hidden lg:block")}
          >
            {children}
          </div>
        </div>
        {hasPreview && (
          <div
            id="ve-panel-preview"
            role="tabpanel"
            aria-labelledby="ve-tab-preview"
            className={cn(
              "pt-8 lg:sticky lg:top-24 lg:self-start",
              mobileTab !== "preview" && "hidden lg:block"
            )}
          >
            {preview}
          </div>
        )}
      </div>
    </div>
  );
}
