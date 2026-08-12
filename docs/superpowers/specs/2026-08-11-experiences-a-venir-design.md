# Prestations « à venir » — bloc home + 4 pages expériences

**Date** : 2026-08-11
**Statut** : spec validée (Kenneson)

## Objectif

Annoncer sur la home, sous la section « Nos villas », quatre nouvelles prestations
destinées aux **voyageurs** (massage, chef cuisinier, excursions, garde d'enfants).
Chaque prestation est cliquable et mène à sa page dédiée, éditoriale et illustrée.

Statut business : **teaser**. Rien n'est réservable en ligne. Le CTA de chaque page
renvoie vers `/contact`. Aucun formulaire de collecte d'emails n'est créé.

## Contraintes de marque (rappel)

- Sobriété : pas d'urgence artificielle, pas de compte à rebours, pas de « places limitées ».
- Palette navy `#0a0a0a` / or `#d4af37` / offwhite `#fafafa`, Playfair Display en display.
- **Le terme « à domicile » est proscrit** dans toute la copie (fr/en/es). Remplacer par
  « à la villa », « chez vous », « sur place », « il/elle se déplace ».
- Tout le texte passe par `lib/i18n.ts` — zéro chaîne en dur dans les composants.

## Architecture

### Routes

Quatre pages statiques servies par une seule route dynamique, avec `generateStaticParams` :

```
/experiences/masseur
/experiences/chef-cuisinier
/experiences/excursions
/experiences/garde-enfants
```

Les slugs sont identiques dans les trois locales (même convention que
`/prestations/services/<slug>`).

> **Note legacy** : `app/experience/page.tsx` (singulier) est un simple `redirect("/prestations")`.
> Il n'est référencé ni dans la nav, ni dans le footer, ni dans le sitemap. On **n'y touche pas**
> dans ce chantier. La proximité `/experience` vs `/experiences/*` est assumée et documentée ici.

### Fichiers créés

| Fichier | Rôle |
| --- | --- |
| `data/experiences.ts` | `EXPERIENCE_SLUGS`, `ExperienceSlug`, `isExperienceSlug`, `EXPERIENCE_DETAILS`. Données **non textuelles** uniquement : chemins d'images, `imagePosition`, nom d'icône. Calqué sur `data/prestations-service-details.ts`. |
| `app/experiences/[slug]/page.tsx` | Page serveur (RSC). Layout éditorial 5 blocs. `generateStaticParams` + `generateMetadata`. `notFound()` si slug inconnu. |
| `app/experiences/layout.tsx` | Frame marketing, calqué sur `app/prestations/layout.tsx`. |
| `components/home/HomeUpcomingExperiences.tsx` | Bloc home, 4 cartes sur fond navy. |

### Fichiers modifiés

| Fichier | Modification |
| --- | --- |
| `app/page.tsx` | Insertion de `<HomeUpcomingExperiences />` entre ⑤ `HomeFeaturedAudience` et ⑥ `HomeTrustBand`, dans une `<section className="cv-auto">`. |
| `lib/i18n.ts` | Ajout du namespace `experiences.*` et des clés `home.upcoming_*`, en fr/en/es. |
| `app/sitemap.ts` | +4 URLs statiques, `priority: 0.6`, `changeFrequency: "monthly"`. |
| `components/layout/Footer.tsx` | Nouvelle colonne « Prestations à venir » avec les 4 liens. |

### Réutilisation

`LandingShell`, `LandingSection` (`components/marketing/landing-sections.tsx`),
`KayvilaPngIcon`, `ScrollReveal`, `tServer` / `getServerLocale`.
**Aucune** nouvelle dépendance npm, **aucune** table Supabase, **aucun** appel réseau :
le contenu est entièrement statique.

## Les quatre prestations

| Slug | Titre FR | Eyebrow FR | Icône (`KayvilaPngIcon`) | Angle éditorial |
| --- | --- | --- | --- | --- |
| `masseur` | Massage & bien-être | Bien-être | `sparkle` | Un praticien vient à la villa. Massage en terrasse, face à la mer, sans avoir à sortir. |
| `chef-cuisinier` | Chef cuisinier | Table privée | `chef` | Cuisine créole revisitée, menu sur mesure, service et remise en état de la cuisine inclus. |
| `excursions` | Excursions & découvertes | Martinique | `compass` | Sorties privatisées : bateau, Rocher du Diamant, distilleries, randonnées, avec des guides locaux sélectionnés. |
| `garde-enfants` | Garde d'enfants | Sérénité famille | `users` | Intervenantes de confiance qui se déplacent à la villa — une soirée en couple, une journée d'excursion entre adultes. |

## Layout des pages `/experiences/<slug>`

Cinq blocs, trois images par page.

1. **Hero** — image plein format (`min-height: min(68vh, 560px)`), overlay dégradé
   navy, breadcrumb `Accueil / Prestations à venir / <titre>`, **badge or « Bientôt disponible »**,
   `<h1>` (Playfair, `clamp(1.7rem, 4.5vw, 3.25rem)`) + tagline d'une phrase.
   Un seul `<h1>` par page.
2. **Intro** — fond offwhite. Texte à gauche / image à droite (`aspect-[4/3]`).
   90 à 110 mots : le besoin réel du voyageur, la réponse Kayvila, la promesse de
   sélection (praticiens sélectionnés et vérifiés).
3. **Ce qui est inclus** — fond blanc. Image à gauche / 4 items à droite
   (`check-circle` + titre court en capitales espacées + 1-2 phrases).
4. **Comment ça se passe** — fond offwhite, 3 étapes numérotées `01 / 02 / 03`,
   **sans image**. Exemple chef : *Vous nous dites l'occasion → On vous propose un menu
   et un chef → Il arrive, cuisine, sert, et laisse la cuisine impeccable.*
5. **Bandeau « À venir »** — fond navy. Texte honnête (« Cette prestation ouvre
   prochainement. Dites-nous votre intérêt, nous vous recontactons dès l'ouverture. »),
   CTA vers `/contact`, puis navigation horizontale vers les 3 autres expériences.

### Métadonnées

`generateMetadata` par slug : `title: "<titre> | Prestations à venir"`,
`description` = `experiences.<slug>.meta_description`,
`alternates.canonical = https://kayvila.com/experiences/<slug>`,
`openGraph.images` = image hero (1200×630).

## Bloc home — `HomeUpcomingExperiences`

- Section `id="prestations-a-venir"`, `scroll-mt-24`, **fond navy** (rupture visuelle
  après la section villas qui est blanche).
- En-tête centrée : eyebrow or `Bientôt chez Kayvila`, `<h2>` `Nos prestations à venir`,
  sous-titre d'une ligne.
- Grille `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px`, cartes `aspect-[4/5]`,
  image `next/image` + overlay bas dégradé, **badge or « Bientôt »** en haut à gauche,
  titre en Playfair et pitch d'une ligne en bas.
- Hover : `scale-[1.04]` sur l'image, `duration-700 ease-out`. `ScrollReveal` + `stagger-item`,
  comme la grille villas.
- Chaque carte est un `<Link>` vers sa page, avec `aria-label` explicite et
  `focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-inset`.
- Mobile : 1 colonne. Tablette : 2 colonnes. Desktop : 4 colonnes.

## Internationalisation

Namespace `experiences.<slug>.*`, calqué sur `services.*` :

```
title · eyebrow · tagline · meta_description · intro
item_1_title … item_4_title      item_1_desc … item_4_desc
step_1_title … step_3_title      step_1_desc … step_3_desc
image_alt · image_intro_alt · image_included_alt
```

Clés partagées :

```
experiences.badge_soon · experiences.breadcrumb_root · experiences.included_title
experiences.how_title · experiences.soon_band_text · experiences.soon_band_cta
experiences.other_experiences · experiences.meta_suffix
home.upcoming_eyebrow · home.upcoming_title · home.upcoming_subtitle
```

Volume : environ 28 clés par prestation + 11 partagées, soit ~123 clés × 3 locales.
Le français est rédigé en premier ; l'anglais et l'espagnol sont des traductions de
marque fidèles, pas des traductions littérales.

## Images

Douze images générées par Kenneson (GPT), déposées dans `public/experiences/` :

```
masseur-hero.webp         masseur-intro.webp         masseur-inclus.webp
chef-hero.webp            chef-intro.webp            chef-inclus.webp
excursions-hero.webp      excursions-intro.webp      excursions-inclus.webp
garde-enfants-hero.webp   garde-enfants-intro.webp   garde-enfants-inclus.webp
```

- **Hero** : 16:9 paysage. Sujet dans le tiers central (l'image est recadrée en `aspect-[4/5]`
  sur les cartes de la home et en `min(68vh,560px)` plein écran sur la page). Laisser de
  l'air en bas pour l'overlay et le titre.
- **Intro** et **Inclus** : 4:3.
- Le hero sert aussi de carte home et d'image OpenGraph.

### Direction artistique commune (préfixe de tous les prompts)

> Editorial travel photography, natural Caribbean daylight, soft desaturated palette of
> deep navy, warm gold accents and off-white, fine film grain, shallow depth of field,
> calm and understated luxury, no identifiable faces in close-up, no text or watermark
> in the image, no logos, photorealistic.

### Les 12 prompts

**Masseur — hero (16:9)**
> [DA] A massage table dressed in white linen on a wooden villa terrace overlooking the
> Caribbean sea, rolled towels and a small bowl of frangipani flowers, late afternoon
> golden light, tropical plants framing the edges, no people, subject centred with open
> sky and empty terrace floor in the lower third.

**Masseur — intro (4:3)**
> [DA] Close detail of a therapist's hands pouring warm massage oil into an open palm,
> soft focus background of a linen-covered table and green tropical foliage, warm
> diffused light, hands only, no face.

**Masseur — inclus (4:3)**
> [DA] Still life of spa essentials on a dark wooden surface: folded white towels, a small
> amber glass oil bottle, a candle, a sprig of tropical leaves, low contrast, quiet and
> minimal composition, top-down angle.

**Chef cuisinier — hero (16:9)**
> [DA] A private outdoor dining table on a villa terrace at dusk, set for six with white
> linen, brass cutlery and low candles, plated creole dishes, sea visible in the far
> background, warm ambient light, no people, table centred with empty terrace floor in
> the lower third.

**Chef cuisinier — intro (4:3)**
> [DA] A chef in a plain dark apron plating a refined creole dish in a villa kitchen,
> shot from chest height, hands and plate in focus, face out of frame, fresh local
> ingredients on the counter, natural window light.

**Chef cuisinier — inclus (4:3)**
> [DA] Overhead composition of fresh Martinique ingredients on a dark stone counter:
> red snapper, limes, christophine, mangoes, thyme, scotch bonnet peppers, a bottle of
> agricultural rum, natural daylight, editorial food styling.

**Excursions — hero (16:9)**
> [DA] The Rocher du Diamant seen from a small private boat on calm turquoise water,
> early morning light, dramatic sky, the rock centred on the horizon line with open
> water in the lower third, no people.

**Excursions — intro (4:3)**
> [DA] A wooden catamaran deck with coiled rope and a folded map, turquoise Caribbean
> water beyond the rail, bright natural daylight, low saturation, no people.

**Excursions — inclus (4:3)**
> [DA] A lush rainforest hiking trail in Martinique with volcanic stone steps, tall tree
> ferns, mist filtering through the canopy, deep greens, soft diffused light, no people.

**Garde d'enfants — hero (16:9)**
> [DA] A calm villa living space in soft late-afternoon light, low wooden table with
> picture books, wooden toys and a folded blanket on a linen sofa, open doors onto a
> garden, warm and reassuring atmosphere, no people, centred composition with clear
> floor space in the lower third.

**Garde d'enfants — intro (4:3)**
> [DA] An adult's hand and a small child's hand building together with wooden blocks on
> a rug, hands only, no faces, warm natural side light, shallow depth of field,
> reassuring and tender mood.

**Garde d'enfants — inclus (4:3)**
> [DA] Still life on a pale wooden floor: a woven basket of children's books, a soft
> plush toy, colouring pencils and a folded cotton blanket, natural daylight, calm and
> tidy composition, muted colours.

### Garde-fou de livraison

Les pages sont codées avec des **placeholders** pointant vers des images existantes du
site tant que les visuels définitifs ne sont pas fournis, afin que rien ne casse.
Le remplacement se fait ensuite par simple substitution des chemins dans `data/experiences.ts`.

## Hors périmètre

- Aucune réservation, aucun paiement, aucun tarif affiché.
- Aucun formulaire de collecte d'emails (le CTA pointe sur `/contact`).
- Aucune modification de la navigation principale (footer uniquement).
- Aucune modification de `app/experience/page.tsx` (redirect legacy).
- Aucune modification des cinq piliers propriétaires existants.

## Critères d'acceptation

1. La home affiche, entre « Nos villas » et la bande de confiance, une section navy avec
   quatre cartes cliquables portant chacune un badge or « Bientôt ».
2. Les quatre URLs `/experiences/<slug>` répondent en 200 et sont générées statiquement.
3. Chaque page comporte exactement un `<h1>`, un breadcrumb, cinq blocs, trois images.
4. Aucune chaîne de texte visible n'est codée en dur : tout passe par `lib/i18n.ts`,
   et le rendu est correct en fr, en et es.
5. Le terme « à domicile » n'apparaît nulle part dans la copie des trois locales.
6. Le sitemap contient les quatre nouvelles URLs.
7. Le footer contient la colonne « Prestations à venir » avec les quatre liens.
8. Responsive vérifié : 1 colonne sur mobile, 2 sur tablette, 4 sur desktop ; aucun
   débordement horizontal ; cibles tactiles ≥ 48 px.
9. `npm run lint` passe. Le dev server tourne sur le port 3001 (pas de `npm run build`).
