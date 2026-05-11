"use client";

import { useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardSidebar } from "./DashboardSidebar";
import { DashboardHeader } from "./DashboardHeader";
import type { SidebarMenuItem } from "./DashboardSidebar";

interface DashboardShellProps {
  role: "admin" | "owner" | "tenant";
  roleLabel: string;
  menu: SidebarMenuItem[];
  children: ReactNode;
}

export function DashboardShell({
  role,
  roleLabel,
  menu,
  children,
}: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const { user, signOut } = useAuth();

  const displayName =
    user?.user_metadata?.full_name ?? user?.email ?? roleLabel;
  const userEmail = user?.email;

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const fullBleed = role === "admin" && pathname.startsWith("/admin/assistant");

  return (
    <>
      <a
        href={`#${role}-main`}
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-navy focus:px-4 focus:py-2 focus:text-sm focus:text-white focus:shadow-lg"
      >
        Aller au contenu principal
      </a>

      <div className="min-h-dvh bg-offwhite font-body-dashboard text-navy antialiased">
        <DashboardSidebar
          role={role}
          roleLabel={roleLabel}
          menu={menu}
          userName={displayName}
          userEmail={userEmail}
          onSignOut={handleSignOut}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <div className="flex min-h-dvh flex-col md:pl-64">
          <DashboardHeader
            roleLabel={roleLabel}
            displayName={displayName}
            onToggleSidebar={() => setSidebarOpen((v) => !v)}
            userId={user?.id}
            role={role}
          />
          <main
            id={`${role}-main`}
            className={cn(
              "flex-1",
              fullBleed
                ? "h-[calc(100dvh-4rem)] overflow-hidden p-0 md:h-[calc(100dvh-4.25rem)]"
                : "px-4 py-6 md:px-8 md:py-8"
            )}
          >
            {children}
          </main>
        </div>
      </div>
    </>
  );
}
