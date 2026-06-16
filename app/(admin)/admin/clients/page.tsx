import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase";
import type { Metadata } from "next";
import { User, Search } from "lucide-react";
import { AdminPageIntro } from "@/components/dashboard/admin/AdminPageIntro";
import { AdminClientsDataGrid } from "@/components/dashboard/admin/AdminClientsDataGrid";
import { KayvilaEmptyState } from "@/components/ui/pro";

export const metadata: Metadata = {
  title: "Clients — Administration Kayvila",
};

interface TenantRow {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  created_at: string;
  bookingCount: number;
}

async function getTenants(search?: string): Promise<TenantRow[]> {
  const supabase = supabaseAdmin();

  let profilesQuery = supabase
    .from("profiles")
    .select("id, email, full_name, phone, created_at")
    .eq("role", "tenant")
    .order("created_at", { ascending: false });

  if (search && search.trim()) {
    profilesQuery = profilesQuery.or(
      `full_name.ilike.%${search.trim()}%,email.ilike.%${search.trim()}%`
    );
  }

  const { data: profiles } = await profilesQuery.limit(100);
  const tenants = (profiles ?? []) as TenantRow[];

  if (tenants.length === 0) return [];

  // Compter les réservations par client
  const { data: bookingCounts } = await supabase
    .from("bookings")
    .select("guest_email")
    .in("guest_email", tenants.map((t) => t.email));

  const countByEmail: Record<string, number> = {};
  for (const b of bookingCounts ?? []) {
    if (b.guest_email) countByEmail[b.guest_email] = (countByEmail[b.guest_email] ?? 0) + 1;
  }

  return tenants.map((t) => ({
    ...t,
    bookingCount: countByEmail[t.email] ?? 0,
  }));
}

interface PageProps {
  searchParams: Promise<{ search?: string }>;
}

export default async function AdminClientsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const search = params.search ?? "";
  const tenants = await getTenants(search);

  return (
    <div className="space-y-8">
      <AdminPageIntro
        title="Clients"
        description="Profils avec le rôle locataire (espace client)."
      />

      {/* Barre de recherche */}
      <form className="flex gap-2" method="GET">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy/30" />
          <input
            type="text"
            name="search"
            defaultValue={search}
            placeholder="Rechercher par nom ou email..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-navy/10 rounded-lg bg-white focus:outline-none focus:border-gold/50"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 text-[11px] font-semibold bg-navy text-white rounded-lg hover:bg-navy/90"
        >
          Rechercher
        </button>
        {search && (
          <Link
            href="/admin/clients"
            className="px-4 py-2 text-[11px] font-semibold border border-navy/10 text-navy/50 rounded-lg hover:border-navy/30"
          >
            Effacer
          </Link>
        )}
      </form>

      {search && (
        <p className="text-sm text-navy/50">
          {tenants.length} résultat{tenants.length > 1 ? "s" : ""} pour « {search} »
        </p>
      )}

      {tenants.length === 0 ? (
        <KayvilaEmptyState
          icon={<User />}
          title={search ? "Aucun client trouvé" : "Aucun client inscrit"}
          description={
            search
              ? `Aucun résultat pour « ${search} ».`
              : "Les profils locataires apparaîtront ici après inscription."
          }
        />
      ) : (
        <AdminClientsDataGrid rows={tenants} />
      )}
    </div>
  );
}
