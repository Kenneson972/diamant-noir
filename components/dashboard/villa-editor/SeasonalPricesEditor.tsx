"use client";

import { Plus, Trash2 } from "lucide-react";

type Season = { season: string; start: string; end: string; price: number };

type Props = {
  seasons: Season[];
  onChange: (seasons: Season[]) => void;
};

export function SeasonalPricesEditor({ seasons, onChange }: Props) {
  const add = () => onChange([...seasons, { season: "", start: "", end: "", price: 0 }]);

  const update = (i: number, field: keyof Season, value: string | number) => {
    const updated = [...seasons];
    updated[i] = { ...updated[i], [field]: value };
    onChange(updated);
  };

  const remove = (i: number) => onChange(seasons.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-3">
      <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
        Prix saisonniers
      </label>

      {seasons.map((s, i) => (
        <div key={i} className="grid gap-3 sm:grid-cols-4 items-center rounded-xl border border-navy/5 p-3">
          <input
            placeholder="Saison"
            value={s.season}
            onChange={(e) => update(i, "season", e.target.value)}
            className="rounded-lg border border-navy/10 px-3 py-2 text-sm focus:border-gold focus:outline-none"
          />
          <input
            placeholder="Début (MM-DD)"
            value={s.start}
            onChange={(e) => update(i, "start", e.target.value)}
            className="rounded-lg border border-navy/10 px-3 py-2 text-sm focus:border-gold focus:outline-none"
          />
          <input
            placeholder="Fin (MM-DD)"
            value={s.end}
            onChange={(e) => update(i, "end", e.target.value)}
            className="rounded-lg border border-navy/10 px-3 py-2 text-sm focus:border-gold focus:outline-none"
          />
          <div className="flex items-center gap-3">
            <input
              type="number"
              min="0"
              placeholder="Prix/nuit (€)"
              value={s.price || ""}
              onChange={(e) => update(i, "price", Number(e.target.value))}
              className="flex-1 rounded-lg border border-navy/10 px-3 py-2 text-sm focus:border-gold focus:outline-none"
            />
            <button type="button" onClick={() => remove(i)} className="text-red-400 hover:text-red-600">
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={add}
        className="inline-flex items-center gap-1 text-xs font-medium text-gold hover:underline"
      >
        <Plus size={14} /> Ajouter une saison
      </button>
    </div>
  );
}
