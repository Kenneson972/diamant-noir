# Admin — Section Propriétaires (Dashboard + Détail)

**Date** : 2026-06-05
**Type** : Feature — Nouvelle section admin

## Objectif

Remplacer la page `proprietaires` basique (liste email/nom/villa_count) par une section complète avec dashboard KPI et page détail par propriétaire (infos, villas, Stripe, revenus, litiges).

## Architecture

Pattern hybride Next.js 14 :
- Server Components pour le chargement initial
- Client islands (HeroUI Pro) pour les actions et l'édition
- API routes existantes (`admin/owners`, `admin/villas`, `admin/bookings`, `admin/global-stats`) réutilisées
- Nouvelle API route : `api/admin/owners/[id]` (GET, PATCH)

## Data Flow

```
profiles (role=owner)
  → Dashboard liste (/admin/proprietaires)
    → Clic → Détail (/admin/proprietaires/[id])
      ├── Onglet Infos    ← profiles + stripe_connect
      ├── Onglet Villas   ← villas (owner_id filter)
      ├── Onglet Revenus  ← bookings (villa_id JOIN)
      └── Onglet Stripe   ← stripe_disputes + Stripe API
```

## Section 1 — Dashboard Liste (`/admin/proprietaires`)

Remplace la page actuelle.

### Composants
- `AdminOwnersDataGrid` — existant, à enrichir
- `AdminPageIntro` — existant
- `OwnersFilterBar` — nouveau, filtres search/statut

### DataGrid enrichie (colonnes) — Version Lite

> **Règle de perf** : 1 seule requête agrégée (SQL view ou RPC) pour la liste. Métriques lourdes (CA, occupation, disputes) → détail uniquement.

| Colonne | Source SQL | Format |
|---------|-----------|--------|
| Propriétaire | `profiles.full_name` + `avatar_url` | Avatar + nom |
| Email | `profiles.email` | Texte + copier |
| Villas | `COUNT(villas)` GROUP BY owner_id | Badge "2 villas" + publié/brouillon |
| Stripe Connect | `stripe_connect_onboarding_completed` | Badge ✅ / ⚠️ / ❌ |
| Commission | `AVG(villas.commission_rate)` | Pourcentage (défaut 25%) |
| Suspendu | `profiles.suspended` | Badge rouge si oui |
| Inscription | `profiles.created_at` | Date relative |
| Actions | — | Bouton "Détail" |

**Métriques lourdes → détail uniquement :** CA généré, taux d'occupation, dernières résas, disputes. Ces données nécessitent des JOINs coûteux — chargées uniquement dans `/admin/proprietaires/[id]`.

### Stratégie SQL
Une **SQL view** `admin_owner_summary` agrège profiles + villas + stripe_connect en 1 requête :
```sql
CREATE VIEW admin_owner_summary AS
SELECT 
  p.id, p.full_name, p.email, p.avatar_url, p.created_at,
  p.stripe_connect_account_id, p.stripe_connect_onboarding_completed,
  p.suspended,
  COUNT(v.id) AS villa_count,
  COUNT(v.id) FILTER (WHERE v.is_published) AS published_count,
  AVG(v.commission_rate) AS avg_commission
FROM profiles p
LEFT JOIN villas v ON v.owner_id = p.id
WHERE p.role = 'owner'
GROUP BY p.id;
```

### Filtres
- Recherche par nom/email
- Statut Stripe (connecté / en attente / non configuré)
- Villas actives (≥1 / 0)

### État vide
`KayvilaEmptyState` avec icône Users — "Aucun propriétaire inscrit"

---

## Section 2 — Détail Propriétaire (`/admin/proprietaires/[id]`)

Nouvelle page avec 4 onglets (HeroUI `Tabs`).

### Layout
```
┌─────────────────────────────────┐
│ ← Retour liste                  │
│ Avatar + Nom + Badge Stripe     │
│ barre d'actions                 │
├─────────────────────────────────┤
│ [Infos] [Villas] [Revenus] [Stripe] │
├─────────────────────────────────┤
│     Contenu de l'onglet         │
└─────────────────────────────────┘
```

### Onglet 1 — Infos

**Lecture :**
- Photo, nom complet, email, téléphone
- Date d'inscription
- Statut Stripe Connect : `charges_enabled`, `payouts_enabled`, `details_submitted`
- `stripe_connect_account_id`, date onboarding complété

**Édition inline :**
- Nom complet, téléphone, email (PATCH `profiles`)
- Taux de commission par défaut (PATCH `villas.commission_rate`)

**Barre d'actions :**
- [Contacter] → `mailto:` (admin → proprio uniquement, jamais proprio ↔ voyageur)
- [Forcer reconnexion Stripe] → recreate onboarding link via `POST /api/stripe/connect-onboarding`
- [Suspendre] → flag `profiles.suspended` (booléen, pas de blocage JWT dans cette phase)
- [Exporter données] → CSV villas + revenus

### Onglet 2 — Villas

**Liste des villas du proprio :**
- Miniature (première image)
- Nom, statut (publié / brouillon / non publié)
- Prix par nuit
- Taux de commission
- Nombre de réservations
- Occupancy rate

**Actions par villa :**
- [Éditer] → `/admin/villas/[id]`
- [Voir] → `/villas/[id]`
- [Désassigner] → set `owner_id = null`

**Action globale :**
- [Assigner une villa existante] → dropdown search villas sans owner

### Onglet 3 — Revenus

**KPIs :**
- CA total généré (toutes les résas confirmées)
- Commission Kayvila (25%)
- Reversé au propriétaire (75% séjour)

**Graphique :**
- Bar chart revenus mensuels (12 derniers mois)
- 2 séries : CA brut + reversement net

**Tableau :**
- Réservations confirmées (date, villa, montant, commission, statut)

### Onglet 4 — Stripe & Litiges

> **Dépendance** : Payouts et statut Connect viennent de l'**API Stripe** (pas Supabase). Appels serveur uniquement.

**Stripe Connect détaillé :**
- ID compte Connect
- `charges_enabled`, `payouts_enabled`, `details_submitted`
- Date création compte (Stripe API)

**Litiges (Supabase) :**
- Liste des disputes actives depuis `stripe_disputes` (table existante)

**Payouts récents (Stripe API) :**
- Derniers transferts via `stripe.transfers.list({ destination: accountId, limit: 10 })`
- Appel serveur dans `GET /api/admin/owners/[id]/stripe`

---

## API Routes

### Existantes (à réutiliser)
- `GET /api/admin/owners` — liste owners
- `GET /api/admin/villas` — villas avec filtre owner_id
- `GET /api/admin/bookings` — réservations
- `GET /api/admin/global-stats` — stats globales

### Nouvelles
- `GET /api/admin/owners/[id]` — détail complet d'un owner (profile + villas + stats)
- `PATCH /api/admin/owners/[id]` — mise à jour profile owner
- `GET /api/admin/owners/[id]/revenue` — revenus mensuels (pour le graph)
- `GET /api/admin/owners/[id]/stripe` — statut Connect + disputes + payouts (appelle Stripe API)

---

## Composants à créer

| Composant | Rôle |
|-----------|------|
| `OwnersFilterBar` | Filtres search + statut |
| `OwnerDetailHeader` | Header page détail (avatar, nom, actions) |
| `OwnerInfoTab` | Onglet infos (lecture + édition) |
| `OwnerVillasTab` | Onglet villas (liste + assignation) |
| `OwnerRevenueTab` | Onglet revenus (KPIs + graph + tableau) |
| `OwnerStripeTab` | Onglet Stripe (Connect + disputes + payouts) |
| `OwnerRevenueChart` | Bar chart revenus mensuels |

## Modifications existantes
- `AdminOwnersDataGrid` — enrichir avec les nouvelles colonnes
- `app/(admin)/admin/proprietaires/page.tsx` — refonte complète
- `app/(admin)/admin/proprietaires/[id]/page.tsx` — nouvelle page

## Scope

- Hors scope : gestion des payouts Stripe (dashboard Stripe externe)
- Hors scope : communication directe (messaging) — déjà dans `/messagerie`
- Hors scope : système de suspension (juste le flag, pas de blocage JWT)
