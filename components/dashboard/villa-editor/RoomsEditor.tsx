"use client";

import { Plus, Trash2, Bed, BedSingle, Sofa, ChevronDown } from "lucide-react";
import { ROOM_PRESETS, getBedCapacity, totalRoomCapacity } from "@/lib/room-presets";
import { useState } from "react";

type Room = { name: string; bed: string; ensuite: boolean };

const BED_OPTIONS = ["King size", "Queen size", "Double", "Simple", "Canapé-lit"];

function BedIcon({ bed }: { bed: string }) {
  const cls = "size-5 text-navy/60";
  if (bed === "King size" || bed === "Queen size") return <Bed className={cls} aria-hidden />;
  if (bed === "Double") return <Bed className={cls} aria-hidden />;
  if (bed === "Canapé-lit") return <Sofa className={cls} aria-hidden />;
  return <BedSingle className={cls} aria-hidden />;
}

export function RoomsEditor({ rooms, onChange }: { rooms: Room[]; onChange: (rooms: Room[]) => void }) {
  const [presetOpen, setPresetOpen] = useState(false);
  const capacity = totalRoomCapacity(rooms);

  const add = () => onChange([...rooms, { name: "", bed: "Queen size", ensuite: false }]);
  const update = (i: number, field: keyof Room, value: string | boolean) => {
    const next = [...rooms];
    next[i] = { ...next[i], [field]: value };
    onChange(next);
  };
  const remove = (i: number) => onChange(rooms.filter((_, idx) => idx !== i));
  const applyPreset = (preset: (typeof ROOM_PRESETS)[number]) => {
    onChange([...rooms, ...preset.rooms.map((r, i) => ({ ...r, name: r.name || `${preset.label} ${i + 1}` }))]);
    setPresetOpen(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted">Détail des chambres</label>
        <span className="text-[11px] font-medium text-navy/50">
          {rooms.length} chambre{rooms.length > 1 ? "s" : ""} · {capacity} personne{capacity > 1 ? "s" : ""}
        </span>
      </div>

      {rooms.map((r, i) => (
        <div key={i} className="flex items-center gap-3 rounded-xl border border-navy/8 bg-white p-4">
          <BedIcon bed={r.bed} />
          <div className="min-w-0 flex-1 space-y-2">
            <input
              placeholder="Nom (ex: Chambre 1)"
              value={r.name}
              onChange={(e) => update(i, "name", e.target.value)}
              className="w-full rounded-lg border border-navy/10 px-3 py-2 text-sm focus:border-gold focus:outline-none"
            />
            <div className="flex items-center gap-3">
              <select
                value={r.bed}
                onChange={(e) => update(i, "bed", e.target.value)}
                className="flex-1 rounded-lg border border-navy/10 px-3 py-2 text-sm focus:border-gold focus:outline-none"
              >
                {BED_OPTIONS.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}
              </select>
              <span className="text-[11px] text-navy/40">{getBedCapacity(r.bed)} pers.</span>
            </div>
            <label className="flex items-center gap-2 text-xs text-navy/70 cursor-pointer">
              <input type="checkbox" checked={r.ensuite} onChange={(e) => update(i, "ensuite", e.target.checked)} className="h-4 w-4 rounded border-navy/25 text-gold focus:ring-gold" />
              Salle de bain privative
            </label>
          </div>
          <button type="button" onClick={() => remove(i)} className="shrink-0 text-red-400 hover:text-red-600" aria-label="Supprimer"><Trash2 size={18} /></button>
        </div>
      ))}

      <div className="flex gap-2">
        <button type="button" onClick={add} className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-navy/15 bg-white px-4 text-sm font-medium text-navy hover:border-navy/30">
          <Plus size={16} /> Ajouter une chambre
        </button>
        <div className="relative">
          <button type="button" onClick={() => setPresetOpen(!presetOpen)} className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-navy/15 bg-white px-4 text-sm font-medium text-navy hover:border-navy/30">
            Presets <ChevronDown size={14} />
          </button>
          {presetOpen && (
            <div className="absolute left-0 top-full z-20 mt-1 w-56 rounded-lg border border-navy/10 bg-white shadow-lg">
              {ROOM_PRESETS.map((p) => (
                <button key={p.label} type="button" onClick={() => applyPreset(p)} className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-navy hover:bg-navy/5">
                  <Bed size={14} className="shrink-0 text-navy/40" /><span>{p.label}</span>
                  <span className="ml-auto text-[11px] text-navy/40">{p.rooms.length} ch.</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
