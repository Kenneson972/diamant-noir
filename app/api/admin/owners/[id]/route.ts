import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAdmin, AuthError } from "@/lib/auth/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request);
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }

  try {
    const { id } = await params;
    const supabase = supabaseAdmin();

    // 1. Profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Propriétaire introuvable" }, { status: 404 });
    }

    // 2. Villas
    const { data: villas } = await supabase
      .from("villas")
      .select("id, name, slug, price_per_night, is_published, commission_rate, image_urls, capacity")
      .eq("owner_id", id)
      .order("created_at", { ascending: false });

    // 3. Stats réservations
    const { data: bookings } = await supabase
      .from("bookings")
      .select("total_price_cents, start_date, status, villa_id")
      .eq("status", "confirmed")
      .in("villa_id", (villas ?? []).map((v) => v.id))
      .order("start_date", { ascending: false });

    // 4. Disputes Stripe
    const villaIds = (villas ?? []).map((v) => v.id);
    let disputes: any[] = [];
    if (villaIds.length > 0) {
      const { data: bookingIds } = await supabase
        .from("bookings")
        .select("id")
        .in("villa_id", villaIds);

      if (bookingIds?.length) {
        const { data: d } = await supabase
          .from("stripe_disputes")
          .select("*")
          .in(
            "booking_id",
            bookingIds.map((b) => b.id)
          );
        disputes = d ?? [];
      }
    }

    const totalRevenue = (bookings ?? []).reduce(
      (sum, b) => sum + (b.total_price_cents ?? 0),
      0
    );

    return NextResponse.json({
      profile,
      villas: villas ?? [],
      bookings: bookings ?? [],
      disputes,
      stats: {
        totalBookings: bookings?.length ?? 0,
        totalRevenueCents: totalRevenue,
        totalVillas: villas?.length ?? 0,
        publishedVillas: villas?.filter((v) => v.is_published).length ?? 0,
      },
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("GET /api/admin/owners/[id] error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request);
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }

  try {
    const { id } = await params;
    const body = await request.json();

    const allowedFields = ["full_name", "phone", "email", "suspended"];
    const updates: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (key in body) updates[key] = body[key];
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "Aucun champ modifiable fourni" }, { status: 400 });
    }

    const supabase = supabaseAdmin();
    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, updated: updates });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("PATCH /api/admin/owners/[id] error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
