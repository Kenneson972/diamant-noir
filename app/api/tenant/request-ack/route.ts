import { NextResponse } from "next/server";
import { getResend, isResendConfigured, RESEND_FROM } from "@/lib/resend";

const REQUEST_TYPE_LABELS: Record<string, string> = {
  early_checkin: "Early check-in",
  late_checkout: "Late check-out",
  date_change: "Modification de dates",
  issue: "Signaler un problème",
  service: "Service ponctuel",
  other: "Autre",
};

export async function POST(request: Request) {
  try {
    const { email, type } = await request.json();
    if (!email || !type) {
      return NextResponse.json({ error: "Email et type requis" }, { status: 400 });
    }

    if (isResendConfigured()) {
      const resend = getResend();
      const label = REQUEST_TYPE_LABELS[type] ?? type;
      await resend.emails.send({
        from: RESEND_FROM,
        to: email,
        subject: "Kayvila — Nous avons bien reçu votre demande",
        html: `<p>Bonjour,</p>
<p>Nous avons bien reçu votre demande <strong>« ${label} »</strong>.</p>
<p>Notre équipe revient vers vous très rapidement.</p>
<p>L'équipe Kayvila</p>`,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("request-ack error:", e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
