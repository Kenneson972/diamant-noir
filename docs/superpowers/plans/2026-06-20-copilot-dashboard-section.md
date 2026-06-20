# Copilot Diamant — Dashboard Section + Actions — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace floating FAB+slide-in copilot with an inline dashboard chat section + 3 actionable commands (block dates, set price, show booking).

**Architecture:** Remove CopilotButton/CopilotPanel. Split page.tsx into thin Server Component + DashboardPageClient (Client Component). CopilotProvider stays in layout. New DashboardCopilotChat consumes useCopilotContext() for messages/input + renders CopilotActionCard when the last assistant message carries action/actionResult.

**Tech Stack:** Next.js 14 App Router, HeroUI, Tailwind CSS 4, TypeScript, existing useCopilot hook + /api/dashboard/owner-assistant, CopilotMessage component.

## Global Constraints

- Zéro redesign (or `#d4af37` / navy `#0a0a0a`, Instrument Sans / Playfair Display / Sora, radius anguleux)
- `client.config.ts` source de vérité — jamais hardcoder marque/NAP/email/URL/couleur
- Double quotes pour apostrophes FR dans les strings JS/TSX (`"d'entretien"` pas `'d'entretien'`)
- ⚠️ Piège Server→Client : ne JAMAIS passer de callback/promesse/fonction en props vers DashboardPageClient. Données uniquement (objets simples).
- Toute action vérifie l'appartenance de la villa au proprio AVANT exécution (anti-IDOR)
- L'agent DeepSeek suggère l'action, la route valide et exécute — jamais l'inverse
- Branche webhook Agent B intacte ; RLS service-role inchangée
- `npx tsc --noEmit` avant chaque commit ; vérifier `vercel ls --prod` Ready après déploiement

---

### Task 1: Remove CopilotButton + CopilotPanel from dashboard layout

**Files:**
- Modify: `app/(proprio)/dashboard/layout.tsx` — remove imports and JSX
- Delete: `components/dashboard/proprio/CopilotButton.tsx`
- Delete: `components/dashboard/proprio/CopilotPanel.tsx`

**Interfaces:**
- Produces: CopilotProvider still wraps the layout, but no floating UI elements
- Consumes: nothing new

- [ ] **Step 1: Edit layout.tsx — remove imports**

In `app/(proprio)/dashboard/layout.tsx`, remove these lines:

```typescript
import { CopilotButton } from "@/components/dashboard/proprio/CopilotButton";
import { CopilotPanel } from "@/components/dashboard/proprio/CopilotPanel";
```

- [ ] **Step 2: Edit layout.tsx — remove JSX render**

In the return block, remove these lines:

```tsx
<CopilotButton />
<CopilotPanel />
```

- [ ] **Step 3: Delete the two files**

```bash
rm components/dashboard/proprio/CopilotButton.tsx
rm components/dashboard/proprio/CopilotPanel.tsx
```

- [ ] **Step 4: Type-check and commit**

```bash
npx tsc --noEmit 2>&1 | grep -E "error TS" | head
# Expected: no new errors

git add app/\(proprio\)/dashboard/layout.tsx components/dashboard/proprio/CopilotButton.tsx components/dashboard/proprio/CopilotPanel.tsx
git commit -m "refactor(dashboard): remove Copilot floating FAB and slide-in panel

Co-Authored-By: claude-flow <ruv@ruv.net>"
```

---

### Task 2: Extend CopilotMessage + CopilotResponse types for action results

**Files:**
- Modify: `types/copilot.ts` — add action/actionResult to CopilotMessage + action_result to CopilotResponse
- Modify: `hooks/useCopilot.ts` — extract action/action_result from API response and attach to message
- Modify: `components/dashboard/proprio/CopilotContext.tsx` — add `lastActionResult` to context value

**Interfaces:**
- Produces: `CopilotMessage.action?: string`, `CopilotMessage.actionResult?: object`
- Produces: `CopilotResponse.action_result?: { success: boolean; [key: string]: unknown }`
- Produces: `CopilotContextValue.lastActionResult` — for DashboardCopilotChat to render CopilotActionCard

- [ ] **Step 1: Extend types/copilot.ts**

```typescript
export interface CopilotMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  /** Action déclenchée par l'assistant (ex: "SET_PRICE", "BLOCK_DATE", "SHOW_BOOKING") */
  action?: string;
  /** Résultat de l'action côté serveur */
  actionResult?: { success: boolean; [key: string]: unknown } | null;
}

export interface CopilotContextData {
  portfolio: {
    total_villas: number;
    published_villas: number;
    total_revenue_paid: number;
    revenue_current_month: number;
    revenue_last_month: number;
    upcoming_bookings_count: number;
    pending_tasks_count: number;
  };
  today: Array<{
    kind: "check_in" | "check_out" | "stay";
    villa_name: string;
    guest_name: string;
    start_date: string;
    end_date: string;
  }>;
  alerts: Array<{
    severity: "high" | "medium" | "low";
    title: string;
    body?: string;
  }>;
  tasks_preview: Array<{
    villa_name: string;
    content: string;
  }>;
  villas_summary: Array<{
    name: string;
    is_published: boolean;
  }>;
  current_date_iso: string;
}

export interface CopilotResponse {
  response: string;
  action?: string;
  action_data?: Record<string, unknown>;
  /** Résultat de l'action exécutée côté serveur */
  action_result?: { success: boolean; [key: string]: unknown } | null;
  suggested_prompts?: string[];
}
```

- [ ] **Step 2: Update hooks/useCopilot.ts — extract action/action_result**

In the `sendMessage` callback, after parsing `data: CopilotResponse`, add the action/action_result to the assistant message:

```typescript
const assistantMessage: CopilotMessage = {
  id: `assistant-${Date.now()}`,
  role: "assistant" as const,
  content: data.response || "Je n'ai pas compris votre demande.",
  timestamp: Date.now(),
  action: data.action,
  actionResult: data.action_result ?? null,
};
```

- [ ] **Step 3: Update CopilotContext.tsx — expose lastActionResult**

Add to `CopilotContextValue`:

```typescript
interface CopilotContextValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  messages: CopilotMessage[];
  isLoading: boolean;
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
  suggestedPrompts: string[];
  /** Action result from the most recent assistant message, if any */
  lastActionResult: { action: string; success: boolean; [key: string]: unknown } | null;
}
```

Compute it from the last assistant message in the provider:

```typescript
const lastAssistantMsg = [...messages].reverse().find((m) => m.role === "assistant");
const lastActionResult =
  lastAssistantMsg?.action
    ? { action: lastAssistantMsg.action, success: lastAssistantMsg.actionResult?.success ?? false, ...(lastAssistantMsg.actionResult ?? {}) }
    : null;
```

Add to context value:

```typescript
value={{
  // ...existing
  lastActionResult,
}}
```

- [ ] **Step 4: Type-check and commit**

```bash
npx tsc --noEmit 2>&1 | grep -E "error TS" | head

git add types/copilot.ts hooks/useCopilot.ts components/dashboard/proprio/CopilotContext.tsx
git commit -m "feat(copilot): extend types + context for action results

Co-Authored-By: claude-flow <ruv@ruv.net>"
```

---

### Task 3: Add SET_PRICE + SHOW_BOOKING handlers to owner-assistant route

**Files:**
- Modify: `app/api/dashboard/owner-assistant/route.ts:490` (insert before the return statement)
- Modify: `app/api/dashboard/owner-assistant/route.ts:30-35` (update OwnerAssistantAction type)

**Interfaces:**
- Consumes: `ownerVillaIds` Set (already defined at line 429), `admin` (supabaseAdmin client), `user.id`
- Produces: `actionResult` for SET_PRICE and SHOW_BOOKING

- [ ] **Step 1: Update OwnerAssistantAction type**

Find the type definition (around line 30-35) and add the new actions:

```typescript
type OwnerAssistantAction =
  | "SHOW_STATS"
  | "CREATE_TASK"
  | "COMPLETE_TASK"
  | "BLOCK_DATE"
  | "SET_PRICE"
  | "SHOW_BOOKING";
```

- [ ] **Step 2: Insert SET_PRICE handler**

Insert AFTER the BLOCK_DATE block (line ~489) and BEFORE `return NextResponse.json` (line ~492):

```typescript
    if (action === "SET_PRICE" && actionData.price) {
      const pd = actionData.price as {
        villa_id?: string;
        price_per_night?: number;
        previous_price?: number;
      };
      if (!pd.villa_id || !ownerVillaIds.has(pd.villa_id)) {
        actionResult = { success: false, error: "Villa non autorisée" };
      } else if (typeof pd.price_per_night === "number" && pd.price_per_night > 0) {
        // Lire l'ancien prix avant update
        const { data: before } = await admin
          .from("villas")
          .select("price_per_night, name")
          .eq("id", pd.villa_id)
          .maybeSingle();
        const previous = before?.price_per_night ?? null;

        const { data: updated, error } = await admin
          .from("villas")
          .update({
            price: pd.price_per_night,
            price_per_night: pd.price_per_night,
          })
          .eq("id", pd.villa_id)
          .select("id, name, price_per_night")
          .single();

        actionResult = {
          success: !error,
          villa: updated,
          previous_price: previous,
          error: error?.message,
        };
      }
    }

    if (action === "SHOW_BOOKING") {
      const villaIdList = Array.from(ownerVillaIds);
      const today = new Date().toISOString().split("T")[0];
      // Couvre check-ins futurs ET séjours en cours
      const { data: nextBooking } = await admin
        .from("bookings")
        .select("id, guest_name, villa_id, start_date, end_date, status, total_price_cents")
        .in("villa_id", villaIdList)
        .or(
          `start_date.gte.${today},and(start_date.lte.${today},end_date.gte.${today})`
        )
        .order("start_date", { ascending: true })
        .limit(1)
        .maybeSingle();

      actionResult = { success: true, booking: nextBooking || null };
    }
```

- [ ] **Step 3: Type-check and commit**

```bash
npx tsc --noEmit 2>&1 | grep -E "owner-assistant|error TS" | head

git add app/api/dashboard/owner-assistant/route.ts
git commit -m "feat(owner-assistant): add SET_PRICE + SHOW_BOOKING action handlers

Co-Authored-By: claude-flow <ruv@ruv.net>"
```

---

### Task 4: Create CopilotActionCard component

**Files:**
- Create: `components/dashboard/CopilotActionCard.tsx`

**Interfaces:**
- Consumes: `{ action: string; result: { success: boolean; [key: string]: unknown } }`
- Produces: A styled confirmation card inline in the chat

- [ ] **Step 1: Write the component**

```tsx
"use client";

import { Calendar, DollarSign, Home, CheckCircle, XCircle } from "lucide-react";

interface CopilotActionCardProps {
  action: string;
  result: { success: boolean; [key: string]: unknown };
}

export function CopilotActionCard({ action, result }: CopilotActionCardProps) {
  const config = getConfig(action, result);

  return (
    <div
      className="mt-3 rounded-lg border p-4"
      style={{
        borderColor: result.success ? "rgba(212,175,55,0.3)" : "rgba(239,68,68,0.3)",
        backgroundColor: result.success ? "rgba(212,175,55,0.04)" : "rgba(239,68,68,0.04)",
      }}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5">{config.icon}</div>
        <div className="flex-1">
          <p className="text-[13px] font-semibold text-navy">
            {result.success ? config.title : config.errorTitle}
          </p>
          <p className="mt-1 text-[12px] text-navy/65">{config.detail}</p>
        </div>
      </div>
    </div>
  );
}

interface ActionConfig {
  icon: React.ReactNode;
  title: string;
  errorTitle: string;
  detail: string;
}

function getConfig(
  action: string,
  result: { success: boolean; [key: string]: unknown }
): ActionConfig {
  const fail = {
    icon: <XCircle className="h-4 w-4 text-red-500" />,
    title: "",
    errorTitle: result.error ? String(result.error) : "Action non disponible",
    detail: "",
  };

  switch (action) {
    case "BLOCK_DATE": {
      if (!result.success) return { ...fail, errorTitle: "Blocage impossible" };
      const block = (result as any).block_id ? result : {};
      return {
        icon: <Calendar className="h-4 w-4 text-gold" />,
        title: "Dates bloquées",
        errorTitle: "Blocage impossible",
        detail: `Les dates ont été bloquées avec succès.`,
      };
    }
    case "SET_PRICE": {
      if (!result.success) return { ...fail, errorTitle: "Modification impossible" };
      const prev = (result as any).previous_price;
      const villa = (result as any).villa;
      return {
        icon: <DollarSign className="h-4 w-4 text-gold" />,
        title: "Prix mis à jour",
        errorTitle: "Modification impossible",
        detail: `${villa?.name ?? "Villa"} : ${prev ? `${prev} € → ` : ""}${villa?.price_per_night ?? "?"} € / nuit`,
      };
    }
    case "SHOW_BOOKING": {
      if (!result.success) return { ...fail, errorTitle: "Recherche impossible" };
      const b = (result as any).booking;
      if (!b) {
        return {
          icon: <Home className="h-4 w-4 text-gold" />,
          title: "Aucune réservation à venir",
          errorTitle: "",
          detail: "Vous n'avez pas de réservation confirmée pour le moment.",
        };
      }
      const amount = b.total_price_cents
        ? `${(Number(b.total_price_cents) / 100).toLocaleString("fr-FR")} €`
        : "—";
      return {
        icon: <Home className="h-4 w-4 text-gold" />,
        title: b.guest_name ?? "Réservation",
        errorTitle: "",
        detail: `${b.start_date ?? ""} → ${b.end_date ?? ""} · ${amount} · ${b.status ?? ""}`,
      };
    }
    default:
      return {
        icon: <CheckCircle className="h-4 w-4 text-gold" />,
        title: "Action effectuée",
        errorTitle: "Échec",
        detail: "",
      };
  }
}
```

- [ ] **Step 2: Type-check and commit**

```bash
npx tsc --noEmit 2>&1 | grep -E "CopilotActionCard|error TS" | head

git add components/dashboard/CopilotActionCard.tsx
git commit -m "feat(ui): CopilotActionCard for block/set-price/show-booking results

Co-Authored-By: claude-flow <ruv@ruv.net>"
```

---

### Task 5: Create DashboardCopilotChat component

**Files:**
- Create: `components/dashboard/DashboardCopilotChat.tsx`

**Interfaces:**
- Consumes: `useCopilotContext()` — messages, isLoading, sendMessage, suggestedPrompts, clearMessages, lastActionResult
- Produces: Inline chat card rendered in the dashboard page flow

- [ ] **Step 1: Write the component**

```tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { ArrowUp, Sparkles, RotateCcw } from "lucide-react";
import { useCopilotContext } from "@/components/dashboard/proprio/CopilotContext";
import { CopilotMessage } from "@/components/dashboard/proprio/CopilotMessage";
import { CopilotActionCard } from "@/components/dashboard/CopilotActionCard";

export function DashboardCopilotChat() {
  const {
    messages,
    isLoading,
    sendMessage,
    suggestedPrompts,
    clearMessages,
    lastActionResult,
  } = useCopilotContext();

  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage(input);
    setInput("");
    inputRef.current?.focus();
  };

  return (
    <div className="rounded-lg border border-navy/10 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-navy/5 px-5 py-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-gold" aria-hidden />
          <span className="font-display text-sm font-semibold text-navy">
            Diamant — Votre copilot Kayvila
          </span>
        </div>
        <button
          type="button"
          onClick={clearMessages}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium uppercase tracking-[0.1em] text-navy/40 transition-colors hover:text-navy/70"
          aria-label="Réinitialiser la conversation"
        >
          <RotateCcw className="h-3 w-3" />
          Reset
        </button>
      </div>

      {/* Messages */}
      <div
        className="overflow-y-auto px-5 py-4"
        style={{ maxHeight: 400 }}
      >
        {messages.length === 1 && messages[0].role === "assistant" ? (
          /* État vide — message d'accueil */
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Sparkles className="mb-3 h-8 w-8 text-gold/40" aria-hidden />
            <p className="text-[13px] leading-relaxed text-navy/60">
              Bonjour, je suis Diamant, votre copilot Kayvila.
              <br />
              Posez-moi une question sur vos villas, réservations ou revenus.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <CopilotMessage key={msg.id} message={msg} />
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy-900">
                  <Sparkles className="h-4 w-4 text-white" aria-hidden />
                </div>
                <div className="rounded-bl-sm rounded-xl bg-cream p-3">
                  <div className="flex gap-1.5">
                    <span className="dn-typing-dot h-2 w-2 rounded-full bg-navy-900/40" />
                    <span
                      className="dn-typing-dot h-2 w-2 rounded-full bg-navy-900/40"
                      style={{ animationDelay: "0.15s" }}
                    />
                    <span
                      className="dn-typing-dot h-2 w-2 rounded-full bg-navy-900/40"
                      style={{ animationDelay: "0.3s" }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Action result card */}
            {lastActionResult && !isLoading && (
              <CopilotActionCard
                action={lastActionResult.action}
                result={lastActionResult}
              />
            )}

            {/* Suggested prompts */}
            {!isLoading && suggestedPrompts.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {suggestedPrompts.slice(0, 4).map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => {
                      sendMessage(prompt);
                    }}
                    disabled={isLoading}
                    className="rounded-full border border-navy/15 bg-white px-3 py-1.5 text-[11px] text-navy/80 transition-colors hover:border-gold/40 hover:text-navy disabled:opacity-50"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-navy/5 px-4 py-3">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Posez votre question..."
            disabled={isLoading}
            className="flex-1 rounded-lg border border-navy/15 bg-cream px-4 py-2.5 text-sm text-navy-900 placeholder:text-navy/30 outline-none focus:border-navy-900 focus:ring-1 focus:ring-navy-900 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-navy-900 text-white transition-colors hover:bg-navy-800 disabled:opacity-40"
            aria-label="Envoyer"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Type-check and commit**

```bash
npx tsc --noEmit 2>&1 | grep -E "DashboardCopilotChat|error TS" | head

git add components/dashboard/DashboardCopilotChat.tsx
git commit -m "feat(ui): DashboardCopilotChat inline chat section with action cards

Co-Authored-By: claude-flow <ruv@ruv.net>"
```

---

### Task 6: Split page.tsx — Server wrapper + DashboardPageClient + inject chat

**Files:**
- Modify: `app/(proprio)/dashboard/page.tsx` — create DashboardPageClient, inject DashboardCopilotChat

**Interfaces:**
- DashboardPageClient props: all the pre-computed data from the server (kpiItems, todayEventsList, alerts, upcomingBookings, revenueData, etc.)
- Produces: Dashboard layout with copilot chat embedded

- [ ] **Step 1: Create the DashboardPageClient component**

Add this INSIDE `app/(proprio)/dashboard/page.tsx`, BEFORE the `ProprioDashboardPage` function. This is a Client Component in the same file:

```tsx
// ═══════════════════════════════════════════════════════════════════
// Client Component — render le dashboard avec le chat copilot intégré
// ⚠️ NE PAS passer de callback/fonction/promesse en props.
//    Toute logique interactive vit DANS ce composant.
// ═══════════════════════════════════════════════════════════════════
"use client";

import { DashboardCopilotChat } from "@/components/dashboard/DashboardCopilotChat";

type DashboardPageClientProps = {
  villas: Villa[];
  villaIds: string[];
  user: { id: string };
  isStripeConnected: boolean;
  connectDone: boolean;
  kpiItems: KpiItem[];
  todayEventsList: Array<{
    kind: "check_in" | "check_out";
    villaName: string;
    guestName: string | null;
    date: string;
    timeLabel: string | null;
    bookingId: string;
  }>;
  alerts: Array<{
    id: string;
    severity: string;
    title: string;
    body: string | null;
    created_at: string;
  }>;
  upcomingBookings: Array<{
    id: string;
    villa_id: string;
    guest_name: string | null;
    start_date: string;
    end_date: string;
    status: string;
    total_price_cents: number | null;
  }>;
  monthlyChartData: Array<{ label: string; revenue: number }>;
  hasEnoughHistory: boolean;
};

function DashboardPageClient(props: DashboardPageClientProps) {
  const {
    villas,
    user,
    isStripeConnected,
    connectDone,
    kpiItems,
    todayEventsList,
    alerts,
    upcomingBookings,
    monthlyChartData,
    hasEnoughHistory,
  } = props;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-navy-900">
          Tableau de bord
        </h1>
        <p className="text-sm text-muted">Aperçu de votre activité</p>
      </div>

      {/* ── Digest proactif du jour ── */}
      <ProactiveNotification />

      {/* Bannière Stripe Connect */}
      <StripeConnectButton
        ownerId={user.id}
        isOnboarded={isStripeConnected}
        connectDone={connectDone}
      />

      <KpiRow items={kpiItems} cols={2} />

      {/* ── Copilot Diamant intégré ── */}
      <DashboardCopilotChat />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <TodayTimeline events={todayEventsList} />
        <AlertsWidget alerts={alerts} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RevenueChart data={monthlyChartData} hasEnoughHistory={hasEnoughHistory} />
        <UpcomingBookings bookings={upcomingBookings} />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Replace the return block in ProprioDashboardPage**

Replace the entire `return (...)` block (currently lines ~283-316) with:

```tsx
  return (
    <DashboardPageClient
      villas={villas ?? []}
      villaIds={villaIds}
      user={{ id: user!.id }}
      isStripeConnected={isStripeConnected}
      connectDone={connectDone}
      kpiItems={kpiItems}
      todayEventsList={todayEventsList}
      alerts={alerts}
      upcomingBookings={upcomingBookings}
      monthlyChartData={monthlyChartData}
      hasEnoughHistory={hasEnoughHistory}
    />
  );
```

- [ ] **Step 3: Type-check and commit**

```bash
npx tsc --noEmit 2>&1 | grep -E "page.tsx|error TS" | head
# Expected: no new errors

git add app/\(proprio\)/dashboard/page.tsx
git commit -m "feat(dashboard): split page.tsx Server/Client + inject DashboardCopilotChat

Co-Authored-By: claude-flow <ruv@ruv.net>"
```

---

### Task 7: E2E Playwright test

**Files:**
- Create: `tests/e2e/dashboard-copilot-section.spec.ts`

- [ ] **Step 1: Write the test**

```typescript
import { test, expect } from "@playwright/test";

const BASE = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";

test.describe("Dashboard Copilot Section", () => {
  test("displays inline chat, sends message, shows response", async ({ page }) => {
    await page.goto(`${BASE}/login?redirect=/dashboard`);
    await page.getByLabel(/email/i).fill("proprio1@test.com");
    await page.getByLabel(/mot de passe/i).fill("Test123456!");
    await page.getByRole("button", { name: /accéder/i }).click();
    await page.waitForURL("**/dashboard", { timeout: 15000 });

    // Verify copilot chat is inline (not floating FAB)
    const chatSection = page.locator("text=Diamant — Votre copilot Kayvila");
    await expect(chatSection).toBeVisible({ timeout: 10000 });

    // Verify floating FAB is gone
    const fab = page.locator('[aria-label="Ouvrir Diamant, votre copilot"]');
    await expect(fab).not.toBeAttached();

    // Send a message
    const input = page.locator('input[placeholder="Posez votre question..."]');
    await input.fill("Bonjour Diamant");
    await input.press("Enter");

    // Wait for response (typing dots disappear)
    await page.waitForTimeout(8000);
    await expect(page.locator(".dn-typing-dot")).not.toBeVisible({ timeout: 15000 });

    // Verify a reply appeared
    const replyBubbles = page.locator("[data-copilot-role]");
    const count = await replyBubbles.count();
    expect(count).toBeGreaterThan(0);
  });

  test("FAB and slide-in are absent", async ({ page }) => {
    await page.goto(`${BASE}/login?redirect=/dashboard`);
    await page.getByLabel(/email/i).fill("proprio1@test.com");
    await page.getByLabel(/mot de passe/i).fill("Test123456!");
    await page.getByRole("button", { name: /accéder/i }).click();
    await page.waitForURL("**/dashboard");

    // No floating button
    await expect(page.locator("button", { hasText: /ouvrir diamant/i })).not.toBeAttached({ timeout: 5000 });

    // No slide-in aside
    await expect(page.locator("aside[aria-label='Copilot Diamant']")).not.toBeAttached();
  });
});
```

- [ ] **Step 2: Run test and commit**

```bash
npx playwright test tests/e2e/dashboard-copilot-section.spec.ts --project=chromium -g "displays inline chat"
# Expected: PASS

git add tests/e2e/dashboard-copilot-section.spec.ts
git commit -m "test(e2e): dashboard copilot inline chat section

Co-Authored-By: claude-flow <ruv@ruv.net>"
```

---

### Task 8: Deploy + LEARNINGS update

**Files:**
- Modify: `docs/auto-learn/LEARNINGS.md`

- [ ] **Step 1: Push, deploy, verify Ready**

```bash
git push origin main
vercel --prod --yes
# Wait for Ready
vercel ls --prod | head -3
# Expected: ● Ready
```

- [ ] **Step 2: Update LEARNINGS.md**

Insert at top of `docs/auto-learn/LEARNINGS.md`:

```markdown
## 2026-06-20 (soir) — Copilot Diamant : section dashboard intégrée + 3 actions

### Fait
- **Copilot migré de FAB flottant → section dashboard** : CopilotButton + CopilotPanel supprimés, nouveau `DashboardCopilotChat` en pleine largeur sous les KPIs. Plus pro, plus accessible.
- **3 actions ajoutées** : BLOCK_DATE (déjà codé), SET_PRICE (nouveau — update villas.price_per_night), SHOW_BOOKING (nouveau — prochaine résa + séjours en cours via OR clause).
- **Split Server/Client** : `DashboardPageClient` (Client Component) reçoit les données du Server Component en props objets simples (⚠️ jamais de callbacks).
- **CopilotActionCard** : affiche le résultat des actions dans le flux du chat (confirmation ou erreur).

### Règles apprises (dures)
- **Ne JAMAIS passer de fonction/callback/promesse en props Server→Client** : Next.js App Router rejette les props non-sérialisables. Commentaire ⚠️ dans `page.tsx` pour prévenir.
- **SHOW_BOOKING doit couvrir les séjours EN COURS** : `start_date.gte.today` seul ne suffit pas — ajouter `or(start_date.lte.today,end_date.gte.today)` pour répondre à "qui est chez moi en ce moment ?".
- **Le CopilotProvider n'a pas besoin de changer** : retirer juste le Button+Panel suffit. Le contexte/hook/API restent identiques.
```

- [ ] **Step 3: Commit**

```bash
git add docs/auto-learn/LEARNINGS.md
git commit -m "docs(auto-learn): copilot dashboard section + actions implementation

Co-Authored-By: claude-flow <ruv@ruv.net>"
```
