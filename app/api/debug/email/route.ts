import { NextResponse } from "next/server";
import { isResendConfigured, RESEND_FROM, ADMIN_NOTIFICATION_EMAIL, getResend } from "@/lib/resend";

export const dynamic = "force-dynamic";

export async function GET() {
  const results: Record<string, unknown> = {};

  // 1. Check env vars
  results.resend_api_key_set = Boolean(process.env.RESEND_API_KEY);
  results.resend_from_email = RESEND_FROM;
  results.admin_notification_email = ADMIN_NOTIFICATION_EMAIL;
  results.resend_configured = isResendConfigured();

  // 2. Check NEXT_PUBLIC_BASE_URL
  results.base_url = process.env.NEXT_PUBLIC_BASE_URL || "(not set — falling back to VERCEL_URL or localhost)";
  results.vercel_url = process.env.VERCEL_URL || "(not set)";

  // 3. Try sending a test email
  if (isResendConfigured()) {
    try {
      const resend = getResend();
      const { data, error } = await resend.emails.send({
        from: RESEND_FROM,
        to: [ADMIN_NOTIFICATION_EMAIL],
        subject: `[DIAGNOSTIC] Test email — ${new Date().toISOString()}`,
        html: `<p>Ceci est un test de diagnostic Kayvila.</p><p>Si vous lisez ceci, Resend fonctionne correctement depuis kayvila.com.</p>`,
      });
      if (error) {
        results.test_send = { status: "FAILED", error: error.message, details: error };
      } else {
        results.test_send = { status: "OK", messageId: data?.id };
      }
    } catch (e: any) {
      results.test_send = { status: "EXCEPTION", error: e.message, stack: e.stack };
    }
  } else {
    results.test_send = { status: "SKIPPED", reason: "RESEND_API_KEY not configured" };
  }

  return NextResponse.json(results);
}
