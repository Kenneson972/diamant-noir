"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase";
import { Send, MessageCircle } from "lucide-react";
import { KayvilaEmptyState } from "@/components/ui/pro";
import { timeAgo } from "@/lib/utils";
import type { OwnerMessageRow } from "@/lib/messages/status";
import type { User } from "@supabase/supabase-js";

type Profile = { id: string; full_name: string | null; email: string | null };

const SUBJECT_LABELS: Record<string, string> = {
  reversement: "Reversement / Facturation",
  disponibilites: "Disponibilités",
  contrat: "Mon contrat",
  autre: "Autre",
};

export function AdminOwnerMessagesPanel() {
  const supabase = getSupabaseBrowser();
  const [messages, setMessages] = useState<OwnerMessageRow[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(true);
  const [activeOwnerId, setActiveOwnerId] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [adminUserId, setAdminUserId] = useState<string | null>(null);

  const fetchAll = async () => {
    if (!supabase) return;
    const { data } = await supabase
      .from("owner_messages")
      .select("*")
      .order("created_at", { ascending: true });
    const rows = (data ?? []) as OwnerMessageRow[];
    setMessages(rows);

    const ownerIds = [...new Set(rows.map((r) => r.owner_id))];
    if (ownerIds.length > 0) {
      const { data: profileRows } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", ownerIds);
      const map: Record<string, Profile> = {};
      (profileRows ?? []).forEach((p: any) => {
        map[p.id] = p as Profile;
      });
      setProfiles(map);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }: { data: { user: User | null } }) => setAdminUserId(data.user?.id ?? null));
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  useEffect(() => {
    if (!supabase) return;
    const existing = supabase.getChannels().find((c: { topic: string }) => c.topic === "admin-owner-messages-realtime");
    if (existing) return;

    const channel = supabase
      .channel("admin-owner-messages-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "owner_messages" }, fetchAll)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "owner_messages" }, fetchAll)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  const conversations = useMemo(() => {
    const map = new Map<string, OwnerMessageRow[]>();
    for (const m of messages) {
      const list = map.get(m.owner_id) ?? [];
      list.push(m);
      map.set(m.owner_id, list);
    }
    return [...map.entries()].sort(
      (a, b) =>
        new Date(b[1][b[1].length - 1]?.created_at ?? 0).getTime() -
        new Date(a[1][a[1].length - 1]?.created_at ?? 0).getTime()
    );
  }, [messages]);

  useEffect(() => {
    if (!activeOwnerId && conversations.length > 0) {
      setActiveOwnerId(conversations[0][0]);
    }
  }, [conversations, activeOwnerId]);

  const thread = activeOwnerId ? conversations.find(([id]) => id === activeOwnerId)?.[1] ?? [] : [];

  useEffect(() => {
    if (!supabase || !activeOwnerId) return;
    const hasUnread = thread.some((m) => m.sender_role === "owner" && m.read_at === null);
    if (!hasUnread) return;
    supabase
      .from("owner_messages")
      .update({ read_at: new Date().toISOString() })
      .eq("owner_id", activeOwnerId)
      .eq("sender_role", "owner")
      .is("read_at", null)
      .then(() => fetchAll());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeOwnerId]);

  const handleSend = async () => {
    if (!supabase || !reply.trim() || !activeOwnerId || !adminUserId) return;
    setSending(true);
    const lastOwnerSubject =
      [...thread].reverse().find((m) => m.sender_role === "owner")?.subject ?? "autre";
    const { error } = await supabase.from("owner_messages").insert({
      owner_id: activeOwnerId,
      sender_id: adminUserId,
      sender_role: "admin",
      subject: lastOwnerSubject,
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
        description="Les messages des propriétaires apparaîtront ici."
      />
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      <aside className="border border-navy/10 bg-white divide-y divide-navy/5 max-h-[60vh] overflow-y-auto">
        {conversations.map(([ownerId, rows]) => {
          const last = rows[rows.length - 1];
          const profile = profiles[ownerId];
          const hasUnread = rows.some((m) => m.sender_role === "owner" && m.read_at === null);
          return (
            <button
              key={ownerId}
              type="button"
              onClick={() => setActiveOwnerId(ownerId)}
              className={`w-full text-left px-4 py-3 text-sm hover:bg-navy/[0.02] ${
                activeOwnerId === ownerId ? "bg-gold/5" : ""
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium text-navy truncate">
                  {profile?.full_name ?? profile?.email ?? "Propriétaire"}
                </p>
                {hasUnread && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />}
              </div>
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
            placeholder="Répondre au propriétaire…"
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
