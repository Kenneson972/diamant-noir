"use client";

import { useReducer, useEffect, useState, useRef, useCallback, type ReactNode } from "react";
import Link from "next/link";
import { villaFormReducer, createEmptyForm, sectionCompleteness } from "@/lib/villa-editor-state";
import { sectionsForRole } from "@/lib/villa-editor-sections";
import type { SectionStatus } from "@/lib/villa-editor-sections";
import type { VillaFormData } from "@/lib/validations/villa";
import type { Villa } from "@/types/domain";
import { AutosaveIndicator } from "./AutosaveIndicator";
import { VillaEditorShell } from "./VillaEditorShell";
import { EditorSection } from "./EditorSection";
import { EditorSummary, type SummaryItem } from "./EditorSummary";
import { VillaFormFields } from "./VillaFormFields";
import { VillaImageManager } from "./VillaImageManager";
import { VillaAmenitiesEditorV2 } from "./VillaAmenitiesEditor";
import { RoomsEditor } from "./RoomsEditor";
import { SeasonalPricesEditor } from "./SeasonalPricesEditor";
import { EmergencyContactsEditor } from "./EmergencyContactsEditor";
import { ChipEditor } from "./ChipEditor";

export function VillaEditor({
  villa,
  isAdmin,
  icalContent,
  photosFooter,
  adminExtras,
}: {
  villa: Villa;
  isAdmin?: boolean;
  icalContent?: ReactNode;
  photosFooter?: ReactNode;
  adminExtras?: ReactNode;
}) {
  const [form, dispatch] = useReducer(villaFormReducer, createEmptyForm(), (empty) => {
    // Map Villa (domain) → VillaFormData (Zod)
    const v = villa as unknown as Record<string, unknown>;
    const partial: Partial<VillaFormData> = {
      name: String(v.name ?? ""),
      location: String(v.location ?? ""),
      description: String(v.description ?? ""),
      price_per_night: Number(v.price_per_night ?? 0),
      capacity: Number(v.capacity ?? 0),
      bedrooms: Number(v.bedrooms ?? 0),
      bathrooms_count: Number(v.bathrooms_count ?? 0),
      surface_m2: Number(v.surface_m2 ?? 0),
      image_url: String(v.image_url ?? ""),
      image_urls: Array.isArray(v.image_urls) ? v.image_urls as string[] : [],
      equipment_interior: Array.isArray(v.equipment_interior) ? v.equipment_interior as string[] : [],
      equipment_exterior: Array.isArray(v.equipment_exterior) ? v.equipment_exterior as string[] : [],
      check_in_time: String(v.check_in_time ?? "15:00"),
      check_out_time: String(v.check_out_time ?? "10:00"),
      wifi_name: String(v.wifi_name ?? ""),
      wifi_password: String(v.wifi_password ?? ""),
      is_published: Boolean(v.is_published),
      commission_rate: Number(v.commission_rate ?? 22),
      owner_id: String(v.owner_id ?? ""),
      collection_tier: String(v.collection_tier ?? ""),
      cleaning_fee_cents: Number(v.cleaning_fee_cents ?? 0),
    };
    return villaFormReducer(empty, { type: "LOAD_VILLA", villa: partial });
  });
  const [autoStatus, setAutoStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [importingAirbnb, setImportingAirbnb] = useState(false);
  const [importAirbnbMessage, setImportAirbnbMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const autoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const statuses = sectionCompleteness(form);
  const sections = sectionsForRole(!!isAdmin);
  const summaryItems: SummaryItem[] = [
    { id: "identite", label: "Carte d'identité", bloc: "identity", status: statuses.infos as SectionStatus },
    ...sections.map((def) => ({
      id: def.id,
      label: def.label,
      bloc: def.bloc,
      status: def.statusKey ? (statuses[def.statusKey] as SectionStatus) : undefined,
    })),
  ];
  const sectionDef = (id: string) => sections.find((def) => def.id === id);

  const doSave = useCallback(async () => {
    setAutoStatus("saving");
    try {
      // La DB refuse "" sur ces colonnes (check constraints + uuid) — envoyer null / omettre
      const payload: Record<string, unknown> = { ...form };
      if (!form.owner_id) delete payload.owner_id;
      if (!form.collection_tier) payload.collection_tier = null;
      if (!form.cancellation_template) payload.cancellation_template = null;
      const res = await fetch("/api/dashboard/update-villa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ villaId: villa.id, payload }),
      });
      if (!res.ok) throw new Error("Save failed");
      setAutoStatus("saved");
      setLastSaved(new Date());
    } catch {
      setAutoStatus("error");
    }
  }, [form, villa.id]);

  useEffect(() => {
    clearTimeout(autoTimer.current ?? undefined);
    setAutoStatus("idle");
    autoTimer.current = setTimeout(() => { void doSave(); }, 2500);
    return () => clearTimeout(autoTimer.current ?? undefined);
  }, [form, doSave]);

  const handleChange = (key: string, value: unknown) => {
    dispatch({ type: "SET_FIELD", field: key, value });
  };

  const handleImportAirbnb = useCallback(async () => {
    const url = form.airbnb_url?.trim();
    if (!url) {
      setImportAirbnbMessage({ type: "error", text: "Renseignez d'abord une URL Airbnb ci-dessus" });
      return;
    }
    setImportingAirbnb(true);
    setImportAirbnbMessage(null);
    try {
      const res = await fetch("/api/import-airbnb", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Échec de l'import");

      let filled = 0;
      const setField = (field: string, value: unknown) => {
        if (value == null || value === "") return;
        dispatch({ type: "SET_FIELD", field, value });
        filled++;
      };
      const setArray = (field: string, raw: unknown) => {
        const arr = Array.isArray(raw)
          ? raw.filter(Boolean).map(String)
          : typeof raw === "string" && raw.trim()
            ? raw.split(/\n+|(?<=[.;])\s+/).map((s) => s.trim()).filter(Boolean)
            : [];
        if (arr.length === 0) return;
        dispatch({ type: "SET_ARRAY", field, value: arr });
        filled++;
      };

      setField("name", data.name);
      setField("description", data.description);
      setField("location", data.location);
      if (typeof data.capacity === "number") setField("capacity", data.capacity);
      if (typeof data.price_per_night === "number") setField("price_per_night", data.price_per_night);
      if (typeof data.bathrooms_count === "number") setField("bathrooms_count", data.bathrooms_count);
      if (typeof data.surface_m2 === "number") setField("surface_m2", data.surface_m2);
      setField("check_in_time", data.check_in_time);
      setField("check_out_time", data.check_out_time);
      if (typeof data.latitude === "number") setField("latitude", data.latitude);
      if (typeof data.longitude === "number") setField("longitude", data.longitude);
      setField("environment", data.environment);
      setField("cancellation_policy", data.cancellation_policy);
      setArray("house_rules", data.house_rules);
      setArray("safety_info", data.safety_info);
      setArray("nearby_points", data.nearby_points);
      setArray("equipment_interior", data.amenities);

      const photos: string[] = Array.isArray(data.image_urls) && data.image_urls.length
        ? data.image_urls
        : data.image_url ? [data.image_url] : [];
      if (photos.length > 0) {
        dispatch({ type: "SET_IMAGES", urls: photos });
        filled++;
      }

      setImportAirbnbMessage({
        type: "success",
        text: `Import réussi — ${filled} champ${filled > 1 ? "s" : ""} rempli${filled > 1 ? "s" : ""}${data.ai_note ? ` · ${data.ai_note}` : ""}`,
      });
    } catch (err) {
      setImportAirbnbMessage({ type: "error", text: err instanceof Error ? err.message : "Échec de l'import" });
    } finally {
      setImportingAirbnb(false);
    }
  }, [form.airbnb_url]);

  const backHref = isAdmin ? "/admin/villas" : "/dashboard/villas";

  const renderSection = (id: string, children: ReactNode) => {
    const def = sectionDef(id);
    if (!def) return null;
    return (
      <EditorSection
        key={id}
        id={id}
        icon={def.icon}
        title={def.label}
        help={def.help}
        status={def.statusKey ? (statuses[def.statusKey] as SectionStatus) : undefined}
      >
        {children}
      </EditorSection>
    );
  };

  const configSections = sections.filter((def) => def.bloc === "config");
  const adminSections = sections.filter((def) => def.bloc === "admin");

  const sectionContent: Record<string, ReactNode> = {
    details: (
      <VillaFormFields
        form={form as Record<string, unknown>}
        onChange={handleChange}
        embedded
        variant="details"
        onImportAirbnb={isAdmin ? handleImportAirbnb : undefined}
        importingAirbnb={importingAirbnb}
        importAirbnbMessage={importAirbnbMessage}
      />
    ),
    equipments: (
      <VillaAmenitiesEditorV2
        interior={form.equipment_interior}
        exterior={form.equipment_exterior}
        servicesHome={form.included_services_home}
        servicesCollection={form.included_services_collection}
        aLaCarte={form.a_la_carte_services}
        amenitiesImportLabels={[]}
        onChangeInterior={(v) => dispatch({ type: "SET_ARRAY", field: "equipment_interior", value: v })}
        onChangeExterior={(v) => dispatch({ type: "SET_ARRAY", field: "equipment_exterior", value: v })}
        onChangeServicesHome={(v) => dispatch({ type: "SET_ARRAY", field: "included_services_home", value: v })}
        onChangeServicesCollection={(v) => dispatch({ type: "SET_ARRAY", field: "included_services_collection", value: v })}
        onChangeALaCarte={(v) => dispatch({ type: "SET_ARRAY", field: "a_la_carte_services", value: v })}
      />
    ),
    rooms: <RoomsEditor rooms={form.rooms_details} onChange={(rooms) => dispatch({ type: "SET_ROOMS", rooms })} />,
    pricing: <SeasonalPricesEditor seasons={form.seasonal_prices} onChange={(seasons) => dispatch({ type: "SET_SEASONS", seasons })} basePrice={form.price_per_night} />,
    services: (
      <div className="space-y-4">
        <ChipEditor id="srv-home" label="Inclus (accueil)" items={form.included_services_home} suggestions={[]} onChange={(v) => dispatch({ type: "SET_ARRAY", field: "included_services_home", value: v })} />
        <ChipEditor id="srv-collection" label="Services de collection" items={form.included_services_collection} suggestions={[]} onChange={(v) => dispatch({ type: "SET_ARRAY", field: "included_services_collection", value: v })} />
        <ChipEditor id="srv-alacarte" label="À la carte" items={form.a_la_carte_services} suggestions={[]} onChange={(v) => dispatch({ type: "SET_ARRAY", field: "a_la_carte_services", value: v })} />
      </div>
    ),
    rules: (
      <div className="space-y-4">
        <ChipEditor id="house-rules" label="Règles intérieures" items={form.house_rules} suggestions={["Pas de fête", "Non-fumeur", "Animaux acceptés", "Respect du voisinage", "Pas de bruit après 22h", "Enfants bienvenus", "Adultes seulement", "Check-in autonome"]} onChange={(v) => dispatch({ type: "SET_ARRAY", field: "house_rules", value: v })} />
        <ChipEditor id="safety-info" label="Sécurité" items={form.safety_info} suggestions={["Extincteur", "Trousse premiers secours", "Détecteur de fumée", "Détecteur CO", "Alarme", "Piscine sécurisée"]} onChange={(v) => dispatch({ type: "SET_ARRAY", field: "safety_info", value: v })} />
      </div>
    ),
    contacts: <EmergencyContactsEditor contacts={form.emergency_contacts} onChange={(contacts) => dispatch({ type: "SET_CONTACTS", contacts })} />,
    ical: icalContent ?? <p className="text-sm text-muted">Synchronisation iCal disponible.</p>,
    admin: (
      <div className="space-y-4">
        <div>
          <label htmlFor="ve-admin-tier" className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-muted">Collection</label>
          <select id="ve-admin-tier" value={form.collection_tier ?? ""} onChange={(e) => handleChange("collection_tier", e.target.value)} className="min-h-[44px] w-full rounded-lg border border-navy/10 bg-white px-4 text-base focus:border-gold/50 focus:outline-none">
            <option value="">—</option>
            <option value="signature">Signature</option>
            <option value="iconic">Iconic</option>
          </select>
        </div>
        <label className="flex min-h-[44px] items-center gap-3">
          <input type="checkbox" checked={form.is_published} onChange={(e) => handleChange("is_published", e.target.checked)} className="size-5 rounded border-navy/25 text-gold focus:ring-gold" />
          <span className="text-sm font-medium text-navy">Publiée</span>
        </label>
        <div>
          <label htmlFor="ve-admin-commission" className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-muted">Commission (%)</label>
          <input id="ve-admin-commission" type="number" inputMode="numeric" min={0} max={100} value={form.commission_rate} onChange={(e) => handleChange("commission_rate", Number(e.target.value))} className="min-h-[44px] w-32 rounded-lg border border-navy/10 bg-white px-4 text-base focus:border-gold/50 focus:outline-none" />
        </div>
        <div>
          <label htmlFor="ve-admin-cleaning" className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-muted">Frais de ménage (€)</label>
          <input id="ve-admin-cleaning" type="number" inputMode="numeric" min={0} value={form.cleaning_fee_cents} onChange={(e) => handleChange("cleaning_fee_cents", Number(e.target.value))} className="min-h-[44px] w-48 rounded-lg border border-navy/10 bg-white px-4 text-base focus:border-gold/50 focus:outline-none" />
        </div>
        <div>
          <label htmlFor="ve-admin-owner" className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-muted">Propriétaire lié (ID)</label>
          <input id="ve-admin-owner" type="text" value={form.owner_id} onChange={(e) => handleChange("owner_id", e.target.value)} className="min-h-[44px] w-full rounded-lg border border-navy/10 bg-white px-4 font-mono text-sm focus:border-gold/50 focus:outline-none" />
        </div>
      </div>
    ),
  };

  return (
    <VillaEditorShell
      summary={
        <EditorSummary
          items={summaryItems}
          villaName={form.name}
          imageUrl={form.image_url || undefined}
          isPublished={form.is_published}
        />
      }
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="min-w-0 truncate font-display text-xl font-bold text-navy">{form.name || "Villa"}</h2>
        <div className="flex items-center gap-3">
          <AutosaveIndicator status={autoStatus} lastSaved={lastSaved} onRetry={() => { void doSave(); }} />
          <a
            href={`/villas/${villa.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-[44px] items-center rounded-lg border border-navy/15 bg-white px-4 text-sm font-semibold text-navy transition-colors hover:border-gold hover:text-gold"
          >
            Aperçu
          </a>
          <Link
            href={backHref}
            className="flex min-h-[44px] items-center rounded-lg bg-navy px-5 text-sm font-semibold text-white transition-colors hover:bg-navy/90"
          >
            Terminer
          </Link>
        </div>
      </div>
      {formError && <p className="mt-2 text-sm text-red-600">{formError}</p>}

      {/* Bloc 1 — Carte d'identité (jamais repliable) */}
      <section id="ve-identite" aria-label="Carte d'identité" className="scroll-mt-24 pb-8 pt-6" data-testid="editor-section-identite">
        <VillaFormFields form={form as Record<string, unknown>} onChange={handleChange} embedded variant="identity" />
        <div className="mt-6">
          <VillaImageManager
            imageUrls={form.image_urls}
            villaId={villa.id}
            onImagesChange={(urls) => dispatch({ type: "SET_IMAGES", urls })}
            onMainImageChange={(url) => handleChange("image_url", url)}
            onError={(msg) => setFormError(msg)}
          />
          {photosFooter}
        </div>
      </section>

      {/* Bloc 2 — Configuration */}
      <div data-testid="villa-editor-sections">
        {configSections.map((def) => renderSection(def.id, sectionContent[def.id]))}
      </div>

      {/* Bloc 3 — Administration (fond teinté) */}
      {isAdmin && adminSections.length > 0 && (
        <div className="mt-10 rounded-2xl bg-navy/[0.03] px-5 pb-5 pt-4" data-testid="villa-editor-admin-bloc">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted">Administration</p>
          {adminSections.map((def) => renderSection(def.id, sectionContent[def.id]))}
          {adminExtras && <div className="mt-4 space-y-4 border-t border-navy/8 pt-4">{adminExtras}</div>}
        </div>
      )}
    </VillaEditorShell>
  );
}
