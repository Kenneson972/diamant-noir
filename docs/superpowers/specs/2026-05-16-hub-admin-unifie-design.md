# Hub Admin Unifié — Design Spec

Date : 2026-05-16

## Problème

- `/admin/hub-classique` existe (grille villas + métriques) mais n'est pas dans le menu admin
- `/admin/villas` (tableau villas) est dans le menu mais sans métriques
- `/admin/villas/[id]` est en lecture seule — le bouton "Éditeur complet" redirige vers `/dashboard/villas/{id}` (route propriétaire), inaccessible pour l'admin
- L'API `/api/dashboard/update-villa` rejette les admins avec 403 (check `owner_id !== user.id`)
- Les composants `VillaBookingsRegistry`, `VillaImageManagerWrapper`, `PlanningIcalSyncCard`, `IcalConnectivityStatus`, `VillaPublishChecklist` existent dans `components/dashboard/villa-editor/` mais sont orphelins

## Solution

Un seul hub : `/admin/villas` enrichi. Éditeur complet sur `/admin/villas/[id]`. Redirect depuis hub-classique.

---

## Fichiers impactés

| Fichier | Action |
|---|---|
| `app/(admin)/admin/villas/page.tsx` | Modifier — enrichir tableau (image, capacité, tier, résa, revenus) |
| `app/(admin)/admin/villas/[id]/page.tsx` | Modifier — remplacer read-only par éditeur complet (6 sections) |
| `app/(admin)/admin/hub-classique/page.tsx` | Modifier — remplacer par redirect `/admin/villas` |
| `app/api/dashboard/update-villa/route.ts` | Modifier — autoriser les admins à bypasser le check ownership |

---

## 1. Tableau enrichi `/admin/villas`

### Données supplémentaires à fetcher
Ajouter une query `bookings` groupée par `villa_id` (même logique que hub-classique actuel) :
```typescript
const { data: bookings } = await supabaseAdmin()
  .from("bookings")
  .select("villa_id, total_price_cents, status")
  .in("villa_id", villaIds)
```

Calculer par villa : `bookingCount` (total) et `confirmedRevenue` (sum `total_price_cents` où `status = "confirmed"` / 100).

### Colonnes du tableau (ordre)

| Colonne | Source | Notes |
|---|---|---|
| Vignette (40×40) | `image_url` | `<img>` ou placeholder `Building2` |
| Nom | `name` | |
| Localisation | `location` | |
| Prix/nuit | `price_per_night` | |
| Capacité | `capacity` | Ajouter au select |
| Tier | `collection_tier` | Ajouter au select, affiché en `text-gold` si présent |
| Propriétaire | `owner_name` | Lien `/admin/membres/{owner_id}` |
| Publiée | `is_published` | Badge vert/gris |
| Résa | `bookingCount` | |
| Revenus | `confirmedRevenue` | `Intl.NumberFormat fr-FR` |
| Actions | — | Modifier + Voir ↗ (externe) |

### Sélect Supabase mis à jour
```typescript
.select("id, name, location, price_per_night, capacity, collection_tier, owner_id, is_published, image_url")
```

---

## 2. Éditeur complet `/admin/villas/[id]`

### Structure de la page

Layout 2 colonnes (lg) : colonne principale (2/3) + sidebar (1/3).

**Colonne principale — 4 sections :**
1. `VillaFormFields` + `VillaAmenitiesEditorWrapper` — wrappés dans `VillaEditorForm`
2. `VillaImageManagerWrapper` — gestion photos
3. `VillaBookingsRegistry` — réservations avec filtres + export CSV
4. `PlanningIcalSyncCard` + `IcalConnectivityStatus` — sync iCal

**Sidebar — 2 blocs :**
1. `VillaPublishChecklist` — checklist avant publication (nom ✓, prix ✓, images ✓, etc.)
2. Actions : bouton "Voir sur le site ↗" + lien "Retour aux villas"

**Bouton "Enregistrer" sticky** en bas via `VillaEditorForm`.

### Données fetchées (server component)
```typescript
const { data: villa } = await supabaseAdmin()
  .from("villas")
  .select("*")
  .eq("id", villaId)
  .single()

const { data: bookings } = await supabaseAdmin()
  .from("bookings")
  .select("id, guest_name, start_date, end_date, source, price, total_price_cents, payment_status, status")
  .eq("villa_id", villaId)
  .order("start_date", { ascending: false })
```

### Checklist items pour `VillaPublishChecklist`
Calculés depuis les données villa :
```typescript
const checklistItems = [
  { id: "name",  ok: !!villa.name,          label: "Nom renseigné" },
  { id: "price", ok: !!villa.price_per_night, label: "Prix par nuit défini" },
  { id: "desc",  ok: !!villa.description,   label: "Description rédigée" },
  { id: "img",   ok: !!villa.image_url,     label: "Photo principale" },
  { id: "loc",   ok: !!villa.location,      label: "Localisation" },
]
```

### Composant client
La page server passe `villa` et `bookings` à un composant client `AdminVillaEditClient` qui gère l'état local des filtres de `VillaBookingsRegistry` et le state iCal de `PlanningIcalSyncCard`.

---

## 3. Fix API `/api/dashboard/update-villa`

### Bug actuel (ligne 36)
```typescript
if (villa.owner_id && villa.owner_id !== user.id) {
  return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
}
```

Un admin n'est pas le `owner_id` de la villa → 403.

### Fix
Vérifier si l'utilisateur est admin avant le check ownership :
```typescript
import { isStaffAdmin } from "@/lib/auth/admin-access"

// Fetch profile role
const { data: profile } = await supabaseAdmin()
  .from("profiles")
  .select("role")
  .eq("id", user.id)
  .maybeSingle()

const isAdmin = isStaffAdmin(profile?.role, user.user_metadata?.role as string, user.email)

if (!isAdmin && villa.owner_id && villa.owner_id !== user.id) {
  return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
}
```

---

## 4. Redirect hub-classique

Remplacer `app/(admin)/admin/hub-classique/page.tsx` par :
```typescript
import { redirect } from "next/navigation"
export default function HubClassiquePage() {
  redirect("/admin/villas")
}
```

---

## Ce qui ne change pas

- `app/(admin)/admin/villas/ajouter/page.tsx` — inchangé
- `AdminMenuItems.ts` — "Villas" pointe déjà sur `/admin/villas`, aucun changement
- Tous les composants `villa-editor/` — utilisés tels quels, pas modifiés
- `VillaEditorForm` — utilisé tel quel
- Route proprio `/dashboard/villas/[villaId]` — inchangée
