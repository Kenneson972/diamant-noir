import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const PLATFORM_COMMISSION = 0.25;
const OWNER_SHARE = 1 - PLATFORM_COMMISSION;

serve(async () => {
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return new Response(
      JSON.stringify({ error: "Missing required environment variables" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const currentYear = new Date().getFullYear();

  // Récupérer toutes les villas avec owner
  const { data: villaRows, error: villaErr } = await supabase
    .from("villas")
    .select("id, owner_id")
    .not("owner_id", "is", null);

  if (villaErr) {
    return new Response(JSON.stringify({ error: villaErr.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const byOwner = new Map<string, string[]>();
  for (const row of villaRows ?? []) {
    if (!row.owner_id) continue;
    const arr = byOwner.get(row.owner_id) ?? [];
    arr.push(row.id);
    byOwner.set(row.owner_id, arr);
  }

  if (byOwner.size === 0) {
    return new Response(JSON.stringify({ owners: 0, results: [] }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Une seule query pour toutes les réservations de l'année
  const allVillaIds = [...byOwner.values()].flat();
  const { data: allBookings, error: bookingsErr } = await supabase
    .from("reservations")
    .select("id, villa_id, start_date, end_date, price")
    .in("villa_id", allVillaIds)
    .in("status", ["confirmed", "paid"])
    .gte("start_date", `${currentYear}-01-01`)
    .lte("start_date", `${currentYear}-12-31`);

  if (bookingsErr) {
    return new Response(JSON.stringify({ error: bookingsErr.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Grouper les réservations par owner en mémoire
  const bookingsByOwner = new Map<string, typeof allBookings>();
  for (const [ownerId, villaIds] of byOwner) {
    bookingsByOwner.set(
      ownerId,
      (allBookings ?? []).filter((b) => villaIds.includes(b.villa_id))
    );
  }

  // Construire le batch d'upserts
  const rows = [];
  const results: string[] = [];

  for (const [ownerId, ownerBookings] of bookingsByOwner) {
    const monthly = Array.from({ length: 12 }, (_, m) => {
      const monthBookings = (ownerBookings ?? []).filter((b) => {
        const s = new Date(b.start_date);
        return s.getMonth() === m && s.getFullYear() === currentYear;
      });
      const nights = monthBookings.reduce((acc, b) => {
        const s = new Date(b.start_date);
        const e = b.end_date ? new Date(b.end_date) : s;
        return acc + Math.round((e.getTime() - s.getTime()) / 86400000);
      }, 0);
      const revenue = monthBookings.reduce(
        (acc, b) => acc + (b.price ?? 0) * OWNER_SHARE,
        0
      );
      return { month: m, nights, netRevenue: Math.round(revenue) };
    });

    rows.push({
      owner_id: ownerId,
      year: currentYear,
      villa_id: null,
      seasonal: [],
      monthly,
      threshold_line: [],
      computed_at: new Date().toISOString(),
    });

    const totalNights = monthly.reduce((a, m) => a + m.nights, 0);
    results.push(`${ownerId}: ${totalNights} nuitées`);
  }

  // Batch upsert
  const { error: upsertErr } = await supabase
    .from("owner_stats_snapshots")
    .upsert(rows, { onConflict: "owner_id,year,villa_id" });

  if (upsertErr) {
    return new Response(
      JSON.stringify({ error: upsertErr.message, partial: results }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  return new Response(
    JSON.stringify({ owners: results.length, results }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
});
