# Owner Availability Blocking — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a new "Disponibilités" page in the owner dashboard where villa owners can block date ranges on their villas (personal use, maintenance, seasonal closure), making those dates unavailable on the public site.

**Architecture:** New `owner_blocks` table (clean separation from bookings), a single API route handling GET/POST/DELETE, an updated `booking_calendar_slots` view that UNIONs blocks with bookings, and a new dashboard page with calendar + sidebar. All follows existing patterns: cookie-based auth + `isStaffAdmin()` + owner check.

**Tech Stack:** Next.js 14 App Router, Supabase (Postgres + Auth + RLS), FullCalendar (@fullcalendar/react), Tailwind CSS, TypeScript

---

## File Structure

```
Created:
  supabase/migrations/20260522_owner_blocks.sql
  app/api/dashboard/owner-blocks/route.ts
  components/dashboard/proprio/OwnerCalendar.tsx
  components/dashboard/proprio/BlockSidebar.tsx
  app/(proprio)/dashboard/disponibilites/page.tsx

Modified:
  components/dashboard/proprio/ProprioMenuItems.ts
  supabase/migrations/tenant_bookings_rls_calendar_fix.sql  (via new migration)
  components/booking/AvailabilityCalendar.tsx
```

---

### Task 1: Database Migration — owner_blocks table

**Files:**
- Create: `supabase/migrations/20260522_owner_blocks.sql`

- [ ] **Step 1: Write the migration**

```sql
-- ============================================================
-- Migration: owner_blocks — propriétaire bloque des dates
-- ============================================================

-- 1. Table des blocs propriétaires
CREATE TABLE IF NOT EXISTS public.owner_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  villa_id UUID NOT NULL REFERENCES public.villas(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT NOT NULL DEFAULT 'Non spécifié',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT owner_blocks_dates_check CHECK (start_date <= end_date)
);

CREATE INDEX IF NOT EXISTS idx_owner_blocks_villa ON public.owner_blocks(villa_id);

-- 2. Update calendar view to include owner blocks (so public sees them as unavailable)
DROP VIEW IF EXISTS public.all_unavailable_slots;
CREATE OR REPLACE VIEW public.booking_calendar_slots
WITH (security_invoker = false)
AS
SELECT villa_id, start_date, end_date FROM public.bookings WHERE status IN ('pending', 'confirmed', 'paid')
UNION ALL
SELECT villa_id, start_date, end_date FROM public.owner_blocks;

GRANT SELECT ON public.booking_calendar_slots TO anon, authenticated, service_role;

-- 3. RLS for owner_blocks
ALTER TABLE public.owner_blocks ENABLE ROW LEVEL SECURITY;

-- Owners can manage blocks on their own villas
DROP POLICY IF EXISTS "owner_blocks_manage" ON public.owner_blocks;
CREATE POLICY "owner_blocks_manage" ON public.owner_blocks
  FOR ALL TO authenticated
  USING (villa_id IN (SELECT id FROM public.villas WHERE owner_id = auth.uid()))
  WITH CHECK (villa_id IN (SELECT id FROM public.villas WHERE owner_id = auth.uid()));

-- Admins can manage all blocks
DROP POLICY IF EXISTS "admin_blocks_manage" ON public.owner_blocks;
CREATE POLICY "admin_blocks_manage" ON public.owner_blocks
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
```

- [ ] **Step 2: Run migration in Supabase SQL Editor**

Copy-paste the entire migration into Supabase Dashboard → SQL Editor → Run.

- [ ] **Step 3: Verify**

```sql
SELECT table_name FROM information_schema.tables WHERE table_name = 'owner_blocks';
-- Should return 1 row

SELECT * FROM booking_calendar_slots LIMIT 1;
-- Should still work (view is compatible)
```

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260522_owner_blocks.sql
git commit -m "feat: add owner_blocks table and update calendar view"
```

---

### Task 2: API Route — owner-blocks CRUD

**Files:**
- Create: `app/api/dashboard/owner-blocks/route.ts`

- [ ] **Step 1: Write the route handler**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase";
import { isStaffAdmin } from "@/lib/auth/admin-access";

export const runtime = "nodejs";

// GET /api/dashboard/owner-blocks?villaId=X
export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const villaId = searchParams.get("villaId");
    if (!villaId) return NextResponse.json({ error: "Missing villaId" }, { status: 400 });

    const admin = supabaseAdmin();
    const { data: profile } = await admin
      .from("profiles").select("role").eq("id", user.id).maybeSingle();
    const isAdmin = isStaffAdmin(profile?.role, user.user_metadata?.role as string | undefined, user.email);

    // Verify ownership or admin
    if (!isAdmin) {
      const { data: villa } = await admin
        .from("villas").select("owner_id").eq("id", villaId).single();
      if (!villa || villa.owner_id !== user.id) {
        return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
      }
    }

    const { data, error } = await admin
      .from("owner_blocks")
      .select("*")
      .eq("villa_id", villaId)
      .order("start_date", { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ blocks: data ?? [] });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Server error" }, { status: 500 });
  }
}

// POST /api/dashboard/owner-blocks
export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

    const body = await request.json();
    const { villaId, start_date, end_date, reason } = body;

    if (!villaId || !start_date || !end_date) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const start = new Date(start_date);
    const end = new Date(end_date);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json({ error: "Invalid dates" }, { status: 400 });
    }
    if (start > end) {
      return NextResponse.json({ error: "start_date must be <= end_date" }, { status: 400 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (start < today) {
      return NextResponse.json({ error: "Cannot block dates in the past" }, { status: 400 });
    }

    const admin = supabaseAdmin();
    const { data: profile } = await admin
      .from("profiles").select("role").eq("id", user.id).maybeSingle();
    const isAdmin = isStaffAdmin(profile?.role, user.user_metadata?.role as string | undefined, user.email);

    if (!isAdmin) {
      const { data: villa } = await admin
        .from("villas").select("owner_id").eq("id", villaId).single();
      if (!villa || villa.owner_id !== user.id) {
        return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
      }
    }

    // Check no overlap with existing blocks
    const { data: overlappingBlocks } = await admin
      .from("owner_blocks")
      .select("id")
      .eq("villa_id", villaId)
      .lte("start_date", end_date)
      .gte("end_date", start_date);

    if (overlappingBlocks && overlappingBlocks.length > 0) {
      return NextResponse.json({ error: "Ces dates chevauchent un blocage existant" }, { status: 409 });
    }

    // Check no overlap with confirmed/paid bookings
    const { data: overlappingBookings } = await admin
      .from("bookings")
      .select("id")
      .eq("villa_id", villaId)
      .in("status", ["pending", "confirmed", "paid"])
      .lte("start_date", end_date)
      .gte("end_date", start_date);

    if (overlappingBookings && overlappingBookings.length > 0) {
      return NextResponse.json({ error: "Ces dates chevauchent une réservation existante" }, { status: 409 });
    }

    const blockReason = reason?.trim() || "Non spécifié";
    const { data, error } = await admin
      .from("owner_blocks")
      .insert({ villa_id: villaId, start_date, end_date, reason: blockReason })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ block: data }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Server error" }, { status: 500 });
  }
}

// DELETE /api/dashboard/owner-blocks
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

    const body = await request.json();
    const { blockId } = body;
    if (!blockId) return NextResponse.json({ error: "Missing blockId" }, { status: 400 });

    const admin = supabaseAdmin();

    // Fetch block to get villa_id
    const { data: block } = await admin
      .from("owner_blocks").select("villa_id").eq("id", blockId).single();
    if (!block) return NextResponse.json({ error: "Block not found" }, { status: 404 });

    const { data: profile } = await admin
      .from("profiles").select("role").eq("id", user.id).maybeSingle();
    const isAdmin = isStaffAdmin(profile?.role, user.user_metadata?.role as string | undefined, user.email);

    if (!isAdmin) {
      const { data: villa } = await admin
        .from("villas").select("owner_id").eq("id", block.villa_id).single();
      if (!villa || villa.owner_id !== user.id) {
        return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
      }
    }

    const { error } = await admin.from("owner_blocks").delete().eq("id", blockId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Server error" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Run TypeScript check**

```bash
cd diamant-noir && npx tsc --noEmit --pretty 2>&1 | head -20
```
Expected: clean (no errors related to this file)

- [ ] **Step 3: Commit**

```bash
git add app/api/dashboard/owner-blocks/route.ts
git commit -m "feat: add owner-blocks CRUD API route"
```

---

### Task 3: OwnerCalendar Component

**Files:**
- Create: `components/dashboard/proprio/OwnerCalendar.tsx`

- [ ] **Step 1: Write the component**

```typescript
"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import frLocale from "@fullcalendar/core/locales/fr";
import type { DateSelectArg } from "@fullcalendar/core";

const FullCalendar = dynamic(() => import("@fullcalendar/react"), { ssr: false });

interface Block {
  id: string;
  villa_id: string;
  start_date: string;
  end_date: string;
  reason: string;
}

interface Booking {
  start_date: string;
  end_date: string;
}

interface Props {
  villaId: string;
  blocks: Block[];
  bookings: Booking[];
  onDatesSelect: (start: string, end: string) => void;
}

const BLOCK_COLOR = "#1A1A2E";
const BOOKING_COLOR = "#D4AF37";

export function OwnerCalendar({ villaId, blocks, bookings, onDatesSelect }: Props) {
  const [events, setEvents] = useState<Array<{ start: string; end: string; display: string; color: string }>>([]);

  useEffect(() => {
    const blockEvents = blocks.map((b) => ({
      start: b.start_date,
      end: b.end_date,
      display: "background" as const,
      color: BLOCK_COLOR,
      extendedProps: { type: "block", blockId: b.id, reason: b.reason },
    }));

    const bookingEvents = bookings.map((b) => ({
      start: b.start_date,
      end: b.end_date,
      display: "background" as const,
      color: BOOKING_COLOR,
      extendedProps: { type: "booking" },
    }));

    setEvents([...blockEvents, ...bookingEvents]);
  }, [blocks, bookings]);

  const handleSelect = useCallback(
    (info: DateSelectArg) => {
      const start = info.startStr;
      const end = info.endStr;
      onDatesSelect(start, end);
    },
    [onDatesSelect]
  );

  return (
    <div className="w-full">
      <FullCalendar
        key={villaId}
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        locales={[frLocale]}
        locale="fr"
        selectable
        selectMirror
        select={handleSelect}
        events={events}
        height="auto"
        headerToolbar={{
          left: "prev",
          center: "title",
          right: "next",
        }}
        buttonText={{ today: "Aujourd'hui" }}
        titleFormat={{ year: "numeric", month: "long" }}
        dayHeaderFormat={{ weekday: "short" }}
        firstDay={1}
        showNonCurrentDates={false}
        fixedWeekCount={false}
      />
      <style jsx global>{`
        .fc {
          font-family: var(--font-body);
        }
        .fc .fc-toolbar-title {
          font-family: var(--font-display);
          font-size: 1.1rem;
          font-weight: 600;
          color: #1A1A2E;
        }
        .fc .fc-button {
          background: transparent;
          border: 1px solid rgba(26, 26, 46, 0.15);
          color: #1A1A2E;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          border-radius: 0.5rem;
          padding: 0.4rem 0.75rem;
        }
        .fc .fc-button:hover {
          background: rgba(26, 26, 46, 0.05);
        }
        .fc .fc-button-primary:not(:disabled).fc-button-active {
          background: #1A1A2E;
          border-color: #1A1A2E;
          color: #fff;
        }
        .fc .fc-daygrid-day.fc-day-today {
          background: rgba(212, 175, 55, 0.06);
        }
        .fc .fc-daygrid-day-number {
          font-size: 0.75rem;
          color: #1A1A2E;
        }
        .fc .fc-col-header-cell {
          font-size: 0.65rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.2em;
          color: rgba(26, 26, 46, 0.4);
          padding: 0.75rem 0;
          border: none;
        }
        .fc .fc-scrollgrid, .fc .fc-scrollgrid td {
          border-color: rgba(26, 26, 46, 0.06);
        }
        .fc .fc-highlight {
          background: rgba(212, 175, 55, 0.2) !important;
        }
      `}</style>
    </div>
  );
}
```

- [ ] **Step 2: Run TypeScript check**

```bash
cd diamant-noir && npx tsc --noEmit --pretty 2>&1 | head -20
```
Expected: clean

- [ ] **Step 3: Commit**

```bash
git add components/dashboard/proprio/OwnerCalendar.tsx
git commit -m "feat: add OwnerCalendar component for blocking UI"
```

---

### Task 4: BlockSidebar Component

**Files:**
- Create: `components/dashboard/proprio/BlockSidebar.tsx`

- [ ] **Step 1: Write the component**

```typescript
"use client";

import { useState, useCallback } from "react";
import { X, Loader2 } from "lucide-react";

interface Block {
  id: string;
  villa_id: string;
  start_date: string;
  end_date: string;
  reason: string;
}

interface Props {
  selectedStart: string | null;
  selectedEnd: string | null;
  activeBlocks: Block[];
  onBlock: (start: string, end: string, reason: string) => Promise<void>;
  onDelete: (blockId: string) => Promise<void>;
  loading: boolean;
}

const REASONS = ["Non spécifié", "Usage personnel", "Maintenance", "Fermeture saisonnière"];

function formatDate(d: string): string {
  return new Date(d + "T00:00:00").toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function BlockSidebar({
  selectedStart,
  selectedEnd,
  activeBlocks,
  onBlock,
  onDelete,
  loading,
}: Props) {
  const [reason, setReason] = useState("Non spécifié");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleBlock = useCallback(async () => {
    if (!selectedStart || !selectedEnd) return;
    await onBlock(selectedStart, selectedEnd, reason);
  }, [selectedStart, selectedEnd, reason, onBlock]);

  const handleDelete = useCallback(
    async (blockId: string) => {
      setDeletingId(blockId);
      await onDelete(blockId);
      setDeletingId(null);
    },
    [onDelete]
  );

  return (
    <div className="rounded-2xl border border-navy/8 bg-navy/[0.015] p-5 md:p-6">
      <h3 className="font-display text-base font-semibold text-navy mb-4">
        Bloquer des dates
      </h3>

      {/* Selected range */}
      {selectedStart && selectedEnd ? (
        <div className="mb-5 space-y-3">
          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-navy/40">
              Du
            </label>
            <p className="text-sm text-navy font-medium">{formatDate(selectedStart)}</p>
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-navy/40">
              Au
            </label>
            <p className="text-sm text-navy font-medium">{formatDate(selectedEnd)}</p>
          </div>

          <div>
            <label htmlFor="block-reason" className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-navy/40">
              Motif
            </label>
            <select
              id="block-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-xl border border-navy/10 bg-white px-4 py-3 text-sm focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20"
            >
              {REASONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleBlock}
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-navy px-5 py-3 text-xs font-bold uppercase tracking-[0.2em] text-white transition-colors hover:bg-navy/90 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : null}
            {loading ? "Création…" : "Bloquer ces dates"}
          </button>
        </div>
      ) : (
        <div className="mb-5 rounded-xl border border-navy/8 bg-white px-4 py-8 text-center">
          <p className="text-xs text-navy/40">
            Sélectionnez des dates sur le calendrier pour les bloquer.
          </p>
        </div>
      )}

      {/* Active blocks */}
      <div className="border-t border-navy/8 pt-4">
        <h4 className="text-[10px] font-bold uppercase tracking-[0.25em] text-navy/30 mb-3">
          Blocs actifs
        </h4>
        {activeBlocks.length === 0 ? (
          <p className="text-xs text-navy/30 italic">Aucun blocage</p>
        ) : (
          <ul className="space-y-1">
            {activeBlocks.map((block) => (
              <li
                key={block.id}
                className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-navy/[0.03]"
              >
                <div>
                  <p className="text-xs font-medium text-navy">
                    {formatDate(block.start_date)} – {formatDate(block.end_date)}
                  </p>
                  <p className="text-[10px] text-navy/35">{block.reason}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(block.id)}
                  disabled={deletingId === block.id}
                  className="tap-target flex items-center justify-center rounded-lg text-navy/25 transition-colors hover:text-red-500 hover:bg-red-50 disabled:opacity-50"
                  aria-label={`Supprimer le bloc du ${formatDate(block.start_date)} au ${formatDate(block.end_date)}`}
                >
                  {deletingId === block.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <X className="h-4 w-4" />
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Run TypeScript check**

```bash
cd diamant-noir && npx tsc --noEmit --pretty 2>&1 | head -20
```
Expected: clean

- [ ] **Step 3: Commit**

```bash
git add components/dashboard/proprio/BlockSidebar.tsx
git commit -m "feat: add BlockSidebar component for date blocking form"
```

---

### Task 5: Disponibilites Page (Server + Client)

**Files:**
- Create: `app/(proprio)/dashboard/disponibilites/page.tsx`

- [ ] **Step 1: Write the page**

```typescript
import { getSupabaseServer } from "@/lib/supabase-server";
import { DisponibilitesClient } from "./DisponibilitesClient";

export const dynamic = "force-dynamic";

export default async function DisponibilitesPage() {
  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Fetch owner's villas
  const { data: villas } = await supabase
    .from("villas")
    .select("id, name")
    .eq("owner_id", user.id)
    .order("name");

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-navy-900">Disponibilités</h1>
      <DisponibilitesClient villas={villas ?? []} />
    </div>
  );
}
```

- [ ] **Step 2: Write the client component**

Create: `app/(proprio)/dashboard/disponibilites/DisponibilitesClient.tsx`

```typescript
"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { OwnerCalendar } from "@/components/dashboard/proprio/OwnerCalendar";
import { BlockSidebar } from "@/components/dashboard/proprio/BlockSidebar";
import { getSupabaseBrowser } from "@/lib/supabase";
import { Check, AlertTriangle } from "lucide-react";

interface VillaItem {
  id: string;
  name: string;
}

interface Block {
  id: string;
  villa_id: string;
  start_date: string;
  end_date: string;
  reason: string;
}

interface Booking {
  start_date: string;
  end_date: string;
}

interface Props {
  villas: VillaItem[];
}

export function DisponibilitesClient({ villas }: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [selectedVillaId, setSelectedVillaId] = useState<string>(
    searchParams.get("villaId") || villas[0]?.id || ""
  );
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedStart, setSelectedStart] = useState<string | null>(null);
  const [selectedEnd, setSelectedEnd] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [loading, setLoading] = useState(true);

  const showToast = useCallback((type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const fetchData = useCallback(async () => {
    if (!selectedVillaId) return;
    setLoading(true);
    const supabase = getSupabaseBrowser();

    const [{ data: blocksData }, { data: bookingsData }] = await Promise.all([
      supabase.from("owner_blocks").select("*").eq("villa_id", selectedVillaId).order("start_date"),
      supabase.from("booking_calendar_slots").select("start_date, end_date").eq("villa_id", selectedVillaId),
    ]);

    setBlocks(blocksData ?? []);
    setBookings(bookingsData ?? []);
    setLoading(false);
  }, [selectedVillaId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleVillaChange = useCallback(
    (villaId: string) => {
      setSelectedVillaId(villaId);
      router.replace(`/dashboard/disponibilites?villaId=${villaId}`, { scroll: false });
      setSelectedStart(null);
      setSelectedEnd(null);
    },
    [router]
  );

  const handleDatesSelect = useCallback((start: string, end: string) => {
    setSelectedStart(start);
    setSelectedEnd(end);
  }, []);

  const handleBlock = useCallback(
    async (start: string, end: string, reason: string) => {
      setSaving(true);
      try {
        const res = await fetch("/api/dashboard/owner-blocks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ villaId: selectedVillaId, start_date: start, end_date: end, reason }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Erreur");
        showToast("success", "Dates bloquées avec succès");
        setSelectedStart(null);
        setSelectedEnd(null);
        await fetchData();
      } catch (err) {
        showToast("error", err instanceof Error ? err.message : "Erreur lors de la création du bloc");
      } finally {
        setSaving(false);
      }
    },
    [selectedVillaId, fetchData, showToast]
  );

  const handleDelete = useCallback(
    async (blockId: string) => {
      try {
        const res = await fetch("/api/dashboard/owner-blocks", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ blockId }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Erreur");
        showToast("success", "Bloc supprimé");
        await fetchData();
      } catch (err) {
        showToast("error", err instanceof Error ? err.message : "Erreur lors de la suppression");
      }
    },
    [fetchData, showToast]
  );

  if (villas.length === 0) {
    return (
      <div className="rounded-2xl border border-navy/8 bg-white p-12 text-center">
        <p className="text-sm text-navy/40">
          Vous n'avez pas encore de villa. Contactez l'administrateur.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Toast */}
      {toast && (
        <div
          className={`fixed right-6 top-6 z-50 flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium shadow-lg transition-all ${
            toast.type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
          }`}
        >
          {toast.type === "success" ? <Check className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
          {toast.message}
        </div>
      )}

      {/* Villa selector */}
      {villas.length > 1 && (
        <div className="flex items-center gap-3">
          <label htmlFor="villa-select" className="text-xs font-bold uppercase tracking-[0.2em] text-navy/40">
            Villa
          </label>
          <select
            id="villa-select"
            value={selectedVillaId}
            onChange={(e) => handleVillaChange(e.target.value)}
            className="rounded-xl border border-navy/10 bg-white px-4 py-2.5 text-sm focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20"
          >
            {villas.map((v) => (
              <option key={v.id} value={v.id}>{v.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Calendar + Sidebar */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-navy/8 bg-white p-4 md:p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <span className="text-sm text-navy/30 animate-pulse">Chargement du calendrier…</span>
            </div>
          ) : (
            <OwnerCalendar
              villaId={selectedVillaId}
              blocks={blocks}
              bookings={bookings}
              onDatesSelect={handleDatesSelect}
            />
          )}
        </div>
        <div>
          <BlockSidebar
            selectedStart={selectedStart}
            selectedEnd={selectedEnd}
            activeBlocks={blocks}
            onBlock={handleBlock}
            onDelete={handleDelete}
            loading={saving}
          />
        </div>
      </div>
    </>
  );
}
```

- [ ] **Step 3: Run TypeScript check**

```bash
cd diamant-noir && npx tsc --noEmit --pretty 2>&1 | head -30
```
Expected: clean

- [ ] **Step 4: Commit**

```bash
git add app/(proprio)/dashboard/disponibilites/
git commit -m "feat: add owner disponibilites page with calendar and sidebar"
```

---

### Task 6: Navigation — Add "Disponibilités" to Sidebar

**Files:**
- Modify: `components/dashboard/proprio/ProprioMenuItems.ts`

- [ ] **Step 1: Add the new menu item**

```typescript
export interface MenuItem {
  label: string;
  href: string;
  icon: string;
  exact?: boolean;
}

export const proprioMenuItems: MenuItem[] = [
  { label: "Tableau de bord", href: "/dashboard", icon: "LayoutDashboard", exact: true },
  { label: "Mes Villas", href: "/dashboard/villas", icon: "Building2" },
  { label: "Disponibilités", href: "/dashboard/disponibilites", icon: "CalendarDays" },
  { label: "Réservations", href: "/dashboard/reservations", icon: "CalendarDays" },
  { label: "Revenus", href: "/dashboard/revenus", icon: "DollarSign" },
  { label: "Tâches", href: "/dashboard/taches", icon: "ClipboardList" },
  { label: "Statistiques", href: "/dashboard/statistiques", icon: "BarChart3" },
];
```

Note: The existing "Réservations" also uses `CalendarDays` icon. Both sharing the same icon is acceptable — the label distinguishes them. If you prefer a different icon for Disponibilités, use `Lock` from lucide-react. To do so, update the DashboardSidebar icon map as well (see `components/dashboard/shared/DashboardSidebar.tsx`) — check that `Lock` is in the icon map, or add it.

- [ ] **Step 2: Verify the DashboardSidebar icon map includes the icon**

Read `components/dashboard/shared/DashboardSidebar.tsx` and check the icon map. If using `Lock`, ensure it exists or use `CalendarDays` (already mapped).

- [ ] **Step 3: Run TypeScript check**

```bash
cd diamant-noir && npx tsc --noEmit --pretty 2>&1 | head -10
```
Expected: clean

- [ ] **Step 4: Commit**

```bash
git add components/dashboard/proprio/ProprioMenuItems.ts
git commit -m "feat: add Disponibilites to owner sidebar navigation"
```

---

### Task 7: Verify — End-to-End Test

- [ ] **Step 1: Start the dev server**

```bash
cd diamant-noir && npm run dev
```

- [ ] **Step 2: Login as an owner**

Navigate to `http://localhost:3000/login`, log in with an owner account.

- [ ] **Step 3: Navigate to Disponibilités**

Click "Disponibilités" in the sidebar. Verify:
- Villa selector appears (if multi-villa owner)
- Calendar loads with existing booked dates in gold
- No errors in console

- [ ] **Step 4: Block dates**

Click and drag on free dates in the calendar:
- Sidebar shows the selected date range
- Select a reason
- Click "Bloquer ces dates"
- Verify the dates turn navy on the calendar
- Verify the block appears in the "Blocs actifs" list

- [ ] **Step 5: Delete a block**

Click `×` on a block in the sidebar:
- Block disappears from the list
- Dates return to white on the calendar

- [ ] **Step 6: Verify public site**

Navigate to the villa detail page (`/villas/[villaId]`):
- Blocked dates should appear as unavailable (gold background) in the public AvailabilityCalendar
- Attempting to select blocked dates for booking should show "Indisponible"

- [ ] **Step 7: Test edge cases**

- Try blocking dates in the past → should show error
- Try blocking dates overlapping an existing booking → should show error
- Try blocking dates already blocked → should show error

- [ ] **Step 8: Commit if no issues**

```bash
# No new files — verification complete
```

---

## Self-Review Checklist

- ✅ Database migration creates table + updates view + RLS
- ✅ API route handles GET, POST, DELETE with auth + validation
- ✅ OwnerCalendar renders FullCalendar with blocks (navy) and bookings (gold)
- ✅ BlockSidebar has date display, reason dropdown, block button, active list with delete
- ✅ DisponibilitesPage fetches data server-side, passes to client component
- ✅ Navigation menu entry added
- ✅ Edge cases covered: past dates, overlaps, empty states, multi-villa, no villas
- ✅ No TBD/TODO/placeholders
- ✅ Types consistent across tasks (Block interface matches API response)
