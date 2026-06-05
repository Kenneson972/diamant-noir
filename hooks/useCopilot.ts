"use client";

import { useState, useCallback, useRef } from "react";
import type { CopilotMessage, CopilotContextData, CopilotResponse } from "@/types/copilot";

interface UseCopilotOptions {
  webhookUrl: string;
}

export function useCopilot({ webhookUrl }: UseCopilotOptions) {
  const [messages, setMessages] = useState<CopilotMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Bonjour, je suis Diamant, votre copilot Kayvila. Posez-moi une question sur vos villas, réservations ou revenus.",
      timestamp: Date.now(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const contextRef = useRef<CopilotContextData | null>(null);
  const messagesRef = useRef<CopilotMessage[]>(messages);
  messagesRef.current = messages;

  const loadContext = useCallback(async () => {
    try {
      const res = await fetch("/api/chatbot-owner-context");
      if (res.ok) {
        contextRef.current = await res.json();
      }
    } catch {
      // Context loading is best-effort
    }
  }, []);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim()) return;

      const userMessage: CopilotMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: content.trim(),
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      try {
        const res = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: content.trim(),
            context: contextRef.current,
            messages_history: messagesRef.current.slice(-10),
            owner_id: null, // Will be set server-side via auth
          }),
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const data: CopilotResponse = await res.json();

        const assistantMessage: CopilotMessage = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: data.response || "Je n'ai pas compris votre demande.",
          timestamp: Date.now(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } catch {
        const errorMessage: CopilotMessage = {
          id: `error-${Date.now()}`,
          role: "assistant",
          content:
            "Désolé, je n'arrive pas à me connecter à mon assistant. Veuillez réessayer.",
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    },
    [webhookUrl]
  );

  const clearMessages = useCallback(() => {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content:
          "Bonjour, je suis Diamant, votre copilot Kayvila. Posez-moi une question sur vos villas, réservations ou revenus.",
        timestamp: Date.now(),
      },
    ]);
  }, []);

  return {
    messages,
    isLoading,
    sendMessage,
    clearMessages,
    loadContext,
  };
}
