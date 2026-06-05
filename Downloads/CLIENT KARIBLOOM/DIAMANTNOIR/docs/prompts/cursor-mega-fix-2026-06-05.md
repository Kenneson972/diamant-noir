# Mega-Prompt Cursor — Correction des 10 bugs P0 + 14 P1

**Date** : 2026-06-05
**Projet** : Kayvila Diamant Noir (diamant-noir)
**Contexte** : 3 audits croisés (infrastructure, flux achat, Stripe Connect) sur `/opt/data/repos/diamant-noir`
**DB réelle** : 2 villas, 0 bookings — la DB est quasi vide, pas d'impact production immédiat sauf bugs de sécurité.

---

## Phase 1 — Sécurité critique (2 bugs)

### Bug 1.1 — SQL Injection dans `lib/ical-sync.ts:44`

**Fichier** : `lib/ical-sync.ts`
**Ligne** : 44
**Code actuel** :
```typescript
.not("external_id", "in", `(${externalIds.join(',')})`);
```
**Problème** : `externalIds` provient de `event.uid` iCal qui peut contenir des guillemets. String interpolation = injection possible.
**Correction** : Supabase accepte un array directement :
```typescript
.not("external_id", "in", externalIds);
```

---

### Bug 1.2 — SQL Injection dans `lib/ota-hub.ts:134`

**Fichier** : `lib/ota-hub.ts`
**Ligne** : 134
**Code actuel** :
```typescript
.not("external_id", "in", `(${externalIds.map((id) => `'${id}'`).join(",")})`);
```
**Problème** : Même cause — les IDs sont wrappés dans des quotes simples mais passent par string interpolation au lieu d'un array.
**Correction** :
```typescript
.not("external_id", "in", externalIds);
```

---

### Bug 1.3 — CSRF importé mais jamais appelé

**Fichier** : `app/api/booking/route.ts`
**Ligne** : 6 (import), ~64 (début du handler POST)
**Code actuel** :
```typescript
import { checkCsrf } from "@/lib/security";
// ...
export async function POST(request: Request) {
  // checkCsrf n'est JAMAIS appelé
```
**Correction** : Ajouter en début de handler POST, après le try :
```typescript
export async function POST(request: Request) {
  // Protection CSRF
  const csrf = checkCsrf(request);
  if (csrf) return csrf;

  // Rate limiting (existant)
  if (!checkRateLimit(...)) { ... }
```

---

## Phase 2 — Paiement fiable (3 bugs)

### Bug 2.1 — `min_nights` non enforce côté serveur

**Fichier** : `app/api/booking/route.ts`
**Ligne** : Après le fetch de la villa (~101)
**Problème** : La validation `min_nights` est faite uniquement dans `CheckoutView.tsx` (frontend). Un appel direct API la contourne.
**Correction** : Ajouter après `const villa = data;` :
```typescript
// Validation min_nights côté serveur
const nights = Math.round(
  (new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000
);
const minNights = villa.min_nights ?? 1;
if (nights < minNights) {
  return NextResponse.json(
    {
      error: `Cette villa nécessite un séjour minimum de ${minNights} nuit${minNights > 1 ? "s" : ""}.`,
    },
    { status: 400 }
  );
}
```

---

### Bug 2.2 — `is_published` non vérifié dans l'API

**Fichier** : `app/api/booking/route.ts`
**Ligne** : ~93-96 (fetch villa)
**Problème** : On peut réserver une villa non publiée via appel API direct.
**Correction** :
```typescript
// Dans le select de la villa, ajouter is_published
.select("*, owner:owner_id(*)")
// → Remplacer par :
.select("*, owner:owner_id(*), is_published")

// Après le fetch, ajouter :
if (!villa.is_published) {
  return NextResponse.json(
    { error: "Villa non disponible" },
    { status: 404 }
  );
}
```

---

### Bug 2.3 — Pas de fallback pour `guests`

**Fichier** : `app/api/booking/route.ts`
**Ligne** : ~189-202 (INSERT booking)
**Problème** : `guests` est optionnel dans le schéma Zod. Si omis, l'INSERT reçoit `undefined`.
**Correction** : Dans l'objet d'insertion :
```typescript
guests: guests || 1,
```

---

## Phase 3 — Webhooks Stripe (4 bugs)

### Bug 3.1 — Race condition idempotence (SELECT+INSERT → upsert)

**Fichier** : `app/api/webhooks/stripe/route.ts`
**Ligne** : 41-48
**Code actuel** :
```typescript
const { data: existing } = await supabase
  .from("stripe_events_processed")
  .select("id")
  .eq("event_id", event.id)
  .maybeSingle();

if (existing) return NextResponse.json({ received: true });

await supabase.from("stripe_events_processed").insert({ event_id: event.id, event_type: event.type });
```
**Problème** : Si 2 workers traitent le même event simultanément, les 2 passent le SELECT, le 2ème INSERT échoue.
**Correction** :
```typescript
const { error: upsertError } = await supabase
  .from("stripe_events_processed")
  .upsert({ event_id: event.id, event_type: event.type }, { onConflict: "event_id" });

if (upsertError) {
  console.error("Failed to record stripe event:", upsertError);
  return NextResponse.json({ error: "Failed to record event" }, { status: 500 });
}
```

---

### Bug 3.2 — Absence de handler `charge.refunded`

**Fichier** : `app/api/webhooks/stripe/route.ts`
**Problème** : Si un refund est émis manuellement depuis Stripe Dashboard, le statut `payment_status` n'est pas mis à jour en DB.
**Correction** : Ajouter dans le switch :
```typescript
case "charge.refunded": {
  const charge = event.data.object as Stripe.Charge;
  if (!charge.payment_intent) break;

  const { data: booking } = await supabase
    .from("bookings")
    .select("id")
    .eq("stripe_payment_intent_id", charge.payment_intent as string)
    .maybeSingle();

  if (booking) {
    await supabase
      .from("bookings")
      .update({ payment_status: "refunded" })
      .eq("id", booking.id);
  }
  break;
}
```

---

### Bug 3.3 — Absence de handler `checkout.session.async_payment_failed`

**Fichier** : `app/api/webhooks/stripe/route.ts`
**Problème** : Paiements SEPA/SOFORT qui échouent après la session → booking reste "pending" indéfiniment.
**Correction** : Ajouter dans le switch :
```typescript
case "checkout.session.async_payment_failed": {
  const session = event.data.object as Stripe.Checkout.Session;
  const bookingId = session.metadata?.bookingId;
  if (!bookingId) break;

  await supabase
    .from("bookings")
    .update({
      status: "cancelled",
      payment_status: "failed",
    })
    .eq("id", bookingId);
  break;
}
```

---

### Bug 3.4 — Absence des handlers résolution dispute

**Fichier** : `app/api/webhooks/stripe/route.ts`
**Problème** : Les disputes ne sont jamais mises à jour après création → `resolved_at` et `status` restent bloqués.
**Correction** : Ajouter 3 handlers :
```typescript
case "charge.dispute.closed": {
  const dispute = event.data.object as Stripe.Dispute;
  await supabase
    .from("stripe_disputes")
    .update({ status: dispute.status, resolved_at: new Date().toISOString() })
    .eq("dispute_id", dispute.id);
  break;
}

case "charge.dispute.funds_reinstated": {
  const dispute = event.data.object as Stripe.Dispute;
  await supabase
    .from("stripe_disputes")
    .update({ status: "won" })
    .eq("dispute_id", dispute.id);
  break;
}

case "charge.dispute.funds_withdrawn": {
  const dispute = event.data.object as Stripe.Dispute;
  await supabase
    .from("stripe_disputes")
    .update({ status: "lost" })
    .eq("dispute_id", dispute.id);
  break;
}
```

---

## Phase 4 — Dashboards revenus (2 bugs)

### Bug 4.1 — Admin dashboard : pas d'affichage de la commission réelle

**Fichier** : `app/(admin)/admin/revenus/page.tsx`
**Problème** : Le dashboard admin affiche `total_price_cents` brut sans indiquer la répartition 75/25. L'audit mentionnait un `COMMISSION_RATE = 0.20` mais ce code n'existe pas dans la version actuelle — le dashboard est juste incomplet.
**Correction** : Ajouter le calcul de commission (25%) :
```typescript
const COMMISSION_RATE = 0.25;

// Dans le calcul des totaux :
const totalGross = sum(bookings) / 100; // euros
const commission = totalGross * COMMISSION_RATE;
const ownerPayout = totalGross - commission;

// Afficher dans le JSX :
<div>
  <StatCard label="CA Brut" value={`${totalGross.toLocaleString()} €`} />
  <StatCard label="Commission Kayvila (25%)" value={`${commission.toLocaleString()} €`} />
  <StatCard label="Reversement Propriétaires" value={`${ownerPayout.toLocaleString()} €`} />
</div>
```

---

### Bug 4.2 — Dashboard proprio : CA brut au lieu du reversement net

**Fichier** : `app/(proprio)/dashboard/revenus/page.tsx`
**Ligne** : 35, 46
**Problème** : Le dashboard proprio affiche `total_price_cents` (montant total client) alors que le proprio ne reçoit que 75% du séjour.
**Correction** : Calculer le net à partir de la commission configurée par villa :
```typescript
// Charger la commission_rate de la villa
const { data: villas } = await supabase
  .from("villas")
  .select("id, commission_rate");

const villaCommission = new Map(
  (villas || []).map((v) => [v.id, (v.commission_rate || 25) / 100])
);

// Dans le calcul :
const commissionRate = villaCommission.get(b.villa_id) || 0.25;
const ownerAmount = (b.total_price_cents ?? 0) * (1 - commissionRate);
```

---

## Phase 5 — Email & Notifications (2 bugs)

### Bug 5.1 — Pas d'email automatique après réservation

**Fichier** : `app/api/booking/route.ts`
**Problème** : Le booking est créé, la session Stripe aussi, mais aucun email de confirmation n'est envoyé au client.
**Correction** : Après la création du booking et de la session Stripe, ajouter :
```typescript
// Envoyer la confirmation par email (fire-and-forget)
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
fetch(`${baseUrl}/api/send-booking-confirmation`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-api-key": process.env.API_SECRET_KEY || "",
  },
  body: JSON.stringify({
    bookingId: booking.id,
    guestEmail: guestEmail,
    guestName: guestName,
  }),
}).catch((err) => console.error("Failed to send booking confirmation:", err));

// Notifier l'admin
fetch(`${baseUrl}/api/notify-admin-booking`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-api-key": process.env.API_SECRET_KEY || "",
  },
  body: JSON.stringify({
    bookingId: booking.id,
    villaName: villa.name,
    guestName: guestName,
    dates: `${startDate} → ${endDate}`,
  }),
}).catch((err) => console.error("Failed to notify admin:", err));
```

---

### Bug 5.2 — Réservation orpheline si crash entre INSERT et Stripe

**Fichier** : `app/api/booking/route.ts`
**Problème** : Si le serveur crash entre l'INSERT booking et la création Stripe, la réservation reste en `pending` sans `stripe_session_id`.
**Correction** : Ajouter un job de nettoyage (à créer) ou à défaut, wrapper dans un try/catch avec rollback :
```typescript
// Après INSERT booking, si Stripe échoue :
try {
  // ... création session Stripe ...
} catch (stripeError) {
  // Marquer le booking comme failed plutôt que de le laisser orphelin
  await supabase
    .from("bookings")
    .update({ status: "failed", notes: "Stripe session creation failed" })
    .eq("id", booking.id);
  throw stripeError;
}
```

---

## Phase 6 — Quick wins (optionnel)

### Bug 6.1 — Déprécier `lib/ical-sync.ts`

**Fichier** : `lib/ical-sync.ts`
**Problème** : Deux systèmes iCal coexistent. `ota-hub.ts` est plus récent et multi-source.
**Correction** : Vérifier qu'aucun cron/job n'appelle `ical-sync.ts`, puis supprimer le fichier.

---

### Bug 6.2 — Brancher les tarifs saisonniers

**Fichier** : `app/api/booking/route.ts` + `lib/price-engine.ts`
**Problème** : `calculatePrice` accepte `seasonalPrices` mais personne ne les charge.
**Correction** : (Cette feature nécessite d'abord de créer la table `seasonal_rates` en base)
```sql
-- Migration à créer : supabase/migrations/20260605_seasonal_rates.sql
CREATE TABLE IF NOT EXISTS seasonal_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  villa_id UUID REFERENCES villas(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  price_per_night INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```
Puis dans `booking/route.ts` :
```typescript
const { data: seasonalRates } = await supabase
  .from("seasonal_rates")
  .select("label, start_date, end_date, price_per_night")
  .eq("villa_id", villaId);

const price = calculatePrice({
  startDate: new Date(startDate),
  endDate: new Date(endDate),
  basePrice: villa.price_per_night,
  seasonalPrices: (seasonalRates || []).map((r) => ({
    season: r.label,
    start: r.start_date,
    end: r.end_date,
    price: r.price_per_night,
  })),
});
```

---

## Variables d'environnement à configurer

Avant de déployer, vérifier dans `.env.local` :

| Clé | Statut |
|-----|--------|
| `STRIPE_SECRET_KEY` | 🔴 À vérifier |
| `STRIPE_WEBHOOK_SECRET` | 🔴 À vérifier |
| `RESEND_API_KEY` | 🔴 À vérifier |
| `NEXT_PUBLIC_BASE_URL` | 🔴 À vérifier |
| `API_SECRET_KEY` | 🔴 À vérifier |
| `N8N_WEBHOOK_URL` | 🟡 Optionnel |
| `N8N_OWNER_WEBHOOK_URL` | 🟡 Optionnel |

---

## Checklist Cursor — Ordre d'exécution

- [ ] 1.1 SQL injection `ical-sync.ts:44`
- [ ] 1.2 SQL injection `ota-hub.ts:134`
- [ ] 1.3 CSRF `booking/route.ts`
- [ ] 2.1 `min_nights` serveur `booking/route.ts`
- [ ] 2.2 `is_published` check `booking/route.ts`
- [ ] 2.3 `guests` fallback `booking/route.ts`
- [ ] 3.1 Upsert idempotence `webhooks/stripe/route.ts`
- [ ] 3.2 Handler `charge.refunded`
- [ ] 3.3 Handler `async_payment_failed`
- [ ] 3.4 Handlers dispute (closed/reinstated/withdrawn)
- [ ] 4.1 Commission admin dashboard
- [ ] 4.2 Revenus net proprio dashboard
- [ ] 5.1 Email auto après booking
- [ ] 5.2 Nettoyage booking orphelin
- [ ] 6.1 Déprécier `ical-sync.ts`
- [ ] 6.2 Brancher tarifs saisonniers
- [ ] Vérifier `.env.local` — toutes les clés
- [ ] `npm run build` — vérifier que ça compile
