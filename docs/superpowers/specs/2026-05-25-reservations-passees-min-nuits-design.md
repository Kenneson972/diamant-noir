# Spécification : Réservations Passées + Minimum de Nuits

**Date :** 2026-05-25
**Statut :** Validée

---

## 1. Résumé

Deux améliorations pour le gérant :
1. **Filtre « Passées »** dans les réservations admin + drawer d'historique par villa
2. **Minimum de nuits** par villa, blocable au checkout

---

## 2. Base de données

### 2.1 Migration

```sql
ALTER TABLE villas ADD COLUMN IF NOT EXISTS min_nights INTEGER NOT NULL DEFAULT 1;
```

### 2.2 Filtre « Passées »

Pas de nouveau statut. Une réservation « passée » est définie par :
- `status = "confirmed"`
- `end_date < today` (date du jour côté client)

---

## 3. Réservations — Bouton « Passées »

### Fichier : `app/(admin)/admin/reservations/page.tsx`

**Modifications :**
- Ajouter `"past"` aux filtres : `["all", "pending", "confirmed", "cancelled", "past"]`
- Nouveau label : `past: "Passées"` via `BOOKING_STATUS_LABELS` (ou en dur si préféré)
- Logique de filtre `past` : `.eq("status", "confirmed").lt("end_date", todayISO)`
- Accepter un paramètre optionnel `?villa=VillaID` dans l'URL pour pré-filtrer par villa (utilisé par le lien depuis la liste des villas)
- `todayISO` = `new Date().toISOString().split("T")[0]`

**Rendu des filtres :**
```
[Tous] [En attente] [Confirmée] [Annulée] [Passées]
```

**Actions dans la table quand filtre « Passées » :** masquer les boutons Confirmer/Annuler (ces réservations sont déjà passées).

---

## 4. Villas — Drawer d'historique

### 4.1 Colonne « Résa » cliquable

**Fichier :** `app/(admin)/admin/villas/page.tsx`

- La colonne « Résa » devient un bouton (`<button>`) qui ouvre `VillaPastBookingsDrawer`
- État : `{ openDrawerVillaId, openDrawerVillaName }` pour tracker le drawer ouvert
- La page passe de server component → client + server (on garde le fetch server, puis on ajoute un wrapper client pour gérer le drawer)

### 4.2 Composant VillaPastBookingsDrawer

**Nouveau fichier :** `components/dashboard/VillaPastBookingsDrawer.tsx`

```ts
interface Props {
  villaId: string
  villaName: string
  open: boolean
  onClose: () => void
}
```

- `"use client"`
- À l'ouverture : fetch Supabase `bookings` où `villa_id = villaId AND status = "confirmed" AND end_date < today`
- Affiche une table compacte : Client, Dates, Nuits, Montant, Source
- Bouton ✕ en haut à droite, clic extérieur ferme le drawer
- État vide : « Aucune réservation passée pour cette villa. »
- Chargement : spinner ou squelette
- Style : drawer venant de la droite, fond blanc, largeur ~480px, ombre portée. Cohérent avec le design system Gold/Navy existant.

---

## 5. Minimum de nuits par villa

### 5.1 Édition admin

**Fichier :** `components/dashboard/proprio/VillaEditorForm.tsx` (ou `VillaFormFields.tsx`)

- Nouveau champ : input `number`, min=1, max=30, label « Nuits minimum »
- Position : dans la section informations générales, sous ou à côté du prix par nuit
- Sauvegardé avec le handleSave existant → payload envoyé à l'API

**Fichier :** `app/api/dashboard/update-villa/route.ts` (vérifier qu'il accepte `min_nights` dans le payload — le route reçoit déjà `payload` libre, donc OK)

### 5.2 Blocage checkout

**Fichier :** `components/booking/BookingForm.tsx` (ou `CheckoutView.tsx`)

- Les données villa contiennent déjà `min_nights` (récupérées avec le fetch villa)
- Avant de permettre la réservation : calculer la durée du séjour, si `< villa.min_nights` → afficher un message d'erreur
- Message : « Cette villa nécessite un séjour minimum de X nuits. »

**Fichier :** `components/booking/BookingSearchBar.tsx`
- Optionnel : afficher le min_nights dans la carte villa ou dans la barre de recherche (pas requis par la spec)

### 5.3 Affichage côté client (villa page)

Pas de modification nécessaire. Le `min_nights` est déjà dans les données villa chargées côté client.

---

## 6. Fichiers modifiés

| Fichier | Changement |
|---------|------------|
| `supabase/migration-min-nights.sql` | Nouveau : `ALTER TABLE villas ADD COLUMN min_nights` |
| `app/(admin)/admin/reservations/page.tsx` | Ajout filtre "past" + param villa |
| `app/(admin)/admin/villas/page.tsx` | Colonne Résa cliquable → drawer |
| `components/dashboard/VillaPastBookingsDrawer.tsx` | Nouveau composant drawer |
| `components/dashboard/proprio/VillaEditorForm.tsx` | Champ min_nights |
| `components/booking/BookingForm.tsx` | Blocage si séjour < min_nights |
| `lib/constants.ts` | Ajout label `past: "Passées"` dans BOOKING_STATUS_LABELS |

---

## 7. Non inclus (hors scope)

- Export CSV depuis le drawer
- Filtre « Passées » dans le VillaBookingsRegistry (page édition villa) — déjà couvert par le drawer
- Affichage du min_nights sur la fiche villa publique
