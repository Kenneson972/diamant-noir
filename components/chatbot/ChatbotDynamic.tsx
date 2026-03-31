"use client";

import dynamic from "next/dynamic";

const Chatbot = dynamic(
  () => import("@/components/chatbot/Chatbot").then((mod) => ({ default: mod.Chatbot })),
  { ssr: false }
);

export function ChatbotDynamic() {
  return <Chatbot />;
}
