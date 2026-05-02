# Gamme Product Detail + Stripe Checkout — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter des pages de détail par produit gamme avec sélecteur de quantité, intégrer ces produits au panier existant, et câbler un checkout Stripe via Supabase Edge Function avec validation Zod.

**Architecture:** Sous-projet 1 (T1–T11) : slug DB + page détail + panier unifié. Sous-projet 2 (T12–T16) : Edge Function Stripe + hook useCheckout + CartDrawer Commander + pages confirmation. Le panier Zustand unifie boissons bar (`source: 'bar'`) et produits gamme (`source: 'gamme'`) dans la même interface.

**Tech Stack:** React 18 + TypeScript + Vite · Supabase (PostgreSQL + Edge Functions Deno) · Stripe Checkout · Zod 3 · Zustand · HeroUI v3 · Framer Motion · React Router v6

**Spec :** `docs/superpowers/specs/2026-05-02-gamme-product-detail-stripe-design.md`

---

## File Structure

| Fichier | Action |
|---------|--------|
| `supabase/migrations/20260502130000_add_slug_gamme_products.sql` | Créer |
| `src/types/database.ts` | Modifier — slug dans gamme_products |
| `src/store/cartStore.ts` | Modifier — source dans CartLine |
| `src/pages/DrinkDetail.tsx` | Modifier — source: 'bar' dans addLine |
| `src/components/home/HomeProductCarousel.tsx` | Modifier — source: 'bar' dans addLine |
| `src/lib/toSlug.ts` | Créer |
| `src/lib/checkoutSchema.ts` | Créer |
| `src/hooks/useGammeProduct.ts` | Créer |
| `src/pages/GammeProductDetail.tsx` | Créer |
| `src/pages/RangeDetail.tsx` | Modifier — lien vers page détail |
| `src/pages/NosProduits.tsx` | Modifier — lien vers page détail |
| `src/pages/admin/AdminGammes.tsx` | Modifier — champ slug |
| `src/App.tsx` | Modifier — routes produit + commande |
| `supabase/functions/create-checkout-session/index.ts` | Créer |
| `src/hooks/useCheckout.ts` | Créer |
| `src/components/cart/CartDrawer.tsx` | Modifier — badges source + bouton Commander |
| `src/pages/commande/CommandeSucces.tsx` | Créer |
| `src/pages/commande/CommandeAnnulee.tsx` | Créer |

---

## Task 1 — Migration : slug sur gamme_products

**Files:**
- Create: `supabase/migrations/20260502130000_add_slug_gamme_products.sql`

- [ ] **Créer la migration**

```sql
-- supabase/migrations/20260502130000_add_slug_gamme_products.sql

ALTER TABLE public.gamme_products
  ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- Slugs pour les 36 produits existants (nom → slug)
UPDATE public.gamme_products SET slug = 'formula-1-950g'            WHERE name = 'Formula 1 950g';
UPDATE public.gamme_products SET slug = 'creatine'                  WHERE name = 'Créatine';
UPDATE public.gamme_products SET slug = 'rebuild-whey'              WHERE name = 'Rebuild Whey';
UPDATE public.gamme_products SET slug = 'gel-prolong'               WHERE name = 'Gel Prolong';
UPDATE public.gamme_products SET slug = 'electrolytes-cr7-boite'    WHERE name = 'Electrolytes CR7 Boîte';
UPDATE public.gamme_products SET slug = 'electrolytes-sachet-x10'   WHERE name = 'Electrolytes Sachet x10';
UPDATE public.gamme_products SET slug = 'omega-3'                   WHERE name = 'Omega 3';
UPDATE public.gamme_products SET slug = 'hydrate'                   WHERE name = 'Hydrate';
UPDATE public.gamme_products SET slug = 'protein-drink-pdm'         WHERE name = 'Protein Drink PDM';
UPDATE public.gamme_products SET slug = 'liftoff-pamplemousse'      WHERE name = 'LiftOff Pamplemousse';
UPDATE public.gamme_products SET slug = 'liftoff-citron'            WHERE name = 'LiftOff Citron';
UPDATE public.gamme_products SET slug = 'chips-bbq-onions-x10'      WHERE name = 'Chips BBQ Onions x10';
UPDATE public.gamme_products SET slug = 'barre-sport-x6'            WHERE name = 'Barre Sport x6';
UPDATE public.gamme_products SET slug = 'barre-cereales-x7'         WHERE name = 'Barre Céréales x7';
UPDATE public.gamme_products SET slug = 'barres-collations-x14'     WHERE name = 'Barres Collations x14';
UPDATE public.gamme_products SET slug = 'gel-nettoyant-resurface'   WHERE name = 'Gel Nettoyant Resurface';
UPDATE public.gamme_products SET slug = 'gommage'                   WHERE name = 'Gommage';
UPDATE public.gamme_products SET slug = 'lotion-tonique-revitalisant' WHERE name = 'Lotion Tonique Revitalisant';
UPDATE public.gamme_products SET slug = 'masque-d-argile'           WHERE name = 'Masque d''Argile';
UPDATE public.gamme_products SET slug = 'exfoliant'                 WHERE name = 'Exfoliant';
UPDATE public.gamme_products SET slug = 'creme-hydratante-fps-30'   WHERE name = 'Crème Hydratante FPS 30';
UPDATE public.gamme_products SET slug = 'creme-hydrant-eclat'       WHERE name = 'Crème Hydrant Éclat';
UPDATE public.gamme_products SET slug = 'lotion-nourrissante'       WHERE name = 'Lotion Nourrissante';
UPDATE public.gamme_products SET slug = 'gel-contour-yeux'          WHERE name = 'Gel Contour Yeux';
UPDATE public.gamme_products SET slug = 'creme-hydrant-yeux'        WHERE name = 'Crème Hydrant Yeux';
UPDATE public.gamme_products SET slug = 'creme-contour-yeux'        WHERE name = 'Crème Contour Yeux';
UPDATE public.gamme_products SET slug = 'serum-rides'               WHERE name = 'Sérum Rides';
UPDATE public.gamme_products SET slug = 'serum-niacinamide-10'      WHERE name = 'Sérum Niacinamide 10%';
UPDATE public.gamme_products SET slug = 'creme-tension-ultime'      WHERE name = 'Crème Tension Ultime';
UPDATE public.gamme_products SET slug = 'creme-de-nuit'             WHERE name = 'Crème de Nuit';
UPDATE public.gamme_products SET slug = 'aloe-vera'                 WHERE name = 'Aloe Vera';
UPDATE public.gamme_products SET slug = 'collagene'                 WHERE name = 'Collagène';
UPDATE public.gamme_products SET slug = 'the-detox'                 WHERE name = 'Thé Detox';
UPDATE public.gamme_products SET slug = 'fibres'                    WHERE name = 'Fibres';
UPDATE public.gamme_products SET slug = 'complex-vitamine'          WHERE name = 'Complex Vitamine';
UPDATE public.gamme_products SET slug = 'mineral-complex'           WHERE name = 'Minéral Complex';
```

- [ ] **Appliquer la migration**

```bash
cd "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/PESSORA"
/opt/homebrew/bin/supabase db push
```

Expected : `Remote database is up to date` ou confirmation de la migration appliquée.

- [ ] **Vérifier en DB**

```bash
/opt/homebrew/bin/supabase db execute --query "SELECT name, slug FROM gamme_products ORDER BY gamme, sort_order LIMIT 10;"
```

Expected : 10 lignes avec slug non-null.

- [ ] **Commit**

```bash
git add supabase/migrations/20260502130000_add_slug_gamme_products.sql
git commit -m "feat(db): add slug column to gamme_products + seed 36 slugs"
```

---

## Task 2 — database.ts + lib/toSlug.ts

**Files:**
- Modify: `src/types/database.ts`
- Create: `src/lib/toSlug.ts`

- [ ] **Ajouter slug à database.ts**

Dans `src/types/database.ts`, section `gamme_products`, ajouter `slug` dans Row, Insert, Update :

```typescript
gamme_products: {
  Row: {
    id: string
    gamme: 'sport' | 'skin' | 'wellness'
    subcategory: string | null
    name: string
    description: string | null
    price: number
    price_alt: number | null
    image_url: string | null
    sort_order: number
    active: boolean
    slug: string | null   // ← nouveau
    created_at: string
  }
  Insert: Omit<Database['public']['Tables']['gamme_products']['Row'], 'id' | 'created_at'>
  Update: Partial<Omit<Database['public']['Tables']['gamme_products']['Row'], 'id' | 'created_at'>>
  Relationships: []
}
```

- [ ] **Créer src/lib/toSlug.ts**

```typescript
export function toSlug(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}
```

- [ ] **Vérifier le type**

```bash
cd "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/PESSORA"
npx tsc --noEmit
```

Expected : 0 erreurs.

- [ ] **Commit**

```bash
git add src/types/database.ts src/lib/toSlug.ts
git commit -m "feat(types): add slug to GammeProduct + toSlug util"
```

---

## Task 3 — CartLine : champ source + mise à jour addLine existants

**Files:**
- Modify: `src/store/cartStore.ts`
- Modify: `src/pages/DrinkDetail.tsx`
- Modify: `src/components/home/HomeProductCarousel.tsx`

- [ ] **Ajouter source à CartLine dans cartStore.ts**

Remplacer l'interface `CartLine` (lignes 5-15) par :

```typescript
export interface CartLine {
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  category: string;
  optionsKey: string;
  optionLabels: string[];
  image?: string;
  source: 'bar' | 'gamme';
}
```

- [ ] **Mettre à jour DrinkDetail.tsx**

Dans `src/pages/DrinkDetail.tsx`, dans `handleAddToCart` (vers ligne 114), ajouter `source: 'bar'` à l'objet passé à `addLine` :

```typescript
addLine({
  productId: drink.id,
  name: drink.name,
  unitPrice,
  quantity,
  category: drink.category,
  optionsKey,
  optionLabels,
  image: drink.icon,
  source: 'bar',   // ← ajout
});
```

- [ ] **Mettre à jour HomeProductCarousel.tsx**

Dans `src/components/home/HomeProductCarousel.tsx`, dans `quickAddToCart` (vers ligne 51), ajouter `source: 'bar'` :

```typescript
addLine({
  productId: item.id,
  name: item.name,
  unitPrice,
  quantity: 1,
  category: item.category,
  optionsKey,
  optionLabels,
  image: item.icon,
  source: 'bar',   // ← ajout
});
```

- [ ] **Vérifier TypeScript**

```bash
npx tsc --noEmit
```

Expected : 0 erreurs.

- [ ] **Commit**

```bash
git add src/store/cartStore.ts src/pages/DrinkDetail.tsx src/components/home/HomeProductCarousel.tsx
git commit -m "feat(cart): add source field to CartLine (bar | gamme)"
```

---

## Task 4 — Zod schemas : src/lib/checkoutSchema.ts

**Files:**
- Create: `src/lib/checkoutSchema.ts`

- [ ] **Créer le fichier**

```typescript
// src/lib/checkoutSchema.ts
import { z } from 'zod';

export const CartLineSchema = z.object({
  productId: z.string().min(1),
  name: z.string().min(1),
  unitPrice: z.number().positive(),
  quantity: z.number().int().min(1).max(10),
  category: z.string(),
  optionsKey: z.string(),
  optionLabels: z.array(z.string()),
  image: z.string().optional(),
  source: z.enum(['bar', 'gamme']),
});

export const CheckoutRequestSchema = z.object({
  items: z.array(CartLineSchema).min(1),
  user_id: z.string().uuid(),
});

export type CartLinePayload = z.infer<typeof CartLineSchema>;
export type CheckoutRequest = z.infer<typeof CheckoutRequestSchema>;
```

- [ ] **Vérifier TypeScript**

```bash
npx tsc --noEmit
```

Expected : 0 erreurs.

- [ ] **Commit**

```bash
git add src/lib/checkoutSchema.ts
git commit -m "feat(checkout): add Zod schemas for cart line + checkout request"
```

---

## Task 5 — Hook useGammeProduct

**Files:**
- Create: `src/hooks/useGammeProduct.ts`

- [ ] **Créer le hook**

```typescript
// src/hooks/useGammeProduct.ts
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { GammeProduct } from '../types/database';

export function useGammeProduct(gamme: string, slug: string) {
  const [product, setProduct] = useState<GammeProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setNotFound(false);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('gamme_products')
      .select('*')
      .eq('gamme', gamme)
      .eq('slug', slug)
      .eq('active', true)
      .single()
      .then(({ data, error }: { data: GammeProduct | null; error: { message: string; code?: string } | null }) => {
        if (cancelled) return;
        if (error || !data) {
          setNotFound(true);
          setProduct(null);
        } else {
          setProduct(data);
        }
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [gamme, slug]);

  return { product, loading, notFound };
}
```

- [ ] **Vérifier TypeScript**

```bash
npx tsc --noEmit
```

Expected : 0 erreurs.

- [ ] **Commit**

```bash
git add src/hooks/useGammeProduct.ts
git commit -m "feat(hooks): add useGammeProduct — fetch by gamme + slug"
```

---

## Task 6 — Page GammeProductDetail

**Files:**
- Create: `src/pages/GammeProductDetail.tsx`

- [ ] **Créer la page**

```typescript
// src/pages/GammeProductDetail.tsx
import { useState } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Skeleton } from '@heroui/react';
import { ArrowLeft, ShoppingBag } from 'lucide-react';
import { PageShell } from '../components/layout/PageShell';
import { useGammeProduct } from '../hooks/useGammeProduct';
import { useCart } from '../store/cartStore';
import { useFadeUpWhenVisible } from '../lib/motionReveal';

const GAMME_LABELS: Record<string, string> = {
  sport: 'Sport',
  skin: 'Skin',
  wellness: 'Wellness',
};

function ProductDetailSkeleton() {
  return (
    <PageShell className="py-8 md:py-12">
      <div className="flex flex-col gap-10 md:flex-row md:gap-16">
        <Skeleton className="aspect-[3/4] w-full max-w-sm rounded-[2px] bg-noir/[0.06]" />
        <div className="flex-1 space-y-4 pt-4">
          <Skeleton className="h-3 w-24 rounded bg-noir/[0.04]" />
          <Skeleton className="h-8 w-2/3 rounded bg-noir/[0.06]" />
          <Skeleton className="h-4 w-full rounded bg-noir/[0.04]" />
          <Skeleton className="h-4 w-3/4 rounded bg-noir/[0.04]" />
          <Skeleton className="mt-6 h-10 w-32 rounded-full bg-noir/[0.05]" />
          <Skeleton className="h-12 w-full rounded-full bg-noir/[0.08]" />
        </div>
      </div>
    </PageShell>
  );
}

const GammeProductDetail = () => {
  const { gamme = '', slug = '' } = useParams<{ gamme: string; slug: string }>();
  const { product, loading, notFound } = useGammeProduct(gamme, slug);
  const addLine = useCart((s) => s.addLine);
  const openCart = useCart((s) => s.openCart);
  const [qty, setQty] = useState(1);
  const [justAdded, setJustAdded] = useState(false);
  const fadeIn = useFadeUpWhenVisible();

  if (notFound) return <Navigate to="/nos-produits" replace />;

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="border-b border-noir/[0.06] py-4">
          <PageShell>
            <Skeleton className="h-3 w-28 rounded bg-noir/[0.04]" />
          </PageShell>
        </div>
        <ProductDetailSkeleton />
      </div>
    );
  }

  if (!product) return <Navigate to="/nos-produits" replace />;

  const handleAddToCart = () => {
    addLine({
      productId: product.id,
      name: product.name,
      unitPrice: product.price,
      quantity: qty,
      category: gamme,
      optionsKey: product.id,
      optionLabels: product.price_alt ? [`${product.price}€ / ${product.price_alt}€`] : [],
      image: product.image_url ?? undefined,
      source: 'gamme',
    });
    openCart();
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 2000);
  };

  const totalPrice = product.price * qty;

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumb */}
      <div className="border-b border-noir/[0.06]">
        <PageShell className="py-4">
          <Link
            to={`/nos-produits/${gamme}`}
            className="inline-flex items-center gap-2 text-[10px] font-normal uppercase tracking-[0.12em] text-black/45 transition-colors hover:text-black"
          >
            <ArrowLeft size={13} strokeWidth={1.5} aria-hidden />
            Gamme {GAMME_LABELS[gamme] ?? gamme}
          </Link>
        </PageShell>
      </div>

      {/* Split layout */}
      <PageShell className="py-10 md:py-16">
        <motion.div className="flex flex-col gap-10 md:flex-row md:items-start md:gap-16" {...fadeIn}>
          {/* Image */}
          <div className="aspect-[3/4] w-full max-w-sm shrink-0 overflow-hidden rounded-[2px] bg-surface-product-well md:sticky md:top-28">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="h-full w-full object-cover"
                loading="eager"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <span className="font-display text-8xl text-black/[0.06]">
                  {product.name.charAt(0)}
                </span>
              </div>
            )}
          </div>

          {/* Infos */}
          <div className="flex flex-1 flex-col gap-6">
            <div>
              <p className="mb-3 text-[10px] font-normal uppercase tracking-[0.18em] text-black/40">
                Collection {GAMME_LABELS[gamme] ?? gamme}
              </p>
              <h1
                className="mb-3 font-display font-normal tracking-[-0.02em] text-black"
                style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px, 3.5vw, 40px)' }}
              >
                {product.name}
              </h1>
              {product.description && (
                <p
                  className="font-display text-[16px] font-light italic leading-relaxed text-black/55"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  « {product.description} »
                </p>
              )}
            </div>

            {/* Prix */}
            <div>
              {product.price_alt ? (
                <div>
                  <span
                    className="font-display text-[28px] font-light text-black"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    {product.price}€
                  </span>
                  <span className="ml-2 text-[14px] text-black/40">/ {product.price_alt}€</span>
                  <p className="mt-1 text-[10px] text-black/35">petit format / grand format</p>
                </div>
              ) : (
                <span
                  className="font-display text-[28px] font-light text-black"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {product.price}€
                </span>
              )}
            </div>

            {/* Sélecteur quantité */}
            <div>
              <p className="mb-2 text-[9px] font-normal uppercase tracking-[0.18em] text-black/40">
                Quantité
              </p>
              <div className="inline-flex items-center rounded-full border border-noir/[0.12]">
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="flex h-10 w-10 items-center justify-center text-black/60 transition-colors hover:text-black"
                  aria-label="Diminuer"
                >
                  <span className="text-lg leading-none">−</span>
                </button>
                <span className="w-8 text-center text-[14px] text-black">{qty}</span>
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.min(10, q + 1))}
                  className="flex h-10 w-10 items-center justify-center text-black/60 transition-colors hover:text-black"
                  aria-label="Augmenter"
                >
                  <span className="text-lg leading-none">+</span>
                </button>
              </div>
            </div>

            {/* CTA */}
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={handleAddToCart}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-noir text-[10px] font-normal uppercase tracking-[0.14em] text-white transition-colors hover:bg-anthracite"
              >
                {justAdded ? (
                  'Ajouté ✓'
                ) : (
                  <>
                    <ShoppingBag size={14} strokeWidth={1.25} aria-hidden />
                    Ajouter au panier · {totalPrice}€
                  </>
                )}
              </button>
              <p className="text-center text-[9px] tracking-[0.1em] text-black/30">
                Retrait en boutique · Paiement sécurisé
              </p>
            </div>
          </div>
        </motion.div>
      </PageShell>
    </div>
  );
};

export default GammeProductDetail;
```

- [ ] **Vérifier TypeScript**

```bash
npx tsc --noEmit
```

Expected : 0 erreurs.

- [ ] **Commit**

```bash
git add src/pages/GammeProductDetail.tsx
git commit -m "feat(pages): add GammeProductDetail — split layout + quantity selector"
```

---

## Task 7 — RangeDetail + NosProduits : liens vers page détail

**Files:**
- Modify: `src/pages/RangeDetail.tsx`
- Modify: `src/pages/NosProduits.tsx`

- [ ] **RangeDetail.tsx — bouton Renseignements → Link**

Dans `src/pages/RangeDetail.tsx`, ajouter `Link` à l'import React Router (ligne 1) :

```typescript
import { useParams, Navigate, Link } from 'react-router-dom';
```

Remplacer le `<Button>` "Renseignements" (vers ligne 177-184) par :

```tsx
<Link
  to={`/nos-produits/${rangeId}/${product.slug ?? product.id}`}
  className="flex w-full items-center justify-center gap-2 rounded-full bg-noir py-3 text-[10px] font-normal uppercase tracking-[0.12em] text-white transition-colors hover:bg-anthracite"
>
  Voir le produit <ShoppingBag size={14} strokeWidth={1.25} aria-hidden />
</Link>
```

Retirer l'import `Button` si `Card`, `CardContent`, `Skeleton` sont les seuls imports encore utilisés (laisser si d'autres usages existent).

- [ ] **NosProduits.tsx — liens produits vers page détail**

Dans `src/pages/NosProduits.tsx`, remplacer le `<Link to={...}>` autour du produit (vers ligne 67-75). Le `to` actuel est `/nos-produits/${range.id}`, le remplacer en passant le slug via `productsData` (les produits statiques n'ont pas de slug — pointer vers la page gamme) :

```tsx
<Link
  to={`/nos-produits/${range.id}`}
  className="group block"
>
```

Note : `NosProduits.tsx` utilise `rangesData` (données statiques sans slug). Les liens restent vers la page gamme `/nos-produits/:gamme`. Seul `RangeDetail.tsx` (qui a les données Supabase avec slug) lie vers les pages détail.

- [ ] **Vérifier TypeScript**

```bash
npx tsc --noEmit
```

Expected : 0 erreurs.

- [ ] **Commit**

```bash
git add src/pages/RangeDetail.tsx src/pages/NosProduits.tsx
git commit -m "feat(gammes): link product cards to detail page in RangeDetail"
```

---

## Task 8 — AdminGammes : champ slug

**Files:**
- Modify: `src/pages/admin/AdminGammes.tsx`

- [ ] **Ajouter slug à EMPTY_FORM**

```typescript
const EMPTY_FORM = {
  name: '',
  description: '',
  price: '',
  price_alt: '',
  image_url: '',
  sort_order: '',
  slug: '',         // ← nouveau
};
type GammeFormState = typeof EMPTY_FORM;
```

- [ ] **Ajouter slug à productToGammeForm**

```typescript
function productToGammeForm(p: GammeProduct): GammeFormState {
  return {
    name: p.name,
    description: p.description ?? '',
    price: String(p.price),
    price_alt: p.price_alt != null ? String(p.price_alt) : '',
    image_url: p.image_url ?? '',
    sort_order: String(p.sort_order),
    slug: p.slug ?? '',    // ← nouveau
  };
}
```

- [ ] **Ajouter slug dans GammeProductForm — auto-rempli depuis le nom**

En haut du composant `GammeProductForm`, ajouter l'import de `toSlug` :

```typescript
import { toSlug } from '../../lib/toSlug';
```

Dans le handler onChange du champ Nom, auto-générer le slug si le champ slug est vide :

```typescript
const handleNameChange = (value: string) => {
  set('name', value);
  if (!form.slug) {
    set('slug', toSlug(value));
  }
};
```

Remplacer `onChange={(e) => set('name', e.target.value)}` sur le champ Nom par `onChange={(e) => handleNameChange(e.target.value)}`.

Ajouter le champ slug dans le formulaire, après le champ Ordre d'affichage :

```tsx
<div className="md:col-span-2">
  <label className="mb-1.5 block text-[9px] uppercase tracking-[0.2em] text-black/35">
    Slug <span className="normal-case text-black/25">— URL du produit (auto-généré)</span>
  </label>
  <input
    className={inputClass}
    value={form.slug}
    onChange={(e) => set('slug', e.target.value)}
    placeholder="formula-1-950g"
  />
</div>
```

- [ ] **Ajouter slug dans buildPayload**

```typescript
const buildPayload = (form: GammeFormState) => ({
  gamme: selectedGamme,
  subcategory: selectedSubcategory,
  name: form.name.trim(),
  description: form.description.trim() || null,
  price: Number(form.price),
  price_alt: form.price_alt ? Number(form.price_alt) : null,
  image_url: form.image_url.trim() || null,
  sort_order: form.sort_order ? parseInt(form.sort_order, 10) : 0,
  active: true,
  slug: form.slug.trim() || null,   // ← nouveau
});
```

- [ ] **Vérifier TypeScript**

```bash
npx tsc --noEmit
```

Expected : 0 erreurs.

- [ ] **Commit**

```bash
git add src/pages/admin/AdminGammes.tsx
git commit -m "feat(admin): add slug field to AdminGammes form with auto-generation"
```

---

## Task 9 — App.tsx : route GammeProductDetail

**Files:**
- Modify: `src/App.tsx`

- [ ] **Ajouter le lazy import**

Dans `src/App.tsx`, après `const RangeDetail = lazy(...)` (ligne 24) :

```typescript
const GammeProductDetail = lazy(() => import('./pages/GammeProductDetail'));
```

- [ ] **Ajouter la route**

Après `<Route path="/nos-produits/:rangeId" element={<RangeDetail />} />` :

```tsx
<Route path="/nos-produits/:gamme/:slug" element={<GammeProductDetail />} />
```

- [ ] **Vérifier TypeScript**

```bash
npx tsc --noEmit
```

Expected : 0 erreurs.

- [ ] **Test rapide navigateur**

Lancer `npm run dev`, aller sur `http://localhost:5173/nos-produits/sport/formula-1-950g`.

Expected : page détail du Formula 1 950g avec image placeholder, description, prix 65€, sélecteur quantité.

- [ ] **Commit**

```bash
git add src/App.tsx
git commit -m "feat(routing): add /nos-produits/:gamme/:slug route"
```

---

## Task 10 — Edge Function : create-checkout-session

**Files:**
- Create: `supabase/functions/create-checkout-session/index.ts`

- [ ] **Créer le répertoire et le fichier**

```bash
mkdir -p "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/PESSORA/supabase/functions/create-checkout-session"
```

- [ ] **Créer l'Edge Function**

```typescript
// supabase/functions/create-checkout-session/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'npm:stripe@14';
import { z } from 'npm:zod@3';

const CartLineSchema = z.object({
  productId: z.string().min(1),
  name: z.string().min(1),
  unitPrice: z.number().positive(),
  quantity: z.number().int().min(1).max(10),
  category: z.string(),
  optionsKey: z.string(),
  optionLabels: z.array(z.string()),
  image: z.string().optional(),
  source: z.enum(['bar', 'gamme']),
});

const CheckoutRequestSchema = z.object({
  items: z.array(CartLineSchema).min(1),
  user_id: z.string().uuid(),
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    const siteUrl = Deno.env.get('SITE_URL') ?? 'http://localhost:5173';
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!stripeKey) {
      return new Response(JSON.stringify({ error: 'STRIPE_SECRET_KEY non configurée' }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Auth : récupérer l'utilisateur depuis le JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Non authentifié' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Token invalide' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validation Zod
    const body = await req.json();
    const parsed = CheckoutRequestSchema.safeParse(body);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: 'Payload invalide', details: parsed.error.flatten() }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { items, user_id } = parsed.data;
    if (user_id !== user.id) {
      return new Response(JSON.stringify({ error: 'user_id ne correspond pas' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const total = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);

    // Créer order en DB
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({ user_id, total, status: 'pending' })
      .select('id')
      .single();

    if (orderError || !order) {
      throw new Error('Impossible de créer la commande : ' + orderError?.message);
    }

    // Créer order_items
    const orderItems = items.map((item) => ({
      order_id: order.id,
      product_id: item.source === 'gamme' ? item.productId : null,
      product_name: item.name,
      quantity: item.quantity,
      price_at_time: item.unitPrice,
    }));
    await supabase.from('order_items').insert(orderItems);

    // Récupérer email du profil
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', user_id)
      .single();

    // Créer Stripe Checkout Session
    const stripe = new Stripe(stripeKey, { apiVersion: '2024-04-10' });

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: profile?.email ?? user.email,
      line_items: items.map((item) => ({
        price_data: {
          currency: 'eur',
          product_data: { name: item.name },
          unit_amount: Math.round(item.unitPrice * 100),
        },
        quantity: item.quantity,
      })),
      success_url: `${siteUrl}/commande/succes?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/commande/annulee`,
      metadata: { order_id: order.id },
    });

    // Sauvegarder stripe_session_id sur l'order
    await supabase
      .from('orders')
      .update({ stripe_session_id: session.id })
      .eq('id', order.id);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[create-checkout-session]', err);
    return new Response(JSON.stringify({ error: 'Erreur serveur' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
```

- [ ] **Déployer la fonction**

```bash
cd "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/PESSORA"
/opt/homebrew/bin/supabase functions deploy create-checkout-session
```

Note : La fonction retournera 503 si `STRIPE_SECRET_KEY` n'est pas configurée — comportement attendu tant que Stripe n'est pas connecté.

- [ ] **Commit**

```bash
git add supabase/functions/create-checkout-session/index.ts
git commit -m "feat(edge): add create-checkout-session Stripe Edge Function"
```

---

## Task 11 — Hook useCheckout

**Files:**
- Create: `src/hooks/useCheckout.ts`

- [ ] **Créer le hook**

```typescript
// src/hooks/useCheckout.ts
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import type { CartLine } from '../store/cartStore';

export function useCheckout() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  const startCheckout = async (items: CartLine[]) => {
    if (!user) {
      navigate('/connexion');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Session expirée');

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout-session`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            items: items.map((i) => ({
              productId: i.productId,
              name: i.name,
              unitPrice: i.unitPrice,
              quantity: i.quantity,
              category: i.category,
              optionsKey: i.optionsKey,
              optionLabels: i.optionLabels,
              image: i.image,
              source: i.source,
            })),
            user_id: user.id,
          }),
        }
      );

      const json = await res.json();
      if (!res.ok || !json.url) {
        throw new Error(json.error ?? 'Erreur lors de la création du checkout');
      }

      window.location.href = json.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      setLoading(false);
    }
  };

  return { startCheckout, loading, error };
}
```

- [ ] **Vérifier TypeScript**

```bash
npx tsc --noEmit
```

Expected : 0 erreurs.

- [ ] **Commit**

```bash
git add src/hooks/useCheckout.ts
git commit -m "feat(hooks): add useCheckout — calls Edge Function + redirects to Stripe"
```

---

## Task 12 — CartDrawer : badges source + bouton Commander

**Files:**
- Modify: `src/components/cart/CartDrawer.tsx`

- [ ] **Ajouter l'import useCheckout**

En haut de `src/components/cart/CartDrawer.tsx`, ajouter :

```typescript
import { useCheckout } from '../../hooks/useCheckout';
```

- [ ] **Ajouter le hook dans le composant CartDrawer**

Après les hooks existants (ligne ~26) :

```typescript
const { startCheckout, loading: checkoutLoading, error: checkoutError } = useCheckout();
const hasGammeItems = items.some((i) => i.source === 'gamme');
```

- [ ] **Ajouter badge source sur chaque ligne**

Dans le rendu d'un `<li>` (après le nom du produit, vers ligne 93-95) :

```tsx
<p className="mt-0.5 text-[9px] uppercase tracking-[0.14em] text-black/35">
  {categoryNames[line.category as MenuItem['category']] ?? line.category}
  {' · '}
  <span className={line.source === 'gamme' ? 'text-black/50' : 'text-black/30'}>
    {line.source === 'gamme' ? 'Boutique' : 'Bar'}
  </span>
</p>
```

- [ ] **Remplacer le footer du CartDrawer**

Remplacer le bloc `<Sheet.Footer>` entier (lignes ~172-217) par :

```tsx
{items.length > 0 && (
  <Sheet.Footer className="flex flex-col border-t border-noir/[0.06] bg-white px-5 py-5 md:px-6">
    <div className="mb-5 flex items-baseline justify-between gap-4">
      <span className="text-[9px] font-normal uppercase tracking-[0.18em] text-black/45">
        Total estimatif
      </span>
      <span className="text-[18px] font-light tabular-nums tracking-tight text-black">
        {formatEurFr(total)}
      </span>
    </div>

    {hasGammeItems ? (
      <p className="mb-4 text-[10px] font-light leading-relaxed text-black/40">
        Votre panier contient des produits boutique. Règlement en ligne via Stripe.
      </p>
    ) : (
      <p className="mb-4 text-[10px] font-light leading-relaxed text-black/40">
        Règlement sur place au bar. Ce total est indicatif.
      </p>
    )}

    {checkoutError && (
      <p className="mb-3 text-[10px] text-red-500/80">{checkoutError}</p>
    )}

    <div className="flex flex-col gap-2">
      {hasGammeItems ? (
        <button
          type="button"
          onClick={() => startCheckout(items)}
          disabled={checkoutLoading}
          className={cn(
            focusRing,
            'flex h-12 min-h-12 w-full items-center justify-center rounded-full bg-noir text-[10px] font-normal uppercase tracking-[0.12em] text-white transition-colors hover:bg-anthracite disabled:opacity-50',
          )}
        >
          {checkoutLoading ? 'Redirection…' : 'Commander — Payer en ligne'}
        </button>
      ) : (
        <Link
          to="/contact"
          onClick={closeCart}
          className={cn(
            focusRing,
            'flex h-12 min-h-12 w-full items-center justify-center rounded-full bg-noir text-[10px] font-normal uppercase tracking-[0.12em] text-white transition-colors hover:bg-anthracite',
          )}
        >
          Préparer ma venue
        </Link>
      )}
      <a
        href={telHref}
        className={cn(
          focusRing,
          'rounded-full py-3 text-center text-[10px] font-normal uppercase tracking-[0.14em] text-black/55 transition-colors hover:text-black',
        )}
      >
        Appeler le bar
      </a>
      <button
        type="button"
        className={cn(
          focusRing,
          'rounded-full py-2 text-center text-[9px] uppercase tracking-[0.14em] text-black/35 hover:text-black/55',
        )}
        onClick={() => clearCart()}
      >
        Vider le panier
      </button>
    </div>
  </Sheet.Footer>
)}
```

- [ ] **Vérifier TypeScript**

```bash
npx tsc --noEmit
```

Expected : 0 erreurs.

- [ ] **Commit**

```bash
git add src/components/cart/CartDrawer.tsx
git commit -m "feat(cart): add source badges + Commander button with Stripe redirect"
```

---

## Task 13 — Pages commande + routes App.tsx

**Files:**
- Create: `src/pages/commande/CommandeSucces.tsx`
- Create: `src/pages/commande/CommandeAnnulee.tsx`
- Modify: `src/App.tsx`

- [ ] **Créer CommandeSucces.tsx**

```tsx
// src/pages/commande/CommandeSucces.tsx
import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { PageShell } from '../../components/layout/PageShell';
import { useCart } from '../../store/cartStore';

const CommandeSucces = () => {
  const [params] = useSearchParams();
  const sessionId = params.get('session_id');
  const clearCart = useCart((s) => s.clearCart);

  useEffect(() => {
    clearCart();
  }, [clearCart]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <PageShell>
        <div className="mx-auto max-w-md py-20 text-center">
          <CheckCircle size={48} strokeWidth={1} className="mx-auto mb-6 text-black/30" aria-hidden />
          <p className="text-editorial-tagline mb-2">Commande confirmée</p>
          <h1
            className="mb-4 font-display font-normal tracking-[-0.02em] text-black"
            style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(24px, 3vw, 32px)' }}
          >
            Merci pour votre commande
          </h1>
          <p className="mb-8 text-[13px] font-light leading-relaxed text-black/50">
            Votre paiement a été accepté. Vous recevrez un email de confirmation.
            {sessionId && (
              <span className="block mt-2 text-[11px] text-black/30">Réf. {sessionId.slice(-8).toUpperCase()}</span>
            )}
          </p>
          <div className="flex flex-col items-center gap-3">
            <Link
              to="/mon-espace/historique"
              className="inline-flex h-11 items-center rounded-full bg-noir px-8 text-[10px] font-normal uppercase tracking-[0.14em] text-white transition-colors hover:bg-anthracite"
            >
              Voir mes commandes
            </Link>
            <Link
              to="/nos-produits"
              className="text-[10px] uppercase tracking-[0.12em] text-black/40 transition-colors hover:text-black"
            >
              Continuer mes achats
            </Link>
          </div>
        </div>
      </PageShell>
    </div>
  );
};

export default CommandeSucces;
```

- [ ] **Créer CommandeAnnulee.tsx**

```tsx
// src/pages/commande/CommandeAnnulee.tsx
import { Link } from 'react-router-dom';
import { XCircle } from 'lucide-react';
import { PageShell } from '../../components/layout/PageShell';
import { useCart } from '../../store/cartStore';

const CommandeAnnulee = () => {
  const openCart = useCart((s) => s.openCart);

  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <PageShell>
        <div className="mx-auto max-w-md py-20 text-center">
          <XCircle size={48} strokeWidth={1} className="mx-auto mb-6 text-black/20" aria-hidden />
          <p className="text-editorial-tagline mb-2">Paiement annulé</p>
          <h1
            className="mb-4 font-display font-normal tracking-[-0.02em] text-black"
            style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(24px, 3vw, 32px)' }}
          >
            Votre commande n'a pas été finalisée
          </h1>
          <p className="mb-8 text-[13px] font-light leading-relaxed text-black/50">
            Aucun montant n'a été débité. Votre panier est toujours disponible.
          </p>
          <div className="flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={openCart}
              className="inline-flex h-11 items-center rounded-full bg-noir px-8 text-[10px] font-normal uppercase tracking-[0.14em] text-white transition-colors hover:bg-anthracite"
            >
              Retourner au panier
            </button>
            <Link
              to="/nos-produits"
              className="text-[10px] uppercase tracking-[0.12em] text-black/40 transition-colors hover:text-black"
            >
              Continuer mes achats
            </Link>
          </div>
        </div>
      </PageShell>
    </div>
  );
};

export default CommandeAnnulee;
```

- [ ] **Créer le répertoire et vérifier**

```bash
mkdir -p "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/PESSORA/src/pages/commande"
```

- [ ] **Ajouter les routes dans App.tsx**

Après `const NotFound = lazy(...)` (vers ligne 53), ajouter :

```typescript
const CommandeSucces = lazy(() => import('./pages/commande/CommandeSucces'));
const CommandeAnnulee = lazy(() => import('./pages/commande/CommandeAnnulee'));
```

Dans les routes (avant `<Route path="*" ...>`), ajouter :

```tsx
<Route path="/commande/succes" element={<CommandeSucces />} />
<Route path="/commande/annulee" element={<CommandeAnnulee />} />
```

- [ ] **Vérifier TypeScript**

```bash
npx tsc --noEmit
```

Expected : 0 erreurs.

- [ ] **Test rapide navigateur**

- `http://localhost:5173/commande/succes` → page avec CheckCircle, "Commande confirmée"
- `http://localhost:5173/commande/annulee` → page avec XCircle, bouton "Retourner au panier"

- [ ] **Commit final**

```bash
git add src/pages/commande/CommandeSucces.tsx src/pages/commande/CommandeAnnulee.tsx src/App.tsx
git commit -m "feat(commande): add success + cancel pages + routes"
```

---

## Récapitulatif des commits attendus

```
feat(db): add slug column to gamme_products + seed 36 slugs
feat(types): add slug to GammeProduct + toSlug util
feat(cart): add source field to CartLine (bar | gamme)
feat(checkout): add Zod schemas for cart line + checkout request
feat(hooks): add useGammeProduct — fetch by gamme + slug
feat(pages): add GammeProductDetail — split layout + quantity selector
feat(gammes): link product cards to detail page in RangeDetail
feat(admin): add slug field to AdminGammes form with auto-generation
feat(routing): add /nos-produits/:gamme/:slug route
feat(edge): add create-checkout-session Stripe Edge Function
feat(hooks): add useCheckout — calls Edge Function + redirects to Stripe
feat(cart): add source badges + Commander button with Stripe redirect
feat(commande): add success + cancel pages + routes
```
