"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase";
import { REQUEST_TYPE_LABELS, REQUEST_STATUS_STYLES, REQUEST_STATUS_LABELS } from "@/lib/constants";

interface RequestItem {
  id: string;
  type: string;
  status: string;
  message: string;
  admin_response: string | null;
  created_at: string;
}



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

  if (loading) return <div className="py-4 text-sm text-navy/55">Chargement...</div>;
  if (requests.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="font-display text-lg text-navy">Mes demandes</h3>
      {requests.map((r) => (
        <div key={r.id} className="border border-navy/10 bg-white p-4">
          <div className="flex items-center justify-between gap-3 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-navy/60">
              {REQUEST_TYPE_LABELS[r.type] ?? r.type}
            </span>
            <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${REQUEST_STATUS_STYLES[r.status] ?? REQUEST_STATUS_STYLES.pending}`}>
              {REQUEST_STATUS_LABELS[r.status] ?? r.status}
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
