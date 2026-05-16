import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase";
import type { Metadata } from "next";
import { cn } from "@/lib/utils";
import { Building2, Home, Plus } from "lucide-react";
import { AdminPageIntro } from "@/components/dashboard/admin/AdminPageIntro";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Villas — Administration Kayvila",
};

interface VillaRow {
  id: string;
  name: string;
  location: string | null;
  price_per_night: number;
  capacity: number | null;
  collection_tier: string | null;
  owner_id: string | null;
  is_published: boolean;
  image_url: string | null;
  owner_name: string | null;
  bookingCount: number;
  confirmedRevenue: number;
}

async function getVillas(): Promise<VillaRow[]> {
  const supabase = supabaseAdmin();

  const { data } = await supabase
    .from("villas")
    .select("id, name, location, price_per_night, capacity, collection_tier, owner_id, is_published, image_url")
    .order("created_at", { ascending: false });

  const villas = data ?? [];
  if (villas.length === 0) return [];

  const villaIds = villas.map((v) => v.id);

  const [ownersResult, bookingsResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("role", ["owner", "proprio"]),
    supabase
      .from("bookings")
      .select("villa_id, total_price_cents, status")
      .in("villa_id", villaIds),
  ]);

  const ownersMap: Record<string, string> = {};
  for (const p of ownersResult.data ?? []) {
    ownersMap[p.id] = p.full_name ?? p.email;
  }

  const bookingByVilla: Record<string, any[]> = {};
  for (const b of bookingsResult.data ?? []) {
    if (!bookingByVilla[b.villa_id]) bookingByVilla[b.villa_id] = [];
    bookingByVilla[b.villa_id].push(b);
  }

  return villas.map((v) => {
    const vBookings = bookingByVilla[v.id] ?? [];
    const confirmedRevenue =
      vBookings
        .filter((b) => b.status === "confirmed")
        .reduce((s, b) => s + (b.total_price_cents ?? 0), 0) / 100;
    return {
      ...v,
      owner_name: v.owner_id ? (ownersMap[v.owner_id] ?? null) : null,
      bookingCount: vBookings.length,
      confirmedRevenue,
    };
  });
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
                <th className="px-4 py-3 font-medium text-navy w-12"></th>
                <th className="px-4 py-3 font-medium text-navy">Nom</th>
                <th className="px-4 py-3 font-medium text-navy">Localisation</th>
                <th className="px-4 py-3 font-medium text-navy">Prix / nuit</th>
                <th className="px-4 py-3 font-medium text-navy">Capacité</th>
                <th className="px-4 py-3 font-medium text-navy">Tier</th>
                <th className="px-4 py-3 font-medium text-navy">Propriétaire</th>
                <th className="px-4 py-3 font-medium text-navy">Publiée</th>
                <th className="px-4 py-3 font-medium text-navy">Résa</th>
                <th className="px-4 py-3 font-medium text-navy">Revenus</th>
                <th className="px-4 py-3 font-medium text-navy">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {villas.map((villa) => (
                <tr key={villa.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    {villa.image_url ? (
                      <img
                        src={villa.image_url}
                        alt=""
                        className="h-10 w-10 rounded object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded bg-navy/5">
                        <Building2 className="h-5 w-5 text-navy/20" aria-hidden />
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">{villa.name}</td>
                  <td className="px-4 py-3 text-gray-600">{villa.location ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-900">
                    {villa.price_per_night.toLocaleString("fr-FR")} €
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {villa.capacity != null ? `${villa.capacity} pers.` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {villa.collection_tier ? (
                      <span className="text-sm font-medium text-gold">{villa.collection_tier}</span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {villa.owner_name ? (
                      <Link
                        href={`/admin/membres/${villa.owner_id}`}
                        className="text-sm font-medium text-gold hover:text-gold/80 transition-colors"
                      >
                        {villa.owner_name}
                      </Link>
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
                  <td className="px-4 py-3 text-gray-600">{villa.bookingCount}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {new Intl.NumberFormat("fr-FR", {
                      style: "currency",
                      currency: "EUR",
                      maximumFractionDigits: 0,
                    }).format(villa.confirmedRevenue)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/admin/villas/${villa.id}`}
                        className="text-sm text-gold hover:text-gold/80 font-medium"
                      >
                        Modifier
                      </Link>
                      <a
                        href={`/villas/${villa.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-navy/40 hover:text-navy transition-colors"
                        aria-label={`Voir ${villa.name} sur le site`}
                      >
                        Voir ↗
                      </a>
                    </div>
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
