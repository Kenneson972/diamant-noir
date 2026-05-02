"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Save } from "lucide-react";
import { VillaFormFields } from "@/components/dashboard/villa-editor/VillaFormFields";
import { VillaAmenitiesEditorWrapper } from "@/components/dashboard/villa-editor/VillaAmenitiesEditorWrapper";

interface VillaEditorFormProps {
  villa: Record<string, unknown>;
}

type ToastType = "success" | "error" | null;

export function VillaEditorForm({ villa }: VillaEditorFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: ToastType; message: string } | null>(null);

  const showToast = useCallback((type: ToastType, message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    showToast(null, "");

    try {
      // Collect all form field values
      const fields = [
        "vf-name",
        "vf-location",
        "vf-price",
        "vf-capacity",
        "vf-bathrooms",
        "vf-surface",
        "vf-checkin",
        "vf-checkout",
        "vf-desc",
        "vf-airbnb",
      ];

      const payload: Record<string, unknown> = {};

      fields.forEach((id) => {
        const el = document.getElementById(id) as
          | HTMLInputElement
          | HTMLTextAreaElement
          | null;
        if (!el) return;

        const key = id.replace("vf-", "");
        const value = el.value;

        switch (key) {
          case "name":
            payload.name = value;
            break;
          case "location":
            payload.location = value;
            break;
          case "price":
            payload.price_per_night = Number(value) || 0;
            break;
          case "capacity":
            payload.capacity = Number(value) || 1;
            break;
          case "bathrooms":
            payload.bathrooms_count = Number(value) || 0;
            break;
          case "surface":
            payload.surface_m2 = Number(value) || 0;
            break;
          case "checkin":
            payload.check_in_time = value;
            break;
          case "checkout":
            payload.check_out_time = value;
            break;
          case "desc":
            payload.description = value;
            break;
          case "airbnb":
            payload.airbnb_url = value;
            break;
        }
      });

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

      {/* Form fields */}
      <div className="space-y-8">
        <VillaFormFields form={villa} onChange={() => {}} />

        <VillaAmenitiesEditorWrapper
          villaId={villa.id as string}
          initialAmenities={(villa.amenities ?? []) as string[]}
        />
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
