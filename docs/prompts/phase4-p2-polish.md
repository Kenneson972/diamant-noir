# Phase 4 — 🟡 P2 Polish & Robustesse

> Dernière vague avant livraison. Bonus de qualité.
> Commit : `fix(p2): polish + emails + disputes + shadcn + perfs`

---

## 1. 🟡 Booking orphelin si crash entre INSERT et liaison Stripe

### Analyse
Si le serveur crash après `INSERT booking` mais avant `stripe_session_id` → booking fantôme, dates bloquées, aucun moyen de payer.

### Fichier : `app/api/booking/route.ts`

### Action
Ajouter un `cleanupExpiredPendingBookings()` dans l'init du serveur qui annule les bookings `pending` de plus de 30 minutes sans `stripe_session_id`.

---

## 2. 🟡 Pas de notification dispute / résolution dispute

### Analyse
La table `stripe_disputes` existe mais aucun handler webhook ne gère `dispute.closed`, `dispute.funds_reinstated`, `dispute.funds_withdrawn`. Les disputes sont enregistrées mais jamais résolues automatiquement.

### Fichier : `app/api/webhooks/stripe/route.ts`

### Action
Ajouter les 3 handlers disputes. Mettre à jour le statut dans `stripe_disputes` et notifier l'admin.

---

## 3. 🟡 Aucun email après réservation confirmée

### Analyse
`/api/send-booking-confirmation` existe mais n'est **jamais appelé** dans le flux de réservation. Le client ne reçoit aucune confirmation email.

### Fichier : `app/api/booking/route.ts`

### Action
Après validation du paiement Stripe, appeler `/api/send-booking-confirmation` avec les détails de la réservation.

---

## 4. 🟡 Pas de fallback `guests` dans la requête booking

### Analyse
Si `guests` est omis de la requête, le serveur va crasher (undefined).

### Fichier : `app/api/booking/route.ts`

### Action
```typescript
const guests = body.guests || 1;
```

---

## 5. 🟡 `serviceFeePercent` hardcodé dans le frontend

### Analyse
Le frontend hardcode `0.05` (5%) pour les frais de service. Si la valeur change côté serveur → désynchro.

### Fichiers : composants checkout frontend

### Action
- Lire le `serviceFeePercent` depuis une variable d'environnement ou l'API
- Valeur partagée : `NEXT_PUBLIC_SERVICE_FEE_PERCENT=0.05`

---

## 6. 🟡 `update-villa` utilise cookie auth, pas Bearer

### Analyse
`app/api/dashboard/update-villa/route.ts` utilise `getSupabaseServer()` (cookies) alors que toutes les autres routes dashboard utilisent `requireAuth()` (Bearer token). Incohérence qui limite l'usage API programmatique.

### Fichier : `app/api/dashboard/update-villa/route.ts`

### Action
Uniformiser avec `requireAuth()` comme les autres routes dashboard.

---

## 7. 🟡 shadcn/ui partiel — 5 composants sur ~15 standards

### Analyse
Le design system est incohérent : certains composants sont shadcn, d'autres sont du Tailwind inline. Manquent : `Select`, `Dialog`, `Tooltip`, `Toast`, `Skeleton`.

### Action
Installer les composants shadcn/ui manquants et les utiliser dans les composants existants :
- `Select` → remplacer les `<select>` natifs
- `Dialog` → remplacer les modals custom
- `Toast` → notifications utilisateur
- `Skeleton` → états de chargement
- `Tooltip` → infobulles dashboard

---

## 8. 🟡 `is_published` non vérifié dans l'API booking

### Analyse
L'API booking accepte des réservations sur des villas non publiées. Un attaquant peut booker une villa en draft.

### Fichier : `app/api/booking/route.ts`

### Action
Ajouter un check `if (!villa.is_published) return 404` après la récupération de la villa.

---

## 9. 🟡 Pas d'UI disputes dans l'admin

### Analyse
La table `stripe_disputes` existe mais aucune page admin ne l'affiche. Les disputes sont invisibles.

### Action
Créer `app/(admin)/admin/disputes/page.tsx` avec :
- Liste paginée des disputes
- Statut (warning/under_review/won/lost)
- Lien vers le booking concerné
- Montant disputé

---

## ✅ Checklist
- [ ] Cleanup bookings pending > 30min
- [ ] Handlers dispute (closed, reinstated, withdrawn)
- [ ] Email confirmation après réservation
- [ ] Fallback guests = 1
- [ ] serviceFeePercent partagé
- [ ] update-villa → Bearer auth
- [ ] shadcn/ui complet (Select, Dialog, Toast, Skeleton, Tooltip)
- [ ] is_published check dans API booking
- [ ] UI disputes admin
- [ ] `npm run build` passe
- [ ] Commit: `fix(p2): polish + emails + disputes + shadcn + perfs`
