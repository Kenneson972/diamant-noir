interface RevenueSummaryProps {
  totalNet: number;
  totalGross: number;
  totalCommission: number;
}

function formatEur(amount: number): string {
  return `${amount.toLocaleString("fr-FR")} €`;
}

export function RevenueSummary({
  totalNet,
  totalGross,
  totalCommission,
}: RevenueSummaryProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div className="dashboard-card">
        <span className="dashboard-eyebrow">Reversement net ce mois</span>
        <p className="mt-1 font-display text-2xl font-bold text-navy-900">
          {formatEur(totalNet)}
        </p>
      </div>

      <div className="dashboard-card">
        <span className="dashboard-eyebrow">Brut séjours</span>
        <p className="mt-1 font-display text-2xl font-bold text-navy-900">
          {formatEur(totalGross)}
        </p>
      </div>

      <div className="dashboard-card">
        <span className="dashboard-eyebrow">Commission Kayvila</span>
        <p className="mt-1 font-display text-2xl font-bold text-navy-900">
          {formatEur(totalCommission)}
        </p>
      </div>
    </div>
  );
}
