"use client";

import { useState, useCallback, useEffect } from "react";
import { getSupabaseBrowser } from "@/lib/supabase";

interface NotificationRow {
  id: string;
  type: string;
  title: string;
  body: string;
  metadata: Record<string, unknown>;
  action_url: string;
  is_read: boolean;
  created_at: string;
  user_id: string;
}

/** Header Authorization Bearer depuis la session Supabase courante (sinon vide). */
async function getAuthHeader(): Promise<Record<string, string>> {
  const supabase = getSupabaseBrowser();
  if (!supabase) return {};
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token
    ? { Authorization: `Bearer ${session.access_token}` }
    : {};
}

interface UseProactiveNotificationResult {
  notification: NotificationRow | null;
  loading: boolean;
  markAsRead: (id: string) => Promise<void>;
}

export function useProactiveNotification(): UseProactiveNotificationResult {
  const [notification, setNotification] = useState<NotificationRow | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  const fetchNotification = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/proactive-notifications", {
        headers: { ...(await getAuthHeader()) },
      });
      if (res.ok) {
        const data = await res.json();
        setNotification(data.notification ?? null);
      }
    } catch {
      // Silencieux — la notification est best-effort
    } finally {
      setLoading(false);
    }
  }, []);

  const markAsRead = useCallback(async (id: string) => {
    try {
      const res = await fetch("/api/dashboard/proactive-notifications", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(await getAuthHeader()),
        },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setNotification(null);
      }
    } catch {
      // Silencieux
    }
  }, []);

  useEffect(() => {
    fetchNotification();
  }, [fetchNotification]);

  return { notification, loading, markAsRead };
}
