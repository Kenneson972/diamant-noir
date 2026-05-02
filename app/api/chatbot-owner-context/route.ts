import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";
import type { Villa } from "@/types/domain";

export async function GET() {
  const supabase = await getSupabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  // Fetch villas
  const { data: villas } = await supabase
    .from("villas")
    .select("*")
    .eq("owner_id", user.id);

  if (!villas || villas.length === 0) {
    return NextResponse.json({
      portfolio: {
        total_villas: 0,
        published_villas: 0,
        total_revenue_paid: 0,
        revenue_current_month: 0,
        revenue_last_month: 0,
        upcoming_bookings_count: 0,
        pending_tasks_count: 0,
      },
      today: [],
      alerts: [],
      tasks_preview: [],
      villas_summary: [],
      current_date_iso: new Date().toISOString(),
    });
  }

  const villaIds = villas.map((v: Villa) => v.id);
  const today = new Date().toISOString().split("T")[0];

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split("T")[0];
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .split("T")[0];

  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    .toISOString()
    .split("T")[0];
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)
    .toISOString()
    .split("T")[0];

  const [
    upcomingBookings,
    currentMonthBookings,
    lastMonthBookings,
    todayEvents,
    pendingTasks,
  ] = await Promise.all([
    supabase
      .from("bookings")
      .select("id")
      .in("villa_id", villaIds)
      .gte("start_date", today)
      .then((r) => r.data ?? []),

    supabase
      .from("bookings")
      .select("total_price_cents")
      .in("villa_id", villaIds)
      .gte("start_date", monthStart)
      .lte("start_date", monthEnd)
      .eq("status", "confirmed")
      .then((r) => r.data ?? []),

    supabase
      .from("bookings")
      .select("total_price_cents")
      .in("villa_id", villaIds)
      .gte("start_date", lastMonthStart)
      .lte("start_date", lastMonthEnd)
      .eq("status", "confirmed")
      .then((r) => r.data ?? []),

    supabase
      .from("bookings")
      .select("start_date, end_date, guest_name, villa_id")
      .in("villa_id", villaIds)
      .or(`start_date.eq.${today},end_date.eq.${today}`)
      .limit(10)
      .then((r) => r.data ?? []),

    supabase
      .from("tasks")
      .select("id, title, villa_id, status")
      .in("villa_id", villaIds)
      .eq("status", "pending")
      .limit(5)
      .then((r) => r.data ?? []),
  ]);

  const revenueCurrentMonth = currentMonthBookings.reduce(
    (sum, b) => sum + (b.total_price_cents ?? 0),
    0
  );
  const revenueLastMonth = lastMonthBookings.reduce(
    (sum, b) => sum + (b.total_price_cents ?? 0),
    0
  );

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

  const alerts = pendingTasks.slice(0, 3).map((t) => ({
    severity: "medium" as const,
    title: t.title,
    body: villas.find((v: Villa) => v.id === t.villa_id)?.name,
  }));

  return NextResponse.json({
    portfolio: {
      total_villas: villas.length,
      published_villas: villas.filter((v: Villa) => v.is_published).length,
      total_revenue_paid: revenueCurrentMonth + revenueLastMonth,
      revenue_current_month: revenueCurrentMonth,
      revenue_last_month: revenueLastMonth,
      upcoming_bookings_count: upcomingBookings.length,
      pending_tasks_count: pendingTasks.length,
    },
    today: todayEventsList,
    alerts,
    tasks_preview: pendingTasks.map((t) => ({
      villa_name: villas.find((v: Villa) => v.id === t.villa_id)?.name ?? "Villa",
      content: t.title,
    })),
    villas_summary: villas.map((v: Villa) => ({
      name: v.name,
      is_published: v.is_published ?? false,
    })),
    current_date_iso: new Date().toISOString(),
  });
}
