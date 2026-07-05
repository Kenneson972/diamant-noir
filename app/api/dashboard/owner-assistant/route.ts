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
import { buildOwnerReply, buildOwnerFallbackText, ownerInsights } from "@/lib/owner-assistant-reply";
import { faqForPrompt } from "@/lib/chatbot/faq";
import { logChatbotFeedback } from "@/lib/chatbot/feedback";

export const runtime = "nodejs";
// L'agent B (owner-context + Postgres + DeepSeek) tourne ~20-22s — laisser la marge
export const maxDuration = 35;

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
    insights: ownerInsights(pack),
    faq: faqForPrompt(["proprietaire"]),
  };
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
        response: (() => {
          const r = buildOwnerReply(pack, userMessage);
          void logChatbotFeedback({ agent: "proprio", sessionId: sessionid ?? null, question: userMessage, matched: r.matchedFaqId !== null });
          return r.text;
        })(),
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
          // L'agent B fetch /api/agent/owner-context?userId=&token= (identité dérivée du token, anti-IDOR)
          userId: user.id,
          token: getBearer(request) ?? "",
          messages_history: Array.isArray(body.messages)
            ? (body.messages as { role: string; content: string }[]).slice(-12)
            : null,
          context: buildCompactContext(pack),
          source: "owner_dashboard",
        }),
        signal: AbortSignal.timeout(30_000), // timeout 30s (agent: owner-context + Postgres + DeepSeek ~20s)
      });
    } catch (fetchErr) {
      console.error("[owner-assistant] webhook fetch error", fetchErr);
      return NextResponse.json({
        success: true,
        response: buildOwnerFallbackText(pack),
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
        response: buildOwnerFallbackText(pack),
        action: "SHOW_STATS" as OwnerAssistantAction,
        action_data: { context: statsPayload, strategic_alert },
        suggested_prompts: DEFAULT_SUGGESTED_PROMPTS,
        metadata: { source: "local" as const, latency_ms },
      });
    }

    const data = await n8nResponse.json().catch(() => ({}));

    // Les agents n8n renvoient soit `response` (admin) soit `reply` (visiteur/owner)
    const replyText =
      typeof data.response === "string" && data.response
        ? data.response
        : typeof data.reply === "string" && data.reply
          ? data.reply
          : null;

    // Validation réponse n8n — si malformée, fallback propre
    if (!replyText) {
      console.error("[owner-assistant] réponse n8n malformée", data);
      return NextResponse.json({
        success: true,
        response: buildOwnerFallbackText(pack),
        action: "SHOW_STATS" as OwnerAssistantAction,
        action_data: { context: statsPayload, strategic_alert },
        suggested_prompts: DEFAULT_SUGGESTED_PROMPTS,
        metadata: { source: "local" as const, latency_ms },
      });
    }

    // ── ACTION HANDLERS (l'IA qui agit) ──────────────────────────────────────
    // ⚠️ Toutes les actions sont scopées au propriétaire connecté
    const ownerVillaIds = new Set((pack.villas as { id?: string }[]).map((v) => v.id));

    const action = (data.action || "SHOW_STATS") as OwnerAssistantAction;
    const actionData = data.action_data || {};
    let actionResult: { success: boolean; error?: string; [key: string]: unknown } | null = null;

    if (action === "CREATE_TASK" && actionData.task) {
      const task = actionData.task as {
        villa_id?: string; title?: string; type?: string;
        due_date?: string; assigned_to?: string;
      };
      // Vérifier que la villa appartient bien au propriétaire
      if (!task.villa_id || !ownerVillaIds.has(task.villa_id)) {
        actionResult = { success: false, error: "Villa non autorisée" };
      } else if (task.title) {
        const { data: created, error } = await admin.from("tasks").insert({
          villa_id: task.villa_id,
          title: task.title,
          type: task.type || "other",
          status: "pending",
          due_date: task.due_date || null,
          assigned_to: task.assigned_to || null,
        }).select("id").single();
        actionResult = { success: !error, task_id: created?.id, error: error?.message };
      }
    }

    if (action === "COMPLETE_TASK" && actionData.task_id) {
      // Vérifier que la tâche appartient à une villa du propriétaire
      const { data: existingTask } = await admin.from("tasks")
        .select("villa_id").eq("id", actionData.task_id).single();
      if (!existingTask || !ownerVillaIds.has(existingTask.villa_id)) {
        actionResult = { success: false, error: "Tâche non autorisée" };
      } else {
        const { error } = await admin.from("tasks")
          .update({ status: "done", completed_at: new Date().toISOString() })
          .eq("id", actionData.task_id);
        actionResult = { success: !error, error: error?.message };
      }
    }

    if (action === "BLOCK_DATE" && actionData.block) {
      const block = actionData.block as {
        villa_id?: string; start_date?: string; end_date?: string;
        reason?: string;
      };
      if (!block.villa_id || !ownerVillaIds.has(block.villa_id)) {
        actionResult = { success: false, error: "Villa non autorisée" };
      } else if (block.start_date && block.end_date) {
        // Le proprio crée toujours avec origin "Proprietaire"
        // Seul l'admin peut créer avec origin "Kayvila"
        const { data: created, error } = await admin.from("villa_date_blocks").insert({
          villa_id: block.villa_id,
          start_date: block.start_date,
          end_date: block.end_date,
          reason: block.reason || "Blocage via Copilot",
          origin: "Proprietaire",
          created_by: user.id,
        }).select("id").single();
        actionResult = { success: !error, block_id: created?.id, error: error?.message };
      }
    }

    if (action === "SET_PRICE" && actionData.price) {
      const pd = actionData.price as {
        villa_id?: string;
        price_per_night?: number;
        previous_price?: number;
      };
      if (!pd.villa_id || !ownerVillaIds.has(pd.villa_id)) {
        actionResult = { success: false, error: "Villa non autorisée" };
      } else if (typeof pd.price_per_night === "number" && pd.price_per_night > 0) {
        // Lire l'ancien prix avant update
        const { data: before } = await admin
          .from("villas")
          .select("price_per_night, name")
          .eq("id", pd.villa_id)
          .maybeSingle();
        const previous = before?.price_per_night ?? null;

        const { data: updated, error } = await admin
          .from("villas")
          .update({ price_per_night: pd.price_per_night })
          .eq("id", pd.villa_id)
          .select("id, name, price_per_night")
          .single();

        actionResult = {
          success: !error,
          villa: updated,
          previous_price: previous,
          error: error?.message,
        };
      }
    }

    if (action === "SHOW_BOOKING") {
      const villaIdList = Array.from(ownerVillaIds);
      const today = new Date().toISOString().split("T")[0];
      // Couvre check-ins futurs ET séjours en cours
      const { data: nextBooking } = await admin
        .from("bookings")
        .select("id, guest_name, villa_id, start_date, end_date, status, total_price_cents")
        .in("villa_id", villaIdList)
        .or(
          `start_date.gte.${today},and(start_date.lte.${today},end_date.gte.${today})`
        )
        .order("start_date", { ascending: true })
        .limit(1)
        .maybeSingle();

      actionResult = { success: true, booking: nextBooking || null };
    }

    return NextResponse.json({
      success: true,
      response: replyText,
      action,
      action_data: { context: statsPayload, strategic_alert, ...actionData },
      action_result: actionResult,
      suggested_prompts: Array.isArray(data.suggested_prompts)
        ? data.suggested_prompts
        : Array.isArray(data.suggestedPrompts)
          ? data.suggestedPrompts
          : DEFAULT_SUGGESTED_PROMPTS,
      metadata: {
        source: "n8n" as const,
        latency_ms,
        model: data.metadata?.model,
        request_id,
      },
    });
  } catch (error) {
    console.error("[owner-assistant] POST", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
