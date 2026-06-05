"use client";

import { useState, useEffect } from "react";
import { getSupabaseBrowser } from "@/lib/supabase";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";
import { AdminPageIntro } from "@/components/dashboard/admin/AdminPageIntro";
import { ReservationCalendar } from "@/components/dashboard/ReservationCalendar";
import { CreateBookingModal } from "@/components/dashboard/CreateBookingModal";
import { BOOKING_STATUS_LABELS } from "@/lib/constants";
import { LayoutList, Calendar, Plus, X } from "lucide-react";

const PAGE_SIZE = 20;

export default function AdminReservationsPage() {
  const supabase = getSupabaseBrowser();
  const [bookings, setBookings] = useState<any[]>([]);
  const [allBookings, setAllBookings] = useState<any[]>([]); // pour le calendrier (sans pagination)
  const [villas, setVillas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState("all");
  const [villaFilter, setVillaFilter] = useState<string | null>(null);
  const [view, setView] = useState<"list" | "calendar">("list");
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const villaParam = params.get("villa");
    if (villaParam) {
      setVillaFilter(villaParam);
      setFilter("past");
    }
    const viewParam = params.get("view");
    if (viewParam === "calendar") setView("calendar");
  }, []);

  // Charger la liste des villas pour les chips
  useEffect(() => {
    if (!supabase) return;
    (async () => {
      const { data } = await supabase.from("villas").select("id, name").order("name");
      setVillas(data ?? []);
    })();
  }, [supabase]);

  const fetchBookings = async () => {
    if (!supabase) return;
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const today = new Date().toISOString().split("T")[0];

    let query = supabase
      .from("bookings")
      .select("id, guest_name, guest_email, villa_id, start_date, end_date, total_price_cents, status, villas(name)", { count: "exact" })
      .order("start_date", { ascending: false })
      .range(from, to);

    if (filter === "past") {
      query = query.eq("status", "confirmed").lt("end_date", today);
    } else if (filter !== "all") {
      query = query.eq("status", filter);
    }

    if (villaFilter) {
      query = query.eq("villa_id", villaFilter);
    }

    const { data, count } = await query;
    setBookings(data ?? []);
    if (count != null) setTotal(count);
    setLoading(false);
  };

  // Charger TOUTES les résas pour le calendrier (sans pagination, mois courant seulement)
  const fetchAllForCalendar = async () => {
    if (!supabase) return;
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];

    let query = supabase
      .from("bookings")
      .select("id, guest_name, villa_id, start_date, end_date, status, villas(name)")
      .eq("status", "confirmed")
      .or(`start_date.gte.${monthStart},end_date.gte.${monthStart}`)
      .order("start_date");

    if (villaFilter) query = query.eq("villa_id", villaFilter);

    const { data } = await query;
    setAllBookings(data ?? []);
  };

  useEffect(() => { fetchBookings(); }, [supabase, page, filter, villaFilter]);
  useEffect(() => { fetchAllForCalendar(); }, [supabase, villaFilter, view]);

  const handleAction = async (id: string, status: string) => {
    if (!supabase) return;
    await supabase.from("bookings").update({ status, payment_status: status === "confirmed" ? "paid" : "cancelled" }).eq("id", id);
    fetchBookings();
    fetchAllForCalendar();
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const villaName = villaFilter ? (villas.find((v) => v.id === villaFilter)?.name ?? villaFilter.slice(0, 8)) : null;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <AdminPageIntro title="Réservations" description={`${total} séjours enregistrés.`} />
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex shrink-0 items-center gap-2 self-start rounded-xl bg-gold px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-gold/90"
        >
          <Plus size={16} />
          Nouvelle réservation
        </button>
      </div>

      {/* Filtres statut */}
      <div className="flex gap-2 flex-wrap">
        {["all", "pending", "confirmed", "cancelled", "past"].map((f) => (
          <button key={f} onClick={() => { setFilter(f); setPage(1); setLoading(true); }}
            className={`px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] rounded-full transition-colors ${filter === f ? "bg-navy text-white" : "bg-white border border-navy/10 text-navy/50 hover:border-navy/30"}`}>
            {f === "all" ? "Tous" : BOOKING_STATUS_LABELS[f] ?? f}
          </button>
        ))}
      </div>

      {/* Filtre par villa (chips) + toggle vue */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] uppercase tracking-[0.1em] text-navy/40">Villa</span>
          <button
            onClick={() => { setVillaFilter(null); setPage(1); setLoading(true); }}
            className={`px-3 py-1.5 text-[11px] font-semibold rounded-full transition-colors ${!villaFilter ? "bg-navy text-white" : "bg-white border border-navy/10 text-navy/50 hover:border-navy/30"}`}
          >
            Toutes
          </button>
          {villas.map((v) => (
            <button
              key={v.id}
              onClick={() => { setVillaFilter(v.id); setPage(1); setLoading(true); }}
              className={`px-3 py-1.5 text-[11px] font-semibold rounded-full transition-colors ${villaFilter === v.id ? "bg-navy text-white" : "bg-white border border-navy/10 text-navy/50 hover:border-navy/30"}`}
            >
              {v.name}
            </button>
          ))}
        </div>

        {/* Toggle vue */}
        <div className="flex rounded-lg border border-navy/10 overflow-hidden">
          <button
            onClick={() => setView("list")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold transition-colors ${view === "list" ? "bg-navy text-white" : "bg-white text-navy/50 hover:text-navy"}`}
          >
            <LayoutList size={14} />
            Liste
          </button>
          <button
            onClick={() => setView("calendar")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold transition-colors ${view === "calendar" ? "bg-navy text-white" : "bg-white text-navy/50 hover:text-navy"}`}
          >
            <Calendar size={14} />
            Calendrier
          </button>
        </div>
      </div>

      {/* Badge villa filtrée */}
      {villaFilter && villaName && (
        <div className="inline-flex items-center gap-1.5 bg-gold/[0.08] border border-gold/20 rounded-full px-3 py-1 text-xs text-gold font-medium">
          {villaName}
          <button onClick={() => { setVillaFilter(null); setPage(1); setLoading(true); }} className="text-gold/60 hover:text-gold">
            <X size={12} />
          </button>
        </div>
      )}

      {/* Contenu : liste ou calendrier */}
      {view === "calendar" ? (
        <ReservationCalendar bookings={allBookings} villaFilter={villaFilter} />
      ) : loading ? (
        <p className="text-sm text-navy/55">Chargement...</p>
      ) : bookings.length === 0 ? (
        <div className="border border-navy/10 bg-white p-12 text-center">
          <p className="text-sm text-navy/55">Aucune réservation.</p>
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
                  <th className="px-4 py-3">Nuits</th>
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
                      {b.guest_email && <span className="block text-[11px] text-navy/55">{b.guest_email}</span>}
                    </td>
                    <td className="px-4 py-3 text-navy/70">{b.villas?.name ?? b.villa_id?.slice(0, 8)}</td>
                    <td className="px-4 py-3 text-navy/70">{formatDate(b.start_date, { day: "numeric", month: "short" })}</td>
                    <td className="px-4 py-3 text-navy/70">{formatDate(b.end_date, { day: "numeric", month: "short" })}</td>
                    <td className="px-4 py-3 text-navy/70">
                      {Math.round((new Date(b.end_date).getTime() - new Date(b.start_date).getTime()) / 86400000)} n.
                    </td>
                    <td className="px-4 py-3 font-medium text-navy">{formatCurrency(b.total_price_cents ?? 0)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full ${b.status === "confirmed" ? "bg-emerald-50 text-emerald-700" : b.status === "pending" ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"}`}>
                        {BOOKING_STATUS_LABELS[b.status] ?? b.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        <Link href={`/admin/reservations/${b.id}`}
                          className="text-[10px] font-semibold px-2 py-1 rounded bg-navy/5 text-navy/70 hover:bg-navy/10">
                          Voir
                        </Link>
                        {filter !== "past" && (
                          <>
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
                          </>
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
              <span className="text-[11px] text-navy/55">Page {page} / {totalPages}</span>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                className="text-[11px] font-semibold text-navy/50 hover:text-navy disabled:opacity-30">
                Suivant →
              </button>
            </div>
          )}
        </>
      )}

      {/* Modal création réservation */}
      <CreateBookingModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={() => { fetchBookings(); fetchAllForCalendar(); }}
      />
    </div>
  );
}
