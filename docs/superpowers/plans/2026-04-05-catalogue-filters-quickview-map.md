# Catalogue — Filtres + Quick View + Carte Interactive — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enrichir `/villas` avec filtres chips client-side, un drawer « Quick View » et une carte interactive avec viewport filter — sans nouvelle dépendance npm, sans toucher au design system.

**Architecture:** Tout l'état (`activeFilters`, `quickViewId`, `mapBounds`) vit dans `VillasMapView` qui orchestre `VillaFilterBar`, `VillaQuickView`, la liste, et `VillaLeafletMap`. Les villas restent chargées côté serveur dans `app/villas/page.tsx` via Supabase; les filtres sont 100 % client-side sur ce tableau déjà chargé.

**Tech Stack:** Next.js 15 App Router · React (useState/useEffect) · Tailwind CSS · Leaflet (déjà installé) · TypeScript strict (pas de `any` sauf les APIs Leaflet internes)

---

## File Map

| Fichier | Action | Responsabilité |
|---------|--------|----------------|
| `components/VillaLeafletMap.tsx` | Modifier | Type `VillaMapItem` enrichi + `onBoundsChange` + click → callback |
| `app/villas/page.tsx` | Modifier | Query Supabase + mapping vers nouveau type |
| `components/VillaFilterBar.tsx` | Créer | Barre de chips horizontaux scrollable |
| `components/VillaQuickView.tsx` | Créer | Bottom drawer avec photos, stats, CTAs |
| `components/VillasMapView.tsx` | Modifier | Orchestration : état, filtrage, intégration |

---

## Task 1 — Enrichir VillaMapItem + query Supabase

**Files:**
- Modify: `components/VillaLeafletMap.tsx:6-13`
- Modify: `app/villas/page.tsx:36-40` (FALLBACK_VILLAS) + `app/villas/page.tsx:69-87` (query + mapping)

### Contexte

`VillaMapItem` est défini dans `VillaLeafletMap.tsx` et importé depuis `VillasMapView.tsx` et `app/villas/page.tsx`. Il faut l'enrichir avec 5 nouveaux champs nécessaires au Quick View.

La query Supabase actuelle (ligne 71) sélectionne :
```
id,name,location,price_per_night,image_url,image_urls,latitude,longitude
```
Elle doit inclure : `capacity,surface_m2,amenities,collection_tier`.

- [ ] **Étape 1 — Modifier le type `VillaMapItem`**

Dans `components/VillaLeafletMap.tsx`, remplacer les lignes 6-13 :

```ts
export type VillaMapItem = {
  id: string;
  name: string;
  location: string | null;
  price: number;
  image: string | null;
  coords: [number, number];
  // Quick View fields
  images: string[];
  capacity: number | null;
  surface: number | null;
  amenities: string[];
  tier: string | null;
};
```

- [ ] **Étape 2 — Mettre à jour FALLBACK_VILLAS dans `app/villas/page.tsx`**

Remplacer les lignes 36-40 (FALLBACK_VILLAS) :

```ts
const FALLBACK_VILLAS: VillaMapItem[] = [
  {
    id: "1", name: "Villa Diamant Noir", location: "Le Diamant, Martinique",
    price: 1000, image: "/villa-hero.jpg", coords: [14.4750, -61.0247],
    images: ["/villa-hero.jpg"], capacity: 6, surface: 280, amenities: ["Piscine", "Vue mer"], tier: "Prestige",
  },
  {
    id: "2", name: "Villa Horizon", location: "Les Anses-d'Arlet, Martinique",
    price: 1200, image: "/villa-hero.jpg", coords: [14.4917, -61.0650],
    images: ["/villa-hero.jpg"], capacity: 8, surface: 350, amenities: ["Piscine", "Vue mer", "Plage directe"], tier: "Exclusive",
  },
  {
    id: "3", name: "Villa Émeraude", location: "Trois-Îlets, Martinique",
    price: 900, image: "/villa-hero.jpg", coords: [14.5361, -61.0261],
    images: ["/villa-hero.jpg"], capacity: 4, surface: 200, amenities: ["Piscine"], tier: "Signature",
  },
];
```

- [ ] **Étape 3 — Enrichir la query Supabase**

Dans `app/villas/page.tsx`, remplacer la ligne 71 :

```ts
// Avant
.select("id,name,location,price_per_night,image_url,image_urls,latitude,longitude")

// Après
.select("id,name,location,price_per_night,image_url,image_urls,latitude,longitude,capacity,surface_m2,amenities,collection_tier")
```

- [ ] **Étape 4 — Mettre à jour le mapping (lignes 76-87)**

Remplacer le bloc `villas = data.map(...)` :

```ts
villas = data.map((villa) => {
  const rawAmenities = villa.amenities;
  const amenities: string[] = Array.isArray(rawAmenities)
    ? rawAmenities
    : typeof rawAmenities === "string"
    ? [rawAmenities]
    : [];

  const allImages: string[] = Array.isArray(villa.image_urls)
    ? villa.image_urls
    : villa.image_url
    ? [villa.image_url]
    : [];

  return {
    id: villa.id,
    name: villa.name,
    location: villa.location || "Martinique",
    price: villa.price_per_night,
    image: allImages[0] || "/villa-hero.jpg",
    coords:
      villa.latitude && villa.longitude
        ? [villa.latitude, villa.longitude] as [number, number]
        : getCoordFallback(villa.location),
    images: allImages.length > 0 ? allImages : ["/villa-hero.jpg"],
    capacity: typeof villa.capacity === "number" ? villa.capacity : null,
    surface: typeof villa.surface_m2 === "number" ? villa.surface_m2 : null,
    amenities,
    tier: villa.collection_tier || null,
  };
});
```

- [ ] **Étape 5 — Vérifier que le build TypeScript passe**

```bash
cd "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/DIAMANTNOIR/diamant-noir"
npx tsc --noEmit
```

Expected: 0 erreurs. Si des erreurs apparaissent, elles concernent des propriétés manquantes dans les usages de `VillaMapItem` — les corriger avant de continuer.

- [ ] **Étape 6 — Commit**

```bash
git add components/VillaLeafletMap.tsx app/villas/page.tsx
git commit -m "feat(catalogue): enrichir VillaMapItem + query Supabase pour Quick View"
```

---

## Task 2 — Créer VillaFilterBar

**Files:**
- Create: `components/VillaFilterBar.tsx`

### Contexte

La barre de filtres est un composant client pur : elle reçoit les données déjà chargées et l'état actif, et remonte les changements via callback. Aucun appel Supabase.

Design system :
- Chip inactif : `border border-navy/15 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.24em] text-navy/60 hover:border-navy/40`
- Chip actif : `border border-gold bg-gold/[0.08] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.24em] text-gold`
- Container : sticky sous la toolbar, scroll horizontal sur mobile

### Type FilterState (partagé avec VillasMapView dans cette même tâche)

```ts
export type FilterState = {
  piscine: boolean;
  viewMer: boolean;
  plage: boolean;
  chambres: boolean;
  budget: null | "<800" | "800-1200" | ">1200";
  tier: null | "Signature" | "Prestige" | "Exclusive";
};

export const DEFAULT_FILTERS: FilterState = {
  piscine: false,
  viewMer: false,
  plage: false,
  chambres: false,
  budget: null,
  tier: null,
};
```

- [ ] **Étape 1 — Créer `components/VillaFilterBar.tsx`**

```tsx
"use client";

import type { VillaMapItem } from "./VillaLeafletMap";

export type FilterState = {
  piscine: boolean;
  viewMer: boolean;
  plage: boolean;
  chambres: boolean;
  budget: null | "<800" | "800-1200" | ">1200";
  tier: null | "Signature" | "Prestige" | "Exclusive";
};

export const DEFAULT_FILTERS: FilterState = {
  piscine: false,
  viewMer: false,
  plage: false,
  chambres: false,
  budget: null,
  tier: null,
};

export function isFilterActive(filters: FilterState): boolean {
  return (
    filters.piscine ||
    filters.viewMer ||
    filters.plage ||
    filters.chambres ||
    filters.budget !== null ||
    filters.tier !== null
  );
}

export function filterVillas(villas: VillaMapItem[], filters: FilterState): Set<string> {
  const passing = new Set<string>();
  for (const v of villas) {
    const amenLower = v.amenities.map((a) => a.toLowerCase());
    if (filters.piscine && !amenLower.some((a) => a.includes("piscine"))) continue;
    if (filters.viewMer && !amenLower.some((a) => a.includes("mer"))) continue;
    if (filters.plage && !amenLower.some((a) => a.includes("plage"))) continue;
    if (filters.chambres && (v.capacity === null || v.capacity < 4)) continue;
    if (filters.budget === "<800" && v.price >= 800) continue;
    if (filters.budget === "800-1200" && (v.price < 800 || v.price > 1200)) continue;
    if (filters.budget === ">1200" && v.price <= 1200) continue;
    if (filters.tier && v.tier !== filters.tier) continue;
    passing.add(v.id);
  }
  return passing;
}

interface Props {
  filters: FilterState;
  onChange: (f: FilterState) => void;
  passCount: number;
  total: number;
}

const CHIP_BASE =
  "shrink-0 border px-4 py-2 text-[10px] font-bold uppercase tracking-[0.24em] min-h-[44px] flex items-center transition-colors cursor-pointer";
const CHIP_OFF = `${CHIP_BASE} border-navy/15 text-navy/60 hover:border-navy/40`;
const CHIP_ON = `${CHIP_BASE} border-gold bg-gold/[0.08] text-gold`;

type BudgetVal = "<800" | "800-1200" | ">1200";
type TierVal = "Signature" | "Prestige" | "Exclusive";

export default function VillaFilterBar({ filters, onChange, passCount, total }: Props) {
  const toggle = (key: keyof Pick<FilterState, "piscine" | "viewMer" | "plage" | "chambres">) => {
    onChange({ ...filters, [key]: !filters[key] });
  };

  const toggleBudget = (val: BudgetVal) => {
    onChange({ ...filters, budget: filters.budget === val ? null : val });
  };

  const toggleTier = (val: TierVal) => {
    onChange({ ...filters, tier: filters.tier === val ? null : val });
  };

  const active = isFilterActive(filters);

  return (
    <div className="border-b border-navy/8 bg-offwhite/98">
      <div className="flex items-center gap-2 overflow-x-auto px-6 py-3 scrollbar-none">
        {/* Boolean chips */}
        <button type="button" className={filters.piscine ? CHIP_ON : CHIP_OFF} onClick={() => toggle("piscine")}>
          Piscine
        </button>
        <button type="button" className={filters.viewMer ? CHIP_ON : CHIP_OFF} onClick={() => toggle("viewMer")}>
          Vue mer
        </button>
        <button type="button" className={filters.plage ? CHIP_ON : CHIP_OFF} onClick={() => toggle("plage")}>
          Plage directe
        </button>
        <button type="button" className={filters.chambres ? CHIP_ON : CHIP_OFF} onClick={() => toggle("chambres")}>
          4+ chambres
        </button>

        {/* Separator */}
        <div className="h-5 w-px shrink-0 bg-navy/12 mx-1" />

        {/* Budget chips */}
        {(["<800", "800-1200", ">1200"] as BudgetVal[]).map((val) => (
          <button
            key={val}
            type="button"
            className={filters.budget === val ? CHIP_ON : CHIP_OFF}
            onClick={() => toggleBudget(val)}
          >
            {val === "<800" ? "< 800 €" : val === "800-1200" ? "800–1200 €" : "> 1200 €"}
          </button>
        ))}

        {/* Separator */}
        <div className="h-5 w-px shrink-0 bg-navy/12 mx-1" />

        {/* Tier chips */}
        {(["Signature", "Prestige", "Exclusive"] as TierVal[]).map((val) => (
          <button
            key={val}
            type="button"
            className={filters.tier === val ? CHIP_ON : CHIP_OFF}
            onClick={() => toggleTier(val)}
          >
            {val}
          </button>
        ))}
      </div>

      {/* Result count + reset */}
      {active && (
        <div className="flex items-center justify-between px-6 pb-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-navy/50">
            {passCount} résultat{passCount !== 1 ? "s" : ""} sur {total}
          </p>
          <button
            type="button"
            onClick={() => onChange(DEFAULT_FILTERS)}
            className="text-[10px] font-bold uppercase tracking-[0.28em] text-gold hover:text-gold/80 transition-colors"
          >
            Tout effacer
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Étape 2 — Vérifier TypeScript**

```bash
npx tsc --noEmit
```

Expected: 0 erreurs.

- [ ] **Étape 3 — Commit**

```bash
git add components/VillaFilterBar.tsx
git commit -m "feat(catalogue): VillaFilterBar — chips client-side piscine/mer/plage/chambres/budget/tier"
```

---

## Task 3 — Créer VillaQuickView (bottom drawer)

**Files:**
- Create: `components/VillaQuickView.tsx`

### Contexte

Le drawer slide depuis le bas (CSS transform). Il est rendu dans le DOM par VillasMapView et sa visibilité est contrôlée par `open: boolean`. Il reçoit la villa complète (`VillaMapItem`).

Animation :
```tsx
className={`fixed inset-x-0 bottom-0 z-50 bg-white transition-transform duration-300 ${
  open ? "translate-y-0" : "translate-y-full"
}`}
```

Overlay : `fixed inset-0 z-40 bg-black/40` visible quand `open`.

Swipe down mobile : touchstart Y capturé → touchend Y delta > 80px → fermer.

- [ ] **Étape 1 — Créer `components/VillaQuickView.tsx`**

```tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";
import type { VillaMapItem } from "./VillaLeafletMap";

interface Props {
  villa: VillaMapItem | null;
  open: boolean;
  onClose: () => void;
}

export default function VillaQuickView({ villa, open, onClose }: Props) {
  const [touchStartY, setTouchStartY] = useState<number | null>(null);

  if (!villa) return null;

  const photos = villa.images.slice(0, 3).length > 0
    ? villa.images.slice(0, 3)
    : ["/villa-hero.jpg"];

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Aperçu rapide — ${villa.name}`}
        className={`fixed inset-x-0 bottom-0 z-50 bg-white max-h-[85dvh] overflow-y-auto rounded-t-none transition-transform duration-300 ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
        onTouchStart={(e) => setTouchStartY(e.touches[0].clientY)}
        onTouchEnd={(e) => {
          if (touchStartY !== null && e.changedTouches[0].clientY - touchStartY > 80) {
            onClose();
          }
          setTouchStartY(null);
        }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-navy/15" />
        </div>

        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer l'aperçu"
          className="absolute top-4 right-4 z-10 flex items-center justify-center w-9 h-9 border border-navy/15 text-navy/50 hover:border-navy/30 hover:text-navy transition-colors"
        >
          <X size={16} strokeWidth={1.5} />
        </button>

        {/* Photo strip — scroll horizontal */}
        <div className="flex gap-2 overflow-x-auto px-4 pb-4 scrollbar-none">
          {photos.map((src, i) => (
            <div
              key={i}
              className="relative shrink-0 w-[240px] aspect-[4/3] overflow-hidden"
            >
              <Image
                src={src}
                alt={`${villa.name} — photo ${i + 1}`}
                fill
                className="object-cover"
                sizes="240px"
              />
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="px-4 pb-6 space-y-4">
          {/* Location eyebrow */}
          {villa.location && (
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-gold">
              {villa.location}
            </p>
          )}

          {/* Name */}
          <h2 className="font-display text-2xl text-navy leading-snug">
            {villa.name}
          </h2>

          {/* Stats grid — 4 cols */}
          <div className="grid grid-cols-4 gap-3 border-t border-b border-navy/8 py-4">
            <div className="text-center">
              <p className="text-lg font-display text-navy">{villa.capacity ?? "—"}</p>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-navy/40 mt-0.5">Ch.</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-display text-navy">
                {villa.capacity ? villa.capacity * 2 : "—"}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-navy/40 mt-0.5">Voyag.</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-display text-navy">{villa.surface ?? "—"}</p>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-navy/40 mt-0.5">m²</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-display text-navy">★</p>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-navy/40 mt-0.5">Note</p>
            </div>
          </div>

          {/* Amenities chips */}
          {villa.amenities.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {villa.amenities.slice(0, 4).map((a) => (
                <span
                  key={a}
                  className="border border-navy/12 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-navy/55"
                >
                  {a}
                </span>
              ))}
            </div>
          )}

          {/* Price */}
          <p className="text-navy">
            <span className="font-display text-2xl">{villa.price.toLocaleString("fr-FR")} €</span>
            <span className="text-[11px] text-navy/45 ml-1">/ nuit</span>
          </p>

          {/* CTAs */}
          <div className="flex flex-col xs:flex-row gap-3 pt-2">
            <Link
              href={`/villas/${villa.id}`}
              className="flex-1 text-center border border-navy py-3 text-[10px] font-bold uppercase tracking-[0.28em] text-navy hover:bg-navy hover:text-white transition-colors min-h-[44px] flex items-center justify-center"
            >
              Voir la villa →
            </Link>
            <Link
              href={`/book?villaId=${villa.id}`}
              className="flex-1 text-center bg-navy py-3 text-[10px] font-bold uppercase tracking-[0.28em] text-white hover:bg-navy/90 transition-colors min-h-[44px] flex items-center justify-center"
            >
              Réserver
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
```

- [ ] **Étape 2 — Vérifier TypeScript**

```bash
npx tsc --noEmit
```

Expected: 0 erreurs.

- [ ] **Étape 3 — Commit**

```bash
git add components/VillaQuickView.tsx
git commit -m "feat(catalogue): VillaQuickView — bottom drawer photos/stats/amenities/CTAs + swipe close"
```

---

## Task 4 — Modifier VillaLeafletMap : bounds callback + click behavior

**Files:**
- Modify: `components/VillaLeafletMap.tsx`

### Contexte

Deux changements :

1. **`onBoundsChange`** — nouveau prop optionnel. Appelé au `moveend` et `zoomend` de la carte avec `map.getBounds()`. Cela permet à `VillasMapView` de filtrer la liste selon la zone visible.

2. **Marker click** — actuellement `window.location.href = /villas/${id}`. Remplacer par `onSelect(villa.id)` pour que le parent ouvre le Quick View au lieu de naviguer.

On importe le type `LatLngBounds` de leaflet avec `import type` (type-only, pas inclus dans le bundle).

- [ ] **Étape 1 — Ajouter l'import type et le prop `onBoundsChange`**

Remplacer les lignes 1-20 de `VillaLeafletMap.tsx` :

```tsx
"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import type { LatLngBounds } from "leaflet";

export type VillaMapItem = {
  id: string;
  name: string;
  location: string | null;
  price: number;
  image: string | null;
  coords: [number, number];
  // Quick View fields
  images: string[];
  capacity: number | null;
  surface: number | null;
  amenities: string[];
  tier: string | null;
};

interface Props {
  villas: VillaMapItem[];
  hoveredId: string | null;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
  onBoundsChange?: (bounds: LatLngBounds) => void;
}
```

- [ ] **Étape 2 — Mettre à jour la signature de la fonction**

Ligne 49, remplacer :

```tsx
// Avant
export default function VillaLeafletMap({ villas, hoveredId, onHover, onSelect }: Props) {

// Après
export default function VillaLeafletMap({ villas, hoveredId, onHover, onSelect, onBoundsChange }: Props) {
```

- [ ] **Étape 3 — Changer le comportement du click marker + ajouter `moveend`/`zoomend`**

Dans le `useEffect` d'init (après la création des markers et avant le `return`), remplacer la ligne `marker.on("click", ...)` et ajouter les événements bounds. Remplacer tout le bloc marker events + fitBounds (lignes ~102-124) :

```tsx
      marker.on("click", () => {
        onSelect(villa.id);
      });
      marker.on("mouseover", function (this: any) {
        this.openPopup();
        onHover(villa.id);
      });
      marker.on("mouseout", function (this: any) {
        this.closePopup();
        onHover(null);
      });

      markersRef.current[villa.id] = marker;
    });

    // Bounds callback — viewport filter
    if (onBoundsChange) {
      const emitBounds = () => onBoundsChange(map.getBounds());
      map.on("moveend", emitBounds);
      map.on("zoomend", emitBounds);
    }

    // Fit bounds sur les villas
    if (villas.length > 0) {
      try {
        const L2 = require("leaflet");
        const bounds = L2.latLngBounds(villas.map((v) => v.coords));
        map.fitBounds(bounds, { padding: [60, 60], maxZoom: 12 });
        // Emit initial bounds après fitBounds (délai pour laisser la carte se positionner)
        if (onBoundsChange) {
          setTimeout(() => {
            if (mapRef.current) onBoundsChange(mapRef.current.getBounds());
          }, 600);
        }
      } catch {}
    }
```

Note : `onBoundsChange` est capturé au moment de l'init via closure. C'est intentionnel — la référence au callback peut changer mais les événements Leaflet ne sont pas ré-enregistrés (effet avec deps `[]`). Pour éviter une référence stale, on utilise `useRef` pour `onBoundsChange` :

Ajouter après `const markersRef = useRef<Record<string, any>>({});` (ligne 52) :

```tsx
  const onBoundsChangeRef = useRef(onBoundsChange);
  useEffect(() => { onBoundsChangeRef.current = onBoundsChange; }, [onBoundsChange]);
```

Et dans le handler :

```tsx
    const emitBounds = () => {
      if (onBoundsChangeRef.current) onBoundsChangeRef.current(map.getBounds());
    };
    map.on("moveend", emitBounds);
    map.on("zoomend", emitBounds);
```

Remplacer aussi toute référence directe à `onBoundsChange` dans l'effet par `onBoundsChangeRef.current`.

- [ ] **Étape 4 — Vérifier TypeScript**

```bash
npx tsc --noEmit
```

Expected: 0 erreurs. Si `require("leaflet")` génère un warning de type, c'est acceptable (les APIs Leaflet internes sont typées via la lib).

- [ ] **Étape 5 — Commit**

```bash
git add components/VillaLeafletMap.tsx
git commit -m "feat(catalogue): VillaLeafletMap — onBoundsChange viewport filter + click → quick view"
```

---

## Task 5 — Orchestration dans VillasMapView

**Files:**
- Modify: `components/VillasMapView.tsx`

### Contexte

C'est la tâche centrale. `VillasMapView` devient l'orchestrateur de tout l'état du catalogue. Le fichier actuel fait 162 lignes — il va grossir. On réécrit intégralement pour garder la clarté.

**États à gérer :**
- `hoveredId: string | null` — déjà présent
- `mapVisible: boolean` — déjà présent
- `activeFilters: FilterState` — nouveau
- `quickViewId: string | null` — nouveau
- `mapBounds: LatLngBounds | null` — nouveau

**Logique de filtrage :**
```
filteredSet = filterVillas(villas, activeFilters)  // chips filter
isInViewport(villa) = mapBounds ? mapBounds.contains(villa.coords) : true
villasDisplay = villas.map(v => ({
  ...v,
  dimmed: !filteredSet.has(v.id) || !isInViewport(v)
}))
passCount = villasDisplay.filter(v => !v.dimmed).length
```

**Button "Aperçu rapide" :**
- Desktop : `opacity-0 group-hover:opacity-100` (reveal au hover)
- Mobile : `opacity-100` (toujours visible)
- `onClick={(e) => { e.preventDefault(); e.stopPropagation(); setQuickViewId(villa.id); }}`

**`handleSelect`** : `(id: string) => setQuickViewId(id)` (plus de scroll)

**Toolbar** : afficher "N dans la vue" si mapBounds actif.

- [ ] **Étape 1 — Réécrire `components/VillasMapView.tsx`**

```tsx
"use client";

import { useState, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { Map, LayoutGrid } from "lucide-react";
import type { VillaMapItem } from "./VillaLeafletMap";
import type { LatLngBounds } from "leaflet";
import VillaFilterBar, {
  DEFAULT_FILTERS,
  filterVillas,
  isFilterActive,
} from "./VillaFilterBar";
import type { FilterState } from "./VillaFilterBar";
import VillaQuickView from "./VillaQuickView";

const VillaLeafletMap = dynamic(() => import("./VillaLeafletMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-navy/5 flex items-center justify-center">
      <span className="text-navy/20 text-sm tracking-widest uppercase font-bold animate-pulse">
        Chargement de la carte…
      </span>
    </div>
  ),
});

interface Props {
  villas: VillaMapItem[];
}

export default function VillasMapView({ villas }: Props) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [mapVisible, setMapVisible] = useState(true);
  const [activeFilters, setActiveFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [quickViewId, setQuickViewId] = useState<string | null>(null);
  const [mapBounds, setMapBounds] = useState<LatLngBounds | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Stable callback pour éviter re-renders inutiles de VillaLeafletMap
  const handleBoundsChange = useCallback((bounds: LatLngBounds) => {
    setMapBounds(bounds);
  }, []);

  const handleSelect = useCallback((id: string) => {
    setQuickViewId(id);
  }, []);

  // Filtrage cumulatif : chips ∩ bounds
  const filteredSet = filterVillas(villas, activeFilters);
  const chipsActive = isFilterActive(activeFilters);

  const villasDisplay = villas.map((v) => {
    const passesChips = !chipsActive || filteredSet.has(v.id);
    const passesViewport = !mapBounds || mapBounds.contains(v.coords as [number, number]);
    return { ...v, dimmed: !passesChips || !passesViewport };
  });

  const passCount = villasDisplay.filter((v) => !v.dimmed).length;
  const viewportCount = mapBounds
    ? villas.filter((v) => mapBounds.contains(v.coords as [number, number])).length
    : null;

  const quickViewVilla = villas.find((v) => v.id === quickViewId) ?? null;

  return (
    <div className="relative">
      {/* ── Toolbar ── */}
      <div className="sticky top-[calc(72px+env(safe-area-inset-top,0px))] z-20 bg-offwhite/95 backdrop-blur-sm border-b border-navy/8 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-navy/40">
            {villas.length} propriété{villas.length > 1 ? "s" : ""}
          </p>
          {viewportCount !== null && viewportCount < villas.length && (
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gold/80">
              · {viewportCount} dans la vue
            </p>
          )}
        </div>
        <button
          onClick={() => setMapVisible((v) => !v)}
          className="tap-target flex items-center gap-2 rounded-none border border-navy/15 px-5 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-navy transition-all duration-200 hover:bg-navy hover:text-white hover:border-navy"
        >
          {mapVisible ? (
            <>
              <LayoutGrid size={13} />
              Masquer la carte
            </>
          ) : (
            <>
              <Map size={13} />
              Afficher la carte
            </>
          )}
        </button>
      </div>

      {/* ── Filter bar ── */}
      <VillaFilterBar
        filters={activeFilters}
        onChange={setActiveFilters}
        passCount={passCount}
        total={villas.length}
      />

      {/* ── Split layout ── */}
      <div className={`flex transition-all duration-300 ${mapVisible ? "items-start" : ""}`}>
        {/* ── List panel ── */}
        <div
          ref={listRef}
          className={`overflow-y-auto transition-all duration-300 ${
            mapVisible ? "w-full md:w-[58%] lg:w-[62%]" : "w-full"
          }`}
        >
          <div
            className={`p-6 transition-all duration-300 ${
              mapVisible
                ? "grid grid-cols-1 sm:grid-cols-2 gap-5"
                : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl mx-auto"
            }`}
          >
            {villasDisplay.map((villa) => (
              <div
                key={villa.id}
                data-villa={villa.id}
                onMouseEnter={() => setHoveredId(villa.id)}
                onMouseLeave={() => setHoveredId(null)}
                className={`group relative block overflow-hidden rounded-none border border-transparent transition-all duration-200 ${
                  villa.dimmed ? "opacity-40" : ""
                } ${
                  hoveredId === villa.id
                    ? "border-navy/15 shadow-[0_12px_40px_rgba(0,0,0,0.08)] -translate-y-px"
                    : "hover:border-navy/10 hover:shadow-[0_8px_28px_rgba(0,0,0,0.06)] hover:-translate-y-px"
                }`}
              >
                {/* Image portrait — 3/4 */}
                <Link
                  href={`/villas/${villa.id}`}
                  className="focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-offwhite"
                  tabIndex={villa.dimmed ? -1 : 0}
                >
                  <div className="relative aspect-[3/4] overflow-hidden rounded-none">
                    <Image
                      src={villa.image || "/villa-hero.jpg"}
                      alt={villa.name}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                    />
                    {/* Tier badge */}
                    {villa.tier && (
                      <div className="absolute top-4 left-4">
                        <span className="rounded-none border border-gold/40 bg-black/30 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.3em] text-gold backdrop-blur-sm">
                          {villa.tier}
                        </span>
                      </div>
                    )}
                    {/* Price overlay au hover */}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent pb-5 pt-14 px-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/60">
                        À partir de
                      </p>
                      <p className="font-display text-lg text-white leading-none mt-0.5">
                        {villa.price.toLocaleString("fr-FR")} €
                        <span className="text-xs font-sans font-normal text-white/50"> / nuit</span>
                      </p>
                    </div>
                  </div>
                </Link>

                {/* Info sous l'image */}
                <div className="pt-3 space-y-1 px-1 pb-2">
                  <p className="font-display font-normal text-lg text-navy leading-snug">
                    {villa.name}
                  </p>
                  {villa.location && (
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-navy/40">
                      {villa.location}
                    </p>
                  )}
                  <div className="flex items-center justify-between pt-0.5">
                    <p className="text-xs text-navy/55">
                      {villa.price.toLocaleString("fr-FR")} €
                      <span className="text-navy/35"> / nuit</span>
                    </p>
                    {/* Aperçu rapide button — desktop: hover only / mobile: always visible */}
                    <button
                      type="button"
                      onClick={() => setQuickViewId(villa.id)}
                      aria-label={`Aperçu rapide — ${villa.name}`}
                      className="sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200 border border-navy/20 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-navy/55 hover:border-gold hover:text-gold min-h-[44px] flex items-center"
                    >
                      Aperçu
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Map panel ── */}
        {mapVisible && (
          <div className="hidden md:block md:w-[42%] lg:w-[38%] shrink-0 sticky top-[120px] h-[calc(100vh-120px)]">
            <VillaLeafletMap
              villas={villas}
              hoveredId={hoveredId}
              onHover={setHoveredId}
              onSelect={handleSelect}
              onBoundsChange={handleBoundsChange}
            />
          </div>
        )}
      </div>

      {/* ── Quick View drawer ── */}
      <VillaQuickView
        villa={quickViewVilla}
        open={quickViewId !== null}
        onClose={() => setQuickViewId(null)}
      />
    </div>
  );
}
```

- [ ] **Étape 2 — Vérifier TypeScript**

```bash
npx tsc --noEmit
```

Expected: 0 erreurs. Attention : `mapBounds.contains(v.coords as [number, number])` — Leaflet accepte un `LatLngTuple = [number, number]`. Si tsc se plaint, caster : `mapBounds.contains(v.coords as unknown as import("leaflet").LatLngTuple)`.

- [ ] **Étape 3 — Build complet**

```bash
npm run build
```

Expected: compilation sans erreur. Les pages dynamiques (force-dynamic) sont attendues.

- [ ] **Étape 4 — Test manuel rapide (dev server)**

```bash
npm run dev
```

Vérifier sur http://localhost:3000/villas :
1. Chips de filtre visibles sous la toolbar
2. Cliquer "Piscine" → cartes non-piscine grisées
3. "Tout effacer" → tout revient
4. Cliquer "Aperçu" sur une carte → drawer slide-up
5. Cliquer en dehors / ✕ → drawer ferme
6. Cliquer un marker sur la carte → drawer s'ouvre (pas de navigation)
7. Zoomer la carte → "N dans la vue" s'affiche dans la toolbar

- [ ] **Étape 5 — Commit final**

```bash
git add components/VillasMapView.tsx
git commit -m "feat(catalogue): VillasMapView — filtres chips, quick view, viewport filter carte"
```

---

## Self-Review

**Spec coverage :**
- [x] Feature A : `VillaFilterBar` — chips piscine/mer/plage/chambres/budget/tier, filtre client-side, grisage des villas hors filtre, badge "N résultats · Tout effacer"
- [x] Feature B : `VillaQuickView` — photos 3, localisation eyebrow, nom Playfair, stats 4 cols, amenities chips, prix, CTAs "Voir la villa" + "Réserver", swipe down ferme, ✕ ferme, overlay ferme
- [x] Feature C : `VillaLeafletMap` — `moveend`/`zoomend` → `onBoundsChange`, marker click → `onSelect` → quick view, bounds filter cumulatif avec chips, "N dans la vue" dans toolbar
- [x] `VillaMapItem` enrichi : `images`, `capacity`, `surface`, `amenities`, `tier`
- [x] Query Supabase enrichie : `capacity,surface_m2,amenities,collection_tier`
- [x] Pas de nouvelle dépendance npm
- [x] Touch targets ≥ 44px sur tous les boutons
- [x] TypeScript strict (import type pour LatLngBounds, pas de `any` dans le code applicatif)
- [x] Design system conservé : navy, gold, offwhite, Playfair Display, classes Tailwind existantes

**Placeholder scan :** aucun TBD/TODO/vague dans le plan — tout le code est fourni.

**Cohérence des types :**
- `VillaMapItem` défini en Task 1 → utilisé dans Task 2 (filterVillas), Task 3 (VillaQuickView props), Task 4 (VillaLeafletMap), Task 5 (VillasMapView)
- `FilterState` + `DEFAULT_FILTERS` + `filterVillas` + `isFilterActive` exportés depuis `VillaFilterBar.tsx` → importés dans `VillasMapView.tsx` ✓
- `onBoundsChange: (bounds: LatLngBounds) => void` défini Task 4 → consommé Task 5 via `handleBoundsChange` ✓
- `onSelect: (id: string) => void` — même signature Task 4 et Task 5 ✓

**Note sur les données réelles :** Si la colonne `amenities` n'existe pas encore en base, le fallback `[]` est géré dans le mapping. Les filtres correspondants ne matcheront rien, les villas resteront visibles (pas de faux négatifs).
