"use client";

import { Sparkles } from "lucide-react";
import { useCopilotContext } from "./CopilotContext";

export function CopilotButton() {
  const { open } = useCopilotContext();

  return (
    <button
      type="button"
      onClick={open}
      className="fixed bottom-6 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-navy-900 text-white shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-900 focus-visible:ring-offset-2"
      aria-label="Ouvrir Diamant, votre copilot"
    >
      <Sparkles className="h-5 w-5" aria-hidden />
    </button>
  );
}
