// Fallback + commandes locales de l'agent admin — fonctions pures, testables.
// Texte brut uniquement (pas de markdown/emoji — cohérent avec les prompts n8n).

import { matchFaq, FAQ_CATEGORIES, normalizeText } from "@/lib/chatbot/faq";
import type { AdminInsights } from "@/lib/admin-assistant-context";

// ─── Commandes locales (exécutées quand n8n est indisponible) ────────────────

export type AdminLocalCommand =
  | { type: "create_task"; title: string; dueDate: string | null }
  | { type: "complete_task"; taskRef: string }
  | { type: "note_client"; client: string; note: string }
  | null;

function addDays(d: string, n: number): string {
  return new Date(Date.parse(d + "T00:00:00Z") + n * 86_400_000).toISOString().slice(0, 10);
}

export function parseAdminCommand(message: string, todayStr: string): AdminLocalCommand {
  const msg = message.trim();

  // Note client — AVANT create_task (contient aussi « ajoute »)
  const note = msg.match(
    /(?:ajoute|mets?)\s+une\s+note\s+sur\s+(?:le\s+client\s+|la\s+cliente\s+|le\s+|la\s+)?(.+?)\s*:\s*(.+)/i
  );
  if (note) {
    return { type: "note_client", client: note[1].trim(), note: note[2].trim() };
  }

  // Tâche faite : « marque la tâche #123 comme faite / terminée »
  const done = msg.match(/t[âa]che\s*#?\s*([\w-]+)\s+(?:comme\s+)?(?:faite?|termin[ée]e?|finie?|done)/i);
  if (done) {
    return { type: "complete_task", taskRef: done[1] };
  }

  // Créer une tâche : « crée/ajoute une tâche [:] <titre> [pour demain|aujourd'hui] »
  const create = msg.match(/(?:cr[ée]{1,2}[er]*|ajoute[rz]?)\s+(?:une\s+)?t[âa]che\s*:?\s+(.+)/i);
  if (create) {
    let title = create[1].trim();
    let dueDate: string | null = null;
    const norm = normalizeText(title);
    if (/\bpour demain\b/.test(norm)) {
      dueDate = addDays(todayStr, 1);
      title = title.replace(/\s*pour\s+demain\s*$/i, "").trim();
    } else if (/\bpour aujourd hui\b/.test(norm)) {
      dueDate = todayStr;
      title = title.replace(/\s*pour\s+aujourd'?hui\s*$/i, "").trim();
    }
    if (title) return { type: "create_task", title, dueDate };
  }

  return null;
}

// ─── Fallback data-driven ─────────────────────────────────────────────────────

export type AdminFallbackContext = {
  contextData: Record<string, any>;
  occupancy: Record<string, number>;
  villaNames: Record<string, string>;
  alerts: { severity: string; label: string }[];
  briefing: {
    checkins_today: number;
    checkouts_today: number;
    submissions_pending: number;
    highlights: string[];
  };
  insights: AdminInsights;
  checkins7d: { guest_name: string | null; villa_name: string; start_date: string }[];
};

const eur = (n: number | undefined) => (n ?? 0).toLocaleString("fr-FR");

function alertsHeader(ctx: AdminFallbackContext): string {
  if (ctx.alerts.length === 0) return "";
  return "A traiter : " + ctx.alerts.slice(0, 3).map((a) => a.label).join(" | ") + "\n\n";
}

export function buildAdminFallbackReply(
  message: string,
  ctx: AdminFallbackContext
): { text: string; action: string; suggestions: string[]; matchedFaqId: string | null } {
  const msg = normalizeText(message);
  const d = ctx.contextData;
  const fin = d.finances || {};
  const bs = d.bookings_summary || {};
  const ts = d.tasks_summary || {};
  const vs = d.villas_summary || {};
  const sub = d.submissions_summary || {};
  const ota = d.ota_health || {};

  // Salutation → briefing du jour
  if (/^(bonjour|salut|hello|coucou|bonsoir|hey)\b/.test(msg) || msg === "briefing") {
    const b = ctx.briefing;
    const lines = [
      alertsHeader(ctx) + `Briefing du jour :`,
      `- ${b.checkins_today} check-in(s), ${b.checkouts_today} check-out(s) aujourd'hui`,
      `- ${ts.overdue ?? 0} tache(s) en retard, ${b.submissions_pending} soumission(s) en attente`,
      `- CA du mois : ${eur(fin.revenue_this_month)} EUR` +
        (ctx.insights.revenue_delta_pct !== null
          ? ` (${ctx.insights.revenue_delta_pct >= 0 ? "+" : ""}${ctx.insights.revenue_delta_pct}% vs mois dernier)`
          : ""),
      ctx.insights.top_actions.length
        ? `Actions recommandees : ${ctx.insights.top_actions.join(" ; ")}`
        : "",
    ].filter(Boolean);
    return {
      text: lines.join("\n"),
      action: "SHOW_STATS",
      suggestions: ["Check-ins de la semaine ?", "Taux d'occupation ?", "Erreurs OTA ?"],
      matchedFaqId: "briefing",
    };
  }

  // Occupation
  if (/occupation|taux|remplissage/.test(msg)) {
    const rows = Object.entries(ctx.occupancy)
      .sort((a, b) => b[1] - a[1])
      .map(([id, pct]) => `- ${ctx.villaNames[id] ?? id} : ${pct}%`);
    const global = rows.length
      ? Math.round(Object.values(ctx.occupancy).reduce((s, v) => s + v, 0) / rows.length)
      : 0;
    return {
      text: alertsHeader(ctx) + `Taux d'occupation 30 jours : ${global}% en moyenne.\n${rows.join("\n")}`,
      action: "SHOW_VILLAS",
      suggestions: ["Top villas par revenu ?", "Check-ins de la semaine ?"],
      matchedFaqId: "occupation",
    };
  }

  // Top villas
  if (/top|meilleure|classement|performance|revenu par villa/.test(msg)) {
    const top = ((fin.revenue_by_villa as any[]) || [])
      .slice()
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 3)
      .map((v, i) => `${i + 1}. ${v.villa_name} : ${eur(v.revenue)} EUR (${v.bookings_count} resa)`);
    return {
      text: alertsHeader(ctx) + `Top villas par revenu encaisse :\n${top.join("\n")}`,
      action: "SHOW_FINANCES",
      suggestions: ["Taux d'occupation ?", "Revenus du mois ?"],
      matchedFaqId: "top-villas",
    };
  }

  // Check-ins semaine
  if (/check.?in|arrivee|semaine|arrive/.test(msg)) {
    const rows = ctx.checkins7d
      .slice(0, 10)
      .map((c) => `- ${c.start_date} : ${c.guest_name ?? "Client"} — ${c.villa_name}`);
    return {
      text:
        alertsHeader(ctx) +
        (rows.length
          ? `Arrivees sous 7 jours (${rows.length}) :\n${rows.join("\n")}`
          : "Aucune arrivee prevue sous 7 jours."),
      action: "SHOW_BOOKINGS",
      suggestions: ["Check-outs du jour ?", "Reservations en attente ?"],
      matchedFaqId: "checkins-semaine",
    };
  }

  // OTA
  if (/ota|sync|airbnb|booking|ical|erreur/.test(msg)) {
    const errs = ((ota.recent_errors as any[]) || []).map(
      (e) => `- ${e.source} (villa ${ctx.villaNames[e.villa_id] ?? e.villa_id}) : ${e.error}`
    );
    const last = ota.last_sync ? new Date(ota.last_sync).toLocaleString("fr-FR") : "jamais";
    return {
      text:
        alertsHeader(ctx) +
        `Synchro OTA — derniere : ${last}.\n` +
        (errs.length ? `Erreurs recentes :\n${errs.join("\n")}` : "Aucune erreur recente."),
      action: "SHOW_OTA_HEALTH",
      suggestions: ["Forcer une synchro ?", "Briefing du jour ?"],
      matchedFaqId: "ota-sync",
    };
  }

  // Revenus
  if (/revenu|chiffre|\bca\b|encaisse|financ|euro/.test(msg)) {
    const delta =
      ctx.insights.revenue_delta_pct !== null
        ? ` (${ctx.insights.revenue_delta_pct >= 0 ? "+" : ""}${ctx.insights.revenue_delta_pct}% vs mois dernier)`
        : "";
    return {
      text:
        alertsHeader(ctx) +
        `Revenus : ${eur(fin.revenue_this_month)} EUR ce mois${delta}.\n` +
        `Mois dernier : ${eur(fin.revenue_last_month)} EUR. Total encaisse : ${eur(fin.revenue_total)} EUR.\n` +
        `Paiements en attente : ${fin.pending_payments ?? 0}.`,
      action: "SHOW_FINANCES",
      suggestions: ["Top villas ?", "Taux d'occupation ?"],
      matchedFaqId: "revenus",
    };
  }

  // Demandes en attente
  if (/demande|attente|soumission|reclamation/.test(msg)) {
    return {
      text:
        alertsHeader(ctx) +
        `Demandes en attente :\n- Soumissions de villas : ${sub.received ?? 0} recue(s), ${sub.in_progress ?? 0} en cours\n- Paiements en attente : ${fin.pending_payments ?? 0}\n- Taches ouvertes : ${(ts.pending ?? 0) + (ts.in_progress ?? 0)} (dont ${ts.overdue ?? 0} en retard)`,
      action: "SHOW_SUBMISSIONS",
      suggestions: ["Soumissions recentes ?", "Taches en retard ?"],
      matchedFaqId: "demandes",
    };
  }

  // FAQ admin générique (mots-clés restants)
  const m = matchFaq(message, FAQ_CATEGORIES.admin);
  if (m) {
    return {
      text: alertsHeader(ctx) + m.entry.answer,
      action: "SHOW_STATS",
      suggestions: ["Briefing du jour ?", "Taux d'occupation ?"],
      matchedFaqId: m.entry.id,
    };
  }

  // Résumé général
  return {
    text:
      alertsHeader(ctx) +
      `Vue d'ensemble : ${vs.total ?? 0} villa(s) (${vs.published ?? 0} publiee(s)), ` +
      `${bs.checkins_today ?? 0} check-in(s) aujourd'hui, ${ts.overdue ?? 0} tache(s) en retard, ` +
      `${eur(fin.revenue_this_month)} EUR ce mois-ci, ${sub.received ?? 0} soumission(s) en attente.\n` +
      `Que puis-je faire pour vous ?`,
    action: "SHOW_STATS",
    suggestions: ["Briefing du jour ?", "Check-ins de la semaine ?", "Revenus du mois ?"],
    matchedFaqId: null,
  };
}
