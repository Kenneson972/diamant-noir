import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAdmin, AuthError } from "@/lib/auth/server";
import { hasBookingConflict } from "@/lib/booking/conflict";
import { logAdminAction } from "@/lib/admin/audit-log";
import { ipFromRequest } from "@/lib/security";
import { BOOKING_VILLA_EMBED } from "@/lib/supabase/embeds";

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

type AdminBookingListRow = {
  id: string;
  villa_id: string | null;
  start_date: string;
  end_date: string;
  status: string;
  payment_status: string | null;
  source: string | null;
  guest_name: string | null;
  guest_email: string | null;
  total_price_cents: number | null;
  price: number | null;
  villas: { name: string } | null;
};

function normalizeBookingRows(rows: Record<string, unknown>[]): AdminBookingListRow[] {
  return rows.map((row) => {
    const villas = row.villas;
    const villa =
      Array.isArray(villas) && villas[0] && typeof villas[0] === "object"
        ? (villas[0] as { name: string })
        : villas && typeof villas === "object" && !Array.isArray(villas)
          ? (villas as { name: string })
          : null;
    return { ...row, villas: villa } as AdminBookingListRow;
  });
}

/**
 * Réservations admin — liste paginée, kanban ou calendrier (service_role).
 */
export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const supabase = supabaseAdmin();
    const { searchParams } = new URL(request.url);

    const filter = searchParams.get("filter") ?? "all";
    const villaId = searchParams.get("villa_id");
    const scope = searchParams.get("scope") ?? "list";
    const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
    const pageSize = Math.min(
      200,
      Math.max(1, Number(searchParams.get("pageSize") ?? "20"))
    );
    const today = new Date().toISOString().split("T")[0];
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .split("T")[0];

    const selectFields = `id, villa_id, start_date, end_date, status, payment_status, source, guest_name, guest_email, total_price_cents, price, ${BOOKING_VILLA_EMBED}`;

    const villasPromise = supabase
      .from("villas")
      .select("id, name")
      .order("name");

    if (scope === "calendar") {
      let query = supabase
        .from("bookings")
        .select(selectFields)
        .eq("status", "confirmed")
        .or(`start_date.gte.${monthStart},end_date.gte.${monthStart}`)
        .order("start_date", { ascending: true });

      if (villaId) query = query.eq("villa_id", villaId);

      const [{ data: bookings, error }, { data: villas, error: villasError }] =
        await Promise.all([query, villasPromise]);

      if (error || villasError) {
        console.error("[admin/bookings] calendar query failed", error ?? villasError);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
      }

      return NextResponse.json(
        {
          bookings: normalizeBookingRows(
            (bookings ?? []) as unknown as Record<string, unknown>[]
          ),
          count: bookings?.length ?? 0,
          villas: villas ?? [],
        },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let listQuery = supabase
      .from("bookings")
      .select(selectFields, scope === "list" ? { count: "exact" } : undefined)
      .order("start_date", { ascending: false });

    if (filter === "past") {
      listQuery = listQuery.eq("status", "confirmed").lt("end_date", today);
    } else if (filter !== "all") {
      listQuery = listQuery.eq("status", filter);
    }
    if (villaId) listQuery = listQuery.eq("villa_id", villaId);

    if (scope === "kanban") {
      listQuery = listQuery.limit(200);
    } else {
      listQuery = listQuery.range(from, to);
    }

    const [{ data: bookings, error, count }, { data: villas, error: villasError }] =
      await Promise.all([listQuery, villasPromise]);

    if (error || villasError) {
      console.error("[admin/bookings] list query failed", error ?? villasError);
      return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }

    return NextResponse.json(
      {
        bookings: normalizeBookingRows(
          (bookings ?? []) as unknown as Record<string, unknown>[]
        ),
        count: scope === "list" ? (count ?? 0) : (bookings?.length ?? 0),
        villas: villas ?? [],
      },
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
      console.error("[admin/bookings] PATCH failed", error);
      const hint =
        error.code === "23514"
          ? "Statut non autorisé en base — contactez le support."
          : error.message;
      return NextResponse.json({ error: hint }, { status: 400 });
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
