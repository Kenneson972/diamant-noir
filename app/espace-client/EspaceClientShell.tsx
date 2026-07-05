"use client";

import { useMemo, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/shared/DashboardShell";
import { tenantMenuItems } from "@/components/espace-client/TenantMenuItems";

const KICKER_BY_ROUTE: Record<string, string> = {
  "/espace-client": "CONCIERGERIE KAYVILA",
  "/espace-client/livret": "VOTRE VILLA",
  "/espace-client/favoris": "VOS COUPS DE CŒUR",
  "/espace-client/messagerie": "VOTRE CONCIERGE",
  "/espace-client/notifications": "RESTEZ INFORMÉ",
  "/espace-client/demandes": "PENDANT VOTRE SÉJOUR",
  "/espace-client/checklist": "VOTRE SÉJOUR",
  "/espace-client/profil": "VOTRE COMPTE",
  "/espace-client/documents": "VOTRE DOSSIER",
  "/espace-client/conciergerie": "NOUS JOINDRE",
};

const DEFAULT_KICKER = "CLIENT";

export default function EspaceClientShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const kicker = useMemo(() => {
    // Match exact path first, then fall back to prefix match for sub-routes
    if (KICKER_BY_ROUTE[pathname]) return KICKER_BY_ROUTE[pathname];
    // Check parent paths (e.g., /espace-client/reservations/xxx → CONCIERGERIE KAYVILA)
    for (const [route, label] of Object.entries(KICKER_BY_ROUTE)) {
      if (pathname.startsWith(route + "/")) return label;
    }
    return DEFAULT_KICKER;
  }, [pathname]);

  return (
    <DashboardShell role="tenant" roleLabel={kicker} menu={tenantMenuItems}>
      <div className="mx-auto w-full max-w-6xl p-5 md:p-10">{children}</div>
    </DashboardShell>
  );
}
