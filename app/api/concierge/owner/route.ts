import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// L'agent B (owner-context + Postgres + DeepSeek) tourne ~20-22s — laisser la marge
export const maxDuration = 35;

export async function POST(request: Request) {
  try {
    const supabase = await getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Token de session — l'agent B en a besoin pour fetch owner-context (identité dérivée du token, anti-IDOR)
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token ?? "";

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

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 32_000);

    try {
      const res = await fetch(webhookURL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: message.trim(), userId: user.id, token }),
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
