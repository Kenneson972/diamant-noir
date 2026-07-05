# Alertes proactives → notifications in-app (admin + proprio) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Faire apparaître les alertes proactives (admin) et le digest quotidien (propriétaire) dans les centres de notifications in-app des deux dashboards, sans casser les emails existants.

**Architecture:** Les 4 détecteurs admin existants (`lib/proactive/{pending-submissions,ghost-villas,daily-recap,weekly-recap}.ts`) gagnent une écriture dans la table `notifications` en plus de leur envoi email actuel. Le digest propriétaire, qui dépendait d'un workflow n8n mort depuis le 20/06, est remplacé par un 5ᵉ détecteur interne (`lib/proactive/owner-daily-digest.ts`) suivant exactement le même pattern pg_cron → route API → lib.

**Tech Stack:** Next.js 14 App Router (route handlers), Supabase (Postgres + pg_cron + pg_net), Vitest.

## Global Constraints

- `notifications.type` est un texte libre (pas d'enum en base) — aucune migration de schéma n'est nécessaire pour les nouveaux types.
- L'écriture `notifications` est un ajout, jamais un remplacement de l'email existant — si l'insert échoue, logguer l'erreur et continuer (best-effort, ne jamais faire échouer le cron pour ça).
- Toutes les notifications admin utilisent `user_id: null` (broadcast) ; toutes les notifications propriétaire utilisent `user_id: <owner.id>`.
- Le domaine de production pour les jobs pg_cron est `https://kayvila.com` et la clé Bearer est déjà en Vault (`C2D39E6E-2C64-429A-809B-BE29E0839500`) — ne pas la recréer, seulement réutiliser la même valeur dans le nouveau job.
- Convention de nommage des migrations Supabase : 14 chiffres `YYYYMMDDHHMMSS` (jamais date seule).
- Suivre le style déjà en place pour les inserts `notifications` (voir `app/api/chat/pre-book/route.ts:73-80`) : `.insert(...)` puis vérifier `error` et `console.error`/`console.warn`, jamais throw.
- Ne pas ajouter de mock Supabase dans les tests unitaires : le codebase teste uniquement les fonctions pures (`decideXxx`, `buildXxx`) — garder ce pattern pour toute nouvelle logique testable.

---

### Task 1: `pending-submissions.ts` — notification par soumission en attente

**Files:**
- Modify: `lib/proactive/pending-submissions.ts`
- Test: `lib/proactive/pending-submissions.test.ts`

**Interfaces:**
- Consumes: rien de nouveau (fonctions existantes `decidePendingSubmissions`, `filterNewRefIds`, `markAlerted`, `sendAdminPendingSubmissionsEmail` inchangées).
- Produces: `buildPendingSubmissionNotification(item: { villa: string; since: string }): { type: "pending_submission"; title: string; body: string; action_url: string; user_id: null }` — utilisée par Task 5 (NotificationBell) pour connaître le `type` exact à ajouter au `TYPE_CONFIG`.

- [ ] **Step 1: Write the failing test**

Dans `lib/proactive/pending-submissions.test.ts`, ajouter en haut du fichier :

```ts
import { describe, it, expect } from "vitest";
import { decidePendingSubmissions, buildPendingSubmissionNotification } from "@/lib/proactive/pending-submissions";
```

(remplace la ligne d'import existante `import { decidePendingSubmissions } from "@/lib/proactive/pending-submissions";`)

Puis ajouter à la fin du fichier, avant la fermeture :

```ts

describe("buildPendingSubmissionNotification", () => {
  it("construit la notification avec le bon type et body", () => {
    const notif = buildPendingSubmissionNotification({ villa: "Azur", since: "2026-06-19" });
    expect(notif).toEqual({
      type: "pending_submission",
      title: "Soumission en attente",
      body: "Azur — en attente depuis 2026-06-19",
      action_url: "/admin/soumissions",
      user_id: null,
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/proactive/pending-submissions.test.ts`
Expected: FAIL — `buildPendingSubmissionNotification is not a function` ou erreur d'import.

- [ ] **Step 3: Write minimal implementation**

Dans `lib/proactive/pending-submissions.ts`, ajouter après la fonction `fetchPendingSubmissions` (avant `runPendingSubmissions`) :

```ts
export function buildPendingSubmissionNotification(item: { villa: string; since: string }): {
  type: "pending_submission";
  title: string;
  body: string;
  action_url: string;
  user_id: null;
} {
  return {
    type: "pending_submission",
    title: "Soumission en attente",
    body: `${item.villa} — en attente depuis ${item.since}`,
    action_url: "/admin/soumissions",
    user_id: null,
  };
}
```

Puis remplacer le corps de `runPendingSubmissions` :

```ts
export async function runPendingSubmissions(admin: SupabaseClient): Promise<number> {
  const rows = await fetchPendingSubmissions(admin);
  const candidates = decidePendingSubmissions(rows, new Date());
  const fresh = await filterNewRefIds(
    admin,
    "pending_submission",
    candidates.map((c) => c.id)
  );
  if (fresh.length === 0) return 0;
  const toAlert = candidates.filter((c) => fresh.includes(c.id));
  await sendAdminPendingSubmissionsEmail(
    toAlert.map((c) => ({ villa: c.villa, since: c.since }))
  );
  const { error: notifError } = await admin
    .from("notifications")
    .insert(toAlert.map((c) => buildPendingSubmissionNotification(c)));
  if (notifError) console.error("[pending-submissions] notif insert", notifError);
  await markAlerted(admin, "pending_submission", fresh);
  return toAlert.length;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/proactive/pending-submissions.test.ts`
Expected: PASS (3 tests : les 2 existants + le nouveau)

- [ ] **Step 5: Commit**

```bash
git add lib/proactive/pending-submissions.ts lib/proactive/pending-submissions.test.ts
git commit -m "feat(proactive): écrire une notification in-app par soumission en attente"
```

---

### Task 2: `ghost-villas.ts` — notification par villa fantôme

**Files:**
- Modify: `lib/proactive/ghost-villas.ts`
- Test: `lib/proactive/ghost-villas.test.ts`

**Interfaces:**
- Consumes: rien de nouveau (fonctions existantes inchangées).
- Produces: `buildGhostVillaNotification(item: { name: string; reason: string }): { type: "ghost_villa"; title: string; body: string; action_url: string; user_id: null }` — utilisée par Task 5.

- [ ] **Step 1: Write the failing test**

Dans `lib/proactive/ghost-villas.test.ts`, remplacer la ligne d'import :

```ts
import { decideGhostVillas, buildGhostVillaNotification } from "@/lib/proactive/ghost-villas";
```

Ajouter à la fin du fichier :

```ts

describe("buildGhostVillaNotification", () => {
  it("construit la notification avec le bon type et body", () => {
    const notif = buildGhostVillaNotification({ name: "Azur", reason: "Non publiée" });
    expect(notif).toEqual({
      type: "ghost_villa",
      title: "Villa fantôme détectée",
      body: "Azur — Non publiée",
      action_url: "/admin/villas",
      user_id: null,
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/proactive/ghost-villas.test.ts`
Expected: FAIL — `buildGhostVillaNotification is not a function`

- [ ] **Step 3: Write minimal implementation**

Dans `lib/proactive/ghost-villas.ts`, ajouter après `fetchGhostVillaCandidates` (avant `runGhostVillas`) :

```ts
export function buildGhostVillaNotification(item: { name: string; reason: string }): {
  type: "ghost_villa";
  title: string;
  body: string;
  action_url: string;
  user_id: null;
} {
  return {
    type: "ghost_villa",
    title: "Villa fantôme détectée",
    body: `${item.name} — ${item.reason}`,
    action_url: "/admin/villas",
    user_id: null,
  };
}
```

Remplacer le corps de `runGhostVillas` :

```ts
export async function runGhostVillas(admin: SupabaseClient): Promise<number> {
  const rows = await fetchGhostVillaCandidates(admin);
  const candidates = decideGhostVillas(rows, new Date());
  const fresh = await filterNewRefIds(
    admin,
    "ghost_villa",
    candidates.map((c) => c.id)
  );
  if (fresh.length === 0) return 0;
  const toAlert = candidates.filter((c) => fresh.includes(c.id));
  await sendAdminGhostVillasEmail(toAlert.map((c) => ({ name: c.name, reason: c.reason })));
  const { error: notifError } = await admin
    .from("notifications")
    .insert(toAlert.map((c) => buildGhostVillaNotification(c)));
  if (notifError) console.error("[ghost-villas] notif insert", notifError);
  await markAlerted(admin, "ghost_villa", fresh);
  return toAlert.length;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/proactive/ghost-villas.test.ts`
Expected: PASS (5 tests : les 4 existants + le nouveau)

- [ ] **Step 5: Commit**

```bash
git add lib/proactive/ghost-villas.ts lib/proactive/ghost-villas.test.ts
git commit -m "feat(proactive): écrire une notification in-app par villa fantôme détectée"
```

---

### Task 3: `daily-recap.ts` — notification agrégée par run

**Files:**
- Modify: `lib/proactive/daily-recap.ts`
- Test: `lib/proactive/daily-recap.test.ts`

**Interfaces:**
- Consumes: `DailyRecap` (déjà défini dans ce fichier : `{ sections: {title, lines}[]; hasSignal: boolean }`).
- Produces: `todayStartUTC(): Date` (désormais exportée — utilisée par Task 6) ; `buildDailyRecapNotificationBody(recap: DailyRecap): string`.

- [ ] **Step 1: Write the failing test**

Dans `lib/proactive/daily-recap.test.ts`, remplacer la ligne d'import :

```ts
import { buildDailyRecap, buildDailyRecapNotificationBody } from "@/lib/proactive/daily-recap";
```

Ajouter à la fin du fichier :

```ts

describe("buildDailyRecapNotificationBody", () => {
  it("ne liste que les sections non vides, avec leur compte", () => {
    const recap = buildDailyRecap({ submissions: ["Villa X"], leads: [], bookings: ["Jean"], icalErrors: [] });
    const body = buildDailyRecapNotificationBody(recap);
    expect(body).toBe("Nouvelles soumissions villa (1) : Villa X\nRéservations du jour (1) : Jean");
  });

  it("chaîne vide si aucune section", () => {
    const recap = buildDailyRecap({ submissions: [], leads: [], bookings: [], icalErrors: [] });
    expect(buildDailyRecapNotificationBody(recap)).toBe("");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/proactive/daily-recap.test.ts`
Expected: FAIL — `buildDailyRecapNotificationBody is not a function`

- [ ] **Step 3: Write minimal implementation**

Dans `lib/proactive/daily-recap.ts`, changer la signature de `todayStartUTC` pour l'exporter :

```ts
export function todayStartUTC(): Date {
```

(remplace `function todayStartUTC(): Date {`)

Ajouter après `buildDailyRecap` :

```ts
/** Texte brut pour la notification in-app — une ligne par section non vide. */
export function buildDailyRecapNotificationBody(recap: DailyRecap): string {
  return recap.sections
    .filter((s) => s.lines.length > 0)
    .map((s) => `${s.title} (${s.lines.length}) : ${s.lines.join(", ")}`)
    .join("\n");
}
```

Remplacer le corps de `runDailyRecap` :

```ts
export async function runDailyRecap(admin: SupabaseClient): Promise<number> {
  const input = await fetchDailyContext(admin);
  const recap = buildDailyRecap(input);
  if (!recap.hasSignal) return 0;

  await sendAdminDailyRecapEmail({
    submissions: input.submissions,
    leads: input.leads,
    bookings: input.bookings,
    icalErrors: input.icalErrors,
  });

  const { error: notifError } = await admin.from("notifications").insert({
    type: "admin_daily_recap",
    title: "Point quotidien admin",
    body: buildDailyRecapNotificationBody(recap),
    action_url: "/admin/hub-classique",
    user_id: null,
  });
  if (notifError) console.error("[daily-recap] notif insert", notifError);

  return recap.sections.reduce((sum, s) => sum + s.lines.length, 0);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/proactive/daily-recap.test.ts`
Expected: PASS (5 tests : les 3 existants + les 2 nouveaux)

- [ ] **Step 5: Commit**

```bash
git add lib/proactive/daily-recap.ts lib/proactive/daily-recap.test.ts
git commit -m "feat(proactive): écrire une notification in-app agrégée pour le récap quotidien admin"
```

---

### Task 4: `weekly-recap.ts` — notification agrégée par run

**Files:**
- Modify: `lib/proactive/weekly-recap.ts`
- Test: `lib/proactive/weekly-recap.test.ts`

**Interfaces:**
- Consumes: le type de retour de `buildWeeklyRecap` (déjà défini dans ce fichier).
- Produces: `buildWeeklyRecapNotificationBody(recap: ReturnType<typeof buildWeeklyRecap>): string`.

- [ ] **Step 1: Write the failing test**

Dans `lib/proactive/weekly-recap.test.ts`, remplacer la ligne d'import :

```ts
import { computeRevenueDelta, buildWeeklyRecap, buildWeeklyRecapNotificationBody } from "@/lib/proactive/weekly-recap";
```

Ajouter à la fin du fichier :

```ts

describe("buildWeeklyRecapNotificationBody", () => {
  it("inclut l'alerte de baisse de CA si anomalyFlag", () => {
    const recap = buildWeeklyRecap({
      revenueCents: { thisWeek: 600, lastWeek: 1000 },
      inactiveOwners: [],
      topVillas: [],
      convertedLeads: [],
      trends: ["Réservations ce mois : 5 vs 3 le mois dernier"],
    });
    const body = buildWeeklyRecapNotificationBody(recap);
    expect(body).toContain("Baisse de CA de plus de 30% cette semaine");
    expect(body).toContain("Réservations ce mois : 5 vs 3 le mois dernier");
  });

  it("omet les sections vides", () => {
    const recap = buildWeeklyRecap({
      revenueCents: { thisWeek: 1000, lastWeek: 1000 },
      inactiveOwners: [],
      topVillas: [],
      convertedLeads: [],
      trends: [],
    });
    expect(buildWeeklyRecapNotificationBody(recap)).toBe("");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/proactive/weekly-recap.test.ts`
Expected: FAIL — `buildWeeklyRecapNotificationBody is not a function`

- [ ] **Step 3: Write minimal implementation**

Dans `lib/proactive/weekly-recap.ts`, ajouter après `buildWeeklyRecap` :

```ts
/** Texte brut pour la notification in-app — une ligne par bloc non vide. */
export function buildWeeklyRecapNotificationBody(recap: ReturnType<typeof buildWeeklyRecap>): string {
  const lines = [
    recap.anomalyFlag ? "Baisse de CA de plus de 30% cette semaine" : null,
    recap.inactiveOwners.length ? `Propriétaires inactifs (${recap.inactiveOwners.length}) : ${recap.inactiveOwners.join(", ")}` : null,
    recap.topVillas.length ? `Top villas : ${recap.topVillas.join(", ")}` : null,
    recap.convertedLeads.length ? `Leads convertis (${recap.convertedLeads.length})` : null,
    ...recap.trends,
  ].filter((l): l is string => Boolean(l));
  return lines.join("\n");
}
```

Remplacer les 2 dernières lignes de `runWeeklyRecap` (à partir de `await sendAdminWeeklyRecapEmail(recap);`) :

```ts
  await sendAdminWeeklyRecapEmail(recap);

  const { error: notifError } = await admin.from("notifications").insert({
    type: "admin_weekly_recap",
    title: "Récap hebdomadaire admin",
    body: buildWeeklyRecapNotificationBody(recap),
    action_url: "/admin/revenus",
    user_id: null,
  });
  if (notifError) console.error("[weekly-recap] notif insert", notifError);

  return recap.inactiveOwners.length + topVillas.length + convertedLeads.length + (recap.anomalyFlag ? 1 : 0);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/proactive/weekly-recap.test.ts`
Expected: PASS (7 tests : les 5 existants + les 2 nouveaux)

- [ ] **Step 5: Commit**

```bash
git add lib/proactive/weekly-recap.ts lib/proactive/weekly-recap.test.ts
git commit -m "feat(proactive): écrire une notification in-app agrégée pour le récap hebdo admin"
```

---

### Task 5: `NotificationBell.tsx` — support des 4 nouveaux types admin

**Files:**
- Modify: `components/dashboard/NotificationBell.tsx:26-63`

**Interfaces:**
- Consumes: les `type` produits par Tasks 1-4 (`pending_submission`, `ghost_villa`, `admin_daily_recap`, `admin_weekly_recap`).
- Produces: rien consommé par une tâche suivante (fin de chaîne front).

- [ ] **Step 1: Modifier le type `NotifType`**

Dans `components/dashboard/NotificationBell.tsx`, remplacer le type union (lignes ~26-37) :

```ts
type NotifType =
  | "villa_submission"
  | "booking_new"
  | "booking_confirmed"
  | "ical_error"
  | "availability_alert"
  | "system"
  | "request_update"
  | "request_urgent"
  | "checkin_reminder"
  | "checkout_reminder"
  | "new_message"
  | "pending_submission"
  | "ghost_villa"
  | "admin_daily_recap"
  | "admin_weekly_recap";
```

- [ ] **Step 2: Étendre `TYPE_CONFIG`**

Dans le même fichier, ajouter ces 4 lignes dans l'objet `TYPE_CONFIG` (juste avant la ligne `new_message:`) :

```ts
  pending_submission: { iconType: "lucide", icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-50" },
  ghost_villa:        { iconType: "lucide", icon: Info,          color: "text-navy/70",  bg: "bg-navy/5" },
  admin_daily_recap:  { iconType: "png",    icon: "bell",        color: "text-gold",     bg: "bg-gold/10" },
  admin_weekly_recap: { iconType: "png",    icon: "bell",        color: "text-gold",     bg: "bg-gold/10" },
```

- [ ] **Step 3: Vérifier le typecheck**

Run: `npx tsc --noEmit`
Expected: aucune nouvelle erreur liée à `NotificationBell.tsx` (les imports `AlertTriangle` et `Info` sont déjà présents en haut du fichier, aucun nouvel import requis).

- [ ] **Step 4: Commit**

```bash
git add components/dashboard/NotificationBell.tsx
git commit -m "feat(dashboard): afficher les 4 nouveaux types de notifications proactives admin"
```

---

### Task 6: `lib/proactive/owner-daily-digest.ts` — nouveau détecteur (remplace n8n)

**Files:**
- Create: `lib/proactive/owner-daily-digest.ts`
- Test: `lib/proactive/owner-daily-digest.test.ts`

**Interfaces:**
- Consumes: `OwnerContextPack` et `buildOwnerContextPack` de `@/lib/owner-assistant-context` ; `todayStartUTC` de `@/lib/proactive/daily-recap` (exportée en Task 3).
- Produces: `runOwnerDailyDigest(admin: SupabaseClient): Promise<number>` — utilisée par Task 7 (route API).

- [ ] **Step 1: Write the failing test**

Créer `lib/proactive/owner-daily-digest.test.ts` :

```ts
import { describe, it, expect } from "vitest";
import {
  buildOwnerDigestSignal,
  hasOwnerDigestSignal,
  buildOwnerDigestBody,
} from "@/lib/proactive/owner-daily-digest";
import type { OwnerContextPack } from "@/lib/owner-assistant-context";

function emptyPack(overrides: Partial<OwnerContextPack> = {}): OwnerContextPack {
  return {
    current_date_iso: "2026-07-05T12:00:00.000Z",
    portfolio: {
      total_villas: 1,
      published_villas: 1,
      total_revenue_paid: 0,
      revenue_current_month: 0,
      revenue_last_month: 0,
      upcoming_bookings_count: 0,
      pending_tasks_count: 0,
    },
    today: [],
    alerts: [],
    villas: [],
    bookings: [],
    tasks_open: [],
    ...overrides,
  };
}

describe("buildOwnerDigestSignal / hasOwnerDigestSignal", () => {
  it("aucun signal si tout est vide", () => {
    const signal = buildOwnerDigestSignal(emptyPack());
    expect(hasOwnerDigestSignal(signal)).toBe(false);
  });

  it("signal vrai si un check-in aujourd'hui", () => {
    const pack = emptyPack({
      today: [
        {
          kind: "check_in",
          villa_id: "v1",
          villa_name: "Villa Azur",
          booking_id: "b1",
          guest_name: "Jean Dupont",
          start_date: "2026-07-05",
          end_date: "2026-07-10",
        },
      ],
    });
    const signal = buildOwnerDigestSignal(pack);
    expect(hasOwnerDigestSignal(signal)).toBe(true);
    expect(signal.todayLines).toEqual(["Arrivée — Villa Azur (Jean Dupont)"]);
  });

  it("signal vrai si une alerte calculée est présente", () => {
    const pack = emptyPack({
      alerts: [
        {
          id: "a1",
          severity: "warning",
          title: "OTA sync en erreur",
          body: null,
          villa_id: "v1",
          created_at: "2026-07-05T00:00:00Z",
          read_at: null,
        },
      ],
    });
    const signal = buildOwnerDigestSignal(pack);
    expect(hasOwnerDigestSignal(signal)).toBe(true);
    expect(signal.alertLines).toEqual(["OTA sync en erreur"]);
  });
});

describe("buildOwnerDigestBody", () => {
  it("assemble les blocs non vides avec des sauts de ligne", () => {
    const body = buildOwnerDigestBody({
      todayLines: ["Arrivée — Villa Azur (Jean Dupont)"],
      alertLines: [],
      taskLines: ["Changer les draps"],
    });
    expect(body).toBe(
      "Aujourd'hui :\n- Arrivée — Villa Azur (Jean Dupont)\n\nTâches en attente :\n- Changer les draps"
    );
  });

  it("retourne chaîne vide si aucun signal", () => {
    expect(buildOwnerDigestBody({ todayLines: [], alertLines: [], taskLines: [] })).toBe("");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/proactive/owner-daily-digest.test.ts`
Expected: FAIL — le module `@/lib/proactive/owner-daily-digest` n'existe pas encore.

- [ ] **Step 3: Write minimal implementation**

Créer `lib/proactive/owner-daily-digest.ts` :

```ts
import type { SupabaseClient } from "@supabase/supabase-js";
import { buildOwnerContextPack } from "@/lib/owner-assistant-context";
import type { OwnerContextPack } from "@/lib/owner-assistant-context";
import { todayStartUTC } from "@/lib/proactive/daily-recap";

export interface OwnerDigestSignal {
  todayLines: string[];
  alertLines: string[];
  taskLines: string[];
}

const TODAY_LABEL: Record<OwnerContextPack["today"][number]["kind"], string> = {
  check_in: "Arrivée",
  check_out: "Départ",
  in_stay: "Séjour en cours",
};

/** Pure : dérive les 3 blocs de signal à partir du pack contexte déjà calculé. */
export function buildOwnerDigestSignal(pack: OwnerContextPack): OwnerDigestSignal {
  const todayLines = pack.today.map((t) => {
    const label = TODAY_LABEL[t.kind];
    return `${label} — ${t.villa_name}${t.guest_name ? ` (${t.guest_name})` : ""}`;
  });
  const alertLines = pack.alerts.map((a) => a.title);
  const taskLines = (pack.tasks_open as { content?: string }[])
    .map((t) => t.content || "Tâche")
    .slice(0, 10);
  return { todayLines, alertLines, taskLines };
}

/** Pure : true si au moins un des 3 blocs contient quelque chose. */
export function hasOwnerDigestSignal(signal: OwnerDigestSignal): boolean {
  return signal.todayLines.length > 0 || signal.alertLines.length > 0 || signal.taskLines.length > 0;
}

/** Pure : texte brut pour le corps de la notification. */
export function buildOwnerDigestBody(signal: OwnerDigestSignal): string {
  const blocks = [
    signal.todayLines.length ? `Aujourd'hui :\n${signal.todayLines.map((l) => `- ${l}`).join("\n")}` : "",
    signal.alertLines.length ? `Alertes :\n${signal.alertLines.map((l) => `- ${l}`).join("\n")}` : "",
    signal.taskLines.length ? `Tâches en attente :\n${signal.taskLines.map((l) => `- ${l}`).join("\n")}` : "",
  ];
  return blocks.filter(Boolean).join("\n\n");
}

async function fetchActiveOwnerIds(admin: SupabaseClient): Promise<string[]> {
  const { data } = await admin.from("profiles").select("id").eq("role", "owner");
  return (data ?? []).map((o) => o.id as string);
}

async function fetchAlreadyDigestedToday(admin: SupabaseClient, since: string): Promise<Set<string>> {
  const { data } = await admin
    .from("notifications")
    .select("user_id")
    .eq("type", "owner_daily_digest")
    .gte("created_at", since);
  return new Set((data ?? []).map((r) => r.user_id as string));
}

/** Orchestrateur : 1 propriétaire déjà digéré aujourd'hui → skip. Sinon insère si signal. */
export async function runOwnerDailyDigest(admin: SupabaseClient): Promise<number> {
  const ownerIds = await fetchActiveOwnerIds(admin);
  if (ownerIds.length === 0) return 0;

  const since = todayStartUTC().toISOString();
  const alreadyDone = await fetchAlreadyDigestedToday(admin, since);

  let count = 0;
  for (const ownerId of ownerIds) {
    if (alreadyDone.has(ownerId)) continue;

    const pack = await buildOwnerContextPack(admin, ownerId);
    const signal = buildOwnerDigestSignal(pack);
    if (!hasOwnerDigestSignal(signal)) continue;

    const { error } = await admin.from("notifications").insert({
      type: "owner_daily_digest",
      title: "Votre point du jour",
      body: buildOwnerDigestBody(signal),
      action_url: "/dashboard/proprio",
      user_id: ownerId,
    });
    if (error) {
      console.error("[owner-daily-digest] insert failed", ownerId, error);
      continue;
    }
    count++;
  }
  return count;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/proactive/owner-daily-digest.test.ts`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/proactive/owner-daily-digest.ts lib/proactive/owner-daily-digest.test.ts
git commit -m "feat(proactive): nouveau détecteur interne owner-daily-digest (remplace n8n)"
```

---

### Task 7: Route cron `owner-daily-digest`

**Files:**
- Create: `app/api/cron/owner-daily-digest/route.ts`

**Interfaces:**
- Consumes: `runOwnerDailyDigest` (Task 6), `verifyApiKey` de `@/lib/auth/server`, `supabaseAdmin` de `@/lib/supabase`.
- Produces: endpoint `GET /api/cron/owner-daily-digest` — consommé par le job pg_cron créé en Task 8.

- [ ] **Step 1: Créer la route**

Créer `app/api/cron/owner-daily-digest/route.ts` (copie exacte du pattern de `app/api/cron/admin-daily-recap/route.ts`) :

```ts
import { NextResponse } from "next/server";
import { verifyApiKey } from "@/lib/auth/server";
import { supabaseAdmin } from "@/lib/supabase";
import { runOwnerDailyDigest } from "@/lib/proactive/owner-daily-digest";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!verifyApiKey(request)) return new NextResponse("Unauthorized", { status: 401 });
  try {
    const n = await runOwnerDailyDigest(supabaseAdmin());
    return NextResponse.json({ ok: true, digestCount: n });
  } catch (e) {
    console.error("[cron/owner-daily-digest]", e);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
```

- [ ] **Step 2: Vérifier que le build Next.js reconnaît la route**

Run: `npx tsc --noEmit`
Expected: aucune erreur de type sur ce fichier.

- [ ] **Step 3: Commit**

```bash
git add app/api/cron/owner-daily-digest/route.ts
git commit -m "feat(api): route cron owner-daily-digest"
```

---

### Task 8: Job pg_cron + suppression de l'ancien endpoint n8n

**Files:**
- Create: `supabase/migrations/20260705120000_pg_cron_owner_daily_digest.sql`
- Delete: `app/api/agent/owners-digest-context/route.ts`

**Interfaces:**
- Consumes: la route créée en Task 7.
- Produces: rien (dernière tâche de la chaîne backend).

- [ ] **Step 1: Créer la migration**

Créer `supabase/migrations/20260705120000_pg_cron_owner_daily_digest.sql` :

```sql
-- Migration: 20260705120000_pg_cron_owner_daily_digest
-- Description: Ajoute le job pg_cron pour le digest quotidien propriétaire (remplace le workflow n8n mort depuis le 20/06)
-- Target: Supabase project wsdawdxucyuyopkpgjij

SELECT cron.schedule(
  'owner-daily-digest',
  '0 12 * * *',
  $$
  SELECT net.http_post(
    url:='https://kayvila.com/api/cron/owner-daily-digest',
    headers:='{"Authorization":"Bearer C2D39E6E-2C64-429A-809B-BE29E0839500","Content-Type":"application/json"}'::jsonb,
    body:='{}'::jsonb
  );
  $$
);
```

- [ ] **Step 2: Appliquer la migration sur le projet Supabase live**

Utiliser l'outil MCP Supabase `apply_migration` avec :
- `project_id`: `wsdawdxucyuyopkpgjij`
- `name`: `20260705120000_pg_cron_owner_daily_digest`
- `query`: le contenu SQL ci-dessus

Puis vérifier que le job est actif :

```sql
select jobid, jobname, schedule, active from cron.job where jobname = 'owner-daily-digest';
```

Expected: une ligne avec `active = true` et `schedule = '0 12 * * *'`.

- [ ] **Step 3: Supprimer l'ancien endpoint n8n mort**

Supprimer le fichier `app/api/agent/owners-digest-context/route.ts` (plus rien ne l'appelle : le nouveau digest utilise `buildOwnerContextPack` directement dans `owner-daily-digest.ts`, pas via HTTP).

```bash
git rm app/api/agent/owners-digest-context/route.ts
```

- [ ] **Step 4: Vérifier qu'aucune référence de code vivant ne pointe encore vers cette route**

Run: `grep -rn "owners-digest-context" --include="*.ts" --include="*.tsx" app components lib hooks`
Expected: aucun résultat (les seules références restantes sont dans `docs/` — historique, à ne pas toucher).

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260705120000_pg_cron_owner_daily_digest.sql
git commit -m "feat(cron): activer le job pg_cron owner-daily-digest et retirer l'ancien endpoint n8n"
```

---

### Task 9: Vérification finale — suite complète + build

**Files:**
- Aucun fichier modifié (tâche de vérification uniquement).

**Interfaces:**
- Consumes: l'ensemble des changements des Tasks 1-8.
- Produces: rien — confirme que l'ensemble du plan est cohérent avant de considérer le travail terminé.

- [ ] **Step 1: Lancer toute la suite Vitest**

Run: `npx vitest run lib/proactive`
Expected: PASS pour tous les fichiers `lib/proactive/*.test.ts` (existants + les 5 modifiés/créés dans ce plan).

- [ ] **Step 2: Typecheck complet**

Run: `npx tsc --noEmit`
Expected: aucune erreur.

- [ ] **Step 3: Build Next.js**

Run: `npm run build`
Expected: build réussi, aucune route orpheline signalée pour `app/api/agent/owners-digest-context` (supprimée), présence de `app/api/cron/owner-daily-digest` dans la liste des routes générées.

- [ ] **Step 4: Vérification manuelle en base (optionnel mais recommandé)**

Déclencher manuellement la nouvelle route pour vérifier l'insertion réelle (remplacer `<CRON_API_KEY>` par la vraie valeur du `.env.local` ou de Vercel) :

```bash
curl -s -H "Authorization: Bearer <CRON_API_KEY>" https://kayvila.com/api/cron/owner-daily-digest | jq
```

Expected: `{"ok": true, "digestCount": <n>}`. Puis vérifier en base via Supabase MCP :

```sql
select type, user_id, title, created_at from notifications where type = 'owner_daily_digest' order by created_at desc limit 5;
```

Expected: une ligne récente par propriétaire ayant un signal aujourd'hui.

- [ ] **Step 5: Commit final (si des ajustements ont été faits pendant la vérification)**

```bash
git status
```

Si rien à committer, cette tâche est terminée sans commit supplémentaire.
