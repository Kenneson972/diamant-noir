# Correctifs UX Richard — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 4 correctifs UX — hover header plus visible, calendrier HeroUI RangeCalendar, messagerie pleine hauteur, upload photos création villa.

**Architecture:** Modifications UI uniquement — 1 composant supprimé (HeroDatePicker.tsx 334 lignes), 1 créé (HeroDateRangePicker.tsx ~80 lignes), 3 modifiés. Zéro DB, zéro API, zéro lib externe.

**Tech Stack:** Next.js 14, React 19, TypeScript, Tailwind v4, HeroUI v3 (`@heroui/react`), `@internationalized/date`

**Branche :** `main`

---

## File Structure

| Fichier | Action | Responsabilité |
|---------|--------|---------------|
| `components/home/HeroAudienceCards.tsx` | Modify | Hover effet → fond or + border + glow |
| `components/search/HeroDatePicker.tsx` | **Delete** | Remplacé par HeroUI RangeCalendar |
| `components/search/HeroDateRangePicker.tsx` | **Create** | Wrapper RangeCalendar + Popover |
| `components/HeroSearchWidget.tsx` | Modify | Remplacer HeroDatePicker → HeroDateRangePicker |
| `components/dashboard/proprio/OwnerMessaging.tsx` | Modify | `h-[500px]` → `min-h-[calc(100dvh-10rem)]` |
| `app/(proprio)/dashboard/messages/page.tsx` | Modify | Virer `max-w-3xl` |
| `components/dashboard/admin/AdminVillaForm.tsx` | Modify | Ajouter `VillaImageManager` |

---

### Task 1: Hover Header — HeroAudienceCards

**Files:**
- Modify: `components/home/HeroAudienceCards.tsx`

- [ ] **Step 1: Appliquer le hover intensifié**

Dans `HeroAudienceCards.tsx`, localiser les classes des deux cartes (conciergerie + voyageur). Remplacer :

```tsx
// AVANT — lignes ~64-70 : hover subtil quasi invisible
className={cn(
  "group relative flex flex-col ... rounded-2xl border transition-all duration-200",
  isLight
    ? "border-navy/10 bg-white hover:border-navy/16 hover:bg-white/[0.98]"
    : "border-white/10 bg-transparent hover:border-white/30 hover:bg-white/[0.06]",
)}
```

Par :

```tsx
// APRÈS — hover Option B : fond or 10% + border or + glow doré
className={cn(
  "group relative flex flex-col ... rounded-2xl border transition-all duration-300",
  isLight
    ? "border-navy/10 bg-white hover:border-navy/40 hover:bg-navy/[0.03] hover:shadow-[0_4px_24px_rgba(26,36,51,0.10)]"
    : "border-white/10 bg-transparent hover:border-[#D4AF37] hover:bg-[rgba(212,175,55,0.10)] hover:shadow-[0_0_0_1px_#D4AF37,0_8px_32px_rgba(212,175,55,0.15)]",
)}
```

- [ ] **Step 2: Vérifier visuellement**

Run: `npm run dev` → ouvrir la homepage → survoler les cartes Conciergerie Privée et Espace Voyageur.
Expected: glow doré visible, border or, fond or 10%. Transition fluide 300ms.

- [ ] **Step 3: Commit**

```bash
git add components/home/HeroAudienceCards.tsx
git commit -m "fix(ui): hover header intensifié — fond or + border or + glow

Co-Authored-By: claude-flow <ruv@ruv.net>"
```

---

### Task 2: HeroUI RangeCalendar — Refonte Date Picker Hero

**Files:**
- Create: `components/search/HeroDateRangePicker.tsx`
- Modify: `components/HeroSearchWidget.tsx`
- Delete: `components/search/HeroDatePicker.tsx`

- [ ] **Step 1: Créer le nouveau composant**

```tsx
// components/search/HeroDateRangePicker.tsx
"use client";

import { Button, Popover, RangeCalendar } from "@heroui/react";
import { getLocalTimeZone, parseDate, today } from "@internationalized/date";
import type { DateValue } from "@internationalized/date";

type HeroDateRangePickerProps = {
  checkin: string;
  checkout: string;
  onChange: (checkin: string, checkout: string) => void;
  surface?: "light" | "dark";
};

function toISO(d: DateValue): string {
  return `${d.year}-${String(d.month).padStart(2, "0")}-${String(d.day).padStart(2, "0")}`;
}

export function HeroDateRangePicker({
  checkin,
  checkout,
  onChange,
  surface = "dark",
}: HeroDateRangePickerProps) {
  const isLight = surface === "light";
  const now = today(getLocalTimeZone());

  const value =
    checkin && checkout
      ? { start: parseDate(checkin), end: parseDate(checkout) }
      : checkin
        ? { start: parseDate(checkin), end: parseDate(checkin) }
        : null;

  return (
    <Popover placement="bottom" offset={8}>
      <div /> {/* trigger invisible — géré par le parent HeroSearchWidget */}

      <RangeCalendar
        aria-label="Dates de séjour"
        value={value}
        onChange={(range) => {
          if (range) {
            onChange(toISO(range.start), toISO(range.end));
          }
        }}
        visibleDuration={{ months: 2 }}
        minValue={now}
        firstDayOfWeek="mon"
        className={cn(
          "rounded-2xl border p-4 shadow-xl",
          isLight
            ? "border-navy/8 bg-white"
            : "border-white/12 bg-[#0A1628]"
        )}
      >
        <RangeCalendar.Header className="pb-3">
          <RangeCalendar.NavButton slot="previous" />
          <RangeCalendar.Heading />
          <RangeCalendar.NavButton slot="next" />
        </RangeCalendar.Header>
        <RangeCalendar.Grid>
          <RangeCalendar.GridHeader>
            {(day) => <RangeCalendar.HeaderCell>{day}</RangeCalendar.HeaderCell>}
          </RangeCalendar.GridHeader>
          <RangeCalendar.GridBody>
            {(date) => (
              <RangeCalendar.Cell date={date}>
                {({ formattedDate }) => <>{formattedDate}</>}
              </RangeCalendar.Cell>
            )}
          </RangeCalendar.GridBody>
        </RangeCalendar.Grid>
      </RangeCalendar>
    </Popover>
  );
}
```

> ⚠️ Vérifier que `cn` est importé (si `@/lib/utils` l'exporte). Sinon utiliser un template literal simple.
> Les classes Tailwind doivent correspondre au thème Kayvila (gold/navy).

- [ ] **Step 2: Mettre à jour HeroSearchWidget.tsx**

Dans `components/HeroSearchWidget.tsx` :

a) Remplacer l'import :
```tsx
// AVANT
import { HeroDatePicker } from "@/components/search/HeroDatePicker";
// APRÈS
import { HeroDateRangePicker } from "@/components/search/HeroDateRangePicker";
```

b) Supprimer `datesBtnRef` (si plus utilisé), `datePickerStyle`, et l'`useEffect` de repositionnement (lignes 40, 55-79).

c) Remplacer le rendu du date picker (ligne ~186-198) :
```tsx
// AVANT
{openPanel === "date" && (
  <div style={datePickerStyle}>
    <HeroDatePicker checkin={checkin} checkout={checkout} onChange={...} onClose={...} />
  </div>
)}

// APRÈS
{openPanel === "date" && (
  <div className="fixed inset-x-4 bottom-4 z-[9999] sm:absolute sm:inset-auto sm:left-0 sm:right-0 sm:top-full sm:mt-2">
    <HeroDateRangePicker
      checkin={checkin}
      checkout={checkout}
      onChange={(ci, co) => {
        setCheckin(ci);
        setCheckout(co);
        if (ci && co) setOpenPanel(null);
      }}
      surface={surface}
    />
  </div>
)}
```

d) Supprimer le state `datePickerStyle` et ses dépendances — lignes 40 et 55-79.

- [ ] **Step 3: Supprimer l'ancien composant**

```bash
git rm components/search/HeroDatePicker.tsx
```

- [ ] **Step 4: Vérifier TypeScript + build**

Run: `npx tsc --noEmit`
Expected: 0 nouvelle erreur.

Run: `npm run build`
Expected: succès.

- [ ] **Step 5: Commit**

```bash
git add components/search/HeroDateRangePicker.tsx components/HeroSearchWidget.tsx
git rm components/search/HeroDatePicker.tsx
git commit -m "feat(ui): HeroUI RangeCalendar remplace date picker hero custom (fix bug mobile)

Co-Authored-By: claude-flow <ruv@ruv.net>"
```

---

### Task 3: Messagerie Pleine Hauteur

**Files:**
- Modify: `components/dashboard/proprio/OwnerMessaging.tsx`
- Modify: `app/(proprio)/dashboard/messages/page.tsx`

- [ ] **Step 1: Fixer la hauteur de la messagerie**

Dans `components/dashboard/proprio/OwnerMessaging.tsx`, ligne ~94, remplacer :

```tsx
// AVANT
<div className="dashboard-card flex flex-col h-[500px]">

// APRÈS
<div className="dashboard-card flex flex-col min-h-[calc(100dvh-12rem)]">
```

- [ ] **Step 2: Élargir le conteneur de page**

Dans `app/(proprio)/dashboard/messages/page.tsx`, ligne ~16, remplacer :

```tsx
// AVANT
<div className="mx-auto max-w-3xl px-6 py-10">

// APRÈS
<div className="mx-auto w-full max-w-5xl px-6 py-10">
```

- [ ] **Step 3: Vérifier visuellement**

Ouvrir la messagerie proprio en desktop (1920px) et mobile (375px).
Expected: la messagerie remplit toute la hauteur de l'écran, pas de vide en dessous.

- [ ] **Step 4: Commit**

```bash
git add components/dashboard/proprio/OwnerMessaging.tsx app/\(proprio\)/dashboard/messages/page.tsx
git commit -m "fix(ui): messagerie proprio pleine hauteur — min-h-dvh + max-w-5xl

Co-Authored-By: claude-flow <ruv@ruv.net>"
```

---

### Task 4: Upload Photos Création Villa

**Files:**
- Modify: `components/dashboard/admin/AdminVillaForm.tsx`

- [ ] **Step 1: Ajouter VillaImageManager au formulaire de création**

Dans `AdminVillaForm.tsx` :

a) Importer `VillaImageManager` en haut :
```tsx
import { VillaImageManager } from "@/components/dashboard/villa-editor/VillaImageManager";
```

b) Ajouter une section "Photos" AVANT le textarea URLs existant (ligne ~536). Remplacer le bloc :
```tsx
// AVANT
<div>
  <label className="block text-sm font-medium text-navy mb-2">
    Photos <span className="text-xs text-navy/40">(une URL par ligne)</span>
  </label>
  <textarea
    name="image_urls"
    rows={4}
    className="w-full rounded-lg border border-navy/15 px-4 py-3 text-sm ..."
    placeholder="https://..."
  />
</div>

// APRÈS
<div>
  <label className="block text-sm font-medium text-navy mb-2">
    Photos de la villa
  </label>
  <VillaImageManager
    images={imageUrls}
    onChange={setImageUrls}
  />
  <p className="text-xs text-navy/40 mt-2">
    Glisse-dépose tes photos ou clique pour les sélectionner. JPG, PNG, WebP — max 10 Mo.
  </p>
  
  <div className="mt-4 border-t border-navy/10 pt-4">
    <label className="block text-sm font-medium text-navy mb-2">
      Ou coller des URLs <span className="text-xs text-navy/40">(optionnel)</span>
    </label>
    <textarea
      name="image_urls_fallback"
      rows={3}
      className="w-full rounded-lg border border-navy/15 px-4 py-3 text-sm ..."
      placeholder="https://..."
    />
  </div>
</div>
```

c) Ajouter un state `imageUrls` en haut du composant :
```tsx
const [imageUrls, setImageUrls] = useState<string[]>([]);
```

d) Passer `imageUrls` au `FormData` ou à l'`onSubmit` comme valeur de `image_urls`.

- [ ] **Step 2: Vérifier que VillaImageManager s'affiche**

Run: `npm run dev` → Admin → Ajouter une villa.
Expected: DropZone visible, possibilité de drag & drop des images.

- [ ] **Step 3: Vérifier TypeScript**

Run: `npx tsc --noEmit`
Expected: 0 nouvelle erreur.

- [ ] **Step 4: Commit**

```bash
git add components/dashboard/admin/AdminVillaForm.tsx
git commit -m "feat(admin): upload photos dans le formulaire de création villa (VillaImageManager)

Co-Authored-By: claude-flow <ruv@ruv.net>"
```

---

## Vérification Globale

- [ ] **Step 1: Suite de tests existante**

```bash
npx vitest run
```
Expected: tous les tests passent (aucune régression).

- [ ] **Step 2: TypeScript strict**

```bash
npx tsc --noEmit
```
Expected: 0 nouvelle erreur (4 pré-existantes dans `tests/a11y.spec.ts` ignorées).

- [ ] **Step 3: Build**

```bash
npm run build
```
Expected: succès.

- [ ] **Step 4: Push**

```bash
git push origin main
```

---

## Self-Review

- **Spec coverage:** 4/4 items couverts. Items 5-6 (déjà faits) non inclus — conformes au scope.
- **Placeholder scan:** Aucun TODO/TBD. Le code dans `HeroDateRangePicker.tsx` Step 1 a une note sur `cn` — intentionnelle, dépend de l'import existant dans le projet.
- **Type consistency:** `toISO()` retourne `string` → `onChange(checkin: string, checkout: string)` → cohérent. `VillaImageManager` props `images: string[]` et `onChange: (urls: string[]) => void` — à vérifier dans le composant existant.
- **DRY:** Chaque tâche est indépendante. Pas de duplication entre tâches.
