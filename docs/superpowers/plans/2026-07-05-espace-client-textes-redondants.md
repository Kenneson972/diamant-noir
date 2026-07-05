# Nettoyage textes redondants — Espace Client Kayvila — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Supprimer le fil d'ariane redondant du header, remplacer `roleLabel` statique par un kicker contextuel par page, supprimer `PageTopbar` et le remplacer par des titres inline sur les 9 pages client.

**Architecture:** `EspaceClientShell` détecte la route courante et mappe vers un kicker. Ce kicker est passé via `roleLabel` (prop existante) à `DashboardShell` → `DashboardHeader`. Le bloc breadcrumb est retiré de `DashboardHeader`. Chaque page remplace `<PageTopbar>` par un `<h1>` ou réutilise un titre existant.

**Tech Stack:** Next.js 14 App Router, React, Tailwind CSS.

## Global Constraints

- Ne pas toucher aux dashboards admin et proprio — seul le retrait du breadcrumb les affecte visuellement.
- La prop s'appelle toujours `roleLabel` dans `DashboardShell`/`DashboardHeader` — pas de renommage (évite de casser admin/proprio).
- `PageTopbar.tsx` est supprimé — plus aucun import n'y fait référence.
- Aucune nouvelle dépendance, aucun test unitaire (changements purement cosmétiques).

---

### Task 1: Retirer le fil d'ariane du `DashboardHeader`

**Files:**
- Modify: `components/dashboard/shared/DashboardHeader.tsx`

**Interfaces:**
- Consumes: rien de nouveau.
- Produit: header sans le bloc breadcrumb (lignes 61-75). Le kicker doré (`roleLabel`) est conservé tel quel.

- [ ] **Step 1: Supprimer le bloc breadcrumb**

Dans `components/dashboard/shared/DashboardHeader.tsx`, supprimer l'import de `findSidebarBreadcrumb` (ligne 7), la variable `breadcrumb` (lignes 43-48), et le bloc conditionnel (lignes 61-75).

Remplacer :

```tsx
import { findSidebarBreadcrumb } from "@/components/dashboard/shared/kayvila-sidebar-panel";
```

par : (supprimer la ligne entière)

Remplacer :

```tsx
  const breadcrumb = useMemo(
    () => findSidebarBreadcrumb(menu, pathname),
    [menu, pathname]
  );

```

par : (supprimer le bloc entier)

Remplacer :

```tsx
          {breadcrumb ? (
            <p className="hidden min-w-0 items-baseline gap-1.5 font-display-dashboard text-sm text-navy/50 md:flex">
              {breadcrumb.parent ? (
                <>
                  <span>{breadcrumb.parent}</span>
                  <span className="text-navy/30">/</span>
                </>
              ) : null}
              <span className="font-semibold text-navy">{breadcrumb.current}</span>
            </p>
          ) : (
            <p className="truncate font-display-dashboard text-lg font-semibold leading-tight text-navy md:text-xl">
              Kayvila
            </p>
          )}
```

par :

```tsx
          <p className="truncate font-display-dashboard text-lg font-semibold leading-tight text-navy md:text-xl">
            Kayvila
          </p>
```

Nettoyer aussi l'import `useMemo` s'il n'est plus utilisé (vérifier : il sert pour `today` et `isoDate` → le garder). Supprimer `usePathname` s'il n'est plus utilisé (vérifier : il n'est plus référencé après suppression de `breadcrumb`).

- [ ] **Step 2: Vérifier visuellement**

Lancer le serveur dev (`npm run dev`), ouvrir `/admin/revenus`, `/dashboard`, `/espace-client`. Le header doit afficher le kicker doré + "Kayvila" en dessous, sans le fil d'ariane gris.

- [ ] **Step 3: Commit**

```bash
git add components/dashboard/shared/DashboardHeader.tsx
git commit -m "fix(ui): remove redundant breadcrumb from dashboard header"
```

---

### Task 2: Mapper les kickers par route dans `EspaceClientShell`

**Files:**
- Modify: `app/espace-client/EspaceClientShell.tsx`

**Interfaces:**
- Consumes: `usePathname` from `next/navigation`.
- Produit: `roleLabel` passé à `DashboardShell` varie selon la route.

- [ ] **Step 1: Ajouter le mapping et remplacer `roleLabel` statique**

Remplacer tout le contenu de `app/espace-client/EspaceClientShell.tsx` par :

```tsx
"use client";

import { useMemo, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/shared/DashboardShell";
import { tenantMenuItems } from "@/components/espace-client/TenantMenuItems";

const KICKER_BY_ROUTE: Record<string, string> = {
  "/espace-client": "CONCIERGERIE KAYVILA",
  "/espace-client/livret": "VOTRE VILLA",
  "/espace-client/favoris": "VOS COUPS DE CŒUR",
  "/espace-client/messagerie": "VOTRE CONCIERGE",
  "/espace-client/notifications": "RESTEZ INFORMÉ",
  "/espace-client/demandes": "PENDANT VOTRE SÉJOUR",
  "/espace-client/checklist": "VOTRE SÉJOUR",
  "/espace-client/profil": "VOTRE COMPTE",
  "/espace-client/documents": "VOTRE DOSSIER",
  "/espace-client/conciergerie": "NOUS JOINDRE",
};

const DEFAULT_KICKER = "CLIENT";

export default function EspaceClientShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const kicker = useMemo(() => {
    // Match exact path first, then fall back to prefix match for sub-routes
    if (KICKER_BY_ROUTE[pathname]) return KICKER_BY_ROUTE[pathname];
    // Check parent paths (e.g., /espace-client/reservations/xxx → CONCIERGERIE KAYVILA)
    for (const [route, label] of Object.entries(KICKER_BY_ROUTE)) {
      if (pathname.startsWith(route + "/")) return label;
    }
    return DEFAULT_KICKER;
  }, [pathname]);

  return (
    <DashboardShell role="tenant" roleLabel={kicker} menu={tenantMenuItems}>
      <div className="mx-auto w-full max-w-6xl p-5 md:p-10">{children}</div>
    </DashboardShell>
  );
}
```

- [ ] **Step 2: Vérifier visuellement**

Naviguer entre les pages de l'espace client. Le kicker doré dans le header doit changer selon la page (ex: "VOTRE VILLA" sur /livret, "VOS COUPS DE CŒUR" sur /favoris).

- [ ] **Step 3: Commit**

```bash
git add app/espace-client/EspaceClientShell.tsx
git commit -m "feat(tenant): per-page kicker labels in client space header"
```

---

### Task 3: Supprimer `PageTopbar` et mettre à jour les 9 pages client

**Files:**
- Delete: `components/espace-client/PageTopbar.tsx`
- Modify: `app/espace-client/livret/page.tsx`
- Modify: `app/espace-client/favoris/page.tsx`
- Modify: `app/espace-client/messagerie/page.tsx`
- Modify: `app/espace-client/notifications/page.tsx`
- Modify: `app/espace-client/demandes/page.tsx`
- Modify: `app/espace-client/checklist/page.tsx`
- Modify: `app/espace-client/profil/page.tsx`
- Modify: `app/espace-client/documents/page.tsx`
- Modify: `app/espace-client/conciergerie/page.tsx`

**Interfaces:**
- Consumes: rien de nouveau.
- Produit: plus aucun import de `PageTopbar` dans le projet.

- [ ] **Step 1: Supprimer `PageTopbar.tsx`**

```bash
rm components/espace-client/PageTopbar.tsx
```

- [ ] **Step 2: Mettre à jour `livret/page.tsx`**

Supprimer l'import : `import { PageTopbar } from "@/components/espace-client/PageTopbar";`

Remplacer le `<PageTopbar>` dans le JSX (chercher `<PageTopbar section="Espace client" title="Livret d'accueil" />`) par un titre inline. Ajouter juste après l'ouverture du `return (` :

```tsx
<h1 className="font-display text-2xl font-normal text-navy mb-6">Livret d&apos;accueil</h1>
```

- [ ] **Step 3: Mettre à jour `favoris/page.tsx`**

Supprimer l'import `PageTopbar`. Remplacer `<PageTopbar section="Espace client" title="Mes favoris" />` par :

```tsx
<h1 className="font-display text-2xl font-normal text-navy mb-6">Mes favoris</h1>
```

- [ ] **Step 4: Mettre à jour `messagerie/page.tsx`**

Supprimer l'import `PageTopbar`. Remplacer `<PageTopbar section="Espace client" title="Messages" />` par :

```tsx
<h1 className="font-display text-2xl font-normal text-navy mb-6">Messages</h1>
```

- [ ] **Step 5: Mettre à jour `notifications/page.tsx`**

Supprimer l'import `PageTopbar`. Remplacer `<PageTopbar section="Espace client" title="Mes notifications" />` par :

```tsx
<h1 className="font-display text-2xl font-normal text-navy mb-6">Notifications</h1>
```

(Note : "Mes notifications" → "Notifications" comme demandé dans le spec.)

- [ ] **Step 6: Mettre à jour `demandes/page.tsx`**

Supprimer l'import `PageTopbar`. Remplacer `<PageTopbar section="Espace client" title="Services & demandes" />` par :

```tsx
<h1 className="font-display text-2xl font-normal text-navy mb-6">Services &amp; demandes</h1>
```

- [ ] **Step 7: Mettre à jour `checklist/page.tsx`**

Supprimer l'import `PageTopbar`. Remplacer `<PageTopbar section="Espace client" title="Avant votre arrivée" />` par :

```tsx
<h1 className="font-display text-2xl font-normal text-navy mb-6">Avant votre arrivée</h1>
```

- [ ] **Step 8: Mettre à jour `profil/page.tsx`**

Supprimer l'import `PageTopbar`. Remplacer `<PageTopbar section="Espace client" title="Mon profil" />` par :

```tsx
<h1 className="font-display text-2xl font-normal text-navy mb-6">Mon profil</h1>
```

- [ ] **Step 9: Mettre à jour `documents/page.tsx`**

Supprimer l'import `PageTopbar`. Remplacer `<PageTopbar section="Espace client" title="Mes documents" />` par :

```tsx
<h1 className="font-display text-2xl font-normal text-navy mb-6">Mes documents</h1>
```

- [ ] **Step 10: Mettre à jour `conciergerie/page.tsx`**

Supprimer l'import `PageTopbar`. Remplacer `<PageTopbar section="Espace client" title="Contacts & urgences" />` par :

```tsx
<h1 className="font-display text-2xl font-normal text-navy mb-6">Contacts &amp; urgences</h1>
```

- [ ] **Step 11: Vérifier qu'aucun autre fichier n'importe `PageTopbar`**

```bash
grep -r "PageTopbar" --include="*.tsx" --include="*.ts" app/ components/ | grep -v node_modules
```

Expected: aucun résultat (tous les imports ont été retirés).

- [ ] **Step 12: Vérifier TypeScript**

```bash
npx tsc --noEmit
```

Expected: aucune nouvelle erreur (seules les erreurs pré-existantes de `tests/a11y.spec.ts` et `.next/types` peuvent subsister).

- [ ] **Step 13: Commit**

```bash
git add components/espace-client/PageTopbar.tsx app/espace-client/livret/page.tsx app/espace-client/favoris/page.tsx app/espace-client/messagerie/page.tsx app/espace-client/notifications/page.tsx app/espace-client/demandes/page.tsx app/espace-client/checklist/page.tsx app/espace-client/profil/page.tsx app/espace-client/documents/page.tsx app/espace-client/conciergerie/page.tsx
git commit -m "feat(tenant): replace PageTopbar with inline h1 titles, remove redundant section labels"
```

---

### Task 4: Vérification responsive et nettoyage final

**Files:**
- Aucun fichier modifié (vérification seulement).

- [ ] **Step 1: Vérifier le rendu responsive**

Lancer le serveur dev et vérifier visuellement chaque page client en viewport 360px et 1280px :
- Le header doit être propre (kicker doré + "Kayvila")
- Chaque page doit avoir son `<h1>` visible sans doublon
- Aucun débordement horizontal

- [ ] **Step 2: Vérifier que `usePathname` n'est plus importé dans `DashboardHeader`**

Ouvrir `components/dashboard/shared/DashboardHeader.tsx` et vérifier que `usePathname` n'est plus dans les imports. Si c'est le cas, le retirer.

- [ ] **Step 3: Commit (si changements)**

```bash
git add components/dashboard/shared/DashboardHeader.tsx
git commit -m "chore: remove unused usePathname import from DashboardHeader"
```

(Si aucun changement, passer cette étape.)
