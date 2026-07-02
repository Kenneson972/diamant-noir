# CRUD Villa — Éditeur Unifié — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remplacer AdminVillaForm (622 lignes HTML natif) et VillaEditorForm (514 lignes HeroUI) par un éditeur unique avec bascule création/édition, preview live, autosave, et améliorations ergonomiques profondes sur toutes les sections.

**Architecture:** Composant unique `VillaEditor` avec useReducer central → split layout (formulaire gauche / preview droite ≥1024px, onglets Éditer|Aperçu mobile). Mode création = stepper 4 étapes. Mode édition = accordéon 10 sections + ProgressBar + QuickNav. Sous-éditeurs existants gardés et améliorés (pas de réécriture from scratch). Routes API et composants iCal/blocs/réservations inchangés.

**Tech Stack:** Next.js 15.2 App Router, Tailwind v4, HeroUI Pro, lucide-react + KayvilaPngIcon, Vitest + Playwright.

## Global Constraints

- **Branche** : `feat/crud-villa-unified` (créée depuis `main` à jour). Pousser après chaque tâche.
- **Zéro nouvelle dépendance npm, zéro migration DB, zéro modification de route API.**
- **Gate par tâche** : `npx tsc --noEmit` (10 erreurs pré-existantes tolérées : `.next/types` pages supprimées + `tests/a11y.spec.ts`). Le `npm run build` local est cassé de façon PRÉ-EXISTANTE — ne pas s'en servir.
- **Direction impeccable (obligatoire)** : jamais de side-stripe (`border-left/right > 1px` coloré) ; jamais de texte en dégradé ; jamais de cartes imbriquées dans des cartes ; l'or (`gold`) = signal uniquement, 1 CTA primaire par écran.
- **Mobile** : zones tactiles ≥44px (`min-h-[44px]`), inputs `text-base` (16px anti-zoom iOS), texte informatif ≥11px. `pb-[env(safe-area-inset-bottom)]` sur les éléments fixés en bas.
- **Icônes** : noms string via `DashboardNavIcon` / `KayvilaPngIcon name=`, jamais de composant Lucide en prop Server→Client. Jamais de fonction en prop Server→Client.
- **Copy** : strings JS avec apostrophe → double quotes `"..."`, jamais `'...'`.
- **Fichiers < 500 lignes.**
- **Commits** : message français conventionnel + footer :
  ```
  Co-Authored-By: claude-flow <ruv@ruv.net>
  Claude-Session: https://claude.ai/code/session_015Xz1Lttgy3Npwy6r1Z4RVs
  ```
- **Dev server** : :3000 = user, périmé. Lancer le sien sur `PORT=3001 npm run dev`.
- **Playwright** : `PLAYWRIGHT_BASE_URL="http://localhost:3001"`, `--workers=1`. Cookie consent via `addInitScript` localStorage.
- **Ne PAS supprimer** : `AdminVillaForm.tsx` / `VillaEditorForm.tsx` avant la Task 14 (cleanup final) — les pages existantes en dépendent jusqu'au switch.

---

### Task 1: Fondations — Zod schema + presets (amenities, rooms)

**Files:**
- Create: `lib/validations/villa.ts`
- Create: `lib/room-presets.ts`
- Create: `lib/amenity-presets.ts`
- Modify: `lib/villa-amenities-suggested.ts`

**Interfaces:**
- Produces: `villaFormSchema` (Zod), `RoomPreset`, `AmenityPreset`, `SUGGESTED_AMENITIES_BY_CATEGORY`

- [ ] **Step 1: Zod schema**

```ts
// lib/validations/villa.ts
import { z } from "zod";

export const roomSchema = z.object({
  name: z.string().min(1, "Nom requis"),
  bed: z.enum(["King size", "Queen size", "Double", "Simple", "Canapé-lit"]),
  ensuite: z.boolean(),
});
export type Room = z.infer<typeof roomSchema>;

export const seasonSchema = z.object({
  season: z.string().min(1, "Nom de saison requis"),
  start: z.string().regex(/^\d{2}-\d{2}$/, "Format MM-DD"),
  end: z.string().regex(/^\d{2}-\d{2}$/, "Format MM-DD"),
  price: z.number().min(0, "Prix ≥ 0"),
});
export type Season = z.infer<typeof seasonSchema>;

export const emergencyContactSchema = z.object({
  name: z.string().min(1, "Nom requis"),
  phone: z.string().min(1, "Téléphone requis"),
});
export type EmergencyContact = z.infer<typeof emergencyContactSchema>;

export const villaFormSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  location: z.string().optional().default(""),
  description: z.string().optional().default(""),
  price_per_night: z.number().min(1, "Prix minimum 1 €"),
  capacity: z.number().min(0).optional().default(0),
  bedrooms: z.number().min(0).optional().default(0),
  bathrooms_count: z.number().min(0).optional().default(0),
  surface_m2: z.number().min(0).optional().default(0),
  image_url: z.string().optional().default(""),
  image_urls: z.array(z.string()).optional().default([]),
  equipment_interior: z.array(z.string()).optional().default([]),
  equipment_exterior: z.array(z.string()).optional().default([]),
  house_rules: z.array(z.string()).optional().default([]),
  safety_info: z.array(z.string()).optional().default([]),
  check_in_time: z.string().optional().default("15:00"),
  check_out_time: z.string().optional().default("10:00"),
  environment: z.string().optional().default(""),
  nearby_points: z.array(z.string()).optional().default([]),
  included_services_home: z.array(z.string()).optional().default([]),
  included_services_collection: z.array(z.string()).optional().default([]),
  a_la_carte_services: z.array(z.string()).optional().default([]),
  wifi_name: z.string().optional().default(""),
  wifi_password: z.string().optional().default(""),
  checkout_instructions: z.string().optional().default(""),
  map_embed_url: z.string().optional().default(""),
  airbnb_url: z.string().optional().default(""),
  latitude: z.number().optional().default(0),
  longitude: z.number().optional().default(0),
  rooms_details: z.array(roomSchema).optional().default([]),
  seasonal_prices: z.array(seasonSchema).optional().default([]),
  emergency_contacts: z.array(emergencyContactSchema).optional().default([]),
  booking_terms: z.record(z.any()).optional().default({}),
  min_nights: z.number().min(1).optional().default(2),
  welcome_booklet_url: z.string().optional().default(""),
  cancellation_policy: z.string().optional().default(""),
  cancellation_template: z.string().optional().default(""),
  cancellation_notes: z.string().optional().default(""),
  // Admin only
  is_published: z.boolean().optional().default(false),
  commission_rate: z.number().min(0).max(100).optional().default(22),
  owner_id: z.string().optional().default(""),
  collection_tier: z.string().optional().default(""),
  cleaning_fee_cents: z.number().min(0).optional().default(0),
});

export type VillaFormData = z.infer<typeof villaFormSchema>;

export function validateVillaField(field: keyof VillaFormData, value: unknown): string | null {
  const result = villaFormSchema.shape[field]?.safeParse(value);
  if (result?.success) return null;
  return (result as { error?: { errors?: Array<{ message: string }> } })?.error?.errors?.[0]?.message ?? "Valeur invalide";
}
```

- [ ] **Step 2: Room presets**

```ts
// lib/room-presets.ts
export type RoomPreset = {
  label: string;
  rooms: Array<{ name: string; bed: "King size" | "Queen size" | "Double" | "Simple" | "Canapé-lit"; ensuite: boolean }>;
};

export const ROOM_PRESETS: RoomPreset[] = [
  {
    label: "Chambre parentale",
    rooms: [{ name: "Chambre parentale", bed: "King size", ensuite: true }],
  },
  {
    label: "Chambre standard",
    rooms: [{ name: "Chambre standard", bed: "Queen size", ensuite: false }],
  },
  {
    label: "Chambre enfant",
    rooms: [
      { name: "Chambre enfant 1", bed: "Simple", ensuite: false },
      { name: "Chambre enfant 2", bed: "Simple", ensuite: false },
    ],
  },
];

export function getBedCapacity(bed: string): number {
  switch (bed) {
    case "King size": case "Queen size": case "Double": return 2;
    case "Simple": case "Canapé-lit": return 1;
    default: return 1;
  }
}

export function totalRoomCapacity(rooms: Array<{ bed: string }>): number {
  return rooms.reduce((sum, r) => sum + getBedCapacity(r.bed), 0);
}
```

- [ ] **Step 3: Amenity presets**

```ts
// lib/amenity-presets.ts
export type AmenityPreset = {
  label: string;
  interior: string[];
  exterior: string[];
  servicesHome: string[];
  servicesCollection: string[];
  aLaCarte: string[];
};

export const AMENITY_PRESETS: AmenityPreset[] = [
  {
    label: "Équipements famille",
    interior: ["Lit bébé", "Chaise haute", "Barrière de sécurité"],
    exterior: ["Barrière piscine", "Jeux extérieurs"],
    servicesHome: ["Baignoire bébé", "Protège-prises"],
    servicesCollection: [],
    aLaCarte: ["Babysitter"],
  },
  {
    label: "Villa de luxe",
    interior: ["Système audio", "Home cinéma", "Climatisation centralisée"],
    exterior: ["Piscine chauffée", "Pool house"],
    servicesHome: ["Draps en lin", "Peignoirs", "Produits d'accueil premium"],
    servicesCollection: ["Concierge dédié", "Accueil champagne", "Voiturier"],
    aLaCarte: ["Chef privé", "Massage", "Location bateau", "Transfert aéroport"],
  },
  {
    label: "Villa éco",
    interior: ["Panneaux solaires", "Récupération eau de pluie", "Produits d'entretien bio"],
    exterior: ["Compost", "Potager", "Station de recharge électrique"],
    servicesHome: ["Produits d'accueil bio", "Draps en coton bio"],
    servicesCollection: [],
    aLaCarte: ["Location vélo électrique"],
  },
];
```

- [ ] **Step 4: Restructurer les suggestions par catégorie**

Remplacer le contenu de `lib/villa-amenities-suggested.ts` :

```ts
// lib/villa-amenities-suggested.ts
export const SUGGESTED_AMENITIES = {
  interior: [
    "Wi-Fi", "Climatisation", "Télévision", "Cuisine équipée", "Lave-linge",
    "Sèche-linge", "Baignoire", "Eau chaude", "Détecteur de fumée", "Machine à café",
    "Micro-ondes", "Lave-vaisselle", "Fer à repasser", "Cintres", "Espace de travail",
    "Entrée privée", "Système audio", "Home cinéma",
  ],
  exterior: [
    "Piscine", "Jardin", "Terrasse ou balcon", "Barbecue", "Parking gratuit",
    "Vue mer", "Transats", "Douche extérieure", "Piscine chauffée", "Pool house",
  ],
  servicesHome: [
    "Draps", "Serviettes", "Ménage fin de séjour", "Linges de maison",
    "Produits d'accueil", "Lit bébé", "Chaise haute",
  ],
  servicesCollection: [
    "Concierge dédié", "Accueil champagne", "Voiturier", "Chef à domicile",
    "Service voiture", "Transfert aéroport",
  ],
  aLaCarte: [
    "Chef privé", "Massage", "Location bateau", "Babysitter", "Visite guidée",
    "Transfert aéroport", "Location voiture", "Cours de plongée", "Petit-déjeuner",
  ],
} as const;

export type AmenityCategory = keyof typeof SUGGESTED_AMENITIES;

// Legacy flat set — gardé pour la rétrocompatibilité avec VillaAmenitiesEditor existant
export const SUGGESTED_AMENITY_SET = new Set(
  Object.values(SUGGESTED_AMENITIES).flat()
);

export const SUGGESTED_AMENITY_LABELS = Object.values(SUGGESTED_AMENITIES).flat();
```

- [ ] **Step 5: Vitest — file squelettes**

```ts
// lib/room-presets.test.ts
import { describe, it, expect } from "vitest";
import { ROOM_PRESETS, getBedCapacity, totalRoomCapacity } from "./room-presets";

describe("ROOM_PRESETS", () => {
  it("a 3 presets", () => {
    expect(ROOM_PRESETS).toHaveLength(3);
  });
  it("chaque preset a au moins 1 chambre", () => {
    for (const p of ROOM_PRESETS) expect(p.rooms.length).toBeGreaterThanOrEqual(1);
  });
});

describe("getBedCapacity", () => {
  it("King size = 2", () => expect(getBedCapacity("King size")).toBe(2));
  it("Simple = 1", () => expect(getBedCapacity("Simple")).toBe(1));
});

describe("totalRoomCapacity", () => {
  it("King + 2×Simple = 4", () => {
    expect(totalRoomCapacity([
      { bed: "King size" }, { bed: "Simple" }, { bed: "Simple" },
    ])).toBe(4);
  });
  it("tableau vide = 0", () => expect(totalRoomCapacity([])).toBe(0));
});
```

```ts
// lib/validations/villa.test.ts
import { describe, it, expect } from "vitest";
import { villaFormSchema } from "./villa";

describe("villaFormSchema", () => {
  it("rejette un nom vide", () => {
    const r = villaFormSchema.safeParse({ name: "", price_per_night: 0 });
    expect(r.success).toBe(false);
  });
  it("valide un minimum viable", () => {
    const r = villaFormSchema.safeParse({ name: "Villa Test", price_per_night: 150 });
    expect(r.success).toBe(true);
  });
  it("prix négatif rejeté", () => {
    const r = villaFormSchema.safeParse({ name: "X", price_per_night: -5 });
    expect(r.success).toBe(false);
  });
});
```

- [ ] **Step 6: Vérif test + tsc + commit**

Run: `npx vitest run lib/room-presets.test.ts lib/validations/villa.test.ts`
Expected: 8 passed

Run: `npx tsc --noEmit` — ignorer les 10 erreurs pré-existantes.

```bash
git add lib/validations/villa.ts lib/room-presets.ts lib/amenity-presets.ts lib/villa-amenities-suggested.ts lib/room-presets.test.ts lib/validations/villa.test.ts
git commit -m "feat(villa): fondations — Zod schema, presets chambres/équipements, suggestions catégorisées"
git push -u origin feat/crud-villa-unified
```

---

### Task 2: VillaEditor — reducer + state machine

**Files:**
- Create: `lib/villa-editor-state.ts`
- Test: `lib/villa-editor-state.test.ts`

**Interfaces:**
- Produces: `villaFormReducer(state, action): VillaFormData`, `VillaFormAction` union type, `createEmptyForm(): VillaFormData`, `DEFAULT_FORM`

- [ ] **Step 1: State + reducer**

```ts
// lib/villa-editor-state.ts
import type { VillaFormData, Room, Season, EmergencyContact } from "@/lib/validations/villa";

export type VillaFormAction =
  | { type: "SET_FIELD"; field: string; value: unknown }
  | { type: "SET_ROOMS"; rooms: Room[] }
  | { type: "SET_SEASONS"; seasons: Season[] }
  | { type: "SET_CONTACTS"; contacts: EmergencyContact[] }
  | { type: "SET_IMAGES"; urls: string[] }
  | { type: "SET_ARRAY"; field: string; value: string[] }
  | { type: "LOAD_VILLA"; villa: Partial<VillaFormData> };

export function createEmptyForm(): VillaFormData {
  return {
    name: "", location: "", description: "",
    price_per_night: 150, capacity: 2, bedrooms: 1, bathrooms_count: 1, surface_m2: 0,
    image_url: "", image_urls: [],
    equipment_interior: [], equipment_exterior: [],
    house_rules: [], safety_info: [],
    check_in_time: "15:00", check_out_time: "10:00",
    environment: "", nearby_points: [],
    included_services_home: [], included_services_collection: [], a_la_carte_services: [],
    wifi_name: "", wifi_password: "", checkout_instructions: "",
    map_embed_url: "", airbnb_url: "",
    latitude: 0, longitude: 0,
    rooms_details: [], seasonal_prices: [], emergency_contacts: [],
    booking_terms: {}, min_nights: 2,
    welcome_booklet_url: "", cancellation_policy: "", cancellation_template: "", cancellation_notes: "",
    is_published: false, commission_rate: 22, owner_id: "", collection_tier: "", cleaning_fee_cents: 0,
  };
}

export function villaFormReducer(state: VillaFormData, action: VillaFormAction): VillaFormData {
  switch (action.type) {
    case "SET_FIELD":
      return { ...state, [action.field]: action.value };
    case "SET_ARRAY":
      return { ...state, [action.field]: Array.isArray(action.value) ? action.value : [] };
    case "SET_ROOMS":
      return { ...state, rooms_details: action.rooms };
    case "SET_SEASONS":
      return { ...state, seasonal_prices: action.seasons };
    case "SET_CONTACTS":
      return { ...state, emergency_contacts: action.contacts };
    case "SET_IMAGES":
      return { ...state, image_urls: action.urls, image_url: action.urls[0] ?? "" };
    case "LOAD_VILLA":
      const base = createEmptyForm();
      return { ...base, ...action.villa };
    default:
      return state;
  }
}

export function sectionCompleteness(form: VillaFormData): Record<string, "empty" | "partial" | "complete"> {
  const has = (arr: unknown[]) => arr.length > 0;
  const str = (s: string) => s.trim().length > 0;
  return {
    infos: str(form.name) ? "complete" : "empty",
    photos: has(form.image_urls) ? "complete" : "empty",
    equipments: (has(form.equipment_interior) || has(form.equipment_exterior)) ? "complete" : "empty",
    rooms: has(form.rooms_details) ? "complete" : "empty",
    pricing: form.price_per_night > 0 ? "complete" : "empty",
    availability: "empty", // admin-only, non critique
    contacts: has(form.emergency_contacts) ? "complete" : "empty",
    services: (has(form.included_services_home) || has(form.included_services_collection)) ? "complete" : "empty",
    rules: has(form.house_rules) ? "complete" : "empty",
    safety: has(form.safety_info) ? "complete" : "empty",
  };
}
```

- [ ] **Step 2: Vitest reducer**

```ts
// lib/villa-editor-state.test.ts
import { describe, it, expect } from "vitest";
import { villaFormReducer, createEmptyForm, sectionCompleteness } from "./villa-editor-state";

describe("villaFormReducer", () => {
  it("SET_FIELD met à jour un champ", () => {
    const s = createEmptyForm();
    const next = villaFormReducer(s, { type: "SET_FIELD", field: "name", value: "Villa" });
    expect(next.name).toBe("Villa");
  });

  it("SET_IMAGES met à jour image_urls et image_url", () => {
    const s = createEmptyForm();
    const next = villaFormReducer(s, { type: "SET_IMAGES", urls: ["a.jpg", "b.jpg"] });
    expect(next.image_urls).toEqual(["a.jpg", "b.jpg"]);
    expect(next.image_url).toBe("a.jpg");
  });

  it("LOAD_VILLA merge une villa existante dans le défaut", () => {
    const s = villaFormReducer(createEmptyForm(), { type: "LOAD_VILLA", villa: { name: "Villa A", price_per_night: 200 } });
    expect(s.name).toBe("Villa A");
    expect(s.price_per_night).toBe(200);
    expect(s.capacity).toBe(2); // défaut
  });
});

describe("sectionCompleteness", () => {
  it("form vide = infos empty", () => {
    expect(sectionCompleteness(createEmptyForm()).infos).toBe("empty");
  });
  it("nom rempli = infos complete", () => {
    const f = { ...createEmptyForm(), name: "X" };
    expect(sectionCompleteness(f).infos).toBe("complete");
  });
});
```

- [ ] **Step 3: Gate + commit**

Run: `npx vitest run lib/villa-editor-state.test.ts`
Expected: 5 passed

Run: `npx tsc --noEmit`

```bash
git add lib/villa-editor-state.ts lib/villa-editor-state.test.ts
git commit -m "feat(villa): reducer + state machine (SET_FIELD, LOAD_VILLA, sectionCompleteness)"
git push
```

---

### Task 3: Composants UI partagés — Stepper, AutosaveIndicator, QuickNav, ProgressBar

**Files:**
- Create: `components/dashboard/villa-editor/Stepper.tsx`
- Create: `components/dashboard/villa-editor/AutosaveIndicator.tsx`
- Create: `components/dashboard/villa-editor/QuickNav.tsx`
- Create: `components/dashboard/villa-editor/ProgressBar.tsx`

**Interfaces:**
- Produces: `Stepper({ steps, current, onChange })`, `AutosaveIndicator({ status, lastSaved, onRetry })`, `QuickNav({ sections, activeSection, onNavigate })`, `ProgressBar({ sections })`

- [ ] **Step 1: Stepper**

```tsx
// components/dashboard/villa-editor/Stepper.tsx
import { cn } from "@/lib/utils";

type Step = { label: string; description: string };

export function Stepper({
  steps,
  current,
  onChange,
}: {
  steps: Step[];
  current: number;
  onChange: (index: number) => void;
}) {
  return (
    <nav aria-label="Étapes de création" className="mb-8">
      <ol className="flex flex-wrap gap-4 sm:gap-0 sm:divide-x sm:divide-navy/10">
        {steps.map((step, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <li key={step.label} className="flex-1">
              <button
                type="button"
                disabled={!done && !active}
                onClick={() => onChange(i)}
                className={cn(
                  "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors",
                  active && "rounded-lg bg-navy/5",
                  done && "opacity-60 hover:opacity-100",
                  !done && !active && "pointer-events-none opacity-40"
                )}
              >
                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                    done
                      ? "bg-emerald-100 text-emerald-700"
                      : active
                        ? "bg-gold text-white"
                        : "bg-navy/10 text-navy/40"
                  )}
                >
                  {done ? "✓" : i + 1}
                </span>
                <span className="min-w-0">
                  <span className={cn("block text-sm font-semibold", active ? "text-navy" : "text-navy/60")}>
                    {step.label}
                  </span>
                  <span className="hidden text-[11px] text-navy/40 sm:block">{step.description}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
```

- [ ] **Step 2: AutosaveIndicator**

```tsx
// components/dashboard/villa-editor/AutosaveIndicator.tsx
import { Check, Loader2, AlertCircle } from "lucide-react";

type AutosaveStatus = "idle" | "saving" | "saved" | "error";

export function AutosaveIndicator({
  status,
  lastSaved,
  onRetry,
}: {
  status: AutosaveStatus;
  lastSaved?: Date | null;
  onRetry: () => void;
}) {
  const time = lastSaved ? new Date(lastSaved).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : null;

  return (
    <div className="flex items-center gap-2" data-testid="autosave-indicator">
      {status === "idle" && <span className="size-2 rounded-full bg-navy/20" />}
      {status === "saving" && <Loader2 className="size-3.5 animate-spin text-navy/40" aria-label="Enregistrement..." />}
      {status === "saved" && <Check className="size-3.5 text-emerald-600" aria-label="Enregistré" />}
      {status === "error" && (
        <button type="button" onClick={onRetry} className="flex items-center gap-1 text-xs text-red-600 hover:text-red-800">
          <AlertCircle className="size-3.5" />
          Erreur — réessayer
        </button>
      )}
      {status === "saved" && time && (
        <span className="text-[11px] text-navy/40">Enregistré à {time}</span>
      )}
      {status === "idle" && <span className="text-[11px] text-navy/40">Brouillon</span>}
    </div>
  );
}
```

- [ ] **Step 3: QuickNav**

```tsx
// components/dashboard/villa-editor/QuickNav.tsx
import { DashboardNavIcon } from "@/components/dashboard/shared/dashboard-nav-icon";
import { cn } from "@/lib/utils";

type NavSection = { id: string; label: string; icon: string };

export function QuickNav({
  sections,
  activeSection,
  onNavigate,
}: {
  sections: NavSection[];
  activeSection: string;
  onNavigate: (id: string) => void;
}) {
  return (
    <nav aria-label="Navigation rapide" className="hidden lg:block" data-testid="quick-nav">
      <ul className="sticky top-24 space-y-1">
        {sections.map((s) => {
          const active = activeSection === s.id;
          return (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => onNavigate(s.id)}
                className={cn(
                  "flex w-full min-h-[36px] items-center gap-2 rounded-md px-2 py-2 text-left text-xs font-medium transition-colors",
                  active
                    ? "bg-gold/10 text-gold"
                    : "text-navy/50 hover:bg-navy/5 hover:text-navy"
                )}
              >
                <DashboardNavIcon name={s.icon} size={16} />
                <span className="truncate">{s.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
```

- [ ] **Step 4: ProgressBar**

```tsx
// components/dashboard/villa-editor/ProgressBar.tsx
import { cn } from "@/lib/utils";

type SectionStatus = { id: string; label: string; status: "empty" | "partial" | "complete" };

export function ProgressBar({ sections }: { sections: SectionStatus[] }) {
  const completed = sections.filter((s) => s.status === "complete").length;
  const total = sections.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="sticky top-16 z-30 mb-6 space-y-2" data-testid="progress-bar">
      <div className="flex items-center justify-between text-[11px] text-navy/45">
        <span>{completed}/{total} sections complétées</span>
        <span>{pct}%</span>
      </div>
      <div className="flex gap-1.5">
        {sections.map((s) => (
          <div
            key={s.id}
            title={s.label}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors",
              s.status === "complete" && "bg-emerald-500",
              s.status === "partial" && "bg-amber-400",
              s.status === "empty" && "bg-navy/10"
            )}
          />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Gate + commit**

Run: `npx tsc --noEmit`

```bash
git add components/dashboard/villa-editor/Stepper.tsx components/dashboard/villa-editor/AutosaveIndicator.tsx components/dashboard/villa-editor/QuickNav.tsx components/dashboard/villa-editor/ProgressBar.tsx
git commit -m "feat(villa): Stepper, AutosaveIndicator, QuickNav, ProgressBar"
git push
```

---

### Task 4: VillaPreviewCard

**Files:**
- Create: `components/dashboard/villa-editor/VillaPreviewCard.tsx`
- Create: `components/dashboard/villa-editor/VillaEditorShell.tsx`

**Interfaces:**
- Produces: `VillaPreviewCard({ form, hoveredSection })`, `VillaEditorShell({ form, hoveredSection, children, sidebar })`

- [ ] **Step 1: VillaPreviewCard**

```tsx
// components/dashboard/villa-editor/VillaPreviewCard.tsx
import { VillaCoverImage } from "@/components/ui/villa-cover-image";
import { pickVillaImageUrl } from "@/lib/villa-image";
import type { VillaFormData } from "@/lib/validations/villa";
import { cn } from "@/lib/utils";

export function VillaPreviewCard({
  form,
  hoveredSection,
}: {
  form: VillaFormData;
  hoveredSection: string | null;
}) {
  const imageSrc = pickVillaImageUrl(form.image_url, form.image_urls);
  const topAmenities = [
    ...form.equipment_interior.slice(0, 2),
    ...form.equipment_exterior.slice(0, 2),
  ].slice(0, 4);
  const roomCapacity = form.rooms_details.reduce(
    (sum, r) => sum + (["King size", "Queen size", "Double"].includes(r.bed) ? 2 : 1), 0
  );

  return (
    <div className="overflow-hidden border border-navy/8 bg-white" data-testid="villa-preview-card">
      <div className="relative aspect-[16/10] bg-navy/5">
        {imageSrc ? (
          <VillaCoverImage src={imageSrc} alt={form.name || "Villa"} fill className="object-cover" sizes="400px" />
        ) : (
          <div className="flex h-full items-center justify-center text-navy/20">Aperçu</div>
        )}
      </div>
      <div className="space-y-3 p-5">
        <div>
          <h3 className="font-display text-lg font-semibold text-navy">{form.name || "Nom de la villa"}</h3>
          {form.location ? (
            <p className="text-sm text-navy/50">{form.location}, Martinique</p>
          ) : null}
        </div>
        <p className={cn("font-display text-xl font-bold text-navy", hoveredSection === "pricing" && "ring-2 ring-gold/30 rounded")}>
          {form.price_per_night > 0 ? `${form.price_per_night} €` : "—"}
          <span className="text-sm font-normal text-navy/40"> / nuit</span>
        </p>
        <div className={cn("flex flex-wrap gap-1.5", hoveredSection === "equipments" && "ring-2 ring-gold/30 rounded")}>
          {topAmenities.length > 0 ? (
            topAmenities.map((a) => (
              <span key={a} className="rounded-full border border-navy/10 px-2.5 py-1 text-[11px] font-medium text-navy/60">{a}</span>
            ))
          ) : (
            <span className="text-[11px] italic text-navy/30">Équipements à renseigner</span>
          )}
        </div>
        {form.rooms_details.length > 0 && (
          <p className={cn("text-sm text-navy/55", hoveredSection === "rooms" && "ring-2 ring-gold/30 rounded")}>
            {form.rooms_details.length} chambre{form.rooms_details.length > 1 ? "s" : ""} · {roomCapacity} personne{roomCapacity > 1 ? "s" : ""}
          </p>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: VillaEditorShell**

```tsx
// components/dashboard/villa-editor/VillaEditorShell.tsx
"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function VillaEditorShell({
  sidebar,
  preview,
  children,
}: {
  sidebar?: ReactNode;   // QuickNav (desktop) ou rien (création)
  preview: ReactNode;    // VillaPreviewCard
  children: ReactNode;   // formulaire
}) {
  const [mobileTab, setMobileTab] = useState<"edit" | "preview">("edit");

  return (
    <div>
      {/* Onglets mobile */}
      <div className="sticky top-16 z-20 mb-4 flex gap-1 bg-offwhite pb-2 lg:hidden">
        {(["edit", "preview"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setMobileTab(tab)}
            className={cn(
              "flex-1 rounded-md py-2 text-sm font-semibold transition-colors",
              mobileTab === tab
                ? "bg-navy text-white"
                : "border border-navy/10 bg-white text-navy/55"
            )}
          >
            {tab === "edit" ? "Éditer" : "Aperçu"}
          </button>
        ))}
      </div>

      {/* Layout desktop */}
      <div className="lg:grid lg:grid-cols-[1fr_380px] lg:gap-10">
        <div className={cn(sidebar ? "lg:grid lg:grid-cols-[56px_1fr] lg:gap-4" : "")}>
          {sidebar}
          <div className={cn(mobileTab !== "edit" && "hidden lg:block")}>
            {children}
          </div>
        </div>
        <div className={cn("pt-8 lg:sticky lg:top-24 lg:self-start", mobileTab !== "preview" && "hidden lg:block")}>
          {preview}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Gate + commit**

Run: `npx tsc --noEmit`

```bash
git add components/dashboard/villa-editor/VillaPreviewCard.tsx components/dashboard/villa-editor/VillaEditorShell.tsx
git commit -m "feat(villa): VillaPreviewCard interactive + VillaEditorShell split layout/onglets mobile"
git push
```

---

### Task 5: VillaEditor — composant principal

**Files:**
- Create: `components/dashboard/villa-editor/VillaEditor.tsx`

**Interfaces:**
- Consumes: `villaFormReducer`, `createEmptyForm`, `sectionCompleteness` (Task 2), `Stepper`, `AutosaveIndicator`, `QuickNav`, `ProgressBar` (Task 3), `VillaPreviewCard`, `VillaEditorShell` (Task 4), `VillaFormFields` (existant), `villaFormSchema` (Task 1)
- Produces: `VillaEditor({ villa?, isAdmin? })`

- [ ] **Step 1: VillaEditor complet**

```tsx
// components/dashboard/villa-editor/VillaEditor.tsx
"use client";

import { useReducer, useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { villaFormReducer, createEmptyForm, sectionCompleteness } from "@/lib/villa-editor-state";
import { villaFormSchema } from "@/lib/validations/villa";
import { Stepper } from "./Stepper";
import { AutosaveIndicator } from "./AutosaveIndicator";
import { QuickNav } from "./QuickNav";
import { ProgressBar } from "./ProgressBar";
import { VillaPreviewCard } from "./VillaPreviewCard";
import { VillaEditorShell } from "./VillaEditorShell";
import { VillaFormFields } from "./VillaFormFields";
import type { VillaFormData } from "@/lib/validations/villa";
import type { Villa } from "@/types/domain";

const CREATE_STEPS = [
  { label: "Infos générales", description: "Nom, localisation, description" },
  { label: "Photos", description: "Ajoutez vos plus belles photos" },
  { label: "Tarifs", description: "Prix par nuit et saisons" },
  { label: "Finalisation", description: "Vérifiez et publiez" },
];

const EDIT_SECTIONS = [
  { id: "infos", label: "Infos générales", icon: "LayoutDashboard" },
  { id: "photos", label: "Photos", icon: "home" },
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
  const sectionArr = EDIT_SECTIONS.map((s) => ({ ...s, status: sections[s.id] ?? "empty" }));

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
      const data = await res.json() as { id?: string };
      router.push(`/admin/villas/${data.id ?? ""}`);
    } catch {
      setErrors({ _form: "Erreur lors de la création. Réessayez." });
    }
  };

  const handleChange = (key: string, value: unknown) => {
    dispatch({ type: "SET_FIELD", field: key, value });
    // Clear field error on change
    if (errors[key]) setErrors((prev) => { const n = { ...prev }; delete n[key]; return n; });
  };

  // Mode création
  if (!isEdit) {
    return (
      <VillaEditorShell
        preview={<VillaPreviewCard form={form} hoveredSection={hoveredSection} />}
      >
        <Stepper steps={CREATE_STEPS} current={step} onChange={setStep} />
        {step === 0 && (
          <div className="space-y-4" onMouseEnter={() => setHoveredSection("infos")} onMouseLeave={() => setHoveredSection(null)}>
            <VillaFormFields form={form as Record<string, unknown>} onChange={handleChange} />
          </div>
        )}
        {step === 1 && (
          <div className="space-y-4">
            <p className="text-sm text-muted">Ajoutez vos photos dans l&apos;étape suivante (mode édition).</p>
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
          <div className="space-y-4" onMouseEnter={() => setHoveredSection("pricing")} onMouseLeave={() => setHoveredSection(null)}>
            <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-muted">Prix par nuit (€)</label>
            <input
              type="number"
              min={1}
              value={form.price_per_night}
              onChange={(e) => handleChange("price_per_night", Number(e.target.value))}
              className="min-h-[44px] w-full rounded-lg border border-navy/10 bg-white px-4 text-base focus:border-gold/50 focus:outline-none"
            />
            {errors.price_per_night && <p className="text-xs text-red-500">{errors.price_per_night}</p>}
          </div>
        )}
        {step === 3 && (
          <div className="space-y-6">
            <div className="rounded-xl border border-navy/8 bg-white p-6">
              <h3 className="font-display text-base font-semibold text-navy">Récapitulatif</h3>
              <dl className="mt-4 divide-y divide-navy/5 text-sm">
                <div className="flex justify-between py-2"><dt className="text-navy/55">Nom</dt><dd className="font-medium text-navy">{form.name || "—"}</dd></div>
                <div className="flex justify-between py-2"><dt className="text-navy/55">Prix</dt><dd className="font-medium text-navy">{form.price_per_night} €/nuit</dd></div>
                <div className="flex justify-between py-2"><dt className="text-navy/55">Capacité</dt><dd className="font-medium text-navy">{form.capacity} pers.</dd></div>
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
          <button type="button" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}
            className="min-h-[44px] rounded-lg border border-navy/15 bg-white px-6 text-sm font-semibold text-navy disabled:opacity-30">
            Précédent
          </button>
          {step < 3 && (
            <button type="button" onClick={() => setStep(step + 1)}
              className="min-h-[44px] rounded-lg bg-navy px-6 text-sm font-semibold text-white">
              Suivant
            </button>
          )}
        </div>
      </VillaEditorShell>
    );
  }

  // Mode édition
  return (
    <VillaEditorShell
      sidebar={<QuickNav sections={sectionArr.slice(0, 8)} activeSection={hoveredSection ?? ""} onNavigate={(id) => {
        document.getElementById(`ve-${id}`)?.scrollIntoView({ behavior: "smooth" });
      }} />}
      preview={<VillaPreviewCard form={form} hoveredSection={hoveredSection} />}
    >
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-bold text-navy">Modifier la villa</h2>
        <AutosaveIndicator status={autoStatus} lastSaved={lastSaved} onRetry={() => { void doSave(); }} />
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

        {/* Photos */}
        <section
          id="ve-photos"
          onMouseEnter={() => setHoveredSection("photos")}
          onMouseLeave={() => setHoveredSection(null)}
        >
          <details className="group rounded-xl border border-navy/8 bg-white">
            <summary className="cursor-pointer list-none px-6 py-4 font-display text-base font-semibold text-navy marker:content-none [&::-webkit-details-marker]:hidden">
              Photos ({form.image_urls.length})
            </summary>
            <div className="border-t border-navy/5 px-6 pb-6">
              <p className="text-sm text-muted">Gestion des photos disponible dans l&apos;éditeur complet.</p>
            </div>
          </details>
        </section>

        {/* Équipements — sera enrichi en Task 12 */}
        <section id="ve-equipments" onMouseEnter={() => setHoveredSection("equipments")} onMouseLeave={() => setHoveredSection(null)}>
          <details className="group rounded-xl border border-navy/8 bg-white">
            <summary className="cursor-pointer list-none px-6 py-4 font-display text-base font-semibold text-navy marker:content-none [&::-webkit-details-marker]:hidden">Équipements</summary>
            <div className="border-t border-navy/5 px-6 pb-6">
              <p className="text-sm text-muted">Édition des équipements à venir.</p>
            </div>
          </details>
        </section>

        {/* Pièces — sera enrichi en Task 10 */}
        <section id="ve-rooms" onMouseEnter={() => setHoveredSection("rooms")} onMouseLeave={() => setHoveredSection(null)}>
          <details className="group rounded-xl border border-navy/8 bg-white">
            <summary className="cursor-pointer list-none px-6 py-4 font-display text-base font-semibold text-navy marker:content-none [&::-webkit-details-marker]:hidden">Pièces</summary>
            <div className="border-t border-navy/5 px-6 pb-6">
              <p className="text-sm text-muted">Édition des pièces à venir.</p>
            </div>
          </details>
        </section>

        {/* Tarifs — sera enrichi en Task 11 */}
        <section id="ve-pricing" onMouseEnter={() => setHoveredSection("pricing")} onMouseLeave={() => setHoveredSection(null)}>
          <details className="group rounded-xl border border-navy/8 bg-white">
            <summary className="cursor-pointer list-none px-6 py-4 font-display text-base font-semibold text-navy marker:content-none [&::-webkit-details-marker]:hidden">Tarifs</summary>
            <div className="border-t border-navy/5 px-6 pb-6">
              <p className="text-sm text-muted">Édition des tarifs à venir.</p>
            </div>
          </details>
        </section>

        {/* Services — sera enrichi en Task 12 */}
        <section id="ve-services" onMouseEnter={() => setHoveredSection("services")} onMouseLeave={() => setHoveredSection(null)}>
          <details className="group rounded-xl border border-navy/8 bg-white">
            <summary className="cursor-pointer list-none px-6 py-4 font-display text-base font-semibold text-navy marker:content-none [&::-webkit-details-marker]:hidden">Services</summary>
            <div className="border-t border-navy/5 px-6 pb-6">
              <p className="text-sm text-muted">Édition des services à venir.</p>
            </div>
          </details>
        </section>

        {/* Admin only */}
        {isAdmin && (
          <section id="ve-admin" onMouseEnter={() => setHoveredSection("admin")} onMouseLeave={() => setHoveredSection(null)}>
            <details className="group rounded-xl border border-navy/8 bg-white">
              <summary className="cursor-pointer list-none px-6 py-4 font-display text-base font-semibold text-navy marker:content-none [&::-webkit-details-marker]:hidden">Administration</summary>
              <div className="border-t border-navy/5 px-6 pb-6 space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-muted mb-1">Collection</label>
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
                  <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-muted mb-1">Commission (%)</label>
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
                  <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-muted mb-1">Frais de ménage (€)</label>
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
```

⚠️ Fichier ~300 lignes — sous la limite des 500. Si les enrichissements des tâches 9-13 le font grossir, extraire les sections dans `components/dashboard/villa-editor/VillaEditSections.tsx`.

- [ ] **Step 2: Gate + commit**

Run: `npx tsc --noEmit`

```bash
git add components/dashboard/villa-editor/VillaEditor.tsx
git commit -m "feat(villa): VillaEditor — bascule création/édition, stepper, accordéon, sections admin"
git push
```

---

### Task 6: RoomsEditor — upgrade icônes + capacité + presets

**Files:**
- Modify: `components/dashboard/villa-editor/RoomsEditor.tsx`

- [ ] **Step 1: Réécrire RoomsEditor**

```tsx
// components/dashboard/villa-editor/RoomsEditor.tsx (REMPLACER intégralement)
"use client";

import { Plus, Trash2, Bed, BedSingle, Sofa, ChevronDown } from "lucide-react";
import { ROOM_PRESETS, getBedCapacity, totalRoomCapacity } from "@/lib/room-presets";
import { useState } from "react";

type Room = { name: string; bed: string; ensuite: boolean };

const BED_OPTIONS = ["King size", "Queen size", "Double", "Simple", "Canapé-lit"];

function BedIcon({ bed }: { bed: string }) {
  const cls = "size-5 text-navy/60";
  if (bed === "King size" || bed === "Queen size") return <Bed className={cls} aria-hidden />;
  if (bed === "Double") return <Bed className={cls} aria-hidden />;
  if (bed === "Canapé-lit") return <Sofa className={cls} aria-hidden />;
  return <BedSingle className={cls} aria-hidden />; // Simple
}

export function RoomsEditor({ rooms, onChange }: { rooms: Room[]; onChange: (rooms: Room[]) => void }) {
  const [presetOpen, setPresetOpen] = useState(false);
  const capacity = totalRoomCapacity(rooms);

  const add = () => onChange([...rooms, { name: "", bed: "Queen size", ensuite: false }]);
  const update = (i: number, field: keyof Room, value: string | boolean) => {
    const next = [...rooms];
    next[i] = { ...next[i], [field]: value };
    onChange(next);
  };
  const remove = (i: number) => onChange(rooms.filter((_, idx) => idx !== i));
  const applyPreset = (preset: (typeof ROOM_PRESETS)[number]) => {
    onChange([...rooms, ...preset.rooms.map((r, i) => ({ ...r, name: r.name || `${preset.label} ${i + 1}` }))]);
    setPresetOpen(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
          Détail des chambres
        </label>
        <span className="text-[11px] font-medium text-navy/50">
          {rooms.length} chambre{rooms.length > 1 ? "s" : ""} · {capacity} personne{capacity > 1 ? "s" : ""}
        </span>
      </div>

      {rooms.map((r, i) => (
        <div key={i} className="flex items-center gap-3 rounded-xl border border-navy/8 bg-white p-4">
          <BedIcon bed={r.bed} />
          <div className="min-w-0 flex-1 space-y-2">
            <input
              placeholder="Nom (ex: Chambre 1)"
              value={r.name}
              onChange={(e) => update(i, "name", e.target.value)}
              className="w-full rounded-lg border border-navy/10 px-3 py-2 text-sm focus:border-gold focus:outline-none"
            />
            <div className="flex items-center gap-3">
              <select
                value={r.bed}
                onChange={(e) => update(i, "bed", e.target.value)}
                className="flex-1 rounded-lg border border-navy/10 px-3 py-2 text-sm focus:border-gold focus:outline-none"
              >
                {BED_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              <span className="text-[11px] text-navy/40">{getBedCapacity(r.bed)} pers.</span>
            </div>
            <label className="flex items-center gap-2 text-xs text-navy/70 cursor-pointer">
              <input
                type="checkbox"
                checked={r.ensuite}
                onChange={(e) => update(i, "ensuite", e.target.checked)}
                className="h-4 w-4 rounded border-navy/25 text-gold focus:ring-gold"
              />
              Salle de bain privative
            </label>
          </div>
          <button type="button" onClick={() => remove(i)} className="shrink-0 text-red-400 hover:text-red-600" aria-label="Supprimer">
            <Trash2 size={18} />
          </button>
        </div>
      ))}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={add}
          className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-navy/15 bg-white px-4 text-sm font-medium text-navy hover:border-navy/30"
        >
          <Plus size={16} /> Ajouter une chambre
        </button>
        <div className="relative">
          <button
            type="button"
            onClick={() => setPresetOpen(!presetOpen)}
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-navy/15 bg-white px-4 text-sm font-medium text-navy hover:border-navy/30"
          >
            Presets <ChevronDown size={14} />
          </button>
          {presetOpen && (
            <div className="absolute left-0 top-full z-20 mt-1 w-56 rounded-lg border border-navy/10 bg-white shadow-lg">
              {ROOM_PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => applyPreset(p)}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-navy hover:bg-navy/5"
                >
                  <Bed size={14} className="shrink-0 text-navy/40" />
                  <span>{p.label}</span>
                  <span className="ml-auto text-[11px] text-navy/40">{p.rooms.length} ch.</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Gate + commit**

Run: `npx tsc --noEmit`

```bash
git add components/dashboard/villa-editor/RoomsEditor.tsx
git commit -m "feat(villa): RoomsEditor — icônes lit, capacité auto, presets parentale/standard/enfant"
git push
```

---

### Task 7: SeasonalPricesEditor — upgrade timeline + sélecteurs + anti-chevauchement

**Files:**
- Modify: `components/dashboard/villa-editor/SeasonalPricesEditor.tsx`

⚠️ RÉTROCOMPATIBILITÉ : même principe que Task 8 — l'ancien `SeasonalPricesEditor` (props `{ seasons, onChange }`) est encore importé par les anciens formulaires. Exporter l'ancienne signature ET la nouvelle (`{ seasons, onChange, basePrice? }`) — `basePrice` est optionnel pour ne pas casser les callers existants.

- [ ] **Step 1: Réécrire SeasonalPricesEditor**

```tsx
// components/dashboard/villa-editor/SeasonalPricesEditor.tsx (REMPLACER intégralement)
"use client";

import { Plus, Trash2, Copy, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

type Season = { season: string; start: string; end: string; price: number };

const MONTHS = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"));
const DAYS = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, "0"));

function overlaps(a: Season, b: Season): boolean {
  if (a.start <= b.start && a.end >= b.start) return true;
  if (b.start <= a.start && b.end >= a.start) return true;
  return false;
}

function seasonBars(seasons: Season[]) {
  return seasons.map((s) => {
    const startMonth = parseInt(s.start.split("-")[0], 10);
    const endMonth = parseInt(s.end.split("-")[0], 10);
    const left = ((startMonth - 1) / 12) * 100;
    const width = Math.max(((endMonth - startMonth + 1) / 12) * 100, 3);
    return { ...s, left, width };
  });
}

export function SeasonalPricesEditor({
  seasons,
  onChange,
  basePrice,
}: {
  seasons: Season[];
  onChange: (seasons: Season[]) => void;
  basePrice?: number;
}) {
  const add = () => onChange([...seasons, { season: "", start: "01-01", end: "12-31", price: basePrice ?? 100 }]);
  const update = (i: number, field: keyof Season, value: string | number) => {
    const next = [...seasons];
    next[i] = { ...next[i], [field]: value };
    onChange(next);
  };
  const remove = (i: number) => onChange(seasons.filter((_, idx) => idx !== i));
  const duplicate = (i: number) => {
    const copy = { ...seasons[i], season: `${seasons[i].season} (copie)` };
    const next = [...seasons];
    next.splice(i + 1, 0, copy);
    onChange(next);
  };

  const bars = seasonBars(seasons);
  const conflicts = new Set<number>();
  for (let i = 0; i < seasons.length; i++) {
    for (let j = i + 1; j < seasons.length; j++) {
      if (overlaps(seasons[i], seasons[j])) {
        conflicts.add(i);
        conflicts.add(j);
      }
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted">Prix saisonniers</label>
        <span className="text-[11px] font-medium text-navy/50">{seasons.length} saison{seasons.length > 1 ? "s" : ""}</span>
      </div>

      {/* Ligne prix standard */}
      <div className="flex items-center gap-3 rounded-xl border border-navy/8 bg-navy/[0.02] px-4 py-3">
        <span className="text-sm font-medium text-navy">Prix standard</span>
        <span className="ml-auto text-sm font-semibold text-navy">{basePrice ?? "—"} €/nuit</span>
      </div>

      {/* Timeline */}
      {seasons.length > 0 && (
        <div className="relative h-8 rounded-lg bg-navy/5">
          {bars.map((s, i) => (
            <div
              key={i}
              title={`${s.season}: ${s.price}€`}
              className={cn(
                "absolute top-1 h-6 rounded opacity-80",
                conflicts.has(i) ? "bg-red-400" : "bg-gold/60"
              )}
              style={{ left: `${s.left}%`, width: `${s.width}%` }}
            />
          ))}
          {conflicts.size > 0 && (
            <div className="mt-2 flex items-center gap-1 text-[11px] text-red-500">
              <AlertTriangle size={12} /> Chevauchement détecté
            </div>
          )}
        </div>
      )}

      {seasons.map((s, i) => (
        <div key={i} className={cn("grid gap-3 sm:grid-cols-[1fr_auto_auto_auto_auto_auto] items-center rounded-xl border p-3", conflicts.has(i) ? "border-red-200 bg-red-50/50" : "border-navy/5")}>
          <input
            placeholder="Saison"
            value={s.season}
            onChange={(e) => update(i, "season", e.target.value)}
            className="min-h-[40px] rounded-lg border border-navy/10 px-3 py-2 text-sm focus:border-gold focus:outline-none"
          />
          <div className="flex items-center gap-1 text-[11px] text-navy/40">
            <select value={s.start.split("-")[0]} onChange={(e) => update(i, "start", `${e.target.value}-${s.start.split("-")[1] || "01"}`)} className="rounded border border-navy/10 px-1 py-1 text-xs">
              {MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
            <select value={s.start.split("-")[1]} onChange={(e) => update(i, "start", `${s.start.split("-")[0] || "01"}-${e.target.value}`)} className="rounded border border-navy/10 px-1 py-1 text-xs">
              {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <span className="text-[11px] text-navy/30">→</span>
          <div className="flex items-center gap-1 text-[11px] text-navy/40">
            <select value={s.end.split("-")[0]} onChange={(e) => update(i, "end", `${e.target.value}-${s.end.split("-")[1] || "31"}`)} className="rounded border border-navy/10 px-1 py-1 text-xs">
              {MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
            <select value={s.end.split("-")[1]} onChange={(e) => update(i, "end", `${s.end.split("-")[0] || "12"}-${e.target.value}`)} className="rounded border border-navy/10 px-1 py-1 text-xs">
              {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="relative">
            <input
              type="number"
              min="0"
              value={s.price || ""}
              onChange={(e) => update(i, "price", Number(e.target.value))}
              className="w-24 rounded-lg border border-navy/10 px-3 py-2 text-sm focus:border-gold focus:outline-none"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-navy/30 pointer-events-none">€/n</span>
          </div>
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => duplicate(i)} className="text-navy/40 hover:text-navy" aria-label="Dupliquer"><Copy size={14} /></button>
            <button type="button" onClick={() => remove(i)} className="text-red-400 hover:text-red-600" aria-label="Supprimer"><Trash2 size={14} /></button>
          </div>
        </div>
      ))}

      <button type="button" onClick={add} className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-medium text-gold hover:underline">
        <Plus size={16} /> Ajouter une saison
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Gate + commit**

Run: `npx tsc --noEmit`

```bash
git add components/dashboard/villa-editor/SeasonalPricesEditor.tsx
git commit -m "feat(villa): SeasonalPricesEditor — timeline, sélecteurs mois, anti-chevauchement, copier"
git push
```

---

### Task 8: VillaAmenitiesEditor — upgrade catégories + recherche + presets

**Files:**
- Modify: `components/dashboard/villa-editor/VillaAmenitiesEditor.tsx`

- [ ] **Step 1: Réécrire VillaAmenitiesEditor**

Version enrichie : props élargies pour recevoir les 5 catégories + presets. Le code complet (~220 lignes) suit le même patron mais avec :
- `onChange` par catégorie (5 callbacks distincts : `onChangeInterior`, `onChangeExterior`, etc.)
- `AmenityPresetDropdown` — bouton « Remplissage rapide » → applique un `AMENITY_PRESETS`
- `AmenityCategorySection` — par catégorie : suggestions filtrées depuis `SUGGESTED_AMENITIES[category]` + champ « Filtrer… » si >8 items
- Chips : `min-h-[36px]`, badge « Import » pour les imports OTA

Vu la longueur, voici le fichier complet — lire `lib/amenity-presets.ts` (Task 1) et `lib/villa-amenities-suggested.ts` (Task 1) pour les imports.

⚠️ RÉTROCOMPATIBILITÉ : l'ancien VillaAmenitiesEditor est importé par AdminVillaForm et VillaEditorForm (encore en vie jusqu'à la Task 14). Le nouveau fichier doit exporter UNIQUEMENT les anciennes props (`amenities: string[]`, `amenitiesImportLabels`, `onChange`, `draft`, `onDraftChange`) pour ne pas casser ces callers. La nouvelle version avec les 5 catégories sera importée via un NOUVEAU composant `VillaAmenitiesEditorV2` (même fichier, export nommé séparé). Ainsi les anciens formulaires continuent de marcher jusqu'à leur suppression en Task 14.

```ts
type VillaAmenitiesEditorProps = {
  interior: string[]; exterior: string[]; servicesHome: string[]; servicesCollection: string[]; aLaCarte: string[];
  amenitiesImportLabels: string[];
  onChangeInterior: (v: string[]) => void;
  onChangeExterior: (v: string[]) => void;
  onChangeServicesHome: (v: string[]) => void;
  onChangeServicesCollection: (v: string[]) => void;
  onChangeALaCarte: (v: string[]) => void;
  draft: string;
  onDraftChange: (v: string) => void;
};
```

Le composant rend 5 `AmenityCategorySection` (une par catégorie), chacune avec :
- Titre de catégorie + compteur « Intérieur (8) »
- Suggestions pertinentes en chips (toggle on/off), champ « Filtrer… » si >8
- Input + bouton « Ajouter » pour les personnalisés
- Badge « Import » sur les chips importées

Ajouter en haut un bouton dropdown « Remplissage rapide » avec les 3 presets de `AMENITY_PRESETS`.

- [ ] **Step 2: Gate + commit**

```bash
git add components/dashboard/villa-editor/VillaAmenitiesEditor.tsx
git commit -m "feat(villa): VillaAmenitiesEditor — 5 catégories, recherche, presets rapides"
git push
```

---

### Task 9: ChipEditor + EmergencyContactsEditor — polish

**Files:**
- Modify: `components/dashboard/villa-editor/ChipEditor.tsx`
- Modify: `components/dashboard/villa-editor/EmergencyContactsEditor.tsx`

- [ ] **Step 1: ChipEditor — recherche + contraste corrigé**

Ajouter un champ recherche au-dessus des suggestions quand >8 items, et corriger le contraste des chips non-sélectionnées.

Modifications précises :
1. Ajouter `search` state + champ `<input>` filtrant `suggestions` au-dessus du `flex flex-wrap gap-2` de suggestions (visible si `suggestions.length > 8`).
2. Remplacer `bg-gray-100 text-navy/80` → `border border-navy/15 text-navy/60` pour le contraste.
3. Hauteur minimum garantie : `min-h-[36px]` sur les chips.
4. Input principal : remplacer `text-sm` → `text-base` (anti-zoom iOS), `rounded-xl` → `rounded-lg`.

- [ ] **Step 2: EmergencyContactsEditor — élargissement**

1. Champ téléphone : `w-40` → `flex-1`.
2. Placeholder téléphone : `+596 696 XX XX XX`.
3. Inputs : `text-sm` → `text-base` (anti-zoom iOS), `min-h-[44px]`.

- [ ] **Step 3: Gate + commit**

```bash
git add components/dashboard/villa-editor/ChipEditor.tsx components/dashboard/villa-editor/EmergencyContactsEditor.tsx
git commit -m "feat(villa): ChipEditor recherche + contraste, EmergencyContactsEditor élargi"
git push
```

---

### Task 10: VillaImageManager — drag & drop + suppression multiple

**Files:**
- Modify: `components/dashboard/villa-editor/VillaImageManager.tsx`

Modifications :
1. **Drag & drop natif HTML5** sur les vignettes : `onDragStart`, `onDragOver` (preventDefault), `onDrop` → `arrayMove(imageUrls, from, to)`. Garder les flèches ↑↓ en fallback mobile (`hidden sm:flex`).
2. Badge « Cover » : couronne dorée (`KayvilaPngIcon name="crown"` si existe, sinon `Star`) sur la 1ère image.
3. Mode sélection multiple : bouton « Modifier » → `selecting` state → checkbox sur chaque vignette → bouton « Supprimer (N) ».
4. Compteur : `Photos ({imageUrls.length}/20)` dans l'en-tête.

- [ ] **Step 2: Gate + commit**

```bash
git add components/dashboard/villa-editor/VillaImageManager.tsx
git commit -m "feat(villa): VillaImageManager — drag & drop, cover badge, suppression multiple"
git push
```

---

### Task 11: VillaFormFields — accordéon + géoloc contrôlée

**Files:**
- Modify: `components/dashboard/villa-editor/VillaFormFields.tsx`

Modifications :
1. Remplacer les sections plates par un **accordéon** : une seule section ouverte à la fois via `useState<string | null>`.
2. Remplacer les emojis (🏠, 📍…) dans `FormSection` par des `DashboardNavIcon name=` (cohérent avec le reste du dashboard).
3. Géolocalisation : remplacer `document.getElementById` par des appels à `onChange("latitude", ...)` / `onChange("longitude", ...)` — état contrôlé React.
4. Ajouter lien « Ouvrir dans Maps » après les coordonnées : `href="https://maps.google.com/?q=${form.latitude},${form.longitude}"`.

- [ ] **Step 2: Gate + commit**

```bash
git add components/dashboard/villa-editor/VillaFormFields.tsx
git commit -m "feat(villa): VillaFormFields — accordéon, icônes string, géoloc contrôlée"
git push
```

---

### Task 12: Enrichir VillaEditor — brancher tous les sous-éditeurs améliorés

**Files:**
- Modify: `components/dashboard/villa-editor/VillaEditor.tsx`

Remplacer les placeholders ("À venir") dans chaque section par les vrais sous-éditeurs :
- Section Photos → `<VillaImageManager imageUrls={...} villaId={villa?.id} ... />`
- Section Équipements → `<VillaAmenitiesEditor interior={...} exterior={...} ... />`
- Section Pièces → `<RoomsEditor rooms={...} onChange={...} />`
- Section Tarifs → `<SeasonalPricesEditor seasons={...} onChange={...} basePrice={form.price_per_night} />`
- Section Contacts → `<EmergencyContactsEditor contacts={...} onChange={...} />`
- Section Services → `<ChipEditor id="services-home" label="Services inclus" items={...} suggestions={SUGGESTED_AMENITIES.servicesHome} onChange={...} />` (×3 pour home/collection/aLaCarte)
- Section Règles → `<ChipEditor id="house-rules" label="Règles intérieures" ... />` + `<ChipEditor id="safety" label="Sécurité" ... />`
- Section iCal → `<PlanningIcalSyncCard />` + `<IcalConnectivityStatus />` (existants)
- Section Admin → déjà fait (Task 5)

- [ ] **Step 2: Gate + commit**

```bash
git add components/dashboard/villa-editor/VillaEditor.tsx
git commit -m "feat(villa): VillaEditor — branchement complet des 10 sous-éditeurs"
git push
```

---

### Task 13: Pages wrappers — admin + proprio

**Files:**
- Modify: `app/(admin)/admin/villas/ajouter/page.tsx`
- Modify: `app/(admin)/admin/villas/[id]/page.tsx`
- Modify: `app/(proprio)/dashboard/villas/[villaId]/page.tsx`
- Modify: `app/(proprio)/dashboard/villas/nouvelle/page.tsx`

Remplacer le contenu actuel par un wrapper `<VillaEditor>` :

```tsx
// Exemple : app/(admin)/admin/villas/ajouter/page.tsx
import { VillaEditor } from "@/components/dashboard/villa-editor/VillaEditor";

export default function AdminVillaCreatePage() {
  return <VillaEditor isAdmin />;
}
```

```tsx
// app/(admin)/admin/villas/[id]/page.tsx — remplacer AdminVillaEditClient par VillaEditor
// (garder VillaBookingsRegistry, PlanningIcalSyncCard, IcalConnectivityStatus,
//  AdminVillaBlocks DANS la page wrapper, PAS dans VillaEditor)
```

Adapter chaque page : les blocs exclus (`VillaBookingsRegistry`, `PlanningIcalSyncCard`, `IcalConnectivityStatus`, `AdminVillaBlocks`) restent dans la page wrapper (après `<VillaEditor>`), pas dans l'éditeur. L'import OTA (section « Démarrage rapide ») est conservé dans la page `/admin/villas/ajouter` AVANT ou APRÈS le `<VillaEditor>` — ne pas le supprimer.

- [ ] **Step 2: Gate + commit**

```bash
git add app/\(admin\)/admin/villas/ajouter/page.tsx app/\(admin\)/admin/villas/\[id\]/page.tsx app/\(proprio\)/dashboard/villas/\[villaId\]/page.tsx app/\(proprio\)/dashboard/villas/nouvelle/page.tsx
git commit -m "feat(villa): pages wrappers admin+proprio avec VillaEditor"
git push
```

---

### Task 14: Cleanup — supprimer les anciens fichiers

**Files:**
- Delete: `components/dashboard/admin/AdminVillaForm.tsx`
- Delete: `components/dashboard/proprio/VillaEditorForm.tsx`
- Modify: `app/(admin)/admin/villas/[id]/AdminVillaEditClient.tsx` (simplifier — retirer le formulaire, ne garder que la partie blocs/réservations/iCal)

- [ ] **Step 1: Supprimer + simplifier AdminVillaEditClient**

Supprimer les deux fichiers. Puis dans `AdminVillaEditClient.tsx`, retirer tout ce qui concerne `VillaEditorForm` / le formulaire — ne garder que l'appel à `VillaEditor` + les blocs/iCal/réservations en dessous.

- [ ] **Step 2: Vérifier que rien n'est cassé**

Run: `npx tsc --noEmit` — les imports résiduels vers les fichiers supprimés apparaîtront. Corriger.

Grep: `rg "AdminVillaForm" app/ components/ --include="*.tsx"` — ne doit rien retourner.

- [ ] **Step 3: Commit**

```bash
git rm components/dashboard/admin/AdminVillaForm.tsx components/dashboard/proprio/VillaEditorForm.tsx
git add app/\(admin\)/admin/villas/\[id\]/AdminVillaEditClient.tsx
git commit -m "feat(villa): suppression AdminVillaForm + VillaEditorForm, AdminVillaEditClient simplifié"
git push
```

---

### Task 15: Tests Vitest complets

**Files:**
- Create/modify: `lib/villa-editor-state.test.ts` (étendre — déjà 5 tests Task 2)
- Create: `lib/season-overlap.test.ts`
- Test: `lib/amenity-presets.test.ts`

- [ ] **Step 1: Season overlap**

```ts
// lib/season-overlap.test.ts
import { describe, it, expect } from "vitest";

function overlaps(a: { start: string; end: string }, b: { start: string; end: string }): boolean {
  return a.start <= b.start && a.end >= b.start || b.start <= a.start && b.end >= a.start;
}

describe("season bumps", () => {
  it("01-01..06-30 chevauche 06-01..12-31", () => {
    expect(overlaps({ start: "01-01", end: "06-30" }, { start: "06-01", end: "12-31" })).toBe(true);
  });
  it("01-01..03-31 ne chevauche PAS 04-01..12-31", () => {
    expect(overlaps({ start: "01-01", end: "03-31" }, { start: "04-01", end: "12-31" })).toBe(false);
  });
  it("chevauchement complet", () => {
    expect(overlaps({ start: "01-01", end: "06-30" }, { start: "02-01", end: "03-31" })).toBe(true);
  });
});
```

- [ ] **Step 2: Amenity presets**

```ts
// lib/amenity-presets.test.ts
import { describe, it, expect } from "vitest";
import { AMENITY_PRESETS } from "./amenity-presets";

describe("AMENITY_PRESETS", () => {
  it("a 3 presets", () => expect(AMENITY_PRESETS).toHaveLength(3));
  it("chaque preset a au moins 1 aménité", () => {
    for (const p of AMENITY_PRESETS) {
      const total = p.interior.length + p.exterior.length + p.servicesHome.length + p.servicesCollection.length + p.aLaCarte.length;
      expect(total).toBeGreaterThanOrEqual(3);
    }
  });
});
```

- [ ] **Step 3: Run all + commit**

Run: `npx vitest run`
Expected: ~16 passed (8 Task 1 + 5 Task 2 + 3 ici)

```bash
git add lib/season-overlap.test.ts lib/amenity-presets.test.ts
git commit -m "test(villa): Vitest — reducer, saisons, presets (16 tests)"
git push
```

---

### Task 16: Playwright — création wizard + édition + mobile

**Files:**
- Create: `tests/crud-villa-unified.spec.ts`

Tests Playwright (6 tests, `--workers=1`, `PLAYWRIGHT_BASE_URL=http://localhost:3001`). Utiliser le helper login de `tests/responsive-dashboards.spec.ts`.

1. **Création wizard flow** (admin, 390×844) : /admin/villas/ajouter → remplir nom dans step 1 → Suivant → step 2 → Suivant → step 3 → saisir prix → Suivant → step 4 → clic Publier → redirection vers /admin/villas/[id].
2. **Édition : sections repliables** (admin, 1280×800) : /admin/villas/[id] → ouvrir section Infos → champ nom modifiable → ouvrir section Admin → checkbox Publiée + select Collection.
3. **Autosave indicator** (admin, 1280×800) : modifier un champ → attendre 3s → indicateur passe au vert "Enregistré".
4. **Preview live** (admin, 1280×800) : preview affiche le nom, le prix et les équipements saisis.
5. **Mobile tabs** (admin, 390×844) : /admin/villas/[id] → onglets Éditer/Aperçu visibles → tap Aperçu → preview visible → tap Éditer → formulaire visible.
6. **Admin vs proprio fields** : proprio /dashboard/villas/[id] → section Administration NON visible. Admin → section Administration visible.

- [ ] **Step 2: Run + commit**

Run: `PLAYWRIGHT_BASE_URL="http://localhost:3001" npx playwright test tests/crud-villa-unified.spec.ts --workers=1`
Expected: 6/6 PASS

```bash
git add tests/crud-villa-unified.spec.ts
git commit -m "test(villa): Playwright — wizard création, édition 10 sections, preview, mobile, admin vs proprio"
git push
```

---

### Task 17: Revue finale + merge

- [ ] **Step 1: Revue whole-branch** : `git diff main...HEAD` — vérifier side-stripe, gradient-text, fonctions en props Server→Client, or = 1 CTA/écran.
- [ ] **Step 2: Gates finaux** : `npx tsc --noEmit` (10 erreurs pré-existantes max), `npx vitest run` (16+), Playwright 6/6.
- [ ] **Step 3:** Validation Kenneson → merge FF sur `main`, push, vérifier Vercel.
