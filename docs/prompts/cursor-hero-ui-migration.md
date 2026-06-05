# Mega-Prompt Cursor — Nettoyage dépendances + Hero UI Pro

**Date** : 2026-06-06
**Projet** : Kayvila Diamant Noir
**Objectif** : Remplacer 6 librairies UI (~40 Mo) par Hero UI Pro, SANS casser le design existant.

---

## ⚠️ RÈGLE ABSOLUE — PRÉSERVER LE DESIGN

Le design actuel de Kayvila est **éditorial luxe** :
- **Couleurs** : Gold `#D4AF37`, Navy `#0A0A0A`, Navy-900 `#0B1D2E`, Navy-800 `#132A41`, Offwhite `#FAFAFA`
- **Typo** : Display éditoriale, interlignage généreux
- **Composants maison** : `DashboardShell`, `AdminPageIntro`, `ExpandableDescription`, `VillaAccordionInfo`, `VillaBookingWrapper`, `BookingBottomSheet`, `EmptyDashboard`

**Hero UI doit s'adapter au design Kayvila, PAS l'inverse.**
- Les composants Hero UI héritent des couleurs Tailwind → configurer `tailwind.config.ts` pour que `primary` = Gold, `neutral` = Navy
- Si un composant Hero UI ne peut pas être stylé comme l'existant → **garder le composant maison**
- Vérifier visuellement chaque page après migration : `/admin`, `/dashboard`, `/villas/[id]`, `/espace-client`

---

## Phase 1 — Désinstallation (à faire EN PREMIER)

```bash
npm uninstall \
  @radix-ui/themes \
  @radix-ui/react-dropdown-menu \
  @radix-ui/react-popover \
  @radix-ui/react-tabs \
  react-day-picker \
  @fullcalendar/core \
  @fullcalendar/daygrid \
  @fullcalendar/interaction \
  @fullcalendar/react \
  @dnd-kit/core \
  @dnd-kit/sortable \
  @dnd-kit/utilities \
  gsap \
  leaflet \
  leaflet.markercluster \
  @types/leaflet \
  @types/leaflet.markercluster
```

Puis :
```bash
npm install hero-ui-pro
```

**Après désinstallation, `npm run build` va casser.** C'est normal — on rebranche tout en Phase 2.

---

## Phase 2 — Implémentation Hero UI Pro (composant par composant)

### 2.1 — Configuration Tailwind

Dans `tailwind.config.ts`, ajouter la config Hero UI avec les couleurs Kayvila :

```typescript
import { heroUI } from "hero-ui-pro/plugin";

const config: Config = {
  content: [
    "./node_modules/hero-ui-pro/dist/**/*.{js,ts,jsx,tsx}",
    // ... contenu existant
  ],
  theme: {
    extend: {
      colors: {
        gold: "#D4AF37",
        navy: "#0A0A0A",
        "navy-900": "#0B1D2E",
        "navy-800": "#132A41",
        offwhite: "#FAFAFA",
        // ... existant
      },
    },
  },
  plugins: [
    heroUI({
      themes: {
        light: {
          colors: {
            primary: "#D4AF37",  // Gold = couleur principale
            secondary: "#0A0A0A", // Navy = secondaire
            background: "#FAFAFA",
            foreground: "#0A0A0A",
          },
        },
      },
    }),
  ],
};
```

---

### 2.2 — Remplacement FullCalendar → Hero UI Calendar

**Fichiers à modifier** :
- `components/TeamCalendar.tsx`
- `components/AdminCalendar.tsx`

**Mapping** :
| FullCalendar | Hero UI |
|-------------|---------|
| `<FullCalendar>` | `<Calendar>` from `hero-ui-pro/calendar` |
| `dayGridPlugin` | Vue mois intégrée |
| `interactionPlugin` | `onDateSelect` |
| `events={...}` | `events={...}` (même format) |

**Piège** : FullCalendar utilise `event.start` / `event.end`, Hero UI utilise `date` / `endDate`. Mapper les noms de champs.

---

### 2.3 — Remplacement dnd-kit → Hero UI Drag & Drop

**Fichiers à modifier** :
- `components/dashboard/villa-editor/VillaImageManager.tsx`
- `components/dashboard/SortableImage.tsx`

**Mapping** :
| dnd-kit | Hero UI |
|---------|---------|
| `<DndContext>` | `<DragAndDrop>` |
| `<SortableContext>` | Conteneur avec `onReorder` |
| `useSortable` | Props `draggable` sur chaque item |

**Si Hero UI ne propose pas de drag & drop natif** → garder le `VillaImageManager` en l'état sans librairie (input file natif + ordre manuel via flèches haut/bas).

---

### 2.4 — Remplacement Radix Dropdown → Hero UI Dropdown

**Fichiers à modifier** :
- Chercher `@radix-ui/react-dropdown-menu` → remplacer par `hero-ui-pro/dropdown`

**Mapping** :
| Radix | Hero UI |
|-------|---------|
| `<DropdownMenu.Root>` | `<Dropdown>` |
| `<DropdownMenu.Trigger>` | `<DropdownTrigger>` |
| `<DropdownMenu.Content>` | `<DropdownMenu>` |
| `<DropdownMenu.Item>` | `<DropdownItem>` |

**⚠️ Vérifier le styling** : le dropdown admin (actions sur réservations, demandes) doit garder le même look — fond navy, texte offwhite, bordure gold.

---

### 2.5 — Remplacement Radix Tabs → Hero UI Tabs

**Fichiers à modifier** :
- Chercher `@radix-ui/react-tabs` → remplacer par `hero-ui-pro/tabs`

**Mapping** :
| Radix | Hero UI |
|-------|---------|
| `<Tabs.Root>` | `<Tabs>` |
| `<Tabs.List>` | `<TabList>` |
| `<Tabs.Trigger>` | `<Tab>` |
| `<Tabs.Content>` | `<TabPanel>` |

---

### 2.6 — Remplacement GSAP → CSS/Tailwind

**Fichier à modifier** :
- `app/prestations/PrestationsPageClient.tsx`

**Mapping** :
| GSAP | Tailwind |
|------|----------|
| `gsap.fromTo(el, {opacity:0}, {opacity:1})` | `animate-fadeIn` (classe Tailwind) |
| `ScrollTrigger` | `animation-timeline: view()` en CSS natif |
| `gsap.registerPlugin(ScrollTrigger)` | Supprimer |

Ajouter dans `globals.css` :
```css
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fadeIn {
  animation: fadeIn 0.6s ease-out both;
  animation-timeline: view();
}
```

---

### 2.7 — Remplacement Leaflet → iframe OpenStreetMap

**Fichier à modifier** :
- `components/VillaLeafletMap.tsx`

**Remplacer par** :
```tsx
export function VillaMap({ lat, lng, name }: { lat: number; lng: number; name: string }) {
  return (
    <iframe
      src={`https://www.openstreetmap.org/export/embed.html?bbox=${lng-0.02},${lat-0.01},${lng+0.02},${lat+0.01}&layer=mapnik&marker=${lat},${lng}`}
      className="w-full h-[400px] rounded-xl border border-navy-800"
      title={name}
      loading="lazy"
    />
  );
}
```

**Supprimer** : `node_modules/leaflet`, `react-leaflet`, `leaflet.markercluster`, `@types/leaflet*`

---

### 2.8 — Composants à NE PAS toucher (design maison à préserver)

Ces composants sont le cœur de l'identité Kayvila. Hero UI ne les remplace pas :

- `DashboardShell` — layout admin/proprio avec sidebar
- `AdminPageIntro` — en-tête de page admin avec titre + description
- `ExpandableDescription` — description villa avec "Lire plus"
- `VillaAccordionInfo` — accordéon info villa
- `VillaBookingWrapper` + `BookingBottomSheet` — flux de réservation
- `EmptyDashboard` — état vide personnalisé
- `VillaHeaderActions` — actions header villa (wishlist, partage)
- `PriceDisplay` — affichage prix formaté Kayvila

---

## Phase 3 — Vérification

- [ ] `npm run build` passe sans erreur
- [ ] Page `/admin` : calendrier, dropdown, tabs fonctionnels
- [ ] Page `/dashboard` : drag & drop photos (ou alternative)
- [ ] Page `/villas/[id]` : carte affichée, pas de Leaflet
- [ ] Page `/prestations` : animations fluides, pas de GSAP
- [ ] Page `/espace-client` : pas de régression
- [ ] Responsive : mobile ne casse pas
- [ ] Couleurs gold/navy intactes sur tous les composants Hero UI
- [ ] `du -sh node_modules` avant/après comparé

---

## Checklist finale

- [ ] 17 packages désinstallés
- [ ] hero-ui-pro installé + configuré dans tailwind.config.ts
- [ ] FullCalendar → Hero UI Calendar (2 fichiers)
- [ ] dnd-kit → Hero UI Drag & Drop ou fallback natif (2 fichiers)
- [ ] Radix Dropdown → Hero UI Dropdown (1 fichier)
- [ ] Radix Tabs → Hero UI Tabs (1 fichier)
- [ ] GSAP → CSS animations (1 fichier)
- [ ] Leaflet → iframe OpenStreetMap (1 fichier)
- [ ] Composants maison préservés (8 fichiers)
- [ ] `npm run build` OK
- [ ] Design Kayvila intact
