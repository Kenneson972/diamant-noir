# Landing Propriétaires `/proprietaires` Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Créer `app/proprietaires/page.tsx` (homepage-style pour les propriétaires) + module de données partagées + 3 mises à jour de navigation.

**Architecture:** Page Server Component qui clone le hero de la homepage avec textes propriétaires, puis enchaîne 5 sections (Pourquoi DN, 20% TTC, Inclusions, Témoignage, CTA) en réutilisant les composants `LandingSection`, `LandingBlockTitle`, `EditorialFigureBand`, `LandingCtaBand` depuis `components/marketing/`. Les constantes `INCLUSIONS` sont extraites dans `lib/proprietaires-data.ts` et importées depuis `app/prestations/page.tsx` et la nouvelle page.

**Tech Stack:** Next.js 15 App Router, TypeScript, Tailwind CSS 3.4, composants marketing existants (`components/marketing/landing-sections.tsx`, `components/marketing/editorial-blocks.tsx`), Lucide icons.

**⚠️ Avertissements :**
- `EditorialQuotes` a `bg-navy` — NE PAS l'utiliser. Le témoignage est inline dans la section 5.
- `EditorialFigureBand` a `bg-offwhite` — OK.
- `app/layout.tsx` n'a pas de `metadataBase` — NE PAS ajouter `openGraph.url` dans les metadata de la page.

---

## Fichiers concernés

| Fichier | Action |
|---------|--------|
| `lib/proprietaires-data.ts` | Créer — données partagées (INCLUSIONS, témoignage) |
| `app/prestations/page.tsx` | Modifier — importer INCLUSIONS depuis lib |
| `app/proprietaires/page.tsx` | Créer — page principale (Server Component) |
| `components/layout/Navbar.tsx` | Modifier — ligne 19, href proprietaire |
| `app/page.tsx` | Modifier — 2 hrefs #proprietaires → /proprietaires |
| `app/sitemap.ts` | Créer — sitemap minimal |

---

## Task 1 — Module de données partagées

**Files:**
- Create: `lib/proprietaires-data.ts`
- Modify: `app/prestations/page.tsx`

- [ ] **Step 1 — Créer `lib/proprietaires-data.ts`**

```ts
// lib/proprietaires-data.ts
import type { EditorialQuote } from "@/components/marketing/editorial-blocks";

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

export const MID_INCLUSIONS = Math.ceil(INCLUSIONS.length / 2);
export const INCLUSIONS_COL_A = INCLUSIONS.slice(0, MID_INCLUSIONS);
export const INCLUSIONS_COL_B = INCLUSIONS.slice(MID_INCLUSIONS);

export const TEMOIGNAGE_PROPRIO: EditorialQuote = {
  quote:
    "Au-delà de la location, c'est un partenaire qui sécurise le bien, les réservations et la relation voyageurs. Une vraie tranquillité pour un propriétaire exigeant.",
  author: "M. R.",
  place: "Propriétaire — Sud Martinique",
};
```

- [ ] **Step 2 — Mettre à jour `app/prestations/page.tsx` pour importer depuis lib**

Remplacer les lignes 33–51 (constante locale `INCLUSIONS` + `MID` + `COL_A` + `COL_B`) par :

```tsx
import {
  INCLUSIONS_COL_A,
  INCLUSIONS_COL_B,
} from "@/lib/proprietaires-data";
```

Supprimer les 4 lignes :
```ts
// À SUPPRIMER dans app/prestations/page.tsx
const INCLUSIONS = [...] as const;
const MID = Math.ceil(INCLUSIONS.length / 2);
const COL_A = INCLUSIONS.slice(0, MID);
const COL_B = INCLUSIONS.slice(MID);
```

Dans le JSX de `app/prestations/page.tsx`, remplacer `COL_A` → `INCLUSIONS_COL_A` et `COL_B` → `INCLUSIONS_COL_B`.

- [ ] **Step 3 — Vérifier types TypeScript**

```bash
cd "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/DIAMANTNOIR/diamant-noir"
npx tsc --noEmit 2>&1 | head -30
```

Expected: aucune erreur. Si erreur sur `EditorialQuote` import circulaire, déplacer le type dans `lib/proprietaires-data.ts` directement :

```ts
// Alternative si import circulaire :
export type EditorialQuote = { quote: string; author: string; place: string };
// (supprimer l'import depuis editorial-blocks)
```

- [ ] **Step 4 — Commit**

```bash
cd "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/DIAMANTNOIR/diamant-noir"
git add lib/proprietaires-data.ts app/prestations/page.tsx
git commit -m "refactor: extract INCLUSIONS to lib/proprietaires-data for sharing"
```

---

## Task 2 — Page `/proprietaires` — Hero + sections 2–4

**Files:**
- Create: `app/proprietaires/page.tsx`

- [ ] **Step 1 — Créer `app/proprietaires/page.tsx` avec le hero**

```tsx
// app/proprietaires/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Check,
  Headphones,
  TrendingUp,
} from "lucide-react";
import { BrandLogo } from "@/components/layout/BrandLogo";
import {
  LandingSection,
  LandingBlockTitle,
  LandingCtaBand,
} from "@/components/marketing/landing-sections";
import {
  EditorialFigureBand,
} from "@/components/marketing/editorial-blocks";
import {
  INCLUSIONS_COL_A,
  INCLUSIONS_COL_B,
  TEMOIGNAGE_PROPRIO,
} from "@/lib/proprietaires-data";

export const metadata: Metadata = {
  title: "Programme propriétaires — Confiez votre villa | Diamant Noir",
  description:
    "Confiez votre villa en Martinique à Diamant Noir : commission 20 % TTC, gestion complète clé en main, conciergerie 24/7. Soumettre votre bien pour rejoindre notre collection.",
};

export default function ProprietairesPage() {
  return (
    <main className="min-h-screen bg-offwhite">
      {/* ─── Section 1 : Hero vidéo ─── */}
      <section
        className="relative flex min-h-[min(72vh,720px)] w-full flex-col justify-center overflow-hidden bg-black py-24 pt-28 md:min-h-[min(68vh,680px)] md:py-20 md:pt-24"
        aria-labelledby="proprio-hero-title"
      >
        <h1 id="proprio-hero-title" className="sr-only">
          Diamant Noir — Programme propriétaires, Martinique
        </h1>
        <video
          autoPlay
          muted
          loop
          playsInline
          poster="/villa-hero.jpg"
          className="absolute inset-0 h-full w-full object-cover opacity-70"
        >
          <source src="/hero.webm" type="video/webm" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/25 to-black/80" />

        <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-col items-center px-5 text-center sm:px-6">
          <div className="w-full space-y-4 md:space-y-5">
            <div className="flex justify-center animate-in fade-in duration-700">
              <BrandLogo
                variant="onDark"
                size="hero"
                showWordmark={false}
                linkToHome={false}
                priority
              />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-[0.45em] text-gold/90 animate-in fade-in duration-700">
              Programme propriétaires · Martinique
            </p>
            <p className="mx-auto max-w-md text-sm leading-relaxed text-white/72 animate-in fade-in duration-700 delay-75 md:max-w-lg md:text-base">
              Confiez votre villa à une conciergerie d&apos;exception. Visibilité, revenus, sérénité.
            </p>

            <div className="mx-auto grid w-full max-w-xl animate-in gap-3 fade-in duration-700 delay-100 sm:grid-cols-2 sm:gap-4">
              <Link
                href="/soumettre-ma-villa"
                className="group flex min-h-[48px] flex-col items-start gap-0.5 rounded-none border border-gold/55 bg-gold/[0.12] px-4 py-3.5 text-left backdrop-blur-sm transition-colors hover:bg-gold/[0.20] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/75"
              >
                <span className="text-[8px] font-bold uppercase tracking-[0.28em] text-gold/80">
                  Première étape
                </span>
                <span className="flex w-full items-center justify-between gap-2 font-display text-lg text-white md:text-xl">
                  Soumettre ma villa
                  <ArrowRight
                    className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5"
                    strokeWidth={1.25}
                    aria-hidden
                  />
                </span>
              </Link>
              <Link
                href="/login?redirect=/dashboard/proprio"
                className="group flex min-h-[48px] flex-col items-start gap-0.5 rounded-none border border-white/28 bg-white/[0.12] px-4 py-3.5 text-left backdrop-blur-sm transition-colors hover:bg-white/[0.18] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/75"
              >
                <span className="text-[8px] font-bold uppercase tracking-[0.28em] text-white/45">
                  Déjà partenaire
                </span>
                <span className="flex w-full items-center justify-between gap-2 font-display text-lg text-white md:text-xl">
                  Espace propriétaire
                  <ArrowRight
                    className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5"
                    strokeWidth={1.25}
                    aria-hidden
                  />
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Section 2 : Pourquoi Diamant Noir ─── */}
      <LandingSection bg="offwhite">
        <LandingBlockTitle
          eyebrow="Programme propriétaires"
          title="Pourquoi confier votre villa à Diamant Noir ?"
        />
        <p className="-mt-4 mb-14 max-w-2xl text-sm leading-relaxed text-navy/65 md:text-[15px]">
          Mise en avant premium, conciergerie exigeante et gestion complète pour protéger votre bien
          tout en maximisant ses performances.
        </p>
        <ul className="grid gap-10 sm:grid-cols-3">
          <li className="space-y-3">
            <TrendingUp className="text-gold/80" size={22} strokeWidth={1.25} aria-hidden />
            <h3 className="text-xs font-bold uppercase tracking-[0.22em] text-navy">
              Visibilité &amp; revenue
            </h3>
            <p className="text-sm leading-relaxed text-navy/55">
              Positionnement luxe, pricing et diffusion alignés sur une clientèle haut de gamme.
            </p>
          </li>
          <li className="space-y-3">
            <Headphones className="text-gold/80" size={22} strokeWidth={1.25} aria-hidden />
            <h3 className="text-xs font-bold uppercase tracking-[0.22em] text-navy">
              Conciergerie 24/7
            </h3>
            <p className="text-sm leading-relaxed text-navy/55">
              Accueil, housekeeping, demandes voyageurs : une équipe dédiée sur le terrain.
            </p>
          </li>
          <li className="space-y-3">
            <Building2 className="text-gold/80" size={22} strokeWidth={1.25} aria-hidden />
            <h3 className="text-xs font-bold uppercase tracking-[0.22em] text-navy">
              Sérénité propriétaire
            </h3>
            <p className="text-sm leading-relaxed text-navy/55">
              Suivi transparent, standards élevés et relation de confiance sur la durée.
            </p>
          </li>
        </ul>
      </LandingSection>

      {/* ─── Section 3 : 20% TTC ─── */}
      <EditorialFigureBand
        label="Transparence"
        figure="20%"
        caption="TTC sur le montant net des nuitées collectées — frais de ménage et blanchisserie facturés aux voyageurs, hors commission."
      />

      {/* ─── Section 4 : Inclusions + Pack démarrage ─── */}
      <LandingSection bg="white">
        <LandingBlockTitle eyebrow="Gestion complète" title="Inclus dans la formule" />
        <p className="-mt-4 mb-12 max-w-2xl text-sm leading-relaxed text-navy/65 md:text-[15px]">
          Le périmètre contractuel que nous mettons en œuvre pour votre villa en gestion clé en main.
        </p>
        <div className="grid gap-10 md:grid-cols-2 md:gap-12 lg:gap-16">
          <ul className="space-y-4">
            {INCLUSIONS_COL_A.map((line) => (
              <li key={line} className="flex gap-3 text-sm text-navy/85 md:text-[15px]">
                <span className="mt-0.5 shrink-0 text-gold" aria-hidden>
                  <Check size={18} strokeWidth={1} />
                </span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
          <ul className="space-y-4">
            {INCLUSIONS_COL_B.map((line) => (
              <li key={line} className="flex gap-3 text-sm text-navy/85 md:text-[15px]">
                <span className="mt-0.5 shrink-0 text-gold" aria-hidden>
                  <Check size={18} strokeWidth={1} />
                </span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Pack démarrage */}
        <div className="mt-14 border border-navy/10 bg-offwhite/40 px-8 py-10 md:px-12">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.4em] text-navy/45">
            Première location · En supplément
          </p>
          <p className="text-sm leading-relaxed text-navy/75 md:text-[15px]">
            <span className="font-semibold text-navy">En supplément</span> — uniquement pour la{" "}
            <span className="font-semibold">première location</span> réalisée par notre conciergerie — un{" "}
            <span className="font-semibold">pack de démarrage</span> vous sera facturé (sucre, café, eau,
            poivre, huile, épices, papier toilette, savon, boîte à clefs, inventaire).
          </p>
        </div>
      </LandingSection>

      {/* ─── Section 5 : Témoignage propriétaire ─── */}
      <LandingSection bg="offwhite">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.45em] text-navy/40">
          Ils nous font confiance
        </p>
        <blockquote className="max-w-3xl border-t border-navy/10 pt-8">
          <p className="font-display text-xl leading-relaxed text-navy md:text-2xl">
            &ldquo;{TEMOIGNAGE_PROPRIO.quote}&rdquo;
          </p>
          <footer className="mt-6">
            <cite className="not-italic text-sm font-semibold text-navy">
              {TEMOIGNAGE_PROPRIO.author}
            </cite>
            <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-navy/45">
              {TEMOIGNAGE_PROPRIO.place}
            </p>
          </footer>
        </blockquote>
      </LandingSection>

      {/* ─── Section 6 : CTA final ─── */}
      <LandingSection bg="white">
        <LandingCtaBand title="Prêt à confier votre villa ?">
          <Link href="/soumettre-ma-villa" className="btn-luxury bg-black text-white">
            Soumettre ma villa
            <ArrowRight size={16} strokeWidth={1} aria-hidden />
          </Link>
          <p className="text-xs text-navy/45">
            Une question ?{" "}
            <Link href="/contact" className="font-medium text-navy underline-offset-4 hover:underline">
              Contactez-nous
            </Link>
          </p>
        </LandingCtaBand>
      </LandingSection>
    </main>
  );
}
```

- [ ] **Step 2 — Vérifier TypeScript**

```bash
cd "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/DIAMANTNOIR/diamant-noir"
npx tsc --noEmit 2>&1 | head -30
```

Expected: aucune erreur. Erreurs courantes :
- `BrandLogo` props `showWordmark` absent → vérifier les props acceptées dans `components/layout/BrandLogo.tsx` et adapter si besoin (utiliser `showIcon={false}` si c'est la prop correcte)
- `LandingCtaBand` ne prend pas `children` → ouvrir `components/marketing/landing-sections.tsx` et adapter le JSX en conséquence

- [ ] **Step 3 — Test manuel rapide**

```bash
cd "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/DIAMANTNOIR/diamant-noir"
npm run dev
```

Ouvrir http://localhost:3000/proprietaires. Vérifier :
- Hero vidéo visible avec textes propriétaires
- 2 CTA cards (Soumettre / Espace propriétaire)
- 5 sections s'enchaînent sans fond navy
- Les 2 CTAs fonctionnent (navigation correcte)

- [ ] **Step 4 — Commit**

```bash
cd "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/DIAMANTNOIR/diamant-noir"
git add app/proprietaires/page.tsx
git commit -m "feat: add /proprietaires landing page (hero + 5 sections)"
```

---

## Task 3 — Mises à jour navigation

**Files:**
- Modify: `components/layout/Navbar.tsx:19`
- Modify: `app/page.tsx:~126,~351`

- [ ] **Step 1 — Mettre à jour le lien Navbar**

Dans `components/layout/Navbar.tsx`, ligne 19, modifier `NAV_ITEMS` :

```ts
// Avant
{ href: "/?pour=proprietaire", label: "Propriétaires" },
// Après
{ href: "/proprietaires", label: "Propriétaires" },
```

- [ ] **Step 2 — Mettre à jour les hrefs dans `app/page.tsx`**

**Première occurrence (~ligne 125–126)** — hero card "Confier ma villa" :

```tsx
// Avant
<a
  href="#proprietaires"
  className="group flex min-h-[48px] flex-col items-start gap-0.5 ..."
>
// Après : changer <a href="#proprietaires"> en <Link href="/proprietaires">
// et fermer avec </Link> au lieu de </a>
```

Le composant `Link` est déjà importé dans `app/page.tsx`. Modifier uniquement le tag et le href.

**Deuxième occurrence (~ligne 350–352)** — section CTA bottom :

```tsx
// Avant
href="#proprietaires"
// Après
href="/proprietaires"
```

- [ ] **Step 3 — Vérifier TypeScript**

```bash
cd "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/DIAMANTNOIR/diamant-noir"
npx tsc --noEmit 2>&1 | head -20
```

Expected: aucune erreur.

- [ ] **Step 4 — Test manuel**

```bash
npm run dev
```

Vérifier :
- Navbar → clic "Propriétaires" → navigue vers `/proprietaires` (pas de scroll sur la homepage)
- Homepage → clic "Confier ma villa" (hero) → `/proprietaires`
- Homepage → clic "Confier ma villa" (section bas de page) → `/proprietaires`

- [ ] **Step 5 — Commit**

```bash
cd "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/DIAMANTNOIR/diamant-noir"
git add components/layout/Navbar.tsx app/page.tsx
git commit -m "feat: update proprietaire links to point to /proprietaires page"
```

---

## Task 4 — Sitemap

**Files:**
- Create: `app/sitemap.ts`

- [ ] **Step 1 — Créer `app/sitemap.ts`**

```ts
// app/sitemap.ts
import type { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") ?? "https://diamantnoir.fr";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${BASE}/`,                   lastModified: new Date(), priority: 1.0,  changeFrequency: "weekly" },
    { url: `${BASE}/villas`,             lastModified: new Date(), priority: 0.9,  changeFrequency: "daily"  },
    { url: `${BASE}/proprietaires`,      lastModified: new Date(), priority: 0.8,  changeFrequency: "monthly" },
    { url: `${BASE}/soumettre-ma-villa`, lastModified: new Date(), priority: 0.8,  changeFrequency: "monthly" },
    { url: `${BASE}/prestations`,        lastModified: new Date(), priority: 0.7,  changeFrequency: "monthly" },
    { url: `${BASE}/qui-sommes-nous`,    lastModified: new Date(), priority: 0.6,  changeFrequency: "yearly"  },
    { url: `${BASE}/contact`,            lastModified: new Date(), priority: 0.6,  changeFrequency: "yearly"  },
  ];
}
```

- [ ] **Step 2 — Vérifier TypeScript + build**

```bash
cd "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/DIAMANTNOIR/diamant-noir"
npx tsc --noEmit 2>&1 | head -20
```

Expected: aucune erreur.

- [ ] **Step 3 — Vérifier le sitemap en dev**

```bash
npm run dev
```

Ouvrir http://localhost:3000/sitemap.xml. Vérifier que `/proprietaires` est listé.

- [ ] **Step 4 — Commit final**

```bash
cd "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/DIAMANTNOIR/diamant-noir"
git add app/sitemap.ts
git commit -m "feat: add sitemap with /proprietaires"
```

---

## Task 5 — Build de validation

**Files:** aucun

- [ ] **Step 1 — Build de production**

```bash
cd "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/DIAMANTNOIR/diamant-noir"
npm run build 2>&1 | tail -30
```

Expected:
```
✓ Compiled successfully
Route (app)             Size
/proprietaires          ...
...
```

Si erreur TypeScript ou compilation : lire le message, corriger dans le fichier concerné, relancer.

- [ ] **Step 2 — Checklist parcours utilisateur**

```
/ → hero card "Confier ma villa" → /proprietaires ✓
/ → section bas "Confier ma villa" → /proprietaires ✓
Navbar → "Propriétaires" → /proprietaires ✓
/proprietaires → "Soumettre ma villa" → /soumettre-ma-villa ✓
/proprietaires → "Espace propriétaire" → /login?redirect=/dashboard/proprio ✓
/prestations → inclusions identiques à /proprietaires ✓
http://localhost:3000/sitemap.xml → /proprietaires présent ✓
Aucun fond navy sur /proprietaires (hors hero) ✓
```

- [ ] **Step 3 — Commit final si ajustements**

```bash
git add -p   # stage uniquement les corrections
git commit -m "fix: build corrections /proprietaires"
```
