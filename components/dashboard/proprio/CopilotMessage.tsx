"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import { KayvilaPngIcon } from "@/components/icons/KayvilaPngIcon";
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
          <KayvilaPngIcon name="sparkle" size={20} invert className="aria-hidden" />
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
        {isUser ? (
          message.content
        ) : (
          <div
            className={cn(
              "space-y-2",
              "[&_ul]:my-1 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-4",
              "[&_ol]:my-1 [&_ol]:list-decimal [&_ol]:space-y-1 [&_ol]:pl-4",
              "[&_li]:marker:text-gold [&_p]:leading-relaxed",
              "[&_strong]:font-semibold [&_strong]:text-navy-900",
              "[&_a]:text-gold [&_a]:underline"
            )}
          >
            <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
              {message.content}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
