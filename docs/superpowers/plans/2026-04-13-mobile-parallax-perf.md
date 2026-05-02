# Mobile Parallax Performance Fix — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Éliminer la latence du scroll parallax sur mobile dans `PrestationsPageClient.tsx`.

**Architecture:** 4 corrections ciblées dans un seul fichier — aucune dépendance externe, aucun refactoring global. Les fixes sont indépendants et peuvent être appliqués dans n'importe quel ordre.

**Tech Stack:** Next.js 14 App Router, GSAP ScrollTrigger, Canvas 2D API, TypeScript

---

## Causes identifiées

| # | Cause | Impact mobile |
|---|-------|---------------|
| 1 | `scrub: 1.2` — lag de 1.2s entre doigt et canvas | 🔴 Critique |
| 2 | `ctx.scale(d, d)` s'accumule sur chaque resize | 🔴 Critique (scale ×8 après 3 rotations) |
| 3 | Canvas sans `alpha: false` | 🟡 Modéré (20-40% de perf en moins) |
| 4 | Frame loading via `rAF` à 60fps sature le réseau mobile | 🟡 Modéré |

## Fichiers concernés

- Modify: `app/prestations/PrestationsPageClient.tsx`
  - `resizeCanvas()` — bug ctx.scale
  - `renderFrame()` — canvas alpha
  - `useEffect` GSAP — scrub adaptatif
  - `useEffect` preload — throttle réseau

---

## Task 1 — Fix ctx.scale accumulation (bug critique)

**Files:**
- Modify: `app/prestations/PrestationsPageClient.tsx` → `resizeCanvas()` (lignes ~147-160)

**Problème :** `ctx.scale(d, d)` s'ajoute au transform existant. Après orientation portrait→paysage→portrait : scale = dpr³ = 8 au lieu de 2. Le canvas rend 4× plus de pixels, le GPU surchauffe, l'animation rame.

- [ ] **Step 1: Remplacer `ctx.scale` par `ctx.setTransform` dans `resizeCanvas`**

```typescript
// AVANT (lignes ~147-160 dans PrestationsPageClient.tsx)
const resizeCanvas = useCallback(() => {
  const canvas = canvasRef.current;
  if (!canvas) return;
  const d = dpr.current;
  const w = window.innerWidth;
  const h = window.innerHeight;
  canvas.width = w * d;
  canvas.height = h * d;
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;
  const ctx = canvas.getContext("2d");
  if (ctx) ctx.scale(d, d);            // ← BUG : s'accumule
  renderFrame(currentFrameRef.current);
}, [renderFrame]);

// APRÈS
const resizeCanvas = useCallback(() => {
  const canvas = canvasRef.current;
  if (!canvas) return;
  const d = dpr.current;
  const w = window.innerWidth;
  const h = window.innerHeight;
  canvas.width = w * d;
  canvas.height = h * d;
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;
  const ctx = canvas.getContext("2d");
  if (ctx) ctx.setTransform(d, 0, 0, d, 0, 0); // ← SET (pas accumulation)
  renderFrame(currentFrameRef.current);
}, [renderFrame]);
```

- [ ] **Step 2: Vérifier que TypeScript compile sans erreur**

```bash
cd /Users/kennesonbasel-somnier/Downloads/CLIENT\ KARIBLOOM/DIAMANTNOIR/kayvila
npx tsc --noEmit 2>&1 | head -20
```

Expected: aucune erreur liée à `setTransform` (c'est une méthode standard de `CanvasRenderingContext2D`).

---

## Task 2 — Scrub adaptatif mobile/desktop

**Files:**
- Modify: `app/prestations/PrestationsPageClient.tsx` → `useEffect` GSAP (lignes ~201-332)

**Problème :** `scrub: 1.2` = max 1.2s de lag entre le doigt et le canvas. Sur desktop = cinématique. Sur mobile = perception de bug.

**Solution :** Détecter mobile au moment du mount GSAP, utiliser `scrub: 0.5` sur écrans < 768px.

- [ ] **Step 1: Ajouter la détection mobile dans le useEffect GSAP**

Trouver ce bloc dans le `useEffect` GSAP (après `gsap.registerPlugin(ScrollTrigger)`):

```typescript
// AVANT
const mainTrigger = ScrollTrigger.create({
  trigger: driver,
  start: "top top",
  end: "bottom bottom",
  scrub: 1.2,
  onUpdate: (self) => {
    // ...
  },
});

// APRÈS — juste avant ScrollTrigger.create, ajouter:
const isMobile = window.matchMedia("(max-width: 767px)").matches;

const mainTrigger = ScrollTrigger.create({
  trigger: driver,
  start: "top top",
  end: "bottom bottom",
  scrub: isMobile ? 0.5 : 1.2,
  onUpdate: (self) => {
    // ...
  },
});
```

- [ ] **Step 2: Vérifier TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: pas d'erreur.

---

## Task 3 — Canvas alpha:false (optimisation GPU)

**Files:**
- Modify: `app/prestations/PrestationsPageClient.tsx` → `renderFrame()` et `resizeCanvas()`

**Problème :** Par défaut, le canvas 2D fait de la composition alpha à chaque `drawImage`. Avec `alpha: false`, le GPU sait que le canvas est toujours opaque → pas de composition → ~20-40% de gain sur mobile GPU.

**Note :** `alpha: false` doit être passé lors du **premier** appel à `getContext`. Les appels suivants ignorent les options. On doit donc s'assurer que toutes les occurrences de `canvas.getContext("2d")` passent `{ alpha: false }`.

- [ ] **Step 1: Modifier `renderFrame` — ajouter `{ alpha: false }`**

```typescript
// Dans renderFrame (ligne ~130)
// AVANT
const ctx = canvas.getContext("2d");

// APRÈS
const ctx = canvas.getContext("2d", { alpha: false });
```

- [ ] **Step 2: Modifier `resizeCanvas` — même option**

```typescript
// Dans resizeCanvas (ligne ~157)
// AVANT
const ctx = canvas.getContext("2d");
if (ctx) ctx.setTransform(d, 0, 0, d, 0, 0);

// APRÈS
const ctx = canvas.getContext("2d", { alpha: false });
if (ctx) ctx.setTransform(d, 0, 0, d, 0, 0);
```

- [ ] **Step 3: Vérifier TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -20
```

---

## Task 4 — Throttle frame loading sur mobile

**Files:**
- Modify: `app/prestations/PrestationsPageClient.tsx` → `useEffect` preload (lignes ~162-199)

**Problème :** `requestAnimationFrame(next)` charge une frame par tick rAF = 60 requêtes réseau/seconde pour les 411 frames restantes (150 à 560). Sur mobile 4G (bande passante partagée, latence élevée), cela sature la connexion et retarde le chargement des frames dont on a besoin pour le scroll actuel.

**Solution :** Espacer le chargement des frames 150+ avec `setTimeout(next, 20)` (50 req/s max) ET réduire la charge eager à 80 frames sur mobile (sections 1-2 seulement).

- [ ] **Step 1: Modifier le useEffect preload**

```typescript
// AVANT (lignes ~185-194)
// Eager : 150 premières frames (couvre sections 1 & 2)
for (let i = 0; i < Math.min(150, TOTAL_FRAMES); i++) loadOne(i);
// Stagger le reste via rAF
let idx = 150;
const next = () => {
  if (idx >= TOTAL_FRAMES) return;
  loadOne(idx++);
  requestAnimationFrame(next);
};
if (idx < TOTAL_FRAMES) requestAnimationFrame(next);

// APRÈS
const isMobileLoad = window.matchMedia("(max-width: 767px)").matches;
// Mobile : eager réduit à 80 frames (section 1 + début 2)
// Desktop : eager 150 frames (sections 1 & 2 complètes)
const eagerCount = isMobileLoad ? 80 : 150;
for (let i = 0; i < Math.min(eagerCount, TOTAL_FRAMES); i++) loadOne(i);

// Stagger le reste — setTimeout sur mobile pour ne pas saturer le réseau
let idx = eagerCount;
const next = () => {
  if (idx >= TOTAL_FRAMES) return;
  loadOne(idx++);
  if (isMobileLoad) {
    setTimeout(next, 20); // ~50 req/s max sur mobile
  } else {
    requestAnimationFrame(next);
  }
};
if (idx < TOTAL_FRAMES) {
  if (isMobileLoad) {
    setTimeout(next, 20);
  } else {
    requestAnimationFrame(next);
  }
}
```

- [ ] **Step 2: Mettre à jour le cleanup pour annuler les timeouts**

Actuellement le cleanup annule seulement le rAF. Avec setTimeout on ne peut pas annuler facilement. La solution simple : utiliser un flag `cancelled`.

```typescript
// Dans useEffect preload — ajouter avant loadOne:
let cancelled = false;

// Dans la fonction next():
const next = () => {
  if (cancelled || idx >= TOTAL_FRAMES) return;
  loadOne(idx++);
  if (isMobileLoad) {
    setTimeout(next, 20);
  } else {
    requestAnimationFrame(next);
  }
};

// Dans le return cleanup:
return () => {
  cancelled = true;
  if (rafRef.current) cancelAnimationFrame(rafRef.current);
};
```

- [ ] **Step 3: Vérifier TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -20
```

---

## Validation finale

- [ ] **Build prod**

```bash
npm run build 2>&1 | tail -20
```

Expected: `✓ Compiled successfully`

- [ ] **Test mobile Chrome DevTools**

1. Ouvrir `/prestations` dans Chrome
2. DevTools → Toggle device toolbar → iPhone 12 Pro (390×844)
3. Throttle réseau : Fast 3G
4. Scroll lentement sur la section video (500vh)
5. Vérifier : canvas suit le doigt sans lag perceptible

- [ ] **Test rotation d'écran**

1. Passer en mode paysage → portrait → paysage
2. Vérifier que l'image n'est pas floue (bug ctx.scale corrigé)
3. Vérifier que l'animation continue correctement

---

## Résumé des changements

| Task | Fichier modifié | Lignes | Impact attendu |
|------|----------------|--------|----------------|
| 1 | PrestationsPageClient.tsx | resizeCanvas ~157 | Élimine le blur post-rotation |
| 2 | PrestationsPageClient.tsx | ScrollTrigger.create ~264 | Réponse immédiate sur mobile |
| 3 | PrestationsPageClient.tsx | renderFrame ~130, resizeCanvas ~157 | +20-40% perf canvas mobile |
| 4 | PrestationsPageClient.tsx | useEffect preload ~185 | Évite saturation réseau mobile |
