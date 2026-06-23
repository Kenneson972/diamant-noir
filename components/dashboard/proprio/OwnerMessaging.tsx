"use client";

import { useState, useEffect, useRef } from "react";
import { getSupabaseBrowser } from "@/lib/supabase";
import { Send } from "lucide-react";
import { KayvilaPngIcon } from "@/components/icons/KayvilaPngIcon";

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  subject: string;
  content: string;
  created_at: string;
  read_at: string | null;
}

interface OwnerMessagingProps {
  userId: string;
}

export function OwnerMessaging({ userId }: OwnerMessagingProps) {
  const supabase = getSupabaseBrowser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newSubject, setNewSubject] = useState("");
  const [newContent, setNewContent] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load messages
  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    (async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .order("created_at", { ascending: false });

      setMessages((data ?? []) as Message[]);
      setLoading(false);
    })();
  }, [supabase, userId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages]);

  // Poll every 30s
  useEffect(() => {
    if (!supabase) return;
    const interval = setInterval(async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .order("created_at", { ascending: false });
      if (data) setMessages(data as Message[]);
    }, 30000);
    return () => clearInterval(interval);
  }, [supabase, userId]);

  const handleSend = async () => {
    if (!supabase || !newContent.trim() || sending) return;
    setSending(true);
    const subject = newSubject.trim() || "Sans objet";
    const { data, error } = await supabase.from("messages").insert({
      sender_id: userId,
      receiver_id: null, // admin — will be picked up by admin dashboard
      subject,
      content: newContent.trim(),
    }).select().single();

    if (!error && data) {
      setMessages((prev) => [data as Message, ...prev]);
      setNewSubject("");
      setNewContent("");
    }
    setSending(false);
  };

  if (loading) {
    return (
      <div className="dashboard-card p-8 text-center">
        <p className="text-sm text-muted">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-card flex flex-col min-h-[calc(100dvh-12rem)]">
      <div ref={containerRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <KayvilaPngIcon name="message" size={24} className="text-muted mb-3" />
            <p className="text-sm text-muted">Aucun message pour le moment.</p>
            <p className="text-xs text-muted mt-1">
              Utilisez le formulaire ci-dessous pour contacter l&apos;équipe Kayvila.
            </p>
          </div>
        ) : (
          [...messages].reverse().map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender_id === userId ? "items-end" : "items-start"}`}
            >
              <div
                className={`max-w-[70%] px-4 py-2.5 text-sm ${
                  msg.sender_id === userId
                    ? "bg-navy text-white rounded-xl rounded-br-sm"
                    : "bg-gray-100 text-navy rounded-xl rounded-bl-sm"
                }`}
              >
                <p className="text-[10px] font-semibold uppercase tracking-wide opacity-60 mb-1">
                  {msg.subject}
                </p>
                <p className="whitespace-pre-line">{msg.content}</p>
              </div>
              <span className="text-[9px] text-muted mt-1 px-2">
                {new Date(msg.created_at).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          ))
        )}
      </div>

      <div className="border-t border-navy/10 p-4 space-y-3">
        <input
          type="text"
          value={newSubject}
          onChange={(e) => setNewSubject(e.target.value)}
          placeholder="Sujet du message"
          className="w-full border border-navy/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gold/50"
        />
        <div className="flex gap-2">
          <textarea
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder="Votre message..."
            rows={2}
            className="flex-1 border border-navy/10 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-gold/50"
          />
          <button
            onClick={handleSend}
            disabled={sending || !newContent.trim()}
            className="shrink-0 inline-flex items-center justify-center w-10 h-10 bg-navy text-white rounded-lg hover:bg-gold hover:text-navy disabled:opacity-60 transition-colors"
          >
            <Send size={16} strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </div>
  );
}
