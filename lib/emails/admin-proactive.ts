import { render } from "@react-email/render";
import { getResend, isResendConfigured, RESEND_FROM, ADMIN_NOTIFICATION_EMAIL } from "@/lib/resend";
import AdminProactiveSummaryEmail from "@/emails/admin-proactive-summary";

/** Échappe HTML pour éviter toute injection dans les emails. */
function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!)
  );
}

async function sendAdmin(subject: string, blocks: { label: string; items: string[] }[]): Promise<void> {
  if (!isResendConfigured()) return;
  try {
    const nonEmpty = blocks.filter((b) => b.items.length > 0);
    if (nonEmpty.length === 0) return;
    const html = await render(
      AdminProactiveSummaryEmail({ title: subject, blocks: nonEmpty })
    );
    await getResend().emails.send({
      from: RESEND_FROM,
      to: [ADMIN_NOTIFICATION_EMAIL],
      subject,
      html,
    });
  } catch (e) {
    console.warn("[admin-proactive] Resend send failed", e);
  }
}

// ── Senders spécialisés (no-op si liste vide / no signal) ──

export async function sendAdminPendingSubmissionsEmail(
  items: { villa: string; since: string }[]
): Promise<void> {
  await sendAdmin(`Kayvila — ${items.length} soumission(s) en attente +24h`, [
    { label: "Soumissions en attente depuis +24h", items: items.map((i) => `${i.villa} — depuis ${i.since}`) },
  ]);
}

export async function sendAdminDailyRecapEmail(data: {
  submissions: string[];
  leads: string[];
  bookings: string[];
  icalErrors: string[];
}): Promise<void> {
  await sendAdmin("Kayvila — Point quotidien", [
    { label: "Nouvelles soumissions villa", items: data.submissions },
    { label: "Nouveaux leads", items: data.leads },
    { label: "Réservations du jour", items: data.bookings },
    { label: "Erreurs iCal", items: data.icalErrors },
  ]);
}

export async function sendAdminWeeklyRecapEmail(data: {
  revenueSection: string;
  inactiveOwners: string[];
  topVillas: string[];
  convertedLeads: string[];
  trends: string[];
  anomalyFlag: boolean;
}): Promise<void> {
  const blocks = [
    data.anomalyFlag
      ? { label: "⚠️ Alerte", items: ["Baisse de CA > 30 % détectée cette semaine"] }
      : null,
    { label: "Chiffres", items: [data.revenueSection] },
    { label: "Propriétaires inactifs (14j+)", items: data.inactiveOwners },
    { label: "Top villas", items: data.topVillas },
    { label: "Leads convertis", items: data.convertedLeads },
    { label: "Tendances vs mois précédent", items: data.trends },
  ].filter(Boolean) as { label: string; items: string[] }[];
  await sendAdmin("Kayvila — Récap hebdomadaire", blocks);
}

export async function sendAdminGhostVillasEmail(
  items: { name: string; reason: string }[]
): Promise<void> {
  await sendAdmin(`Kayvila — ${items.length} villa(s) fantôme(s) détectée(s)`, [
    { label: "Villas détectées", items: items.map((i) => `${i.name} — ${i.reason}`) },
  ]);
}

export async function sendAdminHotLeadEmail(data: { summary: string }): Promise<void> {
  await sendAdmin("Kayvila — Nouveau lead chaud détecté", [
    { label: "Résumé", items: [data.summary] },
  ]);
}

export async function sendAdminIcalErrorEmail(data: { villa: string; error: string }): Promise<void> {
  await sendAdmin(`Kayvila — Erreur iCal : ${escapeHtml(data.villa)}`, [
    { label: "Villa", items: [data.villa] },
    { label: "Erreur", items: [data.error] },
  ]);
}
