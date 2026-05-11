# Maison PVL — Recapitulatif du projet

> Pret-a-porter premium homme & femme. Photographie d'abord, luxe editorial, inspiration SuitSupply + Bobbies.

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
│   ├── layout.tsx                    # Root layout, metadata, <Providers>
│   ├── page.tsx                      # Split entry Homme/Femme (zero chrome)
│   ├── not-found.tsx                 # 404
│   ├── (gendered)/                   # Route group — pages genrees
│   │   ├── layout.tsx                #   GenderedLayout wrapper
│   │   ├── homme/page.tsx            #   /homme — editorial full-bleed (3 sections)
│   │   └── femme/page.tsx            #   /femme — editorial full-bleed (3 sections)
│   ├── produit/[slug]/page.tsx       # /produit/[slug] — fiche produit
│   ├── panier/page.tsx               # /panier
│   ├── checkout/                     # /checkout (layout + page)
│   ├── commande/                     # /commande/succes, /commande/annulee
│   ├── connexion/page.tsx            # /connexion
│   ├── inscription/page.tsx          # /inscription
│   ├── mon-compte/                   # /mon-compte (layout + 6 pages)
│   │   ├── page.tsx, profil/page.tsx
│   │   ├── adresses/page.tsx
│   │   ├── favoris/page.tsx
│   │   └── commandes/page.tsx, commandes/[id]/page.tsx
│   ├── recherche/page.tsx            # /recherche
│   ├── a-propos/page.tsx             # /a-propos
│   ├── contact/page.tsx              # /contact
│   ├── cgv/page.tsx                  # /cgv
│   ├── confidentialite/page.tsx      # /confidentialite
│   ├── mentions-legales/page.tsx     # /mentions-legales
│   ├── livraison-retours/page.tsx    # /livraison-retours
│   ├── reinitialisation/page.tsx     # /reinitialisation (callback)
│   ├── reinitialisation-mot-de-passe/page.tsx
│   └── sav/                          # /sav, /sav/faq, /sav/retour
│
├── components/
│   ├── layout/
│   │   ├── Header.tsx                # Variant solid | transparent, scroll detection
│   │   ├── Footer.tsx                # 4 colonnes + newsletter + legal
│   │   └── GenderedLayout.tsx        # Header transparent + main + Footer
│   ├── home/
│   │   ├── HeroSection.tsx           # [OBSOLETE — remplace par le split]
│   │   ├── CollectionGrid.tsx
│   │   ├── EditorialBanner.tsx
│   │   └── NewArrivals.tsx
│   ├── collection/
│   │   ├── CollectionHero.tsx
│   │   ├── ProductCard.tsx
│   │   └── ProductGrid.tsx
│   ├── product/
│   │   ├── ProductDetailClient.tsx
│   │   └── RelatedProducts.tsx
│   ├── cart/
│   │   └── CartDrawer.tsx            # Slide-over panier (Framer Motion)
│   └── common/
│       ├── LanguageSwitcher.tsx      # FR/EN/ES/IT
│       ├── PageSEO.tsx
│       └── ScrollToTop.tsx
│
├── contexts/
│   ├── Providers.tsx                  # I18nInit → AuthProvider → AppShell
│   └── AuthContext.tsx               # Supabase Auth (signIn, signUp, signOut)
│
├── store/
│   ├── cartStore.ts                  # Zustand, persist localStorage
│   └── wishlistStore.ts              # Zustand, persist localStorage
│
├── lib/
│   ├── cn.ts                         # clsx + tailwind-merge
│   ├── constants.ts                  # SITE_NAME, NAV_ITEMS, COLLECTION_TABS…
│   ├── format.ts                     # formatPrice(), formatDate()
│   ├── supabase.ts                   # Client Supabase unique
│   └── stripe.ts                     # Stripe lazy-load singleton
│
├── types/
│   └── index.ts                      # Product, Collection, Order, CartItem, Address…
│
└── i18n/
    ├── config.ts                     # i18next init (4 locales, 6 namespaces)
    └── locales/{fr,en,es,it}/
        ├── common.json
        ├── home.json
        ├── product.json
        ├── account.json
        ├── sav.json
        └── cart.json
```

---

## Routes (34 pages)

| Route | Layout | Description |
|---|---|---|
| `/` | Minimal (zero chrome) | Split entry Homme/Femme |
| `/homme` | GenderedLayout (header transparent) | Editorial Homme — 3 sections full-bleed |
| `/femme` | GenderedLayout (header transparent) | Editorial Femme — 3 sections full-bleed |
| `/produit/[slug]` | Default | Fiche produit |
| `/panier` | Default | Page panier |
| `/checkout` | Checkout | Paiement Stripe |
| `/commande/succes` | Default | Confirmation commande |
| `/commande/annulee` | Default | Commande annulee |
| `/connexion` | Minimal | Connexion Supabase |
| `/inscription` | Minimal | Inscription Supabase |
| `/mon-compte` | Account layout | Dashboard compte |
| `/mon-compte/profil` | Account layout | Edition profil |
| `/mon-compte/adresses` | Account layout | Gestion adresses |
| `/mon-compte/commandes` | Account layout | Historique commandes |
| `/mon-compte/commandes/[id]` | Account layout | Detail commande |
| `/mon-compte/favoris` | Account layout | Wishlist |
| `/recherche` | Default | Recherche produits |
| `/a-propos` | Default | A propos |
| `/contact` | Default | Contact |
| `/cgv` | Default | CGV |
| `/confidentialite` | Default | Confidentialite |
| `/mentions-legales` | Default | Mentions legales |
| `/livraison-retours` | Default | Livraison & retours |
| `/sav` | Default | Service apres-vente |
| `/sav/faq` | Default | FAQ |
| `/sav/retour` | Default | Demande de retour |

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

### Utilities

| Classe | Usage |
|---|---|
| `text-pvl-kicker` | Labels uppercase (0.6875rem, tracking 0.24em) |
| `text-pvl-meta` | Metadonnees (0.6875rem, tracking 0.1em) |
| `text-pvl-price` | Prix (0.875rem, tabular-nums) |
| `text-pvl-product-name` | Nom produit (0.8125rem) |
| `text-pvl-section-title` | Titre section (clamp 1.5-2.75rem) |
| `text-pvl-hero-title` | Titre hero (clamp 2-4.5rem) |
| `text-pvl-manifesto` | Texte editorial (clamp 1.125-1.75rem) |
| `container-pvl` | Container 1440px max, padding responsive |

### Radius & Ombres

- `--radius-card: 2px` / `--radius-sm: 0`
- Ombres editoriales minimales (4-5% black)

---

## Types principaux

```typescript
Gender = 'homme' | 'femme'

Product         // id, slug, name, description, gender, price, images[], variants[], materials…
ProductImage    // id, url, alt, width, height, position
ProductVariant  // id, size, color, color_hex, sku, price, stock
Collection      // id, slug, name, description, gender, image
Category        // id, slug, name, gender
CartItem        // id, product: Product, variant: ProductVariant, quantity
Order           // id, user_id, status, items[], addresses, totals, tracking…
Address         // first_name, last_name, line1, city, postal_code, country…
Return          // id, order_id, status, items[], reason
UserProfile     // id, email, first_name, last_name, phone, avatar_url
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
- Reset password : `/reinitialisation` (callback)

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
