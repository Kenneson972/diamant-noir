import type { SupabaseClient } from "@supabase/supabase-js";
import { isStaffAdmin } from "@/lib/auth/admin-access";

/** Vérifie que l'utilisateur est proprio de la villa ou staff admin. */
export async function verifyVillaOwnerOrAdmin(
  admin: SupabaseClient,
  villaId: string,
  userId: string,
  userEmail?: string | null
): Promise<boolean> {
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (isStaffAdmin(profile?.role, userEmail)) return true;

  const { data: villa } = await admin
    .from("villas")
    .select("owner_id")
    .eq("id", villaId)
    .maybeSingle();

  return villa?.owner_id === userId;
}
