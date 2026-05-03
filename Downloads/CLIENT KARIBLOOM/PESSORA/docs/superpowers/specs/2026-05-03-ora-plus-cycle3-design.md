# Óra+ Stripe — Cycle 3 Design

**Date :** 2026-05-03  
**Branche :** `feat/supabase-events-bilan`  
**Statut :** Approuvé

## Objectif

Deux axes indépendants :

1. **C — Menu/DrinkDetail depuis Supabase** : connecter les pages publiques à la table `products` (les données sont déjà en DB, seules `Menu.tsx` et `DrinkDetail.tsx` restent sur `menuData.ts` statique).
2. **B — Gestion Stripe admin** : depuis `AdminMemberDetail`, afficher les données Stripe en temps réel et permettre d'annuler un abonnement ou d'ouvrir le portail Stripe du membre.

## Périmètre — Ce qui est déjà en place

- Table `products` : seedée, colonnes `slug`, `price_small/medium/large`, `icon_emoji`, `active`, `badges`, `carousel_sort`, `carousel_badge`.
- `AdminProduits.tsx` : CRUD complet sur `products`.
- `useHomeCarousel.ts` et `useSearch.ts` : lisent déjà depuis Supabase.
- `AdminMemberDetail.tsx` : édition DB manuelle du plan/statut, pas d'appel Stripe API.
- Cycle 1 : Edge Functions `create-subscription-session`, `stripe-webhook`, `verify-subscription-session` déjà déployées.

## Section C — Menu/DrinkDetail depuis Supabase

### Hook `useMenuProducts`

Nouveau fichier : `src/hooks/useMenuProducts.ts`

```ts
function useMenuProducts(category?: string): {
  products: Product[]
  loading: boolean
  error: string | null
}
```

- Fetch `products WHERE active = true`, filtre optionnel par `category`.
- Ordre : `carousel_sort ASC NULLS LAST, name ASC`.
- Annule le fetch si le composant est démonté (flag `cancelled`).

### Menu.tsx

- Remplace l'import de `menuItems` par `useMenuProducts()` (toutes catégories).
- Groupe par catégorie côté client (même logique existante).
- Affiche le skeleton existant pendant le chargement.
- `categoryNames`, `milkOptions`, `boosters` restent importés depuis `menuData.ts` (configs statiques, pas de données produit).

### DrinkDetail.tsx

- Route actuelle : `/menu/:drinkId` où `drinkId` = `slug` dans `products`.
- Remplace `catalogItems.find(item => item.id === drinkId)` par un fetch Supabase :
  `products WHERE slug = drinkId AND active = true LIMIT 1`.
- Pattern identique à `useGammeProduct.ts` (flag `cancelled`, états `loading` / `notFound`).
- Si `notFound` → `<Navigate to="/menu" replace />`.

### menuData.ts

Conservé intact — `milkOptions`, `boosters`, `categoryNames` sont toujours nécessaires. Seul le tableau `menuItems` devient inutilisé après la migration (supprimable en Cycle 4 sans risque).

## Section B — Gestion Stripe Admin

### Edge Functions (3 nouvelles)

#### `get-stripe-member`

- Méthode : GET, paramètre query `stripe_customer_id`.
- Auth : JWT requis, vérifie `is_admin()`.
- Appel Stripe : `stripe.customers.retrieve(customerId, { expand: ['subscriptions'] })`.
- Retourne :
  ```json
  {
    "status": "active",
    "current_period_end": 1748908800,
    "cancel_at_period_end": false,
    "plan_name": "Óra+",
    "amount": 2490,
    "payment_method": { "brand": "visa", "last4": "4242", "exp_month": 12, "exp_year": 27 }
  }
  ```
- 503 si `STRIPE_SECRET_KEY` absent.

#### `cancel-stripe-subscription`

- Méthode : POST, body `{ stripe_subscription_id: string }`.
- Auth : JWT requis, vérifie `is_admin()`.
- Appel Stripe : `stripe.subscriptions.update(id, { cancel_at_period_end: true })`.
- Met à jour la DB : `subscriptions SET cancel_at_period_end = true WHERE stripe_subscription_id = id`.
- Retourne `{ success: true, cancel_at: <timestamp> }`.

#### `admin-portal-session`

- Méthode : POST, body `{ stripe_customer_id: string, return_url: string }`.
- Auth : JWT requis, vérifie `is_admin()`.
- Appel Stripe : `stripe.billingPortal.sessions.create({ customer, return_url })`.
- Retourne `{ url: string }` → ouvert côté client via `window.open(url, '_blank')`.

### UI — AdminMemberDetail.tsx

Nouvelle section **"Abonnement Stripe"** ajoutée sous le bloc abonnement existant. Visible uniquement si `subscription?.stripe_subscription_id` est défini.

**États :**

1. **Chargement** : skeleton 3 colonnes pendant le fetch `get-stripe-member`.
2. **Actif** :
   - 3 KPI cards : Plan + montant / Prochain prélèvement / Moyen de paiement (brand + last4).
   - ID Stripe en monospace (lecture seule).
   - Bouton "Portail Stripe ↗" → `admin-portal-session` → `window.open`.
   - Bouton "Annuler abonnement" (rouge) → `ConfirmDialog` → `cancel-stripe-subscription` → re-fetch.
3. **Annulation programmée** (`cancel_at_period_end: true`) :
   - Badge orange "Annulation le [date]".
   - Bandeau d'alerte orange.
   - Bouton "Annulé" désactivé.
4. **Erreur Stripe** (STRIPE_SECRET_KEY absent ou API error) : message discret "Données Stripe indisponibles" sans bloquer le reste de la fiche.

### DB — colonne `cancel_at_period_end`

Migration one-shot : `ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS cancel_at_period_end boolean DEFAULT false`.

## Ordre d'implémentation

1. Hook `useMenuProducts` + Menu.tsx
2. DrinkDetail.tsx depuis Supabase
3. Migration `cancel_at_period_end`
4. Edge Function `get-stripe-member`
5. Edge Function `cancel-stripe-subscription`
6. Edge Function `admin-portal-session`
7. AdminMemberDetail — section Stripe UI
8. Déploiement des 3 Edge Functions

## Hors scope

- Réactivation d'un abonnement annulé depuis l'admin.
- Édition du moyen de paiement depuis l'admin.
- Emails transactionnels (Cycle 4).
- Suppression du tableau `menuItems` dans `menuData.ts` (Cycle 4).
