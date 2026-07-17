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

  // Liste de réservations lisible (noms de villa au lieu d'UUID, prix en €) —
  // pour que l'agent B liste proprement sans exposer d'identifiants bruts.
  const villaNameById = Object.fromEntries(
    (context.villas as { id?: string; name?: string }[]).map((v) => [v.id, v.name || "Villa"]),
  );
  const bookings_list = [...(context.bookings as Record<string, unknown>[])]
    .sort((a, b) => String(b.start_date).localeCompare(String(a.start_date)))
    .slice(0, 40)
    .map((b) => ({
      guest_name: b.guest_name ?? null,
      villa_name: villaNameById[String(b.villa_id)] || "Villa",
      start_date: String(b.start_date ?? ""),
      end_date: String(b.end_date ?? ""),
      status: String(b.status ?? ""),
      payment_status: String(b.payment_status ?? ""),
      price_eur: b.total_price_cents ? Math.round(Number(b.total_price_cents) / 100) : null,
    }));

  return NextResponse.json({
    context: { ...context, bookings_list },
    insights: ownerInsights(context),
    faq: faqForPrompt(["proprietaire"]),
    userId: resolvedUserId,
    systemPrompt: buildOwnerSystemPrompt(),
  });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders("GET, OPTIONS") });
}
