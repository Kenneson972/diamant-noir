import { getSupabaseServer } from "@/lib/supabase-server";
import type { Metadata } from "next";
import { Building2, CalendarDays, Users, UserCircle, AlertTriangle, MessageCircle, Star, Heart, LogIn, LogOut, Percent, TrendingUp } from "lucide-react";
import { KpiRow } from "@/components/dashboard/proprio/KpiRow";
import { AdminPageIntro } from "@/components/dashboard/admin/AdminPageIntro";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Administration — Kayvila",
};

export default async function AdminPage() {
  const supabase = await getSupabaseServer();
  const today = new Date().toISOString().split("T")[0];
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

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
    { count: totalRequests },
    { count: resolvedRequests },
    { data: ratings },
    { data: checkIns },
    { data: checkOuts },
    { data: occupancyBookings },
    { data: allVillas },
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
    supabase.from("requests").select("*", { count: "exact", head: true }),
    supabase.from("requests").select("*", { count: "exact", head: true }).eq("status", "resolved"),
    supabase.from("reviews").select("rating").eq("status", "approved"),
    supabase.from("bookings").select("id, guest_name, villas(name), start_date, end_date").eq("status", "confirmed").eq("start_date", today),
    supabase.from("bookings").select("id, guest_name, villas(name), start_date, end_date").eq("status", "confirmed").eq("end_date", today),
    supabase.from("bookings").select("villa_id, start_date, end_date").eq("status", "confirmed").lte("start_date", monthEnd).gte("end_date", monthStart),
    supabase.from("villas").select("id, name"),
  ]);

  const uniqueOwners = ownerIds
    ? new Set(ownerIds.map((o) => o.owner_id).filter(Boolean)).size
    : 0;

  const uniqueClients = guestEmails
    ? new Set(guestEmails.map((b) => b.guest_email).filter(Boolean)).size
    : 0;

  // Note moyenne
  const avgRating =
    ratings && ratings.length > 0
      ? (ratings.reduce((s, r) => s + (r.rating ?? 0), 0) / ratings.length).toFixed(1)
      : "—";

  // Taux de conversion demandes → résolues
  const conversionRate =
    totalRequests && totalRequests > 0
      ? Math.round(((resolvedRequests ?? 0) / totalRequests) * 100)
      : 0;

  // Taux d'occupation par villa (mois en cours)
  const villasMap = new Map((allVillas ?? []).map((v) => [v.id, v.name]));
  const occupancyByVilla: Record<string, number> = {};
  for (const v of allVillas ?? []) {
    occupancyByVilla[v.id] = 0;
  }
  for (const b of occupancyBookings ?? []) {
    const bStart = new Date(b.start_date);
    const bEnd = new Date(b.end_date);
    const mStart = new Date(monthStart);
    const mEnd = new Date(monthEnd);
    // Chevauchement : max(bStart, mStart) → min(bEnd, mEnd)
    const overlapStart = new Date(Math.max(bStart.getTime(), mStart.getTime()));
    const overlapEnd = new Date(Math.min(bEnd.getTime(), mEnd.getTime()));
    if (overlapEnd > overlapStart) {
      const nights = Math.round((overlapEnd.getTime() - overlapStart.getTime()) / 86400000);
      occupancyByVilla[b.villa_id] = (occupancyByVilla[b.villa_id] ?? 0) + nights;
    }
  }

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

      {/* KPIs — Rangée 1 */}
      <KpiRow
        items={[
          { icon: Building2, label: "Villas", value: villaCount ?? 0 },
          { icon: CalendarDays, label: "Réservations", value: bookingCount ?? 0 },
          { icon: TrendingUp, label: "Note moyenne", value: avgRating !== "—" ? `${avgRating}/5` : avgRating },
        ]}
      />

      {/* KPIs — Rangée 2 */}
      <KpiRow
        items={[
          { icon: Users, label: "Propriétaires", value: uniqueOwners },
          { icon: UserCircle, label: "Clients", value: uniqueClients },
          {
            icon: Percent,
            label: "Conversion demandes",
            value: `${conversionRate}%`,
          },
        ]}
      />

      {/* Arrivées / Départs du jour */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Check-ins du jour */}
        <div className="rounded-lg border border-emerald/10 bg-white p-6 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-navy">
            <LogIn size={18} className="text-emerald-600" />
            Arrivées du jour
          </h2>
          {(checkIns ?? []).length === 0 ? (
            <p className="text-sm text-navy/55">Aucune arrivée aujourd&apos;hui.</p>
          ) : (
            <div className="space-y-2">
              {checkIns!.map((b: any) => (
                <div key={b.id} className="flex items-center justify-between border-b border-navy/[0.05] pb-2 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-navy">{b.guest_name ?? "Voyageur"}</p>
                    <p className="text-[11px] text-navy/50">{b.villas?.name ?? "Villa"}</p>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                    Arrivée
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Check-outs du jour */}
        <div className="rounded-lg border border-amber/10 bg-white p-6 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-navy">
            <LogOut size={18} className="text-amber-600" />
            Départs du jour
          </h2>
          {(checkOuts ?? []).length === 0 ? (
            <p className="text-sm text-navy/55">Aucun départ aujourd&apos;hui.</p>
          ) : (
            <div className="space-y-2">
              {checkOuts!.map((b: any) => (
                <div key={b.id} className="flex items-center justify-between border-b border-navy/[0.05] pb-2 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-navy">{b.guest_name ?? "Voyageur"}</p>
                    <p className="text-[11px] text-navy/50">{b.villas?.name ?? "Villa"}</p>
                  </div>
                  <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                    Départ
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Taux d'occupation par villa */}
      {allVillas && allVillas.length > 0 && (
        <div className="rounded-lg border border-navy/5 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-navy">
            Taux d&apos;occupation — {new Date().toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
          </h2>
          <div className="space-y-3">
            {allVillas.map((v: any) => {
              const occupied = occupancyByVilla[v.id] ?? 0;
              const rate = Math.round((occupied / daysInMonth) * 100);
              return (
                <div key={v.id} className="flex items-center gap-3">
                  <span className="w-32 text-sm text-navy/70 truncate">{v.name}</span>
                  <div className="flex-1 h-5 bg-navy/[0.06] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(rate, 100)}%`,
                        backgroundColor: rate >= 70 ? "#059669" : rate >= 40 ? "#d97706" : "#dc2626",
                      }}
                    />
                  </div>
                  <span className="w-14 text-right text-sm font-medium text-navy">{rate}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

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
              <p className="text-sm text-navy/55">Aucune activité récente.</p>
            )}
          </div>
        </div>

        {/* Alertes + Villas aimées */}
        <div className="space-y-6">
          <div className="rounded-lg border border-navy/5 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-navy">Alertes</h2>
            {(pendingRequests ?? 0) === 0 && (pendingReviews ?? 0) === 0 ? (
              <p className="text-sm text-navy/55">Aucune alerte.</p>
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
