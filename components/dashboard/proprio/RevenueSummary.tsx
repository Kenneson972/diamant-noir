import { cn } from "@/lib/utils";

interface RevenueSummaryProps {
  totalMonth: number;
  totalYear: number;
  averagePerNight: number;
  comparisonMonth: number;
}

function formatEur(amount: number): string {
  return `${amount.toLocaleString("fr-FR")} €`;
}

export function RevenueSummary({
  totalMonth,
  totalYear,
  averagePerNight,
  comparisonMonth,
}: RevenueSummaryProps) {
  const trend =
    comparisonMonth > 0
      ? Math.round(((totalMonth - comparisonMonth) / comparisonMonth) * 100)
      : 0;

  const isPositive = trend >= 0;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div className="dashboard-card">
        <span className="dashboard-eyebrow">Ce mois</span>
        <p className="mt-1 font-display text-2xl font-bold text-navy-900">
          {formatEur(totalMonth)}
        </p>
        <span
          className={cn(
            "mt-1 inline-flex items-center gap-1 text-xs font-medium",
            isPositive ? "text-emerald-600" : "text-red-500"
          )}
        >
          {isPositive ? "↑" : "↓"} {Math.abs(trend)}% vs mois précédent
        </span>
      </div>

      <div className="dashboard-card">
        <span className="dashboard-eyebrow">Cette année</span>
        <p className="mt-1 font-display text-2xl font-bold text-navy-900">
          {formatEur(totalYear)}
        </p>
      </div>

      <div className="dashboard-card">
        <span className="dashboard-eyebrow">Prix moyen / nuit</span>
        <p className="mt-1 font-display text-2xl font-bold text-navy-900">
          {formatEur(averagePerNight)}
        </p>
      </div>
    </div>
  );
}
