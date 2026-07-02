"use client";

import { Check, Loader2, AlertCircle } from "lucide-react";

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
  const time = lastSaved
    ? new Date(lastSaved).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <div className="flex items-center gap-2" data-testid="autosave-indicator">
      {status === "idle" && <span className="size-2 rounded-full bg-navy/20" />}
      {status === "saving" && <Loader2 className="size-3.5 animate-spin text-navy/40" aria-label="Enregistrement..." />}
      {status === "saved" && <Check className="size-3.5 text-emerald-600" aria-label="Enregistré" />}
      {status === "error" && (
        <button type="button" onClick={onRetry} className="flex items-center gap-1 text-xs text-red-600 hover:text-red-800">
          <AlertCircle className="size-3.5" />
          Erreur — réessayer
        </button>
      )}
      {status === "saved" && time && (
        <span className="text-[11px] text-navy/40">Enregistré à {time}</span>
      )}
      {status === "idle" && <span className="text-[11px] text-navy/40">Brouillon</span>}
    </div>
  );
}
