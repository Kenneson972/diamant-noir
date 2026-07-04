import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAdmin, AuthError } from "@/lib/auth/server";
import { checkCsrf } from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const postSchema = z.object({
  session_id: z.string().min(1),
  content: z.string().min(1),
});

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const { data, error } = await supabaseAdmin()
      .from("chat_messages")
      .select("id, session_id, user_id, role, content, created_at")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ messages: data ?? [] });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const csrf = checkCsrf(request);
  if (csrf) return csrf;

  try {
    const adminUser = await requireAdmin(request);
    const body = postSchema.parse(await request.json());

    const { error } = await supabaseAdmin().from("chat_messages").insert({
      session_id: body.session_id,
      user_id: adminUser,
      role: "assistant",
      content: body.content.trim(),
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
