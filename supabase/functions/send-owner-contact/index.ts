import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const SUPPORT_EMAIL = "support@kayvila.com";

serve(async (req) => {
  try {
    const { ownerId, villaId, subject, message } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get owner info
    const { data: profile } = await supabase
      .from("profiles")
      .select("first_name, last_name")
      .eq("id", ownerId)
      .single();

    const { data: auth } = await supabase.auth.admin.getUserById(ownerId);
    const ownerEmail = auth?.user?.email ?? "inconnu@kayvila.com";
    const ownerName =
      `${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim() ||
      ownerEmail;

    let villaName = "Aucune villa spécifique";
    if (villaId) {
      const { data: villa } = await supabase
        .from("villas")
        .select("name")
        .eq("id", villaId)
        .single();
      villaName = villa?.name ?? villaName;
    }

    const SUBJECT_LABELS: Record<string, string> = {
      reversement: "Reversement / Facturation",
      disponibilites: "Disponibilités",
      contrat: "Mon contrat",
      autre: "Autre",
    };

    const html = `
      <h2 style="font-family:sans-serif;color:#0A0A0A;margin-bottom:16px">
        Message propriétaire — Kayvila
      </h2>
      <table style="font-family:sans-serif;font-size:14px;color:#333;border-collapse:collapse;width:100%" cellpadding="8">
        <tr style="border-bottom:1px solid #eee"><td style="font-weight:bold;width:140px">Propriétaire</td><td>${ownerName} (${ownerEmail})</td></tr>
        <tr style="border-bottom:1px solid #eee"><td style="font-weight:bold">Villa</td><td>${villaName}</td></tr>
        <tr style="border-bottom:1px solid #eee"><td style="font-weight:bold">Objet</td><td>${SUBJECT_LABELS[subject] ?? subject}</td></tr>
        <tr><td style="font-weight:bold;vertical-align:top;padding-top:12px">Message</td><td style="padding-top:12px">${message.replace(/\n/g, "<br>")}</td></tr>
      </table>
      <p style="font-family:sans-serif;font-size:12px;color:#999;margin-top:24px">
        Envoyé depuis l'espace propriétaire Kayvila.
      </p>
    `;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Kayvila <noreply@kayvila.com>",
        to: [SUPPORT_EMAIL],
        reply_to: ownerEmail,
        subject: `[Proprio] ${SUBJECT_LABELS[subject] ?? subject} — ${ownerName}`,
        html,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return new Response(JSON.stringify({ error: err }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
