import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

const VILLA_SUBMISSION_WEBHOOK = process.env.VILLA_SUBMISSION_WEBHOOK || process.env.N8N_WEBHOOK_URL;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      email,
      phone,
      villa_name,
      villa_location,
      villa_description,
      airbnb_url,
      no_photos,
      message,
      platforms, // [{ platform, ical_url, label }]
    } = body;

    if (!name || !email) {
      return NextResponse.json(
        { error: "Nom et email sont requis." },
        { status: 400 }
      );
    }

    const supabase = supabaseAdmin();
    const { data: submission, error: insertError } = await supabase
      .from("villa_submissions")
      .insert({
        name,
        email,
        phone: phone || null,
        villa_name: villa_name || null,
        villa_location: villa_location || null,
        villa_description: villa_description || null,
        airbnb_url: airbnb_url || null,
        no_photos: Boolean(no_photos),
        message: message || null,
        platforms: Array.isArray(platforms) && platforms.length > 0 ? platforms : null,
        status: "pending",
      })
      .select()
      .single();

    if (insertError) {
      console.error("villa_submissions insert error:", insertError);
      return NextResponse.json(
        { error: "Erreur lors de l'enregistrement. La table villa_submissions existe-t-elle ?" },
        { status: 500 }
      );
    }

    if (VILLA_SUBMISSION_WEBHOOK) {
      try {
        await fetch(VILLA_SUBMISSION_WEBHOOK, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "villa_submission",
            id: submission.id,
            name,
            email,
            phone,
            villa_name,
            villa_location,
            villa_description,
            airbnb_url,
            no_photos: Boolean(no_photos),
            message,
          }),
        });
      } catch (e) {
        console.error("Villa submission webhook failed:", e);
      }
    }

    return NextResponse.json({ success: true, id: submission.id });
  } catch (error) {
    console.error("Villa submissions API error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = supabaseAdmin();
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("villa_submissions")
      .select("id, name, email, phone, villa_name, villa_location, airbnb_url, no_photos, status, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data || []);
  } catch (error) {
    console.error("Villa submissions GET error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = supabaseAdmin();
    const { data: userData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !userData?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, status } = body;
    if (!id || !status) {
      return NextResponse.json({ error: "id et status requis" }, { status: 400 });
    }
    const allowed = ["accepted", "rejected", "info_requested"];
    if (!allowed.includes(status)) {
      return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
    }

    const { data: submission, error } = await supabase
      .from("villa_submissions")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const webhook = process.env.VILLA_SUBMISSION_WEBHOOK || process.env.N8N_WEBHOOK_URL;
    if (webhook) {
      try {
        await fetch(webhook, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "villa_submission_status", id, status, submission }),
        });
      } catch (e) {
        console.error("Villa submission status webhook failed:", e);
      }
    }

    return NextResponse.json(submission);
  } catch (error) {
    console.error("Villa submissions PATCH error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
