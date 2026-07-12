# Récap — Audit préprod Stripe + UI & correction des P0

**Dates** : audit finalisé le 2026-07-12 (plan du 2026-07-11), P0 corrigés le 2026-07-12.
**Commits** : `d0e9ee4` (rapport d'audit) · `17df38d` (corrections P0).
**Rapport complet** : `docs/audits/audit-preprod-2026-07-11.md` (+ 38 screenshots dans `docs/audits/screens-2026-07-11/`).

---

## 1. L'audit (12 tâches, diagnostic seul)

### Mission 1 — Flux paiement Stripe (lecture de code + tests)
- **Env** : clés `sk_test_`/`whsec_` OK, zéro `sk_live` dans le repo. `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` absente mais **sans impact** (flux 100 % redirection serveur, pas de Stripe.js client).
- **Booking API** : CSRF, rate limiting, validation zod, recalcul prix serveur, metadata `bookingId`, catch Stripe → tous ✅. Un seul vrai trou : le check de disponibilité **non atomique** (voir P0.1).
- **Webhook** : signature vérifiée avant tout, 12 événements traités, **idempotence réelle** (claim atomique `stripe_events_processed` + rollback du claim sur erreur pour laisser Stripe retenter). Solide.
- **Page succès** : chemin `session_id` robuste (vérif BDD + fallback API Stripe) ; chemin `bookingId` dangereux (voir P0.2).
- **Connect** : actif et central (pas du code mort) — commission 22 % direct / 20 % OTA sur les nuitées seules, `transfer_data` + `application_fee_amount` injectés, réservation bloquée (503) si le proprio n'a pas fini son onboarding.
- **Tests** : vitest 202 pass (5 suites `lib/proactive` cassées — parsing JSX, hors Stripe) ; Playwright 28 pass / 13 skip (faute de villa publiée en base).

### Mission 2 — UI (22 pages, desktop 1280 + mobile 375, console vérifiée)
- **Pages publiques (10)** : propres — états vides sobres, 0 débordement, 0 erreur console. Bug : `/villas/[id]` avec un ID inexistant affiche une **villa fictive crédible** au lieu d'un 404 (+ erreurs 400/500 console sur l'id `fallback`).
- **Espace client (10 pages, compte locataire)** : tout propre sauf le détail réservation → **2× 406 Supabase** (villa supprimée référencée par la résa). Nav mobile (bottom bar + drawer « Plus ») fonctionnelle. 2 défauts cosmétiques (bandeau RE-RÉSERVER ambigu, sous-titre collé sur le profil).
- **Dashboard proprio** : aucun NaN/undefined, mais **incohérence** — tableau de bord « Revenus du mois 6 435 € » vs page Revenus « 0 € » pour le même mois.

---

## 2. Les 4 critiques et leur statut

| # | Critique | Statut |
|---|----------|--------|
| 1 | Double réservation payée possible sous concurrence | ✅ **Corrigé** (contrainte DB) |
| 2 | `/success?bookingId=` confirmait sans preuve de paiement | ✅ **Corrigé** (vérif serveur) |
| 3 | Checkout réel jamais testé de bout en bout | ✅ **Traité** (seed + 40 tests verts) |
| 4 | Config Dashboard Stripe non vérifiable en local | 🔍 **Action Ken** (voir §4) |

---

## 3. Détail des corrections P0 (commit `17df38d`)

### P0.1 — Contrainte anti-double-booking
- `supabase/migrations/20260712150000_bookings_no_overlap.sql` : `CREATE EXTENSION btree_gist` + `EXCLUDE USING gist (villa_id WITH =, daterange(start_date, end_date) WITH &&) WHERE status IN ('pending','confirmed','paid')`.
- **Appliquée au projet Supabase** et validée empiriquement : chevauchement → rejet `exclusion_violation` ; arrivée le jour d'un départ → acceptée (fin exclusive, même sémantique que le check applicatif) ; résa annulée → exemptée.
- `app/api/booking/route.ts` : le code Postgres `23P01` renvoie désormais un 409 « villa non disponible » au lieu d'un 500.

### P0.2 — Page succès sécurisée
- `app/api/booking-session/route.ts` : accepte `bookingId` (UUID validé) en plus de `session_id` ; vérifie le statut réel en BDD, tente la sync Stripe via la session liée au booking ; **`stripe_session_id` retiré de toutes les réponses**.
- `app/success/page.tsx` : le chemin `bookingId` appelle l'API — réservation non payée → écran distinct « Réservation en attente de paiement » ; UUID forgé → « Réservation introuvable ». Plus aucune confirmation sur la seule foi de l'URL. Suppression du `isConfirmed` mort.
- `lib/i18n.ts` : clés `success.awaiting_payment_title` / `_desc` en fr/en/es.
- **Vérifié en navigateur** sur les deux cas (pending réel + UUID forgé).

### P0.3 — Angle mort checkout comblé
- Villa « Villa Test Préprod » seedée (id `fee07a75-2f3d-4a57-8219-5b49ace2f536`), **dépubliée après les tests** (base partagée).
- Playwright `mocked` + `stripe-api` : **40 passed / 1 skipped** (contre 28/13) — les 16 tests checkout jamais exécutés passent : CGV, redirection `/success`, idempotence double-clic, rate limiting 429, Connect 503.
- Pour re-tester le checkout : republier la villa + `TEST_VILLA_ID=fee07a75-2f3d-4a57-8219-5b49ace2f536`.
- Vitest : 202 pass, rien de cassé par les changements.

---

## 4. Ce qui reste à faire

### Actions Ken (avant bascule live)
- **Dashboard Stripe** : créer/vérifier l'endpoint webhook `https://<domaine-prod>/api/webhooks/stripe`, cocher les **12 événements** (liste exacte en section 1.3 du rapport), reporter le `whsec_` dans l'env prod.
- Remplacer `sk_test_` par les clés live **dans l'env prod uniquement** (jamais dans le repo).
- **Un vrai paiement test sur la page Stripe hébergée** une fois la préprod déployée (les suites mockées ne couvrent pas la page Stripe elle-même).

### P1 (semaine de bascule) — non corrigés
5. 5 suites vitest `lib/proactive/*` cassées (parsing JSX `emails/admin-proactive-summary.tsx:15`).
6. `/villas/[id]` inexistante → 404 propre au lieu de la villa fictive (+ 406/400/500 sur donnée villa manquante).
7. Incohérence Revenus proprio (6 435 € vs 0 €).
8. Email de confirmation sans retry (échec seulement loggé).

### P2 (confort) — non corrigés
Rate limiter en mémoire (multi-instance), `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` dans le template env, tests d'erreur zod + intégration Connect, `CGV_VERSION` dans les metadata Stripe, 3 défauts cosmétiques UI.

---

*Généré en fin de session du 2026-07-12. Détail complet, références fichier:ligne et verdicts point par point dans `docs/audits/audit-preprod-2026-07-11.md`.*
