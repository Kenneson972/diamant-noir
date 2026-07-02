import Link from "next/link";
import { DashboardNavIcon } from "@/components/dashboard/shared/dashboard-nav-icon";
import { cn } from "@/lib/utils";

type QuickAction = {
  label: string;
  href: string;
  icon: string;
  /** Un seul primaire par écran — l'or est un signal, pas une décoration. */
  primary?: boolean;
};

export function QuickActions({ actions }: { actions: QuickAction[] }) {
  if (actions.length === 0) return null;
  return (
    <section aria-label="Actions rapides" data-testid="quick-actions">
      <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-navy/45">
        Actions rapides
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        {actions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className={cn(
              "inline-flex min-h-[48px] items-center justify-center gap-2 rounded-lg px-5 text-sm font-semibold no-underline transition-transform active:scale-[0.98] sm:flex-1",
              action.primary
                ? "bg-gold text-white hover:bg-gold/90"
                : "border border-navy/15 bg-white text-navy hover:border-navy/30"
            )}
          >
            <DashboardNavIcon name={action.icon} size={18} />
            {action.label}
          </Link>
        ))}
      </div>
    </section>
  );
}
