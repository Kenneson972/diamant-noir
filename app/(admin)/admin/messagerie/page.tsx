"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { AdminPageIntro } from "@/components/dashboard/admin/AdminPageIntro";
import { Send, MessageCircle } from "lucide-react";
import { KayvilaEmptyState } from "@/components/ui/pro";
import { timeAgo } from "@/lib/utils";

type ChatRow = {
  id: string;
  session_id: string;
  user_id: string;
  role: string;
  content: string;
  created_at: string;
};

export default function AdminMessageriePage() {
  const [messages, setMessages] = useState<ChatRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSession, setActiveSession] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    const res = await fetch("/api/admin/messages", { credentials: "include" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(typeof data.error === "string" ? data.error : "Chargement impossible");
      setLoading(false);
      return;
    }
    setMessages(data.messages ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const sessions = useMemo(() => {
    const map = new Map<string, ChatRow[]>();
    for (const m of messages) {
      const list = map.get(m.session_id) ?? [];
      list.push(m);
      map.set(m.session_id, list);
    }
    return [...map.entries()].sort(
      (a, b) =>
        new Date(b[1][0]?.created_at ?? 0).getTime() -
        new Date(a[1][0]?.created_at ?? 0).getTime()
    );
  }, [messages]);

  useEffect(() => {
    if (!activeSession && sessions.length > 0) {
      setActiveSession(sessions[0][0]);
    }
  }, [sessions, activeSession]);

  const thread = activeSession
    ? (sessions.find(([id]) => id === activeSession)?.[1] ?? []).sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )
    : [];

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reply.trim() || !activeSession) return;
    setSending(true);
    setError(null);
    const res = await fetch("/api/admin/messages", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: activeSession, content: reply.trim() }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(typeof data.error === "string" ? data.error : "Envoi impossible");
      setSending(false);
      return;
    }
    setReply("");
    setSending(false);
    fetchMessages();
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread]);

  return (
    <div className="space-y-6">
      <AdminPageIntro
        title="Messagerie"
        description="Conversations espace client (session_id / content)."
      />

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-navy/55">Chargement...</p>
      ) : sessions.length === 0 ? (
        <KayvilaEmptyState
          icon={<MessageCircle className="size-12" />}
          title="Aucun message"
          description="Les conversations du chatbot et de la messagerie s'afficheront ici."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
          <aside className="border border-navy/10 bg-white divide-y divide-navy/5 max-h-[60vh] overflow-y-auto">
            {sessions.map(([sessionId, rows]) => {
              const last = rows[0];
              return (
                <button
                  key={sessionId}
                  type="button"
                  onClick={() => setActiveSession(sessionId)}
                  className={`w-full text-left px-4 py-3 text-sm hover:bg-navy/[0.02] ${
                    activeSession === sessionId ? "bg-gold/5" : ""
                  }`}
                >
                  <p className="font-medium text-navy truncate">{sessionId}</p>
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
                    m.role === "assistant"
                      ? "ml-auto bg-navy text-white"
                      : "bg-offwhite text-navy"
                  }`}
                >
                  <p>{m.content}</p>
                  <p className="text-[10px] opacity-60 mt-1">{timeAgo(m.created_at)}</p>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
            <form onSubmit={handleSend} className="border-t border-navy/10 p-4 flex gap-2">
              <input
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="Répondre au voyageur…"
                className="flex-1 rounded-lg border border-navy/15 px-3 py-2 text-sm"
              />
              <button
                type="submit"
                disabled={sending || !reply.trim()}
                className="inline-flex items-center gap-1 rounded-lg bg-navy px-4 py-2 text-sm text-white disabled:opacity-40"
              >
                <Send size={14} />
                Envoyer
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
