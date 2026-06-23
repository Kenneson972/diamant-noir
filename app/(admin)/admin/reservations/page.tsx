"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import type { Selection } from "react-aria-components";
import { AdminPageIntro } from "@/components/dashboard/admin/AdminPageIntro";
import {
  AdminReservationsDataGrid,
  type AdminBookingRow,
} from "@/components/dashboard/admin/AdminReservationsDataGrid";
import { AdminReservationsKanban } from "@/components/dashboard/admin/AdminReservationsKanban";
import { KayvilaEmptyState, KayvilaActionBar } from "@/components/ui/pro";
import { ReservationCalendar } from "@/components/dashboard/ReservationCalendar";
import { CreateBookingModal } from "@/components/dashboard/CreateBookingModal";
import { BOOKING_STATUS_LABELS } from "@/lib/constants";
import { LayoutList, Columns3, Plus, X, Ban } from "lucide-react";
import { KayvilaPngIcon } from "@/components/icons/KayvilaPngIcon";

const PAGE_SIZE = 20;

type ViewMode = "list" | "calendar" | "kanban";

type VillaOption = { id: string; name: string };

async function fetchAdminBookings(params: URLSearchParams) {
  const res = await fetch(`/api/admin/bookings?${params.toString()}`, {
    credentials: "include",
    cache: "no-store",
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      typeof payload.error === "string" ? payload.error : "Chargement impossible."
    );
  }
  return payload as {
    bookings: AdminBookingRow[];
    count: number;
    villas?: VillaOption[];
  };
}

export default function AdminReservationsPage() {
  const [bookings, setBookings] = useState<AdminBookingRow[]>([]);
  const [kanbanBookings, setKanbanBookings] = useState<AdminBookingRow[]>([]);
  const [allBookings, setAllBookings] = useState<AdminBookingRow[]>([]);
  const [villas, setVillas] = useState<VillaOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [kanbanLoading, setKanbanLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState("all");
  const [villaFilter, setVillaFilter] = useState<string | null>(null);
  const [view, setView] = useState<ViewMode>("list");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set());
  const [actionError, setActionError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const villaParam = params.get("villa");
    if (villaParam) {
      setVillaFilter(villaParam);
      setFilter("all");
    }
    const viewParam = params.get("view");
    if (viewParam === "calendar") setView("calendar");
  }, []);

  const fetchBookings = async () => {
    setLoadError(null);
    try {
      const params = new URLSearchParams({
        scope: "list",
        filter,
        page: String(page),
        pageSize: String(PAGE_SIZE),
      });
      if (villaFilter) params.set("villa_id", villaFilter);

      const data = await fetchAdminBookings(params);
      setBookings(data.bookings ?? []);
      setTotal(data.count ?? 0);
      if (data.villas?.length) setVillas(data.villas);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Chargement impossible.");
      setBookings([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const fetchKanbanBookings = async () => {
    setKanbanLoading(true);
    setLoadError(null);
    try {
      const params = new URLSearchParams({
        scope: "kanban",
        filter,
      });
      if (villaFilter) params.set("villa_id", villaFilter);

      const data = await fetchAdminBookings(params);
      setKanbanBookings(data.bookings ?? []);
      if (data.villas?.length) setVillas(data.villas);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Chargement impossible.");
      setKanbanBookings([]);
    } finally {
      setKanbanLoading(false);
    }
  };

  const fetchAllForCalendar = async () => {
    setLoadError(null);
    try {
      const params = new URLSearchParams({ scope: "calendar" });
      if (villaFilter) params.set("villa_id", villaFilter);

      const data = await fetchAdminBookings(params);
      setAllBookings(data.bookings ?? []);
      if (data.villas?.length) setVillas(data.villas);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Chargement impossible.");
      setAllBookings([]);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchBookings();
    setSelectedKeys(new Set());
  }, [page, filter, villaFilter]);

  useEffect(() => {
    if (view === "calendar") fetchAllForCalendar();
  }, [villaFilter, view]);

  useEffect(() => {
    if (view === "kanban") fetchKanbanBookings();
  }, [filter, villaFilter, view]);

  const handleAction = async (id: string, status: string) => {
    setActionError(null);
    const res = await fetch("/api/admin/bookings", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      setActionError(typeof payload.error === "string" ? payload.error : "Mise à jour impossible.");
      return;
    }
    fetchBookings();
    fetchAllForCalendar();
    if (view === "kanban") fetchKanbanBookings();
  };

  const selectedIds = useMemo(() => {
    if (selectedKeys === "all") return new Set(bookings.map((b) => b.id));
    return selectedKeys as Set<string>;
  }, [selectedKeys, bookings]);

  const selectionCount = selectedKeys === "all" ? bookings.length : selectedIds.size;

  const handleBulkConfirm = useCallback(async () => {
    const pending = bookings.filter((b) => selectedIds.has(b.id) && b.status === "pending");
    await Promise.all(pending.map((b) => handleAction(b.id, "confirmed")));
    setSelectedKeys(new Set());
  }, [bookings, selectedIds]);

  const handleBulkCancel = useCallback(async () => {
    const cancellable = bookings.filter(
      (b) => selectedIds.has(b.id) && (b.status === "pending" || b.status === "confirmed")
    );
    await Promise.all(cancellable.map((b) => handleAction(b.id, "cancelled")));
    setSelectedKeys(new Set());
  }, [bookings, selectedIds]);

  const handleExport = useCallback(() => {
    const selected = bookings.filter((b) => selectedIds.has(b.id));
    const csv = [
      "Client,Email,Villa,Arrivée,Départ,Montant,Statut",
      ...selected.map((b) =>
        [
          b.guest_name ?? "",
          b.guest_email ?? "",
          b.villas?.name ?? b.villa_id,
          b.start_date,
          b.end_date,
          (b.total_price_cents ?? 0) / 100,
          b.status,
        ].join(",")
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "reservations-kayvila.csv";
    a.click();
    URL.revokeObjectURL(url);
    setSelectedKeys(new Set());
  }, [bookings, selectedIds]);

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const villaName = villaFilter
    ? (villas.find((v) => v.id === villaFilter)?.name ?? villaFilter.slice(0, 8))
    : null;

  const kanbanKey = kanbanBookings.map((b) => `${b.id}:${b.status}`).join("|");

  return (
    <div className="space-y-6">
      {loadError ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {loadError}
        </p>
      ) : null}
      {actionError ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {actionError}
        </p>
      ) : null}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <AdminPageIntro title="Réservations" description={`${total} séjours enregistrés.`} />
        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="inline-flex shrink-0 items-center gap-2 self-start rounded-xl bg-gold px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-gold/90"
        >
          <Plus size={16} />
          Nouvelle réservation
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {["all", "pending", "confirmed", "cancelled", "past"].map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => {
              setFilter(f);
              setPage(1);
              setLoading(true);
            }}
            className={`inline-flex min-h-[44px] items-center rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] transition-colors ${filter === f ? "bg-navy text-white" : "border border-navy/10 bg-white text-navy/50 hover:border-navy/30"}`}
          >
            {f === "all" ? "Tous" : (BOOKING_STATUS_LABELS[f] ?? f)}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] uppercase tracking-[0.1em] text-navy/40">Villa</span>
          <button
            type="button"
            onClick={() => {
              setVillaFilter(null);
              setPage(1);
              setLoading(true);
            }}
            className={`rounded-full px-3 py-1.5 text-[11px] font-semibold transition-colors ${!villaFilter ? "bg-navy text-white" : "border border-navy/10 bg-white text-navy/50 hover:border-navy/30"}`}
          >
            Toutes
          </button>
          {villas.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => {
                setVillaFilter(v.id);
                setPage(1);
                setLoading(true);
              }}
              className={`rounded-full px-3 py-1.5 text-[11px] font-semibold transition-colors ${villaFilter === v.id ? "bg-navy text-white" : "border border-navy/10 bg-white text-navy/50 hover:border-navy/30"}`}
            >
              {v.name}
            </button>
          ))}
        </div>

        <div className="flex overflow-hidden rounded-lg border border-navy/10">
          {(
            [
              { id: "list" as const, icon: "layoutList" as const, label: "Liste" },
              { id: "kanban" as const, icon: "columns3" as const, label: "Kanban" },
              { id: "calendar" as const, icon: "calendar" as const, label: "Calendrier" },
            ] as const
          ).map(({ id, icon, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setView(id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold transition-colors ${view === id ? "bg-navy text-white" : "bg-white text-navy/50 hover:text-navy"}`}
            >
              {icon === "calendar" ? (
                <KayvilaPngIcon name="calendar" size={18} alt="" />
              ) : (
                icon === "layoutList" ? <LayoutList size={16} strokeWidth={1.5} /> : <Columns3 size={16} strokeWidth={1.5} />
              )}
              {label}
            </button>
          ))}
        </div>
      </div>

      {villaFilter && villaName ? (
        <div className="inline-flex items-center gap-1.5 rounded-full border border-gold/20 bg-gold/[0.08] px-3 py-1 text-xs font-medium text-gold">
          {villaName}
          <button
            type="button"
            onClick={() => {
              setVillaFilter(null);
              setPage(1);
              setLoading(true);
            }}
            className="text-gold/60 hover:text-gold"
          >
            <X size={12} />
          </button>
        </div>
      ) : null}

      {view === "calendar" ? (
        <ReservationCalendar bookings={allBookings} villaFilter={villaFilter} />
      ) : view === "kanban" ? (
        kanbanLoading ? (
          <p className="text-sm text-navy/55">Chargement du pipeline…</p>
        ) : kanbanBookings.length === 0 ? (
          <KayvilaEmptyState
            title="Aucune réservation"
            description="Aucun séjour ne correspond à vos filtres."
          />
        ) : (
          <AdminReservationsKanban
            key={kanbanKey}
            rows={kanbanBookings}
            onStatusChange={handleAction}
          />
        )
      ) : loading ? (
        <p className="text-sm text-navy/55">Chargement...</p>
      ) : bookings.length === 0 ? (
        <KayvilaEmptyState
          title="Aucune réservation"
          description="Aucun séjour ne correspond à vos filtres."
        />
      ) : (
        <>
          <AdminReservationsDataGrid
            rows={bookings}
            filter={filter}
            onConfirm={(id) => handleAction(id, "confirmed")}
            onCancel={(id) => handleAction(id, "cancelled")}
            selectedKeys={selectedKeys}
            onSelectionChange={setSelectedKeys}
          />

          <KayvilaActionBar
            selectedCount={selectionCount}
            onClear={() => setSelectedKeys(new Set())}
            actions={[
              {
                label: "Exporter",
                icon: <KayvilaPngIcon name="download" size={18} alt="" />,
                onPress: handleExport,
              },
              {
                label: "Confirmer",
                icon: <KayvilaPngIcon name="check-circle" size={18} alt="" />,
                onPress: () => void handleBulkConfirm(),
              },
              {
                label: "Annuler",
                icon: <Ban className="size-4" strokeWidth={1.5} />,
                variant: "destructive",
                onPress: () => void handleBulkCancel(),
              },
            ]}
          />

          {totalPages > 1 ? (
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="text-[11px] font-semibold text-navy/50 hover:text-navy disabled:opacity-30"
              >
                ← Précédent
              </button>
              <span className="text-[11px] text-navy/55">
                Page {page} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="text-[11px] font-semibold text-navy/50 hover:text-navy disabled:opacity-30"
              >
                Suivant →
              </button>
            </div>
          ) : null}
        </>
      )}

      <CreateBookingModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={() => {
          fetchBookings();
          fetchAllForCalendar();
          if (view === "kanban") fetchKanbanBookings();
        }}
      />
    </div>
  );
}
