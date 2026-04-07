"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase";
import { EspaceClientShell } from "@/components/espace-client/EspaceClientShell";
import { EspaceClientProviders } from "@/components/espace-client/EspaceClientProviders";

export default function EspaceClientLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState<string | undefined>();
  const [userInitial, setUserInitial] = useState<string>("?");
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
      const meta = session.user.user_metadata;
      setUserName(meta?.full_name || session.user.email?.split("@")[0]);
      setUserInitial((meta?.full_name?.[0] || session.user.email?.[0] || "?").toUpperCase());
      setLoading(false);
    })();
  }, [supabase, router, pathname]);

  const handleSignOut = async () => {
    await supabase?.auth.signOut();
    router.push("/");
  };

  if (loading) {
    return (
      <EspaceClientProviders>
        <div className="min-h-dvh bg-[#FAFAF8] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[rgba(212,175,55,0.2)] border-t-[#D4AF37] rounded-full animate-spin" />
        </div>
      </EspaceClientProviders>
    );
  }

  if (!supabase) {
    return (
      <EspaceClientProviders>
        <div className="min-h-dvh bg-[#FAFAF8] flex items-center justify-center p-6">
          <p className="text-sm text-[rgba(13,27,42,0.6)]">Configuration indisponible.</p>
        </div>
      </EspaceClientProviders>
    );
  }

  return (
    <EspaceClientProviders>
      <EspaceClientShell userName={userName} userInitial={userInitial} onSignOut={handleSignOut}>
        <div className="p-5 md:p-10 max-w-5xl w-full mx-auto">{children}</div>
      </EspaceClientShell>
    </EspaceClientProviders>
  );
}
