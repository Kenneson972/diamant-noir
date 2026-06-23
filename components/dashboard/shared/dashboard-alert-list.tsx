import Link from "next/link";
import { KayvilaPngIcon } from "@/components/icons/KayvilaPngIcon";
import { DashboardWidget } from "./dashboard-widget";

export type DashboardAlert = {
  href: string;
  label: string;
  icon?: "message" | "star" | "bell";
};

export function DashboardAlertList({
  alerts,
  title = "Alertes",
}: {
  alerts: DashboardAlert[];
  title?: string;
}) {
  return (
    <DashboardWidget title={title}>
      {alerts.length === 0 ? (
        <p className="text-sm text-muted">Aucune alerte.</p>
      ) : (
        <ul className="space-y-2">
          {alerts.map((alert) => (
            <li key={`${alert.href}-${alert.label}`}>
              <Link
                href={alert.href}
                className="flex items-center gap-2 text-sm text-amber-700 no-underline hover:underline"
              >
                <KayvilaPngIcon name={alert.icon ?? "message"} size={18} alt="" />
                {alert.label}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </DashboardWidget>
  );
}
