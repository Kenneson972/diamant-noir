// lib/owner-alerts.ts
// Calcul live des 5 alertes proactives propriétaire (B1). Aucune écriture DB.
import { findGaps, type DateRange } from "@/lib/availability-gaps";

export type ComputedAlert = {
  type: "calendar_gap" | "overdue_task" | "booking_conflict" | "revenue_delta" | "ota_desync";
  severity: "high" | "medium" | "low";
  title: string;
  body: string | null;
  villa_id: string | null;
};

export type AlertsInput = {
  today: string;
  villas: { id: string; name?: string }[];
  bookings: { villa_id: string; start_date: string; end_date: string; status?: string }[];
  blocks: { villa_id: string; start_date: string; end_date: string }[];
  tasks: { id: string; villa_id: string; status?: string; due_date?: string | null }[];
  otaLogs: { villa_id: string; created_at: string; error: string | null }[];
  revenueCurrentMonth: number;
  revenueLastMonth: number;
  gapMinNights?: number;
  otaStaleHours?: number;
};

const ACTIVE = (s?: string) => s !== "cancelled" && s !== "rejected";

function addDays(d: string, n: number): string {
  return new Date(Date.parse(d) + n * 86_400_000).toISOString().slice(0, 10);
}

export function computeOwnerAlerts(input: AlertsInput): ComputedAlert[] {
  const {
    today, villas, bookings, blocks, tasks, otaLogs,
    revenueCurrentMonth, revenueLastMonth,
    gapMinNights = 3, otaStaleHours = 48,
  } = input;

  const alerts: ComputedAlert[] = [];
  const nameOf = (id: string) => villas.find((v) => v.id === id)?.name ?? "Villa";
  const horizon = addDays(today, 30);

  for (const villa of villas) {
    const occupied: DateRange[] = [
      ...bookings.filter((b) => b.villa_id === villa.id && ACTIVE(b.status))
        .map((b) => ({ start: b.start_date, end: b.end_date })),
      ...blocks.filter((b) => b.villa_id === villa.id)
        .map((b) => ({ start: b.start_date, end: addDays(b.end_date, 1) })),
    ];

    const gaps = findGaps(occupied, today, horizon, gapMinNights);
    if (gaps.length > 0) {
      const g = gaps[0];
      alerts.push({
        type: "calendar_gap", severity: "medium",
        title: `${g.nights} nuits libres sur ${nameOf(villa.id)}`,
        body: `Fenêtre disponible du ${g.start} au ${g.end}. Veux-tu voir les dates ?`,
        villa_id: villa.id,
      });
    }

    const vb = bookings
      .filter((b) => b.villa_id === villa.id && ACTIVE(b.status))
      .sort((a, b) => a.start_date.localeCompare(b.start_date));
    for (let i = 1; i < vb.length; i++) {
      if (vb[i].start_date < vb[i - 1].end_date) {
        alerts.push({
          type: "booking_conflict", severity: "high",
          title: `Conflit de réservation sur ${nameOf(villa.id)}`,
          body: `Chevauchement détecté autour du ${vb[i].start_date}.`,
          villa_id: villa.id,
        });
        break;
      }
    }

    const vlogs = otaLogs
      .filter((l) => l.villa_id === villa.id)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
    if (vlogs.length > 0) {
      const last = vlogs[0];
      const ageH = (Date.parse(`${today}T00:00:00Z`) - Date.parse(last.created_at)) / 3_600_000;
      if (last.error || ageH > otaStaleHours) {
        alerts.push({
          type: "ota_desync", severity: "medium",
          title: `Synchro OTA à vérifier — ${nameOf(villa.id)}`,
          body: last.error ? `Erreur récente : ${last.error}` : `Pas de synchro depuis ${Math.round(ageH)} h.`,
          villa_id: villa.id,
        });
      }
    }
  }

  const overdue = tasks.filter((t) => t.status !== "done" && t.due_date && t.due_date < today);
  if (overdue.length > 0) {
    alerts.push({
      type: "overdue_task", severity: "high",
      title: `${overdue.length} tâche(s) en retard`,
      body: overdue.slice(0, 3).map((t) => `${nameOf(t.villa_id)}`).join(", "),
      villa_id: overdue[0].villa_id ?? null,
    });
  }

  if (revenueLastMonth > 0) {
    const pct = Math.round(((revenueCurrentMonth - revenueLastMonth) / revenueLastMonth) * 100);
    alerts.push({
      type: "revenue_delta", severity: pct < -10 ? "medium" : "low",
      title: `Revenu du mois : ${pct >= 0 ? "+" : ""}${pct}% vs mois dernier`,
      body: `${revenueCurrentMonth.toLocaleString("fr-FR")} € ce mois (vs ${revenueLastMonth.toLocaleString("fr-FR")} €).`,
      villa_id: null,
    });
  }

  return alerts;
}
