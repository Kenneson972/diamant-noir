import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAdmin, AuthError } from "@/lib/auth/server";
import {
  ADMIN_NOTIFICATION_EMAIL,
  getResend,
  isResendConfigured,
  RESEND_FROM,
} from "@/lib/resend";

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
      villa_type,
      surface,
      surface_terrain,
      chambres,
      salles_de_bains,
      etages,
      parking_places,
      parking_securise,
      equipements,
      already_listed,
      airbnb_url,
      message,
      gardien_existant,
      delai_souhaite,
      adresse_postale,
      no_photos,
      photo_urls,
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
        villa_description: [
          villa_type && `Type: ${villa_type}`,
          surface && `Surface: ${surface} m²`,
          surface_terrain && `Terrain: ${surface_terrain} m²`,
          chambres && `Chambres: ${chambres}`,
          salles_de_bains && `SdB: ${salles_de_bains}`,
          etages && `Étages: ${etages}`,
          parking_places && `Parking: ${parking_places} places${parking_securise ? " (sécurisé)" : ""}`,
          equipements?.length > 0 && `Équipements: ${equipements.join(", ")}`,
          already_listed && `Statut location: ${already_listed}`,
          gardien_existant && `Gardien: ${gardien_existant}`,
          delai_souhaite && `Délai: ${delai_souhaite}`,
        ].filter(Boolean).join(" | ") || null,
        airbnb_url: airbnb_url || null,
        no_photos: Boolean(no_photos),
        message: message || null,
        surface_terrain: surface_terrain || null,
        chambres: chambres || null,
        salles_de_bains: salles_de_bains || null,
        etages: etages || null,
        parking_places: parking_places || null,
        parking_securise: Boolean(parking_securise),
        gardien_existant: gardien_existant || null,
        delai_souhaite: delai_souhaite || null,
        adresse_postale: adresse_postale || null,
        status: "pending",
      })
      .select()
      .single();

    if (insertError) {
      console.error("villa_submissions insert error:", insertError);
      return NextResponse.json(
        { error: "Erreur lors de l'enregistrement." },
        { status: 500 }
      );
    }

    // Email Resend → admin
    if (isResendConfigured()) {
      try {
        const details = [
          villa_name && `Villa : ${villa_name}`,
          villa_location && `Localisation : ${villa_location}`,
          villa_type && `Type : ${villa_type}`,
          chambres && `${chambres} ch.`,
          salles_de_bains && `${salles_de_bains} sdb`,
          surface && `${surface} m²`,
        ].filter(Boolean).join(" · ");

        await getResend().emails.send({
          from: RESEND_FROM,
          to: [ADMIN_NOTIFICATION_EMAIL],
          subject: `Nouvelle soumission villa — ${villa_name || name}`,
          html: `
            <div style="font-family:Georgia,serif;max-width:480px;margin:0 auto;color:#0a1929">
              <h2 style="font-weight:400;color:#d4af37">Nouvelle soumission villa</h2>
              <p><strong>Nom :</strong> ${name}</p>
              <p><strong>Email :</strong> ${email}</p>
              ${phone ? `<p><strong>Tél. :</strong> ${phone}</p>` : ""}
              <p style="margin-top:16px"><strong>${villa_name || "Villa"}</strong></p>
              <p>${details || "—"}</p>
              ${airbnb_url ? `<p><strong>Airbnb :</strong> <a href="${airbnb_url}">${airbnb_url}</a></p>` : ""}
              ${message ? `<p style="margin-top:12px;font-style:italic">« ${message} »</p>` : ""}
              <p style="margin-top:16px;font-size:11px;color:#999">Réf. ${submission.id}</p>
            </div>
          `,
        });
      } catch (e) {
        console.error("Villa submission email failed:", e);
      }
    }

    // Fallback n8n webhook
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
            airbnb_url,
            no_photos: Boolean(no_photos),
            message,
            chambres,
            salles_de_bains,
            gardien_existant,
            delai_souhaite,
            adresse_postale,
          }),
        });
      } catch (e) {
        console.error("Villa submission webhook failed:", e);
      }
    }

    return NextResponse.json({ success: true, id: submission.id });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Villa submissions API error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    await requireAdmin(request);

    const supabase = supabaseAdmin();
    const { data, error } = await supabase
      .from("villa_submissions")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data || []);
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Villa submissions GET error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    await requireAdmin(request);

    const supabase = supabaseAdmin();

    const body = await request.json();
    const { id, status, visit_date, owner_email } = body;
    if (!id || !status) {
      return NextResponse.json({ error: "id et status requis" }, { status: 400 });
    }
    const allowed = ["accepted", "rejected", "info_requested", "visit_scheduled", "visited", "call_requested", "docs_requested"];
    if (!allowed.includes(status)) {
      return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
    }

    const updateData: Record<string, any> = { status, updated_at: new Date().toISOString() };
    if (visit_date) updateData.visit_date = visit_date;

    const { data: submission, error } = await supabase
      .from("villa_submissions")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Email Resend → proprio selon l'action (utilise owner_email ou l'email de la soumission)
    const recipientEmail = owner_email || submission.email;
    if (isResendConfigured() && recipientEmail) {
      const villaName = submission.villa_name || "votre villa";
      const emailSubjects: Record<string, string> = {
        visit_scheduled: `Visite programmée — ${villaName}`,
        call_requested: `Appel souhaité — ${villaName}`,
        docs_requested: `Documents demandés — ${villaName}`,
        accepted: `Bienvenue chez Kayvila ! — ${villaName}`,
        rejected: `Réponse à votre soumission — ${villaName}`,
      };
      const subject = emailSubjects[status] || `Mise à jour — ${villaName}`;

      let html = "";
      if (status === "visit_scheduled") {
        const dateStr = visit_date ? new Date(visit_date).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : "prochainement";
        html = `<div style="font-family:Georgia,serif;max-width:480px;margin:0 auto;color:#0a1929"><h2 style="font-weight:400;color:#d4af37">Visite programmée</h2><p>Bonjour ${submission.name},</p><p>Nous passerons visiter <strong>${villaName}</strong> le <strong>${dateStr}</strong>.</p><p>À bientôt,<br/>L'équipe Kayvila</p></div>`;
      } else if (status === "call_requested") {
        html = `<div style="font-family:Georgia,serif;max-width:480px;margin:0 auto;color:#0a1929"><h2 style="font-weight:400;color:#d4af37">Appel souhaité</h2><p>Bonjour ${submission.name},</p><p>Nous souhaiterions échanger avec vous au sujet de <strong>${villaName}</strong>. Pouvez-vous nous appeler au <strong>+596 696 00 00 00</strong> ?</p><p>À bientôt,<br/>L'équipe Kayvila</p></div>`;
      } else if (status === "docs_requested") {
        html = `<div style="font-family:Georgia,serif;max-width:480px;margin:0 auto;color:#0a1929"><h2 style="font-weight:400;color:#d4af37">Documents demandés</h2><p>Bonjour ${submission.name},</p><p>Pour poursuivre l'étude de <strong>${villaName}</strong>, merci de nous transmettre : titre de propriété, diagnostic énergétique, et dernier avis de taxe foncière.</p><p>À bientôt,<br/>L'équipe Kayvila</p></div>`;
      } else if (status === "accepted") {
        html = `<div style="font-family:Georgia,serif;max-width:480px;margin:0 auto;color:#0a1929"><h2 style="font-weight:400;color:#d4af37">Bienvenue chez Kayvila !</h2><p>Bonjour ${submission.name},</p><p>Nous sommes ravis de vous annoncer que <strong>${villaName}</strong> a été acceptée dans notre collection.</p><p>Prochaines étapes :</p><ul><li>Création de votre compte propriétaire</li><li>Onboarding Stripe Connect pour les reversements</li><li>Séance photo professionnelle</li><li>Mise en ligne sur Kayvila et nos partenaires</li></ul><p><a href="${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/register" style="display:inline-block;padding:12px 24px;background:#d4af37;color:white;text-decoration:none;border-radius:8px;font-weight:bold">Créer mon compte</a></p><p>L'équipe Kayvila</p></div>`;
      } else if (status === "rejected") {
        html = `<div style="font-family:Georgia,serif;max-width:480px;margin:0 auto;color:#0a1929"><h2 style="font-weight:400;color:#d4af37">Réponse à votre soumission</h2><p>Bonjour ${submission.name},</p><p>Nous avons bien étudié votre dossier pour <strong>${villaName}</strong>. Malheureusement, nous ne pouvons pas donner suite pour le moment.</p><p>Nous vous remercions de l'intérêt porté à Kayvila et vous souhaitons une excellente continuation.</p><p>L'équipe Kayvila</p></div>`;
      }

      if (html) {
        try {
          await getResend().emails.send({ from: RESEND_FROM, to: [recipientEmail], subject, html });
        } catch (e) {
          console.error("Villa submission status email failed:", e);
        }
      }
    }

    // Fallback n8n webhook
    const webhook = process.env.VILLA_SUBMISSION_WEBHOOK || process.env.N8N_WEBHOOK_URL;
    if (webhook) {
      try {
        await fetch(webhook, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "villa_submission_status", id, status, submission }) });
      } catch (e) {
        console.error("Villa submission status webhook failed:", e);
      }
    }

    return NextResponse.json(submission);
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Villa submissions PATCH error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
