# Admin Copilot Phase 1 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade admin agent C into a rich action-capable copilot: integrated chat UI, SET_PRICE/BLOCK_DATE/SHOW_BOOKING (any villa) + UPDATE_SUBMISSION_STATUS with a confirm-before-execute flow + audit log, and surface owner-made villa changes.

**Architecture:** Mirror the owner copilot pipeline for admin. `/api/concierge/admin` becomes a smart route (forwards admin token to n8n, parses reply, returns write actions as `proposed_action` for confirmation, executes confirmed actions + logs them). A DB trigger logs villa changes to `villa_changes` (attributed to the villa owner). `admin-context` surfaces those changes and teaches the actions. Frontend `AdminCopilotChat` uses `useCopilot` with a new `confirmAction`.

**Tech Stack:** Next.js 14 App Router, Supabase (service-role via `supabaseAdmin()`), n8n Cloud (workflow `7gtgluMV6cft6H7X`), DeepSeek, Resend (existing submission emails), Playwright.

## Global Constraints

- Zéro redesign (or `#d4af37` / navy `#0a0a0a`, Instrument Sans / Playfair Display / Sora, radius anguleux)
- Toute action ÉCRITURE passe par confirmation explicite (carte [Confirmer]/[Annuler]) + audit log `admin_action_log`. L'agent PROPOSE, la route exécute après clic.
- `villas` n'a PAS de colonne `price` → n'updater que `price_per_night`
- n8n : auth par header (jamais query), pas de `$env`/`process.env`
- `client.config.ts` source de vérité ; apostrophes FR en double quotes dans les strings JS
- `npx tsc --noEmit` avant chaque commit ; vérifier `vercel ls --prod` Ready après déploiement
- Réutiliser la logique existante (submission status), ne pas dupliquer
- Hors scope Phase 1 (noté roadmap) : remboursement Stripe, bulk, messagerie, notifications Resend "nouvelle réservation"

---

### Task 1: Migrations — villa_changes (+trigger) & admin_action_log

**Files:**
- Create: `supabase/migrations/20260620_admin_copilot_phase1.sql`

**Interfaces:**
- Produces tables `public.villa_changes`, `public.admin_action_log` + trigger `trg_log_villa_change`

- [ ] **Step 1: Write the migration file**

```sql
-- ═══════════════════════════════════════════════════════════════════
-- Migration : Admin Copilot Phase 1 — tracking modifs villa + audit log
-- ═══════════════════════════════════════════════════════════════════

-- 1) Journal des modifications de villas (attribué au propriétaire de la villa)
create table if not exists public.villa_changes (
  id          uuid primary key default gen_random_uuid(),
  villa_id    uuid not null references public.villas(id) on delete cascade,
  owner_id    uuid,
  field       text not null,
  old_value   text,
  new_value   text,
  changed_at  timestamptz not null default now()
);
create index if not exists idx_villa_changes_recent on public.villa_changes (changed_at desc);
alter table public.villa_changes enable row level security;
create policy "villa_changes_service_all" on public.villa_changes for all using (true) with check (true);

-- 2) Trigger : logge les champs suivis quand ils changent
create or replace function public.log_villa_change() returns trigger
language plpgsql security definer as $$
begin
  if new.price_per_night is distinct from old.price_per_night then
    insert into public.villa_changes(villa_id, owner_id, field, old_value, new_value)
    values (new.id, new.owner_id, 'price_per_night', old.price_per_night::text, new.price_per_night::text);
  end if;
  if new.name is distinct from old.name then
    insert into public.villa_changes(villa_id, owner_id, field, old_value, new_value)
    values (new.id, new.owner_id, 'name', old.name, new.name);
  end if;
  if new.is_published is distinct from old.is_published then
    insert into public.villa_changes(villa_id, owner_id, field, old_value, new_value)
    values (new.id, new.owner_id, 'is_published', old.is_published::text, new.is_published::text);
  end if;
  return new;
end $$;

drop trigger if exists trg_log_villa_change on public.villas;
create trigger trg_log_villa_change after update on public.villas
  for each row execute function public.log_villa_change();

-- 3) Journal d'audit des actions admin
create table if not exists public.admin_action_log (
  id          uuid primary key default gen_random_uuid(),
  admin_id    uuid not null,
  action      text not null,
  action_data jsonb default '{}',
  result      jsonb default '{}',
  created_at  timestamptz not null default now()
);
create index if not exists idx_admin_action_log_recent on public.admin_action_log (created_at desc);
alter table public.admin_action_log enable row level security;
create policy "admin_action_log_service_all" on public.admin_action_log for all using (true) with check (true);
```

- [ ] **Step 2: Apply via Supabase SQL Editor**

Open `https://supabase.com/dashboard/project/wsdawdxucyuyopkpgjij/sql/new`, paste the migration, Run. Expected: success, no error.

- [ ] **Step 3: Verify trigger works**

In SQL Editor run (replace with a real villa id from `select id, price_per_night from villas limit 1`):
```sql
update villas set price_per_night = price_per_night where id = '<id>'; -- no-op, no row
update villas set price_per_night = price_per_night + 1 where id = '<id>';
select * from villa_changes order by changed_at desc limit 3;
update villas set price_per_night = price_per_night - 1 where id = '<id>'; -- reset
```
Expected: one `villa_changes` row for the +1 change with field `price_per_night`.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260620_admin_copilot_phase1.sql
git commit -m "feat(db): villa_changes trigger + admin_action_log (admin copilot phase1)

Co-Authored-By: claude-flow <ruv@ruv.net>"
```

---

### Task 2: Shared submission-status logic

**Files:**
- Create: `lib/submissions/update-status.ts`
- Modify: `app/api/villa-submissions/route.ts` (PATCH handler calls the shared fn)

**Interfaces:**
- Produces: `updateSubmissionStatus(admin, { id, status, adminId }): Promise<{ submission: Record<string, unknown> | null; error?: string }>`
- Consumes: existing PATCH side effects (status update + Resend email + webhook)

- [ ] **Step 1: Read the current PATCH handler**

Read `app/api/villa-submissions/route.ts` fully (the PATCH function) to capture the exact update + email + webhook logic.

- [ ] **Step 2: Create the shared function**

Create `lib/submissions/update-status.ts` extracting the core of the PATCH handler (update `villa_submissions.status`, send Resend status email, fire `VILLA_SUBMISSION_WEBHOOK`/`N8N_WEBHOOK_URL`). Signature:

```typescript
import type { SupabaseClient } from "@supabase/supabase-js";

export async function updateSubmissionStatus(
  admin: SupabaseClient,
  params: { id: string; status: "accepted" | "rejected"; reason?: string },
): Promise<{ submission: Record<string, unknown> | null; error?: string }> {
  const { id, status } = params;
  const { data: submission, error } = await admin
    .from("villa_submissions")
    .update({ status })
    .eq("id", id)
    .select("*")
    .single();
  if (error || !submission) {
    return { submission: null, error: error?.message ?? "Soumission introuvable" };
  }
  // ... (transplant the existing Resend email + webhook side effects here, verbatim) ...
  return { submission };
}
```

The implementer MUST transplant the actual email/webhook code from the existing PATCH handler verbatim (do not invent). Keep RESEND_FROM, render(), getResend(), template selection identical.

- [ ] **Step 3: Refactor PATCH to call the shared function**

In `app/api/villa-submissions/route.ts` PATCH, after auth + parsing `{ id, status }`, replace the inline update+email+webhook with `await updateSubmissionStatus(admin, { id, status })` and return its `submission`.

- [ ] **Step 4: Type-check**

```bash
npx tsc --noEmit 2>&1 | grep -E "submissions|error TS" | head
```

- [ ] **Step 5: Commit**

```bash
git add lib/submissions/update-status.ts app/api/villa-submissions/route.ts
git commit -m "refactor(submissions): extract updateSubmissionStatus for reuse by admin copilot

Co-Authored-By: claude-flow <ruv@ruv.net>"
```

---

### Task 3: admin-context — surface villa_changes + teach SET_PRICE/SHOW_BOOKING

**Files:**
- Modify: `app/api/agent/admin-context/route.ts` (add villa_changes fetch to context + extend systemPrompt)

**Interfaces:**
- Consumes: `supabaseAdmin()`, existing `gatherAdminContext`
- Produces: `context.recent_villa_changes` array + systemPrompt action schemas

- [ ] **Step 1: Add villa_changes to the gathered context**

In `gatherAdminContext`, add to the `Promise.all` a query:
```typescript
supabase.from("villa_changes").select("villa_id, owner_id, field, old_value, new_value, changed_at").gte("changed_at", addDays(todayStr, -7)).order("changed_at", { ascending: false }).limit(50),
```
Destructure as `changesRes` and include `recent_villa_changes: changesRes.data ?? []` in the returned `contextData`.

- [ ] **Step 2: Extend the systemPrompt — actions + surfacing instruction**

Replace the `RÈGLES` block of the systemPrompt with this (keeps existing actions, adds SET_PRICE/SHOW_BOOKING + exact action_data schemas + villa_changes instruction):

```
RÈGLES
- Répondre en JSON : { "response": "...", "action": "...", "action_data": {...}, "suggested_prompts": [...] }
- Par défaut action = "SHOW_STATS".
- Utiliser UNIQUEMENT les données du contexte — ne rien inventer.
- Prioriser les alertes par criticité : OTA désynchronisé > tâches en retard > sous-performance.
- Toujours proposer 3-5 suggested_prompts actionnables.

SURFAÇAGE PROACTIF
- Dans recent_villa_changes, signale les modifications faites par les propriétaires (ex : "Le propriétaire de Villa X a changé son prix de 1500 à 2000 €/nuit le JJ/MM"). Mentionne-les si pertinent ou si on te le demande.

ACTIONS EXÉCUTABLES (l'admin confirmera avant exécution — propose, n'exécute jamais toi-même) :
1) SET_PRICE → action_data = { "price": { "villa_id": "<id>", "price_per_night": <entier €> } }
2) BLOCK_DATE → action_data = { "block": { "villa_id": "<id>", "start_date": "AAAA-MM-JJ", "end_date": "AAAA-MM-JJ", "reason": "<motif>" } }
3) SHOW_BOOKING → action = "SHOW_BOOKING", action_data = { "booking": { "villa_id": "<id optionnel>" } } (lecture seule)
4) UPDATE_SUBMISSION_STATUS → action_data = { "submission": { "submission_id": "<id>", "status": "accepted"|"rejected" } }

RÈGLES ACTIONS (STRICTES) :
- Utilise TOUJOURS le "id" exact depuis les données (villas, villa_submissions). Ne jamais inventer un id.
- N'émets une action QUE sur demande explicite (verbe : "passe", "bloque", "accepte", "refuse", "montre"). Une question = action "SHOW_STATS".
- Une seule action par réponse. Confirme dans "response" ce que l'action va faire.
```

- [ ] **Step 3: Type-check and commit**

```bash
npx tsc --noEmit 2>&1 | grep -E "admin-context|error TS" | head

git add app/api/agent/admin-context/route.ts
git commit -m "feat(admin-context): surface villa_changes + teach SET_PRICE/SHOW_BOOKING actions

Co-Authored-By: claude-flow <ruv@ruv.net>"
```

---

### Task 4: n8n agent C — pass action_data through Parse Response

**Files:**
- Modify: `docs/n8n/kayvibot-agent-c-admin-fusion.json` (Parse Response node) + deploy via API

**Interfaces:**
- Produces: agent C webhook response includes `action_data`

- [ ] **Step 1: Inspect C Parse Response node**

```bash
cd docs/n8n && python3 -c "import json; d=json.load(open('kayvibot-agent-c-admin-fusion.json')); [print(n['parameters'].get('jsCode','')) for n in d['nodes'] if n['name']=='Parse Response']"
```

- [ ] **Step 2: Patch + deploy (mirror the B fix)**

Run this Python (N8N_KEY is the owner-level key already used this session; WID for C is `7gtgluMV6cft6H7X`). In the Parse Response jsCode, after extracting `action`, add `action_data` extraction (`p.action_data || null`) and include `action_data` in the returned json. Then PUT + activate:

```python
import json, urllib.request
N8N_KEY="<OWNER_LEVEL_KEY>"; BASE="https://kenneson.app.n8n.cloud/api/v1"; WID="7gtgluMV6cft6H7X"
F="docs/n8n/kayvibot-agent-c-admin-fusion.json"
d=json.load(open(F,encoding="utf-8"))
for n in d["nodes"]:
    if n["name"]=="Parse Response":
        code=n["parameters"]["jsCode"]
        # add actionData extraction + output (idempotent guards)
        if "action_data" not in code:
            code=code.replace("let reply", "let actionData = null; let reply", 1)
            code=code.replace("action = p.action || 'reply';", "action = p.action || 'reply'; actionData = p.action_data || null;", 1)
            code=code.replace("return { json: {", "return { json: { action_data: actionData,", 1)
            n["parameters"]["jsCode"]=code
json.dump(d, open(F,"w",encoding="utf-8"), ensure_ascii=False, indent=2)
payload={"name":d["name"],"nodes":d["nodes"],"connections":d["connections"],"settings":d["settings"]}
r=urllib.request.Request(BASE+"/workflows/"+WID, data=json.dumps(payload).encode(), method="PUT")
r.add_header("X-N8N-API-KEY",N8N_KEY); r.add_header("Content-Type","application/json")
print("PUT", urllib.request.urlopen(r,timeout=40).status)
r2=urllib.request.Request(BASE+"/workflows/"+WID+"/activate", method="POST"); r2.add_header("X-N8N-API-KEY",N8N_KEY)
print("activate", urllib.request.urlopen(r2,timeout=40).status)
```

Expected: `PUT 200`, `activate 200`. If the replace anchors don't match the C node's exact code, adapt to its actual variable names (read from Step 1) — the goal is: extract `p.action_data` and include `action_data` in the returned json.

- [ ] **Step 3: Commit the JSON**

```bash
git add docs/n8n/kayvibot-agent-c-admin-fusion.json
git commit -m "feat(n8n): agent C Parse Response passes action_data through

Co-Authored-By: claude-flow <ruv@ruv.net>"
```

---

### Task 5: /api/concierge/admin — smart route (token, parse, propose/confirm, handlers, audit)

**Files:**
- Modify: `app/api/concierge/admin/route.ts` (full rewrite of POST)

**Interfaces:**
- Consumes: `requireAdmin`, `getSessionUser` from `lib/auth/server`, `supabaseAdmin`, `updateSubmissionStatus` (Task 2)
- Produces (normal msg): `{ response, action, action_result }` (read) OR `{ response, proposed_action: { action, action_data } }` (write)
- Produces (confirm): `{ action_result }`

- [ ] **Step 1: Rewrite the route**

```typescript
import { NextResponse } from "next/server";
import { requireAdmin, getSessionUser, AuthError } from "@/lib/auth/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getSupabaseServer } from "@/lib/supabase-server";
import { updateSubmissionStatus } from "@/lib/submissions/update-status";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 35;

const READ_ACTIONS = new Set(["SHOW_STATS", "SHOW_BOOKING"]);
const WRITE_ACTIONS = new Set(["SET_PRICE", "BLOCK_DATE", "UPDATE_SUBMISSION_STATUS"]);

type ActionData = Record<string, unknown>;

async function execAction(
  adminId: string,
  action: string,
  actionData: ActionData,
): Promise<{ success: boolean; [key: string]: unknown }> {
  const admin = supabaseAdmin();
  let result: { success: boolean; [key: string]: unknown };

  if (action === "SET_PRICE") {
    const pd = (actionData.price ?? {}) as { villa_id?: string; price_per_night?: number };
    if (!pd.villa_id || typeof pd.price_per_night !== "number" || pd.price_per_night <= 0) {
      result = { success: false, error: "Villa ou prix invalide" };
    } else {
      const { data: before } = await admin.from("villas").select("name, price_per_night").eq("id", pd.villa_id).maybeSingle();
      const { data: updated, error } = await admin.from("villas").update({ price_per_night: pd.price_per_night }).eq("id", pd.villa_id).select("id, name, price_per_night").single();
      result = { success: !error, villa: updated, previous_price: before?.price_per_night ?? null, error: error?.message };
    }
  } else if (action === "BLOCK_DATE") {
    const b = (actionData.block ?? {}) as { villa_id?: string; start_date?: string; end_date?: string; reason?: string };
    if (!b.villa_id || !b.start_date || !b.end_date) {
      result = { success: false, error: "Villa ou dates invalides" };
    } else {
      const { data: created, error } = await admin.from("villa_date_blocks").insert({ villa_id: b.villa_id, start_date: b.start_date, end_date: b.end_date, reason: b.reason || "Blocage via Concierge Admin", origin: "Kayvila", created_by: adminId }).select("id").single();
      result = { success: !error, block_id: created?.id, error: error?.message };
    }
  } else if (action === "UPDATE_SUBMISSION_STATUS") {
    const s = (actionData.submission ?? {}) as { submission_id?: string; status?: "accepted" | "rejected"; reason?: string };
    if (!s.submission_id || (s.status !== "accepted" && s.status !== "rejected")) {
      result = { success: false, error: "Soumission ou statut invalide" };
    } else {
      const { submission, error } = await updateSubmissionStatus(admin, { id: s.submission_id, status: s.status, reason: s.reason });
      result = { success: !error, submission, error };
    }
  } else {
    result = { success: false, error: "Action inconnue" };
  }

  await admin.from("admin_action_log").insert({ admin_id: adminId, action, action_data: actionData, result });
  return result;
}

export async function POST(request: Request) {
  try {
    const adminId = await requireAdmin(request);
    const body = await request.json().catch(() => ({}));

    // ── Flux confirmation : exécuter une action déjà proposée ──
    if (body.confirm_action?.action) {
      const { action, action_data } = body.confirm_action as { action: string; action_data: ActionData };
      if (!WRITE_ACTIONS.has(action)) {
        return NextResponse.json({ error: "Action non confirmable" }, { status: 400 });
      }
      const action_result = await execAction(adminId, action, action_data ?? {});
      return NextResponse.json({ action_result });
    }

    // ── Flux normal : message → n8n ──
    const message = typeof body.message === "string" ? body.message.trim() : "";
    if (!message) return NextResponse.json({ error: "Message requis" }, { status: 400 });

    const webhookURL = process.env.N8N_ADMIN_WEBHOOK_URL || process.env.N8N_WEBHOOK_URL;
    if (!webhookURL) {
      return NextResponse.json({ response: "Mode démo : configurez N8N_ADMIN_WEBHOOK_URL.", request_id: "demo" });
    }

    // Token admin pour que l'agent fetch admin-context
    const supabase = await getSupabaseServer();
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token ?? "";

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 32_000);
    try {
      const res = await fetch(webhookURL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, token }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!res.ok) throw new Error(`n8n ${res.status}`);
      const data = await res.json();

      const reply =
        (typeof data.response === "string" && data.response) ||
        (typeof data.reply === "string" && data.reply) ||
        (typeof data.output === "string" && data.output) ||
        "Je n'ai pas pu générer de réponse.";
      const action = typeof data.action === "string" ? data.action : "SHOW_STATS";
      const actionData = (data.action_data ?? {}) as ActionData;

      if (WRITE_ACTIONS.has(action)) {
        // Ne pas exécuter — proposer pour confirmation
        return NextResponse.json({ response: reply, proposed_action: { action, action_data: actionData } });
      }
      if (action === "SHOW_BOOKING") {
        const admin = supabaseAdmin();
        const today = new Date().toISOString().split("T")[0];
        const villaId = ((actionData.booking ?? {}) as { villa_id?: string }).villa_id;
        let q = admin.from("bookings").select("id, guest_name, villa_id, start_date, end_date, status, total_price_cents").or(`start_date.gte.${today},and(start_date.lte.${today},end_date.gte.${today})`).order("start_date", { ascending: true }).limit(1);
        if (villaId) q = q.eq("villa_id", villaId);
        const { data: nextBooking } = await q.maybeSingle();
        return NextResponse.json({ response: reply, action, action_result: { success: true, booking: nextBooking ?? null } });
      }
      // SHOW_STATS / défaut
      return NextResponse.json({ response: reply, action, request_id: data.request_id ?? "n8n" });
    } catch (fetchErr) {
      clearTimeout(timeout);
      console.error("[concierge-admin] n8n error", fetchErr);
      return NextResponse.json({ response: "Désolé, problème technique. Réessayez.", request_id: "fallback" });
    }
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    console.error("[concierge-admin] error", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Type-check and commit**

```bash
npx tsc --noEmit 2>&1 | grep -E "concierge/admin|error TS" | head

git add app/api/concierge/admin/route.ts
git commit -m "feat(concierge/admin): smart route with propose/confirm actions + audit log

Co-Authored-By: claude-flow <ruv@ruv.net>"
```

---

### Task 6: useCopilot — confirmAction + types

**Files:**
- Modify: `types/copilot.ts` (add proposedAction to message + CopilotResponse fields)
- Modify: `hooks/useCopilot.ts` (parse proposed_action; add confirmAction)

**Interfaces:**
- Consumes: `/api/concierge/admin` proposal/confirm contract
- Produces: `useCopilot(...)` returns `confirmAction(action, actionData)` ; `CopilotMessage.proposedAction?`

- [ ] **Step 1: Extend types/copilot.ts**

Add to `CopilotMessage`:
```typescript
  /** Action proposée nécessitant confirmation (admin) */
  proposedAction?: { action: string; action_data: Record<string, unknown> } | null;
```
Add to `CopilotResponse`:
```typescript
  proposed_action?: { action: string; action_data: Record<string, unknown> } | null;
```

- [ ] **Step 2: Parse proposed_action in sendMessage**

In `hooks/useCopilot.ts`, in the assistant message built from the response, add:
```typescript
  proposedAction: data.proposed_action ?? null,
```

- [ ] **Step 3: Add confirmAction**

In `useCopilot`, add a callback (uses the same `getAuthHeader` + `webhookUrl`):
```typescript
  const confirmAction = useCallback(
    async (action: string, actionData: Record<string, unknown>) => {
      setIsLoading(true);
      try {
        const res = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...(await getAuthHeader()) },
          body: JSON.stringify({ confirm_action: { action, action_data: actionData } }),
        });
        if (res.ok) {
          const data = await res.json();
          const msg: CopilotMessage = {
            id: `action-${Date.now()}`,
            role: "assistant",
            content: "",
            timestamp: Date.now(),
            action,
            actionResult: data.action_result ?? null,
          };
          setMessages((prev) => [...prev, msg]);
        }
      } catch {
        // best-effort
      } finally {
        setIsLoading(false);
      }
    },
    [webhookUrl],
  );
```
Return `confirmAction` from the hook.

- [ ] **Step 4: Type-check and commit**

```bash
npx tsc --noEmit 2>&1 | grep -E "useCopilot|copilot|error TS" | head

git add types/copilot.ts hooks/useCopilot.ts
git commit -m "feat(copilot): proposedAction + confirmAction for admin confirm flow

Co-Authored-By: claude-flow <ruv@ruv.net>"
```

---

### Task 7: AdminCopilotChat + confirm card + admin page

**Files:**
- Create: `components/dashboard/admin/AdminCopilotChat.tsx`
- Modify: `app/(admin)/admin/concierge/page.tsx`

**Interfaces:**
- Consumes: `useCopilot({ webhookUrl: "/api/concierge/admin" })`, `CopilotActionCard`, `CopilotMessage`
- Produces: full-height admin chat with confirm cards

- [ ] **Step 1: Create AdminCopilotChat**

Mirror `components/dashboard/DashboardCopilotChat.tsx` but: (a) use `useCopilot` directly (no context); (b) header "Concierge IA — Admin"; (c) render a confirmation card when a message has `proposedAction` (buttons Confirmer → `confirmAction(pa.action, pa.action_data)`, Annuler → local dismiss state); (d) `fullHeight` layout `h-[calc(100dvh-13rem)]`. Reuse `CopilotActionCard` for `actionResult`.

```tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { ArrowUp, Sparkles, RotateCcw, ShieldCheck } from "lucide-react";
import { useCopilot } from "@/hooks/useCopilot";
import { CopilotMessage } from "@/components/dashboard/proprio/CopilotMessage";
import { CopilotActionCard } from "@/components/dashboard/CopilotActionCard";

export function AdminCopilotChat() {
  const { messages, isLoading, sendMessage, clearMessages, confirmAction } =
    useCopilot({ webhookUrl: "/api/concierge/admin" });
  const [input, setInput] = useState("");
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage(input);
    setInput("");
    inputRef.current?.focus();
  };

  return (
    <div className="flex h-[calc(100dvh-13rem)] flex-col rounded-lg border border-navy/10 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-navy/5 px-5 py-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-gold" aria-hidden />
          <span className="font-display text-sm font-semibold text-navy">Concierge IA — Admin</span>
        </div>
        <button type="button" onClick={clearMessages} className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium uppercase tracking-[0.1em] text-navy/40 transition-colors hover:text-navy/70" aria-label="Réinitialiser la conversation">
          <RotateCcw className="h-3 w-3" /> Reset
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        {messages.length <= 1 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Sparkles className="mb-3 h-8 w-8 text-gold/40" aria-hidden />
            <p className="text-[13px] leading-relaxed text-navy/60">Concierge IA Kayvila — supervision globale. Posez une question ou demandez une action (prix, blocage, soumission).</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <div key={msg.id}>
                {msg.content ? <CopilotMessage message={msg} /> : null}
                {msg.actionResult && msg.action ? (
                  <CopilotActionCard action={msg.action} result={msg.actionResult} />
                ) : null}
                {msg.proposedAction && !dismissed.has(msg.id) ? (
                  <div className="mt-3 rounded-lg border border-gold/30 bg-gold/[0.04] p-4">
                    <div className="flex items-start gap-3">
                      <ShieldCheck className="mt-0.5 h-4 w-4 text-gold" />
                      <div className="flex-1">
                        <p className="text-[13px] font-semibold text-navy">Confirmer cette action ?</p>
                        <p className="mt-1 text-[12px] text-navy/65">{describeAction(msg.proposedAction)}</p>
                        <div className="mt-3 flex gap-2">
                          <button onClick={() => { confirmAction(msg.proposedAction!.action, msg.proposedAction!.action_data); setDismissed((p) => new Set(p).add(msg.id)); }} className="rounded-md bg-navy px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-white hover:bg-navy/90">Confirmer</button>
                          <button onClick={() => setDismissed((p) => new Set(p).add(msg.id))} className="rounded-md border border-navy/15 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-navy/55 hover:text-navy">Annuler</button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy-900"><Sparkles className="h-4 w-4 text-white" aria-hidden /></div>
                <div className="rounded-bl-sm rounded-xl bg-cream p-3"><div className="flex gap-1.5"><span className="dn-typing-dot h-2 w-2 rounded-full bg-navy-900/40" /><span className="dn-typing-dot h-2 w-2 rounded-full bg-navy-900/40" style={{ animationDelay: "0.15s" }} /><span className="dn-typing-dot h-2 w-2 rounded-full bg-navy-900/40" style={{ animationDelay: "0.3s" }} /></div></div>
              </div>
            )}
            <div ref={endRef} />
          </div>
        )}
      </div>

      <div className="border-t border-navy/5 px-4 py-3">
        <form onSubmit={submit} className="flex items-center gap-2">
          <input ref={inputRef} type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Posez votre question..." disabled={isLoading} className="flex-1 rounded-lg border border-navy/15 bg-cream px-4 py-2.5 text-sm text-navy-900 placeholder:text-navy/30 outline-none focus:border-navy-900 focus:ring-1 focus:ring-navy-900 disabled:opacity-50" />
          <button type="submit" disabled={!input.trim() || isLoading} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-navy-900 text-white transition-colors hover:bg-navy-800 disabled:opacity-40" aria-label="Envoyer"><ArrowUp className="h-4 w-4" /></button>
        </form>
      </div>
    </div>
  );
}

function describeAction(pa: { action: string; action_data: Record<string, unknown> }): string {
  const d = pa.action_data as Record<string, any>;
  if (pa.action === "SET_PRICE") return `Modifier le prix → ${d.price?.price_per_night} €/nuit`;
  if (pa.action === "BLOCK_DATE") return `Bloquer du ${d.block?.start_date} au ${d.block?.end_date}`;
  if (pa.action === "UPDATE_SUBMISSION_STATUS") return `Soumission → ${d.submission?.status}`;
  return "Action à confirmer";
}
```

- [ ] **Step 2: Swap the admin concierge page**

Rewrite `app/(admin)/admin/concierge/page.tsx` to render `<AdminCopilotChat />` instead of `AgentChat` (keep the admin auth guard + heading).

```tsx
import { getSupabaseServer } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { AdminCopilotChat } from "@/components/dashboard/admin/AdminCopilotChat";
import { requireAdmin } from "@/lib/auth/admin-access"; // keep existing guard pattern used by the page

export const dynamic = "force-dynamic";

export default async function AdminConciergePage() {
  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/admin/concierge");
  return (
    <div>
      <div className="mb-4">
        <h1 className="font-display text-xl text-navy">Concierge IA</h1>
        <p className="mt-1 text-[11px] text-navy/50">Supervision globale — questions et actions (prix, blocage, soumissions)</p>
      </div>
      <AdminCopilotChat />
    </div>
  );
}
```
The implementer MUST keep the EXACT existing admin auth guard the page already uses (read it first — it currently uses `getSupabaseServer` + `isStaffAdmin`). Do not weaken auth.

- [ ] **Step 3: Type-check and commit**

```bash
npx tsc --noEmit 2>&1 | grep -E "AdminCopilotChat|concierge|error TS" | head

git add components/dashboard/admin/AdminCopilotChat.tsx app/\(admin\)/admin/concierge/page.tsx
git commit -m "feat(admin): AdminCopilotChat rich copilot with confirm cards on concierge page

Co-Authored-By: claude-flow <ruv@ruv.net>"
```

---

### Task 8: Deploy + E2E test

**Files:**
- Create: `tests/e2e/admin-copilot.spec.ts`

- [ ] **Step 1: Push + deploy**

```bash
git push origin main
vercel --prod --yes
vercel ls --prod | head -2   # expect ● Ready
```

- [ ] **Step 2: Write E2E test**

```typescript
import { test, expect } from "@playwright/test";
const BASE = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";

test("admin concierge shows rich copilot and proposes SET_PRICE with confirm", async ({ page }) => {
  await page.goto(`${BASE}/login?redirect=/admin/concierge`);
  await page.getByLabel(/email/i).fill("admin@diamantnoir.com");
  await page.getByLabel(/mot de passe/i).fill("Admin123!");
  await page.getByRole("button", { name: /accéder/i }).click();
  await page.waitForURL("**/admin/concierge", { timeout: 15000 });

  await expect(page.getByText("Concierge IA — Admin")).toBeVisible({ timeout: 10000 });

  const input = page.locator('input[placeholder="Posez votre question..."]');
  await input.fill("Passe la première villa à 1900 euros la nuit");
  await input.press("Enter");

  // A confirmation card appears (write action proposed, not executed)
  await expect(page.getByText("Confirmer cette action ?")).toBeVisible({ timeout: 35000 });
});
```

- [ ] **Step 3: Run E2E + manual verification**

```bash
npx playwright test tests/e2e/admin-copilot.spec.ts --project=chromium
```
Then manually (Playwright MCP or browser): login admin → "passe la villa X à 1900€" → confirm card → Confirmer → verify `villas.price_per_night` updated + a `admin_action_log` row exists.

- [ ] **Step 4: Commit**

```bash
git add tests/e2e/admin-copilot.spec.ts
git commit -m "test(e2e): admin copilot propose/confirm SET_PRICE

Co-Authored-By: claude-flow <ruv@ruv.net>"
```

---

### Task 9: LEARNINGS update

**Files:**
- Modify: `docs/auto-learn/LEARNINGS.md`

- [ ] **Step 1: Add a section**

Document: admin copilot Phase 1 done (actions + confirm flow + audit log + villa_changes trigger). Learnings: Supabase pooler breaks `SET LOCAL` session vars (trigger attributes changes to owner_id instead); admin systemPrompt already declared actions but nothing executed them (route + Parse Response were the missing links); reused `updateSubmissionStatus` to avoid duplicating email/webhook side effects; confirm-before-execute pattern for admin write actions.

- [ ] **Step 2: Commit**

```bash
git add docs/auto-learn/LEARNINGS.md
git commit -m "docs(auto-learn): admin copilot phase 1 implementation notes

Co-Authored-By: claude-flow <ruv@ruv.net>"
```
