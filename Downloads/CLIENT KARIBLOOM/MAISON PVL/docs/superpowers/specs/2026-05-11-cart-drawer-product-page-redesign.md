# Cart Drawer & Product Page — Redesign

**Date**: 2026-05-11
**Références**: Bobbies, Suitsupply
**Scope**: CartDrawer redesign + ProductDetailClient polish + suppression page panier

---

## CartDrawer (drawer seule, plus de page dédiée)

### Comportement
- Slide-in depuis la droite, `max-w-md` (448px), full height
- Overlay `bg-pvl-black/30 backdrop-blur-sm`
- Fermeture: bouton X, clic overlay, Échap
- Le CTA "Commander" redirige vers `/checkout`
- La page `/panier` est supprimée, les liens pointent vers le drawer (`useCart.openCart`)

### Structure
- **Header** (56px): X + "Panier (N)" — hauteur alignée avec le Header site
- **Items**: Chaque ligne = photo 96×128 (3:4) + nom + variante (couleur/taille) + prix + quantités + supprimer
- **Footer**: Sous-total, Livraison (offerte en pvl-success), Total, CTA "Commander" full-width, "Continuer mes achats" secondaire
- **Vide**: Icône ShoppingBag + message + bouton "Continuer mes achats"
- **Images**: `next/image` avec URLs réelles du produit (plus de placeholder gris)

### Détails techniques
- Quantités: `[–] N [+]` avec border fin, Minus/Plus lucide 14px
- Prix en `tabular-nums` (alignement vertical)
- Border `border-pvl-black/6` entre les items
- CTA noir full-width, uppercase tracking

---

## ProductDetailClient — Polish

### Ajouts
- **Breadcrumb**: Collection / Catégorie / Produit (avant le bloc image+info)
- **Grille de tailles**: boutons (pas de dropdown), style similaire à Bobbies — `min-w-[3rem]` chaque bouton
- **Guide des tailles**: lien discret sous la grille de tailles ("Guide des tailles →")
- **Trust signals**: Livraison offerte + Retours 30 jours en dessous du CTA
- **Accordéons**: Description, Matières, Entretien, Livraison — remplacent le texte brut actuel

### Conservé tel quel
- Layout 58/42 desktop, image stack + carousel mobile
- Crossfade hover (quand le ProductCard est utilisé dans les grilles)
- Shop the Look + YouMayLike

---

## Supabase — Structure données

### Tables
- `products`: id, slug, name, description, gender, category_id, price, compare_at_price, materials, care_instructions, is_new, featured, created_at
- `variants`: id, product_id, color, color_hex, size, price_override, stock
- `categories`: id, slug, name, gender
- **Storage bucket**: `product-images` — `{product_id}/{position}.{ext}`

### Images
- Supabase Storage avec transformation: `?width=600&height=800&resize=cover`
- Format: AVIF prioritaire, WebP fallback
- `next/image` avec `remotePatterns` configuré pour le domaine Supabase Storage

---

## Suppressions
- `src/app/panier/page.tsx`
- Les URLs Unsplash hardcodées dans ProductGrid (remplacées par fetch Supabase)
- Les constantes `MEN_PRODUCT_IMAGES` / `WOMEN_PRODUCT_IMAGES`

---

## Non-scope (phase suivante)
- Checkout Stripe
- Page confirmation de commande
- Admin dashboard produits
- Guest checkout
