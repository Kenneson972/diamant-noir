"use client";

import { useState, useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@heroui-pro/react/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { KayvilaSidebarPanel } from "@/components/dashboard/shared/kayvila-sidebar-panel";
import { DashboardHeader } from "./DashboardHeader";
import { AdminCommandPalette } from "@/components/dashboard/admin/AdminCommandPalette";
import type { SidebarMenuItem } from "./dashboard-sidebar-types";

const SIDEBAR_STORAGE_KEY = "kayvila-sidebar-collapsed";

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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const router = useRouter();
  const { user, signOut } = useAuth();

  useEffect(() => {
    const saved = localStorage.getItem(SIDEBAR_STORAGE_KEY);
    if (saved === "true") setSidebarOpen(false);
  }, []);

  const displayName =
    user?.user_metadata?.full_name ?? user?.email ?? roleLabel;
  const userEmail = user?.email;

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const handleOpenChange = (open: boolean) => {
    setSidebarOpen(open);
    localStorage.setItem(SIDEBAR_STORAGE_KEY, String(!open));
  };

  return (
    <>
      {role === "admin" ? <AdminCommandPalette /> : null}
      <Sidebar.Provider
        collapsible="icon"
        navigate={router.push}
        open={sidebarOpen}
        toggleShortcut={false}
        onOpenChange={handleOpenChange}
      >
        <a
          href={`#${role}-main`}
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-navy focus:px-4 focus:py-2 focus:text-sm focus:text-white focus:shadow-lg"
        >
          Aller au contenu principal
        </a>

        <div className="min-h-dvh bg-offwhite font-body-dashboard text-navy antialiased">
          <KayvilaSidebarPanel
            role={role}
            roleLabel={roleLabel}
            menu={menu}
            userName={displayName}
            userEmail={userEmail}
            onSignOut={handleSignOut}
          />

          <Sidebar.Main className="flex min-h-dvh flex-col bg-offwhite">
            <DashboardHeader
              roleLabel={roleLabel}
              displayName={displayName}
              userId={user?.id}
              role={role}
              menu={menu}
            />
            <main
              id={`${role}-main`}
              className="flex-1 px-4 py-6 md:px-8 md:py-8"
            >
              {children}
            </main>
          </Sidebar.Main>
        </div>
      </Sidebar.Provider>
    </>
  );
}
