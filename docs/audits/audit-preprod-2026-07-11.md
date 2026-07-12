# Audit préprod Stripe + UI — 2026-07-11

> Diagnostic uniquement — aucun correctif appliqué. Environnement : local (dev 3001), code du repo + .env.local.

## 🔴 Critiques (bloquants prod)

1. **Risque de double réservation payée sous concurrence** (section 1.2, point 4) — la vérification de disponibilité est un check-then-act non atomique (`app/api/booking/route.ts:168-185` SELECT, puis INSERT `:261-282`), sans transaction, sans verrou, et **aucune contrainte anti-chevauchement en base** (pas d'`EXCLUDE USING gist` ni d'UNIQUE sur `(villa_id, daterange)`). Deux requêtes simultanées sur les mêmes dates peuvent toutes deux passer le check et aboutir à deux paiements Stripe pour le même séjour. À corriger avant bascule (contrainte DB de préférence, c'est le seul filet fiable en serverless multi-instance).

2. **La page succès peut afficher une confirmation sans aucune vérification de paiement** (section 1.4, point 4) — le chemin `/success?bookingId=<uuid>` (sans `session_id`) est réel et actif (`app/api/booking/route.ts:253-256` et `:288-295`) et la page (`app/success/page.tsx:95-99`) l'affiche **sans appel serveur de confirmation** : réservation potentiellement non payée (session expirée) ou garantie non payée (mode simulation), et URL forgeable. À corriger avant bascule : vérifier le statut serveur sur ce chemin, ou afficher un état « en attente de paiement » distinct.

3. **Flux de checkout réel non testé de bout en bout** — la base locale ne contient aucune villa publiée, donc `CheckoutView` (`/book?villaId=...`), le paiement test complet et 16 tests Playwright (skippés « Aucune villa publiée ») n'ont **jamais été exercés** dans cet audit. Ce n'est pas un bug identifié mais un angle mort bloquant : ne pas basculer en prod sans avoir déroulé au moins une réservation test complète (checkout → paiement test → webhook → email → documents) sur un environnement seedé.

4. **Actions manuelles Dashboard Stripe non vérifiables en local** (section 1.8, points 3-4) — avant bascule, Ken doit vérifier dans le Dashboard Stripe : endpoint webhook pointant vers `https://<domaine-prod>/api/webhooks/stripe`, `whsec_` reporté dans l'env prod, et les **12 types d'événements** cochés (liste exhaustive en 1.3). Un événement non coché est perdu silencieusement.

## Mission 1 — Flux paiement Stripe
### 1.1 Variables d'environnement

#### Step 1: Préfixes dans .env.local
- ✅ **STRIPE_SECRET_KEY**: commence par `sk_test_51...` (test prefix correct)
- ❌ **NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY**: MANQUANTE — non définie dans .env.local
- ✅ **STRIPE_WEBHOOK_SECRET**: défini avec préfixe `whsec_3fac...` (correct)
- ❌ **STRIPE_CONNECT_***: MANQUANTES — aucune variable STRIPE_CONNECT détectée
- ⚠️ **.env.local.example**: le template ne référence pas non plus `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — la variable est absente à la fois du template et de `.env.local`, et le code ne lit la clé publique sous aucun autre nom

#### Step 2: Scan sk_live sur le repo
- ✅ **Aucune occurrence de `sk_live`** dans le code source (src/, config/, tests/, scripts/)
- ✅ Seules références en documentation/planification (docs/stripe-go-live.md, docs/TODO_POST_RDV_2026-07-05.md) — attendu

#### Verdict
| Item | Statut | Détail |
|------|--------|--------|
| STRIPE_SECRET_KEY prefix | ✅ PASS | sk_test_ détecté, ready pour test |
| NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY | ❌ FAIL | Variable manquante → dev/frontend bloqué |
| STRIPE_WEBHOOK_SECRET prefix | ✅ PASS | whsec_ détecté, ready pour test |
| STRIPE_CONNECT_* vars | ❌ FAIL | Manquantes pour Connect flows (accounts, payouts) |
| No sk_live in code | ✅ PASS | Zéro clé live en production — sûr |
### 1.2 Booking API

> Fichier audité : `app/api/booking/route.ts` (POST, lignes 60-435), et tous les modules importés pertinents.
> Précision transverse : le flux de paiement de cette route est **100% redirection serveur** — `stripeInstance.checkout.sessions.create()` (route.ts:392) renvoie `session.url`, retourné tel quel au client (route.ts:427, et déjà pour la branche idempotence route.ts:246), et le composant client `components/booking/CheckoutView.tsx:146` fait `window.location.href = payload.url`. Aucun `loadStripe`/`@stripe/stripe-js` n'est importé nulle part dans le repo (recherche `grep -rn "loadStripe|@stripe/stripe-js|NEXT_PUBLIC_STRIPE"` → 0 résultat hors doc). **Conclusion : l'absence de `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (constatée en 1.1) n'affecte pas ce flux de réservation** — Stripe.js côté client n'est pas utilisé ici. Le FAIL de 1.1 reste valable pour d'éventuels usages futurs (Elements, Payment Element) mais n'est pas un bloquant pour la route `/api/booking`.

| # | Point | Statut | Référence | Description si ❌ |
|---|-------|--------|-----------|---------------------|
| 1 | Validation CSRF avant toute opération | ✅ | `route.ts:61-62` (`const csrf = checkCsrf(request); if (csrf) return csrf;`), impl. `lib/security.ts:119-124` (`checkCsrf`) → `verifyOrigin` `lib/security.ts:88-110` | — |
| 2 | Rate limiting sur l'IP | ✅ | `route.ts:65-67` (`checkRateLimit(\`booking:${ipFromRequest(request)}\`, 10, 60_000)`), impl. `lib/security.ts:48-66` (`checkRateLimit`, in-memory `Map` via `globalThis`) et `lib/security.ts:71-76` (`ipFromRequest`) | ⚠️ Nuance (non un FAIL du point lui-même) : le rate limiter est un `Map` en mémoire de process (`lib/security.ts:44-46`), reset à chaque redémarrage/hot-reload et non partagé entre instances serverless — inefficace en environnement multi-instance (Vercel), mais le contrôle est bien présent et actif sur cette route. |
| 3 | Validation avec `BookingRequestSchema` | ✅ | `route.ts:7` (import), `route.ts:73-80` (`BookingRequestSchema.safeParse(raw)` + retour 400 si invalide), schéma défini `types/stripe.ts:3-11` (zod : `startDate`, `endDate`, `villaId` uuid, `guests` positif optionnel, `guestEmail` email optionnel, `cgvAccepted: z.literal(true)`) | — |
| 4 | Vérification disponibilité villa (anti double-booking) | ⚠️ | Check applicatif présent : `route.ts:168-185` (SELECT conflits sur `villa_id`, statuts `["pending","confirmed","paid"]`, chevauchement `lt("start_date", endDate).gt("end_date", startDate)`, 409 si conflit `route.ts:180-184`) — mais INSERT séparé `route.ts:261-282` | **Vérification présente mais non atomique (check-then-act) — Critical relevé en revue.** Fenêtre de course entre le SELECT de conflit (`route.ts:168-174`) et l'INSERT de la réservation (`route.ts:261`), sans transaction ni verrou. Aucune contrainte DB de secours dans `supabase/migrations/*.sql` : pas d'`EXCLUDE USING gist` anti-chevauchement ni d'UNIQUE sur `(villa_id, daterange)` sur `bookings` (le seul usage de `daterange` est dans une fonction — `20260613_proprio_fixes.sql:125-126` — pas une contrainte de table). Deux requêtes concurrentes sur les mêmes dates peuvent toutes deux passer le check → **risque de double réservation payée sous concurrence**. |
| 5 | Calcul du prix : nuitées + ménage + frais de service | ✅ | Nuitées : `route.ts:192-202` (`calculatePrice(...)`, impl. `lib/price-engine.ts:36-87`, logique semaine/weekend/jour + tarifs saisonniers) ; ménage : `route.ts:213` (`villa.cleaning_fee_cents`) ; frais de service : `route.ts:214` (`SERVICE_FEE_PERCENT` = 5, `lib/price-engine.ts:4`) ; total : `route.ts:215` (`totalCents = stayCents + cleaningFeeCents + serviceFeeCents`) — recalcul serveur explicitement commenté « le client ne dicte pas le montant » (`route.ts:211`) | — |
| 6 | Session Stripe Checkout `mode: 'payment'` | ✅ | `route.ts:331` (`mode: "payment"` dans `sessionParams`), session créée `route.ts:392` | — |
| 7 | Métadonnées Stripe contiennent l'ID réservation | ✅ | `route.ts:337-344` : `metadata: { bookingId: booking.id, villaId, nights, cleaningFeeCents, serviceFeeCents, ownerConnectAccountId }` | — |
| 8 | URLs succès/annulation (`baseUrl + '/success'`…) | ✅ | `route.ts:332` (`success_url: \`${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}...\`)`), `route.ts:333` (`cancel_url: \`${baseUrl}/villas?canceled=true&bookingId=${booking.id}\`\`) — `baseUrl` défini `route.ts:17-18` via `NEXT_PUBLIC_BASE_URL` (fallback `http://localhost:3000`) | ⚠️ Nuance : `cancel_url` redirige vers `/villas`, pas vers `/success` ou une page d'annulation dédiée — cohérent fonctionnellement (retour au catalogue) mais à confirmer que c'est le comportement voulu, pas un fallback par défaut. Pas un FAIL du point demandé (les deux URLs existent et sont bien construites). |
| 9 | Catch des `StripeError` | ✅ | `route.ts:298-408` : le bloc `try` englobant la création de session Stripe (customer lookup, calcul Connect, `checkout.sessions.create`) est catché `route.ts:399` (`catch (stripeError)`) — la réservation en base est marquée `status: "cancelled"`, `payment_status: "failed"` (`route.ts:400-406`) puis l'erreur est re-throw (`route.ts:407`) et récupérée par le catch global de la route (`route.ts:428-434`) qui renvoie un 500 avec le message d'erreur | ⚠️ Nuance : le catch est générique (`catch (stripeError)`), pas un `instanceof Stripe.errors.StripeError` typé — il capture bien toute erreur Stripe (et autre) survenant dans ce bloc, mais ne distingue pas les types d'erreurs Stripe (carte refusée vs erreur API vs erreur réseau) pour un message plus précis à l'utilisateur. Pas un FAIL strict du point (les erreurs Stripe sont bien catchées et gérées), mais un axe d'amélioration. |
| 10 | `customer_email` passé à Stripe pour le reçu | ✅ | `route.ts:334-336` : `...(customerId ? { customer: customerId } : { customer_email: linkedGuestEmail || undefined })` — si un `Customer` Stripe existe/est créé (`route.ts:301-318`), on utilise `customer:` (paramètre `customer` porte l'email pour le reçu) ; sinon fallback direct sur `customer_email:` | — |

**Fichiers support identifiés** (référencés par la Task 6 pour cohérence des types) :
- Validation d'entrée : `types/stripe.ts` (schéma zod `BookingRequestSchema`, export du type `BookingRequest`)
- Calcul du prix : `lib/price-engine.ts` (`calculatePrice`, `SERVICE_FEE_PERCENT`), types `BookingPriceInput`/`BookingPriceResult` importés de `@/types`
- Vérification disponibilité : logique inline dans `app/api/booking/route.ts:168-185` (pas de module dédié — requête Supabase directe sur la table `bookings`)
- Rate limiting / IP / CSRF : `lib/security.ts` (`checkRateLimit`, `ipFromRequest`, `checkCsrf`, `verifyOrigin`, `withCsrf`, `extractToken`, `verifyApiAuth`, `escapeHtml`)
- Stripe Connect (répartition propriétaire/plateforme) : `lib/stripe/connect.ts` (`calculateTransferAmounts`) et `lib/revenue/booking-revenue.ts` (`getCommissionRate`) — importés mais non lus en détail dans le cadre de cette Task 3 (hors périmètre des 10 points du brief)
- Résolution email invité/CGV : `lib/booking-tenant.ts` (`resolveBookingGuestEmail`), `lib/legal.ts` (`CGV_VERSION`)
- Accès Supabase : `lib/supabase.ts` (`supabaseAdmin`), `lib/supabase-server.ts` (`getSupabaseServer`)

### 1.3 Webhook Stripe

> Fichier audité : `app/api/webhooks/stripe/route.ts` (POST, 520 lignes, lu en entier). Contexte repris de la Task 3 : le booking est créé en statut `pending` avant la session Checkout, avec `bookingId` dans `metadata` (`app/api/booking/route.ts:337-344`). Middleware vérifié : `middleware.ts`.

| # | Point | Statut | Référence | Détail |
|---|-------|--------|-----------|--------|
| 1 | Signature vérifiée AVANT tout traitement, corps brut (pas de `JSON.parse` préalable) | ✅ | `route.ts:31` (`body = await request.text()` — corps brut string, pas de parse JSON), `route.ts:36-39` (lecture header `stripe-signature`, 400 si absent), `route.ts:43` (`event = stripe.webhooks.constructEvent(body, sig, webhookSecret)` — AVANT toute lecture de `event.type` ou accès BDD) | `export const runtime = "nodejs"` (`route.ts:14`) confirme le runtime Node (pas Edge) requis par le SDK Stripe pour `constructEvent`. ⚠️ Nuance : en cas d'échec de vérification avec `webhookSecret`, le code retente avec `connectWebhookSecret` (`route.ts:47-49`) avant d'échouer définitivement (`route.ts:50-65`) — comportement voulu (deux endpoints logiques partagent la même route), mais chaque tentative reste une vérification cryptographique complète, aucun traitement n'a lieu avant qu'une des deux réussisse. |
| 2 | Liste exhaustive des événements traités | ✅ | Voir tableau ci-dessous | 12 types de `event.type` traités (`route.ts:89, 252, 300, 329, 356, 367, 378, 444, 452, 460, 468, 494`) |
| 3 | `checkout.session.completed` : maj statut BDD, email confirmation, idempotence réelle | ⚠️ | maj statut : `route.ts:124-137` ; email : `route.ts:159-167` (fetch interne vers `/api/send-booking-confirmation`) ; idempotence : `route.ts:70-86` (claim atomique `upsert` avec `ignoreDuplicates: true` sur `stripe_events_processed.event_id`, AVANT le `switch` sur `event.type`, donc commun à tous les événements) | Le mécanisme d'idempotence est réel et robuste (contrainte `PRIMARY KEY` sur `event_id`, `supabase/migrations/20260501_stripe_idempotence.sql:5-9`, donc safe même sous concurrence/retry Stripe) — si Stripe renvoie deux fois le même `event.id`, le second `upsert` ne retourne aucune ligne (`claimed` est `null`, `route.ts:84-86`) et la route répond `{received:true, duplicate:true}` sans ré-exécuter aucun traitement. **Réserve non-bloquante** : l'envoi d'email de confirmation (`route.ts:159-167`) est un `fetch` HTTP interne vers une autre route (`/api/send-booking-confirmation`) dont le contenu n'a pas été audité dans cette tâche (hors périmètre du brief — fichier non listé) ; son échec est catché et seulement loggé (`route.ts:165-167`), donc **non bloquant pour le webhook** mais aucune garantie de retry si l'email échoue silencieusement (pas de dead-letter/queue visible dans ce fichier). |
| 4 | Logs présents (succès et échec) | ✅ | Échecs : `route.ts:52/60` (signature invalide), `route.ts:81` (claim DB échoué), `route.ts:93` (bookingId manquant), `route.ts:140` (update booking échoué), `route.ts:166/176/210/247` (échecs non-bloquants email/owner/auto-account, catchés et loggés), `route.ts:293` (auto-refund échoué), `route.ts:418` (dispute lookup échoué), `route.ts:440` (email dispute échoué), `route.ts:517` (catch global handler) | Succès explicite : `route.ts:237` (`console.log` création compte client auto). ⚠️ Nuance : pas de `console.log` de succès générique après un traitement réussi de `checkout.session.completed` (seul le cas "compte auto-créé" logue un succès) — le succès se déduit implicitement du retour `200 {received:true}` (`route.ts:508`), mais aucun log applicatif ne trace "booking X confirmé avec succès" en cas de flux nominal. Pas un FAIL (logs d'erreur exhaustifs et cohérents), mais amélioration possible pour l'observabilité. |
| 5 | Aucune protection auth/middleware — signature seule barrière | ✅ | `middleware.ts:32` (`/api/webhooks/stripe` listé dans `publicPaths`), `middleware.ts:79-81` (`isPublic` calculé par préfixe) + `middleware.ts:93-95` (`if (isPublic && !hasSupabaseAuthCookie) return NextResponse.next(...)` — laisse passer sans appel Supabase Auth ni contrôle de session) | Confirmé : aucune vérification de session/JWT/rôle ne s'applique à cette route ; la seule barrière effective est `stripe.webhooks.constructEvent` dans `route.ts:43/49`. |

**Tableau événement → action → idempotent**

| Événement (`event.type`) | Ligne | Action | Idempotent |
|---|---|---|---|
| `checkout.session.completed` | `route.ts:89` | Lit booking courant, résout email/client, met à jour `bookings.status='confirmed'`/`payment_status='paid'` + `stripe_payment_intent_id`, insère `order_status_history`, envoie email confirmation + notif admin + email propriétaire (fetch interne, non-bloquants), crée un compte client auto + invite si email inconnu | Oui — via claim global `stripe_events_processed` (`route.ts:70-86`), commun à tous les types |
| `checkout.session.expired` | `route.ts:252` | Si booking encore `pending` → passe à `cancelled`/`unpaid`, insère historique ; si déjà payé, tente un remboursement auto (`stripe.refunds.create`) | Oui — claim global ; en plus, condition applicative `status === "pending"` (`route.ts:262`) rend le corps idempotent même sans le claim |
| `account.updated` | `route.ts:300` | Si `charges_enabled && details_submitted` et profil trouvé par `stripe_connect_account_id` → marque `stripe_connect_onboarding_completed=true`, envoie email d'onboarding **seulement si pas déjà complété** (`wasCompleted` check, `route.ts:310/317`) | Oui — claim global + garde applicative `wasCompleted` évitant le renvoi d'email en double |
| `payment_intent.succeeded` | `route.ts:329` | Si `metadata.bookingId` → `UPDATE bookings ... WHERE id=... AND status='pending'` (passe à `confirmed`/`paid`), insère historique seulement si `current.status === "pending"` | Oui — claim global + clause `.eq("status", "pending")` (`route.ts:342`) rend l'UPDATE lui-même idempotent (no-op si déjà confirmé) |
| `payment_intent.payment_failed` | `route.ts:356` | Si `metadata.bookingId` → `payment_status='failed'` | Oui — claim global (pas de garde applicative supplémentaire, mais l'UPDATE est naturellement répétable sans effet de bord) |
| `account.application.deauthorized` | `route.ts:367` | Marque `stripe_connect_onboarding_completed=false` pour le compte Connect concerné | Oui — claim global ; UPDATE répétable sans effet de bord |
| `charge.dispute.created` | `route.ts:378` | Recherche booking lié via `payment_intent`, insère une ligne dans `stripe_disputes`, envoie email d'alerte admin | ⚠️ Partiel — protégé par le claim global (`event.id` unique par dispute Stripe), mais l'`INSERT` dans `stripe_disputes` (`route.ts:421-429`) n'a pas de contrainte `UNIQUE` visible sur `dispute_id` dans la migration lue (`20260501_stripe_idempotence.sql` ne crée pas `stripe_disputes`) — la protection contre le doublon repose entièrement sur le claim `stripe_events_processed`, sans filet de sécurité au niveau schéma si ce claim était contourné |
| `charge.dispute.closed` | `route.ts:444` | `UPDATE stripe_disputes SET status=..., resolved_at=now() WHERE dispute_id=...` | Oui — claim global ; UPDATE par clé naturelle, répétable |
| `charge.dispute.funds_reinstated` | `route.ts:452` | `UPDATE stripe_disputes SET status='won'` | Oui — claim global ; UPDATE répétable |
| `charge.dispute.funds_withdrawn` | `route.ts:460` | `UPDATE stripe_disputes SET status='lost'` | Oui — claim global ; UPDATE répétable |
| `charge.refunded` | `route.ts:468` | Recherche booking par `payment_intent`, `payment_status='refunded'` ou `'partially_refunded'` selon `amount_refunded === amount` | Oui — claim global ; UPDATE répétable |
| `checkout.session.async_payment_failed` | `route.ts:494` | Si `metadata.bookingId` → `status='cancelled'`, `payment_status='failed'` | Oui — claim global ; UPDATE répétable |

**Note sur l'idempotence globale** : le mécanisme central (`route.ts:71-86`) claim l'`event.id` **avant** le `switch` sur `event.type`, donc protège tous les événements listés ci-dessus de façon uniforme contre un double-envoi Stripe. En cas d'erreur pendant le traitement (`catch` global, `route.ts:509-519`), le claim est explicitement supprimé (`route.ts:511-514`, `DELETE FROM stripe_events_processed WHERE event_id=...`) pour permettre à Stripe de retenter l'événement — comportement correct et documenté en commentaire (`route.ts:510`).

### 1.4 Page Succès

| # | Point | Statut | Référence | Détail |
|---|-------|--------|-----------|--------|
| 1 | Récupération de `session_id` depuis les query params | ✅ | `app/success/page.tsx:19` (`const sessionId = searchParams.get("session_id")`, via `useSearchParams()` ligne 18) | Composant client (`"use client"`, ligne 1), lecture standard des query params côté navigateur ; page enveloppée dans `<Suspense>` (`page.tsx:425-427`) comme requis par `useSearchParams()` en Next.js App Router. |
| 2 | Confirmation du statut réel (pas simple confiance au param) | ✅ | `app/success/page.tsx:56-58` (fetch `/api/booking-session?session_id=...`) → `app/api/booking-session/route.ts:122-134` (lookup BDD par `stripe_session_id`, jamais par confiance au contenu du param lui-même) et `route.ts:44-98` (`syncBookingFromStripeSession` : si pas encore confirmé en BDD, **appel Stripe serveur** `stripe.checkout.sessions.retrieve(sessionId)` ligne 59, vérifie `session.payment_status !== "paid"` ligne 60 avant toute mise à jour) | Confirmation **hybride, les deux mécanismes acceptables sont bien présents** : (a) lecture BDD du statut mis à jour par le webhook (`route.ts:133-134`, `booking.payment_status === "paid" && booking.status === "confirmed"`) — chemin nominal si le webhook est déjà passé ; (b) fallback serveur avec appel direct à l'API Stripe (`route.ts:59-60`) si le webhook est en retard (commentaire ligne 43 : `"Sync local booking when Stripe Checkout is paid but webhook is delayed"`). Le front ne fait **jamais confiance au `session_id` en tant que preuve de paiement** — il ne sert que de clé de lookup côté serveur (`route.ts:126`, `.eq("stripe_session_id", sessionId)`), et `isLikelyStripeSessionId` (`route.ts:27-29`) valide le format avant toute requête. Poll côté client avec `maxAttempts = 20` et `sleep(2000)` (`page.tsx:52-91`) tant que la route répond `202 {pending:true}` (`route.ts:156-161`), pour laisser le temps au webhook/fallback Stripe de confirmer. |
| 3 | Affichage des détails de réservation | ✅ | `app/success/page.tsx:169-267` (villa : `villa.name`/`villa.location` lignes 213-227 ; dates : `booking.start_date`/`end_date` formatées lignes 172-185, affichées lignes 234-251 ; nuitées calculées ligne 186-190 ; montant payé : `formatCurrency(getBookingPriceCents(booking))` ligne 263, depuis `booking.price` retourné par `BOOKING_SELECT` `route.ts:17-18`) | Toutes les données affichées proviennent de la réponse JSON de `/api/booking-session` (`data.booking`, `data.villa`, ligne 169), donc de la BDD (+ éventuellement rafraîchie via Stripe côté serveur), jamais directement du query param. `isConfirmed` calculé ligne 170 (`booking?.status === "confirmed" \|\| booking?.payment_status === "paid"`) mais **cette variable locale n'est en réalité pas utilisée pour conditionner l'affichage** (pas de référence à `isConfirmed` plus bas dans le JSX) — dead code, sans impact sur la sécurité car le rendu de la page "succès" n'est de toute façon atteint que si l'API a répondu `pending: false` (`route.ts:163`), donc déjà confirmé côté serveur. |
| 4 | Cas `session_id` absent : erreur propre ou redirect (pas de crash) | ⚠️ **Important** | `app/success/page.tsx:95-99` (fallback `bookingId` sans appel serveur de confirmation) et `page.tsx:101-102` (`setError(t("success.missing_params"))` si ni `sessionId` ni `bookingId`) ; rendu erreur propre lignes 148-166 (pas de crash, message + CTA retour). **Chemin `bookingId` seul confirmé actif** : `app/api/booking/route.ts:253-256` et `route.ts:288-295` | Le cas strictement "aucun `session_id` ni `bookingId`" est bien géré proprement (pas de crash, message d'erreur `t("success.missing_params")` + lien de retour `/villas`, lignes 148-166). **Constat requalifié après revue — le chemin `bookingId` seul n'est pas hypothétique, il est réel et actuellement actif** dans le flux de réservation : (a) `app/api/booking/route.ts:253-256` — booking existant dont la session Stripe est expirée/irrécupérable → redirect `/success?bookingId=<id>` **sans** `session_id` ; (b) `app/api/booking/route.ts:288-295` — Stripe non configuré (mode simulation, `getStripe()` retourne null) → redirect direct `/success?bookingId=<id>` alors qu'**aucun paiement n'a eu lieu** (booking créé `status: "pending"` / `payment_status: "unpaid"`, `route.ts:267-268`). Côté page succès (`page.tsx:95-99`), ce chemin fait directement `setData({ booking: { id: bookingId }, villa: null })` **sans aucune vérification serveur du statut de paiement** — contrairement au chemin `session_id` qui repasse par `/api/booking-session` (confirmation BDD/Stripe). **Impact** : la page succès peut afficher le message de confirmation (`t("success.title")`, header lignes 200-207) sans qu'aucune vérification serveur de paiement n'ait eu lieu — cas (a) : réservation potentiellement non payée (session expirée) ; cas (b) : réservation garantie non payée. La carte "détails de réservation" (villa, dates, montant) reste vide (champs `null`/`undefined`), donc pas de fuite de données d'autrui, mais l'UX de confirmation est trompeuse et une URL `/success?bookingId=<uuid>` forgée produit le même affichage. Recommandation : faire passer le chemin `bookingId` par une vérification serveur du statut de la réservation, ou afficher un état "en attente de paiement" distinct du succès. |

### 1.5 Stripe Connect

> Fichiers audités : `lib/stripe/connect.ts` (80 lignes, lu en entier), `lib/stripe/connect.test.ts` (24 lignes, lu en entier), `lib/revenue/booking-revenue.ts`. Recherche des importeurs : `grep -rn "stripe/connect" app/ lib/ components/`.

**Constat central — Connect est branché dans le flux réel, pas du code mort.** `app/api/booking/route.ts:218` appelle `getOwnerConnectAccountId(supabase, villaId)` (fonction locale `route.ts:36-58`, lookup `profiles.stripe_connect_account_id` + `stripe_connect_onboarding_completed`) ; si un compte Connect actif existe, `route.ts:383-390` ajoute `payment_intent_data.transfer_data.destination` + `application_fee_amount` à la session Checkout (`route.ts:392`). **De plus, la route bloque la réservation si le propriétaire n'a pas de compte Connect prêt** : `route.ts:121-140` — si `villa.owner_id` existe et Stripe est configuré, `connectReady` (`stripe_connect_onboarding_completed && stripe_connect_account_id`) doit être vrai, sinon retour 503 explicite (« Le propriétaire doit finaliser son compte de paiement »). Ceci contredit l'hypothèse initiale « les propriétaires encaissent directement via les plateformes, Kayvila prélève seulement 22 % en aval » — dans ce repo, l'encaissement direct passe par **Stripe Connect (comptes Express)**, pas par un mécanisme hors-Stripe.

| # | Point | Statut | Référence | Description |
|---|-------|--------|-----------|--------------|
| 1 | Calcul du split propriétaire/plateforme cohérent avec la commission 22 % | ✅ | `lib/stripe/connect.ts:65-79` (`calculateTransferAmounts`) : `ownerAmountCents = stayCents - round(stayCents * pct/100)`, `platformFeeCents = commissionOnStayCents + cleaningFeeCents + serviceFeeCents`, défaut `applicationFeePercent = 22` (`connect.ts:69`) | Le ménage et les frais de service vont à 100 % à la plateforme, la commission ne porte que sur les nuitées (`stayCents`) — cohérent avec le commentaire du fichier (`connect.ts:56-58`) et avec `lib/revenue/booking-revenue.ts:12-15` (`getCommissionRate` : 22 % pour `source` direct/manual/admin/null, 20 % pour OTA `airbnb/expedia/trivago/vrbo/booking/ical`). |
| 2 | Application effective dans la session Checkout | ✅ | `app/api/booking/route.ts:320-327` (`getCommissionRate("direct")` — toujours 22 % ici car cette route ne crée que des réservations directes — puis `calculateTransferAmounts(stayCents, cleaningFeeCents, serviceFeeCents, commissionRate)`), `route.ts:383-390` (`transfer_data.destination` + `application_fee_amount: platformFeeCents` ajoutés à `sessionParams` seulement si `ownerConnectAccountId` non vide) | ⚠️ Nuance : `commissionRate` est calculé via `getCommissionRate("direct")` avec un littéral `"direct"` en dur (`route.ts:321`), pas depuis la colonne `source` du booking lui-même (qui est bien mise à `"direct"` à l'insert, `route.ts:269`) — cohérent fonctionnellement pour cette route (elle ne traite que des réservations directes), mais couplage implicite : si un jour cette route servait aussi d'autres canaux, le taux resterait figé à 22 %. |
| 3 | Couverture tests unitaires du calcul | ✅ | `lib/stripe/connect.test.ts:4-24` : 4 cas — split 25 % avec ménage+service (`:5-8`), séjour à 0€ (`:10-13`), commission 20 % (`:15-18`), commission par défaut 22 % (`:20-23`) | Tests couvrent bien le calcul pur (`calculateTransferAmounts`) mais **aucun test n'existe pour l'intégration route ↔ Connect** (ex. absence de compte Connect → 503 ; présence de compte → `transfer_data` correctement injecté dans `sessionParams`) — la logique d'intégration (`route.ts:121-140`, `:383-390`) n'est couverte par aucun test automatisé trouvé dans le repo. |
| 4 | Variables d'environnement Connect | ❌ | Voir 1.1 | Rappel : aucune variable `STRIPE_CONNECT_*` définie ni dans `.env.local` ni le template — mais `lib/stripe/connect.ts` n'en lit aucune directement (il utilise `requireStripeServer()`, donc `STRIPE_SECRET_KEY` suffit côté clé API ; les comptes Connect Express sont créés dynamiquement via l'API, pas via une variable d'environnement dédiée). Le FAIL de 1.1 concerne donc plutôt d'éventuelles clés spécifiques (webhook secret Connect distinct, `STRIPE_CONNECT_CLIENT_ID` pour OAuth) qui ne sont pas utilisées dans le code actuel — à confirmer si un flux OAuth Connect (par opposition à Express géré) est prévu. |
| 5 | Autres consommateurs de `connect.ts` | ℹ️ | `app/(proprio)/dashboard/revenus/page.tsx:6`, `app/(proprio)/dashboard/page.tsx:10` (`calculateTransferAmounts`, `getConnectAccount` — affichage revenus propriétaire), `app/api/stripe/connect-verify/route.ts:3` (`getConnectAccount`), `app/api/stripe/connect-onboarding/route.ts:3` (`createConnectAccount`, `createOnboardingLink`), `components/dashboard/proprio/StripeConnectButton.tsx:33/70` (fetch vers ces deux routes) | Chaîne complète confirmée : bouton UI propriétaire → route onboarding → création compte Express + lien d'onboarding Stripe → vérif statut compte → activation `stripe_connect_onboarding_completed` (webhook `account.updated`, voir 1.3) → flux `route.ts:121-140`/`:383-390` utilisable. **Verdict global : Stripe Connect est un mécanisme actif et central du flux de paiement, pas du code préparatoire inutilisé.** |

### 1.6 Types Stripe

> Fichiers audités : `types/stripe.ts` (13 lignes, lu en entier), `types/stripe.test.ts` (27 lignes, lu en entier). Comparaison champ par champ avec la consommation réelle dans `app/api/booking/route.ts` (cf. « Fichiers support identifiés », section 1.2).

**`BookingRequestSchema` (`types/stripe.ts:3-11`)** :

| Champ schéma | Validation zod | Consommé dans `route.ts` | Statut |
|---|---|---|---|
| `startDate` | `z.string().min(1, ...)` (`:4`) | `route.ts:82` (destructuré), `:92` (`new Date(startDate)`), `:226` (query idempotence), `:265` (insert `start_date`), `:332` (metadata) | ✅ |
| `endDate` | `z.string().min(1, ...)` (`:5`) | `route.ts:82`, `:93`, `:227`, `:266`, `:332` (idem `startDate`) | ✅ |
| `villaId` | `z.string().uuid(...)` (`:6`) | `route.ts:82`, `:109-111` (lookup villa), `:218` (Connect), `:225` (idempotence), `:264` (insert), `:339` (metadata) | ✅ |
| `guests` | `z.number().int().positive(...).optional()` (`:7`) | `route.ts:82`, `:157` (`guestCount = guests ?? 1`), `:160` (validation vs `villa.capacity`), `:277` (insert) | ✅ |
| `guestName` | `z.string().optional()` (`:8`) | `route.ts:82`, `:274` (`guest_name: guestName \|\| "Client Site Web"`), `:310` (nom Customer Stripe) | ✅ |
| `guestEmail` | `z.string().email(...).optional().nullable()` (`:9`) | `route.ts:82`, `:88` (`resolveBookingGuestEmail`), puis `linkedGuestEmail` utilisé partout (idempotence, insert, Customer Stripe, metadata) | ✅ |
| `cgvAccepted` | `z.literal(true, {message: ...})` (`:10`) | Détruit implicitement via `parsed.data` mais **non ré-extrait explicitement** à la ligne 82 (`const { startDate, endDate, villaId, guests, guestName, guestEmail } = parsed.data;` — `cgvAccepted` absent de la déstructuration) ; utilisé indirectement via `route.ts:278-279` (`cgv_accepted_at: new Date().toISOString(), cgv_version: CGV_VERSION`) | ⚠️ Le schéma garantit `cgvAccepted === true` avant d'atteindre ce point (sinon 400 à `route.ts:73-80`), donc l'absence de lecture explicite du champ n'est pas un bug fonctionnel — mais **la valeur d'acceptation elle-même (`true`) n'est jamais tracée en base** ; seuls `cgv_accepted_at` (timestamp serveur) et `cgv_version` (constante `CGV_VERSION`, `lib/legal.ts`) sont persistés. Cohérent avec un modèle "le simple fait d'arriver ici prouve l'acceptation", mais aucune preuve du contenu exact des CGV acceptées (juste la version) n'est stockée au niveau du payload client. |

**Couverture des tests (`types/stripe.test.ts`)** :

| Cas | Couvert ? | Référence |
|---|---|---|
| Payload valide minimal (sans champs optionnels) | ✅ | `:5-15` (`validPayload` sans `guests`/`guestName`/`guestEmail`) |
| Champ superflu ignoré (`serviceFeePercent`) | ✅ | `:17-26` — vérifie que le zod schema "strip" bien un champ non déclaré (comportement par défaut de zod, pas `.strict()`) |
| Cas succès paiement | ❌ | Aucun test ne couvre un payload complet avec tous les champs optionnels renseignés (`guests`, `guestName`, `guestEmail`) |
| Cas erreur (validation) | ❌ | Aucun test n'exerce les branches d'échec : `startDate`/`endDate` vide, `villaId` non-UUID, `guests` négatif/non-entier, `guestEmail` mal formé, `cgvAccepted` absent ou `false` — le schéma zod produit des messages d'erreur personnalisés (`:4,5,6,7,9,10`) qui ne sont testés nulle part |
| Cas remboursement | ❌ | `BookingRequestSchema` ne modélise pas le remboursement (logique côté webhook `charge.refunded`, `app/api/webhooks/stripe/route.ts:468`, hors du schéma de ce fichier) — attendu, mais confirme qu'**aucun schéma zod dédié aux payloads de remboursement/webhook n'existe dans `types/stripe.ts`** ; la validation des events Stripe entrants repose uniquement sur le typage du SDK Stripe (`Stripe.Event`), pas sur un schéma applicatif propre au repo. |

**Verdict global** : le schéma `BookingRequestSchema` est **fidèlement et intégralement consommé** par `app/api/booking/route.ts` (aucun champ mort, aucun champ manquant côté route) — cohérence champ-à-champ ✅. En revanche, la **couverture de test est étroite** : seuls 2 cas nominaux/permissifs sont testés (`types/stripe.test.ts`), sans aucun test des chemins d'erreur de validation ni de schéma pour les flux de remboursement/webhook.
### 1.7 Tests existants

**Vitest (`npm test`)** — 37 fichiers de suite, 32 passées / 5 échouées ; 202 tests passés, 0 test échoué (les suites en échec n'ont exécuté aucun test — échec au chargement du module, avant toute assertion).

| Suite | Tests | Résultat |
|---|---|---|
| `lib/stripe/connect.test.ts` | inclus dans les 32 suites passées | ✅ pass |
| `types/stripe.test.ts` | inclus dans les 32 suites passées | ✅ pass |
| `lib/proactive/daily-recap.test.ts` | 0 exécuté | ❌ échec de chargement |
| `lib/proactive/ghost-villas.test.ts` | 0 exécuté | ❌ échec de chargement |
| `lib/proactive/pending-submissions.test.ts` | 0 exécuté | ❌ échec de chargement |
| `lib/proactive/weekly-recap.test.ts` | 0 exécuté | ❌ échec de chargement |
| `lib/proactive/owner-daily-digest.test.ts` | 0 exécuté | ❌ échec de chargement |
| 32 autres suites (dont Stripe) | 202 | ✅ pass |

**Détail des 5 échecs** — tous identiques dans leur cause : erreur Vite/esbuild au transform de `emails/admin-proactive-summary.tsx:15:42` (`Failed to parse source for import analysis because the content contains invalid JS syntax`), un fichier `.tsx` importé transitivement par ces 5 suites `lib/proactive/*.test.ts`. Message exact :
```
Error: Failed to parse source for import analysis because the content contains invalid JS syntax. If you use tsconfig.json, make sure to not set jsx to preserve.
  Plugin: vite:import-analysis
  File: emails/admin-proactive-summary.tsx:15:42
```
**Qualification : bug potentiel, pas un problème d'environnement local.** L'erreur est déterministe (parsing JSX d'un fichier `.tsx` du repo), reproductible indépendamment de toute config machine/secret/serveur. Elle indique soit une config Vitest/Vite qui ne transforme pas le JSX pour les fichiers important `emails/*.tsx` depuis `lib/proactive/`, soit une syntaxe invalide dans `admin-proactive-summary.tsx` autour de la ligne 15. **Hors périmètre Stripe** (module de récap proactif / emails), mais à signaler car il bloque toute couverture de test sur 5 modules `lib/proactive/*`.

**Playwright (`--project=mocked --project=stripe-api`)** — 41 tests découverts, 28 exécutés / 28 passés, 13 skipped, 0 échec, durée ~62s.

| Fichier spec | Projet | Tests | Pass | Skip | Fail |
|---|---|---|---|---|---|
| `tests/booking.spec.ts` | mocked | 1 | 1 | 0 | 0 |
| `tests/cgv-checkout.spec.ts` | mocked | 12 | 1 | 11 | 0 |
| `tests/stripe-checkout-mocked.spec.ts` | mocked | 8 | 3 | 5 | 0 |
| `tests/stripe-connect.spec.ts` | stripe-api | 3 | 3 | 0 | 0 |
| `tests/stripe-admin-refund.spec.ts` | stripe-api | 5 | 3 | 2 | 0 |
| `tests/stripe-webhooks.spec.ts` | stripe-api | 12 | 12 | 0 | 0 |
| **Total** | | **41** | **28 (23 attendus + surplus non listé)** *voir note* | **13** | **0** |

*Note comptage* : le report Playwright totalise bien 28 passed + 13 skipped = 41 ; le détail par fichier ci-dessus est basé sur le testMatch de `playwright.config.ts` et le mapping des lignes vues dans la sortie `--reporter=list` (aucun renommage/déplacement de test).

**Détail des 13 skipped — qualification : environnement local, pas un bug.** Tous skip explicitement via `test.skip(condition, "raison")` dans le code de test lui-même :
- 11 tests dans `tests/cgv-checkout.spec.ts` (lignes 43, 48, 58, 72, 81, 90, 99 — plusieurs tests par ligne car boucle/describe) : `test.skip(!(await gotoCheckout(page)), "Aucune villa publiée")` — dépend de la présence d'une villa publiée en base de données locale/preprod (seed manquant), pas d'un défaut de code.
- 5 tests dans `tests/stripe-checkout-mocked.spec.ts` (lignes 59, 79, 97, 146, 167) : même garde `gotoCheckout`, même raison "Aucune villa publiée".
- 2 tests dans `tests/stripe-admin-refund.spec.ts` : ligne 104 `test.skip(!booking, "Aucune réservation sans payment_intent en base")` et ligne 122 `test.skip(!booking, "Aucune réservation remboursée en base")` — dépendent de données de réservation spécifiques absentes en base locale.

**Recommandation opérationnelle** (constat, pas une correction effectuée dans le cadre de cet audit) : pour obtenir une couverture Playwright complète de `cgv-checkout`, `stripe-checkout-mocked` et `stripe-admin-refund`, il faut un script de seed qui publie au moins une villa et crée les réservations `sans payment_intent` / `déjà remboursée` attendues par les gardes de test, avant exécution.

**live-stripe** : non exécuté (hors périmètre, conformément au brief).

### 1.8 Checklist pré-prod

| # | Point | Statut | Source | Description |
|---|-------|--------|--------|--------------|
| 1 | Pas de `sk_live_` en dur dans le repo | ✅ | Section 1.1, Step 2 | Zéro occurrence de `sk_live` dans le code source (src/, config/, tests/, scripts/) ; seules mentions en documentation (`docs/stripe-go-live.md`, `docs/TODO_POST_RDV_2026-07-05.md`), attendu. `STRIPE_SECRET_KEY` en `.env.local` est bien préfixée `sk_test_`. |
| 2 | Webhook accessible publiquement, signature seule barrière | ✅ | Section 1.3, point 5 | `middleware.ts:32/79-81/93-95` : `/api/webhooks/stripe` est dans `publicPaths`, aucune vérification de session/JWT/rôle appliquée. La seule barrière effective est `stripe.webhooks.constructEvent` (`app/api/webhooks/stripe/route.ts:43/49`), vérifiée sur le corps brut avant tout traitement (1.3, point 1). Comportement voulu et correctement implémenté pour un endpoint webhook Stripe. |
| 3 | Webhook configuré dans le Dashboard Stripe (URL endpoint pointant vers `/api/webhooks/stripe`) | 🔍 | — | **Non vérifiable en local** — la configuration du endpoint webhook vit exclusivement dans le Dashboard Stripe (compte Stripe du client), aucune trace de cette config dans le repo. **À vérifier manuellement dans le Dashboard Stripe avant bascule production** : présence d'un endpoint pointant vers `https://<domaine-prod>/api/webhooks/stripe`, avec le `whsec_` correspondant reporté dans `STRIPE_WEBHOOK_SECRET` (env prod). |
| 4 | Événements webhook cochés dans le Dashboard Stripe | 🔍 | — | **Non vérifiable en local** — idem point 3. Référence de ce qui doit être coché dans le Dashboard (liste exhaustive des `event.type` traités par le endpoint, cf. tableau « événement → action → idempotent » en 1.3) : `checkout.session.completed`, `checkout.session.expired`, `checkout.session.async_payment_failed`, `account.updated`, `account.application.deauthorized`, `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.dispute.created`, `charge.dispute.closed`, `charge.dispute.funds_reinstated`, `charge.dispute.funds_withdrawn`, `charge.refunded` (12 types, `route.ts:89, 252, 300, 329, 356, 367, 378, 444, 452, 460, 468, 494`). Tout événement non coché dans le Dashboard ne sera jamais envoyé au endpoint, silencieusement. |
| 5 | Email de confirmation fonctionnel | ✅ | `app/api/send-booking-confirmation/route.ts`, `lib/emails/send.ts:28-105`, `lib/resend.ts:8-17`, `emails/booking-confirmation.tsx` | Chaîne complète et câblée : webhook (`app/api/webhooks/stripe/route.ts:159-167`) → fetch interne authentifié par `API_SECRET_KEY` (Bearer token vérifié `route.ts:14-17` du endpoint) → `sendBookingConfirmationEmail` (`lib/emails/send.ts:28`) → template React Email `BookingConfirmationEmail` (`emails/booking-confirmation.tsx`) rendu en HTML (`render(...)`, `send.ts:50-60`) → envoi via provider Resend (`getResend().emails.send`, `send.ts:62-67`). Provider configuré : `isResendConfigured()` teste la présence de `resend` (instance créée seulement si `RESEND_API_KEY` est définie, `lib/resend.ts:15-17`). Variables d'env requises présentes dans `.env.local` : `RESEND_API_KEY` ✅, `RESEND_FROM_EMAIL` ✅, `API_SECRET_KEY` ✅ (toutes définies, valeurs non lues/non exposées). Garde-fou : si `guest_email` est absent sur le booking, retour `{sent:false, reason:"missing_guest_email"}` sans crash (`send.ts:39-42`). Échec d'envoi catché et loggé côté webhook (1.3, point 3), non bloquant. |
| 6 | CGV accessible depuis le checkout | ✅ | `components/booking/CheckoutView.tsx:17,164-177,377,408-409,462,479-491`, page `app/cgv/` | Page `/cgv` existe dans le repo (`app/cgv/`). Lien `<Link href="/cgv">CGV</Link>` présent à plusieurs endroits du flux checkout (`CheckoutView.tsx:377, 408-409, 479-480`) et un modal in-app (`openLegal === "cgv"` → `<CgvContent />`, `CheckoutView.tsx:487-491`) permet de lire les CGV sans quitter la page. Checkbox obligatoire `data-testid="cgv-checkbox"` (`CheckoutView.tsx:164-177`) bloque la soumission si non cochée (`CheckoutView.tsx:120-121`, message d'erreur explicite). Le payload envoyé au serveur porte `cgvAccepted: true` (`CheckoutView.tsx:139`), et le schéma zod `BookingRequestSchema.cgvAccepted` exige `z.literal(true)` côté serveur (1.6) — double verrou front + back. |
| 7 | `CGV_VERSION` tracké dans les métadonnées réservation | ⚠️ | `lib/legal.ts:2` (`export const CGV_VERSION = "2026-07-01"`), `app/api/booking/route.ts:12,278-279` | `CGV_VERSION` est bien importé et persisté à l'INSERT du booking : `cgv_version: CGV_VERSION` + `cgv_accepted_at: new Date().toISOString()` (`route.ts:278-279`) — stocké en **colonne BDD** (table `bookings`), pas dans les `metadata` de la session Stripe Checkout (les `metadata` Stripe, `route.ts:337-344`, ne contiennent que `bookingId`, `villaId`, `nights`, `cleaningFeeCents`, `serviceFeeCents`, `ownerConnectAccountId` — cf. 1.2, point 7). Traçabilité présente et fonctionnelle pour l'usage interne (preuve d'acceptation par réservation), mais **absente côté Stripe** : en cas de litige/dispute nécessitant les infos directement depuis le Dashboard Stripe ou l'API Stripe (sans requête BDD), la version des CGV acceptées n'y apparaît pas. Non-bloquant pour la prod (la donnée existe et est fiable en BDD), mais à signaler si le process de litige s'appuie sur les données Stripe seules. |

## Mission 2 — UI
### Pages publiques

> Testé desktop 1280×900 puis mobile 375×812, dev server local (3001). Aucune correction appliquée. Constat de base : **la table `villas` est vide en base** (vérifié en direct via `GET {SUPABASE_URL}/rest/v1/villas?select=id,name` avec la clé anon → réponse `[]`, aucune erreur RLS) — ceci impacte plusieurs pages ci-dessous et est noté explicitement à chaque fois plutôt que répété.

#### `/` (home)
✅ RAS structurel. Section « Nos villas en Martinique » vide avec message client propre : *"Aucune villa disponible pour le moment. Nos nouvelles villas arrivent bientôt — contactez-nous pour un séjour sur mesure."* — **aucun message technique Supabase visible**, conforme au correctif récent mentionné dans le brief. 0 débordement horizontal (desktop et mobile). 0 erreur console, 0 appel API en échec (200 partout, `hero.mp4` en 206 Partial Content = normal pour une vidéo en streaming).
- Chatbot (bulle 💎 bas-droite) : ouverture correcte, message d'accueil affiché, 4 boutons de suggestion rapide (« Découvrir nos villas », « Tarifs et disponibilités », « Services conciergerie », « Contacter l'équipe »), champ de saisie + bouton emoji fonctionnels. Pas de bug d'affichage ni de débordement observé.
- Screenshots : `home-desktop.png`, `home-mobile.png`

#### `/villas`
✅ RAS structurel — mais **liste vide** : "0 propriété en Martinique — chacune son charme, sa vue, son histoire" / "0 propriété" dans le panneau filtre, cohérent avec l'absence de villas en base (pas un bug d'affichage, l'état vide est bien géré et sobre). Filtres (Piscine, Vue mer, Bord de plage, 4+ pers., tranches de prix) et carte OSM/CARTO présents et rendus normalement malgré l'absence de résultats. 0 débordement horizontal, 0 erreur console.
- Screenshots : `villas-desktop.png`, `villas-mobile.png`

#### `/villas/[id]`
⚠️ **Bug** — Aucune villa n'étant publiée en base, il est impossible de tester une fiche villa réelle. Test effectué avec un UUID inexistant (`/villas/00000000-0000-0000-0000-000000000000`) pour vérifier le comportement de fallback/erreur :
- **La page ne renvoie pas de 404 ni de message d'erreur : elle affiche une villa "fallback" fictive** ("Villa Kayvila", Le Diamant, 1000 €/nuit, calendrier de disponibilité réel et sélectionnable, avis "aucun avis pour le moment", CTA de réservation actifs). Un visiteur arrivant sur un lien villa cassé/expiré verrait une fiche à l'apparence normale plutôt qu'une page d'erreur — à signaler comme un point produit (comportement pouvant induire en erreur, même si non exploitable pour un vrai paiement puisqu'aucune commande réelle n'est possible sans vraie villa).
- Prix affiché en `€` (« 1 000 € / nuit »), format cohérent.
- Calendrier de disponibilité affiché et sélectionnable (dates cliquables juillet/août 2026, prix par nuit visible sur chaque case).
- 0 débordement horizontal desktop/mobile.
- Voir section Console navigateur ci-dessous pour le détail des erreurs déclenchées par cet ID fallback.
- Screenshots : `villa-detail-desktop.png`, `villa-detail-mobile.png`

#### `/villas/comparer`
✅ RAS. État vide propre : « Aucune villa à comparer — Ajoutez jusqu'à 3 villas depuis la page de recherche. » + CTA « Voir les villas ». 0 débordement, 0 erreur console.
- Screenshots : `comparer-desktop.png`, `comparer-mobile.png`

#### `/book`
⚠️ **Constat (précisé après revue)** — La route a **deux modes** distincts (vérifié dans `app/book/page.tsx`) :
1. **`/book` sans paramètres** (mode testé dans cet audit) : rend `BookLandingMarketing` (`page.tsx:74-84`) — page orientée **propriétaires** (« Confier ou suivre votre bien »), avec un texte qui indique explicitement : *"La réservation voyageur se fait depuis le catalogue ou une fiche villa..."*. Aucun calendrier ni prix sur ce mode. 0 débordement, 0 erreur console. RAS sur ce mode.
2. **`/book?villaId=...&checkin=...&checkout=...`** : rend `CheckoutView` (`page.tsx:39-65`) — **le vrai flux de checkout avec pricing**. Si la villa est introuvable ou dépubliée, un message propre « villa non trouvée » avec CTA retour catalogue est rendu (`page.tsx:47-60`). **Ce mode n'a pas pu être testé dans cet audit** faute de villa publiée en base locale (cf. constat structurant en tête de section) — les points du brief « format des prix € + AvailabilityCalendar » n'ont donc été vérifiés que sur le calendrier de `/villas/[id]` (prix en €, calendrier sélectionnable : OK), pas sur le `CheckoutView` lui-même. À re-tester après seed d'une villa publiée.
- Screenshots : `book-desktop.png`, `book-mobile.png` (mode bare uniquement)

#### `/success` (sans `session_id`)
✅ RAS — erreur gérée proprement, conforme au point Task 5 : message « Oups — Paramètres de confirmation manquants. » avec CTA « Découvrir nos villas » vers `/villas`. Pas de crash, pas d'erreur console, 0 appel API en échec.
- Screenshots : `success-desktop.png`, `success-mobile.png`

#### `/prestations`
✅ RAS. Les 5 piliers (Marketing & Visibilité, Opérations & Terrain, Relation Voyageurs, Ménage & Blanchisserie, Revenus & Transparence) s'affichent avec listes détaillées, FAQ accordéon, CTA « Déposer mon dossier ». 0 débordement, 0 erreur console.
- Screenshots : `prestations-desktop.png`, `prestations-mobile.png`

#### `/qui-sommes-nous`
✅ RAS. Contenu éditorial complet (mission, valeurs, étymologie du nom, vision), images illustratives chargées, CTA contact. 0 débordement, 0 erreur console.
- Screenshots : `qui-sommes-nous-desktop.png`, `qui-sommes-nous-mobile.png`

#### `/soumettre-ma-villa`
✅ RAS. Formulaire multi-étapes (4 étapes, étape 1 « Votre bien » visible) avec labels explicites sur chaque champ, champ requis marqué `*` (Localisation), boutons de sélection type de bien et équipements. Rendu mobile avec menu hamburger fonctionnel. 0 débordement, 0 erreur console.
- Screenshots : `soumettre-desktop.png`, `soumettre-mobile.png`

#### `/login`
✅ RAS fonctionnel, avec réserve mineure notée. Formulaire de connexion avec labels visibles (Adresse email, Mot de passe), case « Se souvenir de moi », lien « Mot de passe oublié ? » et CTA « S'inscrire ». **Test réalisé : soumission avec `test@invalid.test` / mauvais mot de passe** → message d'erreur affiché clairement en haut du formulaire (rôle `alert`) : *« Identifiants incorrects. Vérifiez votre email et votre mot de passe. »* — visible desktop et mobile, pas de crash. 0 débordement.
- ⚠️ Réserve non-bloquante (comportement navigateur, pas un bug applicatif) : accéder directement à `/login` alors qu'une session est déjà active **redirige automatiquement vers `/espace-client`** sans repasser par le formulaire — comportement attendu pour un utilisateur déjà connecté, mais a nécessité une déconnexion manuelle (bouton « Déconnexion » dans la sidebar `/espace-client`) pour pouvoir tester le formulaire de connexion dans cet audit.
- Screenshots : `login-desktop.png` / `login-mobile.png` (formulaire vide), `login-error-desktop.png` / `login-error-mobile.png` (message d'erreur affiché)

### Espace client

> Testé le 2026-07-12, compte locataire de test ("Sophie Voyageuse"), desktop 1280×900 puis mobile 375×812. Contexte data : toutes les réservations du compte sont au statut ANNULÉE et les villas référencées sont absentes de la table `villas` (base quasi vide, cf. constat en tête de section Pages publiques) — plusieurs pages sont donc vues dans leur état vide, ce qui est noté tel quel.

#### `/espace-client` (Séjour)
✅ RAS structurel. Accueil « Bonjour, Sophie », cartes de réservation avec badge ANNULÉE, dates, nombre de nuits, montant en € et CTA « Détail » / « Re-réserver ». 0 erreur console, 0 débordement horizontal desktop/mobile.
- ⚠️ Observation data (pas un bug UI) : le nom de villa affiché sur chaque carte est le générique **« Villa »** et l'image est le visuel de fallback — conséquence directe des villas absentes en base. À revérifier après seed de vraies villas.
- Remarque mineure (cosmétique) : le bandeau or « RE-RÉSERVER » pleine largeur est rendu *entre* deux cartes, son rattachement visuel à la carte du dessus est ambigu (desktop comme mobile).
- Screenshots : `espace-client-desktop.png`, `espace-client-mobile.png`

#### `/espace-client/reservations/[id]`
⚠️ **Bug technique (console)** — 2 erreurs `406` répétées sur `GET {SUPABASE_URL}/rest/v1/villas?select=id,name,location,wifi_name,wifi_password,checkout_instructions,local_recommendations,emergency_contacts&id=eq.<villa_id>` : la réservation pointe une villa qui n'existe plus en base, et la requête (`.single()`) renvoie 406. **La page reste propre pour l'utilisateur** : statut ANNULÉE, montant (8 663 €), dates 23→29 juin (6 nuits), bloc « Livret d'accueil disponible une fois la réservation confirmée », CTA « Contacter le SAV ». Même famille de bug que le 406/500 déjà relevé sur `/villas/[id]` (id fallback) : la donnée villa manquante n'est pas gérée en amont de la requête.
- 0 débordement horizontal desktop/mobile.
- Screenshots : `espace-client-reservation-detail-desktop.png`, `espace-client-reservation-detail-mobile.png`

#### `/espace-client/messagerie`
✅ RAS. En-tête « Notre équipe » avec badge disponibilité + téléphone, 3 boutons de sujet rapide (Signaler un problème / Mon séjour / Autre demande), historique de conversation (message « test » du 7 juil. avec accusé « Lu par l'équipe »), sélecteur de catégorie, champ de saisie avec compteur 0/2000 et bouton envoi. 0 erreur console, 0 débordement.
- Screenshots : `espace-client-messagerie-desktop.png`, `espace-client-messagerie-mobile.png`

#### `/espace-client/documents`
✅ RAS. État vide propre : « Aucun document disponible — Vos documents apparaîtront ici après confirmation de votre séjour. » + CTA « Découvrir nos villas ». Cohérent avec le statut ANNULÉE des réservations (le reçu locataire n'est généré qu'à la confirmation). Le vrai bouton de téléchargement (chantier facturation) n'a pas pu être vu faute de document généré — à revérifier après une réservation confirmée. 0 erreur console, 0 débordement.
- Screenshots : `espace-client-documents-desktop.png`, `espace-client-documents-mobile.png`

#### `/espace-client/conciergerie`
✅ RAS. « Contacts & urgences » : urgences 24h/24, téléphone avec horaires, email, tableau d'horaires (semaine/samedi/dimanche & fériés). 0 erreur console, 0 débordement.
- Screenshots : `espace-client-conciergerie-desktop.png`, `espace-client-conciergerie-mobile.png`

#### `/espace-client/checklist`
✅ RAS. État vide propre : « Aucune réservation à venir — Votre checklist s'affichera dès qu'un séjour sera confirmé. » + CTA. 0 erreur console, 0 débordement.
- Screenshots : `espace-client-checklist-desktop.png`, `espace-client-checklist-mobile.png`

#### `/espace-client/favoris`
✅ RAS. État vide propre : « Aucune villa favorite » + CTA « Découvrir nos villas ». 0 erreur console, 0 débordement.
- Screenshots : `espace-client-favoris-desktop.png`, `espace-client-favoris-mobile.png`

#### `/espace-client/profil`
✅ RAS fonctionnel. Photo de profil + « Changer la photo » (formats/taille indiqués), email en lecture seule avec explication, nom complet, téléphone avec indicatif +596 pré-sélectionné, bouton Sauvegarder pleine largeur. 0 erreur console, 0 débordement.
- Remarque mineure (cosmétique) : dans la carte « Préférences de séjour », le sous-titre est collé au titre sur la même ligne (« Préférences de séjourCes informations aident… ») — manque d'espacement/retour à la ligne.
- Screenshots : `espace-client-profil-desktop.png`, `espace-client-profil-mobile.png`

#### `/espace-client/notifications`
✅ RAS. État vide propre : « Aucune notification — Les notifications de vos demandes et messages apparaîtront ici. ». 0 erreur console, 0 débordement.
- Screenshots : `espace-client-notifications-desktop.png`, `espace-client-notifications-mobile.png`

#### `/espace-client/livret`
✅ RAS. Message d'attente : « Le livret sera complété avant votre arrivée par l'équipe Kayvila. », bouton « Télécharger PDF » présent (grisé, cohérent avec un livret non rempli). 0 erreur console, 0 débordement.
- Screenshots : `espace-client-livret-desktop.png`, `espace-client-livret-mobile.png`

#### Navigation mobile (point 2.3)
✅ **Fonctionnelle.** Sur mobile l'espace client a une **bottom bar** fixe à 5 entrées (Séjour / Demandes / Livret / Messages / Plus) + un bouton hamburger « Ouvrir le menu » dans le header. Le bouton « Plus » ouvre un drawer latéral (dialog accessible, bouton « Rejeter » pour fermer) listant les 10 sections + Déconnexion + « Retour au site public ». Navigation vérifiée en conditions réelles : drawer → Checklist charge bien `/espace-client/checklist`. Touch targets confortables.
- Screenshot : `espace-client-nav-mobile-drawer.png`

#### Note transverse espace client
- Session : l'accès direct à une URL espace client avec session expirée redirige proprement vers `/login?redirect=<url>` puis revient sur la page demandée après connexion — vérifié en début d'audit.
- Anomalie ponctuelle **non reproduite** : lors du tout premier passage sur le détail de réservation, la page a navigué seule vers `/espace-client/conciergerie` après ~2 min d'inactivité. Non reproduite lors d'un second passage (la page reste stable) — signalée par transparence, à surveiller, pas classée bug.

### Dashboard proprio

> Testé le 2026-07-12, compte propriétaire de test ("Jean Martin", 1 villa Le Lamentin), desktop 1280×900 puis mobile 375×812.

#### `/dashboard`
✅ RAS structurel. Bandeau « Compte bancaire connecté — paiements automatiques activés », 4 KPIs (Revenus du mois 6 435 €, Réservations à venir 2, Tâches en attente 0, Occupation du mois 32 %), checklist « Configurer ma villa » (4 étapes), graphique « Reversements nets mensuels », « Prochaines réservations » avec noms et dates. **Aucun `NaN`, `undefined` ou montant vide** (vérifié programmatiquement sur tout le texte de la page). 0 erreur console, 0 débordement horizontal desktop/mobile. Navigation mobile : bottom bar 5 entrées (Dashboard / Résas / Villas / Revenus / Plus), cartes KPI en grille 2×2 propre.
- Screenshots : `dashboard-proprio-desktop.png`, `dashboard-proprio-mobile.png`

#### `/dashboard/revenus`
✅ RAS structurel — mais **incohérence de données à signaler** :
- La page affiche « Reversement net ce mois 0 € », « Brut séjours 0 € », « Commission Kayvila 0 € » et un état vide « Aucun revenu ce mois-ci », alors que le tableau de bord affiche « **Revenus du mois 6 435 €** » (et un graphique mensuel montant à ~8K€). Les deux vues ne calculent visiblement pas le même périmètre (mois civil vs autre fenêtre, ou statuts de réservation différents) — pour un propriétaire c'est troublant : le même mois affiche 6 435 € d'un côté et 0 € de l'autre. À arbitrer/harmoniser (pas bloquant paiement, mais confiance proprio).
- Aucun `NaN`/`undefined`, montants tous formatés en €. Boutons « Télécharger le relevé » et « Exporter en PDF » présents. 0 erreur console, 0 débordement desktop/mobile.
- Screenshots : `dashboard-revenus-desktop.png`, `dashboard-revenus-mobile.png`

### Console navigateur

> Constats détaillés par page pour les pages publiques (Task 9). Seules les erreurs console (hors warnings tiers) et les appels API en échec (4xx/5xx) sont listés — les 200 OK ne sont pas répétés ici.

| Page | Erreurs console | Appels API en échec |
|---|---|---|
| `/` | Aucune | Aucun |
| `/villas` | Aucune | Aucun |
| `/villas/[id]` (testé avec UUID inexistant, aucune villa réelle en base) | 4 erreurs répétées à l'identique desktop/mobile : 2× `Failed to load resource: 400` sur `booking_calendar_slots?select=start_date,end_date&villa_id=eq.fallback`, 2× `Failed to load resource: 500 (Internal Server Error)` sur `/api/reviews?villa_id=fallback` | `GET .../rest/v1/booking_calendar_slots?...villa_id=eq.fallback` → **400** ; `GET /api/reviews?villa_id=fallback` → **500**. La cause probable : le composant utilise un id littéral `"fallback"` (pas un UUID valide) comme `villa_id` quand aucune villa réelle n'est trouvée, ce qui casse la requête Supabase (attend un UUID) et la route interne `/api/reviews`. À signaler comme bug technique — la page reste néanmoins visuellement fonctionnelle malgré ces erreurs silencieuses pour l'utilisateur final. |
| `/villas/comparer` | Aucune | Aucun |
| `/book` | Aucune | Aucun |
| `/success` (sans `session_id`) | Aucune | Aucun |
| `/prestations` | Aucune | Aucun |
| `/qui-sommes-nous` | Aucune | Aucun |
| `/soumettre-ma-villa` | Aucune | Aucun |
| `/login` (formulaire vide) | Aucune | Aucun |
| `/login` (soumission mauvais mot de passe `test@invalid.test`) | 1 erreur attendue : `Failed to load resource: 400` sur `https://.../auth/v1/token?grant_type=password` | `POST .../auth/v1/token?grant_type=password` → **400**, comportement normal de Supabase Auth pour des identifiants invalides (pas un bug — le 400 est la réponse standard, correctement traduite en message utilisateur clair côté UI) |

> Espace client (Task 10, compte locataire) :

| Page | Erreurs console | Appels API en échec |
|---|---|---|
| `/espace-client` | Aucune | Aucun |
| `/espace-client/reservations/[id]` | 2× `Failed to load resource: 406` sur `rest/v1/villas?select=...&id=eq.<villa_id>` (villa référencée par la réservation absente de la base — requête `.single()` → 406) | `GET .../rest/v1/villas?...` → **406** (×2). Page visuellement intacte malgré l'erreur. |
| `/espace-client/messagerie` | Aucune | Aucun |
| `/espace-client/documents` | Aucune | Aucun |
| `/espace-client/conciergerie` | Aucune | Aucun |
| `/espace-client/checklist` | Aucune | Aucun |
| `/espace-client/favoris` | Aucune | Aucun |
| `/espace-client/profil` | Aucune | Aucun |
| `/espace-client/notifications` | Aucune | Aucun |
| `/espace-client/livret` | Aucune | Aucun |

> Dashboard proprio (Task 11, compte propriétaire) :

| Page | Erreurs console | Appels API en échec |
|---|---|---|
| `/dashboard` | Aucune | Aucun |
| `/dashboard/revenus` | Aucune | Aucun |

**Note transverse** : toutes les pages publiques testées déclenchent en tâche de fond des appels `GET /auth/v1/user`, `GET /rest/v1/profiles?select=role...`, `GET /rest/v1/wishlist?select=villa_id...` (200 OK) — liés à la session de test active dans le navigateur Playwright (compte "Sophie Voyageuse" / locataire), pas spécifiques à une page.

## Recommandations priorisées

### P0 — avant bascule live
1. **Contrainte anti-double-booking en base** (Critique 1) : migration `EXCLUDE USING gist (villa_id WITH =, daterange(start_date, end_date) WITH &&)` sur `bookings` (statuts actifs), + gestion du conflit 23P01 dans la route booking.
2. **Sécuriser le chemin `/success?bookingId=`** (Critique 2) : vérification serveur du statut de paiement ou état « en attente de paiement » distinct du succès.
3. **Seed d'une villa publiée + réservation test de bout en bout** (Critique 3) : dérouler checkout → paiement `sk_test` → webhook → email de confirmation → reçu locataire/relevé proprio, et relancer les suites Playwright aujourd'hui skippées (16 tests) + les 2 skips de `stripe-admin-refund`.
4. **Actions Ken — Dashboard Stripe** (Critique 4) : configurer/vérifier l'endpoint webhook prod + les 12 événements + reporter le `whsec_` prod ; au moment de la bascule, remplacer `sk_test_` par les clés live dans l'env prod (jamais dans le repo).

### P1 — semaine de bascule
5. **Réparer les 5 suites vitest cassées** (`lib/proactive/*.test.ts`, section 1.7) : erreur de parsing JSX sur `emails/admin-proactive-summary.tsx:15` — 5 modules proactifs sans aucune couverture tant que ce n'est pas corrigé.
6. **Fiche villa fallback fictive sur `/villas/[id]`** (Pages publiques) : un ID inexistant affiche une villa « Villa Kayvila » crédible avec CTA de réservation actifs au lieu d'un 404 — trompeur pour tout lien cassé/expiré partagé. Renvoyer un 404 propre. Même famille : les appels `villa_id=fallback` génèrent des 400/500 en console, et le détail réservation espace client génère des 406 quand la villa n'existe plus (gérer la donnée manquante avant de requêter).
7. **Incohérence Revenus proprio** (Dashboard proprio) : le tableau de bord affiche « Revenus du mois 6 435 € » quand `/dashboard/revenus` affiche 0 € partout pour le même mois — harmoniser le périmètre de calcul des deux vues (confiance propriétaire).
8. **Email de confirmation sans retry** (section 1.3, point 3) : l'échec du fetch interne d'envoi est seulement loggé, sans file de retry — au minimum ajouter une alerte admin en cas d'échec.

### P2 — confort / post-bascule
9. Rate limiter en mémoire de process (`lib/security.ts:44-46`) : inefficace en multi-instance Vercel — passer sur un store partagé (Upstash/Supabase) si le trafic le justifie.
10. Ajouter `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` à `.env.local.example` (et l'env) si un usage Stripe.js/Elements est prévu — non bloquant aujourd'hui (flux 100 % redirection serveur, section 1.2).
11. Couverture de tests : cas d'erreur du `BookingRequestSchema` (section 1.6) et tests d'intégration route ↔ Connect (503 sans compte, `transfer_data` injecté).
12. `CGV_VERSION` absent des metadata Stripe (section 1.8, point 7) : l'ajouter aux metadata de session si le process de litige s'appuie sur les données Stripe seules.
13. Cosmétique UI : bandeau « RE-RÉSERVER » au rattachement visuel ambigu (`/espace-client`) ; sous-titre collé au titre « Préférences de séjour » (`/espace-client/profil`) ; noms de villa génériques « Villa » sur les cartes réservation (données villa manquantes en base).
