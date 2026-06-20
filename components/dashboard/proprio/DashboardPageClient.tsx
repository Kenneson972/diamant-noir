"use client";

import type { Villa, BookingStatus } from "@/types/domain";
import { KpiRow, type KpiItem } from "@/components/dashboard/proprio/KpiRow";
import { DashboardCopilotChat } from "@/components/dashboard/DashboardCopilotChat";
import { ProactiveNotification } from "@/components/dashboard/ProactiveNotification";
import { StripeConnectButton } from "@/components/dashboard/proprio/StripeConnectButton";
import { TodayTimeline } from "@/components/dashboard/proprio/TodayTimeline";
import { AlertsWidget } from "@/components/dashboard/proprio/AlertsWidget";
import { UpcomingBookings } from "@/components/dashboard/proprio/UpcomingBookings";
import { RevenueChart } from "@/components/dashboard/proprio/RevenueChart";

type DashboardPageClientProps = {
  villas: Villa[];
  user: { id: string };
  isStripeConnected: boolean;
  connectDone: boolean;
  kpiItems: KpiItem[];
  todayEventsList: Array<{
    kind: "check_in" | "check_out" | "stay";
    villa_name: string;
    guest_name: string;
    start_date: string;
    end_date: string;
  }>;
  alerts: Array<{
    severity: "high" | "medium" | "low";
    title: string;
    body: string | undefined;
  }>;
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
    villas,
    user,
    isStripeConnected,
    connectDone,
    kpiItems,
    todayEventsList,
    alerts,
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
        <p className="text-sm text-muted">Apercu de votre activite</p>
      </div>

      {/* Digest proactif du jour */}
      <ProactiveNotification />

      {/* Banniere Stripe Connect */}
      <StripeConnectButton
        ownerId={user.id}
        isOnboarded={isStripeConnected}
        connectDone={connectDone}
      />

      <KpiRow items={kpiItems} cols={2} />

      {/* Copilot Diamant integre */}
      <DashboardCopilotChat />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <TodayTimeline events={todayEventsList} />
        <AlertsWidget alerts={alerts} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RevenueChart data={monthlyChartData} hasEnoughHistory={hasEnoughHistory} />
        <UpcomingBookings bookings={upcomingBookings} />
      </div>
    </div>
  );
}
