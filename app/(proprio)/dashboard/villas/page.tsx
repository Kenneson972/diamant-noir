import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase-server";
import type { Metadata } from "next";
import type { Villa } from "@/types/domain";
import { VillaCard } from "@/components/dashboard/proprio/VillaCard";
import { EmptyDashboard } from "@/components/dashboard/proprio/EmptyDashboard";

export const metadata: Metadata = {
  title: "Mes Villas — Kayvila",
};

export default async function ProprioVillasPage() {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/dashboard");
  }

  const { data: villas } = await supabase
    .from("villas")
    .select("*")
    .eq("owner_id", user.id);

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
        <span className="text-sm text-muted">
          {villas.length} villa{villas.length > 1 ? "s" : ""}
        </span>
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
