# Security Hardening — Kayvilla (Diamant Noir)

**Date**: 2026-05-28
**Type**: Security hardening — RLS + API auth
**Priority**: Critical (P1 DB) / High (P2-P3 API)

## Summary

Fix 12 security vulnerabilities across the Supabase RLS layer and Next.js API routes. Current state allows anonymous writes to the villas table, unauthenticated admin API access, and a recursive RLS policy on profiles causing 500 errors.

## Current State

- `getUserFromRequest()` exists only locally in `app/api/dashboard/owner-assistant/route.ts` — needs extraction to a shared lib
- All API routes use `supabaseAdmin()` (service_role key) — bypassing RLS entirely. Auth must happen in the route handler.
- Middleware lists most API routes as `publicPaths` — protection is the route handler's responsibility.
- `profiles` RLS policy "admin read all" self-references the profiles table causing infinite recursion.
- `villas` table has zero RLS policies.
- `stripe/connect-verify` and `stripe/connect-onboarding` read `ownerId` from the request body — trivial to impersonate.

## Design

### Phase 1 — Shared Auth Helper (`lib/auth/server.ts`)

Extract `getUserFromRequest()` and add guard helpers:

```typescript
export async function getUserFromRequest(request: Request): Promise<{ user: { id: string } | null }>
export async function requireAuth(request: Request): Promise<{ userId: string }>
export async function requireAdmin(request: Request): Promise<{ userId: string }>
```

`requireAuth` and `requireAdmin` throw on failure — caught by the route handler and returned as 401/403.

### Phase 2 — RLS SQL Migration

Single migration file: `supabase/migrations/20260528_security_hardening.sql`

#### 2a. Fix `profiles` recursion

Replace the self-referencing subquery with `auth.jwt()`:

```sql
-- BEFORE (recursive):
create policy "admin read all" on profiles
  for select using (exists (
    select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'
  ));

-- AFTER:
create policy "admin read all" on profiles
  for select using (auth.jwt() ->> 'role' = 'admin');
```

#### 2b. Add RLS to `villas`

Three policies:

| Policy | Operation | Condition |
|--------|-----------|-----------|
| `villas_select_public` | SELECT | `is_published = true` — returns only safe columns (see column masking) |
| `villas_select_owner_admin` | SELECT | `owner_id = auth.uid()` OR `auth.jwt() ->> 'role' = 'admin'` — all columns |
| `villas_insert_update_delete_owner` | INSERT/UPDATE/DELETE | `owner_id = auth.uid()` OR `auth.jwt() ->> 'role' = 'admin'` |

**Column-level security**: Public SELECT should not expose `wifi_password`, `access_token`, `ical_url`, `commission_rate`. Use a security definer function or enforce via API layer (recommended: API layer since all client reads go through API routes using service_role).

#### 2c. Storage `villa-images` policy

```sql
CREATE POLICY "owner_admin_insert" ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'villa-images'
    AND (auth.uid() IS NOT NULL)
    AND (
      auth.jwt() ->> 'role' = 'admin'
      OR owner_id = auth.uid()
    )
  );
```

#### 2d. Storage `villa-submissions` policy

```sql
CREATE POLICY "owner_admin_insert" ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'villa-submissions'
    AND (auth.uid() IS NOT NULL)
    -- submissions can be created pre-auth, so allow authenticated
  );
```

### Phase 3 — API Route Guards

Each route gets an auth guard as its first meaningful line:

| # | Route | Guard | Additional check |
|---|-------|-------|-----------------|
| 7 | `admin/owners` GET | `requireAdmin` | — |
| 8 | `stripe/connect-verify` POST | `requireAuth` | `ownerId` from session, not body |
| 9 | `stripe/connect-onboarding` POST | `requireAuth` | `ownerId` from session, not body |
| 10 | `reviews` POST | `requireAuth` | Verify booking belongs to caller |
| 11 | `villa-photo-upload` POST | `requireAuth` | Verify caller owns the villa |
| 12 | `sync` GET | `requireAdmin` or API key | Check `CRON_API_KEY` header/env |
| 12b | `sync-ota` POST | `requireAuth` | Verify caller owns the villa |
| 13 | `analytics/villa` POST | `requireAuth` or API key | Verify `villa_id` belongs to caller |
| 14 | `villa-submissions/confirm` POST | `requireAdmin` | — |
| 15 | `villa-submissions` GET | `requireAdmin` | Already has partial auth, add admin role check |
| 16 | `villa-submissions` PATCH | `requireAdmin` | Already has partial auth, add admin role check |

### Invariants

- **Never read `owner_id` or `price` from the request body.** Always from `auth.uid()` (session).
- `.env.local` is never committed.
- All RLS changes tested with `curl` using the anon key before marking complete.
- `supabaseAdmin()` remains for DB operations — auth is verified before reaching DB calls.
- Sensitive villas fields are masked at the API layer (columns excluded from public SELECT responses).

## API Key Mechanism

For cron/webhook routes (`sync`, `analytics/villa`), use a shared secret approach:

```
Authorization: Bearer <CRON_API_KEY>
```

The route checks: is the caller an authenticated admin **OR** does the Bearer token match `process.env.CRON_API_KEY`.

## Testing Strategy

Each fix tested with:

1. **RLS**: `curl` with anon key — verify 401/403 on restricted operations
2. **API routes**: `curl` without auth → 401, with non-admin auth → 403, with admin auth → 200
3. **Existing tests**: `npm test` after all changes — verify no regressions

## Risk Assessment

- **Low risk**: All changes are additive (adding auth guards) or fix existing broken behavior (profiles recursion).
- **No UI changes**: Pure backend hardening.
- **Rollback**: Each migration is a standalone SQL file; API changes are per-route and independently revertible.
