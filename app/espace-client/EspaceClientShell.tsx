"use client";

import { type ReactNode } from "react";
import { DashboardShell } from "@/components/dashboard/shared/DashboardShell";
import { tenantMenuItems } from "@/components/espace-client/TenantMenuItems";

export default function EspaceClientShell({ children }: { children: ReactNode }) {
  return (
    <DashboardShell role="tenant" roleLabel="Client" menu={tenantMenuItems}>
      <div className="p-5 md:p-10 max-w-5xl w-full mx-auto">{children}</div>
    </DashboardShell>
  );
}
