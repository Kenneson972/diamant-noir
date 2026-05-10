export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-offwhite">
      {/* Pulsation douce façon shimmer */}
      <div className="flex flex-col items-center gap-3">
        <div className="h-6 w-6 animate-pulse rounded-full bg-navy/10" aria-hidden />
        <div className="h-3 w-32 animate-pulse rounded-full bg-navy/8" aria-hidden />
      </div>

      <span className="sr-only">Chargement en cours…</span>
    </div>
  );
}
