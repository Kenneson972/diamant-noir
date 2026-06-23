import Link from "next/link";
import type { ReactNode } from "react";
import { KayvilaWidget } from "@/components/ui/pro";

type DashboardWidgetProps = {
  title: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
  children: ReactNode;
  className?: string;
};

export function DashboardWidget({
  title,
  description,
  actionHref,
  actionLabel = "Voir tout →",
  children,
  className,
}: DashboardWidgetProps) {
  return (
    <KayvilaWidget title={title} description={description} className={className}>
      {actionHref ? (
        <div className="-mt-2 mb-4 flex justify-end">
          <Link
            href={actionHref}
            className="text-[11px] font-semibold uppercase tracking-wider text-gold hover:underline"
          >
            {actionLabel}
          </Link>
        </div>
      ) : null}
      {children}
    </KayvilaWidget>
  );
}
