# Owner Availability Blocking — Design Spec

**Date:** 2026-05-22  
**Status:** Approved  
**Scope:** Option A — Blocage simple avec motifs optionnels

## Summary

Nouvelle fonctionnalité dans le dashboard propriétaire : les owners peuvent bloquer des plages de dates sur leurs villas (usage personnel, maintenance, fermeture saisonnière). Les dates bloquées apparaissent comme indisponibles sur le site public.

## Database

### New table: `owner_blocks`

```sql
CREATE TABLE owner_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  villa_id UUID NOT NULL REFERENCES villas(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT NOT NULL DEFAULT 'Non spécifié',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT owner_blocks_dates_check CHECK (start_date <= end_date)
);

CREATE INDEX idx_owner_blocks_villa ON owner_blocks(villa_id);
```

**Block reasons:** `Non spécifié` (default), `Usage personnel`, `Maintenance`, `Fermeture saisonnière`

### Calendar view update

Modify `booking_calendar_slots` (or create `all_unavailable_slots`) to UNION bookings and owner_blocks:

```sql
SELECT villa_id, start_date, end_date FROM bookings WHERE status IN ('pending','confirmed','paid')
UNION ALL
SELECT villa_id, start_date, end_date FROM owner_blocks;
```

This ensures owner blocks appear as unavailable on the public villa detail page.

### RLS

```sql
-- Owners can manage blocks on their villas
CREATE POLICY owner_blocks_manage ON owner_blocks
  FOR ALL TO authenticated
  USING (villa_id IN (SELECT id FROM villas WHERE owner_id = auth.uid()))
  WITH CHECK (villa_id IN (SELECT id FROM villas WHERE owner_id = auth.uid()));

-- Admins can manage all blocks
CREATE POLICY admin_blocks_manage ON owner_blocks
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
```

## API Routes

Base path: `/api/dashboard/owner-blocks`

### GET `?villaId=X`
- Auth: cookie-based via `getSupabaseServer()`
- Returns all blocks for the given villa, ordered by `start_date`
- Validates user is owner of the villa or admin

### POST
- Body: `{ villaId, start_date, end_date, reason? }`
- Validates: dates not in past, start ≤ end, no overlap with existing blocks
- Refuses if overlapping with existing confirmed/pending bookings (block can't override a real booking)
- Returns created block

### DELETE
- Body: `{ blockId }`
- Validates user is owner of the villa or admin
- Deletes the block

All routes follow the pattern in `update-villa/route.ts`: cookie session + `isStaffAdmin()` + owner check.

## Frontend

### New page: `/dashboard/disponibilites`

**Route:** `app/(proprio)/dashboard/disponibilites/page.tsx`

**Components:**
- `DisponibilitesPage` (server) — fetches blocks + bookings for the owner's villas
- `OwnerCalendar` (client) — interactive calendar with click & drag to select date ranges
- `BlockSidebar` (client) — date inputs, reason dropdown, active blocks list with delete

**User flow:**
1. Owner arrives → villa selector (dropdown if multi-villa)
2. Calendar shows: reserved dates (gold `#D4AF37`), blocked dates (navy `#1A1A2E`), available (white)
3. Click & drag on free dates → sidebar updates with selected range
4. Select reason from dropdown (default: "Non spécifié")
5. Click "Bloquer ces dates" → POST API → calendar refreshes
6. Click `×` on any active block in sidebar → DELETE API → calendar refreshes

### Navigation

Add "Disponibilités" entry in `ProprioMenuItems.ts` between "Mes Villas" and "Réservations":
```
Tableau de bord → Mes Villas → Disponibilités → Réservations → Revenus → Tâches → Statistiques
```

### Visual design

- Calendar: dark navy blocked dates, gold reserved dates, white available with subtle borders
- Sidebar: light grey background, clean form inputs matching existing dashboard style
- Mobile: sidebar collapses below calendar, full-width
- Uses existing dashboard design tokens (navy/gold/offwhite, Playfair Display for headings, rounded-xl borders)

## Edge Cases

| Case | Behavior |
|------|----------|
| Block overlaps existing booking | Refused — show error toast |
| Block dates in the past | Refused — validation error |
| Delete a block during an ongoing booking | Allowed — blocks don't affect existing bookings |
| Owner has multiple villas | Villa selector dropdown at top |
| Owner has zero villas | Empty state message |
| No blocks exist yet | "Aucun blocage" empty state in sidebar |
| Calendar public view | `all_unavailable_slots` includes blocks |

## Files Changed

**New files:**
- `app/(proprio)/dashboard/disponibilites/page.tsx`
- `components/dashboard/proprio/OwnerCalendar.tsx`
- `components/dashboard/proprio/BlockSidebar.tsx`
- `app/api/dashboard/owner-blocks/route.ts`
- `supabase/migrations/20260522_owner_blocks.sql`

**Modified files:**
- `components/dashboard/proprio/ProprioMenuItems.ts` — add nav entry
- `supabase/migrations/tenant_bookings_rls_calendar_fix.sql` — update calendar view (or new migration)
- `app/(proprio)/dashboard/layout.tsx` — no changes needed (layout is generic)

## Out of Scope

- Cancelling/modifying existing bookings (Option B)
- Multi-source color coding (Option C)
- Recurring/repeating blocks
- Email notification to tenants when dates are blocked
- iCal export of owner blocks
