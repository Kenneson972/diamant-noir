# Fiche villa — Réorganisation façon Airbnb

**Date** : 2026-07-06
**Statut** : Validé

## Contexte

Référence analysée : fiche logement Airbnb (`airbnb.fr/rooms/953582107828849968`), via captures utilisateur (`~/Downloads/AIRB/`) et navigation live (Playwright MCP, y compris la modale "Afficher les 33 équipements").

Décision : on garde intégralement le style visuel Kayvila (navy/or `#d4af37`, coins carrés `rounded-none`, Playfair Display) — charte validée client, non remise en cause (voir `CLAUDE.md`). Seuls l'**ordre des sections** et l'**emplacement/présentation des équipements** changent, pour reprendre la structure Airbnb.

Deux points constatés déjà conformes, à ne pas toucher :
- `VillaGallery` : grille desktop "1 grande + 4 petites" déjà en place
- `VillaReviews` : sous-notes par catégorie (Propreté, Emplacement, Communication, Qualité-prix, Arrivée) déjà en place

## Nouvel ordre des sections

**Fichier principal** : `app/villas/[id]/page.tsx`

| # | Section | Origine | Changement |
|---|---------|---------|------------|
| 1 | Titre + specs + note | Existant (haut de page, hors grille 2 colonnes) | Inchangé |
| — | ~~Carte interactive (haut de page)~~ | `VillaDetailMiniMap` | **Supprimé** — doublon avec la carte de la section Alentours, déplacée plus bas |
| 2 | Galerie | `VillaGallery` | Inchangé |
| 3 | **Expérience Kayvila** (4 items) | Section existante, actuellement après Description | **Déplacée en premier** dans la colonne gauche — joue le rôle des 3 badges "points forts" Airbnb |
| 4 | Description | `ExpandableDescription` | Inchangé, passe en 2e position |
| 5 | Chambres ("Découvrez les chambres") | Section existante, actuellement après Avis | **Remontée** juste après la description |
| 6 | **Équipements** | Section existante, catégorisée à plat | **Refonte** : aperçu plat des ~10 items les plus parlants (grille 2 col, sans en-tête de catégorie) + bouton "Voir les X équipements" → modale avec le détail catégorisé actuel (Intérieur / Extérieur / Services inclus domicile / Services inclus collection / Services à la carte) |
| 7 | Calendrier de disponibilité | `ConnectedAvailabilityCalendar` | Inchangé dans son contenu, replacé dans l'ordre |
| 8 | Avis | `VillaReviews` | Inchangé |
| 9 | Alentours / Carte | Section existante (iframe Google Maps + environnement + points à proximité) | **Déplacée** ici (remplace l'ancienne carte du haut, supprimée) |
| 10 | Hôte | `VillaHostCard` | **Déplacée** ici, section unique (pas de doublon haut/bas) |
| 11 | **À savoir** | `VillaAccordionInfo` | **Refonte** : accordéon replié → 3 colonnes à plat, toujours visibles (annulation / règlement intérieur / sécurité), sans clic requis |
| 12 | Concierge Kayvila | Section existante | Conservée, repositionnée après "À savoir" (pas d'équivalent Airbnb) |
| 13 | CTA "Questions" | Section existante | Inchangé, fin de colonne gauche |

Colonne droite (booking sticky) : **inchangée**, déjà positionnée correctement (`ConnectedBookingForm` + bloc garantie Kayvila).

## Détail — Équipements (aperçu + modale)

**Fichiers** : `app/villas/[id]/page.tsx` (logique de fusion + composition), nouveau composant `components/villas/VillaAmenitiesPreview.tsx`

- Fusionner `equipment_interior` + `equipment_exterior` + `included_services_home` + `included_services_collection` + `a_la_carte_services` en une liste à plat, dédupliquée
- Aperçu : les 10 premiers items (priorité intérieur/extérieur, qui correspondent le mieux à la notion d'« équipement » côté visiteur), grille 2 colonnes, icône + label (réutilise `getEquipmentIcon` existant), sans titre de catégorie
- Bouton "Voir les {N} équipements" (N = total tous types confondus) ouvre une **modale plein écran custom** (pas de nouvelle dépendance UI — même pattern que le lightbox déjà utilisé dans `VillaGallery` : overlay `fixed inset-0`, fermeture Échap + bouton, focus management), qui affiche les catégories complètes actuelles (`EquipmentCategory` déjà existant, réutilisé tel quel à l'intérieur de la modale)
- Style : navy/or, coins carrés, cohérent avec le reste de la page

## Détail — "À savoir" (accordéon → plat)

**Fichier** : `components/villas/VillaAccordionInfo.tsx`

- Remplacer le mécanisme d'accordéon (repli/déploi) par un rendu 3 colonnes toujours visibles (`grid sm:grid-cols-3 gap-8`), chaque colonne avec icône + titre + texte, à partir des mêmes props (`checkInTime`, `checkOutTime`, `houseRules`, `cancellationPolicy`, `safetyInfo`)
- Le nom du composant peut être conservé (pas de renommage, pas de nouvelle abstraction) — seul le rendu interne change

## Règles communes

- **Style** : Tailwind existant (navy/or, `rounded-none`, `font-display`, `uppercase tracking-[...]`) — aucun changement esthétique
- **Icônes** : `KayvilaPngIcon` existant, pas de nouvelle librairie
- **Pas de nouvelle dépendance** (pas de Modal HeroUI — pattern overlay custom déjà utilisé dans `VillaGallery`)
- **TypeScript strict**, pas de `any` nouveau
- **Ne pas toucher** : `ConnectedBookingForm`/colonne sticky, `VillaGallery`, `VillaReviews` (contenu), calcul des disponibilités, calendrier
- **Ne pas modifier** : migrations Supabase, schéma de données villa (aucun nouveau champ nécessaire — tout se construit à partir des colonnes déjà sélectionnées dans la query `page.tsx`)
- **Tests** : `npm test` doit passer sans régression ; ne pas lancer `npm run build` (corrompt le cache dev, port 3001)
- **Commits** : en français, format `type(scope): message`

## Hors scope (explicitement exclu par choix utilisateur)

- Sous-nav sticky à ancres (Photos / Équipements / Avis / Emplacement)
- Histogramme de distribution des notes (5★→1★)
- Mention hôte compacte dupliquée en haut de page
- Tout changement de palette/typographie/rayon de bordure
