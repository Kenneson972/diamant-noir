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
  const [form, dispatch] = useReducer(villaFormReducer, createEmptyForm(), (empty) =>
    villa ? villaFormReducer(empty, { type: "LOAD_VILLA", villa: villa as Partial<VillaFormData> }) : empty
  );
  const [step, setStep] = useState(0);
  const [autoStatus, setAutoStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const autoTimer = useRef<ReturnType<typeof setTimeout>>();

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
    clearTimeout(autoTimer.current);
    setAutoStatus("idle");
    autoTimer.current = setTimeout(() => { void doSave(); }, 2500);
    return () => clearTimeout(autoTimer.current);
  }, [form, isEdit, doSave]);

  // Submit création
  const handleCreate = async () => {
    const parsed = villaFormSchema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const e of parsed.error.errors) {
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
            <VillaFormFields form={form as Record<string, unknown>} onChange={handleChange} />
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
              <VillaFormFields form={form as Record<string, unknown>} onChange={handleChange} />
            </div>
          </details>
        </section>

        {/* Photos, Équipements, Pièces, Tarifs, Services, Contacts, Règles — placeholders */}
        {["photos", "equipments", "rooms", "pricing", "contacts", "services", "rules"].map(
          (id) => {
            const label =
              { photos: "Photos", equipments: "Équipements", rooms: "Pièces", pricing: "Tarifs", contacts: "Contacts urgence", services: "Services", rules: "Règles & sécurité" }[id] ?? id;
            return (
              <section
                key={id}
                id={`ve-${id}`}
                onMouseEnter={() => setHoveredSection(id)}
                onMouseLeave={() => setHoveredSection(null)}
              >
                <details className="group rounded-xl border border-navy/8 bg-white">
                  <summary className="cursor-pointer list-none px-6 py-4 font-display text-base font-semibold text-navy marker:content-none [&::-webkit-details-marker]:hidden">
                    {label}
                  </summary>
                  <div className="border-t border-navy/5 px-6 pb-6">
                    <p className="text-sm text-muted">Cette section sera enrichie dans les prochaines tâches.</p>
                  </div>
                </details>
              </section>
            );
          }
        )}

        {/* iCal */}
        <section
          id="ve-ical"
          onMouseEnter={() => setHoveredSection("ical")}
          onMouseLeave={() => setHoveredSection(null)}
        >
          <details className="group rounded-xl border border-navy/8 bg-white">
            <summary className="cursor-pointer list-none px-6 py-4 font-display text-base font-semibold text-navy marker:content-none [&::-webkit-details-marker]:hidden">
              Calendrier iCal
            </summary>
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
