import { getSupabaseServer } from "@/lib/supabase-server";
import type { Metadata } from "next";
import { Building2, CalendarDays, Users, UserCircle, AlertTriangle, MessageCircle, Star, Heart } from "lucide-react";
import { KpiRow } from "@/components/dashboard/proprio/KpiRow";
import { AdminPageIntro } from "@/components/dashboard/admin/AdminPageIntro";

export const metadata: Metadata = {
  title: "Administration — Kayvila",
};

export default async function AdminPage() {
  const supabase = await getSupabaseServer();

  const [
    { count: villaCount },
    { count: bookingCount },
    { data: ownerIds },
    { data: guestEmails },
    { data: recentRequests },
    { data: recentReviews },
    { data: recentBookings },
    { count: pendingRequests },
    { count: pendingReviews },
    { data: wishlistCounts },
  ] = await Promise.all([
    supabase.from("villas").select("*", { count: "exact", head: true }),
    supabase.from("bookings").select("*", { count: "exact", head: true }),
    supabase.from("villas").select("owner_id"),
    supabase.from("bookings").select("guest_email"),
    supabase.from("requests").select("id, type, status, created_at, bookings(guest_name)").order("created_at", { ascending: false }).limit(5),
    supabase.from("reviews").select("id, rating, created_at, villas(name), bookings(guest_name)").order("created_at", { ascending: false }).limit(5),
    supabase.from("bookings").select("id, guest_name, villa_id, start_date, status, villas(name)").order("created_at", { ascending: false }).limit(5),
    supabase.from("requests").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("reviews").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("wishlist").select("villa_id"),
  ]);

  const uniqueOwners = ownerIds
    ? new Set(ownerIds.map((o) => o.owner_id).filter(Boolean)).size
    : 0;

  const uniqueClients = guestEmails
    ? new Set(guestEmails.map((b) => b.guest_email).filter(Boolean)).size
    : 0;

  // Villas les plus aimées
  const wishFreq: Record<string, number> = {};
  (wishlistCounts ?? []).forEach((w: any) => {
    wishFreq[w.villa_id] = (wishFreq[w.villa_id] ?? 0) + 1;
  });
  const topVillaIds = Object.entries(wishFreq)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([id]) => id);

  const { data: topVillas } = topVillaIds.length > 0
    ? await supabase.from("villas").select("id, name, location, image_url").in("id", topVillaIds)
    : { data: [] };

  const fmt = (d: string) => new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });

  return (
    <div className="space-y-8">
      <AdminPageIntro
        title="Tableau de bord"
        description="Vue d'ensemble de l'activité Kayvila : villas, réservations et acteurs."
      />

      <KpiRow
        items={[
          { icon: Building2, label: "Villas", value: villaCount ?? 0 },
          { icon: CalendarDays, label: "Réservations", value: bookingCount ?? 0 },
          { icon: Users, label: "Propriétaires", value: uniqueOwners },
          { icon: UserCircle, label: "Clients", value: uniqueClients },
        ]}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Activité récente */}
        <div className="rounded-lg border border-navy/5 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-navy">Activité récente</h2>
          <div className="space-y-3">
            {recentRequests?.map((r: any) => (
              <div key={`req-${r.id}`} className="flex items-center gap-3 text-sm">
                <MessageCircle size={14} className="text-amber-500 shrink-0" />
                <span className="flex-1 text-navy/70">
                  <strong>{r.bookings?.guest_name ?? "Voyageur"}</strong> — demande {r.type}
                </span>
                <span className="text-[11px] text-navy/30">{fmt(r.created_at)}</span>
              </div>
            ))}
            {recentBookings?.map((b: any) => (
              <div key={`book-${b.id}`} className="flex items-center gap-3 text-sm">
                <CalendarDays size={14} className="text-blue-500 shrink-0" />
                <span className="flex-1 text-navy/70">
                  <strong>{b.guest_name ?? "Voyageur"}</strong> — {b.villas?.name ?? "Villa"} ({fmt(b.start_date)})
                </span>
                <span className="text-[11px] text-navy/30">{b.status}</span>
              </div>
            ))}
            {recentReviews?.map((r: any) => (
              <div key={`rev-${r.id}`} className="flex items-center gap-3 text-sm">
                <Star size={14} className="text-gold shrink-0" />
                <span className="flex-1 text-navy/70">
                  <strong>{r.bookings?.guest_name ?? "Voyageur"}</strong> — {r.rating}/5 sur {r.villas?.name ?? "Villa"}
                </span>
                <span className="text-[11px] text-navy/30">{fmt(r.created_at)}</span>
              </div>
            ))}
            {(recentRequests ?? []).length === 0 && (recentBookings ?? []).length === 0 && (recentReviews ?? []).length === 0 && (
              <p className="text-sm text-navy/40">Aucune activité récente.</p>
            )}
          </div>
        </div>

        {/* Alertes + Villas aimées */}
        <div className="space-y-6">
          <div className="rounded-lg border border-navy/5 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-navy">Alertes</h2>
            {(pendingRequests ?? 0) === 0 && (pendingReviews ?? 0) === 0 ? (
              <p className="text-sm text-navy/40">Aucune alerte.</p>
            ) : (
              <div className="space-y-2">
                {(pendingRequests ?? 0) > 0 && (
                  <a href="/admin/demandes" className="flex items-center gap-2 text-sm text-amber-700 no-underline hover:underline">
                    <AlertTriangle size={14} />
                    {pendingRequests} demande{pendingRequests! > 1 ? "s" : ""} en attente
                  </a>
                )}
                {(pendingReviews ?? 0) > 0 && (
                  <a href="/admin/avis" className="flex items-center gap-2 text-sm text-amber-700 no-underline hover:underline">
                    <Star size={14} />
                    {pendingReviews} avis en attente de modération
                  </a>
                )}
              </div>
            )}
          </div>

          {topVillas && topVillas.length > 0 && (
            <div className="rounded-lg border border-navy/5 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-navy">Villas les plus aimées</h2>
              <div className="space-y-2">
                {topVillas.map((v: any, i: number) => (
                  <a key={v.id} href={`/admin/villas/${v.id}`} className="flex items-center gap-3 no-underline hover:bg-navy/[0.02] p-1 rounded">
                    <span className="text-[11px] font-bold text-gold w-5">{i + 1}</span>
                    <Heart size={12} className="text-red-400 shrink-0" />
                    <span className="flex-1 text-sm text-navy truncate">{v.name}</span>
                    <span className="text-[11px] text-navy/30">{wishFreq[v.id]} favori{wishFreq[v.id] > 1 ? "s" : ""}</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
