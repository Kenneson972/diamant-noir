import { getSupabaseServer } from "@/lib/supabase-server";
import { CalendarCheck, DollarSign } from "lucide-react";
import type { Villa } from "@/types/domain";
import { KpiRow } from "@/components/dashboard/proprio/KpiRow";
import { EmptyDashboard } from "@/components/dashboard/proprio/EmptyDashboard";
import { TodayTimeline } from "@/components/dashboard/proprio/TodayTimeline";
import { AlertsWidget } from "@/components/dashboard/proprio/AlertsWidget";
import { UpcomingBookings } from "@/components/dashboard/proprio/UpcomingBookings";
import { RevenueChart } from "@/components/dashboard/proprio/RevenueChart";

function getMonthBounds() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split("T")[0];
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .split("T")[0];
  return { start, end };
}

export default async function ProprioDashboardPage() {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch villas owned by the current user
  const { data: villas } = await supabase
    .from("villas")
    .select("*")
    .eq("owner_id", user!.id);

  if (!villas || villas.length === 0) {
    return (
      <>
        <h1 className="font-display text-2xl font-bold text-navy-900">
          Tableau de bord
        </h1>
        <EmptyDashboard />
      </>
    );
  }

  const villaIds = villas.map((v: Villa) => v.id);
  const today = new Date().toISOString().split("T")[0];
  const { start: monthStart, end: monthEnd } = getMonthBounds();

  // Fetch all data in parallel
  const [upcomingBookings, , pendingTasks, todayEvents, revenueDataRaw] =
    await Promise.all([
      // Upcoming bookings
      supabase
        .from("bookings")
        .select("id, start_date, end_date, guest_name, status")
        .in("villa_id", villaIds)
        .gte("start_date", today)
        .order("start_date", { ascending: true })
        .limit(5)
        .then((r) => r.data ?? []),

      // Monthly booking count
      supabase
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .in("villa_id", villaIds)
        .gte("start_date", monthStart)
        .lte("start_date", monthEnd)
        .then((r) => r.count ?? 0),

      // Pending tasks
      supabase
        .from("tasks")
        .select("id, title, status, villa_id")
        .in("villa_id", villaIds)
        .eq("status", "pending")
        .limit(5)
        .then((r) => r.data ?? []),

      // Today events (check-in/check-out)
      supabase
        .from("bookings")
        .select("id, start_date, end_date, guest_name, status, villa_id")
        .in("villa_id", villaIds)
        .or(
          `start_date.eq.${today},end_date.eq.${today}`
        )
        .limit(10)
        .then((r) => r.data ?? []),

      // Revenue data for chart — fetch last 6 months for monthly aggregation
      supabase
        .from("bookings")
        .select("start_date, total_price_cents")
        .in("villa_id", villaIds)
        .eq("status", "confirmed")
        .then((r) => r.data ?? []),
    ]);

  // Build today events
  const todayEventsList = todayEvents.map((b) => {
    const isCheckIn = b.start_date === today;
    const isCheckOut = b.end_date === today;
    const villaName =
      villas.find((v: Villa) => v.id === b.villa_id)?.name ?? "Villa";

    return {
      kind: (isCheckIn ? "check_in" : isCheckOut ? "check_out" : "stay") as
        | "check_in"
        | "check_out"
        | "stay",
      villa_name: villaName,
      guest_name: b.guest_name ?? "Anonyme",
      start_date: b.start_date,
      end_date: b.end_date,
    };
  });

  // Build alerts from pending tasks
  const alerts = pendingTasks.slice(0, 3)
    .map((t) => ({
      severity: "medium" as const,
      title: t.title,
      body: villaNameById(t.villa_id, villas),
    }));

  // Revenue KPI value (current month)
  const revenueThisMonth = revenueDataRaw
    .filter((b) => {
      const bd = new Date(b.start_date);
      const now = new Date();
      return bd.getMonth() === now.getMonth() && bd.getFullYear() === now.getFullYear();
    })
    .reduce((sum, b) => sum + (b.total_price_cents ?? 0), 0);
  const revenueFormatted = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(revenueThisMonth / 100);

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  // Aggregate revenue by month over last 6 months from actual booking data
  const monthlyChartData = (() => {
    const monthNames = [
      "Jan", "Fév", "Mar", "Avr", "Mai", "Juin",
      "Juil", "Aoû", "Sep", "Oct", "Nov", "Déc",
    ];
    const now = new Date();
    const result: { month: string; revenue: number; isCurrent: boolean }[] = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const m = d.getMonth();
      const y = d.getFullYear();
      const isCurrent = m === currentMonth && y === currentYear;
      const total = revenueDataRaw
        .filter((b) => {
          const bd = new Date(b.start_date);
          return (
            bd.getMonth() === m &&
            bd.getFullYear() === y &&
            (b.total_price_cents ?? 0) > 0
          );
        })
        .reduce((sum, b) => sum + (b.total_price_cents ?? 0), 0);
      result.push({
        month: monthNames[m],
        revenue: Math.round(total / 100),
        isCurrent,
      });
    }
    return result;
  })();

  const completedMonths = monthlyChartData.filter((d) => !d.isCurrent);
  const hasEnoughHistory = completedMonths.length >= 3;

  const kpiItems = [
    {
      icon: DollarSign,
      label: "Revenus du mois",
      value: revenueThisMonth > 0 ? revenueFormatted : "Aucun revenu ce mois",
      href: "/dashboard/revenus" as const,
      trend: revenueThisMonth > 0
        ? { value: 12, positive: true }
        : undefined,
    },
    {
      icon: CalendarCheck,
      label: "Réservations à venir",
      value: upcomingBookings.length > 0 ? upcomingBookings.length : "Aucune réservation à venir",
      href: "/dashboard/reservations" as const,
      trend: upcomingBookings.length > 0
        ? { value: upcomingBookings.length, positive: true }
        : undefined,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-navy-900">
          Tableau de bord
        </h1>
        <p className="text-sm text-muted">
          Aperçu de votre activité
        </p>
      </div>

      <KpiRow items={kpiItems} cols={2} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <TodayTimeline events={todayEventsList} />
        <AlertsWidget alerts={alerts} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RevenueChart data={monthlyChartData} hasEnoughHistory={hasEnoughHistory} />
        <UpcomingBookings bookings={upcomingBookings} />
      </div>
    </div>
  );
}

function villaNameById(
  villaId: string,
  villas: Villa[]
): string | undefined {
  return villas.find((v) => v.id === villaId)?.name;
}
