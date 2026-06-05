"use client";

import { useState, useRef, useEffect } from "react";
import { X, ArrowUp, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCopilotContext } from "./CopilotContext";
import { CopilotMessage } from "./CopilotMessage";

export function CopilotPanel() {
  const { isOpen, close, messages, isLoading, sendMessage } =
    useCopilotContext();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage(input);
    setInput("");
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/10"
          onClick={close}
          aria-hidden
        />
      )}

      {/* Panel */}
      <aside
        className={cn(
          "fixed right-0 top-0 z-50 flex h-dvh w-[380px] max-w-[90vw] flex-col bg-white shadow-2xl transition-transform duration-300 ease-out",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
        aria-label="Copilot Diamant"
      >
        {/* Header */}
        <div className="flex items-center justify-between bg-navy-900 px-5 py-5">
          <div>
            <span className="flex items-center gap-2 font-display text-lg text-white">
              <Sparkles className="h-5 w-5" aria-hidden />
              Diamant
            </span>
            <p className="text-xs text-white/50">Votre copilot Kayvila</p>
          </div>
          <button
            type="button"
            onClick={close}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-white/50 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Fermer le copilot"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4">
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
                    <span className="dn-typing-dot h-2 w-2 rounded-full bg-navy-900/40" style={{ animationDelay: "0.15s" }} />
                    <span className="dn-typing-dot h-2 w-2 rounded-full bg-navy-900/40" style={{ animationDelay: "0.3s" }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input */}
        <div className="border-t border-border-subtle px-4 py-4">
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Posez votre question..."
              disabled={isLoading}
              className="flex-1 rounded-lg border border-border-subtle bg-cream px-4 py-2.5 text-sm text-navy-900 placeholder-muted outline-none focus:border-navy-900 focus:ring-1 focus:ring-navy-900 disabled:opacity-50"
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
      </aside>
    </>
  );
}
