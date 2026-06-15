// app/api/chat/owner-lead/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { validateOwnerLead, buildSubmissionUrl } from "@/lib/chatbot/conciergerie-context";
import { checkRateLimit, getClientIP } from "@/lib/chatbot/rate-limit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  // Rate limiting — endpoint public non authentifié
  const clientIP = getClientIP(request);
  if (!checkRateLimit(clientIP, 10, 3600000)) {
    return NextResponse.json(
      { success: false, error: "Trop de requêtes. Veuillez réessayer plus tard." },
      { status: 429 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Corps invalide." }, { status: 400 });
  }

  const v = validateOwnerLead(body);
  if (!v.ok) {
    return NextResponse.json({ success: false, error: v.error }, { status: 400 });
  }
  const { villasCount, location, email, name } = v.value;

  // Notif admin (broadcast in-app) — avec cap à 50 notifs pour éviter le spam
  try {
    const { count: notifCount } = await supabaseAdmin()
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("type", "owner_lead")
      .gte("created_at", new Date(Date.now() - 3600000).toISOString());

    if ((notifCount ?? 0) < 50) {
      await supabaseAdmin().from("notifications").insert({
        user_id: null,
        type: "owner_lead",
        title: "Nouveau lead propriétaire",
        body: `${name ?? email ?? "Propriétaire"} — ${villasCount ?? "?"} villa(s)${location ? `, ${location}` : ""}`,
      });
    }
  } catch (e) {
    console.warn("[owner-lead] notif", e);
  }

  return NextResponse.json({
    success: true,
    submissionUrl: buildSubmissionUrl({ name, email, location }),
  });
}
