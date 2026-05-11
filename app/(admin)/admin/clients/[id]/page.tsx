import { getSupabaseServer } from "@/lib/supabase-server";
import type { Metadata } from "next";
import Link from "next/link";
import { AdminPageIntro } from "@/components/dashboard/admin/AdminPageIntro";
import { formatDate } from "@/lib/utils";
import { REQUEST_TYPE_LABELS, REQUEST_STATUS_LABELS } from "@/lib/constants";
import { Star } from "lucide-react";

export const metadata: Metadata = { title: "Fiche Client — Administration Kayvila" };

export default async function AdminClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await getSupabaseServer();

  const [
    { data: profile },
    { data: bookings },
    { data: requests },
    { data: reviews },
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", id).single(),
    supabase.from("bookings").select("id, villa_id, start_date, end_date, status, total_price_cents, guest_name, checklist_state, villas(name)").or(`guest_email.eq.${id}`).order("start_date", { ascending: false }),
    supabase.from("requests").select("id, type, status, message, admin_response, created_at").eq("guest_id", id).order("created_at", { ascending: false }).limit(50),
    supabase.from("reviews").select("id, rating, comment, status, created_at, villas(name)").eq("guest_id", id).order("created_at", { ascending: false }),
  ]);

  const guestName = profile?.full_name || (bookings?.[0] as any)?.guest_name || "Client";

  return (
    <div className="space-y-8">
      <AdminPageIntro title={guestName} description="Fiche client 360°" />

      {/* Infos profil */}
      <section>
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-navy/50 mb-3">Informations</h2>
        <div className="grid gap-4 sm:grid-cols-2 border border-navy/10 bg-white p-5">
          {[
            ["Email", profile?.email ?? "—"],
            ["Téléphone", profile?.phone ?? "—"],
            ["Rôle", profile?.role ?? "tenant"],
            ["Inscrit depuis", profile?.created_at ? formatDate(profile.created_at, { day: "numeric", month: "long", year: "numeric" }) : "—"],
          ].map(([label, value]) => (
            <div key={label}>
              <span className="text-[10px] uppercase tracking-[0.1em] text-navy/30">{label}</span>
              <p className="text-sm text-navy mt-0.5">{value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Préférences séjour */}
      <section>
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-navy/50 mb-3">Préférences de séjour</h2>
        <div className="grid gap-4 sm:grid-cols-2 border border-navy/10 bg-white p-5">
          {[
            ["Allergies", profile?.allergies || "Aucune"],
            ["Occasion spéciale", profile?.special_occasion || "Aucune"],
            ["Date occasion", profile?.special_occasion_date ? formatDate(profile.special_occasion_date) : "—"],
            ["Heure d'arrivée", profile?.estimated_arrival || "Non précisée"],
            ["Lit bébé", profile?.needs_baby_bed ? "Oui" : "Non"],
            ["Chaise haute", profile?.needs_high_chair ? "Oui" : "Non"],
          ].map(([label, value]) => (
            <div key={label}>
              <span className="text-[10px] uppercase tracking-[0.1em] text-navy/30">{label}</span>
              <p className="text-sm text-navy mt-0.5">{value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Réservations */}
      <section>
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-navy/50 mb-3">
          Réservations ({(bookings ?? []).length})
        </h2>
        <div className="space-y-2">
          {(bookings ?? []).map((b: any) => (
            <div key={b.id} className="flex items-center justify-between border border-navy/10 bg-white px-4 py-3">
              <div>
                <p className="text-sm font-medium text-navy">{b.villas?.name ?? "Villa"}</p>
                <p className="text-[11px] text-navy/40">
                  {formatDate(b.start_date)} → {formatDate(b.end_date)}
                  {b.checklist_state && Object.keys(b.checklist_state).length > 0 && (
                    <> · Checklist: {Object.values(b.checklist_state).filter(Boolean).length}/{Object.keys(b.checklist_state).length}</>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${b.status === "confirmed" ? "bg-emerald-50 text-emerald-700" : b.status === "pending" ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"}`}>
                  {b.status}
                </span>
              </div>
            </div>
          ))}
          {(bookings ?? []).length === 0 && (
            <p className="text-sm text-navy/40 border border-navy/10 bg-white p-4 text-center">Aucune réservation.</p>
          )}
        </div>
      </section>

      {/* Demandes */}
      <section>
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-navy/50 mb-3">
          Demandes ({(requests ?? []).length})
        </h2>
        <div className="space-y-2">
          {(requests ?? []).map((r: any) => (
            <div key={r.id} className="border border-navy/10 bg-white px-4 py-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-semibold text-gold">{REQUEST_TYPE_LABELS[r.type] ?? r.type}</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">{REQUEST_STATUS_LABELS[r.status] ?? r.status}</span>
              </div>
              {r.message && <p className="text-sm text-navy/60">{r.message}</p>}
              {r.admin_response && (
                <div className="mt-2 border border-gold/30 bg-gold/[0.04] p-2">
                  <span className="text-[10px] text-gold font-semibold">Réponse Kayvila :</span>
                  <p className="text-sm text-navy/60 mt-0.5">{r.admin_response}</p>
                </div>
              )}
            </div>
          ))}
          {(requests ?? []).length === 0 && (
            <p className="text-sm text-navy/40 border border-navy/10 bg-white p-4 text-center">Aucune demande.</p>
          )}
        </div>
      </section>

      {/* Avis */}
      <section>
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-navy/50 mb-3">
          Avis ({(reviews ?? []).length})
        </h2>
        <div className="space-y-2">
          {(reviews ?? []).map((r: any) => (
            <div key={r.id} className="flex items-start justify-between border border-navy/10 bg-white px-4 py-3">
              <div>
                <div className="flex items-center gap-1 mb-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} size={12} fill={r.rating >= star ? "currentColor" : "none"}
                      className={r.rating >= star ? "text-gold" : "text-navy/15"} strokeWidth={1} />
                  ))}
                  <span className="text-sm text-navy ml-1">{r.villas?.name ?? "Villa"}</span>
                </div>
                {r.comment && <p className="text-sm text-navy/60">{r.comment}</p>}
              </div>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${r.status === "approved" ? "bg-emerald-50 text-emerald-700" : r.status === "pending" ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"}`}>
                {r.status === "approved" ? "Approuvé" : r.status === "pending" ? "En attente" : "Refusé"}
              </span>
            </div>
          ))}
          {(reviews ?? []).length === 0 && (
            <p className="text-sm text-navy/40 border border-navy/10 bg-white p-4 text-center">Aucun avis.</p>
          )}
        </div>
      </section>

      {/* Navigation rapide */}
      <div className="flex gap-2 pt-4 border-t border-navy/[0.06]">
        <Link href="/admin/clients" className="text-[11px] font-semibold text-navy/50 hover:text-navy transition-colors">
          ← Retour aux clients
        </Link>
      </div>
    </div>
  );
}
