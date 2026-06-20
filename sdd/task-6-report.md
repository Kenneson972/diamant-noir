# Task 6 Report: Split page.tsx -- Server wrapper + DashboardPageClient + inject chat

## Summary

Split `app/(proprio)/dashboard/page.tsx` into a Server Component wrapper (`ProprioDashboardPage`) and a Client Component (`DashboardPageClient`) with the copilot chat embedded inline.

## Changes Made

### File: `app/(proprio)/dashboard/page.tsx`

1. **Added import** for `DashboardCopilotChat` from `@/components/dashboard/DashboardCopilotChat`
2. **Added import** for `BookingStatus` from `@/types/domain` (needed for prop type compatibility)
3. **Created `DashboardPageClient`** -- a `"use client"` component defined before the server function:
   - Receives all pre-computed data as serializable props (no callbacks/functions)
   - Props interface matches exactly what the server passes: `villas`, `villaIds`, `user`, `isStripeConnected`, `connectDone`, `kpiItems`, `todayEventsList`, `alerts`, `upcomingBookings`, `monthlyChartData`, `hasEnoughHistory`
   - Renders the full dashboard layout including ProactiveNotification, StripeConnectButton, KpiRow, DashboardCopilotChat, TodayTimeline, AlertsWidget, RevenueChart, UpcomingBookings
4. **Replaced return block** in `ProprioDashboardPage` with `<DashboardPageClient ... />`

### Props Type Adjustments

- `alerts` type: `severity` constrained to `"high" | "medium" | "low"`, no `id`/`created_at` required (server doesn't pass them)
- `upcomingBookings` type: `status` uses `BookingStatus` union type, no `total_price_cents` required (server query omits it)

### Key Design Decisions

- All interactive logic stays in `DashboardPageClient` (client component)
- Server component retains all data fetching logic unchanged
- `"use client"` directive is scoped to `DashboardPageClient` only, not at file top level

## Verification

- `npx tsc --noEmit`: 0 new errors (only pre-existing `tests/a11y.spec.ts` errors)
- Function signatures match component expectations (`TodayTimeline`, `AlertsWidget`, `UpcomingBookings`, `RevenueChart`, `KpiRow`, `StripeConnectButton`, `ProactiveNotification`)
