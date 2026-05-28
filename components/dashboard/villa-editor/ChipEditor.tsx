"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";

type ChipEditorProps = {
  id: string;
  label: string;
  items: string[];
  suggestions: string[];
  onChange: (items: string[]) => void;
};

export function ChipEditor({ id, label, items, suggestions, onChange }: ChipEditorProps) {
  const [input, setInput] = useState("");

  const toggleSuggestion = (item: string) => {
    if (items.includes(item)) {
      onChange(items.filter((i) => i !== item));
    } else {
      onChange([...items, item]);
    }
  };

  const addCustom = () => {
    const val = input.trim();
    if (!val || items.includes(val)) return;
    onChange([...items, val]);
    setInput("");
  };

  const removeItem = (item: string) => {
    onChange(items.filter((i) => i !== item));
  };

  return (
    <div className="space-y-3">
      <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
        {label}
      </label>

      {/* Selected chips */}
      {items.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {items.map((item) => (
            <span
              key={item}
              className="inline-flex items-center gap-1 rounded-full bg-navy px-3 py-1 text-xs font-medium text-white"
            >
              {item}
              <button
                type="button"
                onClick={() => removeItem(item)}
                className="ml-0.5 text-white/70 hover:text-white"
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Custom input */}
      <div className="flex gap-2">
        <input
          id={id}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustom(); } }}
          placeholder="Ajouter un élément..."
          className="flex-1 rounded-xl border border-navy/10 px-3 py-2 text-sm focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20"
        />
        <button
          type="button"
          onClick={addCustom}
          className="inline-flex items-center gap-1 rounded-xl bg-navy/5 px-3 py-2 text-sm font-medium text-navy hover:bg-navy/10"
        >
          <Plus size={14} /> Ajouter
        </button>
      </div>

      {/* Suggestions */}
      <div className="flex flex-wrap gap-2">
        {suggestions.map((s) => {
          const selected = items.includes(s);
          return (
            <button
              key={s}
              type="button"
              onClick={() => toggleSuggestion(s)}
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                selected
                  ? "bg-navy text-white"
                  : "bg-gray-100 text-navy/60 hover:bg-gray-200"
              }`}
            >
              {selected && <span className="text-[10px]">✓</span>}
              {s}
            </button>
          );
        })}
      </div>
    </div>
  );
}
