# Session 2026-05-01 (fix auth SSR + Recharts)

## Résumé
Correction du login (session non reconnue par le middleware) + pages blanches revenus/réservations/statistiques.

## Correctifs auth/login

### Problème
Le login fonctionnait (création de session côté client) mais le middleware (`middleware.ts`) ne reconnaissait jamais la session après redirection vers `/dashboard`. Le middleware redirigeait donc vers `/login` en boucle.

### Cause racine
`lib/supabase.ts` utilisait `createClient` de `@supabase/supabase-js` côté navigateur au lieu de `createBrowserClient` de `@supabase/ssr`. Sans `createBrowserClient`, la session n'était pas stockée correctement dans les cookies du navigateur après `signInWithPassword`. Le middleware (qui lit les cookies via `createServerClient`) ne trouvait donc jamais de session.

### Correctifs appliqués

1. **`lib/supabase.ts`** — `createBrowserClient` de `@supabase/ssr` remplace `createClient` de `@supabase/supabase-js`
2. **`lib/supabase-server.ts`** — `createServerClient` de `@supabase/ssr` avec `getAll()`/`setAll()` et cookies asynchrones (`await cookies()`)
3. **`middleware.ts`** — API `getAll()`/`setAll()` avec reconstruction de la `response` dans `setAll` pour transmission correcte des cookies
4. **`app/auth/callback/route.ts`** — migration vers `createServerClient` pour persister la session après `exchangeCodeForSession`
5. **~25 fichiers de pages/layouts** — ajout de `await` devant `getSupabaseServer()` (devenu async)

## Correctifs pages blanches

### Problème
- `/dashboard/revenus` : page 200 mais rendu blanc (erreur Recharts silencieuse)
- `/dashboard/reservations` : 404 (pas de page index, route paramétrée `[villaId]`)
- `/dashboard/statistiques` : 404 (pas de page index, route paramétrée `[villaId]`)

### Correctifs

1. **`RevenueChart.tsx`** — Refonte du dynamic import Recharts : un seul `dynamic()` wrappant tout le composant (plus 6 imports séparés qui cassaient l'hydratation)
2. **`app/(proprio)/dashboard/reservations/page.tsx`** — Création page index listant les villas du proprio avec aperçu des résas à venir
3. **`app/(proprio)/dashboard/statistiques/page.tsx`** — Création page index listant les villas du proprio pour sélection

## Correctifs TypeScript
- `NotificationBell.tsx` : typage `payload: any`
- `SupabaseDebug.tsx` : typage `{ count, error }`
- `Navbar.tsx` : typage `_event: string`, `session: any`
- `AuthContext.tsx` : typage `_event: string`, `session: any`
- `WishlistContext.tsx` : typage `session: any`, `Set<string>`

## Fichiers modifiés
- `lib/supabase.ts`
- `lib/supabase-server.ts`
- `middleware.ts`
- `app/auth/callback/route.ts`
- `components/dashboard/proprio/RevenueChart.tsx`
- `components/dashboard/NotificationBell.tsx`
- `components/debug/SupabaseDebug.tsx`
- `components/layout/Navbar.tsx`
- `contexts/AuthContext.tsx`
- `contexts/WishlistContext.tsx`
- `app/(proprio)/dashboard/reservations/page.tsx` (créé)
- `app/(proprio)/dashboard/statistiques/page.tsx` (créé)
- + ~25 fichiers avec `await getSupabaseServer()`

## Build
✅ `npm run build` OK (0 erreurs)
✅ Login fonctionnel
