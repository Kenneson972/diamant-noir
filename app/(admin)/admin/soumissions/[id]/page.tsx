import { supabaseAdmin } from "@/lib/supabase";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { SubmissionActions } from "../SubmissionActions";

export const dynamic = "force-dynamic";

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  visit_scheduled: "bg-blue-100 text-blue-700",
  visited: "bg-indigo-100 text-indigo-700",
  call_requested: "bg-purple-100 text-purple-700",
  docs_requested: "bg-orange-100 text-orange-700",
  accepted: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "En attente",
  visit_scheduled: "Visite programmée",
  visited: "Visité",
  call_requested: "Appel demandé",
  docs_requested: "Docs demandés",
  accepted: "Accepté",
  rejected: "Refusé",
};

async function getSubmission(id: string) {
  const supabase = supabaseAdmin();
  const { data } = await supabase
    .from("villa_submissions")
    .select("*")
    .eq("id", id)
    .single();
  return data;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-white p-6">
      <h2 className="mb-4 text-[10px] font-bold uppercase tracking-[0.18em] text-navy/40">{title}</h2>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value && value !== 0 && value !== false) return null;
  return (
    <div className="flex items-start gap-3">
      <span className="w-36 shrink-0 text-xs text-navy/40">{label}</span>
      <span className="text-sm text-navy">{value}</span>
    </div>
  );
}

export default async function SubmissionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await getSubmission(id);
  if (!s) notFound();

  const descriptionParts = (s.villa_description || "").split(" | ");
  const equipements = descriptionParts.find((p: string) => p.startsWith("Équipements:"))?.replace("Équipements: ", "").split(", ") ?? [];
  const type = descriptionParts.find((p: string) => p.startsWith("Type:"))?.replace("Type: ", "") ?? null;
  const surface = descriptionParts.find((p: string) => p.startsWith("Surface:"))?.replace("Surface: ", "") ?? null;
  const terrain = descriptionParts.find((p: string) => p.startsWith("Terrain:"))?.replace("Terrain: ", "") ?? null;
  const listingStatus = descriptionParts.find((p: string) => p.startsWith("Statut location:"))?.replace("Statut location: ", "") ?? null;
  const gardien = descriptionParts.find((p: string) => p.startsWith("Gardien:"))?.replace("Gardien: ", "") ?? null;
  const delai = descriptionParts.find((p: string) => p.startsWith("Délai:"))?.replace("Délai: ", "") ?? null;

  const isOpen = ["pending", "visit_scheduled", "call_requested", "docs_requested", "visited"].includes(s.status);

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-navy/40">
        <Link href="/admin/soumissions" className="flex items-center gap-1 hover:text-navy">
          <ArrowLeft size={13} /> Soumissions
        </Link>
        <ChevronRight size={12} />
        <span className="text-navy/70 font-medium">{s.villa_name || "Villa sans nom"}</span>
      </div>

      {/* En-tête */}
      <div className="flex flex-wrap items-start justify-between gap-4 rounded-xl border bg-white px-6 py-5">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-2xl font-semibold text-navy">
              {s.villa_name || "Villa sans nom"}
            </h1>
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-semibold uppercase ${STATUS_STYLE[s.status] || "bg-gray-100 text-gray-500"}`}>
              {STATUS_LABEL[s.status] || s.status}
            </span>
          </div>
          <p className="mt-1 text-xs text-navy/40">
            Réf. {s.id.slice(0, 8)} · Reçu le {new Date(s.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
          </p>
          {s.visit_date && (
            <p className="mt-0.5 text-xs text-blue-600">
              Visite programmée le {new Date(s.visit_date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          )}
        </div>
        {isOpen ? (
          <SubmissionActions id={s.id} ownerEmail={s.email} />
        ) : (
          <span className="text-[11px] font-medium text-navy/40">Dossier clos</span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Le bien */}
        <Section title="Le bien">
          <Row label="Nom" value={s.villa_name} />
          <Row label="Type" value={type} />
          <Row label="Surface habitable" value={surface} />
          <Row label="Terrain" value={terrain} />
          <Row label="Chambres" value={s.chambres ? `${s.chambres} chambre${s.chambres > 1 ? "s" : ""}` : null} />
          <Row label="Salles de bains" value={s.salles_de_bains ? `${s.salles_de_bains} sdb` : null} />
          <Row label="Étages" value={s.etages ? `${s.etages} étage${s.etages > 1 ? "s" : ""}` : null} />
          <Row label="Parking" value={s.parking_places ? `${s.parking_places} place${s.parking_places > 1 ? "s" : ""}${s.parking_securise ? " (sécurisé)" : ""}` : null} />
          {equipements.length > 0 && (
            <div className="flex items-start gap-3">
              <span className="w-36 shrink-0 text-xs text-navy/40">Équipements</span>
              <div className="flex flex-wrap gap-1">
                {equipements.map((eq: string) => (
                  <span key={eq} className="rounded bg-navy/5 px-2 py-0.5 text-[11px] font-medium text-navy/60">{eq}</span>
                ))}
              </div>
            </div>
          )}
        </Section>

        {/* Contact propriétaire */}
        <Section title="Contact propriétaire">
          <Row label="Nom" value={s.name} />
          <Row label="Email" value={
            <a href={`mailto:${s.email}`} className="text-gold hover:underline">{s.email}</a>
          } />
          <Row label="Téléphone" value={s.phone ? (
            <a href={`tel:${s.phone}`} className="text-gold hover:underline">{s.phone}</a>
          ) : null} />
          <Row label="Adresse postale" value={s.adresse_postale} />
        </Section>

        {/* Situation locative */}
        <Section title="Situation locative">
          <Row label="Statut location" value={listingStatus} />
          <Row label="Délai mise en location" value={delai} />
          <Row label="Gardien" value={gardien} />
          <Row label="Photos disponibles" value={s.no_photos ? "Non — photos à faire" : "Oui"} />
          <Row label="Lien Airbnb" value={s.airbnb_url ? (
            <a href={s.airbnb_url} target="_blank" rel="noopener noreferrer" className="text-gold hover:underline break-all">
              {s.airbnb_url} ↗
            </a>
          ) : null} />
          <Row label="Plateformes" value={
            s.platforms && typeof s.platforms === "object"
              ? Object.keys(s.platforms).join(", ")
              : null
          } />
        </Section>

        {/* Analyse IA */}
        <Section title="Analyse IA">
          <Row label="Tier" value={s.ai_tier} />
          <Row label="Score" value={s.ai_score != null ? `${s.ai_score}/10` : null} />
          {s.ai_recommendation && (
            <div className="rounded-lg bg-navy/[0.03] p-3 text-xs italic text-navy/60">
              {s.ai_recommendation}
            </div>
          )}
          {!s.ai_tier && !s.ai_score && !s.ai_recommendation && (
            <p className="text-xs text-navy/30 italic">Analyse non disponible</p>
          )}
        </Section>
      </div>

      {/* Message & notes */}
      {(s.message || s.internal_notes || s.villa_description) && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {s.message && (
            <Section title="Message du propriétaire">
              <p className="text-sm text-navy/70 italic leading-relaxed">« {s.message} »</p>
            </Section>
          )}
          {s.internal_notes && (
            <Section title="Notes internes">
              <p className="text-sm text-amber-800 leading-relaxed">{s.internal_notes}</p>
            </Section>
          )}
          {s.villa_description && (
            <div className="lg:col-span-2">
              <Section title="Description brute (formulaire)">
                <p className="text-xs text-navy/50 font-mono leading-relaxed whitespace-pre-wrap break-all">{s.villa_description}</p>
              </Section>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
