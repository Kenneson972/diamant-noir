"use client";

import { Tabs } from "@heroui/react";
import { BarChart3, User } from "lucide-react";
import { KayvilaPngIcon } from "@/components/icons/KayvilaPngIcon";
import { OwnerInfoTab } from "./OwnerInfoTab";
import { OwnerVillasTab } from "./OwnerVillasTab";
import { OwnerRevenueTab } from "./OwnerRevenueTab";
import { OwnerStripeTab } from "./OwnerStripeTab";

interface Props {
  ownerId: string;
  profile: any;
  villas: any[];
  bookings: any[];
  stats: any;
}

const tabLabelClasses =
  "flex items-center gap-1.5 text-xs font-medium text-navy/60 data-[selected=true]:text-navy";

export function OwnerTabs({ ownerId, profile, villas, bookings, stats }: Props) {
  return (
    <Tabs className="w-full">
      <Tabs.ListContainer>
        <Tabs.List aria-label="Détail propriétaire">
          <Tabs.Tab id="infos">
            <span className={tabLabelClasses}>
              <User size={14} /> Infos
            </span>
            <Tabs.Indicator />
          </Tabs.Tab>
          <Tabs.Tab id="villas">
            <span className={tabLabelClasses}>
              <KayvilaPngIcon name="villa" size={18} alt="" /> Villas
            </span>
            <Tabs.Indicator />
          </Tabs.Tab>
          <Tabs.Tab id="revenus">
            <span className={tabLabelClasses}>
              <BarChart3 size={16} strokeWidth={1.5} /> Revenus
            </span>
            <Tabs.Indicator />
          </Tabs.Tab>
          <Tabs.Tab id="stripe">
            <span className={tabLabelClasses}>
              <KayvilaPngIcon name="credit-card" size={18} alt="" /> Stripe & Litiges
            </span>
            <Tabs.Indicator />
          </Tabs.Tab>
        </Tabs.List>
      </Tabs.ListContainer>

      <Tabs.Panel id="infos" className="pt-6">
        <OwnerInfoTab profile={profile} />
      </Tabs.Panel>
      <Tabs.Panel id="villas" className="pt-6">
        <OwnerVillasTab ownerId={ownerId} villas={villas} />
      </Tabs.Panel>
      <Tabs.Panel id="revenus" className="pt-6">
        <OwnerRevenueTab
          ownerId={ownerId}
          villas={villas}
          bookings={bookings}
          totalRevenueCents={stats.totalRevenueCents}
          totalBookings={stats.totalBookings}
        />
      </Tabs.Panel>
      <Tabs.Panel id="stripe" className="pt-6">
        <OwnerStripeTab profile={profile} />
      </Tabs.Panel>
    </Tabs>
  );
}
