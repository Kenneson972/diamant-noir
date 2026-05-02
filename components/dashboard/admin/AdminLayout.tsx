import type { ReactNode } from "react";
import { AdminSidebar } from "./AdminSidebar";
import { OwnerHeader } from "@/components/dashboard/proprio/OwnerHeader";

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-offwhite">
      <AdminSidebar />
      <div className="pl-64">
        <OwnerHeader />
        <main className="p-8">{children}</main>
      </div>
    </div>
  );
}
