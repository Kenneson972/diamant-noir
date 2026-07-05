import { getSupabaseServer, getCurrentUser, getOwnerVillas } from "@/lib/supabase-server";
export const dynamic = "force-dynamic";
import type { Villa, BookingStatus } from "@/types/domain";
import { type KpiItem } from "@/components/dashboard/proprio/KpiRow";
import { EmptyDashboard } from "@/components/dashboard/proprio/EmptyDashboard";
import { DashboardPageClient } from "@/components/dashboard/proprio/DashboardPageClient";
import type { DashboardTimelineItem } from "@/components/dashboard/shared/dashboard-timeline";
import type { DashboardAlert } from "@/components/dashboard/shared/dashboard-alert-list";
import { supabaseAdmin } from "@/lib/supabase";
import { calculateTransferAmounts, getConnectAccount } from "@/lib/stripe/connect";
import { getCommissionRate, stayCentsFromBooking } from "@/lib/revenue/booking-revenue";

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

export default async function ProprioDashboardPage(props: {
  searchParams?: Promise<{ connect?: string }>;
}) {
  const searchParams = await props.searchParams;
  const connectParam = searchParams?.connect;

  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await getCurrentUser();

  const [{ data: villas }, { data: ownerProfile }] = await Promise.all([
    getOwnerVillas(user!.id),
    supabaseAdmin()
      .from("profiles")
      .select("stripe_connect_account_id, stripe_connect_onboarding_completed")
      .eq("id", user!.id)
      .maybeSingle(),
  ]);

  let connectDone = false;
  if (
    connectParam === "success" &&
    !ownerProfile?.stripe_connect_onboarding_completed &&
    ownerProfile?.stripe_connect_account_id
  ) {
    try {
      const admin = supabaseAdmin();
      const account = await getConnectAccount(ownerProfile.stripe_connect_account_id);
      const onboarded = account.charges_enabled || account.details_submitted;
      if (onboarded) {
        await admin
          .from("profiles")
          .update({ stripe_connect_onboarding_completed: true })
          .eq("id", user!.id);
        connectDone = true;
      }
    } catch (e) {
      console.error("Server-side Connect verification failed:", e);
    }
  }

  const isStripeConnected =
    ownerProfile?.stripe_connect_onboarding_completed || connectDone;

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
  const daysInMonth = new Date(
    new Date().getFullYear(),
    new Date().getMonth() + 1,
    0
  ).getDate();

  const [
    upcomingBookings,
    pendingTaskCount,
    pendingTasks,
    todayEvents,
    revenueDataRaw,
    occupancyBookings,
  ] = await Promise.all([
    supabase
      .from("bookings")
      .select("id, start_date, end_date, guest_name, status, villa_id")
      .in("villa_id", villaIds)
      .gte("start_date", today)
      .order("start_date", { ascending: true })
      .limit(5)
      .then((r) => r.data ?? []),

    supabase
      .from("tasks")
      .select("*", { count: "exact", head: true })
      .in("villa_id", villaIds)
      .eq("status", "pending")
      .then((r) => r.count ?? 0),

    supabase
      .from("tasks")
      .select("id, title, status, villa_id")
      .in("villa_id", villaIds)
      .eq("status", "pending")
      .limit(5)
      .then((r) => r.data ?? []),

    supabase
      .from("bookings")
      .select("id, start_date, end_date, guest_name, status, villa_id")
      .in("villa_id", villaIds)
      .or(`start_date.eq.${today},end_date.eq.${today}`)
      .limit(10)
      .then((r) => r.data ?? []),

    supabase
      .from("bookings")
      .select(
        "start_date, price, cleaning_fee, service_fee, total_price_cents, villa_id, payment_status, source"
      )
      .in("villa_id", villaIds)
      .in("status", ["confirmed", "paid"])
      .then((r) => r.data ?? []),

    supabase
      .from("bookings")
      .select("villa_id, start_date, end_date")
      .in("villa_id", villaIds)
      .eq("status", "confirmed")
      .lte("start_date", monthEnd)
      .gte("end_date", monthStart)
      .then((r) => r.data ?? []),
  ]);

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

  const kindConfig = {
    check_in: {
      label: "ARRIVÉE",
      icon: "login" as const,
      status: "success" as const,
    },
    check_out: {
      label: "DÉPART",
      icon: "logout" as const,
      status: "warning" as const,
    },
    stay: {
      label: "SÉJOUR",
      icon: "calendar" as const,
      status: "current" as const,
    },
  };

  const timelineItems: DashboardTimelineItem[] = todayEventsList.map(
    (event, index) => ({
      id: `${event.kind}-${index}`,
      title: event.guest_name,
      subtitle: `${kindConfig[event.kind].label} — ${event.villa_name}`,
      icon: kindConfig[event.kind].icon,
      status: kindConfig[event.kind].status,
    })
  );

  const taskAlerts: DashboardAlert[] = pendingTasks.map((task) => ({
    href: "/dashboard/taches",
    label: `${task.title}${villaNameById(task.villa_id, villas) ? ` — ${villaNameById(task.villa_id, villas)}` : ""}`,
    icon: "bell",
  }));

  let totalOccupiedNights = 0;
  for (const booking of occupancyBookings) {
    const bStart = new Date(booking.start_date);
    const bEnd = new Date(booking.end_date);
    const mStart = new Date(monthStart);
    const mEnd = new Date(monthEnd);
    const overlapStart = new Date(Math.max(bStart.getTime(), mStart.getTime()));
    const overlapEnd = new Date(Math.min(bEnd.getTime(), mEnd.getTime()));
    if (overlapEnd > overlapStart) {
      totalOccupiedNights += Math.round(
        (overlapEnd.getTime() - overlapStart.getTime()) / 86400000
      );
    }
  }
  const maxNights = villaIds.length * daysInMonth;
  const occupancyRate =
    maxNights > 0 ? Math.round((totalOccupiedNights / maxNights) * 100) : 0;

  const ownerNetCents = (b: {
    price?: number | null;
    cleaning_fee?: number | null;
    service_fee?: number | null;
    total_price_cents?: number | null;
    villa_id?: string | null;
    source?: string | null;
  }) => {
    const stayCents = stayCentsFromBooking({
      price: b.price ?? null,
      cleaning_fee: b.cleaning_fee ?? null,
      service_fee: b.service_fee ?? null,
      total_price_cents: b.total_price_cents ?? null,
    });
    const rate = getCommissionRate(b.source ?? null);
    return calculateTransferAmounts(
      stayCents,
      Math.round(Number(b.cleaning_fee ?? 0) * 100),
      Math.round(Number(b.service_fee ?? 0) * 100),
      rate
    ).ownerAmountCents;
  };

  const paidRevenue = revenueDataRaw.filter(
    (b) => b.payment_status === "paid" || b.payment_status == null
  );

  const revenueThisMonth = paidRevenue
    .filter((b) => {
      const bd = new Date(b.start_date);
      const now = new Date();
      return bd.getMonth() === now.getMonth() && bd.getFullYear() === now.getFullYear();
    })
    .reduce((sum, b) => sum + ownerNetCents(b), 0);

  const revenueLastMonth = paidRevenue
    .filter((b) => {
      const bd = new Date(b.start_date);
      const now = new Date();
      const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return bd.getMonth() === prev.getMonth() && bd.getFullYear() === prev.getFullYear();
    })
    .reduce((sum, b) => sum + ownerNetCents(b), 0);

  const revenueFormatted = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(revenueThisMonth / 100);

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

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
      const total = paidRevenue
        .filter((b) => {
          const bd = new Date(b.start_date);
          return bd.getMonth() === m && bd.getFullYear() === y;
        })
        .reduce((sum, b) => sum + ownerNetCents(b), 0);
      result.push({
        month: monthNames[m] ?? "",
        revenue: Math.round(total / 100),
        isCurrent,
      });
    }
    return result;
  })();

  const completedMonths = monthlyChartData.filter((d) => !d.isCurrent);
  const hasEnoughHistory = completedMonths.length >= 3;

  const kpiItems: KpiItem[] = [
    {
      icon: "dollarSign",
      label: "Revenus du mois",
      value: revenueThisMonth > 0 ? revenueFormatted : "0 €",
      href: "/dashboard/revenus",
      trend:
        revenueLastMonth > 0
          ? {
              value: Math.round(
                ((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100
              ),
              positive: revenueThisMonth >= revenueLastMonth,
            }
          : undefined,
      chartData: monthlyChartData.map((d) => d.revenue),
    },
    {
      icon: "calendar",
      label: "Réservations à venir",
      value: upcomingBookings.length,
      href: "/dashboard/reservations",
      subtitle:
        upcomingBookings.length === 1
          ? "1 séjour"
          : `${upcomingBookings.length} séjours`,
    },
    {
      icon: "tasks",
      label: "Tâches en attente",
      value: pendingTaskCount,
      href: "/dashboard/taches",
      subtitle: pendingTaskCount ? "À traiter" : "Rien en attente",
    },
    {
      icon: "percent",
      label: "Occupation du mois",
      value: `${occupancyRate}%`,
      progress: occupancyRate,
    },
  ];

  return (
    <DashboardPageClient
      villas={villas ?? []}
      user={{ id: user!.id }}
      isStripeConnected={isStripeConnected}
      connectDone={connectDone}
      kpiItems={kpiItems}
      timelineItems={timelineItems}
      taskAlerts={taskAlerts}
      upcomingBookings={upcomingBookings}
      monthlyChartData={monthlyChartData}
      hasEnoughHistory={hasEnoughHistory}
    />
  );
}

function villaNameById(
  villaId: string,
  villas: Villa[]
): string | undefined {
  return villas.find((v) => v.id === villaId)?.name;
}
