import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { z } from "zod";
import { checkRateLimit, ipFromRequest } from "@/lib/security";
import { checkCsrf } from "@/lib/security";

export const runtime = "nodejs";

const CONTACT_WEBHOOK_URL = process.env.CONTACT_WEBHOOK_URL || process.env.N8N_WEBHOOK_URL;

/* ─── Schéma de validation Zod ─────────────────────── */

const contactSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères").max(100),
  email: z.string().email("Email invalide"),
  subject: z.string().max(200).optional().default(""),
  message: z.string().min(10, "Le message doit contenir au moins 10 caractères").max(5000),
});

/* ─── Route ─────────────────────────────────────────── */

export async function POST(request: Request) {
  // Rate limiting : 5 req / 60s par IP
  if (!checkRateLimit(`contact:${ipFromRequest(request)}`, 5, 60_000)) {
    return NextResponse.json({ error: "Trop de requêtes. Réessayez plus tard." }, { status: 429 });
  }

  try {
    const body = await request.json();

    // Validation Zod
    const result = contactSchema.safeParse(body);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      const firstError = Object.values(errors).flat()[0] || "Données invalides";
      return NextResponse.json({ error: firstError, details: errors }, { status: 400 });
    }

    const { name, email, subject, message } = result.data;
    const payload = { name, email, subject, message, type: "contact_form" };

    if (CONTACT_WEBHOOK_URL) {
      const res = await fetch(CONTACT_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        console.error("Contact webhook failed:", res.status);
      }
    }

    try {
      const supabase = supabaseAdmin();
      await supabase.from("contact_requests").insert({
        name,
        email,
        subject: subject || null,
        message,
      });
    } catch (dbError) {
      console.error("Contact save to DB failed (table may not exist):", dbError);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Contact API error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
