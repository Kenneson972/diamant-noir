# Kayvila — Correctifs UX & UI (Retours Richard 15 Juin 2026)

**Source** : Richard (fondateur Kayvila)
**Type** : Bugs UI + améliorations UX
**Branche cible** : `main`

---

## Résumé des items

| # | Item | Statut initial | Solution |
|---|------|---------------|----------|
| 1 | Hover header page d'accueil | 🟡 Trop subtil | Fond or 10% + border or + glow doré |
| 2 | Calendrier hero bug mobile | 🔴 Ne se rouvre plus après scroll | Remplacer par HeroUI `RangeCalendar` + `BottomSheet` |
| 3 | Messagerie proprio trop petite | 🔴 `h-[500px]` fixe | `min-h-[calc(100dvh-10rem)]` + full width |
| 4 | Upload photos "ajouter villa" | 🔴 URL uniquement | Ajouter `VillaImageManager` (déjà dans l'edit) |
| 5 | Photos miniatures tableau admin | ✅ Déjà implémenté | Aucun |
| 6 | Motif + origine dispo proprio | ✅ Déjà implémenté | Aucun |

---

## Item 1 — Hover Header (HeroAudienceCards)

### Fichier cible
`components/home/HeroAudienceCards.tsx`

### État actuel
Hover défini mais quasi invisible : bordure passe de `navy/10` à `navy/16` (6% d'opacité), fond passe de transparent à `white/[0.06]`. Cartes ont `active:scale-[0.98]` mais pas de `hover:scale`.

### Solution
Appliquer un hover plus affirmé sur les deux cartes :
```css
hover:bg-[rgba(212,175,55,0.10)]  /* fond or 10% */
hover:border-[#D4AF37]             /* border or solide */
hover:shadow-[0_0_0_1px_#D4AF37,0_8px_32px_rgba(212,175,55,0.15)]  /* ring + glow doré */
transition-all duration-300        /* transition fluide */
```

### Variantes de surface
- Surface `light` : fond `hover:bg-navy/5`, border `hover:border-navy/30`, glow adapté
- Surface `dark` : fond or 10% comme ci-dessus

---

## Item 2 — Calendrier Hero (Refonte HeroDatePicker → HeroUI RangeCalendar)

### Fichiers cibles
- `components/search/HeroDatePicker.tsx` → supprimer (334 lignes)
- `components/HeroSearchWidget.tsx` → remplacer l'intégration du date picker
- Nouveau composant : `components/search/HeroDateRangePicker.tsx` (~80 lignes)

### État actuel
Calendrier custom de 334 lignes avec :
- Positionnement fixe calculé via `getBoundingClientRect()` → bug de réouverture après scroll sur mobile
- Variable `isMobile` calculée une seule fois au mount (pas de resize)
- Scroll horizontal avec snap pour les 2 mois sur mobile

### Solution
Remplacer par le `RangeCalendar` de HeroUI v3 (déjà dans le projet via `@heroui/react`) :
- `visibleDuration={{ months: 2 }}` pour afficher 2 mois côte à côte
- `isDateUnavailable` pour bloquer les dates passées et les réservations existantes
- `minValue={today()}` pour empêcher la sélection dans le passé
- Sur mobile : wrapper dans un HeroUI `Popover` avec `placement="bottom"` (BottomSheet natif)
- Sur desktop : `Popover` standard avec le calendrier
- Gestion `onChange` avec `DateValue` → conversion en string ISO pour l'URL de recherche
- Thème : `surface="light"` (fond blanc, texte navy, accents or)

### Props du nouveau composant
```ts
type HeroDateRangePickerProps = {
  checkin: string;
  checkout: string;
  onChange: (checkin: string, checkout: string) => void;
  surface?: "light" | "dark";
};
```

### Dépendances
- `@heroui/react` (déjà installé) → `RangeCalendar`, `Popover`, `Button`
- `@internationalized/date` (déjà installé) → `parseDate`, `today`, `getLocalTimeZone`

---

## Item 3 — Messagerie Pleine Hauteur

### Fichier cible
`components/dashboard/proprio/OwnerMessaging.tsx`

### État actuel
- Conteneur : `h-[500px]` fixe → ne remplit pas l'écran
- Page wrapper (`app/(proprio)/dashboard/messages/page.tsx`) : `max-w-3xl` → trop étroit

### Solution
1. `OwnerMessaging.tsx` : remplacer `h-[500px]` par `min-h-[calc(100dvh-10rem)]`
2. `messages/page.tsx` : retirer `max-w-3xl` (ou passer à `max-w-5xl`)
3. Ajouter `flex-1` au conteneur pour qu'il prenne tout l'espace disponible dans le dashboard shell

---

## Item 4 — Upload Photos Création Villa

### Fichier cible
`components/dashboard/admin/AdminVillaForm.tsx`

### État actuel
Formulaire de création : champ `image_url` (URL texte) + `image_urls` (textarea URLs). Pas d'upload direct.

Le composant `VillaImageManager` existe déjà dans `components/dashboard/villa-editor/VillaImageManager.tsx` et est utilisé dans la page d'édition de villa (`AdminVillaEditClient.tsx`). Il utilise HeroUI Pro `DropZone` avec :
- Validation de fichiers (type, taille)
- Upload vers Supabase Storage
- Prévisualisation des images uploadées
- Suppression / réorganisation

### Solution
1. Ajouter `<VillaImageManager>` au `AdminVillaForm` (création), en plus ou en remplacement du textarea URLs
2. Conserver le champ URL en option (fallback)
3. Section : "Photos de la villa" avec DropZone + galerie de prévisualisation + champ URL optionnel en dessous
4. Le `VillaImageManager` gère l'upload → les URLs Supabase sont stockées dans `image_urls`

---

## Spécifications techniques

### Pas de régression
- Stripe, Resend, edge functions : **non touchés**
- Routes API existantes : **non touchées**
- Schéma DB : **non modifié**
- Auth / RLS : **inchangé**

### Tests
- Vérifier le hover sur desktop et mobile (pas de hover sur tactile)
- Tester le RangeCalendar : sélection de dates, navigation mois, fermeture/réouverture ×3 sur mobile
- Vérifier la messagerie sur desktop (1920px), tablette (768px), mobile (375px)
- Tester l'upload photos : drag & drop, sélection fichier, validation format/taille

### Build & TypeScript
- `npx tsc --noEmit` : 0 nouvelle erreur
- `npm run build` : succès

---

## Self-Review

- **Placeholders** : aucun
- **Incohérences** : aucune — les 4 items sont indépendants, pas de dépendances croisées
- **Scope** : 4 fichiers modifiés, 1 supprimé, 1 créé. Focalisé, pas de débordement
- **Ambiguïtés** : thème "blanc" = `surface="light"` explicité. BottomSheet = HeroUI `Popover` natif, pas de lib externe
