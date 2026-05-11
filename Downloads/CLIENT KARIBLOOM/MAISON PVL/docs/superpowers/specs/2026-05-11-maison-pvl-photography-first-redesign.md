# Maison PVL — Photography-First Redesign

**Date**: 2026-05-11
**References**: SuitSupply (editorial full-bleed), Bobbies (split entry, Parisian restraint)
**Brand**: Sharp. Sensual. Provocative. — Saint Laurent / Tom Ford energy

## Overview

Redesign Maison PVL as a photography-first luxury fashion site where UI chrome exists only to facilitate purchase. The photograph IS the interface. Everything else — navigation, text, buttons — recedes.

## Architecture

### Page Structure

```
/                          Split entry (zero chrome, two full-screen images)
  /homme                   Men's site (header appears, editorial full-bleed)
    /homme/nouveautes      Product listing (first time products appear)
    /homme/essentiels      Editorial category page
    /homme/silhouettes     Editorial category page
    /homme/accessoires     Editorial category page
    /homme/[slug]          Product detail
  /femme                   Women's site (same structure)
    /femme/nouveautes
    /femme/essentiels
    /femme/silhouettes
    /femme/accessoires
    /femme/[slug]
  /checkout                Checkout (no header/footer)
  /connexion               Login (no header/footer)
  /inscription             Register (no header/footer)
  /mon-compte              Account
  /mon-compte/favoris      Wishlist
  /mon-compte/commandes    Orders
  /sav                     Customer service
  /contact                 Contact
  /a-propos                About
  /cgv, /mentions-legales, /confidentialite  Legal
```

### Component Architecture

```
Layout
├── EntryLayout (no header, no footer — split page only)
├── GenderedLayout (transparent header + footer — /homme, /femme)
└── MinimalLayout (no header/footer — checkout, auth)

Header
├── Transparent, gradient fade (black → transparent)
├── Logo left, nav center, icons right
├── Gender switcher (subtle link to other gender)
└── Cart indicator, account, wishlist icons

Pages
├── EntryPage — split hero, zero chrome
├── GenderHomePage — full-bleed editorial blocks
├── CollectionPage — category with optional product grid
├── ProductPage — product detail
└── ... (checkout, account, etc.)
```

## Design System Updates

### Typography

Replace Instrument Serif + Inter (banned AI defaults):

| Role | Font | Weight | Use |
|------|------|--------|-----|
| Display | Rufina | 400, 700 | Hero titles, section headings |
| Body | Karla | 300, 400, 500 | Navigation labels, product info, body text |

- Rufina: sharp Didone contrast, sensual italics, distinctive terminals
- Karla: grotesque with character, excellent French diacritics, readable at 11px

### Color Tokens

Keep existing token names, update values for cooler metallic gold:

```css
--color-pvl-black:    oklch(7% 0.003 60);    /* near-black, warm undertone */
--color-pvl-charcoal: oklch(15% 0.005 60);
--color-pvl-slate:    oklch(35% 0.005 60);
--color-pvl-stone:    oklch(62% 0.008 60);
--color-pvl-cream:    oklch(97% 0.005 80);
--color-pvl-white:    oklch(100% 0 0);
--color-pvl-warm:     oklch(99% 0.002 60);

/* Cool metallic gold — polished brass, not honey */
--color-pvl-gold:     oklch(65% 0.07 85);
--color-pvl-gold-dim: oklch(50% 0.06 85);

/* Semantic */
--color-pvl-success:  oklch(55% 0.14 150);
--color-pvl-warning:  oklch(65% 0.12 80);
--color-pvl-error:    oklch(50% 0.18 25);
```

### Header Treatment

- **Transparent background**: `linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, transparent 100%)`
- **On scroll**: add slight background blur for readability
- **Logo**: white text, no box, no background
- **Nav labels**: 8px, uppercase, letter-spacing 0.2em, white at 50% opacity
- **Gender switcher**: even more subtle (white at 25% opacity)

### Key Design Rules

1. **Never wrap photos in cards or containers**
2. **Never add drop shadows to images**
3. **Text is always small + uppercase + tracked-out OR large display serif — nothing between**
4. **Gold appears in 3 places max per page**
5. **Border radius: 2px maximum, 0px preferred**
6. **No gradient text, no glassmorphism, no side-stripe borders**

## Implementation Plan

### Phase 1 — Foundation (fonts + tokens)
1. Replace `@font-face` declarations in `globals.css` (Rufina + Karla)
2. Update gold tokens to cooler metallic values
3. Remove any remaining Geist references

### Phase 2 — Entry Page (split)
1. Create `EntryLayout` — no header, no footer, full viewport
2. Rewrite `src/app/page.tsx` — split Homme/Femme, zero chrome
3. Each half is a full-bleed clickable area linking to /homme or /femme

### Phase 3 — Gendered Pages
1. Create `GenderedLayout` — transparent header + footer
2. Build `/homme/page.tsx` — editorial full-bleed blocks
3. Build `/femme/page.tsx` — mirror of /homme
4. Update `Header` component — transparent variant with scroll detection
5. Collection pages follow same pattern

### Phase 4 — Product Pages
1. Product listing: photography-first grid, minimal text
2. Product detail: large image, restrained product info
3. Cart drawer: keep existing, ensure consistency

### Phase 5 — Polish
1. Transitions between pages
2. Header transparency on scroll
3. Responsive adjustments

## Files to Touch

| File | Action |
|------|--------|
| `src/app/globals.css` | Replace fonts, update gold, add transparent header tokens |
| `src/app/page.tsx` | Rewrite as split entry |
| `src/components/layout/Header.tsx` | Transparent variant, scroll detection |
| `src/components/layout/Footer.tsx` | Review against new aesthetic |
| `src/components/home/HeroSection.tsx` | Rewrite or remove (split replaces it) |
| `src/app/layout.tsx` | Update for EntryLayout vs GenderedLayout |
| `src/contexts/Providers.tsx` | Update shell logic |
| `src/app/(homme)/**` | New route group for men's pages |
| `src/app/(femme)/**` | New route group for women's pages |

## Anti-References (What NOT to Build)

- No product cards with icons on the homepage
- No hero metrics (big number + small label + gradient accent)
- No gradient text anywhere
- No border-left accent stripes
- No glass cards or blur effects used decoratively
- No rounded pill buttons
- No rainbow category colors
- No sale banners or promotional popups
- No "Welcome!" or "Discover our collection!!" type copy
