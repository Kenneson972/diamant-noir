import { supabaseAdmin } from "@/lib/supabase";
import { AdminPageIntro } from "@/components/dashboard/admin/AdminPageIntro";
import Link from "next/link";
import { Eye, FileText, Globe, ExternalLink } from "lucide-react";
import { KayvilaPngIcon } from "@/components/icons/KayvilaPngIcon";
import { SubmissionActions } from "./SubmissionActions";

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

const EQUIPEMENTS = ["Piscine", "Vue mer", "Accès plage", "Jacuzzi", "Terrasse", "Climatisation", "Cuisine équipée", "Parking", "WiFi", "Barbecue", "Salle de sport", "Borne EV"];

async function getSubmissions() {
  const supabase = supabaseAdmin();
  const { data } = await supabase
    .from("villa_submissions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);
  return data ?? [];
}

function InfoBadge({ icon, label, value }: { icon: string; label?: string; value: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-navy/60">
      {renderIcon(icon)}
      {label && <span className="text-navy/40">{label}:</span>}
      <span className="font-medium text-navy/70">{value}</span>
    </span>
  );
}

function renderIcon(icon: string) {
  const pngIcons: Record<string, string> = {
    "building2": "villa",
    "home": "home",
    "mail": "mail",
    "phone": "phone",
    "map-pin": "location",
    "calendar": "calendar",
    "user": "users",
    "bed": "villa",
    "bath": "villa",
    "car": "car",
    "trees": "villa",
    "wifi": "wifi",
    "clock": "clock",
    "message-square": "message",
    "star": "star",
    "eye": "eye",
    "file-text": "file-text",
    "globe": "globe",
  };
  const pngName = pngIcons[icon];
  if (pngName) {
    return <KayvilaPngIcon name={pngName as any} size={18} alt="" className="shrink-0" />;
  }
  return null;
}

export default async function AdminSoumissionsPage() {
  const submissions = await getSubmissions();

  const pending = submissions.filter((s) => s.status === "pending" || s.status === "visit_scheduled" || s.status === "call_requested" || s.status === "docs_requested" || s.status === "visited");
  const closed = submissions.filter((s) => s.status === "accepted" || s.status === "rejected");
  const all = [...pending, ...closed];

  return (
    <div className="space-y-8">
      <AdminPageIntro
        title="Soumissions villa"
        description="Propriétaires souhaitant confier leur villa. Gérez le cycle complet : visite → appel → docs → validation."
      />

      {/* Compteurs */}
      {all.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {Object.entries(STATUS_LABEL).map(([key, label]) => {
            const count = submissions.filter((s) => s.status === key).length;
            if (count === 0) return null;
            return (
              <span key={key} className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-semibold uppercase ${STATUS_STYLE[key]}`}>
                {label} · {count}
              </span>
            );
          })}
        </div>
      )}

      {all.length === 0 ? (
        <div className="rounded-lg border bg-white p-12 text-center">
          <KayvilaPngIcon name="home" size={40} alt="" />
          <p className="mt-4 text-sm text-gray-500">Aucune soumission pour le moment.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {all.map((s: any) => {
            const descriptionParts = (s.villa_description || "").split(" | ");
            const equipements = descriptionParts.find((p: string) => p.startsWith("Équipements:"))?.replace("Équipements: ", "").split(", ") ?? [];
            const type = descriptionParts.find((p: string) => p.startsWith("Type:"))?.replace("Type: ", "") ?? null;
            const surface = descriptionParts.find((p: string) => p.startsWith("Surface:"))?.replace("Surface: ", "") ?? null;
            const terrain = descriptionParts.find((p: string) => p.startsWith("Terrain:"))?.replace("Terrain: ", "") ?? null;
            const listingStatus = descriptionParts.find((p: string) => p.startsWith("Statut location:"))?.replace("Statut location: ", "") ?? null;
            const gardien = descriptionParts.find((p: string) => p.startsWith("Gardien:"))?.replace("Gardien: ", "") ?? null;
            const delai = descriptionParts.find((p: string) => p.startsWith("Délai:"))?.replace("Délai: ", "") ?? null;

            return (
              <div key={s.id} className="overflow-hidden rounded-xl border bg-white shadow-sm">
                {/* En-tête */}
                <div className="flex items-start justify-between gap-4 border-b border-navy/5 bg-navy/[0.015] px-6 py-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-display text-lg font-semibold text-navy">
                        {s.villa_name || "Villa sans nom"}
                      </h3>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${STATUS_STYLE[s.status] || "bg-gray-100 text-gray-500"}`}>
                        {STATUS_LABEL[s.status] || s.status}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-0.5 text-xs text-navy/40">
                      <span>Réf. {s.id.slice(0, 8)}</span>
                      <span>· {new Date(s.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                      {s.visit_date && <span className="text-blue-600">· Visite le {new Date(s.visit_date).toLocaleDateString("fr-FR")}</span>}
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <Link
                      href={`/admin/soumissions/${s.id}`}
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-gold hover:underline"
                    >
                      <ExternalLink size={11} /> Voir la fiche
                    </Link>
                    {(s.status === "pending" || s.status === "visit_scheduled" || s.status === "call_requested" || s.status === "docs_requested" || s.status === "visited") && (
                      <SubmissionActions id={s.id} ownerEmail={s.email} />
                    )}
                    {(s.status === "accepted" || s.status === "rejected") && (
                      <span className="text-[11px] font-medium text-navy/40">Dossier clos</span>
                    )}
                  </div>
                </div>

                {/* Corps — 4 colonnes */}
                <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-2 lg:grid-cols-4">
                  {/* BIEN */}
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-bold uppercase tracking-[0.15em] text-navy/40">Le bien</h4>
                    <div className="space-y-1.5">
                      {type && <InfoBadge icon="building2" value={type} />}
                      {surface && <InfoBadge icon="home" value={surface} />}
                      {terrain && <InfoBadge icon="trees" value={terrain} />}
                      {s.chambres && <InfoBadge icon="bed" value={`${s.chambres} chambre${s.chambres > 1 ? "s" : ""}`} />}
                      {s.salles_de_bains && <InfoBadge icon="bath" value={`${s.salles_de_bains} sdb`} />}
                      {s.etages && <InfoBadge icon="building2" value={`${s.etages} étage${s.etages > 1 ? "s" : ""}`} />}
                      {s.parking_places && <InfoBadge icon="car" value={`${s.parking_places} place${s.parking_places > 1 ? "s" : ""}${s.parking_securise ? " sécurisé" : ""}`} />}
                    </div>
                    {equipements.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {equipements.map((eq: string) => (
                          <span key={eq} className="rounded bg-navy/5 px-1.5 py-0.5 text-[9px] font-medium text-navy/50">{eq}</span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* SITUATION */}
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-bold uppercase tracking-[0.15em] text-navy/40">Situation</h4>
                    <div className="space-y-1.5">
                      {listingStatus && <InfoBadge icon="eye" value={`Location : ${listingStatus}`} />}
                      {gardien && <InfoBadge icon="user" value={`Gardien : ${gardien}`} />}
                      {delai && <InfoBadge icon="clock" value={`Délai : ${delai}`} />}
                      {s.airbnb_url && (
                        <a href={s.airbnb_url} target="_blank" rel="noopener" className="inline-flex items-center gap-1 text-xs text-gold hover:underline">
                          <KayvilaPngIcon name="star" size={18} alt="" /> Lien Airbnb ↗
                        </a>
                      )}
                      {s.platforms && typeof s.platforms === "object" && (
                        <InfoBadge icon="globe" value={Object.keys(s.platforms).join(", ")} />
                      )}
                      <InfoBadge icon="file-text" value={s.no_photos ? "Photos à faire" : "Photos fournies"} />
                    </div>
                  </div>

                  {/* CONTACT */}
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-bold uppercase tracking-[0.15em] text-navy/40">Contact</h4>
                    <div className="space-y-1.5">
                      <InfoBadge icon="user" value={s.name} />
                      <InfoBadge icon="mail" value={s.email} />
                      {s.phone && <InfoBadge icon="phone" value={s.phone} />}
                      {s.adresse_postale && <InfoBadge icon="map-pin" value={s.adresse_postale} />}
                    </div>
                  </div>

                  {/* NOTES ADMIN */}
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-bold uppercase tracking-[0.15em] text-navy/40">Admin</h4>
                    <div className="space-y-1.5">
                      {s.ai_tier && <InfoBadge icon="star" value={`Score AI : ${s.ai_tier}`} />}
                      {s.ai_score != null && <InfoBadge icon="star" value={`${s.ai_score}/10`} />}
                      {s.ai_recommendation && (
                        <p className="rounded bg-navy/[0.03] px-2 py-1 text-[10px] italic text-navy/50">{s.ai_recommendation}</p>
                      )}
                      {s.internal_notes && (
                        <p className="rounded bg-amber-50 px-2 py-1 text-[10px] text-amber-800"><strong>Notes :</strong> {s.internal_notes}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Message */}
                {(s.message || s.villa_description) && (
                  <div className="border-t border-navy/5 px-6 py-3">
                    {s.message && (
                      <p className="text-sm text-navy/60 italic">
                        <KayvilaPngIcon name="message" size={18} alt="" className="inline mr-1" />
                        « {s.message} »
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
