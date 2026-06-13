import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";

serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  // Réservations arrivant dans 3 jours, confirmées, livret non encore envoyé
  const target = new Date();
  target.setDate(target.getDate() + 3);
  const targetDate = target.toISOString().split("T")[0];

  const { data: reservations, error } = await supabase
    .from("reservations")
    .select(`
      id,
      villa_id,
      guest_name,
      guest_email,
      villas!inner(name, welcome_booklet_url)
    `)
    .eq("start_date", targetDate)
    .in("status", ["confirmed", "paid"])
    .is("welcome_booklet_sent_at", null);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const results: string[] = [];

  for (const resa of reservations ?? []) {
    const villa = (resa as any).villas;
    const guestEmail = (resa as any).guest_email;

    if (!guestEmail) {
      results.push(`${resa.id}: skip (no guest_email)`);
      continue;
    }

    let bookletLink: string | null = null;
    const bookletPath = villa?.welcome_booklet_url;

    if (bookletPath) {
      const { data: signedData } = await supabase.storage
        .from("welcome-booklets")
        .createSignedUrl(bookletPath, 7 * 24 * 3600); // 7 jours
      bookletLink = signedData?.signedUrl ?? null;
    }

    const villaName = villa?.name ?? "votre villa";
    const html = bookletLink
      ? `
        <h2 style="font-family:sans-serif;color:#0A0A0A">Votre séjour à ${villaName} approche !</h2>
        <p style="font-family:sans-serif;font-size:14px;color:#333">
          Bonjour ${resa.guest_name ?? ""},<br><br>
          Votre arrivée est dans 3 jours. Retrouvez toutes les informations pratiques dans votre livret d'accueil :
        </p>
        <p style="margin:24px 0">
          <a href="${bookletLink}" style="background:#0A0A0A;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;font-family:sans-serif;font-size:14px">
            Télécharger le livret
          </a>
        </p>
        <p style="font-family:sans-serif;font-size:12px;color:#999">Lien valable 7 jours.</p>
      `
      : `
        <h2 style="font-family:sans-serif;color:#0A0A0A">Votre séjour à ${villaName} approche !</h2>
        <p style="font-family:sans-serif;font-size:14px;color:#333">
          Bonjour ${resa.guest_name ?? ""},<br><br>
          Votre arrivée est dans 3 jours. Nous vous contacterons prochainement avec les informations pratiques pour votre séjour.
        </p>
      `;

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Kayvila <noreply@kayvila.com>",
        to: [guestEmail],
        subject: `Votre livret d'accueil — ${villaName}`,
        html,
      }),
    });

    if (emailRes.ok) {
      await supabase
        .from("reservations")
        .update({ welcome_booklet_sent_at: new Date().toISOString() })
        .eq("id", resa.id);
      results.push(`${resa.id}: sent to ${guestEmail}`);
    } else {
      const errText = await emailRes.text();
      results.push(`${resa.id}: email error ${emailRes.status} — ${errText}`);
    }
  }

  return new Response(
    JSON.stringify({ processed: results.length, results }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
});
