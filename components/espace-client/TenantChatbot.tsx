"use client";

import { useState, useEffect, useRef } from "react";
import { getSupabaseBrowser } from "@/lib/supabase";

// ── Types ────────────────────────────────────────────────────────────────────

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface TenantChatbotProps {
  guestEmail: string;
  guestName?: string;
  bookingId?: string;
  userId?: string;
}

// ── Session ID (stable localStorage) ─────────────────────────────────────────

function getOrCreateSessionId(userId?: string): string {
  const key = `dk_session_${userId ?? "guest"}`;
  try {
    const existing = localStorage.getItem(key);
    if (existing) return existing;
    const newId = `tenant-${userId ?? "anon"}-${Date.now()}`;
    localStorage.setItem(key, newId);
    return newId;
  } catch {
    return `tenant-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTime(d: Date): string {
  return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function makeWelcomeMessage(guestName?: string): Message {
  return {
    role: "assistant",
    content: `Bonjour${guestName ? ` ${guestName}` : ""}\n\nJe suis votre assistante Kayvila. Comment puis-je vous aider pendant votre séjour ?`,
    timestamp: new Date(),
  };
}

// ── Quick actions ─────────────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  "Signaler un problème",
  "Infos pratiques",
  "Contact urgence",
  "Horaires check-in/out",
];

// ── Component ─────────────────────────────────────────────────────────────────

export function TenantChatbot({
  guestEmail,
  guestName,
  bookingId,
  userId,
}: TenantChatbotProps) {
  const supabase = getSupabaseBrowser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [sessionId] = useState<string>(() => {
    if (typeof window === "undefined") return `tenant-${Date.now()}`;
    return getOrCreateSessionId(userId);
  });
  const endRef = useRef<HTMLDivElement>(null);

  // ── Load history from Supabase ──────────────────────────────────────────────
  useEffect(() => {
    if (!supabase) {
      setMessages([makeWelcomeMessage(guestName)]);
      setHistoryLoaded(true);
      return;
    }
    (async () => {
      try {
        // @ts-ignore — table chat_messages may not be in generated Database types yet
        const { data } = await supabase
          .from("chat_messages")
          .select("role, content, created_at")
          .eq("session_id", sessionId)
          .order("created_at", { ascending: true });

        if (data && (data as unknown[]).length > 0) {
          setMessages(
            (data as Array<{ role: string; content: string; created_at: string }>).map((m) => ({
              role: m.role as "user" | "assistant",
              content: m.content,
              timestamp: new Date(m.created_at),
            }))
          );
        } else {
          setMessages([makeWelcomeMessage(guestName)]);
        }
      } catch {
        setMessages([makeWelcomeMessage(guestName)]);
      }
      setHistoryLoaded(true);
    })();
  }, [supabase, sessionId, guestName]);

  // ── Scroll to bottom on new messages ───────────────────────────────────────
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // ── Save message to Supabase ────────────────────────────────────────────────
  const saveMessage = async (role: "user" | "assistant", content: string) => {
    if (!supabase) return;
    try {
      // @ts-ignore — table chat_messages may not be in generated Database types yet
      await supabase.from("chat_messages").insert({
        session_id: sessionId,
        user_id: userId ?? guestEmail,
        role,
        content,
      });
    } catch {
      // Graceful degradation
    }
  };

  // ── Send message ────────────────────────────────────────────────────────────
  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    setInput("");
    const userMsg: Message = { role: "user", content: trimmed, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    await saveMessage("user", trimmed);

    try {
      const res = await fetch("/api/chat/tenant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, sessionId, bookingId, guestEmail }),
      });
      const data = await res.json();
      const reply: string = data.success
        ? data.response
        : "Une erreur est survenue. Veuillez réessayer ou nous contacter directement.";
      const assistantMsg: Message = { role: "assistant", content: reply, timestamp: new Date() };
      setMessages((prev) => [...prev, assistantMsg]);
      await saveMessage("assistant", reply);
    } catch {
      const errorMsg: Message = {
        role: "assistant",
        content: "Impossible de contacter le service. Veuillez nous appeler directement.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  // ── Loading skeleton (history loading) ─────────────────────────────────────
  if (!historyLoaded) {
    return (
      <div className="flex h-full items-center justify-center bg-offwhite">
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="dn-typing-dot w-2 h-2 rounded-full bg-navy/15"
              style={{ animationDelay: `${i * 160}ms` }}
            />
          ))}
        </div>
      </div>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-full flex-col bg-offwhite">
      <div
        className="flex-1 min-h-0 overflow-y-auto px-5 py-5 space-y-4"
        role="log"
        aria-live="polite"
        aria-label="Historique de conversation"
      >
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex flex-col gap-1 ${msg.role === "user" ? "items-end" : "items-start"}`}
          >
            <div
              className={
                msg.role === "user"
                  ? "max-w-[78%] bg-navy px-4 py-3 text-[13px] leading-relaxed whitespace-pre-line text-white"
                  : "max-w-[78%] border border-navy/8 bg-white px-4 py-3 font-display text-[14px] font-light leading-relaxed whitespace-pre-line text-navy"
              }
              style={{
                borderRadius: msg.role === "user" ? "8px 0 8px 8px" : "0 8px 8px 8px",
              }}
            >
              {msg.content}
            </div>
            <span className="px-1 text-[6.5px] uppercase tracking-[0.12em] text-navy/25">
              {formatTime(msg.timestamp)}
            </span>
          </div>
        ))}

        {loading && (
          <div className="flex items-start">
            <div
              className="flex items-center gap-1.5 border border-navy/8 bg-white px-4 py-3"
              style={{ borderRadius: "0 8px 8px 8px" }}
            >
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="dn-typing-dot size-1.5 rounded-full bg-navy/30"
                  style={{ animationDelay: `${i * 160}ms` }}
                />
              ))}
            </div>
          </div>
        )}

        <div ref={endRef} />
      </div>

      {messages.length === 1 && !loading && (
        <div className="px-5 pb-3 flex flex-wrap gap-2 shrink-0">
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action}
              type="button"
              onClick={() => sendMessage(action)}
              className="border border-navy/10 bg-white px-4 py-2 text-[8px] uppercase tracking-[0.14em] text-navy/50 transition-colors hover:border-gold/40 hover:text-gold"
            >
              {action}
            </button>
          ))}
        </div>
      )}

      <div className="shrink-0 border-t border-navy/10 bg-white px-4 pb-4 pt-3">
        <form onSubmit={handleSubmit} className="flex items-end gap-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Écrivez votre message…"
            rows={1}
            className="flex-1 resize-none border border-navy/10 bg-offwhite px-4 py-3 font-display text-[14px] italic text-navy placeholder:text-navy/30 focus:border-gold/50 focus:outline-none"
            style={{ minHeight: 44, maxHeight: 120 }}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            aria-label="Envoyer le message"
            className="flex h-[44px] w-[44px] shrink-0 items-center justify-center bg-navy text-white transition-colors hover:bg-gold hover:text-navy disabled:cursor-not-allowed disabled:opacity-40"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
              <path
                d="M12 7L2 2l2 5-2 5 10-5z"
                stroke="currentColor"
                strokeWidth="1"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </form>
        <div className="flex items-center justify-between mt-2 px-0.5">
          <p className="text-[6.5px] uppercase tracking-[0.14em] text-navy/20">
            Échanges conservés pour la qualité du service
          </p>
          <p className="text-[6.5px] uppercase tracking-[0.14em] text-navy/20">
            Conversation sauvegardée
          </p>
        </div>
      </div>
    </div>
  );
}
