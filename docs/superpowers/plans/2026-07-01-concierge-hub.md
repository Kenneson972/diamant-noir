# Hub relation propriétaire "Mon concierge" + Messages admin unifiées — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the owner dashboard's "Mon concierge" page into a 2-tab hub (AI chatbot + new "Notre équipe" human thread), and replace the admin's separate "Demandes"/"Messagerie" pages with one unified "Messages" page (Propriétaires / Locataires / Demandes filters).

**Architecture:** New `owner_messages` Supabase table (two-way, RLS-protected, Realtime-enabled) powers a new owner-side thread component and a new admin panel. The existing `requests` (Demandes) and traveler-chat (Messagerie) admin logic is extracted verbatim into reusable panel components and mounted as tabs on one new admin page, alongside the new Propriétaires panel. `OwnerContactFAB` and the dead `OwnerMessaging`/`messages` route are deleted.

**Tech Stack:** Next.js 15 App Router (Server + Client Components), Supabase (Postgres + RLS + Realtime), `components/ui/tabs.tsx` (generic Tabs wrapper over `@heroui/react` Tabs), Vitest, Playwright.

## Global Constraints

- Commission/text rules from prior work do not apply here — no copy changes to commission wording.
- Realtime subscriptions MUST follow the exact pattern already used in `components/dashboard/NotificationBell.tsx`: `supabase.channel(name).on("postgres_changes", {...}).subscribe()` in a `useEffect`, with `supabase.removeChannel(channel)` cleanup.
- Admin RLS bypass MUST use `public.is_staff_admin()` (the single-source-of-truth helper from `supabase/migrations/20260606200000_admin_supabase_standardize.sql`, which checks `service_role`, JWT `user_metadata.role`, and `profiles.role` — catching admins whose role only lives in the DB row, not the JWT). Amended after Task 1 review flagged that the plan's original text (`auth.jwt() -> 'user_metadata' ->> 'role' = 'admin'`, from the now-superseded `20260606120000_fix_rls_jwt_role_claim.sql`) was stale relative to this newer convention. Never use the bare `auth.jwt() ->> 'role'` form (the bug the 20260606120000 migration fixed).
- Owner RLS MUST use `owner_id = auth.uid()`.
- No functions passed as props from a Server Component to a Client Component (Next.js App Router restriction — use client-side Supabase calls instead).
- Never delete `requests` table, traveler chat tables, or their data — Approach B keeps those schemas untouched; only the admin UI is unified.
- Commit after each task, per repo convention (push to `origin main` after every commit is expected in this project).

---

### Task 1: `owner_messages` table — migration, RLS, Realtime

**Files:**
- Create: `supabase/migrations/20260701_owner_messages.sql`

**Interfaces:**
- Produces: table `public.owner_messages` with columns `id, owner_id, villa_id, subject, content, sender_role, sender_id, read_at, created_at` — consumed by Tasks 2, 3, 8.

- [ ] **Step 1: Write the migration SQL**

```sql
-- Migration : table owner_messages — fil de discussion propriétaire ↔ admin Kayvila
-- Remplace (fonctionnellement) owner_contact_messages (sens unique, voir Task 5)
-- et le code mort messages/OwnerMessaging (table `messages` jamais créée en prod).

create table if not exists public.owner_messages (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null references public.profiles(id),
  villa_id     uuid references public.villas(id),
  subject      text not null check (subject in ('reversement', 'disponibilites', 'contrat', 'autre')),
  content      text not null,
  sender_role  text not null check (sender_role in ('owner', 'admin')),
  sender_id    uuid not null references auth.users(id),
  read_at      timestamptz,
  created_at   timestamptz not null default now()
);

create index if not exists idx_owner_messages_owner_created
  on public.owner_messages(owner_id, created_at desc);

alter table public.owner_messages enable row level security;

create policy owner_messages_select_owner
  on public.owner_messages for select
  using (owner_id = auth.uid());

create policy owner_messages_select_admin
  on public.owner_messages for select
  using (
    auth.role() = 'service_role'
    or auth.jwt() -> 'user_metadata' ->> 'role' = 'admin'
  );

create policy owner_messages_insert_owner
  on public.owner_messages for insert
  with check (
    owner_id = auth.uid()
    and sender_id = auth.uid()
    and sender_role = 'owner'
  );

create policy owner_messages_insert_admin
  on public.owner_messages for insert
  with check (
    (auth.role() = 'service_role' or auth.jwt() -> 'user_metadata' ->> 'role' = 'admin')
    and sender_id = auth.uid()
    and sender_role = 'admin'
  );

create policy owner_messages_update_owner
  on public.owner_messages for update
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy owner_messages_update_admin
  on public.owner_messages for update
  using (auth.role() = 'service_role' or auth.jwt() -> 'user_metadata' ->> 'role' = 'admin')
  with check (auth.role() = 'service_role' or auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');

alter publication supabase_realtime add table public.owner_messages;
```

- [ ] **Step 2: Apply the migration**

Apply via the Supabase MCP tool `mcp__supabase__apply_migration` with `name: "owner_messages"` and the SQL above as `query`. (If working without MCP access, run `supabase db push` locally instead.)

- [ ] **Step 3: Verify the table and RLS exist**

Run: `mcp__supabase__execute_sql` with query:
```sql
select table_name from information_schema.tables where table_name = 'owner_messages';
select policyname from pg_policies where tablename = 'owner_messages';
```
Expected: 1 row for the table, 6 rows for the policies (`owner_messages_select_owner`, `owner_messages_select_admin`, `owner_messages_insert_owner`, `owner_messages_insert_admin`, `owner_messages_update_owner`, `owner_messages_update_admin`).

Note: RLS cross-owner isolation (owner A cannot see owner B's rows) is not covered by an automated Vitest test in this plan — Vitest runs in a Node environment without a real authenticated Supabase session, so it cannot exercise `auth.uid()`-based policies. It is covered manually in Task 12, Step 4.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260701_owner_messages.sql
git commit -m "feat(db): add owner_messages table with RLS + Realtime"
git push origin main
```

---

### Task 2: Message status calculation — `lib/messages/status.ts`

**Files:**
- Create: `lib/messages/status.ts`
- Test: `lib/messages/status.test.ts`

**Interfaces:**
- Produces: `type OwnerMessageRow`, `type OwnerMessageStatus = "sent" | "read" | "replied"`, `function getOwnerMessageStatus(message: OwnerMessageRow, thread: OwnerMessageRow[]): OwnerMessageStatus` — consumed by Task 3 (`OwnerTeamThread.tsx`) and Task 8 (`AdminOwnerMessagesPanel.tsx`).

- [ ] **Step 1: Write the failing test**

```ts
// lib/messages/status.test.ts
import { describe, it, expect } from "vitest";
import { getOwnerMessageStatus, type OwnerMessageRow } from "./status";

function makeMessage(overrides: Partial<OwnerMessageRow>): OwnerMessageRow {
  return {
    id: "m1",
    owner_id: "owner-1",
    villa_id: null,
    subject: "autre",
    content: "test",
    sender_role: "owner",
    sender_id: "owner-1",
    read_at: null,
    created_at: "2026-07-01T10:00:00.000Z",
    ...overrides,
  };
}

describe("getOwnerMessageStatus", () => {
  it("returns 'sent' when unread and no admin reply", () => {
    const message = makeMessage({ read_at: null });
    expect(getOwnerMessageStatus(message, [message])).toBe("sent");
  });

  it("returns 'read' when read_at is set and no admin reply after", () => {
    const message = makeMessage({ read_at: "2026-07-01T10:05:00.000Z" });
    expect(getOwnerMessageStatus(message, [message])).toBe("read");
  });

  it("returns 'replied' when an admin message exists after this one, even if read_at is null", () => {
    const message = makeMessage({ id: "m1", read_at: null, created_at: "2026-07-01T10:00:00.000Z" });
    const adminReply = makeMessage({
      id: "m2",
      sender_role: "admin",
      sender_id: "admin-1",
      created_at: "2026-07-01T11:00:00.000Z",
    });
    expect(getOwnerMessageStatus(message, [message, adminReply])).toBe("replied");
  });

  it("returns 'read' (not 'replied') when the admin message is before this one", () => {
    const adminReply = makeMessage({
      id: "m0",
      sender_role: "admin",
      sender_id: "admin-1",
      created_at: "2026-07-01T09:00:00.000Z",
    });
    const message = makeMessage({
      id: "m1",
      read_at: "2026-07-01T10:05:00.000Z",
      created_at: "2026-07-01T10:00:00.000Z",
    });
    expect(getOwnerMessageStatus(message, [adminReply, message])).toBe("read");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/messages/status.test.ts`
Expected: FAIL with "Cannot find module './status'" (file doesn't exist yet).

- [ ] **Step 3: Write the implementation**

```ts
// lib/messages/status.ts
export type OwnerMessageRow = {
  id: string;
  owner_id: string;
  villa_id: string | null;
  subject: "reversement" | "disponibilites" | "contrat" | "autre";
  content: string;
  sender_role: "owner" | "admin";
  sender_id: string;
  read_at: string | null;
  created_at: string;
};

export type OwnerMessageStatus = "sent" | "read" | "replied";

export function getOwnerMessageStatus(
  message: OwnerMessageRow,
  thread: OwnerMessageRow[]
): OwnerMessageStatus {
  const hasAdminReplyAfter = thread.some(
    (m) =>
      m.sender_role === "admin" &&
      new Date(m.created_at).getTime() > new Date(message.created_at).getTime()
  );
  if (hasAdminReplyAfter) return "replied";
  if (message.read_at) return "read";
  return "sent";
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/messages/status.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/messages/status.ts lib/messages/status.test.ts
git commit -m "feat: add owner message status calculation (sent/read/replied)"
git push origin main
```

---

### Task 3: Owner-side thread UI — `OwnerTeamThread.tsx`

**Files:**
- Create: `components/dashboard/proprio/OwnerTeamThread.tsx`

**Interfaces:**
- Consumes: `getOwnerMessageStatus`, `type OwnerMessageRow` from `@/lib/messages/status` (Task 2); `getSupabaseBrowser` from `@/lib/supabase`.
- Produces: `OwnerTeamThread({ ownerId, firstName }: { ownerId: string; firstName: string })` — consumed by Task 4.

- [ ] **Step 1: Write the component**

```tsx
// components/dashboard/proprio/OwnerTeamThread.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase";
import { Send, Phone } from "lucide-react";
import { getOwnerMessageStatus, type OwnerMessageRow } from "@/lib/messages/status";

const SUBJECTS = [
  { value: "reversement", label: "Reversement / Facturation" },
  { value: "disponibilites", label: "Disponibilités" },
  { value: "contrat", label: "Mon contrat" },
  { value: "autre", label: "Autre" },
] as const;

type Subject = (typeof SUBJECTS)[number]["value"];

const STATUS_BADGE: Record<string, string> = {
  sent: "🟡 Envoyé",
  read: "🟢 Lu par l'équipe",
  replied: "✅ Répondu",
};

interface Props {
  ownerId: string;
  firstName: string;
}

export function OwnerTeamThread({ ownerId, firstName }: Props) {
  const supabase = getSupabaseBrowser();
  const [messages, setMessages] = useState<OwnerMessageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState<Subject>("autre");
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    (async () => {
      const { data } = await supabase
        .from("owner_messages")
        .select("*")
        .eq("owner_id", ownerId)
        .order("created_at", { ascending: true });
      setMessages((data ?? []) as OwnerMessageRow[]);
      setLoading(false);

      await supabase
        .from("owner_messages")
        .update({ read_at: new Date().toISOString() })
        .eq("owner_id", ownerId)
        .eq("sender_role", "admin")
        .is("read_at", null);
    })();
  }, [supabase, ownerId]);

  useEffect(() => {
    if (!supabase) return;
    const channel = supabase
      .channel("owner-messages-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "owner_messages" },
        (payload: any) => {
          const row = payload.new as OwnerMessageRow;
          if (row.owner_id !== ownerId) return;
          setMessages((prev) => (prev.some((m) => m.id === row.id) ? prev : [...prev, row]));
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "owner_messages" },
        (payload: any) => {
          const row = payload.new as OwnerMessageRow;
          if (row.owner_id !== ownerId) return;
          setMessages((prev) => prev.map((m) => (m.id === row.id ? row : m)));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, ownerId]);

  useEffect(() => {
    containerRef.current?.scrollTo({ top: containerRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const handleQuickAction = (value: Subject) => {
    setSubject(value);
    textareaRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    textareaRef.current?.focus();
  };

  const handleSend = async () => {
    if (!supabase || !content.trim() || sending) return;
    setSending(true);
    const { data, error } = await supabase
      .from("owner_messages")
      .insert({
        owner_id: ownerId,
        sender_id: ownerId,
        sender_role: "owner",
        subject,
        content: content.trim(),
      })
      .select()
      .single();

    if (!error && data) {
      setMessages((prev) => [...prev, data as OwnerMessageRow]);
      setContent("");
    }
    setSending(false);
  };

  const messagesWithStatus = useMemo(
    () =>
      messages.map((m) => ({
        ...m,
        status: m.sender_role === "owner" ? getOwnerMessageStatus(m, messages) : null,
      })),
    [messages]
  );

  if (loading) {
    return (
      <div className="dashboard-card p-8 text-center">
        <p className="text-sm text-navy/50">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="dashboard-card p-6 space-y-3">
        <p className="font-display text-lg text-navy">Bonjour {firstName},</p>
        <p className="text-sm text-navy/70">
          Vous avez une question ? Un besoin ? C&apos;est ici que ça se passe.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700">
            ✅ Équipe disponible — réponse sous 24h
          </span>
          <a
            href="tel:+596696681869"
            className="inline-flex items-center gap-1.5 rounded-full bg-navy px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-navy/90"
          >
            <Phone size={12} strokeWidth={1.5} /> +596 696 68 18 69 (7j/7)
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <button
          type="button"
          onClick={() => handleQuickAction("reversement")}
          className="rounded-xl border border-navy/10 bg-white px-4 py-3 text-sm font-medium text-navy hover:border-gold/50"
        >
          💶 Reversement
        </button>
        <button
          type="button"
          onClick={() => handleQuickAction("disponibilites")}
          className="rounded-xl border border-navy/10 bg-white px-4 py-3 text-sm font-medium text-navy hover:border-gold/50"
        >
          📅 Disponibilités
        </button>
        <button
          type="button"
          onClick={() => handleQuickAction("autre")}
          className="rounded-xl border border-navy/10 bg-white px-4 py-3 text-sm font-medium text-navy hover:border-gold/50"
        >
          ❓ Autre demande
        </button>
      </div>

      <div className="dashboard-card flex flex-col min-h-[calc(100dvh-28rem)]">
        <div ref={containerRef} className="flex-1 overflow-y-auto p-4 space-y-3">
          {messagesWithStatus.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <p className="text-sm text-navy/50">
                Vous n&apos;avez pas encore échangé avec nous. C&apos;est le bon moment !
              </p>
            </div>
          ) : (
            messagesWithStatus.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender_role === "owner" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[70%] px-4 py-2.5 text-sm rounded-xl ${
                    msg.sender_role === "owner"
                      ? "bg-navy text-white rounded-br-sm"
                      : `bg-gold/10 text-navy rounded-bl-sm ${msg.read_at === null ? "border-l-2 border-gold" : ""}`
                  }`}
                >
                  {msg.sender_role === "admin" && (
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-gold mb-1">Kayvila</p>
                  )}
                  <p className="whitespace-pre-line">{msg.content}</p>
                </div>
                <div className="flex items-center gap-2 mt-1 px-2">
                  <span className="text-[9px] text-navy/40">
                    {new Date(msg.created_at).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  {msg.status && <span className="text-[9px] text-navy/50">{STATUS_BADGE[msg.status]}</span>}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="border-t border-navy/10 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value as Subject)}
              className="rounded-lg border border-navy/10 px-3 py-2 text-sm text-navy focus:border-gold/50 focus:outline-none"
            >
              {SUBJECTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            <span className="text-[10px] text-navy/40">{content.length}/2000</span>
          </div>
          <div className="flex gap-2">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value.slice(0, 2000))}
              placeholder="Dites-nous tout — on est là pour vous aider..."
              rows={2}
              className="flex-1 border border-navy/10 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-gold/50"
            />
            <button
              onClick={handleSend}
              disabled={sending || !content.trim()}
              className="shrink-0 inline-flex items-center justify-center w-10 h-10 bg-navy text-white rounded-lg hover:bg-gold hover:text-navy disabled:opacity-60 transition-colors"
            >
              <Send size={16} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify types compile**

Run: `npx tsc --noEmit`
Expected: no errors referencing `OwnerTeamThread.tsx`.

- [ ] **Step 3: Commit**

```bash
git add components/dashboard/proprio/OwnerTeamThread.tsx
git commit -m "feat: add OwnerTeamThread component for owner<->admin messaging"
git push origin main
```

---

### Task 4: 2-tab "Mon concierge" page

**Files:**
- Create: `components/dashboard/proprio/ConciergeTabs.tsx`
- Modify: `app/(proprio)/dashboard/concierge/page.tsx`

**Interfaces:**
- Consumes: `OwnerTeamThread` (Task 3); `Tabs, TabsList, TabsTrigger, TabsContent` from `@/components/ui/tabs`; `DashboardCopilotChat` from `@/components/dashboard/DashboardCopilotChat` (existing, `fullHeight?: boolean` prop); `getCurrentUser`, `getSupabaseServer` from `@/lib/supabase-server` (existing).
- Produces: `ConciergeTabs({ ownerId, firstName, hasUnread }: { ownerId: string; firstName: string; hasUnread: boolean })`.

- [ ] **Step 1: Write `ConciergeTabs.tsx`**

```tsx
// components/dashboard/proprio/ConciergeTabs.tsx
"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DashboardCopilotChat } from "@/components/dashboard/DashboardCopilotChat";
import { OwnerTeamThread } from "@/components/dashboard/proprio/OwnerTeamThread";

interface Props {
  ownerId: string;
  firstName: string;
  hasUnread: boolean;
}

export function ConciergeTabs({ ownerId, firstName, hasUnread }: Props) {
  return (
    <Tabs defaultValue="ia" className="w-full">
      <TabsList>
        <TabsTrigger value="ia">Concierge IA</TabsTrigger>
        <TabsTrigger value="equipe">
          Notre équipe
          {hasUnread && <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-gold" />}
        </TabsTrigger>
      </TabsList>
      <TabsContent value="ia">
        <DashboardCopilotChat fullHeight />
      </TabsContent>
      <TabsContent value="equipe">
        <OwnerTeamThread ownerId={ownerId} firstName={firstName} />
      </TabsContent>
    </Tabs>
  );
}
```

- [ ] **Step 2: Rewrite `concierge/page.tsx`**

```tsx
// app/(proprio)/dashboard/concierge/page.tsx
import { getSupabaseServer, getCurrentUser } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { ConciergeTabs } from "@/components/dashboard/proprio/ConciergeTabs";

export const dynamic = "force-dynamic";

export default async function ProprioConciergePage() {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await getCurrentUser();
  if (!user) redirect("/login?redirect=/dashboard/concierge");

  const [{ data: profile }, { count: unreadCount }] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
    supabase
      .from("owner_messages")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", user.id)
      .eq("sender_role", "admin")
      .is("read_at", null),
  ]);

  const firstName = profile?.full_name?.split(" ")[0] ?? "";

  return (
    <div>
      <div className="mb-4">
        <h1 className="font-display text-xl text-navy">Mon concierge</h1>
        <p className="mt-1 text-[11px] text-navy/50">
          Votre conseiller Kayvila — écrivez-nous, on vous répond sous 24h.
        </p>
      </div>
      <ConciergeTabs ownerId={user.id} firstName={firstName} hasUnread={(unreadCount ?? 0) > 0} />
    </div>
  );
}
```

- [ ] **Step 3: Verify types compile**

Run: `npx tsc --noEmit`
Expected: no errors referencing `concierge/page.tsx` or `ConciergeTabs.tsx`.

- [ ] **Step 4: Commit**

```bash
git add components/dashboard/proprio/ConciergeTabs.tsx "app/(proprio)/dashboard/concierge/page.tsx"
git commit -m "feat: 2-tab Mon concierge page (Concierge IA + Notre équipe)"
git push origin main
```

---

### Task 5: Remove dead/superseded owner-contact code

**Files:**
- Delete: `components/dashboard/proprio/OwnerContactFAB.tsx`
- Delete: `components/dashboard/proprio/OwnerMessaging.tsx`
- Delete: `app/(proprio)/dashboard/messages/` (entire directory — orphaned route)
- Delete: `supabase/functions/send-owner-contact/` (entire directory)
- Modify: `app/(proprio)/dashboard/layout.tsx`
- Modify: `tests/e2e/proprio-fixes.spec.ts` (remove the now-obsolete FAB test block)
- Create: `supabase/migrations/20260701_drop_owner_contact_messages.sql`

- [ ] **Step 1: Delete the FAB, dead messaging component, and orphaned route**

```bash
git rm components/dashboard/proprio/OwnerContactFAB.tsx
git rm components/dashboard/proprio/OwnerMessaging.tsx
git rm -r "app/(proprio)/dashboard/messages"
git rm -r supabase/functions/send-owner-contact
```

- [ ] **Step 2: Remove the FAB import and usage from the owner layout**

In `app/(proprio)/dashboard/layout.tsx`, remove this import line:
```tsx
import { OwnerContactFAB } from "@/components/dashboard/proprio/OwnerContactFAB";
```
and remove this line from the returned JSX:
```tsx
      <OwnerContactFAB ownerId={user.id} villas={ownerVillas ?? []} />
```
so the return block becomes:
```tsx
  return (
    <CopilotProvider>
      <DashboardShell role="owner" roleLabel="Propriétaire" menu={menuWithBadges}>
        {children}
      </DashboardShell>
    </CopilotProvider>
  );
```

- [ ] **Step 3: Remove the obsolete "OwnerContactFAB — contact FAB" test block**

In `tests/e2e/proprio-fixes.spec.ts`, delete the entire `test.describe("OwnerContactFAB — contact FAB", ...)` block (lines covering section 4, from the `// 4. Contact FAB — OwnerContactFAB` comment through its closing `});`), since the FAB no longer exists. Leave the other 4 `test.describe` blocks untouched.

- [ ] **Step 4: Write the migration to drop the superseded table**

```sql
-- Migration : suppression de owner_contact_messages (0 ligne en prod)
-- Remplacée par owner_messages (voir 20260701_owner_messages.sql) — sens unique
-- devenu obsolète avec le nouveau fil à deux sens propriétaire <-> admin.
drop table if exists public.owner_contact_messages;
```

- [ ] **Step 5: Apply the migration**

Apply via `mcp__supabase__apply_migration` with `name: "drop_owner_contact_messages"` and the SQL above.

- [ ] **Step 6: Verify the build still passes with the FAB removed**

Run: `npm run build`
Expected: build succeeds, no references to `OwnerContactFAB` or `OwnerMessaging` remain (confirm with `grep -rn "OwnerContactFAB\|OwnerMessaging" --include="*.tsx" --include="*.ts" . | grep -v node_modules` returning no results).

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: remove OwnerContactFAB and dead OwnerMessaging code, drop owner_contact_messages"
git push origin main
```

---

### Task 6: Extract "Demandes" logic into `AdminRequestsPanel`

**Files:**
- Create: `components/dashboard/admin/AdminRequestsPanel.tsx`

**Interfaces:**
- Produces: `AdminRequestsPanel()` — a self-contained component with no props, consumed by Task 9.

- [ ] **Step 1: Write the extracted component**

This is the existing logic from `app/(admin)/admin/demandes/page.tsx`, renamed and with the page-level `<h1>`/description block removed (the unified page in Task 9 provides its own title):

```tsx
// components/dashboard/admin/AdminRequestsPanel.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { getSupabaseBrowser } from "@/lib/supabase";
import { Check, X, MessageCircle, Clock, UserCheck } from "lucide-react";
import { REQUEST_TYPE_LABELS, REQUEST_STATUS_STYLES } from "@/lib/constants";
import { KayvilaEmptyState } from "@/components/ui/pro";
import { getSlaStatus } from "@/lib/sla";
import { timeAgo, cn } from "@/lib/utils";

const SLA_LEVEL_COLOR = {
  ok: "bg-emerald-50 text-emerald-700",
  warn: "bg-amber-50 text-amber-700",
  over: "bg-red-50 text-red-700",
} as const;

export function AdminRequestsPanel() {
  const supabase = getSupabaseBrowser();
  const [requests, setRequests] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [responseText, setResponseText] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState("pending");
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) return;
    (async () => {
      const members = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("role", ["admin", "proprio", "owner"]);
      setTeamMembers(members.data ?? []);
    })();
  }, [supabase]);

  const fetchRequests = async () => {
    if (!supabase) return;
    const query = supabase
      .from("requests")
      .select("id, type, status, message, admin_response, created_at, booking_id, guest_id, assignee_id, priority, taken_at, resolved_at, bookings(villa_id, villas!bookings_villa_id_fkey(name), guest_name, start_date, end_date)")
      .order("created_at", { ascending: true });
    if (filter !== "all") query.eq("status", filter);
    const { data } = await query;
    setRequests(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchRequests(); }, [supabase, filter]);

  const sortedRequests = useMemo(() => {
    const rank = (r: any) => {
      const sla = getSlaStatus({ createdAt: r.created_at, priority: r.priority ?? "standard", resolvedAt: r.resolved_at });
      if (sla.level === "over") return 0;
      if (r.priority === "urgent" && !r.resolved_at) return 1;
      if (sla.level === "warn") return 2;
      return 3;
    };
    return [...requests].sort((a, b) => rank(a) - rank(b) || new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [requests]);

  const handleAction = async (id: string, status: string, guestId?: string, requestType?: string) => {
    if (!supabase) return;
    setActionError(null);
    const resp = responseText[id] ?? "";
    const { error: updateError } = await supabase
      .from("requests")
      .update({
        status,
        admin_response: resp || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateError) {
      setActionError(updateError.message);
      return;
    }

    if (guestId) {
      const statusLabel = status === "resolved" ? "résolue" : status === "rejected" ? "refusée" : "prise en charge";
      const typeLabel = REQUEST_TYPE_LABELS[requestType ?? ""] ?? requestType ?? "Demande";
      await supabase.from("notifications").insert({
        user_id: guestId,
        type: "request_update",
        title: `Demande ${statusLabel}`,
        body: `Votre demande "${typeLabel}" a été ${statusLabel}.${resp ? ` Réponse : ${resp}` : ""}`,
        action_url: "/espace-client/demandes",
      });
    }

    setResponseText((prev) => { const n = { ...prev }; delete n[id]; return n; });
    fetchRequests();
  };

  const handleAssign = async (requestId: string, assigneeId: string) => {
    if (!supabase) return;
    setActionError(null);
    const { error } = await supabase
      .from("requests")
      .update({
        assignee_id: assigneeId || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", requestId);
    if (error) {
      setActionError(error.message);
      return;
    }
    fetchRequests();
  };

  return (
    <div className="space-y-6">
      {actionError && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {actionError}
        </p>
      )}

      <div className="flex gap-2 flex-wrap">
        {["pending", "in_progress", "resolved", "rejected", "all"].map((f) => (
          <button key={f} onClick={() => { setFilter(f); setLoading(true); }}
            className={`px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] rounded-full transition-colors ${filter === f ? "bg-navy text-white" : "bg-white border border-navy/10 text-navy/50 hover:border-navy/30"}`}>
            {f === "all" ? "Tous" : f === "pending" ? "En attente" : f === "in_progress" ? "En cours" : f === "resolved" ? "Résolus" : "Refusés"}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-navy/55">Chargement...</p>
      ) : requests.length === 0 ? (
        <KayvilaEmptyState
          icon={<MessageCircle className="size-12" />}
          title="Aucune demande"
          description="Les demandes voyageurs (conciergerie, services) apparaîtront ici."
        />
      ) : (
        <div className="space-y-4">
          {sortedRequests.map((r) => {
            const sla = getSlaStatus({ createdAt: r.created_at, priority: r.priority ?? "standard", resolvedAt: r.resolved_at });
            return (
              <div key={r.id} className="border border-navy/10 bg-white p-5">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gold">{REQUEST_TYPE_LABELS[r.type] ?? r.type}</span>
                      <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${REQUEST_STATUS_STYLES[r.status] ?? "bg-gray-50 text-gray-600"}`}>
                        {r.status === "pending" ? "En attente" : r.status === "in_progress" ? "En cours" : r.status === "resolved" ? "Résolu" : r.status}
                      </span>
                      {r.priority === "urgent" && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-700">
                          ⚡ URGENT
                        </span>
                      )}
                      <span className={cn("inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full", SLA_LEVEL_COLOR[sla.level])}>
                        <Clock size={10} />
                        {timeAgo(r.created_at)}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-navy">
                      {r.bookings?.villas?.name ?? "Villa"} — {r.bookings?.guest_name ?? "Voyageur"}
                    </p>
                    {r.bookings?.start_date && (
                      <p className="text-[11px] text-navy/55 mt-0.5">
                        {new Date(r.bookings.start_date).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })} → {new Date(r.bookings.end_date).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-navy/30 block">
                      {new Date(r.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <div className="mt-1.5">
                      <select
                        value={r.assignee_id ?? ""}
                        onChange={(e) => handleAssign(r.id, e.target.value)}
                        className="min-h-[44px] rounded-full border border-navy/10 bg-white px-3 py-2 text-[10px] text-navy/60 focus:border-gold/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/40"
                      >
                        <option value="">Non assigné</option>
                        {teamMembers.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.full_name ?? m.email}
                          </option>
                        ))}
                      </select>
                      {r.assignee_id && (
                        <div className="flex items-center gap-1 mt-1 justify-end">
                          <UserCheck size={10} className="text-gold" />
                          <span className="text-[9px] text-gold">
                            {teamMembers.find((m) => m.id === r.assignee_id)?.full_name ??
                             teamMembers.find((m) => m.id === r.assignee_id)?.email ??
                             "Assigné"}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <p className="text-sm text-navy/70 mb-3 bg-navy/[0.02] p-3">{r.message}</p>
                {r.admin_response && (
                  <div className="mb-3 border-l-2 border-gold/30 pl-3">
                    <p className="text-[11px] font-semibold text-gold mb-1">Réponse</p>
                    <p className="text-sm text-navy/60">{r.admin_response}</p>
                  </div>
                )}
                {r.status === "pending" || r.status === "in_progress" ? (
                  <div className="space-y-2">
                    <textarea
                      value={responseText[r.id] ?? ""}
                      onChange={(e) => setResponseText((prev) => ({ ...prev, [r.id]: e.target.value }))}
                      placeholder="Réponse (optionnelle)..."
                      rows={2}
                      className="w-full resize-none border border-navy/15 bg-white px-3 py-2 text-sm focus:border-gold/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/40"
                    />
                    <div className="flex gap-2">
                      <button onClick={() => handleAction(r.id, "resolved", r.guest_id, r.type)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-50 text-emerald-700 text-[11px] font-semibold rounded-full hover:bg-emerald-100 transition-colors">
                        <Check size={14} /> Résoudre
                      </button>
                      <button onClick={() => handleAction(r.id, "rejected", r.guest_id, r.type)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-50 text-red-700 text-[11px] font-semibold rounded-full hover:bg-red-100 transition-colors">
                        <X size={14} /> Refuser
                      </button>
                      {r.status !== "in_progress" && (
                        <button onClick={() => handleAction(r.id, "in_progress", r.guest_id, r.type)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-50 text-blue-700 text-[11px] font-semibold rounded-full hover:bg-blue-100 transition-colors">
                          <MessageCircle size={14} /> En cours
                        </button>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify types compile**

Run: `npx tsc --noEmit`
Expected: no errors referencing `AdminRequestsPanel.tsx`. (`app/(admin)/admin/demandes/page.tsx` still exists at this point and still compiles independently — it is deleted in Task 9.)

- [ ] **Step 3: Commit**

```bash
git add components/dashboard/admin/AdminRequestsPanel.tsx
git commit -m "refactor: extract Demandes logic into reusable AdminRequestsPanel"
git push origin main
```

---

### Task 7: Extract "Messagerie" logic into `AdminTravelerChatPanel`

**Files:**
- Create: `components/dashboard/admin/AdminTravelerChatPanel.tsx`

**Interfaces:**
- Produces: `AdminTravelerChatPanel()` — a self-contained component with no props, consumed by Task 9.

- [ ] **Step 1: Write the extracted component**

Existing logic from `app/(admin)/admin/messagerie/page.tsx`, renamed, with the `AdminPageIntro` header removed (the unified page in Task 9 provides its own title):

```tsx
// components/dashboard/admin/AdminTravelerChatPanel.tsx
"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Send, MessageCircle } from "lucide-react";
import { KayvilaEmptyState } from "@/components/ui/pro";
import { timeAgo } from "@/lib/utils";

type ChatRow = {
  id: string;
  session_id: string;
  user_id: string;
  role: string;
  content: string;
  created_at: string;
};

export function AdminTravelerChatPanel() {
  const [messages, setMessages] = useState<ChatRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSession, setActiveSession] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    const res = await fetch("/api/admin/messages", { credentials: "include" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(typeof data.error === "string" ? data.error : "Chargement impossible");
      setLoading(false);
      return;
    }
    setMessages(data.messages ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const sessions = useMemo(() => {
    const map = new Map<string, ChatRow[]>();
    for (const m of messages) {
      const list = map.get(m.session_id) ?? [];
      list.push(m);
      map.set(m.session_id, list);
    }
    return [...map.entries()].sort(
      (a, b) =>
        new Date(b[1][0]?.created_at ?? 0).getTime() -
        new Date(a[1][0]?.created_at ?? 0).getTime()
    );
  }, [messages]);

  useEffect(() => {
    if (!activeSession && sessions.length > 0) {
      setActiveSession(sessions[0][0]);
    }
  }, [sessions, activeSession]);

  const thread = activeSession
    ? (sessions.find(([id]) => id === activeSession)?.[1] ?? []).sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )
    : [];

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reply.trim() || !activeSession) return;
    setSending(true);
    setError(null);
    const res = await fetch("/api/admin/messages", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: activeSession, content: reply.trim() }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(typeof data.error === "string" ? data.error : "Envoi impossible");
      setSending(false);
      return;
    }
    setReply("");
    setSending(false);
    fetchMessages();
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread]);

  return (
    <div className="space-y-6">
      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-navy/55">Chargement...</p>
      ) : sessions.length === 0 ? (
        <KayvilaEmptyState
          icon={<MessageCircle className="size-12" />}
          title="Aucun message"
          description="Les conversations du chatbot et de la messagerie s'afficheront ici."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
          <aside className="border border-navy/10 bg-white divide-y divide-navy/5 max-h-[60vh] overflow-y-auto">
            {sessions.map(([sessionId, rows]) => {
              const last = rows[0];
              return (
                <button
                  key={sessionId}
                  type="button"
                  onClick={() => setActiveSession(sessionId)}
                  className={`w-full text-left px-4 py-3 text-sm hover:bg-navy/[0.02] ${
                    activeSession === sessionId ? "bg-gold/5" : ""
                  }`}
                >
                  <p className="font-medium text-navy truncate">{sessionId}</p>
                  <p className="text-xs text-navy/50 truncate">{last?.content}</p>
                  <p className="text-[10px] text-navy/35 mt-1">{timeAgo(last?.created_at)}</p>
                </button>
              );
            })}
          </aside>

          <div className="border border-navy/10 bg-white flex flex-col min-h-[50vh]">
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {thread.map((m) => (
                <div
                  key={m.id}
                  className={`max-w-[85%] rounded-lg px-4 py-2 text-sm ${
                    m.role === "assistant"
                      ? "ml-auto bg-navy text-white"
                      : "bg-offwhite text-navy"
                  }`}
                >
                  <p>{m.content}</p>
                  <p className="text-[10px] opacity-60 mt-1">{timeAgo(m.created_at)}</p>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
            <form onSubmit={handleSend} className="border-t border-navy/10 p-4 flex gap-2">
              <input
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="Répondre au voyageur…"
                className="flex-1 rounded-lg border border-navy/15 px-3 py-2 text-sm"
              />
              <button
                type="submit"
                disabled={sending || !reply.trim()}
                className="inline-flex items-center gap-1 rounded-lg bg-navy px-4 py-2 text-sm text-white disabled:opacity-40"
              >
                <Send size={14} />
                Envoyer
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify types compile**

Run: `npx tsc --noEmit`
Expected: no errors referencing `AdminTravelerChatPanel.tsx`.

- [ ] **Step 3: Commit**

```bash
git add components/dashboard/admin/AdminTravelerChatPanel.tsx
git commit -m "refactor: extract Messagerie logic into reusable AdminTravelerChatPanel"
git push origin main
```

---

### Task 8: New admin panel — `AdminOwnerMessagesPanel`

**Files:**
- Create: `components/dashboard/admin/AdminOwnerMessagesPanel.tsx`

**Interfaces:**
- Consumes: `type OwnerMessageRow` from `@/lib/messages/status` (Task 2).
- Produces: `AdminOwnerMessagesPanel()` — a self-contained component with no props, consumed by Task 9.

- [ ] **Step 1: Write the component**

```tsx
// components/dashboard/admin/AdminOwnerMessagesPanel.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase";
import { Send, MessageCircle } from "lucide-react";
import { KayvilaEmptyState } from "@/components/ui/pro";
import { timeAgo } from "@/lib/utils";
import type { OwnerMessageRow } from "@/lib/messages/status";

type Profile = { id: string; full_name: string | null; email: string | null };

const SUBJECT_LABELS: Record<string, string> = {
  reversement: "Reversement / Facturation",
  disponibilites: "Disponibilités",
  contrat: "Mon contrat",
  autre: "Autre",
};

export function AdminOwnerMessagesPanel() {
  const supabase = getSupabaseBrowser();
  const [messages, setMessages] = useState<OwnerMessageRow[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(true);
  const [activeOwnerId, setActiveOwnerId] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [adminUserId, setAdminUserId] = useState<string | null>(null);

  const fetchAll = async () => {
    if (!supabase) return;
    const { data } = await supabase
      .from("owner_messages")
      .select("*")
      .order("created_at", { ascending: true });
    const rows = (data ?? []) as OwnerMessageRow[];
    setMessages(rows);

    const ownerIds = [...new Set(rows.map((r) => r.owner_id))];
    if (ownerIds.length > 0) {
      const { data: profileRows } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", ownerIds);
      const map: Record<string, Profile> = {};
      (profileRows ?? []).forEach((p: any) => {
        map[p.id] = p as Profile;
      });
      setProfiles(map);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }) => setAdminUserId(data.user?.id ?? null));
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  useEffect(() => {
    if (!supabase) return;
    const channel = supabase
      .channel("admin-owner-messages-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "owner_messages" }, fetchAll)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "owner_messages" }, fetchAll)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  const conversations = useMemo(() => {
    const map = new Map<string, OwnerMessageRow[]>();
    for (const m of messages) {
      const list = map.get(m.owner_id) ?? [];
      list.push(m);
      map.set(m.owner_id, list);
    }
    return [...map.entries()].sort(
      (a, b) =>
        new Date(b[1][b[1].length - 1]?.created_at ?? 0).getTime() -
        new Date(a[1][a[1].length - 1]?.created_at ?? 0).getTime()
    );
  }, [messages]);

  useEffect(() => {
    if (!activeOwnerId && conversations.length > 0) {
      setActiveOwnerId(conversations[0][0]);
    }
  }, [conversations, activeOwnerId]);

  const thread = activeOwnerId ? conversations.find(([id]) => id === activeOwnerId)?.[1] ?? [] : [];

  useEffect(() => {
    if (!supabase || !activeOwnerId) return;
    const hasUnread = thread.some((m) => m.sender_role === "owner" && m.read_at === null);
    if (!hasUnread) return;
    supabase
      .from("owner_messages")
      .update({ read_at: new Date().toISOString() })
      .eq("owner_id", activeOwnerId)
      .eq("sender_role", "owner")
      .is("read_at", null)
      .then(() => fetchAll());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeOwnerId]);

  const handleSend = async () => {
    if (!supabase || !reply.trim() || !activeOwnerId || !adminUserId) return;
    setSending(true);
    const lastOwnerSubject =
      [...thread].reverse().find((m) => m.sender_role === "owner")?.subject ?? "autre";
    const { error } = await supabase.from("owner_messages").insert({
      owner_id: activeOwnerId,
      sender_id: adminUserId,
      sender_role: "admin",
      subject: lastOwnerSubject,
      content: reply.trim(),
    });
    if (!error) {
      setReply("");
      await fetchAll();
    }
    setSending(false);
  };

  if (loading) return <p className="text-sm text-navy/55">Chargement...</p>;

  if (conversations.length === 0) {
    return (
      <KayvilaEmptyState
        icon={<MessageCircle className="size-12" />}
        title="Aucun message"
        description="Les messages des propriétaires apparaîtront ici."
      />
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      <aside className="border border-navy/10 bg-white divide-y divide-navy/5 max-h-[60vh] overflow-y-auto">
        {conversations.map(([ownerId, rows]) => {
          const last = rows[rows.length - 1];
          const profile = profiles[ownerId];
          const hasUnread = rows.some((m) => m.sender_role === "owner" && m.read_at === null);
          return (
            <button
              key={ownerId}
              type="button"
              onClick={() => setActiveOwnerId(ownerId)}
              className={`w-full text-left px-4 py-3 text-sm hover:bg-navy/[0.02] ${
                activeOwnerId === ownerId ? "bg-gold/5" : ""
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium text-navy truncate">
                  {profile?.full_name ?? profile?.email ?? "Propriétaire"}
                </p>
                {hasUnread && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />}
              </div>
              <p className="text-xs text-navy/50 truncate">{last?.content}</p>
              <p className="text-[10px] text-navy/35 mt-1">{timeAgo(last?.created_at)}</p>
            </button>
          );
        })}
      </aside>

      <div className="border border-navy/10 bg-white flex flex-col min-h-[50vh]">
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {thread.map((m) => (
            <div
              key={m.id}
              className={`max-w-[85%] rounded-lg px-4 py-2 text-sm ${
                m.sender_role === "admin" ? "ml-auto bg-navy text-white" : "bg-offwhite text-navy"
              }`}
            >
              <p className="text-[10px] font-semibold uppercase tracking-wide opacity-60 mb-1">
                {SUBJECT_LABELS[m.subject] ?? m.subject}
              </p>
              <p>{m.content}</p>
              <p className="text-[10px] opacity-60 mt-1">{timeAgo(m.created_at)}</p>
            </div>
          ))}
        </div>
        <div className="border-t border-navy/10 p-4 flex gap-2">
          <input
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Répondre au propriétaire…"
            className="flex-1 rounded-lg border border-navy/15 px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={sending || !reply.trim()}
            className="inline-flex items-center gap-1 rounded-lg bg-navy px-4 py-2 text-sm text-white disabled:opacity-40"
          >
            <Send size={14} />
            Envoyer
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify types compile**

Run: `npx tsc --noEmit`
Expected: no errors referencing `AdminOwnerMessagesPanel.tsx`.

- [ ] **Step 3: Commit**

```bash
git add components/dashboard/admin/AdminOwnerMessagesPanel.tsx
git commit -m "feat: add AdminOwnerMessagesPanel (Propriétaires tab)"
git push origin main
```

---

### Task 9: Unified admin "Messages" page, delete old routes

**Files:**
- Create: `app/(admin)/admin/messages/page.tsx`
- Delete: `app/(admin)/admin/demandes/page.tsx`
- Delete: `app/(admin)/admin/messagerie/page.tsx`

**Interfaces:**
- Consumes: `AdminOwnerMessagesPanel` (Task 8), `AdminTravelerChatPanel` (Task 7), `AdminRequestsPanel` (Task 6), `Tabs, TabsList, TabsTrigger, TabsContent` from `@/components/ui/tabs`, `AdminPageIntro` from `@/components/dashboard/admin/AdminPageIntro`.

- [ ] **Step 1: Write the unified page**

```tsx
// app/(admin)/admin/messages/page.tsx
"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AdminPageIntro } from "@/components/dashboard/admin/AdminPageIntro";
import { AdminOwnerMessagesPanel } from "@/components/dashboard/admin/AdminOwnerMessagesPanel";
import { AdminTravelerChatPanel } from "@/components/dashboard/admin/AdminTravelerChatPanel";
import { AdminRequestsPanel } from "@/components/dashboard/admin/AdminRequestsPanel";

export default function AdminMessagesPage() {
  return (
    <div className="space-y-6">
      <AdminPageIntro
        title="Messages"
        description="Toute la relation client Kayvila : propriétaires, locataires, demandes."
      />
      <Tabs defaultValue="proprietaires" className="w-full">
        <TabsList>
          <TabsTrigger value="proprietaires">Propriétaires</TabsTrigger>
          <TabsTrigger value="locataires">Locataires</TabsTrigger>
          <TabsTrigger value="demandes">Demandes</TabsTrigger>
        </TabsList>
        <TabsContent value="proprietaires">
          <AdminOwnerMessagesPanel />
        </TabsContent>
        <TabsContent value="locataires">
          <AdminTravelerChatPanel />
        </TabsContent>
        <TabsContent value="demandes">
          <AdminRequestsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

- [ ] **Step 2: Delete the two superseded routes**

```bash
git rm "app/(admin)/admin/demandes/page.tsx"
git rm "app/(admin)/admin/messagerie/page.tsx"
```

- [ ] **Step 3: Verify no remaining references to the deleted routes**

Run: `grep -rn "/admin/demandes\|/admin/messagerie" --include="*.tsx" --include="*.ts" . | grep -v node_modules | grep -v .worktrees`
Expected: no results (Task 10 removes the menu entries; if any other file still links to these paths, update it now to `/admin/messages`).

- [ ] **Step 4: Verify build**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 5: Commit**

```bash
git add "app/(admin)/admin/messages/page.tsx"
git commit -m "feat: unified admin Messages page (Propriétaires/Locataires/Demandes), remove old routes"
git push origin main
```

---

### Task 10: Update admin navigation menu

**Files:**
- Modify: `components/dashboard/admin/AdminMenuItems.ts`

- [ ] **Step 1: Replace the "Séjours & demandes" group with a flat "Réservations" item**

Change:
```ts
  {
    id: "admin-gestion-sejours",
    label: "Séjours & demandes",
    icon: "CalendarDays",
    group: "GESTION",
    children: [
      { label: "Réservations", href: "/admin/reservations", icon: "CalendarDays" },
      { label: "Demandes", href: "/admin/demandes", icon: "ClipboardList" },
    ],
  },
```
to:
```ts
  {
    label: "Réservations",
    href: "/admin/reservations",
    icon: "CalendarDays",
    group: "GESTION",
  },
```

- [ ] **Step 2: Replace "Messagerie" with "Messages" under "Relation client"**

Change:
```ts
  {
    id: "admin-relation-client",
    label: "Relation client",
    icon: "MessageCircle",
    group: "OUTILS",
    children: [
      { label: "Avis", href: "/admin/avis", icon: "Star" },
      { label: "Messagerie", href: "/admin/messagerie", icon: "MessageCircle" },
    ],
  },
```
to:
```ts
  {
    id: "admin-relation-client",
    label: "Relation client",
    icon: "MessageCircle",
    group: "OUTILS",
    children: [
      { label: "Avis", href: "/admin/avis", icon: "Star" },
      { label: "Messages", href: "/admin/messages", icon: "MessageCircle" },
    ],
  },
```

- [ ] **Step 3: Rekey the orphaned urgent-requests badge to the new Messages route**

Correction found during Task 9 review: `app/(admin)/admin/layout.tsx` builds a `badgeMap` keyed by menu href to show a count badge in the sidebar. It currently has:
```ts
  const badgeMap: Record<string, number> = {
    "/admin/reservations": reservations.count ?? 0,
    "/admin/soumissions": soumissions.count ?? 0,
    "/admin/avis": avis.count ?? 0,
    "/admin/demandes": demandes.count ?? 0,
  };
```
`demandes.count` is the count of urgent, unresolved traveler requests (see the query just above this block: `.from("requests")...eq("priority","urgent").neq("status","resolved")`). Since Step 1 removes the `/admin/demandes` menu entry, this key would silently stop matching anything in `applyMenuBadges`, and the urgent-request count badge would disappear from the sidebar entirely. Rekey it to the new unified route:
```ts
  const badgeMap: Record<string, number> = {
    "/admin/reservations": reservations.count ?? 0,
    "/admin/soumissions": soumissions.count ?? 0,
    "/admin/avis": avis.count ?? 0,
    "/admin/messages": demandes.count ?? 0,
  };
```
Only change the key string (`"/admin/demandes"` → `"/admin/messages"`) on that one line — everything else in `app/(admin)/admin/layout.tsx` stays as-is.

Then verify no orphaned references remain:
Run: `grep -rn "/admin/demandes\|/admin/messagerie" lib/dashboard/apply-menu-badges.ts "app/(admin)/admin/layout.tsx" 2>/dev/null`
Expected: no results.

- [ ] **Step 4: Verify build**

Run: `npm run build`
Expected: build succeeds, sidebar renders "Réservations" as a flat item and "Messages" under "Relation client".

- [ ] **Step 5: Commit**

```bash
git add components/dashboard/admin/AdminMenuItems.ts
git commit -m "chore: update admin nav — flatten Réservations, replace Messagerie with Messages"
git push origin main
```

---

### Task 11: Playwright E2E coverage

**Files:**
- Create: `tests/e2e/owner-team-messages.spec.ts`

- [ ] **Step 1: Write the E2E test**

```ts
// tests/e2e/owner-team-messages.spec.ts
import { test, expect, type Page } from "@playwright/test";

const OWNER_EMAIL = process.env.TEST_OWNER_EMAIL || "owner@kayvila.com";
const OWNER_PASSWORD = process.env.TEST_OWNER_PASSWORD || "owner123";
const ADMIN_EMAIL = process.env.ADMIN_E2E_EMAIL || "admin@diamantnoir.com";
const ADMIN_PASSWORD = process.env.ADMIN_E2E_PASSWORD || "Admin123!";

async function loginAsOwner(page: Page): Promise<void> {
  await page.goto("/login");
  await page.waitForLoadState("networkidle");
  await page.locator("input[type='email'], input[name='email']").first().fill(OWNER_EMAIL);
  await page.locator("input[type='password']").first().fill(OWNER_PASSWORD);
  await page.locator("button[type='submit']").first().click();
  await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 15_000 });
}

async function loginAsAdmin(page: Page): Promise<void> {
  await page.goto("/login?redirect=/admin/messages");
  await page.locator("#email-pass").fill(ADMIN_EMAIL);
  await page.locator("#password-pass").fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: /accéder/i }).click();
  await page.waitForURL("**/admin/messages", { timeout: 15_000 });
}

test.describe("Mon concierge — Notre équipe / admin Messages", () => {
  test.skip(!!process.env.PLAYWRIGHT_SKIP_DB_TESTS, "Needs local Supabase");

  test("quick actions pre-fill the subject selector", async ({ page }) => {
    await loginAsOwner(page);
    await page.goto("/dashboard/concierge");
    await page.waitForLoadState("networkidle");

    await page.getByRole("tab", { name: /Notre équipe/i }).click();
    await page.getByRole("button", { name: /Disponibilités/i }).click();

    const subjectSelect = page.locator("select").first();
    await expect(subjectSelect).toHaveValue("disponibilites");
  });

  test("owner sends a message and it appears in the admin Propriétaires tab", async ({
    page,
    browser,
  }) => {
    const messageText = `Test E2E ${Date.now()}`;

    await loginAsOwner(page);
    await page.goto("/dashboard/concierge");
    await page.waitForLoadState("networkidle");
    await page.getByRole("tab", { name: /Notre équipe/i }).click();

    await page.locator("textarea").fill(messageText);
    await page.locator("button:has(svg)").last().click();

    await expect(page.getByText(messageText)).toBeVisible({ timeout: 10_000 });

    const adminContext = await browser.newContext();
    const adminPage = await adminContext.newPage();
    await loginAsAdmin(adminPage);
    await adminPage.getByRole("tab", { name: "Propriétaires" }).click();
    await expect(adminPage.getByText(messageText)).toBeVisible({ timeout: 10_000 });
    await adminContext.close();
  });

  test("admin reply flips owner message status to Répondu and shows an unread badge", async ({
    page,
    browser,
  }) => {
    const ownerMessage = `Statut E2E ${Date.now()}`;
    const adminReply = `Réponse E2E ${Date.now()}`;

    await loginAsOwner(page);
    await page.goto("/dashboard/concierge");
    await page.waitForLoadState("networkidle");
    await page.getByRole("tab", { name: /Notre équipe/i }).click();
    await page.locator("textarea").fill(ownerMessage);
    await page.locator("button:has(svg)").last().click();
    await expect(page.getByText(ownerMessage)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("🟡 Envoyé")).toBeVisible({ timeout: 10_000 });

    const adminContext = await browser.newContext();
    const adminPage = await adminContext.newPage();
    await loginAsAdmin(adminPage);
    await adminPage.getByRole("tab", { name: "Propriétaires" }).click();
    await expect(adminPage.getByText(ownerMessage)).toBeVisible({ timeout: 10_000 });
    await adminPage.locator("input[placeholder='Répondre au propriétaire…']").fill(adminReply);
    await adminPage.getByRole("button", { name: /Envoyer/i }).click();
    await expect(adminPage.getByText(adminReply)).toBeVisible({ timeout: 10_000 });
    await adminContext.close();

    // Sans reload : le statut passe à "Répondu" via Realtime
    await expect(page.getByText("✅ Répondu")).toBeVisible({ timeout: 10_000 });

    // Recharger et rouvrir l'onglet IA puis Notre équipe : le point non-lu doit apparaître
    // avant d'ouvrir l'onglet (le badge se pose au chargement de la page)
    await page.reload();
    await page.waitForLoadState("networkidle");
    const teamTab = page.getByRole("tab", { name: /Notre équipe/i });
    await expect(teamTab.locator(".bg-gold")).toBeVisible({ timeout: 10_000 });
  });
});
```

- [ ] **Step 2: Run the new spec**

Run: `npx playwright test tests/e2e/owner-team-messages.spec.ts --project=mocked`
Expected: PASS (or explicit skip if `PLAYWRIGHT_SKIP_DB_TESTS` is set and no local Supabase/dev server is running — this file is not wired into `playwright.config.ts` projects, matching the existing convention for `tests/e2e/proprio-fixes.spec.ts` and `tests/e2e/proactive-notification.spec.ts`, which are also run via explicit path rather than a named project).

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/owner-team-messages.spec.ts
git commit -m "test: E2E coverage for owner<->admin messaging hub"
git push origin main
```

---

### Task 12: Final verification

- [ ] **Step 1: Full build**

Run: `npm run build`
Expected: succeeds with no type errors.

- [ ] **Step 2: Full Vitest suite**

Run: `npx vitest run`
Expected: all tests pass, including `lib/messages/status.test.ts`.

- [ ] **Step 3: Confirm no dangling references to removed code**

Run:
```bash
grep -rn "OwnerContactFAB\|OwnerMessaging\|owner_contact_messages\|send-owner-contact" --include="*.tsx" --include="*.ts" . | grep -v node_modules | grep -v .worktrees
grep -rn "admin/demandes\|admin/messagerie" --include="*.tsx" --include="*.ts" . | grep -v node_modules | grep -v .worktrees
```
Expected: no results for either command.

- [ ] **Step 4: Manual smoke test (dev server)**

Run: `npm run dev`, then in a browser:
- `/dashboard/concierge` as an owner: confirm 2 tabs render, "Notre équipe" shows the welcome card + quick actions + empty-state thread, sending a message works, character counter updates.
- `/admin/messages` as admin: confirm 3 tabs render (Propriétaires/Locataires/Demandes), each shows its expected content with no functionality lost versus the old separate pages.
- Confirm the owner dashboard no longer shows the floating "Contacter Kayvila" button anywhere.
- RLS isolation: log in as two different owner accounts (or use two Supabase JWTs) and confirm each only sees their own rows on `/dashboard/concierge` → "Notre équipe" — never another owner's messages.

- [ ] **Step 5: Commit (only if smoke-test fixes were needed)**

If Step 4 revealed any fix, commit it separately with a descriptive message and push. If nothing needed fixing, no commit is required for this task.
