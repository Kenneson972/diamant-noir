// app/api/chat/owner-lead/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { validateOwnerLead, buildSubmissionUrl } from "@/lib/chatbot/conciergerie-context";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Corps invalide." }, { status: 400 });
  }

  const v = validateOwnerLead(body);
  if (!v.ok) {
    return NextResponse.json({ success: false, error: v.error }, { status: 400 });
  }
  const { villasCount, location, email, name } = v.value;

  // Notif admin (broadcast in-app) — la notif EST la trace, pas de nouvelle table
  try {
    await supabaseAdmin().from("notifications").insert({
      user_id: null,
      type: "owner_lead",
      title: "Nouveau lead propriétaire",
      body: `${name ?? email ?? "Propriétaire"} — ${villasCount ?? "?"} villa(s)${location ? `, ${location}` : ""}`,
    });
  } catch (e) {
    console.warn("[owner-lead] notif", e);
  }

  return NextResponse.json({
    success: true,
    submissionUrl: buildSubmissionUrl({ name, email, location }),
  });
}
