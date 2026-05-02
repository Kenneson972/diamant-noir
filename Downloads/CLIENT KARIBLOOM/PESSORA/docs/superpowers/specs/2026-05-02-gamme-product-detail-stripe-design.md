# Spec — Page détail produit gamme + Stripe Checkout

**Date :** 2026-05-02
**Branche :** feat/gamme-product-detail-stripe
**Périmètre :** Page détail produit gamme · Panier unifié · Stripe Checkout · Zod validation

---

## Contexte

Les gammes produits (Sport, Skin, Wellness) sont maintenant gérées en DB via `gamme_products`. La prochaine étape est de permettre à un client de :
1. Voir le détail d'un produit gamme (page dédiée)
2. L'ajouter au panier avec une quantité
3. Payer en ligne via Stripe Checkout (même panier que les boissons bar)

Stripe n'est pas encore configuré — l'implémentation doit fonctionner en mode test et être prête pour la mise en production.

---

## Sous-projet 1 — Page détail + panier

### 1.1 Migration DB : slug sur `gamme_products`

```sql
ALTER TABLE public.gamme_products
  ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;
```

- Slugs générés automatiquement depuis le nom pour les 36 produits existants (ex: "Formula 1 950g" → "formula-1-950g")
- Règle de génération : minuscules, espaces → tirets, caractères spéciaux supprimés
- AdminGammes : champ slug auto-rempli depuis le nom à la création, éditable manuellement

### 1.2 Hook `useGammeProduct(gamme, slug)`

Fichier : `src/hooks/useGammeProduct.ts`

- Fetche depuis Supabase : `gamme_products.select('*').eq('gamme', gamme).eq('slug', slug).eq('active', true).single()`
- Retourne `{ product, loading, notFound }`
- Si `notFound: true` → la page affiche `<Navigate to="/nos-produits" />`

### 1.3 Page `GammeProductDetail.tsx`

Route : `/nos-produits/:gamme/:slug`

**Layout split éditorial (desktop) :**
- Gauche (45%) : image produit (`image_url`) ou puits neutre avec initiale si pas de photo
- Droite : breadcrumb, nom, description en italique, prix, sélecteur quantité, CTA

**Mobile :** colonne unique — image pleine largeur, infos dessous

**Breadcrumb :** `← Gamme Sport · Sous-catégorie` (lien vers `/nos-produits/:gamme`)

**Prix :**
- Si `price_alt` renseigné → `29 € / 39 €` avec label "petit format / grand format"
- Sinon → prix unique

**Sélecteur quantité :**
- Boutons `−` / `+`, valeur min 1, max 10
- Prix total dans le bouton CTA mis à jour dynamiquement (`unitPrice × qty`)

**CTA :** `Ajouter au panier · 65 €`
- Appelle `cartStore.addLine()` avec `source: 'gamme'`
- Ouvre le tiroir panier après ajout

**Sous le CTA :** mention "Retrait en boutique · Paiement sécurisé"

**Loading :** skeleton (image + texte) pendant le fetch Supabase

### 1.4 Update `CartLine` dans `cartStore.ts`

Ajout du champ `source: 'bar' | 'gamme'` à l'interface `CartLine`.

```typescript
export interface CartLine {
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  category: string;
  optionsKey: string;
  optionLabels: string[];
  image?: string;
  source: 'bar' | 'gamme'; // nouveau
}
```

Les items bar existants passent `source: 'bar'`. Les produits gamme passent `source: 'gamme'`.

### 1.5 Update `CartDrawer.tsx`

- Badge "Bar" ou "Boutique" sur chaque ligne selon `source`
- Le texte "Règlement sur place au bar. Ce total est indicatif." devient conditionnel :
  - Panier bar uniquement → texte actuel inchangé
  - Panier avec items gamme → "Produits boutique : paiement en ligne requis."
  - Panier mixte → les deux mentions
- Bouton principal remplacé par logique :
  - Panier bar uniquement → "Préparer ma venue" (lien `/contact`, comportement actuel)
  - Panier avec items gamme → "Commander — Payer en ligne" (déclenche Stripe)
  - Panier mixte → "Commander — Payer en ligne" (tout passe par Stripe)

### 1.6 Update `RangeDetail.tsx`

Le bouton "Renseignements" sur chaque card produit devient un `Link` vers `/nos-produits/:gamme/:slug`.

### 1.7 Update `NosProduits.tsx`

Les liens produits dans la liste overview pointent vers `/nos-produits/${range.id}/${slug}` au lieu de `/nos-produits/${range.id}`.

### 1.8 Update `AdminGammes.tsx`

Ajout du champ `slug` dans `GammeProductForm` :
- Auto-généré depuis le nom à la frappe (fonction `toSlug(name)`)
- Champ éditable manuellement
- Affiché avec validation "slug déjà utilisé"

### 1.9 Update `database.ts`

```typescript
gamme_products: {
  Row: {
    // ... champs existants
    slug: string | null  // nouveau
  }
  Insert: {
    // ... champs existants
    slug?: string | null
  }
  Update: {
    // ... champs existants
    slug?: string | null
  }
}
```

### 1.10 App.tsx

```tsx
const GammeProductDetail = lazy(() => import('./pages/GammeProductDetail'));
// ...
<Route path="/nos-produits/:gamme/:slug" element={<GammeProductDetail />} />
```

Pas de conflit de route : `/nos-produits/:rangeId` = 2 segments, `/nos-produits/:gamme/:slug` = 3 segments.

---

## Sous-projet 2 — Stripe Checkout

### 2.1 Zod schemas : `src/lib/checkoutSchema.ts`

```typescript
import { z } from 'zod'

export const CartLineSchema = z.object({
  productId: z.string().min(1),
  name: z.string().min(1),
  unitPrice: z.number().positive(),
  quantity: z.number().int().min(1).max(10),
  category: z.string(),
  optionsKey: z.string(),
  optionLabels: z.array(z.string()),
  image: z.string().optional(),
  source: z.enum(['bar', 'gamme']),
})

export const CheckoutRequestSchema = z.object({
  items: z.array(CartLineSchema).min(1),
  user_id: z.string().uuid(),
})

export type CartLinePayload = z.infer<typeof CartLineSchema>
export type CheckoutRequest = z.infer<typeof CheckoutRequestSchema>
```

### 2.2 Supabase Edge Function : `create-checkout-session`

Fichier : `supabase/functions/create-checkout-session/index.ts`

**Flux :**
1. Reçoit `{ items, user_id }` en POST
2. Valide avec `CheckoutRequestSchema.safeParse()` → 400 si invalide
3. Vérifie que `user_id` correspond à l'utilisateur authentifié (JWT)
4. Crée un `order` en DB (`status: 'pending'`)
5. Crée les `order_items` associés
6. Crée la Stripe Checkout Session :
   - `line_items` : un par CartLine
   - `mode: 'payment'`
   - `success_url: ${SITE_URL}/commande/succes?session_id={CHECKOUT_SESSION_ID}`
   - `cancel_url: ${SITE_URL}/commande/annulee`
   - `metadata: { order_id }`
   - `customer_email` : email du profil membre
7. Retourne `{ url: session.url }`

**Variables d'environnement requises :**
- `STRIPE_SECRET_KEY` (test: `sk_test_...`)
- `SITE_URL` (ex: `https://pessora.fr`)

### 2.3 Hook `useCheckout.ts`

Fichier : `src/hooks/useCheckout.ts`

```typescript
export function useCheckout() {
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()
  const navigate = useNavigate()

  const startCheckout = async (items: CartLine[]) => {
    if (!user) {
      // Stocke l'intention et redirige vers login — le CartDrawer restera en mémoire Zustand
      navigate('/connexion')
      return
    }
    setLoading(true)
    // appel Edge Function → redirect vers url Stripe
  }

  return { startCheckout, loading }
}
```

### 2.4 Pages `/commande/succes` et `/commande/annulee`

**Succès** (`src/pages/commande/CommandeSucces.tsx`) :
- Lit `?session_id=` dans l'URL
- Affiche confirmation (numéro de commande, récap items)
- Vide le panier (`clearCart()`)
- CTA "Voir mes commandes" → `/mon-espace/historique`

**Annulée** (`src/pages/commande/CommandeAnnulee.tsx`) :
- Message "Paiement annulé"
- CTA "Retourner au panier" → rouvre CartDrawer

### 2.5 CartDrawer — bouton Commander

```typescript
const { startCheckout, loading } = useCheckout()
const hasGammeItems = items.some(i => i.source === 'gamme')

// Bouton principal :
{hasGammeItems ? (
  <Button onPress={() => startCheckout(items)} isLoading={loading}>
    Commander — Payer en ligne
  </Button>
) : (
  <Link to="/contact">Préparer ma venue</Link>
)}
```

### 2.6 App.tsx — nouvelles routes

```tsx
const CommandeSucces = lazy(() => import('./pages/commande/CommandeSucces'))
const CommandeAnnulee = lazy(() => import('./pages/commande/CommandeAnnulee'))
// ...
<Route path="/commande/succes" element={<CommandeSucces />} />
<Route path="/commande/annulee" element={<CommandeAnnulee />} />
```

---

## Fichiers impactés

| Fichier | Changement |
|---------|------------|
| `supabase/migrations/20260502130000_add_slug_gamme_products.sql` | Colonne slug + slugs des 36 produits |
| `src/types/database.ts` | `slug` dans gamme_products |
| `src/hooks/useGammeProduct.ts` | Nouveau hook (créer) |
| `src/hooks/useCheckout.ts` | Nouveau hook (créer) |
| `src/lib/checkoutSchema.ts` | Schemas Zod (créer) |
| `src/store/cartStore.ts` | Ajout `source` à CartLine |
| `src/pages/GammeProductDetail.tsx` | Nouvelle page (créer) |
| `src/pages/commande/CommandeSucces.tsx` | Nouvelle page (créer) |
| `src/pages/commande/CommandeAnnulee.tsx` | Nouvelle page (créer) |
| `src/pages/RangeDetail.tsx` | Bouton Renseignements → Link vers detail |
| `src/pages/NosProduits.tsx` | Liens produits → detail |
| `src/pages/admin/AdminGammes.tsx` | Champ slug dans formulaire |
| `src/components/cart/CartDrawer.tsx` | Source badge + bouton Commander |
| `supabase/functions/create-checkout-session/index.ts` | Edge Function (créer) |
| `src/pages/Menu.tsx` | Passer `source: 'bar'` dans `addLine()` |
| `src/App.tsx` | Routes GammeProductDetail + Commande |

---

## Hors périmètre

- Webhook Stripe (mise à jour statut order après paiement) — phase suivante
- Livraison à domicile (retrait en boutique uniquement)
- Gestion des stocks
- Promotions / codes promo
- Upload d'images produit (URLs manuelles dans AdminGammes)
