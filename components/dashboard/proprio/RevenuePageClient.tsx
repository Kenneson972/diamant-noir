"use client";

import { KayvilaPngIcon } from "@/components/icons/KayvilaPngIcon";
import { RevenueBreakdownTable, type RevenueRow } from "@/components/dashboard/proprio/RevenueBreakdownTable";

export function RevenuePageClient({ rows, period }: { rows: RevenueRow[]; period: string }) {
  const handleExport = async () => {
    const res = await fetch("/api/proprio/revenus/export-pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rows: rows.map((r) => ({
          checkIn: r.checkIn,
          guestName: r.guestName,
          villaName: r.villaName,
          gross: r.gross,
          commission: r.commission,
          net: r.net,
        })),
        period,
      }),
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `revenus-kayvila-${period.toLowerCase().replace(/\s+/g, "-")}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleExport}
          className="flex items-center gap-2 rounded-lg border border-navy/10 px-4 py-2 text-sm text-navy hover:bg-navy/5 transition-colors"
        >
          <KayvilaPngIcon name="download" size={18} />
          Exporter en PDF
        </button>
      </div>
      <RevenueBreakdownTable rows={rows} />
    </div>
  );
}
