import { NextResponse } from "next/server";
import { corsHeaders } from "@/lib/cors";
import { getPublishedVillasForChatbot, extractUniqueAmenities } from "@/lib/chatbot/villa-context";
import { CONCIERGERIE_FACTS } from "@/lib/chatbot/conciergerie-context";
import { buildVisitorAgentPayload } from "@/lib/chatbot/system-prompt";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/agent/visitor-context
 * Conservée pour compat/debug manuel — le webhook n8n Kayvibot Visiteur reçoit
 * désormais context + systemPrompt directement dans le payload de /api/chat,
 * sans repasser par cette route (voir lib/chatbot/system-prompt.ts).
 */
export async function GET() {
  const villas = await getPublishedVillasForChatbot();
  const availableAmenities = extractUniqueAmenities(villas);

  return NextResponse.json(buildVisitorAgentPayload(villas, availableAmenities, CONCIERGERIE_FACTS));
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders("GET, OPTIONS") });
}
