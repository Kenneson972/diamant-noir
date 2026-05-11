"use client";

import { useState, useEffect } from "react";
import { getSupabaseBrowser } from "@/lib/supabase";
import { Star, Check, X } from "lucide-react";
import { AdminPageIntro } from "@/components/dashboard/admin/AdminPageIntro";

export default function AdminAvisPage() {
  const supabase = getSupabaseBrowser();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");

  const fetchReviews = async () => {
    if (!supabase) return;
    const query = supabase
      .from("reviews")
      .select("id, rating, comment, photos, status, created_at, booking_id, guest_id, villa_id, villas(name), bookings(guest_name)")
      .order("created_at", { ascending: false });
    if (filter !== "all") query.eq("status", filter);
    const { data } = await query;
    setReviews(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchReviews(); }, [supabase, filter]);

  const handleAction = async (review: any, status: string) => {
    if (!supabase) return;
    await supabase.from("reviews").update({
      status,
      updated_at: new Date().toISOString(),
    }).eq("id", review.id);

    await supabase.from("notifications").insert({
      user_id: review.guest_id,
      type: "system",
      title: status === "approved" ? "Avis approuvé" : "Avis refusé",
      body: `Votre avis sur "${review.villas?.name ?? "la villa"}" a été ${status === "approved" ? "approuvé et publié" : "refusé"}.`,
      action_url: "/espace-client",
    });

    fetchReviews();
  };

  return (
    <div className="space-y-6">
      <AdminPageIntro title="Avis clients" description="Gérez et modérez les avis post-séjour" />

      <div className="flex gap-2 flex-wrap">
        {["pending", "approved", "rejected", "all"].map((f) => (
          <button key={f} onClick={() => { setFilter(f); setLoading(true); }}
            className={`px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] rounded-full transition-colors ${filter === f ? "bg-navy text-white" : "bg-white border border-navy/10 text-navy/50 hover:border-navy/30"}`}>
            {f === "all" ? "Tous" : f === "pending" ? "En attente" : f === "approved" ? "Approuvés" : "Refusés"}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-navy/40">Chargement...</p>
      ) : reviews.length === 0 ? (
        <div className="border border-navy/10 bg-white p-12 text-center">
          <p className="text-sm text-navy/40">Aucun avis.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <div key={r.id} className="border border-navy/10 bg-white p-5">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={14}
                          fill={r.rating >= star ? "currentColor" : "none"}
                          className={r.rating >= star ? "text-gold" : "text-navy/15"}
                          strokeWidth={1}
                        />
                      ))}
                    </div>
                    <span className="text-[11px] font-semibold text-navy">{r.rating}/5</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      r.status === "pending" ? "bg-amber-50 text-amber-700" :
                      r.status === "approved" ? "bg-emerald-50 text-emerald-700" :
                      "bg-red-50 text-red-700"
                    }`}>
                      {r.status === "pending" ? "En attente" : r.status === "approved" ? "Approuvé" : "Refusé"}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-navy">
                    {r.bookings?.guest_name ?? "Voyageur"} — {r.villas?.name ?? "Villa"}
                  </p>
                </div>
                <span className="text-[11px] text-navy/30">
                  {new Date(r.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}
                </span>
              </div>
              {r.comment && (
                <p className="text-sm text-navy/70 mb-3 bg-navy/[0.02] p-3">{r.comment}</p>
              )}
              {r.status === "pending" && (
                <div className="flex gap-2">
                  <button onClick={() => handleAction(r, "approved")}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-50 text-emerald-700 text-[11px] font-semibold rounded-full hover:bg-emerald-100 transition-colors">
                    <Check size={14} /> Approuver
                  </button>
                  <button onClick={() => handleAction(r, "rejected")}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-50 text-red-700 text-[11px] font-semibold rounded-full hover:bg-red-100 transition-colors">
                    <X size={14} /> Refuser
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
