// components/dashboard/proprio/OwnerTeamThread.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase";
import { Send, Phone } from "lucide-react";
import { getOwnerMessageStatus, type OwnerMessageRow } from "@/lib/messages/status";

const SUBJECTS = [
  { value: "reversement", label: "Reversement / Facturation" },
  { value: "disponibilites", label: "Disponibilités" },
  { value: "contrat", label: "Mon contrat" },
  { value: "autre", label: "Autre" },
] as const;

type Subject = (typeof SUBJECTS)[number]["value"];

const STATUS_BADGE: Record<string, string> = {
  sent: "🟡 Envoyé",
  read: "🟢 Lu par l'équipe",
  replied: "✅ Répondu",
};

interface Props {
  ownerId: string;
  firstName: string;
}

export function OwnerTeamThread({ ownerId, firstName }: Props) {
  const supabase = getSupabaseBrowser();
  const [messages, setMessages] = useState<OwnerMessageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState<Subject>("autre");
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    (async () => {
      const { data } = await supabase
        .from("owner_messages")
        .select("*")
        .eq("owner_id", ownerId)
        .order("created_at", { ascending: true });
      setMessages((data ?? []) as OwnerMessageRow[]);
      setLoading(false);

      await supabase
        .from("owner_messages")
        .update({ read_at: new Date().toISOString() })
        .eq("owner_id", ownerId)
        .eq("sender_role", "admin")
        .is("read_at", null);
    })();
  }, [supabase, ownerId]);

  useEffect(() => {
    if (!supabase) return;
    const existing = supabase.getChannels().find((c: { topic: string }) => c.topic === "owner-messages-realtime");
    if (existing) return;

    const channel = supabase
      .channel("owner-messages-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "owner_messages" },
        (payload: any) => {
          const row = payload.new as OwnerMessageRow;
          if (row.owner_id !== ownerId) return;
          setMessages((prev) => (prev.some((m) => m.id === row.id) ? prev : [...prev, row]));
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "owner_messages" },
        (payload: any) => {
          const row = payload.new as OwnerMessageRow;
          if (row.owner_id !== ownerId) return;
          setMessages((prev) => prev.map((m) => (m.id === row.id ? row : m)));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, ownerId]);

  useEffect(() => {
    containerRef.current?.scrollTo({ top: containerRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const handleQuickAction = (value: Subject) => {
    setSubject(value);
    textareaRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    textareaRef.current?.focus();
  };

  const handleSend = async () => {
    if (!supabase || !content.trim() || sending) return;
    setSending(true);
    const { data, error } = await supabase
      .from("owner_messages")
      .insert({
        owner_id: ownerId,
        sender_id: ownerId,
        sender_role: "owner",
        subject,
        content: content.trim(),
      })
      .select()
      .single();

    if (!error && data) {
      setMessages((prev) => [...prev, data as OwnerMessageRow]);
      setContent("");
    }
    setSending(false);
  };

  const messagesWithStatus = useMemo(
    () =>
      messages.map((m) => ({
        ...m,
        status: m.sender_role === "owner" ? getOwnerMessageStatus(m, messages) : null,
      })),
    [messages]
  );

  if (loading) {
    return (
      <div className="dashboard-card p-8 text-center">
        <p className="text-sm text-navy/50">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="dashboard-card p-6 space-y-3">
        <p className="font-display text-lg text-navy">Bonjour {firstName},</p>
        <p className="text-sm text-navy/70">
          Vous avez une question ? Un besoin ? C&apos;est ici que ça se passe.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700">
            ✅ Équipe disponible — réponse sous 24h
          </span>
          <a
            href="tel:+596696681869"
            className="inline-flex items-center gap-1.5 rounded-full bg-navy px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-navy/90"
          >
            <Phone size={12} strokeWidth={1.5} /> +596 696 68 18 69 (7j/7)
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <button
          type="button"
          onClick={() => handleQuickAction("reversement")}
          className="rounded-xl border border-navy/10 bg-white px-4 py-3 text-sm font-medium text-navy hover:border-gold/50"
        >
          💶 Reversement
        </button>
        <button
          type="button"
          onClick={() => handleQuickAction("disponibilites")}
          className="rounded-xl border border-navy/10 bg-white px-4 py-3 text-sm font-medium text-navy hover:border-gold/50"
        >
          📅 Disponibilités
        </button>
        <button
          type="button"
          onClick={() => handleQuickAction("autre")}
          className="rounded-xl border border-navy/10 bg-white px-4 py-3 text-sm font-medium text-navy hover:border-gold/50"
        >
          ❓ Autre demande
        </button>
      </div>

      <div className="dashboard-card flex flex-col min-h-[calc(100dvh-28rem)]">
        <div ref={containerRef} className="flex-1 overflow-y-auto p-4 space-y-3">
          {messagesWithStatus.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <p className="text-sm text-navy/50">
                Vous n&apos;avez pas encore échangé avec nous. C&apos;est le bon moment !
              </p>
            </div>
          ) : (
            messagesWithStatus.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender_role === "owner" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[70%] px-4 py-2.5 text-sm rounded-xl ${
                    msg.sender_role === "owner"
                      ? "bg-navy text-white rounded-br-sm"
                      : `bg-gold/10 text-navy rounded-bl-sm ${msg.read_at === null ? "border-l-2 border-gold" : ""}`
                  }`}
                >
                  {msg.sender_role === "admin" && (
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-gold mb-1">Kayvila</p>
                  )}
                  <p className="whitespace-pre-line">{msg.content}</p>
                </div>
                <div className="flex items-center gap-2 mt-1 px-2">
                  <span className="text-[9px] text-navy/40">
                    {new Date(msg.created_at).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  {msg.status && <span className="text-[9px] text-navy/50">{STATUS_BADGE[msg.status]}</span>}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="border-t border-navy/10 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value as Subject)}
              className="rounded-lg border border-navy/10 px-3 py-2 text-sm text-navy focus:border-gold/50 focus:outline-none"
            >
              {SUBJECTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            <span className="text-[10px] text-navy/40">{content.length}/2000</span>
          </div>
          <div className="flex gap-2">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value.slice(0, 2000))}
              placeholder="Dites-nous tout — on est là pour vous aider..."
              rows={2}
              className="flex-1 border border-navy/10 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-gold/50"
            />
            <button
              onClick={handleSend}
              disabled={sending || !content.trim()}
              className="shrink-0 inline-flex items-center justify-center w-10 h-10 bg-navy text-white rounded-lg hover:bg-gold hover:text-navy disabled:opacity-60 transition-colors"
            >
              <Send size={16} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
