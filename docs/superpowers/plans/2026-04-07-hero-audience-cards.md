# Hero Audience Cards — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remplacer le gate plein écran d'audience par deux cartes directement dans la section hero — "Espace Voyageur" (révèle la barre de recherche) et "Espace Propriétaire" — sans overlay bloquant.

**Architecture:** La logique d'audience (sessionStorage + contexte) est conservée. `HomeAudienceGate` est gardé mais ne s'affiche plus au premier chargement — uniquement à la réouverture explicite (bouton navbar "Changer de parcours"). Un nouveau composant client `HeroAudienceCards` prend la place du gate dans le hero, avec un toggle animé qui révèle `HeroSearchWidget` pour les voyageurs.

**Tech Stack:** Next.js 14 App Router, React useState/useCallback, Tailwind CSS, Lucide React, contexte existant `HomeAudienceContext`

---

## Fichiers touchés

| Fichier | Action |
|---------|--------|
| `components/home/HomeAudienceGate.tsx` | Modifier — supprimer l'affichage au premier chargement |
| `components/home/HeroAudienceCards.tsx` | **Créer** — deux cartes hero + toggle search |
| `app/page.tsx` | Modifier — ajouter `<HeroAudienceCards />` dans le hero |

---

## Task 1 : Désactiver le gate au premier chargement

**Files:**
- Modify: `components/home/HomeAudienceGate.tsx` (fonction `readGateInitialShow`, ligne ~38)

- [ ] **Lire le fichier**

```bash
# Ligne clé actuelle (~56) :
# const show = (wantReopen && !stored) || (!stored && !hasPour);
# → On veut : show = wantReopen && !stored
```

- [ ] **Modifier `readGateInitialShow` pour n'afficher que sur réouverture explicite**

Dans `components/home/HomeAudienceGate.tsx`, remplacer :
```ts
const show = (wantReopen && !stored) || (!stored && !hasPour);
```
par :
```ts
const show = wantReopen && !stored;
```

Cela signifie : le gate ne s'ouvre jamais au premier chargement (quand `wantReopen = false`). Il ne s'ouvre que si un bouton navbar a appelé `requestGateReopen()`.

- [ ] **Build pour vérifier**

```bash
cd "$(git rev-parse --show-toplevel)" && npm run build 2>&1 | grep -E "error|Error|✓|✗"
```
Expected : `✓ Compiled successfully`

- [ ] **Commit**

```bash
git add components/home/HomeAudienceGate.tsx
git commit -m "feat(hero): disable audience gate on first load — cards in hero instead"
```

---

## Task 2 : Créer `HeroAudienceCards`

**Files:**
- Create: `components/home/HeroAudienceCards.tsx`

Le composant affiche :
- Deux cartes côte à côte (col-2 sur sm+, stacked sur mobile)
- Carte "Espace Voyageur" : clic → `showSearch = true` → `HeroSearchWidget` apparaît au-dessous avec animation
- Carte "Espace Propriétaire" : clic → stocke audience + scroll vers `#offre-proprietaire`
- Quand l'audience est déjà choisie (sessionStorage), la carte active est mise en avant

- [ ] **Créer `components/home/HeroAudienceCards.tsx`**

```tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ArrowRight, Building2 } from "lucide-react";
import {
  HOME_AUDIENCE_STORAGE_KEY,
  notifyHomeAudienceChange,
} from "@/contexts/HomeAudienceContext";
import { HeroSearchWidget } from "@/components/HeroSearchWidget";

export function HeroAudienceCards() {
  const router = useRouter();
  const [showSearch, setShowSearch] = useState(false);
  const [activeAudience, setActiveAudience] = useState<"voyageur" | "proprietaire" | null>(null);

  // Lire l'audience depuis sessionStorage au montage
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(HOME_AUDIENCE_STORAGE_KEY) as
        | "voyageur"
        | "proprietaire"
        | null;
      if (stored === "voyageur") {
        setActiveAudience("voyageur");
        setShowSearch(true);
      } else if (stored === "proprietaire") {
        setActiveAudience("proprietaire");
      }
    } catch {
      /* private mode */
    }
  }, []);

  const chooseVoyageur = useCallback(() => {
    try {
      sessionStorage.setItem(HOME_AUDIENCE_STORAGE_KEY, "voyageur");
    } catch {
      /* private mode */
    }
    notifyHomeAudienceChange();
    setActiveAudience("voyageur");
    setShowSearch((prev) => !prev); // toggle — second clic referme
  }, []);

  const chooseProprio = useCallback(() => {
    try {
      sessionStorage.setItem(HOME_AUDIENCE_STORAGE_KEY, "proprietaire");
    } catch {
      /* private mode */
    }
    notifyHomeAudienceChange();
    setActiveAudience("proprietaire");
    setShowSearch(false);
    // Scroll vers la section proprio
    router.replace("/?pour=proprietaires");
  }, [router]);

  return (
    <div className="mt-8 w-full max-w-2xl mx-auto flex flex-col gap-4">
      {/* Deux cartes */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {/* Voyageur */}
        <button
          type="button"
          onClick={chooseVoyageur}
          className={[
            "group flex min-h-[100px] flex-col items-start gap-2 px-6 py-6 text-left transition-all duration-200",
            "border backdrop-blur-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 active:scale-[0.98]",
            activeAudience === "voyageur"
              ? "border-gold/70 bg-white/15 shadow-[0_0_0_1px_rgba(212,175,55,0.3)]"
              : "border-white/20 bg-white/8 hover:border-gold/40 hover:bg-white/12",
          ].join(" ")}
          aria-expanded={showSearch}
        >
          <span className="text-[9px] font-bold uppercase tracking-[0.35em] text-gold/80">
            Voyageurs
          </span>
          <span className="font-display text-lg leading-tight text-white">
            Je réserve un séjour
          </span>
          <Search
            className={[
              "mt-auto h-4 w-4 text-gold/60 transition-transform duration-200",
              showSearch ? "rotate-90 opacity-100" : "group-hover:translate-x-0.5",
            ].join(" ")}
            strokeWidth={1.25}
            aria-hidden
          />
        </button>

        {/* Propriétaire */}
        <button
          type="button"
          onClick={chooseProprio}
          className={[
            "group flex min-h-[100px] flex-col items-start gap-2 px-6 py-6 text-left transition-all duration-200",
            "border backdrop-blur-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 active:scale-[0.98]",
            activeAudience === "proprietaire"
              ? "border-white/40 bg-white/15"
              : "border-white/15 bg-white/5 hover:border-white/30 hover:bg-white/10",
          ].join(" ")}
        >
          <span className="text-[9px] font-bold uppercase tracking-[0.35em] text-white/50">
            Propriétaires
          </span>
          <span className="font-display text-lg leading-tight text-white">
            J&apos;ai une villa à louer
          </span>
          <Building2
            className="mt-auto h-4 w-4 text-white/35 transition-transform duration-200 group-hover:translate-x-0.5"
            strokeWidth={1.25}
            aria-hidden
          />
        </button>
      </div>

      {/* Barre de recherche — visible si showSearch */}
      <div
        className={[
          "overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.33,1,0.68,1)]",
          showSearch ? "max-h-[200px] opacity-100" : "max-h-0 opacity-0 pointer-events-none",
        ].join(" ")}
        aria-hidden={!showSearch}
      >
        <HeroSearchWidget />
      </div>
    </div>
  );
}
```

- [ ] **Build**

```bash
npm run build 2>&1 | grep -E "error|Error|✓|✗"
```
Expected : `✓ Compiled successfully`

- [ ] **Commit**

```bash
git add components/home/HeroAudienceCards.tsx
git commit -m "feat(hero): add HeroAudienceCards with inline search toggle"
```

---

## Task 3 : Intégrer les cartes dans le hero de `app/page.tsx`

**Files:**
- Modify: `app/page.tsx`

Le hero actuel a :
```tsx
<div className="relative z-10 mx-auto flex w-full max-w-4xl flex-col items-center px-5 text-center sm:px-6">
  <Suspense fallback={null}><HomeAudienceScroll /></Suspense>
  <HeroWordmarkBaseline ... />
</div>
```

On ajoute `<HeroAudienceCards />` juste après `<HeroWordmarkBaseline />`, à l'intérieur du `div` relatif.

- [ ] **Modifier `app/page.tsx`**

1. Ajouter l'import en haut du fichier (après les imports existants) :
```tsx
import { HeroAudienceCards } from "@/components/home/HeroAudienceCards";
```

2. Dans le JSX du hero, remplacer le bloc `<div className="relative z-10 ...">` par :
```tsx
<div className="relative z-10 mx-auto flex w-full max-w-4xl flex-col items-center px-5 text-center sm:px-6">
  <Suspense fallback={null}>
    <HomeAudienceScroll />
  </Suspense>
  <HeroWordmarkBaseline
    headingId="hero-title"
    titleLabel="Diamant Noir — Confiance, réactivité, excellence"
  />
  <HeroAudienceCards />
</div>
```

3. Supprimer la ligne `<HomeAudienceGateLoader />` (le gate ne s'affiche plus au premier chargement — on le garde uniquement si la navbar en a besoin).

   > ⚠️ Vérifier si la navbar utilise `requestGateReopen` AVANT de supprimer `HomeAudienceGateLoader`. Si oui, la garder dans la page.

- [ ] **Vérifier la navbar**

```bash
grep -r "requestGateReopen\|HomeAudienceGateLoader" components/layout/Navbar.tsx 2>/dev/null || echo "absent"
```

Si présent → garder `<HomeAudienceGateLoader />` dans `app/page.tsx`. Sinon → la supprimer.

- [ ] **Build final**

```bash
npm run build 2>&1 | grep -E "error|Error|✓|✗"
```
Expected : `✓ Compiled successfully`

- [ ] **Commit**

```bash
git add app/page.tsx
git commit -m "feat(hero): embed HeroAudienceCards in hero section, remove blocking gate on first load"
```

---

## Self-Review

**Spec coverage :**
- ✅ Gate plein écran supprimé au premier chargement
- ✅ Deux cartes dans le hero (voyageur + propriétaire)
- ✅ Clic "Espace Voyageur" → barre de recherche type Airbnb révélée
- ✅ Clic "Espace Propriétaire" → scroll section proprio
- ✅ Compatibilité avec "Changer de parcours" navbar (réouverture gate si besoin)

**Risques :**
- `HeroSearchWidget` a un style `glass-card` qui peut ne pas bien contraster sur fond hero sombre — ajuster si besoin après test visuel
- La section hero a `min-h-[220px]` sur mobile — vérifier qu'elle grandit assez avec les cartes (CSS `min-h` pas `h-`, donc OK)
