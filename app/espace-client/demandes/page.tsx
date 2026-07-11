"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase";
import { tenantBookingsOrFilter } from "@/lib/booking-tenant";
import { TenantSectionHeader } from "@/components/espace-client/TenantSectionHeader";
import { RequestForm } from "@/components/espace-client/RequestForm";
import { RequestList } from "@/components/espace-client/RequestList";
import { Spinner } from "@/components/espace-client/tenant-ui";
import { KayvilaEmptyState, KayvilaTenantWidget } from "@/components/ui/pro";
import { useLocale } from "@/contexts/LocaleContext";

export default function DemandesPage() {
  const { t } = useLocale();
  const supabase = getSupabaseBrowser();
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.email) { setLoading(false); return; }
      const { data } = await supabase
        .from("bookings")
        .select("id")
        .or(tenantBookingsOrFilter(session.user.id, session.user.email))
        .in("status", ["confirmed", "pending"])
        .gt("end_date", new Date().toISOString())
        .order("start_date", { ascending: true })
        .limit(1);
      if (data?.[0]) setBookingId(data[0].id);
      setLoading(false);
    })();
  }, [supabase]);

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <TenantSectionHeader title={t("client.demandes_title")} />
        <div className="flex justify-center py-20">
          <Spinner size="lg" className="text-gold" />
        </div>
      </div>
    );
  }

  if (!bookingId) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <TenantSectionHeader
          title={t("client.demandes_title")}
          description={t("client.demandes_desc")}
        />
        <KayvilaEmptyState
          title={t("client.demandes_empty_title")}
          description={t("client.demandes_empty_desc")}
          actionLabel={t("client.demandes_empty_action")}
          actionHref="/espace-client"
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <TenantSectionHeader
        title={t("client.demandes_title")}
        description={t("client.demandes_active_desc")}
      />
      <KayvilaTenantWidget title={t("client.demandes_new_request")}>
        <RequestForm bookingId={bookingId} onSuccess={() => setRefreshKey((k) => k + 1)} />
      </KayvilaTenantWidget>
      <KayvilaTenantWidget title={t("client.demandes_history")}>
        <RequestList bookingId={bookingId} refreshKey={refreshKey} showTitle={false} />
      </KayvilaTenantWidget>
    </div>
  );
}
