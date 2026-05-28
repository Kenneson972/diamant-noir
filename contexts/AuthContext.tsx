"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

/* ─── Types ─────────────────────────────────────────── */

type UserRole = "guest" | "owner" | "admin";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  role: UserRole;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  refreshRole: () => Promise<void>;
};

/* ─── Contexte ──────────────────────────────────────── */

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  role: "guest",
  signOut: async () => {},
  refreshSession: async () => {},
  refreshRole: async () => {},
});

export const useAuth = () => useContext(AuthContext);

/* ─── Provider ──────────────────────────────────────── */

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profileRole, setProfileRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchProfileRole = useCallback(async (userId: string) => {
    try {
      const supabase = getSupabaseBrowser();
      if (!supabase) return;
      const { data } = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle();
      setProfileRole(data?.role ?? null);
    } catch {
      // non-bloquant
    }
  }, []);

  const refreshRole = useCallback(async () => {
    if (user?.id) await fetchProfileRole(user.id);
  }, [user?.id, fetchProfileRole]);

  const refreshSession = useCallback(async () => {
    const supabase = getSupabaseBrowser();
    if (!supabase) return;
    const { data } = await supabase.auth.getUser();
    setUser(data?.user ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    const supabase = getSupabaseBrowser();
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getUser().then(({ data }: { data: { user: User | null } }) => {
      const u = data?.user ?? null;
      setUser(u);
      if (u) fetchProfileRole(u.id);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: string, session: any) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        fetchProfileRole(u.id);
      } else {
        setProfileRole(null);
      }

      // 5.3: Handle expired session
      if (event === "SIGNED_OUT") {
        setUser(null);
        setProfileRole(null);
        // Redirect handled by middleware on next navigation
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfileRole]);

  const signOut = useCallback(async () => {
    const supabase = getSupabaseBrowser();
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
    setProfileRole(null);
    router.push("/login");
  }, [router]);

  /* ─── Détermination du rôle — profiles.role primaire, JWT fallback ── */
  const role: UserRole = (() => {
    if (!user) return "guest";
    // Primary: profiles.role from DB
    if (profileRole === "admin") return "admin";
    if (profileRole === "owner" || profileRole === "proprio") return "owner";
    // Fallback: JWT user_metadata
    const metadata = user.user_metadata;
    if (metadata?.role === "admin") return "admin";
    if (metadata?.role === "owner") return "owner";
    return "guest";
  })();

  return (
    <AuthContext.Provider value={{ user, loading, role, signOut, refreshSession, refreshRole }}>
      {children}
    </AuthContext.Provider>
  );
}
