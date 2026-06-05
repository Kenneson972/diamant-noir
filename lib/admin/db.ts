/**
 * Accès données admin Kayvila — toujours service_role, jamais RLS anon.
 *
 * Règle :
 * - Pages RSC sous app/(admin)/ → supabaseAdmin() via getAdminDb()
 * - Composants client interactifs → /api/admin/* (requireAdmin + supabaseAdmin)
 * - Layout admin auth gate seul → getSupabaseServer() pour session + role check
 */
import { supabaseAdmin } from "@/lib/supabase";

export function getAdminDb() {
  return supabaseAdmin();
}
