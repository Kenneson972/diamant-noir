import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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
}

export interface SubscriptionData {
  id: string;
  plan: 'free' | 'starter' | 'premium' | 'vip';
  status: 'active' | 'expired' | 'cancelled';
  startDate: string;
  endDate: string | null;
  autoRenew: boolean;
  price: number;
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
  login: (email: string, password: string) => Promise<void>;
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
  };
}

async function fetchUserData(supabaseUser: SupabaseUser): Promise<{ user: User; subscription: SubscriptionData | null }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const profileRes = await (supabase as any).from('profiles').select('*').eq('id', supabaseUser.id).single() as { data: Profile | null; error: unknown };
  if (!profileRes.data) throw new Error('Profil introuvable');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const subRes = await (supabase as any).from('subscriptions').select('*').eq('user_id', supabaseUser.id).single() as { data: Subscription | null; error: unknown };
  return {
    user: mapProfile(profileRes.data, supabaseUser.email ?? ''),
    subscription: subRes.data ? mapSubscription(subRes.data) : null,
  };
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        try {
          const data = await fetchUserData(session.user);
          setUser(data.user);
          setSubscription(data.subscription);
        } catch {
          setUser(null);
          setSubscription(null);
        }
      }
      setIsLoading(false);
    });

    const { data: { subscription: authListener } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          try {
            const data = await fetchUserData(session.user);
            setUser(data.user);
            setSubscription(data.subscription);
          } catch {
            setUser(null);
            setSubscription(null);
          }
        } else {
          setUser(null);
          setSubscription(null);
        }
      }
    );

    return () => authListener.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
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
    await supabase.auth.signOut();
    setUser(null);
    setSubscription(null);
  };

  const updateProfile = async (data: Partial<User>) => {
    if (!user) return;
    const patch: Record<string, string | null> = {};
    if (data.firstName !== undefined) patch['first_name'] = data.firstName;
    if (data.lastName !== undefined) patch['last_name'] = data.lastName;
    if (data.phone !== undefined) patch['phone'] = data.phone ?? null;
    if (data.avatar !== undefined) patch['avatar_url'] = data.avatar ?? null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;
    const { error } = await db.from('profiles').update(patch).eq('id', user.id);
    if (error) throw new Error((error as { message: string }).message);
    setUser(prev => prev ? { ...prev, ...data } : null);
  };

  const updateSubscription = async (planId: string) => {
    if (!subscription || !user) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;
    const { error } = await db.from('subscriptions').update({ plan: planId }).eq('user_id', user.id);
    if (error) throw new Error((error as { message: string }).message);
    setSubscription(prev => prev ? { ...prev, plan: planId as SubscriptionData['plan'] } : null);
  };

  return (
    <AuthContext.Provider value={{
      user, subscription,
      isAuthenticated: !!user,
      isAdmin: user?.role === 'admin',
      isLoading,
      login, register, logout, updateProfile, updateSubscription,
    }}>
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
