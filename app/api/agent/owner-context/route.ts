import { NextResponse } from "next/server";
import { corsHeaders } from "@/lib/cors";
import { supabaseAdmin } from "@/lib/supabase";
import { buildOwnerContextPackCached } from "@/lib/owner-assistant-context";
import { faqForPrompt } from "@/lib/chatbot/faq";
import { ownerInsights } from "@/lib/owner-assistant-reply";
import { buildOwnerSystemPrompt } from "@/lib/owner-assistant-system-prompt";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/agent/owner-context?userId=<uuid>
 * Sert le contexte Agent B (Propriétaire) pour les workflows n8n CieloBot.
 * Authentifié par token Supabase en query param OU header Authorization.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const requestedUserId = searchParams.get("userId");
  const token =
    searchParams.get("token") ||
    request.headers.get("authorization")?.replace("Bearer ", "");

  if (!token) {
    return NextResponse.json({ error: "token requis" }, { status: 401 });
  }

  // Identité dérivée du token uniquement — jamais du query param (anti-IDOR)
  const admin = supabaseAdmin();
  const { data: userData } = await admin.auth.getUser(token);
  const resolvedUserId = userData?.user?.id ?? null;

  if (!resolvedUserId) {
    return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 401 });
  }

  // Si un userId est fourni en query, il DOIT correspondre au token
  if (requestedUserId && requestedUserId !== resolvedUserId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const context = await buildOwnerContextPackCached(admin, resolvedUserId);

  return NextResponse.json({
    context,
    insights: ownerInsights(context),
    faq: faqForPrompt(["proprietaire"]),
    userId: resolvedUserId,
    systemPrompt: buildOwnerSystemPrompt(),
  });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders("GET, OPTIONS") });
}
