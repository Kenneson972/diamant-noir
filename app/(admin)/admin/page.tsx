import { supabaseAdmin } from "@/lib/supabase";
import { BOOKING_VILLA_EMBED } from "@/lib/supabase/embeds";
import type { Metadata } from "next";
import { type KpiItem } from "@/components/dashboard/proprio/KpiRow";
import { AdminPageIntro } from "@/components/dashboard/admin/AdminPageIntro";
import { QuickActions } from "@/components/dashboard/shared/QuickActions";
import { DashboardKpiGroup } from "@/components/dashboard/shared/dashboard-kpi-group";
import { DashboardWidget } from "@/components/dashboard/shared/dashboard-widget";
import { DashboardTimeline } from "@/components/dashboard/shared/dashboard-timeline";
import type { DashboardTimelineItem } from "@/components/dashboard/shared/dashboard-timeline";
import { DashboardAlertList } from "@/components/dashboard/shared/dashboard-alert-list";
import type { DashboardAlert } from "@/components/dashboard/shared/dashboard-alert-list";
import { DashboardOccupancyList } from "@/components/dashboard/shared/dashboard-occupancy-list";
import { buildDailyCounts } from "@/lib/dashboard/sparkline";
import { DashboardStayList, DashboardFavoritesList } from "@/components/dashboard/shared/dashboard-stay-list";

export const metadata: Metadata = {
  title: "Administration — Kayvila",
};

export default async function AdminPage() {
  const today = new Date().toISOString().split("T")[0];
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  const sevenDaysAgoIso = sevenDaysAgo.toISOString().split("T")[0];

  try {
    const supabase = supabaseAdmin();
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
      { data: recentBookingDates },
    ] = await Promise.all([
      supabase.from("villas").select("*", { count: "exact", head: true }),
      supabase.from("bookings").select("*", { count: "exact", head: true }),
      supabase.from("villas").select("owner_id"),
      supabase.from("bookings").select("guest_email"),
      supabase
        .from("requests")
        .select("id, type, status, created_at, bookings(guest_name)")
        .order("created_at", { ascending: false })
        .limit(8),
      supabase
        .from("reviews")
        .select("id, rating, guest_name, created_at, villas(name)")
        .order("created_at", { ascending: false })
        .limit(8),
      supabase
        .from("bookings")
        .select(`id, guest_name, villa_id, start_date, status, created_at, ${BOOKING_VILLA_EMBED}`)
        .order("created_at", { ascending: false })
        .limit(8),
      supabase.from("requests").select("*", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("reviews").select("*", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("wishlist").select("villa_id"),
      supabase.from("requests").select("*", { count: "exact", head: true }),
      supabase.from("requests").select("*", { count: "exact", head: true }).eq("status", "resolved"),
      supabase.from("reviews").select("rating").eq("status", "approved"),
      supabase
        .from("bookings")
        .select(`id, guest_name, ${BOOKING_VILLA_EMBED}, start_date, end_date`)
        .eq("status", "confirmed")
        .eq("start_date", today),
      supabase
        .from("bookings")
        .select(`id, guest_name, ${BOOKING_VILLA_EMBED}, start_date, end_date`)
        .eq("status", "confirmed")
        .eq("end_date", today),
      supabase
        .from("bookings")
        .select("villa_id, start_date, end_date")
        .eq("status", "confirmed")
        .lte("start_date", monthEnd)
        .gte("end_date", monthStart),
      supabase.from("villas").select("id, name"),
      supabase
        .from("bookings")
        .select("created_at")
        .gte("created_at", `${sevenDaysAgoIso}T00:00:00`),
    ]);

    const uniqueOwners = ownerIds
      ? new Set(ownerIds.map((o) => o.owner_id).filter(Boolean)).size
      : 0;

    const uniqueClients = guestEmails
      ? new Set(guestEmails.map((b) => b.guest_email).filter(Boolean)).size
      : 0;

    const avgRating =
      ratings && ratings.length > 0
        ? (ratings.reduce((s, r) => s + (r.rating ?? 0), 0) / ratings.length).toFixed(1)
        : "—";

    const conversionRate =
      totalRequests && totalRequests > 0
        ? Math.round(((resolvedRequests ?? 0) / totalRequests) * 100)
        : 0;

    const occupancyByVilla: Record<string, number> = {};
    for (const v of allVillas ?? []) {
      occupancyByVilla[v.id] = 0;
    }
    for (const b of occupancyBookings ?? []) {
      const bStart = new Date(b.start_date);
      const bEnd = new Date(b.end_date);
      const mStart = new Date(monthStart);
      const mEnd = new Date(monthEnd);
      const overlapStart = new Date(Math.max(bStart.getTime(), mStart.getTime()));
      const overlapEnd = new Date(Math.min(bEnd.getTime(), mEnd.getTime()));
      if (overlapEnd > overlapStart) {
        const nights = Math.round(
          (overlapEnd.getTime() - overlapStart.getTime()) / 86400000
        );
        occupancyByVilla[b.villa_id] = (occupancyByVilla[b.villa_id] ?? 0) + nights;
      }
    }

    const wishFreq: Record<string, number> = {};
    (wishlistCounts ?? []).forEach((w: { villa_id: string }) => {
      wishFreq[w.villa_id] = (wishFreq[w.villa_id] ?? 0) + 1;
    });
    const topVillaIds = Object.entries(wishFreq)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([id]) => id);

    let topVillasData: {
      id: string;
      name: string;
      location: string | null;
      image_url: string | null;
    }[] = [];
    try {
      if (topVillaIds.length > 0) {
        const { data } = await supabase
          .from("villas")
          .select("id, name, location, image_url")
          .in("id", topVillaIds);
        topVillasData =
          (data as {
            id: string;
            name: string;
            location: string | null;
            image_url: string | null;
          }[]) ?? [];
      }
    } catch {
      // non-fatal
    }

    const fmt = (d: string) =>
      new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });

    const bookingSparkline = buildDailyCounts(recentBookingDates ?? []);

    const priorityKpis: KpiItem[] = [
      {
        icon: "calendar",
        label: "Réservations",
        value: bookingCount ?? 0,
        href: "/admin/reservations",
        chartData: bookingSparkline,
      },
      {
        icon: "message",
        label: "Demandes",
        value: pendingRequests ?? 0,
        href: "/admin/messages",
        subtitle: pendingRequests ? `${pendingRequests} en attente` : "Rien en attente",
      },
      {
        icon: "star",
        label: "Avis",
        value: pendingReviews ?? 0,
        href: "/admin/avis",
        subtitle: pendingReviews ? `${pendingReviews} à modérer` : "Rien en attente",
      },
      {
        icon: "trendingUp",
        label: "Note moyenne",
        value: avgRating !== "—" ? `${avgRating}/5` : avgRating,
      },
    ];

    const secondaryKpis: KpiItem[] = [
      { icon: "villa", label: "Villas", value: villaCount ?? 0, href: "/admin/villas" },
      {
        icon: "users",
        label: "Propriétaires",
        value: uniqueOwners,
        href: "/admin/proprietaires",
      },
      { icon: "userCircle", label: "Clients", value: uniqueClients, href: "/admin/clients" },
      {
        icon: "percent",
        label: "Conversion demandes",
        value: `${conversionRate}%`,
      },
    ];

    const adminAlerts: DashboardAlert[] = [
      ...((pendingRequests ?? 0) > 0
        ? [
            {
              href: "/admin/messages",
              label: `${pendingRequests} demande${pendingRequests! > 1 ? "s" : ""} en attente`,
              icon: "message" as const,
            },
          ]
        : []),
      ...((pendingReviews ?? 0) > 0
        ? [
            {
              href: "/admin/avis",
              label: `${pendingReviews} avis en attente de modération`,
              icon: "star" as const,
            },
          ]
        : []),
    ];

    type TimelineEntry = { sortAt: string; item: DashboardTimelineItem };

    const timelineEntries: TimelineEntry[] = [
      ...(recentRequests ?? []).map((r) => ({
        sortAt: r.created_at,
        item: {
          id: `req-${r.id}`,
          title: `${(r.bookings as { guest_name?: string } | null)?.guest_name ?? "Voyageur"} — demande ${r.type}`,
          timestamp: fmt(r.created_at),
          icon: "message" as const,
          href: "/admin/messages",
          status: r.status === "pending" ? ("warning" as const) : ("success" as const),
        },
      })),
      ...(recentBookings ?? []).map((b) => ({
        sortAt: b.created_at,
        item: {
          id: `book-${b.id}`,
          title: `${b.guest_name ?? "Voyageur"} — ${(b.villas as { name?: string } | null)?.name ?? "Villa"}`,
          subtitle: `Séjour ${fmt(b.start_date)} · ${b.status}`,
          timestamp: fmt(b.created_at),
          icon: "calendar" as const,
          href: "/admin/reservations",
        },
      })),
      ...(recentReviews ?? []).map((r) => ({
        sortAt: r.created_at,
        item: {
          id: `rev-${r.id}`,
          title: `${r.guest_name ?? "Voyageur"} — ${r.rating}/5`,
          subtitle: (r.villas as { name?: string } | null)?.name ?? "Villa",
          timestamp: fmt(r.created_at),
          icon: "star" as const,
          href: "/admin/avis",
        },
      })),
    ];

    const timelineItems = timelineEntries
      .sort((a, b) => new Date(b.sortAt).getTime() - new Date(a.sortAt).getTime())
      .slice(0, 8)
      .map((entry) => entry.item);

    const occupancyItems = (allVillas ?? []).map((v) => {
      const occupied = occupancyByVilla[v.id] ?? 0;
      return {
        id: v.id,
        name: v.name,
        rate: Math.round((occupied / daysInMonth) * 100),
      };
    });

    const monthLabel = new Date().toLocaleDateString("fr-FR", {
      month: "long",
      year: "numeric",
    });

    return (
      <div className="space-y-8">
        <AdminPageIntro
          title="Tableau de bord"
          description="Vue d'ensemble de l'activité Kayvila : villas, réservations et acteurs."
        />

        <DashboardKpiGroup items={priorityKpis} />
        <DashboardKpiGroup items={secondaryKpis} className="mt-4" />

        <QuickActions
          actions={[
            { label: "Ajouter une villa", href: "/admin/villas/ajouter", icon: "Building2", primary: true },
            { label: "Réservations", href: "/admin/reservations", icon: "CalendarDays" },
            { label: "Messages", href: "/admin/messages", icon: "MessageCircle" },
          ]}
        />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <DashboardWidget title="Arrivées du jour" className="border-emerald/10">
            <DashboardStayList
              kind="check-in"
              emptyLabel="Aucune arrivée aujourd'hui — les check-ins du jour apparaîtront ici."
              items={(checkIns ?? []).map((b) => ({
                id: b.id,
                guestName: b.guest_name ?? "Voyageur",
                villaName: (b.villas as { name?: string } | null)?.name ?? "Villa",
              }))}
            />
          </DashboardWidget>

          <DashboardWidget title="Départs du jour" className="border-amber/10">
            <DashboardStayList
              kind="check-out"
              emptyLabel="Aucun départ aujourd'hui — les check-outs du jour apparaîtront ici."
              items={(checkOuts ?? []).map((b) => ({
                id: b.id,
                guestName: b.guest_name ?? "Voyageur",
                villaName: (b.villas as { name?: string } | null)?.name ?? "Villa",
              }))}
            />
          </DashboardWidget>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <DashboardWidget title="Activité récente" actionHref="/admin/reservations">
              <DashboardTimeline items={timelineItems} />
            </DashboardWidget>
          </div>
          <div className="space-y-6 lg:col-span-4">
            <DashboardAlertList alerts={adminAlerts} />
            {topVillasData.length > 0 ? (
              <DashboardWidget title="Villas les plus aimées" actionHref="/admin/villas">
                <DashboardFavoritesList
                  items={topVillasData.map((v, i) => ({
                    id: v.id,
                    name: v.name,
                    count: wishFreq[v.id] ?? 0,
                    rank: i + 1,
                  }))}
                />
              </DashboardWidget>
            ) : null}
          </div>
        </div>

        {occupancyItems.length > 0 ? (
          <DashboardOccupancyList
            title={`Taux d'occupation — ${monthLabel}`}
            items={occupancyItems}
          />
        ) : null}
      </div>
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erreur inconnue";
    return (
      <div className="space-y-8">
        <AdminPageIntro
          title="Tableau de bord"
          description="Vue d'ensemble de l'activité Kayvila : villas, réservations et acteurs."
        />
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 rounded-xl border border-red-200 bg-red-50 px-6 py-12">
          <p className="text-sm font-semibold text-red-700">Une erreur est survenue</p>
          <p className="max-w-md text-center text-xs text-red-500">{msg}</p>
        </div>
      </div>
    );
  }
}
