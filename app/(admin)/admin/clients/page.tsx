import Link from "next/link";
import { getSupabaseServer } from "@/lib/supabase-server";
import type { Metadata } from "next";
import { User, Search } from "lucide-react";
import { AdminPageIntro } from "@/components/dashboard/admin/AdminPageIntro";

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
  const supabase = await getSupabaseServer();

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

  const { data: profiles } = await profilesQuery;
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

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
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
        <div className="rounded-lg border border-dashed border-gray-300 p-12 text-center">
          <User className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-4 text-sm text-gray-500">
            {search ? `Aucun client trouvé pour « ${search} ».` : "Aucun client inscrit pour le moment."}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-navy/[0.02]">
              <tr>
                <th className="px-4 py-3 font-medium text-navy">Nom</th>
                <th className="px-4 py-3 font-medium text-navy">Email</th>
                <th className="px-4 py-3 font-medium text-navy">Téléphone</th>
                <th className="px-4 py-3 font-medium text-navy">Séjours</th>
                <th className="px-4 py-3 font-medium text-navy">Inscrit le</th>
                <th className="px-4 py-3 font-medium text-navy">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tenants.map((tenant) => (
                <tr key={tenant.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {tenant.full_name ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{tenant.email}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {tenant.phone ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-medium text-navy">{tenant.bookingCount}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {formatDate(tenant.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/admin/clients/${tenant.id}`}
                        className="text-sm text-gold hover:text-gold/80 font-medium"
                      >
                        Fiche 360°
                      </Link>
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
