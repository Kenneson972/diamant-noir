import { getResend, isResendConfigured, RESEND_FROM, ADMIN_NOTIFICATION_EMAIL } from "@/lib/resend";

/** Échappe HTML pour éviter toute injection dans les emails. */
function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!)
  );
}

/** Bloc HTML réutilisable : titre + liste à puces. Chaîne vide si aucun item. */
export function renderList(title: string, lines: string[]): string {
  if (lines.length === 0) return "";
  const items = lines.map((l) => `<li style="margin:4px 0">${escapeHtml(l)}</li>`).join("");
  return `<h3 style="color:#1a2238;font-family:sans-serif;margin:16px 0 8px">${escapeHtml(title)}</h3><ul style="color:#333;font-family:sans-serif;padding-left:20px">${items}</ul>`;
}

async function sendAdmin(subject: string, html: string): Promise<void> {
  if (!isResendConfigured()) return;
  try {
    await getResend().emails.send({
      from: RESEND_FROM,
      to: [ADMIN_NOTIFICATION_EMAIL],
      subject,
      html: `<div style="max-width:600px;margin:16px auto;font-family:sans-serif;color:#333">${html}</div>`,
    });
  } catch (e) {
    console.warn("[admin-proactive] Resend send failed", e);
  }
}

function fullHtml(...blocks: string[]): string {
  return blocks.filter(Boolean).join("");
}

// ── Senders spécialisés (no-op si liste vide / no signal) ──

export async function sendAdminPendingSubmissionsEmail(
  items: { villa: string; since: string }[]
): Promise<void> {
  if (items.length === 0) return;
  const list = renderList("Soumissions en attente depuis +24h", items.map((i) => `${i.villa} — depuis ${i.since}`));
  await sendAdmin(`Kayvila — ${items.length} soumission(s) en attente +24h`, fullHtml(list));
}

export async function sendAdminDailyRecapEmail(data: {
  submissions: string[];
  leads: string[];
  bookings: string[];
  icalErrors: string[];
}): Promise<void> {
  const blocks = [
    renderList("Nouvelles soumissions villa", data.submissions),
    renderList("Nouveaux leads", data.leads),
    renderList("Réservations du jour", data.bookings),
    renderList("Erreurs iCal", data.icalErrors),
  ];
  if (blocks.every((b) => !b)) return;
  await sendAdmin("Kayvila — Point quotidien", fullHtml(...blocks));
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
    `<h2 style="color:#1a2238">Récap hebdomadaire</h2>`,
    data.anomalyFlag
      ? `<p style="color:#c0392b;font-weight:bold">⚠️ Baisse de CA > 30 % détectée cette semaine</p>`
      : "",
    `<div style="margin:12px 0">${data.revenueSection}</div>`,
    renderList("Propriétaires inactifs (14j+)", data.inactiveOwners),
    renderList("Top villas", data.topVillas),
    renderList("Leads convertis", data.convertedLeads),
    renderList("Tendances vs mois précédent", data.trends),
  ];
  await sendAdmin("Kayvila — Récap hebdomadaire", fullHtml(...blocks));
}

export async function sendAdminGhostVillasEmail(
  items: { name: string; reason: string }[]
): Promise<void> {
  if (items.length === 0) return;
  const list = renderList("Villas détectées", items.map((i) => `${i.name} — ${i.reason}`));
  await sendAdmin(`Kayvila — ${items.length} villa(s) fantôme(s) détectée(s)`, fullHtml(list));
}

export async function sendAdminHotLeadEmail(data: { summary: string }): Promise<void> {
  if (!data.summary) return;
  await sendAdmin(
    "Kayvila — Nouveau lead chaud détecté",
    fullHtml(`<p style="font-size:15px">${escapeHtml(data.summary)}</p>`)
  );
}

export async function sendAdminIcalErrorEmail(data: { villa: string; error: string }): Promise<void> {
  if (!data.villa) return;
  await sendAdmin(
    `Kayvila — Erreur iCal : ${escapeHtml(data.villa)}`,
    fullHtml(`<p><strong>Villa :</strong> ${escapeHtml(data.villa)}</p><p><strong>Erreur :</strong> ${escapeHtml(data.error)}</p>`)
  );
}
