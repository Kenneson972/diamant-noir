export default function BookLoading() {
  return (
    <div className="min-h-dvh bg-offwhite" aria-busy="true" aria-label="Chargement de la réservation">
      <div className="h-48 animate-pulse bg-navy/90 sm:h-56" />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="mb-8 h-32 animate-pulse border border-navy/8 bg-white lg:hidden" />
        <div className="grid gap-12 lg:grid-cols-[1fr_380px]">
          <div className="space-y-8">
            <div className="h-28 animate-pulse border border-navy/8 bg-white" />
            <div className="h-40 animate-pulse border border-navy/8 bg-white" />
            <div className="h-24 animate-pulse border border-navy/8 bg-white" />
          </div>
          <div className="hidden h-72 animate-pulse border border-navy/8 bg-white lg:block" />
        </div>
      </div>
    </div>
  );
}
