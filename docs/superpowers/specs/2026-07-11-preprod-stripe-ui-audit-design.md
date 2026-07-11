# Audit préprod Stripe + UI — Design d'exécution

**Date** : 2026-07-11
**Source** : `~/Downloads/preprod-stripe-ui-audit.md` (mission Ken)
**Nature** : diagnostic uniquement — aucun correctif appliqué. Ken décide des corrections.

## Contexte

Passage en production Stripe imminent ; le site est en test mode. Il faut auditer
l'intégralité du flux paiement et l'affichage de toutes les pages avant de basculer
les clés live.

## Décisions de cadrage

- **Environnement** : local (dev port 3001). Code du repo + `.env.local` pour les
  variables. Pas d'audit des vars Vercel (non lisibles d'ici).
- **Pages authentifiées** : auditées via les comptes de test Kayvila validés
  (locataire pour l'espace client, proprio pour le dashboard).
- **Approche** : séquentielle, sans sous-agents.
  1. Mission 1 (Stripe) en lecture de code directe — le contexte cumulé entre
     fichiers (schéma ↔ API ↔ webhook) est essentiel — plus exécution des
     4 suites de tests Stripe existantes.
  2. Mission 2 (UI) ensuite, serveur dev 3001 + Playwright : chaque page en
     desktop 1280px puis mobile 375px, console vérifiée à chaque navigation.

## Périmètre

### Mission 1 — Flux paiement Stripe
Tel que listé dans le doc source, sections 1.1 à 1.8 :
variables d'env (préfixes `sk_test_`/`pk_test_`, absence de `sk_live_` dans tout
le repo, webhook secret), `app/api/booking/route.ts` (CSRF, rate limiting,
validation `BookingRequestSchema`, disponibilité, calcul prix, session Checkout,
métadonnées, URLs, erreurs, email client), `app/api/webhooks/stripe/route.ts`
(signature, événements, idempotence, logs), page succès, Stripe Connect
(`lib/stripe/connect.ts` + compatibilité commission), types
(`types/stripe.ts`), exécution de `tests/stripe-checkout-mocked.spec.ts`,
`tests/stripe-webhooks.spec.ts`, `tests/stripe-connect.spec.ts`,
`tests/stripe-admin-refund.spec.ts`, et checklist pré-prod (webhook public,
CGV accessible + version trackée, email de confirmation).

### Mission 2 — UI
Les 22 pages du tableau source, en desktop 1280 et mobile 375. Par page :
overflow horizontal, texte tronqué, images, boutons (44px min mobile),
formulaires, contrastes, spacing, loaders/skeletons, états erreur et vide,
footer, z-index, console (0 erreur hors tiers, pas d'appels API 404/500).
Points spécifiques : format prix checkout, AvailabilityCalendar, chatbot,
graphiques dashboard (NaN/undefined), login, navigation mobile espace client.

## Livrable

`docs/audits/audit-preprod-2026-07-11.md` :
1. Flux paiement — chaque point ✅/❌ avec description du problème
2. UI — chaque page inspectée, bugs listés avec description précise
   (screenshots Playwright enregistrés à l'appui)
3. Critiques bloquants pour la prod listés en premier
4. Recommandations priorisées

## Hors périmètre

- Tout correctif de code (diagnostic pur)
- Audit des variables d'environnement Vercel/production
- Dark mode (non supporté par le site)
- `npm run build` (interdit sur ce projet — dev server uniquement)
