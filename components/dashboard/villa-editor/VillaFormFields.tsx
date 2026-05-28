"use client";

import { useState } from "react";
import { ChevronDown, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ChipEditor } from "./ChipEditor";
import { EmergencyContactsEditor } from "./EmergencyContactsEditor";
import { RoomsEditor } from "./RoomsEditor";
import { SeasonalPricesEditor } from "./SeasonalPricesEditor";

/* ─── Props ─────────────────────────────────────────── */

export type VillaFormFieldsProps = {
  form: Record<string, any>;
  onChange: (key: string, value: any) => void;
};

/* ─── Helpers ───────────────────────────────────────── */

const s = (val: unknown) => (typeof val === "string" ? val : "");
const a = (val: unknown): string[] => (Array.isArray(val) ? val : []);
const j = (val: unknown, fallback: any[] = []) => {
  if (Array.isArray(val)) return val;
  if (typeof val === "string" && val.trim()) {
    try { return JSON.parse(val); } catch { return fallback; }
  }
  return fallback;
};

function FieldLabel({ htmlFor, label }: { htmlFor: string; label: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
      {label}
    </label>
  );
}

function CollapsibleSection({ title, icon, defaultOpen = false, children }: {
  title: string; icon: string; defaultOpen?: boolean; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl border border-navy/8 bg-white p-6 shadow-sm">
      <button type="button" onClick={() => setOpen(!open)} className="flex w-full items-center justify-between text-left">
        <h3 className="font-display text-base font-semibold text-navy-900">{icon} {title}</h3>
        <ChevronDown className={`h-5 w-5 text-muted transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="mt-6 space-y-4">{children}</div>}
    </div>
  );
}

/* ─── Suggestions ───────────────────────────────────── */

const INTERIOR_SUGGESTIONS = ["Wi-Fi", "Climatisation", "Télévision", "Cuisine équipée", "Lave-linge", "Sèche-linge", "Baignoire", "Eau chaude", "Détecteur de fumée"];
const EXTERIOR_SUGGESTIONS = ["Piscine", "Jardin", "Terrasse ou balcon", "Barbecue", "Parking gratuit", "Vue mer"];
const SERVICES_HOME_SUGGESTIONS = ["Draps", "Serviettes", "Ménage fin de séjour", "Linges de maison", "Produits d'accueil", "Lit bébé"];
const SERVICES_COLLECTION_SUGGESTIONS = ["Concierge dédié", "Accueil champagne", "Voiturier", "Chef à domicile", "Massage", "Service voiture"];
const A_LA_CARTE_SUGGESTIONS = ["Chef privé", "Massage", "Location bateau", "Babysitter", "Visite guidée", "Transfert aéroport", "Location voiture", "Cours de plongée", "Petit-déjeuner"];
const HOUSE_RULES_SUGGESTIONS = ["Pas de fête", "Non-fumeur", "Animaux acceptés", "Animaux non acceptés", "Respect du voisinage", "Pas de bruit après 22h", "Enfants bienvenus", "Adultes seulement", "Check-in autonome"];
const SAFETY_SUGGESTIONS = ["Extincteur", "Trousse premiers secours", "Détecteur de fumée", "Détecteur CO", "Caméra de surveillance", "Alarme", "Issues de secours", "Piscine sécurisée", "Portail sécurisé"];
const NEARBY_SUGGESTIONS = ["Plage", "Restaurant", "Supermarché", "Pharmacie", "Hôpital", "Aéroport", "Golf", "Randonnée", "Marché local", "Musée", "Centre commercial", "Station essence", "Location voiture", "Snack", "Boulangerie"];

/* ─── Composant principal ───────────────────────────── */

export function VillaFormFields({ form, onChange }: VillaFormFieldsProps) {
  const handleGeolocate = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = document.getElementById("vf-latitude") as HTMLInputElement | null;
        const lng = document.getElementById("vf-longitude") as HTMLInputElement | null;
        if (lat) lat.value = pos.coords.latitude.toFixed(6);
        if (lng) lng.value = pos.coords.longitude.toFixed(6);
      },
      () => {},
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

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
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <FieldLabel htmlFor="vf-longitude" label="Longitude" />
                <Input id="vf-longitude" type="number" min="-180" max="180" step="0.000001" defaultValue={form.longitude as string || ""} placeholder="-61.0247" className="text-sm" />
              </div>
              <button type="button" onClick={handleGeolocate} className="mb-0.5 shrink-0 rounded-xl border border-gold/30 bg-gold/5 px-3 py-2 text-xs font-medium text-gold hover:bg-gold/10">
                <MapPin size={14} className="inline mr-1" />Me localiser
              </button>
            </div>
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
        <div className="space-y-6">
          <ChipEditor id="vf-equipment-interior" label="Équipements intérieurs" items={a(form.equipment_interior)} suggestions={INTERIOR_SUGGESTIONS} onChange={(items) => onChange("equipment_interior", items)} />
          <ChipEditor id="vf-equipment-exterior" label="Équipements extérieurs" items={a(form.equipment_exterior)} suggestions={EXTERIOR_SUGGESTIONS} onChange={(items) => onChange("equipment_exterior", items)} />
          <ChipEditor id="vf-included-home" label="Services inclus — Home" items={a(form.included_services_home)} suggestions={SERVICES_HOME_SUGGESTIONS} onChange={(items) => onChange("included_services_home", items)} />
          <ChipEditor id="vf-included-collection" label="Services inclus — Collection" items={a(form.included_services_collection)} suggestions={SERVICES_COLLECTION_SUGGESTIONS} onChange={(items) => onChange("included_services_collection", items)} />
          <ChipEditor id="vf-a-la-carte" label="Services à la carte" items={a(form.a_la_carte_services)} suggestions={A_LA_CARTE_SUGGESTIONS} onChange={(items) => onChange("a_la_carte_services", items)} />
        </div>
      </CollapsibleSection>

      {/* 📋 Règles & Sécurité */}
      <CollapsibleSection title="Règles & Sécurité" icon="📋">
        <div className="space-y-6">
          <ChipEditor id="vf-house-rules" label="Règles de la maison" items={a(form.house_rules)} suggestions={HOUSE_RULES_SUGGESTIONS} onChange={(items) => onChange("house_rules", items)} />
          <ChipEditor id="vf-safety-info" label="Infos sécurité" items={a(form.safety_info)} suggestions={SAFETY_SUGGESTIONS} onChange={(items) => onChange("safety_info", items)} />

          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-muted" htmlFor="vf-cancellation-policy">Politique d'annulation</label>
            <select id="vf-cancellation-policy" defaultValue={s(form.cancellation_policy)} className="w-full rounded-xl border border-navy/10 px-4 py-3 text-sm focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20 mb-2">
              <option value="">Personnalisée</option>
              <option value="Stricte — Remboursement 50% jusqu'à 30 jours">Stricte — Remboursement 50% jusqu'à 30 jours</option>
              <option value="Modérée — Remboursement intégral jusqu'à 14 jours">Modérée — Remboursement intégral jusqu'à 14 jours</option>
              <option value="Flexible — Remboursement intégral jusqu'à 7 jours">Flexible — Remboursement intégral jusqu'à 7 jours</option>
              <option value="Très flexible — Remboursement intégral jusqu'à 24h avant">Très flexible — Remboursement intégral jusqu'à 24h avant</option>
            </select>
            <textarea id="vf-cancellation-policy-custom" defaultValue={s(form.cancellation_policy)} rows={2} placeholder="Ou saisissez une politique personnalisée..." className="w-full resize-y rounded-lg border border-border-subtle bg-transparent px-3 py-2 text-sm text-navy-900 focus:border-navy-900/30 focus:outline-none" />
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-muted">Conditions de réservation</label>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <span className="text-[10px] text-muted">Acompte (%)</span>
                <input id="vf-deposit-percent" type="number" min="0" max="100" defaultValue={form.booking_terms?.deposit_percent || ""} className="w-full rounded-lg border border-navy/10 px-3 py-2 text-sm focus:border-gold focus:outline-none" />
              </div>
              <div>
                <span className="text-[10px] text-muted">Préavis check-in (heures)</span>
                <input id="vf-checkin-notice" type="number" min="0" defaultValue={form.booking_terms?.checkin_notice_hours || ""} className="w-full rounded-lg border border-navy/10 px-3 py-2 text-sm focus:border-gold focus:outline-none" />
              </div>
              <div>
                <span className="text-[10px] text-muted">Âge minimum</span>
                <input id="vf-min-age" type="number" min="0" defaultValue={form.booking_terms?.min_age || ""} className="w-full rounded-lg border border-navy/10 px-3 py-2 text-sm focus:border-gold focus:outline-none" />
              </div>
            </div>
          </div>

          <EmergencyContactsEditor contacts={j(form.emergency_contacts, [])} onChange={(contacts) => onChange("emergency_contacts", contacts)} />

          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-muted" htmlFor="vf-checkout-instructions">Consignes check-out</label>
            <textarea id="vf-checkout-instructions" defaultValue={s(form.checkout_instructions)} rows={3} placeholder="Sortir les poubelles, fermer les volets..." className="w-full resize-y rounded-lg border border-border-subtle bg-transparent px-3 py-2 text-sm text-navy-900 focus:border-navy-900/30 focus:outline-none" />
          </div>
        </div>
      </CollapsibleSection>

      {/* 📍 Localisation & Environs */}
      <CollapsibleSection title="Localisation & Environs" icon="📍">
        <div className="space-y-6">
          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-muted" htmlFor="vf-environment">Environnement</label>
            <textarea id="vf-environment" defaultValue={s(form.environment)} rows={3} placeholder="Quartier calme, vue mer, à 5min de la plage..." className="w-full resize-y rounded-lg border border-border-subtle bg-transparent px-3 py-2 text-sm text-navy-900 focus:border-navy-900/30 focus:outline-none" />
          </div>
          <ChipEditor id="vf-nearby-points" label="Points d'intérêt proches" items={a(form.nearby_points)} suggestions={NEARBY_SUGGESTIONS} onChange={(items) => onChange("nearby_points", items)} />
        </div>
      </CollapsibleSection>

      {/* 💰 Prix & Conditions */}
      <CollapsibleSection title="Prix & Conditions" icon="💰">
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-muted" htmlFor="vf-wifi-name">WiFi — Nom (SSID)</label>
            <Input id="vf-wifi-name" defaultValue={s(form.wifi_name)} placeholder="VillaOcean_WiFi" className="text-sm" />
          </div>
          <div className="space-y-2">
            <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-muted" htmlFor="vf-wifi-password">WiFi — Mot de passe</label>
            <Input id="vf-wifi-password" defaultValue={s(form.wifi_password)} placeholder="MotDePasse123" className="text-sm" />
          </div>
          <RoomsEditor rooms={j(form.rooms_details, [])} onChange={(rooms) => onChange("rooms_details", rooms)} />
          <SeasonalPricesEditor seasons={j(form.seasonal_prices, [])} onChange={(seasons) => onChange("seasonal_prices", seasons)} />
        </div>
      </CollapsibleSection>
    </div>
  );
}
