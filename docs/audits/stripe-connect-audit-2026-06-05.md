# AUDIT STRIPE CONNECT — KAYVILLA (DIAMANT-NOIR)

**Date** : 2026-06-05  
**Auditeur** : Hermes Agent (subagent)  
**Périmètre** : `/opt/data/repos/diamant-noir`  
**Stack** : Next.js 15, TypeScript, Tailwind, Supabase, Stripe 14.25  

---

## SYNTHÈSE GLOBALE

L'intégration Stripe Connect est **fonctionnelle pour le flux nominal** (onboarding → paiement → split → webhooks de base), mais présente **3 bugs P0** et **15 problèmes P1-P2** qui exposent l'application à des erreurs financières, des incohérences de dashboard, et des trous dans le cycle de vie des litiges.

---

## FICHIERS AUDITÉS

| Fichier | Rôle |
|---------|------|
| `lib/stripe/connect.ts` | Helpers : createConnectAccount, createOnboardingLink, calculateTransferAmounts |
| `app/api/webhooks/stripe/route.ts` | Webhook handler principal (298 lignes) |
| `app/api/stripe/connect-onboarding/route.ts` | Génération lien onboarding |
| `app/api/stripe/connect-verify/route.ts` | Vérification statut Connect |
| `app/api/booking/route.ts` | Création réservation + session Stripe Checkout |
| `app/api/booking-session/route.ts` | Récupération booking par session_id |
| `app/success/page.tsx` | Page confirmation post-paiement |
| `components/dashboard/proprio/StripeConnectButton.tsx` | Bouton Connect + vérification retour |
| `components/dashboard/proprio/BookingDetailCard.tsx` | Carte détail réservation proprio |
| `components/dashboard/proprio/RevenueSummary.tsx` | KPIs revenus proprio |
| `app/(proprio)/dashboard/page.tsx` | Dashboard proprio (283 lignes) |
| `app/(proprio)/dashboard/revenus/page.tsx` | Page revenus proprio |
| `app/(admin)/admin/revenus/page.tsx` | Page revenus admin (214 lignes) |
| `types/stripe.ts` | Schéma Zod BookingRequest |
| `types/domain.ts` | Types TS : Booking, Villa, PaymentStatus |
| `supabase/migrations/20260501_stripe_idempotence.sql` | Table `stripe_events_processed` + `order_status_history` |
| `supabase/migrations/20260514_stripe_connect.sql` | Colonnes `stripe_connect_account_id`, `onboarding_completed` |
| `supabase/migrations/20260514_stripe_payment_fields.sql` | Colonnes `cleaning_fee`, `service_fee`, `stripe_payment_intent_id` |
| `supabase/migrations/20260526_stripe_disputes.sql` | Table `stripe_disputes` |
| `update_bookings_payment.sql` | Colonnes `payment_status`, `stripe_session_id` |
| `middleware.ts` | Auth guard + publicPaths Stripe |
| `.env.local.example` | Template variables d'environnement |

---

## 1. ONBOARDING PROPRIO (CONNECT EXPRESS) ✅⚠️

### ✅ Ce qui marche
- `createConnectAccount()` crée un compte Express avec `capabilities.transfers.requested`
- `createOnboardingLink()` génère un lien avec `refresh_url` et `return_url` corrects
- La route `POST /api/stripe/connect-onboarding` est protégée par `requireAuth()` et crée le compte à la volée si nécessaire
- La vérification `POST /api/stripe/connect-verify` interroge l'API Stripe pour détecter `charges_enabled || details_submitted`
- Le `StripeConnectButton` gère le retour `?connect=success` côté client ET serveur
- Le middleware autorise les routes Stripe dans `publicPaths` (elles ont leur propre auth)

### ⚠️ Problèmes

| ID | Sévérité | Fichier | Problème |
|----|----------|---------|----------|
| **P1-01** | P1 | `lib/stripe/connect.ts:29` | `business_type: "individual"` hardcodé. Un propriétaire société (SASU, SARL) ne peut pas s'inscrire correctement |
| **P2-01** | P2 | `lib/stripe/connect.ts:48` | `refresh_url` et `return_url` pointent vers `/dashboard` — si la session expire pendant l'onboarding, le retour échoue silencieusement |

---

## 2. SPLIT PAIEMENT 75/25 🚨

### ✅ Ce qui marche
- `calculateTransferAmounts()` (l.76-90) calcule correctement : owner = 75% stay, platform = 25% stay + 100% cleaning + 100% service
- `booking/route.ts` (l.303-310) ajoute `transfer_data.destination` + `application_fee_amount` uniquement si le propriétaire a un compte Connect completed
- Les metadata de la session Stripe contiennent `ownerConnectAccountId`, `cleaningFeeCents`, `serviceFeeCents`

### 🚨 Problèmes

| ID | Sévérité | Fichier | Problème |
|----|----------|---------|----------|
| **P0-01** | **P0** | `admin/revenus/page.tsx:10` | **Commission admin = 20 % vs Stripe = 25 %**. Le dashboard admin utilise `COMMISSION_RATE = 0.20` mais le booking API appelle `calculateTransferAmounts(..., 25)`. Résultat : l'admin voit 80/20, Stripe fait 75/25 → incohérence dans les projections de revenus |
| **P0-02** | **P0** | `proprio/dashboard/revenus/page.tsx`, `proprio/dashboard/page.tsx` | **Le dashboard proprio affiche le CA BRUT (`total_price_cents`) et non le reversement réel**. Le propriétaire voit le montant total payé par le client (séjour + ménage + service), alors qu'il ne reçoit que 75 % du séjour. Exemple : 1000€ affichés, 600€ réellement perçus |
| **P2-02** | P2 | `app/api/booking/route.ts:147` | Calcul `serviceFeeCents = Math.round(price.total * serviceFeePercent / 100 * 100)` — l'expression est correcte (5% × prix en centimes) mais peu lisible. `serviceFeePercent` par défaut = 5% (Zod schema) |
| **P2-03** | P2 | `app/api/booking/route.ts` | La table `bookings` ne stocke pas `platform_fee_cents` ni `owner_transfer_cents` — impossible de reconstituer la répartition après coup sans interroger l'API Stripe |

---

## 3. WEBHOOKS STRIPE CONNECT ⚠️

### ✅ Ce qui marche
- Signature vérifiée via `stripe.webhooks.constructEvent()` (l.31)
- Idempotence via table `stripe_events_processed` (l.41-48)
- `checkout.session.completed` → booking confirmed, emails envoyés, compte client auto-créé
- `checkout.session.expired` → booking cancelled, auto-refund avec `reverse_transfer: true`
- `account.updated` → onboarding flag mis à jour
- `payment_intent.succeeded` → bookings async (SEPA/SOFORT) confirmés
- `payment_intent.payment_failed` → statut paiement marqué failed
- `account.application.deauthorized` → onboarding flag = false

### ⚠️ Problèmes

| ID | Sévérité | Fichier | Problème |
|----|----------|---------|----------|
| **P0-03** | **P0** | `webhooks/stripe/route.ts` | **Absence de handler `charge.refunded`**. Si un refund est émis (manuellement depuis Stripe Dashboard, ou via `session.expired`), le statut `payment_status` n'est PAS mis à jour côté DB. Seul `session.expired` fait `payment_status = "refunded"` — les autres refunds passent inaperçus |
| **P1-02** | P1 | `webhooks/stripe/route.ts:41-48` | **Race condition idempotence** : SELECT → INSERT au lieu d'un upsert. Si deux workers traitent le même event simultanément, le second INSERT échoue (PK violation) → Stripe retente inutilement. L'audit précédent (29 mai) recommandait un upsert |
| **P1-03** | P1 | `webhooks/stripe/route.ts` | **Absence de handler `checkout.session.async_payment_failed`**. Paiements SEPA/SOFORT qui échouent après la session → booking reste "pending" indéfiniment |
| **P1-04** | P1 | `webhooks/stripe/route.ts:238-247` | `payment_intent.succeeded` ne vérifie pas si le transfer Connect a bien été exécuté. Le booking est marqué "paid" même si le split a échoué |
| **P2-04** | P2 | `webhooks/stripe/route.ts:69-131` | `checkout.session.completed` ne stocke pas les montants de commission/reversement. Le `application_fee_amount` et le `transfer_data` ne sont pas persistés |

---

## 4. REFUNDS — REVERSE TRANSFER ✅⚠️

### ✅ Ce qui marche
- `checkout.session.expired` utilise `reverse_transfer: true` dans `stripe.refunds.create()` (l.204) — corrigé suite à l'audit du 29 mai

### ⚠️ Problèmes

| ID | Sévérité | Fichier | Problème |
|----|----------|---------|----------|
| **P1-05** | P1 | `webhooks/stripe/route.ts` + absence de route | **Pas de mécanisme de refund admin**. Aucune API endpoint ni UI pour qu'un admin déclenche un remboursement manuel. Seul le `session.expired` automatique existe |
| **P2-05** | P2 | `webhooks/stripe/route.ts:196-213` | **Succès/échec du refund non persisté**. Le try/catch du refund ne fait qu'un `console.error` — aucune trace en DB si le refund échoue |
| **P2-06** | P2 | `webhooks/stripe/route.ts:196-213` | Le refund dans `session.expired` est déclenché uniquement si `payment_status === "paid"`. Mais `payment_status` peut avoir été mis à `refunded` via `charge.refunded` sans que le booking soit cancelled → refund manqué |

---

## 5. DISPUTES ⚠️

### ✅ Ce qui marche
- `charge.dispute.created` (l.271-283) insère dans `stripe_disputes` avec dispute_id, charge_id, amount, reason, status, evidence_due_by
- Table `stripe_disputes` avec RLS activée, PK UUID, contrainte UNIQUE sur `dispute_id`
- Stockage correct de `evidence_due_by` en ISO timestamp

### ⚠️ Problèmes

| ID | Sévérité | Fichier | Problème |
|----|----------|---------|----------|
| **P1-06** | P1 | `webhooks/stripe/route.ts` | **Absence de handlers de résolution dispute** : `charge.dispute.closed`, `charge.dispute.funds_reinstated`, `charge.dispute.funds_withdrawn`. La colonne `resolved_at` et le `status` ne seront jamais mis à jour |
| **P1-07** | P1 | `stripe_disputes` table | **Pas d'UI admin pour les disputes**. Aucune page ou composant pour lister/gérer les litiges. La table existe mais est invisible |
| **P2-07** | P2 | `webhooks/stripe/route.ts:271-283` | **Pas de notification admin** lors de la création d'un dispute. L'admin n'est pas alerté (email/Slack/Telegram) → délai de réponse potentiellement > 7 jours (délai Stripe) |

---

## 6. CLÉS STRIPE (LIVE VS TEST) ✅⚠️

### ✅ Ce qui marche
- Une seule `STRIPE_SECRET_KEY` utilisée de façon cohérente dans tous les fichiers
- `STRIPE_WEBHOOK_SECRET` pour la vérification des signatures
- `.env.local.example` documente les 2 variables

### ⚠️ Problèmes

| ID | Sévérité | Fichier | Problème |
|----|----------|---------|----------|
| **P2-08** | P2 | `.env.local.example` | Pas de séparation `STRIPE_LIVE_KEY` / `STRIPE_TEST_KEY`. Le changement test→production nécessite de modifier une seule variable, sans filet de sécurité |
| **P2-09** | P2 | Absent | **`STRIPE_CONNECT_CLIENT_ID` non documenté ni utilisé**. La spec initiale (`2026-05-14-stripe-connect-tenant-account.md`) le mentionnait mais la variable n'existe pas. Certaines intégrations Connect (OAuth) en ont besoin |

---

## 7. DASHBOARD PROPRIO — PROBLÈMES DE REVENUS 🚨

### ✅ Ce qui marche
- Page `/dashboard/revenus` affiche un graphique de revenus mensuels
- `RevenueSummary` montre le mois, l'année, le prix moyen/nuit
- `RevenueChart` avec distinction "mois en cours"

### 🚨 Problèmes (déjà listés mais détaillés ici)

**P0-02 (détaillé)** : Le dashboard proprio page `/dashboard` et `/dashboard/revenus` agrège `total_price_cents` sur les bookings, qui représente le montant TOTAL payé par le client (séjour + ménage + service). Le propriétaire ne reçoit que 75% du séjour (hors ménage et service). L'affichage est donc trompeur.

**P0-01 (détaillé)** : L'admin `/admin/revenus` utilise `COMMISSION_RATE = 0.20` en dur, alors que Stripe utilise 25%. Les colonnes "Commission Kayvila (20%)" et "Reversement propriétaires (80%)" sont fausses. L'export CSV exporte aussi des chiffres incorrects.

---

## 8. PROBLÈMES ADDITIONNELS

| ID | Sévérité | Fichier | Problème |
|----|----------|---------|----------|
| **P1-08** | P1 | `webhooks/stripe/route.ts` | `checkout.session.expired` (l.181) : `.eq("status", "pending")` garde-fou OK, mais pas de `payment_status` check avant d'émettre le refund → si un autre système a déjà refundé, double refund possible |
| **P1-09** | P1 | `lib/stripe/connect.ts` | `getStripe()` est un singleton global (variable module-level) — en environnement serverless (Vercel), les cold starts peuvent réutiliser une instance stale |
| **P2-10** | P2 | `app/api/booking/route.ts` | Pas de validation que `platformFeeCents > 0` avant de le passer à Stripe — cas limite où le séjour vaut 0€ |
| **P2-11** | P2 | `webhooks/stripe/route.ts` | Les appels à `/api/send-booking-confirmation` et `/api/notify-admin-booking` sont fire-and-forget sans retry — si ces endpoints sont down, pas d'alerte |
| **P2-12** | P2 | `supabase/migrations/20260526_stripe_disputes.sql` | La migration disputes est marquée **non appliquée** dans `docs/todo.md` (l.7). La table risque de ne pas exister en production |

---

## RÉSUMÉ PAR PRIORITÉ

### 🔴 P0 — BLOQUANT (3)

| ID | Bug |
|----|-----|
| **P0-01** | Commission admin dashboard = 20% (faux) au lieu de 25% (réel) |
| **P0-02** | Dashboard proprio affiche CA brut (total client) au lieu du reversement net (75% séjour) |
| **P0-03** | Pas de handler `charge.refunded` → refunds non synchronisés en DB |

### 🟠 P1 — ÉLEVÉ (9)

| ID | Bug |
|----|-----|
| P1-01 | `business_type: "individual"` hardcodé |
| P1-02 | Idempotence SELECT+INSERT → race condition |
| P1-03 | Pas de handler `checkout.session.async_payment_failed` |
| P1-04 | `payment_intent.succeeded` ne vérifie pas le transfer Connect |
| P1-05 | Pas d'API/UI de refund manuel admin |
| P1-06 | Pas de handlers resolution dispute (closed/reinstated/withdrawn) |
| P1-07 | Pas d'UI admin pour gérer les disputes |
| P1-08 | Risque double-refund dans `session.expired` |
| P1-09 | Singleton Stripe stale en serverless (cold starts) |

### 🟡 P2 — MODÉRÉ (12)

| ID | Bug |
|----|-----|
| P2-01 | `refresh_url`/`return_url` onboarding fragiles (session expiry) |
| P2-02 | Formule `serviceFeeCents` peu lisible |
| P2-03 | Pas de colonnes `platform_fee_cents` / `owner_transfer_cents` sur bookings |
| P2-04 | Commission/reversement non persistés dans le handler `session.completed` |
| P2-05 | Succès/échec refund non persisté en DB |
| P2-06 | Condition `payment_status === "paid"` trop stricte pour le refund |
| P2-07 | Pas de notification admin sur création dispute |
| P2-08 | Pas de séparation STRIPE_LIVE_KEY / STRIPE_TEST_KEY |
| P2-09 | `STRIPE_CONNECT_CLIENT_ID` absent |
| P2-10 | Pas de validation `platformFeeCents > 0` |
| P2-11 | Appels internes fire-and-forget sans retry |
| P2-12 | Migration `stripe_disputes` non appliquée en prod (todo.md) |

---

## CORRECTIONS RECOMMANDÉES

### P0 — À traiter immédiatement

1. **`admin/revenus/page.tsx:10`** — Remplacer `COMMISSION_RATE = 0.20` par `0.25`
2. **`proprio/dashboard/revenus/page.tsx`** — Filtrer par `total_price_cents * 0.75` OU ajouter colonne `owner_transfer_cents` et l'utiliser
3. **`webhooks/stripe/route.ts`** — Ajouter handler `charge.refunded` → mise à jour `payment_status = "refunded"`

### P1 — À traiter dans la semaine

4. **`webhooks/stripe/route.ts:41`** — Remplacer SELECT+INSERT par upsert : `supabase.from("stripe_events_processed").upsert({ event_id, event_type }, { onConflict: "event_id" })`
5. **`webhooks/stripe/route.ts`** — Ajouter handlers `charge.dispute.closed`, `charge.dispute.funds_reinstated`, `charge.dispute.funds_withdrawn` → mise à jour `stripe_disputes.status` + `resolved_at`
6. **`webhooks/stripe/route.ts`** — Ajouter handler `checkout.session.async_payment_failed`
7. **Nouvelle route** `POST /api/stripe/admin-refund` — Refund manuel avec reverse_transfer
8. **Nouvelle page** `/admin/disputes` — UI liste des litiges avec statuts
9. **`lib/stripe/connect.ts:29`** — Accepter `business_type` en paramètre (individual/company)

### P2 — Dette technique

10. Ajouter colonnes `platform_fee_cents` et `owner_transfer_cents` sur `bookings`
11. Persister ces valeurs dans `checkout.session.completed`
12. Ajouter notification Telegram/email sur `charge.dispute.created`
13. Séparer `STRIPE_LIVE_SECRET_KEY` et `STRIPE_TEST_SECRET_KEY`
14. Appliquer la migration `20260526_stripe_disputes.sql` en production

---

## CONCLUSION

L'intégration Stripe Connect est **opérationnelle pour le flux de base** (un client peut réserver, payer, le split se fait, les webhooks de confirmation fonctionnent). Les bugs P0 concernent principalement **l'affichage des revenus** (admin ET proprio voient des chiffres faux) et **la non-synchronisation des refunds externes**. Les P1 sont des trous dans le cycle de vie (disputes non gérées, refund admin absent). Le système est **fonctionnel mais pas fiable pour la production** tant que les P0 ne sont pas corrigés.

**Note** : La migration `stripe_disputes` (P2-12) doit être vérifiée — le `docs/todo.md` indique qu'elle n'est pas encore appliquée.
