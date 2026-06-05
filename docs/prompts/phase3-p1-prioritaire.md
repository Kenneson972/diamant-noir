# Phase 3 — 🟠 P1 Prioritaire

> Fonctionnalité et robustesse. Après P0.
> Commit : `fix(p1): double-booking + min_nights + RLS seasonal + analytics + refunds + iCal`

---

## 1. 🟠 Race condition double-booking

### Analyse
`app/api/booking/route.ts` vérifie les conflits de dates puis fait un INSERT. Ces deux opérations ne sont **pas atomiques**. Deux réservations simultanées peuvent passer le check de conflit et créer un double-booking.

### Fichier : `app/api/booking/route.ts`

### Action
Option A (recommandé) : Ajouter une contrainte d'exclusion PostgreSQL sur `villa_id + daterange(check_in, check_out)`.
Option B : Utiliser `SELECT ... FOR UPDATE` avant le check de conflit.
Option C : UPSERT avec condition de conflit.

---

## 2. 🟠 `min_nights` non enforce côté serveur

### Analyse
Le `min_nights` est validé uniquement côté frontend. Un appel API direct peut réserver 1 nuit même si `min_nights = 3`.

### Fichier : `app/api/booking/route.ts`

### Action
Ajouter après la récupération de la villa :
```typescript
if (nights < villa.min_nights) {
  return Response.json({ error: `Minimum ${villa.min_nights} nights required` }, { status: 400 })
}
```

---

## 3. 🟠 `seasonal_rates` RLS — tout owner peut modifier toute villa

### Analyse
`supabase/migrations/20260531_seasonal_rates.sql` :
```sql
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'owner', 'proprio')))
```
N'importe quel owner peut gérer les tarifs saisonniers de **n'importe quelle villa**.

### Fichier : `supabase/migrations/20260531_seasonal_rates.sql`

### Action
Restreindre par `villa_id` → `owner_id` :
```sql
USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  OR villa_id IN (SELECT id FROM villas WHERE owner_id = auth.uid())
)
```

---

## 4. 🟠 Analytics exposé aux clients

### Analyse
`app/api/dashboard/analytics-villas/route.ts` utilise `requireAuth` (pas `requireAdmin`). Un client connecté peut voir les vues/clics de toutes les villas.

### Fichier : `app/api/dashboard/analytics-villas/route.ts`

### Action
- Remplacer `requireAuth` par `requireAdmin`
- OU filtrer strictement par `owner_id` si l'utilisateur n'est pas admin

---

## 5. 🟠 Pas de handler `async_payment_failed`

### Analyse
Les paiements SEPA/SOFORT sont asynchrones. Si le paiement échoue après la session Stripe, le statut du booking reste "pending" pour toujours. Aucun handler ne le détecte.

### Fichier : `app/api/webhooks/stripe/route.ts`

### Action
- Ajouter le handler `payment_intent.payment_failed`
- Mettre à jour `payment_status` → `failed`
- Libérer les dates (annuler le booking)
- Notifier le client par email

---

## 6. 🟠 Double système iCal — `ical-sync.ts` + `ota-hub.ts`

### Analyse
Deux systèmes iCal coexistent : l'ancien `ical-sync.ts` (legacy) et le nouveau `ota-hub.ts`. Risque de doublons, synchros concurrentes, comportement imprévisible.

### Fichiers : `lib/ical-sync.ts`, `lib/ota-hub.ts`

### Action
- Vérifier si `ical-sync.ts` est encore appelé quelque part
- Si non : le supprimer
- Si oui : migrer tous les appels vers `ota-hub.ts`, PUIS supprimer

---

## 7. 🟠 `delete-booking` — `isStaffAdmin()` incomplet

### Analyse
`app/api/dashboard/delete-booking/route.ts:49` :
```typescript
const isAdmin = profile?.role === "admin";  // Pas de fallback metadata/email
```
Un admin identifié uniquement via `user_metadata.role` ou email allowlist → 403.

### Fichier : `app/api/dashboard/delete-booking/route.ts`

### Action
```typescript
const isAdmin = isStaffAdmin(profile?.role, user.user_metadata?.role, user.email);
```

---

## 8. 🟠 Middleware redirect 307 sur API au lieu de 401 JSON

### Analyse
`middleware.ts` redirige les appels API non authentifiés vers `/login` (307). Un client API programmatique attend un `401 JSON`, pas une redirection HTML.

### Fichier : `middleware.ts`

### Action
Dans le bloc de redirection, ajouter :
```typescript
if (pathname.startsWith('/api/')) {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } })
}
```

---

## ✅ Checklist
- [ ] Race condition double-booking → contrainte exclusion
- [ ] min_nights enforce serveur
- [ ] seasonal_rates RLS restreint par villa_id
- [ ] analytics-villas → requireAdmin
- [ ] payment_intent.payment_failed handler
- [ ] iCal unifié (ota-hub only)
- [ ] delete-booking → isStaffAdmin()
- [ ] API routes → 401 JSON (pas 307 redirect)
- [ ] `npm run build` passe
- [ ] Commit: `fix(p1): double-booking + min_nights + RLS + analytics + refunds + iCal`
