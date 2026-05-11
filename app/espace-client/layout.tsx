"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase";
import { DashboardShell } from "@/components/dashboard/shared/DashboardShell";
import { tenantMenuItems } from "@/components/espace-client/TenantMenuItems";

export default function EspaceClientLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const supabase = getSupabaseBrowser();

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) {
        const redirect = pathname || "/espace-client";
        router.replace(`/login?redirect=${encodeURIComponent(redirect)}`);
        return;
      }
      setLoading(false);
    })();
  }, [supabase, router, pathname]);

  if (loading) {
    return (
      <div className="min-h-dvh bg-offwhite flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold/20 border-t-gold rounded-full animate-spin" />
      </div>
    );
  }

  if (!supabase) {
    return (
      <div className="min-h-dvh bg-offwhite flex items-center justify-center p-6">
        <p className="text-sm text-navy/60">Configuration indisponible.</p>
      </div>
    );
  }

  return (
    <DashboardShell role="tenant" roleLabel="Client" menu={tenantMenuItems}>
      <div className="p-5 md:p-10 max-w-5xl w-full mx-auto">{children}</div>
    </DashboardShell>
  );
}
