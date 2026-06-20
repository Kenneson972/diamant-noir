# Couche proactive Agent B — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add proactive daily digest to Agent B (Kayvibot Propriétaire): n8n cron at 8am Martinique fetches owner contexts via internal API, generates warm digest messages via DeepSeek, inserts into `notifications` table, dashboard card displays them with read/mark-read.

**Architecture:** n8n Schedule Trigger → GET internal endpoint (CRON_API_KEY) → Split per owner → DeepSeek LLM Chain → Postgres INSERT into `notifications` (reusing existing table, type `owner_daily_digest`). Frontend: `useProactiveNotification` hook → `ProactiveNotification` card in dashboard. New endpoints: `GET /api/agent/owners-digest-context` (internal, secret-gated) + `/api/dashboard/proactive-notifications` (GET/PATCH, user-gated).

**Tech Stack:** Next.js 14 App Router, Supabase (`notifications` table via `supabaseAdmin()`), n8n Cloud (`q4DAjw1uG19fDfr8`), DeepSeek (`deepseek-v4-pro` via `KARIBLOOM DEEPSEEK` credential), Playwright.

## Global Constraints

- Zéro redesign (or `#d4af37` / navy `#0a0a0a`, Instrument Sans / Playfair Display / Sora, radius anguleux)
- `client.config.ts` source de vérité — jamais hardcoder marque/NAP/email/URL/couleur
- Double quotes pour apostrophes FR dans les strings JS/TSX (`"d'entretien"` pas `'d'entretien'`)
- Branche webhook B intacte ; RLS service-role inchangée ; pas de fonctions Server→Client
- n8n : auth par **header** (pas query), pas de `$env`/`process.env` (bloqués sur Cloud)
- `npx tsc --noEmit` avant chaque commit ; vérifier `vercel ls --prod` Ready après déploiement

---

### Task 1: Migration SQL — add `owner_daily_digest` type

**Files:**
- Create: `supabase/migrations/20260620_notifications_owner_daily_digest.sql`

**Interfaces:**
- Produces: `NOTIFICATION_TYPES` constraint extended to include `owner_daily_digest`
- Consumes: existing `public.notifications` table

- [ ] **Step 1: Write migration file**

```sql
-- ═══════════════════════════════════════════════════════════════════
-- Migration : ajout type owner_daily_digest — Kayvila
-- ───────────────────────────────────────────────────────────────────
-- Permet au cron Agent B (n8n) d'insérer un digest journalier
-- chaleureux par propriétaire dans la table notifications.
-- ═══════════════════════════════════════════════════════════════════

alter table public.notifications drop constraint if exists notifications_type_check;

alter table public.notifications add constraint notifications_type_check
  check (type = any (array[
    'villa_submission','booking_new','booking_confirmed','ical_error',
    'availability_alert','system','request_update','checkin_reminder',
    'checkout_reminder','new_message',
    'pre_booking','hot_lead','owner_lead','admin_alert',
    'owner_daily_digest'
  ]));
```

- [ ] **Step 2: Apply migration to Supabase**

Open Supabase dashboard → SQL Editor → select `wsdawdxucyuyopkpgjij` (DIAMANT NOIR) → paste migration → Run. Verify no errors.

If Supabase MCP is connected, alternatively:
```bash
supabase db push
```

- [ ] **Step 3: Verify constraint in DB**

```sql
select pg_get_constraintdef(oid) from pg_constraint 
where conname = 'notifications_type_check' and conrelid = 'public.notifications'::regclass;
```

Expected: constraint includes `owner_daily_digest`.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260620_notifications_owner_daily_digest.sql
git commit -m "feat(db): add owner_daily_digest type to notifications constraint

Co-Authored-By: claude-flow <ruv@ruv.net>"
```

---

### Task 2: Internal endpoint — `GET /api/agent/owners-digest-context`

**Files:**
- Create: `app/api/agent/owners-digest-context/route.ts`

**Interfaces:**
- Consumes: `verifyApiKey` from `lib/auth/server.ts`, `supabaseAdmin` from `lib/supabase.ts`, `buildOwnerContextPackCached` from `lib/owner-assistant-context.ts`
- Produces: `{ owners: [{ owner_id: string, context: OwnerContextPack }] }`

- [ ] **Step 1: Write the route**

```typescript
import { NextResponse, type NextRequest } from "next/server";
import { verifyApiKey } from "@/lib/auth/server";
import { supabaseAdmin } from "@/lib/supabase";
import { buildOwnerContextPackCached } from "@/lib/owner-assistant-context";

export const runtime = "nodejs";

/**
 * GET /api/agent/owners-digest-context
 * Internal endpoint for n8n cron — returns context for each active owner
 * who hasn't received a daily digest yet today (Martinique timezone).
 * Auth: Bearer <CRON_API_KEY>
 */
export async function GET(request: NextRequest) {
  if (!verifyApiKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const admin = supabaseAdmin();

    // Date d'aujourd'hui en timezone Martinique (UTC-4)
    const mqNow = new Date(
      new Date().toLocaleString("en-US", { timeZone: "America/Martinique" })
    );
    const mqToday = mqNow.toISOString().split("T")[0]; // "2026-06-20"

    // Récupérer tous les propriétaires actifs
    const { data: owners, error: ownersError } = await admin
      .from("profiles")
      .select("id, email")
      .eq("role", "owner");

    if (ownersError || !owners?.length) {
      console.warn("[owners-digest-context] No owners found", ownersError);
      return NextResponse.json({ owners: [] });
    }

    // Récupérer l'ensemble des owners déjà traités aujourd'hui
    const { data: alreadyDone } = await admin
      .from("notifications")
      .select("user_id")
      .eq("type", "owner_daily_digest")
      .gte(
        "created_at",
        `${mqToday}T00:00:00.000-04:00` // début du jour Martinique
      );

    const doneIds = new Set((alreadyDone ?? []).map((r) => r.user_id));

    // Construire le contexte pour chaque owner non encore traité
    const results: Array<{ owner_id: string; context: unknown }> = [];
    for (const owner of owners) {
      if (doneIds.has(owner.id)) continue;

      try {
        const pack = await buildOwnerContextPackCached(admin, owner.id);
        results.push({ owner_id: owner.id, context: pack });
      } catch (err) {
        console.error(
          `[owners-digest-context] Failed for owner ${owner.id}`,
          err
        );
      }
    }

    return NextResponse.json({ owners: results });
  } catch (err) {
    console.error("[owners-digest-context] Internal error", err);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Test endpoint locally with CRON_API_KEY**

```bash
# Set CRON_API_KEY in .env.local first, then:
curl -H "Authorization: Bearer $CRON_API_KEY" \
  https://kayvila.vercel.app/api/agent/owners-digest-context | jq '.owners | length'
# Expected: number of owners without digest today (3 on first run, 0 on rerun)
```

- [ ] **Step 3: Commit**

```bash
git add app/api/agent/owners-digest-context/route.ts
git commit -m "feat(api): internal owners-digest-context endpoint for n8n cron

Co-Authored-By: claude-flow <ruv@ruv.net>"
```

---

### Task 3: User-facing endpoint — `GET/PATCH /api/dashboard/proactive-notifications`

**Files:**
- Create: `app/api/dashboard/proactive-notifications/route.ts`

**Interfaces:**
- Consumes: `getUserFromRequest` from `lib/auth/server.ts`, `supabaseAdmin` from `lib/supabase.ts`
- Produces (GET): `{ notification: NotificationRow | null }`
- Produces (PATCH): `{ success: boolean }`

- [ ] **Step 1: Write the route**

```typescript
import { NextResponse, type NextRequest } from "next/server";
import { getUserFromRequest } from "@/lib/auth/server";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

/**
 * GET /api/dashboard/proactive-notifications
 * Returns the latest unread daily digest for the authenticated owner.
 */
export async function GET(request: NextRequest) {
  try {
    const { user } = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = supabaseAdmin();
    const { data, error } = await admin
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .eq("type", "owner_daily_digest")
      .eq("is_read", false)
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) {
      console.error("[proactive-notifications] GET select error", error);
      return NextResponse.json(
        { error: "Erreur serveur" },
        { status: 500 }
      );
    }

    const notification = data?.length ? data[0] : null;
    return NextResponse.json({ notification });
  } catch (err) {
    console.error("[proactive-notifications] GET", err);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/dashboard/proactive-notifications
 * Body: { id } — marks the notification as read.
 * Verifies the notification belongs to the authenticated user.
 */
export async function PATCH(request: NextRequest) {
  try {
    const { user } = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const id = typeof body.id === "string" ? body.id : null;
    if (!id) {
      return NextResponse.json({ error: "id requis" }, { status: 400 });
    }

    const admin = supabaseAdmin();

    // Vérifier l'appartenance (propriétaire = propriétaire de la notif)
    const { data: existing } = await admin
      .from("notifications")
      .select("id, user_id")
      .eq("id", id)
      .eq("type", "owner_daily_digest")
      .maybeSingle();

    if (!existing) {
      return NextResponse.json(
        { error: "Notification introuvable" },
        { status: 404 }
      );
    }

    if (existing.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { error: updateError } = await admin
      .from("notifications")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("id", id);

    if (updateError) {
      console.error("[proactive-notifications] PATCH update error", updateError);
      return NextResponse.json(
        { error: "Erreur serveur" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[proactive-notifications] PATCH", err);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Type-check**

```bash
cd diamant-noir && npx tsc --noEmit 2>&1 | grep -E "proactive-notifications|error TS" | head
# Expected: no output (clean)
```

- [ ] **Step 3: Commit**

```bash
git add app/api/dashboard/proactive-notifications/route.ts
git commit -m "feat(api): proactive-notifications endpoint (GET/PATCH) for owner dashboard

Co-Authored-By: claude-flow <ruv@ruv.net>"
```

---

### Task 4: Frontend hook — `hooks/useProactiveNotification.ts`

**Files:**
- Create: `hooks/useProactiveNotification.ts`

**Interfaces:**
- Consumes: `getSupabaseBrowser` from `lib/supabase.ts`, `GET/PATCH /api/dashboard/proactive-notifications`
- Produces: `{ notification: NotificationRow | null, loading: boolean, markAsRead: (id: string) => Promise<void> }`

- [ ] **Step 1: Write the hook**

```typescript
"use client";

import { useState, useCallback, useEffect } from "react";
import { getSupabaseBrowser } from "@/lib/supabase";

interface NotificationRow {
  id: string;
  type: string;
  title: string;
  body: string;
  metadata: Record<string, unknown>;
  action_url: string;
  is_read: boolean;
  created_at: string;
  user_id: string;
}

/** Header Authorization Bearer depuis la session Supabase courante (sinon vide). */
async function getAuthHeader(): Promise<Record<string, string>> {
  const supabase = getSupabaseBrowser();
  if (!supabase) return {};
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token
    ? { Authorization: `Bearer ${session.access_token}` }
    : {};
}

interface UseProactiveNotificationResult {
  notification: NotificationRow | null;
  loading: boolean;
  markAsRead: (id: string) => Promise<void>;
}

export function useProactiveNotification(): UseProactiveNotificationResult {
  const [notification, setNotification] = useState<NotificationRow | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchNotification = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/proactive-notifications", {
        headers: { ...(await getAuthHeader()) },
      });
      if (res.ok) {
        const data = await res.json();
        setNotification(data.notification ?? null);
      }
    } catch {
      // Silencieux — la notification est best-effort
    } finally {
      setLoading(false);
    }
  }, []);

  const markAsRead = useCallback(async (id: string) => {
    try {
      const res = await fetch("/api/dashboard/proactive-notifications", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(await getAuthHeader()),
        },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setNotification(null);
      }
    } catch {
      // Silencieux
    }
  }, []);

  useEffect(() => {
    fetchNotification();
  }, [fetchNotification]);

  return { notification, loading, markAsRead };
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit 2>&1 | grep -E "useProactiveNotification|error TS" | head
# Expected: no output
```

- [ ] **Step 3: Commit**

```bash
git add hooks/useProactiveNotification.ts
git commit -m "feat(hook): useProactiveNotification for owner daily digest

Co-Authored-By: claude-flow <ruv@ruv.net>"
```

---

### Task 5: Frontend component — `components/dashboard/ProactiveNotification.tsx`

**Files:**
- Create: `components/dashboard/ProactiveNotification.tsx`

**Interfaces:**
- Consumes: `useProactiveNotification` hook
- Produces: `<ProactiveNotification />` component — renders a dismissible card or `null`

- [ ] **Step 1: Write the component**

```typescript
"use client";

import { useProactiveNotification } from "@/hooks/useProactiveNotification";

export function ProactiveNotification() {
  const { notification, loading, markAsRead } = useProactiveNotification();

  // Rien à afficher pendant le chargement ou si pas de notif
  if (loading || !notification) return null;

  return (
    <div
      className="mx-auto mb-6 max-w-7xl rounded-lg border border-gold/20 bg-gradient-to-r from-navy/[0.02] to-gold/[0.04] p-5 shadow-sm"
      role="status"
      aria-label="Point du jour Kayvila"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-base font-semibold text-navy">
            {notification.title}
          </h3>
          <div className="mt-2 text-[13px] leading-relaxed text-navy/75 whitespace-pre-line">
            {notification.body}
          </div>
        </div>
        <button
          onClick={() => markAsRead(notification.id)}
          className="shrink-0 rounded-md border border-navy/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.15em] text-navy/55 transition-colors hover:border-gold/30 hover:text-gold"
          aria-label="Marquer comme lu"
        >
          Marquer comme lu
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit 2>&1 | grep -E "ProactiveNotification|error TS" | head
# Expected: no output
```

- [ ] **Step 3: Commit**

```bash
git add components/dashboard/ProactiveNotification.tsx
git commit -m "feat(ui): ProactiveNotification card for owner daily digest

Co-Authored-By: claude-flow <ruv@ruv.net>"
```

---

### Task 6: Dashboard injection + NotificationBell exclusion

**Files:**
- Modify: `app/(proprio)/dashboard/page.tsx:1-6` (import + render)
- Modify: `components/dashboard/NotificationBell.tsx:80-100` (query filter)

**Interfaces:**
- Consumes: `ProactiveNotification` from Task 5
- Produces: Digest card above KPIs on dashboard; NotificationBell excludes digest type

- [ ] **Step 1: Inject ProactiveNotification into dashboard page**

In `app/(proprio)/dashboard/page.tsx`, add the import and render the component in the main section, before the KPIs:

Add import at top (line ~5):
```typescript
import { ProactiveNotification } from "@/components/dashboard/ProactiveNotification";
```

Add render in the server component (inside the `<main>` or wrapper that wraps the dashboard content):
```typescript
<ProactiveNotification />
```

Since the dashboard page is a **Server Component**, and `ProactiveNotification` is a **Client Component** (it uses `useProactiveNotification` which calls `getSupabaseBrowser`), this works — server components can render client components as children.

In `app/(proprio)/dashboard/page.tsx:80-85` (right after `<h1>` and `<p>`):
```tsx
<h1 className="font-display text-2xl font-bold text-navy-900">
  Tableau de bord
</h1>
<p className="text-sm text-navy/65">Aperçu de votre activité</p>

{/* ── Digest proactif du jour ── */}
<ProactiveNotification />
```

Wait — the Server Component `page.tsx` uses `dynamic = "force-dynamic"` and fetches data server-side. Since `ProactiveNotification` is a **Client Component** (`"use client"`), it works fine as a child. The server will render the SSR shell; hydration will activate the hook client-side.

- [ ] **Step 2: Exclude owner_daily_digest from NotificationBell**

In `components/dashboard/NotificationBell.tsx`, find the Supabase subscription/query that fetches notifications. The NotificationBell uses `getSupabaseBrowser()` and subscribes via Supabase Realtime. Add `.neq("type", "owner_daily_digest")` to the query.

Looking at the file (line ~75-90), the query pattern is likely:
```typescript
// Find the .from("notifications").select(...) call
// Add: .neq("type", "owner_daily_digest")
```

If the query uses `.in("type", [...]`), add `owner_daily_digest` to the exclusion. If it just selects all, add `.neq("type", "owner_daily_digest")` to the chain.

Search for the exact query and add the filter:
```
.from("notifications")
.select(...)
.neq("type", "owner_daily_digest")  // ← add this line
.order("created_at", { ascending: false })
```

- [ ] **Step 3: Type-check and commit**

```bash
npx tsc --noEmit 2>&1 | grep -E "error TS" | head
# Expected: no errors on our files

git add app/\(proprio\)/dashboard/page.tsx components/dashboard/NotificationBell.tsx
git commit -m "feat(dashboard): inject ProactiveNotification card + exclude from bell

Co-Authored-By: claude-flow <ruv@ruv.net>"
```

---

### Task 7: n8n workflow — add cron branch to Agent B

**Files:**
- Modify: `docs/n8n/kayvibot-agent-b-proprietaire-fusion.json` (add cron branch nodes, LEAVE webhook branch untouched)

**Interfaces:**
- Consumes: `KARIBLOOM DEEPSEEK` credential (`s16Eub8KTcJLPBw5`), `DIAMANT NOIR` Postgres credential (`szSBC134iAZHEyPA`)
- Produces: INSERT into `notifications` with `type='owner_daily_digest'`

**⚠️ Before this task: you need the CRON_API_KEY value. Obtain it from the user or generate one and add to Vercel.**

- [ ] **Step 1: Read the current workflow JSON**

```bash
cat docs/n8n/kayvibot-agent-b-proprietaire-fusion.json | python3 -c "import json,sys; d=json.load(sys.stdin); print('nodes:', len(d['nodes']), '| name:', d['name'])"
```

The workflow currently has 16 nodes. The cron branch adds 5-6 nodes, independently wired (no connection to webhook branch).

- [ ] **Step 2: Add Schedule Trigger node**

New node (add to `nodes` array):

```json
{
  "parameters": {
    "rule": {
      "interval": [{"field":"cronExpression","expression":"0 8 * * *"}],
      "triggerTimes": {
        "hour": 8, "minute": 0
      }
    }
  },
  "id": "cron-schedule",
  "name": "Schedule Trigger (8h Martinique)",
  "type": "n8n-nodes-base.scheduleTrigger",
  "typeVersion": 1.1,
  "position": [-800, 400]
}
```

- [ ] **Step 3: Add HTTP GET node (owners-digest-context)**

```json
{
  "parameters": {
    "url": "https://kayvila.vercel.app/api/agent/owners-digest-context",
    "sendHeaders": true,
    "headerParameters": {
      "parameters": [
        {
          "name": "Authorization",
          "value": "=<CRON_API_KEY_VALUE>" 
        }
      ]
    },
    "options": { "timeout": 30000 }
  },
  "id": "cron-fetch-context",
  "name": "HTTP - Fetch Owners Digest Context",
  "type": "n8n-nodes-base.httpRequest",
  "typeVersion": 4.2,
  "position": [-560, 400]
}
```

Replace `<CRON_API_KEY_VALUE>` with the actual `CRON_API_KEY` value from Vercel (hardcode — n8n Cloud blocks `$env` and `process.env`). Format: `Bearer <key>` — the Authorization header already uses the `Bearer` prefix from node config.

Add connection:
```json
["Schedule Trigger (8h Martinique)", "HTTP - Fetch Owners Digest Context"]
```

- [ ] **Step 4: Add Split Out node (per owner)**

```json
{
  "parameters": {
    "sourceData": "json",
    "jsonField": "owners",
    "options": {}
  },
  "id": "cron-split",
  "name": "Split Out - Per Owner",
  "type": "n8n-nodes-base.splitOut",
  "typeVersion": 1,
  "position": [-320, 400]
}
```

- [ ] **Step 5: Add LLM Chain node (DeepSeek — message chaleureux)**

```json
{
  "parameters": {
    "text": "=Tu es Kayvibot, l'assistant personnel d'un propriétaire de villa de luxe Kayvila en Martinique. Rédige un message PROACTIF et CHALEUREUX (pas un rapport froid) basé sur le contexte ci-dessous.\n\nDate/heure Martinique : {{ $json.current_date_iso }}\n\nPORTFOLIO :\n- Villas : {{ $json.total_villas }} publiées\n- Revenus du mois : {{ $json.revenue_current_month }} €\n- Réservations à venir : {{ $json.upcoming_bookings_count }}\n- Tâches en attente : {{ $json.pending_tasks_count }}\n\nAUJOURD'HUI (check-ins/outs) : {{ JSON.stringify($json.today) }}\nALERTES : {{ JSON.stringify($json.alerts) }}\n\nRÈGLES :\n- TEXTE BRUT uniquement, zéro markdown, zéro emoji dans le corps sauf 👋 en ouverture\n- Ton chaleureux, comme un(e) concierge qui prend des nouvelles\n- RÉSUMER, pas tout lister : mentionne les check-ins/outs importants, les alertes, et un point positif\n- Si pas de check-in/out aujourd'hui, dis-le avec bonne humeur\n- Mentionne les tâches en retard avec bienveillance\n- Termine par \"Bonne journée ! ☀️\" ou équivalent\n\nRéponds UNIQUEMENT avec le message (pas de JSON, pas de méta-données)."
  },
  "id": "cron-llm",
  "name": "LLM - Générateur de message",
  "type": "@n8n/n8n-nodes-langchain.chainLlm",
  "typeVersion": 1,
  "position": [-80, 400]
}
```

And its sub-node (LLM model):

```json
{
  "parameters": {
    "model": "deepseek-v4-pro",
    "options": {}
  },
  "type": "@n8n/n8n-nodes-langchain.lmChatDeepSeek",
  "typeVersion": 1,
  "position": [-80, 560],
  "id": "cron-llm-model",
  "name": "DeepSeek Chat Model (Cron)",
  "credentials": {
    "deepSeekApi": {
      "id": "s16Eub8KTcJLPBw5",
      "name": "KARIBLOOM DEEPSEEK"
    }
  }
}
```

Connection: `cron-llm-model.ai_languageModel → cron-llm.ai_languageModel`

- [ ] **Step 6: Add Postgres INSERT node**

```json
{
  "parameters": {
    "schema": { "__rl": true, "value": "public", "mode": "list" },
    "table": { "__rl": true, "value": "notifications", "mode": "list" },
    "columns": {
      "mappingMode": "defineBelow",
      "value": {
        "user_id": "={{ $('Split Out - Per Owner').first().json.owner_id }}",
        "type": "owner_daily_digest",
        "title": "Votre point du jour",
        "body": "={{ $json.text }}",
        "action_url": "/dashboard",
        "metadata": "={{ JSON.stringify({ source: 'agent_b_cron', date_mq: $json.current_date_iso }) }}"
      }
    },
    "options": {}
  },
  "id": "cron-insert",
  "name": "Postgres - Insert Digest",
  "type": "n8n-nodes-base.postgres",
  "typeVersion": 2.4,
  "position": [160, 400],
  "credentials": {
    "postgres": {
      "id": "szSBC134iAZHEyPA",
      "name": "DIAMANT NOIR"
    }
  }
}
```

Complete connection chain:
```
Schedule Trigger → HTTP GET → Split Out → LLM Chain → Postgres INSERT
```

- [ ] **Step 7: Update workflow settings for timezone**

Add to the workflow `settings` object:
```json
"settings": {
  "executionOrder": "v1",
  "timezone": "America/Martinique"
}
```

- [ ] **Step 8: Deploy updated workflow to n8n Cloud**

```bash
# Use the n8n API KEY to PUT the workflow
N8N_KEY="<key>" python3 -c "
import json,urllib.request

with open('docs/n8n/kayvibot-agent-b-proprietaire-fusion.json') as f:
    d = json.load(f)

# Patch LLM node to native DeepSeek
for n in d['nodes']:
    if n.get('name') == 'DeepSeek Chat Model (Cron)':
        n['credentials'] = {'deepSeekApi': {'id': 's16Eub8KTcJLPBw5', 'name': 'KARIBLOOM DEEPSEEK'}}

payload = {'name': d['name'], 'nodes': d['nodes'], 'connections': d['connections'], 'settings': d.get('settings') or {'executionOrder': 'v1'}}

req = urllib.request.Request(
    'https://kenneson.app.n8n.cloud/api/v1/workflows/q4DAjw1uG19fDfr8',
    data=json.dumps(payload).encode(),
    method='PUT'
)
req.add_header('X-N8N-API-KEY', '$N8N_KEY')
req.add_header('Content-Type', 'application/json')
with urllib.request.urlopen(req, timeout=40) as resp:
    print('PUT', resp.status)

# Activate
req2 = urllib.request.Request(
    'https://kenneson.app.n8n.cloud/api/v1/workflows/q4DAjw1uG19fDfr8/activate',
    method='POST'
)
req2.add_header('X-N8N-API-KEY', '$N8N_KEY')
with urllib.request.urlopen(req2, timeout=40) as resp:
    print('activate', resp.status)
"
```

- [ ] **Step 9: Trigger cron manually to test**

```bash
# Via n8n API — trigger workflow execution
curl -X POST \
  -H "X-N8N-API-KEY: $N8N_KEY" \
  "https://kenneson.app.n8n.cloud/api/v1/workflows/q4DAjw1uG19fDfr8/activate"
# Then use the n8n UI to "Execute Workflow" on the cron branch, or POST an execution
```

- [ ] **Step 10: Verify digest was inserted in Supabase**

```sql
select user_id, title, left(body, 80) as body_preview, created_at
from public.notifications
where type = 'owner_daily_digest'
order by created_at desc
limit 10;
```

Expected: one row per owner without prior digest today, each with a warm French message.

- [ ] **Step 11: Verify idempotency — run cron twice**

Trigger execution again via n8n UI or API:
```bash
# Check no duplicate rows for same owner same day
```

Expected: second run skips all owners (already have a digest today).

- [ ] **Step 12: Commit the updated workflow JSON**

```bash
git add docs/n8n/kayvibot-agent-b-proprietaire-fusion.json
git commit -m "feat(n8n): add proactive cron branch (daily digest) to Agent B

Co-Authored-By: claude-flow <ruv@ruv.net>"
```

---

### Task 8: Deploy + E2E test from dashboard

**Files:**
- Test: `tests/e2e/proactive-notification.spec.ts`

- [ ] **Step 1: Push, deploy, wait for Ready**

```bash
git push origin main
vercel --prod --yes
# Wait for build, verify with:
vercel ls --prod | head -2
# Expected: ● Ready
```

- [ ] **Step 2: Write E2E Playwright test**

```typescript
import { test, expect } from "@playwright/test";

const BASE = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";

test.describe("Proactive Notification — Owner Dashboard", () => {
  test("displays daily digest and can mark it as read", async ({ page }) => {
    // Login as owner
    await page.goto(`${BASE}/login?redirect=/dashboard`);
    await page.fill('input[name="email"]', "proprio1@test.com");
    await page.fill('input[name="password"]', "Test123456!");
    await page.click('button[type="submit"]');
    await page.waitForURL("**/dashboard");

    // Verify the proactive notification card is displayed
    const card = page.locator('[aria-label="Point du jour Kayvila"]');
    await expect(card).toBeVisible({ timeout: 15000 });

    // Verify it has content
    const body = card.locator("div.text-navy\\/75");
    await expect(body).not.toBeEmpty();

    // Click "Marquer comme lu"
    const dismissButton = card.locator('button[aria-label="Marquer comme lu"]');
    await dismissButton.click();

    // Card should disappear
    await expect(card).not.toBeVisible({ timeout: 5000 });

    // Reload — card should stay gone
    await page.reload();
    await page.waitForURL("**/dashboard");
    await page.waitForTimeout(3000);
    const cardAfterReload = page.locator('[aria-label="Point du jour Kayvila"]');
    await expect(cardAfterReload).not.toBeVisible({ timeout: 5000 });
  });
});
```

- [ ] **Step 3: Run E2E test**

```bash
npx playwright test tests/e2e/proactive-notification.spec.ts --project=chromium
# Expected: PASS (if a digest exists in DB for proprio1)
```

- [ ] **Step 4: Commit**

```bash
git add tests/e2e/proactive-notification.spec.ts
git commit -m "test(e2e): proactive notification dashboard display and mark-read

Co-Authored-By: claude-flow <ruv@ruv.net>"
```

---

### Task 9: LEARNINGS.md update

**Files:**
- Modify: `docs/auto-learn/LEARNINGS.md`

- [ ] **Step 1: Update LEARNINGS with proactive feature notes**

Update the `2026-06-20 (soir) — Design couche proactive Agent B` section to note implementation was completed, and add any new learnings (e.g., CRON_API_KEY value needed for n8n, Split Out node behavior, LLM Chain prompt tuning).

- [ ] **Step 2: Commit**

```bash
git add docs/auto-learn/LEARNINGS.md
git commit -m "docs(auto-learn): proactive Agent B implementation notes

Co-Authored-By: claude-flow <ruv@ruv.net>"
```
