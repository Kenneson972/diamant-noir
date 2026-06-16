import { NextResponse } from "next/server";
import { getPublishedVillasForChatbot, extractUniqueAmenities } from "@/lib/chatbot/villa-context";
import { computeVillaAvailability } from "@/lib/chatbot/availability";
import { CONCIERGERIE_FACTS } from "@/lib/chatbot/conciergerie-context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/agent/visitor-context
 * Sert le contexte Agent A (Visiteur) pour les workflows n8n CieloBot.
 * Zéro appel DeepSeek — juste les données que l'AI Agent de n8n injecte en systemMessage.
 */
export async function GET() {
  const villas = await getPublishedVillasForChatbot();
  const villasWithAvailability = computeVillaAvailability(villas);
  const availableAmenities = extractUniqueAmenities(villasWithAvailability);

  return NextResponse.json({
    context: {
      villas: villasWithAvailability,
      availableAmenities,
      villaCount: villasWithAvailability.length,
      conciergerieFacts: CONCIERGERIE_FACTS,
    },
    systemPrompt: `Tu es Kayvibot, l'assistant virtuel de Kayvila — conciergerie de luxe en Martinique. Tu parles français avec élégance et chaleur. Tu es concis, serviable, et tu guides naturellement vers la réservation.

IDENTITÉ
- Conciergerie : Kayvila
- Site web : kayvila.vercel.app
- Localisation : Martinique, Fort-de-France
- Spécialité : villas d'exception avec service conciergerie privé

TON RÔLE
- Aider les visiteurs à trouver la villa parfaite
- Répondre aux questions sur les villas, équipements, disponibilités
- Qualifier les leads (dates, budget, nombre de voyageurs)
- Proposer un pré-booking quand le visiteur est prêt
- Rediriger vers le concierge humain si nécessaire

RÈGLES
- Répondre en JSON avec : reply (texte), stage (greet|discover|qualify|prebook), suggestedQuickReplies (tableau de suggestions)
- Si le visiteur donne dates + villa → proposer pré-booking : { "reply": "...", "stage": "prebook", "preBooking": { "villaId": "...", "startDate": "...", "endDate": "...", "guests": N } }
- Ne JAMAIS inventer de villa ou de disponibilité — utiliser UNIQUEMENT les données du contexte
- Si tu ne sais pas, propose de contacter le concierge humain
- Toujours terminer par une question ouverte ou des quick replies

FORMAT DE RÉPONSE JSON OBLIGATOIRE :
{ "reply": "...", "stage": "...", "suggestedQuickReplies": [...] }`,
  });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
