# Prompt Cursor — Intégration Resend Kayvila

**Date** : 6 juin 2026
**Contexte** : Resend v6.12.3 déjà installé dans `package.json`. Aucun email envoyé en production — tout passe par des webhooks n8n non configurés. 27 événements métier sans email.

**Règle** : Code propre, typé, testable. Pas de duplication. Pas de `any`.

---

## PHASE 0 — Client Resend partagé (5 min)

### 0.1 — Créer `lib/resend.ts`

```ts
import { Resend } from "resend";

export const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export const RESEND_FROM =
  process.env.RESEND_FROM_EMAIL || "Kayvila <conciergerie@kayvila.com>";

export function getResend(): Resend {
  if (!resend) throw new Error("RESEND_API_KEY is not set");
  return resend;
}
```

### 0.2 — Remplacer l'instanciation inline dans `app/api/villa-submissions/confirm/route.ts`

- Importer `getResend` et `RESEND_FROM` depuis `@/lib/resend`
- Supprimer `const resend = process.env.RESEND_API_KEY ? new Resend(...) : null`
- Remplacer le `from` hardcodé par `RESEND_FROM`

### 0.3 — Ajouter la variable dans `.env.local.example`

Si pas déjà fait clairement :
```
# Resend (emails transactionnels)
RESEND_API_KEY=re_xxxxxxxx
RESEND_FROM_EMAIL=Kayvila <conciergerie@kayvila.com>
```

---

## PHASE 1 — Templates React Email (30 min)

Installer `@react-email/components` :
```bash
npm install @react-email/components
```

### 1.1 — Créer `emails/_components/layout.tsx`

Wrapper commun avec :
- Logo Kayvila (texte "KAYVILA" en gold `#d4af37` sur fond navy `#0a1929`)
- Police Georgia/Playfair Display
- Footer : "Kayvila Conciergerie — Martinique | Cet email a été envoyé automatiquement"
- Largeur max 480px

### 1.2 — Créer `emails/booking-confirmation.tsx`

Props : `guestName`, `villaName`, `startDate`, `endDate`, `nights`, `totalPrice`, `checkInTime?`, `wifiCode?`

Contenu :
- "Bonjour [guestName], votre réservation est confirmée"
- Détails du séjour (villa, dates, nuits, prix)
- Rappel check-in 15h / check-out 11h
- Lien vers espace client : `[BASE_URL]/espace-client/mes-reservations`
- Contact urgence : +596 96 00 00 00

### 1.3 — Créer `emails/checkin-reminder.tsx`

Props : `guestName`, `villaName`, `startDate`, `daysUntil`, `directions?`, `lockboxCode?`

Contenu :
- "J-[daysUntil] avant votre arrivée à [villaName]"
- Rappel date, adresse, code boîte à clés si dispo
- Lien espace client

### 1.4 — Créer `emails/review-request.tsx`

Props : `guestName`, `villaName`, `reviewUrl`

Contenu :
- "Comment s'est passé votre séjour à [villaName] ?"
- Lien pour laisser un avis
- "Votre avis aide les futurs voyageurs"

### 1.5 — Créer `emails/owner-new-booking.tsx`

Props : `ownerName`, `villaName`, `guestName`, `startDate`, `endDate`, `amount`, `ownerRevenue`

Contenu :
- "Nouvelle réservation pour [villaName]"
- Détails : voyageur, dates, montant total, votre revenu (75%)
- Lien dashboard proprio

### 1.6 — Créer `emails/admin-dispute-alert.tsx`

Props : `disputeId`, `amount`, `reason`, `evidenceDueBy`, `villaName?`

Contenu :
- "⚠️ Litige Stripe — [amount]€ — [reason]"
- Deadline pour répondre
- Lien dashboard Stripe

### 1.7 — Créer `emails/owner-connect-onboarded.tsx`

Props : `ownerName`

Contenu :
- "Votre compte Stripe Connect est validé"
- "Vos villas sont maintenant réservables avec paiement en ligne"

---

## PHASE 2 — Déclencheurs emails critiques (20 min)

### 2.1 — Confirmation réservation directe via Resend

Modifier `app/api/send-booking-confirmation/route.ts` :

**Ne plus passer par n8n.** Envoyer directement via Resend :

```ts
import { getResend, RESEND_FROM } from "@/lib/resend";
import { render } from "@react-email/components";
import BookingConfirmationEmail from "@/emails/booking-confirmation";

// Dans le handler POST :
const resend = getResend();
const html = await render(
  BookingConfirmationEmail({
    guestName: booking.guest_name,
    villaName: villa.name,
    startDate: booking.start_date,
    endDate: booking.end_date,
    nights: /* calculer */,
    totalPrice: booking.total_price_cents / 100,
  })
);

await resend.emails.send({
  from: RESEND_FROM,
  to: [booking.guest_email],
  subject: `Confirmation — ${villa.name} — Kayvila`,
  html,
});
```

**Garder le webhook n8n en fallback silencieux** (si n8n dispo, notify aussi).

### 2.2 — Notification admin nouvelle réservation

Modifier `app/api/notify-admin-booking/route.ts` :
- Même logique : Resend direct avec fallback n8n
- Template simple : "Nouvelle réservation — [villa] — [dates] — [montant]"
- Envoyer à `ADMIN_NOTIFICATION_EMAIL` (nouvelle env var)

### 2.3 — Notification proprio nouvelle réservation

Dans `app/api/webhooks/stripe/route.ts`, handler `checkout.session.completed` :
- Après l'appel à `/api/send-booking-confirmation` et `/api/notify-admin-booking`
- Ajouter l'envoi d'email proprio via Resend avec `OwnerNewBookingEmail`
- Récupérer l'email du proprio depuis `profiles` via `villas.owner_id`

### 2.4 — Onboarding Stripe Connect complété

Dans `app/api/webhooks/stripe/route.ts`, handler `account.updated` :
- Quand `charges_enabled` passe à true
- Envoyer `OwnerConnectOnboardedEmail` au proprio
- Chercher le proprio par `stripe_connect_account_id`

### 2.5 — Alerte admin litige

Dans `app/api/webhooks/stripe/route.ts`, handler `charge.dispute.created` :
- Après l'insert dans `stripe_disputes`
- Envoyer `AdminDisputeAlertEmail` à `ADMIN_NOTIFICATION_EMAIL`

---

## PHASE 3 — Crons (10 min)

### 3.1 — Rappel check-in (chaque jour à 8h)

Nouvelle route : `app/api/send-checkin-reminders/route.ts`

```ts
// GET /api/send-checkin-reminders (cron)
// 1. Cherche les bookings avec start_date = J+3
// 2. Pour chaque booking sans reminder déjà envoyé → envoie CheckinReminderEmail
// 3. Marque le booking (metadata.reminder_sent = true ou colonne)
```

Ajouter dans `vercel.json` :
```json
{ "path": "/api/send-checkin-reminders", "schedule": "0 8 * * *" }
```

### 3.2 — Demande d'avis (chaque jour à 10h)

Nouvelle route : `app/api/send-review-requests/route.ts`

```ts
// GET /api/send-review-requests (cron)
// 1. Cherche les bookings avec end_date = J-3 et status = confirmed/paid
// 2. Vérifie si un avis existe déjà (table reviews)
// 3. Si pas d'avis → envoie ReviewRequestEmail
```

Ajouter dans `vercel.json` :
```json
{ "path": "/api/send-review-requests", "schedule": "0 10 * * *" }
```

---

## PHASE 4 — Variables d'environnement

Ajouter dans `.env.local.example`:
```
# Resend (emails transactionnels)
RESEND_API_KEY=re_xxxxxxxx
RESEND_FROM_EMAIL=Kayvila <conciergerie@kayvila.com>

# Destinataires emails admin/proprio
ADMIN_NOTIFICATION_EMAIL=equipe@kayvila.com
```

---

## VÉRIFICATIONS

- [ ] `npm run build` passe
- [ ] `lib/resend.ts` exporte `getResend()` et `RESEND_FROM`
- [ ] Plus aucun `new Resend()` en dehors de `lib/resend.ts`
- [ ] `emails/` contient 6 templates + `_components/layout.tsx`
- [ ] `send-booking-confirmation` utilise Resend (pas que n8n)
- [ ] `account.updated` envoie l'email "Connect validé"
- [ ] `charge.dispute.created` envoie l'alerte admin
- [ ] `vercel.json` a les 2 nouveaux crons
- [ ] Route `/api/notify-admin-booking` utilise Resend direct
