import type { SupabaseClient } from "@supabase/supabase-js";
import { sendAdminDailyRecapEmail } from "@/lib/emails/admin-proactive";

export interface DailyRecap {
  sections: { title: string; lines: string[] }[];
  hasSignal: boolean;
}

/** Pure : agrège les données du jour en sections. */
export function buildDailyRecap(input: {
  submissions: string[];
  leads: string[];
  bookings: string[];
  icalErrors: string[];
}): DailyRecap {
  const sections = [
    { title: "Nouvelles soumissions villa", lines: input.submissions },
    { title: "Nouveaux leads", lines: input.leads },
    { title: "Réservations du jour", lines: input.bookings },
    { title: "Erreurs iCal", lines: input.icalErrors },
  ];
  return { sections, hasSignal: sections.some((s) => s.lines.length > 0) };
}

/** Texte brut pour la notification in-app — une ligne par section non vide. */
export function buildDailyRecapNotificationBody(recap: DailyRecap): string {
  return recap.sections
    .filter((s) => s.lines.length > 0)
    .map((s) => `${s.title} (${s.lines.length}) : ${s.lines.join(", ")}`)
    .join("\n");
}

/** Début de fenêtre "aujourd'hui" en UTC (même jour en MQ). */
export function todayStartUTC(): Date {
  const now = new Date();
  // Martinique = UTC-4, donc début du jour MQ = 04:00 UTC
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 4));
  if (start > now) start.setUTCDate(start.getUTCDate() - 1);
  return start;
}

async function fetchDailyContext(admin: SupabaseClient): Promise<{ submissions: string[]; leads: string[]; bookings: string[]; icalErrors: string[] }> {
  const since = todayStartUTC().toISOString();

  const [{ data: subs }, { data: leadsR }, { data: bks }, { data: icalR }] = await Promise.all([
    admin.from("villa_submissions").select("villa_name").eq("status", "pending").gte("created_at", since),
    admin.from("notifications").select("title, body").in("type", ["hot_lead", "owner_lead"]).gte("created_at", since),
    admin.from("bookings").select("guest_name, villa_id").gte("created_at", since),
    admin.from("notifications").select("body").eq("type", "ical_error").gte("created_at", since),
  ]);

  return {
    submissions: (subs ?? []).map((s) => s.villa_name || "Sans nom"),
    leads: (leadsR ?? []).map((l) => `${l.title || ""} — ${l.body?.slice(0, 128) || ""}`),
    bookings: (bks ?? []).map((b) => `${b.guest_name || "?"} (villa ${b.villa_id?.slice(0, 8)})`),
    icalErrors: (icalR ?? []).map((e) => e.body?.slice(0, 200) || ""),
  };
}

export async function runDailyRecap(admin: SupabaseClient): Promise<number> {
  const input = await fetchDailyContext(admin);
  const recap = buildDailyRecap(input);
  if (!recap.hasSignal) return 0;

  await sendAdminDailyRecapEmail({
    submissions: input.submissions,
    leads: input.leads,
    bookings: input.bookings,
    icalErrors: input.icalErrors,
  });

  const { error: notifError } = await admin.from("notifications").insert({
    type: "admin_daily_recap",
    title: "Point quotidien admin",
    body: buildDailyRecapNotificationBody(recap),
    action_url: "/admin/hub-classique",
    user_id: null,
  });
  if (notifError) console.error("[daily-recap] notif insert", notifError);

  return recap.sections.reduce((sum, s) => sum + s.lines.length, 0);
}
