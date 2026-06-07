"use client";

import { useState } from "react";
import { Check, X, Calendar, Phone, FileText } from "lucide-react";

const STATUS_FLOW: Record<string, { label: string; next: string; icon: typeof Check }> = {
  pending: { label: "Programmer une visite", next: "visit_scheduled", icon: Calendar },
  visit_scheduled: { label: "Visite effectuée", next: "visited", icon: Check },
  call_requested: { label: "Appel effectué", next: "accepted", icon: Check },
  docs_requested: { label: "Docs reçus", next: "accepted", icon: Check },
};

export function AcceptRejectButtons({ id, name, ownerEmail }: { id: string; name: string; ownerEmail: string }) {
  const [loading, setLoading] = useState<string | null>(null);
  const [visitDate, setVisitDate] = useState("");
  const [showVisitPicker, setShowVisitPicker] = useState(false);
  const [done, setDone] = useState(false);

  const callApi = async (status: string, extra?: Record<string, any>) => {
    setLoading(status);
    await fetch("/api/villa-submissions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status, ...extra }),
    });
    setLoading(null);
    setDone(true);
  };

  if (done) {
    return <span className="shrink-0 text-[11px] font-medium text-emerald-700">✓ Traité</span>;
  }

  return (
    <div className="flex shrink-0 flex-col gap-2 items-end">
      {/* Programmer visite */}
      {showVisitPicker ? (
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={visitDate}
            onChange={(e) => setVisitDate(e.target.value)}
            className="border border-navy/15 rounded-lg px-2 py-1 text-xs w-36"
          />
          <button
            onClick={() => visitDate && callApi("visit_scheduled", { visit_date: visitDate, owner_email: ownerEmail })}
            disabled={!visitDate || loading !== null}
            className="rounded-lg bg-gold px-2 py-1 text-[10px] font-semibold text-white hover:bg-gold/90 disabled:opacity-50"
          >
            OK
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowVisitPicker(true)}
          disabled={loading !== null}
          className="inline-flex items-center gap-1.5 rounded-lg border border-navy/15 bg-white px-3 py-1.5 text-xs font-medium text-navy hover:bg-navy/[0.03] disabled:opacity-50"
        >
          <Calendar size={12} />
          {loading === "visit_scheduled" ? "..." : "Programmer visite"}
        </button>
      )}

      {/* Demander appel + Docs */}
      <div className="flex gap-1.5">
        <button
          onClick={() => callApi("call_requested", { owner_email: ownerEmail })}
          disabled={loading !== null}
          className="inline-flex items-center gap-1 rounded-lg border border-navy/15 bg-white px-2.5 py-1 text-[10px] font-medium text-navy/60 hover:bg-navy/[0.03] disabled:opacity-50"
        >
          <Phone size={11} />
          Appel
        </button>
        <button
          onClick={() => callApi("docs_requested", { owner_email: ownerEmail })}
          disabled={loading !== null}
          className="inline-flex items-center gap-1 rounded-lg border border-navy/15 bg-white px-2.5 py-1 text-[10px] font-medium text-navy/60 hover:bg-navy/[0.03] disabled:opacity-50"
        >
          <FileText size={11} />
          Docs
        </button>
      </div>

      {/* Ligne Accepter / Refuser */}
      <div className="flex gap-1.5">
        <button
          onClick={() => callApi("accepted", { owner_email: ownerEmail })}
          disabled={loading !== null}
          className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-[10px] font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          <Check size={12} />
          {loading === "accepted" ? "..." : "Accepter"}
        </button>
        <button
          onClick={() => callApi("rejected", { owner_email: ownerEmail })}
          disabled={loading !== null}
          className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-[10px] font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
        >
          <X size={12} />
          {loading === "rejected" ? "..." : "Refuser"}
        </button>
      </div>
    </div>
  );
}
