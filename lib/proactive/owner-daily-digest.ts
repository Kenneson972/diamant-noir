import type { SupabaseClient } from "@supabase/supabase-js";
import { buildOwnerContextPack } from "@/lib/owner-assistant-context";
import type { OwnerContextPack } from "@/lib/owner-assistant-context";
import { todayStartUTC } from "@/lib/proactive/daily-recap";

export interface OwnerDigestSignal {
  todayLines: string[];
  alertLines: string[];
  taskLines: string[];
}

const TODAY_LABEL: Record<OwnerContextPack["today"][number]["kind"], string> = {
  check_in: "Arrivée",
  check_out: "Départ",
  in_stay: "Séjour en cours",
};

/** Pure : dérive les 3 blocs de signal à partir du pack contexte déjà calculé. */
export function buildOwnerDigestSignal(pack: OwnerContextPack): OwnerDigestSignal {
  const todayLines = pack.today.map((t) => {
    const label = TODAY_LABEL[t.kind];
    return `${label} — ${t.villa_name}${t.guest_name ? ` (${t.guest_name})` : ""}`;
  });
  const alertLines = pack.alerts.map((a) => a.title);
  const taskLines = (pack.tasks_open as { content?: string }[])
    .map((t) => t.content || "Tâche")
    .slice(0, 10);
  return { todayLines, alertLines, taskLines };
}

/** Pure : true si au moins un des 3 blocs contient quelque chose. */
export function hasOwnerDigestSignal(signal: OwnerDigestSignal): boolean {
  return signal.todayLines.length > 0 || signal.alertLines.length > 0 || signal.taskLines.length > 0;
}

/** Pure : texte brut pour le corps de la notification. */
export function buildOwnerDigestBody(signal: OwnerDigestSignal): string {
  const blocks = [
    signal.todayLines.length ? `Aujourd'hui :\n${signal.todayLines.map((l) => `- ${l}`).join("\n")}` : "",
    signal.alertLines.length ? `Alertes :\n${signal.alertLines.map((l) => `- ${l}`).join("\n")}` : "",
    signal.taskLines.length ? `Tâches en attente :\n${signal.taskLines.map((l) => `- ${l}`).join("\n")}` : "",
  ];
  return blocks.filter(Boolean).join("\n\n");
}

async function fetchActiveOwnerIds(admin: SupabaseClient): Promise<string[]> {
  const { data } = await admin.from("profiles").select("id").eq("role", "owner");
  return (data ?? []).map((o) => o.id as string);
}

async function fetchAlreadyDigestedToday(admin: SupabaseClient, since: string): Promise<Set<string>> {
  const { data } = await admin
    .from("notifications")
    .select("user_id")
    .eq("type", "owner_daily_digest")
    .gte("created_at", since);
  return new Set((data ?? []).map((r) => r.user_id as string));
}

/** Orchestrateur : 1 propriétaire déjà digéré aujourd'hui → skip. Sinon insère si signal. */
export async function runOwnerDailyDigest(admin: SupabaseClient): Promise<number> {
  const ownerIds = await fetchActiveOwnerIds(admin);
  if (ownerIds.length === 0) return 0;

  const since = todayStartUTC().toISOString();
  const alreadyDone = await fetchAlreadyDigestedToday(admin, since);

  let count = 0;
  for (const ownerId of ownerIds) {
    if (alreadyDone.has(ownerId)) continue;

    const pack = await buildOwnerContextPack(admin, ownerId);
    const signal = buildOwnerDigestSignal(pack);
    if (!hasOwnerDigestSignal(signal)) continue;

    const { error } = await admin.from("notifications").insert({
      type: "owner_daily_digest",
      title: "Votre point du jour",
      body: buildOwnerDigestBody(signal),
      action_url: "/dashboard/proprio",
      user_id: ownerId,
    });
    if (error) {
      console.error("[owner-daily-digest] insert failed", ownerId, error);
      continue;
    }
    count++;
  }
  return count;
}
