import Link from "next/link";
import { getSupabaseServer } from "@/lib/supabase-server";
import type { Metadata } from "next";
import { User } from "lucide-react";
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
}

async function getTenants(): Promise<TenantRow[]> {
  const supabase = await getSupabaseServer();

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, email, full_name, phone, created_at")
    .eq("role", "tenant")
    .order("created_at", { ascending: false });

  return (profiles ?? []) as TenantRow[];
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function AdminClientsPage() {
  const tenants = await getTenants();

  return (
    <div className="space-y-8">
      <AdminPageIntro
        title="Clients"
        description="Profils avec le rôle locataire (espace client)."
      />

      {tenants.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 p-12 text-center">
          <User className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-4 text-sm text-gray-500">
            Aucun client inscrit pour le moment.
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
                  <td className="px-4 py-3 text-gray-600">
                    {formatDate(tenant.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/membres/${tenant.id}`}
                      className="text-sm text-gold hover:text-gold/80 font-medium"
                    >
                      Voir
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
