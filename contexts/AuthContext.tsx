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
};

/* ─── Contexte ──────────────────────────────────────── */

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  role: "guest",
  signOut: async () => {},
  refreshSession: async () => {},
});

export const useAuth = () => useContext(AuthContext);

/* ─── Provider ──────────────────────────────────────── */

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

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
      setUser(data?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: string, session: any) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = useCallback(async () => {
    const supabase = getSupabaseBrowser();
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
    router.push("/login");
  }, [router]);

  /* ─── Détermination du rôle ────────────────────────── */
  const role: UserRole = (() => {
    if (!user) return "guest";
    const metadata = user.user_metadata;
    if (metadata?.role === "admin") return "admin";
    if (metadata?.role === "owner") return "owner";
    return "guest";
  })();

  return (
    <AuthContext.Provider value={{ user, loading, role, signOut, refreshSession }}>
      {children}
    </AuthContext.Provider>
  );
}
