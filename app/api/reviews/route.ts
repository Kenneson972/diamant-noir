import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const villaId = searchParams.get("villa_id");
  if (!villaId) return NextResponse.json({ error: "villa_id required" }, { status: 400 });

  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("reviews")
    .select("id, villa_id, booking_id, guest_name, rating, comment, created_at, cleanliness_rating, location_rating, communication_rating, value_rating, checkin_rating, bookings(guest_email)")
    .eq("villa_id", villaId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data || data.length === 0) return NextResponse.json([]);

  // Resolve profiles for reviewer names
  const emails = data
    .map((r) => (r as any).bookings?.guest_email)
    .filter((e): e is string => Boolean(e));

  let profilesMap: Record<string, { full_name: string | null; avatar_url: string | null }> = {};
  if (emails.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("email, full_name, avatar_url")
      .in("email", emails);

    if (profiles) {
      for (const p of profiles) {
        profilesMap[p.email] = { full_name: p.full_name, avatar_url: p.avatar_url };
      }
    }
  }

  const enriched = data.map((r: any) => {
    const email = r.bookings?.guest_email;
    const profile = email ? profilesMap[email] : null;
    return {
      id: r.id,
      villa_id: r.villa_id,
      guest_name: r.guest_name,
      rating: r.rating,
      comment: r.comment,
      created_at: r.created_at,
      cleanliness_rating: r.cleanliness_rating ?? null,
      location_rating: r.location_rating ?? null,
      communication_rating: r.communication_rating ?? null,
      value_rating: r.value_rating ?? null,
      checkin_rating: r.checkin_rating ?? null,
      full_name: profile?.full_name ?? null,
      avatar_url: profile?.avatar_url ?? null,
    };
  });

  return NextResponse.json(enriched);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { villa_id, booking_id, guest_name, rating, comment } = body;
  if (!villa_id || !guest_name || !rating) {
    return NextResponse.json({ error: "villa_id, guest_name, rating required" }, { status: 400 });
  }

  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("reviews")
    .insert({ villa_id, booking_id, guest_name, rating, comment })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
