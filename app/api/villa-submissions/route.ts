import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAdmin, AuthError } from "@/lib/auth/server";
import { escapeHtml, checkCsrf, checkRateLimit, ipFromRequest } from "@/lib/security";
import { villaSubmissionSchema } from "@/lib/schemas";
import { render } from "@react-email/render";
import {
  ADMIN_NOTIFICATION_EMAIL,
  getResend,
  isResendConfigured,
  RESEND_FROM,
} from "@/lib/resend";
import SubmissionReceived from "@/emails/submission-received";
import { updateSubmissionStatus } from "@/lib/submissions/update-status";

export const runtime = "nodejs";

const VILLA_SUBMISSION_WEBHOOK = process.env.VILLA_SUBMISSION_WEBHOOK || process.env.N8N_WEBHOOK_URL;

export async function POST(request: Request) {
  try {
    // CSRF (origin) + rate limit (5 soumissions / heure / IP)
    const csrf = checkCsrf(request);
    if (csrf) return csrf;
    const ip = ipFromRequest(request);
    if (!checkRateLimit(`villa-submit:${ip}`, 5, 60 * 60 * 1000)) {
      return NextResponse.json(
        { error: "Trop de soumissions. Réessayez dans une heure." },
        { status: 429 }
      );
    }

    const raw = await request.json();
    const parsed = villaSubmissionSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides.", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const body = parsed.data;
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
    } = body as Record<string, any>;

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
        equipements: Array.isArray(equipements) ? equipements : [],
        surface: surface != null && surface !== "" ? String(surface) : null,
        villa_type: villa_type || null,
        photo_urls: Array.isArray(photo_urls) ? photo_urls : [],
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
              <p><strong>Nom :</strong> ${escapeHtml(name)}</p>
              <p><strong>Email :</strong> ${escapeHtml(email)}</p>
              ${phone ? `<p><strong>Tél. :</strong> ${escapeHtml(phone)}</p>` : ""}
              <p style="margin-top:16px"><strong>${escapeHtml(villa_name || "Villa")}</strong></p>
              <p>${escapeHtml(details || "—")}</p>
              ${airbnb_url ? `<p><strong>Airbnb :</strong> <a href="${escapeHtml(airbnb_url)}">${escapeHtml(airbnb_url)}</a></p>` : ""}
              ${message ? `<p style="margin-top:12px;font-style:italic">« ${escapeHtml(message)} »</p>` : ""}
              <p style="margin-top:16px;font-size:11px;color:#999">Réf. ${submission.id}</p>
            </div>
          `,
        });
      } catch (e) {
        console.error("Villa submission email failed:", e);
      }
    }

    // Email de confirmation → proprio qui a soumis
    if (isResendConfigured() && email) {
      try {
        const html = await render(
          SubmissionReceived({
            ownerName: name || "Propriétaire",
            villaName: villa_name || "votre villa",
          })
        );
        await getResend().emails.send({
          from: RESEND_FROM,
          to: [email],
          subject: `Bien reçu — ${villa_name || "votre villa"} — Kayvila`,
          html,
        });
      } catch (e) {
        console.error("Submission confirmation email failed:", e);
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

    const { submission, villaId, villaCreationError, error } = await updateSubmissionStatus(supabase, { id, status, visit_date, owner_email });
    if (error || !submission) {
      return NextResponse.json({ error: error ?? "Erreur serveur" }, { status: 500 });
    }

    return NextResponse.json({
      ...submission,
      villa_id: villaId ?? submission.villa_id ?? null,
      villa_creation_error: villaCreationError ?? null,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Villa submissions PATCH error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
