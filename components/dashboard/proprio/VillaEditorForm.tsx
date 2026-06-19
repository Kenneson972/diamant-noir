"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Save, Wand2, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { VillaFormFields } from "@/components/dashboard/villa-editor/VillaFormFields";
import { CANCELLATION_TEMPLATES, type CancellationTemplate } from "@/lib/cancellation-templates";
import { getSupabaseBrowser } from "@/lib/supabase";

interface VillaEditorFormProps {
  villa: Record<string, unknown>;
  photosRef?: React.MutableRefObject<string[]>;
}

type ToastType = "success" | "error" | null;

export function VillaEditorForm({ villa, photosRef: externalPhotosRef }: VillaEditorFormProps) {
  const router = useRouter();
  const isCreate = !villa.id;
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importUseAi, setImportUseAi] = useState(false);
  const [toast, setToast] = useState<{ type: ToastType; message: string } | null>(null);
  const [cancelTemplate, setCancelTemplate] = useState<CancellationTemplate>(
    (villa.cancellation_template as CancellationTemplate) ?? 'moderate'
  );
  const [cancelNotes, setCancelNotes] = useState<string>(
    (villa.cancellation_notes as string) ?? ''
  );
  const [bookletUploading, setBookletUploading] = useState(false);
  const [bookletUrl, setBookletUrl] = useState<string | null>(
    (villa.welcome_booklet_url as string) ?? null
  );
  const formRef = useRef<Record<string, any>>({});
  const internalPhotosRef = useRef<string[]>(
    Array.isArray(villa.image_urls)
      ? (villa.image_urls as string[])
      : villa.image_url
        ? [villa.image_url as string]
        : []
  );
  const photosRef = externalPhotosRef ?? internalPhotosRef;

  // ─── Toast ──────────────────────────────────────────────────────

  const showToast = useCallback((type: ToastType, message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // ─── OTA Import ────────────────────────────────────────────────

  const handleOtaImport = useCallback(async () => {
    const el = document.getElementById("vf-ota-import-url") as HTMLInputElement | null;
    const url = el?.value?.trim();
    if (!url) {
      showToast("error", "Veuillez coller l'URL de votre annonce");
      return;
    }

    setImporting(true);
    showToast(null, "");

    try {
      const res = await fetch("/api/import-airbnb", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, useAi: importUseAi }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Échec de l'import");
      }

      const data = await res.json();
      let count = 0;

      const setVal = (id: string, val: string) => {
        const input = document.getElementById(id) as HTMLInputElement | HTMLTextAreaElement | null;
        if (input) { input.value = val; count++; }
      };

      const fill = (id: string, val: unknown) => {
        if (val != null && val !== "") {
          setVal(id, Array.isArray(val) ? val.join(", ") : String(val));
        }
      };

      fill("vf-name", data.name);
      fill("vf-desc", data.description);
      fill("vf-location", data.location);
      fill("vf-capacity", data.capacity);
      fill("vf-bathrooms", data.bathrooms_count ?? data.bathrooms);
      fill("vf-surface", data.surface_m2 ?? data.surface);
      fill("vf-latitude", data.latitude);
      fill("vf-longitude", data.longitude);
      fill("vf-equipment-interior", data.equipment_interior ?? data.amenities);
      fill("vf-equipment-exterior", data.equipment_exterior);
      fill("vf-included-home", data.included_services_home);
      fill("vf-included-collection", data.included_services_collection);
      fill("vf-a-la-carte", data.a_la_carte_services);
      fill("vf-house-rules", data.house_rules);
      fill("vf-safety-info", data.safety_info);
      fill("vf-cancellation-policy", data.cancellation_policy);
      fill("vf-checkin", data.check_in_time);
      fill("vf-checkout", data.check_out_time);
      fill("vf-environment", data.environment);
      fill("vf-nearby-points", data.nearby_points);
      fill("vf-wifi-name", data.wifi_name);
      fill("vf-wifi-password", data.wifi_password);
      fill("vf-checkout-instructions", data.checkout_instructions);
      fill("vf-rooms-details", data.rooms_details ? JSON.stringify(data.rooms_details, null, 2) : null);
      fill("vf-seasonal-prices", data.seasonal_prices ? JSON.stringify(data.seasonal_prices, null, 2) : null);
      fill("vf-booking-terms", data.booking_terms ? JSON.stringify(data.booking_terms, null, 2) : null);
      fill("vf-emergency-contacts", data.emergency_contacts ? JSON.stringify(data.emergency_contacts, null, 2) : null);

      // Photos
      const photos = data.image_urls?.length ? data.image_urls : data.image_url ? [data.image_url] : [];
      if (photos.length) { photosRef.current = photos; count++; }

      // Remplir aussi le champ URL Airbnb dans le form
      if (data.airbnb_url) setVal("vf-airbnb", data.airbnb_url);

      showToast("success", `Import réussi — ${count} champs remplis`);
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Échec de l'import");
    } finally {
      setImporting(false);
    }
  }, [showToast, importUseAi]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    showToast(null, "");

    try {
      // Collect all form field values
      const textFields = [
        "vf-name", "vf-location", "vf-airbnb", "vf-map-embed",
        "vf-checkin", "vf-checkout", "vf-desc",
        "vf-house-rules", "vf-safety-info", "vf-cancellation-policy",
        "vf-environment", "vf-checkout-instructions",
        "vf-wifi-name", "vf-wifi-password",
      ];

      const numberFields: [string, number][] = [
        ["vf-price", 0], ["vf-capacity", 1], ["vf-bedrooms", 0],
        ["vf-bathrooms", 0], ["vf-surface", 0], ["vf-min-nights", 1],
      ];

      const floatFields = ["vf-latitude", "vf-longitude"];

      const payload: Record<string, unknown> = {};

      // Text fields
      const textMap: Record<string, string> = {
        name: "name", location: "location", airbnb: "airbnb_url",
        "map-embed": "map_embed_url", checkin: "check_in_time",
        checkout: "check_out_time", desc: "description",
        "house-rules": "house_rules", "safety-info": "safety_info",
        "cancellation-policy": "cancellation_policy",
        environment: "environment",
        "checkout-instructions": "checkout_instructions",
        "wifi-name": "wifi_name", "wifi-password": "wifi_password",
      };

      textFields.forEach((id) => {
        const el = document.getElementById(id) as HTMLInputElement | HTMLTextAreaElement | null;
        if (!el) return;
        const key = id.replace("vf-", "");
        const mapped = textMap[key];
        if (mapped) payload[mapped] = el.value;
      });

      // Number fields
      const numMap: Record<string, string> = {
        price: "price_per_night", capacity: "capacity",
        bedrooms: "bedrooms", bathrooms: "bathrooms_count",
        surface: "surface_m2", "min-nights": "min_nights",
      };
      numberFields.forEach(([id, def]) => {
        const el = document.getElementById(id) as HTMLInputElement | null;
        if (!el) return;
        const key = id.replace("vf-", "");
        const mapped = numMap[key];
        if (mapped) payload[mapped] = Number(el.value) || def;
      });

      // Float fields
      floatFields.forEach((id) => {
        const el = document.getElementById(id) as HTMLInputElement | null;
        if (!el) return;
        const key = id.replace("vf-", "").replace("-", "_");
        payload[key] = el.value ? Number(el.value) : null;
      });

      // ChipEditor fields from formRef
      const chipFields: [string, string][] = [
        ["equipment_interior", "equipment_interior"],
        ["equipment_exterior", "equipment_exterior"],
        ["included_services_home", "included_services_home"],
        ["included_services_collection", "included_services_collection"],
        ["a_la_carte_services", "a_la_carte_services"],
        ["house_rules", "house_rules"],
        ["safety_info", "safety_info"],
        ["nearby_points", "nearby_points"],
      ];
      chipFields.forEach(([key, mapped]) => {
        const val = formRef.current[key];
        if (Array.isArray(val)) payload[mapped] = val;
      });

      // Structured editor fields from formRef
      if (formRef.current.emergency_contacts) {
        payload.emergency_contacts = formRef.current.emergency_contacts;
      }
      if (formRef.current.rooms_details) {
        payload.rooms_details = formRef.current.rooms_details;
      }
      if (formRef.current.seasonal_prices) {
        payload.seasonal_prices = formRef.current.seasonal_prices;
      }

      // Booking terms from structured inputs
      const depositEl = document.getElementById("vf-deposit-percent") as HTMLInputElement | null;
      const noticeEl = document.getElementById("vf-checkin-notice") as HTMLInputElement | null;
      const minAgeEl = document.getElementById("vf-min-age") as HTMLInputElement | null;
      if (depositEl || noticeEl || minAgeEl) {
        payload.booking_terms = {
          deposit_percent: depositEl?.value ? Number(depositEl.value) : undefined,
          checkin_notice_hours: noticeEl?.value ? Number(noticeEl.value) : undefined,
          min_age: minAgeEl?.value ? Number(minAgeEl.value) : undefined,
        };
      }

      // Cancellation policy — prefer custom textarea, fallback to select
      const cancelSelect = document.getElementById("vf-cancellation-policy") as HTMLSelectElement | null;
      const cancelCustom = document.getElementById("vf-cancellation-policy-custom") as HTMLTextAreaElement | null;
      if (cancelCustom?.value?.trim()) {
        payload.cancellation_policy = cancelCustom.value.trim();
      } else if (cancelSelect?.value) {
        payload.cancellation_policy = cancelSelect.value;
      }

      // Cancellation template & notes
      payload.cancellation_template = cancelTemplate;
      payload.cancellation_notes = cancelNotes.trim() || null;

      // Include photos from refs (managed by wrapper components)
      payload.image_urls = photosRef.current;
      payload.image_url = photosRef.current[0] || null;

      const res = await fetch(
        isCreate ? "/api/dashboard/create-villa" : "/api/dashboard/update-villa",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            isCreate ? { payload } : { villaId: villa.id, payload }
          ),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erreur lors de la sauvegarde");
      }

      if (isCreate) {
        const newId = data?.data?.id as string | undefined;
        showToast("success", "Villa créée avec succès");
        if (newId) {
          router.push(`/dashboard/villas/${newId}`);
        } else {
          router.refresh();
        }
      } else {
        showToast("success", "Villa mise à jour avec succès");
        router.refresh();
      }
    } catch (err) {
      showToast(
        "error",
        err instanceof Error ? err.message : "Erreur lors de la sauvegarde"
      );
    } finally {
      setSaving(false);
    }
  }, [isCreate, villa.id, router, showToast, cancelTemplate, cancelNotes]);

  const handleBookletUpload = async (file: File) => {
    if (file.type !== 'application/pdf') {
      showToast('error', 'Fichier PDF uniquement');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showToast('error', 'Taille maximum 10 Mo');
      return;
    }
    setBookletUploading(true);
    const supabase = getSupabaseBrowser();
    if (!supabase) { setBookletUploading(false); return; }

    const filePath = `${villa.id}/booklet.pdf`;
    const { error } = await supabase.storage
      .from('welcome-booklets')
      .upload(filePath, file, { upsert: true });

    if (error) {
      showToast('error', 'Erreur lors de l\'upload du livret');
    } else {
      setBookletUrl(filePath);
      await supabase
        .from('villas')
        .update({ welcome_booklet_url: filePath })
        .eq('id', villa.id as string);
      showToast('success', 'Livret mis à jour');
    }
    setBookletUploading(false);
  };

  return (
    <>
      {/* Toast */}
      {toast && (
        <div
          className={`fixed right-6 top-6 z-50 flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium shadow-lg transition-all ${
            toast.type === "success"
              ? "bg-emerald-600 text-white"
              : "bg-red-600 text-white"
          }`}
        >
          {toast.type === "success" ? (
            <Check className="h-4 w-4" aria-hidden />
          ) : null}
          {toast.message}
        </div>
      )}

      {/* Carte Import Magique OTA */}
      <div className="rounded-[32px] border border-navy/5 bg-white p-8 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-gold">
            Import annonce (OTA)
          </h4>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold/10 text-gold">
            <Wand2 size={16} />
          </div>
        </div>

        <p className="text-xs text-navy/80 leading-relaxed mb-6">
          Collez le lien public de votre fiche (Airbnb, Booking, Abritel, etc.).
          Les métadonnées et le texte de page sont analysés ; optionnellement,
          l'IA complète les champs encore vides.
        </p>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest font-bold text-navy/55" htmlFor="vf-ota-import-url">
              URL de l'annonce
            </label>
            <Input
              id="vf-ota-import-url"
              defaultValue={(villa.airbnb_url as string) || ""}
              placeholder="https://www.airbnb.com/rooms/… ou booking.com/hotel/…"
              className="rounded-xl"
            />
          </div>

          <label className="flex cursor-pointer items-start gap-3 text-left">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 rounded border-navy/25 text-gold focus:ring-gold"
              checked={importUseAi}
              onChange={(e) => setImportUseAi(e.target.checked)}
            />
            <span className="text-xs leading-relaxed text-navy/70">
              Compléter avec l'IA les informations manquantes (après extraction automatique).
            </span>
          </label>

          <button
            type="button"
            onClick={handleOtaImport}
            disabled={importing}
            className="w-full rounded-xl bg-navy text-white hover:bg-gold hover:text-navy transition-all h-12 font-bold uppercase tracking-widest text-[10px] gap-2 inline-flex items-center justify-center disabled:opacity-50"
          >
            {importing ? (
              <><RefreshCw size={14} className="animate-spin" /> Importation...</>
            ) : (
              <><Wand2 size={14} /> Importer les détails</>
            )}
          </button>
        </div>
      </div>

      {/* Form fields */}
      <div className="space-y-8">
        <VillaFormFields form={villa} onChange={(key, value) => { formRef.current[key] = value; }} />
      </div>

      {/* Section — Conditions d'annulation */}
      <section className="rounded-xl border border-navy/10 bg-white p-5">
        <h3 className="mb-4 text-sm font-semibold text-navy">Conditions d&apos;annulation</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          {(Object.entries(CANCELLATION_TEMPLATES) as [CancellationTemplate, typeof CANCELLATION_TEMPLATES[CancellationTemplate]][]).map(([key, tpl]) => (
            <button
              key={key}
              type="button"
              onClick={() => setCancelTemplate(key)}
              className={[
                "rounded-lg border p-3 text-left transition-all",
                cancelTemplate === key
                  ? "border-gold/50 bg-gold/[0.08]"
                  : "border-navy/10 bg-white hover:border-navy/20",
              ].join(' ')}
            >
              <span className="block text-sm font-semibold text-navy">{tpl.label}</span>
              <span className="mt-0.5 block text-xs text-navy/80">{tpl.summary}</span>
            </button>
          ))}
        </div>
        <p className="mt-3 rounded-lg bg-offwhite px-3 py-2 text-xs text-navy/70">
          {CANCELLATION_TEMPLATES[cancelTemplate].full}
        </p>
        <div className="mt-3">
          <label className="block text-xs font-medium text-navy/70 mb-1">
            Remarques additionnelles (optionnel, max 500 caractères)
          </label>
          <textarea
            value={cancelNotes}
            onChange={(e) => setCancelNotes(e.target.value.slice(0, 500))}
            rows={3}
            className="w-full rounded-lg border border-navy/10 bg-white px-3 py-2 text-sm text-navy focus:border-gold/50 focus:outline-none resize-none"
            placeholder="Ex. : Remboursement sous 5 jours ouvrés après annulation…"
          />
          <p className="mt-1 text-right text-xs text-navy/40">{cancelNotes.length}/500</p>
        </div>
      </section>

      {/* Section — Livret d'accueil (édition uniquement : nécessite une villa existante) */}
      {!isCreate && (
      <section className="rounded-xl border border-navy/10 bg-white p-5">
        <h3 className="mb-4 text-sm font-semibold text-navy">Livret d&apos;accueil</h3>
        {bookletUrl ? (
          <div className="flex items-center gap-3 rounded-lg border border-navy/10 bg-offwhite px-4 py-3">
            <span className="flex-1 text-sm text-navy">📎 booklet.pdf</span>
            <button
              type="button"
              onClick={async () => {
                const supabase = getSupabaseBrowser();
                if (!supabase) return;
                await supabase.storage.from('welcome-booklets').remove([`${villa.id}/booklet.pdf`]);
                await supabase.from('villas').update({ welcome_booklet_url: null }).eq('id', villa.id as string);
                setBookletUrl(null);
              }}
              className="text-xs text-red-500 hover:underline"
            >
              Supprimer
            </button>
          </div>
        ) : (
          <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-navy/20 py-8 hover:border-gold/40 transition-colors">
            <span className="text-sm text-navy/50">
              {bookletUploading ? 'Envoi en cours…' : 'Glissez un PDF ou cliquez (max 10 Mo)'}
            </span>
            <input
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleBookletUpload(f);
              }}
            />
          </label>
        )}
      </section>
      )}

      {/* Save button */}
      <div className="sticky bottom-0 -mx-6 mt-8 border-t border-border-subtle bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <p className="text-xs text-navy/80">
            {isCreate
              ? "La villa sera créée, puis vous pourrez ajouter les photos et le livret."
              : "Les modifications seront appliquées immédiatement."}
          </p>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-navy px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-navy/90 disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                {isCreate ? "Création..." : "Sauvegarde..."}
              </>
            ) : (
              <>
                <Save className="h-4 w-4" aria-hidden />
                {isCreate ? "Créer la villa" : "Enregistrer les modifications"}
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
}
