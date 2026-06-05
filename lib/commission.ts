/** Taux par défaut Kayvila (25 %) — fraction décimale 0.25 */
export const DEFAULT_COMMISSION_RATE = 0.25;

/**
 * Normalise `villas.commission_rate` : décimal (0.25) ou legacy pourcent (25).
 */
export function normalizeCommissionRate(rate: number | null | undefined): number {
  if (rate == null || Number.isNaN(rate)) return DEFAULT_COMMISSION_RATE;
  if (rate > 1) return rate / 100;
  return rate;
}

export function commissionCents(
  amountCents: number,
  rate: number | null | undefined
): number {
  return Math.round(amountCents * normalizeCommissionRate(rate));
}

export function commissionRateLabel(rate: number | null | undefined): string {
  return `${Math.round(normalizeCommissionRate(rate) * 100)} %`;
}

export function buildCommissionRateByVillaId(
  villas: { id: string; commission_rate?: number | null }[]
): Map<string, number> {
  return new Map(
    villas.map((v) => [v.id, normalizeCommissionRate(v.commission_rate)])
  );
}
