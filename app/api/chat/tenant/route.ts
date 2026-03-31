import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(key: string, max = 30, windowMs = 3600000): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(key);
  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }
  if (record.count >= max) return false;
  record.count++;
  return true;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message, sessionId, bookingId, guestEmail } = body;

    if (!message?.trim()) {
      return NextResponse.json({ error: "Message vide", success: false }, { status: 400 });
    }

    if (!guestEmail || !checkRateLimit(guestEmail)) {
      return NextResponse.json(
        { error: "Trop de requêtes. Veuillez réessayer plus tard.", success: false },
        { status: 429 }
      );
    }

    // Récupérer le contexte réservation + villa
    let context: Record<string, unknown> = { guest: { email: guestEmail } };

    if (bookingId) {
      try {
        const supabase = supabaseAdmin();
        const { data: booking } = await supabase
          .from("bookings")
          .select("id, villa_id, start_date, end_date, status, guest_name, guest_email")
          .eq("id", bookingId)
          .eq("guest_email", guestEmail)
          .single();

        if (booking) {
          const { data: villa } = await supabase
            .from("villas")
            .select("id, name, location, emergency_contacts, wifi_name")
            .eq("id", booking.villa_id)
            .single();

          context = {
            booking: {
              id: booking.id,
              villa_id: booking.villa_id,
              start_date: booking.start_date,
              end_date: booking.end_date,
              status: booking.status,
            },
            villa: villa ?? {},
            guest: { name: booking.guest_name, email: booking.guest_email },
          };
        }
      } catch (e) {
        console.error("Context fetch error:", e);
      }
    }

    const sid = sessionId || `tenant-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const webhookURL = process.env.N8N_TENANT_WEBHOOK_URL || process.env.N8N_WEBHOOK_URL;

    if (!webhookURL) {
      return NextResponse.json({
        success: true,
        response:
          "Bonjour ! Je suis l'assistante SAV Diamant Noir 💎\n\nJe suis là pour vous aider pendant votre séjour. (Mode Démo: configurez N8N_TENANT_WEBHOOK_URL)",
        sessionId: sid,
      });
    }

    const payload = {
      message: message.trim(),
      sessionId: sid,
      timestamp: new Date().toISOString(),
      role: "tenant",
      source: "sav_espace_client",
      context,
    };

    const response = await fetch(webhookURL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) throw new Error(`Webhook error: ${response.status}`);

    const data = await response.json();
    const chatResponse =
      data.response ||
      data.message ||
      data.output ||
      data.text ||
      (typeof data === "string" ? data : JSON.stringify(data));

    return NextResponse.json({ success: true, response: chatResponse, sessionId: sid });
  } catch (error) {
    console.error("Tenant Chat API Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur serveur", success: false },
      { status: 500 }
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
