import type { SupabaseClient } from "@supabase/supabase-js";
import { getBookingPriceCents } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export type OwnerPortfolioSummary = {
  total_villas: number;
  published_villas: number;
  /** CA cumulé toutes périodes (réservations payées) */
  total_revenue_paid: number;
  /** CA du mois civil en cours (basé sur start_date) */
  revenue_current_month: number;
  /** CA du mois civil précédent */
  revenue_last_month: number;
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

// ─── Cache contexte (30 secondes par owner_id) ───────────────────────────────

const _contextCache = new Map<string, { pack: OwnerContextPack; cachedAt: number }>();
const CACHE_TTL_MS = 30_000;

function getCached(ownerId: string): OwnerContextPack | null {
  const entry = _contextCache.get(ownerId);
  if (!entry) return null;
  if (Date.now() - entry.cachedAt > CACHE_TTL_MS) {
    _contextCache.delete(ownerId);
    return null;
  }
  return entry.pack;
}

function setCached(ownerId: string, pack: OwnerContextPack): void {
  _contextCache.set(ownerId, { pack, cachedAt: Date.now() });
}

/** Invalide le cache pour un propriétaire (ex: après une action mutante). */
export function invalidateOwnerContextCache(ownerId: string): void {
  _contextCache.delete(ownerId);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

/** Retourne le premier jour du mois en YYYY-MM-DD */
function monthStart(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-01`;
}

// ─── Builder principal ────────────────────────────────────────────────────────

/**
 * Données déterministes pour le copilot propriétaire — uniquement les lignes liées à owner_id.
 * Ne pas appeler directement depuis la route — utiliser `buildOwnerContextPackCached`.
 */
export async function buildOwnerContextPack(
  admin: SupabaseClient,
  ownerId: string
): Promise<OwnerContextPack> {
  const now = new Date();
  const current_date_iso = now.toISOString();
  const todayStr = current_date_iso.slice(0, 10);

  // Fenêtres mensuelles pour les métriques revenus
  const curYear = now.getFullYear();
  const curMonth = now.getMonth(); // 0-indexed
  const prevMonth = curMonth === 0 ? 11 : curMonth - 1;
  const prevYear = curMonth === 0 ? curYear - 1 : curYear;

  const curMonthStart = monthStart(curYear, curMonth);
  const nextMonthStart = monthStart(curMonth === 11 ? curYear + 1 : curYear, (curMonth + 1) % 12);
  const prevMonthStart = monthStart(prevYear, prevMonth);

  // ── Villas du propriétaire ──
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

  const emptyPortfolio: OwnerPortfolioSummary = {
    total_villas: villaList.length,
    published_villas: villaList.filter((v) => v.is_published).length,
    total_revenue_paid: 0,
    revenue_current_month: 0,
    revenue_last_month: 0,
    upcoming_bookings_count: 0,
    pending_tasks_count: 0,
  };

  const empty: OwnerContextPack = {
    current_date_iso,
    portfolio: emptyPortfolio,
    today: [],
    alerts: [],
    villas: villaList as Array<Record<string, unknown>>,
    bookings: [],
    tasks_open: [],
  };

  // ── Alertes (indépendantes des villas) ──
  const alertsRes = await admin
    .from("owner_alerts")
    .select("id, severity, title, body, villa_id, created_at, read_at")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (alertsRes.error) {
    console.warn("[owner-context] owner_alerts", alertsRes.error.message);
  }
  const alertsOnly = alertsRes.error ? [] : (alertsRes.data ?? []);

  if (villaIds.length === 0) {
    return {
      ...empty,
      alerts: alertsOnly as unknown as OwnerAlertRow[],
    };
  }

  // ── Réservations + tâches en parallèle ──
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

  // ── Métriques revenus ──
  const paidBookings = bookings.filter((b) => b.payment_status === "paid");

  const totalRevenuePaid = paidBookings.reduce(
    (sum, b) => sum + (getBookingPriceCents(b) / 100),
    0
  );

  // Revenus mois en cours — filtre sur start_date dans la fenêtre mensuelle
  const revenueCurrentMonth = paidBookings
    .filter((b) => {
      const d = String(b.start_date ?? "");
      return d >= curMonthStart && d < nextMonthStart;
    })
    .reduce((sum, b) => sum + (getBookingPriceCents(b) / 100), 0);

  // Revenus mois précédent
  const revenueLastMonth = paidBookings
    .filter((b) => {
      const d = String(b.start_date ?? "");
      return d >= prevMonthStart && d < curMonthStart;
    })
    .reduce((sum, b) => sum + (getBookingPriceCents(b) / 100), 0);

  // ── Upcoming (à partir d'aujourd'hui) ──
  const upcoming = bookings.filter(
    (b) => b.start_date && dateOnly(String(b.start_date)) >= todayStr
  );

  // ── Classement du jour ──
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
      total_revenue_paid: totalRevenuePaid,
      revenue_current_month: revenueCurrentMonth,
      revenue_last_month: revenueLastMonth,
      upcoming_bookings_count: upcoming.length,
      pending_tasks_count: tasksOpen.length,
    },
    today: todayItems,
    alerts: alertsOnly as unknown as OwnerAlertRow[],
    villas: villaList as Array<Record<string, unknown>>,
    bookings: bookings as Array<Record<string, unknown>>,
    tasks_open: tasksOpen as Array<Record<string, unknown>>,
  };
}

/**
 * Version avec cache 30s — à utiliser dans la route API.
 * Évite de refaire 3 requêtes Supabase par message dans une même conversation.
 */
export async function buildOwnerContextPackCached(
  admin: SupabaseClient,
  ownerId: string
): Promise<OwnerContextPack> {
  const cached = getCached(ownerId);
  if (cached) return cached;
  const pack = await buildOwnerContextPack(admin, ownerId);
  setCached(ownerId, pack);
  return pack;
}

// ─── Payload stats pour les vues assistant ────────────────────────────────────

/** Métriques calculées sur fenêtre glissante 30 jours pour les vues assistant. */
export function ownerContextToStatsPayload(pack: OwnerContextPack) {
  const { portfolio, villas, bookings } = pack;

  // Fenêtre 30j glissants pour occupancy/RevPAR
  const now = Date.now();
  const windowStart = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const windowEnd = new Date(now).toISOString().slice(0, 10);

  const bookedNights30 = (
    bookings as { start_date?: string; end_date?: string; payment_status?: string }[]
  ).reduce((acc, b) => {
    if (!b.start_date || !b.end_date) return acc;
    const s = b.start_date.slice(0, 10);
    const e = b.end_date.slice(0, 10);
    // Intersection avec la fenêtre [windowStart, windowEnd]
    const clampedStart = s < windowStart ? windowStart : s;
    const clampedEnd = e > windowEnd ? windowEnd : e;
    if (clampedStart >= clampedEnd) return acc;
    const nights = Math.ceil(
      (new Date(clampedEnd).getTime() - new Date(clampedStart).getTime()) /
        (1000 * 60 * 60 * 24)
    );
    return acc + Math.max(0, nights);
  }, 0);

  const totalAvailableNights = portfolio.total_villas * 30;
  const occupancyRate =
    totalAvailableNights > 0
      ? Math.min(100, Math.round((bookedNights30 / totalAvailableNights) * 100))
      : 0;

  // RevPAR sur 30j (revenu mois courant / nb villas / 30)
  const revPAR =
    portfolio.total_villas > 0
      ? Math.round(portfolio.revenue_current_month / portfolio.total_villas / 30)
      : 0;

  const rawVillas = (villas as Record<string, unknown>[]).map((v) => ({
    name: v.name,
    image_url: Array.isArray(v.image_urls) ? v.image_urls[0] : null,
    is_published: v.is_published,
    slug: v.slug,
  }));

  // Évolution mois/mois
  const momChange =
    portfolio.revenue_last_month > 0
      ? Math.round(
          ((portfolio.revenue_current_month - portfolio.revenue_last_month) /
            portfolio.revenue_last_month) *
            100
        )
      : null;

  return {
    metrics: {
      totalRevenue: portfolio.total_revenue_paid,
      revenueCurrentMonth: portfolio.revenue_current_month,
      revenueLastMonth: portfolio.revenue_last_month,
      momChangePercent: momChange,
      occupancyRate: String(occupancyRate),
      revPAR: String(revPAR),
      bookedNights: bookedNights30,
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
