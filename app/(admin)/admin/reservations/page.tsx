"use client";

import { useState, useEffect } from "react";
import { getSupabaseBrowser } from "@/lib/supabase";
import { formatCurrency, formatDate } from "@/lib/utils";
import { AdminPageIntro } from "@/components/dashboard/admin/AdminPageIntro";
import { BOOKING_STATUS_LABELS } from "@/lib/constants";

const PAGE_SIZE = 20;

export default function AdminReservationsPage() {
  const supabase = getSupabaseBrowser();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState("all");

  const fetchBookings = async () => {
    if (!supabase) return;
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = supabase
      .from("bookings")
      .select("id, guest_name, guest_email, villa_id, start_date, end_date, total_price_cents, status, villas(name)", { count: "exact" })
      .order("start_date", { ascending: false })
      .range(from, to);

    if (filter !== "all") query = query.eq("status", filter);

    const { data, count } = await query;
    setBookings(data ?? []);
    if (count != null) setTotal(count);
    setLoading(false);
  };

  useEffect(() => { fetchBookings(); }, [supabase, page, filter]);

  const handleAction = async (id: string, status: string) => {
    if (!supabase) return;
    await supabase.from("bookings").update({ status, payment_status: status === "confirmed" ? "paid" : "cancelled" }).eq("id", id);
    fetchBookings();
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <AdminPageIntro title="Réservations" description={`${total} séjours enregistrés.`} />

      <div className="flex gap-2 flex-wrap">
        {["all", "pending", "confirmed", "cancelled"].map((f) => (
          <button key={f} onClick={() => { setFilter(f); setPage(1); setLoading(true); }}
            className={`px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] rounded-full transition-colors ${filter === f ? "bg-navy text-white" : "bg-white border border-navy/10 text-navy/50 hover:border-navy/30"}`}>
            {f === "all" ? "Tous" : BOOKING_STATUS_LABELS[f] ?? f}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-navy/40">Chargement...</p>
      ) : bookings.length === 0 ? (
        <div className="border border-navy/10 bg-white p-12 text-center">
          <p className="text-sm text-navy/40">Aucune réservation.</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto border border-navy/10 bg-white">
            <table className="w-full text-sm">
              <thead className="border-b border-navy/10 bg-navy/[0.02]">
                <tr className="text-left text-[11px] font-semibold uppercase tracking-[0.1em] text-navy/50">
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3">Villa</th>
                  <th className="px-4 py-3">Arrivée</th>
                  <th className="px-4 py-3">Départ</th>
                  <th className="px-4 py-3">Montant</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy/[0.05]">
                {bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-navy/[0.01]">
                    <td className="px-4 py-3">
                      <span className="font-medium text-navy">{b.guest_name || "Anonyme"}</span>
                      {b.guest_email && <span className="block text-[11px] text-navy/40">{b.guest_email}</span>}
                    </td>
                    <td className="px-4 py-3 text-navy/70">{b.villas?.name ?? b.villa_id?.slice(0, 8)}</td>
                    <td className="px-4 py-3 text-navy/70">{formatDate(b.start_date, { day: "numeric", month: "short" })}</td>
                    <td className="px-4 py-3 text-navy/70">{formatDate(b.end_date, { day: "numeric", month: "short" })}</td>
                    <td className="px-4 py-3 font-medium text-navy">{formatCurrency(b.total_price_cents ?? 0)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full ${b.status === "confirmed" ? "bg-emerald-50 text-emerald-700" : b.status === "pending" ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"}`}>
                        {BOOKING_STATUS_LABELS[b.status] ?? b.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        {b.status === "pending" && (
                          <button onClick={() => handleAction(b.id, "confirmed")}
                            className="text-[10px] font-semibold px-2 py-1 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100">
                            Confirmer
                          </button>
                        )}
                        {(b.status === "pending" || b.status === "confirmed") && (
                          <button onClick={() => handleAction(b.id, "cancelled")}
                            className="text-[10px] font-semibold px-2 py-1 rounded bg-red-50 text-red-700 hover:bg-red-100">
                            Annuler
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}
                className="text-[11px] font-semibold text-navy/50 hover:text-navy disabled:opacity-30">
                ← Précédent
              </button>
              <span className="text-[11px] text-navy/40">Page {page} / {totalPages}</span>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                className="text-[11px] font-semibold text-navy/50 hover:text-navy disabled:opacity-30">
                Suivant →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
