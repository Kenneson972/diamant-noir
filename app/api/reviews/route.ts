import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const villaId = searchParams.get("villa_id");
  if (!villaId) return NextResponse.json({ error: "villa_id required" }, { status: 400 });

  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("villa_id", villaId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
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
