"use client";

import { useState } from "react";
import { Check, X, Calendar, Phone, FileText } from "lucide-react";

export function SubmissionActions({ id, ownerEmail }: { id: string; ownerEmail: string }) {
  const [loading, setLoading] = useState<string | null>(null);
  const [visitDate, setVisitDate] = useState("");
  const [showPicker, setShowPicker] = useState(false);
  const [done, setDone] = useState(false);

  const call = async (status: string, extra?: Record<string, any>) => {
    setLoading(status);
    await fetch("/api/villa-submissions", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status, ...extra }) });
    setLoading(null);
    setDone(true);
  };

  if (done) return <span className="shrink-0 text-[11px] font-medium text-emerald-700">✓ Traité</span>;

  return (
    <div className="flex shrink-0 flex-col gap-2 items-end">
      {showPicker ? (
        <div className="flex items-center gap-2">
          <input type="date" value={visitDate} onChange={(e) => setVisitDate(e.target.value)} className="border border-navy/15 rounded-lg px-2 py-1 text-xs w-36" />
          <button onClick={() => visitDate && call("visit_scheduled", { visit_date: visitDate })} disabled={!visitDate || loading !== null} className="rounded-lg bg-gold px-2 py-1 text-[10px] font-semibold text-white hover:bg-gold/90 disabled:opacity-50">OK</button>
        </div>
      ) : (
        <button onClick={() => setShowPicker(true)} disabled={loading !== null} className="inline-flex items-center gap-1.5 rounded-lg border border-navy/15 bg-white px-3 py-1.5 text-xs font-medium text-navy hover:bg-navy/[0.03] disabled:opacity-50">
          <Calendar size={12} /> {loading === "visit_scheduled" ? "..." : "Programmer visite"}
        </button>
      )}
      <div className="flex gap-1.5">
        <button onClick={() => call("call_requested")} disabled={loading !== null} className="inline-flex items-center gap-1 rounded-lg border border-navy/15 bg-white px-2.5 py-1 text-[10px] font-medium text-navy/60 hover:bg-navy/[0.03] disabled:opacity-50">
          <Phone size={11} /> Appel
        </button>
        <button onClick={() => call("docs_requested")} disabled={loading !== null} className="inline-flex items-center gap-1 rounded-lg border border-navy/15 bg-white px-2.5 py-1 text-[10px] font-medium text-navy/60 hover:bg-navy/[0.03] disabled:opacity-50">
          <FileText size={11} /> Docs
        </button>
      </div>
      <div className="flex gap-1.5">
        <button onClick={() => call("accepted")} disabled={loading !== null} className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-[10px] font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
          <Check size={12} /> {loading === "accepted" ? "..." : "Accepter"}
        </button>
        <button onClick={() => call("rejected")} disabled={loading !== null} className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-[10px] font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50">
          <X size={12} /> {loading === "rejected" ? "..." : "Refuser"}
        </button>
      </div>
    </div>
  );
}
