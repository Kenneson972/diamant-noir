import { supabaseAdmin } from "@/lib/supabase";

export async function logAdminAction(
  action: string,
  details: Record<string, unknown> = {},
  ip?: string | null
): Promise<void> {
  try {
    const admin = supabaseAdmin();
    await admin.from("admin_audit_log").insert({
      action,
      details,
      ip_address: ip ?? null,
    });
  } catch (err) {
    console.warn("[admin_audit_log]", action, err);
  }
}
