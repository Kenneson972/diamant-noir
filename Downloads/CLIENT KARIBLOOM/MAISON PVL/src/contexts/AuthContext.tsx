'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { getSupabase } from '@/lib/supabase';
import type { SupabaseClient, User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function noopAuth(): SupabaseClient['auth'] | null {
  const client = getSupabase();
  return client?.auth ?? null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = noopAuth();
    if (!auth) {
      setLoading(false);
      return;
    }

    const {
      data: { subscription },
    } = auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const auth = noopAuth();
    if (!auth) return { error: 'Service indisponible' };
    const { error } = await auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signUp = async (email: string, password: string) => {
    const auth = noopAuth();
    if (!auth) return { error: 'Service indisponible' };
    const { error } = await auth.signUp({ email, password });
    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    const auth = noopAuth();
    if (!auth) return;
    await auth.signOut();
    setUser(null);
  };

  const resetPassword = async (email: string) => {
    const auth = noopAuth();
    if (!auth) return { error: 'Service indisponible' };
    const { error } = await auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reinitialisation`,
    });
    return { error: error?.message ?? null };
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, signIn, signUp, signOut, resetPassword }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
