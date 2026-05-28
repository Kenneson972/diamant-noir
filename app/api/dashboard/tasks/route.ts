import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAuth, AuthError } from "@/lib/auth/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Tâches de maintenance des villas du propriétaire connecté — Agent B (outil kayvila-my-tasks).
 * Auth : Bearer token Supabase. Scope dérivé de owner_id côté serveur.
 */
export async function GET(request: Request) {
  try {
    const userId = await requireAuth(request);
    const supabase = supabaseAdmin();

    const { data: villas } = await supabase
      .from("villas")
      .select("id, name")
      .eq("owner_id", userId);

    const ids = (villas ?? []).map((v) => v.id);
    if (ids.length === 0) {
      return NextResponse.json({ tasks: [], count: 0 });
    }

    const { data, error } = await supabase
      .from("tasks")
      .select("id, villa_id, title, description, status, due_date, created_at")
      .in("villa_id", ids)
      .order("due_date", { ascending: true })
      .limit(50);

    if (error) {
      console.error("[dashboard/tasks] query failed", error);
      return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }

    const nameById = Object.fromEntries((villas ?? []).map((v) => [v.id, v.name]));
    const tasks = (data ?? []).map((t) => ({
      ...t,
      villa_name: t.villa_id ? nameById[t.villa_id] ?? null : null,
    }));

    return NextResponse.json(
      { tasks, count: tasks.length },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[dashboard/tasks] error", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
