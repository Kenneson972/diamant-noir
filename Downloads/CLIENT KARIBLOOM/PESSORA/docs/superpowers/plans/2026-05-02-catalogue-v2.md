# Catalogue PESSORA v2 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add multi-size pricing to bar drinks, fix drink data, and move gamme products (Sport/Skin/Wellness) to Supabase with a full admin CRUD interface.

**Architecture:** Four layers — (1) Supabase schema migrations, (2) TypeScript type updates + static data corrections, (3) Frontend features (size selector, RangeDetail Supabase), (4) New admin page AdminGammes with sidebar layout. Each layer builds on the previous.

**Tech Stack:** React 18, TypeScript, Supabase (PostgreSQL), HeroUI v3 (`@heroui/react`, `@heroui-pro/react`), Tailwind CSS v4, React Router v6, Lucide React icons.

**Spec:** `docs/superpowers/specs/2026-05-02-catalogue-v2-design.md`

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `supabase/migrations/20260502120000_add_price_sizes_products.sql` | Create | Add price_small/medium/large columns to products |
| `supabase/migrations/20260502120100_fix_menu_products_data.sql` | Create | Coco Boost delete, archives, Immuni'Tea, Hydra Boost, size prices |
| `supabase/migrations/20260502120200_create_gamme_products.sql` | Create | New gamme_products table + RLS |
| `supabase/migrations/20260502120300_seed_gamme_products.sql` | Create | All 36 real gamme products with correct prices |
| `src/types/database.ts` | Modify | Add price_small/medium/large to products.Row + gamme_products table |
| `src/data/menuData.ts` | Modify | Add price_small/medium/large to MenuItem interface, fix items |
| `src/data/productsData.ts` | Modify | Update with real prices/products as Supabase fallback |
| `src/lib/menuCatalog.ts` | Modify | Map price_small/medium/large in productRowToMenuItem |
| `src/components/ui/ProductCard.tsx` | Modify | Add optional `footer?: React.ReactNode` prop |
| `src/pages/Menu.tsx` | Modify | Size selector state + conditional renderCard |
| `src/pages/admin/AdminProduits.tsx` | Modify | Price size fields in form + archive/restore UI |
| `src/hooks/useGammeCatalog.ts` | Create | Hook: fetch gamme_products from Supabase with fallback |
| `src/pages/RangeDetail.tsx` | Modify | Use useGammeCatalog, group by subcategory |
| `src/pages/admin/AdminGammes.tsx` | Create | New admin page with sidebar CRUD |
| `src/pages/admin/AdminLayout.tsx` | Modify | Add "Gammes" entry to NAV array |
| `src/App.tsx` | Modify | Lazy import + Route for AdminGammes |

---

## Task 1 — Schema: price sizes on products table

**Files:**
- Create: `supabase/migrations/20260502120000_add_price_sizes_products.sql`

- [ ] **Step 1: Write the migration**

```sql
-- PESSORA — Prix multi-tailles pour les boissons bar
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS price_small  numeric,
  ADD COLUMN IF NOT EXISTS price_medium numeric,
  ADD COLUMN IF NOT EXISTS price_large  numeric;

COMMENT ON COLUMN public.products.price_small  IS 'Prix format Petit (ex: 8€ énergie, 10€ shakes)';
COMMENT ON COLUMN public.products.price_medium IS 'Prix format Moyen — prix de référence affiché par défaut';
COMMENT ON COLUMN public.products.price_large  IS 'Prix format Grand (ex: 12€ énergie, 16€ shakes)';
```

- [ ] **Step 2: Apply the migration**

```bash
cd "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/PESSORA"
npx supabase db push
```

Expected: `Applying migration 20260502120000_add_price_sizes_products.sql... done`

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260502120000_add_price_sizes_products.sql
git commit -m "feat(db): add price_small/medium/large columns to products"
```

---

## Task 2 — Data migration: fix menu products

**Files:**
- Create: `supabase/migrations/20260502120100_fix_menu_products_data.sql`

- [ ] **Step 1: Write the migration**

```sql
-- PESSORA — Corrections catalogue boissons bar
-- 1. Supprimer Coco Boost (n'existe plus)
DELETE FROM public.products WHERE slug = 'coco-boost';

-- 2. Archiver Detox My Body et Tiramisu Gourmand
UPDATE public.products SET active = false
WHERE slug IN ('detox-my-body', 'tiramisu-gourmand');

-- 3. Renommer Immune Paradis → Immuni'Tea + update ingrédients/bénéfices
UPDATE public.products SET
  slug        = 'immuni-tea',
  name        = 'IMMUNI''TEA',
  icon_emoji  = '🌺',
  ingredients = ARRAY['Baie sauvage', 'Collagène', 'Citron']::text[],
  benefits    = ARRAY['Système immunitaire', 'Articulation', 'Brûle graisse']::text[],
  pitch       = 'Renforce vos défenses naturelles',
  description = 'Renforce vos défenses naturelles'
WHERE slug = 'immune-paradis';

-- 4. Ajouter Hydra Boost Litchi
INSERT INTO public.products (slug, name, category, price, price_small, price_medium, price_large, calories, description, ingredients, benefits, pitch, icon_emoji, active, badges)
VALUES (
  'hydra-boost-litchi',
  'HYDRA BOOST LITCHI',
  'energie',
  10,
  8, 10, 12,
  40,
  'Hydratation profonde & récupération',
  ARRAY['Orange', 'Litchi', 'Électrolytes']::text[],
  ARRAY['Hydratation profonde', 'Récupération', 'Endurance']::text[],
  'Hydratation profonde & récupération',
  '🍊',
  true,
  ARRAY[]::text[]
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  price_small = EXCLUDED.price_small,
  price_medium = EXCLUDED.price_medium,
  price_large = EXCLUDED.price_large;

-- 5. Appliquer prix multi-tailles — Shakes (P:10 / M:14 / G:16)
UPDATE public.products SET
  price_small  = 10,
  price_medium = 14,
  price_large  = 16
WHERE category = 'shakes' AND active = true;

-- 6. Appliquer prix multi-tailles — Énergie (P:8 / M:10 / G:12)
UPDATE public.products SET
  price_small  = 8,
  price_medium = 10,
  price_large  = 12
WHERE category = 'energie' AND active = true;

-- 7. Appliquer prix multi-tailles — Wellness (P:8 / M:10 / G:12)
UPDATE public.products SET
  price_small  = 8,
  price_medium = 10,
  price_large  = 12
WHERE category = 'wellness' AND active = true;
```

- [ ] **Step 2: Apply**

```bash
npx supabase db push
```

Expected: `Applying migration 20260502120100_fix_menu_products_data.sql... done`

- [ ] **Step 3: Verify in Supabase Studio**

Run in SQL editor:
```sql
SELECT slug, name, active, price_small, price_medium, price_large FROM products ORDER BY category, name;
```

Expected: Coco Boost absent, Detox My Body + Tiramisu active=false, IMMUNI'TEA present, Hydra Boost Litchi present, shakes/energie/wellness have all 3 size prices set.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260502120100_fix_menu_products_data.sql
git commit -m "feat(db): fix menu products — sizes, Immuni'Tea, Hydra Boost, archives"
```

---

## Task 3 — Schema: gamme_products table

**Files:**
- Create: `supabase/migrations/20260502120200_create_gamme_products.sql`
- Create: `supabase/migrations/20260502120300_seed_gamme_products.sql`

- [ ] **Step 1: Write table migration**

```sql
-- PESSORA — Table gamme_products (Sport / Skin / Wellness)
CREATE TABLE IF NOT EXISTS public.gamme_products (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  gamme       text        NOT NULL CHECK (gamme IN ('sport', 'skin', 'wellness')),
  subcategory text,
  name        text        NOT NULL,
  description text,
  price       numeric     NOT NULL,
  price_alt   numeric,
  active      boolean     NOT NULL DEFAULT true,
  image_url   text,
  sort_order  integer     NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE  public.gamme_products                IS 'Produits physiques vendus (Sport, Skin, Wellness)';
COMMENT ON COLUMN public.gamme_products.subcategory    IS 'Sous-catégorie : sport|encas (sport) · nettoyage|korean|contour|serum (skin) · null (wellness)';
COMMENT ON COLUMN public.gamme_products.price_alt      IS 'Prix alternatif — ex: Gel Nettoyant 29€/39€ (format différent)';

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS gamme_products_gamme_idx      ON public.gamme_products (gamme);
CREATE INDEX IF NOT EXISTS gamme_products_active_idx     ON public.gamme_products (active);
CREATE INDEX IF NOT EXISTS gamme_products_sort_order_idx ON public.gamme_products (gamme, sort_order);

-- RLS
ALTER TABLE public.gamme_products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "gamme_products_select_public"  ON public.gamme_products;
CREATE POLICY "gamme_products_select_public"
  ON public.gamme_products FOR SELECT
  TO public
  USING (active = true);

DROP POLICY IF EXISTS "gamme_products_select_admin"   ON public.gamme_products;
CREATE POLICY "gamme_products_select_admin"
  ON public.gamme_products FOR SELECT
  TO authenticated
  USING ((SELECT public.is_admin()));

DROP POLICY IF EXISTS "gamme_products_insert_admin"   ON public.gamme_products;
CREATE POLICY "gamme_products_insert_admin"
  ON public.gamme_products FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT public.is_admin()));

DROP POLICY IF EXISTS "gamme_products_update_admin"   ON public.gamme_products;
CREATE POLICY "gamme_products_update_admin"
  ON public.gamme_products FOR UPDATE
  TO authenticated
  USING      ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

DROP POLICY IF EXISTS "gamme_products_delete_admin"   ON public.gamme_products;
CREATE POLICY "gamme_products_delete_admin"
  ON public.gamme_products FOR DELETE
  TO authenticated
  USING ((SELECT public.is_admin()));
```

- [ ] **Step 2: Write seed migration**

```sql
-- PESSORA — Seed gamme_products (données réelles cartes 2026-04-20)
INSERT INTO public.gamme_products (gamme, subcategory, name, description, price, price_alt, sort_order) VALUES

-- ── GAMME SPORT — Sport ────────────────────────────────────────────────────
('sport', 'sport', 'Formula 1 950g',         'Repas nutritionnel complet en shake',   65,   NULL, 1),
('sport', 'sport', 'Créatine',               'Améliore la force et la puissance',     45,   NULL, 2),
('sport', 'sport', 'Rebuild Whey',           'Shake de récupération post-effort',     90,   NULL, 3),
('sport', 'sport', 'Gel Prolong',            'Énergie soutenue pour efforts longs',   35,   NULL, 4),
('sport', 'sport', 'Electrolytes CR7 Boîte', 'Boisson hypotonique endurance — boîte', 40,   NULL, 5),
('sport', 'sport', 'Electrolytes Sachet x10','Sachet pratique hydratation',           30,   NULL, 6),
('sport', 'sport', 'Omega 3',                'Acides gras essentiels santé cardiaque',40,   NULL, 7),
('sport', 'sport', 'Hydrate',                'Électrolytes pour l''hydratation',      50,   NULL, 8),
('sport', 'sport', 'Protein Drink PDM',      'Boisson protéinée prête à boire',       75,   NULL, 9),
('sport', 'sport', 'LiftOff Pamplemousse',   'Tablette effervescente énergie — pamplemousse', 40, NULL, 10),
('sport', 'sport', 'LiftOff Citron',         'Tablette effervescente énergie — citron', 40,  NULL, 11),

-- ── GAMME SPORT — Encas ───────────────────────────────────────────────────
('sport', 'encas', 'Chips BBQ Onions x10',   'Encas savoureux riche en protéines',    30,   NULL, 1),
('sport', 'encas', 'Barre Sport x6',         'Barre protéinée récupération',          35,   NULL, 2),
('sport', 'encas', 'Barre Céréales x7',      'Barre céréales croustillante et saine', 35,   NULL, 3),
('sport', 'encas', 'Barres Collations x14',  'Pack encas variés',                     40,   NULL, 4),

-- ── GAMME SKIN — Nettoyage ────────────────────────────────────────────────
('skin', 'nettoyage', 'Gel Nettoyant Resurface', 'Nettoyage en profondeur sans dessécher',  29, 39, 1),
('skin', 'nettoyage', 'Gommage',                 'Exfoliant doux pour peau lumineuse',       29, NULL, 2),
('skin', 'nettoyage', 'Lotion Tonique Revitalisant', 'Tonifie et revitalise le teint',       22, NULL, 3),
('skin', 'nettoyage', 'Masque d''Argile',         'Masque purifiant pour pores dilatés',     25, NULL, 4),
('skin', 'nettoyage', 'Exfoliant',                'Gommage corps pour peau douce',            24, NULL, 5),

-- ── GAMME SKIN — Korean Products ─────────────────────────────────────────
('skin', 'korean', 'Crème Hydratante FPS 30',  'Protection solaire + hydratation intense',  55, NULL, 1),
('skin', 'korean', 'Crème Hydrant Éclat',      'Hydratation quotidienne + effet éclat',     55, NULL, 2),
('skin', 'korean', 'Lotion Nourrissante',       'Soin corps pour peau douce',                29, NULL, 3),

-- ── GAMME SKIN — Contour des Yeux ────────────────────────────────────────
('skin', 'contour', 'Gel Contour Yeux',       'Réduit poches et cernes',                    45, NULL, 1),
('skin', 'contour', 'Crème Hydrant Yeux',     'Hydratation intense contour yeux',            45, NULL, 2),
('skin', 'contour', 'Crème Contour Yeux',     'Anti-rides et raffermir',                     49, NULL, 3),

-- ── GAMME SKIN — Sérum / Anti-Âge ────────────────────────────────────────
('skin', 'serum', 'Sérum Rides',              'Concentré anti-rides haute efficacité',      75, NULL, 1),
('skin', 'serum', 'Sérum Niacinamide 10%',    'Réduit pores et unifie le teint',            55, NULL, 2),
('skin', 'serum', 'Crème Tension Ultime',     'Raffermissement et densité cutanée',         89, NULL, 3),
('skin', 'serum', 'Crème de Nuit',            'Régénération cellulaire nocturne',           88, NULL, 4),

-- ── GAMME WELLNESS ────────────────────────────────────────────────────────
('wellness', NULL, 'Aloe Vera',          'Concentré d''aloé vera pure pour l''hydratation', 60, NULL, 1),
('wellness', NULL, 'Collagène',          'Collagène marin pour peau, ongles et articulations', 85, NULL, 2),
('wellness', NULL, 'Thé Detox',          'Mélange détoxifiant pour drainer et purifier',   45, NULL, 3),
('wellness', NULL, 'Fibres',             'Mélange riche en fibres pour confort digestif',  45, NULL, 4),
('wellness', NULL, 'Complex Vitamine',   'Complexe multivitaminé quotidien',               35, NULL, 5),
('wellness', NULL, 'Minéral Complex',    'Minéraux essentiels pour l''équilibre',          45, NULL, 6);
```

- [ ] **Step 3: Apply both migrations**

```bash
npx supabase db push
```

Expected: Both migrations applied successfully.

- [ ] **Step 4: Verify**

```sql
SELECT gamme, subcategory, COUNT(*) FROM gamme_products GROUP BY gamme, subcategory ORDER BY gamme, subcategory;
```

Expected:
```
sport   | encas     | 4
sport   | sport     | 11
skin    | contour   | 3
skin    | korean    | 3
skin    | nettoyage | 5
skin    | serum     | 4
wellness| null      | 6
```

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260502120200_create_gamme_products.sql
git add supabase/migrations/20260502120300_seed_gamme_products.sql
git commit -m "feat(db): create gamme_products table and seed with real catalog data"
```

---

## Task 4 — TypeScript types

**Files:**
- Modify: `src/types/database.ts`

- [ ] **Step 1: Add price_small/medium/large to products.Row**

In `src/types/database.ts`, find the `products` table Row definition (lines 130-153). Add the 3 columns after `carousel_badge`:

```typescript
// In products.Row, after `carousel_badge: string | null`:
price_small: number | null
price_medium: number | null
price_large: number | null
```

The full products table section becomes:

```typescript
products: {
  Row: {
    id: string
    name: string
    category: string
    price: number | null
    calories: number | null
    protein: number | null
    description: string | null
    ingredients: string[] | null
    benefits: string[] | null
    image_url: string | null
    active: boolean
    slug: string | null
    pitch: string | null
    icon_emoji: string | null
    badges: string[] | null
    carousel_sort: number | null
    carousel_badge: string | null
    price_small: number | null
    price_medium: number | null
    price_large: number | null
    created_at: string
  }
  Insert: Omit<Database['public']['Tables']['products']['Row'], 'id' | 'created_at'>
  Update: Partial<Omit<Database['public']['Tables']['products']['Row'], 'id' | 'created_at'>>
  Relationships: []
}
```

- [ ] **Step 2: Add gamme_products table to database.ts**

Add the following block inside `Tables` in `Database['public']`, after the `products` table definition:

```typescript
gamme_products: {
  Row: {
    id: string
    gamme: 'sport' | 'skin' | 'wellness'
    subcategory: string | null
    name: string
    description: string | null
    price: number
    price_alt: number | null
    active: boolean
    image_url: string | null
    sort_order: number
    created_at: string
  }
  Insert: Omit<Database['public']['Tables']['gamme_products']['Row'], 'id' | 'created_at'>
  Update: Partial<Omit<Database['public']['Tables']['gamme_products']['Row'], 'id' | 'created_at'>>
  Relationships: []
}
```

- [ ] **Step 3: Export GammeProduct convenience type**

At the bottom of `src/types/database.ts`, after the existing type exports, add:

```typescript
export type GammeProduct = Database['public']['Tables']['gamme_products']['Row']
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/PESSORA"
npx tsc --noEmit 2>&1 | head -30
```

Expected: No errors (or only pre-existing errors unrelated to these changes).

- [ ] **Step 5: Commit**

```bash
git add src/types/database.ts
git commit -m "feat(types): add price sizes to Product, add GammeProduct type"
```

---

## Task 5 — Update menuData.ts and menuCatalog.ts

**Files:**
- Modify: `src/data/menuData.ts`
- Modify: `src/lib/menuCatalog.ts`

- [ ] **Step 1: Add price fields to MenuItem interface**

In `src/data/menuData.ts`, replace the `MenuItem` interface (lines 1-14) with:

```typescript
export interface MenuItem {
  id: string;
  name: string;
  description: string;
  category: 'wellness' | 'energie' | 'shakes' | 'coffee';
  price: number;
  price_small?: number;
  price_medium?: number;
  price_large?: number;
  calories?: number;
  protein?: number;
  ingredients: string[];
  benefits: string[];
  pitch: string;
  icon?: string;
  badges?: ('vegan' | 'glutenfree' | 'vitamins')[];
}
```

- [ ] **Step 2: Fix wellness items (Immuni'Tea, archive Detox My Body)**

Replace the `wellnessItems` array (lines 30-70):

```typescript
export const wellnessItems: MenuItem[] = [
  {
    id: 'glow-my-skin',
    name: 'GLOW MY SKIN',
    description: 'Le cocktail beauté par excellence',
    category: 'wellness',
    price: 10,
    price_small: 8,
    price_medium: 10,
    price_large: 12,
    calories: 30,
    ingredients: ['Hibiscus', 'Collagène', 'Fraise', 'Citron'],
    benefits: ['Articulation', 'Circulation sanguine', 'Peau', 'Ongles et cheveux'],
    pitch: 'Le cocktail beauté par excellence',
    icon: '✨',
    badges: [],
  },
  {
    id: 'immuni-tea',
    name: 'IMMUNI\'TEA',
    description: 'Renforce vos défenses naturelles',
    category: 'wellness',
    price: 10,
    price_small: 8,
    price_medium: 10,
    price_large: 12,
    calories: 35,
    ingredients: ['Baie sauvage', 'Collagène', 'Citron'],
    benefits: ['Système immunitaire', 'Articulation', 'Brûle graisse'],
    pitch: 'Renforce vos défenses naturelles',
    icon: '🌺',
    badges: [],
  },
];
```

- [ ] **Step 3: Fix energie items (remove Coco Boost, add Hydra Boost Litchi)**

Replace the `energieItems` array (lines 73-113):

```typescript
export const energieItems: MenuItem[] = [
  {
    id: 'spicy-mango',
    name: 'SPICY MANGO',
    description: 'Le boost tropical et puissant',
    category: 'energie',
    price: 10,
    price_small: 8,
    price_medium: 10,
    price_large: 12,
    calories: 50,
    ingredients: ['Mangue épicée', 'Açaï', 'Hibiscus', 'Orange', 'Électrolytes'],
    benefits: ['Énergie douce', 'Anti-crampe', 'Endurance', 'Puissance'],
    pitch: 'Le boost tropical et puissant',
    icon: '🔥',
    badges: [],
  },
  {
    id: 'hydra-boost-litchi',
    name: 'HYDRA BOOST LITCHI',
    description: 'Hydratation profonde & récupération',
    category: 'energie',
    price: 10,
    price_small: 8,
    price_medium: 10,
    price_large: 12,
    calories: 40,
    ingredients: ['Orange', 'Litchi', 'Électrolytes'],
    benefits: ['Hydratation profonde', 'Récupération', 'Endurance'],
    pitch: 'Hydratation profonde & récupération',
    icon: '🍊',
    badges: [],
  },
  {
    id: 'blue-lagoon',
    name: 'BLUE LAGOON',
    description: 'L\'électrochoc frais pour se réveiller',
    category: 'energie',
    price: 10,
    price_small: 8,
    price_medium: 10,
    price_large: 12,
    calories: 50,
    ingredients: ['Créatine', 'Yuzu', 'Açaï', 'Citron', 'Curaçao', 'Menthe', 'Caféine de Guarana', 'Biotine', 'Taurine'],
    benefits: ['Énergie immédiate', 'Réduction de la fatigue', 'Puissance', 'Force'],
    pitch: 'L\'électrochoc frais pour se réveiller',
    icon: '💙',
    badges: [],
  },
];
```

- [ ] **Step 4: Add size prices to shakesItems**

Replace the `shakesItems` array (lines 116-201). Only the price fields change; content stays the same:

```typescript
export const shakesItems: MenuItem[] = [
  {
    id: 'pink-dragon',
    name: 'PINK DRAGON',
    description: 'Fruité & Beauté',
    category: 'shakes',
    price: 14,
    price_small: 10,
    price_medium: 14,
    price_large: 16,
    calories: 250,
    protein: 25,
    ingredients: ['Fruit du dragon', 'Collagène', 'Fraise'],
    benefits: ['Récupération', 'Beauté', '25g protéines', '25 vitamines & minéraux'],
    pitch: 'Fruité & Beauté',
    icon: '🐉',
    badges: ['vegan', 'glutenfree', 'vitamins'],
  },
  {
    id: 'cookie-cream',
    name: 'COOKIE CREAM',
    description: 'Gourmandise pure',
    category: 'shakes',
    price: 14,
    price_small: 10,
    price_medium: 14,
    price_large: 16,
    calories: 330,
    protein: 30,
    ingredients: ['Cookies', 'Caramel', 'Chocolat'],
    benefits: ['Récupération', 'Gourmand', '30g protéines', '25 vitamines & minéraux'],
    pitch: 'Gourmandise pure',
    icon: '🍪',
    badges: ['vegan', 'glutenfree', 'vitamins'],
  },
  {
    id: 'choco-prot',
    name: 'PROTEIN CHOC',
    description: 'Le classique efficace',
    category: 'shakes',
    price: 14,
    price_small: 10,
    price_medium: 14,
    price_large: 16,
    calories: 250,
    protein: 25,
    ingredients: ['Chocolat', 'Vanille'],
    benefits: ['Récupération', 'Classique', '25g protéines', '25 vitamines & minéraux'],
    pitch: 'Le classique efficace',
    icon: '🍫',
    badges: ['vegan', 'glutenfree', 'vitamins'],
  },
  {
    id: 'iced-caramel-latte',
    name: 'ICE CARAMEL LATTE',
    description: 'Le coup de fouet gourmand',
    category: 'shakes',
    price: 14,
    price_small: 10,
    price_medium: 14,
    price_large: 16,
    calories: 250,
    protein: 25,
    ingredients: ['Vanille', 'Caramel', 'Café'],
    benefits: ['Récupération', 'Énergie', '25g protéines', '25 vitamines & minéraux'],
    pitch: 'Le coup de fouet gourmand',
    icon: '☕',
    badges: ['vegan', 'glutenfree', 'vitamins'],
  },
  {
    id: 'glam-matcha',
    name: 'GLAM MATCHA',
    description: 'L\'option zen & fruitée',
    category: 'shakes',
    price: 14,
    price_small: 10,
    price_medium: 14,
    price_large: 16,
    calories: 210,
    protein: 21,
    ingredients: ['Matcha', 'Framboise', 'Vanille'],
    benefits: ['Récupération', 'Antioxydants', '21g protéines', '25 vitamines & minéraux'],
    pitch: 'L\'option zen & fruitée',
    icon: '🍵',
    badges: ['vegan', 'glutenfree', 'vitamins'],
  },
];
```

- [ ] **Step 5: Update categoryDescriptions to show size ranges**

Find `categoryDescriptions` near the end of the file and replace:

```typescript
export const categoryDescriptions = {
  wellness: 'Bien-être & Douceur — P 8€ · M 10€ · G 12€',
  energie: 'Pré-Workout — P 8€ · M 10€ · G 12€',
  shakes: 'Post-Workout — P 10€ · M 14€ · G 16€ · 21-30g protéines',
  coffee: 'À partir de 2,50€',
};
```

- [ ] **Step 6: Update menuCatalog.ts — map new price fields**

In `src/lib/menuCatalog.ts`, find the `productRowToMenuItem` function (lines 38-64). Replace the return object to include the new price fields:

```typescript
return {
  id: p.slug ?? p.id,
  name: p.name,
  description: p.description ?? '',
  category,
  price: p.price ?? 0,
  price_small: p.price_small ?? undefined,
  price_medium: p.price_medium ?? undefined,
  price_large: p.price_large ?? undefined,
  calories: p.calories ?? undefined,
  protein: p.protein ?? undefined,
  ingredients: p.ingredients ?? [],
  benefits: p.benefits ?? [],
  pitch: p.pitch ?? '',
  icon: p.icon_emoji ?? undefined,
  badges: badges.length ? badges : undefined,
};
```

- [ ] **Step 7: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | head -30
```

Expected: No new errors.

- [ ] **Step 8: Commit**

```bash
git add src/data/menuData.ts src/lib/menuCatalog.ts
git commit -m "feat(menu): fix items, add size prices, rename Immuni'Tea, add Hydra Boost"
```

---

## Task 6 — Update productsData.ts (gamme fallback)

**Files:**
- Modify: `src/data/productsData.ts`

- [ ] **Step 1: Replace products in rangesData**

Replace the entire content of `src/data/productsData.ts` with:

```typescript
import { Sparkles, Zap, Droplet } from 'lucide-react';

export const rangesData = {
  wellness: {
    id: 'wellness',
    title: 'Gamme Wellness',
    subtitle: 'Nutrition & équilibre',
    description:
      'Une sélection de compléments essentiels pour nourrir votre corps, soutenir votre bien-être et votre équilibre au quotidien.',
    icon: Sparkles,
    color: 'text-[oklch(57%_0.065_68)]',
    bgColor: 'bg-noir/[0.03]',
    heroImage:
      'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=1200',
    products: [
      { name: 'Aloe Vera',         description: 'Concentré d\'aloé vera pour l\'hydratation.',          price: '60€' },
      { name: 'Collagène',         description: 'Collagène marin pour peau, ongles, articulations.',    price: '85€' },
      { name: 'Thé Detox',         description: 'Mélange détoxifiant pour drainer et purifier.',        price: '45€' },
      { name: 'Fibres',            description: 'Mélange riche en fibres pour confort digestif.',        price: '45€' },
      { name: 'Complex Vitamine',  description: 'Complexe multivitaminé quotidien.',                     price: '35€' },
      { name: 'Minéral Complex',   description: 'Minéraux essentiels pour l\'équilibre.',               price: '45€' },
    ],
  },
  sport: {
    id: 'sport',
    title: 'Gamme Sport',
    subtitle: 'Performance & récupération',
    description:
      'Conçue pour les athlètes de tous niveaux : énergie, endurance et récupération musculaire au meilleur niveau.',
    icon: Zap,
    color: 'text-[oklch(57%_0.065_68)]',
    bgColor: 'bg-noir/[0.03]',
    heroImage:
      'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&q=80&w=1200',
    products: [
      { name: 'Formula 1 950g',          description: 'Repas nutritionnel complet en shake.',                price: '65€' },
      { name: 'Créatine',                description: 'Améliore la force et la puissance musculaire.',       price: '45€' },
      { name: 'Rebuild Whey',            description: 'Shake de récupération post-effort.',                  price: '90€' },
      { name: 'Gel Prolong',             description: 'Énergie soutenue pour efforts longs.',                price: '35€' },
      { name: 'Electrolytes CR7 Boîte',  description: 'Boisson hypotonique endurance.',                     price: '40€' },
      { name: 'Electrolytes Sachet x10', description: 'Sachet pratique pour l\'hydratation.',                price: '30€' },
      { name: 'Omega 3',                 description: 'Acides gras essentiels santé cardiaque.',             price: '40€' },
      { name: 'Hydrate',                 description: 'Électrolytes pour l\'hydratation optimale.',          price: '50€' },
      { name: 'Protein Drink PDM',       description: 'Boisson protéinée prête à boire.',                   price: '75€' },
      { name: 'LiftOff Pamplemousse',    description: 'Tablette effervescente énergie — pamplemousse.',     price: '40€' },
      { name: 'LiftOff Citron',          description: 'Tablette effervescente énergie — citron.',           price: '40€' },
    ],
  },
  skin: {
    id: 'skin',
    title: 'Gamme Skin',
    subtitle: 'Beauté & éclat',
    description:
      'Révélez l\'éclat naturel de votre peau avec des soins enrichis en actifs ciblés, du nettoyage profond aux sérums anti-âge.',
    icon: Droplet,
    color: 'text-[oklch(57%_0.065_68)]',
    bgColor: 'bg-white',
    heroImage: '/hero-skin.png',
    products: [
      { name: 'Gel Nettoyant Resurface',   description: 'Nettoyage en profondeur sans dessécher.',         price: '29€ / 39€' },
      { name: 'Gommage',                   description: 'Exfoliant doux pour peau lumineuse.',              price: '29€' },
      { name: 'Lotion Tonique Revitalisant',description: 'Tonifie et revitalise le teint.',                price: '22€' },
      { name: 'Crème Hydratante FPS 30',   description: 'Protection solaire + hydratation intense.',       price: '55€' },
      { name: 'Sérum Rides',               description: 'Concentré anti-rides haute efficacité.',          price: '75€' },
      { name: 'Crème Tension Ultime',      description: 'Raffermissement et densité cutanée.',              price: '89€' },
      { name: 'Crème Contour Yeux',        description: 'Anti-rides et raffermissement contour yeux.',     price: '49€' },
    ],
  },
};
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/data/productsData.ts
git commit -m "feat(data): update productsData fallback with real prices and products"
```

---

## Task 7 — ProductCard: footer prop + Menu.tsx size selector

**Files:**
- Modify: `src/components/ui/ProductCard.tsx`
- Modify: `src/pages/Menu.tsx`

- [ ] **Step 1: Add footer prop to ProductCard**

In `src/components/ui/ProductCard.tsx`, add `footer?: React.ReactNode` to the interface and render it:

```typescript
interface ProductCardProps {
  tag: string;
  name: string;
  description?: string;
  macros?: string;
  price: string;
  bgClass?: string;
  linkTo?: string;
  featured?: boolean;
  icon?: string;
  oraMemberHint?: string;
  density?: 'default' | 'compact';
  footer?: React.ReactNode;
}
```

In the `content` variable, add `{footer}` at the end of `Card.Content`:

```typescript
const content = (
  <Card.Content className={cn('space-y-2', compact ? 'px-3 pb-3 pt-2.5' : 'px-3.5 pb-4 pt-3')}>
    <span className="block text-[8px] font-normal uppercase tracking-[0.18em] text-black/35">
      {tag}
    </span>
    <div className="flex items-baseline justify-between gap-2 sm:gap-3">
      <Card.Title className="text-editorial-product-name min-w-0 flex-1 leading-snug">{name}</Card.Title>
      <div className="flex flex-shrink-0 flex-col items-end gap-0.5">
        <span className="text-editorial-price whitespace-nowrap">{price}</span>
        {oraMemberHint && (
          <span className="whitespace-nowrap text-[9px] font-light tracking-[0.04em] text-gold-dim">
            Óra+ dès {oraMemberHint}
          </span>
        )}
      </div>
    </div>
    {macros && <p className="text-editorial-product-meta">{macros}</p>}
    {description ? (
      <Card.Description className="line-clamp-2 text-[11px] font-light leading-relaxed text-black/40">
        {description}
      </Card.Description>
    ) : null}
    {footer && (
      <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
        {footer}
      </div>
    )}
  </Card.Content>
);
```

- [ ] **Step 2: Add size selector state to Menu.tsx**

At the top of the `Menu` component function (after the existing `useState`/`useMemo` hooks), add:

```typescript
const [selectedSizes, setSelectedSizes] = useState<Record<string, 'small' | 'medium' | 'large'>>({});
```

- [ ] **Step 3: Replace renderCard in Menu.tsx**

Find the `renderCard` function (around line 141-155) and replace it entirely:

```typescript
const renderCard = (menuItem: MenuItem) => {
  const hasSizes =
    menuItem.price_small != null &&
    menuItem.price_medium != null &&
    menuItem.price_large != null;
  const selectedSize = hasSizes ? (selectedSizes[menuItem.id] ?? 'medium') : null;
  const effectivePrice = hasSizes
    ? selectedSize === 'small'
      ? menuItem.price_small!
      : selectedSize === 'large'
      ? menuItem.price_large!
      : menuItem.price_medium!
    : menuItem.price;

  const sizeFooter = hasSizes ? (
    <div className="flex gap-1 border-t border-noir/[0.06] pt-2 mt-1">
      {(['small', 'medium', 'large'] as const).map((s) => {
        const sPrice =
          s === 'small'
            ? menuItem.price_small!
            : s === 'medium'
            ? menuItem.price_medium!
            : menuItem.price_large!;
        const sLabel = s === 'small' ? 'Petit' : s === 'medium' ? 'Moyen' : 'Grand';
        const isSelected = selectedSize === s;
        return (
          <button
            key={s}
            type="button"
            onClick={() => setSelectedSizes((prev) => ({ ...prev, [menuItem.id]: s }))}
            className={cn(
              'flex-1 rounded-[2px] py-1.5 text-[8px] font-normal uppercase tracking-[0.1em] transition-colors border leading-tight',
              isSelected
                ? 'border-noir bg-noir text-white'
                : 'border-noir/15 text-black/45 hover:border-noir/30 hover:text-black',
            )}
            aria-pressed={isSelected}
          >
            {sLabel}
            <br />
            {sPrice}€
          </button>
        );
      })}
    </div>
  ) : undefined;

  return (
    <motion.div key={menuItem.id} variants={staggerItem} className={CARD_ITEM_CLASS}>
      <ProductCard
        tag={categoryNames[menuItem.category]}
        name={menuItem.name}
        description={menuItem.description}
        macros={formatMacros(menuItem)}
        price={`${effectivePrice}€`}
        oraMemberHint={formatEurFr(oraMemberUnitPrice(effectivePrice))}
        icon={menuItem.icon}
        linkTo={`/menu/${menuItem.id}`}
        density="compact"
        footer={sizeFooter}
      />
    </motion.div>
  );
};
```

Note: `formatPrice` is no longer needed for the price argument — pass `${effectivePrice}€` directly. Remove the `formatPrice` helper if unused, or keep it.

- [ ] **Step 4: Add cn import to Menu.tsx if missing**

Check that `cn` is imported. If not, add it to the heroui import:

```typescript
import { Button, Card, Separator, Skeleton, cn } from '@heroui/react';
```

- [ ] **Step 5: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: No errors.

- [ ] **Step 6: Start dev server and test**

```bash
npm run dev
```

Open http://localhost:5173/menu — verify:
- Shakes show 3 size buttons (Petit/Moyen/Grand) at the bottom of each card
- Clicking a size button updates the price shown on the card
- Coffee items show no size buttons (single price)
- Wellness and Energie items show size buttons with 8€/10€/12€
- Hydra Boost Litchi is visible in Énergie tab
- Immuni'Tea is visible in Wellness tab (not Immune Paradis)
- Coco Boost, Detox My Body, Tiramisu Gourmand are not visible

- [ ] **Step 7: Commit**

```bash
git add src/components/ui/ProductCard.tsx src/pages/Menu.tsx
git commit -m "feat(menu): add multi-size selector (Petit/Moyen/Grand) to drink cards"
```

---

## Task 8 — AdminProduits: size price fields + archive

**Files:**
- Modify: `src/pages/admin/AdminProduits.tsx`

- [ ] **Step 1: Add size price fields to EMPTY_FORM**

Find `EMPTY_FORM` (around line 50-67) and add the 3 fields:

```typescript
const EMPTY_FORM = {
  slug: '',
  name: '',
  category: 'shakes',
  price: '',
  price_small: '',
  price_medium: '',
  price_large: '',
  calories: '',
  protein: '',
  description: '',
  pitch: '',
  icon_emoji: '',
  ingredients_text: '',
  benefits_text: '',
  badges_text: '',
  image_url: '',
  carousel_sort: '',
  carousel_badge: '',
  active: true,
};
type FormState = typeof EMPTY_FORM;
```

- [ ] **Step 2: Update productToForm to map size prices**

Find `productToForm` (around line 70-89) and add the 3 fields:

```typescript
function productToForm(p: Product): FormState {
  return {
    slug: p.slug ?? '',
    name: p.name,
    category: p.category,
    price: p.price != null ? String(p.price) : '',
    price_small: p.price_small != null ? String(p.price_small) : '',
    price_medium: p.price_medium != null ? String(p.price_medium) : '',
    price_large: p.price_large != null ? String(p.price_large) : '',
    calories: p.calories != null ? String(p.calories) : '',
    protein: p.protein != null ? String(p.protein) : '',
    description: p.description ?? '',
    pitch: p.pitch ?? '',
    icon_emoji: p.icon_emoji ?? '',
    ingredients_text: (p.ingredients ?? []).join('\n'),
    benefits_text: (p.benefits ?? []).join('\n'),
    badges_text: (p.badges ?? []).join(', '),
    image_url: p.image_url ?? '',
    carousel_sort: p.carousel_sort != null ? String(p.carousel_sort) : '',
    carousel_badge: p.carousel_badge === 'nouveaute' || p.carousel_badge === 'coup-de-coeur' ? p.carousel_badge : '',
    active: p.active,
  };
}
```

- [ ] **Step 3: Update payloadFromForm to include size prices**

Find `payloadFromForm` (around line 91-114) and add:

```typescript
function payloadFromForm(form: FormState) {
  const slug = form.slug.trim() || slugify(form.name);
  return {
    slug,
    name: form.name.trim(),
    category: form.category,
    price: form.price ? Number(form.price) : null,
    price_small: form.price_small ? Number(form.price_small) : null,
    price_medium: form.price_medium ? Number(form.price_medium) : null,
    price_large: form.price_large ? Number(form.price_large) : null,
    calories: form.calories ? Number(form.calories) : null,
    protein: form.protein ? Number(form.protein) : null,
    description: form.description.trim() || null,
    pitch: form.pitch.trim() || null,
    icon_emoji: form.icon_emoji.trim() || null,
    ingredients: parseLines(form.ingredients_text),
    benefits: parseLines(form.benefits_text),
    badges: parseBadges(form.badges_text),
    image_url: form.image_url.trim() || null,
    carousel_sort: form.carousel_sort ? parseInt(form.carousel_sort, 10) : null,
    carousel_badge:
      form.carousel_badge === 'nouveaute' || form.carousel_badge === 'coup-de-coeur'
        ? form.carousel_badge
        : null,
    active: form.active,
  };
}
```

- [ ] **Step 4: Add 3 size price fields to ProductForm JSX**

In `ProductForm`, after the Prix (€) field (around line 196-206), add a section for size prices. Insert after the `<div>` containing `Prix (€)`:

```tsx
<div className="md:col-span-3">
  <p className="mb-2 text-[9px] font-normal uppercase tracking-[0.18em] text-black/30">
    Prix multi-tailles (optionnel — laisser vide si prix unique)
  </p>
  <div className="grid grid-cols-3 gap-3">
    <div>
      <label className="mb-1.5 block text-[9px] uppercase tracking-[0.2em] text-black/35">Petit (€)</label>
      <input
        type="number"
        step="0.01"
        className={inputClass}
        value={form.price_small}
        onChange={(e) => set('price_small', e.target.value)}
        placeholder="8"
      />
    </div>
    <div>
      <label className="mb-1.5 block text-[9px] uppercase tracking-[0.2em] text-black/35">Moyen (€)</label>
      <input
        type="number"
        step="0.01"
        className={inputClass}
        value={form.price_medium}
        onChange={(e) => set('price_medium', e.target.value)}
        placeholder="10"
      />
    </div>
    <div>
      <label className="mb-1.5 block text-[9px] uppercase tracking-[0.2em] text-black/35">Grand (€)</label>
      <input
        type="number"
        step="0.01"
        className={inputClass}
        value={form.price_large}
        onChange={(e) => set('price_large', e.target.value)}
        placeholder="12"
      />
    </div>
  </div>
</div>
```

- [ ] **Step 5: Add archive/restore button to ProductCard component**

Add `onArchive: () => void` prop to the `ProductCard` component (the admin one inside AdminProduits.tsx, not the public one). Find `function ProductCard` (around line 338) and update:

```typescript
function ProductCard({
  p,
  onEdit,
  onDelete,
  onArchive,
}: {
  p: Product;
  onEdit: () => void;
  onDelete: () => void;
  onArchive: () => void;
})
```

In the card buttons area (where Edit and Delete buttons are), add an Archive button between them:

```tsx
<button
  type="button"
  onClick={onArchive}
  className="flex h-9 min-w-[2.25rem] items-center justify-center rounded-[2px] border border-transparent text-black/30 transition-colors hover:border-amber-200 hover:bg-amber-50 hover:text-amber-600"
  aria-label={p.active ? `Archiver ${p.name}` : `Restaurer ${p.name}`}
  title={p.active ? 'Archiver' : 'Restaurer'}
>
  {p.active ? <Archive size={15} strokeWidth={1.5} /> : <ArchiveRestore size={15} strokeWidth={1.5} />}
</button>
```

Add `Archive, ArchiveRestore` to the lucide-react import at the top of the file.

- [ ] **Step 6: Add handleArchive function in AdminProduits component**

After `confirmDeleteProduct` (around line 532-544), add:

```typescript
const handleArchive = useCallback(async (p: Product) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('products')
    .update({ active: !p.active })
    .eq('id', p.id);
  if (error) return;
  invalidateMenuCatalogCache();
  fetchProducts();
}, []);
```

- [ ] **Step 7: Pass onArchive to ProductCard in the grid**

Find where ProductCard is rendered (around line 711) and add the `onArchive` prop:

```tsx
<ProductCard
  p={p}
  onEdit={() => { setEditProduct(p); setShowForm(false); }}
  onDelete={() => setDeleteProductId(p.id)}
  onArchive={() => handleArchive(p)}
/>
```

- [ ] **Step 8: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 9: Test admin UI**

With dev server running, go to http://localhost:5173/admin/produits — verify:
- Size price fields appear in the product form
- Archive button appears on each product card
- Clicking archive on a product toggles its active state (visible badge changes)

- [ ] **Step 10: Commit**

```bash
git add src/pages/admin/AdminProduits.tsx
git commit -m "feat(admin): add price sizes and archive/restore to AdminProduits"
```

---

## Task 9 — Hook useGammeCatalog

**Files:**
- Create: `src/hooks/useGammeCatalog.ts`

- [ ] **Step 1: Create the hook**

```typescript
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { rangesData } from '../data/productsData';
import type { GammeProduct } from '../types/database';

function getStaticProducts(
  gamme: 'sport' | 'skin' | 'wellness',
  subcategory?: string | null,
): GammeProduct[] {
  const range = rangesData[gamme];
  if (!range) return [];
  return range.products.map((p, i) => ({
    id: `static-${gamme}-${i}`,
    gamme,
    subcategory: subcategory ?? null,
    name: p.name,
    description: p.description,
    price: parseFloat(p.price.replace('€', '').replace(' / ', '/').split('/')[0].trim()),
    price_alt: p.price.includes('/') ? parseFloat(p.price.split('/')[1].replace('€', '').trim()) : null,
    active: true,
    image_url: null,
    sort_order: i,
    created_at: '',
  }));
}

export function useGammeCatalog(gamme: 'sport' | 'skin' | 'wellness') {
  const [products, setProducts] = useState<GammeProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<'supabase' | 'fallback' | 'loading'>('loading');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('gamme_products')
      .select('*')
      .eq('gamme', gamme)
      .eq('active', true)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true })
      .then(
        ({
          data,
          error,
        }: {
          data: GammeProduct[] | null;
          error: { message: string } | null;
        }) => {
          if (cancelled) return;
          if (error || !data?.length) {
            if (import.meta.env.DEV && error) {
              console.warn('[useGammeCatalog] fallback statique —', error.message);
            }
            setProducts(getStaticProducts(gamme));
            setSource('fallback');
          } else {
            setProducts(data);
            setSource('supabase');
          }
          setLoading(false);
        },
      );

    return () => {
      cancelled = true;
    };
  }, [gamme]);

  return { products, loading, source };
}
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useGammeCatalog.ts
git commit -m "feat(hooks): add useGammeCatalog — fetches gamme_products from Supabase"
```

---

## Task 10 — RangeDetail: Supabase + subcategories

**Files:**
- Modify: `src/pages/RangeDetail.tsx`

- [ ] **Step 1: Replace static import with hook and subcategory grouping**

Replace the entire content of `src/pages/RangeDetail.tsx` with:

```typescript
import { useParams, Navigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button, Card, CardContent, Skeleton } from '@heroui/react';
import { rangesData } from '../data/productsData';
import { useGammeCatalog } from '../hooks/useGammeCatalog';
import { ArrowLeft, ShoppingBag } from 'lucide-react';
import { PageShell } from '../components/layout/PageShell';
import { useFadeUpWhenVisible, useStaggerReveal } from '../lib/motionReveal';
import type { GammeProduct } from '../types/database';

const SUBCATEGORY_LABELS: Partial<Record<string, Record<string, string>>> = {
  sport: {
    sport: 'Performance',
    encas: 'Encas',
  },
  skin: {
    nettoyage: 'Nettoyage & Indispensables',
    korean: 'Korean Products',
    contour: 'Contour des Yeux',
    serum: 'Sérum & Anti-Âge',
  },
};

const SUBCATEGORY_ORDER: Partial<Record<string, (string | null)[]>> = {
  sport: ['sport', 'encas'],
  skin: ['nettoyage', 'korean', 'contour', 'serum'],
  wellness: [null],
};

function groupBySubcategory(
  products: GammeProduct[],
  gamme: string,
): { key: string | null; label: string | null; items: GammeProduct[] }[] {
  const order = SUBCATEGORY_ORDER[gamme] ?? [null];
  const map = new Map<string | null, GammeProduct[]>();
  for (const p of products) {
    const key = p.subcategory;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(p);
  }
  return order
    .map((key) => ({
      key,
      label: key ? (SUBCATEGORY_LABELS[gamme]?.[key] ?? key) : null,
      items: map.get(key) ?? [],
    }))
    .filter((g) => g.items.length > 0);
}

function ProductSkeletonGrid() {
  return (
    <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-3 lg:gap-x-10 lg:gap-y-16">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="space-y-4">
          <Skeleton className="aspect-[4/5] w-full rounded-[2px] bg-noir/[0.06]" />
          <Skeleton className="h-5 w-2/3 rounded bg-noir/[0.05]" />
          <Skeleton className="h-4 w-1/2 rounded bg-noir/[0.04]" />
        </div>
      ))}
    </div>
  );
}

const RangeDetail = () => {
  const { rangeId } = useParams<{ rangeId: string }>();

  const range = rangesData[rangeId as keyof typeof rangesData];
  if (!range) return <Navigate to="/nos-produits" replace />;

  const { products, loading } = useGammeCatalog(rangeId as 'sport' | 'skin' | 'wellness');
  const groups = groupBySubcategory(products, rangeId!);

  const Icon = range.icon;
  const fadeIntro = useFadeUpWhenVisible();
  const fadeDesc = useFadeUpWhenVisible();
  const { container, item, isReducedMotion } = useStaggerReveal();

  return (
    <div className="min-h-screen bg-white">
      <section className="border-b border-noir/[0.06] bg-white">
        <PageShell className="py-8 md:py-10">
          <Link
            to="/nos-produits"
            className="inline-flex items-center gap-2 text-[10px] font-normal uppercase tracking-[0.12em] text-black/45 transition-colors hover:text-black"
          >
            <ArrowLeft size={14} strokeWidth={1.5} aria-hidden />
            Retour aux gammes
          </Link>
          <motion.div className="mt-8 flex flex-col gap-8 md:flex-row md:items-center md:gap-12" {...fadeIntro}>
            <div className="relative aspect-[16/10] w-full max-w-md shrink-0 overflow-hidden rounded-[2px] md:aspect-[4/3] md:max-w-sm">
              <img
                src={range.heroImage}
                alt={`Visuel de la gamme ${range.title}`}
                className="h-full w-full object-cover"
                loading="eager"
                decoding="async"
                fetchPriority="high"
              />
            </div>
            <div className="min-w-0 text-center md:text-left">
              <Icon size={40} strokeWidth={1} className="mx-auto mb-4 text-black/40 md:mx-0" aria-hidden />
              <p className="text-editorial-tagline mb-2">Collection</p>
              <h1
                className="mb-3 font-display font-normal tracking-[-0.02em] text-black"
                style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(32px, 4vw, 44px)' }}
              >
                {range.title}
              </h1>
              <p
                className="max-w-xl font-display text-[17px] font-light italic leading-snug text-black/55 md:text-[18px]"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                « {range.subtitle} »
              </p>
            </div>
          </motion.div>
        </PageShell>
      </section>

      <section className="border-b border-noir/[0.05] py-16 md:py-20">
        <PageShell>
          <motion.p
            className="mx-auto max-w-4xl text-center font-display text-[clamp(20px,2.5vw,28px)] font-light leading-relaxed text-black/70"
            style={{ fontFamily: 'var(--font-display)' }}
            {...fadeDesc}
          >
            {range.description}
          </motion.p>
        </PageShell>
      </section>

      <section className="pb-20 pt-4 md:pb-28">
        <PageShell>
          {loading ? (
            <ProductSkeletonGrid />
          ) : (
            <div className="space-y-16">
              {groups.map(({ key, label, items }) => (
                <div key={key ?? 'main'}>
                  {label && (
                    <h2
                      className="mb-8 font-display text-[clamp(18px,2vw,24px)] font-normal text-black/70"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      {label}
                    </h2>
                  )}
                  <motion.div
                    className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-3 lg:gap-x-10 lg:gap-y-16"
                    variants={container}
                    initial={isReducedMotion ? false : 'hidden'}
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.1, margin: '0px 0px -48px 0px' }}
                  >
                    {items.map((product, index) => (
                      <motion.div key={product.id} variants={item} className="min-w-0">
                        <Card className="group overflow-hidden rounded-[2px] border border-noir/[0.06] bg-white shadow-none transition-colors hover:border-noir/12">
                          <div className="relative aspect-[4/5] overflow-hidden bg-surface-product-well">
                            {product.image_url ? (
                              <img
                                src={product.image_url}
                                alt={product.name}
                                className="h-full w-full object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <>
                                <div className={`absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 ${range.bgColor}`} />
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <span className="font-display text-8xl text-black opacity-[0.06]">
                                    {product.name.charAt(0)}
                                  </span>
                                </div>
                              </>
                            )}
                            <div className="absolute bottom-0 left-0 right-0 translate-y-full p-5 transition-transform duration-300 group-hover:translate-y-0">
                              <Button
                                type="button"
                                variant="primary"
                                fullWidth
                                className="rounded-full bg-noir py-3 text-[10px] font-normal uppercase tracking-[0.12em] text-white hover:bg-anthracite"
                              >
                                Renseignements <ShoppingBag size={14} strokeWidth={1.25} aria-hidden />
                              </Button>
                            </div>
                          </div>
                          <CardContent className="gap-0 p-6 text-center">
                            <h3 className="mb-2 font-display text-[20px] font-normal text-black" style={{ fontFamily: 'var(--font-display)' }}>
                              {product.name}
                            </h3>
                            {product.description && (
                              <p className="mx-auto max-w-xs text-[12px] font-light leading-relaxed text-black/45">
                                {product.description}
                              </p>
                            )}
                            <p className={`mt-3 text-[16px] font-normal ${range.color}`}>
                              {product.price_alt
                                ? `${product.price}€ / ${product.price_alt}€`
                                : `${product.price}€`}
                            </p>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </motion.div>
                </div>
              ))}
            </div>
          )}
        </PageShell>
      </section>
    </div>
  );
};

export default RangeDetail;
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 3: Test in browser**

Open http://localhost:5173/nos-produits/sport — verify:
- Products load from Supabase (11 sport products + 4 encas)
- Two sections visible: "Performance" and "Encas"
- Open /nos-produits/skin — 4 sections visible
- Open /nos-produits/wellness — single list, 6 products

- [ ] **Step 4: Commit**

```bash
git add src/pages/RangeDetail.tsx
git commit -m "feat(gammes): RangeDetail fetches from Supabase, grouped by subcategory"
```

---

## Task 11 — AdminGammes: new admin page

**Files:**
- Create: `src/pages/admin/AdminGammes.tsx`

- [ ] **Step 1: Create the AdminGammes page**

```typescript
// src/pages/admin/AdminGammes.tsx
import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, Archive, ArchiveRestore, ChevronDown } from 'lucide-react';
import { Card, Skeleton } from '@heroui/react';
import { EmptyState } from '@heroui-pro/react';
import { supabase } from '../../lib/supabaseClient';
import { formatSupabaseDataError, formatMutationError } from '../../lib/userFacingError';
import { AdminErrorAlert } from '../../components/dashboard/AdminErrorAlert';
import { ConfirmDialog } from '../../components/dashboard/ConfirmDialog';
import { DashPageHeader } from '../../components/dashboard/primitives';
import { DASH_MAIN_PAD } from '../../components/dashboard/layoutClasses';
import { cn } from '@heroui/react';
import type { GammeProduct } from '../../types/database';

// ── Config sidebar ─────────────────────────────────────────────────────────
const SIDEBAR_NAV = [
  {
    gamme: 'sport' as const,
    label: 'Gamme Sport',
    subcategories: [
      { key: 'sport', label: 'Sport' },
      { key: 'encas', label: 'Encas' },
    ],
  },
  {
    gamme: 'skin' as const,
    label: 'Gamme Skin',
    subcategories: [
      { key: 'nettoyage', label: 'Nettoyage' },
      { key: 'korean', label: 'Korean Products' },
      { key: 'contour', label: 'Contour des Yeux' },
      { key: 'serum', label: 'Sérum / Anti-Âge' },
    ],
  },
  {
    gamme: 'wellness' as const,
    label: 'Gamme Wellness',
    subcategories: [],
  },
] as const;

// ── Form ───────────────────────────────────────────────────────────────────
const EMPTY_FORM = {
  name: '',
  description: '',
  price: '',
  price_alt: '',
  image_url: '',
  sort_order: '',
};
type GammeFormState = typeof EMPTY_FORM;

function productToGammeForm(p: GammeProduct): GammeFormState {
  return {
    name: p.name,
    description: p.description ?? '',
    price: String(p.price),
    price_alt: p.price_alt != null ? String(p.price_alt) : '',
    image_url: p.image_url ?? '',
    sort_order: String(p.sort_order),
  };
}

const GammeProductForm = ({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Partial<GammeFormState>;
  onSave: (data: GammeFormState) => Promise<void>;
  onCancel: () => void;
}) => {
  const [form, setForm] = useState<GammeFormState>({ ...EMPTY_FORM, ...initial });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof GammeFormState, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Nom requis.'); return; }
    if (!form.price) { setError('Prix requis.'); return; }
    setSaving(true);
    setError(null);
    try {
      await onSave(form);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    'w-full h-10 bg-surface-muted rounded-[2px] border border-noir/[0.08] px-3 text-[12px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-noir/20';

  return (
    <div className="mb-6 rounded-[2px] border border-noir/[0.06] bg-white p-6">
      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="mb-1.5 block text-[9px] uppercase tracking-[0.2em] text-black/35">Nom *</label>
          <input className={inputClass} value={form.name} onChange={(e) => set('name', e.target.value)} />
        </div>
        <div>
          <label className="mb-1.5 block text-[9px] uppercase tracking-[0.2em] text-black/35">Prix (€) *</label>
          <input type="number" step="0.01" className={inputClass} value={form.price} onChange={(e) => set('price', e.target.value)} placeholder="45" />
        </div>
        <div>
          <label className="mb-1.5 block text-[9px] uppercase tracking-[0.2em] text-black/35">Prix alternatif (€) <span className="text-black/25 normal-case">— ex: grand format</span></label>
          <input type="number" step="0.01" className={inputClass} value={form.price_alt} onChange={(e) => set('price_alt', e.target.value)} placeholder="Laisser vide si un seul prix" />
        </div>
        <div className="md:col-span-2">
          <label className="mb-1.5 block text-[9px] uppercase tracking-[0.2em] text-black/35">Description</label>
          <input className={inputClass} value={form.description} onChange={(e) => set('description', e.target.value)} />
        </div>
        <div>
          <label className="mb-1.5 block text-[9px] uppercase tracking-[0.2em] text-black/35">Image (URL)</label>
          <input className={inputClass} value={form.image_url} onChange={(e) => set('image_url', e.target.value)} placeholder="https://…" />
        </div>
        <div>
          <label className="mb-1.5 block text-[9px] uppercase tracking-[0.2em] text-black/35">Ordre d'affichage</label>
          <input type="number" className={inputClass} value={form.sort_order} onChange={(e) => set('sort_order', e.target.value)} placeholder="1" />
        </div>
      </div>
      {error && <p className="mb-3 text-[11px] text-red-500/80">{error}</p>}
      <div className="flex gap-3">
        <button type="button" onClick={handleSave} disabled={saving}
          className="h-10 rounded-[2px] bg-noir px-6 text-[10px] font-normal uppercase tracking-[0.12em] text-white transition-colors hover:bg-anthracite disabled:opacity-40">
          {saving ? 'Sauvegarde…' : 'Sauvegarder'}
        </button>
        <button type="button" onClick={onCancel}
          className="h-10 rounded-[2px] border border-noir/15 px-6 text-[10px] font-light uppercase tracking-[0.12em] text-black/50 transition-colors hover:border-noir/30 hover:text-black">
          Annuler
        </button>
      </div>
    </div>
  );
};

// ── Main component ─────────────────────────────────────────────────────────
const AdminGammes = () => {
  const [selectedGamme, setSelectedGamme] = useState<'sport' | 'skin' | 'wellness'>('sport');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>('sport');
  const [products, setProducts] = useState<GammeProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState<GammeProduct | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  const fetchProducts = useCallback(() => {
    setLoading(true);
    setFetchError(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('gamme_products')
      .select('*')
      .eq('gamme', selectedGamme)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true })
      .then(({ data, error }: { data: GammeProduct[] | null; error: { message: string } | null }) => {
        setLoading(false);
        if (error) {
          setFetchError(formatSupabaseDataError(error.message, 'gamme_products'));
          setProducts([]);
          return;
        }
        setProducts(data ?? []);
      });
  }, [selectedGamme]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleSelectNav = (gamme: 'sport' | 'skin' | 'wellness', subcategory: string | null) => {
    setSelectedGamme(gamme);
    setSelectedSubcategory(subcategory);
    setShowForm(false);
    setEditProduct(null);
  };

  const visibleProducts = products.filter((p) => {
    const matchSubcat = selectedSubcategory === null
      ? p.subcategory === null
      : p.subcategory === selectedSubcategory;
    return matchSubcat && p.active;
  });

  const archivedProducts = products.filter((p) => {
    const matchSubcat = selectedSubcategory === null
      ? p.subcategory === null
      : p.subcategory === selectedSubcategory;
    return matchSubcat && !p.active;
  });

  const buildPayload = (form: GammeFormState) => ({
    gamme: selectedGamme,
    subcategory: selectedSubcategory,
    name: form.name.trim(),
    description: form.description.trim() || null,
    price: Number(form.price),
    price_alt: form.price_alt ? Number(form.price_alt) : null,
    image_url: form.image_url.trim() || null,
    sort_order: form.sort_order ? parseInt(form.sort_order, 10) : 0,
    active: true,
  });

  const handleCreate = async (form: GammeFormState) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from('gamme_products').insert(buildPayload(form));
    if (error) throw new Error(formatMutationError(error.message));
    setShowForm(false);
    fetchProducts();
  };

  const handleUpdate = async (form: GammeFormState) => {
    if (!editProduct) return;
    const { active, ...rest } = buildPayload(form);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from('gamme_products').update(rest).eq('id', editProduct.id);
    if (error) throw new Error(formatMutationError(error.message));
    setEditProduct(null);
    fetchProducts();
  };

  const handleArchive = async (p: GammeProduct) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('gamme_products')
      .update({ active: !p.active })
      .eq('id', p.id);
    if (!error) fetchProducts();
  };

  const confirmDelete = useCallback(async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('gamme_products').delete().eq('id', deleteId);
      fetchProducts();
      setDeleteId(null);
    } finally {
      setDeleteLoading(false);
    }
  }, [deleteId, fetchProducts]);

  const inputClass = 'w-full h-10 bg-surface-muted rounded-[2px] border border-noir/[0.08] px-3 text-[12px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-noir/20';

  const currentNavItem = SIDEBAR_NAV.find((n) => n.gamme === selectedGamme);
  const currentSubLabel = selectedSubcategory
    ? currentNavItem?.subcategories.find((s) => s.key === selectedSubcategory)?.label
    : 'Wellness';
  const sectionTitle = currentSubLabel
    ? `${currentNavItem?.label} — ${currentSubLabel}`
    : currentNavItem?.label ?? '';

  return (
    <div className="flex min-h-screen">
      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <aside className="hidden w-52 shrink-0 border-r border-noir/[0.06] bg-white py-6 md:block">
        <p className="mb-3 px-4 text-[9px] font-normal uppercase tracking-[0.2em] text-black/30">
          Gammes produits
        </p>
        {SIDEBAR_NAV.map(({ gamme, label, subcategories }) => (
          <div key={gamme} className="mb-1">
            {subcategories.length === 0 ? (
              <button
                type="button"
                onClick={() => handleSelectNav(gamme, null)}
                className={cn(
                  'w-full px-4 py-2.5 text-left text-[10px] font-medium uppercase tracking-[0.1em] transition-colors',
                  selectedGamme === gamme && selectedSubcategory === null
                    ? 'bg-noir/[0.04] text-noir border-l-2 border-noir'
                    : 'text-black/50 hover:text-noir hover:bg-noir/[0.02]',
                )}
              >
                {label}
              </button>
            ) : (
              <>
                <p className="px-4 pb-1 pt-2 text-[9px] font-normal uppercase tracking-[0.18em] text-black/35">
                  {label}
                </p>
                {subcategories.map(({ key, label: subLabel }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleSelectNav(gamme, key)}
                    className={cn(
                      'w-full px-6 py-2 text-left text-[10px] transition-colors',
                      selectedGamme === gamme && selectedSubcategory === key
                        ? 'bg-noir/[0.04] text-noir border-l-2 border-noir font-medium'
                        : 'text-black/45 hover:text-noir hover:bg-noir/[0.02]',
                    )}
                  >
                    ↳ {subLabel}
                  </button>
                ))}
              </>
            )}
          </div>
        ))}
      </aside>

      {/* ── Main ─────────────────────────────────────────────────────────── */}
      <div className="min-w-0 flex-1">
        <DashPageHeader
          breadcrumb="Administration"
          title="Gammes"
          subtitle={sectionTitle}
          action={
            <button
              type="button"
              onClick={() => { setShowForm(true); setEditProduct(null); }}
              className="inline-flex items-center gap-2 rounded-full bg-noir text-white px-4 py-[10px] text-[13px] font-medium hover:bg-anthracite transition-colors"
            >
              <Plus size={14} strokeWidth={1.5} /> Ajouter produit
            </button>
          }
        />

        <div className={DASH_MAIN_PAD}>
          {fetchError && <AdminErrorAlert message={fetchError} onRetry={fetchProducts} />}

          {showForm && !editProduct && (
            <div className="mb-10">
              <p className="mb-3 text-[9px] font-normal uppercase tracking-[0.2em] text-black/35">Nouveau produit</p>
              <GammeProductForm onSave={handleCreate} onCancel={() => setShowForm(false)} />
            </div>
          )}

          {editProduct && (
            <div className="mb-10">
              <p className="mb-3 text-[9px] font-normal uppercase tracking-[0.2em] text-black/35">Modifier — {editProduct.name}</p>
              <GammeProductForm initial={productToGammeForm(editProduct)} onSave={handleUpdate} onCancel={() => setEditProduct(null)} />
            </div>
          )}

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-[2px] bg-noir/[0.05]" />
              ))}
            </div>
          ) : visibleProducts.length === 0 && !showForm ? (
            <EmptyState className="rounded-[2px] border border-dashed border-noir/15 bg-white">
              <EmptyState.Header>
                <EmptyState.Title className="font-display text-[16px] font-normal text-black/75">
                  Aucun produit
                </EmptyState.Title>
                <EmptyState.Description className="text-[12px] font-light text-black/45">
                  Aucun produit dans cette sous-catégorie.
                </EmptyState.Description>
              </EmptyState.Header>
            </EmptyState>
          ) : (
            <div className="overflow-hidden rounded-[2px] border border-noir/[0.06] bg-white">
              {visibleProducts.map((p, i) => (
                <div
                  key={p.id}
                  className={cn(
                    'flex items-center justify-between gap-4 px-5 py-3.5',
                    i < visibleProducts.length - 1 && 'border-b border-noir/[0.05]',
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-normal text-black">{p.name}</p>
                    {p.description && (
                      <p className="mt-0.5 truncate text-[11px] font-light text-black/40">{p.description}</p>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[14px] font-normal text-black">
                      {p.price}€{p.price_alt ? ` / ${p.price_alt}€` : ''}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => { setEditProduct(p); setShowForm(false); }}
                      className="flex h-9 w-9 items-center justify-center rounded-[2px] border border-noir/12 text-black/55 transition-colors hover:border-noir/25 hover:text-black"
                      aria-label={`Modifier ${p.name}`}
                    >
                      <Pencil size={14} strokeWidth={1.5} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleArchive(p)}
                      className="flex h-9 w-9 items-center justify-center rounded-[2px] border border-transparent text-black/30 transition-colors hover:border-amber-200 hover:bg-amber-50 hover:text-amber-600"
                      aria-label={`Archiver ${p.name}`}
                      title="Archiver"
                    >
                      <Archive size={14} strokeWidth={1.5} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteId(p.id)}
                      className="flex h-9 w-9 items-center justify-center rounded-[2px] border border-transparent text-black/30 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                      aria-label={`Supprimer ${p.name}`}
                    >
                      <Trash2 size={14} strokeWidth={1.5} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Archives ─────────────────────────────────────────────────── */}
          {archivedProducts.length > 0 && (
            <div className="mt-10">
              <button
                type="button"
                onClick={() => setShowArchived((v) => !v)}
                className="flex items-center gap-2 text-[10px] font-normal uppercase tracking-[0.14em] text-black/40 transition-colors hover:text-black"
              >
                <ChevronDown
                  size={14}
                  strokeWidth={1.5}
                  className={cn('transition-transform', showArchived && 'rotate-180')}
                />
                {archivedProducts.length} produit{archivedProducts.length > 1 ? 's' : ''} archivé{archivedProducts.length > 1 ? 's' : ''}
              </button>
              {showArchived && (
                <div className="mt-4 overflow-hidden rounded-[2px] border border-noir/[0.06] bg-noir/[0.01]">
                  {archivedProducts.map((p, i) => (
                    <div
                      key={p.id}
                      className={cn(
                        'flex items-center justify-between gap-4 px-5 py-3.5 opacity-50',
                        i < archivedProducts.length - 1 && 'border-b border-noir/[0.05]',
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-normal text-black">{p.name}</p>
                      </div>
                      <p className="shrink-0 text-[13px] text-black/60">{p.price}€</p>
                      <button
                        type="button"
                        onClick={() => handleArchive(p)}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[2px] border border-transparent text-black/30 transition-colors hover:border-green-200 hover:bg-green-50 hover:text-green-600"
                        aria-label={`Restaurer ${p.name}`}
                        title="Restaurer"
                      >
                        <ArchiveRestore size={14} strokeWidth={1.5} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={deleteId !== null}
        title="Supprimer ce produit ?"
        description="Cette action est définitive. Le produit disparaîtra de la gamme."
        loading={deleteLoading}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
};

export default AdminGammes;
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | head -30
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/admin/AdminGammes.tsx
git commit -m "feat(admin): create AdminGammes page with sidebar CRUD"
```

---

## Task 12 — AdminLayout + App.tsx: routing

**Files:**
- Modify: `src/pages/admin/AdminLayout.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Add Gammes to AdminLayout NAV**

In `src/pages/admin/AdminLayout.tsx`, find the `NAV` array (lines 9-23). Add the Gammes entry after Produits:

```typescript
import { LayoutDashboard, Users, CalendarDays, Package, Layers, Heart, LogOut, Megaphone, ArrowLeft, Store } from 'lucide-react';
```

Then in the NAV array, add after `{ label: 'Produits', ... }`:

```typescript
{ label: 'Gammes', shortLabel: 'Gammes', icon: Layers, path: '/admin/gammes' },
```

- [ ] **Step 2: Add AdminGammes route to App.tsx**

In `src/App.tsx`, after the `AdminProduits` lazy import (line 44), add:

```typescript
const AdminGammes = lazy(() => import('./pages/admin/AdminGammes'));
```

Then find the AdminProduits Route in the JSX and add the Gammes route after it:

```tsx
<Route path="gammes" element={<AdminGammes />} />
```

Look for the existing pattern `<Route path="produits" element={<AdminProduits />} />` and add the new route immediately after it.

- [ ] **Step 3: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 4: Test full admin flow**

With dev server running:
1. Go to http://localhost:5173/admin — verify "Gammes" appears in the sidebar nav
2. Click "Gammes" — verify AdminGammes page loads
3. Navigate sidebar: click "Sport > Sport" — verify 11 products load
4. Click "Skin > Sérum / Anti-Âge" — verify 4 sérum products
5. Click "Gamme Wellness" — verify 6 wellness products
6. Click "+ Ajouter produit" — fill in name + price — save — verify product appears in list
7. Click Archive button — verify product moves to archived section
8. Expand archived section — click Restore — verify product returns to active list
9. Click Delete — confirm — verify product is gone

- [ ] **Step 5: Commit**

```bash
git add src/pages/admin/AdminLayout.tsx src/App.tsx
git commit -m "feat(admin): add Gammes route and nav entry"
```

---

## Self-Review Checklist

**Spec coverage:**
- [x] Multi-size pricing schema — Task 1
- [x] Corrections boissons (Coco Boost, archives, Immuni'Tea, Hydra Boost) — Task 2
- [x] price_small/medium/large TypeScript types — Task 4
- [x] menuData.ts corrections + size prices — Task 5
- [x] menuCatalog.ts maps new fields — Task 5
- [x] productsData.ts fallback updated — Task 6
- [x] Size selector on drink cards (Option A) — Task 7
- [x] AdminProduits: size price fields — Task 8
- [x] AdminProduits: archive/restore button — Task 8
- [x] gamme_products table + RLS — Task 3
- [x] Seed data (36 products) — Task 3
- [x] GammeProduct type — Task 4
- [x] useGammeCatalog hook — Task 9
- [x] RangeDetail → Supabase + subcategories — Task 10
- [x] AdminGammes sidebar B layout — Task 11
- [x] AdminGammes CRUD + archive — Task 11
- [x] AdminLayout nav + App.tsx routing — Task 12

**Out of scope (confirmed):** image upload for gammes, packs/promos, cart for gamme products.
