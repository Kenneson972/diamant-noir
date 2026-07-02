"use client";

import { Plus, Trash2, Copy, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

type Season = { season: string; start: string; end: string; price: number };

const MONTHS = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"));
const DAYS = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, "0"));

function overlaps(a: Season, b: Season): boolean {
  if (a.start <= b.start && a.end >= b.start) return true;
  if (b.start <= a.start && b.end >= a.start) return true;
  return false;
}

export function SeasonalPricesEditor({
  seasons,
  onChange,
  basePrice,
}: {
  seasons: Season[];
  onChange: (seasons: Season[]) => void;
  basePrice?: number;
}) {
  const add = () => onChange([...seasons, { season: "", start: "01-01", end: "12-31", price: basePrice ?? 100 }]);
  const update = (i: number, field: keyof Season, value: string | number) => {
    const next = [...seasons];
    next[i] = { ...next[i], [field]: value };
    onChange(next);
  };
  const remove = (i: number) => onChange(seasons.filter((_, idx) => idx !== i));
  const duplicate = (i: number) => {
    const next = [...seasons];
    next.splice(i + 1, 0, { ...seasons[i], season: `${seasons[i].season} (copie)` });
    onChange(next);
  };

  const bars = seasons.map((s) => {
    const sm = parseInt(s.start.split("-")[0], 10);
    const em = parseInt(s.end.split("-")[0], 10);
    return { ...s, left: ((sm - 1) / 12) * 100, width: Math.max(((em - sm + 1) / 12) * 100, 3) };
  });

  const conflicts = new Set<number>();
  for (let i = 0; i < seasons.length; i++)
    for (let j = i + 1; j < seasons.length; j++)
      if (overlaps(seasons[i], seasons[j])) { conflicts.add(i); conflicts.add(j); }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted">Prix saisonniers</label>
        <span className="text-[11px] font-medium text-navy/50">{seasons.length} saison{seasons.length > 1 ? "s" : ""}</span>
      </div>

      <div className="flex items-center gap-3 rounded-xl border border-navy/8 bg-navy/[0.02] px-4 py-3">
        <span className="text-sm font-medium text-navy">Prix standard</span>
        <span className="ml-auto text-sm font-semibold text-navy">{basePrice ?? "—"} €/nuit</span>
      </div>

      {seasons.length > 0 && (
        <div className="relative h-8 rounded-lg bg-navy/5">
          {bars.map((s, i) => (
            <div key={i} title={`${s.season}: ${s.price}€`} className={cn("absolute top-1 h-6 rounded opacity-80", conflicts.has(i) ? "bg-red-400" : "bg-gold/60")} style={{ left: `${s.left}%`, width: `${s.width}%` }} />
          ))}
          {conflicts.size > 0 && <div className="mt-2 flex items-center gap-1 text-[11px] text-red-500"><AlertTriangle size={12} /> Chevauchement détecté</div>}
        </div>
      )}

      {seasons.map((s, i) => (
        <div key={i} className={cn("grid gap-3 sm:grid-cols-[1fr_auto_auto_auto_auto_auto] items-center rounded-xl border p-3", conflicts.has(i) ? "border-red-200 bg-red-50/50" : "border-navy/5")}>
          <input placeholder="Saison" value={s.season} onChange={(e) => update(i, "season", e.target.value)} className="min-h-[40px] rounded-lg border border-navy/10 px-3 py-2 text-sm focus:border-gold focus:outline-none" />
          <div className="flex items-center gap-1 text-[11px] text-navy/40">
            <select value={s.start.split("-")[0]} onChange={(e) => update(i, "start", `${e.target.value}-${s.start.split("-")[1] || "01"}`)} className="rounded border border-navy/10 px-1 py-1 text-xs">{MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}</select>
            <select value={s.start.split("-")[1]} onChange={(e) => update(i, "start", `${s.start.split("-")[0] || "01"}-${e.target.value}`)} className="rounded border border-navy/10 px-1 py-1 text-xs">{DAYS.map((d) => <option key={d} value={d}>{d}</option>)}</select>
          </div>
          <span className="text-[11px] text-navy/30">→</span>
          <div className="flex items-center gap-1 text-[11px] text-navy/40">
            <select value={s.end.split("-")[0]} onChange={(e) => update(i, "end", `${e.target.value}-${s.end.split("-")[1] || "31"}`)} className="rounded border border-navy/10 px-1 py-1 text-xs">{MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}</select>
            <select value={s.end.split("-")[1]} onChange={(e) => update(i, "end", `${s.end.split("-")[0] || "12"}-${e.target.value}`)} className="rounded border border-navy/10 px-1 py-1 text-xs">{DAYS.map((d) => <option key={d} value={d}>{d}</option>)}</select>
          </div>
          <div className="relative">
            <input type="number" min="0" value={s.price || ""} onChange={(e) => update(i, "price", Number(e.target.value))} className="w-24 rounded-lg border border-navy/10 px-3 py-2 text-sm focus:border-gold focus:outline-none" />
          </div>
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => duplicate(i)} className="text-navy/40 hover:text-navy" aria-label="Dupliquer"><Copy size={14} /></button>
            <button type="button" onClick={() => remove(i)} className="text-red-400 hover:text-red-600" aria-label="Supprimer"><Trash2 size={14} /></button>
          </div>
        </div>
      ))}

      <button type="button" onClick={add} className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-medium text-gold hover:underline"><Plus size={16} /> Ajouter une saison</button>
    </div>
  );
}
