# Kayvila — Tuto passage Stripe en LIVE (Connect + webhooks)

> Rédigé le 2026-07-03, après la campagne de tests Playwright pré-live (43 tests verts,
> voir `tests/stripe-*.spec.ts`). À dérouler dans l'ordre, étape par étape.

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

## 4. Créer l'endpoint webhook Live (l'étape critique)

Dashboard live → **Développeurs → Webhooks → Ajouter un endpoint**.

**URL :**
```
https://kayvila.vercel.app/api/webhooks/stripe
```
(remplacer par le domaine custom si le site est servi sur kayvila.com)

**Écoute des événements — IMPORTANT** : au moment de choisir les événements, Stripe
propose « Événements de votre compte » et « Événements des comptes connectés ».
👉 **Cocher AUSSI l'écoute des comptes connectés** sur ce même endpoint : les
événements `account.*` (onboarding des proprios) arrivent depuis LEURS comptes
Express, pas depuis le compte plateforme. Un seul endpoint = un seul secret de
signature = configuration simple.

**Les 12 événements à sélectionner** (exactement ceux que gère
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
2. `STRIPE_WEBHOOK_SECRET` = le `whsec_…` de l'endpoint live créé à l'étape 4
3. (si présente) `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` = `pk_live_…`
4. **Redéployer** (les env changées ne s'appliquent qu'au prochain déploiement) :
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
| Onboarding jamais marqué complété | endpoint sans écoute « comptes connectés » | éditer l'endpoint → activer les événements des comptes connectés |
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
