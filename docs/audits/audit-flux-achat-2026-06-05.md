# AUDIT — Flux Achat/Réservation Kayvilla (diamant-noir)
**Date** : 2026-06-05 | **Périmètre** : checkout, disponibilité, prix, Stripe, confirmation

---

## Synthèse

| Sévérité | Nombre | Résumé |
|----------|--------|--------|
| **P0** | 0 | Aucun bug critique bloquant (pas de double-paiement ni perte de données) |
| **P1** | 4 | Vulnérabilité CSRF, min_nights non enforce serveur, race condition dates, prix saisonniers non branchés |
| **P2** | 4 | Vue calendrier/paiement inconsistante, orphelin Stripe, serviceFee fragile, conflit status `paid` |
| **P3** | 2 | Villa non-publiable réservable via API, pas de fallback guests |

---

## 🔴 P1 — À corriger avant mise en production

### 1. CSRF importé mais jamais appelé sur `POST /api/booking`
- **Fichier** : `app/api/booking/route.ts:6`
- **Problème** : `import { checkCsrf } from "@/lib/security"` est présent mais `checkCsrf(request)` n'est **jamais invoqué** dans le handler `POST`. N'importe quel site tiers peut déclencher une réservation au nom d'un utilisateur authentifié (CSRF).
- **Impact** : Création de réservations non désirées, pollution de la base, sessions Stripe parasites.
- **Correctif** : Ajouter `const csrf = checkCsrf(request); if (csrf) return csrf;` en début de handler.

```typescript
// app/api/booking/route.ts (ligne ~64, après le try)
export async function POST(request: Request) {
  // AJOUTER :
  const csrf = checkCsrf(request);
  if (csrf) return csrf;
  
  // Rate limiting...
  if (!checkRateLimit(...)) { ... }
```

---

### 2. `min_nights` non enforce côté serveur
- **Fichiers** : `app/api/booking/route.ts` (absent), `components/booking/CheckoutView.tsx:87-95` (présent côté client)
- **Problème** : La validation `min_nights` est faite **uniquement dans le frontend** (`CheckoutView`). Un appel direct à `POST /api/booking` avec 1 nuit sur une villa exigeant 3 nuits passe sans erreur.
- **Impact** : Contournement des règles métier par API directe. Réservations non conformes.
- **Correctif** : Ajouter la vérification côté serveur après le fetch de la villa :

```typescript
// app/api/booking/route.ts, après avoir fetch la villa (ligne ~101)
const nights = Math.round((end.getTime() - start.getTime()) / 86400000);
const minNights = villa.min_nights ?? 1;
if (nights < minNights) {
  return NextResponse.json(
    { error: `Cette villa nécessite un séjour minimum de ${minNights} nuit${minNights > 1 ? "s" : ""}.` },
    { status: 400 }
  );
}
```

---

### 3. Race condition dans la création de réservation (double-booking)
- **Fichier** : `app/api/booking/route.ts:111-204`
- **Problème** : Le check de conflit (lignes 111-129) et l'INSERT (lignes 187-204) ne sont **pas atomiques**. Deux requêtes simultanées peuvent toutes les deux passer le check et créer deux réservations pour les mêmes dates.
- **Scénario** :
  ```
  T1: Requête A → check conflit (0 résultat) → OK
  T2: Requête B → check conflit (0 résultat, A pas encore inséré) → OK
  T3: Requête A → INSERT booking (succès)
  T4: Requête B → INSERT booking (succès) → DOUBLE BOOKING
  ```
- **Correctif** : Ajouter une contrainte d'exclusion au niveau DB (`EXCLUDE USING gist`) **ou** utiliser un verrou explicite (`SELECT ... FOR UPDATE` sur la villa) **ou** créer une contrainte unique fonctionnelle. Solution minimale : wrapper la séquence dans une transaction Supabase avec `supabase.rpc()` qui fait le check + insert atomiquement.

- **Note** : La contrainte `ON CONFLICT (villa_id, external_id)` existe pour les imports OTA mais pas pour les réservations directes.

---

### 4. Prix saisonniers non branchés dans le flux de réservation
- **Fichiers** : `lib/price-engine.ts:37-43` (le moteur supporte `seasonalPrices`), `app/api/booking/route.ts:131-135` (n'envoie **pas** `seasonalPrices`), `components/BookingForm.tsx:77-86` (idem), `components/booking/CheckoutView.tsx:66-70` (idem)
- **Problème** : La table `seasonal_rates` existe (migration `20260531_seasonal_rates.sql`), le `price-engine` accepte les prix saisonniers, mais **personne ne les charge ni ne les passe**. Le prix calculé est toujours `basePrice` (le `price_per_night` de la villa), quelles que soient les saisons configurées.
- **Impact** : Toute la tarification saisonnière est inopérante. Les villas sont facturées au prix de base toute l'année, ce qui peut représenter des pertes de revenus substantielles en haute saison.
- **Correctif** : Dans `POST /api/booking`, charger les `seasonal_rates` depuis Supabase et les passer à `calculatePrice`. Idem dans les frontends (BookingForm, CheckoutView) pour l'affichage.

```typescript
// app/api/booking/route.ts, après avoir fetch la villa
const { data: seasonalRates } = await supabase
  .from("seasonal_rates")
  .select("label, start_date, end_date, price_per_night")
  .eq("villa_id", villaId);

const price = calculatePrice({
  startDate: new Date(startDate),
  endDate: new Date(endDate),
  basePrice: villa.price_per_night,
  seasonalPrices: (seasonalRates || []).map(r => ({
    season: r.label,
    start: r.start_date,
    end: r.end_date,
    price: r.price_per_night / 100, // conversion centimes → euros
  })),
});
```

---

## 🟡 P2 — Incohérences / fragilités

### 5. `booking_calendar_slots` exclut le statut `paid` mais le backend l'inclut
- **Fichiers** : `supabase/migrations/tenant_bookings_rls_calendar_fix.sql:32` vs `app/api/booking/route.ts:116`
- **Problème** : La vue calendrier publique filtre `WHERE status IN ('pending', 'confirmed')`. Le check backend inclut `'paid'`. Un booking legacy avec `status = 'paid'` bloquera la réservation au backend mais apparaîtra comme disponible dans le calendrier.
- **Impact** : Faible en pratique (le webhook Stripe set `status = 'confirmed'`, pas `'paid'`), mais incohérence source de bugs futurs.
- **Correctif** : Aligner les deux listes — soit retirer `'paid'` du backend, soit l'ajouter dans la vue (recommandé : `WHERE status IN ('pending', 'confirmed', 'paid')`).

---

### 6. Booking orphelin si crash entre INSERT et liaison Stripe
- **Fichier** : `app/api/booking/route.ts:186-318`
- **Problème** : Le booking est inséré (ligne 187), puis la session Stripe est créée (ligne 312), puis le `stripe_session_id` est mis à jour (ligne 315). Si le serveur crash entre l'INSERT et la création Stripe, la réservation reste en `pending` sans `stripe_session_id` et ne peut pas être récupérée.
- **Impact** : Réservations fantômes, dates bloquées sans paiement.
- **Correctif** : Ajouter un job de nettoyage (cron) qui annule les `pending` bookings sans `stripe_session_id` créés il y a > 30 minutes.

---

### 7. `serviceFeePercent` hardcodé côté frontend vs configurable backend
- **Fichiers** : `components/BookingForm.tsx:186`, `components/booking/CheckoutView.tsx:146`, `types/stripe.ts:10` (Zod default 5)
- **Problème** : Le frontend affiche `Math.round(price.total * 0.05)` en dur. Si un admin change `serviceFeePercent` dans l'API (le champ est dans le schéma Zod), le prix affiché et le prix facturé divergent.
- **Impact** : Actuellement nul (le frontend ne passe pas `serviceFeePercent`, donc backend utilise le défaut 5 = cohérent avec 0.05). Mais fragile à toute évolution.
- **Correctif** : Rendre le `serviceFeePercent` explicite : soit le supprimer du schéma Zod (server-side only constant), soit le faire remonter par l'API et l'afficher dynamiquement.

---

### 8. Service fee en centimes : formule confuse mais fonctionnelle
- **Fichier** : `app/api/booking/route.ts:147`
- **Code** : `const serviceFeeCents = Math.round(price.total * serviceFeePercent / 100 * 100);`
- **Analyse** : La formule se simplifie en `Math.round(price.total * serviceFeePercent)` car `x/100*100 = x`. Pour `serviceFeePercent=5` sur 1500€ → 7500 cents = 75€ (correct). Pour 10% sur 1500€ → 15000 cents = 150€ (correct). La formule est juste mais incompréhensible.
- **Correctif** : Simplifier en `Math.round(price.total * serviceFeePercent)` avec un commentaire expliquant que `price.total` est en euros et qu'on veut des centimes, donc `* serviceFeePercent` donne directement les centimes (car `euros * percent = cents`).

---

## 🟢 P3 — Polish

### 9. Pas de vérification `is_published` dans l'API de réservation
- **Fichier** : `app/api/booking/route.ts:93-96`
- **Problème** : La villa est fetchée mais `is_published` n'est ni sélectionné ni vérifié. On peut réserver une villa non publiée via appel API direct.
- **Correctif** : Ajouter `is_published` au select et vérifier `if (!villa.is_published) return 404`.

### 10. Pas de fallback pour `guests` dans l'insertion
- **Fichier** : `app/api/booking/route.ts:189-202`
- **Problème** : `guests` est optionnel dans le schéma Zod (`.optional()`). Si omis, l'INSERT insère `undefined` pour le champ guests.
- **Correctif** : Ajouter `guests: guests || 1` dans l'objet d'insertion.

---

## ✅ Points corrects (non-bugs)

| Point | Détail |
|-------|--------|
| **Idempotence webhook** | `stripe_events_processed` + check `existing` → pas de double traitement |
| **Signature Stripe** | `stripe.webhooks.constructEvent` avec `webhookSecret` — ✓ |
| **Rate limit** | 10 req/60s par IP sur le booking endpoint — ✓ |
| **Validation dates** | `start < end`, `start >= today`, format Zod — ✓ |
| **Conflit dates** | Overlap check `lt start_date / gt end_date` avec statuts actifs — ✓ |
| **Stripe Connect** | Split 75/25 propriétaire/Kayvila, frais ménage + service 100% plateforme — ✓ |
| **Annulation auto** | `checkout.session.expired` → status cancelled + refund si déjà payé — ✓ |
| **Compte auto** | Création compte client + magic link après paiement réussi — ✓ |
| **Email confirmation** | Appel POST interne vers `/api/send-booking-confirmation` après webhook — ✓ |
| **Order status history** | Chaque transition de statut est loggée — ✓ |
| **RLS calendar** | Vue `booking_calendar_slots` sans PII, exposée anon — ✓ |
| **A/B calendar sync** | `security_invoker = false` sur la vue → bypass RLS, stable — ✓ |

---

## 🔁 Diagramme du flux audité

```
[Page Villa]
  ├── AvailabilityCalendar (booking_calendar_slots → pending/confirmed)
  └── BookingForm → /book?villaId=&checkin=&checkout=&guests=
        │
[Page /book] CheckoutView
  ├── Affichage prix (calculatePrice sans seasonalPrices ⚠️)
  ├── Validation min_nights (frontend only ⚠️)
  └── POST /api/booking ─────────────────────────────────────────┐
        │                                                         │
        ▼                                                         │
  ┌─────────────────────────────────────────────────────────┐     │
  │ POST /api/booking                                       │     │
  │  ⚠️ CSRF: importé, jamais appelé                        │     │
  │  ✓ Rate limit (10/60s)                                  │     │
  │  ✓ Zod validation                                       │     │
  │  ✓ Date validation                                      │     │
  │  ⚠️ min_nights: absent                                  │     │
  │  ✓ Villa fetch (mais pas is_published)                  │     │
  │  ⚠️ seasonalPrices: jamais chargé ni passé             │     │
  │  ✓ Conflit dates (pending/confirmed/paid)               │     │
  │  ⚠️ Race condition check/insert                         │     │
  │  → calculatePrice (basePrice only)                       │     │
  │  → INSERT booking (status:pending)                       │     │
  │  → Stripe Checkout Session                               │     │
  │  → UPDATE stripe_session_id                               │     │
  └─────────────────────────────────────────────────────────┘     │
        │                                                         │
        ▼                                                         │
[Stripe Checkout] → Paiement → webhook                            │
        │                                                         │
        ▼                                                         │
  ┌─────────────────────────────────────────────────────────┐     │
  │ POST /api/webhooks/stripe                               │     │
  │  ✓ Signature verification                                │     │
  │  ✓ Idempotence (stripe_events_processed)                 │     │
  │  checkout.session.completed:                             │     │
  │    → status: confirmed, payment_status: paid             │     │
  │    → order_status_history insert                         │     │
  │    → /api/send-booking-confirmation (interne)            │     │
  │    → /api/notify-admin-booking (interne)                 │     │
  │    → Création compte + magic link                        │     │
  │  checkout.session.expired:                               │     │
  │    → status: cancelled, refund si paid                   │     │
  └─────────────────────────────────────────────────────────┘     │
        │                                                         │
        ▼                                                         │
[GET /api/booking-session?session_id=cs_xxx]                      │
  → Retourne booking+villa (seulement si confirmed+paid)          │
        │                                                         │
        ▼                                                         │
[Page /success] SuccessContent                                    │
  → Affichage confirmation + magic link si non logged in          │
```

---

## Fichiers audités

| Fichier | Rôle |
|---------|------|
| `app/api/booking/route.ts` | Endpoint création réservation + Stripe |
| `app/api/webhooks/stripe/route.ts` | Webhook Stripe (confirmation, expiration, disputes) |
| `app/api/send-booking-confirmation/route.ts` | Envoi confirmation via n8n |
| `app/api/notify-admin-booking/route.ts` | Notification admin via n8n |
| `app/api/booking-session/route.ts` | Récupération booking post-paiement |
| `lib/price-engine.ts` | Calcul prix (nuitées, weekend, saisonnier) |
| `lib/stripe/connect.ts` | Split Stripe Connect 75/25 |
| `lib/security.ts` | Rate limit, CSRF, IP extraction |
| `types/stripe.ts` | Zod schema BookingRequestSchema |
| `types/domain.ts` | Types Booking, Villa, BookingPriceInput |
| `components/BookingForm.tsx` | Formulaire réservation (sidebar villa) |
| `components/booking/CheckoutView.tsx` | Page checkout (/book) |
| `components/booking/AvailabilityCalendar.tsx` | Calendrier FullCalendar |
| `components/villas/VillaBookingWrapper.tsx` | Contexte partagé calendrier ↔ form |
| `components/PriceDisplay.tsx` | Affichage prix formaté |
| `app/villas/[id]/page.tsx` | Page détail villa |
| `app/book/page.tsx` | Page checkout wrapper |
| `app/success/page.tsx` | Page confirmation post-paiement |
| `supabase/migrations/tenant_bookings_rls_calendar_fix.sql` | Vue booking_calendar_slots |
| `supabase/migrations/20260531_seasonal_rates.sql` | Table seasonal_rates |
| `supabase/migrations/20260525_add_min_nights.sql` | Colonne min_nights |
| `lib/ical-sync.ts` | Sync iCal (crée bookings confirmed) |
| `data/seasons.ts` | Configuration saisons (non utilisée par booking) |
