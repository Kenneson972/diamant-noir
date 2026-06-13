import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  const currentYear = new Date().getFullYear();

  // Récupérer tous les propriétaires avec villas actives
  const { data: ownerRows } = await supabase
    .from("villas")
    .select("owner_id, id")
    .not("owner_id", "is", null);

  const byOwner = new Map<string, string[]>();
  for (const row of ownerRows ?? []) {
    if (!row.owner_id) continue;
    const arr = byOwner.get(row.owner_id) ?? [];
    arr.push(row.id);
    byOwner.set(row.owner_id, arr);
  }

  const results: string[] = [];

  for (const [ownerId, villaIds] of byOwner) {
    // Fetch réservations de l'année en cours pour ces villas
    const { data: bookings } = await supabase
      .from("reservations")
      .select("id, villa_id, start_date, end_date, price")
      .in("villa_id", villaIds)
      .in("status", ["confirmed", "paid"])
      .gte("start_date", `${currentYear}-01-01`)
      .lte("start_date", `${currentYear}-12-31`);

    // Calcul mensuel (12 mois) — commission default 25%
    const monthly = Array.from({ length: 12 }, (_, m) => {
      const nights = (bookings ?? []).reduce((acc, b) => {
        const s = new Date(b.start_date);
        if (s.getMonth() === m && s.getFullYear() === currentYear) {
          const e = b.end_date ? new Date(b.end_date) : s;
          acc += Math.round(
            (e.getTime() - s.getTime()) / 86400000
          );
        }
        return acc;
      }, 0);
      const revenue = (bookings ?? [])
        .filter((b) => {
          const s = new Date(b.start_date);
          return s.getMonth() === m && s.getFullYear() === currentYear;
        })
        .reduce((acc, b) => acc + (b.price ?? 0) * 0.75, 0);

      return { month: m, nights, netRevenue: Math.round(revenue) };
    });

    const { error: upsertErr } = await supabase
      .from("owner_stats_snapshots")
      .upsert(
        {
          owner_id: ownerId,
          year: currentYear,
          villa_id: null,
          seasonal: [],
          monthly,
          threshold_line: [],
          computed_at: new Date().toISOString(),
        },
        { onConflict: "owner_id,year,villa_id" }
      );

    if (upsertErr) {
      results.push(`${ownerId}: error — ${upsertErr.message}`);
    } else {
      results.push(`${ownerId}: ok (${monthly.reduce((a, m) => a + m.nights, 0)} nuitées)`);
    }
  }

  return new Response(
    JSON.stringify({ owners: results.length, results }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
});
