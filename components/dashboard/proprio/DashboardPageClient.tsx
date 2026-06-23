"use client";

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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <DashboardWidget title="Aujourd'hui">
          <DashboardTimeline items={timelineItems} />
        </DashboardWidget>
        <DashboardAlertList alerts={taskAlerts} title="Tâches & alertes" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RevenueChart data={monthlyChartData} hasEnoughHistory={hasEnoughHistory} />
        <UpcomingBookings bookings={upcomingBookings} />
      </div>

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
