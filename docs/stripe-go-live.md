# Kayvila — Tuto passage Stripe en LIVE (Connect + webhooks)

> Rédigé le 2026-07-03, après la campagne de tests Playwright pré-live (43 tests verts,
> voir `tests/stripe-*.spec.ts`). À dérouler dans l'ordre, étape par étape.

---

## 📍 JOURNAL DE BORD — état au 2026-07-05 (session déploiement)

### ✅ Déjà fait
- [x] **43 tests Playwright verts** (double run) : connect, admin-refund, webhooks
      signés HMAC, checkout mocké, checkout live (cartes de test) — commit `f2e1618`
- [x] **Bug P0 corrigé en prod** : trigger `owner_stats` qui bloquait TOUTE création
      de réservation (migration `20260703170000` appliquée)
- [x] **Handler webhook patché** pour accepter 2 secrets
      (`STRIPE_WEBHOOK_SECRET` + `STRIPE_CONNECT_WEBHOOK_SECRET`) — poussé sur main
- [x] **Domaine `kayvila.com` branché sur Vercel** ✅
- [x] **`NEXT_PUBLIC_BASE_URL` = `https://kayvila.com`** ✅
- [x] **Emails Resend corrigés** : `RESEND_FROM_EMAIL` formaté correctement (« Kayvila <…> » au lieu de « <…> »)
- [x] **Endpoint webhook n°1 créé dans Stripe** (périmètre « votre compte »,
      10 événements) — URL : `https://kayvila.com/api/webhooks/stripe`
- [x] **Endpoint webhook n°2 créé dans Stripe** (périmètre « comptes connectés »,
      `v2.core.account.updated`) — URL : `https://kayvila.com/api/webhooks/stripe`
- [x] **Toutes les clés live récupérées** (`sk_live_…`, `whsec_…`)

### ⚠️ À FAIRE — passage en production
1. [ ] **Mettre les clés live sur Vercel** (voir tableau ci-dessous)
2. [ ] **Redéployer** (les env changées ne s'appliquent qu'au prochain déploiement)
3. [ ] **Stripe → endpoint n°1 → « Envoyer un événement test »** → doit répondre 200
4. [ ] **Purger les comptes Connect de test** en base (SQL au §6)
5. [ ] **Onboarder un proprio pilote** puis dérouler la checklist §7
       à diagnostiquer, possiblement flake de compilation)

> Alternative si tu veux être live AVANT la bascule du domaine (« chemin B ») :
> éditer l'URL de l'endpoint Stripe → `https://kayvila.vercel.app/api/webhooks/stripe`
> (le `whsec_` ne change pas) et mettre `NEXT_PUBLIC_BASE_URL` sur `kayvila.vercel.app`,
> puis refaire les deux dans l'autre sens le jour du domaine.

---

## 0. Comment marche l'argent chez Kayvila (rappel)

- **Stripe Connect Express** : chaque propriétaire a son propre compte Stripe Express
  (`acct_…`), créé par Kayvila via l'API (`lib/stripe/connect.ts`).
- **Paiement = destination charge** : le client paie la totalité sur le compte
  plateforme Kayvila ; Stripe transfère automatiquement la part du propriétaire
  (`transfer_data.destination`) et retient la commission
  (`application_fee_amount`).
- **Répartition** (`calculateTransferAmounts`) :
  - Propriétaire : **78 %** des nuitées (réservation directe) / 80 % (OTA)
  - Kayvila : **22 %** des nuitées (direct) / 20 % (OTA) + **100 %** frais de ménage + **100 %** frais de service
- **Garde-fou codé** : une villa avec propriétaire dont l'onboarding Connect n'est
  pas terminé → `POST /api/booking` répond **503** « Le propriétaire doit finaliser
  son compte de paiement ». Personne ne peut payer une villa sans compte destinataire.
- **Remboursements admin** : `POST /api/stripe/admin-refund` fait un refund avec
  `reverse_transfer: true` → la part du propriétaire est automatiquement reprise.

---

## 1. Activer le compte Stripe en mode Live

1. Dashboard Stripe → bascule **« Mode test » → « Mode live »** (interrupteur en haut).
2. Si ce n'est pas déjà fait : **compléter l'activation du compte** (KYC de la
   plateforme) : infos société KARIBLOOM, IBAN de payout Kayvila, justificatifs.
   Tant que ce n'est pas validé, pas de paiements live.
3. Vérifier dans **Paramètres → Informations publiques** : nom affiché sur le relevé
   bancaire du client (ex. `KAYVILA` plutôt que `KARIBLOOM` si tu veux), site web,
   email de support. C'est ce que verront les clients sur leur relevé CB.

## 2. Activer Stripe Connect en Live

1. Dashboard live → **Connect → Paramètres** (ou « Commencer avec Connect » si
   premier passage).
2. Type de comptes : **Express** (c'est ce que crée le code :
   `stripe.accounts.create({ type: "express" })`).
3. **Branding Connect** (Paramètres Connect → Branding) : logo + couleurs Kayvila —
   c'est ce que le propriétaire voit pendant son onboarding bancaire.
4. Vérifier que la capability **transfers** est disponible (le code la demande à la
   création du compte).

> ⚠️ Les comptes Express créés en mode **test** n'existent pas en live. Tous les
> proprios déjà « onboardés » en test devront refaire un onboarding réel
> (voir étape 6).

## 3. Récupérer les clés Live

Dashboard live → **Développeurs → Clés API** :

| Clé | Format | Usage |
|---|---|---|
| Clé secrète | `sk_live_…` | `STRIPE_SECRET_KEY` (serveur) |
| Clé publiable | `pk_live_…` | seulement si une variable `NEXT_PUBLIC_STRIPE_*` existe sur Vercel |

> Ne jamais coller ces clés dans le code ni dans un fichier committé — Vercel uniquement.

## 4. Créer les webhooks Live (l'étape critique)

> ⚠️ **Stripe impose UN endpoint par périmètre** : « Événements de votre compte »
> OU « Événements des comptes connectés » — pas les deux sur le même endpoint.
> Il faut donc créer **2 endpoints** vers la MÊME URL. Le handler accepte les deux
> secrets de signature (`STRIPE_WEBHOOK_SECRET` + `STRIPE_CONNECT_WEBHOOK_SECRET`).

Navigation : Dashboard live → **Développeurs** (ou icône Workbench en bas à
gauche) → onglet **Webhooks** → « Ajouter un endpoint » / « Créer une destination
d'événements ».

**URL (la même pour les deux endpoints) :**
```
https://kayvila.vercel.app/api/webhooks/stripe
```
(remplacer par le domaine custom si le site est servi sur kayvila.com)

### Endpoint n°1 — « Événements de votre compte » (paiements, litiges, refunds)

Au début de la sélection des événements, laisser le périmètre par défaut
(**Votre compte**) et sélectionner ces **10 événements** (utilise le champ de
recherche, tape par ex. `checkout.session.` puis `charge.dispute.`) :
`checkout.session.completed`, `checkout.session.expired`,
`checkout.session.async_payment_failed`, `payment_intent.succeeded`,
`payment_intent.payment_failed`, `charge.refunded`, `charge.dispute.created`,
`charge.dispute.closed`, `charge.dispute.funds_reinstated`,
`charge.dispute.funds_withdrawn`.

→ copier son **secret de signature** `whsec_…` → variable `STRIPE_WEBHOOK_SECRET`.

### Endpoint n°2 — « Événements des comptes connectés » (onboarding proprios)

Recréer un endpoint, même URL, mais choisir le périmètre
**« Comptes connectés »** (sélecteur en haut de l'écran de choix des événements —
appelé « Événements provenant de » / "Listen to events on Connected accounts"
selon la version de l'UI).

Sélectionner **2 événements** : `account.updated` et
`account.application.deauthorized`.

> 🔎 **Si tu ne vois pas l'option « Comptes connectés »** : c'est que Connect
> n'est pas encore activé en mode live → retourne à l'étape 2 (menu Connect →
> Commencer). L'option n'apparaît qu'une fois Connect actif.
>
> 🔎 **Si tu ne trouves pas d'événements « Connect »** dans la liste : ils
> n'existent pas sous ce nom — cherche `account.updated` (catégorie **Account**).

→ copier son **secret de signature** `whsec_…` (différent du premier) →
variable `STRIPE_CONNECT_WEBHOOK_SECRET`.

> ℹ️ Filet de sécurité : même si cet endpoint n°2 manque, l'app marque quand même
> l'onboarding complété au retour du proprio (`?connect=success` →
> `POST /api/stripe/connect-verify`). L'endpoint n°2 apporte le temps réel +
> la détection de déconnexion du compte (`deauthorized`).

**Récap des 12 événements** (exactement ceux que gère
`app/api/webhooks/stripe/route.ts`) :

| Catégorie | Événement | Ce que fait le handler |
|---|---|---|
| Paiement | `checkout.session.completed` | booking → confirmed/paid, emails client+admin+proprio, création compte client auto |
| Paiement | `checkout.session.expired` | booking pending → cancelled (+ auto-refund si déjà payé) |
| Paiement | `checkout.session.async_payment_failed` | booking → cancelled / failed (SEPA, etc.) |
| Paiement | `payment_intent.succeeded` | filet de sécurité paiements asynchrones → paid/confirmed |
| Paiement | `payment_intent.payment_failed` | payment_status → failed |
| Remboursement | `charge.refunded` | payment_status → refunded ou partially_refunded |
| Litige | `charge.dispute.created` | insert `stripe_disputes` + **email d'alerte admin** |
| Litige | `charge.dispute.closed` | statut final + resolved_at |
| Litige | `charge.dispute.funds_reinstated` | statut → won |
| Litige | `charge.dispute.funds_withdrawn` | statut → lost |
| Connect | `account.updated` | onboarding proprio terminé → `stripe_connect_onboarding_completed = true` + email de bienvenue proprio |
| Connect | `account.application.deauthorized` | proprio déconnecte son compte → flag onboarding remis à false (villa redevient non réservable) |

Après création : ouvrir l'endpoint → **« Secret de signature »** → copier le
`whsec_…`. **Chaque endpoint a son propre secret** — celui du mode test ne
fonctionnera pas en live.

## 5. Mettre à jour Vercel (production)

Vercel → projet Kayvila → Settings → Environment Variables (scope **Production**) :

1. `STRIPE_SECRET_KEY` = `sk_live_…`
2. `STRIPE_WEBHOOK_SECRET` = le `whsec_…` de l'endpoint n°1 (votre compte)
3. `STRIPE_CONNECT_WEBHOOK_SECRET` = le `whsec_…` de l'endpoint n°2 (comptes connectés)
4. (si présente) `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` = `pk_live_…`
5. **Redéployer** (les env changées ne s'appliquent qu'au prochain déploiement) :
   Deployments → ⋯ → Redeploy, ou un push sur main.

> ⚠️ Ne PAS toucher `.env.local` : le local reste en `sk_test_` pour que les tests
> Playwright (`--project=live-stripe`) continuent de tourner sans risque.

## 6. Onboarder les propriétaires (en vrai cette fois)

Parcours côté proprio (déjà codé, testé) :

1. Le proprio se connecte à son dashboard → bouton **Stripe Connect**
   (`components/dashboard/proprio/StripeConnectButton.tsx`).
2. `POST /api/stripe/connect-onboarding` crée son compte Express live + renvoie un
   lien `https://connect.stripe.com/…` → il remplit IBAN, identité, infos fiscales.
3. Au retour (`/dashboard?connect=success`), deux mécanismes marquent l'onboarding
   complété (redondance voulue) :
   - le webhook `account.updated` (temps réel), **ou**
   - `POST /api/stripe/connect-verify` (vérification à la demande).
4. Tant que ce n'est pas fait → ses villas répondent 503 à la réservation.

Suivi côté admin : onglet Stripe de la fiche propriétaire
(`components/dashboard/admin/OwnerStripeTab.tsx`).

**Checklist de bascule** : lister les proprios avec `stripe_connect_account_id`
commençant par un compte de test et remettre à zéro si besoin :

```sql
-- comptes créés en mode test à re-onboarder en live
SELECT id, email, stripe_connect_account_id, stripe_connect_onboarding_completed
FROM profiles
WHERE stripe_connect_account_id IS NOT NULL;

-- reset (à faire APRÈS bascule des clés live, avant de relancer les proprios)
UPDATE profiles
SET stripe_connect_account_id = NULL,
    stripe_connect_onboarding_completed = false
WHERE stripe_connect_account_id LIKE 'acct_%';  -- affiner à la main si mix test/live
```

> Les `acct_` de test sont inutilisables en live : si on ne les purge pas, le code
> croira le proprio onboardé et Stripe refusera le transfert au paiement.

## 7. Vérifications post-bascule (dans l'ordre)

1. **Webhook** : Dashboard → l'endpoint → « Envoyer un événement test » →
   `checkout.session.completed` → doit répondre **200**.
   (Un 400 « signature failed » = mauvais `whsec_` sur Vercel ou pas redéployé.)
2. **Garde 503** : ouvrir la page de réservation d'une villa dont le proprio n'est
   pas encore onboardé live → le paiement doit être refusé proprement.
3. **Onboarding pilote** : faire onboarder UN proprio (ou un compte à toi) →
   vérifier `stripe_connect_onboarding_completed = true` en base + email reçu.
4. **Réservation réelle à petit prix** : villa du proprio pilote, payer avec une
   vraie carte → vérifier : page succès, booking confirmed en base, email de
   confirmation, et dans Stripe : la charge, le transfert vers le proprio et la
   commission (`application_fee`).
5. **Remboursement** : admin → rembourser cette réservation →
   vérifier refund + `reverse_transfer` (le transfert proprio est repris) +
   `payment_status = refunded` (via le webhook `charge.refunded`).
6. **Payouts** : Connect → compte du proprio → vérifier le calendrier de virement
   (par défaut quotidien après délai initial de 7-14 jours — normal au début).

## 8. Dépannage rapide

| Symptôme | Cause probable | Fix |
|---|---|---|
| Webhook 400 « signature failed » | `STRIPE_WEBHOOK_SECRET` = secret test ou pas redéployé | recopier le `whsec_` live + redeploy |
| Webhook 500 « Stripe not configured » | `STRIPE_SECRET_KEY`/`STRIPE_WEBHOOK_SECRET` absente en prod | vérifier les env Vercel scope Production |
| Onboarding jamais marqué complété en temps réel | endpoint n°2 (comptes connectés) absent ou `STRIPE_CONNECT_WEBHOOK_SECRET` manquante | créer l'endpoint n°2 + renseigner la variable (le retour `?connect=success` reste un fallback) |
| Option « Comptes connectés » invisible à la création du webhook | Connect pas activé en live | activer Connect (étape 2) puis recréer l'endpoint |
| Paiement refusé « No such destination » | `acct_` de test resté en base après bascule | reset profil (étape 6) + re-onboarding |
| Toutes les résas échouent en erreur base | régression du trigger stats (fixé le 2026-07-03) | vérifier `supabase/migrations/20260703170000_fix_invalidate_owner_stats_trigger.sql` appliquée |
| 503 sur toutes les villas d'un proprio | onboarding non fini (comportement voulu) | relancer le proprio, vérifier `connect-verify` |

## 9. Rollback (si besoin de repasser en test)

1. Vercel : remettre `STRIPE_SECRET_KEY` = `sk_test_…` et `STRIPE_WEBHOOK_SECRET` =
   secret de l'endpoint **test** → redeploy.
2. Rien d'autre à toucher : le code est identique en test et en live.

## 10. Ce qui est déjà couvert par les tests (référence)

- `tests/stripe-connect.spec.ts` — onboarding/verify (auth 401 + appel Stripe réel)
- `tests/stripe-webhooks.spec.ts` — 14 tests, signatures HMAC réelles : signature,
  idempotence, expired→cancelled en base, disputes
- `tests/stripe-admin-refund.spec.ts` — gardes 307/400/409 du refund admin
- `tests/stripe-checkout-mocked.spec.ts` — UX checkout (CGV, 503 Connect, 429, espace client)
- `tests/stripe-checkout-live.spec.ts` — paiement réussi / refusé / abandon sur la
  vraie page Stripe (mode test)

Commande de rejeu complet (serveur local frais requis) :
```bash
PORT=3001 NEXT_PUBLIC_BASE_URL=http://localhost:3001 npm run dev   # terminal 1
PLAYWRIGHT_BASE_URL=http://localhost:3001 npx playwright test --project=mocked --project=stripe-api
PLAYWRIGHT_BASE_URL=http://localhost:3001 npx playwright test --project=live-stripe --workers=1
```
