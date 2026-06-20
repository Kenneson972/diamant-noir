"use client";

import { useState, useRef, useEffect } from "react";
import { ArrowUp, Sparkles, RotateCcw } from "lucide-react";
import { useCopilotContext } from "@/components/dashboard/proprio/CopilotContext";
import { CopilotMessage } from "@/components/dashboard/proprio/CopilotMessage";
import { CopilotActionCard } from "@/components/dashboard/CopilotActionCard";

export function DashboardCopilotChat({
  fullHeight = false,
}: {
  /** Pleine hauteur (page dédiée) au lieu d'une carte 400px (dashboard) */
  fullHeight?: boolean;
}) {
  const {
    messages,
    isLoading,
    sendMessage,
    suggestedPrompts,
    clearMessages,
    lastActionResult,
  } = useCopilotContext();

  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage(input);
    setInput("");
    inputRef.current?.focus();
  };

  return (
    <div
      className={`rounded-lg border border-navy/10 bg-white shadow-sm ${
        fullHeight ? "flex h-[calc(100dvh-13rem)] flex-col" : ""
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-navy/5 px-5 py-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-gold" aria-hidden />
          <span className="font-display text-sm font-semibold text-navy">
            Diamant — Votre copilot Kayvila
          </span>
        </div>
        <button
          type="button"
          onClick={clearMessages}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium uppercase tracking-[0.1em] text-navy/40 transition-colors hover:text-navy/70"
          aria-label="Réinitialiser la conversation"
        >
          <RotateCcw className="h-3 w-3" />
          Reset
        </button>
      </div>

      {/* Messages */}
      <div
        className={`overflow-y-auto px-5 py-4 ${fullHeight ? "flex-1" : ""}`}
        style={fullHeight ? undefined : { maxHeight: 400 }}
      >
        {messages.length === 1 && messages[0].role === "assistant" ? (
          /* État vide — message d'accueil */
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Sparkles className="mb-3 h-8 w-8 text-gold/40" aria-hidden />
            <p className="text-[13px] leading-relaxed text-navy/60">
              Bonjour, je suis Diamant, votre copilot Kayvila.
              <br />
              Posez-moi une question sur vos villas, réservations ou revenus.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <CopilotMessage key={msg.id} message={msg} />
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy-900">
                  <Sparkles className="h-4 w-4 text-white" aria-hidden />
                </div>
                <div className="rounded-bl-sm rounded-xl bg-cream p-3">
                  <div className="flex gap-1.5">
                    <span className="dn-typing-dot h-2 w-2 rounded-full bg-navy-900/40" />
                    <span
                      className="dn-typing-dot h-2 w-2 rounded-full bg-navy-900/40"
                      style={{ animationDelay: "0.15s" }}
                    />
                    <span
                      className="dn-typing-dot h-2 w-2 rounded-full bg-navy-900/40"
                      style={{ animationDelay: "0.3s" }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Action result card */}
            {lastActionResult && !isLoading && (
              <CopilotActionCard
                action={lastActionResult.action}
                result={lastActionResult}
              />
            )}

            {/* Suggested prompts */}
            {!isLoading && suggestedPrompts.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {suggestedPrompts.slice(0, 4).map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => {
                      sendMessage(prompt);
                    }}
                    disabled={isLoading}
                    className="rounded-full border border-navy/15 bg-white px-3 py-1.5 text-[11px] text-navy/80 transition-colors hover:border-gold/40 hover:text-navy disabled:opacity-50"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-navy/5 px-4 py-3">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Posez votre question..."
            disabled={isLoading}
            className="flex-1 rounded-lg border border-navy/15 bg-cream px-4 py-2.5 text-sm text-navy-900 placeholder:text-navy/30 outline-none focus:border-navy-900 focus:ring-1 focus:ring-navy-900 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-navy-900 text-white transition-colors hover:bg-navy-800 disabled:opacity-40"
            aria-label="Envoyer"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
