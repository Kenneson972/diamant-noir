// app/api/chat/pre-book/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { validatePreBook } from "@/lib/chatbot/pre-book";
import { checkRateLimit, getClientIP } from "@/lib/chatbot/rate-limit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  // Rate limiting — endpoint public non authentifié
  const clientIP = getClientIP(request);
  if (!checkRateLimit(clientIP, 10, 3600000)) {
    return NextResponse.json(
      { success: false, error: "Trop de requêtes. Veuillez réessayer plus tard." },
      { status: 429 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Corps invalide." }, { status: 400 });
  }

  const v = validatePreBook(body);
  if (!v.ok) {
    return NextResponse.json({ success: false, error: v.error }, { status: 400 });
  }
  const { villaId, email, startDate, endDate, guests, name, sessionId } = v.value;

  const admin = supabaseAdmin();

  // 0) Vérifier que la villa existe et est publiée (court-circuite avant l'insert)
  const { data: villa } = await admin
    .from("villas")
    .select("name, is_published")
    .eq("id", villaId)
    .maybeSingle();

  if (!villa) {
    return NextResponse.json({ success: false, error: "Villa introuvable." }, { status: 400 });
  }
  if (!villa.is_published) {
    return NextResponse.json({ success: false, error: "Cette villa n'est plus disponible." }, { status: 400 });
  }
  const villaName = villa.name ?? "votre villa";

  // 1) Persister la demande
  const { error: insertErr } = await admin.from("pre_booking_requests").insert({
    session_id: sessionId,
    villa_id: villaId,
    start_date: startDate,
    end_date: endDate,
    email,
    guests,
    name,
    status: "new",
  });
  if (insertErr) {
    console.error("[pre-book] insert", insertErr.message);
    return NextResponse.json({ success: false, error: "Enregistrement impossible." }, { status: 500 });
  }

  // 2) Notifier l'admin (broadcast in-app) — avec cap à 50 notifs pour éviter le spam
  const { count: notifCount } = await admin
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("type", "pre_booking")
    .gte("created_at", new Date(Date.now() - 3600000).toISOString());

  if ((notifCount ?? 0) < 50) {
    await admin.from("notifications").insert({
      user_id: null,
      type: "pre_booking",
      title: "Nouvelle pré-réservation",
      body: `${name ?? email} — ${villaName}, ${startDate} → ${endDate} (${guests} voyageur${guests > 1 ? "s" : ""})`,
    }).then(({ error }) => {
      if (error) console.warn("[pre-book] notif", error.message);
    });
  }

  // 3) Lien pré-rempli vers la page de réservation existante (app/book/page.tsx)
  const params = new URLSearchParams({
    villaId,
    checkin: startDate,
    checkout: endDate,
    guests: String(guests),
  });
  const bookingUrl = `/book?${params.toString()}`;

  return NextResponse.json({ success: true, bookingUrl });
}
