"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Save, Download } from "lucide-react";
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
  const [toast, setToast] = useState<{ type: ToastType; message: string } | null>(null);
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

  // ─── Airbnb import ──────────────────────────────────────────────

  const handleImportAirbnb = useCallback(async () => {
    const el = document.getElementById("vf-airbnb") as HTMLInputElement | null;
    const url = el?.value?.trim();
    if (!url) {
      showToast("error", "Veuillez entrer une URL Airbnb");
      return;
    }

    setImporting(true);
    showToast(null, "");

    try {
      const res = await fetch("/api/import-airbnb", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Échec de l'import" }));
        throw new Error(err.error || "Échec de l'import");
      }

      const data = await res.json();
      const setVal = (id: string, val: string) => {
        const input = document.getElementById(id) as HTMLInputElement | HTMLTextAreaElement | null;
        if (input) input.value = val;
      };

      let filledCount = 0;
      const fill = (id: string, val: unknown) => {
        if (val != null && val !== "") {
          setVal(id, Array.isArray(val) ? val.join(", ") : String(val));
          filledCount++;
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
      fill("vf-house-rules", data.house_rules);
      fill("vf-checkin", data.check_in_time);
      fill("vf-checkout", data.check_out_time);

      // Fill photos ref
      const photos: string[] = data.image_urls?.length
        ? data.image_urls
        : data.image_url ? [data.image_url] : [];
      if (photos.length > 0) {
        photosRef.current = photos;
        filledCount++;
      }

      showToast("success", `Import réussi — ${filledCount} champs remplis`);
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Échec de l'import");
    } finally {
      setImporting(false);
    }
  }, [showToast]);

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

      const tagsFields = [
        "vf-equipment-interior", "vf-equipment-exterior",
        "vf-included-home", "vf-included-collection",
        "vf-a-la-carte", "vf-nearby-points",
      ];

      const jsonFields = [
        "vf-booking-terms", "vf-emergency-contacts",
        "vf-rooms-details", "vf-seasonal-prices",
      ];

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

      // Tags fields (comma-separated → array)
      const tagsMap: Record<string, string> = {
        "equipment-interior": "equipment_interior",
        "equipment-exterior": "equipment_exterior",
        "included-home": "included_services_home",
        "included-collection": "included_services_collection",
        "a-la-carte": "a_la_carte_services",
        "nearby-points": "nearby_points",
      };
      tagsFields.forEach((id) => {
        const el = document.getElementById(id) as HTMLInputElement | null;
        if (!el) return;
        const key = id.replace("vf-", "");
        const mapped = tagsMap[key];
        const raw = el.value.trim();
        if (mapped) payload[mapped] = raw ? raw.split(",").map((s) => s.trim()).filter(Boolean) : [];
      });

      // JSON fields
      const jsonMap: Record<string, string> = {
        "booking-terms": "booking_terms",
        "emergency-contacts": "emergency_contacts",
        "rooms-details": "rooms_details",
        "seasonal-prices": "seasonal_prices",
      };
      jsonFields.forEach((id) => {
        const el = document.getElementById(id) as HTMLTextAreaElement | null;
        if (!el) return;
        const key = id.replace("vf-", "");
        const mapped = jsonMap[key];
        try {
          if (mapped) payload[mapped] = el.value.trim() ? JSON.parse(el.value) : null;
        } catch {
          if (mapped) payload[mapped] = el.value; // keep as string if invalid JSON
        }
      });

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

      {/* Import Airbnb button */}
      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={handleImportAirbnb}
          disabled={importing}
          className="inline-flex items-center gap-2 rounded-xl border border-gold/30 bg-gold/5 px-4 py-2.5 text-sm font-medium text-gold transition-colors hover:bg-gold/10 disabled:opacity-50"
        >
          {importing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Import en cours...
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              Importer depuis Airbnb
            </>
          )}
        </button>
      </div>

      {/* Form fields */}
      <div className="space-y-8">
        <VillaFormFields form={villa} onChange={() => {}} />
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
