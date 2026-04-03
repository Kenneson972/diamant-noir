"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { MessageCircle, X, Send, Smile, Maximize2, Minimize2, Sparkles, Headphones, RotateCcw } from "lucide-react";
import { useMediaQuery } from "@/lib/use-media-query";

const QUICK_SUGGESTIONS = {
  default: [
    "Villas avec piscine 🏊‍♂️",
    "Tarifs haute saison 💰",
    "Réserver maintenant 📅",
    "Services conciergerie ✨",
  ],
  booking: [
    "Réserver pour 2 personnes",
    "Réserver pour 4 personnes",
    "Réserver pour 8 personnes",
    "Voir les disponibilités",
  ],
  pricing: [
    "Tarif pour une semaine",
    "Tarif pour un weekend",
    "Tarif par nuit",
    "Y a-t-il des réductions ?",
  ],
};

const EMOJIS = [
  "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇",
  "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚",
  "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🤩",
  "🥳", "😏", "😒", "😞", "😔", "😟", "😕", "🙁", "☹️", "😣",
  "😖", "😫", "😩", "🥺", "😢", "😭", "😤", "😠", "😡", "🤬",
  "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔",
  "👍", "👎", "👌", "✌️", "🤞", "🤟", "🤘", "🤙", "👏", "🙌",
];

export const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [quickSuggestions, setQuickSuggestions] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const isMobile = useMediaQuery("(max-width: 768px)");

  const hidden = Boolean(
    pathname?.startsWith("/dashboard") || pathname?.startsWith("/login")
  );

  // Gestion de la session ID
  const getOrCreateSessionId = () => {
    if (typeof window === "undefined") return "";
    let sessionId = localStorage.getItem("diamant_noir_session_id");
    if (!sessionId) {
      sessionId = `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem("diamant_noir_session_id", sessionId);
    }
    return sessionId;
  };

  // Message de bienvenue
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage = {
        role: "assistant" as const,
        content:
          "Bonjour ! Je suis l'assistante Diamant Noir 💎\n\n" +
          "Je suis là pour vous aider à découvrir nos villas d'exception et répondre à toutes vos questions sur les réservations.\n\n" +
          "Comment puis-je vous aider aujourd'hui ?",
      };
      setMessages([welcomeMessage]);
      setTimeout(() => {
        setQuickSuggestions(QUICK_SUGGESTIONS.default);
      }, 300);
    }
  }, []);

  // Écouter les événements pour ouvrir le chatbot
  useEffect(() => {
    const handleOpenChatbot = () => {
      setIsOpen(true);
    };
    window.addEventListener("openChatbot", handleOpenChatbot);
    return () => {
      window.removeEventListener("openChatbot", handleOpenChatbot);
    };
  }, []);

  // Fermer le sélecteur d'émojis en cliquant à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        if (!(event.target as Element).closest(".emoji-btn")) {
          setShowEmojiPicker(false);
        }
      }
    };
    if (showEmojiPicker) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showEmojiPicker]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Rendu des messages avec détection de liens
  const renderMessageContent = (content: string) => {
    const urlRegex = /(https?:\/\/[^\s]+|\/(villas|book|contact|experience))/g;
    return content.split("\n").map((line, lineIndex) => {
      const parts: (string | React.ReactElement)[] = [];
      let lastIndex = 0;
      let match;

      while ((match = urlRegex.exec(line)) !== null) {
        if (match.index > lastIndex) {
          parts.push(line.slice(lastIndex, match.index));
        }
        const url = match[0];
        let href = url;
        if (url.startsWith("https://")) {
          href = url;
        } else {
          href = url;
        }
        parts.push(
          <a
            key={`link-${lineIndex}-${parts.length}`}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-black underline underline-offset-2 hover:text-black/70"
          >
            {url}
          </a>
        );
        lastIndex = match.index + match[0].length;
      }
      if (lastIndex < line.length) {
        parts.push(line.slice(lastIndex));
      }
      return (
        <p key={lineIndex} className="mb-2 last:mb-0">
          {parts}
        </p>
      );
    });
  };

  const sendMessage = async (messageText?: string) => {
    const messageToSend = messageText || inputMessage.trim();
    if (!messageToSend || isLoading) return;

    setInputMessage("");
    setIsLoading(true);
    setShowEmojiPicker(false);
    setQuickSuggestions([]);

    setMessages((prev) => [...prev, { role: "user", content: messageToSend }]);

    try {
      const sessionId = getOrCreateSessionId();
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: messageToSend,
          sessionid: sessionId,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const chatResponse = data.response || "Désolé, je n'ai pas pu traiter votre demande.";

      setMessages((prev) => [...prev, { role: "assistant", content: chatResponse }]);

      // Suggestions contextuelles
      const lower = messageToSend.toLowerCase();
      if (lower.includes("réserver") || lower.includes("disponibilité") || lower.includes("booking")) {
        setQuickSuggestions(QUICK_SUGGESTIONS.booking);
      } else if (lower.includes("prix") || lower.includes("tarif") || lower.includes("coût")) {
        setQuickSuggestions(QUICK_SUGGESTIONS.pricing);
      } else {
        setQuickSuggestions(QUICK_SUGGESTIONS.default);
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Oups, j'ai un petit souci technique 😅\n\nPeux-tu réessayer dans quelques instants ?",
        },
      ]);
      setQuickSuggestions(QUICK_SUGGESTIONS.default);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const insertEmoji = (emoji: string) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = inputMessage;
      const newText = text.substring(0, start) + emoji + text.substring(end);
      setInputMessage(newText);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + emoji.length, start + emoji.length);
      }, 0);
    } else {
      setInputMessage((prev) => prev + emoji);
    }
    setShowEmojiPicker(false);
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      if (inputMessage) {
        textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 150) + "px";
      }
    }
  }, [inputMessage]);

  // Ne pas afficher le chatbot sur le dashboard / login (after all hooks)
  if (hidden) return null;

  return (
    <>
      {/* FAB Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group fixed bottom-8 right-8 z-50 flex h-16 w-16 items-center justify-center rounded-2xl bg-black text-white shadow-[0_20px_50px_rgba(0,0,0,0.25)] transition-all hover:scale-110 hover:bg-black/90"
          aria-label="Ouvrir le chat"
        >
          <Sparkles className="relative z-10 animate-pulse" size={28} />
          <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-white text-[10px] font-bold text-black shadow-lg">
            💎
          </span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          className={`fixed z-50 flex flex-col bg-white shadow-2xl transition-all ${
            isFullscreen || isMobile
              ? "inset-0 h-screen w-screen rounded-none"
              : "bottom-6 right-6 h-[600px] w-[400px] rounded-[32px]"
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 bg-black p-5 text-white">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white font-display text-xl font-bold text-black shadow-lg">
                  D
                </div>
                <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-black bg-emerald-400"></span>
              </div>
              <div>
                <h3 className="font-display text-lg tracking-wide">Conciergerie IA</h3>
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/50">
                  <span>Diamant Noir</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  localStorage.removeItem("diamant_noir_session_id");
                  setMessages([{
                    role: "assistant",
                    content: "Chat réinitialisé. Comment puis-je vous aider ?"
                  }]);
                }}
                className="rounded-full p-2 hover:bg-white/10 transition-colors"
                title="Réinitialiser"
              >
                <RotateCcw size={16} />
              </button>
              {!isMobile && (
                <button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="rounded-full p-2 hover:bg-white/10 transition-colors"
                  aria-label={isFullscreen ? "Réduire" : "Agrandir"}
                >
                  {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-full p-2 hover:bg-white/10 transition-colors"
                aria-label="Fermer"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-offwhite">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {message.role === "assistant" && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black font-display text-sm font-bold text-white">
                    D
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-[24px] px-5 py-3.5 shadow-sm ${
                    message.role === "user"
                      ? "rounded-tr-none bg-gradient-to-tr from-black to-neutral-900 text-white"
                      : "rounded-tl-none border border-black/10 bg-white text-black"
                  }`}
                >
                  <div className="text-sm leading-relaxed font-medium">
                    {renderMessageContent(message.content)}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black font-display text-sm font-bold text-white">
                  D
                </div>
                <div className="flex items-center gap-1 rounded-2xl border border-black/10 bg-white px-4 py-3">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-black/30"></span>
                  <span className="h-2 w-2 animate-bounce rounded-full bg-black/30" style={{ animationDelay: "0.2s" }}></span>
                  <span className="h-2 w-2 animate-bounce rounded-full bg-black/30" style={{ animationDelay: "0.4s" }}></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />

            {/* Quick Suggestions */}
            {quickSuggestions.length > 0 && !isLoading && (
              <div className="flex flex-wrap gap-2 pt-2">
                {quickSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => sendMessage(suggestion)}
                    className="rounded-full border border-black/15 bg-white px-4 py-2 text-xs font-semibold text-black transition-all hover:border-black hover:bg-black hover:text-white"
                    disabled={isLoading}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Input */}
          <div className="relative border-t border-black/10 bg-white p-4">
            {showEmojiPicker && (
              <div
                ref={emojiPickerRef}
                className="absolute bottom-full left-0 right-0 mb-2 max-h-64 overflow-y-auto rounded-2xl border border-black/10 bg-white p-4 shadow-xl"
              >
                <div className="grid grid-cols-10 gap-2">
                  {EMOJIS.map((emoji, index) => (
                    <button
                      key={index}
                      onClick={() => insertEmoji(emoji)}
                      className="rounded-lg p-2 text-xl transition-colors hover:bg-black/5"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="flex items-end gap-2">
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="rounded-full p-2 text-black/50 transition-colors hover:bg-black/5 hover:text-black"
                aria-label="Émojis"
              >
                <Smile size={20} />
              </button>
              <textarea
                ref={textareaRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Tapez votre message..."
                disabled={isLoading}
                rows={1}
                className="flex-1 resize-none rounded-2xl border border-black/10 bg-offwhite px-4 py-3 text-sm text-black focus:border-black focus:outline-none"
              />
              <button
                onClick={() => sendMessage()}
                disabled={!inputMessage.trim() || isLoading}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-black text-white transition-all hover:bg-black/85 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Envoyer"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
