# Maison PVL — Recapitulatif du projet

> Pret-a-porter premium homme & femme. Photographie d'abord, luxe editorial, inspiration SuitSupply + Bobbies.
> Mis a jour : 2026-05-12 — Session soir : integration 9 photos reelles + fix Supabase lazy

---

## Stack technique

| Categorie | Technologie |
|---|---|
| Framework | Next.js 16 (App Router) + React 19.2 |
| Langage | TypeScript 5 (strict) |
| CSS | Tailwind CSS v4 + `@tailwindcss/postcss` |
| UI Library | HeroUI v3 (`@heroui/react` ^3.0.4) |
| State | Zustand v5 (cart + wishlist, persistes localStorage) |
| Forms | react-hook-form v7 + zod v4 |
| Animations | Framer Motion v12 |
| Icons | Lucide React v1 |
| i18n | i18next v26 — 4 langues (fr, en, es, it), 6 namespaces |
| Backend | Supabase (auth, DB) + Stripe (paiements) |
| Utilitaires | clsx, tailwind-merge, tailwind-variants |

---

## Arborescence `src/`

```
src/
├── app/
│   ├── layout.tsx                    # Root layout, metadata, skip-link, font preloads
│   ├── page.tsx                      # Split entry Homme/Femme — CSS-only, zero animation
│   ├── not-found.tsx                 # 404
│   ├── (gendered)/
│   │   ├── homme/
│   │   │   ├── page.tsx              # 6 sections photo (Hero → ImagePair → Banner → ImagePair → Banner → NewArrivals)
│   │   │   ├── nouveautes/page.tsx    # CollectionHero + ProductGrid
│   │   │   ├── essentiels/page.tsx    # CollectionHero + ProductGrid
│   │   │   └── silhouettes/page.tsx   # CollectionHero + ProductGrid
│   │   └── femme/
│   │       ├── page.tsx              # 6 sections photo (Hero → ImagePair → Banner → ImagePair → Banner → NewArrivals)
│   │       ├── nouveautes/page.tsx, essentiels/page.tsx, silhouettes/page.tsx
│   ├── produit/[slug]/page.tsx       # Fiche produit (breadcrumb, grille tailles, accordeons, ShopTheLook, YouMayLike)
│   ├── checkout/
│   ├── commande/succes, commande/annulee
│   ├── connexion/page.tsx, inscription/page.tsx
│   ├── mon-compte/ (6 pages)
│   ├── recherche/page.tsx
│   ├── a-propos, contact, cgv, confidentialite, mentions-legales
│   ├── livraison-retours/page.tsx
│   ├── reinitialisation/page.tsx, reinitialisation-mot-de-passe/page.tsx
│   └── sav/ (sav, faq, retour)
│
├── components/
│   ├── layout/
│   │   ├── Header.tsx                # 1 rangee 56px, logo centre, hamburger gauche, icones 44×44
│   │   └── Footer.tsx                # 3 colonnes, fond transparent, sans newsletter
│   ├── home/
│   │   ├── ImagePair.tsx             # [NOUVEAU] 2 photos full-bleed cote-a-cote, 100vh desktop
│   │   ├── CollectionGrid.tsx        # Zero overlay, zero "EXPLORER", H2 titres
│   │   ├── EditorialBanner.tsx       # Full-bleed photo 70vh + texte superpose
│   │   └── NewArrivals.tsx           # Carrousel horizontal produits
│   ├── collection/
│   │   ├── CollectionHero.tsx        # Full-bleed, texte en bas a gauche
│   │   ├── ProductCard.tsx           # Ratio 4:5, zero overlay, zero badge
│   │   └── ProductGrid.tsx           # Grille 2-4 colonnes, filtres par categorie
│   ├── product/
│   │   ├── ProductDetailClient.tsx   # Layout 58/42, breadcrumb, grille tailles boutons, accordeons, trust signals
│   │   ├── ShopTheLook.tsx           # [NOUVEAU] Drawer "Porter le look" avec 3 articles
│   │   ├── YouMayLike.tsx            # [NOUVEAU] Carrousel "Vous aimerez peut-etre" 12 produits
│   │   └── RelatedProducts.tsx       # [OBSOLETE — remplace par YouMayLike]
│   ├── cart/
│   │   └── CartDrawer.tsx            # Slide-over panier
│   └── common/
│       ├── LanguageSwitcher.tsx      # Dropdown compact "FR ⌄" avec ChevronDown
│       ├── PageSEO.tsx
│       └── ScrollToTop.tsx
│
├── contexts/
│   ├── Providers.tsx                 # I18nInit → AuthProvider → AppShell (main#main-content)
│   └── AuthContext.tsx
│
├── store/
│   ├── cartStore.ts
│   └── wishlistStore.ts
│
├── lib/
│   ├── cn.ts, constants.ts, format.ts, supabase.ts, stripe.ts
│
├── types/
│   └── index.ts
│
└── i18n/
    ├── config.ts
    └── locales/{fr,en,es,it}/
        ├── common.json, home.json, product.json, account.json, sav.json, cart.json
```

---

## Routes (34 pages)

Voir ci-dessus pour arborescence detaillee.

---

## Design System (`globals.css`)

### Couleurs (OKLCH)

| Token | Valeur | Usage |
|---|---|---|
| `--color-pvl-black` | `oklch(7% 0.003 60)` | Texte principal |
| `--color-pvl-charcoal` | `oklch(15% 0.005 60)` | Footer, surfaces sombres |
| `--color-pvl-slate` | `oklch(35% 0.005 60)` | Texte secondaire |
| `--color-pvl-stone` | `oklch(62% 0.008 60)` | Texte tertiaire |
| `--color-pvl-cream` | `oklch(97% 0.005 80)` | Fond editorial |
| `--color-pvl-white` | `oklch(100% 0 0)` | Fond principal |
| `--color-pvl-warm` | `oklch(99% 0.002 60)` | Fond chaud |
| `--color-pvl-gold` | `oklch(65% 0.07 85)` | Accent metallique froid (~5% usage) |
| `--color-pvl-gold-dim` | `oklch(50% 0.06 85)` | Accent discret |
| `--color-pvl-success` | `oklch(55% 0.14 150)` | Confirmation |
| `--color-pvl-warning` | `oklch(65% 0.12 80)` | Attention |
| `--color-pvl-error` | `oklch(50% 0.18 25)` | Erreur |

### Typographie

| Role | Police | Poids |
|---|---|---|
| Display | **Rufina** (Google Fonts) | 400, 700 |
| Body | **Karla** (Google Fonts) | 300, 400, 500, 600 |

### Radius & Ombres

- `--radius-card: 2px` / `--radius-sm: 0`
- Ombres editoriales minimales (4-5% black)

---

## Types principaux

```typescript
Gender = 'homme' | 'femme'
Product, ProductImage, ProductVariant, Collection, Category
CartItem, Order, Address, Return, UserProfile
```

---

## Stores Zustand

### Cart (`maison-pvl-cart`)
- `items: CartItem[]`
- Actions: `addItem`, `removeItem`, `updateQuantity`, `clearCart`, `toggleCart`
- Derives: `itemCount()`, `subtotal()`

### Wishlist (`maison-pvl-wishlist`)
- `items: Product[]`
- Actions: `addItem`, `removeItem`, `isInWishlist`, `toggleItem`, `clearWishlist`

---

## Auth (Supabase)

- `AuthContext` expose : `{ user, loading, signIn, signUp, signOut, resetPassword }`
- `useAuth()` hook dans tous les composants client
- Routes protegees : `/mon-compte/*`

---

## i18n (4 langues)

- **Langues** : `fr` (defaut), `en`, `es`, `it`
- **Detection** : path → localStorage → navigator
- **Devise** : `EUR`
- **Namespaces** : `common`, `home`, `product`, `account`, `sav`, `cart`

---

## Principes de design

1. **La photo est l'interface** — full-bleed, zero carte, zero ombre
2. **Typographie qui coupe** — Rufina hairline, sauts d'echelle dramatiques
3. **Or comme metal, pas comme chaleur** — laiton poli, ~5% de presence
4. **Confiance francaise** — labels editoriaux, pas de points d'exclamation
5. **Service par retenue** — politiques integrees discretement, jamais de popup

---

## Journal des modifications (2026-05-11)

### Session refonte header + layout + recommandations

**Comparatif Suitsupply vs PVL (mesures Playwright) :**

| Metrique | Suitsupply | Avant | Apres |
|----------|-----------|-------|-------|
| Header hauteur | 52px | 125px | **56px** |
| Header rows | 1 | 2 | **1** |
| Header padding | 15px | 48px | **15px** |
| Container padding | 0px | 48px | **0px** (images) |
| Hero padding | 0px | 72px | **0px** |
| Section gaps | 0px | 0px | 0px |
| Sections photo | 5 | 3 | **6** |
| Hauteur page | 5175px | 2238px | **4668px** |
| Product ratio | 4:5 | 3:4 | **4:5** |
| Langue | dropdown | 4 boutons | **dropdown** |

**Fichiers modifies (18) :**

| Fichier | Changement |
|---------|-----------|
| `Header.tsx` | 1 rangee 56px, hamburger gauche, logo centre "PVL", icones 44×44px, nav overlay plein ecran |
| `Footer.tsx` | 3 colonnes, fond transparent, sans newsletter, padding 4vw |
| `LanguageSwitcher.tsx` | Dropdown compact "FR ⌄" au lieu de 4 boutons |
| `CollectionGrid.tsx` | Zero overlay noir, zero "EXPLORER", titres H2 avec drop-shadow |
| `EditorialBanner.tsx` | Full-bleed photo 70vh, texte superpose, plus de split 60/40 crame |
| `CollectionHero.tsx` | Full-bleed, texte en bas a gauche, bg-black/20 |
| `ProductCard.tsx` | Ratio 3:4 → 4:5 |
| `ImagePair.tsx` | **[NOUVEAU]** 2 photos full-bleed cote-a-cote, 100vh desktop, 50vh mobile |
| `ShopTheLook.tsx` | **[NOUVEAU]** Drawer "Porter le look" avec 3 articles + total + CTA |
| `YouMayLike.tsx` | **[NOUVEAU]** Carrousel 12 produits "Vous aimerez peut-etre", full-width |
| `ProductDetailClient.tsx` | Integration ShopTheLook + YouMayLike |
| `page.tsx` (entry) | CSS-only, pas de Framer Motion, overlay reduit 10%→5% |
| `homme/page.tsx` | 6 sections photo : Hero → ImagePair → Banner → ImagePair → Banner → NewArrivals |
| `femme/page.tsx` | 6 sections photo : Hero → ImagePair → Banner → ImagePair → Banner → NewArrivals |
| `layout.tsx` | Skip-link "Aller au contenu" + font preloads |
| `Providers.tsx` | pt-[56px] pour nouveau header |
| `product.json` ×4 | Cle `you-may-like` ajoutee (fr/en/es/it) |

**Audit score :** 13/20 → ~17/20

---

## Journal des modifications (2026-05-12)

### Session CartDrawer Bobbies-style + fiche produit polish + audit taste-skill

**Recherche Playwright — Bobbies & Suitsupply :**
- Bobbies : grille tailles boutons, couleur = URL distincte, conseil pointure inline, drawer panier
- Suitsupply : breadcrumb, accordeons details, "Choisir la taille" comme CTA primaire, livraison offerte pres du bouton
- Pattern commun : drawer > page panier, tailles en grille (pas dropdown), accordeons, trust signals

**Audit taste-skill (DESIGN_VARIANCE=8, MOTION_INTENSITY=6, VISUAL_DENSITY=4) :**
- Score initial : 22/32 (Bon)
- Points forts : typo Rufina+Karla, OKLCH tokens, pas d'Inter, pas d'emojis, 2px radius
- P1 corriges : `h-screen` → `h-[dvh]`, `&rarr;` → ArrowRight, icones 18→20px, empty state NewArrivals

**CartDrawer Bobbies-style (7 commits) :**
| Commit | Description |
|--------|-------------|
| `9c08e2a` | Suppression page `/panier` — drawer devient l'experience unique |
| `60b1d45` | CartDrawer complet : photos produits 96×128, controles quantite, footer resume |
| `5b97f6e` | Fix a11y : Escape handler, role=dialog, aria-labels distincts |
| `2bed797` | Fix liens `/panier` → openCart() dans checkout + commande/annulee |
| `4fa6a4a` | ProductDetailClient : breadcrumb, grille tailles boutons, accordeons, trust signals |
| `4edc585` | Fix i18n `livraison-offerte` dans common.json (fr/en/es/it), breadcrumb HTML valide |
| `697d48b` | Fix `h-[dvh]` explicite pour sections avec images `fill` (entry, heros, banners) |

**Fichiers modifies/crees :**
- `CartDrawer.tsx` — rewrite complet Bobbies-style
- `ProductDetailClient.tsx` — +breadcrumb, +grille tailles, +accordeons, +trust signals
- `page.tsx` (entry) — `h-screen` → `h-[100dvh]`
- `femme/page.tsx` + `homme/page.tsx` — `h-screen` → `h-[100dvh]`
- `EditorialBanner.tsx` — `h-[70vh]` → `h-[70dvh]`, `&rarr;` → `<ArrowRight>`
- `CollectionHero.tsx` — `h-[60vh]` → `h-[60dvh]`
- `ImagePair.tsx` — `h-[50vh]/h-[100vh]` → `h-[50dvh]/h-[100dvh]`
- `Header.tsx` — icones 18px → 20px
- `NewArrivals.tsx` — empty state "Nouveautes a venir"
- `checkout/page.tsx` — lien `/panier` → `openCart()`
- `commande/annulee/page.tsx` — lien `/panier` → `/`
- `common.json` ×4 — cle `cart.livraison-offerte` ajoutee
- `panier/page.tsx` — **supprime**

**Note technique — `dvh` vs `min-h` :**
Les sections avec `next/image fill` (position: absolute) necessitent une hauteur explicite sur le parent. `min-h` ne l'etablit pas → les images font 0px. Solution : `h-[100dvh]` (hauteur explicite + dynamic viewport pour iOS Safari).

**Build :** 0 erreurs, lint propre (1 warning preexistant dans Header.tsx)

---

## Journal des modifications (2026-05-12 — soir)

### Session integration photos reelles + fix Supabase lazy

**Fix Supabase :**
- `supabase.ts` : client passe en lazy init (`getSupabase()`) pour ne plus crasher au build sans `.env.local`
- `AuthContext.tsx` : pattern `noopAuth()` qui retourne `null` si Supabase non configure — `useEffect`, `signIn/Up/Out`, `resetPassword` geres
- Le site demarre sans variables d'environnement (images Unsplash + placeholder products)

**Integration 9 photos reelles :**
- Source : `MAISON PVL PHOTOS/` — 9 PNGs generes par IA
- 4 landscape 16:9 (1672×941) → heros + bannieres
- 5 portrait 4:5 (1122×1402) → splits + produits

**Mapping photos → pages :**

| Fichier | Page | Emplacement |
|---|---|---|
| `entry-homme.png` | `/` | Split Homme |
| `entry-femme.png` | `/` | Split Femme |
| `hero-homme.png` | `/homme` | Hero full-bleed |
| `hero-femme.png` | `/femme` | Hero full-bleed |
| `banner-savoir-faire.png` | `/homme` | EditorialBanner SAVOIR-FAIRE |
| `banner-artisanat.png` | `/femme` | EditorialBanner ARTISANAT |
| `prod-homme-01.png` | `/homme` | Costume Napoli (Nouveautes) |
| `prod-femme-01.png` | `/femme` | Tailleur Parisienne (Nouveautes) |
| `prod-femme-bikini.png` | `/femme` | Robe Capri (Nouveautes) |

**Fichiers modifies (5) :**
- `src/lib/supabase.ts` — lazy init + `getSupabase()` export
- `src/contexts/AuthContext.tsx` — `noopAuth()` pattern, toutes les methodes securisees
- `src/app/page.tsx` — SPLIT_IMAGES Unsplash → `/images/photos/entry-*.png`
- `src/app/(gendered)/homme/page.tsx` — hero, banner, 1 produit
- `src/app/(gendered)/femme/page.tsx` — hero, banner, 2 produits

**Photos restantes :** 6 sections ImagePair + 2 EditorialBanners + 8 produits gardent leurs placeholders Unsplash (en attente de plus de photos).

**Dev server :** port 3001 (`npx next dev -p 3001`). `.env.local` non requis pour le dev.

---

## Variables d'environnement requises

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
NEXT_PUBLIC_SITE_URL=https://maisonpvl.com
```

---

## Commandes

```bash
npm run dev      # Dev server (localhost:3000)
npm run build    # Build production
npm start        # Start production
npm run lint     # ESLint
```
