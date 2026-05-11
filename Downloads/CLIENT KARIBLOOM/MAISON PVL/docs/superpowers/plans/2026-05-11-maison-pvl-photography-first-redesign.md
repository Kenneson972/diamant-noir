# Maison PVL Photography-First Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign Maison PVL as a photography-first luxury fashion site — split entry, transparent header, Rufina + Karla fonts, cool metallic gold tokens.

**Architecture:** Route-group-based gendered experience. `/` is a zero-chrome split entry. `/homme` and `/femme` are separate route groups, each with their own layout (transparent header over full-bleed photography). UI chrome exists only to facilitate purchase.

**Tech Stack:** Next.js 16 (App Router), React 19, HeroUI v3, Tailwind CSS v4, Framer Motion, Zustand, i18next

---

### Task 1: Replace Fonts in globals.css

**Files:**
- Modify: `src/app/globals.css:1-54`

- [ ] **Step 1: Replace Instrument Serif with Rufina**

Open `src/app/globals.css`, replace the `@font-face` blocks and font-family tokens:

```css
@import "tailwindcss";
@import "@heroui/styles";

@font-face {
  font-family: 'Rufina';
  src: url('https://fonts.googleapis.com/css2?family=Rufina:wght@400;700&display=swap');
  font-display: swap;
}

@font-face {
  font-family: 'Karla';
  src: url('https://fonts.googleapis.com/css2?family=Karla:ital,wght@0,300;0,400;0,500;1,400&display=swap');
  font-display: swap;
}

@theme {
  /* Core brand colors - oklch */
  --color-pvl-black:    oklch(7% 0.003 60);
  --color-pvl-charcoal: oklch(15% 0.005 60);
  --color-pvl-slate:    oklch(35% 0.005 60);
  --color-pvl-stone:    oklch(62% 0.008 60);
  --color-pvl-cream:    oklch(97% 0.005 80);
  --color-pvl-white:    oklch(100% 0 0);
  --color-pvl-warm:     oklch(99% 0.002 60);

  /* Cool metallic gold — polished brass */
  --color-pvl-gold:     oklch(65% 0.07 85);
  --color-pvl-gold-dim: oklch(50% 0.06 85);

  /* Semantic */
  --color-pvl-success:  oklch(55% 0.14 150);
  --color-pvl-warning:  oklch(65% 0.12 80);
  --color-pvl-error:    oklch(50% 0.18 25);

  /* Typography */
  --font-display: 'Rufina', Georgia, serif;
  --font-sans:    'Karla', system-ui, sans-serif;

  /* Spacing sections */
  --space-section-sm:  3rem;
  --space-section-md:  5rem;
  --space-section-lg:  8rem;

  /* Radius */
  --radius-card:    2px;
  --radius-sm:      0;

  /* Shadows - editorial, minimal */
  --shadow-editorial-sm:
    0 1px 2px color-mix(in oklch, var(--color-pvl-black) 4%, transparent);
  --shadow-editorial-md:
    0 2px 4px color-mix(in oklch, var(--color-pvl-black) 5%, transparent),
    0 12px 32px color-mix(in oklch, var(--color-pvl-black) 5%, transparent);
}
```

- [ ] **Step 2: Update base layer font references**

In `src/app/globals.css`, ensure `body` uses `var(--font-sans)` and headings use `var(--font-display)`. These are already set — verify they reference the new variable names (they already do).

- [ ] **Step 3: Run dev server to verify fonts load**

```bash
cd "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/MAISON PVL" && npm run dev &
sleep 5
curl -s http://localhost:3000 | head -50
```

Expected: No errors, page renders.

- [ ] **Step 4: Commit**

```bash
git add src/app/globals.css
git commit -m "feat: replace fonts with Rufina + Karla, update gold to cool metallic"
```

---

### Task 2: Create Entry Layout (zero chrome)

**Files:**
- Create: `src/app/page.tsx` (rewrite)
- Create: `src/components/layout/EntryLayout.tsx`

- [ ] **Step 1: Create EntryLayout component**

Create `src/components/layout/EntryLayout.tsx`:

```tsx
export function EntryLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen w-screen overflow-hidden bg-pvl-black">
      {children}
    </div>
  );
}
```

- [ ] **Step 2: Rewrite homepage as split entry**

Rewrite `src/app/page.tsx`:

```tsx
import Link from 'next/link';

export default function EntryPage() {
  return (
    <div className="grid grid-cols-2 h-screen">
      {/* Homme */}
      <Link
        href="/homme"
        className="relative flex items-end p-16 overflow-hidden group"
        style={{
          background: 'linear-gradient(135deg, #5a4c3a 0%, #3a2c1a 100%)',
        }}
      >
        <div className="absolute inset-0 bg-radial from-transparent to-black/50" />
        <span className="relative z-10 font-display text-[clamp(2rem,5vw,3.5rem)] text-white leading-[0.9] tracking-[-0.02em] transition-transform duration-500 group-hover:translate-y-[-4px]">
          Homme
        </span>
      </Link>

      {/* Femme */}
      <Link
        href="/femme"
        className="relative flex items-end p-16 overflow-hidden group"
        style={{
          background: 'linear-gradient(135deg, #948575 0%, #746555 100%)',
        }}
      >
        <div className="absolute inset-0 bg-radial from-transparent to-black/50" />
        <span className="relative z-10 font-display text-[clamp(2rem,5vw,3.5rem)] text-white leading-[0.9] tracking-[-0.02em] transition-transform duration-500 group-hover:translate-y-[-4px]">
          Femme
        </span>
      </Link>
    </div>
  );
}
```

- [ ] **Step 3: Update root layout to not render Header/Footer on entry**

Read `src/contexts/Providers.tsx`. The `AppShell` component already conditionally hides Header/Footer based on pathname. Add the root path check:

In `src/contexts/Providers.tsx`, update `isCheckout` logic:

```tsx
function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isCheckout = pathname.startsWith('/checkout');
  const isAuth =
    pathname.startsWith('/connexion') || pathname.startsWith('/inscription');
  const isEntry = pathname === '/';

  return (
    <>
      <ScrollToTop />
      <div className="flex min-h-screen flex-col">
        {!isCheckout && !isAuth && !isEntry && <Header />}
        <main
          id="main-content"
          className={
            isCheckout || isAuth || isEntry
              ? 'flex flex-1 flex-col'
              : 'flex-1'
          }
        >
          {children}
        </main>
        {!isCheckout && !isAuth && !isEntry && <Footer />}
      </div>
    </>
  );
}
```

- [ ] **Step 4: Run dev server and verify split page renders**

```bash
cd "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/MAISON PVL" && npm run dev &
sleep 5
curl -s http://localhost:3000 | grep -o "Homme\|Femme"
```

Expected: "Homme" and "Femme" appear in output.

- [ ] **Step 5: Commit**

```bash
git add src/app/page.tsx src/contexts/Providers.tsx src/components/layout/EntryLayout.tsx
git commit -m "feat: split entry page — Homme/Femme, zero chrome"
```

---

### Task 3: Transparent Header

**Files:**
- Modify: `src/components/layout/Header.tsx`

- [ ] **Step 1: Add transparent variant to Header**

The Header needs a `transparent` prop. When transparent, it renders with a gradient background that fades to transparent. On scroll, it adds a solid background.

Modify `src/components/layout/Header.tsx`:

Add a `variant` prop to the component:

```tsx
interface HeaderProps {
  variant?: 'solid' | 'transparent';
}

export function Header({ variant = 'solid' }: HeaderProps) {
```

Update the header className to handle both variants:

```tsx
<header
  style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
  className={cn(
    'sticky top-0 z-50 transition-all duration-300',
    variant === 'transparent'
      ? cn(
          'bg-gradient-to-b from-black/40 to-transparent',
          scrolled && 'bg-pvl-black/95 backdrop-blur-sm'
        )
      : cn(
          scrolled
            ? 'bg-pvl-white/98 border-b border-pvl-black/8 shadow-[0_1px_12px_rgba(0,0,0,0.04)]'
            : 'bg-pvl-white border-b border-transparent'
        )
  )}
>
```

For the transparent variant, override text colors to white:

```tsx
const isTransparent = variant === 'transparent';

// Logo
<Link
  href="/"
  className={cn(
    'font-display text-xl md:text-2xl tracking-[-0.02em]',
    isTransparent ? 'text-white' : 'text-pvl-black'
  )}
>
  Maison PVL
</Link>

// Nav links — update className for each Link:
className={cn(
  'text-[0.75rem] font-medium uppercase tracking-[0.18em] transition-colors',
  pathname.startsWith(item.href)
    ? isTransparent ? 'text-white' : 'text-pvl-black'
    : isTransparent
      ? 'text-white/50 hover:text-white'
      : 'text-pvl-slate hover:text-pvl-black'
)}

// Icon buttons — update each:
className={cn(
  'p-1.5 transition-colors',
  isTransparent
    ? 'text-white/50 hover:text-white'
    : 'text-pvl-slate hover:text-pvl-black'
)}

// Cart badge — update:
className={cn(
  'absolute -top-0.5 -right-0.5 text-[0.5rem] font-medium w-4 h-4 flex items-center justify-center rounded-full',
  isTransparent ? 'bg-white text-pvl-black' : 'bg-pvl-black text-pvl-white'
)

// Announcement bar — hide in transparent mode:
{!isTransparent && (
  <div className="bg-pvl-black text-pvl-white text-center py-2 px-4">
    <p className="text-[0.625rem] font-medium uppercase tracking-[0.2em]">
      Livraison offerte dès 200€ — Retours sous 30 jours
    </p>
  </div>
)}
```

- [ ] **Step 2: Pass transparent variant from gendered layouts**

The gendered layout will pass `variant="transparent"`. For now, verify the Header accepts the prop:

```bash
cd "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/MAISON PVL" && npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/Header.tsx
git commit -m "feat: add transparent header variant for gendered pages"
```

---

### Task 4: Create Route Groups and Gendered Layouts

**Files:**
- Create: `src/app/(homme)/layout.tsx`
- Create: `src/app/(homme)/page.tsx`
- Create: `src/app/(femme)/layout.tsx`
- Create: `src/app/(femme)/page.tsx`
- Modify: `src/contexts/Providers.tsx`

- [ ] **Step 1: Create Homme route group layout**

Create `src/app/(homme)/layout.tsx`:

```tsx
import { GenderedLayout } from '@/components/layout/GenderedLayout';

export default function HommeLayout({ children }: { children: React.ReactNode }) {
  return <GenderedLayout gender="homme">{children}</GenderedLayout>;
}
```

Create `src/components/layout/GenderedLayout.tsx`:

```tsx
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

interface GenderedLayoutProps {
  gender: 'homme' | 'femme';
  children: React.ReactNode;
}

export function GenderedLayout({ children }: GenderedLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-pvl-white">
      <Header variant="transparent" />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
```

- [ ] **Step 2: Create Femme route group layout**

Create `src/app/(femme)/layout.tsx`:

```tsx
import { GenderedLayout } from '@/components/layout/GenderedLayout';

export default function FemmeLayout({ children }: { children: React.ReactNode }) {
  return <GenderedLayout gender="femme">{children}</GenderedLayout>;
}
```

- [ ] **Step 3: Create Homme home page**

Create `src/app/(homme)/page.tsx`:

```tsx
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function HommePage() {
  return (
    <>
      {/* Hero — full-bleed campaign image placeholder */}
      <section className="relative h-screen flex items-end p-12 md:p-20"
        style={{
          background: 'linear-gradient(135deg, #5a4c3a 0%, #3a2c1a 100%)',
        }}
      >
        <div className="absolute inset-0 bg-radial from-transparent to-black/40" />
        <div className="relative z-10">
          <p className="text-[0.5rem] md:text-[0.5625rem] uppercase tracking-[0.3em] text-white/40 mb-4">
            Nouveautes Ete 2026
          </p>
          <h1 className="font-display text-[clamp(2.5rem,6vw,4.5rem)] text-white leading-[0.95] tracking-[-0.02em]">
            L&apos;allure<br />masculine
          </h1>
          <div className="mt-10 flex gap-6">
            <Link
              href="/homme/nouveautes"
              className="group inline-flex items-center gap-3 border-b border-white/30 pb-2 text-[0.6875rem] font-medium uppercase tracking-[0.2em] text-white/70 hover:text-white hover:border-white/60 transition-all duration-300"
            >
              Nouveautes
              <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
            <Link
              href="/homme/essentiels"
              className="group inline-flex items-center gap-3 border-b border-white/30 pb-2 text-[0.6875rem] font-medium uppercase tracking-[0.2em] text-white/70 hover:text-white hover:border-white/60 transition-all duration-300"
            >
              Essentiels
              <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>

      {/* Editorial block 2 — full-bleed */}
      <section className="relative h-screen flex items-end p-12 md:p-20"
        style={{
          background: 'linear-gradient(135deg, #8b7d6b 0%, #5a4c3a 100%)',
        }}
      >
        <div className="absolute inset-0 bg-radial from-transparent to-black/40" />
        <div className="relative z-10 max-w-xl">
          <p className="text-[0.5rem] md:text-[0.5625rem] uppercase tracking-[0.3em] text-white/40 mb-4">
            Essentiels
          </p>
          <h2 className="font-display text-[clamp(2rem,5vw,3.5rem)] text-white leading-[1.05] tracking-[-0.01em]">
            La chemise<br />parfaite
          </h2>
          <Link
            href="/homme/essentiels"
            className="group inline-flex items-center gap-3 border-b border-white/30 pb-2 mt-8 text-[0.6875rem] font-medium uppercase tracking-[0.2em] text-white/70 hover:text-white hover:border-white/60 transition-all duration-300"
          >
            Decouvrir
            <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>
      </section>

      {/* Editorial block 3 — more editorial, different crop */}
      <section className="relative h-screen flex items-end p-12 md:p-20"
        style={{
          background: 'linear-gradient(135deg, #6b5d4b 0%, #4a3c2a 100%)',
        }}
      >
        <div className="absolute inset-0 bg-radial from-transparent to-black/40" />
        <div className="relative z-10 max-w-xl ml-auto text-right">
          <p className="text-[0.5rem] md:text-[0.5625rem] uppercase tracking-[0.3em] text-white/40 mb-4">
            Silhouettes
          </p>
          <h2 className="font-display text-[clamp(2rem,5vw,3.5rem)] text-white leading-[1.05] tracking-[-0.01em]">
            L&apos;art de<br />la coupe
          </h2>
          <Link
            href="/homme/silhouettes"
            className="group inline-flex items-center gap-3 border-b border-white/30 pb-2 mt-8 text-[0.6875rem] font-medium uppercase tracking-[0.2em] text-white/70 hover:text-white hover:border-white/60 transition-all duration-300"
          >
            Decouvrir
            <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>
      </section>
    </>
  );
}
```

- [ ] **Step 4: Create Femme home page**

Create `src/app/(femme)/page.tsx` — mirror of `/homme` with feminine styling:

```tsx
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function FemmePage() {
  return (
    <>
      <section className="relative h-screen flex items-end p-12 md:p-20"
        style={{
          background: 'linear-gradient(135deg, #948575 0%, #746555 100%)',
        }}
      >
        <div className="absolute inset-0 bg-radial from-transparent to-black/40" />
        <div className="relative z-10">
          <p className="text-[0.5rem] md:text-[0.5625rem] uppercase tracking-[0.3em] text-white/40 mb-4">
            Nouveautes Ete 2026
          </p>
          <h1 className="font-display text-[clamp(2.5rem,6vw,4.5rem)] text-white leading-[0.95] tracking-[-0.02em]">
            La silhouette<br />feminine
          </h1>
          <div className="mt-10 flex gap-6">
            <Link
              href="/femme/nouveautes"
              className="group inline-flex items-center gap-3 border-b border-white/30 pb-2 text-[0.6875rem] font-medium uppercase tracking-[0.2em] text-white/70 hover:text-white hover:border-white/60 transition-all duration-300"
            >
              Nouveautes
              <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
            <Link
              href="/femme/essentiels"
              className="group inline-flex items-center gap-3 border-b border-white/30 pb-2 text-[0.6875rem] font-medium uppercase tracking-[0.2em] text-white/70 hover:text-white hover:border-white/60 transition-all duration-300"
            >
              Essentiels
              <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>

      <section className="relative h-screen flex items-end p-12 md:p-20"
        style={{
          background: 'linear-gradient(135deg, #c4b5a5 0%, #a49585 100%)',
        }}
      >
        <div className="absolute inset-0 bg-radial from-transparent to-black/40" />
        <div className="relative z-10 max-w-xl">
          <p className="text-[0.5rem] md:text-[0.5625rem] uppercase tracking-[0.3em] text-white/40 mb-4">
            Essentiels
          </p>
          <h2 className="font-display text-[clamp(2rem,5vw,3.5rem)] text-white leading-[1.05] tracking-[-0.01em]">
            La robe<br />signature
          </h2>
          <Link
            href="/femme/essentiels"
            className="group inline-flex items-center gap-3 border-b border-white/30 pb-2 mt-8 text-[0.6875rem] font-medium uppercase tracking-[0.2em] text-white/70 hover:text-white hover:border-white/60 transition-all duration-300"
          >
            Decouvrir
            <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>
      </section>

      <section className="relative h-screen flex items-end p-12 md:p-20"
        style={{
          background: 'linear-gradient(135deg, #a49585 0%, #847565 100%)',
        }}
      >
        <div className="absolute inset-0 bg-radial from-transparent to-black/40" />
        <div className="relative z-10 max-w-xl ml-auto text-right">
          <p className="text-[0.5rem] md:text-[0.5625rem] uppercase tracking-[0.3em] text-white/40 mb-4">
            Silhouettes
          </p>
          <h2 className="font-display text-[clamp(2rem,5vw,3.5rem)] text-white leading-[1.05] tracking-[-0.01em]">
            La puissance<br />du mouvement
          </h2>
          <Link
            href="/femme/silhouettes"
            className="group inline-flex items-center gap-3 border-b border-white/30 pb-2 mt-8 text-[0.6875rem] font-medium uppercase tracking-[0.2em] text-white/70 hover:text-white hover:border-white/60 transition-all duration-300"
          >
            Decouvrir
            <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>
      </section>
    </>
  );
}
```

- [ ] **Step 5: Update Providers to not double-render Header/Footer**

Since gendered layouts now render Header/Footer themselves, update `src/contexts/Providers.tsx` to only render Header/Footer for non-gendered, non-entry, non-checkout paths:

```tsx
function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isCheckout = pathname.startsWith('/checkout');
  const isAuth =
    pathname.startsWith('/connexion') || pathname.startsWith('/inscription');
  const isEntry = pathname === '/';
  const isGendered =
    pathname.startsWith('/homme') || pathname.startsWith('/femme');

  return (
    <>
      <ScrollToTop />
      <div className="flex min-h-screen flex-col">
        {!isCheckout && !isAuth && !isEntry && !isGendered && <Header />}
        <main
          id="main-content"
          className={
            isCheckout || isAuth || isEntry || isGendered
              ? 'flex flex-1 flex-col'
              : 'flex-1'
          }
        >
          {children}
        </main>
        {!isCheckout && !isAuth && !isEntry && !isGendered && <Footer />}
      </div>
    </>
  );
}
```

- [ ] **Step 6: Run build check**

```bash
cd "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/MAISON PVL" && npm run build 2>&1 | tail -30
```

- [ ] **Step 7: Commit**

```bash
git add src/app/\(homme\)/ src/app/\(femme\)/ src/components/layout/GenderedLayout.tsx src/contexts/Providers.tsx
git commit -m "feat: add gendered route groups with transparent header and editorial pages"
```

---

### Task 5: Remove Old HeroSection

**Files:**
- Delete: `src/components/home/HeroSection.tsx`
- Modify: `src/app/page.tsx` (already done — no imports of HeroSection)

- [ ] **Step 1: Verify HeroSection is not imported anywhere**

```bash
grep -r "HeroSection" "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/MAISON PVL/src" --include="*.tsx" --include="*.ts"
```

Expected: No results, or only the file itself.

- [ ] **Step 2: Delete the old component**

```bash
rm "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/MAISON PVL/src/components/home/HeroSection.tsx"
```

- [ ] **Step 3: Commit**

```bash
git rm src/components/home/HeroSection.tsx
git commit -m "refactor: remove old HeroSection, replaced by split entry"
```

---

### Task 6: Verify and Polish

**Files:**
- Modify: `src/app/layout.tsx` (metadata)

- [ ] **Step 1: Update metadata for new brand direction**

Read `src/app/layout.tsx`. The metadata already says "Maison PVL — L'élégance sur mesure" which is correct. No changes needed.

- [ ] **Step 2: Full build and type check**

```bash
cd "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/MAISON PVL" && npm run build 2>&1
```

Expected: Successful build, no errors.

- [ ] **Step 3: Run dev server and test navigation flow**

```bash
cd "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/MAISON PVL" && npm run dev &
```

Test manually:
- `/` → split entry renders, no header, no footer
- `/homme` → men's page renders with transparent header
- `/femme` → women's page renders with transparent header

- [ ] **Step 4: Commit final polish**

```bash
git add -A
git commit -m "chore: final polish and verification"
```
