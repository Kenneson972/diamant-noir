# Spec — Catalogue PESSORA v2

**Date :** 2026-05-02  
**Branche :** feat/catalogue-v2  
**Périmètre :** Multi-tailles boissons bar + gamme produits dynamique + admin gammes

---

## Contexte

Le catalogue actuel présente deux problèmes majeurs :
1. Les boissons bar n'ont qu'un seul prix alors que la vraie carte propose 3 tailles (Petit/Moyen/Grand).
2. Les gammes produits (Sport, Skin, Wellness) sont codées en dur dans `productsData.ts` avec des prix incorrects et des produits manquants — elles ne sont pas gérables depuis l'admin.

---

## Périmètre

### 1. Multi-tailles pour les boissons bar

**Schéma — table `products` (existante) :**  
Ajout de 3 colonnes nullable :
- `price_small NUMERIC` — prix Petit
- `price_medium NUMERIC` — prix Moyen  
- `price_large NUMERIC` — prix Grand

Règle : si les 3 colonnes sont nulles → affichage prix unique classique (coffee). Si renseignées → sélecteur 3 tailles sur la fiche.

**Prix par catégorie (réels) :**
- Shakes : Petit 10€ / Moyen 14€ / Grand 16€
- Énergie + Wellness : Petit 8€ / Moyen 10€ / Grand 12€
- Coffee : prix unique inchangé (pas de tailles)

**Frontend — `Menu.tsx` :**  
Sur chaque fiche boisson avec tailles, afficher 3 boutons Petit/Moyen/Grand. Le prix se met à jour selon la sélection. Taille Moyen sélectionnée par défaut.

**Admin — `AdminProduits.tsx` :**  
Ajout de 3 champs optionnels (petit / moyen / grand) dans le formulaire d'édition. Si vides → prix unique utilisé.

---

### 2. Corrections des données boissons

| Action | Boisson | Détail |
|--------|---------|--------|
| ❌ Supprimer | Coco Boost | N'existe plus |
| 📦 Archiver | Detox My Body | `active: false` |
| 📦 Archiver | Tiramisu Gourmand | `active: false` |
| ✏️ Renommer + MAJ | Immune Paradis → **Immuni'Tea** | Ingrédients : Baie sauvage, Collagène, Citron · Bénéfices : Système immunitaire, Articulation, Brûle graisse |
| ➕ Ajouter | **Hydra Boost Litchi** (énergie) | Ingrédients : Orange, Anti-Uric, Électrolytes · Bénéfices : Hydratation profonde, Récupération, Endurance |

**Archive dans AdminProduits :**
- Bouton **Archiver / Restaurer** sur chaque ligne produit
- Section "Produits archivés" pliable en bas de la page admin
- Les produits archivés (`active: false`) ne s'affichent pas dans le menu public

---

### 3. Nouvelle table Supabase `gamme_products`

```sql
CREATE TABLE gamme_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gamme TEXT NOT NULL CHECK (gamme IN ('sport', 'skin', 'wellness')),
  subcategory TEXT,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  price_alt NUMERIC,         -- prix alternatif (ex: 29€/39€ pour Gel Nettoyant)
  active BOOLEAN NOT NULL DEFAULT true,
  image_url TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Sous-catégories par gamme :**
- `sport` → `sport` / `encas`
- `skin` → `nettoyage` / `korean` / `contour` / `serum`
- `wellness` → pas de sous-catégorie (null) — correspond à "Bien-Être" sur la carte physique

**Données initiales (seed migration) :**

*Gamme Sport — sous-cat `sport` :*
- Formula 1 950g · 65€
- Créatine · 45€
- Rebuild Whey · 90€
- Gel Prolong · 35€
- Electrolytes CR7 Boîte · 40€
- Electrolytes Sachet x10 · 30€
- Omega 3 · 40€
- Hydrate · 50€
- Protein Drink PDM · 75€
- LiftOff Pamplemousse · 40€
- LiftOff Citron · 40€

*Gamme Sport — sous-cat `encas` :*
- Chips BBQ Onions x10 · 30€
- Barre Sport x6 · 35€
- Barre Céréales x7 · 35€
- Barres Collations x14 · 40€

*Gamme Skin — sous-cat `nettoyage` :*
- Gel Nettoyant Resurface · 29€ (price_alt: 39€)
- Gommage · 29€
- Lotion Tonique Revitalisant · 22€
- Masque d'Argile · 25€
- Exfoliant · 24€

*Gamme Skin — sous-cat `korean` :*
- Crème Hydratante FPS 30 · 55€
- Crème Hydrant Éclat · 55€
- Lotion Nourrissante · 29€

*Gamme Skin — sous-cat `contour` :*
- Gel Contour Yeux · 45€
- Crème Hydrant Yeux · 45€
- Crème Contour Yeux · 49€

*Gamme Skin — sous-cat `serum` :*
- Sérum Rides · 75€
- Sérum Niacinamide 10% · 55€
- Crème Tension Ultime · 89€
- Crème de Nuit · 88€

*Gamme Wellness (sous-cat null — "Bien-Être" sur la carte physique) :*
- Aloe Vera · 60€
- Collagène · 85€
- Thé Detox · 45€
- Fibres · 45€
- Complex Vitamine · 35€
- Minéral Complex · 45€

**Fallback statique :** `productsData.ts` reste mais est mis à jour avec les vraies données. Utilisé uniquement si Supabase est inaccessible.

**Hook :** `useGammeCatalog(gamme, subcategory?)` — fetche depuis Supabase, fallback productsData.ts.

**Pages publiques :**
- `RangeDetail.tsx` : passe à `useGammeCatalog`, affiche les sous-catégories en sections distinctes
- `NosProduits.tsx` : inchangé (liste des 3 gammes)

---

### 4. Admin Gammes — nouvelle page `/admin/gammes`

**Layout :** Sidebar fixe (option B choisie) avec :
```
Gamme Sport
  ↳ Sport
  ↳ Encas
Gamme Skin
  ↳ Nettoyage
  ↳ Korean Products
  ↳ Contour des Yeux
  ↳ Sérum / Anti-Âge
Gamme Wellness  (= Bien-Être sur la carte physique)
```

**Fonctionnalités :**
- Liste des produits de la sous-catégorie sélectionnée
- Bouton **+ Ajouter produit** → formulaire modal ou inline
- Champs : nom, description, prix, prix alternatif (optionnel), image URL, ordre d'affichage
- **Archiver / Restaurer** sur chaque produit
- Section "Archivés" pliable en bas

**Formulaire produit :**
- `name` (obligatoire)
- `description`
- `price` (obligatoire)
- `price_alt` (optionnel — label "Prix alternatif (ex: grand format)")
- `image_url`
- `sort_order`

**Navigation admin :** Ajout d'un lien "Gammes" dans `AdminLayout.tsx`.

---

## Fichiers impactés

| Fichier | Changement |
|---------|------------|
| `supabase/migrations/20260502_add_price_sizes_products.sql` | Colonnes price_small/medium/large |
| `supabase/migrations/20260502_create_gamme_products.sql` | Nouvelle table |
| `supabase/migrations/20260502_seed_gamme_products.sql` | Seed données réelles |
| `src/types/database.ts` | Types pour gamme_products + price_small/medium/large |
| `src/data/menuData.ts` | Corrections boissons (Immuni'Tea, Hydra Boost, archive) |
| `src/data/productsData.ts` | Mise à jour avec vraies données (fallback) |
| `src/pages/Menu.tsx` | Sélecteur 3 tailles sur fiches boissons |
| `src/pages/admin/AdminProduits.tsx` | Champs prix tailles + archive UI |
| `src/pages/admin/AdminGammes.tsx` | Nouvelle page (créer) |
| `src/pages/admin/AdminLayout.tsx` | Lien "Gammes" en navigation |
| `src/pages/RangeDetail.tsx` | Fetch Supabase via useGammeCatalog |
| `src/hooks/useGammeCatalog.ts` | Nouveau hook (créer) |

---

## Ce qui est hors périmètre

- Upload d'images (les images restent des URLs manuelles)
- Gestion des packs / promotions (-10%, -20%)
- Panier ou commande de gamme produits
- Filtres par ingrédient ou bénéfice sur la page gamme
