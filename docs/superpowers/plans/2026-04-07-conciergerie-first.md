# Conciergerie First — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Repositionner la conciergerie propriétaire comme proposition principale sur la home et dans la navbar, les villas passant en second plan.

**Architecture:** 6 fichiers existants modifiés (Navbar, HeroAudienceCards, HomeTrustBand, HomeLifestyleAudience, HomeBottomCta, app/page.tsx) + 1 nouveau composant server (HomeConciergeHighlight). Aucune nouvelle page, aucune modification de la direction artistique.

**Tech Stack:** Next.js 14 App Router, React, Tailwind CSS, lucide-react, TypeScript

---

## File Map

| Action | Fichier | Responsabilité |
|--------|---------|----------------|
| Modify | `components/layout/Navbar.tsx` | CTA → "Conciergerie" `/prestations` |
| Modify | `components/home/HeroAudienceCards.tsx` | Cartes inversées, proprio → `/prestations` |
| Modify | `components/home/HomeTrustBand.tsx` | Ordre signaux : Conciergerie 24/7 en 1er |
| Create | `components/home/HomeConciergeHighlight.tsx` | Bloc 6 services conciergerie + CTA |
| Modify | `components/home/HomeLifestyleAudience.tsx` | CTA → `/prestations` |
| Modify | `app/page.tsx` | Ordre sections, importer HomeConciergeHighlight |
| Modify | `components/home/HomeBottomCta.tsx` | CTA primaire → `/prestations` |

---

### Task 1 — Navbar CTA : "Réserver" → "Conciergerie"

**Files:**
- Modify: `components/layout/Navbar.tsx:38-41`

- [ ] **Step 1 : Modifier les 3 constantes CTA dans Navbar.tsx**

Lignes 38-40, remplacer :
```tsx
const primaryCtaHref = "/villas";
const primaryCtaLabel = "Réserver";
const primaryCtaAria = "Réserver";
```
par :
```tsx
const primaryCtaHref = "/prestations";
const primaryCtaLabel = "Conciergerie";
const primaryCtaAria = "Découvrir la conciergerie";
```

- [ ] **Step 2 : Changer l'icône mobile CalendarDays → Sparkles**

En haut du fichier, l'import ligne 6 :
```tsx
import { Menu, X, Phone, Mail, Heart, User, CalendarDays } from "lucide-react";
```
devient :
```tsx
import { Menu, X, Phone, Mail, Heart, User, Sparkles } from "lucide-react";
```

Ligne ~372, dans le bouton CTA :
```tsx
<CalendarDays size={18} strokeWidth={1.25} className="md:hidden" aria-hidden />
```
devient :
```tsx
<Sparkles size={18} strokeWidth={1.25} className="md:hidden" aria-hidden />
```

- [ ] **Step 3 : Vérifier que le lien "Conciergerie" dans le menu (ligne 17) est bien `/prestations`**

```tsx
{ href: "/prestations", label: "Conciergerie" },
```
Aucune modification nécessaire — déjà correct.

- [ ] **Step 4 : Vérifier le build**

```bash
cd "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/DIAMANTNOIR/diamant-noir" && npm run build 2>&1 | tail -20
```
Expected: `✓ Compiled successfully` sans erreur TypeScript.

- [ ] **Step 5 : Commit**

```bash
cd "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/DIAMANTNOIR/diamant-noir" && git add components/layout/Navbar.tsx && git commit -m "feat: navbar CTA changed to Conciergerie → /prestations"
```

---

### Task 2 — HeroAudienceCards : inversion cartes + proprio → /prestations

**Files:**
- Modify: `components/home/HeroAudienceCards.tsx`

- [ ] **Step 1 : Mettre à jour la fonction `chooseProprio`**

Remplacer le corps de `chooseProprio` (lignes 39-53) :
```tsx
const chooseProprio = useCallback(() => {
  router.push("/prestations");
}, [router]);
```

Supprimer le bloc `sessionStorage` et `notifyHomeAudienceChange` de cette fonction — le navigate suffit.

- [ ] **Step 2 : Supprimer le cas `selection === "proprietaire"` (return null)**

Lignes 56-58 :
```tsx
if (selection === "proprietaire") {
  return null;
}
```
Supprimer ce bloc entier — la navigation vers `/prestations` se charge de quitter la page.

- [ ] **Step 3 : Inverser les cartes dans le JSX (propriétaire à gauche)**

Remplacer le return final (les deux `<button>`) par :
```tsx
return (
  <div className="mx-auto mt-8 flex w-full max-w-2xl flex-col gap-3">
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {/* Carte gauche — Conciergerie Privée (priorité) */}
      <button
        type="button"
        onClick={chooseProprio}
        className="group flex min-h-[104px] flex-col items-start gap-2 border border-gold/30 bg-black/20 px-6 py-6 text-left backdrop-blur-sm transition-all duration-200 hover:border-gold/60 hover:bg-black/28 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 active:scale-[0.98]"
      >
        <span className="text-[9px] font-bold uppercase tracking-[0.38em] text-gold/80">
          Conciergerie Privée
        </span>
        <span className="font-display text-[1.1rem] leading-snug text-white">
          Gérer ma villa avec Diamant Noir
        </span>
        <Building2
          className="mt-auto h-[15px] w-[15px] text-gold/55 transition-transform duration-200 group-hover:translate-x-0.5"
          strokeWidth={1.5}
          aria-hidden
        />
      </button>

      {/* Carte droite — Espace Voyageur (secondaire) */}
      <button
        type="button"
        onClick={chooseVoyageur}
        className="group flex min-h-[104px] flex-col items-start gap-2 border border-white/15 bg-black/15 px-6 py-6 text-left backdrop-blur-sm transition-all duration-200 hover:border-white/28 hover:bg-black/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 active:scale-[0.98]"
      >
        <span className="text-[9px] font-bold uppercase tracking-[0.38em] text-white/45">
          Espace Voyageur
        </span>
        <span className="font-display text-[1.1rem] leading-snug text-white">
          Réserver un séjour
        </span>
        <Search
          className="mt-auto h-[15px] w-[15px] text-white/30 transition-transform duration-200 group-hover:scale-110"
          strokeWidth={1.5}
          aria-hidden
        />
      </button>
    </div>
  </div>
);
```

- [ ] **Step 4 : Vérifier les imports en haut du fichier**

Les imports doivent contenir `Building2` et `Search` (déjà présents). Vérifier :
```tsx
import { Search, Building2 } from "lucide-react";
```
Aucune modification nécessaire — déjà importés ligne 6.

- [ ] **Step 5 : Vérifier le build**

```bash
cd "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/DIAMANTNOIR/diamant-noir" && npm run build 2>&1 | tail -20
```
Expected: `✓ Compiled successfully`

- [ ] **Step 6 : Commit**

```bash
cd "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/DIAMANTNOIR/diamant-noir" && git add components/home/HeroAudienceCards.tsx && git commit -m "feat: hero cards reordered — conciergerie first, navigate to /prestations"
```

---

### Task 3 — HomeTrustBand : "Conciergerie 24/7" en premier signal

**Files:**
- Modify: `components/home/HomeTrustBand.tsx`

- [ ] **Step 1 : Réordonner les 4 signaux**

Remplacer le contenu du `<div className="mx-auto flex...">` :
```tsx
<div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-x-10 gap-y-4 text-center">
  <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-navy/55">
    Conciergerie 24/7
  </span>
  <span className="hidden h-3 w-px bg-black/10 sm:block" aria-hidden />
  <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-navy/45">
    Équipe locale 7j/7
  </span>
  <span className="hidden h-3 w-px bg-black/10 sm:block" aria-hidden />
  <div className="flex items-center gap-2">
    <Star size={14} className="fill-navy text-navy" strokeWidth={0} />
    <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-navy/55">
      4,9 / 5
    </span>
  </div>
  <span className="hidden h-3 w-px bg-black/10 sm:block" aria-hidden />
  <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-navy/45">
    100+ séjours
  </span>
</div>
```

- [ ] **Step 2 : Vérifier le build**

```bash
cd "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/DIAMANTNOIR/diamant-noir" && npm run build 2>&1 | tail -20
```

- [ ] **Step 3 : Commit**

```bash
cd "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/DIAMANTNOIR/diamant-noir" && git add components/home/HomeTrustBand.tsx && git commit -m "feat: trustband reordered — conciergerie 24/7 as first signal"
```

---

### Task 4 — Créer HomeConciergeHighlight

**Files:**
- Create: `components/home/HomeConciergeHighlight.tsx`

- [ ] **Step 1 : Créer le composant**

```tsx
import Link from "next/link";
import { Car, UtensilsCrossed, Anchor, ShoppingBag, Sparkles, Calendar, ArrowRight } from "lucide-react";
import { ScrollReveal } from "@/components/ScrollReveal";

const SERVICES = [
  { icon: Car, label: "Transferts & accueil" },
  { icon: UtensilsCrossed, label: "Chef & art de la table" },
  { icon: Anchor, label: "Nautisme & escapades" },
  { icon: ShoppingBag, label: "Courses & bienvenue" },
  { icon: Sparkles, label: "Entretien & linge" },
  { icon: Calendar, label: "Pilotage des séjours" },
] as const;

export function HomeConciergeHighlight() {
  return (
    <section className="border-b border-black/[0.07] bg-offwhite py-20 px-6 md:py-28">
      <div className="mx-auto max-w-5xl space-y-14">
        <ScrollReveal delay={0}>
          <div className="space-y-5 max-w-2xl">
            <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-navy/40">
              Nos services
            </span>
            <h2 className="font-display text-4xl font-normal text-navy md:text-5xl">
              La conciergerie autrement.
            </h2>
            <p className="text-[15px] leading-relaxed text-navy/60">
              Bien plus que des gestionnaires — des passionnés ancrés en Martinique qui orchestrent
              chaque séjour avec exigence, de l&apos;annonce au départ du voyageur.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:gap-8">
          {SERVICES.map(({ icon: Icon, label }, i) => (
            <ScrollReveal key={label} delay={i * 60}>
              <div className="flex items-start gap-4">
                <Icon
                  size={20}
                  strokeWidth={1.25}
                  className="mt-0.5 shrink-0 text-navy/30"
                  aria-hidden
                />
                <span className="text-[13px] leading-snug text-navy/70">{label}</span>
              </div>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal delay={120}>
          <Link
            href="/prestations"
            className="group inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-navy/55 underline-offset-8 transition-colors hover:text-navy hover:underline"
          >
            Découvrir la conciergerie complète
            <ArrowRight
              size={12}
              strokeWidth={1.5}
              className="transition-transform group-hover:translate-x-0.5"
              aria-hidden
            />
          </Link>
        </ScrollReveal>
      </div>
    </section>
  );
}
```

- [ ] **Step 2 : Vérifier le build**

```bash
cd "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/DIAMANTNOIR/diamant-noir" && npm run build 2>&1 | tail -20
```
Expected: `✓ Compiled successfully` (le composant n'est pas encore importé dans page.tsx, mais doit compiler sans erreur)

- [ ] **Step 3 : Commit**

```bash
cd "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/DIAMANTNOIR/diamant-noir" && git add components/home/HomeConciergeHighlight.tsx && git commit -m "feat: add HomeConciergeHighlight — 6 services grid with CTA to /prestations"
```

---

### Task 5 — HomeLifestyleAudience : CTA → /prestations

**Files:**
- Modify: `components/home/HomeLifestyleAudience.tsx:43-48`

- [ ] **Step 1 : Changer le lien CTA**

Lignes 43-49, remplacer :
```tsx
<p className="pt-2">
  <Link
    href="/villas"
    className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/55 underline-offset-8 transition-colors hover:text-white hover:underline"
  >
    Parcourir les villas
  </Link>
</p>
```
par :
```tsx
<p className="pt-2">
  <Link
    href="/prestations"
    className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/55 underline-offset-8 transition-colors hover:text-white hover:underline"
  >
    Découvrir nos services
  </Link>
</p>
```

- [ ] **Step 2 : Vérifier le build**

```bash
cd "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/DIAMANTNOIR/diamant-noir" && npm run build 2>&1 | tail -20
```

- [ ] **Step 3 : Commit**

```bash
cd "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/DIAMANTNOIR/diamant-noir" && git add components/home/HomeLifestyleAudience.tsx && git commit -m "feat: lifestyle section CTA now points to /prestations"
```

---

### Task 6 — app/page.tsx : réordonner les sections + importer HomeConciergeHighlight

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1 : Ajouter l'import de HomeConciergeHighlight**

En haut du fichier, après l'import existant de `HomeTrustBand` :
```tsx
import { HomeConciergeHighlight } from "@/components/home/HomeConciergeHighlight";
```

- [ ] **Step 2 : Réordonner les sections dans le return JSX**

Remplacer le bloc de sections (lignes 81-98) :
```tsx
{/* Signaux de confiance */}
<HomeTrustBand />

{/* Bloc conciergerie */}
<HomeConciergeHighlight />

{/* Art de vivre — voyageurs */}
<HomeLifestyleAudience />

{/* Offre propriétaires — remonte avant les villas */}
<HomeOwnersSection />

{/* Villas — secondaire, en bas */}
<HomeFeaturedAudience
  featuredVillas={featuredVillas}
  featuredError={featuredError}
  featuredCount={featuredCount}
/>

{/* CTA final */}
<HomeBottomCta />
```

Ordre final complet du fichier :
```
Hero
HomeTrustBand
HomeConciergeHighlight   ← nouveau, entre TrustBand et Lifestyle
HomeLifestyleAudience
HomeOwnersSection        ← avant les villas
HomeFeaturedAudience     ← en bas
HomeBottomCta
```

- [ ] **Step 3 : Vérifier le build**

```bash
cd "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/DIAMANTNOIR/diamant-noir" && npm run build 2>&1 | tail -20
```
Expected: `✓ Compiled successfully`

- [ ] **Step 4 : Commit**

```bash
cd "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/DIAMANTNOIR/diamant-noir" && git add app/page.tsx && git commit -m "feat: home page sections reordered — conciergerie highlight before villas"
```

---

### Task 7 — HomeBottomCta : CTA primaire → /prestations

**Files:**
- Modify: `components/home/HomeBottomCta.tsx`

- [ ] **Step 1 : Modifier le texte intro**

Ligne 12-14, remplacer :
```tsx
<p className="leading-relaxed text-navy/60">
  Rejoignez le cercle Diamant Noir — séjournez dans nos villas d&apos;exception ou confiez-nous votre bien pour en maximiser le potentiel.
</p>
```
par :
```tsx
<p className="leading-relaxed text-navy/60">
  Diamant Noir orchestre des séjours d&apos;exception et accompagne les propriétaires exigeants de Martinique — conciergerie, gestion et excellence à chaque étape.
</p>
```

- [ ] **Step 2 : Inverser les deux CTAs**

Remplacer le bloc `<div className="flex flex-wrap...">` :
```tsx
<div className="flex flex-wrap justify-center gap-4 pt-2">
  <Link href="/prestations" className="btn-luxury bg-black text-white">
    Découvrir la conciergerie
  </Link>
  <Link
    href="/villas"
    className="inline-flex min-h-11 items-center justify-center border border-navy/25 px-6 text-[10px] font-bold uppercase tracking-[0.22em] text-navy transition-colors hover:bg-navy/[0.04] focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/30"
  >
    Parcourir les villas
  </Link>
</div>
```

Note : supprimer l'import de `ProprietairesTransitionLink` si il n'est plus utilisé dans ce fichier.

- [ ] **Step 3 : Nettoyer l'import `ProprietairesTransitionLink` si inutilisé**

Si `ProprietairesTransitionLink` n'est plus utilisé après Step 2, supprimer la ligne :
```tsx
import { ProprietairesTransitionLink } from "@/components/home/ProprietairesTransitionLink";
```

- [ ] **Step 4 : Vérifier le build final**

```bash
cd "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/DIAMANTNOIR/diamant-noir" && npm run build 2>&1 | tail -30
```
Expected: `✓ Compiled successfully` sans warning TypeScript ni import inutilisé.

- [ ] **Step 5 : Commit final**

```bash
cd "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/DIAMANTNOIR/diamant-noir" && git add components/home/HomeBottomCta.tsx && git commit -m "feat: bottom CTA — conciergerie as primary action, villas secondary"
```

---

## Checklist de vérification manuelle (après toutes les tâches)

- [ ] Navbar CTA "Conciergerie" → `/prestations`, icône Sparkles sur mobile
- [ ] Carte gauche hero "Gérer ma villa avec Diamant Noir" → `/prestations`
- [ ] Carte droite hero "Réserver un séjour" → révèle la barre de recherche
- [ ] TrustBand : "Conciergerie 24/7" apparaît en 1er signal
- [ ] `HomeConciergeHighlight` visible entre TrustBand et section lifestyle
- [ ] Section lifestyle : CTA "Découvrir nos services" → `/prestations`
- [ ] `HomeOwnersSection` apparaît avant la grille de villas
- [ ] `HomeFeaturedAudience` visible en bas de page
- [ ] CTA noir du bas : "Découvrir la conciergerie" → `/prestations`
- [ ] CTA secondaire du bas : "Parcourir les villas" → `/villas`
- [ ] `npm run build` passe sans erreur
