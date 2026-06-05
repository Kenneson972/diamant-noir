# Prompt Cursor — Restaurer l'Import Magique (OTA)

Tu travailles sur Kayvilla (ex-Diamant Noir). Stack : Next.js 15, TypeScript, Tailwind.

## Objectif

Remplacer le simple bouton "📥 Importer depuis Airbnb" par une **carte d'import magique** multi-plateforme, comme dans l'ancien hub.

---

## À modifier

### 1. `components/dashboard/proprio/VillaEditorForm.tsx`

**Supprimer :** Le bouton actuel (`handleImportAirbnb` + le `<div>` avec le bouton Download).

**Ajouter :** Une carte "Import annonce (OTA)" stylée, AVANT `<VillaFormFields>`.

#### Structure de la carte

```tsx
<div className="rounded-[32px] border border-navy/5 bg-white p-8 shadow-sm">
  {/* En-tête */}
  <div className="flex items-center justify-between mb-6">
    <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-gold">
      Import annonce (OTA)
    </h4>
    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold/10 text-gold">
      <Wand2 size={16} />
    </div>
  </div>

  {/* Description */}
  <p className="text-xs text-navy/60 leading-relaxed mb-6">
    Collez le lien public de votre fiche (Airbnb, Booking, Abritel, etc.).
    Les métadonnées et le texte de page sont analysés ; optionnellement,
    l'IA complète les champs encore vides.
  </p>

  <div className="space-y-4">
    {/* Champ URL */}
    <div className="space-y-2">
      <label className="text-[10px] uppercase tracking-widest font-bold text-navy/40">
        URL de l'annonce
      </label>
      <Input
        id="vf-ota-import-url"
        defaultValue={s(form.airbnb_url)}
        placeholder="https://www.airbnb.com/rooms/… ou booking.com/hotel/…"
        className="rounded-xl"
      />
    </div>

    {/* Checkbox IA */}
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

    {/* Bouton */}
    <Button
      onClick={handleOtaImport}
      disabled={importing || !urlValue}
      className="w-full rounded-xl bg-navy text-white hover:bg-gold hover:text-navy transition-all h-12 font-bold uppercase tracking-widest text-[10px] gap-2"
    >
      {importing ? (
        <><RefreshCw size={14} className="animate-spin" /> Importation...</>
      ) : (
        <><Wand2 size={14} /> Importer les détails</>
      )}
    </Button>
  </div>
</div>
```

#### Logique `handleOtaImport`

```tsx
const [importing, setImporting] = useState(false);
const [importUseAi, setImportUseAi] = useState(false);

const handleOtaImport = async () => {
  const el = document.getElementById("vf-ota-import-url") as HTMLInputElement | null;
  const url = el?.value?.trim();
  if (!url) {
    showToast("error", "Veuillez coller l'URL de votre annonce");
    return;
  }

  setImporting(true);
  try {
    const res = await fetch("/api/import-airbnb", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, useAi: importUseAi }),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Échec");

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
};
```

#### Imports à ajouter

```tsx
import { Wand2, RefreshCw } from "lucide-react";
```

Import à supprimer : `Download` (plus utilisé par le bouton d'import).

**Note :** Le champ `vf-airbnb` existe déjà dans `VillaFormFields`. L'URL OTA lue dans la carte d'import utilise un champ SÉPARÉ (`vf-ota-import-url`) pour éviter les conflits. Une fois l'import réussi, on remplit aussi `vf-airbnb` si l'API retourne une URL Airbnb.

---

## Icônes à vérifier

- `Wand2` = baguette magique (lucide-react, déjà installé)
- `RefreshCw` = spinner pour le loading

---

## Règles

- Utiliser les composants UI existants (`Input`, `Button` depuis `@/components/ui`)
- Classes Tailwind cohérentes avec le thème (gold, navy, muted, border-navy/5)
- Ne pas toucher à `VillaFormFields.tsx`
- Le champ URL Airbnb dans VillaFormFields (`vf-airbnb`) reste inchangé
- La carte d'import se place au-dessus du form, dans le même `space-y-8`
- Garder `handleSave` intact (ne pas toucher)
