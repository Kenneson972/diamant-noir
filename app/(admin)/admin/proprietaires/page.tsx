import { redirect } from "next/navigation";
import Link from "next/link";
import { getSupabaseServer } from "@/lib/supabase-server";
import type { Metadata } from "next";
import { Users } from "lucide-react";

export const metadata: Metadata = {
  title: "Propriétaires — Administration Kayvila",
};

interface OwnerRow {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  created_at: string;
  villa_count: number;
}

async function getOwners(): Promise<OwnerRow[]> {
  const supabase = await getSupabaseServer();

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, email, full_name, phone, created_at")
    .eq("role", "owner")
    .order("created_at", { ascending: false });

  if (!profiles?.length) return [];

  const ownerIds = profiles.map((p: { id: string }) => p.id);

  const { data: villaCounts } = await supabase
    .from("villas")
    .select("owner_id")
    .in("owner_id", ownerIds);

  const countMap: Record<string, number> = {};
  if (villaCounts) {
    for (const v of villaCounts) {
      if (v.owner_id) {
        countMap[v.owner_id] = (countMap[v.owner_id] ?? 0) + 1;
      }
    }
  }

  return profiles.map((p: { id: string; email: string; full_name: string | null; phone: string | null; created_at: string }) => ({
    ...p,
    villa_count: countMap[p.id] ?? 0,
  }));
}

export default async function AdminProprietairesPage() {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirect=/admin/proprietaires");

  const owners = await getOwners();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-navy">Propriétaires</h1>
      </div>

      {owners.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 p-12 text-center">
          <Users className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-4 text-sm text-gray-500">
            Aucun propriétaire inscrit pour le moment.
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
                <th className="px-4 py-3 font-medium text-navy">Villas</th>
                <th className="px-4 py-3 font-medium text-navy">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {owners.map((owner) => (
                <tr key={owner.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {owner.full_name ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{owner.email}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {owner.phone ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center rounded-full bg-navy/[0.06] px-2.5 py-0.5 text-xs font-medium text-navy">
                      {owner.villa_count}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/membres/${owner.id}`}
                      className="text-sm text-[#C9A84C] hover:text-[#B8952E] font-medium"
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
