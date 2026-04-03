import { NextResponse } from "next/server";
import { sanitizeUserMessage, sanitizeConversationSummary, sanitizeLeadData } from "@/lib/chatbot/sanitize";
import { getPublishedVillasForChatbot, extractUniqueAmenities } from "@/lib/chatbot/villa-context";
import type {
  ChatbotRequest,
  ChatbotApiInput,
  N8nChatResponse,
  ChatbotResponse,
  LeadData,
  ChatStage,
} from "@/types/chatbot";

export const runtime = "nodejs";

// Rate limiting simple (en production : utiliser Upstash Redis)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string, maxRequests = 30, windowMs = 3600000): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }
  if (record.count >= maxRequests) return false;
  record.count++;
  return true;
}

function getClientIP(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "unknown";
}

// Réponse de fallback si n8n est indisponible
function buildFallbackResponse(
  sessionId: string,
  villaCount: number,
  reason: "no_webhook" | "timeout" | "error"
): ChatbotResponse {
  const messages: Record<typeof reason, string> = {
    no_webhook:
      `Bonjour, bienvenue chez Diamant Noir.\n\nNous proposons ${villaCount} villa${villaCount > 1 ? "s" : ""} d'exception en Martinique. Je suis votre concierge privé — comment puis-je vous aider ?\n\n_(Mode démonstration — configurez N8N_WEBHOOK_URL pour activer l'assistant IA)_`,
    timeout:
      "Notre service de conciergerie est momentanément surchargé. Nous vous invitons à réessayer dans quelques instants ou à nous contacter directement.",
    error:
      "Je rencontre une difficulté technique passagère. Notre équipe reste disponible pour vous accompagner.",
  };

  return {
    success: true,
    reply: messages[reason],
    sessionId,
    stage: "greet",
    suggestedQuickReplies: ["Découvrir nos villas", "Demander un devis", "Contacter le concierge"],
  };
}

// Extraction et normalisation de la réponse n8n
// Compatible avec l'ancien format { response/message/... } et le nouveau { reply, intent, ... }
function parseN8nResponse(raw: unknown): N8nChatResponse | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const d = raw as Record<string, unknown>;

  const reply =
    typeof d.reply === "string" ? d.reply
    : typeof d.response === "string" ? d.response
    : typeof d.message === "string" ? d.message
    : typeof d.output === "string" ? d.output
    : typeof d.text === "string" ? d.text
    : null;

  if (!reply) return null;

  return {
    reply,
    intent: d.intent as N8nChatResponse["intent"],
    stage: d.stage as N8nChatResponse["stage"],
    leadTemperature: d.leadTemperature as N8nChatResponse["leadTemperature"],
    qualificationScore: typeof d.qualificationScore === "number" ? d.qualificationScore : undefined,
    leadUpdate: (d.leadUpdate as Partial<LeadData>) || {},
    suggestedVillas: Array.isArray(d.suggestedVillas) ? d.suggestedVillas : [],
    comparisonData: d.comparisonData as N8nChatResponse["comparisonData"],
    preBooking: d.preBooking as N8nChatResponse["preBooking"],
    cta: (d.cta as N8nChatResponse["cta"]) || { type: "none" },
    suggestedQuickReplies: Array.isArray(d.suggestedQuickReplies) ? d.suggestedQuickReplies : [],
    shouldEscalateToHuman: d.shouldEscalateToHuman === true,
    humanHandoffReason: typeof d.humanHandoffReason === "string" ? d.humanHandoffReason : undefined,
    warnings: Array.isArray(d.warnings) ? d.warnings : [],
    debug: process.env.NODE_ENV === "development" ? (d.debug as Record<string, unknown>) : undefined,
  };
}

export async function POST(request: Request) {
  // Rate limiting
  const clientIP = getClientIP(request);
  if (!checkRateLimit(clientIP)) {
    return NextResponse.json(
      { success: false, error: "Trop de requêtes. Veuillez réessayer plus tard." },
      { status: 429 }
    );
  }

  let body: Partial<ChatbotRequest>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Corps de requête invalide." },
      { status: 400 }
    );
  }

  // Sanitisation du message — protection anti-injection de prompt
  const rawMessage = typeof body.message === "string" ? body.message : "";
  const sanitized = sanitizeUserMessage(rawMessage);

  if (!sanitized.safe || !sanitized.sanitized) {
    // Réponse gracieuse sans révéler la raison du rejet
    return NextResponse.json({
      success: true,
      reply: "Je ne suis pas en mesure de traiter cette demande. Comment puis-je vous aider autrement ?",
      sessionId: body.sessionId || `session-${Date.now()}`,
      stage: "fallback" as ChatStage,
      suggestedQuickReplies: ["Voir nos villas", "Demander un devis", "Contacter le concierge"],
    } as ChatbotResponse);
  }

  const sessionId =
    typeof body.sessionId === "string" && body.sessionId.length > 0
      ? body.sessionId
      : `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  // Contexte villas depuis Supabase (données réelles, champs sûrs uniquement)
  const villas = await getPublishedVillasForChatbot();
  const availableAmenities = extractUniqueAmenities(villas);

  const webhookURL = process.env.N8N_WEBHOOK_URL || process.env.CHAT_WEBHOOK_URL;

  if (!webhookURL) {
    return NextResponse.json(buildFallbackResponse(sessionId, villas.length, "no_webhook"));
  }

  // Payload enrichi vers n8n
  const apiInput: ChatbotApiInput = {
    message: sanitized.sanitized,
    sessionId,
    locale: body.locale ?? "fr",
    source: "website_chatbot",
    timestamp: new Date().toISOString(),
    currentPage: typeof body.currentPage === "string" ? body.currentPage : "/",
    villaId: typeof body.villaId === "string" ? body.villaId : undefined,
    knownLeadData: sanitizeLeadData(body.knownLeadData),
    currentStage: body.currentStage ?? "greet",
    context: {
      villas,
      availableAmenities,
      villaCount: villas.length,
    },
    capabilities: {
      canVerifyAvailability: false,  // V1 : pas de vérification iCal en temps réel
      canCreateBooking: false,       // V1 : pre-booking uniquement
      canSendEmail: false,
    },
  };

  // En-têtes vers n8n (secret optionnel pour authentifier la source)
  const n8nHeaders: Record<string, string> = { "Content-Type": "application/json" };
  const webhookSecret = process.env.N8N_WEBHOOK_SECRET;
  if (webhookSecret) n8nHeaders["X-Webhook-Secret"] = webhookSecret;

  try {
    const n8nRes = await fetch(webhookURL, {
      method: "POST",
      headers: n8nHeaders,
      body: JSON.stringify(apiInput),
      signal: AbortSignal.timeout(25000),
    });

    if (!n8nRes.ok) {
      console.error(`[api/chat] n8n error: ${n8nRes.status}`);
      return NextResponse.json(buildFallbackResponse(sessionId, villas.length, "error"));
    }

    const rawData = await n8nRes.json();
    const parsed = parseN8nResponse(rawData);

    if (!parsed) {
      console.error("[api/chat] n8n response unparseable:", JSON.stringify(rawData).slice(0, 300));
      return NextResponse.json(buildFallbackResponse(sessionId, villas.length, "error"));
    }

    // Réponse frontend — filtrée et sûre
    const clientResponse: ChatbotResponse = {
      success: true,
      reply: parsed.reply,
      sessionId,
      intent: parsed.intent,
      stage: parsed.stage,
      leadTemperature: parsed.leadTemperature,
      leadUpdate: parsed.leadUpdate,
      suggestedVillas: parsed.suggestedVillas?.slice(0, 3),
      comparisonData: parsed.comparisonData,
      preBooking: parsed.preBooking,
      cta: parsed.cta,
      suggestedQuickReplies: parsed.suggestedQuickReplies?.slice(0, 4),
      shouldEscalateToHuman: parsed.shouldEscalateToHuman,
      humanHandoffReason: parsed.shouldEscalateToHuman ? parsed.humanHandoffReason : undefined,
    };

    return NextResponse.json(clientResponse);
  } catch (error) {
    const isTimeout =
      error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
    console.error("[api/chat]", isTimeout ? "timeout" : error);
    return NextResponse.json(
      buildFallbackResponse(sessionId, villas.length, isTimeout ? "timeout" : "error")
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
