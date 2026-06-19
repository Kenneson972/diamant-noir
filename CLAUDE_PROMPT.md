# 🔧 Kayvila — Audit Frontend Complet → Prompt Claude

**Généré par Élise (Hermes) le 18 Juin 2026**
**5 sous-agents, ~80 problèmes documentés**
**Site : kayvila.vercel.app | Repo : `/opt/data/repos/diamant-noir`**

---

## ⚠️ CRITIQUE — NE PAS REDESIGNER

Le design actuel est validé et intentionnel. C'est un **luxe strict minimaliste** (angles droits, navy/or, espacement généreux, typographie sobre).

Tu fais du **POLISH et des CORRECTIONS**, PAS un redesign.

Si un élément n'est pas listé explicitement dans ce document, **ne le change pas**.

---

## 📊 Synthèse globale

| Domaine | P0 | P1 | P2 | Total |
|---------|----|----|-----|-------|
| Performance (images/vidéos) | 3 | 6 | 5 | 14 |
| Design System (radius/boutons/formulaires) | 2 | 7 | 4 | 13 |
| SEO (metadata/canonicals) | 6 | 5 | 7 | 18 |
| UX/A11y (i18n/cookie/a11y) | 4 | 9 | 7 | 20 |
| Micro-interactions (animations) | 2 | 1 | 2 | 5 |
| **TOTAL** | **17** | **28** | **25** | **70** |

---

## Phase 1 — P0 BLOQUANTS : Performance & Images

**Contexte :** La homepage charge ~45 MB d'images non compressées et de vidéos. Le LCP est désastreux sur mobile.

### P0-1 : Convertir PNG → WebP/AVIF (6 fichiers, ~15 MB → ~300 KB)
- `public/notregestion.png` (3.9 MB) → convertir WebP qualité 80
- `public/marketing.png` (3.4 MB)
- `public/relation.png` (3.2 MB)
- `public/terrain.png` (2.9 MB)
- `public/finance.png` (3.1 MB)
- `public/menage.png` (2.3 MB)
- **Composants impactés :** `HomeServicesSection.tsx`, `HomeOwnersSection.tsx`, `HomeFeaturedAudience.tsx`, `PageHero.tsx`
- **Fix :** `npx sharp-cli --input public/marketing.png --output public/marketing.webp --format webp --quality 80` (pour chaque)
- **Puis :** remplacer les imports `.png` → `.webp` dans les composants

### P0-2 : Réencoder hero.webm (11 MB → 2 MB)
- **Fichier :** `public/hero.webm`
- **Composant :** `components/home/HeroBackgroundMedia.tsx`
- **Fix :**
  1. Réencoder en 720p CRF 30-35 → ~2-3 MB max
  2. Ajouter `<source>` H.264/MP4 en fallback (iOS Safari)
  3. Ajouter `fetchpriority="low"` sur la vidéo
  4. Ne pas charger la vidéo sur mobile (`media="(min-width: 768px)"`)

### P0-3 : Réduire frames vidéo scroll (29 MB → 5 MB)
- **Fichiers :** `public/frames/frame_*.webp` (561 fichiers) + `public/frames-mobile/frame_*.webp` (561 fichiers)
- **Composant :** `components/prestations/VideoScrollHero.tsx`
- **Fix :**
  1. 1 frame toutes les 2 = 280 frames au lieu de 561
  2. Qualité WebP 50-60
  3. Option long-terme : remplacer par `<video>` avec `preload="none"` + IntersectionObserver

---

## Phase 2 — P0 BLOQUANTS : Design System (Radius)

**Contexte :** Le site a une identité "angles droits" (46 occurrences de `rounded-none`) mais des composants clés y dérogent.

### P0-4 : `Button` n'a pas de `rounded-none`
- **Fichier :** `components/ui/button.tsx:23`
- **Fix :** Ajouter `rounded-none` dans les classes du composant Button

### P0-5 : `KayvilaPressableButton` a `rounded-xl` au lieu de `rounded-none`
- **Fichier :** `components/ui/pro/kayvila-pressable-button.tsx:14`
- **Fix :** Changer `rounded-xl` → `rounded-none` (ou documenter que les CTAs gold sont la seule exception)

---

## Phase 3 — P0 BLOQUANTS : SEO & Metadata

### P0-6 : `og:url` absent sur TOUTES les pages
- **Fichier :** `app/layout.tsx` (metadata global)
- **Fix :** Ajouter `openGraph: { url: 'https://kayvila.com' }` dans le metadata de layout + le rendre dynamique par page

### P0-7 : `og:type` absent sur 12/17 pages publiques
- **Fix :** Par défaut `og:type: 'website'` dans layout, override `'article'` sur blog, `'product'` sur fiches villa

### P0-8 : Canonicals pointent vers `diamant-noir.vercel.app` (6 pages)
- **Fichiers concernés :** pages avec `metadata.alternates.canonical` pointant vers l'ancien domaine
- **Fix :** Remplacer par `https://kayvila.com` + vérifier toutes les pages

### P0-9 : Canonical manquant sur `/mentions-legales` et `/cgv`
- **Fix :** Ajouter `metadata: { alternates: { canonical: 'https://kayvila.com/mentions-legales' } }`

### P0-10 : Image héro homepage avec `alt=""` (vide)
- **Fichier :** composant hero homepage
- **Fix :** Ajouter un alt descriptif (ex: "Villa de luxe avec piscine en Martinique — Kayvila")

### P0-11 : Domaine incohérent sitemap (kayvila.com) vs canoniques (diamant-noir.vercel.app)
- **Fix :** Tout uniformiser sur `https://kayvila.com`

---

## Phase 4 — P1 IMPORTANT : UX & Accessibilité

### P1-1 : 9 clés `checkout.*` absentes en espagnol
- **Fichier :** `lib/i18n.ts`
- **Fix :** Ajouter toutes les clés `checkout.*` dans l'objet `es`

### P1-2 : Contraste WCAG AA en échec — `text-navy/60` sur fond offwhite
- **Ratio :** ~2.8:1 (minimum requis 4.5:1)
- **Fichiers globaux :** Toute l'interface utilise cette combinaison
- **Fix :** Passer de `text-navy/60` à `text-navy/80` (ratio ~5.2:1)

### P1-3 : Bannière cookie consent 100% hardcodée FR
- **Fichier :** composant cookie consent
- **Fix :** i18niser toutes les strings (titre, description, boutons, lien politique cookies)

### P1-4 : Aucun blocage réel des cookies
- **Problème :** Le consentement est stocké en localStorage mais n'empêche aucun script
- **Fix :** Bloquer effectivement les scripts tiers (Stripe, analytics) tant que le consentement n'est pas donné

### P1-5 : Pages `/cookies`, footer (10+ chaînes), pages d'erreur — hardcodés FR
- **Fix :** i18niser tous les textes statiques restants

### P1-6 : URLs `/en` et `/es` redirigent vers `/login`
- **Fichier :** `middleware.ts` → `publicPaths`
- **Fix :** Ajouter `/en` et `/es` (avec toutes les routes) dans `publicPaths`

### P1-7 : Cookie consent sans lien vers la politique cookies
- **Fix :** Ajouter `<Link href="/cookies">Politique cookies</Link>` dans la bannière

### P1-8 : Pas de règle `:focus-visible` globale
- **Fix :** Ajouter dans `globals.css` : `*:focus-visible { outline: 2px solid #d4af37; outline-offset: 2px; }`

### P1-9 : Contact form n'utilise pas `<Input>` — styles dupliqués
- **Fichier :** `app/contact/page.tsx:90-130`
- **Fix :** Remplacer les inputs inline par `<Input>`, `<Textarea>`

---

## Phase 5 — P1 IMPORTANT : Design System

### P1-10 : Tokens couleur morts (5 tokens définis, jamais utilisés)
- **Tokens :** `--color-cream`, `--color-champagne`, `--color-sand`, `--color-navy-900`, `--color-navy-800`
- **Fichier :** `app/globals.css:4-13`
- **Fix :** Supprimer les tokens inutilisés OU les intégrer dans le design

### P1-11 : `--color-navy` = `#0a0a0a` (noir) ≠ navy
- **Fix :** Renommer `--color-navy` → `--color-ink` et utiliser `--color-navy-900` (#0b1d2e) pour le vrai navy

### P1-12 : Composants manquants : Radio, Toggle, Toast, FormLabel
- **À créer :**
  - `components/ui/radio.tsx` (sur le modèle de Checkbox)
  - `components/ui/toggle.tsx` (wrapper HeroUI Switch)
  - `components/ui/toast.tsx` (réutilisable, avec position fixe)
  - `components/ui/label.tsx` (FormLabel standardisé)

### P1-13 : Pas d'état erreur sur Input/Select/Textarea
- **Fichiers :** `components/ui/input.tsx`, `Select.tsx`, `Textarea.tsx`
- **Fix :** Ajouter `error?: boolean` + classe conditionnelle `border-red-500` + message d'erreur

### P1-14 : VillaListingCard — HoverCard (rounded-xl) vs carte (rounded-none)
- **Fichier :** `components/villas/VillaListingCard.tsx:126,189`
- **Fix :** Uniformiser en `rounded-none`

### P1-15 : Dashboard vs Public — deux paradigmes de radius
- **Public :** `rounded-none`, **Dashboard :** `rounded-xl`
- **Action :** Documenter que c'est intentionnel ou uniformiser

### P1-16 : `Sora` chargé inutilement sur pages publiques
- **Fichier :** `app/layout.tsx:16`
- **Fix :** Charger Sora uniquement dans le layout dashboard

---

## Phase 6 — P1 PERFORMANCE

### P1-17 : Pages sans ISR — SSR à chaque requête
- **Fichiers :** `app/faq/page.tsx`, `app/contact/page.tsx`, `app/cookies/page.tsx`, `app/confidentialite/page.tsx`, `app/soumettre-ma-villa/page.tsx`
- **Fix :** Ajouter `export const revalidate = 86400;` (24h) sur FAQ, cookies, confidentialité

### P1-18 : `<img>` natif (avec eslint-disable) au lieu de `next/image`
- **Fichier :** `components/marketing/VillaSubmissionForm.tsx:274`
- **Fix :** Remplacer par `<Image>` avec `fill`, `sizes`, `className`

### P1-19 : `Image fill` sans `sizes` sur avatar VillaReviews
- **Fichier :** `components/VillaReviews.tsx:52`
- **Fix :** Ajouter `sizes="32px"`

### P1-20 : `login-side.webm` = 4.5 MB
- **Fix :** Réencoder plus petit, charger en lazy

### P1-21 : Pas de `loading.tsx` sur 6 pages
- **Pages :** FAQ, contact, cookies, confidentialité, soumettre-ma-villa, prestations
- **Fix :** Ajouter `loading.tsx` avec skeleton minimal

### P1-22 : `villa-hero.jpg` = 7.8 KB — trop basse qualité en poster
- **Fix :** Utiliser une image de ~60-100 KB en WebP

---

## Phase 7 — P2 MICRO-INTERACTIONS (Polish Luxe)

### P2-1 : Parallax héroïque subtil (recommandé ⭐)
- **Principe :** La vidéo de fond translate très légèrement (2-4px) dans le sens inverse du scroll
- **Fichier :** `components/home/HeroBackgroundMedia.tsx`
- **Fix :** `useEffect` → `transform: translateY(${scrollY * 0.06}px)` sur la vidéo

### P2-2 : Border glow dorée sur cartes villa (recommandé ⭐)
- **Fichier :** `components/villas/VillaListingCard.tsx`
- **Fix CSS :**
```css
.villa-card-luxe:hover {
  border-color: rgba(212, 175, 55, 0.6);
  box-shadow: 0 0 0 1px rgba(212, 175, 55, 0.15), 0 8px 32px rgba(0, 0, 0, 0.06);
}
```

---

## Phase 8 — P2 OPTIMISATIONS

### SEO
- `<meta robots>` absent sur 9 pages publiques → ajouter
- Sitemap incomplet (manque 8+ URLs dont fiches villa)
- JSON-LD LocalBusiness absent de `/prestations`
- JSON-LD type `Product` → préférer `LodgingBusiness` sur fiches villa
- Doublon `| Kayvila` dans le title `/prestations`

### Performance
- `prefetch={false}` sur liens footer
- Lazy-load `react-pdf` et `shiki` (chargement conditionnel)
- Pas de `loading="lazy"` sur `VillaCoverImage`
- Tailles de police `text-[10px]` difficilement lisibles sur mobile

### Design
- Boutons inline dupliquent Button → utiliser `<Button>`
- Line-height non standardisé sur headings → token `--leading-heading`
- Tailles d'icônes non documentées → standardiser nav=20, inline=16

---

## ⛔ CE QU'ON NE TOUCHE PAS

- **Stripe Connect** — flux de paiement, webhooks, checkout
- **Auth flow** — login, middleware Supabase, RLS, reset mdp
- **Dashboard admin** — widgets Kayvila, DataGrid HeroUI Pro, revenus
- **API routes** — toutes les routes `/api/*`
- **Palette globale** — gold (#D4AF37), navy, offwhite (tokens principaux)
- **Typo globale** — Instrument Sans + Playfair Display (sauf corrections ciblées)
- **Layout général** — header, footer, grille max-w-7xl
- **Composants structurels** — Navbar, Footer, Hero structure de base
- **Fichiers intacts** (liste blanche) : `src/lib/site.ts`, tous les fichiers dashboard admin/, tous les fichiers API routes/

---

## 📋 Règles globales

1. `npm run build` doit passer
2. Commits atomiques en français — un commit par phase
3. Mobile-first — tout doit fonctionner sur mobile
4. Pas casser l'existant — si un fix risque de casser autre chose, le signaler
5. Priorité P0 > P1 > P2 — les P0 d'abord
