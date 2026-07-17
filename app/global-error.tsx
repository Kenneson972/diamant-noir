"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="fr">
      <body className="flex min-h-screen items-center justify-center bg-offwhite font-sans">
        <div className="max-w-md px-6 text-center">
          <p className="font-display text-2xl text-navy">Une erreur est survenue</p>
          <p className="mt-2 text-[11px] text-navy/50">
            {error.digest ? `Référence : ${error.digest}` : "Veuillez réessayer ou contacter le support."}
          </p>
          <button type="button"
            onClick={reset}
            className="mt-6 h-11 border border-navy/15 px-8 text-sm text-navy transition-colors hover:bg-navy/5"
          >
            Réessayer
          </button>
        </div>
      </body>
    </html>
  );
}
