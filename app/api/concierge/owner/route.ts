import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase";
import { buildOwnerContextPackCached } from "@/lib/owner-assistant-context";
import { ownerInsights } from "@/lib/owner-assistant-reply";
import { faqForPrompt } from "@/lib/chatbot/faq";
import { buildOwnerSystemPrompt } from "@/lib/owner-assistant-system-prompt";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Contexte désormais construit en process (plus d'aller-retour n8n → kayvila.com/api/agent/owner-context) — marge réduite
export const maxDuration = 25;

export async function POST(request: Request) {
  try {
    const supabase = await getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { message } = await request.json();
    if (!message?.trim()) {
      return NextResponse.json({ error: "Message requis" }, { status: 400 });
    }

    const webhookURL = process.env.N8N_OWNER_WEBHOOK_URL || process.env.N8N_WEBHOOK_URL;
    if (!webhookURL) {
      return NextResponse.json({
        response: "Bonjour ! Je suis votre assistant concierge Kayvila 💎\n\nJe peux vous renseigner sur vos villas, vos réservations, vos revenus et vos tâches. (Mode Démo : configurez N8N_OWNER_WEBHOOK_URL)",
        request_id: "demo",
      });
    }

    // Contexte + prompt système construits en process (identité dérivée de la session
    // déjà authentifiée — anti-IDOR — au lieu d'un aller-retour n8n → kayvila.com)
    const context = await buildOwnerContextPackCached(supabaseAdmin(), user.id);
    const payload = {
      message: message.trim(),
      userId: user.id,
      context,
      insights: ownerInsights(context),
      faq: faqForPrompt(["proprietaire"]),
      systemPrompt: buildOwnerSystemPrompt(),
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 22_000);

    try {
      const res = await fetch(webhookURL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) throw new Error(`n8n returned ${res.status}`);
      const data = await res.json();
      // L'agent B renvoie { reply, ... } (format fusion) ; certains agents renvoient { response } ou { output }
      const reply =
        (typeof data.response === "string" && data.response) ||
        (typeof data.reply === "string" && data.reply) ||
        (typeof data.output === "string" && data.output) ||
        "Je n'ai pas pu générer de réponse pour le moment.";
      return NextResponse.json({ response: reply, request_id: data.request_id ?? "n8n" });
    } catch (fetchErr) {
      clearTimeout(timeout);
      console.error("[concierge-owner] n8n fetch error:", fetchErr);
      return NextResponse.json({
        response: "Désolé, je rencontre un problème technique. Notre équipe a été notifiée, je reviens vers vous rapidement.",
        request_id: "fallback",
      });
    }
  } catch (e) {
    console.error("[concierge-owner] error:", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
