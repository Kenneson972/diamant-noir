import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

const CONTACT_WEBHOOK_URL = process.env.CONTACT_WEBHOOK_URL || process.env.N8N_WEBHOOK_URL;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, subject, message } = body;
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Nom, email et message sont requis." },
        { status: 400 }
      );
    }

    const payload = { name, email, subject: subject || "", message, type: "contact_form" };

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
