"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type AutosaveStatus = "idle" | "saving" | "saved" | "error";

export function AutosaveIndicator({
  status,
  lastSaved,
  onRetry,
}: {
  status: AutosaveStatus;
  lastSaved?: Date | null;
  onRetry: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  if (status === "error") {
    return (
      <button
        type="button"
        onClick={onRetry}
        className="flex min-h-[44px] items-center gap-1.5 text-xs font-medium text-red-600 transition-colors hover:text-red-800"
        data-testid="autosave-indicator"
        data-status="error"
      >
        <span className="size-2 rounded-full bg-red-500" aria-hidden />
        Erreur — réessayer
      </button>
    );
  }

  const label =
    status === "saved" && lastSaved
      ? mounted
        ? `Enregistré à ${new Date(lastSaved).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}` // react-doctor: locale hydration mismatch
        : "Enregistré"
      : status === "saving"
        ? "Enregistrement en cours"
        : "Brouillon";

  return (
    <span
      className="flex items-center gap-1.5"
      title={label}
      data-testid="autosave-indicator"
      data-status={status}
    >
      <span
        className={cn(
          "size-2 rounded-full",
          status === "saved" ? "bg-emerald-500" : status === "saving" ? "animate-pulse bg-gold" : "bg-navy/20"
        )}
        aria-hidden
      />
      <span className="sr-only">{label}</span>
    </span>
  );
}
