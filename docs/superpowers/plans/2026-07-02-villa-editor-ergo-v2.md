# Éditeur Villa Ergo V2 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refondre la couche présentation de l'éditeur villa : un seul éditeur scrollable pleine largeur (sommaire sticky + 3 blocs), création unifiée via mini-form → brouillon, suppression du stepper/progressbar/quicknav/preview.

**Architecture:** Refonte in-place. `villa-editor-state.ts` (reducer + `sectionCompleteness`), l'autosave (POST `{villaId, payload}` sur `/api/dashboard/update-villa`) et tous les sous-éditeurs sont **inchangés**. On réécrit `VillaEditorShell` + le JSX de `VillaEditor`, on ajoute 3 composants (`EditorSection`, `EditorSummary`, `VillaCreateForm`) + 1 module pur (`villa-editor-sections.ts`), on absorbe les sidebars des 2 pages hôtes via des props `ReactNode`.

**Tech Stack:** Next.js 15 App Router, React 19, Tailwind, Zod v4, vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-07-02-villa-editor-ergo-v2-design.md`

## Global Constraints

- Copy UI en français ; strings JS **toujours en double quotes** (les apostrophes françaises cassent le build avec single quotes).
- JAMAIS de fonctions en props d'un Server Component vers un Client Component. Les props `ReactNode` (JSX) sont autorisées.
- Chemins avec parenthèses (`app/(admin)/…`) : après toute édition, vérifier `find app -iname "*(*" -maxdepth 2` qu'aucun dossier fantôme n'a été créé.
- Zéro `border-left`/`border-right` > 1px coloré (side-stripe banni). Zéro gradient text. Zéro carte imbriquée.
- Or (`gold`) = signal uniquement : badge « complet », statut « publié », CTA principal.
- Zones tactiles ≥ 44 px (`min-h-[44px]`). Labels eyebrow : `text-[10px] font-bold uppercase tracking-[0.2em] text-muted`.
- Animations : `transform`/`opacity`/`grid-template-rows` uniquement, 150–300 ms, `motion-reduce:transition-none`.
- Fichiers < 500 lignes.
- Après chaque commit : `git push` immédiatement (règle projet Karibloom).
- Fin de chaque tâche touchant du code : `npx tsc --noEmit` doit passer (ou `npm run build` pour les tâches pages).
- Tout le travail se fait dans `diamant-noir/` (le repo Next.js).

---

### Task 1: Module pur `villa-editor-sections.ts` (définitions sections + blocs)

**Files:**
- Create: `lib/villa-editor-sections.ts`
- Test: `lib/villa-editor-sections.test.ts`

**Interfaces:**
- Consumes: rien (module pur).
- Produces:
  - `type SectionStatus = "empty" | "partial" | "complete"` (ré-export du concept existant de `sectionCompleteness`)
  - `type EditorBloc = "identity" | "config" | "admin"`
  - `type EditorSectionDef = { id: string; label: string; icon: string; help: string; bloc: EditorBloc; statusKey: string | null }`
  - `EDITOR_SECTIONS: EditorSectionDef[]`
  - `sectionsForRole(isAdmin: boolean): EditorSectionDef[]` — filtre le bloc `admin` pour le proprio et déplace `ical` en bloc `admin` pour l'admin.

- [ ] **Step 1: Écrire le test qui échoue**

```ts
// lib/villa-editor-sections.test.ts
import { describe, it, expect } from "vitest";
import { EDITOR_SECTIONS, sectionsForRole } from "./villa-editor-sections";

describe("EDITOR_SECTIONS", () => {
  it("a des ids uniques", () => {
    const ids = EDITOR_SECTIONS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("chaque section a un label et une phrase d'aide non vides", () => {
    for (const s of EDITOR_SECTIONS) {
      expect(s.label.length).toBeGreaterThan(0);
      expect(s.help.length).toBeGreaterThan(0);
    }
  });
});

describe("sectionsForRole", () => {
  it("proprio : aucun bloc admin, ical rangé en config", () => {
    const sections = sectionsForRole(false);
    expect(sections.every((s) => s.bloc !== "admin")).toBe(true);
    expect(sections.find((s) => s.id === "ical")?.bloc).toBe("config");
  });

  it("admin : la section admin existe et ical passe en bloc admin", () => {
    const sections = sectionsForRole(true);
    expect(sections.some((s) => s.id === "admin")).toBe(true);
    expect(sections.find((s) => s.id === "ical")?.bloc).toBe("admin");
  });

  it("les statusKey pointent vers des clés de sectionCompleteness", () => {
    const validKeys = ["infos", "photos", "equipments", "rooms", "pricing", "availability", "contacts", "services", "rules", "safety"];
    for (const s of EDITOR_SECTIONS) {
      if (s.statusKey !== null) expect(validKeys).toContain(s.statusKey);
    }
  });
});
```

- [ ] **Step 2: Lancer le test — il doit échouer**

Run: `npx vitest run lib/villa-editor-sections.test.ts`
Expected: FAIL — `Cannot find module './villa-editor-sections'`

- [ ] **Step 3: Implémenter le module**

```ts
// lib/villa-editor-sections.ts
export type SectionStatus = "empty" | "partial" | "complete";
export type EditorBloc = "identity" | "config" | "admin";

export type EditorSectionDef = {
  id: string;
  /** Libellé affiché dans le sommaire et l'en-tête de section */
  label: string;
  /** Nom d'icône DashboardNavIcon */
  icon: string;
  /** Phrase d'aide affichée sous le titre de section */
  help: string;
  bloc: EditorBloc;
  /** Clé dans sectionCompleteness(form) — null si pas de statut pertinent */
  statusKey: string | null;
};

export const EDITOR_SECTIONS: EditorSectionDef[] = [
  { id: "details", label: "Description & accès", icon: "LayoutDashboard", help: "Description, horaires d'arrivée et localisation précise.", bloc: "config", statusKey: "infos" },
  { id: "equipments", label: "Équipements", icon: "Star", help: "Ajoutez les équipements intérieurs et extérieurs pour rassurer les voyageurs.", bloc: "config", statusKey: "equipments" },
  { id: "rooms", label: "Pièces", icon: "Building2", help: "Détaillez les chambres et leurs couchages.", bloc: "config", statusKey: "rooms" },
  { id: "pricing", label: "Tarifs saisonniers", icon: "DollarSign", help: "Ajustez vos prix selon les saisons.", bloc: "config", statusKey: "pricing" },
  { id: "services", label: "Services", icon: "Sparkles", help: "Services inclus et prestations à la carte.", bloc: "config", statusKey: "services" },
  { id: "rules", label: "Règles & sécurité", icon: "Settings", help: "Règles de la maison et équipements de sécurité.", bloc: "config", statusKey: "rules" },
  { id: "contacts", label: "Contacts urgence", icon: "UserCircle", help: "Personnes à joindre en cas de besoin sur place.", bloc: "config", statusKey: "contacts" },
  { id: "ical", label: "Calendrier iCal", icon: "CalendarDays", help: "Synchronisez vos disponibilités avec les autres plateformes.", bloc: "config", statusKey: null },
  { id: "admin", label: "Commission & propriétaire", icon: "Zap", help: "Commission, frais de ménage, publication et propriétaire lié.", bloc: "admin", statusKey: null },
];

export function sectionsForRole(isAdmin: boolean): EditorSectionDef[] {
  return EDITOR_SECTIONS
    .filter((sec) => isAdmin || sec.bloc !== "admin")
    .map((sec) => (sec.id === "ical" && isAdmin ? { ...sec, bloc: "admin" as const } : sec));
}
```

- [ ] **Step 4: Lancer le test — il doit passer**

Run: `npx vitest run lib/villa-editor-sections.test.ts`
Expected: PASS (5 tests)

- [ ] **Step 5: Vérifier que les tests existants restent verts**

Run: `npx vitest run lib/villa-editor-state.test.ts`
Expected: PASS (aucune modification de ce fichier)

- [ ] **Step 6: Commit + push**

```bash
git add lib/villa-editor-sections.ts lib/villa-editor-sections.test.ts
git commit -m "feat(villa-editor): définitions sections + blocs (sectionsForRole)"
git push
```

---

### Task 2: Composant `EditorSection` (section repliable plate)

**Files:**
- Create: `components/dashboard/villa-editor/EditorSection.tsx`

**Interfaces:**
- Consumes: `SectionStatus` de `@/lib/villa-editor-sections`, `DashboardNavIcon` de `@/components/dashboard/shared/dashboard-nav-icon`, `cn` de `@/lib/utils`.
- Produces: `EditorSection({ id, icon, title, help, status, defaultOpen, children })` — rend `<section id="ve-{id}">`. Utilisé par Task 5.

**Notes de design** (issues du spec) : section **plate** (pas de carte bordée) — filet fin `border-t border-navy/8` en séparateur, animation `grid-template-rows` (jamais `height`), badge de statut (gris/ambre/or), CTA « Remplir cette section » quand fermée et vide, `scroll-mt-24` pour que l'ancre ne passe pas sous le header sticky, contenu replié inerte (`inert`) pour ne pas capter le focus clavier.

- [ ] **Step 1: Créer le composant**

```tsx
// components/dashboard/villa-editor/EditorSection.tsx
"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { DashboardNavIcon } from "@/components/dashboard/shared/dashboard-nav-icon";
import type { SectionStatus } from "@/lib/villa-editor-sections";

const STATUS_STYLES: Record<SectionStatus, string> = {
  empty: "bg-navy/8 text-navy/50",
  partial: "bg-amber-100 text-amber-700",
  complete: "bg-gold/15 text-gold",
};

const STATUS_LABELS: Record<SectionStatus, string> = {
  empty: "À remplir",
  partial: "En cours",
  complete: "Complet",
};

export function EditorSection({
  id,
  icon,
  title,
  help,
  status,
  defaultOpen = false,
  children,
}: {
  id: string;
  icon: string;
  title: string;
  help?: string;
  status?: SectionStatus;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section
      id={`ve-${id}`}
      role="region"
      aria-labelledby={`ve-${id}-title`}
      className="scroll-mt-24 border-t border-navy/8 py-5"
      data-testid={`editor-section-${id}`}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls={`ve-${id}-content`}
        onClick={() => setOpen(!open)}
        className="flex min-h-[44px] w-full items-center gap-3 text-left"
      >
        <DashboardNavIcon name={icon} size={20} />
        <span className="min-w-0 flex-1">
          <span id={`ve-${id}-title`} className="block font-display text-base font-semibold text-navy">
            {title}
          </span>
          {help && <span className="mt-0.5 block text-xs text-navy/50">{help}</span>}
        </span>
        {status && (
          <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.15em]", STATUS_STYLES[status])}>
            {STATUS_LABELS[status]}
          </span>
        )}
        <ChevronDown
          aria-hidden
          className={cn("size-4 shrink-0 text-navy/40 transition-transform duration-200 motion-reduce:transition-none", open && "rotate-180")}
        />
      </button>

      {!open && status === "empty" && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-1 min-h-[44px] text-xs font-semibold text-gold transition-colors hover:text-gold/80"
        >
          Remplir cette section →
        </button>
      )}

      <div
        id={`ve-${id}-content`}
        inert={!open}
        className={cn(
          "grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="overflow-hidden">
          <div className="pt-4">{children}</div>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Vérifier la compilation**

Run: `npx tsc --noEmit`
Expected: aucune erreur. (Si `inert` déclenche une erreur de type : React 19 le supporte en booléen natif ; vérifier la version de `@types/react` — en dernier recours utiliser `inert={open ? undefined : true}`.)

- [ ] **Step 3: Commit + push**

```bash
git add components/dashboard/villa-editor/EditorSection.tsx
git commit -m "feat(villa-editor): composant EditorSection plat avec animation grid-rows"
git push
```

---

### Task 3: Composant `EditorSummary` (sommaire sticky + scrollspy + dropdown mobile)

**Files:**
- Create: `components/dashboard/villa-editor/EditorSummary.tsx`

**Interfaces:**
- Consumes: `EditorBloc`, `SectionStatus` de `@/lib/villa-editor-sections`.
- Produces: `EditorSummary({ items, villaName, imageUrl, isPublished })` avec `type SummaryItem = { id: string; label: string; bloc: EditorBloc; status?: SectionStatus }` (exporté). Rend le sommaire desktop (sticky) ET le dropdown mobile « Aller à… ». Utilisé par Task 5 via le slot `summary` du Shell (Task 4).

- [ ] **Step 1: Créer le composant**

```tsx
// components/dashboard/villa-editor/EditorSummary.tsx
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { EditorBloc, SectionStatus } from "@/lib/villa-editor-sections";

export type SummaryItem = {
  id: string;
  label: string;
  bloc: EditorBloc;
  status?: SectionStatus;
};

const BLOC_LABELS: Record<EditorBloc, string> = {
  identity: "",
  config: "Configuration",
  admin: "Administration",
};

const DOT_STYLES: Record<SectionStatus, string> = {
  empty: "bg-navy/15",
  partial: "bg-amber-400",
  complete: "bg-gold",
};

function scrollToSection(id: string) {
  document.getElementById(`ve-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function EditorSummary({
  items,
  villaName,
  imageUrl,
  isPublished,
}: {
  items: SummaryItem[];
  villaName: string;
  imageUrl?: string;
  isPublished: boolean;
}) {
  const [activeId, setActiveId] = useState<string>(items[0]?.id ?? "");

  // Scrollspy : la section la plus visible sous le header devient active
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) {
          const id = visible[0].target.id.replace(/^ve-/, "");
          setActiveId(id);
        }
      },
      { rootMargin: "-96px 0px -60% 0px", threshold: 0 }
    );
    for (const item of items) {
      const el = document.getElementById(`ve-${item.id}`);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [items]);

  const blocs: EditorBloc[] = ["identity", "config", "admin"];

  return (
    <>
      {/* Dropdown mobile "Aller à…" */}
      <div className="sticky top-16 z-20 -mx-1 bg-offwhite px-1 pb-3 lg:hidden">
        <label htmlFor="ve-goto" className="sr-only">Aller à une section</label>
        <select
          id="ve-goto"
          value={activeId}
          onChange={(e) => {
            setActiveId(e.target.value);
            scrollToSection(e.target.value);
          }}
          className="min-h-[44px] w-full rounded-lg border border-navy/10 bg-white px-4 text-sm font-medium text-navy focus:border-gold/50 focus:outline-none"
          data-testid="summary-goto"
        >
          {items.map((item) => (
            <option key={item.id} value={item.id}>{item.label}</option>
          ))}
        </select>
      </div>

      {/* Sommaire desktop */}
      <nav
        aria-label="Sommaire de l'éditeur"
        className="hidden lg:sticky lg:top-24 lg:block lg:self-start"
        data-testid="editor-summary"
      >
        <div className="flex items-center gap-3 pb-4">
          {imageUrl ? (
            <Image src={imageUrl} alt="" width={40} height={40} className="size-10 rounded-lg object-cover" />
          ) : (
            <span className="size-10 rounded-lg bg-navy/8" aria-hidden />
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-navy">{villaName || "Nouvelle villa"}</p>
            <p className={cn("text-[10px] font-bold uppercase tracking-[0.15em]", isPublished ? "text-gold" : "text-navy/45")}>
              {isPublished ? "Publiée" : "Non publiée"}
            </p>
          </div>
        </div>

        {blocs.map((bloc) => {
          const blocItems = items.filter((item) => item.bloc === bloc);
          if (blocItems.length === 0) return null;
          return (
            <div key={bloc} className="pt-3">
              {BLOC_LABELS[bloc] && (
                <p className="pb-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-muted">{BLOC_LABELS[bloc]}</p>
              )}
              <ul>
                {blocItems.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => scrollToSection(item.id)}
                      aria-current={activeId === item.id ? "true" : undefined}
                      className={cn(
                        "flex min-h-[36px] w-full items-center gap-2 rounded-md px-2 text-left text-[13px] transition-colors",
                        activeId === item.id
                          ? "bg-navy/[0.04] font-semibold text-navy"
                          : "text-navy/55 hover:text-navy"
                      )}
                    >
                      {item.status && <span className={cn("size-1.5 shrink-0 rounded-full", DOT_STYLES[item.status])} aria-hidden />}
                      <span className="truncate">{item.label}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </nav>
    </>
  );
}
```

- [ ] **Step 2: Vérifier la compilation**

Run: `npx tsc --noEmit`
Expected: aucune erreur.

- [ ] **Step 3: Commit + push**

```bash
git add components/dashboard/villa-editor/EditorSummary.tsx
git commit -m "feat(villa-editor): sommaire sticky avec scrollspy + dropdown mobile"
git push
```

---

### Task 4: Réécrire `VillaEditorShell` + alléger `AutosaveIndicator`

**Files:**
- Modify: `components/dashboard/villa-editor/VillaEditorShell.tsx` (réécriture complète — 74 lignes actuelles)
- Modify: `components/dashboard/villa-editor/AutosaveIndicator.tsx` (réécriture complète — 37 lignes actuelles)

**Interfaces:**
- Consumes: rien de nouveau.
- Produces:
  - `VillaEditorShell({ summary, children }: { summary: ReactNode; children: ReactNode })` — grille `[220px | 1fr]` desktop, empilé mobile. **Les anciennes props `sidebar`/`preview`/`compact` disparaissent** (Task 5 met à jour le seul consommateur, `VillaEditor`).
  - `AutosaveIndicator({ status, lastSaved, onRetry })` — signature inchangée, rendu réduit à un point + `data-status` (utilisé par les tests Playwright de Task 9).

⚠️ Après cette tâche, `VillaEditor.tsx` ne compile plus (il passe encore `preview`/`sidebar`). C'est attendu : Task 5 le réécrit immédiatement. **Ne pas commiter entre Task 4 et Task 5** — les deux tâches forment un seul commit.

- [ ] **Step 1: Réécrire le Shell**

```tsx
// components/dashboard/villa-editor/VillaEditorShell.tsx
"use client";

import type { ReactNode } from "react";

export function VillaEditorShell({
  summary,
  children,
}: {
  summary: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:items-start lg:gap-8">
      {summary}
      <div className="min-w-0">{children}</div>
    </div>
  );
}
```

- [ ] **Step 2: Réécrire l'AutosaveIndicator (point discret)**

```tsx
// components/dashboard/villa-editor/AutosaveIndicator.tsx
"use client";

import { cn } from "@/lib/utils";

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
  if (status === "error") {
    return (
      <button
        type="button"
        onClick={onRetry}
        className="flex min-h-[44px] items-center gap-1.5 text-xs font-medium text-red-600 transition-colors hover:text-red-800"
        data-testid="autosave-indicator"
        data-status="error"
      >
        <span className="size-2 rounded-full bg-red-500" aria-hidden />
        Erreur — réessayer
      </button>
    );
  }

  const label =
    status === "saved" && lastSaved
      ? `Enregistré à ${new Date(lastSaved).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`
      : status === "saving"
        ? "Enregistrement en cours"
        : "Brouillon";

  return (
    <span
      className="flex items-center gap-1.5"
      title={label}
      data-testid="autosave-indicator"
      data-status={status}
    >
      <span
        className={cn(
          "size-2 rounded-full",
          status === "saved" ? "bg-emerald-500" : status === "saving" ? "animate-pulse bg-gold" : "bg-navy/20"
        )}
        aria-hidden
      />
      <span className="sr-only">{label}</span>
    </span>
  );
}
```

- [ ] **Step 3: Ne PAS commiter — enchaîner directement sur Task 5**

(Le commit commun arrive en fin de Task 5.)

---

### Task 5: Réécrire `VillaEditor` (mode édition unique, 3 blocs) + variantes `VillaFormFields`

**Files:**
- Modify: `components/dashboard/villa-editor/VillaEditor.tsx` (réécriture complète du JSX ; reducer/autosave conservés à l'identique)
- Modify: `components/dashboard/villa-editor/VillaFormFields.tsx` (ajout prop `variant` en mode embedded — lignes 14-19 et 89-164)

**Interfaces:**
- Consumes: `EditorSection` (Task 2), `EditorSummary` + `SummaryItem` (Task 3), `VillaEditorShell` (Task 4), `sectionsForRole` + types (Task 1), `sectionCompleteness`/`villaFormReducer`/`createEmptyForm` (existants), sous-éditeurs existants.
- Produces:
  - `VillaEditor({ villa, isAdmin, icalContent, photosFooter, adminExtras })` — **`villa` devient obligatoire** (le mode création quitte ce composant). `icalContent?: ReactNode` remplace le stub iCal ; `photosFooter?: ReactNode` s'affiche sous le gestionnaire de photos ; `adminExtras?: ReactNode` s'affiche en fin de Bloc 3.
  - `VillaFormFields` : nouvelle prop `variant?: "identity" | "details"` active uniquement avec `embedded` — `identity` = nom, localisation, prix, capacité, chambres, sdb, surface ; `details` = check-in/out, nuits min, description, lat/lng + géolocalisation, URL maps, URL airbnb. Sans `variant`, comportement actuel inchangé (rétrocompatibilité).

- [ ] **Step 1: Découper `VillaFormFields` en variantes**

Dans `VillaFormFields.tsx` : remplacer le type de props et le bloc `basicFields` (lignes 90-160) par deux fragments. Le reste du fichier (mode standalone, FormSection, suggestions) ne bouge pas.

```tsx
// Type de props (remplace lignes 14-19)
export type VillaFormFieldsProps = {
  form: Record<string, any>;
  onChange: (key: string, value: any) => void;
  /** Si true, pas d'accordéon — les champs de base sont rendus à plat. */
  embedded?: boolean;
  /** En mode embedded : "identity" = identité (nom, prix, capacité…), "details" = description & accès. Sans variant : tout. */
  variant?: "identity" | "details";
};
```

```tsx
// Dans le corps du composant (signature : { form, onChange, embedded, variant }),
// remplacer la constante basicFields par :
const identityFields = (
  <div className="grid gap-3 sm:grid-cols-2">
    <div className="sm:col-span-2">
      <FieldLabel htmlFor="vf-name" label="Nom de la villa *" />
      <Input id="vf-name" defaultValue={s(form.name)} placeholder="Ex: Villa Océane" className="text-sm" onChange={(e: any) => onChange("name", e.target.value)} />
    </div>
    <div className="sm:col-span-2">
      <FieldLabel htmlFor="vf-location" label="Localisation" />
      <Input id="vf-location" defaultValue={s(form.location)} placeholder="Ex: Trois-Îlets, Martinique" className="text-sm" onChange={(e: any) => onChange("location", e.target.value)} />
    </div>
    <div>
      <FieldLabel htmlFor="vf-price" label="Prix / nuit (€)" />
      <Input id="vf-price" type="number" min="0" step="1" defaultValue={form.price_per_night as string || ""} placeholder="250" className="text-sm" onChange={(e: any) => onChange("price_per_night", Number(e.target.value))} />
    </div>
    <div>
      <FieldLabel htmlFor="vf-capacity" label="Capacité (personnes)" />
      <Input id="vf-capacity" type="number" min="1" defaultValue={form.capacity as string || ""} placeholder="6" className="text-sm" onChange={(e: any) => onChange("capacity", Number(e.target.value))} />
    </div>
    <div>
      <FieldLabel htmlFor="vf-bedrooms" label="Chambres" />
      <input id="vf-bedrooms" type="number" min="0" max="20" step="1" defaultValue={(form.bedrooms ?? 0) as number} placeholder="3" onChange={(e: any) => onChange("bedrooms", Number(e.target.value))} className="w-full rounded-lg border border-border-subtle bg-transparent px-3 py-2 text-sm text-navy-900 placeholder:text-muted/50 focus:border-navy-900/30 focus:outline-none" />
    </div>
    <div>
      <FieldLabel htmlFor="vf-bathrooms" label="Salles de bain" />
      <Input id="vf-bathrooms" type="number" min="0" step="1" defaultValue={form.bathrooms_count as string || ""} placeholder="2" className="text-sm" onChange={(e: any) => onChange("bathrooms_count", Number(e.target.value))} />
    </div>
    <div>
      <FieldLabel htmlFor="vf-surface" label="Surface (m²)" />
      <Input id="vf-surface" type="number" min="0" defaultValue={form.surface_m2 as string || ""} placeholder="120" className="text-sm" onChange={(e: any) => onChange("surface_m2", Number(e.target.value))} />
    </div>
  </div>
);

const detailFields = (
  <div className="grid gap-3 sm:grid-cols-2">
    <div>
      <FieldLabel htmlFor="vf-checkin" label="Check-in" />
      <Input id="vf-checkin" defaultValue={s(form.check_in_time)} placeholder="15:00" className="text-sm" onChange={(e: any) => onChange("check_in_time", e.target.value)} />
    </div>
    <div>
      <FieldLabel htmlFor="vf-checkout" label="Check-out" />
      <Input id="vf-checkout" defaultValue={s(form.check_out_time)} placeholder="11:00" className="text-sm" onChange={(e: any) => onChange("check_out_time", e.target.value)} />
    </div>
    <div>
      <FieldLabel htmlFor="vf-min-nights" label="Nuits minimum" />
      <Input id="vf-min-nights" type="number" min="1" max="30" step="1" defaultValue={(form.min_nights as string) || "1"} placeholder="1" className="text-sm" onChange={(e: any) => onChange("min_nights", Number(e.target.value))} />
    </div>
    <div className="sm:col-span-2">
      <FieldLabel htmlFor="vf-desc" label="Description" />
      <textarea id="vf-desc" defaultValue={s(form.description)} rows={4} placeholder="Description luxueuse de la villa..." onChange={(e: any) => onChange("description", e.target.value)} className="w-full resize-y rounded-lg border border-border-subtle bg-transparent px-3 py-2 text-sm text-navy-900 placeholder:text-muted/50 focus:border-navy-900/30 focus:outline-none" />
    </div>
    <div>
      <FieldLabel htmlFor="vf-latitude" label="Latitude" />
      <Input id="vf-latitude" type="number" value={form.latitude || ""} placeholder="14.4750" className="text-sm" onChange={(e: any) => onChange("latitude", Number(e.target.value))} />
    </div>
    <div>
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <FieldLabel htmlFor="vf-longitude" label="Longitude" />
          <Input id="vf-longitude" type="number" value={form.longitude || ""} placeholder="-61.0247" className="text-sm" onChange={(e: any) => onChange("longitude", Number(e.target.value))} />
        </div>
        <button type="button" onClick={handleGeolocate} className="mb-0.5 shrink-0 rounded-xl border border-gold/30 bg-gold/5 px-3 py-2 text-xs font-medium text-gold hover:bg-gold/10">
          <KayvilaPngIcon name="location" size={18} alt="" className="inline mr-1" />Me localiser
        </button>
      </div>
    </div>
    <div className="sm:col-span-2">
      <FieldLabel htmlFor="vf-map-embed" label="URL carte Google Maps (embed)" />
      <Input id="vf-map-embed" defaultValue={s(form.map_embed_url)} placeholder="https://www.google.com/maps/embed?..." className="text-sm" onChange={(e: any) => onChange("map_embed_url", e.target.value)} />
    </div>
    <div className="sm:col-span-2">
      <FieldLabel htmlFor="vf-airbnb" label="URL Airbnb" />
      <Input id="vf-airbnb" defaultValue={s(form.airbnb_url)} placeholder="https://www.airbnb.fr/rooms/..." className="text-sm" onChange={(e: any) => onChange("airbnb_url", e.target.value)} />
    </div>
  </div>
);

if (embedded) {
  if (variant === "identity") return <div>{identityFields}</div>;
  if (variant === "details") return <div>{detailFields}</div>;
  return <div className="space-y-3">{identityFields}{detailFields}</div>;
}
```

- [ ] **Step 2: Réécrire `VillaEditor.tsx`**

Conserver à l'identique : imports d'état, le `useReducer` + mapping `LOAD_VILLA` (lignes 46-74 actuelles), `doSave` + effet autosave (lignes 89-112), `handleChange` (lignes 140-148). Supprimer : `CREATE_STEPS`, `EDIT_SECTIONS`, `step`/`setStep`, `hoveredSection`, `handleCreate`, tout le bloc « Mode création », les imports `Stepper`/`QuickNav`/`ProgressBar`/`VillaPreviewCard`. Fichier cible complet :

```tsx
// components/dashboard/villa-editor/VillaEditor.tsx
"use client";

import { useReducer, useEffect, useState, useRef, useCallback, type ReactNode } from "react";
import Link from "next/link";
import { villaFormReducer, createEmptyForm, sectionCompleteness } from "@/lib/villa-editor-state";
import { sectionsForRole } from "@/lib/villa-editor-sections";
import type { SectionStatus } from "@/lib/villa-editor-sections";
import type { VillaFormData } from "@/lib/validations/villa";
import type { Villa } from "@/types/domain";
import { AutosaveIndicator } from "./AutosaveIndicator";
import { VillaEditorShell } from "./VillaEditorShell";
import { EditorSection } from "./EditorSection";
import { EditorSummary, type SummaryItem } from "./EditorSummary";
import { VillaFormFields } from "./VillaFormFields";
import { VillaImageManager } from "./VillaImageManager";
import { VillaAmenitiesEditorV2 } from "./VillaAmenitiesEditor";
import { RoomsEditor } from "./RoomsEditor";
import { SeasonalPricesEditor } from "./SeasonalPricesEditor";
import { EmergencyContactsEditor } from "./EmergencyContactsEditor";
import { ChipEditor } from "./ChipEditor";

export function VillaEditor({
  villa,
  isAdmin,
  icalContent,
  photosFooter,
  adminExtras,
}: {
  villa: Villa;
  isAdmin?: boolean;
  icalContent?: ReactNode;
  photosFooter?: ReactNode;
  adminExtras?: ReactNode;
}) {
  const [form, dispatch] = useReducer(villaFormReducer, createEmptyForm(), (empty) => {
    // Map Villa (domain) → VillaFormData (Zod) — identique à l'existant
    const v = villa as unknown as Record<string, unknown>;
    const partial: Partial<VillaFormData> = {
      name: String(v.name ?? ""),
      location: String(v.location ?? ""),
      description: String(v.description ?? ""),
      price_per_night: Number(v.price_per_night ?? 0),
      capacity: Number(v.capacity ?? 0),
      bedrooms: Number(v.bedrooms ?? 0),
      bathrooms_count: Number(v.bathrooms_count ?? 0),
      surface_m2: Number(v.surface_m2 ?? 0),
      image_url: String(v.image_url ?? ""),
      image_urls: Array.isArray(v.image_urls) ? v.image_urls as string[] : [],
      equipment_interior: Array.isArray(v.equipment_interior) ? v.equipment_interior as string[] : [],
      equipment_exterior: Array.isArray(v.equipment_exterior) ? v.equipment_exterior as string[] : [],
      check_in_time: String(v.check_in_time ?? "15:00"),
      check_out_time: String(v.check_out_time ?? "10:00"),
      wifi_name: String(v.wifi_name ?? ""),
      wifi_password: String(v.wifi_password ?? ""),
      is_published: Boolean(v.is_published),
      commission_rate: Number(v.commission_rate ?? 22),
      owner_id: String(v.owner_id ?? ""),
      collection_tier: String(v.collection_tier ?? ""),
      cleaning_fee_cents: Number(v.cleaning_fee_cents ?? 0),
    };
    return villaFormReducer(empty, { type: "LOAD_VILLA", villa: partial });
  });
  const [autoStatus, setAutoStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const autoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const statuses = sectionCompleteness(form);
  const sections = sectionsForRole(!!isAdmin);
  const summaryItems: SummaryItem[] = [
    { id: "identite", label: "Carte d'identité", bloc: "identity", status: statuses.infos as SectionStatus },
    ...sections.map((def) => ({
      id: def.id,
      label: def.label,
      bloc: def.bloc,
      status: def.statusKey ? (statuses[def.statusKey] as SectionStatus) : undefined,
    })),
  ];
  const sectionDef = (id: string) => sections.find((def) => def.id === id);

  const doSave = useCallback(async () => {
    setAutoStatus("saving");
    try {
      const res = await fetch("/api/dashboard/update-villa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ villaId: villa.id, payload: form }),
      });
      if (!res.ok) throw new Error("Save failed");
      setAutoStatus("saved");
      setLastSaved(new Date());
    } catch {
      setAutoStatus("error");
    }
  }, [form, villa.id]);

  useEffect(() => {
    clearTimeout(autoTimer.current ?? undefined);
    setAutoStatus("idle");
    autoTimer.current = setTimeout(() => { void doSave(); }, 2500);
    return () => clearTimeout(autoTimer.current ?? undefined);
  }, [form, doSave]);

  const handleChange = (key: string, value: unknown) => {
    dispatch({ type: "SET_FIELD", field: key, value });
  };

  const backHref = isAdmin ? "/admin/villas" : "/dashboard/villas";

  const renderSection = (id: string, children: ReactNode) => {
    const def = sectionDef(id);
    if (!def) return null;
    return (
      <EditorSection
        key={id}
        id={id}
        icon={def.icon}
        title={def.label}
        help={def.help}
        status={def.statusKey ? (statuses[def.statusKey] as SectionStatus) : undefined}
      >
        {children}
      </EditorSection>
    );
  };

  const configSections = sections.filter((def) => def.bloc === "config");
  const adminSections = sections.filter((def) => def.bloc === "admin");

  const sectionContent: Record<string, ReactNode> = {
    details: <VillaFormFields form={form as Record<string, unknown>} onChange={handleChange} embedded variant="details" />,
    equipments: (
      <VillaAmenitiesEditorV2
        interior={form.equipment_interior}
        exterior={form.equipment_exterior}
        servicesHome={form.included_services_home}
        servicesCollection={form.included_services_collection}
        aLaCarte={form.a_la_carte_services}
        amenitiesImportLabels={[]}
        onChangeInterior={(v) => dispatch({ type: "SET_ARRAY", field: "equipment_interior", value: v })}
        onChangeExterior={(v) => dispatch({ type: "SET_ARRAY", field: "equipment_exterior", value: v })}
        onChangeServicesHome={(v) => dispatch({ type: "SET_ARRAY", field: "included_services_home", value: v })}
        onChangeServicesCollection={(v) => dispatch({ type: "SET_ARRAY", field: "included_services_collection", value: v })}
        onChangeALaCarte={(v) => dispatch({ type: "SET_ARRAY", field: "a_la_carte_services", value: v })}
      />
    ),
    rooms: <RoomsEditor rooms={form.rooms_details} onChange={(rooms) => dispatch({ type: "SET_ROOMS", rooms })} />,
    pricing: <SeasonalPricesEditor seasons={form.seasonal_prices} onChange={(seasons) => dispatch({ type: "SET_SEASONS", seasons })} basePrice={form.price_per_night} />,
    services: (
      <div className="space-y-4">
        <ChipEditor id="srv-home" label="Inclus (accueil)" items={form.included_services_home} suggestions={[]} onChange={(v) => dispatch({ type: "SET_ARRAY", field: "included_services_home", value: v })} />
        <ChipEditor id="srv-collection" label="Services de collection" items={form.included_services_collection} suggestions={[]} onChange={(v) => dispatch({ type: "SET_ARRAY", field: "included_services_collection", value: v })} />
        <ChipEditor id="srv-alacarte" label="À la carte" items={form.a_la_carte_services} suggestions={[]} onChange={(v) => dispatch({ type: "SET_ARRAY", field: "a_la_carte_services", value: v })} />
      </div>
    ),
    rules: (
      <div className="space-y-4">
        <ChipEditor id="house-rules" label="Règles intérieures" items={form.house_rules} suggestions={["Pas de fête", "Non-fumeur", "Animaux acceptés", "Respect du voisinage", "Pas de bruit après 22h", "Enfants bienvenus", "Adultes seulement", "Check-in autonome"]} onChange={(v) => dispatch({ type: "SET_ARRAY", field: "house_rules", value: v })} />
        <ChipEditor id="safety-info" label="Sécurité" items={form.safety_info} suggestions={["Extincteur", "Trousse premiers secours", "Détecteur de fumée", "Détecteur CO", "Alarme", "Piscine sécurisée"]} onChange={(v) => dispatch({ type: "SET_ARRAY", field: "safety_info", value: v })} />
      </div>
    ),
    contacts: <EmergencyContactsEditor contacts={form.emergency_contacts} onChange={(contacts) => dispatch({ type: "SET_CONTACTS", contacts })} />,
    ical: icalContent ?? <p className="text-sm text-muted">Synchronisation iCal disponible.</p>,
    admin: (
      <div className="space-y-4">
        <div>
          <label htmlFor="ve-admin-tier" className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-muted">Collection</label>
          <select id="ve-admin-tier" value={form.collection_tier ?? ""} onChange={(e) => handleChange("collection_tier", e.target.value)} className="min-h-[44px] w-full rounded-lg border border-navy/10 bg-white px-4 text-base focus:border-gold/50 focus:outline-none">
            <option value="">—</option>
            <option value="standard">Standard</option>
            <option value="premium">Premium</option>
            <option value="signature">Signature</option>
          </select>
        </div>
        <label className="flex min-h-[44px] items-center gap-3">
          <input type="checkbox" checked={form.is_published} onChange={(e) => handleChange("is_published", e.target.checked)} className="size-5 rounded border-navy/25 text-gold focus:ring-gold" />
          <span className="text-sm font-medium text-navy">Publiée</span>
        </label>
        <div>
          <label htmlFor="ve-admin-commission" className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-muted">Commission (%)</label>
          <input id="ve-admin-commission" type="number" inputMode="numeric" min={0} max={100} value={form.commission_rate} onChange={(e) => handleChange("commission_rate", Number(e.target.value))} className="min-h-[44px] w-32 rounded-lg border border-navy/10 bg-white px-4 text-base focus:border-gold/50 focus:outline-none" />
        </div>
        <div>
          <label htmlFor="ve-admin-cleaning" className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-muted">Frais de ménage (€)</label>
          <input id="ve-admin-cleaning" type="number" inputMode="numeric" min={0} value={form.cleaning_fee_cents} onChange={(e) => handleChange("cleaning_fee_cents", Number(e.target.value))} className="min-h-[44px] w-48 rounded-lg border border-navy/10 bg-white px-4 text-base focus:border-gold/50 focus:outline-none" />
        </div>
        <div>
          <label htmlFor="ve-admin-owner" className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-muted">Propriétaire lié (ID)</label>
          <input id="ve-admin-owner" type="text" value={form.owner_id} onChange={(e) => handleChange("owner_id", e.target.value)} className="min-h-[44px] w-full rounded-lg border border-navy/10 bg-white px-4 font-mono text-sm focus:border-gold/50 focus:outline-none" />
        </div>
      </div>
    ),
  };

  return (
    <VillaEditorShell
      summary={
        <EditorSummary
          items={summaryItems}
          villaName={form.name}
          imageUrl={form.image_url || undefined}
          isPublished={form.is_published}
        />
      }
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="min-w-0 truncate font-display text-xl font-bold text-navy">{form.name || "Villa"}</h2>
        <div className="flex items-center gap-3">
          <AutosaveIndicator status={autoStatus} lastSaved={lastSaved} onRetry={() => { void doSave(); }} />
          <a
            href={`/villas/${villa.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-[44px] items-center rounded-lg border border-navy/15 bg-white px-4 text-sm font-semibold text-navy transition-colors hover:border-gold hover:text-gold"
          >
            Aperçu
          </a>
          <Link
            href={backHref}
            className="flex min-h-[44px] items-center rounded-lg bg-navy px-5 text-sm font-semibold text-white transition-colors hover:bg-navy/90"
          >
            Terminer
          </Link>
        </div>
      </div>
      {formError && <p className="mt-2 text-sm text-red-600">{formError}</p>}

      {/* Bloc 1 — Carte d'identité (jamais repliable) */}
      <section id="ve-identite" aria-label="Carte d'identité" className="scroll-mt-24 pb-8 pt-6" data-testid="editor-section-identite">
        <VillaFormFields form={form as Record<string, unknown>} onChange={handleChange} embedded variant="identity" />
        <div className="mt-6">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted">Photos ({form.image_urls.length}) — la première est la couverture</p>
          <VillaImageManager
            imageUrls={form.image_urls}
            villaId={villa.id}
            onImagesChange={(urls) => dispatch({ type: "SET_IMAGES", urls })}
            onMainImageChange={(url) => handleChange("image_url", url)}
            onError={(msg) => setFormError(msg)}
          />
          {photosFooter}
        </div>
      </section>

      {/* Bloc 2 — Configuration */}
      <div data-testid="villa-editor-sections">
        {configSections.map((def) => renderSection(def.id, sectionContent[def.id]))}
      </div>

      {/* Bloc 3 — Administration (fond teinté) */}
      {isAdmin && adminSections.length > 0 && (
        <div className="mt-10 rounded-2xl bg-navy/[0.03] px-5 pb-5 pt-4" data-testid="villa-editor-admin-bloc">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted">Administration</p>
          {adminSections.map((def) => renderSection(def.id, sectionContent[def.id]))}
          {adminExtras && <div className="mt-4 space-y-4 border-t border-navy/8 pt-4">{adminExtras}</div>}
        </div>
      )}
    </VillaEditorShell>
  );
}
```

- [ ] **Step 3: Compiler**

Run: `npx tsc --noEmit`
Expected: erreurs UNIQUEMENT dans les 4 pages consommatrices (`villa` requis, props disparues) — c'est attendu, Task 6/7/8 les corrigent. Aucune erreur dans `components/dashboard/villa-editor/`.

⚠️ Si `Stepper`/`ProgressBar`/`QuickNav`/`VillaPreviewCard` provoquent des erreurs d'import ailleurs : ne PAS les supprimer ici, c'est Task 9.

- [ ] **Step 4: Vérifier les tests unitaires**

Run: `npx vitest run lib/`
Expected: PASS (villa-editor-state + villa-editor-sections).

- [ ] **Step 5: Commit + push (commun Task 4+5)**

```bash
git add components/dashboard/villa-editor/VillaEditorShell.tsx components/dashboard/villa-editor/AutosaveIndicator.tsx components/dashboard/villa-editor/VillaEditor.tsx components/dashboard/villa-editor/VillaFormFields.tsx
git commit -m "feat(villa-editor): éditeur unifié 3 blocs — shell sommaire+contenu, sections plates, header épuré"
git push
```

---

### Task 6: `VillaCreateForm` + pages de création

**Files:**
- Create: `components/dashboard/villa-editor/VillaCreateForm.tsx`
- Modify: `app/(admin)/admin/villas/ajouter/page.tsx` (10 lignes — réécriture)
- Modify: `app/(proprio)/dashboard/villas/nouvelle/page.tsx` (43 lignes — remplacer le `<VillaEditor />` et la grille)

**Interfaces:**
- Consumes: `villaFormSchema` de `@/lib/validations/villa`, `Input` de `@/components/ui/input`, API `POST /api/dashboard/create-villa` (répond `{ id, ... }` au niveau racine).
- Produces: `VillaCreateForm({ redirectBase }: { redirectBase: string })` — mini-form Bloc 1 (nom, localisation, prix/nuit, capacité), validation Zod au submit, focus auto sur le premier champ invalide, redirection `router.push(`${redirectBase}/${id}`)`.

- [ ] **Step 1: Créer le composant**

```tsx
// components/dashboard/villa-editor/VillaCreateForm.tsx
"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { villaFormSchema } from "@/lib/validations/villa";
import { Input } from "@/components/ui/input";

const createVillaSchema = villaFormSchema.pick({
  name: true,
  location: true,
  price_per_night: true,
  capacity: true,
});

const FIELD_ORDER = ["name", "location", "price_per_night", "capacity"] as const;

export function VillaCreateForm({ redirectBase }: { redirectBase: string }) {
  const router = useRouter();
  const [values, setValues] = useState({ name: "", location: "", price_per_night: "", capacity: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const fieldRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const setValue = (key: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setValues((prev) => ({ ...prev, [key]: e.target.value }));
    if (errors[key]) setErrors((prev) => { const n = { ...prev }; delete n[key]; return n; });
  };

  // Validation au blur (règle spec) : on ne montre l'erreur d'un champ qu'une fois quitté
  const validateField = (key: keyof typeof values) => () => {
    const candidate = {
      name: values.name.trim(),
      location: values.location.trim(),
      price_per_night: Number(values.price_per_night),
      capacity: Number(values.capacity || 0),
    };
    const parsed = createVillaSchema.safeParse(candidate);
    if (parsed.success) return;
    const issue = parsed.error.issues.find((i) => i.path[0] === key);
    if (issue) setErrors((prev) => ({ ...prev, [key]: issue.message }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = createVillaSchema.safeParse({
      name: values.name.trim(),
      location: values.location.trim(),
      price_per_night: Number(values.price_per_night),
      capacity: Number(values.capacity || 0),
    });
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as string;
        if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      // NaN sur le prix (champ vide) → message clair
      if (Number.isNaN(Number(values.price_per_night))) fieldErrors.price_per_night = "Indiquez un prix par nuit en euros";
      setErrors(fieldErrors);
      const firstInvalid = FIELD_ORDER.find((f) => fieldErrors[f]);
      if (firstInvalid) fieldRefs.current[firstInvalid]?.focus();
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      const res = await fetch("/api/dashboard/create-villa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      if (!res.ok) throw new Error("Create failed");
      const data = (await res.json()) as { id?: string };
      if (!data.id) throw new Error("Missing id");
      router.push(`${redirectBase}/${data.id}`);
    } catch {
      setErrors({ _form: "Erreur lors de la création. Vérifiez votre connexion et réessayez." });
      setSubmitting(false);
    }
  };

  const fieldError = (key: string) =>
    errors[key] ? <p className="mt-1 text-xs text-red-600">{errors[key]}</p> : null;

  return (
    <form onSubmit={handleSubmit} className="max-w-xl" data-testid="villa-create-form" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="vc-name" className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-muted">Nom de la villa *</label>
          <Input id="vc-name" ref={(el: HTMLInputElement | null) => { fieldRefs.current.name = el; }} value={values.name} placeholder="Ex: Villa Océane" className="text-sm" onChange={setValue("name")} onBlur={validateField("name")} aria-invalid={!!errors.name} />
          {fieldError("name")}
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="vc-location" className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-muted">Localisation</label>
          <Input id="vc-location" ref={(el: HTMLInputElement | null) => { fieldRefs.current.location = el; }} value={values.location} placeholder="Ex: Trois-Îlets, Martinique" className="text-sm" onChange={setValue("location")} aria-invalid={!!errors.location} />
          {fieldError("location")}
        </div>
        <div>
          <label htmlFor="vc-price" className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-muted">Prix / nuit (€) *</label>
          <Input id="vc-price" ref={(el: HTMLInputElement | null) => { fieldRefs.current.price_per_night = el; }} type="number" inputMode="numeric" min="1" value={values.price_per_night} placeholder="250" className="text-sm" onChange={setValue("price_per_night")} onBlur={validateField("price_per_night")} aria-invalid={!!errors.price_per_night} />
          {fieldError("price_per_night")}
        </div>
        <div>
          <label htmlFor="vc-capacity" className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-muted">Capacité (personnes)</label>
          <Input id="vc-capacity" ref={(el: HTMLInputElement | null) => { fieldRefs.current.capacity = el; }} type="number" inputMode="numeric" min="1" value={values.capacity} placeholder="6" className="text-sm" onChange={setValue("capacity")} aria-invalid={!!errors.capacity} />
          {fieldError("capacity")}
        </div>
      </div>
      {errors._form && <p className="mt-4 text-sm text-red-600">{errors._form}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="mt-6 inline-flex min-h-[44px] items-center justify-center rounded-lg bg-gold px-8 text-sm font-bold text-white transition-colors hover:bg-gold/90 active:scale-[0.98] disabled:opacity-50"
      >
        {submitting ? "Création en cours…" : "Créer le brouillon"}
      </button>
      <p className="mt-2 text-xs text-muted">La villa est créée non publiée. Photos, équipements et tarifs se remplissent ensuite dans l'éditeur.</p>
    </form>
  );
}
```

⚠️ Si le composant `Input` (`@/components/ui/input`) ne forwarde pas les refs, remplacer les `<Input>` par des `<input>` natifs avec les mêmes classes que `vf-bedrooms` dans `VillaFormFields.tsx` (`w-full rounded-lg border border-border-subtle bg-transparent px-3 py-2 text-sm text-navy-900 placeholder:text-muted/50 focus:border-navy-900/30 focus:outline-none`).

- [ ] **Step 2: Réécrire la page admin de création**

```tsx
// app/(admin)/admin/villas/ajouter/page.tsx
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import { VillaCreateForm } from "@/components/dashboard/villa-editor/VillaCreateForm";

export const metadata: Metadata = {
  title: "Ajouter une villa — Administration Kayvila",
};

export default function AdminAddVillaPage() {
  return (
    <div className="space-y-6">
      <Link
        href="/admin/villas"
        className="inline-flex items-center gap-1.5 text-sm text-navy/50 transition-colors hover:text-navy"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Toutes les villas
      </Link>
      <div>
        <h1 className="font-display text-2xl font-bold text-navy">Ajouter une villa</h1>
        <p className="mt-1 text-sm text-muted">
          Renseignez la carte d&apos;identité. La villa est créée en brouillon non publié —
          le reste se complète dans l&apos;éditeur.
        </p>
      </div>
      <VillaCreateForm redirectBase="/admin/villas" />
    </div>
  );
}
```

- [ ] **Step 3: Réécrire la page proprio de création**

```tsx
// app/(proprio)/dashboard/villas/nouvelle/page.tsx
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import { VillaCreateForm } from "@/components/dashboard/villa-editor/VillaCreateForm";

export const metadata: Metadata = {
  title: "Ajouter une villa — Kayvila",
};

export default function NewVillaPage() {
  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/villas"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted transition-colors hover:text-navy-900"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
        Retour aux villas
      </Link>
      <div>
        <h1 className="font-display text-2xl font-bold text-navy-900">Ajouter une villa</h1>
        <p className="mt-1 text-sm text-muted">
          Renseignez les informations principales. La villa sera créée en mode
          non publiée — vous pourrez ensuite ajouter les photos et la soumettre à
          votre gestionnaire.
        </p>
      </div>
      <VillaCreateForm redirectBase="/dashboard/villas" />
    </div>
  );
}
```

- [ ] **Step 4: Vérifier les chemins route-group + compiler**

Run: `find app -maxdepth 2 -iname "*(*" -type d` — Expected: uniquement `app/(admin)`, `app/(proprio)` et les route-groups légitimes existants, aucun dossier fantôme échappé.
Run: `npx tsc --noEmit` — Expected: erreurs restantes UNIQUEMENT dans les 2 pages d'édition (Task 7/8).

- [ ] **Step 5: Commit + push**

```bash
git add components/dashboard/villa-editor/VillaCreateForm.tsx "app/(admin)/admin/villas/ajouter/page.tsx" "app/(proprio)/dashboard/villas/nouvelle/page.tsx"
git commit -m "feat(villa-editor): mini-form création → brouillon → éditeur (fin du stepper)"
git push
```

---

### Task 7: Page hôte admin — l'éditeur devient la page

**Files:**
- Modify: `app/(admin)/admin/villas/[id]/page.tsx` (168 lignes — réécriture du JSX ; les fetches Supabase restent identiques)

**Interfaces:**
- Consumes: `VillaEditor` (Task 5) avec `adminExtras: ReactNode` ; composants existants `AdminVillaBlocks`, `VillaDetailMiniMap`, `VillaThumb`, `VillaBookingsRegistry` (types).
- Produces: page admin sans sidebar 1/3 — l'éditeur occupe toute la largeur ; blocages + historique + mini-carte passés en `adminExtras`.

- [ ] **Step 1: Réécrire le JSX de la page**

Garder intégralement : imports Supabase, `generateMetadata`, les deux fetches (`villaResult`, `bookingsResult`), le mapping `bookings`. Supprimer : `checklistItems` + import `VillaPublishChecklist`, la grille `lg:grid-cols-3`, l'`<aside>`. Le `return` devient :

```tsx
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/admin/villas"
          className="inline-flex items-center gap-1.5 text-sm text-navy/50 transition-colors hover:text-navy"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Toutes les villas
        </Link>
        <h1 className="font-display text-2xl font-bold text-navy">{villa.name}</h1>
      </div>

      <VillaEditor
        villa={villa}
        isAdmin
        adminExtras={
          <>
            <AdminVillaBlocks villaId={villa.id} />

            {villa.latitude != null && villa.longitude != null ? (
              <div>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-navy/50">
                  Localisation
                </h3>
                <div className="h-[220px] overflow-hidden rounded-xl border border-navy/10 md:h-[280px]">
                  <VillaDetailMiniMap
                    latitude={villa.latitude}
                    longitude={villa.longitude}
                    name={villa.name ?? "Villa"}
                  />
                </div>
              </div>
            ) : null}

            {bookings.length > 0 && (() => {
              const todayDate = new Date().toISOString().slice(0, 10);
              const upcoming = bookings.filter((b) => (b.end_date ?? "") >= todayDate);
              const past = bookings.filter((b) => (b.end_date ?? "") < todayDate);
              const villaImageSrc =
                (villa.image_url as string | null) ??
                (Array.isArray(villa.image_urls)
                  ? (villa.image_urls as string[])[0]
                  : null);
              return (
                <div>
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-navy/50">
                    Historique
                  </h3>
                  <div className="space-y-0.5">
                    {[...upcoming, ...past].map((b) => (
                      <div key={b.id} className="flex items-center gap-3 border-b border-navy/8 py-2">
                        <VillaThumb
                          src={villaImageSrc}
                          alt={b.guest_name ?? "Réservation"}
                          size={48}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm text-navy">{b.guest_name ?? "Client"}</p>
                          <p className="text-[11px] text-navy/50">
                            {b.start_date ? new Date(b.start_date).toLocaleDateString("fr-FR") : "—"}{" "}→{" "}
                            {b.end_date ? new Date(b.end_date).toLocaleDateString("fr-FR") : "—"}
                          </p>
                        </div>
                        <span className="text-[11px] uppercase tracking-wide text-navy/45">{b.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </>
        }
      />
    </div>
  );
```

Note : `adminExtras` est du JSX rendu côté serveur passé en prop `ReactNode` à un Client Component — autorisé (seules les **fonctions** sont interdites). Le lien « Voir sur le site » de l'ancienne sidebar est remplacé par le bouton « Aperçu » du header de l'éditeur.

- [ ] **Step 2: Nettoyer les imports**

Supprimer de la page : `VillaPublishChecklist`, `VillaPublishChecklistItem`, `KayvilaPngIcon` (si plus utilisé dans le fichier). Garder : `AdminVillaBlocks`, `VillaDetailMiniMap`, `VillaThumb`, `VillaBookingsRegistry` (type `VillaBookingRow`).

- [ ] **Step 3: Compiler**

Run: `npx tsc --noEmit`
Expected: erreurs restantes UNIQUEMENT dans `app/(proprio)/dashboard/villas/[villaId]/page.tsx` (Task 8).

- [ ] **Step 4: Commit + push**

```bash
git add "app/(admin)/admin/villas/[id]/page.tsx"
git commit -m "feat(admin/villas): l'éditeur devient la page — sidebar absorbée dans le bloc Administration"
git push
```

---

### Task 8: Page hôte proprio — iCal réel + liens contextuels

**Files:**
- Modify: `app/(proprio)/dashboard/villas/[villaId]/page.tsx` (91 lignes — réécriture du JSX ; fetch identique)

**Interfaces:**
- Consumes: `VillaEditor` (Task 5) avec `icalContent` + `photosFooter` ; `VillaIcalPanel` existant (`@/components/dashboard/proprio/VillaIcalPanel`).
- Produces: page proprio sans sidebar — `VillaIcalPanel` vit dans la section iCal, liens « Gérer les photos » / « Gérer les disponibilités » recasés dans les sections concernées.

- [ ] **Step 1: Réécrire le JSX**

Garder : imports Supabase, metadata, fetch `villa`, `notFound()`. Le `return` devient :

```tsx
  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/dashboard/villas"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted transition-colors hover:text-navy-900"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
        Retour aux villas
      </Link>

      <VillaEditor
        villa={villa as unknown as Villa}
        icalContent={
          <div className="space-y-4">
            <VillaIcalPanel
              villaId={villa.id}
              icalUrl={(villa.ical_url as string) ?? null}
              otaChannels={(villa.ota_channels as Array<{ source: string; ical_url: string; label?: string }>) ?? null}
            />
            <Link
              href={`/dashboard/villas/${villa.id}/disponibilites`}
              className="inline-flex min-h-[44px] items-center gap-2 text-sm font-medium text-navy/60 transition-colors hover:text-navy"
            >
              <KayvilaPngIcon name="calendar" size={20} alt="" />
              Gérer les disponibilités
            </Link>
          </div>
        }
        photosFooter={
          <Link
            href={`/dashboard/villas/${villa.id}/photos`}
            className="mt-3 inline-flex min-h-[44px] items-center gap-2 text-sm font-medium text-navy/60 transition-colors hover:text-navy"
          >
            <KayvilaPngIcon name="camera" size={20} alt="" />
            Gérer les photos (page dédiée)
          </Link>
        }
      />
    </div>
  );
```

Supprimer : le `<h1>` (le header de l'éditeur affiche déjà le nom), la grille `lg:grid-cols-3`, la carte « Gestion ». Garder les imports `VillaIcalPanel`, `KayvilaPngIcon`, ajouter rien d'autre.

- [ ] **Step 2: Compiler + build**

Run: `npx tsc --noEmit` — Expected: **zéro erreur** (dernière page consommatrice corrigée).
Run: `npm run build` — Expected: build OK.
Run: `find app -maxdepth 2 -iname "*(*" -type d` — Expected: pas de dossier fantôme.

- [ ] **Step 3: Commit + push**

```bash
git add "app/(proprio)/dashboard/villas/[villaId]/page.tsx"
git commit -m "feat(dashboard/villas): éditeur pleine page proprio — VillaIcalPanel dans la section iCal"
git push
```

---

### Task 9: Suppression des composants morts

**Files:**
- Delete: `components/dashboard/villa-editor/Stepper.tsx`
- Delete: `components/dashboard/villa-editor/ProgressBar.tsx`
- Delete: `components/dashboard/villa-editor/QuickNav.tsx`
- Delete: `components/dashboard/villa-editor/VillaPreviewCard.tsx`
- Delete (si orphelin): `components/dashboard/villa-editor/VillaPublishChecklist.tsx`

- [ ] **Step 1: Vérifier qu'aucun import ne subsiste**

```bash
grep -rn "Stepper\|ProgressBar\|QuickNav\|VillaPreviewCard\|VillaPublishChecklist" app components lib --include="*.tsx" --include="*.ts" | grep -v villa-editor/Stepper | grep -v villa-editor/ProgressBar | grep -v villa-editor/QuickNav | grep -v villa-editor/VillaPreviewCard | grep -v villa-editor/VillaPublishChecklist
```

Expected: aucune ligne pour Stepper/QuickNav/VillaPreviewCard. Attention aux faux positifs (« ProgressBar » d'une lib UI ailleurs) : ne supprimer que si l'import vient de `villa-editor/`. Pour `VillaPublishChecklist` : si un autre fichier l'importe encore, le **garder** et retirer sa ligne de la liste des suppressions.

- [ ] **Step 2: Supprimer**

```bash
git rm components/dashboard/villa-editor/Stepper.tsx components/dashboard/villa-editor/ProgressBar.tsx components/dashboard/villa-editor/QuickNav.tsx components/dashboard/villa-editor/VillaPreviewCard.tsx
# + VillaPublishChecklist.tsx si orphelin (Step 1)
```

- [ ] **Step 3: Build complet**

Run: `npm run build`
Expected: OK.

- [ ] **Step 4: Commit + push**

```bash
git commit -m "chore(villa-editor): suppression Stepper/ProgressBar/QuickNav/VillaPreviewCard"
git push
```

---

### Task 10: Tests Playwright

**Files:**
- Create: `tests/villa-editor.spec.ts`
- Modify: `playwright.config.ts` (ajouter le spec au projet `dashboards`, lignes 34-43)

**Interfaces:**
- Consumes: helper `loginAs` (dupliqué depuis `tests/responsive-dashboards.spec.ts` — pattern existant du repo), data-testids posés en Tasks 2/3/4/5/6 (`editor-summary`, `summary-goto`, `editor-section-{id}`, `autosave-indicator[data-status]`, `villa-create-form`).
- Prérequis d'exécution : `npm run dev` lancé sur :3000, comptes de test admin (`admin@diamantnoir.com`) et proprio (env `TEST_OWNER_EMAIL`/`TEST_OWNER_PASSWORD`) valides.

- [ ] **Step 1: Ajouter le spec au projet dashboards**

Dans `playwright.config.ts`, projet `dashboards`, ajouter `"tests/villa-editor.spec.ts"` au tableau `testMatch`.

- [ ] **Step 2: Écrire les tests**

```ts
// tests/villa-editor.spec.ts
import { test, expect, type Page } from "@playwright/test";

const ADMIN = { email: "admin@diamantnoir.com", password: "Admin123!" };
const OWNER = {
  email: process.env.TEST_OWNER_EMAIL || "proprio1@test.com",
  password: process.env.TEST_OWNER_PASSWORD || "Test123456!",
};
const DESKTOP = { width: 1280, height: 800 };
const MOBILE = { width: 390, height: 844 };

async function loginAs(page: Page, email: string, password: string, redirectPrefix: string) {
  await page.addInitScript(() => {
    localStorage.setItem(
      "kayvila-cookie-consent",
      JSON.stringify({ necessary: true, analytics: false, marketing: false })
    );
  });
  await page.goto("/login");
  await page.locator("input[type='email'], input[name='email']").first().fill(email);
  await page.locator("input[type='password']").first().fill(password);
  await page.locator("button[type='submit']").first().click();
  await page.waitForURL((url: URL) => url.pathname.startsWith(redirectPrefix), { timeout: 20000 });
}

// La villa de test créée par le premier test, réutilisée ensuite (brouillon non publié, inoffensif)
const TEST_VILLA_NAME = `Villa Test E2E ${Date.now()}`;
let testVillaUrl = "";

test.describe.serial("Éditeur villa v2", () => {
  test("création : mini-form → brouillon → éditeur unifié", async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await loginAs(page, ADMIN.email, ADMIN.password, "/admin");
    await page.goto("/admin/villas/ajouter");

    const form = page.getByTestId("villa-create-form");
    await expect(form).toBeVisible();

    // Submit vide → erreur sous le champ nom, focus dessus
    await form.getByRole("button", { name: /Créer le brouillon/ }).click();
    await expect(form.getByText("Le nom est requis")).toBeVisible();

    await page.locator("#vc-name").fill(TEST_VILLA_NAME);
    await page.locator("#vc-price").fill("300");
    await page.locator("#vc-capacity").fill("4");
    await form.getByRole("button", { name: /Créer le brouillon/ }).click();

    // Redirection vers l'éditeur du brouillon
    await page.waitForURL(/\/admin\/villas\/[0-9a-f-]+$/, { timeout: 20000 });
    testVillaUrl = new URL(page.url()).pathname;
    await expect(page.getByTestId("editor-summary")).toBeVisible();
    await expect(page.getByTestId("editor-section-identite")).toBeVisible();
  });

  test("sommaire : clic → scroll vers la section + bloc admin visible", async ({ page }) => {
    test.skip(!testVillaUrl, "dépend du test de création");
    await page.setViewportSize(DESKTOP);
    await loginAs(page, ADMIN.email, ADMIN.password, "/admin");
    await page.goto(testVillaUrl);

    const summary = page.getByTestId("editor-summary");
    await expect(summary).toBeVisible();
    await summary.getByRole("button", { name: "Équipements" }).click();
    await expect(page.getByTestId("editor-section-equipments")).toBeInViewport({ timeout: 5000 });

    // Bloc admin présent pour l'admin
    await expect(page.getByTestId("villa-editor-admin-bloc")).toBeAttached();
    // Anciens systèmes de navigation disparus
    await expect(page.locator("[data-testid='villa-editor-sections'] details")).toHaveCount(0);
  });

  test("autosave : modification → point 'saved'", async ({ page }) => {
    test.skip(!testVillaUrl, "dépend du test de création");
    await page.setViewportSize(DESKTOP);
    await loginAs(page, ADMIN.email, ADMIN.password, "/admin");
    await page.goto(testVillaUrl);

    await page.locator("#vf-surface").fill("150");
    await expect(page.locator("[data-testid='autosave-indicator'][data-status='saved']")).toBeVisible({ timeout: 15000 });
  });

  test("proprio : pas de bloc admin, iCal réel présent", async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await loginAs(page, OWNER.email, OWNER.password, "/dashboard");
    await page.goto("/dashboard/villas");

    // Ouvrir la première villa du proprio
    const firstVilla = page.locator("a[href^='/dashboard/villas/']").first();
    await firstVilla.click();
    await page.waitForURL(/\/dashboard\/villas\/[0-9a-f-]+/, { timeout: 20000 });

    await expect(page.getByTestId("editor-summary")).toBeVisible();
    await expect(page.getByTestId("villa-editor-admin-bloc")).toHaveCount(0);
    // La section iCal existe côté proprio (bloc Configuration)
    await expect(page.getByTestId("editor-section-ical")).toBeAttached();
  });

  test("mobile : dropdown 'Aller à…' navigue", async ({ page }) => {
    test.skip(!testVillaUrl, "dépend du test de création");
    await page.setViewportSize(MOBILE);
    await loginAs(page, ADMIN.email, ADMIN.password, "/admin");
    await page.goto(testVillaUrl);

    const goto = page.getByTestId("summary-goto");
    await expect(goto).toBeVisible();
    await goto.selectOption("pricing");
    await expect(page.getByTestId("editor-section-pricing")).toBeInViewport({ timeout: 5000 });

    // Pas d'overflow horizontal
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect(overflow).toBeLessThanOrEqual(1);
  });
});
```

Note : la villa de test reste en base comme brouillon non publié nommé « Villa Test E2E … » — inoffensif et identifiable. Si un endpoint de suppression villa existe côté admin, un nettoyage peut être ajouté plus tard ; ne pas en inventer un.

- [ ] **Step 3: Lancer les tests (dev server requis)**

Run: `npm run dev` (terminal séparé ou background), puis
`npx playwright test tests/villa-editor.spec.ts --project=dashboards`
Expected: 5 PASS. Si `Équipements` matche 2 boutons (sommaire + section), préciser `summary.getByRole(...)` — déjà scopé sur `summary` dans le code ci-dessus.

- [ ] **Step 4: Commit + push**

```bash
git add tests/villa-editor.spec.ts playwright.config.ts
git commit -m "test(villa-editor): 5 tests Playwright — création, sommaire, autosave, rôles, mobile"
git push
```

---

### Task 11: Vérification finale

- [ ] **Step 1: Suite complète**

```bash
npx vitest run
npm run lint
npm run build
```
Expected: vitest PASS (dont les 105 existants), lint sans nouvelle erreur, build OK.

- [ ] **Step 2: Vérification visuelle rapide**

Avec le dev server : ouvrir `/admin/villas/[id d'une villa]` en desktop (sommaire sticky, 3 blocs, header épuré) et en 390px (dropdown « Aller à… »). Vérifier que le bouton « Aperçu » ouvre la page publique dans un nouvel onglet. **Si la page publique 404 pour une villa non publiée** : le signaler à Kenneson (la garde serveur de `/villas/[id]` doit tolérer admin/proprio) — ne pas modifier la page publique sans validation, c'est hors scope du plan.

- [ ] **Step 3: Commit final éventuel + push**

```bash
git status
# si reliquats (config, snapshots) :
git add -A && git commit -m "chore(villa-editor): finitions refonte ergo v2" && git push
```
