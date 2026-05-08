import Link from "next/link";
import { getSupabaseServer } from "@/lib/supabase-server";
import type { Metadata } from "next";
import { cn } from "@/lib/utils";
import { Home, Plus } from "lucide-react";
import { AdminPageIntro } from "@/components/dashboard/admin/AdminPageIntro";

export const metadata: Metadata = {
  title: "Villas — Administration Kayvila",
};

async function getVillas() {
  const supabase = await getSupabaseServer();
  const { data } = await supabase
    .from("villas")
    .select("id, name, location, price_per_night, owner_id, is_published")
    .order("created_at", { ascending: false });
  return data ?? [];
}

export default async function AdminVillasPage() {
  const villas = await getVillas();

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-6 border-b border-navy/[0.06] pb-8 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <AdminPageIntro
            title="Villas"
            description="Catalogue complet des propriétés. Modifiez une fiche ou ajoutez une villa."
            showDivider={false}
          />
        </div>
        <Link
          href="/admin/villas/ajouter"
          className="inline-flex shrink-0 items-center gap-2 self-start rounded-xl bg-gold px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-gold/90"
        >
          <Plus className="h-4 w-4" />
          Ajouter une villa
        </Link>
      </div>

      {villas.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 p-12 text-center">
          <Home className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-4 text-sm text-gray-500">
            Aucune villa enregistrée pour le moment.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-navy/[0.02]">
              <tr>
                <th className="px-4 py-3 font-medium text-navy">Nom</th>
                <th className="px-4 py-3 font-medium text-navy">Localisation</th>
                <th className="px-4 py-3 font-medium text-navy">Prix / nuit</th>
                <th className="px-4 py-3 font-medium text-navy">Propriétaire</th>
                <th className="px-4 py-3 font-medium text-navy">Publiée</th>
                <th className="px-4 py-3 font-medium text-navy">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {villas.map((villa) => (
                <tr key={villa.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {villa.name}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {villa.location ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-900">
                    {villa.price_per_night.toLocaleString("fr-FR")} €
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">
                    {villa.owner_id ? (
                      <span title={villa.owner_id}>
                        {villa.owner_id.slice(0, 8)}…
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                        villa.is_published
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-gray-100 text-gray-500"
                      )}
                    >
                      {villa.is_published ? "Oui" : "Non"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/villas/${villa.id}`}
                      className="text-sm text-gold hover:text-gold/80 font-medium"
                    >
                      Modifier
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
