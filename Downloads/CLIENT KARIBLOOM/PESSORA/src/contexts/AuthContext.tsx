import { createContext, useContext, useState, useEffect, useRef, useMemo, ReactNode } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import type { Profile, Subscription } from '../types/database';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  role?: 'member' | 'admin';
  createdAt: string;
  /** Préférences persistées dans `profiles.preferences` (JSON). */
  preferences?: Record<string, boolean> | null;
}

export interface SubscriptionData {
  id: string;
  plan: 'free' | 'ora_plus';
  status: 'active' | 'expired' | 'cancelled';
  startDate: string;
  endDate: string | null;
  autoRenew: boolean;
  price: number;
  stripeSubscriptionId: string | null;
  stripeCustomerId: string | null;
  currentPeriodEnd: string | null;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

interface AuthContextType {
  user: User | null;
  subscription: SubscriptionData | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  /** Retourne l'utilisateur chargé (profil + rôle) pour la redirection post-login. */
  login: (email: string, password: string) => Promise<User | null>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  updateSubscription: (planId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function mapProfile(profile: Profile, email: string): User {
  return {
    id: profile.id,
    email,
    firstName: profile.first_name ?? '',
    lastName: profile.last_name ?? '',
    phone: profile.phone ?? undefined,
    avatar: profile.avatar_url ?? undefined,
    role: (profile.role ?? 'member') as User['role'],
    createdAt: profile.created_at,
    preferences: profile.preferences ?? null,
  };
}

function mapSubscription(sub: Subscription): SubscriptionData {
  return {
    id: sub.id,
    plan: sub.plan as SubscriptionData['plan'],
    status: sub.status as SubscriptionData['status'],
    startDate: sub.start_date,
    endDate: sub.end_date,
    autoRenew: sub.auto_renew,
    price: Number(sub.price),
    stripeSubscriptionId: sub.stripe_subscription_id ?? null,
    stripeCustomerId: null,
    currentPeriodEnd: sub.current_period_end ?? null,
  };
}

function buildFallbackUser(supabaseUser: SupabaseUser): User {
  return {
    id: supabaseUser.id,
    email: supabaseUser.email ?? '',
    firstName:
      supabaseUser.user_metadata?.first_name ??
      supabaseUser.email?.split('@')[0] ??
      'Membre',
    lastName: supabaseUser.user_metadata?.last_name ?? '',
    phone: supabaseUser.user_metadata?.phone,
    role: 'member',
    createdAt: supabaseUser.created_at,
  };
}

// Never throws — always returns a valid user (falls back to supabase metadata)
async function fetchUserData(
  supabaseUser: SupabaseUser,
): Promise<{ user: User; subscription: SubscriptionData | null }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const [profileRes, subRes] = await Promise.all([
    db.from('profiles').select('*').eq('id', supabaseUser.id).single() as Promise<{ data: Profile | null; error: unknown }>,
    db.from('subscriptions').select('*').eq('user_id', supabaseUser.id).single() as Promise<{ data: Subscription | null; error: unknown }>,
  ]);
  const user: User = profileRes.data
    ? mapProfile(profileRes.data, supabaseUser.email ?? '')
    : buildFallbackUser(supabaseUser);
  return { user, subscription: subRes.data ? mapSubscription(subRes.data) : null };
}

/** gotrue-js: avoid calling Supabase from inside onAuthStateChange synchronously — defer with setTimeout(0). */
function scheduleAfterAuthCallback(fn: () => void) {
  setTimeout(fn, 0);
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loginInProgress = useRef(false);
  const initialSessionHandled = useRef(false);

  // Track the currently loaded user id so we can ignore no-op auth events
  // (TOKEN_REFRESHED, USER_UPDATED) for the same user — avoids re-fetching
  // profile + subscription and re-rendering every consumer of useAuth().
  const loadedUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadUser = async (supabaseUser: SupabaseUser) => {
      try {
        const userData = await fetchUserData(supabaseUser);
        if (cancelled) return;
        loadedUserIdRef.current = userData.user.id;
        setUser(userData.user);
        setSubscription(userData.subscription);
      } catch {
        if (cancelled) return;
        loadedUserIdRef.current = supabaseUser.id;
        setUser(buildFallbackUser(supabaseUser));
        setSubscription(null);
      }
    };

    const { data: { subscription: authListener } } = supabase.auth.onAuthStateChange((event, session) => {
      scheduleAfterAuthCallback(() => {
        if (cancelled) return;

        if (event === 'INITIAL_SESSION') {
          initialSessionHandled.current = true;
          void (async () => {
            if (cancelled) return;
            if (session?.user) {
              await loadUser(session.user);
            } else {
              loadedUserIdRef.current = null;
              setUser(null);
              setSubscription(null);
            }
            setIsLoading(false);
          })();
          return;
        }

        if (loginInProgress.current) return;

        if (event === 'SIGNED_OUT') {
          if (!initialSessionHandled.current) {
            setIsLoading(false);
            return;
          }
          loadedUserIdRef.current = null;
          setUser(null);
          setSubscription(null);
          setIsLoading(false);
          return;
        }

        // Silent events — Supabase fires these on tab focus, hourly JWT
        // refresh, or metadata changes. They do NOT mean the user changed,
        // so we skip the refetch to avoid flashing every consumer.
        // Ref: https://supabase.com/docs/reference/javascript/auth-onauthstatechange
        if (event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
          if (session?.user && loadedUserIdRef.current === session.user.id) {
            return;
          }
        }

        if (event === 'SIGNED_IN') {
          if (session?.user && loadedUserIdRef.current === session.user.id) {
            // Same user already loaded (often fired alongside INITIAL_SESSION
            // or after TOKEN_REFRESHED) — no work needed.
            setIsLoading(false);
            return;
          }
        }

        if (session?.user) {
          void (async () => {
            if (cancelled || loginInProgress.current) return;
            await loadUser(session.user);
            setIsLoading(false);
          })();
        } else {
          setIsLoading(false);
        }
      });
    });

    return () => {
      cancelled = true;
      authListener.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<User | null> => {
    loginInProgress.current = true;
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw new Error(error.message);
      if (data.user) {
        const userData = await fetchUserData(data.user);
        loadedUserIdRef.current = userData.user.id;
        setUser(userData.user);
        setSubscription(userData.subscription);
        return userData.user;
      }
      return null;
    } finally {
      loginInProgress.current = false;
    }
  };

  const register = async ({ email, password, firstName, lastName, phone }: RegisterData) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { first_name: firstName, last_name: lastName, phone: phone ?? '' } },
    });
    if (error) throw new Error(error.message);
  };

  const logout = async () => {
    loginInProgress.current = false; // Release any pending guard
    await supabase.auth.signOut();
    loadedUserIdRef.current = null;
    setUser(null);
    setSubscription(null);
  };

  const updateProfile = async (data: Partial<User>) => {
    if (!user) return;
    const patch: Record<string, string | null | Record<string, boolean>> = {};
    if (data.firstName !== undefined) patch['first_name'] = data.firstName;
    if (data.lastName !== undefined) patch['last_name'] = data.lastName;
    if (data.phone !== undefined) patch['phone'] = data.phone ?? null;
    if (data.avatar !== undefined) patch['avatar_url'] = data.avatar ?? null;
    if (data.preferences !== undefined) patch['preferences'] = data.preferences ?? {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;
    const { error } = await db.from('profiles').update(patch).eq('id', user.id);
    if (error) throw new Error((error as { message: string }).message);
    setUser(prev =>
      prev
        ? {
            ...prev,
            ...data,
            preferences:
              data.preferences !== undefined ? data.preferences ?? null : prev.preferences,
          }
        : null,
    );
  };

  const updateSubscription = async (planId: string) => {
    if (!subscription || !user) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;
    const { error } = await db.from('subscriptions').update({ plan: planId }).eq('user_id', user.id);
    if (error) throw new Error((error as { message: string }).message);
    setSubscription(prev => (prev ? { ...prev, plan: planId as SubscriptionData['plan'] } : null));
  };

  const contextValue = useMemo<AuthContextType>(() => ({
    user,
    subscription,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isLoading,
    login,
    register,
    logout,
    updateProfile,
    updateSubscription,
  }), [user, subscription, isLoading]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
