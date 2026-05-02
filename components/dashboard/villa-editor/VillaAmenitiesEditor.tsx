"use client";

import { Plus, X, Check, Sparkles } from "lucide-react";
import { SUGGESTED_AMENITY_LABELS, SUGGESTED_AMENITY_SET } from "@/lib/villa-amenities-suggested";

/* ─── Props ─────────────────────────────────────────── */

type VillaAmenitiesEditorProps = {
  amenities: string[];
  amenitiesImportLabels: string[];
  onChange: (amenities: string[]) => void;
  draft: string;
  onDraftChange: (value: string) => void;
};

/* ─── Tag "Import" ───────────────────────────────────── */

export function AmenityImportTag({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-md bg-emerald-600/12 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-800 ${className}`}
    >
      <Sparkles className="h-2.5 w-2.5 shrink-0" aria-hidden />
      Import
    </span>
  );
}

/* ─── Composant ─────────────────────────────────────── */

export function VillaAmenitiesEditor({
  amenities,
  amenitiesImportLabels,
  onChange,
  draft,
  onDraftChange,
}: VillaAmenitiesEditorProps) {
  const customAmenityItems = amenities.filter(
    (a) => !SUGGESTED_AMENITY_SET.has(a)
  );

  const remove = (label: string) => {
    onChange(amenities.filter((a) => a !== label));
  };

  const addSuggested = (label: string) => {
    if (!amenities.includes(label)) {
      onChange([...amenities, label]);
    }
  };

  const addCustom = () => {
    const trimmed = draft.trim();
    if (trimmed && !amenities.includes(trimmed)) {
      onChange([...amenities, trimmed]);
      onDraftChange("");
    }
  };

  return (
    <div className="dashboard-card space-y-6">
      <h3 className="font-display text-base font-semibold text-navy-900">
        Équipements & services
      </h3>

      {/* Étiquettes suggérées */}
      <div className="space-y-2">
        <span className="dashboard-eyebrow">Suggestions</span>
        <div className="flex flex-wrap gap-1.5">
          {SUGGESTED_AMENITY_LABELS.map((label) => {
            const isActive = amenities.includes(label);
            const isImported = amenitiesImportLabels.includes(label);
            return (
              <button
                key={label}
                type="button"
                onClick={() => (isActive ? remove(label) : addSuggested(label))}
                className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                  isActive
                    ? "border-navy-900/30 bg-navy-900/5 text-navy-900"
                    : "border-border-subtle text-muted hover:border-navy-900/20 hover:text-navy-900/80"
                }`}
              >
                {isActive && <Check className="h-3 w-3 shrink-0" aria-hidden />}
                {label}
                {isImported && <AmenityImportTag />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Personnalisées */}
      <div className="space-y-2">
        <span className="dashboard-eyebrow">Personnalisées</span>
        {customAmenityItems.length === 0 ? (
          <p className="text-xs italic text-muted">
            Aucun équipement personnalisé. Ajoutez-en un ci-dessous.
          </p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {customAmenityItems.map((label) => (
              <span
                key={label}
                className="inline-flex items-center gap-1 rounded-md border border-navy-900/20 bg-navy-900/5 px-2.5 py-1 text-[11px] font-medium text-navy-900"
              >
                {label}
                <button
                  type="button"
                  onClick={() => remove(label)}
                  className="ml-0.5 transition-colors hover:text-red-600"
                  aria-label={`Supprimer ${label}`}
                >
                  <X className="h-3 w-3" aria-hidden />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Ajout personnalisé */}
      <div className="flex items-center gap-1.5">
        <input
          type="text"
          value={draft}
          onChange={(e) => onDraftChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addCustom();
            }
          }}
          placeholder="Ajouter un équipement..."
          className="min-h-0 flex-1 rounded-md border border-border-subtle bg-transparent px-2.5 py-1.5 text-[12px] text-navy-900 placeholder:text-muted/40 focus:border-navy-900/30 focus:outline-none"
        />
        <button
          type="button"
          onClick={addCustom}
          disabled={!draft.trim()}
          className="inline-flex items-center justify-center rounded-md bg-navy-900/5 px-3 py-1.5 text-xs font-medium text-navy-900/60 transition-colors hover:bg-navy-900/10 disabled:opacity-40"
          aria-label="Ajouter"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden />
        </button>
      </div>
    </div>
  );
}
