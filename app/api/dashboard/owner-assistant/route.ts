import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import {
  buildOwnerContextPackCached,
  ownerContextToStatsPayload,
  type OwnerContextPack,
} from "@/lib/owner-assistant-context";
import {
  DEFAULT_SUGGESTED_PROMPTS,
  type OwnerAssistantAction,
} from "@/lib/owner-assistant-types";

export const runtime = "nodejs";

// ─── Rate limiter in-memory ───────────────────────────────────────────────────

const _rateMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 20;      // requêtes max par fenêtre
const RATE_WINDOW = 60_000; // 1 minute

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = _rateMap.get(userId);
  if (!entry || now > entry.resetAt) {
    _rateMap.set(userId, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

function getBearer(request: Request): string | null {
  const authHeader = request.headers.get("authorization") || "";
  return authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
}

async function getUserFromRequest(request: Request) {
  const token = getBearer(request);
  if (!token) return { user: null as { id: string } | null };
  const admin = supabaseAdmin();
  const { data: userData, error } = await admin.auth.getUser(token);
  if (error || !userData?.user) return { user: null };
  return { user: userData.user };
}

// ─── Input ────────────────────────────────────────────────────────────────────

const MAX_MESSAGE_LENGTH = 2000;

/** Extrait le dernier message utilisateur ; null si vide ou trop long. */
function extractUserMessage(body: {
  message?: string;
  messages?: { role: string; content: string }[];
}): string | null {
  let msg = "";

  if (body.messages && Array.isArray(body.messages)) {
    for (let i = body.messages.length - 1; i >= 0; i--) {
      const m = body.messages[i];
      if (m?.role === "user" && typeof m.content === "string" && m.content.trim()) {
        msg = m.content.trim();
        break;
      }
    }
  }

  if (!msg && typeof body.message === "string") {
    msg = body.message.trim();
  }

  if (!msg) return null;
  if (msg.length > MAX_MESSAGE_LENGTH) return null; // refusé proprement
  return msg;
}

// ─── Logging ─────────────────────────────────────────────────────────────────

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

// ─── Helpers réponse ─────────────────────────────────────────────────────────

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

/** Contexte compact envoyé à n8n — évite de surcharger le LLM. */
function buildCompactContext(pack: OwnerContextPack) {
  return {
    current_date_iso: pack.current_date_iso,
    portfolio: pack.portfolio,
    today: pack.today,
    alerts: pack.alerts.slice(0, 5),
    tasks_preview: tasksPreviewFromPack(pack).slice(0, 10),
    villas_summary: (
      pack.villas as { id?: string; name?: string; slug?: string; is_published?: boolean }[]
    ).map((v) => ({
      id: v.id,
      name: v.name,
      slug: v.slug,
      is_published: v.is_published,
    })),
  };
}

function demoReply(pack: OwnerContextPack, userMessage: string): string {
  const p = pack.portfolio;
  const momLine =
    p.revenue_last_month > 0
      ? ` (${p.revenue_current_month >= p.revenue_last_month ? "+" : ""}${Math.round(
          ((p.revenue_current_month - p.revenue_last_month) / p.revenue_last_month) * 100
        )} % vs mois dernier)`
      : "";

  return (
    `[Copilot propriétaire] Parc : ${p.total_villas} villa(s), ${p.published_villas} publiée(s).\n` +
    `Mois en cours : €${p.revenue_current_month.toLocaleString("fr-FR")}${momLine}.\n` +
    `Aujourd'hui : ${pack.today.length} évènement(s). Tâches en attente : ${p.pending_tasks_count}.\n\n` +
    `(Mode démo — n8n non configuré.)\n` +
    `Votre message : « ${userMessage.slice(0, 200)}${userMessage.length > 200 ? "…" : ""} »`
  );
}

/** Réponse fallback propre quand n8n est en erreur (pas un crash). */
function fallbackReply(pack: OwnerContextPack): string {
  return (
    `[Copilot] Mon analyse est temporairement indisponible.\n` +
    `Voici votre snapshot : ${pack.portfolio.total_villas} villa(s), ` +
    `${pack.today.length} évènement(s) aujourd'hui, ` +
    `${pack.portfolio.pending_tasks_count} tâche(s) en attente.`
  );
}

// ─── Route GET — snapshot ─────────────────────────────────────────────────────

export async function GET(request: Request) {
  try {
    const { user } = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = supabaseAdmin();
    const pack = await buildOwnerContextPackCached(admin, user.id);
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

// ─── Route POST — chat ────────────────────────────────────────────────────────

export async function POST(request: Request) {
  // ── Avertissement secret manquant en prod ──
  const webhookURL = process.env.N8N_OWNER_WEBHOOK_URL || process.env.N8N_WEBHOOK_URL;
  const n8nSecret = process.env.N8N_OWNER_WEBHOOK_SECRET;
  if (
    process.env.NODE_ENV === "production" &&
    webhookURL &&
    !n8nSecret
  ) {
    console.error(
      "[owner-assistant] N8N_OWNER_WEBHOOK_SECRET est requis en production. " +
        "Définissez cette variable d'environnement."
    );
  }

  try {
    const { user } = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ── Rate limit ──
    if (!checkRateLimit(user.id)) {
      return NextResponse.json(
        { error: "Trop de requêtes. Réessayez dans une minute." },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }

    // ── Parsing + validation ──
    const body = await request.json().catch(() => ({}));
    const userMessage = extractUserMessage(body);

    if (!userMessage) {
      const rawLen =
        typeof body.message === "string"
          ? body.message.length
          : 0;
      if (rawLen > MAX_MESSAGE_LENGTH) {
        return NextResponse.json(
          { error: `Message trop long (max ${MAX_MESSAGE_LENGTH} caractères).` },
          { status: 400 }
        );
      }
      return NextResponse.json({ error: "Message vide." }, { status: 400 });
    }

    const sessionid =
      typeof body.sessionid === "string" ? body.sessionid : undefined;

    // ── Contexte (avec cache 30s) ──
    const admin = supabaseAdmin();
    const pack = await buildOwnerContextPackCached(admin, user.id);
    const statsPayload = ownerContextToStatsPayload(pack);

    // ── request_id pour corrélation logs ──
    const request_id = crypto.randomUUID();

    // ── Log ──
    await logOwnerAction(
      admin,
      user.id,
      "chat_message",
      {
        message_preview: userMessage.slice(0, 500),
        sessionid: sessionid ?? null,
        request_id,
      },
      request_id
    );

    const firstAlert = pack.alerts[0];
    const strategic_alert = firstAlert
      ? {
          severity: firstAlert.severity as "high" | "medium" | "low",
          description:
            firstAlert.title + (firstAlert.body ? ` — ${firstAlert.body}` : ""),
        }
      : null;

    // ── Mode démo (sans n8n) ──
    if (!webhookURL) {
      return NextResponse.json({
        success: true,
        response: demoReply(pack, userMessage),
        action: "SHOW_STATS" as OwnerAssistantAction,
        action_data: { context: statsPayload, strategic_alert },
        suggested_prompts: DEFAULT_SUGGESTED_PROMPTS,
        metadata: { source: "local" as const },
      });
    }

    // ── Appel n8n ──
    const t0 = Date.now();
    let n8nResponse: Response;

    try {
      n8nResponse = await fetch(webhookURL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(n8nSecret ? { "X-Webhook-Secret": n8nSecret } : {}),
        },
        body: JSON.stringify({
          message: userMessage,
          sessionid: sessionid ?? null,
          request_id,
          role: "owner",
          owner_id: user.id,
          messages_history: Array.isArray(body.messages)
            ? (body.messages as { role: string; content: string }[]).slice(-12)
            : null,
          context: buildCompactContext(pack),
          source: "owner_dashboard",
        }),
        signal: AbortSignal.timeout(15_000), // timeout 15s
      });
    } catch (fetchErr) {
      console.error("[owner-assistant] webhook fetch error", fetchErr);
      return NextResponse.json({
        success: true,
        response: fallbackReply(pack),
        action: "SHOW_STATS" as OwnerAssistantAction,
        action_data: { context: statsPayload, strategic_alert },
        suggested_prompts: DEFAULT_SUGGESTED_PROMPTS,
        metadata: { source: "local" as const },
      });
    }

    const latency_ms = Date.now() - t0;

    if (!n8nResponse.ok) {
      console.error("[owner-assistant] webhook status", n8nResponse.status);
      return NextResponse.json({
        success: true,
        response: fallbackReply(pack),
        action: "SHOW_STATS" as OwnerAssistantAction,
        action_data: { context: statsPayload, strategic_alert },
        suggested_prompts: DEFAULT_SUGGESTED_PROMPTS,
        metadata: { source: "local" as const, latency_ms },
      });
    }

    const data = await n8nResponse.json().catch(() => ({}));

    // Validation réponse n8n — si malformée, fallback propre
    if (!data?.response || typeof data.response !== "string") {
      console.error("[owner-assistant] réponse n8n malformée", data);
      return NextResponse.json({
        success: true,
        response: fallbackReply(pack),
        action: "SHOW_STATS" as OwnerAssistantAction,
        action_data: { context: statsPayload, strategic_alert },
        suggested_prompts: DEFAULT_SUGGESTED_PROMPTS,
        metadata: { source: "local" as const, latency_ms },
      });
    }

    return NextResponse.json({
      success: true,
      response: data.response,
      action: (data.action || "SHOW_STATS") as OwnerAssistantAction,
      action_data: data.action_data || { context: statsPayload, strategic_alert },
      suggested_prompts: Array.isArray(data.suggested_prompts)
        ? data.suggested_prompts
        : DEFAULT_SUGGESTED_PROMPTS,
      metadata: {
        source: "n8n" as const,
        latency_ms,
        model: data.metadata?.model,
      },
    });
  } catch (error) {
    console.error("[owner-assistant] POST", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
