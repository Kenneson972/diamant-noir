"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase";
import { CheckCheck, ExternalLink } from "lucide-react";
import { KayvilaPngIcon } from "@/components/icons/KayvilaPngIcon";
import { Button, Chip } from "@heroui/react";
import { timeAgo } from "@/lib/utils";
import { PageTopbar } from "@/components/espace-client/PageTopbar";
import { TenantSectionHeader } from "@/components/espace-client/TenantSectionHeader";
import { Spinner } from "@/components/espace-client/tenant-ui";
import { KayvilaEmptyState, KayvilaTenantWidget } from "@/components/ui/pro";

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
      <div className="mx-auto max-w-2xl space-y-6">
        <TenantSectionHeader
          eyebrow="MES NOTIFICATIONS"
          title="Mes notifications"
          description={
            unreadCount > 0
              ? `${unreadCount} notification${unreadCount > 1 ? "s" : ""} non lue${unreadCount > 1 ? "s" : ""}`
              : "Tout est lu"
          }
        />

        {loading ? (
          <div className="flex justify-center py-20">
            <Spinner size="lg" className="text-gold" />
          </div>
        ) : notifications.length === 0 ? (
          <KayvilaEmptyState
            icon={<KayvilaPngIcon name="bell" size={24} alt="" />}
            title="Aucune notification"
            description="Les notifications de vos demandes et messages apparaîtront ici."
          />
        ) : (
          <KayvilaTenantWidget
            title="Activité récente"
            action={
              unreadCount > 0 ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onPress={markAllRead}
                  className="min-h-[44px] rounded-none text-[10px] font-bold uppercase tracking-[0.16em] text-navy/50 data-[hover=true]:text-gold"
                >
                  <CheckCheck size={16} strokeWidth={1.5} aria-hidden />
                  Tout lire
                </Button>
              ) : (
                <Chip size="sm" variant="soft" color="success" className="uppercase">
                  À jour
                </Chip>
              )
            }
          >
            <div className="divide-y divide-navy/5 -mx-6 -my-5">
              {notifications.map((notif) => (
                  <button
                    key={notif.id}
                    type="button"
                    onClick={() => handleClick(notif)}
                    className={`w-full px-6 py-4 text-left transition-colors hover:bg-navy/[0.02] ${
                      !notif.is_read ? "bg-gold/[0.03]" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 shrink-0">
                        <span
                          className={`block h-2 w-2 rounded-full ${!notif.is_read ? "bg-gold" : "bg-navy/10"}`}
                          aria-hidden
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm ${!notif.is_read ? "font-semibold text-navy" : "text-navy/80"}`}>
                          {notif.title}
                        </p>
                        <p className="mt-0.5 line-clamp-2 text-[11px] text-navy/45">{notif.body}</p>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-[10px] text-navy/30">{timeAgo(notif.created_at)}</span>
                          {notif.action_url ? (
                            <span className="inline-flex items-center gap-0.5 text-[10px] text-gold">
                              Voir <ExternalLink size={12} strokeWidth={1.5} aria-hidden />
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </button>
              ))}
            </div>
          </KayvilaTenantWidget>
        )}
      </div>
    </>
  );
}
