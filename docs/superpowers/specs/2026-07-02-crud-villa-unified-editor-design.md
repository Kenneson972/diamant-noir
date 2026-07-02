# Spec — Éditeur de villa unifié Kayvila

**Date** : 2026-07-02
**Statut** : validé (brainstorming avec Kenneson)
**Origine** : mission `fable-crud-villa.md`

## Objectif

Remplacer les deux formulaires villa incompatibles (création HTML natif 622 lignes, édition HeroUI 514 lignes) par un éditeur unique qui bascule automatiquement entre mode création (stepper 4 étapes) et mode édition (sections repliables + nav rapide). Amélioration ergonomique en profondeur de toutes les sections (équipements, chambres, tarifs, photos).

## Décisions actées

1. **Approche A — composant unique avec bascule mode** : `VillaEditor` détermine `mode = villa?.id ? "edit" : "create"` automatiquement. Stepper en création, accordéon en édition.
2. **Sous-éditeurs gardés et insérés proprement** dans les sections repliables — pas de réécriture from scratch. On améliore leurs wrappers et leurs états.
3. **`VillaFormFields` gardé comme brique de base** — importé dans la 1ère section « Infos générales ».
4. **Mobile : onglets Éditer | Aperçu** — la preview live se met à jour même sur l'onglet caché.
5. **Améliorations ergonomiques** détaillées ci-dessous — appliquées aux sous-éditeurs existants.

## Architecture

```
VillaEditor ({ villa?, isAdmin })
├── ProgressBar (sticky top, 10 pastilles, mode édition uniquement)
├── SplitLayout (gauche/droite ≥1024px, onglets mobile)
│   ├── Colonne gauche (formulaire)
│   │   ├── mode création : Stepper (4 étapes)
│   │   │   ├── 1. Infos → VillaFormFields (name, location, description, capacity…)
│   │   │   ├── 2. Photos → VillaImageManager
│   │   │   ├── 3. Tarifs → price_per_night + SeasonalPricesEditor
│   │   │   └── 4. Finalisation → récapitulatif + checklist + CTA Publier
│   │   └── mode édition : Accordéon (10 sections) + QuickNav latérale
│   │       ├── Infos générales → VillaFormFields
│   │       ├── Photos → VillaImageManager (drag & drop réordonnancement)
│   │       ├── Équipements → grouped ChipEditors par catégorie
│   │       ├── Pièces → RoomsEditor (cartes + presets)
│   │       ├── Tarifs → SeasonalPricesEditor (timeline + anti-chevauchement)
│   │       ├── Disponibilités → AdminVillaBlocks (admin only, inchangé)
│   │       ├── Contacts urgence → EmergencyContactsEditor
│   │       ├── Tags → ChipEditor (environnement, points d'intérêt)
│   │       ├── iCal → PlanningIcalSyncCard + IcalConnectivityStatus
│   │       └── Administration → owner_id, is_published, collection_tier, commission, cleaning_fee (admin only)
│   └── Colonne droite (preview live ≥1024px)
│       └── VillaPreviewCard (rendu miniature de la fiche publique, interactif)
└── AutosaveIndicator (point vert/rouge, mode édition uniquement)
```

**Mode switching** : déterminé par `villa?.id` — pas de prop externe. Le stepper création saute les sections sans villa.id (iCal, blocs admin). Les routes API (`POST /api/dashboard/create-villa`, `POST /api/dashboard/update-villa`) restent inchangées.

## Améliorations ergonomiques par section

### Photos — drag & drop natif + sélection multiple
- **Drag & drop HTML5** remplace les flèches ↑↓ : on glisse les vignettes pour réordonner (fonction `arrayMove` inline, zéro librairie).
- Badge « Cover » (couronne dorée KayvilaPngIcon) sur la 1ère photo. Clic sur une autre → bouton « Définir comme principale ».
- Compteur « 7/20 photos » en en-tête.
- Mode suppression multiple : bouton « Modifier » → cases à cocher → « Supprimer (3) ».

### Chambres — icônes par lit, capacité auto, presets
- Chaque carte de chambre affiche une icône par type de lit : King/Queen = lit large, Double = lit medium, Simple = lit small, Canapé-lit = canapé. Rendu via KayvilaPngIcon (noms existants à vérifier, fallback lucide `Bed`/`BedSingle`/`Sofa`).
- Capacité totale calculée automatiquement : `Σ(bedCapacity)` avec King=2, Queen=2, Double=2, Simple=1, Canapé-lit=1. Affichée en sous-titre : « 4 chambres · 8 personnes ».
- Bouton « + Ajouter » → dropdown avec 3 presets :
  - « Chambre parentale » → King size + salle de bain privative
  - « Chambre standard » → Queen size
  - « Chambre enfant » → 2×Simple
  - (via un `<select>` ou 3 boutons dans un petit menu)

### Tarifs saisonniers — timeline + anti-chevauchement
- **Ligne « Prix standard »** non supprimable, toujours présente : prix par défaut toute l'année (`price_per_night` du formulaire principal). Les saisons viennent SURCHARGER ce prix.
- **Timeline miniature** : barres horizontales colorées représentant chaque saison sur l'année. Chevauchenent → rouge. Utilise des `<div>` avec `width: X%` calculé depuis start/end.
- Sélecteurs : `<select>` mois (1-12) + `<select>` jour (1-31) — remplace les inputs texte MM-DD ambigus.
- Prix formaté live : `150` affiché comme `150 €/nuit` pendant la saisie.
- Bouton « Dupliquer » sur chaque ligne de saison.

### Équipements — presets rapides + suggestions catégorisées + recherche
- `SUGGESTED_AMENITY_LABELS` devient un `Record<Category, string[]>` avec 5 catégories (interior, exterior, services_home, services_collection, a_la_carte).
- Chaque catégorie de formulaire n'affiche que ses suggestions pertinentes (ex: `equipment_exterior` → suggestions "Piscine", "Jardin", "Barbecue"…).
- Mini-champ « Filtrer… » au-dessus des suggestions quand >8 items.
- **Bouton « Remplissage rapide »** en haut de la section Équipements : dropdown avec 3 presets :
  - « Équipements famille » → ajoute lit bébé, chaise haute, barrière piscine, jeux de société…
  - « Villa de luxe » → ajoute chef à domicile, champagne, massage, voiturier…
  - « Villa éco » → ajoute panneaux solaires, compost, produits bio…
- Feedback visuel : animation `scale-[1.05]` quand une chip est ajoutée, `opacity-0` + fondu quand retirée.

### Formulaire principal — barre de progression + QuickNav + accordéon
- **ProgressBar** sticky en haut (mode édition) : 10 pastilles colorées — vert (section complétée), orange (partielle), gris (vide). Calculé depuis les champs du form state.
- **QuickNav** (desktop ≥1024px) : colonne d'icônes à gauche, fixe. Clic → `scrollIntoView({ behavior: 'smooth' })` vers la section. Sur mobile : pas de QuickNav (l'accordéon suffit).
- **Géolocalisation** : bouton « Me localiser » existant conservé + lien « Ouvrir dans Maps » à côté des coordonnées (`https://maps.google.com/?q=lat,lng`).

### Preview live — interactive
- Rendu miniature de la fiche publique : `VillaCoverImage` + nom + localisation + prix/nuit + 3 premiers équipements en chips. Se met à jour en temps réel à chaque frappe.
- **Highlight au survol** : survoler une section du formulaire → zone correspondante de la preview pulse légèrement (`ring-2 ring-gold/30` transitoire). Implémenté via un état `hoveredSection` partagé.

### Création wizard — cérémonie de fin
- Étape 4 : récapitulatif visuel de tout le contenu saisi (nom, photos, prix, équipements, chambres).
- `VillaPublishChecklist` existant intégré avec cases à cocher.
- Bouton « Publier la villa » (gold, large) avec micro-animation de succès (check qui pulse 1s).

## Data flow & autosave

- **State unique** : `useReducer` central dans `VillaEditor`, état = objet villa complet. Tous les sous-éditeurs reçoivent `value` + `onChange(field, newValue)`.
- **Autosave** (mode édition uniquement) : `useEffect` → debounce 2.5s → `POST /api/dashboard/update-villa` (PATCH partiel, seuls les champs modifiés).
- **Validation frontend** : Zod schema dans `lib/validations/villa.ts`. Erreurs inline sous chaque champ (pas de toast). Le schema serveur existant dans les routes API reste inchangé — on ajoute juste la couche client.
- **Images** : upload géré par `VillaImageManager` existant (Supabase Storage). Le drag & drop de réordonnancement est local (URLs déjà uploadées).

## Composants — création / modification

**Nouveaux :**
- `villa-editor/VillaEditor.tsx` — composant principal (~400 lignes max), useReducer + bascule mode
- `villa-editor/VillaEditorShell.tsx` — split layout responsive + onglets mobile
- `villa-editor/VillaPreviewCard.tsx` — preview live interactive
- `villa-editor/ProgressBar.tsx` — 10 pastilles de complétion
- `villa-editor/QuickNav.tsx` — navigation latérale desktop
- `villa-editor/Stepper.tsx` — indicateur d'étapes (création)
- `villa-editor/AutosaveIndicator.tsx` — point vert/rouge + timestamp
- `lib/validations/villa.ts` — Zod schema villa (full)
- `lib/amenity-presets.ts` — 3 presets équipements (famille, luxe, éco)
- `lib/room-presets.ts` — 3 presets chambres (parentale, standard, enfant)

**Modifiés :**
- `villa-editor/VillaAmenitiesEditor.tsx` — suggestions catégorisées + recherche + presets
- `villa-editor/RoomsEditor.tsx` — icônes par lit + capacité auto + presets
- `villa-editor/SeasonalPricesEditor.tsx` — timeline + anti-chevauchement + sélecteurs mois
- `villa-editor/VillaImageManager.tsx` — drag & drop réordonnancement + suppression multiple
- `villa-editor/ChipEditor.tsx` — recherche + contraste + hauteur minimum 36px
- `villa-editor/EmergencyContactsEditor.tsx` — élargissement champ téléphone
- `villa-editor/VillaFormFields.tsx` — refactor sections en accordéon + géoloc contrôlée
- `lib/villa-amenities-suggested.ts` — structuré par catégorie

**Supprimés :**
- `dashboard/admin/AdminVillaForm.tsx` (622 lignes)
- `dashboard/proprio/VillaEditorForm.tsx` (514 lignes)
- Partie formulaire de `app/(admin)/admin/villas/[id]/AdminVillaEditClient.tsx` (→ simplifié en wrapper de VillaEditor)

**Intégration pages :**
- `app/(admin)/admin/villas/ajouter/page.tsx` — wrapper `<VillaEditor isAdmin />` (création admin)
- `app/(admin)/admin/villas/[id]/page.tsx` — wrapper `<VillaEditor villa={...} isAdmin />` (édition admin)
- `app/(proprio)/dashboard/villas/[villaId]/page.tsx` — wrapper `<VillaEditor villa={...} isAdmin={false} />` (édition proprio)
- `app/(proprio)/dashboard/villas/nouvelle/page.tsx` — wrapper `<VillaEditor isAdmin={false} />` (création proprio)

## Ne PAS casser (règle absolue)

- Routes API : `app/api/dashboard/create-villa/route.ts`, `app/api/dashboard/update-villa/route.ts`, `app/api/admin/owners/route.ts`
- `VillaBookingsRegistry`, `PlanningIcalSyncCard`, `IcalConnectivityStatus` — inchangés
- `AdminVillaBlocks`, `AdminVillasDataGrid` — inchangés
- Auth + RLS Supabase
- Layout admin existant (DashboardShell)
- Colonnes DB — zéro migration

## Direction design (impeccable + mobile-responsive)

- Mêmes règles que la spec responsive dashboards : zéro side-stripe, zéro gradient-text, or = signal uniquement (1 CTA Publier par écran), never `border-left/right > 1px` coloré.
- Mobile : inputs `text-base` (16px anti-zoom iOS), zones tactiles ≥44px, `pb-[env(safe-area-inset-bottom)]` sur les éléments fixes.
- Icônes en noms string via `DashboardNavIcon` / `KayvilaPngIcon`, jamais de composant Lucide en prop Server→Client. Pas de fonction en prop Server→Client.
- Strings français avec apostrophes → double quotes.
- Fichiers < 500 lignes. `VillaEditor.tsx` visé à ~400 lignes — si ça dépasse, extraire les reducers/handlers dans `lib/villa-editor-reducer.ts`.

## Gestion d'erreur

- **Autosave** : en cas d'échec réseau → `AutosaveIndicator` passe au rouge « Erreur — réessayer ». Clic dessus → retry manuel. Pas de toast intempestif.
- **Upload** : déjà géré par `VillaImageManager` (taille >5Mo, format invalide → message).
- **Validation** : erreurs Zod inline sous chaque champ. Formulaire non soumis tant qu'invalide (bouton Submit désactivé).
- **API 500** : toast « Une erreur est survenue — réessayez » avec possibilité de fermer.
- **Section vide** : chaque section affiche un helper text contextuel (« Aucune chambre configurée — ajoutez-en une pour calculer la capacité »).

## Tests

- **Vitest** (`lib/**/*.test.ts`, `components/**/*.test.ts`) :
  - `lib/validations/villa.test.ts` : Zod schema complet (valide, invalide, champs requis, types)
  - `lib/villa-editor-reducer.test.ts` : reducer actions (SET_FIELD, ADD_ROOM, REMOVE_IMAGE…)
  - `lib/room-presets.test.ts` : presets génèrent les bonnes Room[]
  - `lib/amenity-presets.test.ts` : presets retournent les bonnes catégories
  - `lib/season-overlap.test.ts` : détection chevauchement dates
- **Playwright** (`tests/crud-villa-unified.spec.ts`, `--workers=1`) :
  - Création wizard complet (4 étapes → villa créée → redirection vers liste)
  - Édition : ouverture section, modification champ, autosave indicator vert
  - Admin vs proprio : champs admin visibles pour admin, absents pour proprio
  - Drag & drop photos (vérification visuelle de l'ordre)
  - Preset chambres : « Chambre parentale » insère King+ensuite
  - Mobile : onglets Éditer/Aperçu fonctionnels
  - Non-régression : DataGrid villas toujours fonctionnel, VillaBookingsRegistry intact

## Risques

- **Autosave POST sans villa.id** → géré : autosave désactivé en mode création (pas de villa.id).
- **Deux onglets admin/proprio ouverts** → édition concurrente possible. Hors scope. Un commentaire dans le code prévient.
- **`VillaFormFields` 235 lignes de props `Record<string, any>`** → typage faible. On garde tel quel (dette existante) mais les nouvelles props de VillaEditor sont strictement typées.
- **Drag & drop HTML5 sur mobile** → natif ne marche pas bien. On garde les flèches ↑↓ en fallback sur mobile (<768px).
- **Zod schema** doit correspondre EXACTEMENT au payload accepté par les routes API. Vérifier les champs acceptés dans `create-villa/route.ts` et `update-villa/route.ts`.
