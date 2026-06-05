# Audit Kayvilla diamant-noir — Logique métier & Infrastructure

**Date** : 2026-06-05
**Périmètre** : /opt/data/repos/diamant-noir
**Thèmes** : OTA, tarification saisonnière, éditeur villa, Resend, design system, perfs, .env

---

## 🔴 P0 — Bloquants

### 1. RESEND_API_KEY manquante → emails transactionnels KO
- **Fichier** : `.env.local`
- **Constats** : 
  - `resend` (v6.12.3) est dans `package.json`
  - `/api/villa-submissions/confirm/route.ts` instancie `new Resend(process.env.RESEND_API_KEY)` → sera `null`  
  - **Aucune occurrence** de `RESEND_API_KEY` dans `.env.local`
  - Conséquence : tous les emails Resend retourneront `{error: "Resend not configured"}`
- **Fichier** : `/api/send-booking-confirmation/route.ts` ne passe PAS par Resend mais par un webhook n8n → pas de fallback email direct
- **Action** : Ajouter `RESEND_API_KEY=re_...` dans `.env.local` + configurer `from` domain vérifié

### 2. STRIPE_SECRET_KEY manquante → Stripe inopérant
- **Fichier** : `.env.local`
- **Constats** : Aucune occurrence de `STRIPE_SECRET_KEY`
- **Fichier** : `app/api/booking/route.ts` ligne 211-218 : fallback vers "Stripe non configuré"
- **Action** : Ajouter `STRIPE_SECRET_KEY=sk_live_...` et `STRIPE_WEBHOOK_SECRET=whsec_...`

### 3. Tarifs saisonniers NON intégrés dans le calcul du prix de réservation
- **Fichiers** concernés :
  - `app/api/booking/route.ts` (l.131-135) — appelle `calculatePrice()` SANS `seasonalPrices`
  - `lib/price-engine.ts` — supporte `seasonalPrices` mais n'est jamais appelé avec
  - `components/booking/PriceCalculator.tsx` — utilise `pricePerNight` fixe, aucune query `seasonal_rates`
  - `supabase/migrations/20260531_seasonal_rates.sql` — table `seasonal_rates` existe en base
  - `components/dashboard/admin/SeasonalRatesManager.tsx` — UI admin pour gérer `seasonal_rates`
- **Constats** : 
  - La table `seasonal_rates` n'est interrogée QUE par l'UI admin `SeasonalRatesManager`
  - Le booking API (`POST /api/booking`) charge `villas.price_per_night` (l.95) mais jamais `seasonal_rates`
  - Le `PriceCalculator` client-side n'a pas de logique saisonnière
  - La fonction `calculatePrice` accepte un paramètre `seasonalPrices` (format `{season, start, end, price}` avec MM-DD) mais ce paramètre n'est jamais fourni
- **Impact** : Un client qui réserve en haute saison paie le prix de base. Perte de revenu directe.
- **Action** : 
  1. Dans `booking/route.ts`, query `seasonal_rates` filtré par `villa_id` + chevauchement de dates
  2. Passer le résultat à `calculatePrice({..., seasonalPrices})`
  3. Mettre à jour `PriceCalculator` pour fetcher les tarifs saisonniers

### 4. SQL Injection potentielle dans ical-sync.ts
- **Fichier** : `lib/ical-sync.ts` ligne 44
```typescript
.not("external_id", "in", `(${externalIds.join(',')})`);
```
- `externalIds` provient des UID iCal (`event.uid`) qui peuvent contenir des guillemets
- Comparer avec `lib/ota-hub.ts` l.134 qui fait pareil : 
```typescript
.not("external_id", "in", `(${externalIds.map((id) => `'${id}'`).join(",")})`)
```
- **Action** : Utiliser le helper Supabase natif : `.not("external_id", "in", externalIds)` (accepte un array)

---

## 🟠 P1 — Élevé

### 5. Deux systèmes iCal redondants → risque de doublons
- **Legacy** : `lib/ical-sync.ts`
  - external_id = `event.uid` brut (ex: `"abc123"`)
  - Source = "airbnb" uniquement
- **Nouveau** : `lib/ota-hub.ts`
  - external_id = `source_uid` (ex: `"airbnb_abc123"`)
  - Multi-source : airbnb/booking/expedia/vrbo/trivago/direct
- **Problème** : Les deux systèmes peuvent insérer dans `bookings` avec des `external_id` différents pour la même réservation → doublons si les deux sont actifs
- **Fichier** : `lib/ota-hub.ts` l.71-97 — fonction `migrateLegacyExternalIds` existe mais n'est pas forcément exécutée
- **Action** : 
  1. Exécuter `migrateLegacyExternalIds` sur toutes les données existantes
  2. Supprimer/déprécier `lib/ical-sync.ts`
  3. Ajouter une contrainte UNIQUE sur `(villa_id, external_id)` (déjà fait via migration `migration-missing-columns.sql`)

### 6. SeasonalPricesEditor utilise MM-DD sans année → bug potentiel
- **Fichier** : `components/dashboard/villa-editor/SeasonalPricesEditor.tsx`
- Placeholders : `"Début (MM-DD)"`, `"Fin (MM-DD)"`
- Ces données sont stockées dans `villas.seasonal_prices` (JSONB)
- Si une saison chevauche le nouvel an (ex: 15/12 → 05/01), MM-DD seul casse la comparaison (car `"12-15" > "01-05"` lexicographiquement)
- **Action** : Remplacer par des dates complètes YYYY-MM-DD, ou utiliser la table `seasonal_rates` comme source unique de vérité

### 7. Pas d'email automatique après une réservation
- **Fichier** : `app/api/booking/route.ts` — crée une réservation, crée une session Stripe, mais **n'envoie aucun email**
- `/api/send-booking-confirmation` existe mais n'est pas appelée automatiquement
- `/api/notify-admin-booking` existe mais n'est pas appelée
- **Impact** : Le client ne reçoit pas de confirmation, l'admin n'est pas notifié
- **Action** : Appeler `/api/send-booking-confirmation` après création du booking, ou intégrer Resend directement dans la route booking

### 8. Dépendance n8n pour les emails → single point of failure
- Les emails transactionnels passent par des webhooks n8n (`BOOKING_CONFIRMATION_WEBHOOK`, `N8N_WEBHOOK_URL`)
- Si n8n est down, aucun email n'est envoyé
- Le package `resend` est installé mais sous-utilisé (seulement pour villa-submissions/confirm)
- **Action** : Migrer tous les emails transactionnels vers Resend directement (pas via n8n)

---

## 🟡 P2 — Moyen

### 9. Double modèle de données pour les prix saisonniers
- **JSONB** `villas.seasonal_prices` : utilisé par `SeasonalPricesEditor`, format `{season, start, end, price}`
- **Table** `seasonal_rates` : utilisé par `SeasonalRatesManager`, format `{label, start_date, end_date, price_per_night}`
- Deux UI différentes, deux stockages, aucune synchronisation
- **Action** : Unifier sur la table `seasonal_rates` (dates complètes, typage fort)

### 10. Cohérence `price_per_night` en centimes vs euros
- `seasonal_rates.price_per_night` : défini comme `INTEGER NOT NULL -- en centimes` dans la migration SQL
- `SeasonalRatesManager.tsx` : traite la valeur comme des euros (`parseInt(newRate.price_per_night)`) et l'affiche avec `formatPrice(cents)` qui formate comme des euros
- Si la DB stocke en centimes mais l'UI insère des euros, les prix seront 100x trop élevés
- **Action** : Vérifier les valeurs réelles en base et aligner UI/DB

### 11. shadcn/ui partiel — pas de design system complet
- Composants présents : `button`, `card`, `input`, `skeleton`, `tabs`
- Manquants : `dialog`, `dropdown-menu` (utilise Radix directement), `tooltip`, `toast`, `select`, `textarea`
- Beaucoup de composants UI sont faits main avec des classes Tailwind inline
- **Positif** : La cohérence visuelle navy/gold est bien respectée via `tailwind.config.ts`
- **Action** : Ajouter les composants shadcn manquants pour standardiser

### 12. Performance — bonnes pratiques respectées
- ✅ Tous les composants utilisent `next/image` (34 imports recensés)
- ✅ Aucun `<img>` natif trouvé dans le JSX
- ✅ `loading.tsx` et `error.tsx` présents sur les routes clés
- ✅ `content-visibility: auto` utilisé sur les sections longues via `.cv-auto`
- ✅ `prefers-reduced-motion` respecté
- ⚠️ Pas de lazy loading explicite sur les routes lourdes (villas listing)
- ⚠️ Pas de `priority` flag sur les images LCP (hero)

---

## 📊 Design System — Vérification navy/gold

| Élément | Statut | Notes |
|---------|--------|-------|
| Palette `navy` | ✅ | `#0A0A0A` — override Tailwind |
| Palette `gold` | ✅ | `#D4AF37` — utilisé dans tous les composants |
| Typo display | ✅ | Playfair Display via `--font-playfair` |
| Typo body | ✅ | Instrument Sans via `--font-instrument-sans` |
| Border radius | ✅ Cohérent | `rounded-xl`, `rounded-2xl`, `rounded-[32px]` |
| Couleurs sémantiques | ✅ | `cream`, `champagne`, `sand`, `offwhite`, `muted` |
| Composants shadcn | ⚠️ Partiel | Manque ~10 composants |

---

## 📧 Emails transactionnels — Résumé

| Email | Déclencheur | Technologie | Statut |
|-------|-------------|-------------|--------|
| Confirmation demande conciergerie | `POST /api/villa-submissions/confirm` | Resend direct | 🔴 KO — `RESEND_API_KEY` manquante |
| Confirmation réservation client | `POST /api/send-booking-confirmation` | Webhook n8n | 🟡 Non appelé automatiquement |
| Notification admin nouvelle résa | `POST /api/notify-admin-booking` | Webhook n8n | 🟡 Non appelé automatiquement |
| Email propriétaire (copilot) | n8n workflow externe | n8n | ⚪ Hors scope audit |

---

## 🔑 .env.local — Clés manquantes

| Clé | Présente | Impact |
|-----|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | |
| `STRIPE_SECRET_KEY` | 🔴 | Paiements inopérants |
| `STRIPE_WEBHOOK_SECRET` | 🔴 | Pas de callback Stripe |
| `RESEND_API_KEY` | 🔴 | Emails transactionnels KO |
| `NEXT_PUBLIC_BASE_URL` | 🔴 | Fallback localhost:3000 |
| `API_SECRET_KEY` | 🔴 | `/api/send-booking-confirmation` refuse toutes les requêtes |
| `N8N_WEBHOOK_URL` | 🔴 | Chatbot / notifications inopérants |
| `N8N_OWNER_WEBHOOK_URL` | 🔴 | Copilot propriétaire inopérant |

---

## 📁 Fichiers modifiés / créés

- **Créé** : `docs/audits/audit-diamant-noir-2026-06-05.md` (ce fichier)

---

## 🎯 Priorités d'action

1. **Immédiat (P0)** : Ajouter `RESEND_API_KEY` + `STRIPE_SECRET_KEY` dans `.env.local`
2. **Immédiat (P0)** : Intégrer `seasonal_rates` dans le calcul de prix (`booking/route.ts` ligne 131)
3. **Immédiat (P0)** : Corriger la SQL injection dans `ical-sync.ts` et `ota-hub.ts`
4. **Court terme (P1)** : Migrer `ical-sync.ts` → `ota-hub.ts`, exécuter `migrateLegacyExternalIds`
5. **Court terme (P1)** : Déclencher les emails automatiquement après réservation
6. **Moyen terme (P2)** : Unifier `seasonal_prices` JSONB et `seasonal_rates` table
7. **Moyen terme (P2)** : Compléter les composants shadcn/ui
