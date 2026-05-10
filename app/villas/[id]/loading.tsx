import { Skeleton } from "@/components/ui/skeleton";

export default function VillaDetailLoading() {
  return (
    <main className="min-h-dvh bg-offwhite pb-24" aria-busy="true" aria-label="Chargement de la villa">
      {/* Hero skeleton */}
      <div className="pt-16 md:pt-20">
        <Skeleton className="h-[55vw] md:h-[60dvh] w-full rounded-none" />
      </div>

      {/* Breadcrumb skeleton */}
      <div className="mx-auto max-w-7xl px-6 pt-10 pb-0">
        <Skeleton className="h-4 w-48 rounded-none mb-6" />
      </div>

      {/* Titre skeleton */}
      <div className="mx-auto max-w-7xl px-6 pb-6">
        <Skeleton className="h-3 w-24 rounded-none mb-2" />
        <Skeleton className="h-12 w-96 rounded-none mb-4" />
        <Skeleton className="h-5 w-64 rounded-none" />
      </div>

      {/* Contenu deux colonnes */}
      <div className="mx-auto max-w-7xl px-6 pb-28 pt-8">
        <div className="grid gap-12 lg:grid-cols-[1fr_380px] items-start">
          {/* Colonne gauche */}
          <div className="space-y-8">
            <Skeleton className="h-32 w-full rounded-none" />
            <Skeleton className="h-64 w-full rounded-none" />
            <Skeleton className="h-48 w-full rounded-none" />
          </div>
          {/* Colonne droite (sidebar) */}
          <div className="space-y-6">
            <Skeleton className="h-72 w-full rounded-none" />
            <Skeleton className="h-40 w-full rounded-none" />
          </div>
        </div>
      </div>
    </main>
  );
}
