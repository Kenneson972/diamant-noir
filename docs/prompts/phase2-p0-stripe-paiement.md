# Phase 2 — 🔴 P0 Stripe & Paiement

> Argent et confiance. À faire juste après la Phase 1.
> Commit : `fix(stripe): P0 commission + dashboard + clés + seasonal_rates`

---

## 1. 🔴 Commission admin hardcodée à 20% au lieu de 25%

### Analyse

`app/(admin)/admin/revenus/page.tsx` hardcode `COMMISSION_RATE = 0.20` mais `app/api/booking/route.ts` appelle `calculateTransferAmounts(..., 25)`. Le dashboard admin et l'export CSV affichent des chiffres de commission **faux** (20% au lieu de 25%).

### Fichier : `app/(admin)/admin/revenus/page.tsx`

### Action
- `COMMISSION_RATE` → `0.25`
- Idéalement : extraire dans une constante partagée `lib/constants.ts` → `export const KAYVILLA_COMMISSION_RATE = 0.25`
- L'utiliser dans le dashboard ET dans `booking/route.ts` pour éviter toute désynchro future.

---

## 2. 🔴 Dashboard proprio affiche CA brut, pas le reversement

### Analyse

Les pages `/dashboard` et `/dashboard/revenus` agrègent `total_price_cents` (montant total payé par le client). Le proprio ne reçoit que **75%** du séjour. Un proprio voit 1000€ mais n'en touche que ~600 → trompeur et dangereux.

### Fichiers
- `app/(proprio)/dashboard/page.tsx`
- `app/(proprio)/dashboard/revenus/page.tsx`

### Action
- Afficher **deux** chiffres : CA brut (total) ET revenus proprio (75%)
- Ou : n'afficher que le reversement proprio avec une infobulle "Basé sur le prix du séjour (75%)"
- Ajouter une colonne `owner_amount_cents` dans la query ou calculer côté frontend

---

## 3. 🔴 `.env.local` — 7 clés manquantes

### Analyse

Le `.env.local` n'a que 3 clés sur 13 nécessaires. Stripe, Resend, et les webhooks sont inopérants.

### Fichier : `.env.local`

### Action — Ajouter :

```env
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
RESEND_API_KEY=re_...
NEXT_PUBLIC_BASE_URL=https://kayvila.vercel.app
API_SECRET_KEY=...
N8N_WEBHOOK_URL=https://n8n.kenneson.fr/webhook/...
N8N_OWNER_WEBHOOK_URL=https://n8n.kenneson.fr/webhook/owner-...
```

Ne pas commiter les vraies valeurs. Utiliser `.env.local.example` comme template et demander les valeurs à Richard ou les récupérer depuis le gestionnaire de secrets.

---

## 4. 🔴 Tarifs saisonniers ignorés dans le calcul de prix

### Analyse

`app/api/booking/route.ts:131` appelle `calculatePrice()` **sans** passer les `seasonalPrices`. La table `seasonal_rates` et le `price-engine` existent, mais les données saisonnières ne sont jamais chargées ni transmises. Résultat : le prix calculé est toujours le prix standard, même en haute saison → **perte de revenu directe**.

### Fichier : `app/api/booking/route.ts`

### Action
1. Charger les `seasonal_rates` pour la villa concernée avant d'appeler `calculatePrice()`
2. Filtrer par période (check-in → check-out)
3. Passer les tarifs saisonniers à `calculatePrice()`
4. Le `price-engine.ts` doit prendre en compte les prix saisonniers quand ils existent, fallback au prix standard sinon

---

## 5. 🔴 Pas de handler `charge.refunded`

### Analyse

Si un refund est émis manuellement depuis le dashboard Stripe, le statut `payment_status` n'est **jamais** mis à jour en DB. Seul `session.expired` gère les refunds. Le booking reste "paid" alors qu'il a été remboursé.

### Fichier : `app/api/webhooks/stripe/route.ts`

### Action
- Ajouter le handler `charge.refunded` dans le switch webhook
- Mettre à jour `payment_status` → `refunded` sur le booking concerné
- Notifier le proprio (email Resend)

---

## ✅ Checklist
- [ ] COMMISSION_RATE = 0.25 (ou constante partagée)
- [ ] Dashboard proprio → afficher reversement 75% (pas CA brut)
- [ ] .env.local → toutes les clés ajoutées
- [ ] Tarifs saisonniers branchés dans calculatePrice()
- [ ] Handler charge.refunded ajouté
- [ ] `npm run build` passe
- [ ] Commit: `fix(stripe): P0 commission + dashboard + clés + seasonal_rates`
