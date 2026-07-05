// lib/owner-assistant-reply.ts
// Réponses locales de l'agent proprio (mode démo + panne n8n).
// Texte brut, chiffres réels du OwnerContextPack, FAQ propriétaire intégrée.

import { matchFaq, FAQ_CATEGORIES, normalizeText } from "@/lib/chatbot/faq";
import type { OwnerContextPack } from "@/lib/owner-assistant-context";

const eur = (n: number) => Math.round(n).toLocaleString("fr-FR");

export function ownerInsights(pack: OwnerContextPack): {
  revenue_delta_pct: number | null;
  next_arrival: { villa_name: string; guest_name: string | null; start_date: string } | null;
  occupancy_30d: number;
} {
  const p = pack.portfolio;
  const revenue_delta_pct =
    p.revenue_last_month > 0
      ? Math.round(((p.revenue_current_month - p.revenue_last_month) / p.revenue_last_month) * 100)
      : null;

  const todayStr = pack.current_date_iso.slice(0, 10);
  const villaNameById = Object.fromEntries(
    (pack.villas as { id?: string; name?: string }[]).map((v) => [String(v.id), String(v.name ?? "Villa")])
  );
  const upcoming = (pack.bookings as { villa_id?: string; start_date?: string; guest_name?: string; status?: string }[])
    .filter((b) => String(b.start_date ?? "") >= todayStr && b.status !== "cancelled")
    .sort((a, b) => String(a.start_date).localeCompare(String(b.start_date)));
  const next = upcoming[0] ?? null;

  // Occupation 30j : nuits réservées / (villas × 30)
  const horizon = new Date(Date.parse(todayStr) + 30 * 86_400_000).toISOString().slice(0, 10);
  let nights = 0;
  for (const b of pack.bookings as { start_date?: string; end_date?: string; status?: string }[]) {
    if (b.status === "cancelled") continue;
    const s = String(b.start_date ?? "").slice(0, 10);
    const e = String(b.end_date ?? "").slice(0, 10);
    if (!s || !e) continue;
    const cs = s < todayStr ? todayStr : s;
    const ce = e > horizon ? horizon : e;
    if (cs < ce) nights += Math.round((Date.parse(ce) - Date.parse(cs)) / 86_400_000);
  }
  const denom = Math.max(1, pack.portfolio.total_villas * 30);
  const occupancy_30d = Math.min(100, Math.round((nights / denom) * 100));

  return {
    revenue_delta_pct,
    next_arrival: next
      ? {
          villa_name: villaNameById[String(next.villa_id)] ?? "Villa",
          guest_name: (next.guest_name as string) ?? null,
          start_date: String(next.start_date),
        }
      : null,
    occupancy_30d,
  };
}

export function buildOwnerReply(
  pack: OwnerContextPack,
  message: string
): { text: string; matchedFaqId: string | null } {
  const msg = normalizeText(message);
  const p = pack.portfolio;
  const ins = ownerInsights(pack);

  // FAQ propriétaire d'abord (commission, minimum, ménage, imprévus…)
  const faq = matchFaq(message, FAQ_CATEGORIES.proprietaire);
  if (faq && faq.score >= 1 && !/revenu|arrive|villa|tache/.test(msg)) {
    return { text: faq.entry.answer, matchedFaqId: faq.entry.id };
  }

  // Revenus — chiffres réels
  if (/revenu|chiffre|encaisse|gagne|financ|argent|mois/.test(msg)) {
    const delta =
      ins.revenue_delta_pct !== null
        ? ` (${ins.revenue_delta_pct >= 0 ? "+" : ""}${ins.revenue_delta_pct}% vs mois dernier)`
        : "";
    return {
      text:
        `Revenus nets : ${eur(p.revenue_current_month)} EUR ce mois-ci${delta}.\n` +
        `Mois dernier : ${eur(p.revenue_last_month)} EUR. Total encaisse : ${eur(p.total_revenue_paid)} EUR.`,
      matchedFaqId: "revenus",
    };
  }

  // Arrivées / réservations — utilise kind (fix bug e.type)
  if (/reservation|booking|sejour|check ?in|arrive|depart|client|voyageur|qui est/.test(msg)) {
    if (pack.today.length === 0) {
      const next = ins.next_arrival
        ? ` Prochaine arrivee : ${ins.next_arrival.guest_name ?? "client"} le ${ins.next_arrival.start_date} (${ins.next_arrival.villa_name}).`
        : "";
      return {
        text: `Aucun check-in ni check-out aujourd'hui. ${p.upcoming_bookings_count} reservation(s) a venir.${next}`,
        matchedFaqId: "reservations",
      };
    }
    const lines = pack.today.slice(0, 8).map((e) => {
      const label = e.kind === "check_in" ? "Arrivee" : e.kind === "check_out" ? "Depart" : "En sejour";
      return `- ${label} : ${e.guest_name ?? "Client"} — ${e.villa_name} (${e.start_date} → ${e.end_date})`;
    });
    return {
      text: `Aujourd'hui, ${pack.today.length} evenement(s) :\n${lines.join("\n")}\n${p.upcoming_bookings_count} reservation(s) a venir.`,
      matchedFaqId: "reservations",
    };
  }

  // Tâches
  if (/tache|todo|urgent|retard|maintenance/.test(msg)) {
    if (p.pending_tasks_count === 0) {
      return { text: "Aucune tache en attente. Tout est en ordre.", matchedFaqId: "taches" };
    }
    const lines = (pack.tasks_open as { content?: string; title?: string }[])
      .slice(0, 10)
      .map((t) => `- ${t.content || t.title || "Sans titre"}`);
    return {
      text: `${p.pending_tasks_count} tache(s) en attente :\n${lines.join("\n")}`,
      matchedFaqId: "taches",
    };
  }

  // Villas
  if (/villa|propriete|maison|portfolio|parc/.test(msg)) {
    const lines = (pack.villas as { name?: string; is_published?: boolean }[]).map(
      (v) => `- ${v.name ?? "Villa"} : ${v.is_published ? "publiee" : "non publiee"}`
    );
    return {
      text: `Votre parc : ${p.total_villas} villa(s), ${p.published_villas} publiee(s).\n${lines.join("\n")}\nOccupation 30 jours : ${ins.occupancy_30d}%.`,
      matchedFaqId: "villas",
    };
  }

  // Vue d'ensemble par défaut
  const delta =
    ins.revenue_delta_pct !== null
      ? ` (${ins.revenue_delta_pct >= 0 ? "+" : ""}${ins.revenue_delta_pct}%)`
      : "";
  return {
    text:
      `Vue d'ensemble : ${p.total_villas} villa(s) (${p.published_villas} publiee(s)), ` +
      `${pack.today.length} evenement(s) aujourd'hui, ${p.pending_tasks_count} tache(s) en attente, ` +
      `${eur(p.revenue_current_month)} EUR ce mois-ci${delta}. Que puis-je faire pour vous ?`,
    matchedFaqId: null,
  };
}

/** Snapshot bref quand n8n est en erreur. */
export function buildOwnerFallbackText(pack: OwnerContextPack): string {
  const p = pack.portfolio;
  return (
    `Mon analyse detaillee est temporairement indisponible. Snapshot : ` +
    `${p.total_villas} villa(s), ${pack.today.length} evenement(s) aujourd'hui, ` +
    `${p.pending_tasks_count} tache(s) en attente, ${eur(p.revenue_current_month)} EUR ce mois-ci.`
  );
}
