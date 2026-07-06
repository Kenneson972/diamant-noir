"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase";
import { Send, MessageCircle } from "lucide-react";
import { KayvilaEmptyState } from "@/components/ui/pro";
import { timeAgo } from "@/lib/utils";
import type { TenantMessageRow } from "@/lib/messages/status";

type Profile = { id: string; full_name: string | null; email: string | null };

const SUBJECT_LABELS: Record<string, string> = {
  probleme: "Signaler un problème",
  sejour: "Mon séjour",
  reservation: "Ma réservation",
  autre: "Autre",
};

export function AdminTravelerChatPanel() {
  const supabase = getSupabaseBrowser();
  const [messages, setMessages] = useState<TenantMessageRow[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [villaNames, setVillaNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [activeGuestId, setActiveGuestId] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [adminUserId, setAdminUserId] = useState<string | null>(null);

  const fetchAll = async () => {
    if (!supabase) return;
    const { data } = await supabase
      .from("tenant_messages")
      .select("*")
      .order("created_at", { ascending: true });
    const rows = (data ?? []) as TenantMessageRow[];
    setMessages(rows);

    const guestIds = [...new Set(rows.map((r) => r.guest_id))];
    if (guestIds.length > 0) {
      const { data: profileRows } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", guestIds);
      const map: Record<string, Profile> = {};
      (profileRows ?? []).forEach((p: any) => {
        map[p.id] = p as Profile;
      });
      setProfiles(map);
    }

    const bookingIds = [...new Set(rows.map((r) => r.booking_id).filter(Boolean))] as string[];
    if (bookingIds.length > 0) {
      const { data: bookingRows } = await supabase
        .from("bookings")
        .select("id, villa_id")
        .in("id", bookingIds);
      const villaIds = [...new Set((bookingRows ?? []).map((b: any) => b.villa_id).filter(Boolean))];
      if (villaIds.length > 0) {
        const { data: villaRows } = await supabase.from("villas").select("id, name").in("id", villaIds);
        const villaNameById: Record<string, string> = {};
        (villaRows ?? []).forEach((v: any) => {
          villaNameById[v.id] = v.name;
        });
        const nameByBooking: Record<string, string> = {};
        (bookingRows ?? []).forEach((b: any) => {
          if (b.villa_id && villaNameById[b.villa_id]) nameByBooking[b.id] = villaNameById[b.villa_id];
        });
        setVillaNames(nameByBooking);
      }
    }

    setLoading(false);
  };

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }: { data: { user: { id: string } | null } }) =>
      setAdminUserId(data.user?.id ?? null)
    );
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  useEffect(() => {
    if (!supabase) return;

    // Topic unique par montage : `supabase.channel()` réutilise un channel existant
    // par nom de topic, et `removeChannel()` est asynchrone. Un remount rapide
    // (Strict Mode, changement d'onglet) peut récupérer l'ancien channel déjà
    // `subscribe()` et faire planter `.on()` avec "... after subscribe()".
    const channel = supabase
      .channel(`admin-tenant-messages-realtime-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "tenant_messages" }, fetchAll)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "tenant_messages" }, fetchAll)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  const conversations = useMemo(() => {
    const map = new Map<string, TenantMessageRow[]>();
    for (const m of messages) {
      const list = map.get(m.guest_id) ?? [];
      list.push(m);
      map.set(m.guest_id, list);
    }
    return [...map.entries()].sort(
      (a, b) =>
        new Date(b[1][b[1].length - 1]?.created_at ?? 0).getTime() -
        new Date(a[1][a[1].length - 1]?.created_at ?? 0).getTime()
    );
  }, [messages]);

  useEffect(() => {
    if (!activeGuestId && conversations.length > 0) {
      setActiveGuestId(conversations[0][0]);
    }
  }, [conversations, activeGuestId]);

  const thread = activeGuestId ? conversations.find(([id]) => id === activeGuestId)?.[1] ?? [] : [];

  useEffect(() => {
    if (!supabase || !activeGuestId) return;
    const hasUnread = thread.some((m) => m.sender_role === "guest" && m.read_at === null);
    if (!hasUnread) return;
    supabase
      .from("tenant_messages")
      .update({ read_at: new Date().toISOString() })
      .eq("guest_id", activeGuestId)
      .eq("sender_role", "guest")
      .is("read_at", null)
      .then(() => fetchAll());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeGuestId]);

  const handleSend = async () => {
    if (!supabase || !reply.trim() || !activeGuestId || !adminUserId) return;
    setSending(true);
    const lastGuestSubject =
      [...thread].reverse().find((m) => m.sender_role === "guest")?.subject ?? "autre";
    const { error } = await supabase.from("tenant_messages").insert({
      guest_id: activeGuestId,
      sender_id: adminUserId,
      sender_role: "admin",
      subject: lastGuestSubject,
      content: reply.trim(),
    });
    if (!error) {
      setReply("");
      await fetchAll();
    }
    setSending(false);
  };

  if (loading) return <p className="text-sm text-navy/55">Chargement...</p>;

  if (conversations.length === 0) {
    return (
      <KayvilaEmptyState
        icon={<MessageCircle className="size-12" />}
        title="Aucun message"
        description="Les messages des locataires apparaîtront ici."
      />
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      <aside className="border border-navy/10 bg-white divide-y divide-navy/5 max-h-[60vh] overflow-y-auto">
        {conversations.map(([guestId, rows]) => {
          const last = rows[rows.length - 1];
          const profile = profiles[guestId];
          const villaName = last.booking_id ? villaNames[last.booking_id] : null;
          const hasUnread = rows.some((m) => m.sender_role === "guest" && m.read_at === null);
          return (
            <button
              key={guestId}
              type="button"
              onClick={() => setActiveGuestId(guestId)}
              className={`w-full text-left px-4 py-3 text-sm hover:bg-navy/[0.02] ${
                activeGuestId === guestId ? "bg-gold/5" : ""
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium text-navy truncate">
                  {profile?.full_name ?? profile?.email ?? "Locataire"}
                </p>
                {hasUnread && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />}
              </div>
              {villaName && <p className="text-[10px] text-navy/40 truncate">{villaName}</p>}
              <p className="text-xs text-navy/50 truncate">{last?.content}</p>
              <p className="text-[10px] text-navy/35 mt-1">{timeAgo(last?.created_at)}</p>
            </button>
          );
        })}
      </aside>

      <div className="border border-navy/10 bg-white flex flex-col min-h-[50vh]">
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {thread.map((m) => (
            <div
              key={m.id}
              className={`max-w-[85%] rounded-lg px-4 py-2 text-sm ${
                m.sender_role === "admin" ? "ml-auto bg-navy text-white" : "bg-offwhite text-navy"
              }`}
            >
              <p className="text-[10px] font-semibold uppercase tracking-wide opacity-60 mb-1">
                {SUBJECT_LABELS[m.subject] ?? m.subject}
              </p>
              <p>{m.content}</p>
              <p className="text-[10px] opacity-60 mt-1">{timeAgo(m.created_at)}</p>
            </div>
          ))}
        </div>
        <div className="border-t border-navy/10 p-4 flex gap-2">
          <input
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Répondre au locataire…"
            className="flex-1 rounded-lg border border-navy/15 px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={sending || !reply.trim()}
            className="inline-flex items-center gap-1 rounded-lg bg-navy px-4 py-2 text-sm text-white disabled:opacity-40"
          >
            <Send size={14} />
            Envoyer
          </button>
        </div>
      </div>
    </div>
  );
}
