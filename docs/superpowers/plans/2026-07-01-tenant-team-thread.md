# Fil de relation humaine locataire "Notre équipe" — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the non-functional locataire AI chatbot on `espace-client/messagerie` with a real two-way human message thread with the Kayvila admin team, and repoint the admin's existing "Locataires" tab to that same data instead of the old (non-functional) chatbot logs.

**Architecture:** A new `tenant_messages` Supabase table (RLS + Realtime + an UPDATE-restriction trigger included from the start, unlike the owner project where this was a post-hoc fix) mirrors `owner_messages`. `app/espace-client/messagerie/page.tsx` becomes a Server Component that resolves the tenant's identity/active booking and renders a new `TenantTeamThread` client component. `AdminTravelerChatPanel.tsx` is rewritten in place (same filename, same tab) to read `tenant_messages` instead of the old chatbot log API.

**Tech Stack:** Next.js 15 App Router (Server + Client Components), Supabase (Postgres + RLS + Realtime), existing espace-client UI primitives (`PageTopbar`, `TenantSectionHeader`, `KayvilaTenantWidget`, `Spinner`), Vitest, Playwright.

## Global Constraints

- **Règle absolue (non négociable) : aucune relation directe locataire ↔ propriétaire.** RLS on `tenant_messages` must only ever grant access to `guest_id = auth.uid()` (tenant) or `public.is_staff_admin()` (admin) — never anything keyed on `owner_id` or villa ownership. The admin UI may show the villa *name* for context but never the owner's identity or contact info.
- Admin RLS bypass MUST use `public.is_staff_admin()` (established convention from the owner-messages project, `supabase/migrations/20260606200000_admin_supabase_standardize.sql`).
- Every new Supabase migration filename MUST use a full 14-digit `YYYYMMDDHHMMSS` timestamp, never an 8-digit date-only prefix (lesson from the owner-messages project's migration-ordering bug).
- The UPDATE-restriction trigger (tenant can only change `read_at`, never rewrite admin-authored content) MUST be part of the initial migration, not a follow-up fix (lesson from the owner-messages project).
- Realtime subscriptions MUST follow the exact pattern in `components/dashboard/NotificationBell.tsx`: `supabase.channel(name).on("postgres_changes", {...}).subscribe()` in a `useEffect`, with `supabase.removeChannel(channel)` cleanup.
- `TenantChatbot.tsx` and `app/api/chat/tenant/route.ts` are NOT deleted — only unrendered from the messagerie page. No functional code removal.
- No functions passed as props from a Server Component to a Client Component.
- Commit after each task; push only when explicitly instructed (this project's convention is to push after every commit, but confirm with the user before the first push of this new work if starting a fresh branch/worktree).

---

### Task 1: `tenant_messages` table — migration, RLS, UPDATE-restriction trigger, Realtime (all in one migration)

**Files:**
- Create: `supabase/migrations/20260701200000_tenant_messages.sql`

**Interfaces:**
- Produces: table `public.tenant_messages` with columns `id, guest_id, booking_id, subject, content, sender_role, sender_id, read_at, created_at` — consumed by Tasks 2, 3, 5.

- [ ] **Step 1: Write the migration SQL**

```sql
-- Migration : table tenant_messages — fil de discussion locataire <-> admin Kayvila
-- Miroir de owner_messages (supabase/migrations/20260701100000_owner_messages.sql)
-- mais strictement locataire <-> admin : AUCUNE relation directe locataire <-> propriétaire.
-- Le trigger de restriction UPDATE est inclus dès cette migration initiale (contrairement
-- à owner_messages où il a fallu un correctif après-coup en review finale).

create table if not exists public.tenant_messages (
  id           uuid primary key default gen_random_uuid(),
  guest_id     uuid not null references auth.users(id),
  booking_id   uuid references public.bookings(id),
  subject      text not null check (subject in ('probleme', 'sejour', 'reservation', 'autre')),
  content      text not null,
  sender_role  text not null check (sender_role in ('guest', 'admin')),
  sender_id    uuid not null references auth.users(id),
  read_at      timestamptz,
  created_at   timestamptz not null default now()
);

create index if not exists idx_tenant_messages_guest_created
  on public.tenant_messages(guest_id, created_at desc);

alter table public.tenant_messages enable row level security;

create policy tenant_messages_select_guest
  on public.tenant_messages for select
  using (guest_id = auth.uid());

create policy tenant_messages_select_admin
  on public.tenant_messages for select
  using (public.is_staff_admin());

create policy tenant_messages_insert_guest
  on public.tenant_messages for insert
  with check (
    guest_id = auth.uid()
    and sender_id = auth.uid()
    and sender_role = 'guest'
  );

create policy tenant_messages_insert_admin
  on public.tenant_messages for insert
  with check (
    public.is_staff_admin()
    and sender_id = auth.uid()
    and sender_role = 'admin'
  );

create policy tenant_messages_update_guest
  on public.tenant_messages for update
  using (guest_id = auth.uid())
  with check (guest_id = auth.uid());

create policy tenant_messages_update_admin
  on public.tenant_messages for update
  using (public.is_staff_admin())
  with check (public.is_staff_admin());

-- Restriction : un locataire ne peut modifier que read_at sur ses propres lignes
-- (jamais réécrire le contenu d'un message admin). Inclus dès le départ, pas en
-- correctif après-coup (leçon tirée du projet owner_messages).
create or replace function public.tenant_messages_restrict_guest_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_staff_admin() then
    return new;
  end if;

  if new.id is distinct from old.id
    or new.guest_id is distinct from old.guest_id
    or new.booking_id is distinct from old.booking_id
    or new.subject is distinct from old.subject
    or new.content is distinct from old.content
    or new.sender_role is distinct from old.sender_role
    or new.sender_id is distinct from old.sender_id
    or new.created_at is distinct from old.created_at
  then
    raise exception 'tenant_messages: un locataire ne peut modifier que read_at';
  end if;

  return new;
end;
$$;

drop trigger if exists tenant_messages_restrict_guest_update on public.tenant_messages;
create trigger tenant_messages_restrict_guest_update
  before update on public.tenant_messages
  for each row
  execute function public.tenant_messages_restrict_guest_update();

alter publication supabase_realtime add table public.tenant_messages;
```

- [ ] **Step 2: Apply the migration**

Apply via the Supabase MCP tool (`apply_migration`, `project_id: "wsdawdxucyuyopkpgjij"`, `name: "tenant_messages"`) with the SQL above as `query`.

- [ ] **Step 3: Verify the table, RLS, and trigger exist**

Run via the Supabase MCP `execute_sql` tool:
```sql
select table_name from information_schema.tables where table_name = 'tenant_messages';
select policyname from pg_policies where tablename = 'tenant_messages' order by policyname;
select tgname, tgenabled from pg_trigger where tgname = 'tenant_messages_restrict_guest_update';
```
Expected: 1 row for the table; 6 rows for the policies (`tenant_messages_select_guest`, `tenant_messages_select_admin`, `tenant_messages_insert_guest`, `tenant_messages_insert_admin`, `tenant_messages_update_guest`, `tenant_messages_update_admin`); 1 row for the trigger with `tgenabled = 'O'`.

- [ ] **Step 4: Verify the absolute rule with a direct RLS simulation (SQL-level proof)**

This is the real, automated proof of "no relation locataire ↔ propriétaire": simulate a random authenticated user who is neither the `guest_id` of any row nor an admin (an owner falls into exactly this category, since ownership carries no special grant on this table). If RLS is correct, this session sees zero rows regardless of how many `tenant_messages` rows exist.

First, insert one throwaway row as service role so there is something to potentially (and incorrectly) leak:
```sql
insert into public.tenant_messages (guest_id, subject, content, sender_role, sender_id)
select id, 'autre', 'RLS test row — safe to ignore/delete', 'guest', id
from auth.users limit 1;
```
Then simulate a non-guest, non-admin authenticated session and attempt to read:
```sql
set local role authenticated;
select set_config(
  'request.jwt.claims',
  json_build_object('sub', '00000000-0000-0000-0000-000000000000', 'role', 'authenticated')::text,
  true
);
select count(*) from public.tenant_messages;
reset role;
```
Expected: the final `count(*)` returns `0` — the simulated non-owner-of-the-row, non-admin session cannot see the row that was just inserted. If this returns anything greater than 0, STOP — the RLS policies from Step 1 have a bug and must be fixed before proceeding to any later task.

Clean up the throwaway row:
```sql
delete from public.tenant_messages where content = 'RLS test row — safe to ignore/delete';
```

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260701200000_tenant_messages.sql
git commit -m "feat(db): add tenant_messages table with RLS, UPDATE-restriction trigger, and Realtime"
```

---

### Task 2: Widen message-status logic to cover both owner and tenant rows

**Files:**
- Modify: `lib/messages/status.ts`
- Modify: `lib/messages/status.test.ts` (add one new test case; existing 4 cases must still pass unchanged)

**Interfaces:**
- Consumes: nothing new.
- Produces: `type TenantMessageRow`, widened `function getOwnerMessageStatus(message: MessageStatusInput, thread: MessageStatusInput[]): OwnerMessageStatus` where `MessageStatusInput` is a structural subset — consumed by Task 3 (`TenantTeamThread.tsx`) and Task 5 (`AdminTravelerChatPanel.tsx`).

**Why:** `getOwnerMessageStatus` only reads `sender_role`, `created_at`, and `read_at` — never `owner_id`. Its current signature requires `OwnerMessageRow[]`, whose `sender_role` is typed `"owner" | "admin"`. A `TenantMessageRow` (`sender_role: "guest" | "admin"`) is not structurally assignable to that. Widening the parameter type to a minimal structural interface fixes this without renaming the function or breaking existing owner callers.

- [ ] **Step 1: Write the failing test**

Add this test case to the end of the existing `describe("getOwnerMessageStatus", ...)` block in `lib/messages/status.test.ts` (keep all 4 existing tests unchanged, just add this one):

```ts
  it("accepts a tenant message row (sender_role 'guest') without a type error", () => {
    const tenantMessage: TenantMessageRow = {
      id: "t1",
      guest_id: "guest-1",
      booking_id: null,
      subject: "autre",
      content: "test",
      sender_role: "guest",
      sender_id: "guest-1",
      read_at: null,
      created_at: "2026-07-01T10:00:00.000Z",
    };
    expect(getOwnerMessageStatus(tenantMessage, [tenantMessage])).toBe("sent");
  });
```

Add `TenantMessageRow` to the import line at the top of the file:
```ts
import { getOwnerMessageStatus, type OwnerMessageRow, type TenantMessageRow } from "./status";
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/messages/status.test.ts`
Expected: FAIL with a TypeScript error — `TenantMessageRow` is not exported from `./status`, and/or `tenantMessage` is not assignable to the current `getOwnerMessageStatus` parameter type.

- [ ] **Step 3: Widen the implementation**

Replace the full contents of `lib/messages/status.ts` with:

```ts
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

export type TenantMessageRow = {
  id: string;
  guest_id: string;
  booking_id: string | null;
  subject: "probleme" | "sejour" | "reservation" | "autre";
  content: string;
  sender_role: "guest" | "admin";
  sender_id: string;
  read_at: string | null;
  created_at: string;
};

export type MessageStatusInput = {
  sender_role: string;
  read_at: string | null;
  created_at: string;
};

export type OwnerMessageStatus = "sent" | "read" | "replied";

export function getOwnerMessageStatus(
  message: MessageStatusInput,
  thread: MessageStatusInput[]
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

- [ ] **Step 4: Run tests to verify all 5 pass**

Run: `npx vitest run lib/messages/status.test.ts`
Expected: PASS (5 tests — the original 4 plus the new tenant case).

- [ ] **Step 5: Commit**

```bash
git add lib/messages/status.ts lib/messages/status.test.ts
git commit -m "feat: widen message status logic to accept tenant message rows"
```

---

### Task 3: Tenant-side thread UI — `TenantTeamThread.tsx`

**Files:**
- Create: `components/espace-client/TenantTeamThread.tsx`

**Interfaces:**
- Consumes: `getOwnerMessageStatus`, `type TenantMessageRow` from `@/lib/messages/status` (Task 2); `getSupabaseBrowser` from `@/lib/supabase`.
- Produces: `TenantTeamThread({ guestId, firstName, villaName }: { guestId: string; firstName: string; villaName: string | null })` — consumed by Task 4.

- [ ] **Step 1: Write the component**

```tsx
// components/espace-client/TenantTeamThread.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase";
import { Send, Phone } from "lucide-react";
import { getOwnerMessageStatus, type TenantMessageRow } from "@/lib/messages/status";

const SUBJECTS = [
  { value: "probleme", label: "Signaler un problème" },
  { value: "sejour", label: "Mon séjour" },
  { value: "reservation", label: "Ma réservation" },
  { value: "autre", label: "Autre" },
] as const;

type Subject = (typeof SUBJECTS)[number]["value"];

const STATUS_BADGE: Record<string, string> = {
  sent: "🟡 Envoyé",
  read: "🟢 Lu par l'équipe",
  replied: "✅ Répondu",
};

interface Props {
  guestId: string;
  firstName: string;
  villaName: string | null;
}

export function TenantTeamThread({ guestId, firstName, villaName }: Props) {
  const supabase = getSupabaseBrowser();
  const [messages, setMessages] = useState<TenantMessageRow[]>([]);
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
        .from("tenant_messages")
        .select("*")
        .eq("guest_id", guestId)
        .order("created_at", { ascending: true });
      setMessages((data ?? []) as TenantMessageRow[]);
      setLoading(false);

      await supabase
        .from("tenant_messages")
        .update({ read_at: new Date().toISOString() })
        .eq("guest_id", guestId)
        .eq("sender_role", "admin")
        .is("read_at", null);
    })();
  }, [supabase, guestId]);

  useEffect(() => {
    if (!supabase) return;
    const channel = supabase
      .channel("tenant-messages-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "tenant_messages" },
        (payload: any) => {
          const row = payload.new as TenantMessageRow;
          if (row.guest_id !== guestId) return;
          setMessages((prev) => (prev.some((m) => m.id === row.id) ? prev : [...prev, row]));
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "tenant_messages" },
        (payload: any) => {
          const row = payload.new as TenantMessageRow;
          if (row.guest_id !== guestId) return;
          setMessages((prev) => prev.map((m) => (m.id === row.id ? row : m)));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, guestId]);

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
      .from("tenant_messages")
      .insert({
        guest_id: guestId,
        sender_id: guestId,
        sender_role: "guest",
        subject,
        content: content.trim(),
      })
      .select()
      .single();

    if (!error && data) {
      setMessages((prev) => [...prev, data as TenantMessageRow]);
      setContent("");
    }
    setSending(false);
  };

  const messagesWithStatus = useMemo(
    () =>
      messages.map((m) => ({
        ...m,
        status: m.sender_role === "guest" ? getOwnerMessageStatus(m, messages) : null,
      })),
    [messages]
  );

  if (loading) {
    return (
      <div className="border border-navy/8 bg-white p-8 text-center">
        <p className="text-sm text-navy/50">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="border border-navy/8 bg-white p-6 space-y-3">
        <p className="font-display text-lg text-navy">Bonjour {firstName},</p>
        <p className="text-sm text-navy/70">
          Une question ? Un besoin ? C&apos;est ici que ça se passe.
        </p>
        {villaName && (
          <p className="text-[11px] uppercase tracking-[0.15em] text-navy/40">{villaName}</p>
        )}
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
          onClick={() => handleQuickAction("probleme")}
          className="border border-navy/15 bg-white px-4 py-3 text-sm font-medium text-navy hover:border-gold/50"
        >
          Signaler un problème
        </button>
        <button
          type="button"
          onClick={() => handleQuickAction("sejour")}
          className="border border-navy/15 bg-white px-4 py-3 text-sm font-medium text-navy hover:border-gold/50"
        >
          Mon séjour
        </button>
        <button
          type="button"
          onClick={() => handleQuickAction("autre")}
          className="border border-navy/15 bg-white px-4 py-3 text-sm font-medium text-navy hover:border-gold/50"
        >
          Autre demande
        </button>
      </div>

      <div className="border border-navy/8 bg-white flex flex-col min-h-[calc(100dvh-28rem)]">
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
                className={`flex flex-col ${msg.sender_role === "guest" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[70%] px-4 py-2.5 text-sm ${
                    msg.sender_role === "guest"
                      ? "bg-navy text-white"
                      : `bg-gold/10 text-navy ${msg.read_at === null ? "border-l-2 border-gold" : ""}`
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

        <div className="border-t border-navy/8 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value as Subject)}
              className="border border-navy/15 bg-white px-3 py-2 text-sm text-navy focus:border-gold/50 focus:outline-none"
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
              className="flex-1 border border-navy/15 px-3 py-2 text-sm resize-none focus:outline-none focus:border-gold/50"
            />
            <button
              onClick={handleSend}
              disabled={sending || !content.trim()}
              className="shrink-0 inline-flex items-center justify-center w-10 h-10 bg-navy text-white hover:bg-gold hover:text-navy disabled:opacity-60 transition-colors"
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
Expected: no errors referencing `TenantTeamThread.tsx`.

- [ ] **Step 3: Commit**

```bash
git add components/espace-client/TenantTeamThread.tsx
git commit -m "feat: add TenantTeamThread component for tenant<->admin messaging"
```

---

### Task 4: Rewrite `espace-client/messagerie` page

**Files:**
- Modify: `app/espace-client/messagerie/page.tsx` (full rewrite)

**Interfaces:**
- Consumes: `TenantTeamThread` (Task 3); `getSupabaseServer`, `getCurrentUser` from `@/lib/supabase-server` (existing); `tenantBookingsOrFilter` from `@/lib/booking-tenant` (existing); `PageTopbar` from `@/components/espace-client/PageTopbar` (existing); `TenantSectionHeader` from `@/components/espace-client/TenantSectionHeader` (existing).

**Note:** unlike `DemandesPage`, this page does NOT gate on having an active booking — `booking_id` on `tenant_messages` is nullable/contextual only (a tenant can reach the team even without a currently active stay, matching the owner project's model where the thread is always available). The booking/villa lookup below is best-effort context, not a requirement to render the thread.

- [ ] **Step 1: Rewrite the page as an async Server Component**

```tsx
// app/espace-client/messagerie/page.tsx
import { redirect } from "next/navigation";
import { getSupabaseServer, getCurrentUser } from "@/lib/supabase-server";
import { tenantBookingsOrFilter } from "@/lib/booking-tenant";
import { PageTopbar } from "@/components/espace-client/PageTopbar";
import { TenantSectionHeader } from "@/components/espace-client/TenantSectionHeader";
import { TenantTeamThread } from "@/components/espace-client/TenantTeamThread";

export const dynamic = "force-dynamic";

export default async function MessageriePage() {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await getCurrentUser();
  if (!user) redirect("/login?redirect=/espace-client/messagerie");

  const [{ data: profile }, { data: bookingRows }] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
    supabase
      .from("bookings")
      .select("id, villa_id")
      .or(tenantBookingsOrFilter(user.id, user.email))
      .in("status", ["confirmed", "pending"])
      .gt("end_date", new Date().toISOString())
      .order("start_date", { ascending: true })
      .limit(1),
  ]);

  const firstName = profile?.full_name?.split(" ")[0] ?? "";
  const booking = bookingRows?.[0] ?? null;

  let villaName: string | null = null;
  if (booking?.villa_id) {
    const { data: villa } = await supabase
      .from("villas")
      .select("name")
      .eq("id", booking.villa_id)
      .maybeSingle();
    villaName = villa?.name ?? null;
  }

  return (
    <>
      <PageTopbar title="Notre équipe" section="Espace Client" />
      <div className="mx-auto max-w-2xl space-y-8">
        <TenantSectionHeader
          eyebrow="NOTRE ÉQUIPE"
          title="Notre équipe"
          description="Une question, un besoin pendant votre séjour ? Écrivez-nous, on vous répond sous 24h."
        />
        <TenantTeamThread guestId={user.id} firstName={firstName} villaName={villaName} />
      </div>
    </>
  );
}
```

- [ ] **Step 2: Verify types compile**

Run: `npx tsc --noEmit`
Expected: no errors referencing `app/espace-client/messagerie/page.tsx`.

- [ ] **Step 3: Verify the unaffected existing test still passes**

Run: `npx playwright test tests/espace-client/chat.spec.ts --project=mocked` (or, since this file isn't wired into any `playwright.config.ts` project's `testMatch` — a pre-existing gap noted in the owner-messages project — run it directly: `npx playwright test tests/espace-client/chat.spec.ts` with a local dev server running).
Expected: the 4 existing tests in this file still pass — they check HTTP status codes on `/espace-client/messagerie` and `/api/chat/tenant` directly, not the rendered chatbot UI, so this rewrite does not affect them.

- [ ] **Step 4: Commit**

```bash
git add app/espace-client/messagerie/page.tsx
git commit -m "feat: replace tenant chatbot page with Notre équipe human thread"
```

---

### Task 5: Rewrite `AdminTravelerChatPanel.tsx` to read `tenant_messages`

**Files:**
- Modify: `components/dashboard/admin/AdminTravelerChatPanel.tsx` (full rewrite of internals; same filename, same export name, same "Locataires" tab wiring in `app/(admin)/admin/messages/page.tsx` — no changes needed there)

**Interfaces:**
- Consumes: `type TenantMessageRow` from `@/lib/messages/status` (Task 2).
- Produces: `AdminTravelerChatPanel()` — a self-contained component with no props (unchanged signature, so `app/(admin)/admin/messages/page.tsx` needs no edits).

- [ ] **Step 1: Rewrite the component**

```tsx
// components/dashboard/admin/AdminTravelerChatPanel.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase";
import { Send, MessageCircle } from "lucide-react";
import { KayvilaEmptyState } from "@/components/ui/pro";
import { timeAgo } from "@/lib/utils";
import type { TenantMessageRow } from "@/lib/messages/status";

type Profile = { id: string; full_name: string | null; email: string | null };

const SUBJECT_LABELS: Record<string, string> = {
  probleme: "Signaler un problème",
  sejour: "Mon séjour",
  reservation: "Ma réservation",
  autre: "Autre",
};

export function AdminTravelerChatPanel() {
  const supabase = getSupabaseBrowser();
  const [messages, setMessages] = useState<TenantMessageRow[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [villaNames, setVillaNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [activeGuestId, setActiveGuestId] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [adminUserId, setAdminUserId] = useState<string | null>(null);

  const fetchAll = async () => {
    if (!supabase) return;
    const { data } = await supabase
      .from("tenant_messages")
      .select("*")
      .order("created_at", { ascending: true });
    const rows = (data ?? []) as TenantMessageRow[];
    setMessages(rows);

    const guestIds = [...new Set(rows.map((r) => r.guest_id))];
    if (guestIds.length > 0) {
      const { data: profileRows } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", guestIds);
      const map: Record<string, Profile> = {};
      (profileRows ?? []).forEach((p: any) => {
        map[p.id] = p as Profile;
      });
      setProfiles(map);
    }

    const bookingIds = [...new Set(rows.map((r) => r.booking_id).filter(Boolean))] as string[];
    if (bookingIds.length > 0) {
      const { data: bookingRows } = await supabase
        .from("bookings")
        .select("id, villa_id")
        .in("id", bookingIds);
      const villaIds = [...new Set((bookingRows ?? []).map((b: any) => b.villa_id).filter(Boolean))];
      if (villaIds.length > 0) {
        const { data: villaRows } = await supabase.from("villas").select("id, name").in("id", villaIds);
        const villaNameById: Record<string, string> = {};
        (villaRows ?? []).forEach((v: any) => {
          villaNameById[v.id] = v.name;
        });
        const nameByBooking: Record<string, string> = {};
        (bookingRows ?? []).forEach((b: any) => {
          if (b.villa_id && villaNameById[b.villa_id]) nameByBooking[b.id] = villaNameById[b.villa_id];
        });
        setVillaNames(nameByBooking);
      }
    }

    setLoading(false);
  };

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }: { data: { user: { id: string } | null } }) =>
      setAdminUserId(data.user?.id ?? null)
    );
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  useEffect(() => {
    if (!supabase) return;
    const channel = supabase
      .channel("admin-tenant-messages-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "tenant_messages" }, fetchAll)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "tenant_messages" }, fetchAll)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  const conversations = useMemo(() => {
    const map = new Map<string, TenantMessageRow[]>();
    for (const m of messages) {
      const list = map.get(m.guest_id) ?? [];
      list.push(m);
      map.set(m.guest_id, list);
    }
    return [...map.entries()].sort(
      (a, b) =>
        new Date(b[1][b[1].length - 1]?.created_at ?? 0).getTime() -
        new Date(a[1][a[1].length - 1]?.created_at ?? 0).getTime()
    );
  }, [messages]);

  useEffect(() => {
    if (!activeGuestId && conversations.length > 0) {
      setActiveGuestId(conversations[0][0]);
    }
  }, [conversations, activeGuestId]);

  const thread = activeGuestId ? conversations.find(([id]) => id === activeGuestId)?.[1] ?? [] : [];

  useEffect(() => {
    if (!supabase || !activeGuestId) return;
    const hasUnread = thread.some((m) => m.sender_role === "guest" && m.read_at === null);
    if (!hasUnread) return;
    supabase
      .from("tenant_messages")
      .update({ read_at: new Date().toISOString() })
      .eq("guest_id", activeGuestId)
      .eq("sender_role", "guest")
      .is("read_at", null)
      .then(() => fetchAll());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeGuestId]);

  const handleSend = async () => {
    if (!supabase || !reply.trim() || !activeGuestId || !adminUserId) return;
    setSending(true);
    const lastGuestSubject =
      [...thread].reverse().find((m) => m.sender_role === "guest")?.subject ?? "autre";
    const { error } = await supabase.from("tenant_messages").insert({
      guest_id: activeGuestId,
      sender_id: adminUserId,
      sender_role: "admin",
      subject: lastGuestSubject,
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
        description="Les messages des locataires apparaîtront ici."
      />
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      <aside className="border border-navy/10 bg-white divide-y divide-navy/5 max-h-[60vh] overflow-y-auto">
        {conversations.map(([guestId, rows]) => {
          const last = rows[rows.length - 1];
          const profile = profiles[guestId];
          const villaName = last.booking_id ? villaNames[last.booking_id] : null;
          const hasUnread = rows.some((m) => m.sender_role === "guest" && m.read_at === null);
          return (
            <button
              key={guestId}
              type="button"
              onClick={() => setActiveGuestId(guestId)}
              className={`w-full text-left px-4 py-3 text-sm hover:bg-navy/[0.02] ${
                activeGuestId === guestId ? "bg-gold/5" : ""
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium text-navy truncate">
                  {profile?.full_name ?? profile?.email ?? "Locataire"}
                </p>
                {hasUnread && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />}
              </div>
              {villaName && <p className="text-[10px] text-navy/40 truncate">{villaName}</p>}
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
            placeholder="Répondre au locataire…"
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
Expected: no errors referencing `AdminTravelerChatPanel.tsx`.

- [ ] **Step 3: Verify no remaining reference to the old chat-log API in this file**

Run: `grep -n "/api/admin/messages" components/dashboard/admin/AdminTravelerChatPanel.tsx`
Expected: no results (the old fetch call is fully replaced).

- [ ] **Step 4: Commit**

```bash
git add components/dashboard/admin/AdminTravelerChatPanel.tsx
git commit -m "feat: repoint admin Locataires tab to tenant_messages instead of chatbot logs"
```

---

### Task 6: Playwright E2E coverage

The absolute-rule RLS guarantee ("no relation locataire ↔ propriétaire") is verified at the SQL/policy level in Task 1, Step 4 — a real Postgres RLS simulation, not a UI-level check. There is no reliable, non-fragile way to re-verify raw RLS access from a Playwright browser test without extracting session tokens from `@supabase/ssr`'s cookie storage (undocumented format, no existing precedent in this repo, real risk of a test that looks like it verifies something but doesn't). This plan does not include a UI-level RLS test for that reason — Task 1's SQL proof is the actual guarantee.

**Files:**
- Create: `tests/e2e/tenant-team-messages.spec.ts`

- [ ] **Step 1: Write the E2E test**

```ts
// tests/e2e/tenant-team-messages.spec.ts
import { test, expect, type Page } from "@playwright/test";

const TENANT_EMAIL = process.env.TEST_TENANT_EMAIL || "voyageur@test.com";
const TENANT_PASSWORD = process.env.TEST_TENANT_PASSWORD || "Test123456!";
const ADMIN_EMAIL = process.env.ADMIN_E2E_EMAIL || "admin@diamantnoir.com";
const ADMIN_PASSWORD = process.env.ADMIN_E2E_PASSWORD || "Admin123!";

async function loginAs(page: Page, email: string, password: string): Promise<void> {
  await page.goto("/login");
  await page.waitForLoadState("networkidle");
  await page.getByPlaceholder("vous@exemple.com").fill(email);
  await page.getByPlaceholder("••••••••").first().fill(password);
  await page.getByRole("button", { name: /accéder|connexion|se connecter/i }).first().click();
  await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 15_000 });
}

test.describe("Notre équipe locataire / admin Locataires", () => {
  test.skip(!!process.env.PLAYWRIGHT_SKIP_DB_TESTS, "Needs local Supabase");

  test("quick action pre-fills the subject selector", async ({ page }) => {
    await loginAs(page, TENANT_EMAIL, TENANT_PASSWORD);
    await page.goto("/espace-client/messagerie");
    await page.waitForLoadState("networkidle");

    await page.getByRole("button", { name: "Mon séjour" }).click();
    const subjectSelect = page.locator("select").first();
    await expect(subjectSelect).toHaveValue("sejour");
  });

  test("tenant sends a message and it appears in the admin Locataires tab", async ({
    page,
    browser,
  }) => {
    const messageText = `Test E2E locataire ${Date.now()}`;

    await loginAs(page, TENANT_EMAIL, TENANT_PASSWORD);
    await page.goto("/espace-client/messagerie");
    await page.waitForLoadState("networkidle");
    await page.locator("textarea").fill(messageText);
    await page.locator("button:has(svg)").last().click();
    await expect(page.getByText(messageText)).toBeVisible({ timeout: 10_000 });

    const adminContext = await browser.newContext();
    const adminPage = await adminContext.newPage();
    await adminPage.goto("/login?redirect=/admin/messages");
    await adminPage.locator("#email-pass").fill(ADMIN_EMAIL);
    await adminPage.locator("#password-pass").fill(ADMIN_PASSWORD);
    await adminPage.getByRole("button", { name: /accéder/i }).click();
    await adminPage.waitForURL("**/admin/messages", { timeout: 15_000 });
    await adminPage.getByRole("tab", { name: "Locataires" }).click();
    await expect(adminPage.getByText(messageText)).toBeVisible({ timeout: 10_000 });
    await adminContext.close();
  });
});
```

- [ ] **Step 2: Run the new spec**

Run: `npx playwright test tests/e2e/tenant-team-messages.spec.ts` (not wired into a named `playwright.config.ts` project — same pre-existing gap as `owner-team-messages.spec.ts` and `proprio-fixes.spec.ts`, run via explicit path).
Expected: PASS if seeded test accounts and a running dev server are available in the environment; otherwise document the specific failure reason (missing accounts vs. an actual selector/logic bug) rather than assuming success.

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/tenant-team-messages.spec.ts
git commit -m "test: E2E coverage for tenant<->admin messaging (incl. absolute-rule RLS check)"
```

---

### Task 7: Final verification

- [ ] **Step 1: Full build**

Run: `npm run build`
Expected: succeeds with no type errors; route table shows `app/espace-client/messagerie` still present and rendering the new Server Component.

- [ ] **Step 2: Full Vitest suite**

Run: `npx vitest run`
Expected: all tests pass, including the widened `lib/messages/status.test.ts` (5 tests).

- [ ] **Step 3: Confirm the absolute rule holds and no dangling references**

Run:
```bash
grep -rn "tenant_messages" --include="*.tsx" --include="*.ts" . | grep -v node_modules | grep -v .worktrees
grep -rn "owner_id" lib/messages/status.ts components/espace-client/TenantTeamThread.tsx components/dashboard/admin/AdminTravelerChatPanel.tsx 2>/dev/null
```
Expected: the first command shows `tenant_messages` used only in the 3 files touched by Tasks 3-5 (plus the migration and test files) — never in any owner-facing file (`components/dashboard/proprio/*`, `app/(proprio)/*`). The second command returns no results (confirms no accidental owner-identity leakage into the tenant-messaging code path).

- [ ] **Step 4: Manual smoke test (dev server)**

Run: `npm run dev`, then in a browser:
- `/espace-client/messagerie` as a tenant: confirm the page shows "Notre équipe" (not the old chatbot), welcome card, quick actions, empty-state thread; sending a message works; character counter updates.
- `/admin/messages` as admin, "Locataires" tab: confirm it now shows the new human thread (not chatbot session logs), with villa name shown when available, reply works.
- Confirm no UI anywhere shows a propriétaire's identity or contact info inside a locataire conversation, or vice versa.

- [ ] **Step 5: Commit (only if smoke-test fixes were needed)**

If Step 4 revealed any fix, commit it separately with a descriptive message. If nothing needed fixing, no commit is required for this task.
