# Kayvilla Corrections Batch — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship ~12 independent corrections across the tenant / admin / proprio spaces and cross-site, in 4 incremental waves.

**Architecture:** Each correction is a self-contained task touching named files. Pure-presentation tasks verify via build + responsive check; logic tasks (SLA, revenue-by-villa, search/sort) are TDD with Vitest. Migrations M1–M3 are applied via Supabase MCP only after Kenneson's explicit go.

**Tech Stack:** Next.js 14 App Router, TypeScript (strict), Tailwind, HeroUI, lucide-react, Supabase, react-markdown, leaflet, Vitest.

**Spec:** `docs/superpowers/specs/2026-06-15-corrections-batch-design.md`

---

## File Structure

**Create:**
- `lib/sla.ts` — env-driven SLA threshold logic + status computation (shared client/server).
- `lib/revenue/revenue-by-villa.ts` — aggregate booking revenue grouped by villa.
- `lib/sla.test.ts`, `lib/revenue/revenue-by-villa.test.ts` — unit tests.
- `components/dashboard/admin/VillaThumb.tsx` — small villa thumbnail (reused in list + history).

**Modify (verified current code):**
- `components/dashboard/shared/DashboardSidebar.tsx` — nav `no-scrollbar` (4.2).
- `app/espace-client/messagerie/page.tsx` — fill height (1.1).
- `components/layout/Navbar.tsx` — header hover (4.1).
- `components/booking/CheckoutView.tsx` (+ its date picker) — calendar overflow (1.2).
- `app/(admin)/admin/villas/page.tsx` — thumbnails (3.2).
- `app/(admin)/admin/reservations/*` (`AdminReservationsDataGrid.tsx`) — search + sort (3.6).
- `app/(admin)/admin/villas/[id]/page.tsx` + `AdminVillaEditClient.tsx` — mini-map, history, new fields (3.3, 3.4, 3.5).
- `app/(admin)/admin/revenus/page.tsx` — per-villa breakdown (3.7).
- `app/(admin)/admin/demandes/page.tsx` — SLA badges/sort/notif (3.8).
- `components/espace-client/RequestForm.tsx` — urgent toggle (3.8).
- `app/(admin)/admin/villas/ajouter/page.tsx` — owner block create + new fields (3.1, 3.5).
- `.env.local.example` — document SLA env vars.

**Migrations (Supabase MCP, after go):** `requests`, `villas`, `owner_blocks`.

---

## Conventions

- Run build: `npm run build`. Run lint: `npm run lint`. Run tests: `npx vitest run <file>`.
- Every task ends with a commit. Commit message footer: `Co-Authored-By: claude-flow <ruv@ruv.net>`.
- Responsive verification = check at 375px (mobile) and 1280px (desktop) widths.
- Reuse existing components; no side-stripes; text ≥ 11px; React hooks before any early return.

---

# WAVE 1 — CSS quick wins (no DB)

### Task 1: Sidebar scroll affordance (4.2)

**Files:**
- Modify: `components/dashboard/shared/DashboardSidebar.tsx:74-77`

- [ ] **Step 1: Apply `no-scrollbar` + max-height to the nav**

The `.no-scrollbar` utility already exists in `app/globals.css:469-471`. The nav already has `overflow-y-auto`. Change the `<nav>` className (line 75) from:

```tsx
        className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-6"
```

to:

```tsx
        className="no-scrollbar min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-6"
```

Because the nav is `flex-1 min-h-0` inside a `h-dvh` flex column with a fixed header and footer, when items exceed the available height the list scrolls and the last visible item is naturally cut mid-row (the ~50% peek). `no-scrollbar` hides the scrollbar on both webkit and Firefox.

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 3: Verify responsive**

Open `/admin`, `/dashboard`, `/espace-client`. With a short viewport, confirm the sidebar nav scrolls, no visible scrollbar, and the next item peeks. This single shared component covers all 3 spaces.

- [ ] **Step 4: Commit**

```bash
git add components/dashboard/shared/DashboardSidebar.tsx
git commit -m "fix(sidebar): hide scrollbar on nav for clean scroll affordance (4.2)

Co-Authored-By: claude-flow <ruv@ruv.net>"
```

---

### Task 2: Messagerie fills the screen (1.1)

**Files:**
- Modify: `app/espace-client/messagerie/page.tsx:127`

The dashboard `<main>` (`components/dashboard/shared/DashboardShell.tsx`) is `flex-1 px-4 py-6 md:px-8 md:py-8` inside a `min-h-dvh` flex column. The page currently caps itself at `min-h-[min(100dvh,900px)]`, which under the header + padding looks small.

- [ ] **Step 1: Make the page container fill available height**

Change line 127 from:

```tsx
    <div className="flex min-h-[min(100dvh,900px)] flex-col">
```

to:

```tsx
    <div className="flex min-h-[calc(100dvh-9rem)] flex-col md:min-h-[calc(100dvh-10rem)]">
```

(Header is ~4rem + main padding `py-6`/`py-8` → ~9–10rem of chrome. This makes the chat fill the viewport while staying inside the padded main.)

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 3: Verify responsive**

Open `/espace-client/messagerie`. Confirm the chat area fills the screen on mobile (375px) and desktop (1280px), no large empty gap below.

- [ ] **Step 4: Commit**

```bash
git add app/espace-client/messagerie/page.tsx
git commit -m "fix(messagerie): chat fills available viewport height (1.1)

Co-Authored-By: claude-flow <ruv@ruv.net>"
```

---

### Task 3: Header hover on homepage (4.1)

**Files:**
- Modify: `components/layout/Navbar.tsx`

- [ ] **Step 1: Inspect current nav links**

Run: `grep -nE "Link|className|hover:" components/layout/Navbar.tsx | head -40`
Identify the desktop nav `<Link>` items (the menu links). Note whether a `hover:` color/underline transition is present.

- [ ] **Step 2: Restore hover effect on nav links**

For each desktop nav link, ensure the className includes a hover transition consistent with the site (gold accent). Add (if missing) to each link's className:

```
transition-colors duration-200 hover:text-gold
```

If the links previously had an animated underline, add a pseudo-underline:

```
relative after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 after:bg-gold after:transition-all after:duration-300 hover:after:w-full
```

Keep it identical across all nav links (DRY — if there's a shared link wrapper, edit it once).

- [ ] **Step 3: Verify build + visual**

Run: `npm run build`
Open `/`, hover each nav link, confirm the gold hover/underline animates. Check mobile menu unaffected.

- [ ] **Step 4: Commit**

```bash
git add components/layout/Navbar.tsx
git commit -m "fix(navbar): restore hover effect on homepage header links (4.1)

Co-Authored-By: claude-flow <ruv@ruv.net>"
```

---

### Task 4: Reservation-flow calendar not cut off (1.2)

**Files:**
- Inspect: `app/book/page.tsx` → renders `components/booking/CheckoutView.tsx`
- Modify: the date-picker container inside `CheckoutView` (the "ajouter des dates" calendar)

- [ ] **Step 1: Locate the calendar container**

Run: `grep -nE "Calendar|RangeCalendar|ajouter|dates|overflow|popover|Popover" components/booking/CheckoutView.tsx`
Find the element wrapping the calendar shown after clicking "ajouter des dates".

- [ ] **Step 2: Ensure the calendar is not clipped**

On the wrapping element(s), ensure no ancestor has `overflow-hidden` clipping the popover, and the calendar container itself uses `overflow-visible` with auto height. If the calendar lives in a popover/dropdown, ensure it has `z-50` and enough width. Concretely, on the calendar wrapper add/confirm:

```
overflow-visible
```

and remove any `overflow-hidden` / fixed `max-h-*` on the immediate parent that truncates the month grid.

- [ ] **Step 3: Verify on mobile + desktop**

Run: `npm run build`
Walk the flow: `/book` → "réserver un séjour" → "ajouter des dates". Confirm the full month grid renders uncut at 375px and 1280px.

- [ ] **Step 4: Commit**

```bash
git add components/booking/CheckoutView.tsx
git commit -m "fix(book): reservation calendar no longer cut off (1.2)

Co-Authored-By: claude-flow <ruv@ruv.net>"
```

---

### Task 5: Verify redundant H2 are gone (2)

**Files:**
- Inspect only: `app/espace-client/{livret,notifications,demandes,checklist,documents}/page.tsx`

- [ ] **Step 1: Grep for redundant H2 under gold labels**

Run:
```bash
grep -rnE "<h2" app/espace-client/livret app/espace-client/notifications app/espace-client/demandes app/espace-client/documents app/espace-client/checklist 2>/dev/null
```
Expected: no H2 duplicating the gold uppercase label (e.g. no "Mes notifications" H2 under a "MES NOTIFICATIONS" label).

- [ ] **Step 2: Fix only if a duplicate remains**

If any page still has a `<h2>` repeating its gold label, remove that `<h2>` line. If none remain, this task is verification-only — no commit needed.

- [ ] **Step 3: Commit (only if a change was made)**

```bash
git add app/espace-client
git commit -m "fix(espace-client): remove leftover redundant H2 under gold label (2)

Co-Authored-By: claude-flow <ruv@ruv.net>"
```

---

# WAVE 2 — Admin light (no DB)

### Task 6: Villa thumbnails in admin list (3.2)

**Files:**
- Create: `components/dashboard/admin/VillaThumb.tsx`
- Modify: `app/(admin)/admin/villas/page.tsx`

- [ ] **Step 1: Create the thumbnail component**

```tsx
// components/dashboard/admin/VillaThumb.tsx
import Image from "next/image";
import { Building2 } from "lucide-react";

export function VillaThumb({
  src,
  alt,
  size = 60,
}: {
  src?: string | null;
  alt: string;
  size?: number;
}) {
  if (!src) {
    return (
      <div
        className="flex shrink-0 items-center justify-center rounded-md border border-navy/10 bg-offwhite text-navy/30"
        style={{ width: size, height: size }}
        aria-hidden
      >
        <Building2 className="h-5 w-5" />
      </div>
    );
  }
  return (
    <Image
      src={src}
      alt={alt}
      width={size}
      height={size}
      className="shrink-0 rounded-md border border-navy/10 object-cover"
      style={{ width: size, height: size }}
    />
  );
}
```

- [ ] **Step 2: Confirm the villa photo field name**

Run: `grep -nE "image_url|image_urls|select\(" "app/(admin)/admin/villas/page.tsx" | head`
Villas expose `image_url` (string) and `image_urls` (array). Use `image_url ?? image_urls?.[0]`.

- [ ] **Step 3: Render the thumbnail in each villa row**

In `app/(admin)/admin/villas/page.tsx`, ensure the select includes `image_url, image_urls`. In the row/card for each villa, add as the first cell:

```tsx
<VillaThumb src={villa.image_url ?? villa.image_urls?.[0]} alt={villa.name} />
```

Import at top: `import { VillaThumb } from "@/components/dashboard/admin/VillaThumb";`

- [ ] **Step 4: Verify build + responsive**

Run: `npm run build`
Open `/admin/villas`. Confirm a ~60px thumbnail (or placeholder) shows per villa, aligned, on mobile + desktop.

- [ ] **Step 5: Commit**

```bash
git add components/dashboard/admin/VillaThumb.tsx "app/(admin)/admin/villas/page.tsx"
git commit -m "feat(admin/villas): thumbnail per villa in list (3.2)

Co-Authored-By: claude-flow <ruv@ruv.net>"
```

---

### Task 7: Reservations search + alphabetical sort (3.6)

**Files:**
- Modify: `components/dashboard/admin/AdminReservationsDataGrid.tsx`

- [ ] **Step 1: Inspect the data grid + booking shape**

Run: `grep -nE "useState|guest_name|reservation|booking_number|reference|id|map\(|filter\(" components/dashboard/admin/AdminReservationsDataGrid.tsx | head -40`
Identify the bookings array, the guest-name field (`guest_name`), and the reservation number field (e.g. `id` / `reference` / `booking_number`).

- [ ] **Step 2: Add a search state + input**

Add near the other `useState` hooks (before any early return):

```tsx
const [search, setSearch] = useState("");
```

Add an input above the table:

```tsx
<input
  type="search"
  value={search}
  onChange={(e) => setSearch(e.target.value)}
  placeholder="Rechercher par nom client ou n° réservation"
  className="mb-4 w-full max-w-sm rounded-lg border border-navy/15 bg-white px-3 py-2 text-sm text-navy placeholder:text-navy/40 focus:border-gold focus:outline-none"
  aria-label="Rechercher une réservation"
/>
```

- [ ] **Step 3: Apply filter + alphabetical sort to the rendered list**

Replace the array used for rendering with a derived, memoized list. Use the actual field names found in Step 1 (shown here as `guest_name` and `id`):

```tsx
const visibleBookings = useMemo(() => {
  const q = search.trim().toLowerCase();
  return [...bookings]
    .filter((b) => {
      if (!q) return true;
      const name = (b.guest_name ?? "").toLowerCase();
      const ref = String(b.id ?? "").toLowerCase();
      return name.includes(q) || ref.includes(q);
    })
    .sort((a, b) =>
      (a.guest_name ?? "").localeCompare(b.guest_name ?? "", "fr", { sensitivity: "base" })
    );
}, [bookings, search]);
```

Add `useMemo` to the React import. Render `visibleBookings.map(...)` instead of `bookings.map(...)`.

- [ ] **Step 4: Verify build + behaviour**

Run: `npm run build`
Open `/admin/reservations`. Confirm typing a name or reservation id filters; default order is alphabetical by client.

- [ ] **Step 5: Commit**

```bash
git add components/dashboard/admin/AdminReservationsDataGrid.tsx
git commit -m "feat(admin/reservations): search by client/ref + alphabetical sort (3.6)

Co-Authored-By: claude-flow <ruv@ruv.net>"
```

---

# WAVE 3 — Admin medium

### Task 8: Per-villa revenue aggregation (3.7)

**Files:**
- Create: `lib/revenue/revenue-by-villa.ts`
- Create: `lib/revenue/revenue-by-villa.test.ts`
- Modify: `app/(admin)/admin/revenus/page.tsx`

- [ ] **Step 1: Write the failing test**

```ts
// lib/revenue/revenue-by-villa.test.ts
import { describe, it, expect } from "vitest";
import { revenueByVilla } from "./revenue-by-villa";

describe("revenueByVilla", () => {
  it("groups gross revenue by villa and sorts desc", () => {
    const bookings = [
      { villa_id: "a", villa_name: "Villa A", price: 1000, cleaning_fee: 100, service_fee: 0, total_price_cents: null },
      { villa_id: "b", villa_name: "Villa B", price: 500, cleaning_fee: 0, service_fee: 0, total_price_cents: null },
      { villa_id: "a", villa_name: "Villa A", price: 200, cleaning_fee: 0, service_fee: 0, total_price_cents: null },
    ];
    const result = revenueByVilla(bookings);
    expect(result).toEqual([
      { villaId: "a", villaName: "Villa A", grossCents: 130000, bookingsCount: 2 },
      { villaId: "b", villaName: "Villa B", grossCents: 50000, bookingsCount: 1 },
    ]);
  });

  it("returns empty array for no bookings", () => {
    expect(revenueByVilla([])).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/revenue/revenue-by-villa.test.ts`
Expected: FAIL — `revenueByVilla` not found.

- [ ] **Step 3: Implement**

```ts
// lib/revenue/revenue-by-villa.ts
import { grossCentsFromBooking, type BookingRevenueInput } from "./booking-revenue";

export type VillaRevenueRow = {
  villaId: string;
  villaName: string;
  grossCents: number;
  bookingsCount: number;
};

type Input = BookingRevenueInput & { villa_id: string; villa_name?: string | null };

export function revenueByVilla(bookings: Input[]): VillaRevenueRow[] {
  const map = new Map<string, VillaRevenueRow>();
  for (const b of bookings) {
    const key = b.villa_id;
    const existing = map.get(key);
    const gross = grossCentsFromBooking(b);
    if (existing) {
      existing.grossCents += gross;
      existing.bookingsCount += 1;
    } else {
      map.set(key, {
        villaId: key,
        villaName: b.villa_name ?? "Villa",
        grossCents: gross,
        bookingsCount: 1,
      });
    }
  }
  return [...map.values()].sort((a, b) => b.grossCents - a.grossCents);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/revenue/revenue-by-villa.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Render the breakdown in the revenue page**

Run: `grep -nE "select\(|bookings|grossCents|total|villa" "app/(admin)/admin/revenus/page.tsx" | head`
Ensure the bookings query selects `villa_id` and the villa name (e.g. `villas(name)`), map each booking to `{ villa_id, villa_name, price, cleaning_fee, service_fee, total_price_cents }`, then below the global total render:

```tsx
{revenueByVilla(rows).map((v) => (
  <div key={v.villaId} className="flex items-center justify-between border-b border-navy/8 py-2 text-sm">
    <span className="text-navy">{v.villaName}</span>
    <span className="font-semibold text-navy">
      {(v.grossCents / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
      <span className="ml-2 text-[11px] font-normal text-navy/45">{v.bookingsCount} résa</span>
    </span>
  </div>
))}
```

Import: `import { revenueByVilla } from "@/lib/revenue/revenue-by-villa";`

- [ ] **Step 6: Verify build + responsive**

Run: `npm run build`
Open `/admin/revenus`. Confirm per-villa breakdown shows beneath the global total, sorted by revenue, on mobile + desktop.

- [ ] **Step 7: Commit**

```bash
git add lib/revenue/revenue-by-villa.ts lib/revenue/revenue-by-villa.test.ts "app/(admin)/admin/revenus/page.tsx"
git commit -m "feat(admin/revenus): per-villa revenue breakdown (3.7)

Co-Authored-By: claude-flow <ruv@ruv.net>"
```

---

### Task 9: Mini-map on villa detail (3.3)

**Files:**
- Modify: `app/(admin)/admin/villas/[id]/page.tsx` (or `AdminVillaEditClient.tsx` if the detail is client-rendered)

- [ ] **Step 1: Confirm VillaLeafletMap props + villa coords**

Run: `grep -nE "lat|lng|latitude|longitude|coordinates|props|export" components/VillaLeafletMap.tsx | head`
Run: `grep -nE "latitude|longitude|lat|lng" types/supabase.ts | head`
Note the prop names the map expects and the villa coordinate columns.

- [ ] **Step 2: Render the map under "Disponibilité"**

`VillaLeafletMap` uses `leaflet`, which requires the browser. If the detail page is a server component, wrap with a dynamic import in a small client boundary:

```tsx
import dynamic from "next/dynamic";
const VillaLeafletMap = dynamic(() => import("@/components/VillaLeafletMap"), { ssr: false });
```

Under the "Disponibilité" section add (use the prop names from Step 1):

```tsx
{villa.latitude != null && villa.longitude != null ? (
  <div className="mt-4 h-[220px] overflow-hidden rounded-xl border border-navy/10 md:h-[280px]">
    <VillaLeafletMap latitude={villa.latitude} longitude={villa.longitude} />
  </div>
) : null}
```

(If the detail is already a client component, import directly without `dynamic`.)

- [ ] **Step 3: Verify build + responsive**

Run: `npm run build`
Open `/admin/villas/<id>`. Confirm a 220–280px map renders under Disponibilité, mobile + desktop, no layout overflow.

- [ ] **Step 4: Commit**

```bash
git add "app/(admin)/admin/villas/[id]"
git commit -m "feat(admin/villa): mini-map under availability (3.3)

Co-Authored-By: claude-flow <ruv@ruv.net>"
```

---

### Task 10: Per-villa booking history (3.4)

**Files:**
- Modify: `app/(admin)/admin/villas/[id]/page.tsx`
- Reuse: `components/dashboard/VillaPastBookingsDrawer.tsx` patterns, `components/dashboard/admin/VillaThumb.tsx`

- [ ] **Step 1: Inspect existing past-bookings drawer for query shape**

Run: `grep -nE "from\(.bookings.|select\(|start_date|end_date|status|villa_id|order" components/dashboard/VillaPastBookingsDrawer.tsx | head`
Reuse the same booking select shape filtered by `villa_id`.

- [ ] **Step 2: Fetch past + upcoming bookings for this villa**

In the villa detail page, add a query:

```tsx
const { data: villaBookings } = await supabase
  .from("bookings")
  .select("id, guest_name, start_date, end_date, status, villas!bookings_villa_id_fkey(image_url)")
  .eq("villa_id", villaId)
  .order("start_date", { ascending: false });

const now = new Date().toISOString();
const upcoming = (villaBookings ?? []).filter((b) => b.end_date >= now);
const past = (villaBookings ?? []).filter((b) => b.end_date < now);
```

- [ ] **Step 3: Render the history with thumbnails**

Add a "Historique" section listing `upcoming` then `past`, each row using `VillaThumb` + dates + status. Example row:

```tsx
{[...upcoming, ...past].map((b) => (
  <div key={b.id} className="flex items-center gap-3 border-b border-navy/8 py-2">
    <VillaThumb src={b.villas?.image_url} alt={b.guest_name ?? "Réservation"} size={48} />
    <div className="min-w-0 flex-1">
      <p className="truncate text-sm text-navy">{b.guest_name ?? "Client"}</p>
      <p className="text-[11px] text-navy/50">
        {new Date(b.start_date).toLocaleDateString("fr-FR")} → {new Date(b.end_date).toLocaleDateString("fr-FR")}
      </p>
    </div>
    <span className="text-[11px] uppercase tracking-wide text-navy/45">{b.status}</span>
  </div>
))}
```

The mini-map from Task 9 already provides the localisation for this villa.

- [ ] **Step 4: Verify build + responsive**

Run: `npm run build`
Open `/admin/villas/<id>`. Confirm upcoming + past bookings list with thumbnails, mobile + desktop.

- [ ] **Step 5: Commit**

```bash
git add "app/(admin)/admin/villas/[id]"
git commit -m "feat(admin/villa): per-villa booking history with thumbnails (3.4)

Co-Authored-By: claude-flow <ruv@ruv.net>"
```

---

# WAVE 4 — Admin heavy (DB)

> **GATE:** Migrations M1–M3 require Kenneson's explicit go before applying via Supabase MCP. Tasks below assume migrations are applied; types are regenerated with `mcp__claude_ai_Supabase__generate_typescript_types` into `types/supabase.ts`.

### Task 11: Migration M3 — owner_blocks.origin + admin block creation (3.1)

**Files:**
- Migration: `owner_blocks`
- Modify: `app/(admin)/admin/villas/ajouter/page.tsx` or the admin disponibilité view; block-list display component

- [ ] **Step 1: Apply migration M3 (after go)**

SQL (via Supabase MCP `apply_migration`, name `add_owner_blocks_origin`):

```sql
ALTER TABLE owner_blocks ADD COLUMN IF NOT EXISTS origin text NOT NULL DEFAULT 'Propriétaire';
```

`reason` already exists (default `'Non spécifié'`) and is reused as "Motif".

- [ ] **Step 2: Regenerate types**

Use `mcp__claude_ai_Supabase__generate_typescript_types`, write result to `types/supabase.ts`. Confirm `owner_blocks` Row now has `origin: string`.

- [ ] **Step 3: Locate the block-create call**

Run: `grep -rnE "owner_blocks|insert\(|reason" app components lib | grep -i block | head`
Find where a block is inserted (proprio `BlockSidebar` and any admin path).

- [ ] **Step 4: Set origin on insert + expose Motif field**

When a block is created from the admin context, include `origin: "Kayvila"`; from proprio, `origin: "Propriétaire"` (or rely on the default). Ensure the create form has a free-text "Motif" bound to `reason`.

- [ ] **Step 5: Display Motif + Origine in the block list**

In the active-blocks list, show each block's `reason` (Motif) and an `origin` badge:

```tsx
<span className="rounded bg-navy/8 px-2 py-0.5 text-[11px] text-navy/60">{block.origin}</span>
<span className="text-[11px] text-navy/50">{block.reason}</span>
```

- [ ] **Step 6: Verify build + behaviour**

Run: `npm run build`
Create a block as admin → origin "Kayvila" with motif shows in the list. Create as proprio → "Propriétaire".

- [ ] **Step 7: Commit**

```bash
git add types/supabase.ts app components
git commit -m "feat(blocks): motif + origine (Kayvila/Proprietaire) on date blocks (3.1)

Co-Authored-By: claude-flow <ruv@ruv.net>"
```

---

### Task 12: Migration M2 — villa fields in add/edit form (3.5)

**Files:**
- Migration: `villas`
- Modify: `app/(admin)/admin/villas/ajouter/page.tsx`, `app/(admin)/admin/villas/[id]/AdminVillaEditClient.tsx`

- [ ] **Step 1: Apply migration M2 (after go)**

SQL (`apply_migration`, name `add_villa_bedrooms_and_manual_pdf`):

```sql
ALTER TABLE villas ADD COLUMN IF NOT EXISTS bedrooms_count int;
ALTER TABLE villas ADD COLUMN IF NOT EXISTS house_manual_pdf_url text;
```

Existing columns reused: `bathrooms_count`, `amenities`, `equipment_interior`, `equipment_exterior`, `house_rules`, `safety_info`, `cancellation_policy`, `house_manual`.

- [ ] **Step 2: Regenerate types**

`generate_typescript_types` → `types/supabase.ts`. Confirm `bedrooms_count` and `house_manual_pdf_url` present.

- [ ] **Step 3: Add the form fields (add + edit)**

In both forms add controls bound to the columns:
- Livret PDF: file upload → store URL in `house_manual_pdf_url` (reuse the existing villa upload route `app/api/villa-photo-upload` pattern or Supabase Storage; confirm with `grep -rn "villa-photo-upload\|storage.from" lib app | head`).
- Dedicated "Ajouter des photos" button (reuse existing photo upload control).
- Équipements: checklist/text bound to `amenities` / `equipment_interior` / `equipment_exterior`.
- Nb chambres: numeric input → `bedrooms_count`. Nb salles de bain: numeric → `bathrooms_count`.
- Règlement intérieur: `<textarea>` → `house_rules`.
- Sécurité et logement: `<textarea>` → `safety_info`.
- Conditions d'annulation: `<textarea>` → `cancellation_policy` + a link input.

Each rich field is a plain `<textarea>`; rendering elsewhere uses `react-markdown`.

- [ ] **Step 4: Markdown render where these fields are displayed**

Where these fields render to users (villa public page / livret), wrap with:

```tsx
import ReactMarkdown from "react-markdown";
// ...
<ReactMarkdown>{villa.house_rules ?? ""}</ReactMarkdown>
```

- [ ] **Step 5: Verify build + round-trip**

Run: `npm run build`
Add/edit a villa, fill every new field + upload a PDF, save, reopen → values persisted. Mobile + desktop.

- [ ] **Step 6: Commit**

```bash
git add types/supabase.ts "app/(admin)/admin/villas"
git commit -m "feat(admin/villas): expose equipements, chambres, reglement, securite, annulation, livret PDF (3.5)

Co-Authored-By: claude-flow <ruv@ruv.net>"
```

---

### Task 13: Migration M1 + SLA logic library (3.8a)

**Files:**
- Migration: `requests`
- Create: `lib/sla.ts`, `lib/sla.test.ts`
- Modify: `.env.local.example`

- [ ] **Step 1: Apply migration M1 (after go)**

SQL (`apply_migration`, name `add_requests_sla_fields`):

```sql
ALTER TABLE requests ADD COLUMN IF NOT EXISTS priority text NOT NULL DEFAULT 'standard';
ALTER TABLE requests ADD COLUMN IF NOT EXISTS taken_at timestamptz;
ALTER TABLE requests ADD COLUMN IF NOT EXISTS resolved_at timestamptz;
```

Regenerate types → `types/supabase.ts`.

- [ ] **Step 2: Document env vars (client-readable → NEXT_PUBLIC_)**

Add to `.env.local.example`:

```
# SLA thresholds (hours / percent) — read client-side, must be NEXT_PUBLIC_
NEXT_PUBLIC_SLA_URGENT_TAKEN_HOURS=2
NEXT_PUBLIC_SLA_URGENT_RESOLVE_HOURS=24
NEXT_PUBLIC_SLA_STANDARD_TAKEN_HOURS=8
NEXT_PUBLIC_SLA_STANDARD_RESOLVE_HOURS=48
NEXT_PUBLIC_SLA_STANDARD_REMINDER_HOURS=6
NEXT_PUBLIC_SLA_WARN_PERCENT=75
```

Add the same keys (real values) to `.env.local`.

- [ ] **Step 3: Write the failing test**

```ts
// lib/sla.test.ts
import { describe, it, expect } from "vitest";
import { slaThresholds, getSlaStatus } from "./sla";

const HOUR = 3600_000;

describe("slaThresholds", () => {
  it("returns urgent thresholds", () => {
    expect(slaThresholds("urgent").resolveHours).toBe(24);
    expect(slaThresholds("urgent").takenHours).toBe(2);
  });
  it("returns standard thresholds", () => {
    expect(slaThresholds("standard").resolveHours).toBe(48);
  });
});

describe("getSlaStatus", () => {
  const now = new Date("2026-06-15T12:00:00Z");
  it("is ok when fresh", () => {
    const s = getSlaStatus({ createdAt: new Date(now.getTime() - 1 * HOUR).toISOString(), priority: "standard", resolvedAt: null }, now);
    expect(s.level).toBe("ok");
  });
  it("is warn at >=75% of resolve window", () => {
    const s = getSlaStatus({ createdAt: new Date(now.getTime() - 37 * HOUR).toISOString(), priority: "standard", resolvedAt: null }, now);
    expect(s.level).toBe("warn");
  });
  it("is over past the resolve window", () => {
    const s = getSlaStatus({ createdAt: new Date(now.getTime() - 49 * HOUR).toISOString(), priority: "standard", resolvedAt: null }, now);
    expect(s.level).toBe("over");
  });
  it("resolved requests are always ok", () => {
    const s = getSlaStatus({ createdAt: new Date(now.getTime() - 100 * HOUR).toISOString(), priority: "urgent", resolvedAt: now.toISOString() }, now);
    expect(s.level).toBe("ok");
  });
});
```

- [ ] **Step 4: Run test to verify it fails**

Run: `npx vitest run lib/sla.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 5: Implement `lib/sla.ts`**

```ts
// lib/sla.ts
export type Priority = "standard" | "urgent";

const num = (v: string | undefined, fallback: number) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

export function slaThresholds(priority: Priority) {
  if (priority === "urgent") {
    return {
      takenHours: num(process.env.NEXT_PUBLIC_SLA_URGENT_TAKEN_HOURS, 2),
      resolveHours: num(process.env.NEXT_PUBLIC_SLA_URGENT_RESOLVE_HOURS, 24),
    };
  }
  return {
    takenHours: num(process.env.NEXT_PUBLIC_SLA_STANDARD_TAKEN_HOURS, 8),
    resolveHours: num(process.env.NEXT_PUBLIC_SLA_STANDARD_RESOLVE_HOURS, 48),
  };
}

export const slaReminderHours = () => num(process.env.NEXT_PUBLIC_SLA_STANDARD_REMINDER_HOURS, 6);
export const slaWarnPercent = () => num(process.env.NEXT_PUBLIC_SLA_WARN_PERCENT, 75);

export type SlaInput = {
  createdAt: string;
  priority: Priority;
  resolvedAt?: string | null;
};

export type SlaStatus = {
  level: "ok" | "warn" | "over";
  elapsedHours: number;
  ratio: number; // 0..1+ of resolve window
};

export function getSlaStatus(input: SlaInput, now: Date = new Date()): SlaStatus {
  if (input.resolvedAt) return { level: "ok", elapsedHours: 0, ratio: 0 };
  const { resolveHours } = slaThresholds(input.priority);
  const elapsedHours = (now.getTime() - new Date(input.createdAt).getTime()) / 3600_000;
  const ratio = elapsedHours / resolveHours;
  const warn = slaWarnPercent() / 100;
  const level = ratio >= 1 ? "over" : ratio >= warn ? "warn" : "ok";
  return { level, elapsedHours, ratio };
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npx vitest run lib/sla.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 7: Commit**

```bash
git add lib/sla.ts lib/sla.test.ts .env.local.example types/supabase.ts
git commit -m "feat(sla): env-driven thresholds + status helper, requests SLA columns (3.8a)

Co-Authored-By: claude-flow <ruv@ruv.net>"
```

---

### Task 14: Urgent toggle on client request form (3.8b)

**Files:**
- Modify: `components/espace-client/RequestForm.tsx`

- [ ] **Step 1: Inspect the form's insert payload**

Run: `grep -nE "useState|insert\(|from\(.requests.|type|message" components/espace-client/RequestForm.tsx | head`
Find the `requests` insert and the form state.

- [ ] **Step 2: Add the urgent toggle state + control**

Add (before any early return):

```tsx
const [urgent, setUrgent] = useState(false);
```

Add the control inside the form:

```tsx
<label className="mt-3 flex items-start gap-2 text-sm text-navy/80">
  <input
    type="checkbox"
    checked={urgent}
    onChange={(e) => setUrgent(e.target.checked)}
    className="mt-0.5 accent-gold"
  />
  <span>
    <span className="inline-flex items-center gap-1 font-medium text-navy">⚡ Demande urgente</span>
    <span className="block text-[11px] text-navy/50">À cocher si votre besoin est dans les 24h.</span>
  </span>
</label>
```

- [ ] **Step 3: Include priority in the insert**

In the `requests` insert object, add:

```tsx
priority: urgent ? "urgent" : "standard",
```

- [ ] **Step 4: Verify build + insert**

Run: `npm run build`
Submit a request with the toggle on → row has `priority = 'urgent'`.

- [ ] **Step 5: Commit**

```bash
git add components/espace-client/RequestForm.tsx
git commit -m "feat(demandes): client urgent toggle sets request priority (3.8b)

Co-Authored-By: claude-flow <ruv@ruv.net>"
```

---

### Task 15: Admin demandes — SLA badges, sort, in-app notification (3.8c)

**Files:**
- Modify: `app/(admin)/admin/demandes/page.tsx`

- [ ] **Step 1: Add SLA columns to the query**

In `fetchRequests`, change the select to include the new columns:

```tsx
.select("id, type, status, priority, taken_at, resolved_at, message, admin_response, created_at, booking_id, guest_id, assignee_id, bookings(villa_id, villas!bookings_villa_id_fkey(name), guest_name, start_date, end_date)")
```

- [ ] **Step 2: Replace the hardcoded `getSlaBadge` with the shared helper**

Remove the local `getSlaBadge` (lines ~8-22) and import:

```tsx
import { getSlaStatus, slaThresholds } from "@/lib/sla";
import { timeAgo } from "@/lib/utils";
```

Derive per-request status: `const sla = getSlaStatus({ createdAt: r.created_at, priority: r.priority ?? "standard", resolvedAt: r.resolved_at });`

Map level → color:

```tsx
const SLA_LEVEL_COLOR = {
  ok: "bg-emerald-50 text-emerald-700",
  warn: "bg-amber-50 text-amber-700",
  over: "bg-red-50 text-red-700",
} as const;
```

- [ ] **Step 3: Render badges per card**

Per request card show: ⚡ URGENT badge when `r.priority === "urgent"` (red), elapsed via `timeAgo(r.created_at)` ("Il y a Xh"), and a 🟢/🟠/🔴 dot via `SLA_LEVEL_COLOR[sla.level]`.

```tsx
{r.priority === "urgent" && (
  <span className="rounded bg-red-600 px-2 py-0.5 text-[11px] font-bold uppercase text-white">⚡ Urgent</span>
)}
<span className={cn("rounded px-2 py-0.5 text-[11px] font-medium", SLA_LEVEL_COLOR[sla.level])}>
  {timeAgo(r.created_at)}
</span>
```

- [ ] **Step 4: Sort overdue/urgent to the top**

Render a derived, memoized list instead of `requests.map`:

```tsx
const rank = (r: any) => {
  const sla = getSlaStatus({ createdAt: r.created_at, priority: r.priority ?? "standard", resolvedAt: r.resolved_at });
  if (sla.level === "over") return 0;
  if (r.priority === "urgent" && !r.resolved_at) return 1;
  if (sla.level === "warn") return 2;
  return 3;
};
const sortedRequests = useMemo(
  () => [...requests].sort((a, b) => rank(a) - rank(b) || new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
  [requests]
);
```

Add `useMemo` and `cn` (`@/lib/utils`) imports. Render `sortedRequests.map(...)`.

- [ ] **Step 5: In-app notification on urgent creation**

In `components/espace-client/RequestForm.tsx` (from Task 14), after a successful insert where `urgent`, insert an admin notification (reuse the existing `notifications` table + the admin-notify pattern used for new requests — confirm with `grep -rn "from(\"notifications\")" components app | head`):

```tsx
if (urgent) {
  await supabase.from("notifications").insert({
    type: "request_urgent",
    title: "⚡ Demande urgente",
    message: `Nouvelle demande urgente: ${typeLabel}`,
    // admin-targeting per existing pattern (user_id null / role-based)
  });
}
```

Match the exact columns the existing notification inserts use (do not invent columns). No email is sent (NE PAS TOUCHER).

- [ ] **Step 6: Verify build + behaviour**

Run: `npm run build`
Create an urgent request → appears at top with ⚡ + red, admin notification fires. Let a standard request age past 75% → 🟠, past 100% → 🔴 and floats up. The 6h "standard reminder" is reflected by the colour/sort computed at render (no cron).

- [ ] **Step 7: Commit**

```bash
git add "app/(admin)/admin/demandes/page.tsx" components/espace-client/RequestForm.tsx
git commit -m "feat(admin/demandes): SLA badges, overdue sort, urgent in-app notification (3.8c)

Co-Authored-By: claude-flow <ruv@ruv.net>"
```

---

## Final verification

- [ ] Run full build: `npm run build` — succeeds.
- [ ] Run lint: `npm run lint` — no new errors.
- [ ] Run unit tests: `npx vitest run lib/sla.test.ts lib/revenue/revenue-by-villa.test.ts` — all pass.
- [ ] Manual responsive pass (375px + 1280px) on each touched screen.
- [ ] Update `docs/auto-learn/LEARNINGS.md` with a dated entry summarizing the batch.
