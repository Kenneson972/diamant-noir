import type { SupabaseClient } from "@supabase/supabase-js";
import { filterNewRefIds, markAlerted } from "@/lib/proactive/dedup";
import { sendAdminPendingSubmissionsEmail } from "@/lib/emails/admin-proactive";

/** Pure : garde les lignes créées il y a plus de 48h. */
export function decidePendingSubmissions(
  rows: { id: string; villa_name: string | null; created_at: string }[],
  now: Date
): { id: string; villa: string; since: string }[] {
  const cutoff = new Date(now.getTime() - 48 * 3600_000);
  return rows
    .filter((r) => new Date(r.created_at).getTime() < cutoff.getTime())
    .map((r) => ({
      id: r.id,
      villa: r.villa_name || "Sans nom",
      since: r.created_at.slice(0, 10),
    }));
}

async function fetchPendingSubmissions(admin: SupabaseClient) {
  const { data } = await admin
    .from("villa_submissions")
    .select("id, villa_name, created_at")
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  return (data ?? []) as { id: string; villa_name: string | null; created_at: string }[];
}

/** Orchestrateur complet : fetch → decide → filterNew → sendEmail → markAlerted. Retourne le nombre d'items alertés. */
export async function runPendingSubmissions(admin: SupabaseClient): Promise<number> {
  const rows = await fetchPendingSubmissions(admin);
  const candidates = decidePendingSubmissions(rows, new Date());
  const fresh = await filterNewRefIds(
    admin,
    "pending_submission",
    candidates.map((c) => c.id)
  );
  if (fresh.length === 0) return 0;
  const toAlert = candidates.filter((c) => fresh.includes(c.id));
  await sendAdminPendingSubmissionsEmail(
    toAlert.map((c) => ({ villa: c.villa, since: c.since }))
  );
  await markAlerted(admin, "pending_submission", fresh);
  return toAlert.length;
}
