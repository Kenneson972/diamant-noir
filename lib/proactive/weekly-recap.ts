import type { SupabaseClient } from "@supabase/supabase-js";
import { sendAdminWeeklyRecapEmail } from "@/lib/emails/admin-proactive";

/** Pure : calcule delta CA et flag baisse >30% (strict, base >0). */
export function computeRevenueDelta(
  thisWeekCents: number,
  lastWeekCents: number
): { delta: number; dropOver30: boolean } {
  const delta = thisWeekCents - lastWeekCents;
  const dropOver30 = lastWeekCents > 0 && -delta / lastWeekCents > 0.30;
  return { delta, dropOver30 };
}

function weekRange(weeksAgo: number): { startISO: string; endISO: string } {
  const now = new Date();
  const day = now.getUTCDay(); // 0=dim
  const daysSinceMonday = day === 0 ? 6 : day - 1;
  const thisMonday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - daysSinceMonday - 7 * weeksAgo, 4));
  const end = new Date(thisMonday.getTime() + 7 * 24 * 3600_000);
  return { startISO: thisMonday.toISOString(), endISO: end.toISOString() };
}

async function fetchWeeklyRevenue(admin: SupabaseClient) {
  const { startISO: thisS, endISO: thisE } = weekRange(0);
  const { startISO: lastS, endISO: lastE } = weekRange(1);

  const [{ data: thisWeek }, { data: lastWeek }] = await Promise.all([
    admin.from("bookings").select("total_price_cents, status").in("status", ["confirmed"]).gte("created_at", thisS).lt("created_at", thisE),
    admin.from("bookings").select("total_price_cents, status").in("status", ["confirmed"]).gte("created_at", lastS).lt("created_at", lastE),
  ]);

  const sum = (rows: { total_price_cents: number | null }[] | null) =>
    (rows ?? []).reduce((s, r) => s + (r.total_price_cents ?? 0), 0);

  return { thisWeekCents: sum(thisWeek), lastWeekCents: sum(lastWeek), thisRange: `${thisS.slice(0, 10)} → ${thisE.slice(0, 10)}`, lastRange: `${lastS.slice(0, 10)} → ${lastE.slice(0, 10)}` };
}

async function fetchInactiveOwners(admin: SupabaseClient): Promise<{ name: string; email: string; lastSeen: string }[]> {
  // Récupère les proprios via profiles.
  const { data: owners } = await admin.from("profiles").select("id, full_name, email").eq("role", "owner");
  if (!owners || owners.length === 0) return [];

  // Récupère les dates de dernière connexion via auth.admin.listUsers (paginé).
  const authUsers = new Map<string, { last_sign_in_at?: string }>();
  let page = 1;
  for (let i = 0; i < 5; i++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 100 });
    if (error || !data?.users?.length) break;
    for (const u of data.users) authUsers.set(u.id, { last_sign_in_at: u.last_sign_in_at });
    if (data.users.length < 100) break;
    page++;
  }

  const cutoff = new Date(Date.now() - 14 * 24 * 3600_000);
  return owners
    .filter((o) => {
      const au = authUsers.get(o.id);
      if (!au || !au.last_sign_in_at) return true; // jamais connecté = inactif
      return new Date(au.last_sign_in_at).getTime() < cutoff.getTime();
    })
    .map((o) => ({
      name: o.full_name || o.email || "?",
      email: o.email || "",
      lastSeen: authUsers.get(o.id)?.last_sign_in_at?.slice(0, 10) || "jamais",
    }));
}

export interface WeeklyRecapInput {
  revenueCents: { thisWeek: number; lastWeek: number };
  inactiveOwners: { name: string; email: string; lastSeen: string }[];
  topVillas: string[];
  convertedLeads: string[];
  trends: string[];
}

export function buildWeeklyRecap(input: WeeklyRecapInput) {
  const { delta, dropOver30 } = computeRevenueDelta(input.revenueCents.thisWeek, input.revenueCents.lastWeek);
  const revenueSection = `<p>CA cette semaine : <strong>${(input.revenueCents.thisWeek / 100).toFixed(0)} €</strong> (semaine précédente : ${(input.revenueCents.lastWeek / 100).toFixed(0)} €, delta : ${delta >= 0 ? "+" : ""}${(delta / 100).toFixed(0)} €)</p>`;
  return {
    revenueSection,
    inactiveOwners: input.inactiveOwners.map((o) => `${o.name} — dernier accès ${o.lastSeen}`),
    topVillas: input.topVillas,
    convertedLeads: input.convertedLeads,
    trends: input.trends,
    anomalyFlag: dropOver30,
  };
}

/** Texte brut pour la notification in-app — une ligne par bloc non vide. */
export function buildWeeklyRecapNotificationBody(recap: ReturnType<typeof buildWeeklyRecap>): string {
  const lines = [
    recap.anomalyFlag ? "Baisse de CA de plus de 30% cette semaine" : null,
    recap.inactiveOwners.length ? `Propriétaires inactifs (${recap.inactiveOwners.length}) : ${recap.inactiveOwners.join(", ")}` : null,
    recap.topVillas.length ? `Top villas : ${recap.topVillas.join(", ")}` : null,
    recap.convertedLeads.length ? `Leads convertis (${recap.convertedLeads.length})` : null,
    ...recap.trends,
  ].filter((l): l is string => Boolean(l));
  return lines.join("\n");
}

export async function runWeeklyRecap(admin: SupabaseClient): Promise<number> {
  const [revenue, inactiveOwners] = await Promise.all([
    fetchWeeklyRevenue(admin),
    fetchInactiveOwners(admin),
  ]);

  // Top villas : 5 villas avec le plus de résas cette semaine
  const thisWeek = weekRange(0);
  const { data: topVillaRows } = await admin
    .from("bookings")
    .select("villa_id, villas(name)")
    .gte("created_at", thisWeek.startISO)
    .lt("created_at", thisWeek.endISO);

  const counts = new Map<string, number>();
  const names = new Map<string, string>();
  for (const b of (topVillaRows ?? [])) {
    counts.set(b.villa_id, (counts.get(b.villa_id) || 0) + 1);
    const vn = (b as any).villas as { name?: string } | null;
    names.set(b.villa_id, vn?.name || b.villa_id.slice(0, 8));
  }
  const topVillas = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, c]) => `${names.get(id) || id.slice(0, 8)} (${c} résa${c > 1 ? "s" : ""})`);

  // Leads convertis : hot_lead/owner_lead notifs créées cette semaine
  const { data: leads } = await admin
    .from("notifications")
    .select("body")
    .in("type", ["owner_lead"])
    .gte("created_at", thisWeek.startISO)
    .lt("created_at", thisWeek.endISO);
  const convertedLeads = (leads ?? []).map((l) => l.body?.slice(0, 150) || "").filter(Boolean);

  // Tendances vs mois précédent — simplifié : nb résas ce mois vs mois précédent
  const monthStart = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1, 4));
  const lastMonthStart = new Date(new Date(monthStart).setUTCMonth(monthStart.getUTCMonth() - 1));

  const [{ data: thisMonthBks }, { data: lastMonthBks }] = await Promise.all([
    admin.from("bookings").select("id").gte("created_at", monthStart.toISOString()),
    admin.from("bookings").select("id").gte("created_at", lastMonthStart.toISOString()).lt("created_at", monthStart.toISOString()),
  ]);

  const trends = [
    `Réservations ce mois : ${(thisMonthBks ?? []).length} vs ${(lastMonthBks ?? []).length} le mois dernier`,
  ];

  const recap = buildWeeklyRecap({
    revenueCents: { thisWeek: revenue.thisWeekCents, lastWeek: revenue.lastWeekCents },
    inactiveOwners,
    topVillas,
    convertedLeads,
    trends,
  });

  await sendAdminWeeklyRecapEmail(recap);

  const { error: notifError } = await admin.from("notifications").insert({
    type: "admin_weekly_recap",
    title: "Récap hebdomadaire admin",
    body: buildWeeklyRecapNotificationBody(recap),
    action_url: "/admin/revenus",
    user_id: null,
  });
  if (notifError) console.error("[weekly-recap] notif insert", notifError);

  return recap.inactiveOwners.length + topVillas.length + convertedLeads.length + (recap.anomalyFlag ? 1 : 0);
}
