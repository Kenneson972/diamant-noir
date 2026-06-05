"use client";

import Link from "next/link";
import { CheckSquare, Wifi, FileDown, ArrowRight } from "lucide-react";
import { KayvilaTenantWidget } from "@/components/ui/pro/kayvila-tenant-widget";

const LINKS = [
  {
    label: "Checklist",
    sub: "Avant l'arrivée",
    href: "/espace-client/checklist",
    icon: CheckSquare,
  },
  {
    label: "Wi-Fi & accès",
    sub: "Codes du livret",
    href: "/espace-client/livret",
    icon: Wifi,
  },
  {
    label: "Livret PDF",
    sub: "Télécharger",
    href: "/espace-client/livret/print",
    icon: FileDown,
  },
] as const;

export function TenantQuickLinks() {
  return (
    <KayvilaTenantWidget title="Préparer votre arrivée" description="Accès directs aux infos utiles">
      <ul className="m-0 grid list-none gap-0 p-0 sm:grid-cols-3">
        {LINKS.map(({ label, sub, href, icon: Icon }, index) => (
          <li
            key={label}
            className={index > 0 ? "border-t border-navy/6 sm:border-t-0 sm:border-l" : undefined}
          >
            <Link
              href={href}
              className="group flex min-h-[88px] flex-col justify-center gap-2 px-4 py-5 no-underline transition-colors hover:bg-gold/[0.04] sm:px-5"
            >
              <Icon
                size={18}
                strokeWidth={1.25}
                className="text-navy/25 transition-colors group-hover:text-gold/80"
                aria-hidden
              />
              <span>
                <span className="block text-[10px] font-bold uppercase tracking-[0.22em] text-navy">
                  {label}
                </span>
                <span className="mt-0.5 block font-display text-sm italic text-navy/45">{sub}</span>
              </span>
              <ArrowRight
                size={12}
                className="text-navy/15 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100"
                aria-hidden
              />
            </Link>
          </li>
        ))}
      </ul>
    </KayvilaTenantWidget>
  );
}
