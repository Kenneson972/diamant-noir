# Fiche villa — Réorganisation façon Airbnb Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reorder the sections of the public villa detail page (`app/villas/[id]/page.tsx`) to match the structure of an Airbnb listing page, and rework the amenities display into a flat preview + "see all" modal, while keeping the existing Kayvila visual style unchanged.

**Architecture:** Pure reordering of existing JSX sections inside the already-existing two-column layout (`VillaBookingWrapper` > grid > left column / sticky right column). One new pure helper function (dedup/prioritize amenities for the preview), one new client component (amenities preview + reused modal), one existing component simplified (accordion → flat columns). No new page routes, no new data fetching, no new dependencies.

**Tech Stack:** Next.js 14 App Router (Server Component page + Client Components for interactive bits), Tailwind CSS, Vitest for pure-function tests, existing `LegalModal` component reused as the generic modal primitive.

## Global Constraints

- Keep the existing Kayvila visual style exactly as-is: navy/gold palette, `rounded-none` (square corners), Playfair Display — no aesthetic changes (per `CLAUDE.md`, changes to palette/typography must be flagged separately, out of scope here).
- No new UI library dependency — reuse `components/legal/LegalModal.tsx` as the modal primitive (already generic, already reused outside `legal/` in `components/booking/CheckoutView.tsx`).
- Do not touch: `ConnectedBookingForm` / sticky booking column, `VillaGallery`, `VillaReviews` internals, availability calendar logic, calculation logic in `lib/revenue/*`.
- Do not modify Supabase migrations or the villa data schema — all fields used already exist and are already selected in the `page.tsx` query.
- TypeScript strict, no new `any`.
- Tests: `npm test` (= `vitest run`) must pass with no regressions. **Never run `npm run build`** (corrupts the dev cache on this project — dev server runs on port 3001 via `npm run dev`).
- Commits in French, format `type(scope): message`.

---

### Task 1: Pure helper — amenities preview builder

**Files:**
- Create: `lib/villa-amenities-preview.ts`
- Test: `lib/villa-amenities-preview.test.ts`

**Interfaces:**
- Produces: `buildAmenitiesPreview(input: AmenityCategoryInput): AmenitiesPreview`, where
  ```ts
  type AmenityCategoryInput = {
    interior: string[];
    exterior: string[];
    servicesHome: string[];
    servicesCollection: string[];
    aLaCarte: string[];
  };
  type AmenitiesPreview = { preview: string[]; total: number };
  ```
  Used by Task 2's `VillaAmenitiesPreview` component.

- [ ] **Step 1: Write the failing tests**

Create `lib/villa-amenities-preview.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { buildAmenitiesPreview } from "./villa-amenities-preview";

describe("buildAmenitiesPreview", () => {
  it("returns empty preview and zero total for empty categories", () => {
    const result = buildAmenitiesPreview({
      interior: [],
      exterior: [],
      servicesHome: [],
      servicesCollection: [],
      aLaCarte: [],
    });
    expect(result).toEqual({ preview: [], total: 0 });
  });

  it("caps the preview at 10 items, prioritizing interior then exterior", () => {
    const result = buildAmenitiesPreview({
      interior: ["Wifi", "Climatisation", "Cuisine", "TV", "Lave-linge", "Baignoire"],
      exterior: ["Piscine", "Jardin", "Terrasse", "Parking", "Barbecue"],
      servicesHome: ["Ménage"],
      servicesCollection: [],
      aLaCarte: [],
    });
    expect(result.preview).toHaveLength(10);
    expect(result.preview).toEqual([
      "Wifi", "Climatisation", "Cuisine", "TV", "Lave-linge", "Baignoire",
      "Piscine", "Jardin", "Terrasse", "Parking",
    ]);
    expect(result.total).toBe(13);
  });

  it("fills remaining preview slots from services when interior+exterior are under 10", () => {
    const result = buildAmenitiesPreview({
      interior: ["Wifi", "Climatisation"],
      exterior: ["Piscine"],
      servicesHome: ["Ménage", "Draps"],
      servicesCollection: ["Concierge dédié"],
      aLaCarte: ["Chef privé", "Massage"],
    });
    expect(result.preview).toEqual([
      "Wifi", "Climatisation", "Piscine", "Ménage", "Draps",
      "Concierge dédié", "Chef privé", "Massage",
    ]);
    expect(result.total).toBe(8);
  });

  it("dedupes repeated labels in the preview but still counts them in the total", () => {
    const result = buildAmenitiesPreview({
      interior: ["Wifi"],
      exterior: [],
      servicesHome: [],
      servicesCollection: [],
      aLaCarte: ["Wifi"],
    });
    expect(result.preview).toEqual(["Wifi"]);
    expect(result.total).toBe(2);
  });

  it("ignores empty string entries", () => {
    const result = buildAmenitiesPreview({
      interior: ["Wifi", ""],
      exterior: [],
      servicesHome: [],
      servicesCollection: [],
      aLaCarte: [],
    });
    expect(result.preview).toEqual(["Wifi"]);
    expect(result.total).toBe(2);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run lib/villa-amenities-preview.test.ts`
Expected: FAIL — `Cannot find module './villa-amenities-preview'`

- [ ] **Step 3: Implement the pure function**

Create `lib/villa-amenities-preview.ts`:

```ts
export type AmenityCategoryInput = {
  interior: string[];
  exterior: string[];
  servicesHome: string[];
  servicesCollection: string[];
  aLaCarte: string[];
};

export type AmenitiesPreview = {
  preview: string[];
  total: number;
};

const PREVIEW_LIMIT = 10;

/**
 * Aperçu plat (façon Airbnb) des équipements d'une villa : jusqu'à 10 items
 * dédupliqués, priorité Intérieur > Extérieur > Services (domicile > collection > à la carte).
 * `total` compte tous les items de toutes les catégories (avant dédup), utilisé
 * pour le bouton "Voir les N équipements".
 */
export function buildAmenitiesPreview(input: AmenityCategoryInput): AmenitiesPreview {
  const ordered = [
    ...input.interior,
    ...input.exterior,
    ...input.servicesHome,
    ...input.servicesCollection,
    ...input.aLaCarte,
  ];

  const total = ordered.filter((item) => item !== "").length;

  const seen = new Set<string>();
  const preview: string[] = [];
  for (const item of ordered) {
    if (!item || seen.has(item)) continue;
    seen.add(item);
    preview.push(item);
    if (preview.length >= PREVIEW_LIMIT) break;
  }

  return { preview, total };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run lib/villa-amenities-preview.test.ts`
Expected: PASS — 5 tests passed

- [ ] **Step 5: Commit**

```bash
git add lib/villa-amenities-preview.ts lib/villa-amenities-preview.test.ts
git commit -m "feat(villas): ajoute buildAmenitiesPreview pour l'aperçu équipements"
```

---

### Task 2: `VillaAmenitiesPreview` component (aperçu + modale)

**Files:**
- Create: `components/villas/VillaAmenitiesPreview.tsx`
- Modify: `app/villas/[id]/page.tsx` (remove inline `getEquipmentIcon`/`EquipmentCategory`, import new component) — done together with Task 4's reorder to avoid an intermediate broken state; this task only creates the new file.

**Interfaces:**
- Consumes: `buildAmenitiesPreview` from `lib/villa-amenities-preview.ts` (Task 1); `LegalModal` from `components/legal/LegalModal.tsx` (props: `open: boolean`, `onClose: () => void`, `title: string`, `children: React.ReactNode`); `KayvilaPngIcon`/`KayvilaPngName` from `components/icons/KayvilaPngIcon`.
- Produces: `VillaAmenitiesPreview` React component, props:
  ```ts
  type VillaAmenitiesPreviewProps = {
    equipmentInterior: string[];
    equipmentExterior: string[];
    includedServicesHome: string[];
    includedServicesCollection: string[];
    aLaCarteServices: string[];
  };
  ```
  Also exports `getEquipmentIcon(label: string): KayvilaPngName` (named export, not default) — Task 4 re-imports it in `app/villas/[id]/page.tsx` for the "Services à la carte" mini-list still rendered inside the "Expérience Kayvila" section, so the icon-mapping logic has a single source of truth instead of being duplicated.
  Consumed by Task 4 in `app/villas/[id]/page.tsx`.

- [ ] **Step 1: Create the component**

Create `components/villas/VillaAmenitiesPreview.tsx`:

```tsx
"use client";

import { useState } from "react";
import { KayvilaPngIcon, type KayvilaPngName } from "@/components/icons/KayvilaPngIcon";
import { LegalModal } from "@/components/legal/LegalModal";
import { buildAmenitiesPreview } from "@/lib/villa-amenities-preview";

export const getEquipmentIcon = (label: string): KayvilaPngName => {
  const a = label.toLowerCase();
  if (a.includes("wifi")) return "wifi";
  if (a.includes("climatisation") || a.includes("clim")) return "ac";
  if (a.includes("piscine")) return "pool";
  if (a.includes("jacuzzi")) return "pool";
  if (a.includes("barbecue") || a.includes("bbq")) return "fireplace";
  if (a.includes("jardin") || a.includes("terrasse") || a.includes("extérieur")) return "tree";
  if (a.includes("parking") || a.includes("garage")) return "car";
  if (a.includes("cuisine") || a.includes("réfrigérateur")) return "kitchen";
  if (a.includes("tv") || a.includes("télé") || a.includes("écran")) return "tv";
  if (a.includes("machine à laver") || a.includes("lave-linge")) return "wash";
  if (a.includes("chef") || a.includes("restauration")) return "chef";
  if (a.includes("bateau") || a.includes("nautique") || a.includes("mer") || a.includes("vue") || a.includes("plage")) return "boat";
  if (a.includes("massage") || a.includes("spa") || a.includes("bien-être")) return "heart";
  if (a.includes("concierge") || a.includes("accueil") || a.includes("dédié")) return "users";
  if (a.includes("ménage") || a.includes("draps") || a.includes("serviettes") || a.includes("linge")) return "bed";
  if (a.includes("borne") || a.includes("ev") || a.includes("électrique")) return "car";
  if (a.includes("salle de sport") || a.includes("fitness") || a.includes("gym")) return "gym";
  if (a.includes("sécurité") || a.includes("alarme") || a.includes("caméra")) return "shield-check";
  if (a.includes("clé") || a.includes("autonome") || a.includes("self")) return "key";
  if (a.includes("transfert") || a.includes("navette") || a.includes("transport")) return "plane";
  return "check-circle";
};

function EquipmentCategory({ title, items }: { title: string; items: string[] }) {
  if (!items || items.length === 0) return null;
  return (
    <div>
      <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.28em] text-navy/55">{title}</p>
      <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-3">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-3">
            <KayvilaPngIcon name={getEquipmentIcon(item)} size={20} alt="" />
            <span className="text-sm text-navy/70">{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

type VillaAmenitiesPreviewProps = {
  equipmentInterior: string[];
  equipmentExterior: string[];
  includedServicesHome: string[];
  includedServicesCollection: string[];
  aLaCarteServices: string[];
};

export function VillaAmenitiesPreview({
  equipmentInterior,
  equipmentExterior,
  includedServicesHome,
  includedServicesCollection,
  aLaCarteServices,
}: VillaAmenitiesPreviewProps) {
  const [open, setOpen] = useState(false);

  const { preview, total } = buildAmenitiesPreview({
    interior: equipmentInterior,
    exterior: equipmentExterior,
    servicesHome: includedServicesHome,
    servicesCollection: includedServicesCollection,
    aLaCarte: aLaCarteServices,
  });

  if (total === 0) return null;

  return (
    <>
      <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
        {preview.map((item, i) => (
          <div key={i} className="flex items-center gap-3">
            <KayvilaPngIcon name={getEquipmentIcon(item)} size={20} alt="" />
            <span className="text-sm text-navy/70">{item}</span>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-8 inline-flex items-center gap-2 border border-navy/20 px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.2em] text-navy hover:border-navy transition-colors"
      >
        Voir les {total} équipements
      </button>

      <LegalModal open={open} onClose={() => setOpen(false)} title="Tous les équipements">
        <div className="space-y-10">
          <EquipmentCategory title="Intérieur" items={equipmentInterior} />
          <EquipmentCategory title="Extérieur" items={equipmentExterior} />
          <EquipmentCategory title="Services inclus — domicile" items={includedServicesHome} />
          <EquipmentCategory title="Services inclus — collection" items={includedServicesCollection} />
          <EquipmentCategory title="Services à la carte" items={aLaCarteServices} />
        </div>
      </LegalModal>
    </>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit -p .`
Expected: no new errors introduced by this file (pre-existing unrelated errors in `tests/a11y.spec.ts`, if any, are not in scope).

- [ ] **Step 3: Commit**

```bash
git add components/villas/VillaAmenitiesPreview.tsx
git commit -m "feat(villas): ajoute VillaAmenitiesPreview (aperçu + modale équipements)"
```

---

### Task 3: `VillaAccordionInfo` — accordéon replié → 3 colonnes à plat

**Files:**
- Modify: `components/villas/VillaAccordionInfo.tsx` (full rewrite, same exported name and props)

**Interfaces:**
- Produces: `VillaAccordionInfo` component, same props as before (unchanged, so Task 4's call site needs no changes):
  ```ts
  type VillaExtraInfoProps = {
    checkInTime: string;
    checkOutTime: string;
    houseRules?: string | null;
    cancellationPolicy?: string | null;
    safetyInfo?: string | null;
  };
  ```

- [ ] **Step 1: Rewrite the component**

Replace the full contents of `components/villas/VillaAccordionInfo.tsx`:

```tsx
type VillaExtraInfoProps = {
  checkInTime: string;
  checkOutTime: string;
  houseRules?: string | null;
  cancellationPolicy?: string | null;
  safetyInfo?: string | null;
};

export function VillaAccordionInfo({
  houseRules,
  cancellationPolicy,
  safetyInfo,
}: VillaExtraInfoProps) {
  const hasHouseRules = houseRules && houseRules !== "";
  const hasCancellation = cancellationPolicy && cancellationPolicy !== "";
  const hasSafety = safetyInfo && safetyInfo !== "";

  if (!hasHouseRules && !hasCancellation && !hasSafety) return null;

  return (
    <section className="pt-10 border-t border-navy/10">
      <h2 className="font-display font-normal text-2xl text-navy mb-8">À savoir</h2>
      <div className="grid sm:grid-cols-3 gap-10">
        {hasCancellation && (
          <div>
            <h4 className="font-bold text-navy text-sm mb-4 uppercase tracking-wider">
              Annulation
            </h4>
            <p className="text-navy/80 text-sm leading-relaxed whitespace-pre-line">
              {cancellationPolicy}
            </p>
          </div>
        )}
        {hasHouseRules && (
          <div>
            <h4 className="font-bold text-navy text-sm mb-4 uppercase tracking-wider">
              Règlement
            </h4>
            <p className="text-navy/80 text-sm leading-relaxed whitespace-pre-line">
              {houseRules}
            </p>
          </div>
        )}
        {hasSafety && (
          <div>
            <h4 className="font-bold text-navy text-sm mb-4 uppercase tracking-wider">
              Sécurité
            </h4>
            <p className="text-navy/80 text-sm leading-relaxed whitespace-pre-line">
              {safetyInfo}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
```

Note: `checkInTime`/`checkOutTime` stay in the props type (the call site in `page.tsx` passes them) but are intentionally unused inside the component body — this matches the pre-existing behavior (they were already unused in the accordion version) and is not part of this task's scope.

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit -p .`
Expected: no new errors from this file.

- [ ] **Step 3: Commit**

```bash
git add components/villas/VillaAccordionInfo.tsx
git commit -m "refactor(villas): À savoir en 3 colonnes à plat au lieu d'un accordéon"
```

---

### Task 4: Reorder sections in `app/villas/[id]/page.tsx`

**Files:**
- Modify: `app/villas/[id]/page.tsx`

**Interfaces:**
- Consumes: `VillaAmenitiesPreview` (Task 2), `VillaAccordionInfo` (Task 3, same props as before — no call-site change needed).

- [ ] **Step 1: Remove the top standalone map block**

In `app/villas/[id]/page.tsx`, delete this block entirely (it duplicates the map that will now live in the "Alentours" section, moved lower on the page):

```tsx
      {/* ── Carte interactive ── */}
      {villa.latitude && villa.longitude && (
        <div className="mx-auto max-w-7xl px-6 pb-4">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.28em] text-navy/55">Emplacement</p>
          <div className="overflow-hidden rounded-2xl border border-navy/10 shadow-sm">
            <VillaDetailMiniMap
              latitude={villa.latitude}
              longitude={villa.longitude}
              name={villa.name}
            />
          </div>
        </div>
      )}

```

- [ ] **Step 2: Remove the now-unused `VillaDetailMiniMap` import**

Remove this line (no longer used anywhere in the file after Step 1):

```tsx
import { VillaDetailMiniMap } from "@/components/dashboard/admin/VillaDetailMiniMap";
```

- [ ] **Step 3: Add the `VillaAmenitiesPreview` import**

Add alongside the other `components/villas/*` imports, importing both the component and the re-exported icon-mapping helper (still needed below for the "Services à la carte" mini-list inside "Expérience Kayvila"):

```tsx
import { VillaAmenitiesPreview, getEquipmentIcon } from "@/components/villas/VillaAmenitiesPreview";
```

- [ ] **Step 4: Remove the inline `getEquipmentIcon` function and `EquipmentCategory` component**

Delete both (the icon-mapping logic now lives in, and is imported from, `components/villas/VillaAmenitiesPreview.tsx` from Task 2; `EquipmentCategory` is no longer used anywhere in `page.tsx` after Step 5 below):

```tsx
const getEquipmentIcon = (label: string): KayvilaPngName => {
  ...
};

function EquipmentCategory({ title, items }: { title: string; items: string[] }) {
  ...
}
```

- [ ] **Step 5: Replace the entire "Contenu principal" block with the reordered version**

Replace everything from `{/* ── Contenu principal ── */}` through the matching closing `</VillaBookingWrapper>` with:

```tsx
      {/* ── Contenu principal ── */}
      <VillaBookingWrapper
        villaId={villa.id}
        basePrice={villa.price}
        capacity={villa.capacity}
        checkInTime={villa.check_in_time || "17:00"}
        checkOutTime={villa.check_out_time || "10:00"}
        seasonalPrices={seasonalPrices}
      >
      <div className="mx-auto max-w-7xl px-6 pb-28 pt-8">
        <div className="grid gap-12 lg:grid-cols-[1fr_380px] items-start">

          {/* ── Colonne gauche ── */}
          <div className="space-y-12">

            {/* 1. L'expérience Kayvila */}
            <section id="experience" className="pt-2">
              <h2 className="font-display font-normal text-2xl text-navy mb-8">{ts(locale, "villa.experience")}</h2>
              <div className="grid sm:grid-cols-2 gap-px bg-navy/8">
                {[
                  { num: "01", title: "Concierge dédié", desc: "Un interlocuteur unique avant et pendant votre séjour pour orchestrer chaque détail." },
                  { num: "02", title: "Accueil personnalisé", desc: "Remise des clés en main propre, visite guidée de la villa et conseils locaux par notre équipe." },
                  { num: "03", title: "Équipe 7j/7", desc: "Réactive et joignable à tout moment — un message, une question, nous sommes là." },
                  { num: "04", title: "Services à la carte", desc: (villa.a_la_carte_services && villa.a_la_carte_services.length > 0
    ? villa.a_la_carte_services.join(", ") + " — composez votre séjour sur mesure."
    : "Chef à domicile, bateau, massage, transfert VIP — composez votre séjour sur mesure.") },
                ].map((item) => (
                  <div key={item.num} className="bg-white p-8 flex gap-5">
                    <span className="text-3xl font-light text-gold/25 tabular-nums shrink-0">{item.num}</span>
                    <div>
                      <h3 className="font-bold text-sm text-navy mb-1.5">{item.title}</h3>
                      <p className="text-sm text-navy/80 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              {villa.a_la_carte_services && villa.a_la_carte_services.length > 0 ? (
                <div className="mt-8 border-t border-navy/8 pt-8">
                  <h3 className="font-sora text-lg text-navy mb-4">Services à la carte</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {villa.a_la_carte_services.map((service) => (
                      <div key={service} className="flex items-center gap-2 text-navy/70">
                        <KayvilaPngIcon name={getEquipmentIcon(service)} size={20} alt="" className="text-gold" />
                        <span className="text-sm font-instrument-sans">{service}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="mt-8 text-sm text-navy/80 border-t border-navy/8 pt-8">
                  Services disponibles sur demande. Contactez notre conciergerie.
                </p>
              )}
            </section>

            {/* 2. Description */}
            <section className="pt-10 border-t border-navy/10">
              <ExpandableDescription text={villa.description || "Description à venir pour cette villa."} />
            </section>

            {/* 3. Découvrez les chambres */}
            {villa.rooms && villa.rooms.length > 0 && (
              <section id="chambres" className="pt-10 border-t border-navy/10">
                <h2 className="font-display font-normal text-2xl text-navy mb-8">{ts(locale, "villa.rooms")}</h2>
                <div className="space-y-4">
                  {villa.rooms.map((room: any, i: number) => (
                    <div key={i} className="flex flex-col sm:flex-row sm:items-start gap-4 p-6 border border-navy/10 bg-white">
                      <div className="sm:w-1/3">
                        <h4 className="font-bold text-navy text-sm uppercase tracking-wider">{room.title}</h4>
                      </div>
                      <div className="sm:w-2/3 space-y-2">
                        <p className="text-navy/70 text-sm flex items-center gap-2">
                          <KayvilaPngIcon name="bed" size={20} alt="" />
                          {room.description || "1 Lit double King Size"}
                        </p>
                        <p className="text-navy/50 text-sm flex items-center gap-2">
                          <KayvilaPngIcon name="ac" size={20} alt="" /> Climatisation
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* 4. Ce que propose ce logement */}
            <section id="equipements" className="pt-10 border-t border-navy/10">
              <h2 className="font-display font-normal text-2xl text-navy mb-8">{ts(locale, "villa.equipment")}</h2>
              <VillaAmenitiesPreview
                equipmentInterior={villa.equipment_interior || []}
                equipmentExterior={villa.equipment_exterior || []}
                includedServicesHome={villa.included_services_home || []}
                includedServicesCollection={villa.included_services_collection || []}
                aLaCarteServices={villa.a_la_carte_services || []}
              />
            </section>

            {/* 5. Disponibilités + Calendrier */}
            <section id="reserver-sejour" className="scroll-mt-28 pt-10 border-t border-navy/10">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-display font-normal text-2xl text-navy">{ts(locale, "villa.availability")}</h2>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded-none border border-gold/40 bg-gold/10 px-3 py-1 font-semibold text-navy">
                    Arrivée: {villa.check_in_time || "17:00"}
                  </span>
                  <span className="rounded-none border border-navy/20 bg-offwhite px-3 py-1 font-semibold text-navy/80">
                    Départ: {villa.check_out_time || "10:00"}
                  </span>
                </div>
              </div>
              <ConnectedAvailabilityCalendar villaId={villa.id} />
            </section>

            {/* 6. Avis des voyageurs */}
            <VillaReviews villaId={villa.id} villaName={villa.name} />

            {/* 7. Les alentours (carte) */}
            {(villa.map_embed_url || (villa.latitude != null && villa.longitude != null)) && (
              <section id="alentours" className="pt-10 border-t border-navy/10">
                <h2 className="font-display font-normal text-2xl text-navy mb-6">{ts(locale, "villa.surroundings")}</h2>
                <div className="mb-6 grid gap-6 sm:grid-cols-2">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-navy/55 mb-2">Environnement</p>
                    <p className="text-sm text-navy/70">{villa.environment || "En dehors de la ville"}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-navy/55 mb-2">À proximité</p>
                    <div className="flex flex-wrap gap-2">
                      {(villa.nearby_points?.length
                        ? villa.nearby_points
                        : ["Plage", "Restaurants et bars", "Commerces"]).map((point, index) => (
                        <span key={`near-${index}`} className="rounded-none border border-navy/10 px-3 py-1 text-xs text-navy/70">
                          {point}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="relative overflow-hidden border border-navy/10 aspect-[16/7] bg-navy/5 group">
                  <div className="absolute top-3 left-3 z-10">
                    <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-navy/55 bg-white/80 px-3 py-1">
                      Carte interactive
                    </span>
                  </div>
                  <iframe
                    src={villa.map_embed_url || `https://www.google.com/maps?q=${villa.latitude},${villa.longitude}&z=15&output=embed`}
                    title="Carte"
                    className="w-full h-full grayscale-[0.3] contrast-[1.05] transition-all duration-300 group-hover:grayscale-0"
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                  <a
                    href={villa.map_embed_url || `https://www.google.com/maps?q=${villa.latitude},${villa.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute inset-0 flex items-center justify-center bg-navy/0 group-hover:bg-navy/10 transition-all duration-300"
                  >
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/90 border border-navy/15 px-6 py-3 text-[11px] font-bold uppercase tracking-[0.25em] text-navy">
                      Ouvrir dans Google Maps
                    </span>
                  </a>
                </div>
              </section>
            )}

            {/* 8. Votre hôte */}
            <VillaHostCard host={villa.host} villaName={villa.name} />

            {/* 9. À savoir */}
            <VillaAccordionInfo
              checkInTime={villa.check_in_time || "17:00"}
              checkOutTime={villa.check_out_time || "10:00"}
              houseRules={villa.house_rules}
              cancellationPolicy={villa.cancellation_policy}
              safetyInfo={villa.safety_info}
            />

            {/* 10. Concierge Kayvila */}
            <section id="concierge" className="pt-10 border-t border-navy/10">
              <h2 className="font-display font-normal text-2xl text-navy mb-8">{ts(locale, "villa.concierge")}</h2>
              <div className="flex flex-col sm:flex-row gap-6 items-start border border-navy/10 bg-white p-6">
                <div className="w-16 h-16 shrink-0 bg-gold/20 flex items-center justify-center">
                  <KayvilaPngIcon name="users" size={28} alt="" />
                </div>
                <div>
                  <h3 className="font-display text-xl text-navy mb-1">{ts(locale, "villa.team")}</h3>
                  <p className="text-[11px] text-navy/55 mb-3">Conciergerie · Martinique</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                    <div><span className="block text-navy/55 text-[11px] uppercase tracking-wide">Avis</span><span className="font-semibold text-navy">98% satisfaits</span></div>
                    <div><span className="block text-navy/55 text-[11px] uppercase tracking-wide">Réponse</span><span className="font-semibold text-navy">&lt; 2 heures</span></div>
                    <div><span className="block text-navy/55 text-[11px] uppercase tracking-wide">Expérience</span><span className="font-semibold text-navy">8+ ans</span></div>
                    <div><span className="block text-navy/55 text-[11px] uppercase tracking-wide">Langues</span><span className="font-semibold text-navy">FR · EN · ES</span></div>
                  </div>
                  <p className="mt-4 text-sm text-navy/80 leading-relaxed">
                    Une équipe dédiée, locale et passionnée. Nous connaissons chaque villa, chaque quartier, chaque restaurant — pour vous offrir un séjour fluide, sans surprise, avec la chaleur martiniquaise.
                  </p>
                </div>
              </div>
            </section>

            {/* 11. Questions */}
            <section className="pt-10 border-t border-navy/10">
              <div className="rounded-none border border-gold/25 bg-gold/[0.03] p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                <div>
                  <h3 className="font-display text-2xl text-navy">{ts(locale, "villa.questions", { name: villa.name })}</h3>
                  <p className="text-sm text-navy/80 mt-2">
                    Planifiez un appel avec notre équipe pour préparer un séjour entièrement sur mesure.
                  </p>
                </div>
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center rounded-none border border-navy/20 px-6 py-3 text-[11px] font-bold uppercase tracking-[0.25em] text-navy hover:border-navy transition-colors"
                >
                  Vivre l&apos;expérience Kayvila
                </Link>
              </div>
            </section>
          </div>

          {/* ── Colonne droite — Booking Sticky ── */}
          <div className="relative hidden lg:block">
            <div className="sticky top-28 space-y-6">
              <div className="bg-white rounded-none border border-navy/10 shadow-2xl shadow-navy/5 p-6">
                <ConnectedBookingForm
                  villaId={villa.id}
                  basePrice={villa.price}
                  capacity={villa.capacity}
                  checkInTime={villa.check_in_time || "17:00"}
                  checkOutTime={villa.check_out_time || "10:00"}
                  cleaningFeeCents={villa.cleaning_fee_cents}
                  seasonalPrices={seasonalPrices}
                />
              </div>

              <div className="p-8 bg-navy/5 rounded-none border border-navy/20 flex flex-col items-center text-center gap-3">
                <div className="w-10 h-10 rounded-none bg-gold/20 flex items-center justify-center text-gold">
                  <KayvilaPngIcon name="shield-check" size={20} alt="" />
                </div>
                <h4 className="font-display text-lg text-navy">{ts(locale, "villa.excellence")}</h4>
                <p className="text-xs text-navy/80 leading-relaxed">
                  Cette maison fait partie de notre collection. Elle a été inspectée en personne par nos équipes pour garantir des standards hôteliers de très haut niveau.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
      </VillaBookingWrapper>
```

- [ ] **Step 6: Typecheck**

Run: `npx tsc --noEmit -p .`
Expected: no new errors (pre-existing `tests/a11y.spec.ts` errors, if present, are unrelated and out of scope).

- [ ] **Step 7: Run the full test suite**

Run: `npm test`
Expected: all tests pass, same count as before this change plus the 5 new tests from Task 1.

- [ ] **Step 8: Commit**

```bash
git add app/villas/[id]/page.tsx
git commit -m "refactor(villas): réorganise la fiche villa selon la structure Airbnb"
```

---

### Task 5: Manual verification in the browser

**Files:** none (verification only)

- [ ] **Step 1: Start the dev server (if not already running)**

Run: `npm run dev` (port 3001). **Do not run `npm run build`.**

- [ ] **Step 2: Open a real villa page and check section order**

Navigate to `http://localhost:3001/villas/<id>` for a published villa (e.g. one of the two seeded villas used earlier in this session: `4ce2e4f4-2101-485c-ba8a-0d76d4dcb99a` or `da6c597b-aa38-4ed6-9de3-fc8b913d3a0b`).

Confirm, scrolling top to bottom:
1. Title/specs, then gallery
2. "Expérience Kayvila" (4 items) appears right after the title area, before the description
3. Description
4. Chambres (if the villa has rooms)
5. Équipements: flat preview (≤10 items, no category headers) + "Voir les N équipements" button
6. Clicking the button opens a modal with the 5 categorized sections (Intérieur/Extérieur/Services...); Escape and the close button both dismiss it
7. Calendrier
8. Avis
9. Alentours (map) — appears here, **not** at the top of the page anymore
10. Hôte — appears once, here (not duplicated near the top)
11. "À savoir" — visible as 3 flat columns, no click needed, no accordion arrow
12. Concierge Kayvila, then the "Questions" CTA
13. Sticky booking sidebar still works (dates, price) on desktop; mobile sticky bottom bar still works

- [ ] **Step 3: Confirm no console errors**

Check the browser console (or `mcp__playwright__browser_console_messages` if using Playwright) for new errors introduced by this change.

- [ ] **Step 4: Final commit (if any fixups were needed during verification)**

```bash
git add -A
git commit -m "fix(villas): ajustements suite à la vérification manuelle"
```
(Skip this step if no fixups were needed.)
