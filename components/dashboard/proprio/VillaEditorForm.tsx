"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Save, Wand2, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { VillaFormFields } from "@/components/dashboard/villa-editor/VillaFormFields";

interface VillaEditorFormProps {
  villa: Record<string, unknown>;
  photosRef?: React.MutableRefObject<string[]>;
}

type ToastType = "success" | "error" | null;

export function VillaEditorForm({ villa, photosRef: externalPhotosRef }: VillaEditorFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importUseAi, setImportUseAi] = useState(false);
  const [toast, setToast] = useState<{ type: ToastType; message: string } | null>(null);
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
        ["vf-price", 0], ["vf-capacity", 1], ["vf-bathrooms", 0],
        ["vf-surface", 0], ["vf-min-nights", 1],
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
        bathrooms: "bathrooms_count", surface: "surface_m2",
        "min-nights": "min_nights",
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

      // Include photos from refs (managed by wrapper components)
      payload.image_urls = photosRef.current;
      payload.image_url = photosRef.current[0] || null;

      const res = await fetch("/api/dashboard/update-villa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          villaId: villa.id,
          payload,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erreur lors de la sauvegarde");
      }

      showToast("success", "Villa mise à jour avec succès");
      router.refresh();
    } catch (err) {
      showToast(
        "error",
        err instanceof Error ? err.message : "Erreur lors de la sauvegarde"
      );
    } finally {
      setSaving(false);
    }
  }, [villa.id, router, showToast]);

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
          <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-gold">
            Import annonce (OTA)
          </h4>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold/10 text-gold">
            <Wand2 size={16} />
          </div>
        </div>

        <p className="text-xs text-navy/60 leading-relaxed mb-6">
          Collez le lien public de votre fiche (Airbnb, Booking, Abritel, etc.).
          Les métadonnées et le texte de page sont analysés ; optionnellement,
          l'IA complète les champs encore vides.
        </p>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest font-bold text-navy/40" htmlFor="vf-ota-import-url">
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

      {/* Save button */}
      <div className="sticky bottom-0 -mx-6 mt-8 border-t border-border-subtle bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted">
            Les modifications seront appliquées immédiatement.
          </p>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-navy-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-navy-800 disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Sauvegarde...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" aria-hidden />
                Enregistrer les modifications
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
}
