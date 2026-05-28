import { NextResponse } from "next/server";
import { Resend } from "resend";
import { requireAdmin, AuthError } from "@/lib/auth/server";

export const runtime = "nodejs";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(request: Request) {
  try {
    await requireAdmin(request);

    if (!resend) {
      return NextResponse.json({ error: "Resend not configured" }, { status: 500 });
    }

    const { name, email, villa_name } = await request.json();

    const { error } = await resend.emails.send({
      from: "Kayvila <conciergerie@kayvila.com>",
      to: [email],
      subject: "Votre demande de conciergerie — Kayvila",
      html: `
        <div style="font-family:Georgia,serif;max-width:480px;margin:0 auto;color:#0a1929">
          <h2 style="font-weight:400;color:#d4af37">Bonjour ${name || "cher propriétaire"},</h2>
          <p style="font-size:15px;line-height:1.6;color:#334155">
            Nous avons bien reçu votre demande de conciergerie${villa_name ? ` pour <strong>${villa_name}</strong>` : ""}.
          </p>
          <p style="font-size:15px;line-height:1.6;color:#334155">
            Notre équipe étudiera votre dossier avec attention et vous recontactera sous <strong>48 heures ouvrées</strong>.
          </p>
          <p style="font-size:15px;line-height:1.6;color:#334155">
            Sans engagement, votre demande ne vous oblige à rien.
          </p>
          <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0" />
          <p style="font-size:12px;color:#94a3b8">
            Kayvila Conciergerie — Martinique<br />
            Cet email a été envoyé automatiquement, merci de ne pas y répondre.
          </p>
        </div>
      `,
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
