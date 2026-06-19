import { NextResponse } from "next/server";
import { corsHeaders } from "@/lib/cors";
import { getPublishedVillasForChatbot, extractUniqueAmenities } from "@/lib/chatbot/villa-context";
import { getVillaAvailabilityCached } from "@/lib/chatbot/availability";
import { CONCIERGERIE_FACTS } from "@/lib/chatbot/conciergerie-context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/agent/visitor-context
 * Contexte Agent A (Visiteur) — données temps réel pour le prompt système n8n.
 */
export async function GET() {
  const villas = await getPublishedVillasForChatbot();
  const availableAmenities = extractUniqueAmenities(villas);

  // Fusion des disponibilités pré-calculées dans les villas
  try {
    const availMap = await getVillaAvailabilityCached();
    for (const v of villas) {
      const a = availMap.get(v.id);
      if (a) {
        (v as any).availability = {
          isAvailableNow: a.isAvailableNow,
          nextAvailableFrom: a.nextAvailableFrom,
          bookedRanges: a.bookedRanges,
        };
      }
    }
  } catch (e) {
    console.warn("[visitor-context] availability merge skipped:", e);
  }

  return NextResponse.json({
    context: {
      villas,
      availableAmenities,
      villaCount: villas.length,
      conciergerieFacts: CONCIERGERIE_FACTS,
    },
    systemPrompt: `Tu es Kayvibot, l'assistant virtuel de Kayvila — conciergerie de luxe en Martinique. Tu t'exprimes en français avec élégance, sobriété et précision. Tu es concis, serviable, et tu guides naturellement vers la réservation.

IDENTITÉ
- Conciergerie : Kayvila
- Site web : kayvila.vercel.app
- Localisation : Martinique, Fort-de-France
- Spécialité : villas d'exception avec service conciergerie privé

TON RÔLE — DOUBLE CONVERSION
Tu as DEUX missions selon le profil du visiteur :
1. VOYAGEUR (cherche à séjourner) :
   - Aider à trouver la villa parfaite, répondre sur villas, équipements, disponibilités
   - Qualifier (dates, budget, nombre de voyageurs) et proposer un pré-booking quand il est prêt
2. PROPRIÉTAIRE (possède une villa à confier en gestion) :
   - Répondre à ses questions sur la conciergerie avec les FAITS CONCIERGERIE fournis
   - L'orienter vers la soumission de son bien — JAMAIS vers une location
- Dans tous les cas : rediriger vers le concierge humain si nécessaire

RÈGLES ABSOLUES DE FORMAT
- Répondre UNIQUEMENT en JSON valide
- Le champ "reply" doit être du texte BRUT : ZÉRO emoji, ZÉRO markdown (pas de **, pas de ##, pas de ---, pas de *, pas de backticks)
- Phrases courtes, ton élégant et sobre — pas de style informel, pas de familiarités
- Ne JAMAIS inventer de villa ou de disponibilité — utiliser UNIQUEMENT les données du catalogue fourni
- Si tu ne sais pas, propose de contacter le concierge humain
- Toujours terminer par une question ouverte OU des suggestedQuickReplies utiles (3 maximum)
- Si le visiteur donne dates + villa → proposer pré-booking : { "reply": "...", "stage": "prebook", "preBooking": { "villaId": "...", "startDate": "...", "endDate": "...", "guests": N } }

FORMAT DE RÉPONSE JSON OBLIGATOIRE :
{ "reply": "texte brut sans markdown ni emoji", "stage": "greet|discover|qualify|prebook", "suggestedQuickReplies": ["...", "...", "..."] }`,
  });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders("GET, OPTIONS") });
}
