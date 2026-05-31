import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase";
import type { Metadata } from "next";
import { Building2, Home, Plus, Search, SlidersHorizontal } from "lucide-react";
import { AdminPageIntro } from "@/components/dashboard/admin/AdminPageIntro";
import { VillaTableRow } from "@/components/dashboard/VillaTableRow";

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

async function getVillas(searchParams: {
  sort?: string;
  tier?: string;
  published?: string;
  search?: string;
}): Promise<VillaRow[]> {
  const supabase = supabaseAdmin();

  let query = supabase
    .from("villas")
    .select("id, name, location, price_per_night, capacity, collection_tier, owner_id, is_published, image_url");

  // Filtre par statut de publication
  if (searchParams.published === "oui") {
    query = query.eq("is_published", true);
  } else if (searchParams.published === "non") {
    query = query.eq("is_published", false);
  }

  // Filtre par collection tier
  if (searchParams.tier && searchParams.tier !== "all") {
    query = query.eq("collection_tier", searchParams.tier);
  }

  // Recherche par nom ou localisation
  if (searchParams.search) {
    query = query.or(`name.ilike.%${searchParams.search}%,location.ilike.%${searchParams.search}%`);
  }

  // Tri
  switch (searchParams.sort) {
    case "price_asc":
      query = query.order("price_per_night", { ascending: true });
      break;
    case "price_desc":
      query = query.order("price_per_night", { ascending: false });
      break;
    case "name_asc":
      query = query.order("name", { ascending: true });
      break;
    case "location":
      query = query.order("location", { ascending: true });
      break;
    case "capacity":
      query = query.order("capacity", { ascending: false });
      break;
    default:
      query = query.order("created_at", { ascending: false });
  }

  const { data } = await query;
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

  type BookingRow = { villa_id: string; total_price_cents: number | null; status: string | null };
  const bookingByVilla: Record<string, BookingRow[]> = {};
  for (const b of (bookingsResult.data ?? []) as BookingRow[]) {
    if (!bookingByVilla[b.villa_id]) bookingByVilla[b.villa_id] = [];
    bookingByVilla[b.villa_id].push(b);
  }

  return villas.map((v) => {
    const vBookings = bookingByVilla[v.id] ?? [];
    const confirmedRevenue =
      vBookings
        .filter((b: BookingRow) => b.status === "confirmed")
        .reduce((s: number, b: BookingRow) => s + (b.total_price_cents ?? 0), 0) / 100;
    return {
      ...v,
      owner_name: v.owner_id ? (ownersMap[v.owner_id] ?? null) : null,
      bookingCount: vBookings.length,
      confirmedRevenue,
    };
  });
}

// Récupérer les tiers disponibles pour les filtres
async function getTiers(): Promise<string[]> {
  const supabase = supabaseAdmin();
  const { data } = await supabase.from("villas").select("collection_tier").not("collection_tier", "is", null);
  const tiers = new Set((data ?? []).map((v) => v.collection_tier).filter(Boolean) as string[]);
  return Array.from(tiers).sort();
}

interface PageProps {
  searchParams: Promise<{
    sort?: string;
    tier?: string;
    published?: string;
    search?: string;
  }>;
}

export default async function AdminVillasPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const [villas, tiers] = await Promise.all([getVillas(params), getTiers()]);

  // Construire les query strings pour les liens de filtre
  const buildQs = (overrides: Record<string, string | undefined>) => {
    const p = { ...params, ...overrides };
    const qs = new URLSearchParams();
    Object.entries(p).forEach(([k, v]) => {
      if (v) qs.set(k, v);
    });
    return qs.toString();
  };

  const filterQs = (k: string, v: string) => {
    const allKeys = ["sort", "tier", "published", "search"];
    const p = Object.fromEntries(allKeys.map((key) => [key, params[key as keyof typeof params] ?? undefined]));
    p[k] = v === p[k] ? undefined : v; // toggle
    const qs = new URLSearchParams();
    Object.entries(p).forEach(([key, val]) => {
      if (val) qs.set(key, val);
    });
    return qs.toString();
  };

  const isActive = (k: string, v: string) => params[k as keyof typeof params] === v;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-6 border-b border-navy/[0.06] pb-8 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <AdminPageIntro
            title="Villas"
            description="Catalogue complet des propriétés. Filtrez, triez et modifiez vos villas."
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

      {/* Barre de filtres et tri */}
      <div className="space-y-4">
        {/* Recherche */}
        <form className="flex gap-2" method="GET">
          {/* Préserver les filtres actuels dans des champs cachés */}
          {params.sort && <input type="hidden" name="sort" value={params.sort} />}
          {params.tier && <input type="hidden" name="tier" value={params.tier} />}
          {params.published && <input type="hidden" name="published" value={params.published} />}
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy/30" />
            <input
              type="text"
              name="search"
              defaultValue={params.search ?? ""}
              placeholder="Rechercher par nom ou localisation..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-navy/10 rounded-lg bg-white focus:outline-none focus:border-gold/50"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 text-[11px] font-semibold bg-navy text-white rounded-lg hover:bg-navy/90"
          >
            Rechercher
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-2">
          <SlidersHorizontal size={14} className="text-navy/30" />

          {/* Filtre statut publié */}
          <span className="text-[10px] uppercase tracking-[0.1em] text-navy/40 ml-1">Statut</span>
          {["", "oui", "non"].map((v) => (
            <Link
              key={v}
              href={`/admin/villas${filterQs("published", v) ? `?${filterQs("published", v)}` : ""}`}
              className={`px-3 py-1.5 text-[11px] font-semibold rounded-full transition-colors ${
                isActive("published", v) || (!params.published && v === "")
                  ? "bg-navy text-white"
                  : "bg-white border border-navy/10 text-navy/50 hover:border-navy/30"
              }`}
            >
              {v === "" ? "Tous" : v === "oui" ? "Publiées" : "Non publiées"}
            </Link>
          ))}

          {/* Filtre tier */}
          {tiers.length > 0 && (
            <>
              <span className="text-[10px] uppercase tracking-[0.1em] text-navy/40 ml-3">Collection</span>
              <Link
                href={`/admin/villas${filterQs("tier", "all") ? `?${filterQs("tier", "all")}` : ""}`}
                className={`px-3 py-1.5 text-[11px] font-semibold rounded-full transition-colors ${
                  !params.tier || params.tier === "all"
                    ? "bg-navy text-white"
                    : "bg-white border border-navy/10 text-navy/50 hover:border-navy/30"
                }`}
              >
                Toutes
              </Link>
              {tiers.map((t) => (
                <Link
                  key={t}
                  href={`/admin/villas?${filterQs("tier", t)}`}
                  className={`px-3 py-1.5 text-[11px] font-semibold rounded-full transition-colors ${
                    params.tier === t
                      ? "bg-navy text-white"
                      : "bg-white border border-navy/10 text-navy/50 hover:border-navy/30"
                  }`}
                >
                  {t}
                </Link>
              ))}
            </>
          )}

          {/* Tri */}
          <span className="text-[10px] uppercase tracking-[0.1em] text-navy/40 ml-3">Trier</span>
          {[
            { k: "", label: "Défaut" },
            { k: "price_asc", label: "Prix ↑" },
            { k: "price_desc", label: "Prix ↓" },
            { k: "name_asc", label: "Nom" },
            { k: "location", label: "Localisation" },
            { k: "capacity", label: "Capacité" },
          ].map(({ k, label }) => (
            <Link
              key={k}
              href={`/admin/villas${filterQs("sort", k) ? `?${filterQs("sort", k)}` : ""}`}
              className={`px-3 py-1.5 text-[11px] font-semibold rounded-full transition-colors ${
                isActive("sort", k) || (!params.sort && k === "")
                  ? "bg-gold text-white"
                  : "bg-white border border-navy/10 text-navy/50 hover:border-navy/30"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>

        {params.search && (
          <p className="text-sm text-navy/50">
            {villas.length} résultat{villas.length > 1 ? "s" : ""} pour « {params.search} »
          </p>
        )}
      </div>

      {villas.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 p-12 text-center">
          <Home className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-4 text-sm text-gray-500">
            Aucune villa trouvée{params.search ? ` pour « ${params.search} »` : ""}.
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
                <VillaTableRow key={villa.id} villa={villa} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
