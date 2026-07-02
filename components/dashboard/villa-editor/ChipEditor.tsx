"use client";

import { useState } from "react";
import { Plus, X, Search } from "lucide-react";

type ChipEditorProps = { id: string; label: string; items: string[]; suggestions: string[]; onChange: (items: string[]) => void };

export function ChipEditor({ id, label, items: initialItems, suggestions, onChange }: ChipEditorProps) {
  const [items, setItems] = useState<string[]>(initialItems);
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");

  const updateItems = (next: string[]) => { setItems(next); onChange(next); };
  const toggle = (item: string) => { if (items.includes(item)) updateItems(items.filter((i) => i !== item)); else updateItems([...items, item]); };
  const addCustom = () => { const val = input.trim(); if (!val || items.includes(val)) return; updateItems([...items, val]); setInput(""); };
  const remove = (item: string) => updateItems(items.filter((i) => i !== item));

  const filtered = search ? suggestions.filter((s) => s.toLowerCase().includes(search.toLowerCase())) : suggestions;

  return (
    <div className="space-y-3">
      <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-muted">{label}</label>
      {items.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {items.map((item) => (
            <span key={item} className="inline-flex min-h-[44px] items-center gap-1 rounded-full bg-navy px-3 py-1 text-xs font-medium text-white">
              {item}<button type="button" onClick={() => remove(item)} className="ml-0.5 text-white/70 hover:text-white"><X size={12} /></button>
            </span>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <input id={id} type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustom(); } }}
          placeholder="Ajouter un élément..." className="min-h-[44px] flex-1 rounded-lg border border-navy/10 px-3 py-2 text-base focus:border-gold focus:outline-none md:text-sm" />
        <button type="button" onClick={addCustom} className="inline-flex min-h-[44px] items-center gap-1 rounded-lg bg-navy/5 px-3 py-2 text-sm font-medium text-navy hover:bg-navy/10"><Plus size={14} /> Ajouter</button>
      </div>
      {suggestions.length > 8 && (
        <div className="relative"><Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-navy/20" />
          <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Filtrer les suggestions..." className="w-full rounded-md border border-navy/10 py-1 pl-7 pr-2 text-xs focus:border-gold/50 focus:outline-none" />
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {filtered.map((s) => {
          const selected = items.includes(s);
          return (
            <button key={s} type="button" onClick={() => toggle(s)}
              className={`inline-flex min-h-[44px] items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${selected ? "bg-navy text-white" : "border border-navy/15 text-navy/60 hover:border-navy/30"}`}>
              {selected && <span className="text-[10px]">✓</span>}{s}
            </button>
          );
        })}
      </div>
    </div>
  );
}
