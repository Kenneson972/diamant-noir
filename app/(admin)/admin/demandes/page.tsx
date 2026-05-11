"use client";

import { useState, useEffect } from "react";
import { getSupabaseBrowser } from "@/lib/supabase";
import { Check, X, MessageCircle } from "lucide-react";
import { REQUEST_TYPE_LABELS, REQUEST_STATUS_STYLES } from "@/lib/constants";

export default function AdminDemandesPage() {
  const supabase = getSupabaseBrowser();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [responseText, setResponseText] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState("pending");

  const fetchRequests = async () => {
    if (!supabase) return;
    const query = supabase
      .from("requests")
      .select("id, type, status, message, admin_response, created_at, booking_id, guest_id, bookings(villa_id, villas(name), guest_name, start_date, end_date)")
      .order("created_at", { ascending: false });
    if (filter !== "all") query.eq("status", filter);
    const { data } = await query;
    setRequests(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchRequests(); }, [supabase, filter]);

  const handleAction = async (id: string, status: string, guestId?: string, requestType?: string) => {
    if (!supabase) return;
    const resp = responseText[id] ?? "";
    await supabase.from("requests").update({
      status,
      admin_response: resp || null,
      updated_at: new Date().toISOString(),
    }).eq("id", id);

    if (guestId) {
      const statusLabel = status === "resolved" ? "résolue" : status === "rejected" ? "refusée" : "prise en charge";
      const typeLabel = REQUEST_TYPE_LABELS[requestType ?? ""] ?? requestType ?? "Demande";
      await supabase.from("notifications").insert({
        user_id: guestId,
        type: "request_update",
        title: `Demande ${statusLabel}`,
        body: `Votre demande "${typeLabel}" a été ${statusLabel}.${resp ? ` Réponse : ${resp}` : ""}`,
        action_url: "/espace-client/demandes",
      });
    }

    setResponseText((prev) => { const n = { ...prev }; delete n[id]; return n; });
    fetchRequests();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-navy">Demandes voyageurs</h1>
        <p className="text-sm text-navy/50 mt-1">Gérez les demandes des voyageurs en temps réel</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {["pending", "in_progress", "resolved", "rejected", "all"].map((f) => (
          <button key={f} onClick={() => { setFilter(f); setLoading(true); }}
            className={`px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] rounded-full transition-colors ${filter === f ? "bg-navy text-white" : "bg-white border border-navy/10 text-navy/50 hover:border-navy/30"}`}>
            {f === "all" ? "Tous" : f === "pending" ? "En attente" : f === "in_progress" ? "En cours" : f === "resolved" ? "Résolus" : "Refusés"}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-navy/40">Chargement...</p>
      ) : requests.length === 0 ? (
        <div className="border border-navy/10 bg-white p-12 text-center">
          <p className="text-sm text-navy/40">Aucune demande.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((r) => (
            <div key={r.id} className="border border-navy/10 bg-white p-5">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gold">{REQUEST_TYPE_LABELS[r.type] ?? r.type}</span>
                    <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${REQUEST_STATUS_STYLES[r.status] ?? "bg-gray-50 text-gray-600"}`}>
                      {r.status === "pending" ? "En attente" : r.status === "in_progress" ? "En cours" : r.status === "resolved" ? "Résolu" : r.status}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-navy">
                    {r.bookings?.villas?.name ?? "Villa"} — {r.bookings?.guest_name ?? "Voyageur"}
                  </p>
                  {r.bookings?.start_date && (
                    <p className="text-[11px] text-navy/40 mt-0.5">
                      {new Date(r.bookings.start_date).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })} → {new Date(r.bookings.end_date).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}
                    </p>
                  )}
                </div>
                <span className="text-[11px] text-navy/30">{new Date(r.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}</span>
              </div>
              <p className="text-sm text-navy/70 mb-3 bg-navy/[0.02] p-3">{r.message}</p>
              {r.admin_response && (
                <div className="mb-3 border-l-2 border-gold/30 pl-3">
                  <p className="text-[11px] font-semibold text-gold mb-1">Réponse</p>
                  <p className="text-sm text-navy/60">{r.admin_response}</p>
                </div>
              )}
              {r.status === "pending" || r.status === "in_progress" ? (
                <div className="space-y-2">
                  <textarea
                    value={responseText[r.id] ?? ""}
                    onChange={(e) => setResponseText((prev) => ({ ...prev, [r.id]: e.target.value }))}
                    placeholder="Réponse (optionnelle)..."
                    rows={2}
                    className="w-full border border-navy/15 bg-white px-3 py-2 text-sm resize-none focus:outline-none focus:border-gold/50"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => handleAction(r.id, "resolved", r.guest_id, r.type)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-50 text-emerald-700 text-[11px] font-semibold rounded-full hover:bg-emerald-100 transition-colors">
                      <Check size={14} /> Résoudre
                    </button>
                    <button onClick={() => handleAction(r.id, "rejected", r.guest_id, r.type)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-50 text-red-700 text-[11px] font-semibold rounded-full hover:bg-red-100 transition-colors">
                      <X size={14} /> Refuser
                    </button>
                    {r.status !== "in_progress" && (
                      <button onClick={() => handleAction(r.id, "in_progress", r.guest_id, r.type)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-50 text-blue-700 text-[11px] font-semibold rounded-full hover:bg-blue-100 transition-colors">
                        <MessageCircle size={14} /> En cours
                      </button>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
