/** Skeleton léger — la nav/footer restent visibles pendant la transition */
export default function Loading() {
  return (
    <div
      className="flex min-h-[40vh] flex-col items-center justify-center gap-4 py-16"
      aria-busy="true"
      aria-label="Chargement en cours"
    >
      <div className="h-0.5 w-16 animate-pulse bg-gold/50" aria-hidden />
      <div className="flex flex-col items-center gap-2">
        <div className="h-3 w-28 animate-pulse rounded-full bg-navy/8" aria-hidden />
        <div className="h-3 w-20 animate-pulse rounded-full bg-navy/5" aria-hidden />
      </div>
    </div>
  );
}
