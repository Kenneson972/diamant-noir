"use client";

import { type ReactNode } from "react";
import { DashboardShell } from "@/components/dashboard/shared/DashboardShell";
import { tenantMenuItems } from "@/components/espace-client/TenantMenuItems";

export default function EspaceClientShell({ children }: { children: ReactNode }) {
  return (
    <DashboardShell role="tenant" roleLabel="Client" menu={tenantMenuItems}>
      <div className="mx-auto w-full max-w-6xl p-5 md:p-10">{children}</div>
    </DashboardShell>
  );
}
