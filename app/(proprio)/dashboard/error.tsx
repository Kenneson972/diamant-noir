"use client";

export default function ProprioDashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-lg px-6 py-16 text-center">
      <h2 className="font-display text-xl text-navy">Erreur tableau de bord</h2>
      <p className="mt-2 text-sm text-navy/55">{error.message}</p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded-lg bg-navy px-4 py-2 text-sm text-white"
      >
        Réessayer
      </button>
    </div>
  );
}
