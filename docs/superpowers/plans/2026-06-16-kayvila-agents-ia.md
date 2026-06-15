# Améliorations 3 Agents IA Kayvila — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Muscler les 3 agents IA Kayvila — Agent A (chatbot bi-tunnel : conversion voyageur + acquisition propriétaire), Agent B (5 alertes proactives proprio), Agent C (copilot admin socle intelligent) — sans toucher Stripe/emails/edge.

**Architecture :** Approche hybride phasée. **Phase 1** = couche code Next.js + 2 migrations + tests Vitest, mergeable seule (le mode démo reste fonctionnel sans n8n). **Phase 2** = workflows n8n `-v3`. Toute la logique métier (dispos, alertes, scores, gating) vit dans des modules `lib/` purs et testés ; les routes orchestrent.

**Tech Stack :** Next.js 14 App Router, TypeScript strict, Supabase (service role côté serveur), Vitest 4, RLS via `is_staff_admin()`.

**Branche :** `feat/agents-ia-v3` (déjà créée). Spec : `docs/superpowers/specs/2026-06-16-kayvila-agents-ia-design.md`.

**Convention tests :** unitaires co-localisés en `<module>.test.ts` (comme `lib/sla.test.ts`). Lancer ciblé : `npx vitest run <chemin>.test.ts` (les `tests/*.spec.ts` sont des E2E Playwright à ne pas exécuter ici).

**Convention commit :** terminer chaque message par une ligne `Co-Authored-By: claude-flow <ruv@ruv.net>`.

---

## PHASE 1 — Couche code + migrations + tests

---

### Task 1 : Migration `pre_booking_requests`

**Files:**
- Create: `supabase/migrations/20260616000001_pre_booking_requests.sql`

- [ ] **Step 1 : Écrire la migration**

```sql
-- Table des demandes de pré-réservation issues du chatbot visiteur (Agent A / A2)
create table if not exists public.pre_booking_requests (
  id          uuid primary key default gen_random_uuid(),
  session_id  text,
  villa_id    uuid references public.villas(id) on delete set null,
  start_date  date,
  end_date    date,
  email       text,
  guests      integer,
  name        text,
  status      text not null default 'new',
  created_at  timestamptz not null default now()
);

alter table public.pre_booking_requests enable row level security;

-- Lecture réservée au staff/admin (service_role bypass automatiquement la RLS)
create policy "staff_read_pre_booking_requests"
  on public.pre_booking_requests
  for select
  using (public.is_staff_admin());

create index if not exists idx_pre_booking_requests_created_at
  on public.pre_booking_requests (created_at desc);
```

- [ ] **Step 2 : Appliquer la migration**

Via MCP Supabase `apply_migration` (project_id `wsdawdxucyuyopkpgjij`, name `pre_booking_requests`), ou `supabase db push` si CLI configurée.
Expected: succès, table visible dans `list_tables`.

- [ ] **Step 3 : Vérifier**

Via MCP `execute_sql` :
```sql
select column_name, data_type from information_schema.columns
where table_schema='public' and table_name='pre_booking_requests' order by ordinal_position;
```
Expected: 9 colonnes (id, session_id, villa_id, start_date, end_date, email, guests, name, status, created_at).

- [ ] **Step 4 : Commit**

```bash
git add supabase/migrations/20260616000001_pre_booking_requests.sql
git commit -m "feat(db): table pre_booking_requests pour pré-booking chatbot

Co-Authored-By: claude-flow <ruv@ruv.net>"
```

---

### Task 2 : Migration types `notifications` + config UI

**Files:**
- Create: `supabase/migrations/20260616000002_notifications_types_agents.sql`
- Modify: `lib/constants.ts:61-72` (NOTIF_TYPE_CONFIG)

- [ ] **Step 1 : Écrire la migration (étendre la contrainte CHECK)**

```sql
-- Ajoute les types de notif des agents IA : pre_booking, hot_lead, owner_lead, admin_alert
alter table public.notifications drop constraint if exists notifications_type_check;

alter table public.notifications add constraint notifications_type_check
  check (type = any (array[
    'villa_submission','booking_new','booking_confirmed','ical_error',
    'availability_alert','system','request_update','checkin_reminder',
    'checkout_reminder','new_message',
    'pre_booking','hot_lead','owner_lead','admin_alert'
  ]));
```

- [ ] **Step 2 : Appliquer + vérifier**

Via MCP `apply_migration` (name `notifications_types_agents`). Puis :
```sql
select pg_get_constraintdef(oid) from pg_constraint
where conrelid='public.notifications'::regclass and conname='notifications_type_check';
```
Expected: la définition contient `pre_booking`, `hot_lead`, `owner_lead`, `admin_alert`.

- [ ] **Step 3 : Ajouter les entrées dans NOTIF_TYPE_CONFIG**

Dans `lib/constants.ts`, ajouter avant la `}` de fermeture (ligne 72) :

```ts
  pre_booking:        { icon: "CalendarClock",  color: "text-gold",        bg: "bg-gold/10" },
  hot_lead:           { icon: "Flame",          color: "text-red-500",     bg: "bg-red-50" },
  owner_lead:         { icon: "Handshake",      color: "text-emerald-500", bg: "bg-emerald-50" },
  admin_alert:        { icon: "ShieldAlert",    color: "text-amber-500",   bg: "bg-amber-50" },
```

- [ ] **Step 4 : Vérifier que les icônes existent dans lucide-react**

Run: `node -e "const i=require('lucide-react'); ['CalendarClock','Flame','Handshake','ShieldAlert'].forEach(n=>{if(!i[n])throw new Error('missing '+n)}); console.log('ok')"`
Expected: `ok`. (Si une icône manque, la remplacer par une existante, ex. `Bell`.)

- [ ] **Step 5 : Commit**

```bash
git add supabase/migrations/20260616000002_notifications_types_agents.sql lib/constants.ts
git commit -m "feat(db): types notif agents IA (pre_booking, hot_lead, owner_lead, admin_alert)

Co-Authored-By: claude-flow <ruv@ruv.net>"
```

---

### Task 3 : `lib/availability-gaps.ts` (détection de trous — partagé B1 & C-L9)

**Files:**
- Create: `lib/availability-gaps.ts`
- Test: `lib/availability-gaps.test.ts`

- [ ] **Step 1 : Écrire le test (TDD)**

```ts
// lib/availability-gaps.test.ts
import { describe, it, expect } from "vitest";
import { findGaps, type DateRange } from "./availability-gaps";

describe("findGaps", () => {
  it("trouve un trou entre deux plages occupées", () => {
    const occupied: DateRange[] = [
      { start: "2026-07-01", end: "2026-07-05" }, // libre à partir du 05 (checkout exclu)
      { start: "2026-07-10", end: "2026-07-15" },
    ];
    const gaps = findGaps(occupied, "2026-07-01", "2026-07-31", 3);
    // trou 05→10 = 5 nuits, et 15→31 = 16 nuits
    expect(gaps).toContainEqual({ start: "2026-07-05", end: "2026-07-10", nights: 5 });
    expect(gaps.some((g) => g.start === "2026-07-15")).toBe(true);
  });

  it("ignore les trous plus courts que minNights", () => {
    const occupied: DateRange[] = [
      { start: "2026-07-01", end: "2026-07-05" },
      { start: "2026-07-07", end: "2026-07-20" }, // trou 05→07 = 2 nuits < 3
    ];
    const gaps = findGaps(occupied, "2026-07-01", "2026-07-20", 3);
    expect(gaps.find((g) => g.start === "2026-07-05")).toBeUndefined();
  });

  it("retourne toute la fenêtre si aucune occupation", () => {
    const gaps = findGaps([], "2026-07-01", "2026-07-10", 3);
    expect(gaps).toEqual([{ start: "2026-07-01", end: "2026-07-10", nights: 9 }]);
  });

  it("fusionne les plages qui se chevauchent", () => {
    const occupied: DateRange[] = [
      { start: "2026-07-01", end: "2026-07-10" },
      { start: "2026-07-05", end: "2026-07-12" },
    ];
    const gaps = findGaps(occupied, "2026-07-01", "2026-07-20", 3);
    expect(gaps).toEqual([{ start: "2026-07-12", end: "2026-07-20", nights: 8 }]);
  });
});
```

- [ ] **Step 2 : Lancer le test → échec**

Run: `npx vitest run lib/availability-gaps.test.ts`
Expected: FAIL — `Cannot find module './availability-gaps'`.

- [ ] **Step 3 : Implémenter**

```ts
// lib/availability-gaps.ts
// Détection de fenêtres libres dans un calendrier d'occupation.
// Plages half-open : [start, end) — end = jour de départ (villa libre ce jour-là).

export type DateRange = { start: string; end: string };
export type Gap = { start: string; end: string; nights: number };

function diffNights(start: string, end: string): number {
  const ms = Date.parse(end) - Date.parse(start);
  return Math.round(ms / 86_400_000);
}

/**
 * Retourne les fenêtres libres ≥ minNights dans [from, to),
 * compte tenu des plages occupées (fusionnées si chevauchantes).
 */
export function findGaps(
  occupied: DateRange[],
  from: string,
  to: string,
  minNights: number
): Gap[] {
  // Filtrer + trier les plages qui intersectent la fenêtre
  const ranges = occupied
    .filter((r) => r.end > from && r.start < to)
    .map((r) => ({
      start: r.start < from ? from : r.start,
      end: r.end > to ? to : r.end,
    }))
    .sort((a, b) => a.start.localeCompare(b.start));

  // Fusionner les plages qui se chevauchent
  const merged: DateRange[] = [];
  for (const r of ranges) {
    const last = merged[merged.length - 1];
    if (last && r.start <= last.end) {
      if (r.end > last.end) last.end = r.end;
    } else {
      merged.push({ ...r });
    }
  }

  const gaps: Gap[] = [];
  let cursor = from;
  for (const r of merged) {
    if (r.start > cursor) {
      const nights = diffNights(cursor, r.start);
      if (nights >= minNights) gaps.push({ start: cursor, end: r.start, nights });
    }
    if (r.end > cursor) cursor = r.end;
  }
  if (cursor < to) {
    const nights = diffNights(cursor, to);
    if (nights >= minNights) gaps.push({ start: cursor, end: to, nights });
  }
  return gaps;
}
```

- [ ] **Step 4 : Lancer le test → succès**

Run: `npx vitest run lib/availability-gaps.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5 : Commit**

```bash
git add lib/availability-gaps.ts lib/availability-gaps.test.ts
git commit -m "feat(lib): détection de fenêtres libres (findGaps) partagée B1/C-L9

Co-Authored-By: claude-flow <ruv@ruv.net>"
```

---

### Task 4 : `lib/chatbot/availability.ts` (dispos villas pré-calculées — A1)

**Files:**
- Create: `lib/chatbot/availability.ts`
- Test: `lib/chatbot/availability.test.ts`

- [ ] **Step 1 : Écrire le test (logique pure `buildAvailabilityMap`)**

```ts
// lib/chatbot/availability.test.ts
import { describe, it, expect } from "vitest";
import { buildAvailabilityMap, type RawBooking, type RawBlock } from "./availability";

const today = "2026-07-01";

describe("buildAvailabilityMap", () => {
  it("agrège bookings + blocks par villa en plages occupées triées", () => {
    const bookings: RawBooking[] = [
      { villa_id: "v1", start_date: "2026-07-10", end_date: "2026-07-15" },
    ];
    const blocks: RawBlock[] = [
      { villa_id: "v1", start_date: "2026-07-03", end_date: "2026-07-04" },
    ];
    const map = buildAvailabilityMap(bookings, blocks, today);
    const v1 = map.get("v1")!;
    // block inclusif [03,04] => half-open [03,05)
    expect(v1.bookedRanges).toEqual([
      { start: "2026-07-03", end: "2026-07-05" },
      { start: "2026-07-10", end: "2026-07-15" },
    ]);
  });

  it("isAvailableNow=false si aujourd'hui est occupé", () => {
    const map = buildAvailabilityMap(
      [{ villa_id: "v1", start_date: "2026-06-28", end_date: "2026-07-05" }],
      [],
      today
    );
    expect(map.get("v1")!.isAvailableNow).toBe(false);
    expect(map.get("v1")!.nextAvailableFrom).toBe("2026-07-05");
  });

  it("isAvailableNow=true et nextAvailableFrom=today si aucune occupation aujourd'hui", () => {
    const map = buildAvailabilityMap(
      [{ villa_id: "v1", start_date: "2026-07-20", end_date: "2026-07-25" }],
      [],
      today
    );
    expect(map.get("v1")!.isAvailableNow).toBe(true);
    expect(map.get("v1")!.nextAvailableFrom).toBe(today);
  });
});
```

- [ ] **Step 2 : Lancer → échec**

Run: `npx vitest run lib/chatbot/availability.test.ts`
Expected: FAIL — module introuvable.

- [ ] **Step 3 : Implémenter**

```ts
// lib/chatbot/availability.ts
// Pré-calcul des disponibilités villas pour le chatbot visiteur (A1).
// Zéro requête DB par message : la map est construite avec un cache mémoire ~5 min.

import { supabaseAdmin } from "@/lib/supabase";

export type RawBooking = { villa_id: string; start_date: string; end_date: string };
export type RawBlock = { villa_id: string; start_date: string; end_date: string };

export type VillaAvailability = {
  villaId: string;
  bookedRanges: { start: string; end: string }[]; // half-open [start, end)
  nextAvailableFrom: string | null;
  isAvailableNow: boolean;
};

function addOneDay(d: string): string {
  return new Date(Date.parse(d) + 86_400_000).toISOString().slice(0, 10);
}

/** Logique pure et testable : agrège bookings + blocks en disponibilités par villa. */
export function buildAvailabilityMap(
  bookings: RawBooking[],
  blocks: RawBlock[],
  today: string
): Map<string, VillaAvailability> {
  const byVilla = new Map<string, { start: string; end: string }[]>();

  const push = (villaId: string, start: string, end: string) => {
    if (!villaId || !start || !end) return;
    const arr = byVilla.get(villaId) ?? [];
    arr.push({ start, end });
    byVilla.set(villaId, arr);
  };

  // bookings : end_date = jour de départ => déjà half-open
  for (const b of bookings) push(b.villa_id, b.start_date, b.end_date);
  // blocks : [start, end] inclusif => end exclusif = end + 1 jour
  for (const bl of blocks) push(bl.villa_id, bl.start_date, addOneDay(bl.end_date));

  const result = new Map<string, VillaAvailability>();
  for (const [villaId, rangesRaw] of byVilla) {
    const ranges = rangesRaw
      .slice()
      .sort((a, b) => a.start.localeCompare(b.start));

    // occupé aujourd'hui ?
    const occupiedNow = ranges.find((r) => r.start <= today && r.end > today);
    const isAvailableNow = !occupiedNow;
    const nextAvailableFrom = occupiedNow ? occupiedNow.end : today;

    result.set(villaId, {
      villaId,
      bookedRanges: ranges,
      nextAvailableFrom,
      isAvailableNow,
    });
  }
  return result;
}

// ─── Cache mémoire ~5 min ──────────────────────────────────────────────────────
let _cache: { map: Map<string, VillaAvailability>; at: number } | null = null;
const TTL_MS = 5 * 60_000;

/** Charge bookings + blocks et renvoie la map de dispos (cache 5 min). */
export async function getVillaAvailabilityCached(): Promise<Map<string, VillaAvailability>> {
  if (_cache && Date.now() - _cache.at < TTL_MS) return _cache.map;

  const today = new Date().toISOString().slice(0, 10);
  const admin = supabaseAdmin();

  const [bRes, blRes] = await Promise.all([
    admin
      .from("bookings")
      .select("villa_id, start_date, end_date, status, payment_status")
      .gte("end_date", today),
    admin
      .from("villa_date_blocks")
      .select("villa_id, start_date, end_date")
      .gte("end_date", today),
  ]);

  const bookings = (bRes.data ?? [])
    .filter(
      (b: Record<string, unknown>) =>
        b.status === "confirmed" || b.payment_status === "paid"
    )
    .map((b: Record<string, unknown>) => ({
      villa_id: String(b.villa_id ?? ""),
      start_date: String(b.start_date ?? ""),
      end_date: String(b.end_date ?? ""),
    }));

  const blocks = (blRes.data ?? []).map((b: Record<string, unknown>) => ({
    villa_id: String(b.villa_id ?? ""),
    start_date: String(b.start_date ?? ""),
    end_date: String(b.end_date ?? ""),
  }));

  const map = buildAvailabilityMap(bookings, blocks, today);
  _cache = { map, at: Date.now() };
  return map;
}
```

- [ ] **Step 4 : Lancer → succès**

Run: `npx vitest run lib/chatbot/availability.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5 : Commit**

```bash
git add lib/chatbot/availability.ts lib/chatbot/availability.test.ts
git commit -m "feat(chatbot): dispos villas pré-calculées (cache 5min) — A1

Co-Authored-By: claude-flow <ruv@ruv.net>"
```

---

### Task 5 : Brancher les dispos dans le contexte chatbot (A1 wiring)

**Files:**
- Modify: `types/chatbot.ts:144-153` (VillaContextItem)
- Modify: `lib/chatbot/villa-context.ts`
- Modify: `app/api/chat/route.ts:135-166` (contexte + capabilities)

- [ ] **Step 1 : Étendre `VillaContextItem`**

Dans `types/chatbot.ts`, ajouter le champ optionnel avant la `}` ligne 153 :

```ts
  /** Disponibilités pré-calculées (A1) — absent si non chargé */
  availability?: {
    isAvailableNow: boolean;
    nextAvailableFrom: string | null;
    bookedRanges: { start: string; end: string }[];
  };
```

- [ ] **Step 2 : Fusionner les dispos dans `getPublishedVillasForChatbot`**

Dans `lib/chatbot/villa-context.ts`, remplacer le corps de `getPublishedVillasForChatbot` (lignes 18-39) pour fusionner la map de dispos :

```ts
export async function getPublishedVillasForChatbot(): Promise<VillaContextItem[]> {
  try {
    const supabase = supabaseAdmin();
    const { data, error } = await supabase
      .from("villas")
      .select(SAFE_VILLA_FIELDS)
      .eq("is_published", true)
      .order("name");

    if (error) {
      console.error("[chatbot/villa-context] Supabase error:", error.message);
      return [];
    }
    if (!data || !Array.isArray(data)) return [];

    const villas = data.map(normalizeVilla);

    // Fusion des disponibilités pré-calculées (A1) — dégrade en silence si indispo
    try {
      const { getVillaAvailabilityCached } = await import("./availability");
      const availMap = await getVillaAvailabilityCached();
      for (const v of villas) {
        const a = availMap.get(v.id);
        if (a) {
          v.availability = {
            isAvailableNow: a.isAvailableNow,
            nextAvailableFrom: a.nextAvailableFrom,
            bookedRanges: a.bookedRanges,
          };
        } else {
          v.availability = { isAvailableNow: true, nextAvailableFrom: null, bookedRanges: [] };
        }
      }
    } catch (e) {
      console.warn("[chatbot/villa-context] availability merge skipped:", e);
    }

    return villas;
  } catch (err) {
    console.error("[chatbot/villa-context] Unexpected error:", err);
    return [];
  }
}
```

- [ ] **Step 3 : Passer `canVerifyAvailability: true`**

Dans `app/api/chat/route.ts`, ligne 162, remplacer :

```ts
      canVerifyAvailability: false,  // V1 : pas de vérification iCal en temps réel
```
par :
```ts
      canVerifyAvailability: true,   // A1 : dispos pré-calculées injectées dans context.villas
```

- [ ] **Step 4 : Vérifier la compilation**

Run: `npx tsc --noEmit`
Expected: aucune erreur.

- [ ] **Step 5 : Commit**

```bash
git add types/chatbot.ts lib/chatbot/villa-context.ts app/api/chat/route.ts
git commit -m "feat(chatbot): injecter les dispos dans le contexte villas + canVerifyAvailability — A1

Co-Authored-By: claude-flow <ruv@ruv.net>"
```

---

### Task 6 : Endpoint pré-booking `/api/chat/pre-book` (A2)

**Files:**
- Create: `app/api/chat/pre-book/route.ts`
- Test: `app/api/chat/pre-book/validate.test.ts`
- Create: `lib/chatbot/pre-book.ts` (validation pure, testable)

- [ ] **Step 1 : Écrire le test de validation pure**

```ts
// app/api/chat/pre-book/validate.test.ts
import { describe, it, expect } from "vitest";
import { validatePreBook } from "@/lib/chatbot/pre-book";

describe("validatePreBook", () => {
  it("rejette si villaId ou email manquant", () => {
    expect(validatePreBook({ villaId: "", email: "a@b.com", startDate: "2026-07-01", endDate: "2026-07-05" }).ok).toBe(false);
    expect(validatePreBook({ villaId: "v1", email: "", startDate: "2026-07-01", endDate: "2026-07-05" }).ok).toBe(false);
  });
  it("rejette un email invalide", () => {
    expect(validatePreBook({ villaId: "v1", email: "nope", startDate: "2026-07-01", endDate: "2026-07-05" }).ok).toBe(false);
  });
  it("rejette si end <= start", () => {
    expect(validatePreBook({ villaId: "v1", email: "a@b.com", startDate: "2026-07-05", endDate: "2026-07-05" }).ok).toBe(false);
  });
  it("accepte un payload valide et normalise guests", () => {
    const r = validatePreBook({ villaId: "v1", email: "a@b.com", startDate: "2026-07-01", endDate: "2026-07-05", guests: "3" as unknown as number });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.guests).toBe(3);
  });
});
```

- [ ] **Step 2 : Lancer → échec**

Run: `npx vitest run app/api/chat/pre-book/validate.test.ts`
Expected: FAIL — `@/lib/chatbot/pre-book` introuvable.

- [ ] **Step 3 : Implémenter la validation pure**

```ts
// lib/chatbot/pre-book.ts
export type PreBookInput = {
  villaId: string;
  email: string;
  startDate: string;
  endDate: string;
  guests?: number;
  name?: string;
  sessionId?: string;
};

export type PreBookResult =
  | { ok: true; value: Required<Pick<PreBookInput, "villaId" | "email" | "startDate" | "endDate">> & { guests: number; name: string | null; sessionId: string | null } }
  | { ok: false; error: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validatePreBook(input: Partial<PreBookInput>): PreBookResult {
  const villaId = String(input.villaId ?? "").trim();
  const email = String(input.email ?? "").trim();
  const startDate = String(input.startDate ?? "").trim();
  const endDate = String(input.endDate ?? "").trim();

  if (!villaId) return { ok: false, error: "villaId requis" };
  if (!EMAIL_RE.test(email)) return { ok: false, error: "email invalide" };
  if (!startDate || !endDate) return { ok: false, error: "dates requises" };
  if (endDate <= startDate) return { ok: false, error: "endDate doit être après startDate" };

  const guestsNum = Number(input.guests ?? 1);
  const guests = Number.isFinite(guestsNum) && guestsNum > 0 ? Math.floor(guestsNum) : 1;

  return {
    ok: true,
    value: {
      villaId,
      email,
      startDate,
      endDate,
      guests,
      name: input.name ? String(input.name).slice(0, 120) : null,
      sessionId: input.sessionId ? String(input.sessionId).slice(0, 80) : null,
    },
  };
}
```

- [ ] **Step 4 : Lancer → succès**

Run: `npx vitest run app/api/chat/pre-book/validate.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5 : Écrire la route**

```ts
// app/api/chat/pre-book/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { validatePreBook } from "@/lib/chatbot/pre-book";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Corps invalide." }, { status: 400 });
  }

  const v = validatePreBook(body);
  if (!v.ok) {
    return NextResponse.json({ success: false, error: v.error }, { status: 400 });
  }
  const { villaId, email, startDate, endDate, guests, name, sessionId } = v.value;

  const admin = supabaseAdmin();

  // 1) Persister la demande
  const { error: insertErr } = await admin.from("pre_booking_requests").insert({
    session_id: sessionId,
    villa_id: villaId,
    start_date: startDate,
    end_date: endDate,
    email,
    guests,
    name,
    status: "new",
  });
  if (insertErr) {
    console.error("[pre-book] insert", insertErr.message);
    return NextResponse.json({ success: false, error: "Enregistrement impossible." }, { status: 500 });
  }

  // 2) Récupérer le nom de la villa (best effort)
  const { data: villa } = await admin
    .from("villas")
    .select("name, slug")
    .eq("id", villaId)
    .maybeSingle();
  const villaName = villa?.name ?? "votre villa";

  // 3) Notifier l'admin (broadcast in-app)
  await admin.from("notifications").insert({
    user_id: null,
    type: "pre_booking",
    title: "Nouvelle pré-réservation",
    message: `${name ?? email} — ${villaName}, ${startDate} → ${endDate} (${guests} voyageur${guests > 1 ? "s" : ""})`,
  }).then(({ error }) => {
    if (error) console.warn("[pre-book] notif", error.message);
  });

  // 4) Lien pré-rempli vers la page de réservation existante
  const params = new URLSearchParams({
    villa: villa?.slug ?? villaId,
    start: startDate,
    end: endDate,
    guests: String(guests),
  });
  const bookingUrl = `/reservation?${params.toString()}`;

  return NextResponse.json({ success: true, bookingUrl });
}
```

> NOTE : vérifier l'URL réelle de réservation. Si la page diffère de `/reservation`, ajuster `bookingUrl` (chercher : `grep -rl "useSearchParams\|searchParams" app/reservation app/produit 2>/dev/null`). Ne PAS appeler Stripe ni `villa-submissions`.

- [ ] **Step 6 : Vérifier compilation + tests**

Run: `npx tsc --noEmit && npx vitest run app/api/chat/pre-book/validate.test.ts`
Expected: 0 erreur TS, tests PASS.

- [ ] **Step 7 : Commit**

```bash
git add lib/chatbot/pre-book.ts app/api/chat/pre-book/route.ts app/api/chat/pre-book/validate.test.ts
git commit -m "feat(chatbot): endpoint pré-booking + notif admin + lien pré-rempli — A2

Co-Authored-By: claude-flow <ruv@ruv.net>"
```

---

### Task 7 : Notification « lead chaud » (A3)

**Files:**
- Create: `lib/chatbot/lead-scoring.ts`
- Test: `lib/chatbot/lead-scoring.test.ts`
- Modify: `app/api/chat/route.ts` (après parsing n8n + dans le fallback démo)

- [ ] **Step 1 : Écrire le test**

```ts
// lib/chatbot/lead-scoring.test.ts
import { describe, it, expect } from "vitest";
import { isHotLead } from "./lead-scoring";

describe("isHotLead", () => {
  it("chaud si leadTemperature=hot", () => {
    expect(isHotLead({ leadTemperature: "hot" })).toBe(true);
  });
  it("chaud si score >= 70", () => {
    expect(isHotLead({ qualificationScore: 80 })).toBe(true);
    expect(isHotLead({ qualificationScore: 50 })).toBe(false);
  });
  it("chaud (heuristique démo) si dates + budget + guests connus", () => {
    expect(isHotLead({ knownLeadData: { checkIn: "2026-07-01", budget: 5000, guests: 4 } })).toBe(true);
  });
  it("froid sinon", () => {
    expect(isHotLead({})).toBe(false);
    expect(isHotLead({ knownLeadData: { guests: 2 } })).toBe(false);
  });
});
```

- [ ] **Step 2 : Lancer → échec**

Run: `npx vitest run lib/chatbot/lead-scoring.test.ts`
Expected: FAIL — module introuvable.

- [ ] **Step 3 : Implémenter**

```ts
// lib/chatbot/lead-scoring.ts
type LeadSignals = {
  leadTemperature?: string;
  qualificationScore?: number;
  knownLeadData?: {
    checkIn?: string;
    checkOut?: string;
    budget?: number;
    guests?: number;
    [k: string]: unknown;
  };
};

export function isHotLead(s: LeadSignals): boolean {
  if (s.leadTemperature === "hot") return true;
  if (typeof s.qualificationScore === "number" && s.qualificationScore >= 70) return true;
  const d = s.knownLeadData;
  if (d && d.checkIn && typeof d.budget === "number" && d.budget > 0 && typeof d.guests === "number" && d.guests > 0) {
    return true;
  }
  return false;
}
```

- [ ] **Step 4 : Lancer → succès**

Run: `npx vitest run lib/chatbot/lead-scoring.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5 : Brancher la notif dans `app/api/chat/route.ts`**

En haut du fichier, ajouter les imports :
```ts
import { supabaseAdmin } from "@/lib/supabase";
import { isHotLead } from "@/lib/chatbot/lead-scoring";
```

Ajouter ce helper avant `export async function POST` :
```ts
// Throttle mémoire : 1 notif lead chaud par session
const _hotLeadNotified = new Set<string>();

async function notifyHotLeadOnce(sessionId: string, summary: string) {
  if (_hotLeadNotified.has(sessionId)) return;
  _hotLeadNotified.add(sessionId);
  try {
    await supabaseAdmin().from("notifications").insert({
      user_id: null,
      type: "hot_lead",
      title: "Lead chaud détecté",
      message: summary.slice(0, 280),
    });
  } catch (e) {
    console.warn("[api/chat] hot_lead notif", e);
  }
}
```

Dans le bloc succès n8n (juste avant `return NextResponse.json(clientResponse);`, ~ligne 212), insérer :
```ts
    if (isHotLead({
      leadTemperature: parsed.leadTemperature,
      qualificationScore: parsed.qualificationScore,
      knownLeadData: parsed.leadUpdate as Record<string, unknown>,
    })) {
      await notifyHotLeadOnce(sessionId, `Session ${sessionId} — ${parsed.reply.slice(0, 120)}`);
    }
```

> Le mode démo (fallback sans n8n) ne dispose pas de signaux lead → pas de notif (comportement attendu, on évite les faux positifs).

- [ ] **Step 6 : Vérifier compilation + tests**

Run: `npx tsc --noEmit && npx vitest run lib/chatbot/lead-scoring.test.ts`
Expected: 0 erreur TS, PASS.

- [ ] **Step 7 : Commit**

```bash
git add lib/chatbot/lead-scoring.ts lib/chatbot/lead-scoring.test.ts app/api/chat/route.ts
git commit -m "feat(chatbot): notif admin lead chaud (throttle session) — A3

Co-Authored-By: claude-flow <ruv@ruv.net>"
```

---

### Task 8 : Tunnel acquisition propriétaire (`/api/chat/owner-lead` + faits conciergerie)

**Files:**
- Create: `lib/chatbot/conciergerie-context.ts`
- Create: `app/api/chat/owner-lead/route.ts`
- Test: `app/api/chat/owner-lead/owner-lead.test.ts`
- Modify: `app/api/chat/route.ts` (injecter les faits conciergerie dans le payload n8n)

- [ ] **Step 1 : Écrire le test de validation**

```ts
// app/api/chat/owner-lead/owner-lead.test.ts
import { describe, it, expect } from "vitest";
import { validateOwnerLead, buildSubmissionUrl } from "@/lib/chatbot/conciergerie-context";

describe("validateOwnerLead", () => {
  it("rejette si aucune info utile", () => {
    expect(validateOwnerLead({}).ok).toBe(false);
  });
  it("accepte avec villasCount ou location", () => {
    expect(validateOwnerLead({ villasCount: 3 }).ok).toBe(true);
    expect(validateOwnerLead({ location: "Trois-Îlets" }).ok).toBe(true);
  });
});

describe("buildSubmissionUrl", () => {
  it("pré-remplit les champs connus", () => {
    const url = buildSubmissionUrl({ name: "Jean", email: "j@x.com", location: "Trois-Îlets" });
    expect(url.startsWith("/soumettre-ma-villa?")).toBe(true);
    expect(url).toContain("villa_location=Trois");
  });
  it("retourne le chemin nu si rien à pré-remplir", () => {
    expect(buildSubmissionUrl({})).toBe("/soumettre-ma-villa");
  });
});
```

- [ ] **Step 2 : Lancer → échec**

Run: `npx vitest run app/api/chat/owner-lead/owner-lead.test.ts`
Expected: FAIL — module introuvable.

- [ ] **Step 3 : Implémenter le module conciergerie**

```ts
// lib/chatbot/conciergerie-context.ts
// Faits conciergerie pour le tunnel acquisition propriétaire (Agent A).
// Source de vérité : data/conciergerie-faq.ts — on en extrait des points clés.

export type OwnerLeadInput = {
  villasCount?: number;
  location?: string;
  email?: string;
  name?: string;
  sessionId?: string;
};

/** Points clés conciergerie injectés dans le contexte n8n (pas de hardcode chiffré ailleurs). */
export const CONCIERGERIE_FACTS = [
  "Commission Kayvila : 25 % du montant brut du séjour (ménage et blanchisserie inclus, aucune déduction préalable).",
  "Réservations directes via le site Kayvila : frais de traitement de 5 % (pas de commission plateforme).",
  "Synchronisation des calendriers Airbnb / Booking pour éviter les doubles réservations.",
  "Maintenance, ménage, accueil voyageurs et réassort des consommables gérés par Kayvila.",
  "Visibilité accrue : mise en avant sur le site Kayvila + plateformes OTA.",
  "Pack de démarrage 200 € à la première mise en service (consommables, boîte à clés sécurisée, guide).",
  "Rapport mensuel détaillé + facture de commission, réglable sous 8 jours (mandat SEPA possible).",
] as const;

export function validateOwnerLead(input: Partial<OwnerLeadInput>):
  | { ok: true; value: OwnerLeadInput }
  | { ok: false; error: string } {
  const hasCount = typeof input.villasCount === "number" && input.villasCount > 0;
  const hasLocation = !!(input.location && String(input.location).trim());
  if (!hasCount && !hasLocation && !input.email) {
    return { ok: false, error: "Aucune information de qualification fournie." };
  }
  return {
    ok: true,
    value: {
      villasCount: hasCount ? Math.floor(Number(input.villasCount)) : undefined,
      location: hasLocation ? String(input.location).trim().slice(0, 120) : undefined,
      email: input.email ? String(input.email).trim().slice(0, 160) : undefined,
      name: input.name ? String(input.name).trim().slice(0, 120) : undefined,
      sessionId: input.sessionId ? String(input.sessionId).slice(0, 80) : undefined,
    },
  };
}

/** Construit le lien vers le formulaire public, pré-rempli si possible. */
export function buildSubmissionUrl(input: { name?: string; email?: string; location?: string }): string {
  const params = new URLSearchParams();
  if (input.name) params.set("name", input.name);
  if (input.email) params.set("email", input.email);
  if (input.location) params.set("villa_location", input.location);
  const qs = params.toString();
  return qs ? `/soumettre-ma-villa?${qs}` : "/soumettre-ma-villa";
}
```

- [ ] **Step 4 : Écrire la route**

```ts
// app/api/chat/owner-lead/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { validateOwnerLead, buildSubmissionUrl } from "@/lib/chatbot/conciergerie-context";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Corps invalide." }, { status: 400 });
  }

  const v = validateOwnerLead(body);
  if (!v.ok) {
    return NextResponse.json({ success: false, error: v.error }, { status: 400 });
  }
  const { villasCount, location, email, name } = v.value;

  // Notif admin (broadcast in-app) — la notif EST la trace, pas de nouvelle table
  try {
    await supabaseAdmin().from("notifications").insert({
      user_id: null,
      type: "owner_lead",
      title: "Nouveau lead propriétaire",
      message: `${name ?? email ?? "Propriétaire"} — ${villasCount ?? "?"} villa(s)${location ? `, ${location}` : ""}`,
    });
  } catch (e) {
    console.warn("[owner-lead] notif", e);
  }

  return NextResponse.json({
    success: true,
    submissionUrl: buildSubmissionUrl({ name, email, location }),
  });
}
```

- [ ] **Step 5 : Injecter les faits conciergerie dans le payload n8n**

Dans `app/api/chat/route.ts`, importer en haut :
```ts
import { CONCIERGERIE_FACTS } from "@/lib/chatbot/conciergerie-context";
```
Puis dans `apiInput.context` (objet ~lignes 156-160), ajouter la clé :
```ts
      conciergerieFacts: CONCIERGERIE_FACTS,
```

- [ ] **Step 6 : Vérifier compilation + tests**

Run: `npx tsc --noEmit && npx vitest run app/api/chat/owner-lead/owner-lead.test.ts`
Expected: 0 erreur TS, PASS (4 tests).

- [ ] **Step 7 : Commit**

```bash
git add lib/chatbot/conciergerie-context.ts app/api/chat/owner-lead/route.ts app/api/chat/owner-lead/owner-lead.test.ts app/api/chat/route.ts
git commit -m "feat(chatbot): tunnel acquisition propriétaire (owner-lead + faits conciergerie)

Co-Authored-By: claude-flow <ruv@ruv.net>"
```

---

### Task 9 : Agent B — 5 alertes proactives calculées live (B1)

**Files:**
- Create: `lib/owner-alerts.ts`
- Test: `lib/owner-alerts.test.ts`
- Modify: `lib/owner-assistant-context.ts` (charger blocks + ota, appeler computeOwnerAlerts, fusionner)

- [ ] **Step 1 : Écrire le test**

```ts
// lib/owner-alerts.test.ts
import { describe, it, expect } from "vitest";
import { computeOwnerAlerts, type AlertsInput } from "./owner-alerts";

const base: AlertsInput = {
  today: "2026-07-01",
  villas: [{ id: "v1", name: "Corail" }],
  bookings: [],
  blocks: [],
  tasks: [],
  otaLogs: [],
  revenueCurrentMonth: 0,
  revenueLastMonth: 0,
};

describe("computeOwnerAlerts", () => {
  it("détecte un trou calendrier ≥ 3 nuits dans les 30 j", () => {
    const alerts = computeOwnerAlerts({
      ...base,
      bookings: [
        { villa_id: "v1", start_date: "2026-07-01", end_date: "2026-07-03", status: "confirmed" },
        { villa_id: "v1", start_date: "2026-07-20", end_date: "2026-07-25", status: "confirmed" },
      ],
    });
    expect(alerts.some((a) => a.type === "calendar_gap" && a.villa_id === "v1")).toBe(true);
  });

  it("détecte une tâche en retard (due_date < today)", () => {
    const alerts = computeOwnerAlerts({
      ...base,
      tasks: [{ id: "t1", villa_id: "v1", status: "pending", due_date: "2026-06-20" }],
    });
    expect(alerts.some((a) => a.type === "overdue_task" && a.severity === "high")).toBe(true);
  });

  it("détecte un conflit de réservation (chevauchement)", () => {
    const alerts = computeOwnerAlerts({
      ...base,
      bookings: [
        { villa_id: "v1", start_date: "2026-07-10", end_date: "2026-07-15", status: "confirmed" },
        { villa_id: "v1", start_date: "2026-07-14", end_date: "2026-07-18", status: "confirmed" },
      ],
    });
    expect(alerts.some((a) => a.type === "booking_conflict" && a.severity === "high")).toBe(true);
  });

  it("détecte une variation de revenu vs mois précédent", () => {
    const alerts = computeOwnerAlerts({ ...base, revenueCurrentMonth: 5600, revenueLastMonth: 5000 });
    const a = alerts.find((x) => x.type === "revenue_delta");
    expect(a).toBeDefined();
    expect(a!.title).toContain("+12");
  });

  it("détecte une désync OTA > 48h", () => {
    const alerts = computeOwnerAlerts({
      ...base,
      otaLogs: [{ villa_id: "v1", created_at: "2026-06-25T00:00:00Z", error: null }],
    });
    expect(alerts.some((a) => a.type === "ota_desync")).toBe(true);
  });

  it("ne crée pas d'alerte conflit pour des bookings annulés", () => {
    const alerts = computeOwnerAlerts({
      ...base,
      bookings: [
        { villa_id: "v1", start_date: "2026-07-10", end_date: "2026-07-15", status: "cancelled" },
        { villa_id: "v1", start_date: "2026-07-14", end_date: "2026-07-18", status: "cancelled" },
      ],
    });
    expect(alerts.some((a) => a.type === "booking_conflict")).toBe(false);
  });
});
```

- [ ] **Step 2 : Lancer → échec**

Run: `npx vitest run lib/owner-alerts.test.ts`
Expected: FAIL — module introuvable.

- [ ] **Step 3 : Implémenter**

```ts
// lib/owner-alerts.ts
// Calcul live des 5 alertes proactives propriétaire (B1). Aucune écriture DB.
import { findGaps, type DateRange } from "@/lib/availability-gaps";

export type ComputedAlert = {
  type: "calendar_gap" | "overdue_task" | "booking_conflict" | "revenue_delta" | "ota_desync";
  severity: "high" | "medium" | "low";
  title: string;
  body: string | null;
  villa_id: string | null;
};

export type AlertsInput = {
  today: string; // YYYY-MM-DD
  villas: { id: string; name?: string }[];
  bookings: { villa_id: string; start_date: string; end_date: string; status?: string }[];
  blocks: { villa_id: string; start_date: string; end_date: string }[];
  tasks: { id: string; villa_id: string; status?: string; due_date?: string | null }[];
  otaLogs: { villa_id: string; created_at: string; error: string | null }[];
  revenueCurrentMonth: number;
  revenueLastMonth: number;
  gapMinNights?: number;
  otaStaleHours?: number;
};

const ACTIVE = (s?: string) => s !== "cancelled" && s !== "rejected";

function addDays(d: string, n: number): string {
  return new Date(Date.parse(d) + n * 86_400_000).toISOString().slice(0, 10);
}

export function computeOwnerAlerts(input: AlertsInput): ComputedAlert[] {
  const {
    today, villas, bookings, blocks, tasks, otaLogs,
    revenueCurrentMonth, revenueLastMonth,
    gapMinNights = 3, otaStaleHours = 48,
  } = input;

  const alerts: ComputedAlert[] = [];
  const nameOf = (id: string) => villas.find((v) => v.id === id)?.name ?? "Villa";
  const horizon = addDays(today, 30);

  for (const villa of villas) {
    const occupied: DateRange[] = [
      ...bookings.filter((b) => b.villa_id === villa.id && ACTIVE(b.status))
        .map((b) => ({ start: b.start_date, end: b.end_date })),
      ...blocks.filter((b) => b.villa_id === villa.id)
        .map((b) => ({ start: b.start_date, end: addDays(b.end_date, 1) })),
    ];

    // 1) Trou calendrier
    const gaps = findGaps(occupied, today, horizon, gapMinNights);
    if (gaps.length > 0) {
      const g = gaps[0];
      alerts.push({
        type: "calendar_gap", severity: "medium",
        title: `${g.nights} nuits libres sur ${nameOf(villa.id)}`,
        body: `Fenêtre disponible du ${g.start} au ${g.end}. Veux-tu voir les dates ?`,
        villa_id: villa.id,
      });
    }

    // 3) Conflit de réservation (chevauchement de bookings actifs)
    const vb = bookings
      .filter((b) => b.villa_id === villa.id && ACTIVE(b.status))
      .sort((a, b) => a.start_date.localeCompare(b.start_date));
    for (let i = 1; i < vb.length; i++) {
      if (vb[i].start_date < vb[i - 1].end_date) {
        alerts.push({
          type: "booking_conflict", severity: "high",
          title: `Conflit de réservation sur ${nameOf(villa.id)}`,
          body: `Chevauchement détecté autour du ${vb[i].start_date}.`,
          villa_id: villa.id,
        });
        break;
      }
    }

    // 5) OTA désync (> otaStaleHours sans log, ou dernier log en erreur)
    const vlogs = otaLogs
      .filter((l) => l.villa_id === villa.id)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
    if (vlogs.length > 0) {
      const last = vlogs[0];
      const ageH = (Date.parse(`${today}T00:00:00Z`) - Date.parse(last.created_at)) / 3_600_000;
      if (last.error || ageH > otaStaleHours) {
        alerts.push({
          type: "ota_desync", severity: "medium",
          title: `Synchro OTA à vérifier — ${nameOf(villa.id)}`,
          body: last.error ? `Erreur récente : ${last.error}` : `Pas de synchro depuis ${Math.round(ageH)} h.`,
          villa_id: villa.id,
        });
      }
    }
  }

  // 2) Tâches en retard (global)
  const overdue = tasks.filter((t) => t.status !== "done" && t.due_date && t.due_date < today);
  if (overdue.length > 0) {
    alerts.push({
      type: "overdue_task", severity: "high",
      title: `${overdue.length} tâche(s) en retard`,
      body: overdue.slice(0, 3).map((t) => `${nameOf(t.villa_id)}`).join(", "),
      villa_id: overdue[0].villa_id ?? null,
    });
  }

  // 4) Δ revenu vs mois précédent (global)
  if (revenueLastMonth > 0) {
    const pct = Math.round(((revenueCurrentMonth - revenueLastMonth) / revenueLastMonth) * 100);
    alerts.push({
      type: "revenue_delta", severity: pct < -10 ? "medium" : "low",
      title: `Revenu du mois : ${pct >= 0 ? "+" : ""}${pct}% vs mois dernier`,
      body: `${revenueCurrentMonth.toLocaleString("fr-FR")} € ce mois (vs ${revenueLastMonth.toLocaleString("fr-FR")} €).`,
      villa_id: null,
    });
  }

  return alerts;
}
```

- [ ] **Step 4 : Lancer → succès**

Run: `npx vitest run lib/owner-alerts.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5 : Brancher dans `buildOwnerContextPack`**

Lire d'abord `lib/owner-assistant-context.ts` en entier pour repérer la fin du builder (le `return` de l'objet pack) et les variables `bookings`, `tasksOpen`, `villaIds`, `villaList`, `revenueCurrentMonth`, `revenueLastMonth`, `curMonthStart` déjà calculées.

a) Ajouter le chargement de `villa_date_blocks` et `ota_sync_logs` dans le `Promise.all` existant (celui qui charge bookings + tasks) :
```ts
    admin.from("villa_date_blocks").select("villa_id, start_date, end_date").in("villa_id", villaIds),
    admin.from("ota_sync_logs").select("villa_id, created_at, error").in("villa_id", villaIds)
      .order("created_at", { ascending: false }).limit(100),
```
et récupérer leurs `.data` (ex. `const blocks = blocksRes.data ?? []; const otaLogs = otaRes.data ?? [];`).

b) Importer en haut :
```ts
import { computeOwnerAlerts } from "@/lib/owner-alerts";
import type { OwnerAlertRow } from "@/lib/owner-assistant-context"; // si besoin, sinon réutiliser le type local
```
(Le type `OwnerAlertRow` est déjà défini dans ce fichier — pas de ré-import.)

c) Juste avant le `return` final du pack, calculer et fusionner :
```ts
    const today = new Date().toISOString().slice(0, 10);
    const computed = computeOwnerAlerts({
      today,
      villas: villaList.map((v) => ({ id: String(v.id), name: String(v.name ?? "Villa") })),
      bookings: bookings.map((b) => ({
        villa_id: String(b.villa_id), start_date: String(b.start_date),
        end_date: String(b.end_date), status: String(b.status ?? ""),
      })),
      blocks: (blocks as Record<string, unknown>[]).map((b) => ({
        villa_id: String(b.villa_id), start_date: String(b.start_date), end_date: String(b.end_date),
      })),
      tasks: (tasksOpen as Record<string, unknown>[]).map((t) => ({
        id: String(t.id), villa_id: String(t.villa_id),
        status: String(t.status ?? ""), due_date: (t.due_date as string) ?? null,
      })),
      otaLogs: (otaLogs as Record<string, unknown>[]).map((l) => ({
        villa_id: String(l.villa_id), created_at: String(l.created_at), error: (l.error as string) ?? null,
      })),
      revenueCurrentMonth,
      revenueLastMonth,
    });

    // Fusion : alertes calculées (id synthétique) d'abord, puis celles en table
    const computedRows: OwnerAlertRow[] = computed.map((a, i) => ({
      id: `computed:${a.type}:${a.villa_id ?? "global"}:${i}`,
      severity: a.severity, title: a.title, body: a.body,
      villa_id: a.villa_id, created_at: new Date().toISOString(), read_at: null,
    }));
    const mergedAlerts = [...computedRows, ...alertsOnly];
```
Puis utiliser `mergedAlerts` à la place de `alertsOnly` dans le `return` du pack (champ `alerts`).

> NOTE : si `tasks` n'a pas de colonne `due_date` (cf. TODO existant ligne ~195), l'alerte `overdue_task` ne se déclenchera pas — non bloquant. Vérifier via `execute_sql` que `tasks.due_date` existe ; sinon adapter la règle (retirer `overdue_task` du calcul owner et le documenter).

- [ ] **Step 6 : Vérifier compilation**

Run: `npx tsc --noEmit && npx vitest run lib/owner-alerts.test.ts`
Expected: 0 erreur TS, PASS.

- [ ] **Step 7 : Commit**

```bash
git add lib/owner-alerts.ts lib/owner-alerts.test.ts lib/owner-assistant-context.ts
git commit -m "feat(owner): 5 alertes proactives calculées live, fusionnées avec owner_alerts — B1

Co-Authored-By: claude-flow <ruv@ruv.net>"
```

---

### Task 10 : Agent C — module analytique `lib/admin-assistant-context.ts` (L1/L2/L3/L4/L9/C2)

**Files:**
- Create: `lib/admin-assistant-context.ts`
- Test: `lib/admin-assistant-context.test.ts`

- [ ] **Step 1 : Écrire le test**

```ts
// lib/admin-assistant-context.test.ts
import { describe, it, expect } from "vitest";
import {
  computeOccupancyByVilla,
  computeHealthScores,
  computeAdminAlerts,
  buildDailyBriefing,
  type AdminAnalyticsInput,
} from "./admin-assistant-context";

const today = "2026-07-01";
const villas = [{ id: "v1", name: "Corail" }, { id: "v2", name: "Azur" }];

const input: AdminAnalyticsInput = {
  today,
  villas,
  bookings: [
    { villa_id: "v1", start_date: "2026-07-01", end_date: "2026-07-26", status: "confirmed", payment_status: "paid" },
    { villa_id: "v2", start_date: "2026-07-01", end_date: "2026-07-11", status: "confirmed", payment_status: "paid" },
  ],
  blocks: [],
  tasks: [{ id: "t1", villa_id: "v2", status: "pending", due_date: "2026-06-20" }],
  reviews: [
    { villa_id: "v1", rating: 5, status: "approved" },
    { villa_id: "v2", rating: 3, status: "approved" },
  ],
  submissions: [{ id: "s1", status: "received", created_at: "2026-06-20T00:00:00Z", owner_name: "Jean", villa_name: "Lagon" }],
  revenueByVilla: { v1: 8000, v2: 3000 },
  revenueLastMonthByVilla: { v1: 6000, v2: 4000 },
};

describe("computeOccupancyByVilla", () => {
  it("calcule un taux 0-100 sur 30 jours", () => {
    const occ = computeOccupancyByVilla(input);
    expect(occ.v1).toBeGreaterThan(occ.v2); // Corail plus occupée
    expect(occ.v1).toBeLessThanOrEqual(100);
  });
});

describe("computeHealthScores", () => {
  it("retourne un score 0-100 par villa, Corail > Azur", () => {
    const scores = computeHealthScores(input);
    expect(scores.v1.score).toBeGreaterThan(scores.v2.score);
    expect(scores.v1.score).toBeGreaterThanOrEqual(0);
    expect(scores.v1.score).toBeLessThanOrEqual(100);
  });
  it("flag les villas sous le seuil", () => {
    const scores = computeHealthScores(input);
    expect(typeof scores.v2.flagged).toBe("boolean");
  });
});

describe("computeAdminAlerts", () => {
  it("alerte les soumissions en attente > 5 jours avec recommandation actionnable", () => {
    const alerts = computeAdminAlerts(input);
    const sub = alerts.find((a) => a.type === "submission_pending");
    expect(sub).toBeDefined();
    expect(sub!.suggested_action).toBe("UPDATE_SUBMISSION_STATUS");
    expect(sub!.label).toContain("Jean");
  });
});

describe("buildDailyBriefing", () => {
  it("résume check-ins/outs du jour et soumissions", () => {
    const b = buildDailyBriefing(input);
    expect(b.checkins_today).toBe(2);
    expect(b.submissions_pending).toBe(1);
    expect(Array.isArray(b.highlights)).toBe(true);
  });
});
```

- [ ] **Step 2 : Lancer → échec**

Run: `npx vitest run lib/admin-assistant-context.test.ts`
Expected: FAIL — module introuvable.

- [ ] **Step 3 : Implémenter**

```ts
// lib/admin-assistant-context.ts
// Analytique copilot admin (socle) : occupation, score santé, alertes actionnables, briefing.
// Fonctions pures — la route fournit les données déjà fetchées.

export type AdminAnalyticsInput = {
  today: string;
  villas: { id: string; name?: string }[];
  bookings: { villa_id: string; start_date: string; end_date: string; status?: string; payment_status?: string }[];
  blocks: { villa_id: string; start_date: string; end_date: string }[];
  tasks: { id: string; villa_id: string; status?: string; due_date?: string | null }[];
  reviews: { villa_id: string; rating: number; status?: string }[];
  submissions: { id: string; status?: string; created_at: string; owner_name?: string; villa_name?: string }[];
  revenueByVilla: Record<string, number>;
  revenueLastMonthByVilla: Record<string, number>;
};

const ACTIVE = (s?: string) => s !== "cancelled" && s !== "rejected";

function addDays(d: string, n: number): string {
  return new Date(Date.parse(d) + n * 86_400_000).toISOString().slice(0, 10);
}

/** Nuits occupées sur les 30 prochains jours, ramenées à un % (0-100). */
export function computeOccupancyByVilla(input: AdminAnalyticsInput): Record<string, number> {
  const { today, villas, bookings } = input;
  const horizon = addDays(today, 30);
  const out: Record<string, number> = {};
  for (const v of villas) {
    const days = new Set<string>();
    for (const b of bookings.filter((b) => b.villa_id === v.id && ACTIVE(b.status))) {
      let cur = b.start_date < today ? today : b.start_date;
      while (cur < b.end_date && cur < horizon) {
        days.add(cur);
        cur = addDays(cur, 1);
      }
    }
    out[v.id] = Math.round((days.size / 30) * 100);
  }
  return out;
}

export type HealthScore = { score: number; flagged: boolean; breakdown: Record<string, number> };

const HEALTH_THRESHOLD = 50;

/** Score 0-100 : occupation 40 + tendance revenu 20 + tâches 20 + satisfaction 20. */
export function computeHealthScores(input: AdminAnalyticsInput): Record<string, HealthScore> {
  const occ = computeOccupancyByVilla(input);
  const { villas, tasks, reviews, revenueByVilla, revenueLastMonthByVilla, today } = input;
  const out: Record<string, HealthScore> = {};

  for (const v of villas) {
    const occupationPts = Math.round((occ[v.id] ?? 0) * 0.4); // /40

    const cur = revenueByVilla[v.id] ?? 0;
    const prev = revenueLastMonthByVilla[v.id] ?? 0;
    let revenuePts = 10; // neutre par défaut /20
    if (prev > 0) {
      const pct = (cur - prev) / prev;
      revenuePts = Math.max(0, Math.min(20, Math.round(10 + pct * 50)));
    } else if (cur > 0) {
      revenuePts = 15;
    }

    const overdue = tasks.filter(
      (t) => t.villa_id === v.id && t.status !== "done" && t.due_date && t.due_date < today
    ).length;
    const tasksPts = Math.max(0, 20 - overdue * 5); // /20

    const vr = reviews.filter((r) => r.villa_id === v.id && r.status === "approved");
    const avg = vr.length ? vr.reduce((s, r) => s + r.rating, 0) / vr.length : 0;
    const satisfactionPts = vr.length ? Math.round((avg / 5) * 20) : 10; // /20, neutre si aucun avis

    const score = occupationPts + revenuePts + tasksPts + satisfactionPts;
    out[v.id] = {
      score,
      flagged: score < HEALTH_THRESHOLD,
      breakdown: { occupationPts, revenuePts, tasksPts, satisfactionPts },
    };
  }
  return out;
}

export type AdminAlert = {
  type: "submission_pending" | "booking_conflict";
  severity: "high" | "medium";
  label: string;
  body: string | null;
  entity_id: string | null;
  suggested_action: "UPDATE_SUBMISSION_STATUS" | "UPDATE_BOOKING" | null;
};

const SUBMISSION_STALE_DAYS = 5;

export function computeAdminAlerts(input: AdminAnalyticsInput): AdminAlert[] {
  const { today, submissions, bookings, villas } = input;
  const alerts: AdminAlert[] = [];
  const staleBefore = addDays(today, -SUBMISSION_STALE_DAYS);
  const nameOf = (id: string) => villas.find((v) => v.id === id)?.name ?? "Villa";

  // L2 : soumissions en attente actionnables
  for (const s of submissions.filter((s) => s.status === "received" && s.created_at.slice(0, 10) <= staleBefore)) {
    alerts.push({
      type: "submission_pending", severity: "medium",
      label: `Soumission ${s.owner_name ?? "?"} (${s.villa_name ?? "villa"}) en attente > ${SUBMISSION_STALE_DAYS} j`,
      body: "Veux-tu l'approuver, demander des photos, ou refuser ?",
      entity_id: s.id, suggested_action: "UPDATE_SUBMISSION_STATUS",
    });
  }

  // Conflits de réservation (scope global)
  for (const v of villas) {
    const vb = bookings
      .filter((b) => b.villa_id === v.id && ACTIVE(b.status))
      .sort((a, b) => a.start_date.localeCompare(b.start_date));
    for (let i = 1; i < vb.length; i++) {
      if (vb[i].start_date < vb[i - 1].end_date) {
        alerts.push({
          type: "booking_conflict", severity: "high",
          label: `Conflit de réservation sur ${nameOf(v.id)}`,
          body: `Chevauchement autour du ${vb[i].start_date}.`,
          entity_id: v.id, suggested_action: "UPDATE_BOOKING",
        });
        break;
      }
    }
  }
  return alerts;
}

export type DailyBriefing = {
  checkins_today: number;
  checkouts_today: number;
  submissions_pending: number;
  highlights: string[];
};

export function buildDailyBriefing(input: AdminAnalyticsInput): DailyBriefing {
  const { today, bookings, submissions } = input;
  const checkins_today = bookings.filter((b) => b.start_date === today && ACTIVE(b.status)).length;
  const checkouts_today = bookings.filter((b) => b.end_date === today && ACTIVE(b.status)).length;
  const submissions_pending = submissions.filter((s) => s.status === "received").length;

  const highlights: string[] = [];
  if (checkins_today) highlights.push(`${checkins_today} check-in(s) aujourd'hui`);
  if (checkouts_today) highlights.push(`${checkouts_today} check-out(s) aujourd'hui`);
  if (submissions_pending) highlights.push(`${submissions_pending} soumission(s) en attente`);

  return { checkins_today, checkouts_today, submissions_pending, highlights };
}
```

- [ ] **Step 4 : Lancer → succès**

Run: `npx vitest run lib/admin-assistant-context.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5 : Commit**

```bash
git add lib/admin-assistant-context.ts lib/admin-assistant-context.test.ts
git commit -m "feat(admin): analytique copilot — occupation, score santé, alertes actionnables, briefing (L1-L4,L9,C2)

Co-Authored-By: claude-flow <ruv@ruv.net>"
```

---

### Task 11 : Agent C — GET briefing + confirmation destructive (wiring route)

**Files:**
- Modify: `app/api/admin/chat/route.ts`
- Test: `lib/admin-confirm.test.ts`
- Create: `lib/admin-confirm.ts`

- [ ] **Step 1 : Test du gating de confirmation**

```ts
// lib/admin-confirm.test.ts
import { describe, it, expect } from "vitest";
import { requiresConfirmation, buildConfirmationPrompt } from "./admin-confirm";

describe("requiresConfirmation", () => {
  it("exige confirmation pour actions destructives non confirmées", () => {
    expect(requiresConfirmation("BLOCK_DATE", {})).toBe(true);
    expect(requiresConfirmation("UPDATE_BOOKING", {})).toBe(true);
    expect(requiresConfirmation("UPDATE_SUBMISSION_STATUS", {})).toBe(true);
  });
  it("laisse passer si confirm=true", () => {
    expect(requiresConfirmation("BLOCK_DATE", { confirm: true })).toBe(false);
  });
  it("ne bloque jamais les actions non destructives", () => {
    expect(requiresConfirmation("CREATE_TASK", {})).toBe(false);
    expect(requiresConfirmation("COMPLETE_TASK", {})).toBe(false);
    expect(requiresConfirmation("SHOW_STATS", {})).toBe(false);
  });
});

describe("buildConfirmationPrompt", () => {
  it("formule une question lisible pour BLOCK_DATE", () => {
    const p = buildConfirmationPrompt("BLOCK_DATE", { block: { start_date: "2026-07-15", end_date: "2026-07-20" } });
    expect(p).toContain("2026-07-15");
  });
});
```

- [ ] **Step 2 : Lancer → échec**

Run: `npx vitest run lib/admin-confirm.test.ts`
Expected: FAIL — module introuvable.

- [ ] **Step 3 : Implémenter**

```ts
// lib/admin-confirm.ts
const DESTRUCTIVE = new Set(["BLOCK_DATE", "UPDATE_BOOKING", "UPDATE_SUBMISSION_STATUS"]);

export function requiresConfirmation(action: string, actionData: Record<string, unknown>): boolean {
  if (!DESTRUCTIVE.has(action)) return false;
  return actionData?.confirm !== true;
}

export function buildConfirmationPrompt(action: string, actionData: Record<string, unknown>): string {
  switch (action) {
    case "BLOCK_DATE": {
      const b = (actionData.block ?? {}) as { start_date?: string; end_date?: string };
      return `Confirmer le blocage des dates du ${b.start_date ?? "?"} au ${b.end_date ?? "?"} ?`;
    }
    case "UPDATE_BOOKING":
      return `Confirmer la modification de la réservation ${String(actionData.booking_id ?? "")} ?`;
    case "UPDATE_SUBMISSION_STATUS":
      return `Confirmer le changement de statut de la soumission ${String(actionData.submission_id ?? "")} vers « ${String(actionData.status ?? "")} » ?`;
    default:
      return "Confirmer cette action ?";
  }
}
```

- [ ] **Step 4 : Lancer → succès**

Run: `npx vitest run lib/admin-confirm.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5 : Brancher le gating dans le POST de `app/api/admin/chat/route.ts`**

Importer en haut :
```ts
import { requiresConfirmation, buildConfirmationPrompt } from "@/lib/admin-confirm";
```
Juste après la ligne `const action = data.action || null;` (~ligne 374), ajouter :
```ts
    // Garde-fou : actions destructives → confirmation explicite obligatoire
    if (action && requiresConfirmation(action, actionData)) {
      return NextResponse.json({
        success: true,
        response: data.response || buildConfirmationPrompt(action, actionData),
        action,
        action_data: { ...actionData, context: contextData },
        requires_confirmation: true,
        confirmation_prompt: buildConfirmationPrompt(action, actionData),
        suggested_prompts: ["Oui, confirmer", "Annuler"],
      });
    }
```
(Cela précède les handlers `if (action === "CREATE_TASK" ...)` — les actions destructives non confirmées ne touchent donc jamais la DB.)

- [ ] **Step 6 : Ajouter le GET briefing à `app/api/admin/chat/route.ts`**

À la fin du fichier, ajouter une route GET qui réutilise le même gathering que le POST. Pour éviter la duplication, extraire le bloc de gathering (lignes ~133-300, du `Promise.all` jusqu'à `contextData`) dans une fonction `async function gatherAdminContext(supabase)` placée au-dessus du POST, puis l'appeler dans le POST **et** le GET.

```ts
import { requireAdmin, AuthError } from "@/lib/auth/server";
import {
  computeOccupancyByVilla, computeHealthScores, computeAdminAlerts, buildDailyBriefing,
  type AdminAnalyticsInput,
} from "@/lib/admin-assistant-context";

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const supabase = supabaseAdmin();
    const ctx = await gatherAdminContext(supabase); // { contextData, villas, bookings, tasks, submissions, blocks, reviews, otaLogs }
    const today = new Date().toISOString().slice(0, 10);

    const analytics: AdminAnalyticsInput = {
      today,
      villas: ctx.villas.map((v: any) => ({ id: String(v.id), name: String(v.name ?? "Villa") })),
      bookings: ctx.bookings.map((b: any) => ({
        villa_id: String(b.villa_id), start_date: String(b.start_date), end_date: String(b.end_date),
        status: String(b.status ?? ""), payment_status: String(b.payment_status ?? ""),
      })),
      blocks: ctx.blocks ?? [],
      tasks: ctx.tasks.map((t: any) => ({ id: String(t.id), villa_id: String(t.villa_id), status: String(t.status ?? ""), due_date: t.due_date ?? null })),
      reviews: ctx.reviews ?? [],
      submissions: ctx.submissions.map((s: any) => ({ id: String(s.id), status: String(s.status ?? ""), created_at: String(s.created_at), owner_name: s.owner_name, villa_name: s.villa_name })),
      revenueByVilla: ctx.revenueByVilla ?? {},
      revenueLastMonthByVilla: ctx.revenueLastMonthByVilla ?? {},
    };

    return NextResponse.json({
      success: true,
      daily_briefing: buildDailyBriefing(analytics),
      occupancy_by_villa: computeOccupancyByVilla(analytics),
      health_score_by_villa: computeHealthScores(analytics),
      admin_alerts: computeAdminAlerts(analytics),
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Admin Chat GET Error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
```

> Le gathering actuel ne charge ni `blocks`, ni `reviews`, ni les revenus par villa séparés par mois. Étendre `gatherAdminContext` pour ajouter : `villa_date_blocks`, `reviews (villa_id, rating, status)`, et calculer `revenueByVilla` / `revenueLastMonthByVilla` (réutiliser `getBookingPriceCents` déjà importé + filtres `startOfMonth` / `startOfLastMonth` déjà présents). Garder le `contextData` POST inchangé.

- [ ] **Step 7 : Étendre le mode démo (`buildAdminDemoReply`) pour santé/comparaison/briefing**

Dans `buildAdminDemoReply` (~ligne 27), ajouter une branche avant le `// ── Par défaut`:
```ts
  // ── Santé / comparaison villas ──
  if (/santé|sante|score|comparer|comparaison|occupation|performance|meilleure|pire/.test(msg)) {
    return {
      text: `📊 Demande la vue détaillée dans le tableau de bord : occupation et score de santé par villa sont calculés en direct.`,
      action: "SHOW_VILLAS",
      suggestions: ["Quelle villa est la plus occupée ?", "Quelles villas sont à risque ?"],
    };
  }
```
(Les vraies valeurs viennent du GET `daily_briefing`/`health_score_by_villa` côté frontend ; le mode démo POST reste indicatif.)

- [ ] **Step 8 : Vérifier compilation + tests**

Run: `npx tsc --noEmit && npx vitest run lib/admin-confirm.test.ts lib/admin-assistant-context.test.ts`
Expected: 0 erreur TS, tous PASS.

- [ ] **Step 9 : Commit**

```bash
git add lib/admin-confirm.ts lib/admin-confirm.test.ts app/api/admin/chat/route.ts
git commit -m "feat(admin): GET briefing/santé/occupation + confirmation actions destructives — L1/C2

Co-Authored-By: claude-flow <ruv@ruv.net>"
```

---

### Task 12 : Vérification globale Phase 1 + docs

**Files:**
- Modify: `docs/n8n/RECAP.md`
- Modify: `docs/auto-learn/LEARNINGS.md`

- [ ] **Step 1 : Suite de tests unitaires complète**

Run: `npx vitest run lib/availability-gaps.test.ts lib/chatbot/availability.test.ts app/api/chat/pre-book/validate.test.ts lib/chatbot/lead-scoring.test.ts app/api/chat/owner-lead/owner-lead.test.ts lib/owner-alerts.test.ts lib/admin-assistant-context.test.ts lib/admin-confirm.test.ts`
Expected: tous PASS.

- [ ] **Step 2 : TypeScript strict**

Run: `npx tsc --noEmit`
Expected: aucune erreur.

- [ ] **Step 3 : Build Next.js (sanity)**

Run: `npm run build`
Expected: build réussit (pas de régression d'import/route).

- [ ] **Step 4 : Mettre à jour `docs/n8n/RECAP.md`**

Ajouter une section datée 2026-06-16 résumant : A1 dispos pré-calculées, A2 pré-booking, A3 lead chaud, tunnel proprio, B1 5 alertes, C socle (briefing/santé/occupation/alertes + confirmation), 2 migrations, nouveaux endpoints `/api/chat/pre-book` et `/api/chat/owner-lead`, GET `/api/admin/chat`.

- [ ] **Step 5 : Mettre à jour `docs/auto-learn/LEARNINGS.md`**

Ajouter une entrée datée avec les règles apprises (ex. : contrainte CHECK `notifications.type` à étendre avant nouveaux types ; pas de `cancellation_reason` ni `last_sign_in` en base ; `villas.seasonal_prices` est un jsonb existant ; dispos pré-calculées dans `villa-context.ts` et pas `villas/public`).

- [ ] **Step 6 : Commit**

```bash
git add docs/n8n/RECAP.md docs/auto-learn/LEARNINGS.md
git commit -m "docs: RECAP + LEARNINGS — Phase 1 agents IA (A bi-tunnel, B alertes, C socle)

Co-Authored-By: claude-flow <ruv@ruv.net>"
```

---

## PHASE 2 — Workflows n8n `-v3`

> Ces tâches éditent des JSON ; pas de TDD automatisable. Valider chaque workflow par import n8n + test manuel d'un message. **Conserver les placeholders** (`VOTRE-DOMAINE`, `VOTRE_SUPABASE_ANON_KEY`) — zéro URL en dur.

---

### Task 13 : Agent A `-v3` (visiteur bi-tunnel)

**Files:**
- Create: `docs/n8n/kayvila-agent-a-visiteur-v3.json` (copie de v2 + modifications)

- [ ] **Step 1** : Dupliquer `kayvila-agent-a-visiteur-v2.json` → `-v3.json`.
- [ ] **Step 2** : Dans le prompt système de l'AI Agent, ajouter : (a) exploiter `context.villas[].availability` (répondre sur les dispos réelles), (b) reconnaître l'intent « propriétaire » et basculer sur le tunnel acquisition en utilisant `context.conciergerieFacts` (citer 25 % / 5 %), (c) en fin de tunnel proprio, émettre une sortie structurée déclenchant l'appel `/api/chat/owner-lead`, (d) en fin de tunnel voyageur, émettre `preBooking` pour `/api/chat/pre-book`.
- [ ] **Step 3** : Ajouter (si nécessaire) un nœud HTTP Request vers `{{VOTRE-DOMAINE}}/api/chat/pre-book` et `{{VOTRE-DOMAINE}}/api/chat/owner-lead` avec `continueOnFail: true`.
- [ ] **Step 4** : Vérifier que la sortie inclut `leadTemperature` / `qualificationScore` (déjà parsés côté route).
- [ ] **Step 5 : Commit**

```bash
git add docs/n8n/kayvila-agent-a-visiteur-v3.json
git commit -m "feat(n8n): Agent A v3 — dispos réelles, tunnel proprio, pré-booking

Co-Authored-By: claude-flow <ruv@ruv.net>"
```

---

### Task 14 : Agent B `-v3` (push alertes proactives)

**Files:**
- Create: `docs/n8n/kayvila-agent-b-proprietaire-v3.json`

- [ ] **Step 1** : Dupliquer v2 → v3.
- [ ] **Step 2** : Modifier le prompt pour que le 1er message du copilot présente proactivement `context.alerts` (les 5 types) avant toute question.
- [ ] **Step 3** : (Hors scope B2/urgence-LLM — ne pas ajouter.)
- [ ] **Step 4 : Commit**

```bash
git add docs/n8n/kayvila-agent-b-proprietaire-v3.json
git commit -m "feat(n8n): Agent B v3 — push proactif des 5 alertes

Co-Authored-By: claude-flow <ruv@ruv.net>"
```

---

### Task 15 : Agent C `-v3` (briefing + actions confirmées)

**Files:**
- Create: `docs/n8n/kayvila-agent-c-admin-v3.json`

- [ ] **Step 1** : Dupliquer v2 → v3.
- [ ] **Step 2** : Prompt : ouvrir par le `daily_briefing`, exploiter `health_score_by_villa` et `occupancy_by_villa` pour la comparaison inter-villas, formuler des recommandations actionnables (L2).
- [ ] **Step 3** : Pour les actions destructives, émettre l'action **sans** `confirm`, attendre le « oui » utilisateur, puis ré-émettre avec `action_data.confirm = true` (la route applique le gating).
- [ ] **Step 4 : Commit**

```bash
git add docs/n8n/kayvila-agent-c-admin-v3.json
git commit -m "feat(n8n): Agent C v3 — briefing, comparaison santé, actions confirmées

Co-Authored-By: claude-flow <ruv@ruv.net>"
```

---

## Self-Review (effectué)

- **Couverture spec :** A1 (T4,T5) · A2 (T1,T6) · A3 (T7) · tunnel proprio (T8) · B1/5 alertes (T3,T9) · C L1 briefing (T10,T11) · L2 recommandations (T10) · L3 occupation (T10) · L4 score santé (T10) · L9 maintenance (T3 réutilisé via findGaps, exposé dans le briefing/alertes) · C2 proactivité+confirmation (T10,T11) · migrations (T1,T2) · n8n (T13-15) · tests+docs (T12). ✓
- **Roadmap C (L5,L7,L8,L10,L6,L11,L12)** : documentée dans le spec, volontairement non implémentée. ✓
- **Placeholders :** aucun TODO/TBD dans le code des steps ; 3 NOTES explicites pointent des vérifications de schéma/URL à faire à l'exécution (URL `/reservation`, `tasks.due_date`, extension `gatherAdminContext`). ✓
- **Cohérence des types :** `findGaps`/`DateRange`/`Gap`, `buildAvailabilityMap`/`VillaAvailability`, `computeOwnerAlerts`/`AlertsInput`/`ComputedAlert`, `AdminAnalyticsInput` + fns C, `requiresConfirmation`/`buildConfirmationPrompt` — signatures réutilisées à l'identique entre tâches. ✓
- **L9 maintenance :** réutilise `findGaps` (T3) ; la fenêtre de maintenance est dérivée des trous calendrier — pas de fonction dédiée séparée (DRY). Exposée via le briefing/contexte admin.
</content>
