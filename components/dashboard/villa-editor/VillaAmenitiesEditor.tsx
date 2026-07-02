"use client";

import { useState } from "react";
import { Plus, X, Search } from "lucide-react";
import { KayvilaPngIcon } from "@/components/icons/KayvilaPngIcon";
import { SUGGESTED_AMENITY_LABELS, SUGGESTED_AMENITY_SET, SUGGESTED_AMENITIES, type AmenityCategory } from "@/lib/villa-amenities-suggested";
import { AMENITY_PRESETS } from "@/lib/amenity-presets";

/* ─── Tag "Import" ───────────────────────────────────── */
export function AmenityImportTag({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-0.5 rounded-md bg-emerald-600/12 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-800 ${className}`}>
      <KayvilaPngIcon name="sparkle" size={18} alt="" /> Import
    </span>
  );
}

/* ─── V1 (rétrocompatibilité) ────────────────────────── */
type VillaAmenitiesEditorProps = {
  amenities: string[];
  amenitiesImportLabels: string[];
  onChange: (amenities: string[]) => void;
  draft: string;
  onDraftChange: (value: string) => void;
};

export function VillaAmenitiesEditor({
  amenities, amenitiesImportLabels, onChange, draft, onDraftChange,
}: VillaAmenitiesEditorProps) {
  const customAmenityItems = amenities.filter((a) => !SUGGESTED_AMENITY_SET.has(a));
  const remove = (label: string) => onChange(amenities.filter((a) => a !== label));
  const addSuggested = (label: string) => { if (!amenities.includes(label)) onChange([...amenities, label]); };
  const addCustom = () => { const t = draft.trim(); if (t && !amenities.includes(t)) { onChange([...amenities, t]); onDraftChange(""); } };

  return (
    <div className="dashboard-card space-y-6">
      <h3 className="font-display text-base font-semibold text-navy-900">Équipements & services</h3>
      <div className="space-y-2">
        <span className="dashboard-eyebrow">Suggestions</span>
        <div className="flex flex-wrap gap-1.5">
          {SUGGESTED_AMENITY_LABELS.map((label) => {
            const isActive = amenities.includes(label);
            const isImported = amenitiesImportLabels.includes(label);
            return (
              <button key={label} type="button" onClick={() => (isActive ? remove(label) : addSuggested(label))}
                className={`inline-flex min-h-[44px] items-center gap-1 rounded-md border px-2.5 py-1 text-[11px] font-medium transition-colors ${isActive ? "border-navy/30 bg-navy/5 text-navy" : "border-navy/15 text-muted hover:border-navy/30 hover:text-navy"}`}>
                {isActive && <KayvilaPngIcon name="check-circle" size={18} alt="" />}{label}{isImported && <AmenityImportTag />}
              </button>
            );
          })}
        </div>
      </div>
      <div className="space-y-2">
        <span className="dashboard-eyebrow">Personnalisées</span>
        {customAmenityItems.length === 0 ? <p className="text-xs italic text-muted">Aucun équipement personnalisé.</p> : (
          <div className="flex flex-wrap gap-1.5">
            {customAmenityItems.map((label) => (
              <span key={label} className="inline-flex min-h-[44px] items-center gap-1 rounded-md border border-navy/20 bg-navy/5 px-2.5 py-1 text-[11px] font-medium text-navy">
                {label}<button type="button" onClick={() => remove(label)} className="ml-0.5 hover:text-red-600" aria-label={`Supprimer ${label}`}><X className="h-3 w-3" /></button>
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="flex items-center gap-1.5">
        <input type="text" value={draft} onChange={(e) => onDraftChange(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustom(); } }}
          placeholder="Ajouter un équipement..." className="min-h-[44px] flex-1 rounded-md border border-navy/10 bg-transparent px-2.5 py-1.5 text-base placeholder:text-muted/40 focus:border-navy/30 focus:outline-none" />
        <button type="button" onClick={addCustom} disabled={!draft.trim()} className="inline-flex items-center justify-center rounded-md bg-navy/5 px-3 py-1.5 text-xs font-medium text-navy/60 hover:bg-navy/10 disabled:opacity-40" aria-label="Ajouter"><Plus className="h-3.5 w-3.5" /></button>
      </div>
    </div>
  );
}

/* ─── V2 (5 catégories + presets) ─────────────────────── */
type CatProps = { label: string; items: string[]; suggestions: readonly string[]; importLabels: string[]; onChange: (v: string[]) => void };

function AmenityCategorySection({ label, items, suggestions, importLabels, onChange }: CatProps) {
  const [search, setSearch] = useState("");
  const filtered = search ? suggestions.filter((s) => s.toLowerCase().includes(search.toLowerCase())) : suggestions;
  const remove = (a: string) => onChange(items.filter((x) => x !== a));
  const toggle = (a: string) => { if (items.includes(a)) remove(a); else onChange([...items, a]); };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted">{label}</span>
        <span className="text-[11px] text-navy/40">({items.length})</span>
      </div>
      {suggestions.length > 8 && (
        <div className="relative"><Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-navy/20" />
          <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Filtrer..." className="w-full rounded-md border border-navy/10 py-1 pl-7 pr-2 text-xs focus:border-gold/50 focus:outline-none" />
        </div>
      )}
      <div className="flex flex-wrap gap-1.5">
        {filtered.map((s) => { const active = items.includes(s); const imp = importLabels.includes(s);
          return <button key={s} type="button" onClick={() => toggle(s)} className={`inline-flex min-h-[44px] items-center gap-1 rounded-md border px-2.5 py-1 text-[11px] font-medium transition-colors ${active ? "border-navy/30 bg-navy/5 text-navy" : "border-navy/15 text-muted hover:border-navy/30 hover:text-navy"}`}>{active && <KayvilaPngIcon name="check-circle" size={18} alt="" />}{s}{imp && <AmenityImportTag />}</button>;
        })}
      </div>
    </div>
  );
}

export function VillaAmenitiesEditorV2({
  interior, exterior, servicesHome, servicesCollection, aLaCarte,
  amenitiesImportLabels,
  onChangeInterior, onChangeExterior, onChangeServicesHome, onChangeServicesCollection, onChangeALaCarte,
}: {
  interior: string[]; exterior: string[]; servicesHome: string[]; servicesCollection: string[]; aLaCarte: string[];
  amenitiesImportLabels: string[];
  onChangeInterior: (v: string[]) => void;
  onChangeExterior: (v: string[]) => void;
  onChangeServicesHome: (v: string[]) => void;
  onChangeServicesCollection: (v: string[]) => void;
  onChangeALaCarte: (v: string[]) => void;
}) {
  const [presetOpen, setPresetOpen] = useState(false);

  const applyPreset = (preset: (typeof AMENITY_PRESETS)[number]) => {
    onChangeInterior([...new Set([...interior, ...preset.interior])]);
    onChangeExterior([...new Set([...exterior, ...preset.exterior])]);
    onChangeServicesHome([...new Set([...servicesHome, ...preset.servicesHome])]);
    onChangeServicesCollection([...new Set([...servicesCollection, ...preset.servicesCollection])]);
    onChangeALaCarte([...new Set([...aLaCarte, ...preset.aLaCarte])]);
    setPresetOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="relative inline-block">
        <button type="button" onClick={() => setPresetOpen(!presetOpen)} className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-navy/15 bg-white px-4 text-sm font-medium text-navy hover:border-navy/30">
          Remplissage rapide
        </button>
        {presetOpen && (
          <div className="absolute left-0 top-full z-20 mt-1 w-56 rounded-lg border border-navy/10 bg-white shadow-lg">
            {AMENITY_PRESETS.map((p) => (
              <button key={p.label} type="button" onClick={() => applyPreset(p)} className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-navy hover:bg-navy/5">{p.label}</button>
            ))}
          </div>
        )}
      </div>

      <AmenityCategorySection label="Équipements intérieurs" items={interior} suggestions={SUGGESTED_AMENITIES.interior} importLabels={amenitiesImportLabels} onChange={onChangeInterior} />
      <AmenityCategorySection label="Équipements extérieurs" items={exterior} suggestions={SUGGESTED_AMENITIES.exterior} importLabels={amenitiesImportLabels} onChange={onChangeExterior} />
      <AmenityCategorySection label="Services inclus (accueil)" items={servicesHome} suggestions={SUGGESTED_AMENITIES.servicesHome} importLabels={amenitiesImportLabels} onChange={onChangeServicesHome} />
      <AmenityCategorySection label="Services de collection" items={servicesCollection} suggestions={SUGGESTED_AMENITIES.servicesCollection} importLabels={amenitiesImportLabels} onChange={onChangeServicesCollection} />
      <AmenityCategorySection label="Services à la carte" items={aLaCarte} suggestions={SUGGESTED_AMENITIES.aLaCarte} importLabels={amenitiesImportLabels} onChange={onChangeALaCarte} />
    </div>
  );
}
