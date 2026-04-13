import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import {
  buildOwnerContextPack,
  ownerContextToStatsPayload,
  type OwnerContextPack,
} from "@/lib/owner-assistant-context";

export const runtime = "nodejs";

function getBearer(request: Request): string | null {
  const authHeader = request.headers.get("authorization") || "";
  return authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
}

async function getUserFromRequest(request: Request) {
  const token = getBearer(request);
  if (!token) return { user: null as { id: string } | null };
  const admin = supabaseAdmin();
  const { data: userData, error } = await admin.auth.getUser(token);
  if (error || !userData?.user) {
    return { user: null };
  }
  return { user: userData.user };
}

function lastUserMessage(body: {
  message?: string;
  messages?: { role: string; content: string }[];
}): string {
  if (body.messages && Array.isArray(body.messages)) {
    for (let i = body.messages.length - 1; i >= 0; i--) {
      const m = body.messages[i];
      if (m?.role === "user" && typeof m.content === "string" && m.content.trim()) {
        return m.content.trim();
      }
    }
  }
  if (typeof body.message === "string" && body.message.trim()) {
    return body.message.trim();
  }
  return "";
}

async function logOwnerAction(
  admin: ReturnType<typeof supabaseAdmin>,
  ownerId: string,
  action_type: string,
  payload: Record<string, unknown>,
  request_id?: string
) {
  const { error } = await admin.from("ai_action_logs").insert({
    owner_id: ownerId,
    role: "owner",
    action_type,
    payload,
    request_id: request_id ?? null,
  });
  if (error) {
    console.warn("[owner-assistant] ai_action_logs insert", error.message);
  }
}

function demoReply(pack: OwnerContextPack, userMessage: string): string {
  const p = pack.portfolio;
  return (
    `[Assistant propriétaire] Votre parc : ${p.total_villas} villa(s), ` +
    `${p.published_villas} publiée(s). ` +
    `CA encaissé (réservations payées) : €${p.total_revenue_paid.toLocaleString("fr-FR")}. ` +
    `Aujourd’hui : ${pack.today.length} évènement(s) (arrivées, séjours, départs). ` +
    `Tâches en attente : ${p.pending_tasks_count}.\n\n` +
    `(n8n non configuré — réponse locale.)\nVotre message : « ${userMessage.slice(0, 200)}${userMessage.length > 200 ? "…" : ""} »`
  );
}

function tasksPreviewFromPack(pack: OwnerContextPack) {
  const villaNameById = Object.fromEntries(
    (pack.villas as { id?: string; name?: string }[]).map((v) => [
      v.id,
      v.name || "Villa",
    ])
  );
  return (pack.tasks_open as { id?: string; villa_id?: string; content?: string }[])
    .slice(0, 20)
    .map((t) => ({
      id: String(t.id ?? ""),
      content: String(t.content ?? ""),
      villa_name: villaNameById[String(t.villa_id)] || "Villa",
    }));
}

export async function GET(request: Request) {
  try {
    const { user } = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const admin = supabaseAdmin();
    const pack = await buildOwnerContextPack(admin, user.id);
    const stats = ownerContextToStatsPayload(pack);
    return NextResponse.json({
      success: true,
      snapshot: {
        current_date_iso: pack.current_date_iso,
        portfolio: pack.portfolio,
        today: pack.today,
        alerts: pack.alerts,
        tasks_open: tasksPreviewFromPack(pack),
        stats,
      },
    });
  } catch (e) {
    console.error("[owner-assistant] GET", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { user } = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const userMessage = lastUserMessage(body);
    if (!userMessage) {
      return NextResponse.json({ error: "Message vide" }, { status: 400 });
    }

    const sessionid =
      typeof body.sessionid === "string" ? body.sessionid : undefined;
    const admin = supabaseAdmin();
    const pack = await buildOwnerContextPack(admin, user.id);

    await logOwnerAction(admin, user.id, "chat_message", {
      message_preview: userMessage.slice(0, 500),
      sessionid: sessionid ?? null,
    });

    const webhookURL =
      process.env.N8N_OWNER_WEBHOOK_URL || process.env.N8N_WEBHOOK_URL;

    const statsPayload = ownerContextToStatsPayload(pack);
    const firstAlert = pack.alerts[0];
    const strategic_alert = firstAlert
      ? {
          severity: firstAlert.severity as "high" | "medium" | "low",
          description: firstAlert.title + (firstAlert.body ? ` — ${firstAlert.body}` : ""),
        }
      : null;

    if (!webhookURL) {
      return NextResponse.json({
        success: true,
        response: demoReply(pack, userMessage),
        action: "SHOW_STATS",
        action_data: {
          context: statsPayload,
          strategic_alert,
        },
      });
    }

    const n8nSecret = process.env.N8N_OWNER_WEBHOOK_SECRET;
    const response = await fetch(webhookURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(n8nSecret ? { "X-Webhook-Secret": n8nSecret } : {}),
      },
      body: JSON.stringify({
        message: userMessage,
        sessionid: sessionid ?? null,
        role: "owner",
        owner_id: user.id,
        /** Historique conversationnel — permet la mémoire multi-tour dans n8n/Claude */
        messages_history: Array.isArray(body.messages)
          ? (body.messages as { role: string; content: string }[]).slice(-12)
          : null,
        /** Contexte complet pour LLM / n8n — ne jamais mélanger deux propriétaires (owner_id filtre côté API). */
        context: {
          current_date_iso: pack.current_date_iso,
          portfolio: pack.portfolio,
          today: pack.today,
          alerts: pack.alerts,
          tasks_open: tasksPreviewFromPack(pack),
          villas: (pack.villas as { id?: string; name?: string; slug?: string; is_published?: boolean }[]).map(
            (v) => ({
              id: v.id,
              name: v.name,
              slug: v.slug,
              is_published: v.is_published,
            })
          ),
          stats: statsPayload,
        },
        source: "owner_dashboard",
      }),
    });

    if (!response.ok) {
      console.error("[owner-assistant] webhook", response.status);
      return NextResponse.json({
        success: true,
        response: demoReply(pack, userMessage),
        action: "SHOW_STATS",
        action_data: {
          context: statsPayload,
          strategic_alert,
        },
      });
    }

    const data = await response.json().catch(() => ({}));
    return NextResponse.json({
      success: true,
      response:
        data.response ||
        (typeof data === "string" ? data : JSON.stringify(data)),
      action: data.action || "SHOW_STATS",
      action_data: data.action_data || {
        context: statsPayload,
        strategic_alert,
      },
    });
  } catch (error) {
    console.error("[owner-assistant] POST", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
