import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAdmin, AuthError } from "@/lib/auth/server";
import { hasBookingConflict } from "@/lib/booking/conflict";
import { logAdminAction } from "@/lib/admin/audit-log";
import { ipFromRequest } from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const createBookingSchema = z.object({
  villa_id: z.string().uuid(),
  guest_name: z.string().min(1),
  guest_email: z.string().email().optional().nullable(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  total_price_cents: z.number().int().nonnegative().optional(),
  status: z.enum(["pending", "confirmed", "cancelled"]).default("confirmed"),
});

const patchBookingSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["pending", "confirmed", "cancelled", "paid"]),
});

/**
 * Toutes les réservations de la plateforme — Agent C (outil kayvila-all-bookings).
 * Auth : Bearer token Supabase d'un compte admin (requireAdmin).
 */
export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const supabase = supabaseAdmin();

    const [{ data: bookings, error }, { data: villas }] = await Promise.all([
      supabase
        .from("bookings")
        .select(
          "id, villa_id, start_date, end_date, status, payment_status, source, guest_name, total_price_cents, price"
        )
        .order("start_date", { ascending: false })
        .limit(100),
      supabase.from("villas").select("id, name"),
    ]);

    if (error) {
      console.error("[admin/bookings] query failed", error);
      return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }

    const nameById = Object.fromEntries((villas ?? []).map((v) => [v.id, v.name]));
    const rows = (bookings ?? []).map((b) => ({
      ...b,
      villa_name: b.villa_id ? nameById[b.villa_id] ?? null : null,
    }));

    return NextResponse.json(
      { bookings: rows, count: rows.length },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[admin/bookings] error", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const adminId = await requireAdmin(request);
    const body = createBookingSchema.parse(await request.json());

    if (body.end_date <= body.start_date) {
      return NextResponse.json(
        { error: "La date de départ doit être après l'arrivée." },
        { status: 400 }
      );
    }

    const supabase = supabaseAdmin();
    const { data: existing } = await supabase
      .from("bookings")
      .select("id, start_date, end_date")
      .eq("villa_id", body.villa_id)
      .in("status", ["pending", "confirmed", "paid"]);

    if (
      hasBookingConflict(existing ?? [], body.start_date, body.end_date)
    ) {
      return NextResponse.json(
        { error: "Ces dates chevauchent une réservation existante." },
        { status: 409 }
      );
    }

    const { data, error } = await supabase
      .from("bookings")
      .insert({
        villa_id: body.villa_id,
        guest_name: body.guest_name,
        guest_email: body.guest_email ?? null,
        start_date: body.start_date,
        end_date: body.end_date,
        total_price_cents: body.total_price_cents ?? 0,
        status: body.status,
        payment_status: body.status === "confirmed" ? "paid" : "pending",
        source: "manual",
      })
      .select("id")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await logAdminAction(
      "bookings.create",
      { booking_id: data.id, villa_id: body.villa_id, admin_id: adminId },
      ipFromRequest(request)
    );

    return NextResponse.json({ ok: true, id: data.id });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    console.error("[admin/bookings] POST", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const adminId = await requireAdmin(request);
    const body = patchBookingSchema.parse(await request.json());
    const supabase = supabaseAdmin();

    const payment_status =
      body.status === "confirmed" || body.status === "paid"
        ? "paid"
        : body.status === "cancelled"
          ? "cancelled"
          : "pending";

    const { error } = await supabase
      .from("bookings")
      .update({ status: body.status, payment_status })
      .eq("id", body.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await logAdminAction(
      "bookings.update_status",
      { booking_id: body.id, status: body.status, admin_id: adminId },
      ipFromRequest(request)
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    console.error("[admin/bookings] PATCH", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
