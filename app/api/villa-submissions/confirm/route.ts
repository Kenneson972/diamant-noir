import { NextResponse } from "next/server";
import { render } from "@react-email/render";
import { requireAdmin, AuthError } from "@/lib/auth/server";
import { getResend, isResendConfigured, RESEND_FROM } from "@/lib/resend";
import SubmissionReceived from "@/emails/submission-received";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    await requireAdmin(request);

    if (!isResendConfigured()) {
      return NextResponse.json({ error: "Resend not configured" }, { status: 500 });
    }

    const { name, email, villa_name } = await request.json();

    const html = await render(
      SubmissionReceived({
        ownerName: name || "cher propriétaire",
        villaName: villa_name || "votre villa",
      })
    );

    const { error } = await getResend().emails.send({
      from: RESEND_FROM,
      to: [email],
      subject: "Votre demande de conciergerie — Kayvila",
      html,
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Confirm email error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
