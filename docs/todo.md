# Plan de travail — Correctifs techniques Kayvila

> Suite à l'audit technique du 2026-05-01. Score global : 5.2/10.
> Objectif : passer à 8+/10 en 8 lots séquentiels.

---

## LOT 1 — Types Supabase + typage fort (P0)

**Objectif :** Éliminer les `any`, sécuriser les appels DB, générer les types Supabase.

### Étapes

1. Générer `diamant-noir/types/supabase.ts` avec `supabase gen types`
2. Typer `getSupabaseBrowser()` et `getSupabaseServer()` avec `<Database>`
3. Créer `diamant-noir/types/domain.ts` avec les types business étendus
4. Remplacer `any` dans :
   - `app/dashboard/proprio/[villaId]/page.tsx` (villa, bookings, tasks)
   - Tous les composants dashboard
5. Ajouter un barrel export dans `types/index.ts`

### Fichiers impactés

- `lib/supabase.ts`
- `lib/supabase-server.ts`
- `types/index.ts` → `types/domain.ts`
- `types/supabase.ts` (nouveau)
- `app/dashboard/proprio/[villaId]/page.tsx`
- `components/dashboard/*.tsx`

---

## LOT 2 — Sécurité : middleware, auth, CSP (P0)

**Objectif :** Protéger les routes, ajouter CSP, sécuriser les API.

### Étapes

1. Créer `middleware.ts` :
   - Auth guard pour `/dashboard/*`, `/espace-client/*`
   - Redirect vers `/login` si pas de session
   - Ajouter CSP headers
2. Ajouter CSP dans `next.config.mjs` (script-src, style-src, img-src, connect-src)
3. Sécuriser 13 routes API sans auth :
   - Routes sensibles : ajout d'un `API_SECRET_TOKEN` partagé
   - Routes internes : vérification `x-api-key` header
4. Ajouter rate limiting sur `/api/booking` (in-memory bucket)
5. Ajouter vérification CSRF sur routes mutation

### Fichiers impactés

- `middleware.ts` (nouveau)
- `next.config.mjs`
- `app/api/booking/route.ts`
- `app/api/import-airbnb/route.ts`
- `app/api/sync-ota/route.ts`
- `app/api/send-booking-confirmation/route.ts`
- `app/api/notify-admin-booking/route.ts`
- `app/api/contact/route.ts`
- `app/api/villa-photo-upload/route.ts`
- `app/api/analytics/villa/route.ts`

---

## LOT 3 — Idempotence Stripe + validation Zod booking (P1)

**Objectif :** Sécuriser le tunnel de paiement, éviter les doubles confirmations.

### Étapes

1. Migration SQL : table `stripe_events_processed` + `order_status_history`
2. Ajouter idempotence dans `app/api/webhooks/stripe/route.ts`
3. Ajouter validation Zod sur `app/api/booking/route.ts`
4. Ajouter vérification des conflits de dates avant création booking
5. Ajouter gestion des dates expirées dans le webhook

### Fichiers impactés

- `supabase/migrations/20260501_stripe_idempotence.sql` (nouveau)
- `app/api/webhooks/stripe/route.ts`
- `app/api/booking/route.ts`

---

## LOT 4 — Découpage dashboard villa (P0)

**Objectif :** Diviser le fichier de ~2100 lignes en composants typés et maintenables.

### Étapes

1. Extraire le formulaire villa → `components/dashboard/villa-editor/VillaForm.tsx`
2. Extraire la gestion d'images → `components/dashboard/villa-editor/VillaImageManager.tsx`
3. Extraire le calendrier + réservations (déjà partiellement existant)
4. Extraire la section amenities → `components/dashboard/villa-editor/VillaAmenitiesEditor.tsx`
5. Extraire la section maintenance → `components/dashboard/villa-editor/VillaMaintenance.tsx`
6. Extraire la section paramètres avancés (iCal, pricing saisonnier, OTA)
7. Typer chaque composant extrait avec des types concrets
8. Le composant principal devient un orchestrateur léger

### Fichiers impactés

- `app/dashboard/proprio/[villaId]/page.tsx` (découpage)
- `components/dashboard/villa-editor/VillaForm.tsx` (nouveau)
- `components/dashboard/villa-editor/VillaImageManager.tsx` (nouveau)
- `components/dashboard/villa-editor/VillaAmenitiesEditor.tsx` (nouveau)
- `components/dashboard/villa-editor/VillaMaintenance.tsx` (nouveau)

---

## LOT 5 — Middleware + AuthContext + RLS audit (P1)

**Objectif :** Auth centralisée côté serveur + client.

### Étapes

1. Créer `contexts/AuthContext.tsx` avec Provider racine
2. Mettre à jour `app/layout.tsx` pour inclure AuthProvider
3. Créer `components/auth/ProtectedRoute.tsx` (wrapper réutilisable)
4. Mettre à jour `app/espace-client/layout.tsx` pour utiliser ProtectedRoute
5. Créer `supabase/migrations/20260501_rls_audit.sql` :
   - Vérifier et compléter RLS sur toutes les tables
   - Ajouter policies manquantes (contact_requests, villa_events, etc.)
   - Noms standardisés `{table}_{action}_{who}`

### Fichiers impactés

- `contexts/AuthContext.tsx` (nouveau)
- `app/layout.tsx`
- `components/auth/ProtectedRoute.tsx` (nouveau)
- `app/espace-client/layout.tsx`
- `supabase/migrations/20260501_rls_audit.sql` (nouveau)

---

## LOT 6 — react-hook-form + Zod sur formulaires (P1)

**Objectif :** Validation client structurée sur tous les formulaires critiques.

### Étapes

1. Login : Ajouter react-hook-form + Zod
2. Dashboard villa form : Ajouter react-hook-form + Zod
3. Contact form : Ajouter react-hook-form + Zod
4. Profile form : Ajouter react-hook-form + Zod
5. Créer schémas de validation partagés dans `lib/schemas.ts`

### Fichiers impactés

- `package.json` (ajouter react-hook-form + @hookform/resolvers)
- `app/login/page.tsx`
- `app/dashboard/proprio/[villaId]/page.tsx`
- `components/espace-client/ProfileForm.tsx`
- `lib/schemas.ts` (nouveau)

---

## LOT 7 — Tests Playwright (P2)

**Objectif :** Tests des flows critiques.

### Étapes

1. Setup : config Playwright complète
2. Test login + magic link
3. Test booking flow complet (recherche → sélection → paiement simulé)
4. Test dashboard proprio (création villa, modification)
5. Test espace client (réservations, profil)

### Fichiers impactés

- `tests/login.spec.ts` (nouveau)
- `tests/booking.spec.ts` (nouveau)
- `tests/dashboard.spec.ts` (nouveau)
- `tests/espace-client.spec.ts` (nouveau)

---

## LOT 8 — Polish final (P3)

**Objectif :** Nettoyage et conventions.

### Étapes

1. Route groups explicites : `(marketing)`, `(account)`, `(dashboard)`
2. Barrel exports dans `types/`, `components/ui/`
3. Standardiser noms policies RLS
4. Supprimer code mort / imports inutilisés
5. Ajouter `supabase/config.toml` si non présent

### Fichiers impactés

- `app/` (restructuration route groups)
- `types/index.ts`
- `components/ui/index.ts`
- `supabase/config.toml` (nouveau)

---

## Ordre d'exécution

```
Lot 1 (Types) → Lot 2 (Sécurité) → Lot 3 (Stripe) → Lot 4 (Dashboard)
→ Lot 5 (Auth) → Lot 6 (Forms) → Lot 7 (Tests) → Lot 8 (Polish)
```

Chaque lot est conçu pour être **indépendant** et **buildable** après implémentation.
