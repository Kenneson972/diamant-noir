"use client";

import { useMemo, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/shared/DashboardShell";
import { tenantMenuItems } from "@/components/espace-client/TenantMenuItems";
import { useLocale } from "@/contexts/LocaleContext";

const KICKER_KEY_BY_ROUTE: Record<string, string> = {
  "/espace-client": "client.shell_kicker_home",
  "/espace-client/livret": "client.shell_kicker_livret",
  "/espace-client/favoris": "client.shell_kicker_favoris",
  "/espace-client/messagerie": "client.shell_kicker_messagerie",
  "/espace-client/notifications": "client.shell_kicker_notifications",
  "/espace-client/demandes": "client.shell_kicker_demandes",
  "/espace-client/checklist": "client.shell_kicker_checklist",
  "/espace-client/profil": "client.shell_kicker_profil",
  "/espace-client/documents": "client.shell_kicker_documents",
  "/espace-client/conciergerie": "client.shell_kicker_conciergerie",
};

const DEFAULT_KICKER_KEY = "client.shell_kicker_default";

export default function EspaceClientShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { t } = useLocale();

  const kickerKey = useMemo(() => {
    // Match exact path first, then fall back to prefix match for sub-routes
    if (KICKER_KEY_BY_ROUTE[pathname]) return KICKER_KEY_BY_ROUTE[pathname];
    // Check parent paths (e.g., /espace-client/reservations/xxx → client.shell_kicker_home)
    for (const [route, key] of Object.entries(KICKER_KEY_BY_ROUTE)) {
      if (pathname.startsWith(route + "/")) return key;
    }
    return DEFAULT_KICKER_KEY;
  }, [pathname]);

  const kicker = t(kickerKey);

  return (
    <DashboardShell role="tenant" roleLabel={kicker} menu={tenantMenuItems}>
      <div className="mx-auto w-full max-w-6xl min-w-0 p-5 md:p-10">{children}</div>
    </DashboardShell>
  );
}
