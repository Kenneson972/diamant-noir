"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  villaId: string;
  villaName: string;
  /** `link` pour les listes, `button` pour l'éditeur. */
  variant?: "link" | "button";
  /** Où aller après suppression (l'éditeur doit quitter la page supprimée). */
  redirectTo?: string;
};

export function AdminVillaDeleteButton({
  villaId,
  villaName,
  variant = "link",
  redirectTo,
}: Props) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/dashboard/delete-villa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ villaId }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(payload.error ?? "La suppression a échoué.");
        setPending(false);
        return;
      }
      if (redirectTo) {
        router.push(redirectTo);
      }
      router.refresh();
    } catch {
      setError("La suppression a échoué.");
      setPending(false);
    }
  }

  if (confirming) {
    return (
      <span className="inline-flex flex-wrap items-center gap-2">
        <span className="text-xs text-navy/70">
          Supprimer « {villaName} » définitivement ?
        </span>
        <button
          type="button"
          onClick={handleDelete}
          disabled={pending}
          className="min-h-[32px] rounded-md bg-red-600 px-2.5 text-xs font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-60"
        >
          {pending ? "Suppression…" : "Confirmer"}
        </button>
        <button
          type="button"
          onClick={() => {
            setConfirming(false);
            setError(null);
          }}
          disabled={pending}
          className="min-h-[32px] px-1 text-xs text-navy/60 hover:text-navy"
        >
          Annuler
        </button>
        {error ? <span className="text-xs text-red-600">{error}</span> : null}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      aria-label={`Supprimer ${villaName}`}
      className={
        variant === "button"
          ? "min-h-[44px] rounded-lg border border-red-300 px-4 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
          : "text-sm text-red-600 transition-colors hover:text-red-700"
      }
    >
      Supprimer
    </button>
  );
}
