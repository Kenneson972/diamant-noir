"use client";

import { Input } from "@/components/ui/input";

/* ─── Props ─────────────────────────────────────────── */

type VillaFormFieldsProps = {
  form: Record<string, any>;
  onChange: (key: string, value: any) => void;
};

/* ─── Label helper ──────────────────────────────────── */

function FieldLabel({ htmlFor, label }: { htmlFor: string; label: string }) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-muted"
    >
      {label}
    </label>
  );
}

/* ─── Composant ─────────────────────────────────────── */

export function VillaFormFields({ form, onChange: _onChange }: VillaFormFieldsProps) {
  return (
    <div className="dashboard-card space-y-6">
      <h3 className="font-display text-base font-semibold text-navy-900">
        Informations générales
      </h3>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Nom */}
        <div className="sm:col-span-2">
          <FieldLabel htmlFor="vf-name" label="Nom de la villa *" />
          <Input
            id="vf-name"
            defaultValue={(form.name as string) || ""}
            placeholder="Ex: Villa Océane"
            className="text-sm"
          />
        </div>

        {/* Localisation */}
        <div className="sm:col-span-2">
          <FieldLabel htmlFor="vf-location" label="Localisation" />
          <Input
            id="vf-location"
            defaultValue={(form.location as string) || ""}
            placeholder="Ex: Trois-Îlets, Martinique"
            className="text-sm"
          />
        </div>

        {/* Prix par nuit */}
        <div>
          <FieldLabel htmlFor="vf-price" label="Prix / nuit (€)" />
          <Input
            id="vf-price"
            type="number"
            min="0"
            step="1"
            defaultValue={form.price_per_night as string || ""}
            placeholder="250"
            className="text-sm"
          />
        </div>

        {/* Nuits minimum */}
        <div>
          <FieldLabel htmlFor="vf-min-nights" label="Nuits minimum" />
          <Input
            id="vf-min-nights"
            type="number"
            min="1"
            max="30"
            step="1"
            defaultValue={(form.min_nights as string) || "1"}
            placeholder="1"
            className="text-sm"
          />
        </div>

        {/* Capacité */}
        <div>
          <FieldLabel htmlFor="vf-capacity" label="Capacité (personnes)" />
          <Input
            id="vf-capacity"
            type="number"
            min="1"
            defaultValue={form.capacity as string || ""}
            placeholder="6"
            className="text-sm"
          />
        </div>

        {/* Salles de bain */}
        <div>
          <FieldLabel htmlFor="vf-bathrooms" label="Salles de bain" />
          <Input
            id="vf-bathrooms"
            type="number"
            min="0"
            step="1"
            defaultValue={form.bathrooms_count as string || ""}
            placeholder="2"
            className="text-sm"
          />
        </div>

        {/* Surface */}
        <div>
          <FieldLabel htmlFor="vf-surface" label="Surface (m²)" />
          <Input
            id="vf-surface"
            type="number"
            min="0"
            defaultValue={form.surface_m2 as string || ""}
            placeholder="120"
            className="text-sm"
          />
        </div>

        {/* Check-in / Check-out */}
        <div>
          <FieldLabel htmlFor="vf-checkin" label="Check-in" />
          <Input
            id="vf-checkin"
            defaultValue={(form.check_in_time as string) || ""}
            placeholder="15:00"
            className="text-sm"
          />
        </div>
        <div>
          <FieldLabel htmlFor="vf-checkout" label="Check-out" />
          <Input
            id="vf-checkout"
            defaultValue={(form.check_out_time as string) || ""}
            placeholder="11:00"
            className="text-sm"
          />
        </div>

        {/* Description */}
        <div className="sm:col-span-2">
          <FieldLabel htmlFor="vf-desc" label="Description" />
          <textarea
            id="vf-desc"
            defaultValue={(form.description as string) || ""}
            rows={4}
            placeholder="Description luxueuse de la villa..."
            className="w-full resize-y rounded-lg border border-border-subtle bg-transparent px-3 py-2 text-sm text-navy-900 placeholder:text-muted/50 focus:border-navy-900/30 focus:outline-none"
          />
        </div>

        {/* Coordonnées GPS */}
        <div>
          <FieldLabel htmlFor="vf-latitude" label="Latitude" />
          <Input
            id="vf-latitude"
            type="number"
            min="-90"
            max="90"
            step="0.000001"
            defaultValue={form.latitude as string || ""}
            placeholder="14.4750"
            className="text-sm"
          />
        </div>
        <div>
          <FieldLabel htmlFor="vf-longitude" label="Longitude" />
          <Input
            id="vf-longitude"
            type="number"
            min="-180"
            max="180"
            step="0.000001"
            defaultValue={form.longitude as string || ""}
            placeholder="-61.0247"
            className="text-sm"
          />
        </div>

        {/* URL carte embed */}
        <div className="sm:col-span-2">
          <FieldLabel htmlFor="vf-map-embed" label="URL carte Google Maps (embed)" />
          <Input
            id="vf-map-embed"
            defaultValue={(form.map_embed_url as string) || ""}
            placeholder="https://www.google.com/maps/embed?..."
            className="text-sm"
          />
          <p className="mt-1 text-[10px] text-muted/60">
            Optionnel. Prioritaire sur les coordonnées GPS si renseigné.
          </p>
        </div>

        {/* Airbnb URL */}
        <div className="sm:col-span-2">
          <FieldLabel htmlFor="vf-airbnb" label="URL Airbnb" />
          <Input
            id="vf-airbnb"
            defaultValue={(form.airbnb_url as string) || ""}
            placeholder="https://www.airbnb.fr/rooms/..."
            className="text-sm"
          />
        </div>
      </div>
    </div>
  );
}
