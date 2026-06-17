import { NextResponse } from "next/server";
import { requireAdmin, AuthError } from "@/lib/auth/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireAdmin(request);

    const { message } = await request.json();
    if (!message?.trim()) {
      return NextResponse.json({ error: "Message requis" }, { status: 400 });
    }

    const webhookURL = process.env.N8N_ADMIN_WEBHOOK_URL || process.env.N8N_WEBHOOK_URL;
    if (!webhookURL) {
      return NextResponse.json({
        response: "Bonjour ! Je suis votre assistant Concierge IA Kayvila 💎\n\nJe peux vous aider avec l'occupation, les revenus, les tâches et la supervision globale. (Mode Démo : configurez N8N_ADMIN_WEBHOOK_URL)",
        request_id: "demo",
      });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20_000);

    try {
      const res = await fetch(webhookURL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: message.trim() }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) throw new Error(`n8n returned ${res.status}`);
      const data = await res.json();
      return NextResponse.json({ response: data.response ?? data.output ?? JSON.stringify(data), request_id: data.request_id ?? "n8n" });
    } catch (fetchErr) {
      clearTimeout(timeout);
      console.error("[concierge-admin] n8n fetch error:", fetchErr);
      return NextResponse.json({
        response: "Désolé, je rencontre un problème technique.",
        request_id: "fallback",
      });
    }
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
    console.error("[concierge-admin] error:", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
