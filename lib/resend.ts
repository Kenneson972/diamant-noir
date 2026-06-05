import { Resend } from "resend";
import { SITE_BRAND_DISPLAY } from "@/data/site-brand";

export const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export const RESEND_FROM =
  process.env.RESEND_FROM_EMAIL ||
  `${SITE_BRAND_DISPLAY} <conciergerie@kayvila.com>`;

export const ADMIN_NOTIFICATION_EMAIL =
  process.env.ADMIN_NOTIFICATION_EMAIL || "equipe@kayvila.com";

export function isResendConfigured(): boolean {
  return Boolean(resend);
}

export function getResend(): Resend {
  if (!resend) throw new Error("RESEND_API_KEY is not set");
  return resend;
}
