// lib/chatbot/feedback.ts
// Log fire-and-forget des questions fallback dans chatbot_feedback.
// Ne bloque jamais la réponse, n'émet jamais d'exception.

import { supabaseAdmin } from "@/lib/supabase";

export type ChatbotFeedbackInput = {
  agent: "public" | "admin" | "proprio";
  sessionId: string | null;
  question: string;
  matched: boolean;
};

export async function logChatbotFeedback(input: ChatbotFeedbackInput): Promise<void> {
  try {
    await supabaseAdmin().from("chatbot_feedback").insert({
      agent: input.agent,
      session_id: input.sessionId ? input.sessionId.slice(0, 120) : null,
      question: input.question.slice(0, 500),
      matched: input.matched,
    });
  } catch (e) {
    console.warn("[chatbot/feedback] insert skipped:", e);
  }
}
