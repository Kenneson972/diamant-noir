"use client";

import Link from "next/link";
import { KayvilaPngIcon, type KayvilaPngName } from "@/components/icons/KayvilaPngIcon";
import { KayvilaTenantWidget } from "@/components/ui/pro/kayvila-tenant-widget";

const HUB_LINKS: {
  label: string;
  sub: string;
  href: string;
  icon: KayvilaPngName;
}[] = [
  {
    label: "Checklist",
    sub: "Avant l'arrivée",
    href: "/espace-client/checklist",
    icon: "check-circle",
  },
  {
    label: "Livret",
    sub: "Wi-Fi & accès",
    href: "/espace-client/livret",
    icon: "book",
  },
  {
    label: "Messages",
    sub: "Conciergerie 7j/7",
    href: "/espace-client/messagerie",
    icon: "message",
  },
  {
    label: "Documents",
    sub: "Factures & PDF",
    href: "/espace-client/documents",
    icon: "doc",
  },
  {
    label: "Favoris",
    sub: "Villas sauvegardées",
    href: "/espace-client/favoris",
    icon: "heart",
  },
  {
    label: "Demandes",
    sub: "Services à la carte",
    href: "/espace-client/demandes",
    icon: "sparkle",
  },
];

export function TenantQuickLinks() {
  return (
    <KayvilaTenantWidget title="Accès rapides">
      <ul className="m-0 grid list-none grid-cols-2 gap-3 p-0 sm:grid-cols-3">
        {HUB_LINKS.map(({ label, sub, href, icon }) => (
          <li key={href}>
            <Link
              href={href}
              className="group flex min-h-[108px] flex-col justify-between border border-navy/8 bg-offwhite/40 p-4 no-underline transition-all duration-200 hover:border-gold/35 hover:bg-gold/[0.04] hover:shadow-[0_8px_24px_rgba(13,27,42,0.06)] focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/40"
            >
              <KayvilaPngIcon
                name={icon}
                size={22}
                alt=""
                className="text-navy/55 transition-colors group-hover:text-gold"
                aria-hidden
              />
              <span>
                <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-navy">
                  {label}
                </span>
                <span className="mt-1 block font-display text-sm italic leading-snug text-navy/45">
                  {sub}
                </span>
              </span>
              <KayvilaPngIcon
                name="arrow-right"
                size={16}
                alt=""
                className="self-end text-navy/35 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100"
                aria-hidden
              />
            </Link>
          </li>
        ))}
      </ul>
    </KayvilaTenantWidget>
  );
}
