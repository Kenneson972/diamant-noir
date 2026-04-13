import type { SupabaseClient } from "@supabase/supabase-js";

export type OwnerPortfolioSummary = {
  total_villas: number;
  published_villas: number;
  total_revenue_paid: number;
  upcoming_bookings_count: number;
  pending_tasks_count: number;
};

export type OwnerTodayItem = {
  kind: "check_in" | "check_out" | "in_stay";
  villa_id: string;
  villa_name: string;
  booking_id: string;
  guest_name: string | null;
  start_date: string;
  end_date: string;
};

export type OwnerAlertRow = {
  id: string;
  severity: string;
  title: string;
  body: string | null;
  villa_id: string | null;
  created_at: string;
  read_at: string | null;
};

export type OwnerContextPack = {
  current_date_iso: string;
  portfolio: OwnerPortfolioSummary;
  today: OwnerTodayItem[];
  alerts: OwnerAlertRow[];
  villas: Array<Record<string, unknown>>;
  bookings: Array<Record<string, unknown>>;
  tasks_open: Array<Record<string, unknown>>;
};

function dateOnly(iso: string): string {
  return iso.length >= 10 ? iso.slice(0, 10) : iso;
}

function classifyToday(
  startDate: string,
  endDate: string,
  day: string
): OwnerTodayItem["kind"] | null {
  const s = dateOnly(startDate);
  const e = dateOnly(endDate);
  if (s === day) return "check_in";
  if (e === day) return "check_out";
  if (s < day && e > day) return "in_stay";
  return null;
}

/**
 * Données déterministes pour le copilot propriétaire — uniquement les lignes liées à owner_id.
 */
export async function buildOwnerContextPack(
  admin: SupabaseClient,
  ownerId: string
): Promise<OwnerContextPack> {
  const current_date_iso = new Date().toISOString();
  const todayStr = current_date_iso.slice(0, 10);

  const { data: villas, error: villasErr } = await admin
    .from("villas")
    .select(
      "id, name, slug, is_published, price_per_night, capacity, image_urls, created_at"
    )
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false });

  if (villasErr) {
    console.error("[owner-context] villas", villasErr);
  }

  const villaList = villas ?? [];
  const villaIds = villaList.map((v) => v.id as string);
  const villaNameById = Object.fromEntries(
    villaList.map((v) => [v.id as string, (v.name as string) || "Villa"])
  );

  const empty: OwnerContextPack = {
    current_date_iso,
    portfolio: {
      total_villas: villaList.length,
      published_villas: villaList.filter((v) => v.is_published).length,
      total_revenue_paid: 0,
      upcoming_bookings_count: 0,
      pending_tasks_count: 0,
    },
    today: [],
    alerts: [],
    villas: villaList as Array<Record<string, unknown>>,
    bookings: [],
    tasks_open: [],
  };

  const alertsRes = await admin
    .from("owner_alerts")
    .select("id, severity, title, body, villa_id, created_at, read_at")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (alertsRes.error) {
    console.warn("[owner-context] owner_alerts", alertsRes.error.message);
  }
  const alertsOnly = alertsRes.error ? [] : alertsRes.data;

  if (villaIds.length === 0) {
    return {
      ...empty,
      alerts: (alertsOnly ?? []) as unknown as OwnerAlertRow[],
    };
  }

  const [bookingsRes, tasksRes] = await Promise.all([
    admin
      .from("bookings")
      .select(
        "id, villa_id, start_date, end_date, status, payment_status, price, guest_name, created_at"
      )
      .in("villa_id", villaIds)
      .order("start_date", { ascending: true }),
    admin
      .from("tasks")
      .select("id, villa_id, content, status, created_at")
      .in("villa_id", villaIds)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  if (bookingsRes.error) console.error("[owner-context] bookings", bookingsRes.error);
  if (tasksRes.error) console.error("[owner-context] tasks", tasksRes.error);

  const bookings = bookingsRes.data ?? [];
  const tasksOpen = tasksRes.data ?? [];

  const paidRevenue = bookings
    .filter((b) => b.payment_status === "paid")
    .reduce((sum, b) => sum + (Number(b.price) || 0), 0);

  const now = new Date();
  const upcoming = bookings.filter(
    (b) => b.start_date && new Date(b.start_date as string) >= now
  );

  const todayItems: OwnerTodayItem[] = [];
  for (const b of bookings) {
    const start = String(b.start_date ?? "");
    const end = String(b.end_date ?? "");
    if (!start || !end) continue;
    const kind = classifyToday(start, end, todayStr);
    if (!kind) continue;
    const vid = b.villa_id as string;
    todayItems.push({
      kind,
      villa_id: vid,
      villa_name: villaNameById[vid] ?? "Villa",
      booking_id: String(b.id),
      guest_name: (b.guest_name as string) || null,
      start_date: start,
      end_date: end,
    });
  }

  todayItems.sort((a, b) => {
    const order: Record<OwnerTodayItem["kind"], number> = {
      check_in: 0,
      in_stay: 1,
      check_out: 2,
    };
    return order[a.kind] - order[b.kind];
  });

  return {
    current_date_iso,
    portfolio: {
      total_villas: villaList.length,
      published_villas: villaList.filter((v) => v.is_published).length,
      total_revenue_paid: paidRevenue,
      upcoming_bookings_count: upcoming.length,
      pending_tasks_count: tasksOpen.length,
    },
    today: todayItems,
    alerts: (alertsOnly ?? []) as unknown as OwnerAlertRow[],
    villas: villaList as Array<Record<string, unknown>>,
    bookings: bookings as Array<Record<string, unknown>>,
    tasks_open: tasksOpen as Array<Record<string, unknown>>,
  };
}

/** Métriques simples pour les vues assistant (StatsView) à partir du pack propriétaire. */
export function ownerContextToStatsPayload(pack: OwnerContextPack) {
  const { portfolio, villas, bookings } = pack;
  const bookedNights = (bookings as { start_date?: string; end_date?: string }[]).reduce(
    (acc, b) => {
      if (!b.start_date || !b.end_date) return acc;
      const s = new Date(b.start_date).getTime();
      const e = new Date(b.end_date).getTime();
      if (e <= s) return acc;
      const nights = Math.ceil((e - s) / (1000 * 60 * 60 * 24));
      return acc + Math.max(0, nights);
    },
    0
  );

  const occupancyRate =
    portfolio.total_villas > 0 && bookedNights > 0
      ? Math.min(
          100,
          Math.round((bookedNights / (portfolio.total_villas * 30)) * 100)
        )
      : 0;

  const revPAR =
    portfolio.total_villas > 0
      ? Math.round(portfolio.total_revenue_paid / portfolio.total_villas / 30)
      : 0;

  const rawVillas = (villas as Record<string, unknown>[]).map((v) => ({
    name: v.name,
    image_url: Array.isArray(v.image_urls) ? v.image_urls[0] : null,
    is_published: v.is_published,
    slug: v.slug,
  }));

  return {
    metrics: {
      totalRevenue: portfolio.total_revenue_paid,
      occupancyRate: String(occupancyRate),
      revPAR: String(revPAR),
      bookedNights,
    },
    insights: {
      underperformingVillas: [] as { name: string; bookings: number }[],
      isHighSeason: false,
    },
    rawVillas,
    portfolio,
    today: pack.today,
    alerts: pack.alerts,
  };
}
