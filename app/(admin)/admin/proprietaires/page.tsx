import { getSupabaseServer } from "@/lib/supabase-server";
import type { Metadata } from "next";
import { Users } from "lucide-react";
import { AdminPageIntro } from "@/components/dashboard/admin/AdminPageIntro";
import { AdminOwnersDataGrid } from "@/components/dashboard/admin/AdminOwnersDataGrid";
import type { AdminOwnerRow } from "@/components/dashboard/admin/AdminOwnersDataGrid";
import { KayvilaEmptyState } from "@/components/ui/pro";

export const metadata: Metadata = {
  title: "Propriétaires — Administration Kayvila",
};

async function getOwners(): Promise<AdminOwnerRow[]> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from("admin_owner_summary")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch owners:", error);
    return [];
  }

  return (data ?? []) as AdminOwnerRow[];
}

export default async function AdminProprietairesPage() {
  const owners = await getOwners();

  return (
    <div className="space-y-8">
      <AdminPageIntro
        title="Propriétaires"
        description="Gestion des comptes propriétaires, villas, Stripe Connect et revenus."
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
