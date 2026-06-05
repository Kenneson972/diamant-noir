# LLM Design Review — Kayvila Homepage

> **Date :** 2026-05-09
> **Auditeur :** Directeur artistique senior (LLM Design Review)
> **Cible :** Page d'accueil Kayvila — Conciergerie de luxe Martinique
> **Stack :** Next.js 15 App Router + Tailwind CSS
> **Personnalité :** Minimaliste, luxe éditorial, chaleureux caribéen

---

## AI Slop Detection

### État : RAS — Pas de slop détecté.

Le design a été intentionnellement construit contre les patterns templates IA. Vérification anti-pattern par anti-pattern :

| Anti-pattern | Statut | Commentaire |
|---|---|---|
| Cartes identiques icône + heading + text | ✅ Absent | Les sections sont variées : hero split, carrousel, split image/texte, grille gap-px, bandeau stats, CTA centré |
| `border-left` coloré décoratif | ✅ Absent | Aucun border-left trouvé |
| Gradient text | ✅ Absent | Pas de `bg-gradient-to-r bg-clip-text` |
| Glassmorphism décoratif | ✅ Absent | La classe `.glass-card` existe dans globals.css (pour la recherche hero) mais le backdrop-filter — problématique Chrome Android — est correctement évité via `background: rgba(255,255,255,0.06)` |
| Badges "AI-powered" / "Nouveau" | ✅ Absent | Aucun badge trouvé |
| Métriques héros criardes | ✅ Absent | Les stats sont dans un TrustBand plus bas, sobre |
| Témoignages faux / icônes rondes partout | ✅ Absent | Aucun témoignage sur l'index |
| Emojis comme icônes structurelles | ✅ Absent | `lucide-react` utilisé partout |
| Hero vidéo autoplay sur mobile agressif | ⚠️ Présent | Vidéo WebM avec poster fallback — bien géré via `prefers-reduced-motion` et image statique par défaut |

**Verdict :** Le design évite remarquablement bien les pièges de l'UI générique. Les sections varient en format : carrousel, split, grille, bandeau, centré. C'est cohérent avec la direction éditoriale type magazine.

---

## Holistic Design Review

### Hiérarchie visuelle

L'œil parcourt la page dans l'ordre suivant :

1. **Hero** — Le wordmark KAYVILA en Sora, centré, grand, légèrement animé. C'est le point d'entrée naturel. La vidéo/poster en fond attire le regard périphérique.
2. **AudienceCards** — Deux cartes en grille directement sous le titre. C'est le premier point d'interaction.
3. **Piliers** — Le carrousel horizontal. Les indicateurs de position (dots) sont discrets mais clairs.
4. **Propriétaires** — Le split image/texte crée une respiration bienvenue après le carrousel dense.
5. **Villas** — La grille de 3 images pleine largeur avec gradient overlay. Les images dominent, le texte est minimal.
6. **TrustBand** — 4 stats en ligne. Passe rapidement.
7. **CTA final** — Appel à l'action large.

**Problème :** Le cerveau ne sait pas s'il doit cliquer sur le carrousel (scroll horizontal) ou scroller. Les indicateurs de position suggèrent l'interaction swipe/scroll, mais rien ne signale visuellement que c'est un carrousel (pas de flèches, pas de vignettes). Le texte "Faites défiler pour découvrir chaque pilier" dans le paragraphe est le seul indice — les utilisateurs ne lisent pas les paragraphes.

### Architecture de l'information

Ordre actuel : Hero → 5 Piliers → Propriétaires → Villas → TrustBand → CTA

**Analyse critique :**
- **Hero → AudienceCards** : Excellent. Le choix dès l'entrée oriente tout le parcours.
- **5 Piliers → Propriétaires** : Discutable. Le propriétaire arrive après les piliers, mais le carrousel parle déjà aux propriétaires (c'est leur offre). On a donc : "Voici ce qu'on fait (5 piliers)" puis "Et voici pour qui c'est fait". C'est correct mais la redondance est perceptible.
- **Propriétaires → Villas** : Transition étrange. On passe de "propriétaire, confiez-nous votre villa" à "voici des villas à louer". Le changement d'audience (B2B → B2C) est brutal sans signal. Un petit label ou espacement thématique aiderait.
- **Villas → TrustBand → CTA** : OK. La séquence confiance → action est standard et fonctionnelle.

**Recommandation :** Ajouter un micro-label de transition entre Propriétaires et Villas, ou intervertir Propriétaires et Villas pour une progression B2C → B2B plus naturelle (les voyageurs voient d'abord les villas, puis l'offre proprio).

### Résonance émotionnelle

**Ce qui fonctionne :**
- La palette offwhite + navy + or discret évoque le luxe sobre. Rien de criard.
- Les images grand format (piscine, villa aérienne) portent l'émotion seules — le texte ne sur-explique pas ce que l'image montre déjà.
- Le gradient overlay sur les cartes villas est élégant et ne cache pas l'image.

**Ce qui manque :**
- **La Martinique n'est pas assez présente.** À part le nom "Martinique" dans le titre et "Rocher du Diamant" dans la meta description, la page pourrait être n'importe quelle destination tropicale. Les images ne montrent pas de signes culturels forts (pas de cases créoles, pas de paysage typique du Diamant, pas de touches de couleur locale).
- **L'or est presque invisible.** Dans les specs, l'or est un "murmure". Sur la page réelle, il est quasi muet : seulement dans les numéros 01-05 des piliers (en `text-gold/50`), et dans le trait de `HomeOwnersSection` (`bg-gold/40`). Pour un site de luxe, c'est trop discret — on frôle le monochrome intégral. L'or devrait apparaître au moins 3-4 fois : séparateur, micro-accent sur un bouton, ou dans le TrustBand.
- **Pas de chaleur caribéenne.** Les neutres sont très froids (offwhite #FAFAFA, navy #0A0A0A). La palette mentionne cream, champagne, sand — mais je ne les vois pas appliqués de façon significative dans les composants. Le fond `bg-offwhite` est uniforme.

### Composition

- **Rythme** : Bon. Les sections alternent formats (plein large → split → grille → bandeau → centré). C'est éditorial.
- **Espace blanc** : Bon en général. Les paddings sont cohérents (py-14, py-20). Quelques sections sont un peu denses sur mobile (carrousel, TrustBand).
- **Grille villas** : `gap-px` avec séparateurs fins. C'est très Le Collectionist et très réussi — la pleine largeur sans marge fait respirer les images.

**Problème de composition majeur :** Le `min-h-[50dvh]` sur mobile + `max-3xl` sur le contenu crée un hero très haut mais peu dense. Sur mobile, le wordmark prend ~40% de la hauteur, les AudienceCards sont compressées en `min-h-[104px]` en bas, et il y a 40% d'espace vide entre les deux. Résultat : un scroll forcé pour voir ce qui compte vraiment (les cartes audience).

### Typographie

- **Sora** en display (headings) : Excellent choix. Géométrique, élégant, un cran au-dessus des standards.
- **Instrument Sans** en body : Propre, très lisible en 13-15px. La hiérarchie est claire.
- **Tailles** : Les `clamp()` sont bien pensées. Le passage de 10px uppercase (eyebrows) à 24-48px (headings) crée une hiérarchie nette.

**Problèmes :**
- Les eyebrows en `text-[9px] font-bold uppercase tracking-[0.4em]` sont **très petits**. Sur mobile, 9px avec un tracking de 0.4em peut être illisible pour un public de propriétaires (souvent 40+ ans). Minimum 10px recommandé.
- Body text à `13px` dans plusieurs sections. C'est en dessous du 16px recommandé. OK pour un design éditorial premium mais limite pour l'accessibilité.

### Couleur

La palette est globalement bien respectée, mais :

**Or :** Trop rare. Sur 7 sections, l'or apparaît exactement 2 fois :
1. Numéros 01-05 dans les piliers (`text-gold/50`)
2. Trait décoratif dans `HomeOwnersSection` (`bg-gold/40`)

C'est trop peu pour créer une signature visuelle. Le brief dit "l'or est un murmure" — un murmure qu'on entend quand même. Actuellement c'est un murmure inaudible.

**Recommandation or :**
- Micro-liseret doré en haut/bas du TrustBand (au lieu du `border-navy/[0.06]`)
- Icône de la villa dans les cartes (un petit trait or dans le gradient)
- `border-gold/10` au lieu de `border-navy/5` sur certains conteneurs

**Navy :** Bon usage. La transition vidéo → overlay navy → contenu blanc est bien gérée.

**Offwhite :** Correct mais uniforme. Des sections avec un fond légèrement différent (cream, champagne) ajouteraient de la profondeur.

### États

#### Loading
- Le hero a un poster statique avant la vidéo → bon
- Les images `next/image` avec `loading="lazy"` sur le contenu sous-fold → bon
- Le carrousel a des images avec `fill` qui apparaissent instantanément → bon

#### Empty (Villas)
L'état vide de `HomeFeaturedAudience` est géré, mais **mal** :

```tsx
{featuredVillas.length === 0 ? (
  <div className="border border-navy/10 bg-offwhite mx-8 mb-14 px-8 py-12 text-center">
    <p className="text-sm font-semibold text-navy">Aucune villa disponible pour le moment.</p>
    <p className="mt-2 text-xs text-navy/50">
      {featuredError ? `Statut: ${featuredError}` : "Ajoutez des villas dans Supabase pour les afficher ici."}
    </p>
    {process.env.NODE_ENV === "development" && (
      <p className="mt-3 text-[10px] uppercase tracking-widest text-navy/40">
        Supabase: {featuredCount} ligne(s) reçue(s)
      </p>
    )}
  </div>
) : (...)}
```

**Problèmes :**
1. **Le message de debug en dev est exposé.** "Supabase: 0 ligne(s) reçue(s)" est un détail technique, pas une information pour le client. C'est compréhensible en dev, mais à supprimer ou conditionner plus strictement.
2. **L'état vide n'est pas élégant.** Pour un site luxe, l'absence de villas ne devrait pas donner un cadre gris avec du texte — elle devrait soit :
   - Être masquée complètement (pas de section si aucune villa)
   - Afficher un message éditorial : "Nos villas seront bientôt en ligne. Inscrivez-vous pour être informé."
3. **Le `border-navy/10 bg-offwhite` est fade.** Un conteneur vide avec une simple bordure fait "template provisoire" pas "design intentionnel".

#### Error
- `fetchVillas()` a un `try/catch` avec `console.error` → OK
- L'erreur est affichée dans l'état vide → acceptable mais rustique

---

## Cognitive Load

### Point de décision #1 — Hero + AudienceCards

L'utilisateur arrive sur la page et voit :

1. Un wordmark (KAYVILA) — passif, lu en 0.5s
2. "Conciergerie privée" — sous-titre, 0.3s
3. **2 cartes :** "Gérer ma villa" / "Réserver un séjour"

**Analyse :** 2 options seulement, présentées comme des choix mutuellement exclusifs. C'est excellent. Un seul geste cognitif : "Qui suis-je : propriétaire ou voyageur ?"

**⚠️ Problème :** Le choix "Gérer ma villa" redirige vers `/prestations` (changement de page), tandis que "Réserver un séjour" reste sur place et ouvre un widget de recherche. Les deux comportements sont différents, et l'utilisateur ne le sait pas avant de cliquer. Si un propriétaire curieux clique "Gérer ma villa" et arrive sur une page de prestations détaillées, c'est OK. Mais si un voyageur clique "Réserver un séjour" et voit un calendrier, il doit cliquer "Retour au choix" pour revenir — c'est une friction.

**Recommandation :** Unifier le comportement. Faire que les deux choix mènent à des pages distinctes (audience routing), ou que les deux restent sur place (expand/collapse). Le mix actuel (lien externe vs inline toggle) crée de l'incertitude.

### Progressive disclosure

- Le carrousel des piliers : l'utilisateur voit d'abord la carte 01, puis swipe/scrolle pour les suivantes. Les indicateurs discrets suggèrent la profondeur. Bien.
- Le choix d'audience dans le hero est la forme la plus pure de progressive disclosure : "Choisissez d'abord qui vous êtes, ensuite on vous montre ce qui vous concerne."

**Pas de problème de surcharge cognitive.** La page est bien découpée.

---

## Heuristics Scoring (Nielsen)

| # | Heuristique | Score (0-4) | Notes |
|---|---|---|---|
| 1 | **Visibilité du statut système** | 3 | Les indicateurs de position du carrousel sont corrects mais discrets. Pas de loading state global. Le choix audience est persistant en sessionStorage (bon). |
| 2 | **Correspondance système/monde réel** | 4 | "Gérer ma villa" et "Réserver un séjour" sont deux langages métier immédiatement compris. Les termes "propriétaire" et "voyageur" sont naturels. |
| 3 | **Contrôle et liberté utilisateur** | 3 | Le bouton "Retour" après choix voyageur est bon. Mais un proprio qui clique "Gérer ma villa" est redirigé vers `/prestations` avec un changement de page — pas de retour facile. |
| 4 | **Cohérence et standards** | 4 | Navigation, boutons, spacing, couleurs — tout est cohérent. Les `btn-luxury` sont uniformes. Les eyebrowse sont partout les mêmes. |
| 5 | **Prévention d'erreurs** | 3 | Peu d'erreurs possibles sur une page statique. Le risque principal : cliquer "Gérer ma villa" quand on est voyageur (et inversement). Le wording des ARIA labels aide. |
| 6 | **Reconnaissance vs rappel** | 3 | Les icônes (Building2, Search, ArrowRight) sont standards. Les CTAs ont un wording clair ("Découvrir", "Confier"). Pas besoin de mémoriser. |
| 7 | **Flexibilité et efficacité** | 2 | Pas de raccourcis pour les utilisateurs experts. Le carrousel ne permet pas d'aller directement au pilier 4 en un clic (il faut scroller 4 fois). Les dots sont cliquables → OK, mais lents pour 5 items. |
| 8 | **Design esthétique et minimaliste** | 4 | Excellent équilibre. Rien de superflu. L'espace est utilisé généreusement. La qualité éditoriale est présente. |
| 9 | **Aide à la résolution d'erreurs** | 2 | Peu pertinent sur une page statique. L'état vide des villas montre un message mais pas d'action possible (pas de CTA "Prévenez-moi"). |
| 10 | **Aide et documentation** | 3 | Le site est suffisamment explicite. Pas besoin de documentation. |

**Score moyen : 3.1 / 4**

---

## Priority Issues

### [P0] L'état vide des villas crée un flash de contenu pour les premiers visiteurs

**What :** Quand `featuredVillas.length === 0`, un message "Aucune villa disponible pour le moment." s'affiche avec un message de debug en dev.

**Why it matters :** C'est la première impression d'un visiteur. Si aucune villa n'est encore seedée en Supabase, la page montrera une boîte vide dans une section qui s'intitule "Une sélection d'exception" — c'est contradictoire et décevant. Le message technique en dev ("Supabase: 0 ligne(s)") est inapproprié même en développement.

**Fix :** 
- Option A (recommandé) : Masquer toute la section si `featuredVillas.length === 0`
- Option B : Afficher un message éditorial élégant avec un CTA email "Je veux être informé"
- Supprimer le message de debug dev ou le conditionner à un flag plus strict

**Suggested command :** Dans `HomeFeaturedAudience.tsx`, remplacer l'état vide actuel par un message éditorial ou masquer la section.

### [P1] L'image de fallback `/villa-hero.jpg` n'existe probablement pas

**What :** `fetchVillas()` a ce fallback :
```ts
image: ... || "/villa-hero.jpg"
```

**Why it matters :** Si cette image n'existe pas dans `/public`, `next/image` throw en production. Même si elle existe, c'est un fallback générique — toutes les villas sans image propre montreront la même image, ce qui confond l'utilisateur.

**Fix :** 
- Vérifier que `/public/villa-hero.jpg` existe
- Ou mieux : ne pas afficher de carte si l'image est absente (ou utiliser un placeholder stylisé avec les initiales de la villa)

**Suggested command :** `ls public/villa-hero.jpg` pour vérifier l'existence. Sinon, ajouter un placeholder élégant.

### [P1] Pas de footer sur la page d'accueil

**What :** La page `HomePage` est un `<main>` avec 7 sections, terminant par `HomeBottomCta`. Il n'y a pas de footer.

**Why it matters :** L'utilisateur qui arrive en bas de page n'a pas accès à :
- Navigation secondaire (contact, CGU, mentions légales)
- Liens réseaux sociaux
- Copyright / crédits

Le CTA final a un lien "Connexion espace propriétaire" mais après ça, l'utilisateur est perdu.

**Fix :** Ajouter un footer standard avec navigation secondaire + copyright (le `SiteFrame` inclut peut-être déjà un footer — vérifier).

**Suggested command :** Vérifier si `SiteFrame` (dans `app/layout.tsx`) inclut un footer. Si non, en ajouter un.

### [P2] Boutons en `text-[10px]` trop petits pour la cible propriétaires

**What :** Tous les CTAs utilisent `text-[10px] font-bold uppercase tracking-[0.24em]`.

**Why it matters :** La cible propriétaire a souvent 40-60 ans. 10px est en dessous du seuil de confort pour une lecture sans zoom, surtout sur mobile. Les boutons sont des éléments critiques d'interaction.

**Fix :** Monter à `text-[11px]` ou `text-xs` min sur les CTAs, avec un touch-target toujours ≥44px (déjà OK avec les `min-h-[48px]`).

### [P2] Carrousel sans flèches de navigation visibles

**What :** `HomeServicesSection` a des dots indicateurs cliquables mais pas de flèches "Précédent / Suivant".

**Why it matters :** Les dots sont petits (`w-1.5`, `h-1.5`) et difficiles à viser sur mobile. Un utilisateur peut ne pas comprendre que c'est un carrousel scrollable sans flèches visibles. Les dots ressemblent à une pagination de slideshow, mais le comportement est un scroll horizontal snap.

**Fix :** Ajouter deux petits boutons flèches de part et d'autre du carrousel (ou au-dessus) qui appellent `scrollTo(i+1)` / `scrollTo(i-1)`. Optionnel : les rendre visibles au hover seulement sur desktop.

### [P2] Le titre des cartes AudienceCards est trop petit sur mobile

**What :** `text-[0.9375rem]` = 15px pour le titre des AudienceCards.

**Why it matters :** C'est le titre d'un CTA majeur (le premier point d'interaction). 15px pour un texte aussi important est trop petit. Sur desktop `sm:text-[1.2rem]` = 19.2px, c'est correct.

**Fix :** Monter à `text-base` (16px) minimum sur mobile pour les titres des AudienceCards.

---

## Persona Red Flags

### Sophie (Voyageuse luxe)

**Ce qu'elle cherche :** Une villa d'exception. Elle veut du rêve, des images grand format, un sentiment d'exclusivité.

**Ce qu'elle trouve :**
- Hero → poster vidéo d'une villa avec piscine → OK
- "Réserver un séjour" → widget de recherche avec dates et voyageurs → direct, efficace
- Section Villas ("Une sélection d'exception") → grille de 3 images → OK mais dépend du seeding
- TrustBand → "4.9 note moyenne" → rassurant

**Red flags :**
1. **Elle ne voit les villas qu'après avoir scrollé Propriétaires.** Une voyageuse doit potentiellement scroller 2 sections complètes avant de voir des villas. C'est trop long. Elle risque de quitter avant.
2. **Les images des villas sont en 4/5** — belles sur mobile mais sur desktop 3 colonnes, chaque carte fait ~300px de large. L'image doit être suffisamment détaillée.
3. **Pas de preuve sociale visible** — pas de notes, pas d'avis, pas de "visité cette semaine". La note 4.9 est dans le TrustBand bien après les villas.

### Marc (Propriétaire)

**Ce qu'il cherche :** Du sérieux, de la transparence, la preuve que Kayvila gère efficacement.

**Ce qu'il trouve :**
- "Gérer ma villa" → `/prestations` (page prestations)
- Section Propriétaires → "Votre villa, notre gestion" + 2 CTAs
- 5 piliers → Marketing, Opérations, Voyageurs, Ménage, Finance — détaille l'offre

**Red flags :**
1. **2 clics pour arriver à l'information** — d'abord "Gérer ma villa" sur le hero, puis `/prestations`. Chaque clic est une perte. Marc veut savoir : combien ça coûte, comment ça marche, quels résultats.
2. **"Commission 20% TTC"** est caché dans le carrousel (pilier Finance). Marc ne le verra pas sans scroller 5 fois. Cette information est critique et devrait être visible dès le premier regard.
3. **Pas de chiffre de revenus estimés.** "12 villas" dans le TrustBand, mais pas de "revenu moyen +30%" ou "taux d'occupation 85%". Les propriétaires veulent des résultats concrets.
4. **Pas de témoignage propriétaire** — Marc veut savoir si d'autres propriétaires comme lui ont été satisfaits.

### Jordan (First-timer B2B)

**Ce qu'il cherche :** Comprendre en 3 secondes : qu'est-ce que Kayvila fait, pour qui, pourquoi c'est mieux.

**Ce qu'il trouve :**
- KAYVILA — Conciergerie privée → clair
- 2 cartes : Gérer ma villa / Réserver un séjour → immédiatement compréhensible
- Scrolling : 5 piliers → la proposition de valeur est détaillée

**Verdict :** Jordan comprend en 3 secondes exactement ce que Kayvila fait. Le duo "propriétaire / voyageur" est très clair. **Aucun red flag pour Jordan.**

---

## Minor Observations

1. **Import `https` en ligne 1 de `page.tsx`** : `import https from "https"` — utilisé pour `rawFetch` — valide, mais étrange comme import racine. Un commentaire aiderait.

2. **`rawFetch` réinvente la roue Next.js** : La page utilise `https.get` manuel au lieu d'un `fetch` Next.js. Le commentaire dit "sans le fetch patched de Next.js". À documenter.

3. **`export const dynamic = "force-dynamic"`** : Correct pour une page avec données Supabase dynamiques. Mais cela désactive tout caching — les sections statiques (piliers, trust, CTA) sont aussi re-rendues à chaque requête.

4. **Le carrousel n'a pas de scrollbar** : `scrollbar-hide` + `scrollbarWidth: "none"`. Accessibilité : un utilisateur qui navigue au clavier ne peut pas scroller le carrousel avec Tab. Les dots sont cliquables via clavier (rôle tab), mais le scroll horizontal natif n'est pas accessible.

5. **Les gradients overlays sur les cartes villas** sont en `from-black/50 via-black/10 to-transparent` — bon équilibre entre lisibilité du texte et transparence de l'image.

6. **`HomeTrustBand` utilise `ScrollReveal`** mais `ScrollReveal` est un composant client avec `IntersectionObserver`. C'est 4 stats — l'overhead JS d'un observer est justifié pour la section entière, mais pas pour chaque stat. Actuellement, les 4 stats sont dans un seul `ScrollReveal` → correct.

7. **`content-visibility: auto` sur les sections** via la classe `cv-auto`. Bon pattern de perf. Mais `contain-intrinsic-size: 1px 1000px` est une estimation de 1000px pour toutes les sections — les sections plus courtes (TrustBand) auront un décalage de scroll potentiel.

---

## Questions to Consider

1. **Quelle est la stratégie mobile pour les AudienceCards en mode paysage ?** Sur un téléphone en paysage, `min-h-[50dvh]` devient ~200px — les cartes seront très compressées.

2. **Le sessionStorage pour le choix d'audience est-il volontairement par onglet ?** Si l'utilisateur ouvre un nouvel onglet, il doit re-choisir. C'est peut-être souhaitable (par session de navigation) mais à confirmer.

3. **Y a-t-il un plan pour des images OG générées dynamiquement ?** Pour le partage social, la page d'accueil aurait besoin d'une belle image OG avec le wordmark et une villa.

4. **Le carrousel des piliers — faut-il un autoplay ?** Pas recommandé pour du luxe, mais la question se pose : l'utilisateur passe-t-il assez de temps sur cette section pour voir les 5 cartes ?

5. **Y a-t-il des analytics sur la quelle AudienceCard est cliquée ?** C'est la donnée la plus importante pour optimiser le hero — savoir si le trafic est majoritairement propriétaire ou voyageur.

---

## Résumé

| Catégorie | Score |
|---|---|
| AI Slop Detection | ✅ Excellent (aucun slop) |
| Hiérarchie visuelle | 7/10 |
| Architecture de l'information | 7/10 |
| Résonance émotionnelle | 6/10 (manque de chaleur caribéenne) |
| Typographie | 8/10 |
| Couleur | 6/10 (or trop rare) |
| États (loading/empty/error) | 5/10 (état vide à corriger) |
| Cognitive Load | 9/10 |
| Heuristics (moyenne) | 3.1/4 |
| **Global** | **7/10** — Bonne base, détails à affiner |

**Top 3 urgences :**
1. [P0] Rendre l'état vide des villas élégant ou invisible
2. [P1] Vérifier l'existence de `/villa-hero.jpg`
3. [P2] Ajouter des flèches de navigation au carrousel
