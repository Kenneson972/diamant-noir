"use client";

import { Plus, Trash2 } from "lucide-react";

type Room = { name: string; bed: string; ensuite: boolean };

type Props = {
  rooms: Room[];
  onChange: (rooms: Room[]) => void;
};

const BED_OPTIONS = ["King size", "Queen size", "Double", "Simple", "Canapé-lit"];

export function RoomsEditor({ rooms, onChange }: Props) {
  const add = () => onChange([...rooms, { name: "", bed: "Queen size", ensuite: false }]);

  const update = (i: number, field: keyof Room, value: string | boolean) => {
    const updated = [...rooms];
    updated[i] = { ...updated[i], [field]: value };
    onChange(updated);
  };

  const remove = (i: number) => onChange(rooms.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-3">
      <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
        Détail des chambres
      </label>

      {rooms.map((r, i) => (
        <div key={i} className="grid gap-3 sm:grid-cols-3 items-center rounded-xl border border-navy/5 p-3">
          <input
            placeholder="Nom (ex: Chambre 1)"
            value={r.name}
            onChange={(e) => update(i, "name", e.target.value)}
            className="rounded-lg border border-navy/10 px-3 py-2 text-sm focus:border-gold focus:outline-none"
          />
          <select
            value={r.bed}
            onChange={(e) => update(i, "bed", e.target.value)}
            className="rounded-lg border border-navy/10 px-3 py-2 text-sm focus:border-gold focus:outline-none"
          >
            {BED_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs text-navy/70 cursor-pointer">
              <input
                type="checkbox"
                checked={r.ensuite}
                onChange={(e) => update(i, "ensuite", e.target.checked)}
                className="h-4 w-4 rounded border-navy/25 text-gold focus:ring-gold"
              />
              Salle de bain privative
            </label>
            <button type="button" onClick={() => remove(i)} className="ml-auto text-red-400 hover:text-red-600">
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
        <Plus size={14} /> Ajouter une chambre
      </button>
    </div>
  );
}
