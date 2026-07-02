"use client";

import { useReducer, useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { villaFormReducer, createEmptyForm, sectionCompleteness } from "@/lib/villa-editor-state";
import { villaFormSchema } from "@/lib/validations/villa";
import type { VillaFormData } from "@/lib/validations/villa";
import type { Villa } from "@/types/domain";
import { Stepper } from "./Stepper";
import { AutosaveIndicator } from "./AutosaveIndicator";
import { QuickNav } from "./QuickNav";
import { ProgressBar } from "./ProgressBar";
import { VillaPreviewCard } from "./VillaPreviewCard";
import { VillaEditorShell } from "./VillaEditorShell";
import { VillaFormFields } from "./VillaFormFields";
import { VillaImageManager } from "./VillaImageManager";
import { VillaAmenitiesEditorV2 } from "./VillaAmenitiesEditor";
import { RoomsEditor } from "./RoomsEditor";
import { SeasonalPricesEditor } from "./SeasonalPricesEditor";
import { EmergencyContactsEditor } from "./EmergencyContactsEditor";
import { ChipEditor } from "./ChipEditor";

const CREATE_STEPS = [
  { label: "Infos générales", description: "Nom, localisation, description" },
  { label: "Photos", description: "Ajoutez vos plus belles photos" },
  { label: "Tarifs", description: "Prix par nuit et saisons" },
  { label: "Finalisation", description: "Vérifiez et publiez" },
];

const EDIT_SECTIONS = [
  { id: "infos", label: "Infos générales", icon: "LayoutDashboard" },
  { id: "photos", label: "Photos", icon: "Home" },
  { id: "equipments", label: "Équipements", icon: "Star" },
  { id: "rooms", label: "Pièces", icon: "Building2" },
  { id: "pricing", label: "Tarifs", icon: "DollarSign" },
  { id: "contacts", label: "Contacts", icon: "UserCircle" },
  { id: "services", label: "Services", icon: "Sparkles" },
  { id: "rules", label: "Règles & sécurité", icon: "Settings" },
  { id: "ical", label: "Calendrier iCal", icon: "CalendarDays" },
  { id: "admin", label: "Administration", icon: "Zap" },
];

export function VillaEditor({ villa, isAdmin }: { villa?: Villa | null; isAdmin?: boolean }) {
  const router = useRouter();
  const isEdit = !!villa?.id;
  const [form, dispatch] = useReducer(villaFormReducer, createEmptyForm(), (empty) => {
    if (!villa) return empty;
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
  const [step, setStep] = useState(0);
  const [autoStatus, setAutoStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const autoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sections = sectionCompleteness(form);
  const sectionArr = EDIT_SECTIONS.map((s) => ({
    ...s,
    status: (sections[s.id] ?? "empty") as "empty" | "partial" | "complete",
  }));

  // Autosave (mode édition uniquement)
  const doSave = useCallback(async () => {
    if (!isEdit || !villa?.id) return;
    setAutoStatus("saving");
    try {
      const res = await fetch("/api/dashboard/update-villa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: villa.id, ...form }),
      });
      if (!res.ok) throw new Error("Save failed");
      setAutoStatus("saved");
      setLastSaved(new Date());
    } catch {
      setAutoStatus("error");
    }
  }, [form, isEdit, villa?.id]);

  useEffect(() => {
    if (!isEdit) return;
    clearTimeout(autoTimer.current ?? undefined);
    setAutoStatus("idle");
    autoTimer.current = setTimeout(() => { void doSave(); }, 2500);
    return () => clearTimeout(autoTimer.current ?? undefined);
  }, [form, isEdit, doSave]);

  // Submit création
  const handleCreate = async () => {
    const parsed = villaFormSchema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const e of parsed.error.issues) {
        if (e.path[0]) fieldErrors[e.path[0] as string] = e.message;
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    try {
      const res = await fetch("/api/dashboard/create-villa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      if (!res.ok) throw new Error("Create failed");
      const data = (await res.json()) as { id?: string };
      router.push(`/admin/villas/${data.id ?? ""}`);
    } catch {
      setErrors({ _form: "Erreur lors de la création. Réessayez." });
    }
  };

  const handleChange = (key: string, value: unknown) => {
    dispatch({ type: "SET_FIELD", field: key, value });
    if (errors[key])
      setErrors((prev) => {
        const n = { ...prev };
        delete n[key];
        return n;
      });
  };

  // ─── Mode création ──────────────────────────────────────
  if (!isEdit) {
    return (
      <VillaEditorShell preview={<VillaPreviewCard form={form} hoveredSection={hoveredSection} />}>
        <Stepper steps={CREATE_STEPS} current={step} onChange={setStep} />
        {step === 0 && (
          <div
            className="space-y-4"
            onMouseEnter={() => setHoveredSection("infos")}
            onMouseLeave={() => setHoveredSection(null)}
          >
            <VillaFormFields form={form as Record<string, unknown>} onChange={handleChange} embedded />
          </div>
        )}
        {step === 1 && (
          <div className="space-y-4">
            <p className="text-sm text-muted">
              Ajoutez vos photos dans l&apos;éditeur après avoir créé la villa.
            </p>
            <input
              type="text"
              value={form.image_url}
              onChange={(e) => handleChange("image_url", e.target.value)}
              placeholder="URL de l'image principale"
              className="min-h-[44px] w-full rounded-lg border border-navy/10 bg-white px-4 text-base focus:border-gold/50 focus:outline-none"
            />
          </div>
        )}
        {step === 2 && (
          <div
            className="space-y-4"
            onMouseEnter={() => setHoveredSection("pricing")}
            onMouseLeave={() => setHoveredSection(null)}
          >
            <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
              Prix par nuit (€)
            </label>
            <input
              type="number"
              min={1}
              value={form.price_per_night}
              onChange={(e) => handleChange("price_per_night", Number(e.target.value))}
              className="min-h-[44px] w-full rounded-lg border border-navy/10 bg-white px-4 text-base focus:border-gold/50 focus:outline-none"
            />
            {errors.price_per_night && (
              <p className="text-xs text-red-500">{errors.price_per_night}</p>
            )}
          </div>
        )}
        {step === 3 && (
          <div className="space-y-6">
            <div className="rounded-xl border border-navy/8 bg-white p-6">
              <h3 className="font-display text-base font-semibold text-navy">Récapitulatif</h3>
              <dl className="mt-4 divide-y divide-navy/5 text-sm">
                <div className="flex justify-between py-2">
                  <dt className="text-navy/55">Nom</dt>
                  <dd className="font-medium text-navy">{form.name || "—"}</dd>
                </div>
                <div className="flex justify-between py-2">
                  <dt className="text-navy/55">Prix</dt>
                  <dd className="font-medium text-navy">{form.price_per_night} €/nuit</dd>
                </div>
                <div className="flex justify-between py-2">
                  <dt className="text-navy/55">Capacité</dt>
                  <dd className="font-medium text-navy">{form.capacity} pers.</dd>
                </div>
              </dl>
            </div>
            {errors._form && <p className="text-sm text-red-600">{errors._form}</p>}
            <button
              type="button"
              onClick={handleCreate}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gold px-8 py-3.5 text-sm font-bold text-white transition-colors hover:bg-gold/90 active:scale-[0.98] sm:w-auto"
            >
              Publier la villa
            </button>
          </div>
        )}
        <div className="mt-8 flex justify-between">
          <button
            type="button"
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0}
            className="min-h-[44px] rounded-lg border border-navy/15 bg-white px-6 text-sm font-semibold text-navy disabled:opacity-30"
          >
            Précédent
          </button>
          {step < 3 && (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              className="min-h-[44px] rounded-lg bg-navy px-6 text-sm font-semibold text-white"
            >
              Suivant
            </button>
          )}
        </div>
      </VillaEditorShell>
    );
  }

  // ─── Mode édition ──────────────────────────────────────
  return (
    <VillaEditorShell
      sidebar={
        <QuickNav
          sections={sectionArr.slice(0, 8)}
          activeSection={hoveredSection ?? ""}
          onNavigate={(id) => {
            document.getElementById(`ve-${id}`)?.scrollIntoView({ behavior: "smooth" });
          }}
        />
      }
      preview={<VillaPreviewCard form={form} hoveredSection={hoveredSection} />}
    >
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-bold text-navy">Modifier la villa</h2>
        <AutosaveIndicator
          status={autoStatus}
          lastSaved={lastSaved}
          onRetry={() => {
            void doSave();
          }}
        />
      </div>
      <ProgressBar sections={sectionArr} />

      <div className="mt-6 space-y-8" data-testid="villa-editor-sections">
        {/* Infos générales */}
        <section
          id="ve-infos"
          onMouseEnter={() => setHoveredSection("infos")}
          onMouseLeave={() => setHoveredSection(null)}
        >
          <details className="group rounded-xl border border-navy/8 bg-white" open>
            <summary className="cursor-pointer list-none px-6 py-4 font-display text-base font-semibold text-navy marker:content-none [&::-webkit-details-marker]:hidden">
              Infos générales
            </summary>
            <div className="border-t border-navy/5 px-6 pb-6">
              <VillaFormFields form={form as Record<string, unknown>} onChange={handleChange} embedded />
            </div>
          </details>
        </section>

        {/* Photos */}
        <section id="ve-photos" onMouseEnter={() => setHoveredSection("photos")} onMouseLeave={() => setHoveredSection(null)}>
          <details className="group rounded-xl border border-navy/8 bg-white">
            <summary className="cursor-pointer list-none px-6 py-4 font-display text-base font-semibold text-navy marker:content-none [&::-webkit-details-marker]:hidden">
              Photos ({form.image_urls.length})
            </summary>
            <div className="border-t border-navy/5 px-6 pb-6">
              <VillaImageManager imageUrls={form.image_urls} villaId={villa?.id} onImagesChange={(urls) => dispatch({ type: "SET_IMAGES", urls })} onMainImageChange={(url) => handleChange("image_url", url)} onError={(msg) => setErrors((p) => ({ ...p, _form: msg }))} />
            </div>
          </details>
        </section>

        {/* Équipements */}
        <section id="ve-equipments" onMouseEnter={() => setHoveredSection("equipments")} onMouseLeave={() => setHoveredSection(null)}>
          <details className="group rounded-xl border border-navy/8 bg-white">
            <summary className="cursor-pointer list-none px-6 py-4 font-display text-base font-semibold text-navy marker:content-none [&::-webkit-details-marker]:hidden">Équipements</summary>
            <div className="border-t border-navy/5 px-6 pb-6">
              <VillaAmenitiesEditorV2 interior={form.equipment_interior} exterior={form.equipment_exterior} servicesHome={form.included_services_home} servicesCollection={form.included_services_collection} aLaCarte={form.a_la_carte_services} amenitiesImportLabels={[]} onChangeInterior={(v) => dispatch({ type: "SET_ARRAY", field: "equipment_interior", value: v })} onChangeExterior={(v) => dispatch({ type: "SET_ARRAY", field: "equipment_exterior", value: v })} onChangeServicesHome={(v) => dispatch({ type: "SET_ARRAY", field: "included_services_home", value: v })} onChangeServicesCollection={(v) => dispatch({ type: "SET_ARRAY", field: "included_services_collection", value: v })} onChangeALaCarte={(v) => dispatch({ type: "SET_ARRAY", field: "a_la_carte_services", value: v })} />
            </div>
          </details>
        </section>

        {/* Pièces */}
        <section id="ve-rooms" onMouseEnter={() => setHoveredSection("rooms")} onMouseLeave={() => setHoveredSection(null)}>
          <details className="group rounded-xl border border-navy/8 bg-white">
            <summary className="cursor-pointer list-none px-6 py-4 font-display text-base font-semibold text-navy marker:content-none [&::-webkit-details-marker]:hidden">Pièces</summary>
            <div className="border-t border-navy/5 px-6 pb-6">
              <RoomsEditor rooms={form.rooms_details} onChange={(rooms) => dispatch({ type: "SET_ROOMS", rooms })} />
            </div>
          </details>
        </section>

        {/* Tarifs */}
        <section id="ve-pricing" onMouseEnter={() => setHoveredSection("pricing")} onMouseLeave={() => setHoveredSection(null)}>
          <details className="group rounded-xl border border-navy/8 bg-white">
            <summary className="cursor-pointer list-none px-6 py-4 font-display text-base font-semibold text-navy marker:content-none [&::-webkit-details-marker]:hidden">Tarifs</summary>
            <div className="border-t border-navy/5 px-6 pb-6">
              <SeasonalPricesEditor seasons={form.seasonal_prices} onChange={(seasons) => dispatch({ type: "SET_SEASONS", seasons })} basePrice={form.price_per_night} />
            </div>
          </details>
        </section>

        {/* Contacts */}
        <section id="ve-contacts" onMouseEnter={() => setHoveredSection("contacts")} onMouseLeave={() => setHoveredSection(null)}>
          <details className="group rounded-xl border border-navy/8 bg-white">
            <summary className="cursor-pointer list-none px-6 py-4 font-display text-base font-semibold text-navy marker:content-none [&::-webkit-details-marker]:hidden">Contacts urgence</summary>
            <div className="border-t border-navy/5 px-6 pb-6">
              <EmergencyContactsEditor contacts={form.emergency_contacts} onChange={(contacts) => dispatch({ type: "SET_CONTACTS", contacts })} />
            </div>
          </details>
        </section>

        {/* Services */}
        <section id="ve-services" onMouseEnter={() => setHoveredSection("services")} onMouseLeave={() => setHoveredSection(null)}>
          <details className="group rounded-xl border border-navy/8 bg-white">
            <summary className="cursor-pointer list-none px-6 py-4 font-display text-base font-semibold text-navy marker:content-none [&::-webkit-details-marker]:hidden">Services</summary>
            <div className="border-t border-navy/5 px-6 pb-6 space-y-4">
              <ChipEditor id="srv-home" label="Inclus (accueil)" items={form.included_services_home} suggestions={[]} onChange={(v) => dispatch({ type: "SET_ARRAY", field: "included_services_home", value: v })} />
              <ChipEditor id="srv-collection" label="Services de collection" items={form.included_services_collection} suggestions={[]} onChange={(v) => dispatch({ type: "SET_ARRAY", field: "included_services_collection", value: v })} />
              <ChipEditor id="srv-alacarte" label="À la carte" items={form.a_la_carte_services} suggestions={[]} onChange={(v) => dispatch({ type: "SET_ARRAY", field: "a_la_carte_services", value: v })} />
            </div>
          </details>
        </section>

        {/* Règles & sécurité */}
        <section id="ve-rules" onMouseEnter={() => setHoveredSection("rules")} onMouseLeave={() => setHoveredSection(null)}>
          <details className="group rounded-xl border border-navy/8 bg-white">
            <summary className="cursor-pointer list-none px-6 py-4 font-display text-base font-semibold text-navy marker:content-none [&::-webkit-details-marker]:hidden">Règles & sécurité</summary>
            <div className="border-t border-navy/5 px-6 pb-6 space-y-4">
              <ChipEditor id="house-rules" label="Règles intérieures" items={form.house_rules} suggestions={["Pas de fête", "Non-fumeur", "Animaux acceptés", "Respect du voisinage", "Pas de bruit après 22h", "Enfants bienvenus", "Adultes seulement", "Check-in autonome"]} onChange={(v) => dispatch({ type: "SET_ARRAY", field: "house_rules", value: v })} />
              <ChipEditor id="safety-info" label="Sécurité" items={form.safety_info} suggestions={["Extincteur", "Trousse premiers secours", "Détecteur de fumée", "Détecteur CO", "Alarme", "Piscine sécurisée"]} onChange={(v) => dispatch({ type: "SET_ARRAY", field: "safety_info", value: v })} />
            </div>
          </details>
        </section>

        {/* iCal */}
        <section id="ve-ical" onMouseEnter={() => setHoveredSection("ical")} onMouseLeave={() => setHoveredSection(null)}>
          <details className="group rounded-xl border border-navy/8 bg-white">
            <summary className="cursor-pointer list-none px-6 py-4 font-display text-base font-semibold text-navy marker:content-none [&::-webkit-details-marker]:hidden">Calendrier iCal</summary>
            <div className="border-t border-navy/5 px-6 pb-6">
              <p className="text-sm text-muted">Synchronisation iCal disponible.</p>
            </div>
          </details>
        </section>

        {/* Admin only */}
        {isAdmin && (
          <section
            id="ve-admin"
            onMouseEnter={() => setHoveredSection("admin")}
            onMouseLeave={() => setHoveredSection(null)}
          >
            <details className="group rounded-xl border border-navy/8 bg-white">
              <summary className="cursor-pointer list-none px-6 py-4 font-display text-base font-semibold text-navy marker:content-none [&::-webkit-details-marker]:hidden">
                Administration
              </summary>
              <div className="border-t border-navy/5 px-6 pb-6 space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-muted mb-1">
                    Collection
                  </label>
                  <select
                    value={form.collection_tier ?? ""}
                    onChange={(e) => handleChange("collection_tier", e.target.value)}
                    className="min-h-[44px] w-full rounded-lg border border-navy/10 bg-white px-4 text-base focus:border-gold/50 focus:outline-none"
                  >
                    <option value="">—</option>
                    <option value="standard">Standard</option>
                    <option value="premium">Premium</option>
                    <option value="signature">Signature</option>
                  </select>
                </div>
                <label className="flex items-center gap-3 min-h-[44px]">
                  <input
                    type="checkbox"
                    checked={form.is_published}
                    onChange={(e) => handleChange("is_published", e.target.checked)}
                    className="size-5 rounded border-navy/25 text-gold focus:ring-gold"
                  />
                  <span className="text-sm font-medium text-navy">Publiée</span>
                </label>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-muted mb-1">
                    Commission (%)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={form.commission_rate}
                    onChange={(e) => handleChange("commission_rate", Number(e.target.value))}
                    className="min-h-[44px] w-32 rounded-lg border border-navy/10 bg-white px-4 text-base focus:border-gold/50 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-muted mb-1">
                    Frais de ménage (€)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.cleaning_fee_cents}
                    onChange={(e) => handleChange("cleaning_fee_cents", Number(e.target.value))}
                    className="min-h-[44px] w-48 rounded-lg border border-navy/10 bg-white px-4 text-base focus:border-gold/50 focus:outline-none"
                  />
                </div>
              </div>
            </details>
          </section>
        )}
      </div>
    </VillaEditorShell>
  );
}
