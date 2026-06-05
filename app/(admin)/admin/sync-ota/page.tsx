import { getSupabaseServer } from "@/lib/supabase-server";
import type { Metadata } from "next";
import { SyncOtaAdminPage } from "@/components/dashboard/admin/SyncOtaAdminPage";
import { AdminPageIntro } from "@/components/dashboard/admin/AdminPageIntro";

export const metadata: Metadata = {
  title: "Sync OTA — Administration Kayvila",
};

export default async function AdminSyncOtaPage() {
  const supabase = await getSupabaseServer();

  const { data: villas } = await supabase
    .from("villas")
    .select("id, name, ota_channels, ical_url, is_published")
    .order("name");

  return (
    <div className="space-y-8">
      <AdminPageIntro
        title="Synchronisation OTA"
        description="Import des disponibilités depuis les calendriers connectés (iCal / canaux)."
      />
      <SyncOtaAdminPage villas={villas ?? []} />
    </div>
  );
}
