"use client";

import Link from "next/link";
import { Timeline } from "@heroui-pro/react/timeline";
import { KayvilaPngIcon } from "@/components/icons/KayvilaPngIcon";
import type { KayvilaPngName } from "@/components/icons/KayvilaPngIcon";

export type DashboardTimelineItem = {
  id: string;
  title: string;
  subtitle?: string;
  timestamp?: string;
  icon?: KayvilaPngName;
  status?: "success" | "warning" | "danger" | "current";
  href?: string;
};

export function DashboardTimeline({ items }: { items: DashboardTimelineItem[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-muted">Aucune activité récente.</p>;
  }

  return (
    <Timeline>
      {items.map((item) => (
        <Timeline.Item key={item.id} align="center" status={item.status}>
          <Timeline.Marker aria-hidden="true">
            {item.icon ? <KayvilaPngIcon name={item.icon} size={20} alt="" /> : null}
          </Timeline.Marker>
          <Timeline.Content>
            {item.href ? (
              <Link href={item.href} className="block no-underline hover:opacity-80">
                <p className="text-sm font-medium text-navy">{item.title}</p>
                {item.subtitle ? (
                  <p className="text-[11px] text-muted">{item.subtitle}</p>
                ) : null}
              </Link>
            ) : (
              <>
                <p className="text-sm font-medium text-navy">{item.title}</p>
                {item.subtitle ? (
                  <p className="text-[11px] text-muted">{item.subtitle}</p>
                ) : null}
              </>
            )}
            {item.timestamp ? (
              <p className="text-[11px] text-navy/40">{item.timestamp}</p>
            ) : null}
          </Timeline.Content>
        </Timeline.Item>
      ))}
    </Timeline>
  );
}
