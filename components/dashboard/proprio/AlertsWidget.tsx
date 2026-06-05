import { AlertTriangle, CheckCircle2 } from "lucide-react";

interface Alert {
  severity: "high" | "medium" | "low";
  title: string;
  body?: string;
}

interface AlertsWidgetProps {
  alerts: Alert[];
}

export function AlertsWidget({ alerts }: AlertsWidgetProps) {
  if (alerts.length === 0) {
    return (
      <div className="dashboard-card">
        <span className="dashboard-eyebrow">ALERTES</span>
        <div className="mt-4 flex flex-col items-center justify-center py-8 text-center">
          <CheckCircle2 className="mb-3 h-8 w-8 text-emerald-500" aria-hidden />
          <p className="text-sm italic text-muted">Tout est calme</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-card">
      <span className="dashboard-eyebrow">ALERTES</span>

      <ul className="mt-4 space-y-2">
        {alerts.map((alert, idx) => (
          <li
            key={idx}
            className="flex items-start gap-3 rounded-lg bg-cream p-3"
          >
            <AlertTriangle
              className={`mt-0.5 h-4 w-4 shrink-0 ${
                alert.severity === "high"
                  ? "dot-alert-high"
                  : alert.severity === "medium"
                    ? "dot-alert-medium"
                    : "dot-alert-low"
              }`}
              aria-hidden
            />
            <div>
              <p className="text-sm font-medium text-navy-900">{alert.title}</p>
              {alert.body && (
                <p className="text-xs text-muted">{alert.body}</p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
