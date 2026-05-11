"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase";
import { Bell, CheckCheck, ExternalLink } from "lucide-react";
import { NOTIF_TYPE_CONFIG } from "@/lib/constants";
import { timeAgo } from "@/lib/utils";
import { PageTopbar } from "@/components/espace-client/PageTopbar";

const TYPE_CONFIG = NOTIF_TYPE_CONFIG;

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  action_url: string | null;
  is_read: boolean;
  created_at: string;
}

export default function NotificationsPage() {
  const router = useRouter();
  const supabase = getSupabaseBrowser();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!supabase) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const { data } = await supabase
      .from("notifications")
      .select("id, type, title, body, action_url, is_read, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setNotifications((data ?? []) as Notification[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const markRead = async (id: string) => {
    if (!supabase) return;
    await supabase.from("notifications").update({ is_read: true, read_at: new Date().toISOString() }).eq("id", id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  };

  const markAllRead = async () => {
    if (!supabase) return;
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);
    if (unreadIds.length === 0) return;
    await supabase.from("notifications").update({ is_read: true, read_at: new Date().toISOString() }).in("id", unreadIds);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const handleClick = async (notif: Notification) => {
    if (!notif.is_read) await markRead(notif.id);
    if (notif.action_url) router.push(notif.action_url);
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <>
      <PageTopbar title="Notifications" />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl text-navy">Mes notifications</h1>
            <p className="text-sm text-navy/50 mt-1">
              {unreadCount > 0
                ? `${unreadCount} notification${unreadCount > 1 ? "s" : ""} non lue${unreadCount > 1 ? "s" : ""}`
                : "Tout est lu"}
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-navy/50 hover:text-gold transition-colors"
            >
              <CheckCheck size={14} />
              Tout marquer comme lu
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-5 h-5 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 border border-navy/10 bg-white">
            <Bell size={32} className="text-navy/15" />
            <p className="text-sm text-navy/40">Aucune notification</p>
            <p className="text-[11px] text-navy/30">
              Les notifications de vos demandes et messages apparaîtront ici.
            </p>
          </div>
        ) : (
          <div className="space-y-[1px] border border-navy/[0.07] bg-navy/[0.04]">
            {notifications.map((notif) => (
              <button
                key={notif.id}
                onClick={() => handleClick(notif)}
                className={`w-full text-left px-5 py-4 bg-offwhite hover:bg-white transition-colors ${
                  !notif.is_read ? "bg-gold/[0.03]" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="shrink-0 mt-0.5">
                    {!notif.is_read && (
                      <span className="block w-2 h-2 rounded-full bg-gold" />
                    )}
                    {notif.is_read && (
                      <span className="block w-2 h-2 rounded-full bg-navy/10" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!notif.is_read ? "font-semibold text-navy" : "text-navy/60"}`}>
                      {notif.title}
                    </p>
                    <p className="text-[11px] text-navy/45 mt-0.5 line-clamp-2">
                      {notif.body}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[10px] text-navy/30">
                        {timeAgo(notif.created_at)}
                      </span>
                      {notif.action_url && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] text-gold">
                          Voir <ExternalLink size={9} />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
