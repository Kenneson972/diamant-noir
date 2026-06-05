# Audit espaces dashboard — Kayvila

**Date** : 2026-06-06  
**Projet** : diamant-noir  
**Périmètre** : Admin (priorité), Proprio, Espace client (tenant)  
**Méthode** : 3 audits parallèles (code + migrations RLS + APIs)

---

## Vue d’ensemble

| Espace | Santé globale | Priorité |
|--------|---------------|----------|
| **Admin** | Données souvent bloquées par RLS + chiffres finance faux | 🔴 Critique |
| **Proprio** | Lecture OK, failles IDOR + revenus incohérents | 🟠 Important |
| **Tenant** | Auth magic link incomplet → espace souvent vide | 🟠 Important |

---

## 1. Admin — résumé exécutif

- **Revenus admin incorrects (P0)** : `/admin/revenus` utilise `COMMISSION_RATE = 0.20` sur le brut, alors que Stripe et le dashboard proprio utilisent `calculateTransferAmounts()` (25 % séjour + 100 % ménage/service). Le mega-fix P1 n’a pas été appliqué côté admin.
- **RLS `bookings` sans policy admin (P0)** : les pages client (`reservations`, `revenus`, dashboard) passent par `getSupabaseBrowser()` / `getSupabaseServer()` et peuvent afficher 0 réservation. Seules certaines routes RSC utilisent `supabaseAdmin()`.
- **Messagerie admin probablement cassée (P0)** : schéma UI (`sender`/`message`) ≠ migration (`session_id`/`content`) ; pas de policy admin sur `chat_messages`.
- **RBAC fragmenté (P1)** : middleware OK (`isStaffAdmin`), mais RLS demandes/avis/sync-ota ne regarde que `profiles.role = 'admin'`.
- **Dette sécurité** : pas d’`admin_audit_log` ; mutations admin côté browser sans feedback d’erreur.

---

## 2. Admin — P0 bloquants

| # | Problème | Fichier(s) |
|---|----------|------------|
| P0-1 | Commission revenus fausse (20 % vs 25 % + fees) | `app/(admin)/admin/revenus/page.tsx` |
| P0-2 | Pas de policy RLS admin sur `bookings` | migrations `espace_client_tenant.sql`, `20260514_owner_bookings_rls.sql` |
| P0-3 | Mutations réservations via browser sans garde serveur | `app/(admin)/admin/reservations/page.tsx`, `components/dashboard/CreateBookingModal.tsx` |
| P0-4 | Messagerie : schéma + RLS incohérents | `app/(admin)/admin/messagerie/page.tsx`, `20260403120000_espace_client_chat_checklist.sql` |
| P0-5 | Colonne `assignee_id` absente de la DB | `app/(admin)/admin/demandes/page.tsx`, `20260511_requests.sql` |

---

## 3. Admin — P1 important

| # | Problème | Fichier(s) |
|---|----------|------------|
| P1-1 | RLS requests/reviews : `profiles.role` strict | `20260511_rls_requests.sql`, `20260511_reviews.sql` |
| P1-2 | `/api/sync-ota` : admin = `profile.role === "admin"` | `app/api/sync-ota/route.ts` |
| P1-3 | `/api/sync-ota` dans `publicPaths` middleware | `middleware.ts` |
| P1-4 | Pas d’audit trail admin | — |
| P1-5 | `requireAdmin` ignore JWT metadata | `lib/auth/server.ts` |
| P1-6 | `conciergerie_settings` : UPDATE only, pas INSERT | `20260511_conciergerie_settings.sql` |
| P1-7 | `/admin/proprietaires` hors sidebar | `AdminMenuItems.ts` |
| P1-8 | `/admin/assistant` référencé mais inexistant | `DashboardShell.tsx` |
| P1-9 | `/admin/membres/[id]` sans liste parent | — |
| P1-10 | `global-stats` revenus bruts sans split | `app/api/admin/global-stats/route.ts` |
| P1-11 | `/api/admin/chat` : `select("*")` massif | `app/api/admin/chat/route.ts` |
| P1-12 | Mutations avis/demandes sans feedback erreur | `avis/page.tsx`, `demandes/page.tsx` |
| P1-13 | Types Supabase obsolètes | `types/supabase.ts` |
| P1-14 | Paramètres : libellé CSRF « Activée » aspirational | `parametres/page.tsx` |

---

## 4. Admin — quick wins (< 30 min)

1. Revenus admin → `calculateTransferAmounts` + select `price, cleaning_fee, service_fee`
2. Ajouter **Propriétaires** dans `AdminMenuItems.ts`
3. Retirer `assignee_id` de l’UI **ou** migration SQL
4. Toasts/alertes sur mutations (réservations, avis, demandes)
5. `export const dynamic = "force-dynamic"` sur `/api/admin/chat`
6. `isStaffAdmin` dans `/api/sync-ota`
7. Retirer `/api/sync-ota` des `publicPaths`
8. Remplacer `<a href>` par `<Link>` sur le dashboard admin

---

## 5. Admin — par page

| Page | Route | Problème principal | Fix suggéré |
|------|-------|-------------------|-------------|
| Tableau de bord | `/admin` | Bookings via client — RLS bloque KPIs | `supabaseAdmin()` ou policy admin bookings |
| Villas | `/admin/villas` | CA brut sans split | `calculateTransferAmounts` |
| Réservations | `/admin/reservations` | Mutations browser | API `app/api/admin/bookings` |
| Résa détail | `/admin/reservations/[id]` | ✅ `supabaseAdmin()` | Référence à généraliser |
| Clients | `/admin/clients` | Comptage filtré RLS | `supabaseAdmin()` |
| Demandes | `/admin/demandes` | `assignee_id` inexistant | Migration ou retrait UI |
| Avis | `/admin/avis` | Modération browser + RLS strict | API admin + toasts |
| Messagerie | `/admin/messagerie` | Schéma/RLS/UI incohérents | Refonte + route service_role |
| Revenus | `/admin/revenus` | 20 % naïf | `calculateTransferAmounts` |
| Sync OTA | `/admin/sync-ota` | Staff bloqué sur sync API | Unifier RBAC |
| Tarification | `/admin/tarification` | RLS owner/admin | Vérifier policies + erreurs |
| Paramètres | `/admin/parametres` | Revenus bruts, CSRF label faux | Aligner données |
| Propriétaires | `/admin/proprietaires` | Absent du menu | Lien sidebar |
| Assistant | `/admin/assistant` | Page supprimée | Recréer ou retirer ref shell |

---

## 6. Proprio — synthèse

### P0

- **IDOR fiche réservation** : `app/(proprio)/dashboard/reservations/[villaId]/[bookingId]/page.tsx` charge via `supabaseAdmin()` sans vérif ownership.
- **APIs create/delete-villa** : `supabaseAdmin()` contourne RLS (INSERT admin-only en DB).

### P1

- Revenus accueil = brut + trend **+12 % hardcodé** ; page Revenus = net via `calculateTransferAmounts` → incohérence.
- Copilot codé (`CopilotContext`, `CopilotButton`) mais **non monté** dans le layout ; mauvaise URL API (`/api/chatbot-owner` vs `owner-assistant`).
- Pages `[villaId]` sans garde ownership explicite côté serveur.

### Quick wins proprio

1. Helper ownership réutilisable (comme `update-villa/route.ts`)
2. Aligner revenus dashboard accueil sur `calculateTransferAmounts`
3. Brancher copilot dans `dashboard/layout.tsx`
4. Ajouter `loading.tsx` / `error.tsx` sous `(proprio)/dashboard/`
5. Unifier auth API sur `getSessionUser` (cookie + Bearer)

### Écarts vs admin

| Feature admin | Côté proprio |
|---------------|--------------|
| Clients, demandes, avis, messagerie | Absent |
| Sync OTA / iCal | Absent (import Airbnb partiel dans éditeur) |
| Tarification / saisons | Lecture seule en stats |
| Création villa UI | Absent |
| Revenus | **Net** (proprio) vs **brut 20 %** (admin) — deux modèles |
| Disponibilités / blocages | Uniquement dans worktree `feat-owner-availability-blocking` |

---

## 7. Tenant (espace-client) — synthèse

### P0

- **Magic link absent de `/login`** — uniquement sur `/success` post-paiement.
- **Liaison booking = `guest_email` exact** — espace vide si email auth ≠ email réservation.

### P1

- Partage séjour cassé (token `btoa` faible, `/share` pas public, RLS publique supprimée).
- Bug wishlist : sync DB inversée dans `contexts/WishlistContext.tsx`.
- Contenu mock : factures HTML, parrainage sans email, conciergerie hardcodée, chat démo.

### Quick wins tenant

1. Corriger `WishlistContext.toggle`
2. Ajouter Profil + Checklist au menu `TenantMenuItems.ts`
3. Retirer statut `"upcoming"` des requêtes livret
4. Magic link OTP sur `/login`
5. Message explicite si 0 booking (« email de connexion = email réservation »)

### Priorité unique si une seule chose cette semaine

**Débloquer l’accès tenant de bout en bout** : OTP login + normalisation email + message espace vide.

---

## 8. Roadmap recommandée

### Semaine 1 — Admin (priorité)

- [ ] Revenus `calculateTransferAmounts`
- [ ] RLS admin bookings **ou** fetch `supabaseAdmin()` sur toutes les pages admin data-heavy
- [ ] Fix demandes (`assignee_id` migration ou retrait UI)
- [ ] Sidebar propriétaires + feedback erreurs mutations

### Semaine 2 — Sécurité cross-spaces

- [ ] IDOR booking proprio
- [ ] Mutations admin → API serveur + audit log
- [ ] RBAC unifié (`isStaffAdmin` dans RLS, sync-ota, conciergerie)
- [ ] Messagerie admin (décision schéma)

### Semaine 3 — Tenant + polish

- [ ] Magic link `/login`
- [ ] Wishlist fix + menu complet
- [ ] Copilot proprio intégré
- [ ] `loading.tsx` / `error.tsx` proprio + admin par route

---

## 9. Fichiers pivots

| Domaine | Fichiers |
|---------|----------|
| Admin revenus | `app/(admin)/admin/revenus/page.tsx`, `lib/stripe/connect.ts` |
| Admin menu | `components/dashboard/admin/AdminMenuItems.ts` |
| RLS bookings | `supabase/migrations/espace_client_tenant.sql`, `tenant_bookings_rls_calendar_fix.sql` |
| RBAC | `middleware.ts`, `lib/auth/admin-access.ts`, `lib/auth/server.ts` |
| Proprio revenus (référence) | `app/(proprio)/dashboard/revenus/page.tsx` |
| IDOR proprio | `app/(proprio)/dashboard/reservations/[villaId]/[bookingId]/page.tsx` |
| Tenant auth | `app/login/page.tsx`, `app/success/page.tsx`, `app/espace-client/page.tsx` |
| Wishlist | `contexts/WishlistContext.tsx` |

---

*Généré après audits parallèles admin / proprio / tenant — session 2026-06-06.*
