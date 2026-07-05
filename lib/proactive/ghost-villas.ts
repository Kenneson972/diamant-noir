import type { SupabaseClient } from "@supabase/supabase-js";
import { filterNewRefIds, markAlerted } from "@/lib/proactive/dedup";
import { sendAdminGhostVillasEmail } from "@/lib/emails/admin-proactive";

/** Pure : garde les villas créées >30j ET non publiées ou sans iCal. */
export function decideGhostVillas(
  rows: { id: string; name: string | null; is_published: boolean | null; ical_url: string | null; created_at: string }[],
  now: Date
): { id: string; name: string; reason: string }[] {
  const cutoff = new Date(now.getTime() - 30 * 24 * 3600_000);
  return rows
    .filter((r) => {
      if (new Date(r.created_at).getTime() >= cutoff.getTime()) return false;
      if (!r.is_published) return true;
      if (!r.ical_url) return true;
      return false;
    })
    .map((r) => ({
      id: r.id,
      name: r.name || "Sans nom",
      reason: !r.is_published ? "Non publiée" : "Pas de calendrier iCal",
    }));
}

async function fetchGhostVillaCandidates(admin: SupabaseClient) {
  const { data } = await admin
    .from("villas")
    .select("id, name, is_published, ical_url, created_at");
  return (data ?? []) as {
    id: string; name: string | null; is_published: boolean | null; ical_url: string | null; created_at: string;
  }[];
}

export function buildGhostVillaNotification(item: { name: string; reason: string }): {
  type: "ghost_villa";
  title: string;
  body: string;
  action_url: string;
  user_id: null;
} {
  return {
    type: "ghost_villa",
    title: "Villa fantôme détectée",
    body: `${item.name} — ${item.reason}`,
    action_url: "/admin/villas",
    user_id: null,
  };
}

export async function runGhostVillas(admin: SupabaseClient): Promise<number> {
  const rows = await fetchGhostVillaCandidates(admin);
  const candidates = decideGhostVillas(rows, new Date());
  const fresh = await filterNewRefIds(
    admin,
    "ghost_villa",
    candidates.map((c) => c.id)
  );
  if (fresh.length === 0) return 0;
  const toAlert = candidates.filter((c) => fresh.includes(c.id));
  await sendAdminGhostVillasEmail(toAlert.map((c) => ({ name: c.name, reason: c.reason })));
  const { error: notifError } = await admin
    .from("notifications")
    .insert(toAlert.map((c) => buildGhostVillaNotification(c)));
  if (notifError) console.error("[ghost-villas] notif insert", notifError);
  await markAlerted(admin, "ghost_villa", fresh);
  return toAlert.length;
}
