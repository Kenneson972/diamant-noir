import Link from "next/link";
import { Plus } from "lucide-react";
import { getCurrentUser, getOwnerVillas } from "@/lib/supabase-server";
import type { Metadata } from "next";
import type { Villa } from "@/types/domain";
import { VillaCard } from "@/components/dashboard/proprio/VillaCard";
import { EmptyDashboard } from "@/components/dashboard/proprio/EmptyDashboard";

export const metadata: Metadata = {
  title: "Mes Villas",
};

export default async function ProprioVillasPage() {
  const {
    data: { user },
  } = await getCurrentUser();

  const { data: villas } = await getOwnerVillas(user!.id);

  if (!villas || villas.length === 0) {
    return (
      <>
        <h1 className="font-display text-2xl font-bold text-navy-900">
          Mes Villas
        </h1>
        <EmptyDashboard />
      </>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-navy-900">
          Mes Villas
        </h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted">
            {villas.length} villa{villas.length > 1 ? "s" : ""}
          </span>
          <Link
            href="/dashboard/villas/nouvelle"
            className="inline-flex items-center gap-1.5 rounded-lg bg-navy px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-navy/90"
          >
            <Plus className="h-4 w-4" aria-hidden />
            Ajouter une villa
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {villas.map((villa: Villa) => (
          <VillaCard
            key={villa.id}
            id={villa.id}
            name={villa.name}
            location={villa.location ?? ""}
            mainPhoto={villa.image_url ?? villa.image_urls?.[0] ?? null}
            capacity={villa.capacity}
            bedrooms={
              (villa.rooms_details as { title: string; description: string }[] | null)?.length ?? 0
            }
            bathrooms={villa.bathrooms_count ?? 0}
            pricePerNight={villa.price_per_night}
          />
        ))}
      </div>
    </div>
  );
}
