# Cart Drawer & Product Page — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign CartDrawer to Bobbies-style premium drawer (remove `/panier` page), polish ProductDetailClient with breadcrumb, size button grid, accordions, and trust signals.

**Architecture:** CartDrawer becomes the sole cart experience — a slide-in right panel with product photos, quantity controls, and a "Commander" CTA. ProductDetailClient gains editorial structure matching Bobbies/Suitsupply patterns.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS v4, Framer Motion v12, lucide-react, Zustand (cart store)

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/components/cart/CartDrawer.tsx` | Rewrite | Full Bobbies-style drawer with photos, qté, summary |
| `src/app/panier/page.tsx` | Delete | Replaced by CartDrawer |
| `src/components/product/ProductDetailClient.tsx` | Modify | Add breadcrumb, size grid, accordions, trust signals |
| `src/app/checkout/page.tsx` | Modify | Update "Retour au panier" → open drawer |
| `src/app/commande/annulee/page.tsx` | Modify | Update `/panier` link if present |
| `src/components/layout/Header.tsx` | Modify | Cart icon link → `toggleCart` (already correct, verify) |

---

### Task 1: Delete `/panier` page

**Files:**
- Delete: `src/app/panier/page.tsx`

- [ ] **Step 1: Delete the cart page file**

```bash
rm src/app/panier/page.tsx
```

- [ ] **Step 2: Verify no broken imports**

Run: `grep -r "panier/page" src/` — should return nothing related to imports of the deleted page.

- [ ] **Step 3: Commit**

```bash
git add src/app/panier/page.tsx
git commit -m "chore: remove /panier page, cart is drawer-only"
```

---

### Task 2: Rewrite CartDrawer — Bobbies-style

**Files:**
- Modify: `src/components/cart/CartDrawer.tsx` (full rewrite)

- [ ] **Step 1: Write the new CartDrawer**

Replace the entire file content with:

```tsx
'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';
import { X, Minus, Plus, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '@/store/cartStore';
import { formatPrice } from '@/lib/format';

export function CartDrawer() {
  const { t } = useTranslation();
  const { items, isOpen, closeCart, updateQuantity, removeItem, subtotal } =
    useCart();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const count = items.reduce((n, i) => n + i.quantity, 0);

  return (
    <div className="fixed inset-0 z-[60]">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-pvl-black/30 backdrop-blur-sm"
        onClick={closeCart}
      />

      {/* Drawer */}
      <div className="absolute top-0 right-0 bottom-0 w-full max-w-md bg-pvl-white flex flex-col">
        {/* Header — 56px, aligned with site header */}
        <div className="flex items-center justify-between h-[56px] px-5 border-b border-pvl-black/6">
          <button
            onClick={closeCart}
            className="flex items-center gap-2 text-[0.625rem] font-medium uppercase tracking-[0.2em] text-pvl-slate hover:text-pvl-black transition-colors"
            aria-label={t('nav.fermer')}
          >
            <X size={20} strokeWidth={1.5} />
            {t('nav.fermer')}
          </button>
          <span className="text-sm font-medium text-pvl-black">
            {t('cart.titre')} ({count})
          </span>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <ShoppingBag size={32} strokeWidth={1} className="text-pvl-stone mb-4" />
              <p className="text-sm text-pvl-slate mb-6">{t('cart.vide')}</p>
              <button
                onClick={closeCart}
                className="text-[0.6875rem] uppercase tracking-[0.2em] text-pvl-black underline underline-offset-4 hover:text-pvl-slate transition-colors"
              >
                {t('cart.continuer-achats')}
              </button>
            </div>
          ) : (
            <div className="flex flex-col">
              {items.map((item) => {
                const image = item.product.images[0];
                return (
                  <div
                    key={item.id}
                    className="flex gap-4 py-5 border-b border-pvl-black/6"
                  >
                    {/* Product image */}
                    <div className="relative w-[96px] h-[128px] flex-shrink-0">
                      {image?.url ? (
                        <Image
                          src={image.url}
                          alt={image.alt || item.product.name}
                          fill
                          className="object-cover"
                          sizes="96px"
                        />
                      ) : (
                        <div className="w-full h-full bg-pvl-cream" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <Link
                          href={`/produit/${item.product.slug}`}
                          onClick={closeCart}
                          className="text-[0.75rem] font-medium text-pvl-black hover:text-pvl-slate transition-colors line-clamp-2"
                        >
                          {item.product.name}
                        </Link>
                        <p className="text-[0.625rem] text-pvl-stone mt-1 uppercase tracking-[0.1em]">
                          {item.variant.color} — {item.variant.size}
                        </p>
                      </div>

                      <div className="flex items-center justify-between">
                        <p className="text-[0.8125rem] tabular-nums text-pvl-black">
                          {formatPrice(item.variant.price)}
                        </p>

                        {/* Quantity controls */}
                        <div className="flex items-center border border-pvl-black/12">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="p-1.5 text-pvl-slate hover:text-pvl-black transition-colors"
                            aria-label={t('common.quantite')}
                          >
                            <Minus size={14} strokeWidth={1.5} />
                          </button>
                          <span className="w-8 text-center text-[0.75rem] font-medium tabular-nums">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="p-1.5 text-pvl-slate hover:text-pvl-black transition-colors"
                            aria-label={t('common.quantite')}
                          >
                            <Plus size={14} strokeWidth={1.5} />
                          </button>
                        </div>

                        {/* Remove */}
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-[0.5625rem] uppercase tracking-[0.15em] text-pvl-stone hover:text-pvl-error transition-colors"
                        >
                          {t('actions.supprimer')}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-pvl-black/8 px-5 py-5 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-pvl-slate">{t('cart.sous-total')}</span>
                <span className="tabular-nums text-pvl-black">
                  {formatPrice(subtotal())}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-pvl-slate">{t('cart.livraison')}</span>
                <span className="text-pvl-success text-[0.625rem] uppercase tracking-[0.1em]">
                  {t('cart.livraison-offerte')}
                </span>
              </div>
            </div>

            <div className="flex justify-between font-medium pt-3 border-t border-pvl-black/8">
              <span className="text-pvl-black">{t('cart.total')}</span>
              <span className="tabular-nums text-pvl-black">
                {formatPrice(subtotal())}
              </span>
            </div>

            <Link
              href="/checkout"
              onClick={closeCart}
              className="flex items-center justify-center gap-2 w-full bg-pvl-black text-pvl-white h-[52px] text-[0.6875rem] font-medium uppercase tracking-[0.2em] hover:bg-pvl-charcoal transition-colors"
            >
              {t('cart.commander')}
              <ArrowRight size={14} strokeWidth={1.5} />
            </Link>

            <button
              onClick={closeCart}
              className="block w-full text-center text-[0.625rem] uppercase tracking-[0.2em] text-pvl-slate hover:text-pvl-black transition-colors"
            >
              {t('cart.continuer-achats')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add `cart.livraison-offerte` key to i18n**

Add to `src/i18n/locales/fr/cart.json`:
```json
"livraison-offerte": "Offerte"
```

Add to `src/i18n/locales/en/cart.json`:
```json
"livraison-offerte": "Free"
```

- [ ] **Step 3: Verify build**

Run: `npx next build 2>&1 | tail -20`
Expected: 0 errors

- [ ] **Step 4: Commit**

```bash
git add src/components/cart/CartDrawer.tsx src/i18n/locales/
git commit -m "feat: Bobbies-style CartDrawer with product images, quantity controls, summary footer"
```

---

### Task 3: Fix `/panier` references

**Files:**
- Modify: `src/app/checkout/page.tsx`
- Modify: `src/app/commande/annulee/page.tsx`

- [ ] **Step 1: Update checkout page — replace "/panier" link with cart open**

In `src/app/checkout/page.tsx`, replace the "Retour au panier" link:

Find the block at ~line 51-57:
```tsx
<Link
  href="/panier"
  className="..."
>
  Retour au panier
</Link>
```

Replace with:
```tsx
<button
  onClick={() => document.dispatchEvent(new CustomEvent('open-cart'))}
  className="text-[0.625rem] uppercase tracking-[0.15em] text-pvl-stone hover:text-pvl-black transition-colors"
>
  Retour au panier
</button>
```

Wait — the cart drawer is opened via `useCart().openCart()`. Since checkout is a Client Component, we should use the store directly. Add the import and use the hook:

```tsx
import { useCart } from '@/store/cartStore';

// Inside the component:
const { openCart } = useCart();
```

Then replace the Link with:
```tsx
<button
  onClick={openCart}
  className="text-[0.625rem] uppercase tracking-[0.15em] text-pvl-stone hover:text-pvl-black transition-colors"
>
  Retour au panier
</button>
```

- [ ] **Step 2: Check commande/annulee page**

Read `src/app/commande/annulee/page.tsx` and replace any `<Link href="/panier">` with a button that calls `openCart()`.

- [ ] **Step 3: Verify no remaining `/panier` references**

Run: `grep -r '"/panier"' src/` — should return nothing.

- [ ] **Step 4: Commit**

```bash
git add src/app/checkout/page.tsx src/app/commande/annulee/page.tsx
git commit -m "fix: replace /panier links with cart drawer open"
```

---

### Task 4: ProductDetailClient — Breadcrumb, size grid, accordions, trust signals

**Files:**
- Modify: `src/components/product/ProductDetailClient.tsx`

- [ ] **Step 1: Add breadcrumb component**

Add this breadcrumb before the existing product layout:

```tsx
{/* Breadcrumb */}
<nav className="container-pvl pt-28 pb-4">
  <ol className="flex items-center gap-1.5 text-[0.625rem] uppercase tracking-[0.15em] text-pvl-stone">
    <li>
      <Link href={`/${product.gender}`} className="hover:text-pvl-black transition-colors">
        {product.gender === 'femme' ? 'Femme' : 'Homme'}
      </Link>
    </li>
    <span className="text-pvl-stone/40">/</span>
    <li>
      <Link href={`/${product.gender}/nouveautes`} className="hover:text-pvl-black transition-colors">
        Collection
      </Link>
    </li>
    <span className="text-pvl-stone/40">/</span>
    <li className="text-pvl-black">{product.name}</li>
  </ol>
</nav>
```

Insert this AFTER the opening `<>` of the return, before the main `<div className="flex flex-col md:flex-row">`.

- [ ] **Step 2: Convert size selector from dropdown to button grid**

Replace the existing size selector block (the `availableSizes.length > 0` block starting around line 162). Replace the `<div className="flex flex-wrap gap-2">` content:

Current:
```tsx
{availableSizes.map((size) => (
  <button
    key={size}
    onClick={() => setSelectedSize(size)}
    className="min-w-[3rem] px-3 py-2 text-[0.75rem] uppercase border transition-all duration-150"
    style={{...}}
  >
    {size}
  </button>
))}
```

Replace the style-based buttons with Tailwind classes:

```tsx
{availableSizes.map((size) => (
  <button
    key={size}
    onClick={() => setSelectedSize(size)}
    className={cn(
      'min-w-[3rem] h-10 px-3 text-[0.75rem] uppercase border transition-colors',
      selectedSize === size
        ? 'border-pvl-black bg-pvl-black text-pvl-white'
        : 'border-pvl-stone/30 text-pvl-black hover:border-pvl-black'
    )}
  >
    {size}
  </button>
))}
```

Add `import { cn } from '@/lib/cn';` at the top.

- [ ] **Step 3: Add guide des tailles link**

After the size grid closing `</div>`, add:

```tsx
<button className="mt-3 text-[0.625rem] uppercase tracking-[0.1em] text-pvl-stone underline underline-offset-4 hover:text-pvl-black transition-colors">
  Guide des tailles
</button>
```

- [ ] **Step 4: Replace product details with accordions**

Replace the current materials/care text block and the inline ShopTheLook with accordions. Replace the section starting at line 240 (the materials/care paragraph):

```tsx
{/* Accordions */}
<div className="mt-8 pt-8 border-t border-pvl-black/6 space-y-1">
  <details className="group" open>
    <summary className="flex items-center justify-between py-3 text-[0.6875rem] uppercase tracking-[0.15em] font-medium cursor-pointer text-pvl-black list-none">
      Description
      <span className="text-pvl-stone group-open:rotate-180 transition-transform">▾</span>
    </summary>
    <p className="pb-4 text-[0.8125rem] text-pvl-slate leading-relaxed">
      {product.description}
    </p>
  </details>

  {product.materials && (
    <details className="group">
      <summary className="flex items-center justify-between py-3 text-[0.6875rem] uppercase tracking-[0.15em] font-medium cursor-pointer text-pvl-black list-none">
        Matières
        <span className="text-pvl-stone group-open:rotate-180 transition-transform">▾</span>
      </summary>
      <p className="pb-4 text-[0.8125rem] text-pvl-slate leading-relaxed">
        {product.materials}
      </p>
    </details>
  )}

  {product.care_instructions && (
    <details className="group">
      <summary className="flex items-center justify-between py-3 text-[0.6875rem] uppercase tracking-[0.15em] font-medium cursor-pointer text-pvl-black list-none">
        Entretien
        <span className="text-pvl-stone group-open:rotate-180 transition-transform">▾</span>
      </summary>
      <p className="pb-4 text-[0.8125rem] text-pvl-slate leading-relaxed">
        {product.care_instructions}
      </p>
    </details>
  )}

  <details className="group">
    <summary className="flex items-center justify-between py-3 text-[0.6875rem] uppercase tracking-[0.15em] font-medium cursor-pointer text-pvl-black list-none">
      Livraison & retours
      <span className="text-pvl-stone group-open:rotate-180 transition-transform">▾</span>
    </summary>
    <div className="pb-4 text-[0.8125rem] text-pvl-slate leading-relaxed space-y-2">
      <p>Livraison standard offerte en 3–5 jours ouvrés.</p>
      <p>Retours gratuits sous 30 jours.</p>
      <p>Click & Collect disponible en boutique.</p>
    </div>
  </details>
</div>
```

- [ ] **Step 5: Add trust signals below the CTA**

After the "Ajouter au panier" button (the `<button>` at line 220), add:

```tsx
{/* Trust signals */}
<div className="mt-6 grid grid-cols-2 gap-3 text-center">
  <div className="border border-pvl-black/6 py-3 px-2">
    <p className="text-[0.5625rem] uppercase tracking-[0.15em] text-pvl-stone">
      Livraison offerte
    </p>
  </div>
  <div className="border border-pvl-black/6 py-3 px-2">
    <p className="text-[0.5625rem] uppercase tracking-[0.15em] text-pvl-stone">
      Retours 30 jours
    </p>
  </div>
</div>
```

- [ ] **Step 6: Verify build**

Run: `npx next build 2>&1 | tail -20`
Expected: 0 errors

- [ ] **Step 7: Commit**

```bash
git add src/components/product/ProductDetailClient.tsx
git commit -m "feat: add breadcrumb, size button grid, accordions, trust signals to product page"
```

---

### Task 5: Final verification & polish

- [ ] **Step 1: Full build check**

Run: `npx next build 2>&1 | tail -20`
Expected: 0 errors

- [ ] **Step 2: Lint check**

Run: `npx next lint`
Expected: 0 errors, 0 warnings

- [ ] **Step 3: Verify all cart flows**

Manual check:
1. Navigate to a product page
2. Select size, click "Ajouter au panier" → drawer opens
3. Verify product image, name, variant, price, quantity
4. Change quantity → verify subtotal updates
5. Click "Commander" → verify redirect to `/checkout`
6. Click "Continuer mes achats" → drawer closes
7. Open drawer from header cart icon → verify items persist

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: final verification — all cart & product flows passing"
```
