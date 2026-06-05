import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAdmin, AuthError } from "@/lib/auth/server";
import { migrateLegacyExternalIds } from "@/lib/ota-hub";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    await requireAdmin(request);

    const supabase = supabaseAdmin();
    const migrated = await migrateLegacyExternalIds(supabase);

    if (migrated === 0) {
      return NextResponse.json({ migrated: 0, message: "Nothing to migrate" });
    }

    return NextResponse.json({ migrated });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("OTA migration error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Migration failed" },
      { status: 500 }
    );
  }
}
