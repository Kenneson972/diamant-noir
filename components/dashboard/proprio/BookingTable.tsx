"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/utils";

type BookingRow = {
  id: string;
  start_date: string;
  villa_name: string;
  guest_name: string;
  gross: number;
  commission: number;
  net: number;
  source: string;
};

interface BookingTableProps {
  bookingRows: BookingRow[];
  currentMonth: number;
  currentYear: number;
}

export function BookingTable({ bookingRows, currentMonth, currentYear }: BookingTableProps) {
  const currentMonthKey = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`;
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthKey);
  const filteredRows = bookingRows.filter((r) => r.start_date.startsWith(selectedMonth));

  if (bookingRows.length === 0) return null;

  return (
    <div className="dashboard-card mt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-lg font-semibold text-navy-900">
          Détail des réservations
        </h3>
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="border border-navy/10 rounded-lg px-3 py-1.5 text-sm bg-white"
        >
          {Array.from({ length: 6 }, (_, i) => {
            const d = new Date(currentYear, currentMonth - i, 1);
            const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
            const label = d.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
            return <option key={val} value={val}>{label}</option>;
          })}
        </select>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-navy/10">
            <tr className="text-left text-[11px] font-semibold uppercase tracking-[0.1em] text-navy/50">
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2">Villa</th>
              <th className="px-3 py-2">Voyageur</th>
              <th className="px-3 py-2 text-right">Brut</th>
              <th className="px-3 py-2 text-right">Commission</th>
              <th className="px-3 py-2 text-right">Net</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy/5">
            {filteredRows.map((r) => (
              <tr key={r.id} className="hover:bg-navy/[0.02]">
                <td className="px-3 py-2 text-navy/70">
                  {new Date(r.start_date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                </td>
                <td className="px-3 py-2 font-medium text-navy">{r.villa_name}</td>
                <td className="px-3 py-2 text-navy/70">{r.guest_name}</td>
                <td className="px-3 py-2 text-right text-navy">{formatCurrency(r.gross)}</td>
                <td className="px-3 py-2 text-right text-gold">{formatCurrency(r.commission)}</td>
                <td className="px-3 py-2 text-right font-medium text-navy">{formatCurrency(r.net)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
