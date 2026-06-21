import type { SupabaseClient } from "@supabase/supabase-js";

/** Pure : retourne les ids candidats absents du set existant. */
export function diffNewRefIds(existing: Set<string>, candidates: string[]): string[] {
  return candidates.filter((id) => !existing.has(id));
}

/** Retourne les ids de `ids` qui n'ont pas encore été alertés pour ce détecteur. */
export async function filterNewRefIds(
  admin: SupabaseClient,
  detector: string,
  ids: string[]
): Promise<string[]> {
  if (ids.length === 0) return [];
  const { data } = await admin
    .from("proactive_alerts_sent")
    .select("ref_id")
    .eq("detector", detector)
    .in("ref_id", ids);
  const existing = new Set((data ?? []).map((r) => r.ref_id as string));
  return diffNewRefIds(existing, ids);
}

/** Marque les ids comme alertés (upsert idempotent). */
export async function markAlerted(
  admin: SupabaseClient,
  detector: string,
  ids: string[]
): Promise<void> {
  if (ids.length === 0) return;
  await admin
    .from("proactive_alerts_sent")
    .upsert(
      ids.map((ref_id) => ({ detector, ref_id })),
      { onConflict: "detector,ref_id" }
    );
}
