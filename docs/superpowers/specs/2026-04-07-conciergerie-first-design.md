# Spec — Repositionnement Conciergerie en priorité (Home + Navbar)

**Date :** 2026-04-07
**Contexte :** Le gérant souhaite que Diamant Noir soit perçu comme une maison de conciergerie privée qui propose des villas, et non comme une plateforme de location qui offre de la conciergerie. Direction artistique inchangée.

---

## Objectif

Remonter la conciergerie propriétaire comme proposition principale sur la home page et dans la navbar, sans modifier la direction artistique (couleurs, typographie, composants existants).

---

## Contraintes

- Ne pas toucher à la direction artistique (gold/navy/offwhite, Playfair Display, grilles existantes)
- Ne pas supprimer les villas de la home — les descendre en bas, ne plus les mettre en avant
- Ne pas créer de nouvelles pages
- Conserver les deux audiences (voyageur + propriétaire) mais inverser leur hiérarchie visuelle

---

## Changements par fichier

### 1. `components/layout/Navbar.tsx`

**CTA principal :**
- `primaryCtaHref` : `/villas` → `/prestations`
- `primaryCtaLabel` / `primaryCtaAria` : `"Réserver"` → `"Conciergerie"`
- Icône mobile (`CalendarDays`) → `Sparkles` (lucide-react, déjà utilisée dans `/prestations`)

---

### 2. `components/home/HeroAudienceCards.tsx`

**Inversion des cartes (propriétaire à gauche = 1ère visuellement) :**

Carte gauche (anciennement voyageur) devient **Conciergerie Privée** :
- Eyebrow : `"Conciergerie Privée"` (gold/75, remplace "Espace Voyageur")
- Titre : `"Gérer ma villa avec Diamant Noir"`
- Icône : `Building2` avec `text-gold/55`
- Border/hover : gold (cohérent avec la priorité)
- Clic : `router.push('/prestations')` (plus de scroll `#offre-proprietaire`)

Carte droite (anciennement propriétaire) devient **Espace Voyageur** :
- Eyebrow : `"Espace Voyageur"` (white/45, discret)
- Titre : `"Réserver un séjour"`
- Icône : `Search` avec `text-white/30`
- Border/hover : white (discret, secondaire)
- Clic : révèle `HeroSearchWidget` (comportement actuel conservé)

Logique `selection` à adapter :
- `chooseVoyageur` → garde son comportement (révèle la barre de recherche)
- `chooseProprio` → `router.push('/prestations')` (supprime le scroll)

---

### 3. `components/home/HomeTrustBand.tsx`

Réordonner les 4 signaux :
1. **Conciergerie 24/7** (en premier)
2. Équipe locale 7j/7
3. 4,9 / 5
4. 100+ séjours

---

### 4. Nouveau composant — `components/home/HomeConciergeHighlight.tsx`

Nouveau server component. S'insère entre `HomeTrustBand` et `HomeLifestyleAudience` dans `app/page.tsx`.

**Contenu :**
- Eyebrow : `"Nos services"` (navy/45, tracking large)
- Titre : `"La conciergerie autrement"` (Playfair, font-normal)
- Sous-titre court (2 lignes max, ton editorial actuel) : reprend l'intro de `/prestations`
- Grille 2×3 ou 3×2 des 6 services (icônes lucide-react + label court, identiques à `SERVICES_HIGHLIGHT` dans `/prestations`) :
  - `Car` — Transferts & accueil
  - `UtensilsCrossed` — Chef & art de la table
  - `Anchor` — Nautisme & escapades
  - `ShoppingBag` — Courses & bienvenue
  - `Sparkles` — Entretien & linge
  - `Calendar` — Pilotage des séjours
- CTA : `"Découvrir la conciergerie complète"` → `/prestations` (style `btn-luxury` ou lien underline selon hiérarchie)
- Fond : `bg-white` pour contraster avec le `HomeTrustBand` (border-y)

Les icônes et données ne sont pas dupliquées : le composant importe `SERVICES_HIGHLIGHT` depuis `/prestations` ou les constantes sont déplacées dans `lib/conciergerie-data.ts` si réutilisation.

---

### 5. `components/home/HomeLifestyleAudience.tsx`

Changer le CTA final :
- Texte : `"Parcourir les villas"` → `"Découvrir nos services"`
- Href : `/villas` → `/prestations`

---

### 6. `app/page.tsx` — Réordonner les sections

Nouvelle structure :

```
Hero
HomeTrustBand
HomeConciergeHighlight   ← NOUVEAU (entre TrustBand et Lifestyle)
HomeLifestyleAudience
HomeOwnersSection        ← remonte avant les villas
HomeFeaturedAudience     ← descend en bas
HomeBottomCta
```

---

### 7. `components/home/HomeBottomCta.tsx`

Inverser la hiérarchie des deux CTAs :

| Avant | Après |
|-------|-------|
| `btn-luxury bg-black` → "Réserver votre villa" (`/villas`) | `btn-luxury bg-black` → "Découvrir la conciergerie" (`/prestations`) |
| Secondaire border → "Confier ma villa" | Secondaire border → "Parcourir les villas" (`/villas`) |

Texte intro :
- Avant : "Rejoignez le cercle Diamant Noir — séjournez dans nos villas d'exception ou confiez-nous votre bien..."
- Après : "Diamant Noir orchestre des séjours d'exception et accompagne les propriétaires exigeants de Martinique."

---

## Fichier à créer éventuellement

`lib/conciergerie-data.ts` — si `SERVICES_HIGHLIGHT` doit être partagé entre `/prestations` et `HomeConciergeHighlight`. Sinon, les données sont déclarées directement dans `HomeConciergeHighlight`.

---

## Ce qui ne change PAS

- `app/prestations/page.tsx` — aucune modification
- `components/home/HomeFeaturedAudience.tsx` — structure conservée, juste déplacée dans la page
- `components/home/HomeOwnersSection.tsx` — structure conservée, juste déplacée dans la page
- Dashboard admin, espace client, chatbot, booking form — aucune modification
- Direction artistique : couleurs, typo, grilles, animations

---

## Tests à vérifier après implémentation

- [ ] Carte "Conciergerie Privée" (gauche hero) redirige vers `/prestations`
- [ ] Carte "Réserver un séjour" (droite hero) révèle la barre de recherche
- [ ] Navbar CTA "Conciergerie" pointe vers `/prestations` et est actif sur cette route
- [ ] `HomeConciergeHighlight` s'affiche entre TrustBand et Lifestyle
- [ ] `HomeOwnersSection` apparaît avant `HomeFeaturedAudience`
- [ ] CTA noir du HomeBottomCta pointe vers `/prestations`
- [ ] Build `npm run build` sans erreur TypeScript
