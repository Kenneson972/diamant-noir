/** Politique Kayvila — remboursement selon délai avant check-in */
export function getRefundAmountCents(totalPriceCents: number, startDate: string, today = new Date()): number | null {
  const checkin = new Date(startDate);
  checkin.setHours(0, 0, 0, 0);
  const ref = new Date(today);
  ref.setHours(0, 0, 0, 0);
  const daysUntilCheckin = Math.ceil((checkin.getTime() - ref.getTime()) / 86400000);

  if (daysUntilCheckin < 0) return null;
  if (daysUntilCheckin > 30) return totalPriceCents;
  if (daysUntilCheckin > 14) return Math.round(totalPriceCents * 0.5);
  if (daysUntilCheckin > 7) return Math.round(totalPriceCents * 0.25);
  return 0;
}
