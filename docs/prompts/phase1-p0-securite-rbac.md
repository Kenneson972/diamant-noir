# Phase 1 — 🔴 P0 Sécurité & RBAC

> Priorité absolue. Bloquer la mise en prod sans ça.
> Commit atomique : `fix(security): P0 RBAC + SQL injection + CSRF`

---

## 1. 🔴 Corriger les 8 policies RLS — piège `auth.jwt()->>'role'`

### Analyse

Dans Supabase, `auth.jwt() ->> 'role'` retourne le rôle **DB** (`authenticated`), PAS le rôle métier. Le rôle métier est dans `auth.jwt() -> 'user_metadata' ->> 'role'`. 8 policies utilisent le mauvais chemin → aucun admin ne matche.

### Fichier : `supabase/migrations/20260501_rls_audit.sql`

Remplacer **partout** `auth.jwt() ->> 'role' = 'admin'` par `auth.jwt() -> 'user_metadata' ->> 'role' = 'admin'`.

Policies concernées (lignes approximatives) :
- `contact_requests` → `select_admin`
- `villa_events` → `select_admin`
- `villa_submissions` → `select_admin`, `update_admin`
- `admin_chat_logs` → `select_admin`
- `ai_action_logs` → `insert_admin`, `select_admin`

Le fichier `20260528_security_hardening.sql` utilise déjà le bon pattern — s'en inspirer.

**Règle à appliquer partout** : JAMAIS `auth.jwt() ->> 'role'`. TOUJOURS `auth.jwt() -> 'user_metadata' ->> 'role'`.

---

## 2. 🔴 Routes `create-villa` / `delete-villa` — admin ONLY, proprios bloqués

### Analyse

Ces routes utilisent `requireAdmin()` alors qu'elles sont dans l'espace `/api/dashboard/` (propriétaire). Un proprio légitime ne peut pas créer ni supprimer sa villa.

### Fichiers
- `app/api/dashboard/create-villa/route.ts`
- `app/api/dashboard/delete-villa/route.ts`

### Action
Suivre le pattern de `update-villa/route.ts` qui utilise correctement `isAdmin || owner_id`.
- `create-villa` : garder `requireAdmin()` mais ajouter une route alternative `/api/dashboard/submit-villa` avec `requireAuth()` pour les proprios
- `delete-villa` : vérifier `isAdmin || owner_id === villa.owner_id`

---

## 3. 🔴 SQL injection dans `ical-sync.ts` et `ota-hub.ts`

### Analyse

Les fichiers utilisent `.not("external_id", "in", ...)` avec des IDs concaténés sans échappement.

### Fichiers
- `lib/ical-sync.ts` (ligne ~44)
- `lib/ota-hub.ts` (ligne ~134)

### Action
Remplacer toute concaténation de strings dans les requêtes Supabase par le passage de tableaux typés.
Exemple : `.not("external_id", "in", `(${ids.join(',')})`)` → `.not("external_id", "in", ids)` (Supabase gère l'échappement automatiquement avec un array).

---

## 4. 🔴 CSRF importé mais jamais appelé

### Analyse
`checkCsrf` est importé dans `app/api/booking/route.ts:6` mais **jamais invoqué**. La route POST est vulnérable aux attaques CSRF.

### Fichier : `app/api/booking/route.ts`

### Action
Ajouter `await checkCsrf(request)` en première ligne du handler POST.

---

## ✅ Checklist
- [ ] 8 policies RLS corrigées
- [ ] create-villa / delete-villa → proprio OK
- [ ] SQL injection fixé (ical-sync + ota-hub)
- [ ] CSRF activé sur POST booking
- [ ] `npm run build` passe
- [ ] Commit: `fix(security): P0 RBAC + SQL injection + CSRF`
