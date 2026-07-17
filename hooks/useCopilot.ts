"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { getSupabaseBrowser } from "@/lib/supabase";
import type { CopilotMessage, CopilotContextData, CopilotResponse } from "@/types/copilot";

interface UseCopilotOptions {
  webhookUrl: string;
}

/** Header Authorization Bearer depuis la session Supabase courante (sinon vide). */
async function getAuthHeader(): Promise<Record<string, string>> {
  const supabase = getSupabaseBrowser();
  if (!supabase) return {};
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token
    ? { Authorization: `Bearer ${session.access_token}` }
    : {};
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
  const [suggestedPrompts, setSuggestedPrompts] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const contextRef = useRef<CopilotContextData | null>(null);
  const messagesRef = useRef<CopilotMessage[]>(messages);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const loadContext = useCallback(async () => {
    try {
      const res = await fetch("/api/chatbot-owner-context", {
        headers: { ...(await getAuthHeader()) },
      });
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
          headers: { "Content-Type": "application/json", ...(await getAuthHeader()) },
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
          action: data.action,
          actionResult: data.action_result ?? null,
          proposedAction: data.proposed_action ?? null,
        };

        setMessages((prev) => [...prev, assistantMessage]);

        // Afficher les suggestions si présentes
        if (data.suggested_prompts && Array.isArray(data.suggested_prompts)) {
          setSuggestedPrompts(data.suggested_prompts);
        } else {
          setSuggestedPrompts([]);
        }
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

  const confirmAction = useCallback(
    async (action: string, actionData: Record<string, unknown>) => {
      setIsLoading(true);
      try {
        const res = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...(await getAuthHeader()) },
          body: JSON.stringify({ confirm_action: { action, action_data: actionData } }),
        });
        if (res.ok) {
          const data = await res.json();
          const msg: CopilotMessage = {
            id: `action-${Date.now()}`,
            role: "assistant",
            content: "",
            timestamp: Date.now(),
            action,
            actionResult: data.action_result ?? null,
          };
          setMessages((prev) => [...prev, msg]);
        } else {
          setMessages((prev) => [
            ...prev,
            {
              id: `action-err-${Date.now()}`,
              role: "assistant",
              content: "L'action n'a pas pu être exécutée. Réessayez.",
              timestamp: Date.now(),
            },
          ]);
        }
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: `action-err-${Date.now()}`,
            role: "assistant",
            content: "L'action n'a pas pu être exécutée. Réessayez.",
            timestamp: Date.now(),
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [webhookUrl],
  );

  return {
    messages,
    isLoading,
    sendMessage,
    clearMessages,
    loadContext,
    suggestedPrompts,
    confirmAction,
  };
}
