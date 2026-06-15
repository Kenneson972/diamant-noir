// app/api/chat/pre-book/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { validatePreBook } from "@/lib/chatbot/pre-book";

export const runtime = "nodejs";

export async function POST(request: Request) {
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

  // 2) Récupérer le nom de la villa (best effort)
  const { data: villa } = await admin
    .from("villas")
    .select("name")
    .eq("id", villaId)
    .maybeSingle();
  const villaName = villa?.name ?? "votre villa";

  // 3) Notifier l'admin (broadcast in-app)
  await admin.from("notifications").insert({
    user_id: null,
    type: "pre_booking",
    title: "Nouvelle pré-réservation",
    body: `${name ?? email} — ${villaName}, ${startDate} → ${endDate} (${guests} voyageur${guests > 1 ? "s" : ""})`,
  }).then(({ error }) => {
    if (error) console.warn("[pre-book] notif", error.message);
  });

  // 4) Lien pré-rempli vers la page de réservation existante (app/book/page.tsx)
  //    Params confirmés dans le code : villaId, checkin, checkout, guests
  const params = new URLSearchParams({
    villaId,
    checkin: startDate,
    checkout: endDate,
    guests: String(guests),
  });
  const bookingUrl = `/book?${params.toString()}`;

  return NextResponse.json({ success: true, bookingUrl });
}
