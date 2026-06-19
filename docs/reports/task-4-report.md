# Task 4 Report — DocumentsTable + Admin Page

**Status:** Completed

## Files Created

- `components/dashboard/admin/DocumentsTable.tsx` — Client component
  - `Doc` type exported for consumer use
  - Tag filter chips (facture, reporting, contrat, autre), multi-select
  - Text search filtering on `name` + `owner.name`
  - Download opens `file_url` in new tab
  - Delete calls `DELETE /api/admin/documents` then removes from local state
  - Error feedback on delete failure
  - Empty state with icon and CTA text
  - Gold/navy palette, text >=11px, lucide-react icons

- `app/(admin)/admin/documents/page.tsx` — Server component
  - Fetches documents with `profiles!documents_owner_id_fkey(full_name)` join
  - Fetches owners where `role = 'owner'`
  - Maps to `Doc[]` for DocumentsTable
  - Uses `supabaseAdmin()` (service_role) matching existing admin page pattern
  - Uses `full_name` (actual schema column, not `name` as in brief template)
  - Renders UploadDocumentForm + DocumentsTable
  - `dynamic = "force-dynamic"`

## Deviations from Brief

- Used `supabaseAdmin()` instead of `getSupabaseServer()` to match existing admin pages (see `app/(admin)/admin/page.tsx`)
- Used `full_name` instead of `name` to match actual profiles schema column
- Added error handling on delete (alerts on API error)
- All changes are consistent with the project's established patterns

## Build

- `npm run build` passes, zero errors
- `/admin/documents` renders at 3.75 kB (dynamic)

## Commit

`feat(documents): admin page + DocumentsTable with filters` — 2 files, 233 insertions

## Concerns

None.
