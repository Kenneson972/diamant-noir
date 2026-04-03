# Landing Propriétaires `/proprietaires` — Spec

**Objectif :** Créer une page dédiée aux propriétaires à l'URL `/proprietaires`, accessible depuis "Confier ma villa" et la navbar. La page reprend l'ADN visuel de la homepage (même hero vidéo, même structure) avec des textes orientés propriétaires et un contenu autonome complet (formule, inclusions, CTA soumission).

---

## Principe directeur

La page `/proprietaires` n'est **pas** une landing générique — c'est une "homepage pour propriétaires". Le hero est identique visuellement à la homepage (vidéo `hero.webm`, même overlay, même disposition) mais avec des textes et CTAs orientés propriétaires. La homepage (`/`) n'est **pas modifiée** structurellement — seuls les `href` pointant vers `#proprietaires` sont mis à jour vers `/proprietaires`.

---

## Fichiers à créer / modifier

| Fichier | Action | Description |
|---------|--------|-------------|
| `lib/proprietaires-data.ts` | Créer | Constantes partagées : `INCLUSIONS`, `PACK_ITEMS`, témoignage |
| `app/proprietaires/page.tsx` | Créer | Page principale, Server Component |
| `components/layout/Navbar.tsx` | Modifier | Ligne 19 : `/?pour=proprietaire` → `/proprietaires` |
| `app/page.tsx` | Modifier | Lignes ~126 et ~351 : `href="#proprietaires"` → `href="/proprietaires"` |

**`HomeAudienceScroll.tsx` : inchangé.** Le paramètre `?pour=proprietaire` est désormais du legacy (aucun lien du site ne le génère après les mises à jour navbar/page.tsx). Le scroll vers `#proprietaires` sur la homepage reste fonctionnel pour d'éventuels bookmarks ou liens externes existants — comportement acceptable, pas de redirection active.

> **Doublon contenu :** la section `#proprietaires` reste sur `/` (hors périmètre). Un propriétaire arrivant par `/proprietaires` ne la voit pas. Un voyageur scrollant la homepage la voit — allègement envisageable dans une passe ultérieure.

---

## Données partagées — `lib/proprietaires-data.ts`

Extraire depuis `app/prestations/page.tsx` pour éviter que les deux pages divergent :

```ts
export const INCLUSIONS = [
  "Estimation de valeur locative",
  "Check-in / Check-out",
  "Prise de photos professionnelles",
  "Rédaction et diffusion d'annonces de location sur différentes plateformes ou optimisation d'une annonce existante par notre conciergerie",
  "Contrôles qualité",
  "Pilotage des réservations",
  "Échanges avec les locataires",
  "Organisation des ménages, de petites réparations et suivi des différents intervenants",
  "Entretien et mise en place du linge de maison",
  "Réassort des consommables de bienvenue (à nos frais)",
  "Encaissement et reversement des loyers",
  "Suivi des commentaires et valorisation de ceux-ci",
  "Gestion dynamique des prix",
] as const;

export const TEMOIGNAGE_PROPRIO = {
  quote:
    "Au-delà de la location, c'est un partenaire qui sécurise le bien, les réservations et la relation voyageurs. Une vraie tranquillité pour un propriétaire exigeant.",
  author: "M. R.",
  place: "Propriétaire — Sud Martinique",
};
```

`app/prestations/page.tsx` doit importer `INCLUSIONS` depuis ce fichier (supprimer la constante locale).

> **Note légale :** les mentions « 20 % TTC », « montant net des nuitées collectées » et les exemptions (ménage, blanchisserie) doivent être validées par rapport au contrat / offre commerciale réelle avant mise en production pour éviter tout écart publicitaire ou juridique.

---

## Structure de `app/proprietaires/page.tsx`

Server Component pur. Pas de `"use client"`. 6 sections dans l'ordre :

### Section 1 — Hero vidéo (même markup que homepage)

Reprend exactement le markup du hero de `app/page.tsx` (section vidéo + overlay + logo) avec ces différences de texte :

```tsx
// Eyebrow
"Programme propriétaires · Martinique"   // remplace "Martinique · Collection privée"

// Sous-titre
"Confiez votre villa à une conciergerie d'exception. Visibilité, revenus, sérénité."
// remplace "Une même page pour les voyageurs..."

// CTA card 1 (gold accent : border-gold/55, bg-gold/10)
eyebrow : "Première étape"
label   : "Soumettre ma villa"
href    : "/soumettre-ma-villa"   // Link, pas <a>

// CTA card 2 (blanc/neutre)
eyebrow : "Déjà partenaire"
label   : "Espace propriétaire"
href    : "/login?redirect=/dashboard/proprio"
```

Pas de `BookingSearchBar`. Pas de `HomeAudienceScroll`. Pas de `id="reserver-un-sejour"`.

`<h1 className="sr-only">` = `"Diamant Noir — Programme propriétaires, Martinique"`

### Section 2 — Pourquoi Diamant Noir

Fond : `offwhite`. Composants : `LandingSection bg="offwhite"` + `LandingBlockTitle`.

```
eyebrow    : "Programme propriétaires"
title      : "Pourquoi confier votre villa à Diamant Noir ?"
sous-titre : "Mise en avant premium, conciergerie exigeante et gestion complète pour protéger votre bien tout en maximisant ses performances."
```

3 arguments en grille `sm:grid-cols-3` (même contenu que `app/page.tsx#proprietaires`) :
- `TrendingUp` → Visibilité & revenue
- `Headphones` → Conciergerie 24/7
- `Building2` → Sérénité propriétaire

### Section 3 — Bandeau 20%

Composant : `EditorialFigureBand` (depuis `components/marketing/editorial-blocks.tsx`) :
```tsx
label="Transparence"
figure="20%"
caption="TTC sur le montant net des nuitées collectées — frais de ménage et blanchisserie facturés aux voyageurs, hors commission."
```

### Section 4 — Inclusions + Pack démarrage

Fond : `white`. Composant : `LandingSection bg="white"`.

**Inclusions** : `LandingBlockTitle eyebrow="Gestion complète" title="Inclus dans la formule"` + grille 2 colonnes des 13 items de `INCLUSIONS` (importé depuis `lib/proprietaires-data.ts`) avec icône `Check` gold.

**Pack de démarrage** : encadré `border border-navy/10 bg-offwhite/40 px-8 py-10` :
```
eyebrow : "Première location · En supplément"
texte   : "Un pack de démarrage vous sera facturé (sucre, café, eau, poivre, huile, épices, papier toilette, savon, boîte à clefs, inventaire)."
```

### Section 5 — Témoignage propriétaire

Composant : `EditorialQuotes` (depuis `components/marketing/editorial-blocks.tsx`) avec `[TEMOIGNAGE_PROPRIO]` importé depuis `lib/proprietaires-data.ts`.

### Section 6 — CTA final

Fond : `white`. Composants : `LandingSection bg="white"` + `LandingCtaBand`.

```
title           : "Prêt à confier votre villa ?"
CTA principal   : "Soumettre ma villa" → /soumettre-ma-villa  (btn-luxury bg-black text-white)
Lien discret    : "Une question ? Contactez-nous" → /contact
```

---

## Metadata SEO

```tsx
export const metadata: Metadata = {
  title: "Programme propriétaires — Confiez votre villa | Diamant Noir",
  description:
    "Confiez votre villa en Martinique à Diamant Noir : commission 20 % TTC, gestion complète clé en main, conciergerie 24/7. Soumettre votre bien pour rejoindre notre collection.",
  openGraph: {
    title: "Programme propriétaires — Diamant Noir",
    description:
      "Confiez votre villa en Martinique. Commission 20 % TTC, gestion complète, conciergerie d'exception.",
    // Pas d'url en dur — hérite de metadataBase défini dans app/layout.tsx
  },
};
```

> **Pattern `metadataBase` :** ne pas coder l'URL en dur. Vérifier que `app/layout.tsx` définit `metadataBase` (ex. `new URL(process.env.NEXT_PUBLIC_BASE_URL ?? 'https://diamantnoir.fr')`). Si absent, l'ajouter dans le layout racine plutôt que dans cette page.

---

## Sitemap

Vérifier si `app/sitemap.ts` existe. Si oui, ajouter l'entrée :
```ts
{ url: `${base}/proprietaires`, lastModified: new Date(), priority: 0.8 }
```
Si `sitemap.ts` n'existe pas, le créer avec les URLs principales du site (priorité hors périmètre de cette spec — créer le fichier minimal avec `/`, `/villas`, `/proprietaires`, `/soumettre-ma-villa`).

---

## Mises à jour navigation

### `Navbar.tsx` — `NAV_ITEMS` (ligne ~19)
```ts
// Avant
{ href: "/?pour=proprietaire", label: "Propriétaires" }
// Après
{ href: "/proprietaires", label: "Propriétaires" }
```

### `app/page.tsx` — hero card propriétaires (ligne ~126)
```tsx
// Avant : <a href="#proprietaires" ...>
// Après : <Link href="/proprietaires" ...>
```

### `app/page.tsx` — section CTA bottom (ligne ~351)
```tsx
// Avant : href="#proprietaires"
// Après : href="/proprietaires"
```

### `app/prestations/page.tsx` — import INCLUSIONS
```ts
// Avant : const INCLUSIONS = [...] défini localement
// Après : import { INCLUSIONS } from "@/lib/proprietaires-data"
```

---

## Ce qui NE change PAS

- La section `<section id="proprietaires">` de `app/page.tsx` : contenu et style inchangés
- `HomeAudienceScroll.tsx` : inchangé (`?pour=proprietaire` = legacy toléré)
- `app/soumettre-ma-villa/page.tsx` : aucun changement

---

## Accessibilité

- `<h1 className="sr-only">` dans le hero
- CTA cards : `focus-visible:ring-2 focus-visible:ring-white/75`
- Touch targets ≥ 44px sur tous les boutons (`Link`, `a`)
- `aria-hidden` sur les icônes décoratives

---

## Vérification post-implémentation

```
/ → clic "Confier ma villa" (hero card) → /proprietaires ✓
/ → clic "Confier ma villa" (section bottom) → /proprietaires ✓
Navbar → clic "Propriétaires" → /proprietaires ✓
/proprietaires → clic "Soumettre ma villa" → /soumettre-ma-villa ✓
/proprietaires → clic "Espace propriétaire" → /login?redirect=/dashboard/proprio ✓
/prestations → inclusions identiques à /proprietaires (même source) ✓
npm run build → aucune erreur TypeScript ✓
```
