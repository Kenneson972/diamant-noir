export default function VillasLoading() {
  return (
    <main className="min-h-dvh bg-offwhite" aria-busy="true" aria-label="Chargement des villas">
      {/* Hero skeleton */}
      <div className="relative h-[30dvh] sm:h-[35dvh] bg-navy/5 animate-pulse" />

      {/* Toolbar skeleton */}
      <div className="mx-auto max-w-7xl px-6 py-6">
        <div className="flex items-center gap-4">
          <div className="h-4 w-24 bg-navy/5 animate-pulse rounded-none" />
          <div className="h-4 w-16 bg-navy/5 animate-pulse rounded-none" />
          <div className="flex-1" />
          <div className="h-8 w-32 bg-navy/5 animate-pulse rounded-none" />
        </div>
      </div>

      {/* Grid skeleton */}
      <div className="mx-auto max-w-7xl px-6 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="aspect-[3/4] w-full bg-navy/5 animate-pulse" />
              <div className="space-y-2 px-1">
                <div className="h-5 w-3/4 bg-navy/5 animate-pulse" />
                <div className="h-4 w-1/2 bg-navy/5 animate-pulse" />
                <div className="h-4 w-1/3 bg-navy/5 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
