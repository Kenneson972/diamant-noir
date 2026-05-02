import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase-server";
import type { Metadata } from "next";
import {
  Building2,
  CalendarDays,
  Users,
  UserCircle,
} from "lucide-react";
import { KpiRow } from "@/components/dashboard/proprio/KpiRow";

export const metadata: Metadata = {
  title: "Administration — Kayvila",
};

export default async function AdminPage() {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/admin");
  }

  const [villasResult, bookingsResult, ownersResult, clientsResult] =
    await Promise.all([
      supabase.from("villas").select("*", { count: "exact", head: true }),
      supabase.from("bookings").select("*", { count: "exact", head: true }),
      supabase.from("villas").select("owner_id", { count: "exact", head: true }),
      supabase.from("bookings").select("guest_email", { count: "exact", head: true }),
    ]);

  // Distinct owners from villas
  const { data: ownerIds } = await supabase
    .from("villas")
    .select("owner_id");

  const uniqueOwners = ownerIds
    ? new Set(ownerIds.map((o) => o.owner_id).filter(Boolean)).size
    : 0;

  // Distinct clients from booking guest emails
  const { data: guestEmails } = await supabase
    .from("bookings")
    .select("guest_email");

  const uniqueClients = guestEmails
    ? new Set(guestEmails.map((b) => b.guest_email).filter(Boolean)).size
    : 0;

  const villaCount = villasResult.count ?? 0;
  const bookingCount = bookingsResult.count ?? 0;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-navy">Administration</h1>

      <KpiRow
        items={[
          {
            icon: Building2,
            label: "Villas",
            value: villaCount,
          },
          {
            icon: CalendarDays,
            label: "Réservations",
            value: bookingCount,
          },
          {
            icon: Users,
            label: "Propriétaires",
            value: uniqueOwners,
          },
          {
            icon: UserCircle,
            label: "Clients",
            value: uniqueClients,
          },
        ]}
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-lg border border-navy/5 bg-white p-6 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold text-navy">
            Activité récente
          </h2>
          <p className="text-sm text-navy/60">
            Aucune activité récente pour le moment.
          </p>
        </div>

        <div className="rounded-lg border border-navy/5 bg-white p-6 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold text-navy">Alertes</h2>
          <p className="text-sm text-navy/60">
            Aucune alerte pour le moment.
          </p>
        </div>
      </div>
    </div>
  );
}
