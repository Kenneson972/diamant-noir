"use client";

import { useState, useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardSidebar } from "./DashboardSidebar";
import { DashboardHeader } from "./DashboardHeader";
import { AdminCommandPalette } from "@/components/dashboard/admin/AdminCommandPalette";
import type { SidebarMenuItem } from "./DashboardSidebar";

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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const { user, signOut } = useAuth();

  // Init depuis localStorage (SSR-safe : useEffect uniquement côté client)
  useEffect(() => {
    const saved = localStorage.getItem(SIDEBAR_STORAGE_KEY);
    if (saved === "true") setCollapsed(true);
  }, []);

  const handleToggleCollapsed = () => {
    setCollapsed((v) => {
      const next = !v;
      localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
      return next;
    });
  };

  const displayName =
    user?.user_metadata?.full_name ?? user?.email ?? roleLabel;
  const userEmail = user?.email;

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  return (
    <>
      {role === "admin" ? <AdminCommandPalette /> : null}
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
          collapsed={collapsed}
          onToggleCollapsed={handleToggleCollapsed}
        />
        <div
          className={cn(
            "flex min-h-dvh flex-col transition-[padding] duration-300",
            collapsed ? "md:pl-16" : "md:pl-64"
          )}
        >
          <DashboardHeader
            roleLabel={roleLabel}
            displayName={displayName}
            onToggleSidebar={() => setSidebarOpen((v) => !v)}
            userId={user?.id}
            role={role}
            menu={menu}
            pathname={pathname}
          />
          <main
            id={`${role}-main`}
            className="flex-1 px-4 py-6 md:px-8 md:py-8"
          >
            {children}
          </main>
        </div>
      </div>
    </>
  );
}
