"use client";

import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CopilotMessage as CopilotMessageType } from "@/types/copilot";

interface CopilotMessageProps {
  message: CopilotMessageType;
}

export function CopilotMessage({ message }: CopilotMessageProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "flex gap-3",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Avatar */}
      {!isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy-900">
          <Sparkles className="h-4 w-4 text-white" aria-hidden />
        </div>
      )}

      {/* Bubble */}
      <div
        className={cn(
          "max-w-[85%] rounded-xl p-3 text-sm leading-relaxed",
          isUser
            ? "rounded-br-sm bg-navy-900 text-white"
            : "rounded-bl-sm bg-cream text-navy-900"
        )}
      >
        {message.content}
      </div>
    </div>
  );
}
