// src/hooks/useOrders.ts
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { Order, OrderItem } from '../types/database';
import { useAuth } from '../contexts/AuthContext';

export interface OrderWithItems extends Order {
  order_items: OrderItem[];
}

export function useOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setOrders([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('orders')
      .select('*, order_items(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data, error: err }: { data: OrderWithItems[] | null; error: { message: string } | null }) => {
        if (cancelled) return;
        if (err) {
          if (import.meta.env.DEV) console.error('[useOrders]', err);
          setError('Impossible de charger vos commandes.');
        } else {
          const rows = data ?? [];
          if (import.meta.env.DEV) {
            console.info('[useOrders] public.orders pour ce compte :', rows.length, 'ligne(s)');
          }
          setOrders(rows);
        }
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [user?.id]);

  const totalThisMonth = orders
    .filter(o => {
      const d = new Date(o.created_at);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((sum, o) => sum + o.total, 0);

  const topProducts = Object.entries(
    orders.flatMap(o => o.order_items).reduce<Record<string, number>>((acc, item) => {
      acc[item.product_name] = (acc[item.product_name] ?? 0) + item.quantity;
      return acc;
    }, {})
  )
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([name, count]) => ({ name, count }));

  return { orders, loading, error, totalThisMonth, topProducts };
}
