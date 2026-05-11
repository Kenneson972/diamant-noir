import { getSupabaseServer } from "@/lib/supabase-server";
import type { Metadata } from "next";
import Link from "next/link";
import { BarChart3, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Statistiques — Kayvila",
};

export default async function ProprioStatistiquesIndexPage() {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: villas } = await supabase
    .from("villas")
    .select("id, name, slug")
    .eq("owner_id", user!.id)
    .order("name");

  if (!villas || villas.length === 0) {
    return (
      <div>
        <div className="mx-auto max-w-5xl px-6 py-10">
          <div className="mb-8">
            <h1 className="font-display text-2xl font-bold text-navy-900">
              Statistiques
            </h1>
            <p className="text-sm text-muted">Analyse détaillée par villa</p>
          </div>
          <div className="dashboard-card flex flex-col items-center py-12 text-center">
            <BarChart3 className="mb-4 h-12 w-12 text-muted" />
            <p className="text-sm text-muted">Aucune villa associée à votre compte.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8">
          <h1 className="font-display text-2xl font-bold text-navy-900">
            Statistiques
          </h1>
          <p className="text-sm text-muted">
            Sélectionnez une villa pour voir ses statistiques détaillées.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {villas.map((villa) => (
            <Link
              key={villa.id}
              href={`/dashboard/statistiques/${villa.id}`}
              className="dashboard-card group flex items-center justify-between transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div>
                <h2 className="font-display text-lg font-semibold text-navy-900">
                  {villa.name}
                </h2>
              </div>
              <ArrowRight className="h-5 w-5 text-muted transition-transform group-hover:translate-x-1" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
