"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
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

/* ─── Collapsible section ───────────────────────────── */

function CollapsibleSection({
  title,
  icon,
  defaultOpen = false,
  children,
}: {
  title: string;
  icon: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl border border-navy/8 bg-white p-6 shadow-sm">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between text-left"
      >
        <h3 className="font-display text-base font-semibold text-navy-900">
          {icon} {title}
        </h3>
        <ChevronDown
          className={`h-5 w-5 text-muted transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && <div className="mt-6 space-y-4">{children}</div>}
    </div>
  );
}

/* ─── Textarea helper ───────────────────────────────── */

function TextareaField({
  id,
  label,
  defaultValue,
  placeholder,
  rows = 3,
}: {
  id: string;
  label: string;
  defaultValue: string;
  placeholder: string;
  rows?: number;
}) {
  return (
    <div>
      <FieldLabel htmlFor={id} label={label} />
      <textarea
        id={id}
        defaultValue={defaultValue}
        rows={rows}
        placeholder={placeholder}
        className="w-full resize-y rounded-lg border border-border-subtle bg-transparent px-3 py-2 text-sm text-navy-900 placeholder:text-muted/50 focus:border-navy-900/30 focus:outline-none"
      />
    </div>
  );
}

/* ─── Tags input helper ─────────────────────────────── */

function TagsField({
  id,
  label,
  defaultValue,
  placeholder,
}: {
  id: string;
  label: string;
  defaultValue: string[];
  placeholder: string;
}) {
  return (
    <div>
      <FieldLabel htmlFor={id} label={label} />
      <Input
        id={id}
        defaultValue={Array.isArray(defaultValue) ? defaultValue.join(", ") : ""}
        placeholder={placeholder}
        className="text-sm"
      />
      <p className="mt-1 text-[10px] text-muted/60">
        Séparez les éléments par des virgules
      </p>
    </div>
  );
}

/* ─── Composant principal ───────────────────────────── */

export function VillaFormFields({ form, onChange: _onChange }: VillaFormFieldsProps) {
  const s = (val: unknown) => (typeof val === "string" ? val : "");
  const a = (val: unknown) => (Array.isArray(val) ? val : []);

  return (
    <div className="space-y-6">
      {/* 🏠 Informations générales */}
      <CollapsibleSection title="Informations générales" icon="🏠" defaultOpen>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <FieldLabel htmlFor="vf-name" label="Nom de la villa *" />
            <Input id="vf-name" defaultValue={s(form.name)} placeholder="Ex: Villa Océane" className="text-sm" />
          </div>
          <div className="sm:col-span-2">
            <FieldLabel htmlFor="vf-location" label="Localisation" />
            <Input id="vf-location" defaultValue={s(form.location)} placeholder="Ex: Trois-Îlets, Martinique" className="text-sm" />
          </div>
          <div>
            <FieldLabel htmlFor="vf-price" label="Prix / nuit (€)" />
            <Input id="vf-price" type="number" min="0" step="1" defaultValue={form.price_per_night as string || ""} placeholder="250" className="text-sm" />
          </div>
          <div>
            <FieldLabel htmlFor="vf-min-nights" label="Nuits minimum" />
            <Input id="vf-min-nights" type="number" min="1" max="30" step="1" defaultValue={(form.min_nights as string) || "1"} placeholder="1" className="text-sm" />
          </div>
          <div>
            <FieldLabel htmlFor="vf-capacity" label="Capacité (personnes)" />
            <Input id="vf-capacity" type="number" min="1" defaultValue={form.capacity as string || ""} placeholder="6" className="text-sm" />
          </div>
          <div>
            <FieldLabel htmlFor="vf-bathrooms" label="Salles de bain" />
            <Input id="vf-bathrooms" type="number" min="0" step="1" defaultValue={form.bathrooms_count as string || ""} placeholder="2" className="text-sm" />
          </div>
          <div>
            <FieldLabel htmlFor="vf-surface" label="Surface (m²)" />
            <Input id="vf-surface" type="number" min="0" defaultValue={form.surface_m2 as string || ""} placeholder="120" className="text-sm" />
          </div>
          <div>
            <FieldLabel htmlFor="vf-checkin" label="Check-in" />
            <Input id="vf-checkin" defaultValue={s(form.check_in_time)} placeholder="15:00" className="text-sm" />
          </div>
          <div>
            <FieldLabel htmlFor="vf-checkout" label="Check-out" />
            <Input id="vf-checkout" defaultValue={s(form.check_out_time)} placeholder="11:00" className="text-sm" />
          </div>
          <div className="sm:col-span-2">
            <FieldLabel htmlFor="vf-desc" label="Description" />
            <textarea id="vf-desc" defaultValue={s(form.description)} rows={4} placeholder="Description luxueuse de la villa..." className="w-full resize-y rounded-lg border border-border-subtle bg-transparent px-3 py-2 text-sm text-navy-900 placeholder:text-muted/50 focus:border-navy-900/30 focus:outline-none" />
          </div>
          <div>
            <FieldLabel htmlFor="vf-latitude" label="Latitude" />
            <Input id="vf-latitude" type="number" min="-90" max="90" step="0.000001" defaultValue={form.latitude as string || ""} placeholder="14.4750" className="text-sm" />
          </div>
          <div>
            <FieldLabel htmlFor="vf-longitude" label="Longitude" />
            <Input id="vf-longitude" type="number" min="-180" max="180" step="0.000001" defaultValue={form.longitude as string || ""} placeholder="-61.0247" className="text-sm" />
          </div>
          <div className="sm:col-span-2">
            <FieldLabel htmlFor="vf-map-embed" label="URL carte Google Maps (embed)" />
            <Input id="vf-map-embed" defaultValue={s(form.map_embed_url)} placeholder="https://www.google.com/maps/embed?..." className="text-sm" />
          </div>
          <div className="sm:col-span-2">
            <FieldLabel htmlFor="vf-airbnb" label="URL Airbnb" />
            <Input id="vf-airbnb" defaultValue={s(form.airbnb_url)} placeholder="https://www.airbnb.fr/rooms/..." className="text-sm" />
          </div>
        </div>
      </CollapsibleSection>

      {/* 🛋️ Équipements & Services */}
      <CollapsibleSection title="Équipements & Services" icon="🛋️">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <TagsField id="vf-equipment-interior" label="Équipements intérieurs" defaultValue={a(form.equipment_interior)} placeholder="Wifi, Climatisation, TV, Lave-vaisselle, ..." />
          </div>
          <div className="sm:col-span-2">
            <TagsField id="vf-equipment-exterior" label="Équipements extérieurs" defaultValue={a(form.equipment_exterior)} placeholder="Piscine, Barbecue, Terrasse, Jardin, ..." />
          </div>
          <div className="sm:col-span-2">
            <TagsField id="vf-included-home" label="Services inclus — Home" defaultValue={a(form.included_services_home)} placeholder="Draps, Serviettes, Ménage fin de séjour, ..." />
          </div>
          <div className="sm:col-span-2">
            <TagsField id="vf-included-collection" label="Services inclus — Collection" defaultValue={a(form.included_services_collection)} placeholder="Concierge dédié, Accueil champagne, ..." />
          </div>
          <div className="sm:col-span-2">
            <TagsField id="vf-a-la-carte" label="Services à la carte" defaultValue={a(form.a_la_carte_services)} placeholder="Chef privé, Massage, Location bateau, ..." />
          </div>
        </div>
      </CollapsibleSection>

      {/* 📋 Règles & Sécurité */}
      <CollapsibleSection title="Règles & Sécurité" icon="📋">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <TextareaField id="vf-house-rules" label="Règles de la maison" defaultValue={s(form.house_rules)} placeholder="Pas de fêtes, respect du voisinage..." rows={4} />
          </div>
          <div className="sm:col-span-2">
            <TextareaField id="vf-safety-info" label="Infos sécurité" defaultValue={s(form.safety_info)} placeholder="Extincteur, trousse premiers secours..." rows={3} />
          </div>
          <div className="sm:col-span-2">
            <TextareaField id="vf-cancellation-policy" label="Politique d'annulation" defaultValue={s(form.cancellation_policy)} placeholder="Remboursement intégral jusqu'à 30 jours..." rows={3} />
          </div>
          <div className="sm:col-span-2">
            <TextareaField id="vf-booking-terms" label="Conditions de réservation (JSON)" defaultValue={typeof form.booking_terms === "string" ? form.booking_terms : form.booking_terms ? JSON.stringify(form.booking_terms, null, 2) : ""} placeholder='{"deposit_percent": 30, ...}' rows={3} />
          </div>
          <div>
            <FieldLabel htmlFor="vf-wifi-name" label="WiFi nom (SSID)" />
            <Input id="vf-wifi-name" defaultValue={s(form.wifi_name)} placeholder="VillaOcean_WiFi" className="text-sm" />
          </div>
          <div>
            <FieldLabel htmlFor="vf-wifi-password" label="WiFi mot de passe" />
            <Input id="vf-wifi-password" defaultValue={s(form.wifi_password)} placeholder="MotDePasse123" className="text-sm" />
          </div>
          <div className="sm:col-span-2">
            <TextareaField id="vf-emergency-contacts" label="Contacts urgence (JSON)" defaultValue={typeof form.emergency_contacts === "string" ? form.emergency_contacts : form.emergency_contacts ? JSON.stringify(form.emergency_contacts, null, 2) : "[]"} placeholder='[{"name":"Pompier","phone":"18"}, ...]' rows={3} />
          </div>
          <div className="sm:col-span-2">
            <TextareaField id="vf-checkout-instructions" label="Consignes check-out" defaultValue={s(form.checkout_instructions)} placeholder="Sortir les poubelles, fermer les volets..." rows={3} />
          </div>
        </div>
      </CollapsibleSection>

      {/* 📍 Localisation & Environs */}
      <CollapsibleSection title="Localisation & Environs" icon="📍">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <TextareaField id="vf-environment" label="Environnement" defaultValue={s(form.environment)} placeholder="Quartier calme, vue mer, à 5min de la plage..." rows={3} />
          </div>
          <div className="sm:col-span-2">
            <TagsField id="vf-nearby-points" label="Points d'intérêt proches" defaultValue={a(form.nearby_points)} placeholder="Plage des Salines, Golf, Marché local, ..." />
          </div>
        </div>
      </CollapsibleSection>

      {/* 💰 Prix & Conditions */}
      <CollapsibleSection title="Prix & Conditions" icon="💰">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <TextareaField id="vf-rooms-details" label="Détail des chambres (JSON)" defaultValue={typeof form.rooms_details === "string" ? form.rooms_details : form.rooms_details ? JSON.stringify(form.rooms_details, null, 2) : "[]"} placeholder='[{"name":"Chambre 1","bed":"King size","ensuite":true}]' rows={4} />
          </div>
          <div className="sm:col-span-2">
            <TextareaField id="vf-seasonal-prices" label="Prix saisonniers (JSON)" defaultValue={typeof form.seasonal_prices === "string" ? form.seasonal_prices : form.seasonal_prices ? JSON.stringify(form.seasonal_prices, null, 2) : "[]"} placeholder='[{"season":"Haute","start":"12-01","end":"04-30","price":450}]' rows={4} />
          </div>
        </div>
      </CollapsibleSection>
    </div>
  );
}
