# Catalogue — Filtres + Quick View + Carte Interactive

**Date :** 2026-04-05
**Statut :** Validé — prêt pour implémentation

---

## Objectif

Enrichir la page `/villas` avec trois fonctionnalités inspirées du Collectionist et Airbnb, sans modifier le design system existant (navy, gold, offwhite, Playfair Display, Tailwind classes).

---

## Périmètre

| Feature | Statut | Priorité |
|---------|--------|----------|
| A — Filtres chips horizontaux | Nouveau composant | 1 |
| B — Quick View drawer | Nouveau composant | 2 |
| C — Carte interactive (viewport filter + marker click) | Amélioration existant | 3 |

La gate voyageur/propriétaire est **conservée**. Le design system existant est **conservé**.

---

## Feature A — Filtres Chips

### Comportement

- Ligne de chips horizontaux scrollable, sticky sous la toolbar existante
- Chips disponibles : **Piscine · Vue mer · Plage directe · 4+ chambres · Budget · Tier**
- Filtre **client-side** sur le tableau `villas` déjà chargé — zéro requête Supabase supplémentaire
- Quand un filtre est actif : badge "N résultats · Tout effacer" apparaît sous les chips
- Villas filtrées hors : **grisées** (opacity réduite) plutôt que supprimées — l'utilisateur voit qu'il y a plus de résultats si il retire le filtre

### Données source (colonnes Supabase déjà disponibles)

| Chip | Colonne | Logique |
|------|---------|---------|
| Piscine | `amenities[]` ou `equipment_exterior` | includes("piscine") |
| Vue mer | `amenities[]` ou `environment` | includes("mer") |
| Plage directe | `amenities[]` | includes("plage") |
| 4+ chambres | `rooms_details` ou `capacity` | >= 4 |
| Budget | `price_per_night` | 3 tranches : < 800€ / 800–1200€ / > 1200€ |
| Tier | `collection_tier` | "Signature" / "Prestige" / "Exclusive" |

> **Note :** Si les colonnes `amenities` ou `equipment_exterior` sont des tableaux JSON, parser côté client. Si les données n'existent pas en base pour certaines villas, le filtre correspondant n'affiche pas ce chip (ou le chip est désactivé visuellement).

### Composants

- **Nouveau** : `components/VillaFilterBar.tsx` — barre de chips
- **Modifié** : `components/VillasMapView.tsx` — intègre `VillaFilterBar`, gère l'état `activeFilters`, passe les villas filtrées à la liste et à la carte

### Design

Utilise les classes existantes :
```tsx
// Chip inactif
className="border border-navy/15 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.24em] text-navy/60 hover:border-navy/40 transition-colors"

// Chip actif
className="border border-gold bg-gold/8 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.24em] text-gold"
```

---

## Feature B — Quick View Drawer

### Comportement

- Bouton "Aperçu rapide" sur chaque carte villa :
  - Desktop : visible au hover
  - Mobile : visible en permanence (petite icône ou texte sous le prix)
- Clic → drawer qui slide depuis le bas (animation `translate-y`)
- Clic en dehors du drawer ou sur ✕ → ferme
- Swipe down (mobile) → ferme

### Contenu du drawer

1. **Bande de photos** : 3 premières images de `image_urls[]` (scroll horizontal)
2. **Localisation** : `location` en eyebrow gold
3. **Nom** : `name` en Playfair Display
4. **Stats clés** : grille 4 colonnes — Chambres | Voyageurs | m² | Note
5. **Chips équipements** : 4 premiers éléments de `amenities[]`
6. **Prix** : `price_per_night` + "/ nuit"
7. **CTAs** :
   - "Voir la villa →" (secondaire, border-navy) → `/villas/${id}`
   - "Réserver" (primaire, bg-navy text-white) → `/book?villaId=${id}`

### Données nécessaires

Le type `VillaMapItem` (dans `VillaLeafletMap.tsx`) doit être enrichi :

```ts
// Avant
export type VillaMapItem = {
  id: string; name: string; location: string;
  price: number; image: string | null; coords: [number, number];
};

// Après
export type VillaMapItem = {
  id: string; name: string; location: string;
  price: number; image: string | null; coords: [number, number];
  // Nouveaux champs
  images: string[];          // image_urls[]
  capacity: number | null;   // capacity
  surface: number | null;    // surface_m2
  amenities: string[];       // amenities[]
  tier: string | null;       // collection_tier
};
```

La query Supabase dans `app/villas/page.tsx` doit inclure : `capacity, surface_m2, amenities, collection_tier, image_urls`.

### Composants

- **Nouveau** : `components/VillaQuickView.tsx` — drawer complet
- **Modifié** : `components/VillasMapView.tsx` — gère `quickViewId` state
- **Modifié** : `components/VillaLeafletMap.tsx` — `onSelect` déclenche quick view (voir Feature C)
- **Modifié** : `app/villas/page.tsx` — query Supabase enrichie + type VillaMapItem

### Animation

```tsx
// Drawer : CSS transform, pas de lib externe
className={`fixed inset-x-0 bottom-0 z-50 bg-white transition-transform duration-300 ${
  open ? 'translate-y-0' : 'translate-y-full'
}`}
```

---

## Feature C — Carte Interactive

### Comportement 1 : Hover carte → marker doré (déjà partiellement là)

- `hoveredId` synchronisé entre `VillasMapView` et `VillaLeafletMap` ✅ (existe déjà)
- Amélioration : le marker survolé devient doré (couleur `#C9A96E`) + popup avec nom + prix
- Actuellement les markers sont tous identiques — différencier l'état `hovered`

### Comportement 2 : Zoom/Pan → filtre la liste

- Écouter les événements Leaflet `moveend` et `zoomend` sur l'instance `map`
- À chaque événement : `map.getBounds()` → filtrer les villas dont les `coords` sont dans les bounds
- Remonter les bounds via callback `onBoundsChange(bounds)` vers `VillasMapView`
- Dans la liste : villas hors bounds → `opacity-40` + label "Hors de la vue"
- Badge dans la toolbar : "N dans la vue" (met à jour dynamiquement)
- Le filtre viewport est **cumulatif** avec les chips du Feature A

### Comportement 3 : Click marker → Quick View

- Actuellement `onSelect(id)` scroll vers la carte dans la liste
- Remplacer par : `onSelect(id)` → `setQuickViewId(id)` → ouvre le drawer Feature B
- Le scroll vers la carte reste en secondaire (après ouverture du drawer)

### Composants modifiés

- `components/VillaLeafletMap.tsx` :
  - Marker color conditionnel (`hoveredId === villa.id` → doré)
  - `map.on('moveend', ...)` et `map.on('zoomend', ...)` → callback `onBoundsChange`
  - `onSelect` → déclenche quick view

- `components/VillasMapView.tsx` :
  - Nouveau state `mapBounds` + handler `handleBoundsChange`
  - Liste filtrée = chips filters ∩ bounds filter

---

## Architecture des états dans VillasMapView

```
VillasMapView (parent)
├── state: activeFilters { piscine, viewMer, plage, chambres, budget, tier }
├── state: quickViewId: string | null
├── state: hoveredId: string | null
├── state: mapBounds: L.LatLngBounds | null
│
├── filteredVillas = villas.filter(chips) ∩ filter(bounds)
│
├── VillaFilterBar
│   └── onFilterChange → setActiveFilters
│
├── List (cartes villas)
│   ├── onMouseEnter → setHoveredId
│   ├── "Aperçu rapide" → setQuickViewId
│   └── villas hors bounds → opacity-40
│
├── VillaLeafletMap
│   ├── hoveredId (reçu)
│   ├── onHover → setHoveredId
│   ├── onSelect → setQuickViewId (remplace scroll)
│   └── onBoundsChange → setMapBounds
│
└── VillaQuickView
    ├── villaId = quickViewId
    └── onClose → setQuickViewId(null)
```

---

## Fichiers touchés

| Fichier | Action |
|---------|--------|
| `components/VillaFilterBar.tsx` | Créer |
| `components/VillaQuickView.tsx` | Créer |
| `components/VillasMapView.tsx` | Modifier (états, layout) |
| `components/VillaLeafletMap.tsx` | Modifier (marker colors, events, onSelect) |
| `app/villas/page.tsx` | Modifier (query Supabase enrichie) |
| `components/VillaLeafletMap.tsx` (type) | Modifier (VillaMapItem enrichi) |

---

## Contraintes

- Pas de nouvelle dépendance npm (Leaflet déjà installé, CSS Tailwind déjà configuré)
- Mobile-first : touch targets ≥ 44px sur tous les boutons
- Le design system existant est conservé à 100% (navy, gold, offwhite, Playfair)
- La gate audience (voyageur/propriétaire) n'est pas modifiée
- TypeScript strict — pas de `any`

---

## Hors scope

- Wishlist partageable
- Comparateur de villas
- Modification de la gate d'accueil
- Filtres côté serveur (Supabase RPC)
