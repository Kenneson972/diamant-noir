"use client";

import { useState, useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@heroui-pro/react/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { KayvilaSidebarPanel } from "@/components/dashboard/shared/kayvila-sidebar-panel";
import { DashboardHeader } from "./DashboardHeader";
import { MobileBottomNav } from "./MobileBottomNav";
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
    // Après déconnexion : retour au site public (absolu en prod — sur le
    // sous-domaine admin, "/" relatif ramènerait vers le dashboard)
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
    router.push(siteUrl || "/");
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
        className="bg-offwhite font-body-dashboard text-navy antialiased"
      >
        <a
          href={`#${role}-main`}
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-navy focus:px-4 focus:py-2 focus:text-sm focus:text-white focus:shadow-lg"
        >
          Aller au contenu principal
        </a>

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
            className="flex-1 min-w-0 px-4 py-6 pb-[calc(6rem+env(safe-area-inset-bottom))] md:px-8 md:py-8 md:pb-8"
          >
            {children}
          </main>
          <MobileBottomNav role={role} />
        </Sidebar.Main>
      </Sidebar.Provider>
    </>
  );
}
