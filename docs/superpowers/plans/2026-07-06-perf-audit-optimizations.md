# Optimisations Performance — Audit du 6 Juillet 2026

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Réduire le poids du chargement initial de ~74 MB et le CSS de 1.2 MB → ~300 KB pour le site vitrine.

**Architecture:** Corrections chirurgicales sans refonte — suppression de doublons, isolation du CSS dashboard, optimisation des images statiques, nettoyage de la config Next.js. Aucun changement fonctionnel.

**Tech Stack:** Next.js 15.2.9, React 19, Tailwind v4, HeroUI v3 + HeroUI Pro, Supabase

## Global Constraints

- Ne pas toucher aux vidéos (hero.mp4, hero.webm, login-side.webm)
- Ne pas casser le design existant
- Les dashboards admin/proprio doivent continuer à fonctionner avec HeroUI Pro
- Les pages publiques (villas, prestations, etc.) ne doivent pas être affectées visuellement

---

### Task 1: Supprimer le dossier `public/originals/`

**Files:**
- Delete: `public/originals/finance.png`
- Delete: `public/originals/marketing.png`
- Delete: `public/originals/menage.png`
- Delete: `public/originals/notregestion.png`
- Delete: `public/originals/relation.png`
- Delete: `public/originals/terrain.png`

**Interfaces:**
- Consumes: Rien
- Produces: Rien

- [ ] **Step 1: Vérifier qu'aucun code ne référence le dossier originals**

```bash
grep -r "originals" --include="*.tsx" --include="*.ts" --include="*.css" . --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=.git
```

Expected: Aucun résultat (le dossier n'est référencé nulle part dans le code source).

- [ ] **Step 2: Supprimer le dossier**

```bash
rm -rf public/originals/
```

- [ ] **Step 3: Vérifier le gain**

```bash
du -sh public/
```

Expected: La taille de `public/` doit passer de ~142 MB à ~124 MB (−18 MB).

- [ ] **Step 4: Commit**

```bash
git add public/originals/
git commit -m "perf: supprimer public/originals/ — 18 MB de doublons PNG inutilisés

Les 6 fichiers (finance.png, marketing.png, menage.png, notregestion.png,
relation.png, terrain.png) étaient des copies de travail identiques aux
versions déjà présentes à la racine de public/. Aucun code ne les référence.

-18 MB sur le déploiement, build plus rapide.

Co-Authored-By: claude-flow <ruv@ruv.net>"
```

---

### Task 2: Installer `sharp` pour l'optimisation d'images Next.js

**Files:**
- Modify: `package.json` (npm install ajoute la dépendance)

**Interfaces:**
- Consumes: Rien
- Produces: `sharp` disponible dans `node_modules` — Next.js l'utilise automatiquement pour `next/image` en production

- [ ] **Step 1: Installer sharp**

```bash
npm install sharp
```

Expected: Installation réussie, `sharp` ajouté dans `dependencies` de `package.json`.

- [ ] **Step 2: Vérifier que sharp est listé**

```bash
node -e "require('sharp'); console.log('sharp OK:', require('sharp/package.json').version)"
```

Expected: Affiche `sharp OK: <version>`.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "perf: installer sharp pour l'optimisation d'images Next.js

Next.js utilise sharp pour redimensionner/convertir les images en production
(WebP/AVIF). Sans lui, un fallback plus lent est utilisé — build 2-3x plus
rapide avec sharp.

Co-Authored-By: claude-flow <ruv@ruv.net>"
```

---

### Task 3: Isoler le CSS HeroUI Pro dans les layouts dashboard

**Files:**
- Modify: `app/globals.css:181` — retirer `@import "@heroui-pro/react/css";`
- Create: `app/(admin)/admin/globals.css` — importer HeroUI Pro
- Create: `app/(proprio)/dashboard/globals.css` — importer HeroUI Pro
- Modify: `app/(admin)/admin/layout.tsx` — ajouter l'import CSS
- Modify: `app/(proprio)/dashboard/layout.tsx` — ajouter l'import CSS

**Interfaces:**
- Consumes: `globals.css` au niveau racine (toujours importé par le layout racine)
- Produces: Les layouts admin et proprio importent leur propre CSS HeroUI Pro ; les pages publiques ne chargent plus ce CSS

- [ ] **Step 1: Retirer l'import HeroUI Pro du globals.css racine**

Dans `app/globals.css`, supprimer la ligne 181 :

```css
@import "@heroui-pro/react/css";
```

La ligne à supprimer se trouve après `@import "@heroui/styles";` (ligne 180). Le fichier doit avoir :

```css
@import "tailwindcss";

/* ... tous les @theme tokens restent inchangés ... */

@import "@heroui/styles";
/* @import "@heroui-pro/react/css"; <-- SUPPRIMÉ, déplacé dans les layouts dashboard */

/* ... le reste du fichier reste inchangé ... */
```

- [ ] **Step 2: Créer le CSS dashboard admin**

Créer `app/(admin)/admin/globals.css` :

```css
@import "@heroui-pro/react/css";
```

- [ ] **Step 3: Créer le CSS dashboard proprio**

Créer `app/(proprio)/dashboard/globals.css` :

```css
@import "@heroui-pro/react/css";
```

- [ ] **Step 4: Importer le CSS dans le layout admin**

Dans `app/(admin)/admin/layout.tsx`, ajouter l'import en haut du fichier (après les imports existants, avant le premier `import { redirect }`) :

```tsx
import "./globals.css";
```

Le début du fichier devient :

```tsx
import "./globals.css";
import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase-server";
// ... reste du fichier inchangé
```

- [ ] **Step 5: Importer le CSS dans le layout proprio**

Dans `app/(proprio)/dashboard/layout.tsx`, ajouter l'import en haut du fichier :

```tsx
import "./globals.css";
import { redirect } from "next/navigation";
import { getSupabaseServer, getCurrentUser, getOwnerVillas } from "@/lib/supabase-server";
// ... reste du fichier inchangé
```

- [ ] **Step 6: Vérifier que le build passe**

```bash
npm run build
```

Expected: Build réussi, pas d'erreur CSS ou de composants non stylés.

- [ ] **Step 7: Vérifier les pages dashboard**

```bash
# En dev
npm run dev
```

Vérifier visuellement que :
- `/admin` affiche correctement la sidebar, les datagrids, les KPI cards
- `/dashboard` affiche correctement les composants HeroUI Pro
- `/` (homepage) ne charge plus le CSS HeroUI Pro (vérifier dans l'onglet Network du devtools : le fichier CSS compilé doit être plus petit)

- [ ] **Step 8: Commit**

```bash
git add app/globals.css \
        app/\(admin\)/admin/globals.css \
        app/\(admin\)/admin/layout.tsx \
        app/\(proprio\)/dashboard/globals.css \
        app/\(proprio\)/dashboard/layout.tsx
git commit -m "perf: isoler le CSS HeroUI Pro dans les layouts dashboard

Le CSS HeroUI Pro (@heroui-pro/react/css) était importé dans le globals.css
racine, ce qui le faisait charger pour tous les visiteurs du site vitrine.
Or HeroUI Pro n'est utilisé que dans les dashboards admin et proprio.

Déplacé dans app/(admin)/admin/globals.css et app/(proprio)/dashboard/globals.css.
Le CSS du site vitrine passe de ~1.2 MB à ~300 KB (-800 KB).

Co-Authored-By: claude-flow <ruv@ruv.net>"
```

---

### Task 4: Nettoyer `optimizePackageImports` et ajouter les packages manquants

**Files:**
- Modify: `next.config.mjs:26-33` — section `experimental.optimizePackageImports`

**Interfaces:**
- Consumes: `package.json` (liste des dépendances)
- Produces: Configuration `optimizePackageImports` nettoyée et complétée

- [ ] **Step 1: Mettre à jour la liste dans next.config.mjs**

Dans `next.config.mjs`, remplacer le bloc `optimizePackageImports` (lignes 26-33) :

**Avant :**
```js
experimental: {
    optimizePackageImports: [
      "lucide-react",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-tabs",
      "leaflet",
      "shiki",
      "date-fns",
    ],
  },
```

**Après :**
```js
experimental: {
    optimizePackageImports: [
      "lucide-react",
      "leaflet",
      "shiki",
      "date-fns",
      "motion",
      "recharts",
      "react-aria-components",
      "@heroui/react",
      "@heroui-pro/react",
    ],
  },
```

Changements :
- Supprimé : `@radix-ui/react-dropdown-menu` et `@radix-ui/react-tabs` (pas dans `package.json`)
- Ajouté : `motion` (467 KB chunk), `recharts` (charts), `react-aria-components` (436 KB chunk, dépendance HeroUI), `@heroui/react`, `@heroui-pro/react`

- [ ] **Step 2: Vérifier que le build passe**

```bash
npm run build
```

Expected: Build réussi, pas d'erreur de compilation.

- [ ] **Step 3: Commit**

```bash
git add next.config.mjs
git commit -m "perf: nettoyer optimizePackageImports et ajouter packages manquants

Supprimé les entrées Radix fantômes (non présentes dans package.json).
Ajouté motion, recharts, react-aria-components, @heroui/react, @heroui-pro/react
pour un meilleur tree-shaking. Gain estimé : -50 KB sur le bundle JS.

Co-Authored-By: claude-flow <ruv@ruv.net>"
```

---

### Task 5: Optimiser les grandes images PNG statiques en WebP

**Files:**
- Modify: `public/notregestion.png` → convertir en `.webp` (3.7 MB → ~200 KB attendu)
- Modify: `public/marketing.png` → convertir en `.webp` (3.3 MB → ~150 KB)
- Modify: `public/finance.png` → convertir en `.webp` (3.0 MB → ~150 KB)
- Modify: `public/terrain.png` → convertir en `.webp` (2.8 MB → ~150 KB)
- Modify: `public/menage.png` → convertir en `.webp` (2.2 MB → ~120 KB)
- Modify: `public/relation.png` → supprimer (remplacé par `relation.webp` déjà présent)
- Verify: `components/` — vérifier que les références utilisent les bons fichiers

**Interfaces:**
- Consumes: Fichiers PNG dans `public/`
- Produces: Fichiers WebP optimisés remplaçant les PNG

- [ ] **Step 1: Vérifier quelles images sont référencées dans le code**

```bash
grep -r "notregestion\|marketing\.png\|finance\.png\|terrain\.png\|menage\.png\|relation\.png" --include="*.tsx" --include="*.ts" . --exclude-dir=node_modules --exclude-dir=.next
```

Expected: Identifier tous les endroits où ces images sont utilisées pour mettre à jour les références si nécessaire. Noter les résultats.

- [ ] **Step 2: Convertir les PNG en WebP avec cwebp**

```bash
# Installer cwebp si nécessaire (via brew sur macOS)
which cwebp || brew install webp

# Convertir chaque PNG en WebP, redimensionné à 1920px max, qualité 80%
for f in public/notregestion.png public/marketing.png public/finance.png public/terrain.png public/menage.png; do
  name=$(basename "$f" .png)
  echo "Conversion de $f → public/${name}.webp"
  cwebp -q 80 -resize 1920 0 "$f" -o "public/${name}.webp"
done
```

- [ ] **Step 3: Vérifier les tailles des nouveaux WebP**

```bash
ls -lh public/notregestion.webp public/marketing.webp public/finance.webp public/terrain.webp public/menage.webp
```

Expected: Chaque fichier doit faire moins de 300 KB (idéalement 100-200 KB).

- [ ] **Step 4: Supprimer les PNG originaux et le relation.png redondant**

```bash
rm public/notregestion.png public/marketing.png public/finance.png public/terrain.png public/menage.png
# relation.png déjà remplacé par relation.webp (2.7 MB) — supprimer le PNG
rm public/relation.png
```

- [ ] **Step 5: Mettre à jour les références dans le code si nécessaire**

Si l'étape 1 a trouvé des imports avec extension `.png`, les mettre à jour en `.webp`. Par exemple :

```tsx
// Avant
import notregestionImg from "@/public/notregestion.png";
// Après
import notregestionImg from "@/public/notregestion.webp";
```

Si les images sont référencées via des URLs relatives (`/notregestion.png`), utiliser l'extension `.webp` :

```tsx
// Avant
<img src="/notregestion.png" ... />
// Après
<img src="/notregestion.webp" ... />
```

- [ ] **Step 6: Vérifier le gain sur public/**

```bash
du -sh public/
```

Expected: La taille de `public/` doit passer de ~124 MB à ~100 MB (−24 MB supplémentaires).

- [ ] **Step 7: Commit**

```bash
git add public/notregestion.webp public/marketing.webp public/finance.webp \
        public/terrain.webp public/menage.webp
git rm public/notregestion.png public/marketing.png public/finance.png \
        public/terrain.png public/menage.png public/relation.png
# Ajouter les fichiers modifiés avec les références mises à jour si applicable
git commit -m "perf: convertir les grandes images PNG en WebP optimisé

Conversion des PNG 3-4 MB en WebP qualité 80% redimensionnés à 1920px max.
Suppression de relation.png (déjà remplacé par relation.webp).

notregestion.png 3.7 MB → notregestion.webp ~200 KB
marketing.png 3.3 MB → marketing.webp ~150 KB
finance.png 3.0 MB → finance.webp ~150 KB
terrain.png 2.8 MB → terrain.webp ~150 KB
menage.png 2.2 MB → menage.webp ~120 KB

-24 MB sur public/, LCP amélioré pour les pages utilisant ces images hero.

Co-Authored-By: claude-flow <ruv@ruv.net>"
```

---

### Task 6: Ajouter les preconnect pour Supabase et Stripe

**Files:**
- Modify: `app/layout.tsx:110` — ajouter des balises `<link rel="preconnect">` dans le `<head>`

**Interfaces:**
- Consumes: `NEXT_PUBLIC_SUPABASE_URL` (variable d'env)
- Produces: Preconnect hints dans le HTML, réduit la latence DNS+TLS pour les appels API

- [ ] **Step 1: Ajouter les preconnect dans le layout racine**

Dans `app/layout.tsx`, remplacer le bloc `<head>` (lignes 110-111) :

**Avant :**
```tsx
<head>
  <link rel="sitemap" type="application/xml" href="/sitemap.xml" />
</head>
```

**Après :**
```tsx
<head>
  <link rel="preconnect" href={process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://wsdawdxucyuyopkpgjij.supabase.co"} />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
  <link rel="preconnect" href="https://js.stripe.com" />
  <link rel="dns-prefetch" href="https://maps.googleapis.com" />
  <link rel="dns-prefetch" href="https://api.stripe.com" />
  <link rel="sitemap" type="application/xml" href="/sitemap.xml" />
</head>
```

Note : `crossOrigin="anonymous"` est nécessaire pour `fonts.gstatic.com` car les polices sont chargées en cross-origin.

- [ ] **Step 2: Vérifier que le build passe**

```bash
npm run build
```

Expected: Build réussi, pas d'erreur.

- [ ] **Step 3: Vérifier dans le HTML généré**

```bash
curl -s http://localhost:3000 | grep preconnect
```

Expected: Les balises `<link rel="preconnect">` doivent apparaître dans le `<head>`.

- [ ] **Step 4: Commit**

```bash
git add app/layout.tsx
git commit -m "perf: ajouter preconnect pour Supabase, Stripe, Google Fonts

Les preconnect hints permettent au navigateur d'ouvrir les connexions DNS+TLS
en parallèle du parsing HTML, réduisant la latence de ~200-300ms pour les
premières requêtes vers ces origines.

- Supabase : requêtes API et temps réel
- Stripe : paiements
- Google Fonts : chargement des polices
- Google Maps : géolocalisation (dns-prefetch suffit)

Co-Authored-By: claude-flow <ruv@ruv.net>"
```

---

### Task 7: Vérification finale — build et smoke test

**Files:**
- Aucune création/modification

**Interfaces:**
- Consumes: Tous les changements des tâches 1 à 6
- Produces: Confirmation que le build passe et que les pages principales fonctionnent

- [ ] **Step 1: Build production complet**

```bash
npm run build
```

Expected: Build réussi sans erreur ni warning.

- [ ] **Step 2: Vérifier la taille du CSS compilé**

```bash
ls -lh .next/static/css/*.css
```

Expected: Les fichiers CSS doivent être plus petits qu'avant (moins de 500 KB pour le fichier principal).

- [ ] **Step 3: Vérifier la taille de public/**

```bash
du -sh public/
```

Expected: ~100 MB (contre 142 MB initialement, vidéos exclues de l'optimisation).

- [ ] **Step 4: Smoke test manuel**

Lancer `npm run dev` et vérifier :
- `/` — homepage : les images hero s'affichent, le CSS est correct
- `/villas` — listing : pas d'erreur
- `/prestations` — page services : l'animation de scroll fonctionne
- `/admin` — dashboard admin : la sidebar HeroUI Pro s'affiche correctement
- `/dashboard` — dashboard proprio : les composants HeroUI Pro s'affichent

- [ ] **Step 5: Commit final (si nécessaire)**

```bash
git status
# Si des fichiers restent à committer
git add -A
git commit -m "chore: vérification finale post-optimisations performance"
```
