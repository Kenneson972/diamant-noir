/** Compte les lignes par jour sur les N derniers jours (inclus aujourd'hui). */
export function buildDailyCounts(
  rows: { created_at: string }[],
  days = 7
): number[] {
  const out: number[] = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    out.push(rows.filter((r) => r.created_at.startsWith(key)).length);
  }

  return out;
}

/** Format attendu par HeroUI Pro KPI.Chart */
export function toChartData(values: number[]): Record<string, number>[] {
  return values.map((value) => ({ value }));
}

export function progressStatus(rate: number): "success" | "warning" | "danger" {
  if (rate >= 70) return "success";
  if (rate >= 40) return "warning";
  return "danger";
}
