import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message, sessionid } = body;

    if (!message || !message.trim()) {
      return NextResponse.json({ error: "Message vide" }, { status: 400 });
    }

    const supabase = supabaseAdmin();

    // --- CONTEXT GATHERING (The "Conscience" of the Admin IA) ---
    
    // Fetch in parallel to avoid API waterfalls
    const [villasRes, bookingsRes, tasksRes] = await Promise.all([
      supabase.from("villas").select("*"),
      supabase.from("bookings").select("*").order("start_date", { ascending: true }),
      supabase.from("tasks").select("*"),
    ]);
    const villas = villasRes.data;
    const bookings = bookingsRes.data;
    const tasks = tasksRes.data;

    // Build the Master Context Object
    const contextData = {
      villas: villas || [],
      bookings: bookings || [],
      tasks: tasks || [],
      business_metrics: {
        total_villas: villas?.length || 0,
        published_villas: villas?.filter(v => v.is_published).length || 0,
        pending_tasks: tasks?.filter(t => t.status === 'pending').length || 0,
        total_revenue: bookings?.filter(b => b.payment_status === 'paid').reduce((sum, b) => sum + (Number(b.price) || 0), 0) || 0,
        upcoming_arrivals: bookings?.filter(b => new Date(b.start_date) >= new Date()).length || 0,
      },
      current_date: new Date().toISOString(),
    };

    // --- WEBHOOK CALL ---
    const webhookURL = process.env.N8N_ADMIN_WEBHOOK_URL || process.env.N8N_WEBHOOK_URL;

    if (!webhookURL) {
      return NextResponse.json({
        success: true,
        response: `[MODE ADMIN DEMO] Je vois ${villas?.length} villas et ${tasks?.length} tâches en attente.`,
        action: "SHOW_STATS",
        action_data: contextData
      });
    }

    const response = await fetch(webhookURL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: message.trim(),
        sessionid: sessionid,
        role: "admin",
        context: contextData, // Envoi de l'objet complet
        source: "admin_dashboard"
      }),
    });

    if (!response.ok) throw new Error(`Webhook error: ${response.status}`);

    const data = await response.json();
    
    // Support standard response format or structured JSON with actions
    return NextResponse.json({
      success: true,
      response: data.response || (typeof data === 'string' ? data : JSON.stringify(data)),
      action: data.action || null, // e.g., "SHOW_CHART", "SHOW_VILLA"
      action_data: data.action_data || null
    });

  } catch (error) {
    console.error("Admin Chat Error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
