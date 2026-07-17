"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import { useCopilot } from "@/hooks/useCopilot";
import type { CopilotMessage } from "@/types/copilot";

interface CopilotContextValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  messages: CopilotMessage[];
  isLoading: boolean;
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
  suggestedPrompts: string[];
  /** Action result from the most recent assistant message, if any */
  lastActionResult: { action: string; success: boolean; [key: string]: unknown } | null;
}

const CopilotContext = createContext<CopilotContextValue | null>(null);

export function CopilotProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const {
    messages,
    isLoading,
    sendMessage,
    clearMessages,
    loadContext,
    suggestedPrompts,
  } = useCopilot({
    webhookUrl: "/api/dashboard/owner-assistant",
  });

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  // Compute lastActionResult from the most recent assistant message.
  // Ne construire la carte QUE si une action a réellement été exécutée
  // (actionResult présent) — sinon une réponse type "SHOW_STATS"/"reply"
  // sans résultat affichait une carte « Échec » parasite.
  const lastAssistantMsg = [...messages].reverse().find((m) => m.role === "assistant");
  const lastActionResult =
    lastAssistantMsg?.action && lastAssistantMsg.actionResult
      ? { action: lastAssistantMsg.action, success: lastAssistantMsg.actionResult.success ?? false, ...lastAssistantMsg.actionResult }
      : null;

  // Load context when copilot opens
  useEffect(() => {
    if (isOpen) {
      loadContext();
    }
  }, [isOpen, loadContext]);

  return (
    <CopilotContext.Provider
      value={{
        isOpen,
        open,
        close,
        toggle,
        messages,
        isLoading,
        sendMessage,
        clearMessages,
        suggestedPrompts,
        lastActionResult,
      }}
    >
      {children}
    </CopilotContext.Provider>
  );
}

export function useCopilotContext(): CopilotContextValue {
  const ctx = useContext(CopilotContext);
  if (!ctx) {
    throw new Error("useCopilotContext must be used within CopilotProvider");
  }
  return ctx;
}
