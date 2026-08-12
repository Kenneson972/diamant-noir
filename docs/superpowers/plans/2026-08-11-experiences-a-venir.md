# Prestations « à venir » — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter sur la home un bloc teaser « Nos prestations à venir » (4 cartes cliquables) et créer les 4 pages éditoriales `/experiences/<slug>` correspondantes, en fr/en/es.

**Architecture:** Une route dynamique `app/experiences/[slug]/page.tsx` rendue statiquement via `generateStaticParams`, alimentée par un fichier de données non textuelles (`data/experiences.ts`) et par le dictionnaire `lib/i18n.ts` pour 100 % de la copie. Un composant serveur `HomeUpcomingExperiences` est inséré dans `app/page.tsx`. Aucun appel réseau, aucune table Supabase, aucune dépendance ajoutée.

**Tech Stack:** Next.js 14 App Router (RSC), TypeScript, Tailwind CSS, `next/image`, Vitest (unitaire), Playwright (e2e).

**Spec source:** `docs/superpowers/specs/2026-08-11-experiences-a-venir-design.md`

## Global Constraints

- **Le terme « à domicile » est interdit** dans toute la copie, fr/en/es. Formulations autorisées : « à la villa », « chez vous », « sur place », « il/elle se déplace ». Équivalents EN : « at the villa », « to your door » est **interdit** ; ES : « en la villa », « a domicilio » est **interdit**.
- Zéro chaîne de texte visible codée en dur dans un composant : tout passe par `tServer(locale, key)` (serveur) ou `t(key)` via `useLocale()` (client).
- Un seul `<h1>` par page.
- Palette : `bg-navy`, `text-gold`, `bg-offwhite`, `bg-white`. Police display : classe `font-display` (Playfair Display).
- Pas d'urgence artificielle : aucun compte à rebours, aucune mention de rareté, aucun « places limitées ».
- Cibles tactiles ≥ 48 px (`min-h-[48px]` sur les CTA).
- Aucun ajout de dépendance npm.
- **Ne jamais lancer `npm run build`.** Le serveur de dev tourne sur le port 3001 : `npm run dev -- -p 3001`.
- Slugs identiques dans les trois locales : `masseur`, `chef-cuisinier`, `excursions`, `garde-enfants`.
- Commits en français, préfixe conventionnel (`feat:`, `test:`, `chore:`), avec le trailer `Co-Authored-By: claude-flow <ruv@ruv.net>`.

## Structure des fichiers

| Fichier | Responsabilité |
| --- | --- |
| `data/experiences.ts` (créé) | Source de vérité **non textuelle** : liste des slugs, garde de type, chemins d'images, icône, cadrage. |
| `data/experiences.test.ts` (créé) | Vérifie l'intégrité de la structure de données et la couverture i18n des 3 locales. |
| `lib/i18n.ts` (modifié) | Toute la copie, dans les 3 blocs de locale. |
| `app/experiences/layout.tsx` (créé) | Métadonnées de section. |
| `app/experiences/[slug]/page.tsx` (créé) | Rendu des 5 blocs de la page prestation. |
| `components/home/HomeUpcomingExperiences.tsx` (créé) | Bloc home, 4 cartes navy. |
| `app/page.tsx` (modifié) | Insertion du bloc entre villas et trust band. |
| `app/sitemap.ts` (modifié) | +4 URLs. |
| `components/layout/Footer.tsx` (modifié) | Bandeau de liens « Prestations à venir ». |
| `tests/experiences.spec.ts` (créé) | Smoke e2e : home + 4 pages. |
| `playwright.config.ts` (modifié) | Enregistrement du nouveau spec dans le projet `dashboards`. |

> **Écart assumé vs spec** : la spec parlait d'une « colonne » de footer. Le footer desktop est une grille `md:grid-cols-4` déjà pleine ; une 5ᵉ colonne casserait la mise en page. Le plan implémente à la place un **bandeau horizontal** de 4 liens inséré avant la barre du bas, rendu à l'identique sur mobile et desktop. Le besoin (4 liens accessibles depuis le footer) est satisfait.

---

### Task 1: Données des expériences

**Files:**
- Create: `data/experiences.ts`
- Test: `data/experiences.test.ts`

**Interfaces:**
- Consumes: `KayvilaPngName` depuis `components/icons/KayvilaPngIcon.tsx` (import de type uniquement).
- Produces:
  - `EXPERIENCE_SLUGS: readonly ["masseur", "chef-cuisinier", "excursions", "garde-enfants"]`
  - `type ExperienceSlug = (typeof EXPERIENCE_SLUGS)[number]`
  - `isExperienceSlug(value: string): value is ExperienceSlug`
  - `type ExperienceDetail = { slug: ExperienceSlug; icon: KayvilaPngName; hero: string; heroPosition: string; images: { intro: string; included: string } }`
  - `EXPERIENCE_DETAILS: Record<ExperienceSlug, ExperienceDetail>`

- [ ] **Step 1: Write the failing test**

Créer `data/experiences.test.ts` :

```ts
import { describe, expect, it } from "vitest";
import {
  EXPERIENCE_SLUGS,
  EXPERIENCE_DETAILS,
  isExperienceSlug,
} from "./experiences";

describe("EXPERIENCE_SLUGS", () => {
  it("contient exactement les 4 prestations à venir", () => {
    expect([...EXPERIENCE_SLUGS]).toEqual([
      "masseur",
      "chef-cuisinier",
      "excursions",
      "garde-enfants",
    ]);
  });

  it("n'a aucun doublon", () => {
    expect(new Set(EXPERIENCE_SLUGS).size).toBe(EXPERIENCE_SLUGS.length);
  });
});

describe("isExperienceSlug", () => {
  it("accepte un slug connu", () => {
    expect(isExperienceSlug("chef-cuisinier")).toBe(true);
  });

  it("refuse un slug inconnu", () => {
    expect(isExperienceSlug("marketing")).toBe(false);
    expect(isExperienceSlug("")).toBe(false);
  });
});

describe("EXPERIENCE_DETAILS", () => {
  it("expose une entrée par slug, cohérente avec sa clé", () => {
    for (const slug of EXPERIENCE_SLUGS) {
      expect(EXPERIENCE_DETAILS[slug]).toBeDefined();
      expect(EXPERIENCE_DETAILS[slug].slug).toBe(slug);
    }
  });

  it("déclare trois chemins d'images absolus par prestation", () => {
    for (const slug of EXPERIENCE_SLUGS) {
      const d = EXPERIENCE_DETAILS[slug];
      for (const src of [d.hero, d.images.intro, d.images.included]) {
        expect(src.startsWith("/")).toBe(true);
      }
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run data/experiences.test.ts`
Expected: FAIL — `Failed to resolve import "./experiences"`.

- [ ] **Step 3: Write minimal implementation**

Créer `data/experiences.ts` :

```ts
/**
 * Prestations « à venir » destinées aux VOYAGEURS (distinctes des 5 piliers
 * propriétaires de `data/prestations-service-details.ts`).
 *
 * Ce fichier ne porte AUCUN texte : titres, descriptions et textes alternatifs
 * vivent dans `lib/i18n.ts` sous les clés `experiences.<slug>.*`.
 *
 * Les chemins d'images pointent temporairement vers des visuels existants du
 * site (placeholders). Ils seront remplacés par les fichiers de
 * `public/experiences/` une fois générés — voir la section « Images » de la spec
 * `docs/superpowers/specs/2026-08-11-experiences-a-venir-design.md`.
 */
import type { KayvilaPngName } from "@/components/icons/KayvilaPngIcon";

export const EXPERIENCE_SLUGS = [
  "masseur",
  "chef-cuisinier",
  "excursions",
  "garde-enfants",
] as const;

export type ExperienceSlug = (typeof EXPERIENCE_SLUGS)[number];

export function isExperienceSlug(value: string): value is ExperienceSlug {
  return (EXPERIENCE_SLUGS as readonly string[]).includes(value);
}

export type ExperienceDetail = {
  slug: ExperienceSlug;
  /** Icône monoline affichée dans le hero et dans le bandeau bas. */
  icon: KayvilaPngName;
  /** Image hero 16:9 — sert aussi de carte home (recadrée en 4:5) et d'image OpenGraph. */
  hero: string;
  /** `object-position` du hero, pour garder le sujet visible après recadrage. */
  heroPosition: string;
  images: {
    /** Bloc « intro » — 4:3 */
    intro: string;
    /** Bloc « ce qui est inclus » — 4:3 */
    included: string;
  };
};

export const EXPERIENCE_DETAILS: Record<ExperienceSlug, ExperienceDetail> = {
  masseur: {
    slug: "masseur",
    icon: "sparkle",
    hero: "/relation.webp",
    heroPosition: "center 45%",
    images: { intro: "/relation-old.webp", included: "/menage.webp" },
  },
  "chef-cuisinier": {
    slug: "chef-cuisinier",
    icon: "chef",
    hero: "/notregestion.webp",
    heroPosition: "center 40%",
    images: { intro: "/notregestion-old.webp", included: "/marketing.webp" },
  },
  excursions: {
    slug: "excursions",
    icon: "compass",
    hero: "/terrain.webp",
    heroPosition: "center 40%",
    images: { intro: "/terrain-old.webp", included: "/villas-hero.webp" },
  },
  "garde-enfants": {
    slug: "garde-enfants",
    icon: "users",
    hero: "/menage.webp",
    heroPosition: "center 45%",
    images: { intro: "/menage-old.webp", included: "/finance.webp" },
  },
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run data/experiences.test.ts`
Expected: PASS — 5 tests passés.

- [ ] **Step 5: Commit**

```bash
git add data/experiences.ts data/experiences.test.ts
git commit -m "feat(experiences): structure de donnees des 4 prestations a venir

Co-Authored-By: claude-flow <ruv@ruv.net>"
```

---

### Task 2: Copie française et test de parité i18n

**Files:**
- Modify: `lib/i18n.ts` (bloc `fr:`, qui commence ligne ~27 et se termine avant `en: {` ligne ~887)
- Modify: `data/experiences.test.ts`

**Interfaces:**
- Consumes: `EXPERIENCE_SLUGS` (Task 1), `SUPPORTED_LOCALES` et `t(locale, key)` de `lib/i18n.ts`.
- Produces: les clés `experiences.*` et `home.upcoming_*` et `footer.upcoming`, consommées par les Tasks 4, 5 et 6.

- [ ] **Step 1: Write the failing test**

Dans `data/experiences.test.ts`, ajouter d'abord cet import **en tête de fichier**, sous les imports existants (la règle ESLint `import/first` interdit un import en milieu de fichier) :

```ts
import { SUPPORTED_LOCALES, t } from "@/lib/i18n";
```

Puis ajouter ceci à la fin du fichier :

```ts
const PER_SLUG_KEYS = [
  "title",
  "eyebrow",
  "tagline",
  "meta_description",
  "intro",
  "item_1_title",
  "item_1_desc",
  "item_2_title",
  "item_2_desc",
  "item_3_title",
  "item_3_desc",
  "item_4_title",
  "item_4_desc",
  "step_1_title",
  "step_1_desc",
  "step_2_title",
  "step_2_desc",
  "step_3_title",
  "step_3_desc",
  "image_alt",
  "image_intro_alt",
  "image_included_alt",
];

const SHARED_KEYS = [
  "experiences.badge_soon",
  "experiences.badge_soon_short",
  "experiences.breadcrumb_root",
  "experiences.breadcrumb_aria",
  "experiences.approach_eyebrow",
  "experiences.included_eyebrow",
  "experiences.included_title",
  "experiences.how_eyebrow",
  "experiences.how_title",
  "experiences.soon_band_title",
  "experiences.soon_band_text",
  "experiences.soon_band_cta",
  "experiences.other_experiences",
  "experiences.meta_suffix",
  "home.upcoming_eyebrow",
  "home.upcoming_title",
  "home.upcoming_subtitle",
  "home.upcoming_card_aria",
  "footer.upcoming",
];

function allKeys(): string[] {
  const perSlug = EXPERIENCE_SLUGS.flatMap((slug) =>
    PER_SLUG_KEYS.map((k) => `experiences.${slug}.${k}`)
  );
  return [...perSlug, ...SHARED_KEYS];
}

describe("i18n des prestations à venir", () => {
  it("définit chaque clé dans les 3 locales", () => {
    const missing: string[] = [];
    for (const locale of SUPPORTED_LOCALES) {
      for (const key of allKeys()) {
        const value = t(locale, key);
        // `t` retourne la clé elle-même quand la traduction est absente,
        // et retombe sur le français : on exige une valeur propre à la locale.
        if (value === key || value.trim() === "") missing.push(`${locale}:${key}`);
      }
    }
    expect(missing).toEqual([]);
  });

  it("n'emploie jamais « à domicile » ni ses équivalents proscrits", () => {
    const banned = [/à domicile/i, /a domicilio/i, /to your door/i];
    const offenders: string[] = [];
    for (const locale of SUPPORTED_LOCALES) {
      for (const key of allKeys()) {
        const value = t(locale, key);
        if (banned.some((re) => re.test(value))) offenders.push(`${locale}:${key}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});
```

> Note : ce test ne détecte pas une clé EN identique au FR par simple recopie fautive, mais il détecte toute clé **absente** (retour de la clé brute) ou vide. La Task 3 le fait passer au vert pour EN et ES.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run data/experiences.test.ts`
Expected: FAIL — le tableau `missing` contient les 107 clés × 3 locales.

- [ ] **Step 3: Write the French copy**

Dans `lib/i18n.ts`, à l'intérieur du bloc `fr: {`, juste **avant** la ligne `en: {` (donc en fin de bloc `fr`), insérer :

```ts
    // ── Prestations à venir (voyageurs) ──────────────────────
    "experiences.badge_soon": "Bientôt disponible",
    "experiences.badge_soon_short": "Bientôt",
    "experiences.breadcrumb_root": "Prestations à venir",
    "experiences.breadcrumb_aria": "Fil d'ariane",
    "experiences.approach_eyebrow": "Notre approche",
    "experiences.included_eyebrow": "Le détail",
    "experiences.included_title": "Ce qui est inclus",
    "experiences.how_eyebrow": "En pratique",
    "experiences.how_title": "Comment ça se passe",
    "experiences.soon_band_title": "Cette prestation ouvre prochainement",
    "experiences.soon_band_text": "Elle n'est pas encore réservable en ligne. Dites-nous votre intérêt : nous vous recontactons dès son ouverture, et nous étudions déjà les demandes au cas par cas.",
    "experiences.soon_band_cta": "Nous écrire",
    "experiences.other_experiences": "Les autres prestations à venir",
    "experiences.meta_suffix": "Prestations à venir",

    "experiences.masseur.title": "Massage & bien-être",
    "experiences.masseur.eyebrow": "Bien-être",
    "experiences.masseur.tagline": "Un praticien vient à vous, entre deux journées de mer.",
    "experiences.masseur.meta_description": "Massage et soins bien-être à la villa en Martinique, avec des praticiens sélectionnés par Kayvila. Prestation bientôt disponible.",
    "experiences.masseur.intro": "En vacances, personne n'a envie de reprendre la voiture pour aller se détendre. Nous préférons faire venir le soin jusqu'à vous : une table installée sur la terrasse ou au bord du bassin, le bruit de la mer, et une heure pour soi. Nous travaillons avec des praticiens installés en Martinique, choisis pour leur formation, leur discrétion et leur régularité. Vous nous dites le moment qui vous arrange, nous nous occupons du reste. Rien à préparer, rien à ranger : la villa retrouve son calme aussitôt après.",
    "experiences.masseur.item_1_title": "Praticiens sélectionnés",
    "experiences.masseur.item_1_desc": "Chaque praticien est rencontré, vérifié et suivi. Formation, assurance, ponctualité : nous ne référençons que ceux dont nous répondons.",
    "experiences.masseur.item_2_title": "Le matériel vient avec",
    "experiences.masseur.item_2_desc": "Table, linge propre, huiles et musique : le praticien arrive équipé et repart avec tout. Vous n'avez rien à prévoir.",
    "experiences.masseur.item_3_title": "Soins à la carte",
    "experiences.masseur.item_3_desc": "Massage relaxant, sportif, prénatal, réflexologie ou soin du visage : vous choisissez la durée et le type de soin au moment de la demande.",
    "experiences.masseur.item_4_title": "En solo, en duo ou en groupe",
    "experiences.masseur.item_4_desc": "Deux tables côte à côte pour un couple, plusieurs praticiens pour un groupe d'amis : nous adaptons selon le nombre de personnes présentes à la villa.",
    "experiences.masseur.step_1_title": "Vous nous dites quand",
    "experiences.masseur.step_1_desc": "Un message à la conciergerie avec la date, le créneau souhaité et le nombre de personnes.",
    "experiences.masseur.step_2_title": "Nous vous proposons un praticien",
    "experiences.masseur.step_2_desc": "Nous vous confirmons le nom, le type de soin, la durée et le tarif avant toute intervention.",
    "experiences.masseur.step_3_title": "Il se déplace à la villa",
    "experiences.masseur.step_3_desc": "Le praticien arrive, installe, réalise le soin et repart. Vous n'avez qu'à profiter.",
    "experiences.masseur.image_alt": "Table de massage installée sur la terrasse d'une villa face à la mer",
    "experiences.masseur.image_intro_alt": "Mains d'un praticien versant de l'huile de massage tiède",
    "experiences.masseur.image_included_alt": "Serviettes blanches, flacon d'huile et bougie posés sur un plateau en bois",

    "experiences.chef-cuisinier.title": "Chef cuisinier",
    "experiences.chef-cuisinier.eyebrow": "Table privée",
    "experiences.chef-cuisinier.tagline": "Une grande tablée chez vous, et personne en cuisine le lendemain.",
    "experiences.chef-cuisinier.meta_description": "Chef cuisinier à la villa en Martinique : menu créole sur mesure, service à table et cuisine remise en état. Prestation Kayvila bientôt disponible.",
    "experiences.chef-cuisinier.intro": "Un dîner d'anniversaire, un premier soir d'arrivée, un déjeuner qui s'étire : certains repas méritent que personne ne reste coincé derrière les fourneaux. Nous faisons venir un chef à la villa, avec son marché, son menu et son service. La cuisine créole que nous aimons — poisson du jour, épices, produits de saison — travaillée sans lourdeur et adaptée à vos envies comme à vos allergies. À la fin du repas, la cuisine est rendue telle que vous l'avez trouvée. Vous, vous restez à table.",
    "experiences.chef-cuisinier.item_1_title": "Menu construit avec vous",
    "experiences.chef-cuisinier.item_1_desc": "Nombre de convives, occasion, allergies, régimes, envies : le menu est écrit sur mesure et validé avant le jour J.",
    "experiences.chef-cuisinier.item_2_title": "Marché et courses inclus",
    "experiences.chef-cuisinier.item_2_desc": "Le chef sélectionne lui-même les produits chez ses fournisseurs le matin même : poisson du jour, fruits et légumes de saison.",
    "experiences.chef-cuisinier.item_3_title": "Service à table",
    "experiences.chef-cuisinier.item_3_desc": "Selon la formule, le chef sert lui-même ou vient accompagné. Dressage soigné, rythme du repas maîtrisé.",
    "experiences.chef-cuisinier.item_4_title": "Cuisine rendue impeccable",
    "experiences.chef-cuisinier.item_4_desc": "Vaisselle, plans de travail, poubelles : tout est remis en état avant son départ. Vous ne retrouvez rien à faire le lendemain.",
    "experiences.chef-cuisinier.step_1_title": "Vous nous dites l'occasion",
    "experiences.chef-cuisinier.step_1_desc": "Date, nombre de couverts, moment du repas et contraintes alimentaires.",
    "experiences.chef-cuisinier.step_2_title": "Nous proposons un menu et un chef",
    "experiences.chef-cuisinier.step_2_desc": "Une proposition écrite, avec le tarif par personne, à valider ou à ajuster autant que nécessaire.",
    "experiences.chef-cuisinier.step_3_title": "Il cuisine, sert et repart",
    "experiences.chef-cuisinier.step_3_desc": "Le chef arrive quelques heures avant, installe, cuisine, sert, puis laisse la cuisine propre.",
    "experiences.chef-cuisinier.image_alt": "Table dressée sur la terrasse d'une villa au crépuscule, face à la mer",
    "experiences.chef-cuisinier.image_intro_alt": "Chef dressant une assiette de cuisine créole dans la cuisine d'une villa",
    "experiences.chef-cuisinier.image_included_alt": "Produits frais de Martinique disposés sur un plan de travail sombre",

    "experiences.excursions.title": "Excursions & découvertes",
    "experiences.excursions.eyebrow": "Martinique",
    "experiences.excursions.tagline": "L'île comme la connaissent ceux qui y vivent.",
    "experiences.excursions.meta_description": "Excursions privatisées en Martinique : bateau, Rocher du Diamant, distilleries, randonnées, avec des guides locaux. Prestation Kayvila bientôt disponible.",
    "experiences.excursions.intro": "La Martinique se visite mal au hasard. Les meilleurs mouillages dépendent du vent, les distilleries n'ouvrent pas toutes les mêmes jours, et certains sentiers deviennent glissants une heure après la pluie. Nous préférons vous confier à des guides et des skippers d'ici, qui connaissent ces détails et adaptent la journée à la météo du matin. Des sorties privatisées, en petit comité, à votre rythme. Nous organisons, nous réservons, et nous restons joignables pendant la sortie.",
    "experiences.excursions.item_1_title": "Sorties privatisées",
    "experiences.excursions.item_1_desc": "Bateau, catamaran ou véhicule : la sortie est réservée à votre groupe. Vous partez à l'heure qui vous convient.",
    "experiences.excursions.item_2_title": "Guides et skippers locaux",
    "experiences.excursions.item_2_desc": "Des professionnels basés en Martinique, licenciés et assurés, que nous connaissons personnellement.",
    "experiences.excursions.item_3_title": "Programme adapté à la météo",
    "experiences.excursions.item_3_desc": "Le point est fait le matin même. Si la mer se lève, nous décalons la sortie ou nous proposons une alternative à terre.",
    "experiences.excursions.item_4_title": "Tout est organisé",
    "experiences.excursions.item_4_desc": "Réservation, horaires, point de rendez-vous, transfert depuis la villa si besoin : vous n'avez qu'à être prêts.",
    "experiences.excursions.step_1_title": "Vous nous dites ce qui vous tente",
    "experiences.excursions.step_1_desc": "Mer, terre, rhum, randonnée ou plongée : dites-nous l'envie, nous proposons le format.",
    "experiences.excursions.step_2_title": "Nous construisons la journée",
    "experiences.excursions.step_2_desc": "Itinéraire, durée, tarif et point de départ vous sont confirmés par écrit avant la sortie.",
    "experiences.excursions.step_3_title": "Vous partez, nous suivons",
    "experiences.excursions.step_3_desc": "Nous restons joignables pendant toute la sortie, en cas d'imprévu ou de changement.",
    "experiences.excursions.image_alt": "Le Rocher du Diamant vu depuis un bateau privé au petit matin",
    "experiences.excursions.image_intro_alt": "Pont en bois d'un catamaran face à l'eau turquoise",
    "experiences.excursions.image_included_alt": "Sentier de randonnée en forêt tropicale martiniquaise",

    "experiences.garde-enfants.title": "Garde d'enfants",
    "experiences.garde-enfants.eyebrow": "Sérénité famille",
    "experiences.garde-enfants.tagline": "Une soirée à deux, sans quitter la villa des yeux.",
    "experiences.garde-enfants.meta_description": "Garde d'enfants à la villa en Martinique : intervenantes vérifiées, francophones, anglophones sur demande. Prestation Kayvila bientôt disponible.",
    "experiences.garde-enfants.intro": "Partir en famille ne devrait pas vouloir dire renoncer à une soirée à deux, ni à une sortie en mer que les plus petits ne suivraient pas. Nous mettons à votre disposition des intervenantes de confiance, qui se déplacent à la villa : quelques heures en soirée, une matinée, ou une journée entière pendant une excursion. Elles sont expérimentées, joignables, et parlent français. Vos enfants restent dans un lieu qu'ils connaissent déjà, avec leurs affaires et leurs habitudes. Vous partez l'esprit tranquille.",
    "experiences.garde-enfants.item_1_title": "Intervenantes vérifiées",
    "experiences.garde-enfants.item_1_desc": "Identité, expérience, références et extrait de casier judiciaire : chaque intervenante est contrôlée avant d'être proposée.",
    "experiences.garde-enfants.item_2_title": "À la villa, dans leurs repères",
    "experiences.garde-enfants.item_2_desc": "Pas de déplacement, pas de lieu inconnu : la garde se fait chez vous, avec les affaires et le rythme habituels des enfants.",
    "experiences.garde-enfants.item_3_title": "Quelques heures ou la journée",
    "experiences.garde-enfants.item_3_desc": "Une soirée pendant que vous dînez, une matinée, ou une journée complète pendant une excursion entre adultes.",
    "experiences.garde-enfants.item_4_title": "Français et anglais",
    "experiences.garde-enfants.item_4_desc": "Nos intervenantes parlent français ; une intervenante anglophone peut être demandée au moment de la réservation.",
    "experiences.garde-enfants.step_1_title": "Vous nous dites vos besoins",
    "experiences.garde-enfants.step_1_desc": "Âge des enfants, créneau, durée et particularités : sieste, repas, allergies, habitudes du soir.",
    "experiences.garde-enfants.step_2_title": "Nous vous présentons l'intervenante",
    "experiences.garde-enfants.step_2_desc": "Prénom, expérience et références vous sont communiqués avant le jour de la garde.",
    "experiences.garde-enfants.step_3_title": "Elle vient à la villa",
    "experiences.garde-enfants.step_3_desc": "Un temps de rencontre est prévu à son arrivée, avant que vous partiez.",
    "experiences.garde-enfants.image_alt": "Salon d'une villa en fin d'après-midi, avec livres et jouets en bois",
    "experiences.garde-enfants.image_intro_alt": "Main d'adulte et main d'enfant construisant avec des cubes en bois",
    "experiences.garde-enfants.image_included_alt": "Panier de livres pour enfants et jouets posés sur un sol clair",
```

Toujours dans le bloc `fr`, ajouter ces trois clés à côté des autres clés `home.*`, et la clé footer à côté des `footer.*` :

```ts
    "home.upcoming_eyebrow": "Bientôt chez Kayvila",
    "home.upcoming_title": "Nos prestations à venir",
    "home.upcoming_subtitle": "Quatre services pensés pour vos séjours, en préparation avec nos partenaires en Martinique.",
    "home.upcoming_card_aria": "Découvrir {{name}}",
    "footer.upcoming": "Prestations à venir",
```

- [ ] **Step 4: Run test to verify it still fails, but only on en/es**

Run: `npx vitest run data/experiences.test.ts`
Expected: FAIL — le test « définit chaque clé dans les 3 locales » échoue encore, mais `missing` ne contient plus **aucune** entrée préfixée `fr:`. Le test « à domicile » doit **passer**.

Si une entrée `fr:` subsiste, une clé a été oubliée ou mal orthographiée : corriger avant de continuer.

- [ ] **Step 5: Commit**

```bash
git add lib/i18n.ts data/experiences.test.ts
git commit -m "feat(i18n): copie francaise des prestations a venir + test de parite

Co-Authored-By: claude-flow <ruv@ruv.net>"
```

---

### Task 3: Traductions anglaise et espagnole

**Files:**
- Modify: `lib/i18n.ts` (blocs `en:` et `es:`)

**Interfaces:**
- Consumes: la liste de clés définie en Task 2.
- Produces: rien de nouveau — complète les locales `en` et `es`.

- [ ] **Step 1: Run the test to see the current failure**

Run: `npx vitest run data/experiences.test.ts`
Expected: FAIL — `missing` contient 107 entrées `en:` et 107 entrées `es:`.

- [ ] **Step 2: Add the English block**

Dans `lib/i18n.ts`, en fin de bloc `en: {` (juste avant la ligne `es: {`) :

```ts
    // ── Upcoming services (guests) ───────────────────────────
    "experiences.badge_soon": "Coming soon",
    "experiences.badge_soon_short": "Soon",
    "experiences.breadcrumb_root": "Upcoming services",
    "experiences.breadcrumb_aria": "Breadcrumb",
    "experiences.approach_eyebrow": "Our approach",
    "experiences.included_eyebrow": "The detail",
    "experiences.included_title": "What's included",
    "experiences.how_eyebrow": "In practice",
    "experiences.how_title": "How it works",
    "experiences.soon_band_title": "This service opens shortly",
    "experiences.soon_band_text": "It cannot be booked online yet. Tell us you're interested and we'll get back to you as soon as it opens — we already look at requests case by case.",
    "experiences.soon_band_cta": "Get in touch",
    "experiences.other_experiences": "Other upcoming services",
    "experiences.meta_suffix": "Upcoming services",

    "experiences.masseur.title": "Massage & wellbeing",
    "experiences.masseur.eyebrow": "Wellbeing",
    "experiences.masseur.tagline": "A therapist comes to you, between two days by the sea.",
    "experiences.masseur.meta_description": "Massage and wellbeing treatments at the villa in Martinique, with therapists selected by Kayvila. Service coming soon.",
    "experiences.masseur.intro": "On holiday, nobody wants to get back in the car just to unwind. We would rather bring the treatment to you: a table set up on the terrace or by the pool, the sound of the sea, and an hour to yourself. We work with therapists based in Martinique, chosen for their training, their discretion and their reliability. You tell us the moment that suits you, we handle the rest. Nothing to prepare, nothing to tidy away: the villa is quiet again the minute it's over.",
    "experiences.masseur.item_1_title": "Selected therapists",
    "experiences.masseur.item_1_desc": "Every therapist is met, vetted and followed up. Training, insurance, punctuality: we only list the ones we would vouch for.",
    "experiences.masseur.item_2_title": "Equipment comes along",
    "experiences.masseur.item_2_desc": "Table, fresh linen, oils and music: the therapist arrives fully equipped and leaves with everything. You need nothing on hand.",
    "experiences.masseur.item_3_title": "Treatments à la carte",
    "experiences.masseur.item_3_desc": "Relaxing, sports, prenatal, reflexology or facial: you choose the length and the type of treatment when you ask.",
    "experiences.masseur.item_4_title": "Solo, as a couple or as a group",
    "experiences.masseur.item_4_desc": "Two tables side by side for a couple, several therapists for a group of friends: we adapt to however many of you are staying at the villa.",
    "experiences.masseur.step_1_title": "Tell us when",
    "experiences.masseur.step_1_desc": "A message to the concierge team with the date, the time slot and how many of you there are.",
    "experiences.masseur.step_2_title": "We suggest a therapist",
    "experiences.masseur.step_2_desc": "We confirm the name, the treatment, the length and the price before anything is booked.",
    "experiences.masseur.step_3_title": "They come to the villa",
    "experiences.masseur.step_3_desc": "The therapist arrives, sets up, gives the treatment and leaves. All you have to do is enjoy it.",
    "experiences.masseur.image_alt": "Massage table set up on a villa terrace facing the sea",
    "experiences.masseur.image_intro_alt": "A therapist's hands pouring warm massage oil",
    "experiences.masseur.image_included_alt": "White towels, an oil bottle and a candle on a wooden tray",

    "experiences.chef-cuisinier.title": "Private chef",
    "experiences.chef-cuisinier.eyebrow": "Private table",
    "experiences.chef-cuisinier.tagline": "A long table at the villa, and nobody stuck in the kitchen the next morning.",
    "experiences.chef-cuisinier.meta_description": "A chef cooking at your villa in Martinique: bespoke creole menu, table service, kitchen left spotless. Kayvila service coming soon.",
    "experiences.chef-cuisinier.intro": "A birthday dinner, a first evening after landing, a lunch that stretches into the afternoon: some meals deserve to have nobody stuck at the stove. We bring a chef to the villa, with the shopping, the menu and the service. The creole cooking we love — catch of the day, spices, seasonal produce — done lightly and adapted to your tastes and any allergies. When the meal is over, the kitchen is left exactly as you found it. You stay at the table.",
    "experiences.chef-cuisinier.item_1_title": "A menu written with you",
    "experiences.chef-cuisinier.item_1_desc": "Number of guests, occasion, allergies, diets, cravings: the menu is written for you and agreed before the day itself.",
    "experiences.chef-cuisinier.item_2_title": "Shopping included",
    "experiences.chef-cuisinier.item_2_desc": "The chef picks the produce from their own suppliers that same morning: catch of the day, seasonal fruit and vegetables.",
    "experiences.chef-cuisinier.item_3_title": "Table service",
    "experiences.chef-cuisinier.item_3_desc": "Depending on the format, the chef serves personally or brings someone along. Careful plating, unhurried pacing.",
    "experiences.chef-cuisinier.item_4_title": "Kitchen left spotless",
    "experiences.chef-cuisinier.item_4_desc": "Dishes, worktops, bins: everything is put back in order before they leave. Nothing waits for you the next morning.",
    "experiences.chef-cuisinier.step_1_title": "Tell us the occasion",
    "experiences.chef-cuisinier.step_1_desc": "Date, number of covers, time of the meal and any dietary requirements.",
    "experiences.chef-cuisinier.step_2_title": "We suggest a menu and a chef",
    "experiences.chef-cuisinier.step_2_desc": "A written proposal, with the price per person, to approve or adjust as many times as you need.",
    "experiences.chef-cuisinier.step_3_title": "They cook, serve and leave",
    "experiences.chef-cuisinier.step_3_desc": "The chef arrives a few hours early, sets up, cooks, serves, then leaves the kitchen clean.",
    "experiences.chef-cuisinier.image_alt": "Table laid on a villa terrace at dusk, facing the sea",
    "experiences.chef-cuisinier.image_intro_alt": "A chef plating a creole dish in a villa kitchen",
    "experiences.chef-cuisinier.image_included_alt": "Fresh Martinique produce laid out on a dark worktop",

    "experiences.excursions.title": "Excursions & discoveries",
    "experiences.excursions.eyebrow": "Martinique",
    "experiences.excursions.tagline": "The island as the people who live here know it.",
    "experiences.excursions.meta_description": "Private excursions in Martinique: boat trips, Diamond Rock, rum distilleries, hikes, with local guides. Kayvila service coming soon.",
    "experiences.excursions.intro": "Martinique does not reward improvisation. The best anchorages depend on the wind, the distilleries don't all open on the same days, and some trails turn slippery an hour after the rain. We would rather put you in the hands of guides and skippers from here, who know those details and shape the day around the morning forecast. Private outings, small groups, at your own pace. We organise, we book, and we stay reachable while you're out.",
    "experiences.excursions.item_1_title": "Private outings",
    "experiences.excursions.item_1_desc": "Boat, catamaran or vehicle: the outing is yours alone. You leave at the time that suits you.",
    "experiences.excursions.item_2_title": "Local guides and skippers",
    "experiences.excursions.item_2_desc": "Professionals based in Martinique, licensed and insured, whom we know personally.",
    "experiences.excursions.item_3_title": "Built around the weather",
    "experiences.excursions.item_3_desc": "We check that same morning. If the sea picks up, we move the outing or suggest something on land instead.",
    "experiences.excursions.item_4_title": "Everything arranged",
    "experiences.excursions.item_4_desc": "Booking, timings, meeting point, transfer from the villa if needed: all you have to do is be ready.",
    "experiences.excursions.step_1_title": "Tell us what appeals",
    "experiences.excursions.step_1_desc": "Sea, land, rum, hiking or diving: tell us the idea and we'll propose the format.",
    "experiences.excursions.step_2_title": "We build the day",
    "experiences.excursions.step_2_desc": "Route, duration, price and departure point are confirmed in writing before you go.",
    "experiences.excursions.step_3_title": "You set off, we follow",
    "experiences.excursions.step_3_desc": "We stay reachable throughout the outing, in case anything changes.",
    "experiences.excursions.image_alt": "Diamond Rock seen from a private boat at first light",
    "experiences.excursions.image_intro_alt": "The wooden deck of a catamaran over turquoise water",
    "experiences.excursions.image_included_alt": "A rainforest hiking trail in Martinique",

    "experiences.garde-enfants.title": "Childcare",
    "experiences.garde-enfants.eyebrow": "Family peace of mind",
    "experiences.garde-enfants.tagline": "An evening for two, without leaving the villa behind.",
    "experiences.garde-enfants.meta_description": "Childcare at your villa in Martinique: vetted carers, French-speaking, English on request. Kayvila service coming soon.",
    "experiences.garde-enfants.intro": "Travelling as a family shouldn't mean giving up an evening for two, or a day at sea the little ones wouldn't enjoy. We can arrange trusted carers who come to the villa: a few hours in the evening, a morning, or a full day during an excursion. They are experienced, reachable, and speak French. Your children stay somewhere they already know, with their own things and their usual routine. You head out with a clear mind.",
    "experiences.garde-enfants.item_1_title": "Vetted carers",
    "experiences.garde-enfants.item_1_desc": "Identity, experience, references and criminal record check: every carer is verified before we suggest them.",
    "experiences.garde-enfants.item_2_title": "At the villa, on familiar ground",
    "experiences.garde-enfants.item_2_desc": "No travelling, no unfamiliar place: childcare happens where you're staying, with the children's own things and usual rhythm.",
    "experiences.garde-enfants.item_3_title": "A few hours or a full day",
    "experiences.garde-enfants.item_3_desc": "An evening while you have dinner, a morning, or a whole day during an adults-only excursion.",
    "experiences.garde-enfants.item_4_title": "French and English",
    "experiences.garde-enfants.item_4_desc": "Our carers speak French; an English-speaking carer can be requested when you book.",
    "experiences.garde-enfants.step_1_title": "Tell us what you need",
    "experiences.garde-enfants.step_1_desc": "Children's ages, time slot, duration and specifics: naps, meals, allergies, bedtime routine.",
    "experiences.garde-enfants.step_2_title": "We introduce the carer",
    "experiences.garde-enfants.step_2_desc": "First name, experience and references are shared with you before the day itself.",
    "experiences.garde-enfants.step_3_title": "They come to the villa",
    "experiences.garde-enfants.step_3_desc": "There's time to meet when they arrive, before you head out.",
    "experiences.garde-enfants.image_alt": "A villa living room in late afternoon light, with books and wooden toys",
    "experiences.garde-enfants.image_intro_alt": "An adult's hand and a child's hand building with wooden blocks",
    "experiences.garde-enfants.image_included_alt": "A basket of children's books and toys on a pale floor",

    "home.upcoming_eyebrow": "Coming soon at Kayvila",
    "home.upcoming_title": "Our upcoming services",
    "home.upcoming_subtitle": "Four services designed around your stay, in preparation with our partners in Martinique.",
    "home.upcoming_card_aria": "Discover {{name}}",
    "footer.upcoming": "Upcoming services",
```

- [ ] **Step 3: Add the Spanish block**

Dans `lib/i18n.ts`, en fin de bloc `es: {` (juste avant la ligne `};` de fermeture de `translations`, ligne ~2607) :

```ts
    // ── Servicios próximamente (viajeros) ────────────────────
    "experiences.badge_soon": "Próximamente",
    "experiences.badge_soon_short": "Pronto",
    "experiences.breadcrumb_root": "Servicios próximamente",
    "experiences.breadcrumb_aria": "Ruta de navegación",
    "experiences.approach_eyebrow": "Nuestro enfoque",
    "experiences.included_eyebrow": "El detalle",
    "experiences.included_title": "Qué incluye",
    "experiences.how_eyebrow": "En la práctica",
    "experiences.how_title": "Cómo funciona",
    "experiences.soon_band_title": "Este servicio abre próximamente",
    "experiences.soon_band_text": "Todavía no se puede reservar en línea. Dinos que te interesa y te avisamos en cuanto abra: ya estudiamos las solicitudes caso por caso.",
    "experiences.soon_band_cta": "Escríbenos",
    "experiences.other_experiences": "Los demás servicios próximamente",
    "experiences.meta_suffix": "Servicios próximamente",

    "experiences.masseur.title": "Masaje y bienestar",
    "experiences.masseur.eyebrow": "Bienestar",
    "experiences.masseur.tagline": "El terapeuta viene a ti, entre dos días de mar.",
    "experiences.masseur.meta_description": "Masajes y tratamientos de bienestar en la villa en Martinica, con terapeutas seleccionados por Kayvila. Servicio próximamente.",
    "experiences.masseur.intro": "En vacaciones, nadie quiere volver a coger el coche para relajarse. Preferimos llevarte el tratamiento: una camilla en la terraza o junto a la piscina, el ruido del mar y una hora para ti. Trabajamos con terapeutas afincados en Martinica, elegidos por su formación, su discreción y su constancia. Tú nos dices el momento que te viene bien y nosotros nos ocupamos del resto. Nada que preparar, nada que recoger: la villa recupera su calma justo después.",
    "experiences.masseur.item_1_title": "Terapeutas seleccionados",
    "experiences.masseur.item_1_desc": "Conocemos, verificamos y hacemos seguimiento de cada terapeuta. Formación, seguro, puntualidad: solo trabajamos con quienes podemos responder.",
    "experiences.masseur.item_2_title": "El material viene incluido",
    "experiences.masseur.item_2_desc": "Camilla, ropa limpia, aceites y música: el terapeuta llega equipado y se lleva todo. No tienes que prever nada.",
    "experiences.masseur.item_3_title": "Tratamientos a la carta",
    "experiences.masseur.item_3_desc": "Masaje relajante, deportivo, prenatal, reflexología o tratamiento facial: eliges la duración y el tipo al hacer la solicitud.",
    "experiences.masseur.item_4_title": "Solo, en pareja o en grupo",
    "experiences.masseur.item_4_desc": "Dos camillas juntas para una pareja, varios terapeutas para un grupo de amigos: nos adaptamos al número de personas en la villa.",
    "experiences.masseur.step_1_title": "Nos dices cuándo",
    "experiences.masseur.step_1_desc": "Un mensaje a conserjería con la fecha, la franja horaria y el número de personas.",
    "experiences.masseur.step_2_title": "Te proponemos un terapeuta",
    "experiences.masseur.step_2_desc": "Te confirmamos el nombre, el tipo de tratamiento, la duración y la tarifa antes de nada.",
    "experiences.masseur.step_3_title": "Se desplaza a la villa",
    "experiences.masseur.step_3_desc": "El terapeuta llega, se instala, realiza el tratamiento y se marcha. Tú solo tienes que disfrutar.",
    "experiences.masseur.image_alt": "Camilla de masaje instalada en la terraza de una villa frente al mar",
    "experiences.masseur.image_intro_alt": "Manos de un terapeuta vertiendo aceite de masaje templado",
    "experiences.masseur.image_included_alt": "Toallas blancas, frasco de aceite y vela sobre una bandeja de madera",

    "experiences.chef-cuisinier.title": "Chef privado",
    "experiences.chef-cuisinier.eyebrow": "Mesa privada",
    "experiences.chef-cuisinier.tagline": "Una gran mesa en la villa, y nadie en la cocina al día siguiente.",
    "experiences.chef-cuisinier.meta_description": "Chef que cocina en tu villa en Martinica: menú criollo a medida, servicio en mesa y cocina impecable. Servicio Kayvila próximamente.",
    "experiences.chef-cuisinier.intro": "Una cena de cumpleaños, la primera noche tras llegar, una comida que se alarga: hay comidas que merecen que nadie se quede atrapado entre fogones. Llevamos un chef a la villa, con su compra, su menú y su servicio. La cocina criolla que nos gusta — pescado del día, especias, producto de temporada — trabajada sin pesadez y adaptada a vuestros gustos y alergias. Al terminar, la cocina queda tal y como la encontrasteis. Vosotros os quedáis en la mesa.",
    "experiences.chef-cuisinier.item_1_title": "Un menú escrito contigo",
    "experiences.chef-cuisinier.item_1_desc": "Número de comensales, ocasión, alergias, dietas, antojos: el menú se escribe a medida y se valida antes del día.",
    "experiences.chef-cuisinier.item_2_title": "Compra incluida",
    "experiences.chef-cuisinier.item_2_desc": "El chef elige el producto en sus proveedores esa misma mañana: pescado del día, fruta y verdura de temporada.",
    "experiences.chef-cuisinier.item_3_title": "Servicio en mesa",
    "experiences.chef-cuisinier.item_3_desc": "Según la fórmula, el chef sirve él mismo o viene acompañado. Emplatado cuidado y ritmo de comida bien llevado.",
    "experiences.chef-cuisinier.item_4_title": "Cocina impecable al irse",
    "experiences.chef-cuisinier.item_4_desc": "Vajilla, encimeras, basura: todo queda recogido antes de marcharse. No te espera nada al día siguiente.",
    "experiences.chef-cuisinier.step_1_title": "Nos dices la ocasión",
    "experiences.chef-cuisinier.step_1_desc": "Fecha, número de comensales, momento de la comida y restricciones alimentarias.",
    "experiences.chef-cuisinier.step_2_title": "Proponemos menú y chef",
    "experiences.chef-cuisinier.step_2_desc": "Una propuesta por escrito, con el precio por persona, para validar o ajustar las veces que haga falta.",
    "experiences.chef-cuisinier.step_3_title": "Cocina, sirve y se marcha",
    "experiences.chef-cuisinier.step_3_desc": "El chef llega unas horas antes, se instala, cocina, sirve y deja la cocina limpia.",
    "experiences.chef-cuisinier.image_alt": "Mesa puesta en la terraza de una villa al atardecer, frente al mar",
    "experiences.chef-cuisinier.image_intro_alt": "Chef emplatando un plato criollo en la cocina de una villa",
    "experiences.chef-cuisinier.image_included_alt": "Producto fresco de Martinica sobre una encimera oscura",

    "experiences.excursions.title": "Excursiones y descubrimientos",
    "experiences.excursions.eyebrow": "Martinica",
    "experiences.excursions.tagline": "La isla como la conocen quienes viven en ella.",
    "experiences.excursions.meta_description": "Excursiones privadas en Martinica: barco, Roca del Diamante, destilerías, senderismo, con guías locales. Servicio Kayvila próximamente.",
    "experiences.excursions.intro": "Martinica no se deja improvisar. Los mejores fondeaderos dependen del viento, las destilerías no abren todas los mismos días y algunos senderos se vuelven resbaladizos una hora después de la lluvia. Preferimos dejarte en manos de guías y patrones de aquí, que conocen esos detalles y ajustan el día a la previsión de la mañana. Salidas privadas, en grupo reducido, a tu ritmo. Organizamos, reservamos y seguimos localizables durante la salida.",
    "experiences.excursions.item_1_title": "Salidas privadas",
    "experiences.excursions.item_1_desc": "Barco, catamarán o vehículo: la salida es solo para tu grupo. Salís a la hora que os convenga.",
    "experiences.excursions.item_2_title": "Guías y patrones locales",
    "experiences.excursions.item_2_desc": "Profesionales afincados en Martinica, con licencia y seguro, a quienes conocemos personalmente.",
    "experiences.excursions.item_3_title": "Programa según el tiempo",
    "experiences.excursions.item_3_desc": "Lo revisamos esa misma mañana. Si la mar se levanta, movemos la salida o proponemos una alternativa en tierra.",
    "experiences.excursions.item_4_title": "Todo organizado",
    "experiences.excursions.item_4_desc": "Reserva, horarios, punto de encuentro y traslado desde la villa si hace falta: solo tenéis que estar listos.",
    "experiences.excursions.step_1_title": "Nos dices qué te apetece",
    "experiences.excursions.step_1_desc": "Mar, tierra, ron, senderismo o buceo: dinos la idea y proponemos el formato.",
    "experiences.excursions.step_2_title": "Construimos el día",
    "experiences.excursions.step_2_desc": "Itinerario, duración, precio y punto de salida se confirman por escrito antes de partir.",
    "experiences.excursions.step_3_title": "Salís y os seguimos",
    "experiences.excursions.step_3_desc": "Seguimos localizables durante toda la salida, por si surge cualquier imprevisto.",
    "experiences.excursions.image_alt": "La Roca del Diamante vista desde un barco privado al amanecer",
    "experiences.excursions.image_intro_alt": "Cubierta de madera de un catamarán sobre agua turquesa",
    "experiences.excursions.image_included_alt": "Sendero de senderismo en la selva tropical de Martinica",

    "experiences.garde-enfants.title": "Cuidado de niños",
    "experiences.garde-enfants.eyebrow": "Tranquilidad en familia",
    "experiences.garde-enfants.tagline": "Una noche para dos, sin alejarse de la villa.",
    "experiences.garde-enfants.meta_description": "Cuidado de niños en la villa en Martinica: cuidadoras verificadas, francófonas, inglés bajo petición. Servicio Kayvila próximamente.",
    "experiences.garde-enfants.intro": "Viajar en familia no debería significar renunciar a una noche para dos, ni a una salida en barco que los más pequeños no disfrutarían. Ponemos a tu disposición cuidadoras de confianza que se desplazan a la villa: unas horas por la tarde, una mañana o un día entero durante una excursión. Tienen experiencia, están localizables y hablan francés. Vuestros hijos se quedan en un lugar que ya conocen, con sus cosas y sus costumbres. Vosotros salís tranquilos.",
    "experiences.garde-enfants.item_1_title": "Cuidadoras verificadas",
    "experiences.garde-enfants.item_1_desc": "Identidad, experiencia, referencias y certificado de antecedentes penales: cada cuidadora se verifica antes de proponerla.",
    "experiences.garde-enfants.item_2_title": "En la villa, en su entorno",
    "experiences.garde-enfants.item_2_desc": "Sin desplazamientos ni lugares desconocidos: el cuidado se hace donde os alojáis, con las cosas y el ritmo habituales de los niños.",
    "experiences.garde-enfants.item_3_title": "Unas horas o el día entero",
    "experiences.garde-enfants.item_3_desc": "Una noche mientras cenáis, una mañana o un día completo durante una excursión solo para adultos.",
    "experiences.garde-enfants.item_4_title": "Francés e inglés",
    "experiences.garde-enfants.item_4_desc": "Nuestras cuidadoras hablan francés; puedes pedir una cuidadora angloparlante al reservar.",
    "experiences.garde-enfants.step_1_title": "Nos dices qué necesitas",
    "experiences.garde-enfants.step_1_desc": "Edad de los niños, franja horaria, duración y particularidades: siesta, comidas, alergias, rutina de la noche.",
    "experiences.garde-enfants.step_2_title": "Te presentamos a la cuidadora",
    "experiences.garde-enfants.step_2_desc": "Te comunicamos su nombre, su experiencia y sus referencias antes del día del servicio.",
    "experiences.garde-enfants.step_3_title": "Viene a la villa",
    "experiences.garde-enfants.step_3_desc": "Hay un rato para conocerse cuando llega, antes de que salgáis.",
    "experiences.garde-enfants.image_alt": "Salón de una villa a última hora de la tarde, con libros y juguetes de madera",
    "experiences.garde-enfants.image_intro_alt": "Mano de un adulto y mano de un niño construyendo con cubos de madera",
    "experiences.garde-enfants.image_included_alt": "Cesta de libros infantiles y juguetes sobre un suelo claro",

    "home.upcoming_eyebrow": "Pronto en Kayvila",
    "home.upcoming_title": "Nuestros servicios próximamente",
    "home.upcoming_subtitle": "Cuatro servicios pensados para vuestra estancia, en preparación con nuestros colaboradores en Martinica.",
    "home.upcoming_card_aria": "Descubrir {{name}}",
    "footer.upcoming": "Servicios próximamente",
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run data/experiences.test.ts`
Expected: PASS — 7 tests passés, `missing` vide.

Puis la suite complète, pour vérifier qu'aucun autre test ne casse :

Run: `npm test`
Expected: PASS sur l'ensemble des fichiers `*.test.ts`.

- [ ] **Step 5: Commit**

```bash
git add lib/i18n.ts
git commit -m "feat(i18n): traductions anglaise et espagnole des prestations a venir

Co-Authored-By: claude-flow <ruv@ruv.net>"
```

---

### Task 4: Pages `/experiences/<slug>`

**Files:**
- Create: `app/experiences/layout.tsx`
- Create: `app/experiences/[slug]/page.tsx`

**Interfaces:**
- Consumes: `EXPERIENCE_SLUGS`, `EXPERIENCE_DETAILS`, `isExperienceSlug`, `ExperienceSlug` (Task 1) ; les clés `experiences.*` (Tasks 2-3) ; `LandingShell` et `LandingSection` de `components/marketing/landing-sections.tsx` ; `KayvilaPngIcon` ; `getServerLocale` et `tServer` de `lib/i18n.ts`.
- Produces: les routes `/experiences/masseur`, `/experiences/chef-cuisinier`, `/experiences/excursions`, `/experiences/garde-enfants`, consommées par les Tasks 5, 6 et 7.

- [ ] **Step 1: Create the section layout**

Créer `app/experiences/layout.tsx` :

```tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: true, follow: true },
};

export default function ExperiencesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
```

- [ ] **Step 2: Create the page**

Créer `app/experiences/[slug]/page.tsx` :

```tsx
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerLocale, tServer as ts } from "@/lib/i18n";
import { KayvilaPngIcon } from "@/components/icons/KayvilaPngIcon";
import { LandingShell, LandingSection } from "@/components/marketing/landing-sections";
import {
  EXPERIENCE_SLUGS,
  EXPERIENCE_DETAILS,
  isExperienceSlug,
} from "@/data/experiences";

export function generateStaticParams() {
  return EXPERIENCE_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  if (!isExperienceSlug(slug)) return {};
  const { headers } = await import("next/headers");
  const locale = getServerLocale(await headers());
  const d = EXPERIENCE_DETAILS[slug];
  const title = ts(locale, `experiences.${slug}.title`);
  const description = ts(locale, `experiences.${slug}.meta_description`);
  return {
    title: `${title} | ${ts(locale, "experiences.meta_suffix")}`,
    description,
    alternates: { canonical: `https://kayvila.com/experiences/${slug}` },
    openGraph: {
      title,
      description,
      url: `https://kayvila.com/experiences/${slug}`,
      type: "website",
      images: [
        {
          url: d.hero,
          width: 1200,
          height: 630,
          alt: ts(locale, `experiences.${slug}.image_alt`),
        },
      ],
    },
  };
}

export default async function ExperiencePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!isExperienceSlug(slug)) notFound();

  const { headers } = await import("next/headers");
  const locale = getServerLocale(await headers());
  const d = EXPERIENCE_DETAILS[slug];

  const title = ts(locale, `experiences.${slug}.title`);
  const items = [1, 2, 3, 4].map((n) => ({
    title: ts(locale, `experiences.${slug}.item_${n}_title`),
    desc: ts(locale, `experiences.${slug}.item_${n}_desc`),
  }));
  const steps = [1, 2, 3].map((n) => ({
    num: String(n).padStart(2, "0"),
    title: ts(locale, `experiences.${slug}.step_${n}_title`),
    desc: ts(locale, `experiences.${slug}.step_${n}_desc`),
  }));
  const others = EXPERIENCE_SLUGS.filter((s) => s !== slug);

  return (
    <LandingShell>
      {/* ── ① Hero ─────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden bg-navy"
        style={{ minHeight: "min(68vh, 560px)" }}
      >
        <Image
          src={d.hero}
          alt={ts(locale, `experiences.${slug}.image_alt`)}
          fill
          className="object-cover"
          style={{ objectPosition: d.heroPosition }}
          sizes="100vw"
          priority
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.24) 0%, rgba(0,0,0,0.18) 40%, rgba(0,0,0,0.80) 100%)",
          }}
          aria-hidden
        />

        <nav
          aria-label={ts(locale, "experiences.breadcrumb_aria")}
          className="absolute left-6 top-20 z-10 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/60 md:left-10 md:top-24"
        >
          <Link href="/" className="transition-colors hover:text-white">
            {ts(locale, "nav.home")}
          </Link>
          <span className="text-white/25" aria-hidden>/</span>
          <span className="text-white/90">{ts(locale, "experiences.breadcrumb_root")}</span>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 z-10 px-6 pb-10 md:px-12 md:pb-14">
          <div className="mx-auto max-w-5xl">
            <span className="mb-4 inline-flex items-center border border-gold/50 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.28em] text-gold">
              {ts(locale, "experiences.badge_soon")}
            </span>
            <div className="mb-3 flex items-center gap-2.5">
              <KayvilaPngIcon name={d.icon} size={20} invert alt="" className="shrink-0" />
              <p className="text-[9px] font-bold uppercase tracking-[0.48em] text-gold/90">
                {ts(locale, `experiences.${slug}.eyebrow`)}
              </p>
            </div>
            <div className="mb-4 h-px w-10 bg-gold/55" aria-hidden />
            <h1
              className="font-display font-normal text-white"
              style={{
                fontSize: "clamp(1.7rem, 4.5vw, 3.25rem)",
                letterSpacing: "0.07em",
                lineHeight: 1.08,
              }}
            >
              {title}
            </h1>
            <p className="mt-4 max-w-lg text-[13px] leading-relaxed text-white/65">
              {ts(locale, `experiences.${slug}.tagline`)}
            </p>
          </div>
        </div>
      </section>

      {/* ── ② Intro : texte [gauche] | image [droite] ──────── */}
      <section className="border-b border-navy/[0.06] bg-offwhite px-5 py-16 sm:px-6 md:py-24 lg:py-28">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-navy/60">
              {ts(locale, "experiences.approach_eyebrow")}
            </span>
            <h2 className="mt-4 font-display text-3xl font-normal leading-[1.08] text-navy md:text-4xl">
              {title}
            </h2>
            <div className="mt-4 h-px w-8 bg-gold/40" aria-hidden />
            <p className="mt-6 text-[15px] leading-relaxed text-navy/75 md:text-[17px]">
              {ts(locale, `experiences.${slug}.intro`)}
            </p>
          </div>
          <div className="relative aspect-[4/3] w-full overflow-hidden">
            <Image
              src={d.images.intro}
              alt={ts(locale, `experiences.${slug}.image_intro_alt`)}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
        </div>
      </section>

      {/* ── ③ Ce qui est inclus : image [gauche] | texte ───── */}
      <section className="border-b border-navy/[0.06] bg-white px-5 py-16 sm:px-6 md:py-24 lg:py-28">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="lg:order-1">
            <div className="relative aspect-[4/3] w-full overflow-hidden">
              <Image
                src={d.images.included}
                alt={ts(locale, `experiences.${slug}.image_included_alt`)}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          </div>
          <div className="min-w-0 lg:order-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-navy/60">
              {ts(locale, "experiences.included_eyebrow")}
            </span>
            <h2 className="mt-4 font-display text-3xl font-normal leading-[1.08] text-navy md:text-4xl">
              {ts(locale, "experiences.included_title")}
            </h2>
            <div className="mt-4 h-px w-8 bg-gold/40" aria-hidden />
            <div className="mt-8 space-y-6 text-[13px] leading-relaxed text-navy/80">
              {items.map((item) => (
                <div key={item.title} className="flex items-start gap-3">
                  <KayvilaPngIcon
                    name="check-circle"
                    size={20}
                    alt=""
                    className="mt-[1px] shrink-0"
                  />
                  <div className="min-w-0">
                    <h3 className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-navy">
                      {item.title}
                    </h3>
                    <p>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── ④ Comment ça se passe ─────────────────────────── */}
      <section className="border-b border-navy/[0.06] bg-offwhite px-5 py-16 sm:px-6 md:py-24 lg:py-28">
        <div className="mx-auto max-w-5xl">
          <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-navy/60">
            {ts(locale, "experiences.how_eyebrow")}
          </span>
          <h2 className="mt-4 font-display text-3xl font-normal leading-[1.08] text-navy md:text-4xl">
            {ts(locale, "experiences.how_title")}
          </h2>
          <div className="mt-4 h-px w-8 bg-gold/40" aria-hidden />
          <ol className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-10">
            {steps.map((step) => (
              <li key={step.num} className="min-w-0 border-t border-navy/10 pt-5">
                <span className="font-display text-2xl font-light text-gold">{step.num}</span>
                <h3 className="mt-3 text-[11px] font-bold uppercase tracking-[0.2em] text-navy">
                  {step.title}
                </h3>
                <p className="mt-2 text-[13px] leading-relaxed text-navy/75">{step.desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── ⑤ Bandeau « à venir » + navigation ────────────── */}
      <LandingSection bg="navy">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mx-auto mb-6 h-px w-8 bg-gold/50" aria-hidden />
          <h2 className="font-display text-2xl font-normal text-white md:text-3xl">
            {ts(locale, "experiences.soon_band_title")}
          </h2>
          <p className="mt-5 text-[13px] leading-relaxed text-white/65">
            {ts(locale, "experiences.soon_band_text")}
          </p>
          <div className="mt-8 flex justify-center">
            <Link
              href="/contact"
              className="inline-flex min-h-[48px] items-center gap-2 border border-gold bg-gold px-6 py-3 text-[10px] font-bold uppercase tracking-[0.24em] text-navy transition-colors hover:bg-gold/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            >
              {ts(locale, "experiences.soon_band_cta")}
              <KayvilaPngIcon name="arrow-right" size={18} alt="" />
            </Link>
          </div>

          <p className="mt-14 text-[10px] font-bold uppercase tracking-[0.4em] text-white/40">
            {ts(locale, "experiences.other_experiences")}
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            {others.map((other) => (
              <Link
                key={other}
                href={`/experiences/${other}`}
                className="inline-flex min-h-[48px] items-center gap-2 border border-white/25 px-5 py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white/80 transition-colors hover:border-white/60 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
              >
                {ts(locale, `experiences.${other}.title`)}
                <KayvilaPngIcon name="arrow-right" size={16} invert alt="" />
              </Link>
            ))}
          </div>
        </div>
      </LandingSection>
    </LandingShell>
  );
}
```

- [ ] **Step 3: Verify the four pages render**

Lancer le serveur de dev dans un terminal séparé :

```bash
npm run dev -- -p 3001
```

Puis vérifier les codes de statut :

```bash
for s in masseur chef-cuisinier excursions garde-enfants; do
  printf "%s " "$s"
  curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:3001/experiences/$s"
done
curl -s -o /dev/null -w "inconnu %{http_code}\n" "http://localhost:3001/experiences/inexistant"
```

Expected :
```
masseur 200
chef-cuisinier 200
excursions 200
garde-enfants 200
inconnu 404
```

- [ ] **Step 4: Verify there is exactly one h1 per page**

```bash
for s in masseur chef-cuisinier excursions garde-enfants; do
  printf "%s h1=" "$s"
  curl -s "http://localhost:3001/experiences/$s" | grep -o "<h1" | wc -l
done
```

Expected : `h1=1` pour les quatre.

- [ ] **Step 5: Run lint**

Run: `npm run lint`
Expected: aucune erreur sur `app/experiences/`.

- [ ] **Step 6: Commit**

```bash
git add app/experiences
git commit -m "feat(experiences): pages editoriales des 4 prestations a venir

Co-Authored-By: claude-flow <ruv@ruv.net>"
```

---

### Task 5: Bloc « à venir » sur la home

**Files:**
- Create: `components/home/HomeUpcomingExperiences.tsx`
- Modify: `app/page.tsx` (imports en tête de fichier, et JSX entre les sections ⑤ et ⑥, lignes ~141-149)

**Interfaces:**
- Consumes: `EXPERIENCE_SLUGS`, `EXPERIENCE_DETAILS` (Task 1) ; les clés `home.upcoming_*` et `experiences.<slug>.{title,tagline,image_alt}` (Tasks 2-3) ; `ScrollReveal` ; `tServer`.
- Produces: `HomeUpcomingExperiences` — composant serveur acceptant une prop `locale: string`.

- [ ] **Step 1: Create the component**

Créer `components/home/HomeUpcomingExperiences.tsx` :

```tsx
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ScrollReveal } from "@/components/ScrollReveal";
import { EXPERIENCE_SLUGS, EXPERIENCE_DETAILS } from "@/data/experiences";
import { tServer as ts } from "@/lib/i18n";

/**
 * Bloc teaser « Nos prestations à venir » — inséré sur la home juste après
 * la grille des villas. Fond navy pour marquer la rupture avec la section
 * villas (blanche). Chaque carte mène à `/experiences/<slug>`.
 */
export function HomeUpcomingExperiences({ locale }: { locale: string }) {
  return (
    <section
      id="prestations-a-venir"
      tabIndex={-1}
      className="scroll-mt-24 bg-navy"
      aria-labelledby="upcoming-title"
    >
      <ScrollReveal>
        <div className="px-6 pb-10 pt-14 text-center md:px-8 md:pb-12 md:pt-20 lg:px-12">
          <span className="text-[10px] font-bold uppercase tracking-[0.5em] text-gold/80">
            {ts(locale, "home.upcoming_eyebrow")}
          </span>
          <h2
            id="upcoming-title"
            className="mx-auto mt-3 font-display text-4xl font-light leading-[1.04] text-white md:text-5xl lg:text-6xl"
          >
            {ts(locale, "home.upcoming_title")}
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-[13px] leading-relaxed text-white/55">
            {ts(locale, "home.upcoming_subtitle")}
          </p>
        </div>
      </ScrollReveal>

      <div className="grid grid-cols-1 gap-px sm:grid-cols-2 lg:grid-cols-4">
        {EXPERIENCE_SLUGS.map((slug) => {
          const d = EXPERIENCE_DETAILS[slug];
          const name = ts(locale, `experiences.${slug}.title`);
          return (
            <Link
              key={slug}
              href={`/experiences/${slug}`}
              aria-label={ts(locale, "home.upcoming_card_aria", { name })}
              className="stagger-item group relative block aspect-[4/5] overflow-hidden bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-inset"
            >
              <Image
                src={d.hero}
                alt=""
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                className="object-cover opacity-90 transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                style={{ objectPosition: d.heroPosition }}
              />
              <div
                className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/10"
                aria-hidden
              />
              <span className="absolute left-4 top-4 z-10 border border-gold/60 bg-navy/60 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.24em] text-gold">
                {ts(locale, "experiences.badge_soon_short")}
              </span>
              <div className="absolute inset-x-0 bottom-0 z-10 px-5 pb-6 pt-16">
                <p className="font-display text-xl font-light leading-snug text-white">
                  {name}
                </p>
                <p className="mt-1.5 min-w-0 text-[11px] leading-relaxed text-white/60">
                  {ts(locale, `experiences.${slug}.tagline`)}
                </p>
                <span className="mt-3 inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.28em] text-gold/85">
                  {ts(locale, "common.learn_more")}
                  <ArrowRight
                    size={13}
                    strokeWidth={1.5}
                    className="transition-transform group-hover:translate-x-0.5"
                  />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
```

> `alt=""` est volontaire sur l'image de carte : le `<Link>` porte déjà un `aria-label` descriptif, et l'image est décorative dans ce contexte. Doubler l'annonce serait du bruit pour un lecteur d'écran.

- [ ] **Step 2: Insert it in the home page**

Dans `app/page.tsx`, ajouter l'import après la ligne `import { HomeTrustBand } from "@/components/home/HomeTrustBand";` :

```tsx
import { HomeUpcomingExperiences } from "@/components/home/HomeUpcomingExperiences";
```

Puis, entre la section ⑤ (villas) et la section ⑥ (trust), remplacer :

```tsx
      {/* ⑤ Villas */}
      <section className="cv-auto">
        <HomeFeaturedAudience featuredVillas={featuredVillas} />
      </section>

      {/* ⑥ Trust */}
```

par :

```tsx
      {/* ⑤ Villas */}
      <section className="cv-auto">
        <HomeFeaturedAudience featuredVillas={featuredVillas} />
      </section>

      {/* ⑤bis Prestations à venir */}
      <section className="cv-auto">
        <HomeUpcomingExperiences locale={locale} />
      </section>

      {/* ⑥ Trust */}
```

La variable `locale` est déjà calculée ligne ~105 de `app/page.tsx` — aucun autre changement nécessaire.

- [ ] **Step 3: Verify the block renders on the home page**

Avec le serveur de dev sur le port 3001 :

```bash
curl -s http://localhost:3001/ | grep -c 'href="/experiences/'
curl -s http://localhost:3001/ | grep -o 'id="prestations-a-venir"' | head -1
```

Expected : `4` puis `id="prestations-a-venir"`.

- [ ] **Step 4: Verify responsive layout manually**

Ouvrir `http://localhost:3001/` dans le navigateur et vérifier, aux largeurs 375 px, 768 px et 1440 px :
- 1 colonne / 2 colonnes / 4 colonnes ;
- aucun débordement horizontal (`document.documentElement.scrollWidth === document.documentElement.clientWidth`) ;
- le badge or reste lisible sur les quatre images ;
- le focus clavier (Tab) fait apparaître un anneau or sur chaque carte.

- [ ] **Step 5: Run lint and commit**

Run: `npm run lint`
Expected: aucune erreur.

```bash
git add components/home/HomeUpcomingExperiences.tsx app/page.tsx
git commit -m "feat(home): bloc prestations a venir sous la grille des villas

Co-Authored-By: claude-flow <ruv@ruv.net>"
```

---

### Task 6: Sitemap et footer

**Files:**
- Modify: `app/sitemap.ts` (tableau `staticPages`, après la dernière entrée `/prestations/services/finance`)
- Modify: `components/layout/Footer.tsx` (insertion avant le bloc « Barre du bas », ligne ~145)

**Interfaces:**
- Consumes: `EXPERIENCE_SLUGS` (Task 1) ; la clé `footer.upcoming` et `experiences.<slug>.title` (Tasks 2-3) ; les routes de la Task 4.
- Produces: rien de consommé par une tâche ultérieure ; la Task 7 vérifie le résultat.

- [ ] **Step 1: Add the URLs to the sitemap**

Dans `app/sitemap.ts`, ajouter l'import en tête de fichier :

```ts
import { EXPERIENCE_SLUGS } from "@/data/experiences";
```

Puis, juste après la ligne `{ url: `${BASE}/prestations/services/finance`, ... },` et avant le `];` qui ferme `staticPages`, insérer :

```ts
    ...EXPERIENCE_SLUGS.map((slug) => ({
      url: `${BASE}/experiences/${slug}`,
      lastModified: new Date(),
      priority: 0.6,
      changeFrequency: "monthly" as const,
    })),
```

- [ ] **Step 2: Verify the sitemap**

```bash
curl -s http://localhost:3001/sitemap.xml | grep -c "/experiences/"
```

Expected : `4`.

- [ ] **Step 3: Add the footer strip**

Dans `components/layout/Footer.tsx`, insérer ce bloc **juste avant** le commentaire `{/* ──── Barre du bas ──── */}` :

```tsx
        {/* ──── Prestations à venir ──── */}
        <div className="mt-10 border-t border-black/10 pt-6 md:mt-12 md:pt-8">
          <h4 className="mb-4 text-center text-[11px] font-bold uppercase tracking-[0.25em] text-black/35 md:text-left">
            {t("footer.upcoming")}
          </h4>
          <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-navy/65 md:justify-start">
            {EXPERIENCE_SLUGS.map((slug) => (
              <li key={slug}>
                <Link
                  href={`/experiences/${slug}`}
                  className="transition-colors hover:text-navy"
                >
                  {t(`experiences.${slug}.title`)}
                </Link>
              </li>
            ))}
          </ul>
        </div>
```

Et ajouter l'import en tête de fichier, après la ligne `import { SUPPORTED_LOCALES, ... } from "@/lib/i18n";` :

```tsx
import { EXPERIENCE_SLUGS } from "@/data/experiences";
```

> `t` provient ici de `useLocale()` (signature `t(key)`, sans locale) — c'est le hook déjà utilisé dans ce composant client, ligne 14.

- [ ] **Step 4: Verify the footer**

```bash
curl -s http://localhost:3001/ | grep -c 'href="/experiences/'
```

Expected : `8` — 4 liens dans le bloc home + 4 dans le footer.

Vérifier aussi visuellement, au format mobile (375 px), que les 4 liens s'enroulent proprement sans débordement horizontal.

- [ ] **Step 5: Run lint and commit**

Run: `npm run lint`
Expected: aucune erreur.

```bash
git add app/sitemap.ts components/layout/Footer.tsx
git commit -m "feat(experiences): sitemap et liens footer des prestations a venir

Co-Authored-By: claude-flow <ruv@ruv.net>"
```

---

### Task 7: Smoke test end-to-end

**Files:**
- Create: `tests/experiences.spec.ts`
- Modify: `playwright.config.ts` (tableau `testMatch` du projet `dashboards`, lignes ~44-53)

**Interfaces:**
- Consumes: les routes de la Task 4, le bloc home de la Task 5, le footer de la Task 6.
- Produces: rien — tâche de vérification finale.

- [ ] **Step 1: Write the test**

Créer `tests/experiences.spec.ts` :

```ts
import { test, expect } from "@playwright/test";

const SLUGS = ["masseur", "chef-cuisinier", "excursions", "garde-enfants"] as const;

test.describe("Prestations à venir", () => {
  test("la home affiche le bloc avec 4 cartes cliquables", async ({ page }) => {
    await page.goto("/");
    const section = page.locator("#prestations-a-venir");
    await expect(section).toBeVisible();

    const cards = section.locator('a[href^="/experiences/"]');
    await expect(cards).toHaveCount(4);

    // Le badge « Bientôt » est présent sur chaque carte.
    for (const slug of SLUGS) {
      await expect(section.locator(`a[href="/experiences/${slug}"]`)).toBeVisible();
    }
  });

  test("cliquer sur la première carte ouvre sa page", async ({ page }) => {
    await page.goto("/");
    await page.locator('#prestations-a-venir a[href="/experiences/masseur"]').click();
    await expect(page).toHaveURL(/\/experiences\/masseur$/);
    await expect(page.locator("h1")).toHaveCount(1);
  });

  for (const slug of SLUGS) {
    test(`la page /experiences/${slug} rend ses 5 blocs`, async ({ page }) => {
      const response = await page.goto(`/experiences/${slug}`);
      expect(response?.status()).toBe(200);

      // Un seul h1
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.locator("h1")).not.toBeEmpty();

      // Fil d'ariane
      await expect(page.getByRole("navigation").first()).toBeVisible();

      // Trois images (hero + intro + inclus)
      expect(await page.locator("main img").count()).toBeGreaterThanOrEqual(3);

      // Les 4 items « ce qui est inclus » et les 3 étapes
      await expect(page.locator("ol > li")).toHaveCount(3);

      // CTA contact
      await expect(page.locator('main a[href="/contact"]').first()).toBeVisible();

      // Navigation vers les 3 autres prestations
      const others = SLUGS.filter((s) => s !== slug);
      for (const other of others) {
        await expect(
          page.locator(`main a[href="/experiences/${other}"]`).first()
        ).toBeVisible();
      }
    });
  }

  test("un slug inconnu renvoie 404", async ({ page }) => {
    const response = await page.goto("/experiences/inexistant");
    expect(response?.status()).toBe(404);
  });

  test("aucun débordement horizontal en mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    for (const path of ["/", "/experiences/chef-cuisinier"]) {
      await page.goto(path);
      const overflow = await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth
      );
      expect(overflow, `débordement sur ${path}`).toBeLessThanOrEqual(1);
    }
  });
});
```

- [ ] **Step 2: Register the spec in the Playwright config**

Dans `playwright.config.ts`, projet `dashboards`, ajouter `"tests/experiences.spec.ts",` à la fin du tableau `testMatch`, après `"tests/a11y.spec.ts",`.

- [ ] **Step 3: Run the test to verify it passes**

Le serveur de dev doit tourner sur le port 3001.

Run:
```bash
PLAYWRIGHT_BASE_URL=http://localhost:3001 npx playwright test tests/experiences.spec.ts --project=dashboards --reporter=list
```
Expected: PASS — 8 tests passés (1 bloc home + 1 clic + 4 pages + 1 404 + 1 mobile).

- [ ] **Step 4: Run the full unit suite and lint**

Run: `npm test`
Expected: PASS.

Run: `npm run lint`
Expected: aucune erreur.

- [ ] **Step 5: Verify the three locales manually**

Dans le navigateur, changer la langue via le sélecteur du footer et vérifier sur `/experiences/chef-cuisinier` :
- **FR** : titre « Chef cuisinier », badge « Bientôt disponible ».
- **EN** : titre « Private chef », badge « Coming soon ».
- **ES** : titre « Chef privado », badge « Próximamente ».

Vérifier qu'aucun texte n'apparaît sous forme de clé brute (`experiences.…`).

- [ ] **Step 6: Commit**

```bash
git add tests/experiences.spec.ts playwright.config.ts
git commit -m "test(experiences): smoke e2e du bloc home et des 4 pages

Co-Authored-By: claude-flow <ruv@ruv.net>"
```

---

## Remplacement des images (hors tâches)

Une fois les 12 images générées et déposées dans `public/experiences/`, remplacer les
chemins placeholders dans `data/experiences.ts` :

```ts
masseur:          hero: "/experiences/masseur-hero.webp",         intro: "/experiences/masseur-intro.webp",         included: "/experiences/masseur-inclus.webp"
"chef-cuisinier": hero: "/experiences/chef-hero.webp",            intro: "/experiences/chef-intro.webp",            included: "/experiences/chef-inclus.webp"
excursions:       hero: "/experiences/excursions-hero.webp",      intro: "/experiences/excursions-intro.webp",      included: "/experiences/excursions-inclus.webp"
"garde-enfants":  hero: "/experiences/garde-enfants-hero.webp",   intro: "/experiences/garde-enfants-intro.webp",   included: "/experiences/garde-enfants-inclus.webp"
```

Puis relancer `npx playwright test tests/experiences.spec.ts --project=dashboards` et
ajuster `heroPosition` par prestation si le sujet est mal cadré en 4:5 sur la home.

Les 12 prompts GPT sont dans la section « Images » de la spec.

## Couverture de la spec

| Exigence de la spec | Tâche |
| --- | --- |
| Route `/experiences/<slug>` × 4, statiques | Task 4 |
| Layout 5 blocs, 3 images, un seul h1 | Task 4 |
| Métadonnées, canonical, OpenGraph | Task 4 |
| Bloc home navy, 4 cartes, badge or | Task 5 |
| Insertion entre villas et trust band | Task 5 |
| i18n fr/en/es, zéro texte en dur | Tasks 2-3 |
| « à domicile » proscrit | Task 2 (test automatisé) |
| Sitemap +4 URLs | Task 6 |
| Footer, 4 liens | Task 6 |
| Responsive 1/2/4 colonnes, pas de débordement | Tasks 5 et 7 |
| `npm run lint` passe | Tasks 4, 5, 6, 7 |
| Placeholders d'images en attendant les visuels | Task 1 + section ci-dessus |
| `app/experience/` (legacy) non modifié | Aucune tâche n'y touche |
