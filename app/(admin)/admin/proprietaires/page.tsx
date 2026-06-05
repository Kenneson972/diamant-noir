import { getSupabaseServer } from "@/lib/supabase-server";
import type { Metadata } from "next";
import { Users } from "lucide-react";
import { AdminPageIntro } from "@/components/dashboard/admin/AdminPageIntro";
import { AdminOwnersDataGrid } from "@/components/dashboard/admin/AdminOwnersDataGrid";
import { KayvilaEmptyState } from "@/components/ui/pro";

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
  const owners = await getOwners();

  return (
    <div className="space-y-8">
      <AdminPageIntro
        title="Propriétaires"
        description="Comptes propriétaires et nombre de villas associées."
      />

      {owners.length === 0 ? (
        <KayvilaEmptyState
          icon={<Users />}
          title="Aucun propriétaire inscrit"
          description="Les comptes propriétaires apparaîtront ici après inscription."
        />
      ) : (
        <AdminOwnersDataGrid rows={owners} />
      )}
    </div>
  );
}
