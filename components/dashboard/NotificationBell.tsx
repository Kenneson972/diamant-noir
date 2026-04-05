"use client";

/**
 * NotificationBell — Diamant Noir Dashboard
 * ──────────────────────────────────────────
 * Cloche dans la Sidebar avec badge de compteur.
 * S'abonne à Supabase Realtime sur la table `notifications` :
 * dès que n8n insère une nouvelle ligne, la cloche s'anime
 * et le dropdown s'enrichit en temps réel — sans rechargement.
 *
 * Chaque notif affiche :
 *  - Icône colorée selon le type
 *  - Titre + corps
 *  - Score IA + tier si villa_submission
 *  - Timestamp relatif
 *  - Lien "Voir →" vers la page concernée
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Bell, X, ExternalLink, CheckCheck, Building2, Calendar, AlertTriangle, Sparkles, Info } from "lucide-react";
import { getSupabaseBrowser } from "@/lib/supabase";

// ─── Types ────────────────────────────────────────────────────────────────
type NotifType =
  | "villa_submission"
  | "booking_new"
  | "booking_confirmed"
  | "ical_error"
  | "availability_alert"
  | "system";

interface Notification {
  id: string;
  type: NotifType;
  title: string;
  body: string;
  metadata: Record<string, any>;
  action_url: string;
  is_read: boolean;
  created_at: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────
function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "À l'instant";
  if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)} h`;
  return `Il y a ${Math.floor(diff / 86400)} j`;
}

const TYPE_CONFIG: Record<NotifType, { icon: any; color: string; bg: string }> = {
  villa_submission:   { icon: Building2,    color: "text-gold",       bg: "bg-gold/10" },
  booking_new:        { icon: Calendar,     color: "text-blue-500",   bg: "bg-blue-50" },
  booking_confirmed:  { icon: CheckCheck,   color: "text-green-500",  bg: "bg-green-50" },
  ical_error:         { icon: AlertTriangle,color: "text-red-500",    bg: "bg-red-50" },
  availability_alert: { icon: Bell,         color: "text-orange-500", bg: "bg-orange-50" },
  system:             { icon: Info,         color: "text-navy/60",    bg: "bg-navy/5" },
};

const SCORE_COLOR = (score: number) =>
  score >= 75 ? "text-green-600 bg-green-50" :
  score >= 40 ? "text-amber-600 bg-amber-50" :
                "text-red-600 bg-red-50";

// ─── Composant principal ───────────────────────────────────────────────────
interface NotificationBellProps {
  /** Mode collapsed de la sidebar */
  collapsed?: boolean;
}

export function NotificationBell({ collapsed = false }: NotificationBellProps) {
  const router = useRouter();
  const supabase = getSupabaseBrowser();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [animating, setAnimating] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  // ── Chargement initial ────────────────────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    if (!supabase) return;
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);
    if (data) setNotifications(data as Notification[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // ── Supabase Realtime — écoute les nouvelles notifications ────────────
  useEffect(() => {
    if (!supabase) return;

    const channel = supabase
      .channel("notifications-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        (payload) => {
          const newNotif = payload.new as Notification;

          // Animation de la cloche
          setAnimating(true);
          setTimeout(() => setAnimating(false), 1000);

          // Ajouter en tête de liste
          setNotifications((prev) => [newNotif, ...prev].slice(0, 20));
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "notifications" },
        (payload) => {
          const updated = payload.new as Notification;
          setNotifications((prev) =>
            prev.map((n) => (n.id === updated.id ? updated : n))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  // ── Fermer le dropdown au clic extérieur ─────────────────────────────
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  // ── Marquer une notif comme lue ───────────────────────────────────────
  async function markRead(id: string) {
    if (!supabase) return;
    await (supabase as any)
      .from("notifications")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("id", id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  }

  async function markAllRead() {
    if (!supabase) return;
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);
    if (unreadIds.length === 0) return;
    await (supabase as any)
      .from("notifications")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .in("id", unreadIds);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  }

  async function handleNotifClick(notif: Notification) {
    if (!notif.is_read) await markRead(notif.id);
    setOpen(false);
    router.push(notif.action_url);
  }

  // ─── Render ─────────────────────────────────────────────────────────────
  return (
    <div ref={dropdownRef} className="relative">
      {/* Bouton cloche */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={`
          relative flex items-center gap-3 rounded-lg px-3 py-2 w-full
          text-navy/70 hover:bg-navy/5 dark:text-white/70 dark:hover:bg-white/10
          transition-colors
          ${animating ? "animate-[wiggle_0.5s_ease-in-out]" : ""}
        `}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} non lues)` : ""}`}
      >
        <div className="relative shrink-0">
          <Bell
            size={18}
            className={animating ? "text-gold" : ""}
          />
          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-gold text-[10px] font-bold text-navy leading-none">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </div>
        {!collapsed && (
          <span className="text-sm font-medium truncate">Notifications</span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className={`
          absolute z-50 bg-white dark:bg-navy border border-navy/10 dark:border-white/10
          shadow-2xl rounded-xl overflow-hidden
          ${collapsed
            ? "left-full ml-2 bottom-0 w-80"
            : "left-0 bottom-full mb-2 w-80"
          }
        `}>
          {/* Header dropdown */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-navy/[0.06] dark:border-white/10">
            <div className="flex items-center gap-2">
              <Bell size={14} className="text-gold" />
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-navy dark:text-white">
                Notifications
              </span>
              {unreadCount > 0 && (
                <span className="bg-gold text-navy text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-[10px] text-navy/40 dark:text-white/40 hover:text-gold transition-colors uppercase tracking-wider px-2 py-1"
                >
                  Tout lire
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="text-navy/30 dark:text-white/30 hover:text-navy dark:hover:text-white transition-colors p-1"
              >
                <X size={13} />
              </button>
            </div>
          </div>

          {/* Liste */}
          <div className="max-h-[420px] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <div className="w-5 h-5 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <Bell size={24} className="text-navy/15 dark:text-white/15" />
                <p className="text-xs text-navy/40 dark:text-white/40">Aucune notification</p>
              </div>
            ) : (
              notifications.map((notif) => {
                const cfg = TYPE_CONFIG[notif.type] ?? TYPE_CONFIG.system;
                const Icon = cfg.icon;
                const score = notif.metadata?.ai_score;
                const tier = notif.metadata?.ai_tier;

                return (
                  <button
                    key={notif.id}
                    onClick={() => handleNotifClick(notif)}
                    className={`
                      w-full text-left px-4 py-3 border-b border-navy/[0.05] dark:border-white/[0.05]
                      last:border-0 transition-colors
                      ${notif.is_read
                        ? "hover:bg-navy/[0.03] dark:hover:bg-white/[0.03]"
                        : "bg-gold/[0.04] hover:bg-gold/[0.07] dark:bg-gold/[0.06]"
                      }
                    `}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icône type */}
                      <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${cfg.bg}`}>
                        <Icon size={14} className={cfg.color} />
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* Titre + point non-lu */}
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className={`text-xs font-semibold truncate text-navy dark:text-white ${!notif.is_read ? "font-bold" : ""}`}>
                            {notif.title}
                          </p>
                          {!notif.is_read && (
                            <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-gold" />
                          )}
                        </div>

                        {/* Corps */}
                        <p className="text-[11px] text-navy/55 dark:text-white/55 leading-relaxed line-clamp-2">
                          {notif.body}
                        </p>

                        {/* Score IA si villa_submission */}
                        {notif.type === "villa_submission" && score !== undefined && (
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${SCORE_COLOR(score)}`}>
                              Score {score}/100
                            </span>
                            {tier && (
                              <span className="text-[10px] font-semibold text-gold uppercase tracking-wider">
                                {tier}
                              </span>
                            )}
                            {notif.metadata?.ai_recommendation === "auto_review" && (
                              <span className="flex items-center gap-0.5 text-[10px] text-green-600">
                                <Sparkles size={9} /> Dossier fort
                              </span>
                            )}
                          </div>
                        )}

                        {/* Footer : timestamp + lien */}
                        <div className="flex items-center justify-between mt-1.5">
                          <span className="text-[10px] text-navy/35 dark:text-white/35">
                            {timeAgo(notif.created_at)}
                          </span>
                          <span className="flex items-center gap-0.5 text-[10px] text-gold hover:text-gold/80">
                            Voir <ExternalLink size={9} />
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer dropdown */}
          {notifications.length > 0 && (
            <div className="px-4 py-2.5 border-t border-navy/[0.06] dark:border-white/10 bg-navy/[0.02] dark:bg-white/[0.02]">
              <button
                onClick={() => { setOpen(false); router.push("/dashboard/proprio/submissions"); }}
                className="text-[10px] text-navy/50 dark:text-white/50 hover:text-gold transition-colors uppercase tracking-[0.15em] w-full text-center"
              >
                Voir toutes les soumissions →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
