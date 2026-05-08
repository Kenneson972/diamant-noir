"use client";

import { useState, type ReactNode } from "react";
import { AdminSidebar } from "./AdminSidebar";
import { AdminHeader } from "./AdminHeader";
import { AdminMain } from "./AdminMain";

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-dvh bg-offwhite font-body-dashboard text-navy antialiased">
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-h-dvh flex-col md:pl-64">
        <AdminHeader onToggleSidebar={() => setSidebarOpen((v) => !v)} />
        <AdminMain>{children}</AdminMain>
      </div>
    </div>
  );
}
