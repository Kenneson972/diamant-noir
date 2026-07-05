/** Variation en % entre deux montants (cents ou unité quelconque, cohérente des deux côtés). Null si la base de comparaison est à 0 (évite une division par zéro / un pourcentage infini). */
export function computeMomChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

/** Décale une clé "YYYY-MM" de `monthsDelta` mois (peut être négatif). */
export function shiftMonthKey(monthKey: string, monthsDelta: number): string {
  const [yearStr, monthStr] = monthKey.split("-");
  const date = new Date(Number(yearStr), Number(monthStr) - 1 + monthsDelta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}
