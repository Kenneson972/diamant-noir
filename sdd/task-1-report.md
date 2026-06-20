# Task 1 Report — Migration SQL: `villa_changes` + `admin_action_log`

## What was done

**File created:** `supabase/migrations/20260620_admin_copilot_phase1.sql`

**Content summary:** PostgreSQL migration that creates two core audit/tracking tables and a PL/pgSQL trigger:

### 1. `public.villa_changes` table
- Tracks all changes to tracked villa fields: `price_per_night`, `name`, `is_published`
- Columns: `id` (UUID PK), `villa_id` (FK to villas), `owner_id` (UUID), `field` (text), `old_value` (text), `new_value` (text), `changed_at` (timestamptz)
- Index on `changed_at desc` for fast recent-change queries
- RLS enabled with permissive service policy (`villa_changes_service_all`)

### 2. `public.log_villa_change()` trigger function
- PL/pgSQL function (SECURITY DEFINER) that executes after UPDATE on `villas`
- Logs changes for three fields:
  - `price_per_night` → numeric → text cast
  - `name` → text
  - `is_published` → boolean → text cast
- Uses `IS DISTINCT FROM` operator to detect actual changes (ignores no-op updates)
- Inserts one row per changed field into `villa_changes` with old/new values

### 3. `trg_log_villa_change` trigger
- Attaches `log_villa_change()` to `villas` table for each UPDATE row
- Safe recreation: `DROP TRIGGER IF EXISTS` ensures idempotency

### 4. `public.admin_action_log` table
- Audit log for admin/copilot action history
- Columns: `id` (UUID PK), `admin_id` (UUID, not null), `action` (text, not null), `action_data` (jsonb, default {}), `result` (jsonb, default {}), `created_at` (timestamptz)
- Index on `created_at desc` for fast recent-action queries
- RLS enabled with permissive service policy (`admin_action_log_service_all`)

## Status

✅ **Step 1 (Write migration):** COMPLETE  
⏳ **Step 2 (Apply via Supabase SQL Editor):** DEFERRED to controller  
⏳ **Step 3 (Verify trigger):** DEFERRED to controller  
✅ **Step 4 (Commit):** COMPLETE

Per instructions, Steps 2 & 3 (database apply + verification) are deferred to the controller who has Supabase SQL Editor access. The migration file is ready for application.

## Commit

```
f3cfba3 feat(db): villa_changes trigger + admin_action_log (admin copilot phase1)
```

Full commit message:
```
feat(db): villa_changes trigger + admin_action_log (admin copilot phase1)

Co-Authored-By: claude-flow <ruv@ruv.net>
```

## Notes

- Migration is idempotent: `CREATE TABLE IF NOT EXISTS`, `CREATE OR REPLACE FUNCTION`, and `DROP TRIGGER IF EXISTS` ensure safe re-runs
- RLS policies permit all operations (service/admin context only)
- No foreign key constraints on `admin_id` in `admin_action_log` (intentional design — allows logging actions by users who may have been deleted)
- Trigger casts numeric/boolean to text for consistent `old_value`/`new_value` storage
