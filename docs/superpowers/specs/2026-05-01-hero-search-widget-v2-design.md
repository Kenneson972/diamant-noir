# HeroSearchWidget v2 — Datepicker + GuestPicker + Flow booking

> **Date** : 2026-05-01  
> **Projet** : Kayvila — Diamant Noir  
> **Statut** : Validé — en attente de plan d'implémentation  

---

## 1. Objectif

Remplacer l'actuel `HeroSearchWidget` (3 champs natifs `<input type="date">` + `<select>`) par une barre de recherche premium avec :

- **Datepicker calendrier visuel** (2 mois côte à côte, sélection cliquable)
- **GuestPicker stepper** (dropdown +/- avec bouton Confirmer)
- **Design plus riche** : icônes, séparateurs, affichage du nombre de nuits
- **Flow** : redirige vers `/villas?checkin=...&checkout=...&guests=...` avec dates optionnelles

---

## 2. Design visuel

### Barre de recherche (hero — thème dark)

```
┌─────────────────┬─────────────────┬─────────────────┬──────────────┐
│  📅 Arrivée     │  📅 Départ      │  👥 Voyageurs   │  ⌕ Rechercher│
│  15 mai 2026    │  20 mai 2026    │  2 voyageurs    │              │
│                 │  4 nuits        │                 │              │
└─────────────────┴─────────────────┴─────────────────┴──────────────┘
```

- Fond : `glass-card` (actuel : `white/[0.06]`, bordure `white/18`)
- Labels : `text-[10px] font-bold uppercase tracking-[0.2em] text-white/70`
- Valeurs : `text-sm text-white`
- Séparateurs verticaux : fines lignes `bg-white/20` entre les champs
- Bouton Rechercher : fond blanc, texte noir, icône Search, `rounded-full`

### État initial (aucune date)

- Arrivée : « Choisir » en `text-white/45` italique ou grisé
- Départ : « Choisir » en `text-white/45`
- Voyageurs : « 2 voyageurs »

### États sélectionnés

- Arrivée renseignée : affichage formaté « 15 mai 2026 »
- Départ renseigné : affichage formaté « 20 mai 2026 » + en dessous « 4 nuits » en `text-white/50 text-[10px]`

---

## 3. Datepicker calendrier — Spécifications

### Comportement

Fichier : `components/search/HeroDatePicker.tsx`

- **Trigger** : bouton « Arrivée » ou « Départ »
- **Ouverture** : overlay positionné juste en dessous du champ cliqué
- **Desktop (> 640px)** : 2 mois côte à côte dans le dropdown
- **Mobile (< 640px)** : 1 mois, scrollable
- **Navigation** : flèches gauche/droite pour changer de mois
- **Aujourd'hui** : cercle subtil ou texte souligné
- **Jours passés** : désactivés (opacity 40%, cursor-not-allowed)
- **Jours entre checkin et checkout** : highlight fond doux (bg-white/10)
- **Jour d'arrivée** : fond blanc, texte noir
- **Jour de départ** : fond blanc, texte noir
- **Fermeture** : au clic sur un jour de départ OU au clic en dehors

### Logique de sélection

```
État initial           → clic jour J → checkin = J, en attente checkout
checkin posé           → clic jour J' > J → checkout = J', fermeture
checkin posé           → clic jour J' < J → checkin = J', reset checkout
checkin + checkout     → clic jour J'' > checkout → checkin + checkout recalés
checkin + checkout     → clic jour J'' < checkin → checkin = J'', reset checkout
```

### Calcul des nuits

```typescript
const nightCount = checkin && checkout
  ? Math.round((new Date(checkout).getTime() - new Date(checkin).getTime()) / 86400000)
  : null;
```

Affiché sous la date de départ quand les deux dates sont renseignées.

### Format d'affichage

```typescript
// Exemple : "15 mai 2026"
new Date(date + "T00:00:00").toLocaleDateString("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
});
```

---

## 4. GuestPicker — Spécifications

Fichier : composant dans `HeroSearchWidget.tsx` (ou `components/search/HeroGuestPicker.tsx`)

Reprend le pattern exact de `BookingSearchBar` :

- **Trigger** : bouton « Voyageurs », affiche « X voyageur(s) »
- **Ouverture** : dropdown positionné sous le champ
- **Stepper** : boutons `-` / `+` avec valeur centrale
- **Min** : 1, **Max** : 12
- **Bouton Confirmer** : ferme le dropdown
- **Fermeture** : au clic en dehors ou sur Confirmer

---

## 5. Flow complet

### Sans dates renseignées

```
Utilisateur → [Rechercher] → /villas?guests=2
```

### Avec dates renseignées

```
Utilisateur → sélectionne checkin + checkout + voyageurs → [Rechercher]
→ /villas?checkin=2026-05-15&checkout=2026-05-20&guests=2
```

### Page villas

La page `/villas` reçoit les paramètres et :
- Si `checkin` et `checkout` : affiche les villas disponibles / filtre par disponibilité
- Si `guests` : filtre par capacité
- Si aucun paramètre : affiche toutes les villas

---

## 6. Structure des fichiers

| Fichier | Rôle |
|---|---|
| `components/search/HeroDatePicker.tsx` | Composant datepicker calendar pur React |
| `components/search/HeroGuestPicker.tsx` | Composant stepper voyageurs (wrapper pattern existant) |
| `components/HeroSearchWidget.tsx` | **Réécrit** — utilise les deux sous-composants |

---

## 7. Dépendances

- **Zéro dépendance externe** : pas de `react-day-picker`, `date-fns`, etc.
- Logique de date en pur JavaScript (Date native, `toLocaleDateString`)
- Positions des overlays : `position: fixed` + `getBoundingClientRect()` (comme `BookingSearchBar`)

---

## 8. Responsive

### Mobile (< 640px)

- Layout en colonne (stack vertical des 3 champs)
- Calendrier sur 1 mois
- GuestPicker : même dropdown, pleine largeur
- Bouton Rechercher : pleine largeur en bas

### Desktop (>= 640px)

- Layout en ligne (3 champs côte à côte)
- Calendrier 2 mois
- Séparateurs verticaux

---

## 9. Accessibilité

- `aria-label` sur chaque bouton trigger
- Calendrier navigable au clavier (flèches pour les mois)
- GuestPicker : `aria-expanded`, `aria-haspopup`
- Focus trap dans les overlays
- `prefers-reduced-motion` : animations désactivées

---

## 10. Limites et cas d'angle

- **Date dans le passé** : désactivée, pas cliquable
- **Checkout < checkin** : impossible (checkout se reset si clic jour < checkin)
- **GuestPicker sans sélection** : valeur par défaut = 2
- **Recherche sans dates** : redirige vers `/villas` sans paramètres checkin/checkout
