"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import {
  X,
  Send,
  Maximize2,
  Minimize2,
  Sparkles,
  RotateCcw,
  ExternalLink,
  Phone,
} from "lucide-react";
import { useMediaQuery } from "@/lib/use-media-query";
import type {
  ChatMessage,
  ChatbotRequest,
  ChatbotResponse,
  ChatStage,
  LeadData,
  SuggestedVilla,
  ChatCta,
} from "@/types/chatbot";

// ─── Suggestions par défaut ───────────────────────────────────────────────────
const DEFAULT_SUGGESTIONS = [
  "Découvrir nos villas",
  "Demander une disponibilité",
  "Tarifs et services",
  "Contacter le concierge",
];

const BOOKING_SUGGESTIONS = [
  "Réserver pour 2 personnes",
  "Réserver pour 4 personnes",
  "Réserver pour 8 personnes",
  "Voir les disponibilités",
];

const PRICING_SUGGESTIONS = [
  "Tarif pour une semaine",
  "Tarif pour un weekend",
  "Tarif par nuit",
  "Y a-t-il des offres ?",
];

// ─── Utilitaires ──────────────────────────────────────────────────────────────
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}

function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return generateId();
  let id = localStorage.getItem("diamant_noir_session_id");
  if (!id) {
    id = `session-${generateId()}`;
    localStorage.setItem("diamant_noir_session_id", id);
  }
  return id;
}

function clearSession(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("diamant_noir_session_id");
  }
}

// ─── Composant VillaCard (suggestion inline) ──────────────────────────────────
function VillaCard({ villa }: { villa: SuggestedVilla }) {
  return (
    <a
      href={villa.slug ? `/villas/${villa.slug}` : `/villas/${villa.id}`}
      className="flex items-center gap-3 rounded-2xl border border-black/10 bg-white p-3 text-left transition-all hover:border-black/30 hover:shadow-sm"
    >
      {villa.imageUrl && (
        <img
          src={villa.imageUrl}
          alt={villa.name}
          className="h-14 w-20 flex-shrink-0 rounded-xl object-cover"
        />
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-black">{villa.name}</p>
        {villa.location && (
          <p className="text-xs text-black/50">{villa.location}</p>
        )}
        <p className="text-xs font-medium text-black/70">
          À partir de {villa.pricePerNight.toLocaleString("fr-FR")} €/nuit
        </p>
        {villa.matchReason && (
          <p className="mt-0.5 text-[11px] italic text-black/40">{villa.matchReason}</p>
        )}
      </div>
      <ExternalLink size={14} className="flex-shrink-0 text-black/30" />
    </a>
  );
}

// ─── Composant CTA ────────────────────────────────────────────────────────────
function CtaButton({ cta }: { cta: ChatCta }) {
  if (!cta || cta.type === "none") return null;

  const href = cta.url || (cta.villaId ? `/villas/${cta.villaId}` : "/contact");
  const label = cta.label || "En savoir plus";

  return (
    <a
      href={href}
      className="mt-2 inline-flex items-center gap-2 rounded-full border border-black bg-black px-5 py-2.5 text-xs font-semibold text-white transition-all hover:bg-black/85"
    >
      {cta.type === "callback" || cta.type === "contact" ? (
        <Phone size={14} />
      ) : (
        <ExternalLink size={14} />
      )}
      {label}
    </a>
  );
}

// ─── Rendu du contenu d'un message ────────────────────────────────────────────
function MessageContent({ content }: { content: string }) {
  const urlRegex = /(https?:\/\/[^\s]+|\/(villas|book|contact|experience)[^\s]*)/g;
  return (
    <>
      {content.split("\n").map((line, i) => {
        const parts: (string | React.ReactElement)[] = [];
        let last = 0;
        let match;
        urlRegex.lastIndex = 0;
        while ((match = urlRegex.exec(line)) !== null) {
          if (match.index > last) parts.push(line.slice(last, match.index));
          const url = match[0];
          parts.push(
            <a
              key={`l-${i}-${parts.length}`}
              href={url}
              target={url.startsWith("http") ? "_blank" : undefined}
              rel={url.startsWith("http") ? "noopener noreferrer" : undefined}
              className="underline underline-offset-2 opacity-80 hover:opacity-100"
            >
              {url}
            </a>
          );
          last = match.index + match[0].length;
        }
        if (last < line.length) parts.push(line.slice(last));
        return (
          <p key={i} className="mb-1.5 last:mb-0">
            {parts}
          </p>
        );
      })}
    </>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────
export const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [quickSuggestions, setQuickSuggestions] = useState<string[]>([]);
  const [currentStage, setCurrentStage] = useState<ChatStage>("greet");
  const [leadData, setLeadData] = useState<Partial<LeadData>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const sessionIdRef = useRef<string>("");

  const pathname = usePathname();
  const isMobile = useMediaQuery("(max-width: 768px)");

  const hidden = Boolean(
    pathname?.startsWith("/dashboard") || pathname?.startsWith("/login")
  );

  // Extraction du villaId depuis la page courante (/villas/[id])
  const currentVillaId = (() => {
    if (!pathname) return undefined;
    const match = pathname.match(/^\/villas\/([^/]+)/);
    return match?.[1];
  })();

  // Message de bienvenue
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        id: generateId(),
        role: "assistant",
        content:
          "Bonjour, bienvenue chez Diamant Noir.\n\nJe suis votre concierge privé. Je peux vous présenter nos villas, vous aider à trouver la résidence idéale, et préparer votre séjour.\n\nComment puis-je vous être utile ?",
        timestamp: Date.now(),
      }]);
      setQuickSuggestions(DEFAULT_SUGGESTIONS);
    }
  }, [messages.length]);

  // Écoute de l'événement d'ouverture depuis d'autres composants
  useEffect(() => {
    const handler = () => setIsOpen(true);
    window.addEventListener("openChatbot", handler);
    return () => window.removeEventListener("openChatbot", handler);
  }, []);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      if (inputMessage) {
        textareaRef.current.style.height =
          Math.min(textareaRef.current.scrollHeight, 150) + "px";
      }
    }
  }, [inputMessage]);

  const sendMessage = useCallback(
    async (text?: string) => {
      const toSend = (text || inputMessage).trim();
      if (!toSend || isLoading) return;

      if (!sessionIdRef.current) {
        sessionIdRef.current = getOrCreateSessionId();
      }

      setInputMessage("");
      setIsLoading(true);
      setQuickSuggestions([]);

      const userMsg: ChatMessage = {
        id: generateId(),
        role: "user",
        content: toSend,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, userMsg]);

      try {
        const requestBody: ChatbotRequest = {
          message: toSend,
          sessionId: sessionIdRef.current,
          locale: "fr",
          currentPage: pathname || "/",
          villaId: currentVillaId,
          knownLeadData: leadData,
          currentStage,
          source: "website_chatbot",
        };

        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data: ChatbotResponse = await res.json();

        if (!data.success) throw new Error("API error");

        // Mise à jour sessionId confirmé
        if (data.sessionId) sessionIdRef.current = data.sessionId;

        // Mise à jour stage
        if (data.stage) setCurrentStage(data.stage);

        // Fusion des données lead collectées
        if (data.leadUpdate && Object.keys(data.leadUpdate).length > 0) {
          setLeadData((prev) => ({ ...prev, ...data.leadUpdate }));
        }

        // Suggestions rapides dynamiques
        const lower = toSend.toLowerCase();
        if (data.suggestedQuickReplies && data.suggestedQuickReplies.length > 0) {
          setQuickSuggestions(data.suggestedQuickReplies);
        } else if (lower.includes("réserver") || lower.includes("disponibilité")) {
          setQuickSuggestions(BOOKING_SUGGESTIONS);
        } else if (lower.includes("prix") || lower.includes("tarif")) {
          setQuickSuggestions(PRICING_SUGGESTIONS);
        } else {
          setQuickSuggestions(DEFAULT_SUGGESTIONS);
        }

        const assistantMsg: ChatMessage = {
          id: generateId(),
          role: "assistant",
          content: data.reply,
          timestamp: Date.now(),
          metadata: {
            intent: data.intent,
            stage: data.stage,
            cta: data.cta,
            suggestedVillas: data.suggestedVillas,
            comparisonData: data.comparisonData,
            preBooking: data.preBooking,
            shouldEscalate: data.shouldEscalateToHuman,
          },
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } catch (err) {
        console.error("[Chatbot] Error:", err);
        setMessages((prev) => [
          ...prev,
          {
            id: generateId(),
            role: "assistant",
            content:
              "Je rencontre une difficulté technique passagère. Veuillez réessayer ou contacter directement notre équipe.",
            timestamp: Date.now(),
          },
        ]);
        setQuickSuggestions(DEFAULT_SUGGESTIONS);
      } finally {
        setIsLoading(false);
      }
    },
    [inputMessage, isLoading, pathname, currentVillaId, leadData, currentStage]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleReset = () => {
    clearSession();
    sessionIdRef.current = "";
    setMessages([]);
    setLeadData({});
    setCurrentStage("greet");
    setQuickSuggestions([]);
  };

  if (hidden) return null;

  return (
    <>
      {/* FAB */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group fixed bottom-8 right-8 z-50 flex h-16 w-16 items-center justify-center rounded-2xl bg-black text-white shadow-[0_20px_50px_rgba(0,0,0,0.25)] transition-all hover:scale-110 hover:bg-black/90"
          aria-label="Ouvrir le concierge"
        >
          <Sparkles className="relative z-10 animate-pulse" size={28} />
          <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-white text-[10px] font-bold text-black shadow-lg">
            💎
          </span>
        </button>
      )}

      {/* Fenêtre de chat */}
      {isOpen && (
        <div
          className={`fixed z-50 flex flex-col bg-white shadow-2xl transition-all ${
            isFullscreen || isMobile
              ? "inset-0 h-screen w-screen rounded-none"
              : "bottom-6 right-6 h-[620px] w-[420px] rounded-[32px]"
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 bg-black p-5 text-white">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white font-display text-xl font-bold text-black shadow-lg">
                  D
                </div>
                <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-black bg-emerald-400" />
              </div>
              <div>
                <h3 className="font-display text-lg tracking-wide">Conciergerie IA</h3>
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">
                  Diamant Noir
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleReset}
                className="rounded-full p-2 transition-colors hover:bg-white/10"
                title="Nouvelle conversation"
                aria-label="Réinitialiser"
              >
                <RotateCcw size={16} />
              </button>
              {!isMobile && (
                <button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="rounded-full p-2 transition-colors hover:bg-white/10"
                  aria-label={isFullscreen ? "Réduire" : "Agrandir"}
                >
                  {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-full p-2 transition-colors hover:bg-white/10"
                aria-label="Fermer"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto bg-[#FAFAFA] p-5 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black font-display text-sm font-bold text-white">
                    D
                  </div>
                )}
                <div
                  className={`flex max-w-[86%] flex-col gap-2 ${
                    msg.role === "user" ? "items-end" : "items-start"
                  }`}
                >
                  <div
                    className={`rounded-[24px] px-5 py-3.5 shadow-sm ${
                      msg.role === "user"
                        ? "rounded-tr-none bg-gradient-to-tr from-black to-neutral-800 text-white"
                        : "rounded-tl-none border border-black/10 bg-white text-black"
                    }`}
                  >
                    <div className="text-sm font-medium leading-relaxed">
                      <MessageContent content={msg.content} />
                    </div>
                  </div>

                  {/* Villas suggérées */}
                  {msg.metadata?.suggestedVillas && msg.metadata.suggestedVillas.length > 0 && (
                    <div className="w-full space-y-2">
                      {msg.metadata.suggestedVillas.map((v) => (
                        <VillaCard key={v.id} villa={v} />
                      ))}
                    </div>
                  )}

                  {/* CTA */}
                  {msg.metadata?.cta && msg.metadata.cta.type !== "none" && (
                    <CtaButton cta={msg.metadata.cta} />
                  )}

                  {/* Escalade humain */}
                  {msg.metadata?.shouldEscalate && (
                    <a
                      href="/contact"
                      className="mt-1 inline-flex items-center gap-2 rounded-full border border-black/20 bg-white px-4 py-2 text-xs font-semibold text-black transition-all hover:border-black"
                    >
                      <Phone size={12} />
                      Parler à un conseiller
                    </a>
                  )}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isLoading && (
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black font-display text-sm font-bold text-white">
                  D
                </div>
                <div className="flex items-center gap-1 rounded-2xl border border-black/10 bg-white px-4 py-3">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-black/30" />
                  <span
                    className="h-2 w-2 animate-bounce rounded-full bg-black/30"
                    style={{ animationDelay: "0.2s" }}
                  />
                  <span
                    className="h-2 w-2 animate-bounce rounded-full bg-black/30"
                    style={{ animationDelay: "0.4s" }}
                  />
                </div>
              </div>
            )}

            {/* Quick suggestions */}
            {quickSuggestions.length > 0 && !isLoading && (
              <div className="flex flex-wrap gap-2 pt-1">
                {quickSuggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(s)}
                    disabled={isLoading}
                    className="rounded-full border border-black/15 bg-white px-4 py-2 text-xs font-semibold text-black transition-all hover:border-black hover:bg-black hover:text-white disabled:opacity-50"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Zone de saisie */}
          <div className="border-t border-black/10 bg-white p-4">
            <div className="flex items-end gap-2">
              <textarea
                ref={textareaRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Tapez votre message..."
                disabled={isLoading}
                rows={1}
                className="flex-1 resize-none rounded-2xl border border-black/10 bg-[#FAFAFA] px-4 py-3 text-sm text-black placeholder:text-black/30 focus:border-black focus:outline-none disabled:opacity-50"
              />
              <button
                onClick={() => sendMessage()}
                disabled={!inputMessage.trim() || isLoading}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-black text-white transition-all hover:bg-black/85 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Envoyer"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
