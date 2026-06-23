"use client";

import Link from "next/link";
import { Alert } from "@heroui/react";
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
        <div className="space-y-2">
          {alerts.map((alert) => (
            <Alert key={`${alert.href}-${alert.label}`} status="warning">
              <Alert.Indicator />
              <Alert.Content>
                <Link
                  href={alert.href}
                  className="inline-flex items-center gap-2 text-sm font-medium text-amber-800 no-underline hover:underline"
                >
                  <KayvilaPngIcon name={alert.icon ?? "message"} size={18} alt="" />
                  {alert.label}
                </Link>
              </Alert.Content>
            </Alert>
          ))}
        </div>
      )}
    </DashboardWidget>
  );
}
