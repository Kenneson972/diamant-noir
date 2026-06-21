# Agent C / Monitoring Proactif Admin — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Détecteurs proactifs admin Kayvila, 100% app-side : Vercel Cron → endpoint gaté → helper pur → email templaté Resend à l'admin. Récap quotidien, soumissions>48h, récap hebdo (CA/anomalie/proprios inactifs), villas fantômes, + alertes temps réel hot_lead/ical_error.

**Architecture:** Endpoints `GET /api/cron/<detector>` (coquilles : `verifyApiKey` → helper → email), logique en helpers purs `lib/proactive/*.ts` (testés vitest), envoi via `lib/emails/admin-proactive.ts`. Dédup par item via table `proactive_alerts_sent`. Aucun n8n.

**Tech Stack:** Next.js 15 route handlers (Node runtime), Supabase service-role (`supabaseAdmin`), Resend SDK (`lib/resend.ts`), vitest, Vercel Cron (`vercel.json`).

## Global Constraints

- **Auth cron :** chaque endpoint commence par `if (!verifyApiKey(request)) return new NextResponse("Unauthorized", { status: 401 });` (`verifyApiKey` de `lib/auth/server.ts`, accepte `CRON_API_KEY`/`CRON_SECRET`).
- **Resend :** toujours `getResend()`/`isResendConfigured()`/`RESEND_FROM`/`ADMIN_NOTIFICATION_EMAIL` de `lib/resend.ts`. `to: [ADMIN_NOTIFICATION_EMAIL]`. Jamais hardcoder d'email.
- **Email seulement si signal non vide.** Aucun mail « RAS ».
- **Zéro redesign** : HTML email sobre, or `#d4af37` / navy ; pas de dépendance UI.
- **Apostrophes FR : double quotes** dans les strings JS (`"d'entretien"`).
- **`runtime = "nodejs"`** sur chaque route. `npx tsc --noEmit` (filtrer `a11y.spec`) avant chaque commit.
- **Helpers purs = testables** : signature `(deps, now)` où la donnée est injectée OU le client Supabase est passé, pour tester sans réseau. Le fetch Supabase vit dans le helper mais derrière une fonction `fetchX(admin)` séparée de la fonction de décision `decideX(rows, now)` qui, elle, est pure et testée.
- **Fuseau :** Martinique = UTC-4. Crons Vercel en UTC. Calculs de dates en arithmétique ISO/UTC.
- **CA :** fenêtre hebdo sur `bookings.created_at`; revenu = `coalesce(total_price_cents,0)` des bookings `status='confirmed'` (ou `payment_status='paid'`) ; montant en cents.

---

### Task 1: Socle — migration `proactive_alerts_sent` + lib dédup

**Files:**
- Create: `supabase/migrations/20260621_proactive_alerts_sent.sql`
- Create: `lib/proactive/dedup.ts`
- Test: `tests/proactive-dedup.test.ts`

**Interfaces:**
- Produces: table `proactive_alerts_sent(detector text, ref_id text, sent_at timestamptz, unique(detector,ref_id))` ; `filterNewRefIds(admin, detector, ids: string[]): Promise<string[]>` (retourne les ids pas encore alertés) ; `markAlerted(admin, detector, ids: string[]): Promise<void>`.

- [ ] **Step 1: Migration**

```sql
create table if not exists public.proactive_alerts_sent (
  id uuid primary key default gen_random_uuid(),
  detector text not null,
  ref_id text not null,
  sent_at timestamptz not null default now(),
  unique (detector, ref_id)
);
alter table public.proactive_alerts_sent enable row level security;
-- service-role only : aucune policy (accès via supabaseAdmin qui bypass RLS)
```
Appliquer via Supabase MCP `apply_migration` (project `wsdawdxucyuyopkpgjij`, name `proactive_alerts_sent`).

- [ ] **Step 2: Test dédup (pure decision part)**

`tests/proactive-dedup.test.ts` — teste la fonction pure `diffNewRefIds(existing: Set<string>, candidates: string[])`:
```ts
import { describe, it, expect } from "vitest";
import { diffNewRefIds } from "@/lib/proactive/dedup";
describe("diffNewRefIds", () => {
  it("retourne seulement les ids absents du set existant", () => {
    expect(diffNewRefIds(new Set(["a"]), ["a", "b", "c"])).toEqual(["b", "c"]);
  });
  it("liste vide si tous déjà alertés", () => {
    expect(diffNewRefIds(new Set(["a", "b"]), ["a", "b"])).toEqual([]);
  });
});
```

- [ ] **Step 3: Run test → FAIL** : `npx vitest run tests/proactive-dedup.test.ts` (module manquant).

- [ ] **Step 4: Implémenter `lib/proactive/dedup.ts`**

```ts
import type { SupabaseClient } from "@supabase/supabase-js";

export function diffNewRefIds(existing: Set<string>, candidates: string[]): string[] {
  return candidates.filter((id) => !existing.has(id));
}

export async function filterNewRefIds(
  admin: SupabaseClient, detector: string, ids: string[]
): Promise<string[]> {
  if (ids.length === 0) return [];
  const { data } = await admin
    .from("proactive_alerts_sent")
    .select("ref_id")
    .eq("detector", detector)
    .in("ref_id", ids);
  const existing = new Set((data ?? []).map((r) => r.ref_id as string));
  return diffNewRefIds(existing, ids);
}

export async function markAlerted(
  admin: SupabaseClient, detector: string, ids: string[]
): Promise<void> {
  if (ids.length === 0) return;
  await admin
    .from("proactive_alerts_sent")
    .upsert(ids.map((ref_id) => ({ detector, ref_id })), { onConflict: "detector,ref_id" });
}
```

- [ ] **Step 5: Run test → PASS** : `npx vitest run tests/proactive-dedup.test.ts`.

- [ ] **Step 6: Commit** : `feat(proactive): table proactive_alerts_sent + lib dédup par item` (+ `Co-Authored-By: claude-flow <ruv@ruv.net>`).

---

### Task 2: Couche email admin proactive (templates)

**Files:**
- Create: `lib/emails/admin-proactive.ts`
- Test: `tests/admin-proactive-email.test.ts`

**Interfaces:**
- Produces (tous `async (...) => Promise<void>`, no-op si `!isResendConfigured()`):
  `sendAdminDailyRecapEmail(data)`, `sendAdminPendingSubmissionsEmail(items)`, `sendAdminWeeklyRecapEmail(data)`, `sendAdminGhostVillasEmail(items)`, `sendAdminHotLeadEmail(data)`, `sendAdminIcalErrorEmail(data)`. Plus une fonction pure de rendu `renderList(title, lines): string` testable.

- [ ] **Step 1: Test du rendu pur**

`tests/admin-proactive-email.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { renderList } from "@/lib/emails/admin-proactive";
describe("renderList", () => {
  it("génère un bloc HTML avec titre et items, échappe le texte", () => {
    const html = renderList("Soumissions", ["Villa <X>", "Villa Y"]);
    expect(html).toContain("Soumissions");
    expect(html).toContain("Villa &lt;X&gt;");
    expect(html).toContain("Villa Y");
  });
  it("retourne chaîne vide si aucun item", () => {
    expect(renderList("T", [])).toBe("");
  });
});
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Implémenter `lib/emails/admin-proactive.ts`**

Squelette (compléter chaque sender ; HTML sobre or/navy ; `escapeHtml` interne) :
```ts
import { getResend, isResendConfigured, RESEND_FROM, ADMIN_NOTIFICATION_EMAIL } from "@/lib/resend";

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

export function renderList(title: string, lines: string[]): string {
  if (lines.length === 0) return "";
  const items = lines.map((l) => `<li style="margin:4px 0">${escapeHtml(l)}</li>`).join("");
  return `<h3 style="color:#1a2238;font-family:sans-serif">${escapeHtml(title)}</h3><ul style="color:#333;font-family:sans-serif">${items}</ul>`;
}

async function sendAdmin(subject: string, html: string): Promise<void> {
  if (!isResendConfigured()) return;
  await getResend().emails.send({
    from: RESEND_FROM,
    to: [ADMIN_NOTIFICATION_EMAIL],
    subject,
    html: `<div style="max-width:600px;margin:auto">${html}</div>`,
  });
}

export async function sendAdminPendingSubmissionsEmail(items: { villa: string; since: string }[]): Promise<void> {
  if (items.length === 0) return;
  await sendAdmin(
    `Kayvila — ${items.length} soumission(s) en attente +48h`,
    renderList("Soumissions en attente depuis +48h", items.map((i) => `${i.villa} — depuis ${i.since}`))
  );
}
// ... idem pour daily-recap, weekly-recap, ghost-villas, hot-lead, ical-error
```
(Définir les types d'entrée de chaque sender selon les helpers des tâches 3-7.)

- [ ] **Step 4: Run → PASS.**

- [ ] **Step 5: tsc** : `npx tsc --noEmit 2>&1 | grep -v a11y.spec` → 0 erreur sur ces fichiers.

- [ ] **Step 6: Commit** : `feat(proactive): couche email admin templatée (renderList + senders)`.

> NB Tasks 3-6 : chaque détecteur sépare `decideX(rows, now)` (pure, testée) de `fetchX(admin)` (réseau) et `route.ts` (coquille). Le sender email correspondant est complété en Task 2 (interfaces ci-dessus) ou ajusté dans la tâche.

---

### Task 3: Détecteur — soumissions en attente >48h

**Files:**
- Create: `lib/proactive/pending-submissions.ts`, `app/api/cron/pending-submissions/route.ts`
- Test: `tests/proactive-pending-submissions.test.ts`

**Interfaces:**
- Consumes: `filterNewRefIds`/`markAlerted` (Task 1), `sendAdminPendingSubmissionsEmail` (Task 2).
- Produces: `decidePendingSubmissions(rows: {id,villa_name,created_at}[], now: Date): {id,villa,since}[]` (pure : garde `created_at < now-48h`).

- [ ] **Step 1: Test pur**
```ts
import { describe, it, expect } from "vitest";
import { decidePendingSubmissions } from "@/lib/proactive/pending-submissions";
const now = new Date("2026-06-21T12:00:00Z");
describe("decidePendingSubmissions", () => {
  it("garde celles créées il y a plus de 48h", () => {
    const rows = [
      { id: "1", villa_name: "Azur", created_at: "2026-06-19T00:00:00Z" }, // >48h
      { id: "2", villa_name: "Corail", created_at: "2026-06-21T00:00:00Z" }, // <48h
    ];
    const out = decidePendingSubmissions(rows, now);
    expect(out.map((o) => o.id)).toEqual(["1"]);
  });
});
```
- [ ] **Step 2: Run → FAIL.**
- [ ] **Step 3: Implémenter le helper pur + `fetchPendingSubmissions(admin)` (`villa_submissions` status='pending') + l'orchestrateur `runPendingSubmissions(admin)` : fetch → decide → filterNewRefIds(detector "pending_submission") → si non vide : sendEmail + markAlerted.**
- [ ] **Step 4: Implémenter `route.ts`** :
```ts
import { NextResponse } from "next/server";
import { verifyApiKey } from "@/lib/auth/server";
import { supabaseAdmin } from "@/lib/supabase";
import { runPendingSubmissions } from "@/lib/proactive/pending-submissions";
export const runtime = "nodejs";
export async function GET(request: Request) {
  if (!verifyApiKey(request)) return new NextResponse("Unauthorized", { status: 401 });
  try { const n = await runPendingSubmissions(supabaseAdmin()); return NextResponse.json({ ok: true, alerted: n }); }
  catch (e) { console.error("[cron/pending-submissions]", e); return NextResponse.json({ ok: false }, { status: 200 }); }
}
```
- [ ] **Step 5: Run test → PASS ; tsc clean.**
- [ ] **Step 6: Commit** : `feat(proactive): détecteur soumissions en attente >48h (cron 4h)`.

---

### Task 4: Détecteur — villas fantômes (30j)

**Files:** Create `lib/proactive/ghost-villas.ts`, `app/api/cron/ghost-villas/route.ts` ; Test `tests/proactive-ghost-villas.test.ts`

**Interfaces:** `decideGhostVillas(rows: {id,name,is_published,ical_url,created_at}[], now): {id,name,reason}[]` (pure : `created_at<now-30j` ET (`!is_published` OU `!ical_url`)). Orchestrateur dédup detector `ghost_villa`. Sender `sendAdminGhostVillasEmail`.

- [ ] **Step 1-2: Test pur (publiée+iCal => exclue ; non publiée >30j => incluse avec reason) → FAIL.**
- [ ] **Step 3: Helper pur + fetch (`villas`) + orchestrateur (dédup + email + mark).**
- [ ] **Step 4: route.ts (même squelette que Task 3, detector ghost-villas).**
- [ ] **Step 5: test PASS + tsc.**
- [ ] **Step 6: Commit** : `feat(proactive): détecteur villas fantômes (cron vendredi)`.

---

### Task 5: Récap quotidien admin

**Files:** Create `lib/proactive/daily-recap.ts`, `app/api/cron/admin-daily-recap/route.ts` ; Test `tests/proactive-daily-recap.test.ts`

**Interfaces:** `buildDailyRecap(input, now): { sections: {title,lines}[], hasSignal: boolean }` (pure ; agrège nouvelles soumissions du jour, leads `notifications` hot_lead/owner_lead du jour, résas créées du jour, erreurs iCal du jour). `hasSignal=false` → pas d'email. Sender `sendAdminDailyRecapEmail`.

- [ ] **Step 1-2: Test pur — `hasSignal=false` si tout est vide ; sections remplies sinon → FAIL.**
- [ ] **Step 3: Helper pur + `fetchDailyContext(admin, now)` (requêtes du jour MQ) + orchestrateur (email si hasSignal).**
- [ ] **Step 4: route.ts (squelette).**
- [ ] **Step 5: test PASS + tsc.**
- [ ] **Step 6: Commit** : `feat(proactive): récap quotidien admin (cron 9h MQ)`.

---

### Task 6: Récap hebdomadaire (CA + anomalie + proprios inactifs + tendances)

**Files:** Create `lib/proactive/weekly-recap.ts`, `app/api/cron/admin-weekly-recap/route.ts` ; Test `tests/proactive-weekly-recap.test.ts`

**Interfaces:**
- `computeRevenueDelta(thisWeekCents, lastWeekCents): { delta: number; dropOver30: boolean }` (pure : `dropOver30 = lastWeek>0 && (lastWeek-thisWeek)/lastWeek > 0.30`).
- `fetchInactiveOwners(admin, now)` : `admin.auth.admin.listUsers()` paginé → garder users dont l'email correspond à un `profiles.role='owner'` ET `last_sign_in_at < now-14j` (ou jamais connecté). Retourne `{name,email,lastSeen}[]`.
- `buildWeeklyRecap(input, now)` : assemble CA semaine + flag anomalie + proprios inactifs + top villas + leads convertis + tendances vs mois précédent → `{ sections, hasSignal:true }` (hebdo = toujours envoyé). Sender `sendAdminWeeklyRecapEmail`.

- [ ] **Step 1: Test pur `computeRevenueDelta`**
```ts
import { describe, it, expect } from "vitest";
import { computeRevenueDelta } from "@/lib/proactive/weekly-recap";
describe("computeRevenueDelta", () => {
  it("flag si baisse > 30%", () => {
    expect(computeRevenueDelta(600, 1000).dropOver30).toBe(true);  // -40%
    expect(computeRevenueDelta(700, 1000).dropOver30).toBe(false); // -30% pile
    expect(computeRevenueDelta(500, 0).dropOver30).toBe(false);    // pas de base
  });
});
```
- [ ] **Step 2: Run → FAIL.**
- [ ] **Step 3: Implémenter `computeRevenueDelta` + `fetchInactiveOwners` (auth.admin.listUsers paginé, croise profiles role=owner) + `fetchWeeklyRevenue(admin, now)` + `buildWeeklyRecap` + orchestrateur.**
- [ ] **Step 4: route.ts (squelette).**
- [ ] **Step 5: test PASS + tsc.**
- [ ] **Step 6: Commit** : `feat(proactive): récap hebdo admin — CA/anomalie/proprios inactifs/tendances (cron lundi)`.

---

### Task 7: Alertes temps réel — hot_lead + ical_error

**Files:** Modify `app/api/chat/route.ts` (dans `notifyHotLeadOnce`) ; Modify le chemin de création des notifs `ical_error` (`app/api/sync/route.ts`). Compléter senders `sendAdminHotLeadEmail` / `sendAdminIcalErrorEmail` (Task 2).

**Interfaces:** Consomme `sendAdminHotLeadEmail({summary})`, `sendAdminIcalErrorEmail({villa, error})`.

- [ ] **Step 1: Localiser les points d'insertion** : `notifyHotLeadOnce` (chat route, déjà throttlé par session) ; la où `/api/sync` insère une notif `type='ical_error'`. Lire les deux avant d'éditer.
- [ ] **Step 2: hot_lead** — après l'insert notif in-app dans `notifyHotLeadOnce`, ajouter `await sendAdminHotLeadEmail({ summary });` (réutilise le throttle existant ; ne pas dupliquer l'email à chaque message).
- [ ] **Step 3: ical_error** — au point d'insert de la notif `ical_error`, ajouter `await sendAdminIcalErrorEmail({ villa, error });`. Si plusieurs erreurs par run, dédup par villa via `proactive_alerts_sent` detector `ical_error` (clé = villa_id+jour) pour éviter le spam.
- [ ] **Step 4: tsc clean.** (Pas de nouveau test auto : chemins inter-service ; vérif manuelle.)
- [ ] **Step 5: Commit** : `feat(proactive): emails admin temps réel hot_lead + ical_error`.

---

### Task 8: Enregistrer les crons Vercel

**Files:** Modify `vercel.json`

- [ ] **Step 1: Ajouter au tableau `crons`** (conserver les 3 existants) :
```json
{ "path": "/api/cron/admin-daily-recap", "schedule": "0 13 * * *" },
{ "path": "/api/cron/pending-submissions", "schedule": "0 */4 * * *" },
{ "path": "/api/cron/admin-weekly-recap", "schedule": "0 13 * * 1" },
{ "path": "/api/cron/ghost-villas", "schedule": "0 13 * * 5" }
```
- [ ] **Step 2: Valider le JSON** : `python3 -c "import json;json.load(open('vercel.json'))"` → pas d'erreur.
- [ ] **Step 3: Commit** : `feat(proactive): planifier 4 crons Vercel (récaps + détecteurs)`.

---

## Self-Review

**Spec coverage :** récap quotidien (T5) ✓ ; soumissions>48h (T3) ✓ ; villas fantômes (T4) ✓ ; récap hebdo + anomalie CA + proprios inactifs (T6) ✓ ; alertes temps réel hot_lead/ical_error (T7) ✓ ; soumission temps réel = déjà fait (hors plan, noté) ✓ ; socle dédup + email (T1, T2) ✓ ; crons (T8) ✓.

**Placeholder scan :** les tâches 4/5 résument les steps test/impl (squelette identique à T3, code de décision fourni dans Interfaces) — pas de TBD bloquant ; fenêtre CA figée (created_at, status confirmed, cents) ; seuil anomalie figé (>30% strict, base>0).

**Type consistency :** `filterNewRefIds`/`markAlerted`/`diffNewRefIds` (T1) cohérents T3/T4/T7 ; `renderList`/`sendAdmin*` (T2) cohérents T3-T7 ; détecteurs séparent `decide*` pur (testé) / `fetch*` réseau / `route.ts` coquille partout.

**Dépendances :** T1 et T2 d'abord (socle) ; T3-T7 dépendent de T1+T2 ; T8 en dernier. T3-T6 indépendants entre eux.
