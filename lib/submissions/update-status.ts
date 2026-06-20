import type { SupabaseClient } from "@supabase/supabase-js";
import { render } from "@react-email/render";
import { getResend, isResendConfigured, RESEND_FROM } from "@/lib/resend";
import SubmissionVisitScheduled from "@/emails/submission-visit-scheduled";
import SubmissionCallRequested from "@/emails/submission-call-requested";
import SubmissionDocsRequested from "@/emails/submission-docs-requested";
import SubmissionAccepted from "@/emails/submission-accepted";
import SubmissionRejected from "@/emails/submission-rejected";

export async function updateSubmissionStatus(
  admin: SupabaseClient,
  params: { id: string; status: "accepted" | "rejected"; reason?: string; visit_date?: string; owner_email?: string },
): Promise<{ submission: Record<string, unknown> | null; error?: string }> {
  const { id, status, visit_date, owner_email } = params;

  const updateData: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
  if (visit_date) updateData.visit_date = visit_date;

  const { data: submission, error } = await admin
    .from("villa_submissions")
    .update(updateData)
    .eq("id", id)
    .select("*")
    .single();

  if (error || !submission) {
    return { submission: null, error: error?.message ?? "Soumission introuvable" };
  }

  // Email Resend → proprio selon l'action
  const recipientEmail = owner_email || submission.email;
  if (isResendConfigured() && recipientEmail) {
    const villaName = submission.villa_name || "votre villa";
    const ownerName = submission.name || "Propriétaire";

    const templateMap: Record<string, { subject: string; component: any; props: any }> = {
      visit_scheduled: {
        subject: `Visite programmée — ${villaName}`,
        component: SubmissionVisitScheduled,
        props: { ownerName, villaName, visitDate: visit_date || new Date().toISOString() },
      },
      call_requested: {
        subject: `Appel souhaité — ${villaName}`,
        component: SubmissionCallRequested,
        props: { ownerName, villaName },
      },
      docs_requested: {
        subject: `Documents demandés — ${villaName}`,
        component: SubmissionDocsRequested,
        props: { ownerName, villaName },
      },
      accepted: {
        subject: `Bienvenue chez Kayvila ! — ${villaName}`,
        component: SubmissionAccepted,
        props: { ownerName, villaName },
      },
      rejected: {
        subject: `Réponse à votre soumission — ${villaName}`,
        component: SubmissionRejected,
        props: { ownerName, villaName },
      },
    };

    const tmpl = templateMap[status];
    if (tmpl) {
      try {
        const html = await render(tmpl.component(tmpl.props));
        await getResend().emails.send({ from: RESEND_FROM, to: [recipientEmail], subject: tmpl.subject, html });
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

  return { submission };
}
