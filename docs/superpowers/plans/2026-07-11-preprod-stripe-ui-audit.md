# Audit préprod Stripe + UI — Plan d'exécution

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produire `docs/audits/audit-preprod-2026-07-11.md` — diagnostic complet du flux Stripe et de l'UI des 22 pages, sans appliquer aucun correctif.

**Architecture:** Audit séquentiel en local. Mission 1 (Stripe) : lecture de code + exécution des suites de tests existantes. Mission 2 (UI) : navigation Playwright (MCP) sur le dev server port 3001, desktop 1280 puis mobile 375, consoles vérifiées. Chaque tâche écrit sa section directement dans le rapport.

**Tech Stack:** Next.js 14 (App Router), Stripe, Supabase, vitest (unit), @playwright/test (e2e), Playwright MCP pour l'inspection visuelle.

## Global Constraints

- **AUCUN correctif appliqué** — diagnostic uniquement, Ken décide des corrections.
- **Ne jamais lancer `npm run build`** (règle projet).
- Dev server : `PORT=3001 npm run dev` depuis `diamant-noir/`. `playwright.config.ts` lit `PLAYWRIGHT_BASE_URL` (défaut 3000) → toujours exporter `PLAYWRIGHT_BASE_URL=http://localhost:3001` pour les suites e2e.
- **Ne jamais copier de valeur de secret dans le rapport** — uniquement le préfixe (`sk_test_`, `pk_test_`, `whsec_`) et la présence/absence.
- Rapport : `docs/audits/audit-preprod-2026-07-11.md`. Screenshots : `docs/audits/screens-2026-07-11/` (nommage `<route-slug>-<desktop|mobile>.png`).
- Comptes de test : identifiants dans la mémoire projet `reference_test_accounts.md` (admin / proprio / locataire) — ne pas les recopier dans le rapport.
- Structure finale du rapport : 1) Critiques bloquants, 2) Flux paiement point par point ✅/❌, 3) UI page par page, 4) Recommandations priorisées.

---

### Task 1: Squelette du rapport + démarrage du serveur

**Files:**
- Create: `docs/audits/audit-preprod-2026-07-11.md`
- Create: `docs/audits/screens-2026-07-11/` (dossier)

**Interfaces:**
- Produces: le fichier rapport avec sections vides que les tâches 2-11 remplissent ; le dev server sur 3001 utilisé par les tâches 7, 9, 10, 11.

- [ ] **Step 1: Créer le squelette du rapport**

```markdown
# Audit préprod Stripe + UI — 2026-07-11

> Diagnostic uniquement — aucun correctif appliqué. Environnement : local (dev 3001), code du repo + .env.local.

## 🔴 Critiques (bloquants prod)
<!-- rempli en Task 12 -->

## Mission 1 — Flux paiement Stripe
### 1.1 Variables d'environnement
### 1.2 Booking API
### 1.3 Webhook Stripe
### 1.4 Page Succès
### 1.5 Stripe Connect
### 1.6 Types Stripe
### 1.7 Tests existants
### 1.8 Checklist pré-prod

## Mission 2 — UI
### Pages publiques
### Espace client
### Dashboard proprio
### Console navigateur

## Recommandations priorisées
<!-- rempli en Task 12 -->
```

- [ ] **Step 2: Créer le dossier screenshots**

Run: `mkdir -p "docs/audits/screens-2026-07-11"`

- [ ] **Step 3: Démarrer le dev server en arrière-plan**

Run (background) : `PORT=3001 npm run dev`
Puis vérifier : `curl -s -o /dev/null -w "%{http_code}" http://localhost:3001` → attendu `200` (boucler jusqu'à 8×2s si nécessaire).

---

### Task 2: Audit variables d'environnement (1.1)

**Files:**
- Read: `.env.local`, `.env.local.example`
- Modify: `docs/audits/audit-preprod-2026-07-11.md` (section 1.1)

**Interfaces:**
- Produces: verdicts ✅/❌ pour les 5 points de la section 1.1 du rapport.

- [ ] **Step 1: Vérifier les préfixes des clés dans .env.local**

Run: `grep -E "^(STRIPE_SECRET_KEY|NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY|STRIPE_WEBHOOK_SECRET|STRIPE_CONNECT)" .env.local | sed -E 's/=(sk_test_|pk_test_|sk_live_|pk_live_|whsec_)?.*/=\1<défini>/'`

(la sortie ne montre que le préfixe de chaque clé, jamais la valeur)

Vérifier : `STRIPE_SECRET_KEY` commence par `sk_test_` ; `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` par `pk_test_` ; `STRIPE_WEBHOOK_SECRET` par `whsec_` et défini. Noter la présence/absence de vars `STRIPE_CONNECT_*`.

- [ ] **Step 2: Grep sk_live sur tout le repo**

Run: `grep -rn "sk_live" . --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=.git --exclude-dir=.worktrees`
Attendu : aucune occurrence (ou uniquement dans de la doc/exemples — à signaler quand même).

- [ ] **Step 3: Écrire la section 1.1 du rapport**

Chaque point ✅/❌ avec le constat (préfixes uniquement, jamais les valeurs).

---

### Task 3: Audit Booking API (1.2)

**Files:**
- Read: `app/api/booking/route.ts` (complet), plus tout module importé pertinent (schéma de validation, rate limiter, CSRF, calcul de prix, disponibilité)
- Modify: `docs/audits/audit-preprod-2026-07-11.md` (section 1.2)

**Interfaces:**
- Consumes: rien.
- Produces: verdicts ✅/❌ pour les 10 points de la section 1.2 ; liste des fichiers support identifiés (réutilisée par Task 6 pour la cohérence des types).

- [ ] **Step 1: Lire `app/api/booking/route.ts` en entier et suivre les imports**

Pour chaque point, citer la ligne (`route.ts:NN`) qui le prouve ou noter son absence :
1. Validation CSRF avant toute opération
2. Rate limiting sur l'IP
3. Validation avec `BookingRequestSchema`
4. Vérification disponibilité villa (anti double-booking)
5. Calcul du prix : nuitées + ménage + frais de service
6. Session Stripe Checkout `mode: 'payment'`
7. Métadonnées Stripe contiennent l'ID réservation
8. URLs succès/annulation (`baseUrl + '/success'`…)
9. Catch des `StripeError`
10. `customer_email` passé à Stripe pour le reçu

- [ ] **Step 2: Écrire la section 1.2 du rapport**

Un tableau point → ✅/❌ → référence `fichier:ligne` → description du problème si ❌.

---

### Task 4: Audit Webhook Stripe (1.3)

**Files:**
- Read: `app/api/webhooks/stripe/route.ts` (complet)
- Modify: `docs/audits/audit-preprod-2026-07-11.md` (section 1.3)

**Interfaces:**
- Produces: verdicts section 1.3 + liste exhaustive des événements traités (réutilisée par Task 7 pour croiser avec les tests webhook).

- [ ] **Step 1: Lire le fichier et vérifier chaque point**

1. `stripe.webhooks.constructEvent` avec le secret — signature vérifiée AVANT tout traitement
2. Lister TOUS les `case`/événements traités (`checkout.session.completed`, refund, dispute…)
3. Pour `checkout.session.completed` : mise à jour statut réservation en BDD, déclenchement email de confirmation, idempotence (session déjà traitée → pas de double traitement)
4. Logs en place (succès et erreurs)
5. Vérifier qu'aucun middleware/auth ne bloque l'endpoint (route publique, signature seule)

- [ ] **Step 2: Écrire la section 1.3 du rapport**

Inclure la liste des événements sous forme de tableau événement → action → idempotent oui/non.

---

### Task 5: Audit Page Succès (1.4)

**Files:**
- Read: `app/success/page.tsx` (complet)
- Modify: `docs/audits/audit-preprod-2026-07-11.md` (section 1.4)

**Interfaces:**
- Produces: verdicts section 1.4 ; comportement attendu sans `session_id` (revérifié visuellement en Task 9).

- [ ] **Step 1: Lire et vérifier**

1. Récupération de `session_id` depuis les query params
2. Appel Stripe (ou API interne) pour confirmer le statut réel — pas une simple confiance au param
3. Affichage des détails de réservation
4. Cas `session_id` absent : erreur propre ou redirect (pas de crash)

- [ ] **Step 2: Écrire la section 1.4 du rapport**

---

### Task 6: Audit Stripe Connect + Types (1.5, 1.6)

**Files:**
- Read: `lib/stripe/connect.ts`, `lib/stripe/connect.test.ts`, `types/stripe.ts`, `types/stripe.test.ts`
- Modify: `docs/audits/audit-preprod-2026-07-11.md` (sections 1.5, 1.6)

**Interfaces:**
- Consumes: liste des fichiers support de Task 3 (où `BookingRequestSchema` est consommé).
- Produces: verdicts sections 1.5 et 1.6.

- [ ] **Step 1: Connect — calcul des transferts**

Lire `lib/stripe/connect.ts` : le calcul des montants est-il cohérent avec le modèle Kayvila (commission 22 %, encaissement direct par les propriétaires via plateformes — vérifier si Connect est réellement branché dans le flux ou du code mort) ?

- [ ] **Step 2: Types — cohérence schéma ↔ API**

Comparer champ par champ `BookingRequestSchema` (`types/stripe.ts`) avec ce que `app/api/booking/route.ts` consomme (Task 3). Vérifier la couverture des cas succès/erreur/remboursement.

- [ ] **Step 3: Écrire les sections 1.5 et 1.6 du rapport**

---

### Task 7: Exécution des tests existants (1.7)

**Files:**
- Modify: `docs/audits/audit-preprod-2026-07-11.md` (section 1.7)

**Interfaces:**
- Consumes: dev server 3001 (Task 1) ; liste des événements webhook (Task 4).
- Produces: résultats pass/fail par suite dans la section 1.7.

- [ ] **Step 1: Tests unitaires (vitest — couvre connect.test.ts et stripe.test.ts)**

Run: `npm test`
Attendu : toutes les suites passent. Noter tout échec avec le message exact.

- [ ] **Step 2: Suites Playwright mocked + stripe-api**

Run: `PLAYWRIGHT_BASE_URL=http://localhost:3001 npx playwright test --project=mocked --project=stripe-api --reporter=list`

Couvre `stripe-checkout-mocked.spec.ts`, `stripe-webhooks.spec.ts`, `stripe-connect.spec.ts`, `stripe-admin-refund.spec.ts` (+ cgv-checkout et booking du projet mocked — les inclure au rapport, c'est pertinent préprod).
Attendu : tout passe. Noter chaque échec : nom du test, message, fichier.

Ne PAS lancer le projet `live-stripe` (hors périmètre test mode local).

- [ ] **Step 3: Écrire la section 1.7 du rapport**

Tableau suite → nb tests → pass/fail → détail des échecs.

---

### Task 8: Checklist pré-prod Stripe (1.8)

**Files:**
- Read: résultats Tasks 2-7 ; `grep -rn "CGV_VERSION" app/ lib/ types/ --include="*.ts" --include="*.tsx"` ; le template email de confirmation (suivre l'import depuis le webhook, Task 4)
- Modify: `docs/audits/audit-preprod-2026-07-11.md` (section 1.8)

**Interfaces:**
- Consumes: verdicts des tâches 2-7.
- Produces: la checklist 1.8 consolidée, dont les points ❌ alimentent les Critiques (Task 12).

- [ ] **Step 1: Consolider les 7 points**

1. Pas de `sk_live_` (Task 2)
2. Webhook accessible publiquement, signature seule (Task 4)
3. Webhook Dashboard Stripe configuré → **non vérifiable en local** : le marquer explicitement « à vérifier manuellement dans le Dashboard Stripe avant bascule » (idem point 4, events configurés)
5. Email de confirmation : template existe + envoi branché dans le webhook
6. CGV accessible depuis le checkout (lien dans la session ou la page /book)
7. `CGV_VERSION` tracké dans les métadonnées réservation

- [ ] **Step 2: Écrire la section 1.8**

---

### Task 9: Audit UI — pages publiques (2.1 partiel + 2.3 + 2.4)

**Files:**
- Create: screenshots dans `docs/audits/screens-2026-07-11/`
- Modify: `docs/audits/audit-preprod-2026-07-11.md` (section « Pages publiques »)

**Interfaces:**
- Consumes: dev server 3001.
- Produces: constats par page ; screenshots nommés `<slug>-desktop.png` / `<slug>-mobile.png`.

- [ ] **Step 1: Pour chaque page publique, desktop 1280×900 puis mobile 375×812**

Pages : `/`, `/villas`, `/villas/[id]` (prendre la 1ère villa publiée de la liste), `/villas/comparer`, `/book`, `/success` (sans `session_id` → vérifier l'erreur propre, point Task 5), `/prestations`, `/qui-sommes-nous`, `/soumettre-ma-villa`, `/login`.

Procédure par page (Playwright MCP) :
1. `browser_resize` au viewport cible, `browser_navigate` vers la route
2. `browser_console_messages` → noter toute erreur (hors warnings tiers) et tout appel API 404/500
3. Overflow horizontal (mobile) : `browser_evaluate` → `() => document.documentElement.scrollWidth > document.documentElement.clientWidth`
4. `browser_snapshot` + screenshot → vérifier la checklist 2.2 : texte tronqué, images cassées/alt, boutons ≥44px mobile, labels formulaires, contrastes, spacing, loaders, états erreur/vide, footer en bas, z-index
5. Screenshot enregistré dans `docs/audits/screens-2026-07-11/`

- [ ] **Step 2: Points spécifiques publics (2.3)**

- `/book` : format des prix (€, pas de décalage), AvailabilityCalendar sélectionnable
- Chatbot (ouvrir la bulle sur `/`) : scroll fonctionnel, pas de bug d'affichage
- `/login` : messages d'erreur visibles (soumettre un mauvais mot de passe)

- [ ] **Step 3: Écrire la section « Pages publiques » du rapport**

Un bloc par page : `✅ RAS` ou liste des bugs (description précise + screenshot).

---

### Task 10: Audit UI — espace client (locataire)

**Files:**
- Create: screenshots dans `docs/audits/screens-2026-07-11/`
- Modify: `docs/audits/audit-preprod-2026-07-11.md` (section « Espace client »)

**Interfaces:**
- Consumes: dev server 3001 ; compte locataire de test (mémoire `reference_test_accounts.md`).
- Produces: constats par page espace client.

- [ ] **Step 1: Se connecter avec le compte locataire sur `/login`**

- [ ] **Step 2: Auditer chaque page, même procédure que Task 9 (desktop + mobile)**

`/espace-client`, `/espace-client/reservations/[id]` (1ère réservation dispo — si aucune, noter « état vide » et vérifier son rendu), `/espace-client/messagerie`, `/espace-client/documents`, `/espace-client/conciergerie`, `/espace-client/checklist`, `/espace-client/favoris`, `/espace-client/profil`, `/espace-client/notifications`, `/espace-client/livret`.

Point spécifique 2.3 : navigation mobile de l'espace client (bottom sheet ou équivalent) fonctionnelle.

- [ ] **Step 3: Écrire la section « Espace client » du rapport**

---

### Task 11: Audit UI — dashboard proprio

**Files:**
- Create: screenshots dans `docs/audits/screens-2026-07-11/`
- Modify: `docs/audits/audit-preprod-2026-07-11.md` (section « Dashboard proprio »)

**Interfaces:**
- Consumes: dev server 3001 ; compte proprio de test.
- Produces: constats dashboard.

- [ ] **Step 1: Se déconnecter, se reconnecter avec le compte proprio**

- [ ] **Step 2: Auditer `/dashboard` et `/dashboard/revenus` (desktop + mobile)**

Même procédure que Task 9. Point spécifique 2.3 : graphiques et chiffres — aucun `NaN`, `undefined`, ou montant vide.

- [ ] **Step 3: Écrire la section « Dashboard proprio » du rapport**

---

### Task 12: Synthèse — critiques, recommandations, commit

**Files:**
- Modify: `docs/audits/audit-preprod-2026-07-11.md` (sections Critiques + Recommandations)

**Interfaces:**
- Consumes: toutes les sections des tâches 2-11.

- [ ] **Step 1: Remplir « 🔴 Critiques (bloquants prod) »**

Tout ❌ qui bloque la bascule live : sécurité paiement (signature, idempotence, double booking), clé live présente, webhook inaccessible, email de confirmation cassé, bug UI empêchant de réserver ou payer.

- [ ] **Step 2: Remplir « Recommandations priorisées »**

P0 (avant bascule) / P1 (semaine de bascule) / P2 (confort). Inclure les points « à vérifier manuellement dans le Dashboard Stripe » comme actions Ken.

- [ ] **Step 3: Relecture du rapport complet**

Vérifier : chaque point du doc source a un verdict ; aucun secret recopié ; les ❌ ont une description actionnable ; structure = critiques d'abord.

- [ ] **Step 4: Arrêter le dev server et committer**

```bash
git add docs/audits/audit-preprod-2026-07-11.md docs/audits/screens-2026-07-11/
git commit -m "docs(audit): rapport audit préprod Stripe + UI 2026-07-11"
```
