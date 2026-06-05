import { addDays, format, startOfDay } from "date-fns";
import { NextResponse } from "next/server";
import { verifyApiKey } from "@/lib/auth/server";
import { readEmailFlags, mergeEmailFlag } from "@/lib/emails/flags";
import { sendCheckinReminderEmail } from "@/lib/emails/send";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!verifyApiKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const targetDate = format(startOfDay(addDays(new Date(), 3)), "yyyy-MM-dd");
  const supabase = supabaseAdmin();

  const { data: bookings, error } = await supabase
    .from("bookings")
    .select(
      "id, guest_name, guest_email, start_date, villa_id, status, checklist_state"
    )
    .eq("start_date", targetDate)
    .in("status", ["confirmed", "paid"]);

  if (error) {
    console.error("send-checkin-reminders query error:", error);
    return NextResponse.json({ error: "Query failed" }, { status: 500 });
  }

  let sent = 0;
  let skipped = 0;

  for (const booking of bookings ?? []) {
    const flags = readEmailFlags(
      booking.checklist_state as Record<string, unknown> | null
    );
    if (flags.checkin_reminder_sent || !booking.guest_email) {
      skipped += 1;
      continue;
    }

    const { data: villa } = await supabase
      .from("villas")
      .select("name, location")
      .eq("id", booking.villa_id)
      .maybeSingle();

    const result = await sendCheckinReminderEmail(booking, villa, 3);
    if (!result.sent) {
      skipped += 1;
      continue;
    }

    await supabase
      .from("bookings")
      .update({
        checklist_state: mergeEmailFlag(
          booking.checklist_state as Record<string, unknown> | null,
          "checkin_reminder_sent"
        ),
      })
      .eq("id", booking.id);

    sent += 1;
  }

  return NextResponse.json({
    ok: true,
    targetDate,
    processed: bookings?.length ?? 0,
    sent,
    skipped,
  });
}
