"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { getSupabaseBrowser } from "@/lib/supabase";
import { formatCurrency, formatDate } from "@/lib/utils";

interface VillaPastBookingsDrawerProps {
  villaId: string;
  villaName: string;
  open: boolean;
  onClose: () => void;
}

interface PastBooking {
  id: string;
  guest_name: string | null;
  start_date: string;
  end_date: string;
  total_price_cents: number | null;
  source: string | null;
}

export function VillaPastBookingsDrawer({ villaId, villaName, open, onClose }: VillaPastBookingsDrawerProps) {
  const [bookings, setBookings] = useState<PastBooking[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;

    const fetchPastBookings = async () => {
      setLoading(true);
      const supabase = getSupabaseBrowser();
      if (!supabase) return;

      const today = new Date().toISOString().split("T")[0];

      const { data } = await supabase
        .from("bookings")
        .select("id, guest_name, start_date, end_date, total_price_cents, source")
        .eq("villa_id", villaId)
        .eq("status", "confirmed")
        .lt("end_date", today)
        .order("end_date", { ascending: false });

      setBookings(data ?? []);
      setLoading(false);
    };

    fetchPastBookings();
  }, [open, villaId]);

  if (!open) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-40 bg-navy/20 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 z-50 h-full w-full max-w-[480px] bg-white shadow-2xl overflow-y-auto">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-navy/5 bg-white px-6 py-5">
          <div>
            <h2 className="font-display text-xl text-navy">{villaName}</h2>
            <p className="text-xs text-navy/55">Historique des r&eacute;servations pass&eacute;es</p>
          </div>
          <button onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-full border border-navy/10 text-navy/55 hover:text-navy hover:border-navy/20 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-6">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
            </div>
          ) : bookings.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-sm text-navy/55">Aucune r&eacute;servation pass&eacute;e pour cette villa.</p>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-navy/5 text-[10px] font-bold uppercase tracking-[0.15em] text-navy/55">
                  <th className="pb-3 font-bold">Client</th>
                  <th className="pb-3 font-bold">Dates</th>
                  <th className="pb-3 font-bold">Nuits</th>
                  <th className="pb-3 font-bold">Montant</th>
                  <th className="pb-3 font-bold">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy/[0.04]">
                {bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-navy/[0.01]">
                    <td className="py-3 pr-2">
                      <span className="text-sm font-medium text-navy">{b.guest_name || "Anonyme"}</span>
                    </td>
                    <td className="py-3 pr-2">
                      <span className="text-xs text-navy/60">
                        {formatDate(b.start_date, { day: "numeric", month: "short" })} &ndash; {formatDate(b.end_date, { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    </td>
                    <td className="py-3 pr-2">
                      <span className="text-xs text-navy/60">
                        {Math.round((new Date(b.end_date).getTime() - new Date(b.start_date).getTime()) / 86400000)} n.
                      </span>
                    </td>
                    <td className="py-3 pr-2">
                      <span className="text-sm font-medium text-navy">{formatCurrency(b.total_price_cents ?? 0)}</span>
                    </td>
                    <td className="py-3">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${b.source === "airbnb" ? "bg-rose-50 text-rose-600" : "bg-blue-50 text-blue-600"}`}>
                        {b.source || "Direct"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
