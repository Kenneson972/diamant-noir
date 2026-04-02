"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import { getSupabaseBrowser } from "@/lib/supabase";
import { EspaceClientShell } from "@/components/espace-client/EspaceClientShell";
import { EspaceClientProviders } from "@/components/espace-client/EspaceClientProviders";

function Spinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FAFAF8]">
      <div
        className="h-6 w-6 animate-spin rounded-full border-2 border-[#D4AF37] border-t-transparent"
        role="status"
        aria-label="Chargement"
      />
    </div>
  );
}

export default function EspaceClientLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [userInfo, setUserInfo] = useState<{ name?: string; email?: string } | null>(null);
  const supabase = getSupabaseBrowser();

  useEffect(() => {
    if (!supabase) {
      router.replace(`/login?redirect=${encodeURIComponent("/espace-client")}`);
      return;
    }

    let cancelled = false;

    const applySession = (session: Session | null) => {
      if (cancelled) return;
      if (!session?.user) {
        router.replace(
          `/login?redirect=${encodeURIComponent(
            typeof window !== "undefined" ? window.location.pathname : "/espace-client"
          )}`
        );
        return;
      }
      setUserInfo({
        name: session.user.user_metadata?.full_name,
        email: session.user.email ?? undefined,
      });
      setChecking(false);
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      applySession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      applySession(session);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [supabase, router]);

  const handleSignOut = async () => {
    await supabase?.auth.signOut();
    router.push("/");
    router.refresh();
  };

  if (checking) return <Spinner />;

  const firstName = userInfo?.name?.split(" ")[0];
  const initial =
    firstName?.[0]?.toUpperCase() ?? userInfo?.email?.[0]?.toUpperCase() ?? "?";

  return (
    <EspaceClientProviders>
      <EspaceClientShell
        userName={firstName}
        userInitial={initial}
        onSignOut={handleSignOut}
      >
        {children}
      </EspaceClientShell>
    </EspaceClientProviders>
  );
}
