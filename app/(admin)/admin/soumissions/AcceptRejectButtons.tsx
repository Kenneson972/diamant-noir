"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";

export function AcceptRejectButtons({ id, name }: { id: string; name: string }) {
  const [loading, setLoading] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const handle = async (status: "accepted" | "rejected") => {
    setLoading(status);
    await fetch("/api/villa-submissions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    setLoading(null);
    setDone(true);
  };

  if (done) {
    return (
      <span className="shrink-0 text-[11px] font-medium text-navy/40">
        Traité
      </span>
    );
  }

  return (
    <div className="flex shrink-0 items-center gap-2">
      <button
        onClick={() => handle("accepted")}
        disabled={loading !== null}
        className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
      >
        <Check size={12} />
        {loading === "accepted" ? "..." : "Accepter"}
      </button>
      <button
        onClick={() => handle("rejected")}
        disabled={loading !== null}
        className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
      >
        <X size={12} />
        {loading === "rejected" ? "..." : "Refuser"}
      </button>
    </div>
  );
}
