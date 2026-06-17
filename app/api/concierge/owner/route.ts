import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20_000);

    try {
      const res = await fetch(webhookURL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: message.trim(), userId: user.id }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) throw new Error(`n8n returned ${res.status}`);
      const data = await res.json();
      return NextResponse.json({ response: data.response ?? data.output ?? JSON.stringify(data), request_id: data.request_id ?? "n8n" });
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
