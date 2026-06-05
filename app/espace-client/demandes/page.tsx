"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase";
import { PageTopbar } from "@/components/espace-client/PageTopbar";
import { RequestForm } from "@/components/espace-client/RequestForm";
import { RequestList } from "@/components/espace-client/RequestList";

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
        .eq("guest_email", session.user.email)
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
        <PageTopbar title="Demandes" />
        <div className="p-5 md:p-10 text-sm text-navy/55">Chargement...</div>
      </>
    );
  }

  if (!bookingId) {
    return (
      <>
        <PageTopbar title="Demandes" />
        <div className="p-5 md:p-10 text-center">
          <p className="text-sm text-navy/50">Aucun séjour en cours. Les demandes sont disponibles pendant votre séjour.</p>
        </div>
      </>
    );
  }

  return (
    <>
      <PageTopbar title="Demandes" section="Espace Client" />
      <div className="p-5 md:p-10 space-y-10">
        <div>
          <h2 className="font-display text-xl text-navy mb-4">Nouvelle demande</h2>
          <RequestForm bookingId={bookingId} onSuccess={() => setRefreshKey((k) => k + 1)} />
        </div>
        <RequestList bookingId={bookingId} refreshKey={refreshKey} />
      </div>
    </>
  );
}
