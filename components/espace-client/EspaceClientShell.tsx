"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

// ── Icônes SVG thin-line (stroke-width 1) ──────────────────────────────────

function IconSejour({ active }: { active: boolean }) {
  const stroke = active ? "#D4AF37" : "rgba(13,27,42,0.22)";
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M8 2L14 7v7H2V7L8 2z" stroke={stroke} strokeWidth="1" />
      <rect x="5.5" y="10" width="5" height="4" stroke={stroke} strokeWidth="1" />
    </svg>
  );
}
function IconLivret({ active }: { active: boolean }) {
  const stroke = active ? "#D4AF37" : "rgba(13,27,42,0.22)";
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="2" y="2" width="12" height="12" rx="1" stroke={stroke} strokeWidth="1" />
      <path d="M8 2v12M5 5h2M5 8h2M5 11h2" stroke={stroke} strokeWidth="1" />
    </svg>
  );
}
function IconMessages({ active }: { active: boolean }) {
  const stroke = active ? "#D4AF37" : "rgba(13,27,42,0.22)";
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M2 3h12v8H2z" stroke={stroke} strokeWidth="1" />
      <path d="M2 11l3 3h3" stroke={stroke} strokeWidth="1" />
    </svg>
  );
}
function IconDocuments({ active }: { active: boolean }) {
  const stroke = active ? "#D4AF37" : "rgba(13,27,42,0.22)";
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M3 2h7l3 3v9H3z" stroke={stroke} strokeWidth="1" />
      <path d="M10 2v3h3M5 8h6M5 11h4" stroke={stroke} strokeWidth="1" />
    </svg>
  );
}
function IconConciergerie({ active }: { active: boolean }) {
  const stroke = active ? "#D4AF37" : "rgba(13,27,42,0.22)";
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="8" cy="6" r="3" stroke={stroke} strokeWidth="1" />
      <path d="M3 14c0-2.8 2.2-4 5-4s5 1.2 5 4" stroke={stroke} strokeWidth="1" />
    </svg>
  );
}

// ── Config nav ──────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  {
    href: "/espace-client",
    label: "Séjour",
    exact: true,
    Icon: IconSejour,
  },
  {
    href: "/espace-client/livret",
    label: "Livret",
    exact: false,
    Icon: IconLivret,
  },
  {
    href: "/espace-client/messagerie",
    label: "Messages",
    exact: false,
    Icon: IconMessages,
    badge: false,
  },
  {
    href: "/espace-client/documents",
    label: "Documents",
    exact: false,
    Icon: IconDocuments,
  },
  {
    href: "/espace-client/conciergerie",
    label: "Conciergerie",
    exact: false,
    Icon: IconConciergerie,
  },
] as const;

const BOTTOM_NAV = NAV_ITEMS.slice(0, 4);

// ── Types ────────────────────────────────────────────────────────────────────

interface EspaceClientShellProps {
  children: ReactNode;
  userName?: string;
  userInitial?: string;
  onSignOut: () => void;
}

// ── Composant principal ──────────────────────────────────────────────────────

export function EspaceClientShell({
  children,
  userName,
  userInitial,
  onSignOut,
}: EspaceClientShellProps) {
  const pathname = usePathname();

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname?.startsWith(href);

  return (
    <div className="flex min-h-screen bg-[#FAFAF8]">
      {/* ── Sidebar desktop ── */}
      <aside
        className="hidden md:flex w-[188px] flex-col bg-white border-r border-[rgba(13,27,42,0.07)] shrink-0"
        aria-label="Navigation espace client"
      >
        {/* Brand */}
        <div className="px-6 pt-8 pb-0">
          <p className="text-[7px] font-medium tracking-[0.28em] uppercase text-[#D4AF37] opacity-80 mb-1">
            Diamant Noir
          </p>
          <p className="font-display text-[15px] font-normal text-[#0D1B2A]">
            Espace Client
          </p>
        </div>

        {/* Séparateur */}
        <div className="mx-6 mt-5 mb-5 h-px bg-[rgba(13,27,42,0.07)]" />

        {/* Nav */}
        <nav className="flex flex-col gap-[1px] flex-1">
          {NAV_ITEMS.map(({ href, label, exact, Icon }) => {
            const active = isActive(href, exact);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={[
                  "flex items-center gap-[11px] px-6 py-[10px] relative",
                  "transition-colors duration-150",
                  active
                    ? "before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-[2px] before:h-[20px] before:bg-[#D4AF37] before:rounded-r-[1px]"
                    : "hover:bg-[rgba(13,27,42,0.025)]",
                ].join(" ")}
              >
                <Icon active={active} />
                <span
                  className={[
                    "text-[9px] tracking-[0.2em] uppercase",
                    active
                      ? "text-[#0D1B2A] font-medium"
                      : "text-[rgba(13,27,42,0.32)] font-normal",
                  ].join(" ")}
                >
                  {label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Footer utilisateur */}
        <div className="mx-6 mt-auto pt-5 pb-7 border-t border-[rgba(13,27,42,0.07)] flex items-center gap-[10px]">
          <div
            className="w-[28px] h-[28px] rounded-full flex items-center justify-center text-[11px] shrink-0"
            style={{ background: "linear-gradient(135deg, #D4AF37, #9A7B24)", color: "#0D1B2A", fontFamily: "var(--font-playfair)" }}
          >
            {userInitial ?? "?"}
          </div>
          <div className="min-w-0 flex-1">
            {userName && (
              <p className="font-cormorant text-[13px] font-light text-[#0D1B2A] truncate leading-tight">
                {userName}
              </p>
            )}
            <button
              type="button"
              onClick={onSignOut}
              className="text-[8px] tracking-[0.14em] uppercase text-[rgba(13,27,42,0.3)] hover:text-[rgba(13,27,42,0.6)] transition-colors mt-0.5"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </aside>

      {/* ── Contenu principal ── */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Topbar mobile uniquement */}
        <header className="md:hidden sticky top-0 z-40 h-[52px] bg-white border-b border-[rgba(13,27,42,0.06)] flex items-center justify-between px-4">
          <p className="font-display text-[14px] font-normal text-[#0D1B2A]">
            Espace Client
          </p>
          <div
            className="w-[28px] h-[28px] rounded-full flex items-center justify-center text-[11px] shrink-0 cursor-pointer"
            style={{ background: "linear-gradient(135deg, #D4AF37, #9A7B24)", color: "#0D1B2A", fontFamily: "var(--font-playfair)", display: "flex", alignItems: "center", justifyContent: "center" }}
            onClick={onSignOut}
            title="Déconnexion"
          >
            {userInitial ?? "?"}
          </div>
        </header>

        {/* Zone contenu */}
        <main className="flex-1 min-w-0 pb-[72px] md:pb-0">
          {children}
        </main>

        {/* ── Bottom bar mobile ── */}
        <nav
          className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[rgba(13,27,42,0.07)] flex justify-around items-center px-2 pt-[10px]"
          style={{ paddingBottom: "calc(0.625rem + env(safe-area-inset-bottom))" }}
          aria-label="Navigation principale"
        >
          {BOTTOM_NAV.map(({ href, label, exact, Icon }) => {
            const active = isActive(href, exact);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className="flex flex-col items-center gap-1 min-w-[44px] min-h-[44px] justify-center"
              >
                <div style={{ opacity: active ? 1 : 0.22 }}>
                  <Icon active={active} />
                </div>
                <span
                  className={[
                    "text-[6px] tracking-[0.12em] uppercase",
                    active ? "text-[#D4AF37]" : "text-[rgba(13,27,42,0.4)]",
                  ].join(" ")}
                >
                  {label}
                </span>
                {active && (
                  <span className="w-[3px] h-[3px] rounded-full bg-[#D4AF37]" aria-hidden />
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
