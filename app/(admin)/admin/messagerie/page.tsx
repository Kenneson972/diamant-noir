"use client";

import { useState, useEffect, useRef } from "react";
import { getSupabaseBrowser } from "@/lib/supabase";
import { AdminPageIntro } from "@/components/dashboard/admin/AdminPageIntro";
import { Send, MessageCircle } from "lucide-react";
import { timeAgo, formatDate } from "@/lib/utils";

interface Message {
  id: string;
  sender: string;
  message: string;
  created_at: string;
  guest_name?: string;
  guest_email?: string;
}

export default function AdminMessageriePage() {
  const supabase = getSupabaseBrowser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    if (!supabase) return;
    const { data } = await supabase
      .from("chat_messages")
      .select("id, sender, message, created_at, booking_id, villa_id")
      .order("created_at", { ascending: false })
      .limit(50);
    setMessages(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchMessages(); }, [supabase]);

  useEffect(() => {
    if (!supabase) return;
    const channel = supabase
      .channel("admin-chat")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages" }, () => {
        fetchMessages();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supabase]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !reply.trim()) return;
    setSending(true);
    await supabase.from("chat_messages").insert({
      sender: "admin",
      message: reply.trim(),
    });
    setReply("");
    setSending(false);
    fetchMessages();
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="space-y-6">
      <AdminPageIntro title="Messagerie" description="Console de chat — répondez aux messages des clients." />

      {loading ? (
        <p className="text-sm text-navy/55">Chargement...</p>
      ) : messages.length === 0 ? (
        <div className="border border-navy/10 bg-white p-12 text-center">
          <MessageCircle size={32} className="text-navy/15 mx-auto mb-3" />
          <p className="text-sm text-navy/55">Aucun message.</p>
          <p className="text-[11px] text-navy/30 mt-1">Les messages des clients apparaîtront ici en temps réel.</p>
        </div>
      ) : (
        <div className="border border-navy/10 bg-white">
          <div className="max-h-[60vh] overflow-y-auto p-4 space-y-3">
            {[...messages].reverse().map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === "admin" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[70%] rounded-lg px-4 py-2.5 ${msg.sender === "admin" ? "bg-navy text-white" : "bg-navy/[0.04] text-navy"}`}>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.1em] opacity-60">
                      {msg.sender === "admin" ? "Kayvila" : msg.sender}
                    </span>
                    <span className="text-[9px] opacity-40">{timeAgo(msg.created_at)}</span>
                  </div>
                  <p className="text-sm">{msg.message}</p>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
          <form onSubmit={handleSend} className="flex items-center gap-2 p-4 border-t border-navy/10">
            <input
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="Écrire une réponse..."
              className="flex-1 border border-navy/15 bg-white px-4 py-2.5 text-sm focus:outline-none focus:border-gold/50"
            />
            <button type="submit" disabled={sending || !reply.trim()}
              className="inline-flex items-center gap-1.5 bg-navy px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-white hover:bg-navy/90 disabled:opacity-40 transition-colors">
              <Send size={12} />
              {sending ? "..." : "Envoyer"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
