"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Sparkles } from "lucide-react";

type Message = { role: "user" | "assistant"; text: string };

export function AgentChat({
  endpoint,
  title,
  placeholder = "Écrivez votre message...",
  suggestedPrompts = [],
}: {
  endpoint: string;
  title: string;
  placeholder?: string;
  suggestedPrompts?: string[];
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;
    setInput("");
    setError("");
    setMessages((prev) => [...prev, { role: "user", text: msg }]);
    setLoading(true);

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setMessages((prev) => [...prev, { role: "assistant", text: data.response ?? "Pas de réponse." }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur réseau");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-12rem)] rounded-2xl border border-navy/10 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-navy/10 px-5 py-4">
        <Sparkles size={18} className="text-gold" />
        <h2 className="text-[12px] font-bold uppercase tracking-[0.2em] text-navy">{title}</h2>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-4 pt-12 text-navy/40">
            <Sparkles size={32} strokeWidth={1} />
            <p className="text-[12px] font-semibold uppercase tracking-[0.15em]">Assistant IA</p>
            <p className="text-[11px] text-center max-w-xs">Posez une question sur vos villas, réservations ou revenus.</p>
            {suggestedPrompts.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2 mt-2">
                {suggestedPrompts.map((p) => (
                  <button
                    key={p}
                    onClick={() => send(p)}
                    className="rounded-full border border-navy/10 px-3 py-1.5 text-[10px] text-navy/60 hover:border-gold/30 hover:bg-gold/[0.04] transition-colors"
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-[12px] leading-relaxed ${
              m.role === "user"
                ? "bg-navy text-white rounded-br-md"
                : "bg-navy/[0.04] text-navy rounded-bl-md"
            }`}>
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-2xl rounded-bl-md bg-navy/[0.04] px-4 py-3">
              <Loader2 size={14} className="animate-spin text-navy/40" />
              <span className="text-[11px] text-navy/40">Réflexion...</span>
            </div>
          </div>
        )}
        {error && (
          <div className="flex justify-center">
            <p className="text-[11px] text-red-500">{error}</p>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-navy/10 px-5 py-4">
        <form
          onSubmit={(e) => { e.preventDefault(); send(); }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholder}
            disabled={loading}
            className="flex-1 rounded-full border border-navy/15 px-4 py-2.5 text-[12px] text-navy placeholder:text-navy/30 focus:outline-none focus:border-gold/50 disabled:opacity-40"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-navy text-white hover:bg-navy/90 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          </button>
        </form>
      </div>
    </div>
  );
}
