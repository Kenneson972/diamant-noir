"use client";

import { useState, useEffect } from "react";
import { Send, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface TenantChatbotProps {
  guestEmail: string;
  guestName?: string;
  bookingId?: string;
}

const QUICK_ACTIONS = [
  "Signaler un problème",
  "Infos pratiques",
  "Contact urgence",
  "Horaires check-in/out",
];

export function TenantChatbot({ guestEmail, guestName, bookingId }: TenantChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: `Bonjour${guestName ? ` ${guestName}` : ""} 👋\n\nJe suis votre assistante SAV Diamant Noir. Comment puis-je vous aider pendant votre séjour ?`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(
    () => `tenant-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
  );

  useEffect(() => {
    const el = document.getElementById("dn-chat-end");
    el?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat/tenant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          sessionId,
          bookingId,
          guestEmail,
        }),
      });

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.success
            ? data.response
            : "Une erreur est survenue. Veuillez réessayer ou nous contacter directement.",
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Impossible de contacter le service. Veuillez nous appeler directement.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent<Element>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="flex flex-col h-full rounded-2xl border border-navy/10 bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-navy/10 bg-navy">
        <MessageCircle size={18} className="text-gold" />
        <div>
          <p className="text-sm font-medium text-white">Assistante SAV</p>
          <p className="text-[10px] text-white/40 uppercase tracking-wider">Diamant Noir · Support</p>
        </div>
        <span className="ml-auto flex items-center gap-1.5 text-[10px] text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
          En ligne
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="p-5 space-y-4">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div className="shrink-0 mt-0.5 h-8 w-8 rounded-full bg-navy/10 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-navy/60">DN</span>
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-line ${
                  msg.role === "user"
                    ? "bg-navy text-white rounded-br-sm"
                    : "bg-navy/5 text-navy rounded-bl-sm"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start gap-2">
              <div className="shrink-0 mt-0.5 h-8 w-8 rounded-full bg-navy/10 flex items-center justify-center">
                <span className="text-[10px] font-bold text-navy/60">DN</span>
              </div>
              <div className="bg-navy/5 rounded-2xl rounded-bl-sm px-4 py-3">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-gold border-t-transparent" aria-label="Chargement" />
              </div>
            </div>
          )}
          <div id="dn-chat-end" />
        </div>
      </div>

      {/* Quick actions */}
      {messages.length === 1 && (
        <div className="px-5 pb-3 flex flex-wrap gap-2">
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action}
              type="button"
              onClick={() => sendMessage(action)}
              className="rounded-full border border-navy/10 bg-offwhite px-3 py-1.5 text-[11px] font-medium text-navy/70 hover:bg-gold/10 hover:text-navy transition-colors"
            >
              {action}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="flex items-end gap-3 px-4 py-3 border-t border-navy/10"
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Écrivez votre message..."
          rows={1}
          className="flex-1 rounded-xl border border-navy/20 bg-transparent px-4 py-3 text-sm text-navy placeholder:text-navy/30 focus:outline-none focus:border-gold resize-none"
          style={{ minHeight: 44, maxHeight: 120 }}
        />
        <Button
          type="submit"
          disabled={loading || !input.trim()}
          variant="ghost"
          className="h-11 w-11 shrink-0 rounded-xl bg-gold text-navy hover:bg-navy hover:text-white transition-colors p-0"
        >
          <Send size={15} />
        </Button>
      </form>
    </div>
  );
}
