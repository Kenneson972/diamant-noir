"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase";
import { tenantBookingsOrFilter } from "@/lib/booking-tenant";
import { TenantSectionHeader } from "@/components/espace-client/TenantSectionHeader";
import { RequestForm } from "@/components/espace-client/RequestForm";
import { RequestList } from "@/components/espace-client/RequestList";
import { Spinner } from "@/components/espace-client/tenant-ui";
import { KayvilaEmptyState, KayvilaTenantWidget } from "@/components/ui/pro";

export default function DemandesPage() {
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
      <>
        <h1 className="font-display text-2xl font-normal text-navy mb-6">Services &amp; demandes</h1>
        <div className="flex justify-center py-20">
          <Spinner size="lg" className="text-gold" />
        </div>
      </>
    );
  }

  if (!bookingId) {
    return (
      <>
        <h1 className="font-display text-2xl font-normal text-navy mb-6">Services &amp; demandes</h1>
        <div className="mx-auto max-w-2xl space-y-6">
          <TenantSectionHeader
            eyebrow="Demandes"
            title="Services & demandes"
            description="Conciergerie, ménage, transferts et autres besoins pendant votre séjour."
          />
          <KayvilaEmptyState
            title="Aucun séjour actif"
            description="Les demandes sont disponibles pendant votre séjour confirmé."
            actionLabel="Voir mes réservations"
            actionHref="/espace-client"
          />
        </div>
      </>
    );
  }

  return (
    <>
      <h1 className="font-display text-2xl font-normal text-navy mb-6">Services &amp; demandes</h1>
      <div className="mx-auto max-w-2xl space-y-8">
        <TenantSectionHeader
          eyebrow="SERVICES & DEMANDES"
          title="Services & demandes"
          description="Notre équipe traite vos demandes sous 24h en moyenne."
        />
        <KayvilaTenantWidget title="Nouvelle demande">
          <RequestForm bookingId={bookingId} onSuccess={() => setRefreshKey((k) => k + 1)} />
        </KayvilaTenantWidget>
        <KayvilaTenantWidget title="Historique" description="Suivi de vos demandes en cours">
          <RequestList bookingId={bookingId} refreshKey={refreshKey} />
        </KayvilaTenantWidget>
      </div>
    </>
  );
}
