"use client";

import Link from "next/link";
import type { Villa, BookingStatus } from "@/types/domain";
import { DashboardKpiGroup } from "@/components/dashboard/shared/dashboard-kpi-group";
import type { KpiItem } from "@/components/dashboard/proprio/KpiRow";
import { DashboardCopilotChat } from "@/components/dashboard/DashboardCopilotChat";
import { ProactiveNotification } from "@/components/dashboard/ProactiveNotification";
import { StripeConnectButton } from "@/components/dashboard/proprio/StripeConnectButton";
import { DashboardWidget } from "@/components/dashboard/shared/dashboard-widget";
import { DashboardTimeline } from "@/components/dashboard/shared/dashboard-timeline";
import type { DashboardTimelineItem } from "@/components/dashboard/shared/dashboard-timeline";
import { DashboardAlertList } from "@/components/dashboard/shared/dashboard-alert-list";
import type { DashboardAlert } from "@/components/dashboard/shared/dashboard-alert-list";
import { UpcomingBookings } from "@/components/dashboard/proprio/UpcomingBookings";
import { RevenueChart } from "@/components/dashboard/proprio/RevenueChart";
import { OnboardingCard } from "@/components/dashboard/proprio/OnboardingCard";

type DashboardPageClientProps = {
  villas: Villa[];
  user: { id: string };
  isStripeConnected: boolean;
  connectDone: boolean;
  kpiItems: KpiItem[];
  timelineItems: DashboardTimelineItem[];
  taskAlerts: DashboardAlert[];
  upcomingBookings: Array<{
    id: string;
    villa_id: string;
    guest_name: string | null;
    start_date: string;
    end_date: string;
    status: BookingStatus;
  }>;
  monthlyChartData: Array<{ month: string; revenue: number; isCurrent: boolean }>;
  hasEnoughHistory: boolean;
};

export function DashboardPageClient(props: DashboardPageClientProps) {
  const {
    user,
    villas,
    isStripeConnected,
    connectDone,
    kpiItems,
    timelineItems,
    taskAlerts,
    upcomingBookings,
    monthlyChartData,
    hasEnoughHistory,
  } = props;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-navy-900">
          Tableau de bord
        </h1>
        <p className="text-sm text-muted">Aperçu de votre activité</p>
      </div>

      <ProactiveNotification />

      <StripeConnectButton
        ownerId={user.id}
        isOnboarded={isStripeConnected}
        connectDone={connectDone}
      />

      <DashboardKpiGroup items={kpiItems} />

      {timelineItems.length > 0 || taskAlerts.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <DashboardWidget title="Aujourd'hui">
            <DashboardTimeline items={timelineItems} />
          </DashboardWidget>
          <DashboardAlertList alerts={taskAlerts} title="Tâches & alertes" />
        </div>
      ) : (
        <OnboardingCard />
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RevenueChart data={monthlyChartData} hasEnoughHistory={hasEnoughHistory} />
        <UpcomingBookings bookings={upcomingBookings} />
      </div>

      <DashboardWidget title="Mes villas" actionHref="/dashboard/villas">
        <ul className="divide-y divide-navy/5">
          {villas.slice(0, 3).map((villa) => (
            <li key={villa.id}>
              <Link
                href={`/dashboard/villas/${villa.id}`}
                className="flex min-h-[44px] items-center justify-between gap-3 py-2 text-sm text-navy no-underline transition-colors hover:text-gold"
              >
                <span className="truncate font-medium">{villa.name}</span>
                <span className="text-[11px] uppercase tracking-wider text-navy/40">Gérer</span>
              </Link>
            </li>
          ))}
        </ul>
      </DashboardWidget>

      <details className="group rounded-xl border border-navy/10 bg-white shadow-sm">
        <summary className="cursor-pointer list-none px-6 py-4 font-display text-lg font-semibold text-navy marker:content-none [&::-webkit-details-marker]:hidden">
          <span className="flex items-center justify-between gap-2">
            Diamant — Copilot Kayvila
            <span className="text-[11px] font-normal uppercase tracking-wider text-muted group-open:hidden">
              Ouvrir
            </span>
            <span className="hidden text-[11px] font-normal uppercase tracking-wider text-muted group-open:inline">
              Replier
            </span>
          </span>
        </summary>
        <div className="border-t border-navy/5 px-2 pb-4 pt-2">
          <DashboardCopilotChat />
        </div>
      </details>
    </div>
  );
}
