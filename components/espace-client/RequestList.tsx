"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase";

interface RequestItem {
  id: string;
  type: string;
  status: string;
  message: string;
  admin_response: string | null;
  created_at: string;
}

const TYPE_LABELS: Record<string, string> = {
  early_checkin: "Early check-in",
  late_checkout: "Late check-out",
  date_change: "Modification de dates",
  issue: "Problème signalé",
  service: "Service ponctuel",
  cancellation: "Demande d'annulation",
  other: "Autre",
};

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  in_progress: "bg-blue-50 text-blue-700 border-blue-200",
  resolved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  in_progress: "En cours",
  resolved: "Résolu",
  rejected: "Refusé",
};

export function RequestList({ bookingId, refreshKey }: { bookingId: string; refreshKey: number }) {
  const supabase = getSupabaseBrowser();
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    (async () => {
      const { data } = await supabase
        .from("requests")
        .select("id, type, status, message, admin_response, created_at")
        .eq("booking_id", bookingId)
        .order("created_at", { ascending: false });
      setRequests((data as RequestItem[]) ?? []);
      setLoading(false);
    })();
  }, [supabase, bookingId, refreshKey]);

  if (loading) return <div className="py-4 text-sm text-navy/40">Chargement...</div>;
  if (requests.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="font-display text-lg text-navy">Mes demandes</h3>
      {requests.map((r) => (
        <div key={r.id} className="border border-navy/10 bg-white p-4">
          <div className="flex items-center justify-between gap-3 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-navy/60">
              {TYPE_LABELS[r.type] ?? r.type}
            </span>
            <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${STATUS_STYLES[r.status] ?? STATUS_STYLES.pending}`}>
              {STATUS_LABELS[r.status] ?? r.status}
            </span>
          </div>
          <p className="text-sm text-navy/60">{r.message}</p>
          {r.admin_response && (
            <div className="mt-3 border-t border-navy/5 pt-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gold mb-1">Réponse Kayvila</p>
              <p className="text-sm text-navy/70">{r.admin_response}</p>
            </div>
          )}
          <p className="mt-2 text-[11px] text-navy/30">
            {new Date(r.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
      ))}
    </div>
  );
}
