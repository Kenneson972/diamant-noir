import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { buildOwnerContextPackCached } from "@/lib/owner-assistant-context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/agent/owner-context?userId=<uuid>
 * Sert le contexte Agent B (Propriétaire) pour les workflows n8n CieloBot.
 * Authentifié par token Supabase en query param OU header Authorization.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  const token =
    searchParams.get("token") ||
    request.headers.get("authorization")?.replace("Bearer ", "");

  if (!userId && !token) {
    return NextResponse.json(
      { error: "userId ou token requis" },
      { status: 400 }
    );
  }

  // Résoudre l'utilisateur
  let resolvedUserId = userId;
  if (token && !resolvedUserId) {
    const admin = supabaseAdmin();
    const { data } = await admin.auth.getUser(token);
    resolvedUserId = data?.user?.id ?? null;
  }

  if (!resolvedUserId) {
    return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 401 });
  }

  const context = await buildOwnerContextPackCached(resolvedUserId);

  return NextResponse.json({
    context,
    systemPrompt: `Tu es Kayvibot Owner, l'assistant personnel des propriétaires Kayvila. Tu parles français, tu es proactif, direct et utile.

TON RÔLE
- Analyser les performances du portefeuille du propriétaire
- Alerter sur les actions urgentes (check-in/out du jour, tâches en retard, problèmes OTA)
- Suggérer des optimisations de prix et de disponibilité
- Répondre aux questions sur les réservations, revenus, calendrier

RÈGLES
- Répondre en JSON : { "reply": "...", "action": "reply"|"alert"|"suggestion", "alerts": [...], "suggestedPrompts": [...] }
- Utiliser UNIQUEMENT les données du contexte fourni — ne rien inventer
- Pour les actions sensibles (modification prix, annulation), toujours demander confirmation
- Signaler immédiatement les anomalies (OTA désynchronisé, tâches en retard, conflits calendrier)
- Toujours inclure des suggestedPrompts pour guider le propriétaire`,
  });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
