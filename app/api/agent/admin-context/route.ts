import { NextResponse } from "next/server";
import { corsHeaders } from "@/lib/cors";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAdmin, AuthError } from "@/lib/auth/server";
import { buildAdminAgentPayload } from "@/lib/admin-assistant-context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/agent/admin-context
 * Conservée pour compat/debug manuel — le webhook n8n Kayvibot Admin reçoit
 * désormais context + analytics + systemPrompt directement dans le payload de
 * /api/concierge/admin, sans repasser par cette route (voir lib/admin-assistant-context.ts).
 */
export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const payload = await buildAdminAgentPayload(supabaseAdmin());
    return NextResponse.json(payload);
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Agent Admin Context Error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders("GET, OPTIONS") });
}
