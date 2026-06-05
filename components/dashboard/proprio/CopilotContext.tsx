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
  } = useCopilot({
    webhookUrl: process.env.NEXT_PUBLIC_COPILOT_WEBHOOK_URL ?? "/api/chatbot-owner",
  });

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

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
