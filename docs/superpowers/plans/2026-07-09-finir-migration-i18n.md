# Finir la migration i18n Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Éliminer le texte français en dur restant sur le site vitrine, le tunnel de réservation et l'espace-client, en le remplaçant par des appels au système i18n maison déjà en place (`lib/i18n.ts` + `contexts/LocaleContext.tsx`).

**Architecture:** Aucun changement d'architecture. On réutilise `t(key)` côté client (via `useLocale()`) et `tServer(locale, key, vars?)` côté server component (locale obtenue via `getServerLocale(await headers())`). Chaque texte en dur devient une clé `fr`/`en`/`es` dans `lib/i18n.ts`, en réutilisant un namespace existant quand le sens correspond déjà (`common.*`, `villa.*`, `villas.*`, `booking.*`, `checkout.*`, `client.*`, etc.), sinon en créant un nouveau namespace cohérent (`home.*`, `auth.*`).

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Tailwind. Pas de nouvelle dépendance (pas de next-intl).

## Global Constraints

- Locale par défaut `fr`, locales supportées `fr | en | es` (`SUPPORTED_LOCALES` dans `lib/i18n.ts:1`) — ne pas en ajouter/retirer.
- Ne jamais lancer `npm run build` pour vérifier ce travail ; utiliser le dev server (`npm run dev`, port 3001).
- Ne pas toucher : `app/(admin)/*`, `app/(proprio)/*`, pages légales (`cgv`, `terms`, `confidentialite`, `cookies`, `mentions-legales`), contenu Supabase dynamique (descriptions/équipements villas), routing par préfixe `/en` `/es` dans `middleware.ts` (code mort, hors périmètre), metadata/SEO (`alternates`, `openGraph`, `title`, `description` restent en français).
- Réutiliser une clé de dictionnaire existante avant d'en créer une nouvelle avec le même sens.
- Ne jamais traduire les noms propres (`Kayvila`, `Martinique`, noms de villas) — seul le texte descriptif autour change de langue.
- Commande d'audit standard pour repérer le texte en dur restant dans un fichier :
  ```bash
  grep -nE '>[A-ZÀ-Üa-zà-ÿ][^<{]{3,}<|placeholder="[^"]+"|aria-label="[^"]+"|title="[^"]+"' <fichier>
  ```
  (à lire avec jugement : ignorer les noms propres, le texte déjà passé en `t()`/`tServer()`, et les valeurs déjà dynamiques comme `{villa.name}`.)
- **Ancrage dans `lib/i18n.ts` :** ce fichier est modifié par toutes les tâches, dans l'ordre. Les numéros de ligne cités dans ce plan (ex. "ligne 219") correspondent à l'état du fichier lu pendant le brainstorming, **avant toute modification** — chaque tâche précédente insère des lignes et décale tout ce qui suit. Ne jamais chercher un numéro de ligne littéral une fois une tâche antérieure appliquée : localiser le point d'insertion en cherchant la chaîne de clé citée (ex. `"prestations.discover": "Découvrir",`) avec l'outil de recherche/édition, et insérer juste après cette ligne, quel que soit son numéro réel au moment de l'exécution.

---

## Task 1: Accueil (`app/page.tsx` + `components/home/*`)

**Files:**
- Modify: `lib/i18n.ts` (ajout de clés dans le namespace `home.*` existant + nouvelles clés `home.pillars_*`, `home.owners_*`, `home.bottom_cta_*`)
- Modify: `components/home/HomeServicesSection.tsx`
- Modify: `components/home/HomeOwnersSection.tsx`
- Modify: `components/home/HomeBottomCta.tsx`
- Modify: `components/home/HeroAudienceCards.tsx`
- Modify: `components/home/HeroBackgroundMedia.tsx` (à auditer — non lu en détail, appliquer la commande d'audit)
- Modify: `components/marketing/HeroWordmarkBaseline.tsx` (à auditer — non lu en détail)
- No test file: pas de suite de tests automatisée pour ce type de contenu ; la vérification se fait par audit `grep` + contrôle visuel en dev server (voir Step de vérification).

**Interfaces:**
- Consomme : `useLocale()` → `{ locale, t }` depuis `@/contexts/LocaleContext` (client components) ; `tServer(locale, key, vars?)` + `getServerLocale(headers)` depuis `@/lib/i18n` (server components — non nécessaire ici car tous les fichiers de ce groupe sont `"use client"`).
- Produit : nouvelles clés `home.pillars_eyebrow`, `home.pillars_title`, `home.pillars_subtitle`, `home.pillar_prev`, `home.pillar_next`, `home.pillars_cta`, `home.owners_eyebrow`, `home.owners_title`, `home.owners_text`, `home.owners_cta_services`, `home.owners_cta_submit`, `home.bottom_cta_title`, `home.bottom_cta_text`, `home.bottom_cta_prestations`, `home.bottom_cta_villas`, `home.bottom_cta_owner_prompt`, `home.bottom_cta_owner_link` — utilisées par les tâches suivantes si elles réapparaissent sur d'autres pages (aucune prévue actuellement).

- [ ] **Step 1: Auditer les fichiers du groupe**

```bash
cd "diamant-noir" && for f in app/page.tsx components/home/HomeServicesSection.tsx components/home/HomeOwnersSection.tsx components/home/HomeBottomCta.tsx components/home/HeroAudienceCards.tsx components/home/HeroBackgroundMedia.tsx components/marketing/HeroWordmarkBaseline.tsx; do echo "=== $f ==="; grep -nE '>[A-ZÀ-Üa-zà-ÿ][^<{]{3,}<|placeholder="[^"]+"|aria-label="[^"]+"|title="[^"]+"' "$f"; done
```

Expected: confirme la liste de textes ci-dessous pour `HomeServicesSection.tsx`, `HomeOwnersSection.tsx`, `HomeBottomCta.tsx`, `HeroAudienceCards.tsx` (déjà identifiés) — note les textes supplémentaires trouvés dans `HeroBackgroundMedia.tsx` et `HeroWordmarkBaseline.tsx` (non lus au moment d'écrire ce plan) pour les traiter avec le même procédé au Step 4.

- [ ] **Step 2: Ajouter les clés dans `lib/i18n.ts`**

Dans le bloc `fr` (juste après la ligne `"home.owners_section": "Vous êtes propriétaire ?",` à la ligne 219), ajouter :

```ts
    "home.pillars_eyebrow": "Gestion clé en main",
    "home.pillars_title_l1": "Cinq piliers,",
    "home.pillars_title_l2": "une seule équipe",
    "home.pillars_subtitle": "Faites défiler pour découvrir chaque pilier — ou cliquez directement sur un service.",
    "home.pillar_prev": "Pilier précédent",
    "home.pillar_next": "Pilier suivant",
    "home.pillars_cta": "Tout savoir sur la conciergerie",
    "home.service_detail": "Voir le détail",
    "home.owners_eyebrow": "Propriétaires",
    "home.owners_title_l1": "Votre villa,",
    "home.owners_title_l2": "notre gestion",
    "home.owners_text": "De la mise en ligne au suivi de vos revenus, nous prenons en charge chaque aspect de votre bien avec une équipe locale en Martinique. Le fruit de vos locations vous revient directement, vos voyageurs sont comblés, vous ne gérez rien.",
    "home.owners_cta_services": "Découvrir nos services",
    "home.owners_cta_submit": "Confier ma villa",
    "home.bottom_cta_title": "Envie d'en savoir plus ?",
    "home.bottom_cta_text": "Kayvila accompagne voyageurs et propriétaires en Martinique — conciergerie, gestion locative et service sur mesure à chaque étape.",
    "home.bottom_cta_prestations": "Découvrir la conciergerie",
    "home.bottom_cta_villas": "Parcourir les villas",
    "home.bottom_cta_owner_prompt": "Propriétaire déjà accompagné ?",
    "home.bottom_cta_owner_link": "Connexion espace propriétaire",
    "home.audience_villa_pill": "Conciergerie Privée",
    "home.audience_voyageur_pill": "Espace Voyageur",
    "home.audience_voyageur_title": "Réserver un séjour",
    "home.audience_back": "Retour au choix voyageur ou propriétaire",
```

Dans le bloc `en` (après `"home.owners_section": "Are you a property owner?",` ligne 457) :

```ts
    "home.pillars_eyebrow": "Turnkey management",
    "home.pillars_title_l1": "Five pillars,",
    "home.pillars_title_l2": "one team",
    "home.pillars_subtitle": "Scroll to discover each pillar — or click directly on a service.",
    "home.pillar_prev": "Previous pillar",
    "home.pillar_next": "Next pillar",
    "home.pillars_cta": "Learn all about our concierge service",
    "home.service_detail": "See details",
    "home.owners_eyebrow": "Owners",
    "home.owners_title_l1": "Your villa,",
    "home.owners_title_l2": "our management",
    "home.owners_text": "From listing to tracking your income, we handle every aspect of your property with a local team in Martinique. Your rental income comes straight to you, your guests are delighted, and you manage nothing.",
    "home.owners_cta_services": "Discover our services",
    "home.owners_cta_submit": "List my villa",
    "home.bottom_cta_title": "Want to know more?",
    "home.bottom_cta_text": "Kayvila supports travelers and owners in Martinique — concierge service, rental management and bespoke care at every step.",
    "home.bottom_cta_prestations": "Discover our concierge service",
    "home.bottom_cta_villas": "Browse our villas",
    "home.bottom_cta_owner_prompt": "Already an owner with us?",
    "home.bottom_cta_owner_link": "Owner area login",
    "home.audience_villa_pill": "Private Concierge",
    "home.audience_voyageur_pill": "Traveler Area",
    "home.audience_voyageur_title": "Book a stay",
    "home.audience_back": "Back to traveler or owner choice",
```

Dans le bloc `es` (après `"home.owners_section": "¿Es propietario?",` ligne 696) :

```ts
    "home.pillars_eyebrow": "Gestión llave en mano",
    "home.pillars_title_l1": "Cinco pilares,",
    "home.pillars_title_l2": "un solo equipo",
    "home.pillars_subtitle": "Desplácese para descubrir cada pilar — o haga clic directamente en un servicio.",
    "home.pillar_prev": "Pilar anterior",
    "home.pillar_next": "Pilar siguiente",
    "home.pillars_cta": "Descubra toda la conserjería",
    "home.service_detail": "Ver detalle",
    "home.owners_eyebrow": "Propietarios",
    "home.owners_title_l1": "Su villa,",
    "home.owners_title_l2": "nuestra gestión",
    "home.owners_text": "Desde la publicación hasta el seguimiento de sus ingresos, nos encargamos de cada aspecto de su propiedad con un equipo local en Martinica. El fruto de sus alquileres le llega directamente, sus viajeros quedan encantados, usted no gestiona nada.",
    "home.owners_cta_services": "Descubrir nuestros servicios",
    "home.owners_cta_submit": "Confiar mi villa",
    "home.bottom_cta_title": "¿Quiere saber más?",
    "home.bottom_cta_text": "Kayvila acompaña a viajeros y propietarios en Martinica — conserjería, gestión de alquiler y servicio a medida en cada etapa.",
    "home.bottom_cta_prestations": "Descubrir la conserjería",
    "home.bottom_cta_villas": "Explorar las villas",
    "home.bottom_cta_owner_prompt": "¿Ya es propietario acompañado?",
    "home.bottom_cta_owner_link": "Acceso área propietario",
    "home.audience_villa_pill": "Conserjería Privada",
    "home.audience_voyageur_pill": "Área Viajero",
    "home.audience_voyageur_title": "Reservar una estancia",
    "home.audience_back": "Volver a la elección viajero o propietario",
```

- [ ] **Step 3: Câbler `HomeBottomCta.tsx` (exemple représentatif)**

Remplacer le contenu de `components/home/HomeBottomCta.tsx` :

```tsx
"use client";

import Link from "next/link";
import { useLocale } from "@/contexts/LocaleContext";

export function HomeBottomCta() {
  const { t } = useLocale();
  return (
    <section className="py-20 text-center bg-offwhite px-6 md:py-28 lg:py-32">
      <div className="mx-auto max-w-3xl space-y-10">
        <div className="space-y-8">
          <h2 className="font-display text-4xl font-light text-navy md:text-6xl">{t("home.bottom_cta_title")}</h2>
          <p className="leading-relaxed text-navy/80">
            {t("home.bottom_cta_text")}
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-2">
            <Link href="/prestations" className="btn-luxury bg-navy text-white">
              {t("home.bottom_cta_prestations")}
            </Link>
            <Link
              href="/villas"
              className="inline-flex min-h-11 items-center justify-center border border-navy/25 px-6 text-[10px] font-bold uppercase tracking-[0.22em] text-navy transition-colors hover:bg-navy/[0.04] focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/30"
            >
              {t("home.bottom_cta_villas")}
            </Link>
          </div>
        </div>
        <p className="border-t border-black/10 pt-10 text-sm text-navy/50">
          {t("home.bottom_cta_owner_prompt")}{" "}
          <Link href="/login?redirect=/dashboard/proprio" className="font-medium text-navy underline-offset-4 hover:underline">
            {t("home.bottom_cta_owner_link")}
          </Link>
        </p>
      </div>
    </section>
  );
}
```

Note : `"use client"` était déjà absent dans ce fichier (composant sans hook) — il faut l'ajouter puisque `useLocale()` est un hook client.

- [ ] **Step 4: Appliquer le même procédé aux fichiers restants du groupe**

Pour chacun des fichiers suivants : ajouter `"use client"` s'il est absent, importer `useLocale` depuis `@/contexts/LocaleContext`, appeler `const { t } = useLocale();` en tête de composant, remplacer chaque texte en dur repéré au Step 1 par `t("clé")` en utilisant les clés créées au Step 2 (ou une clé `common.*` existante si le sens correspond, ex. les `aria-label` de flèches précédente/suivante réutilisent `home.pillar_prev` / `home.pillar_next`) :

- `components/home/HomeServicesSection.tsx` : `Gestion clé en main` → `home.pillars_eyebrow`, `Cinq piliers` / `une seule équipe` → `home.pillars_title_l1` / `home.pillars_title_l2`, `Faites défiler pour découvrir...` → `home.pillars_subtitle`, `aria-label="Pilier précédent"` → `home.pillar_prev`, `aria-label="Pilier suivant"` → `home.pillar_next`, `Voir le détail` → `home.service_detail`, `Tout savoir sur la conciergerie` → `home.pillars_cta`. Les `SERVICE_TAGLINES`/`SERVICE_DESCS` (textes des 5 piliers eux-mêmes) restent en dur pour l'instant : ce sont des données de contenu proches de `SCROLL_SECTIONS` (`data/prestations-scroll-sections.ts`), à traiter avec le Task 3 (Prestations) qui touche la même source de données — ne pas dupliquer le travail ici.
- `components/home/HomeOwnersSection.tsx` : `Propriétaires` → `home.owners_eyebrow`, `Votre villa` / `notre gestion` → `home.owners_title_l1` / `home.owners_title_l2`, paragraphe → `home.owners_text`, `Découvrir nos services` → `home.owners_cta_services`, `Confier ma villa` → `home.owners_cta_submit` (clé `footer.submit_villa` a un sens identique mais un `common`/`footer` namespace différent — garder une clé `home.*` dédiée pour ne pas coupler l'accueil au footer).
- `components/home/HeroAudienceCards.tsx` : `Conciergerie Privée` → `home.audience_villa_pill`, `Espace Voyageur` → `home.audience_voyageur_pill`, `Réserver un séjour` → `home.audience_voyageur_title`, `aria-label="Retour au choix voyageur ou propriétaire"` → `home.audience_back`. Le texte `` `Gérer ma villa avec ${SITE_BRAND_DISPLAY}` `` reste tel quel (nom de marque dynamique, pas une traduction de contenu).
- `components/home/HeroBackgroundMedia.tsx` et `components/marketing/HeroWordmarkBaseline.tsx` : appliquer la commande d'audit du Step 1, puis le même procédé pour tout texte trouvé (créer les clés manquantes dans `lib/i18n.ts` en suivant la convention `home.*`).

- [ ] **Step 5: Re-vérifier qu'il ne reste plus de texte en dur (hors exceptions documentées)**

```bash
for f in app/page.tsx components/home/HomeServicesSection.tsx components/home/HomeOwnersSection.tsx components/home/HomeBottomCta.tsx components/home/HeroAudienceCards.tsx components/home/HeroBackgroundMedia.tsx components/marketing/HeroWordmarkBaseline.tsx; do echo "=== $f ==="; grep -nE '>[A-ZÀ-Üa-zà-ÿ][^<{]{3,}<|placeholder="[^"]+"|aria-label="[^"]+"|title="[^"]+"' "$f"; done
```

Expected: les seules occurrences restantes sont des noms propres (`Kayvila`, `Martinique`) ou les `SERVICE_TAGLINES`/`SERVICE_DESCS` explicitement reportés au Task 3.

- [ ] **Step 6: Vérification visuelle en dev server**

```bash
npm run dev
```

Ouvrir `http://localhost:3001/`, utiliser le sélecteur de langue de la Navbar pour passer en `en` puis `es`, confirmer visuellement : titre hero, 5 piliers (eyebrow/titre/sous-titre/CTA), section propriétaires, bandeau CTA final — aucun texte français résiduel, aucun débordement de bouton/titre en anglais/espagnol.

- [ ] **Step 7: Commit**

```bash
git add lib/i18n.ts components/home/HomeServicesSection.tsx components/home/HomeOwnersSection.tsx components/home/HomeBottomCta.tsx components/home/HeroAudienceCards.tsx components/home/HeroBackgroundMedia.tsx components/marketing/HeroWordmarkBaseline.tsx
git commit -m "i18n: migrate homepage hero/pillars/owners/bottom-cta to translation system"
```

---

## Task 2: Villas (détail, comparateur, composants villa)

**Files:**
- Modify: `lib/i18n.ts` (nouvelles clés `villas.compare_*`, réutilisation de `villa.*`/`villas.*` existants)
- Modify: `app/villas/comparer/page.tsx`
- Modify: `app/villas/[id]/page.tsx` (730 lignes — auditer par sections, ce fichier n'a pas été lu intégralement lors de l'écriture de ce plan)
- Modify: `components/VillaQuickView.tsx`, `components/VillaGallery.tsx`, `components/VillaReviews.tsx`, `components/VillaInteractions.tsx`, `components/VillaViewTracker.tsx`, `components/VillaLeafletMap.tsx`, `components/VillasMapView.tsx` (déjà partiellement migré — vérifier avec l'audit), `components/VillaFilters.tsx`
- Test: pas de suite automatisée — audit `grep` + contrôle visuel.

**Interfaces:**
- Consomme : `useLocale()` (client), `tServer` + `getServerLocale` (server component — `app/villas/[id]/page.tsx` est un server component, vérifier au moment de l'implémentation s'il utilise déjà `getServerLocale` ailleurs dans le fichier avant d'en ajouter un second appel).
- Produit : `villas.compare_empty_title`, `villas.compare_empty_desc`, `villas.compare_empty_cta`, `villas.compare_title`, `villas.compare_selected`, `villas.compare_selected_plural`, `villas.compare_loading`, `villas.compare_remove`, `villas.compare_pool`, `villas.compare_no_pool`, `villas.compare_view_sheet`.

- [ ] **Step 1: Auditer `app/villas/comparer/page.tsx` (fichier lu intégralement)**

Texte en dur confirmé dans ce fichier : `"Aucune villa à comparer"`, `"Ajoutez jusqu'à 3 villas depuis la page de recherche."`, `"Voir les villas"` (déjà couvert par `villas_title`? non — créer clé dédiée), `"Comparer les villas"`, `` `{villas.length} villa${...} sélectionnée${...}` ``, `"Chargement…"` (existe déjà : `common.loading`), `"voyageurs"` (existe déjà en pluriel via `villas.travelers` — vérifier singulier `villas.traveler`), `"Piscine"` (existe déjà : `villas.filter.pool`), `"Sans piscine"` (nouveau), `"/ nuit"` (existe déjà : `common.per_night`), `"Voir la fiche →"` (nouveau), `aria-label={`Retirer ${villa.name}`}` (nouveau, avec interpolation).

- [ ] **Step 2: Ajouter les clés manquantes dans `lib/i18n.ts`**

Bloc `fr` (après `"villas.travelers": "voyageurs",` ligne 106) :

```ts
    "villas.compare_empty_title": "Aucune villa à comparer",
    "villas.compare_empty_desc": "Ajoutez jusqu'à 3 villas depuis la page de recherche.",
    "villas.compare_empty_cta": "Voir les villas",
    "villas.compare_title": "Comparer les villas",
    "villas.compare_selected": "villa sélectionnée",
    "villas.compare_selected_plural": "villas sélectionnées",
    "villas.compare_remove": "Retirer {{name}}",
    "villas.compare_no_pool": "Sans piscine",
    "villas.compare_view_sheet": "Voir la fiche",
```

Bloc `en` (après `"villas.travelers": "travelers",` ligne 344) :

```ts
    "villas.compare_empty_title": "No villas to compare",
    "villas.compare_empty_desc": "Add up to 3 villas from the search page.",
    "villas.compare_empty_cta": "View villas",
    "villas.compare_title": "Compare villas",
    "villas.compare_selected": "villa selected",
    "villas.compare_selected_plural": "villas selected",
    "villas.compare_remove": "Remove {{name}}",
    "villas.compare_no_pool": "No pool",
    "villas.compare_view_sheet": "View listing",
```

Bloc `es` (après `"villas.travelers": "viajeros",` ligne 582) :

```ts
    "villas.compare_empty_title": "Ninguna villa para comparar",
    "villas.compare_empty_desc": "Añada hasta 3 villas desde la página de búsqueda.",
    "villas.compare_empty_cta": "Ver las villas",
    "villas.compare_title": "Comparar villas",
    "villas.compare_selected": "villa seleccionada",
    "villas.compare_selected_plural": "villas seleccionadas",
    "villas.compare_remove": "Quitar {{name}}",
    "villas.compare_no_pool": "Sin piscina",
    "villas.compare_view_sheet": "Ver la ficha",
```

- [ ] **Step 3: Câbler `app/villas/comparer/page.tsx`**

```tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Scale, Maximize2, X, Waves } from "lucide-react";
import { KayvilaPngIcon } from "@/components/icons/KayvilaPngIcon";
import { useCompare } from "@/contexts/CompareContext";
import { KayvilaEmptyState, KayvilaNumberValue } from "@/components/ui/pro";
import { getSupabaseBrowser } from "@/lib/supabase";
import { useLocale } from "@/contexts/LocaleContext";

// ... type CompareVilla inchangé ...

export default function ComparePage() {
  const { t } = useLocale();
  const searchParams = useSearchParams();
  const { items, remove } = useCompare();
  const [villas, setVillas] = useState<CompareVilla[]>([]);
  const [loading, setLoading] = useState(true);

  // ... ids/useEffect inchangés ...

  if (!loading && villas.length === 0) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-16">
        <KayvilaEmptyState
          icon={<Scale size={24} strokeWidth={1.5} />}
          title={t("villas.compare_empty_title")}
          description={t("villas.compare_empty_desc")}
          actionLabel={t("villas.compare_empty_cta")}
          actionHref="/villas"
        />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-12 pb-24">
      <h1 className="font-display text-3xl text-navy mb-2">{t("villas.compare_title")}</h1>
      <p className="text-sm text-navy/60 mb-8">
        {villas.length} {villas.length > 1 ? t("villas.compare_selected_plural") : t("villas.compare_selected")}
      </p>

      {loading ? (
        <p className="text-sm text-navy/60">{t("common.loading")}</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {villas.map((villa) => {
            const hasPool = (villa.amenities ?? []).some((a) => a.toLowerCase().includes("piscine"));
            return (
              <article key={villa.id} className="relative border border-navy/10 bg-white p-5">
                <button
                  type="button"
                  onClick={() => remove(villa.id)}
                  className="absolute right-4 top-4 text-navy/60 transition-colors hover:text-red-500"
                  aria-label={t("villas.compare_remove").replace("{{name}}", villa.name)}
                >
                  <X size={16} strokeWidth={1.5} />
                </button>
                <div className="relative mb-4 aspect-[4/3] overflow-hidden">
                  <Image
                    src={villa.image_url ?? "/villa-hero.jpg"}
                    alt={villa.name}
                    fill
                    className="object-cover"
                    sizes="(max-width:768px) 100vw, 33vw"
                  />
                </div>
                <h2 className="font-display text-lg text-navy pr-8">{villa.name}</h2>
                {villa.location ? (
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-navy/60">{villa.location}</p>
                ) : null}
                <div className="mt-4 space-y-2 text-sm text-navy/70">
                  <p className="flex items-center gap-2">
                    <KayvilaPngIcon name="users" size={18} alt="" className="text-gold shrink-0" />
                    {villa.capacity ?? "—"} {t("villas.traveler")}
                  </p>
                  <p className="flex items-center gap-2">
                    <Maximize2 size={16} strokeWidth={1.5} className="text-gold shrink-0" />
                    {villa.surface_m2 ?? "—"} m²
                  </p>
                  <p className="flex items-center gap-2">
                    <Waves size={16} strokeWidth={1.5} className="text-gold shrink-0" />
                    {hasPool ? t("villas.filter.pool") : t("villas.compare_no_pool")}
                  </p>
                </div>
                <p className="mt-4">
                  <KayvilaNumberValue value={villa.price_per_night} format="currency" className="font-sora font-semibold text-gold" />
                  <span className="text-sm text-navy/60"> {t("common.per_night")}</span>
                </p>
                <Link
                  href={`/villas/${villa.id}`}
                  className="mt-4 inline-block text-[10px] font-bold uppercase tracking-wider text-navy hover:text-gold"
                >
                  {t("villas.compare_view_sheet")} →
                </Link>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
```

Note : `villas.compare_remove` utilise `.replace("{{name}}", ...)` plutôt que `tServer` car ce composant est client-side (`t()` ne fait pas d'interpolation — voir `lib/i18n.ts:743-745`). Si l'interpolation doit être réutilisée ailleurs côté client, envisager d'étendre `t()` avec un second paramètre `vars` dans une tâche séparée ; pour ce fichier, `.replace()` suffit.

- [ ] **Step 4: Auditer et migrer `app/villas/[id]/page.tsx` et les composants villa restants**

Ce fichier fait 730 lignes et n'a pas été lu intégralement pour ce plan. Lancer :

```bash
grep -nE '>[A-ZÀ-Üa-zà-ÿ][^<{]{3,}<|placeholder="[^"]+"|aria-label="[^"]+"|title="[^"]+"' "app/villas/[id]/page.tsx"
grep -nE '>[A-ZÀ-Üa-zà-ÿ][^<{]{3,}<|placeholder="[^"]+"|aria-label="[^"]+"|title="[^"]+"' components/VillaQuickView.tsx components/VillaGallery.tsx components/VillaReviews.tsx components/VillaInteractions.tsx components/VillaViewTracker.tsx components/VillaLeafletMap.tsx components/VillasMapView.tsx components/VillaFilters.tsx
```

Pour chaque texte trouvé : chercher une clé `villa.*` existante correspondante (la plupart des libellés de section — `villa.amenities`, `villa.description`, `villa.rules`, `villa.reviews`, `villa.location`, `villa.map`, `villa.similar`, etc. — existent déjà dans `lib/i18n.ts:112-140`), sinon créer une clé dans le namespace `villa.*`. Remplacer par `tServer(locale, "clé")` si le fichier est un server component (vérifier comment `locale` y est déjà obtenu — `app/villas/[id]/page.tsx` apparaissait dans le premier grep `dn_locale|x-dn-locale` du projet, donc `getServerLocale` y est probablement déjà importé), ou `t("clé")` via `useLocale()` pour les composants `"use client"`.

- [ ] **Step 5: Re-vérifier + vérification visuelle**

Relancer les commandes d'audit du Step 4 sur tous les fichiers du groupe : seules doivent rester des occurrences de noms propres ou de données Supabase (nom de villa, localisation brute).

```bash
npm run dev
```

Ouvrir `/villas/comparer` (avec 2-3 villas ajoutées au comparateur) et une fiche `/villas/[id]` dans les 3 langues, vérifier galerie, avis, carte, section équipements.

- [ ] **Step 6: Commit**

```bash
git add lib/i18n.ts app/villas/comparer/page.tsx "app/villas/[id]/page.tsx" components/VillaQuickView.tsx components/VillaGallery.tsx components/VillaReviews.tsx components/VillaInteractions.tsx components/VillaViewTracker.tsx components/VillaLeafletMap.tsx components/VillasMapView.tsx components/VillaFilters.tsx
git commit -m "i18n: migrate villa detail and compare pages to translation system"
```

---

## Task 3: Prestations (page + sous-pages + composants + données de contenu)

**Files:**
- Modify: `lib/i18n.ts` (nouvelles clés `prestations.loading_*`)
- Modify: `app/prestations/page.tsx` (loading skeleton — le reste, `PrestationsPageClient.tsx`, est déjà migré)
- Modify: `data/prestations-scroll-sections.ts` (source des `SERVICE_TAGLINES`/`SERVICE_DESCS` réutilisés par `HomeServicesSection.tsx` du Task 1 et par `app/prestations/services/[slug]/page.tsx`)
- Modify: `app/prestations/services/[slug]/page.tsx` (277 lignes — non lu intégralement, auditer)
- `app/prestations/nos-formules/page.tsx` : aucune modification (pure redirection sans texte, déjà vérifié — voir note ci-dessous).

**Interfaces:**
- Consomme : `useLocale()` (le loading skeleton de `app/prestations/page.tsx` est dans un composant `"use client"` — `PrestationsPageLoading`, function locale, pas encore de hook).
- Produit : `prestations.loading_eyebrow`, `prestations.loading_title`, `prestations.loading_text`, `prestations.loading_aria`. Et une structure multi-langue pour les données de `data/prestations-scroll-sections.ts` (voir Step 3).

- [ ] **Step 1: Confirmer que `nos-formules/page.tsx` n'a rien à migrer**

```bash
cat app/prestations/nos-formules/page.tsx
```

Expected: fichier de 6 lignes, une redirection `redirect("/prestations")` avec un commentaire, aucun texte affiché à l'utilisateur. Ne rien modifier dans ce fichier.

- [ ] **Step 2: Ajouter les clés du loading skeleton dans `lib/i18n.ts`**

Bloc `fr` (après `"prestations.discover": "Découvrir",` ligne 262) :

```ts
    "prestations.loading_eyebrow": "Conciergerie de standing",
    "prestations.loading_title": "Nos Prestations",
    "prestations.loading_text": "Chargement de l'expérience…",
    "prestations.loading_aria": "Chargement de la page Prestations",
```

Bloc `en` (après `"prestations.discover": "Discover",` ligne 500) :

```ts
    "prestations.loading_eyebrow": "Premium concierge",
    "prestations.loading_title": "Our Services",
    "prestations.loading_text": "Loading the experience…",
    "prestations.loading_aria": "Loading the Services page",
```

Bloc `es` (après `"prestations.discover": "Descubrir",` ligne 738) :

```ts
    "prestations.loading_eyebrow": "Conserjería de alto standing",
    "prestations.loading_title": "Nuestros Servicios",
    "prestations.loading_text": "Cargando la experiencia…",
    "prestations.loading_aria": "Cargando la página de Servicios",
```

- [ ] **Step 3: Câbler `app/prestations/page.tsx`**

Remplacer le contenu du fichier :

```tsx
"use client";

import dynamic from "next/dynamic";
import { useLocale } from "@/contexts/LocaleContext";

const PrestationsPageClient = dynamic(
  () => import("./PrestationsPageClient"),
  {
    ssr: false,
    loading: PrestationsPageLoading,
  },
);

function PrestationsPageLoading() {
  const { t } = useLocale();
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center bg-navy px-4 text-center text-white"
      role="status"
      aria-live="polite"
      aria-label={t("prestations.loading_aria")}
    >
      <p className="font-display text-[9px] uppercase tracking-[0.35em] text-gold/60">
        {t("prestations.loading_eyebrow")}
      </p>
      <p className="mt-3 font-display text-xl tracking-wide">{t("prestations.loading_title")}</p>
      <p className="mt-4 text-[10px] text-white/40">{t("prestations.loading_text")}</p>
    </div>
  );
}

export default function PrestationsPage() {
  return <PrestationsPageClient />;
}
```

Note : `PrestationsPageLoading` est passé comme `loading` à `next/dynamic` — vérifier au moment de l'implémentation que `next/dynamic` accepte un composant utilisant un hook (`useLocale`) dans sa fonction `loading`. Si `next/dynamic` exige un composant sans state avant hydration complète du `LocaleProvider`, fallback : garder le texte en dur uniquement pour ce loading state transitoire (compromis à documenter dans le commit si rencontré), car `LocaleProvider` est monté dans `app/layout.tsx` donc `useLocale()` devrait être disponible dès le premier rendu client.

- [ ] **Step 4: Auditer et migrer `data/prestations-scroll-sections.ts` et `app/prestations/services/[slug]/page.tsx`**

```bash
grep -n '"' data/prestations-scroll-sections.ts | head -40
grep -nE '>[A-ZÀ-Üa-zà-ÿ][^<{]{3,}<|placeholder="[^"]+"|aria-label="[^"]+"|title="[^"]+"' "app/prestations/services/[slug]/page.tsx"
```

`data/prestations-scroll-sections.ts` contient `SCROLL_SECTIONS` (title par service) consommé à la fois par `HomeServicesSection.tsx` (Task 1) et `services/[slug]/page.tsx`. Restructurer ce fichier pour exposer les titres par locale (ex. `{ id, titleByLocale: { fr, en, es } }`) et mettre à jour les deux call-sites pour lire `titleByLocale[locale]` au lieu de `title`. Faire de même pour `SERVICE_TAGLINES`/`SERVICE_DESCS` dans `HomeServicesSection.tsx` (restés en dur au Task 1, Step 4) : les déplacer dans ce même fichier de données avec la même structure par locale, pour n'avoir qu'une seule source de vérité.

- [ ] **Step 5: Re-vérifier + vérification visuelle**

```bash
grep -nE '>[A-ZÀ-Üa-zà-ÿ][^<{]{3,}<|placeholder="[^"]+"|aria-label="[^"]+"|title="[^"]+"' app/prestations/page.tsx "app/prestations/services/[slug]/page.tsx"
npm run dev
```

Ouvrir `/prestations` (observer le loading skeleton en throttling réseau si besoin) et `/prestations/services/marketing` dans les 3 langues.

- [ ] **Step 6: Commit**

```bash
git add lib/i18n.ts app/prestations/page.tsx data/prestations-scroll-sections.ts "app/prestations/services/[slug]/page.tsx" components/home/HomeServicesSection.tsx
git commit -m "i18n: migrate prestations pages and shared service data to translation system"
```

---

## Task 4: Réservation restante (`book`, `success`, widgets)

**Files:**
- Modify: `lib/i18n.ts` (réutilise `checkout.villa_not_found` / `checkout.return_catalog` / `villa.not_found`, ajoute `booking.landing_*`, `success.*`)
- Modify: `app/book/page.tsx`
- Modify: `components/HeroSearchWidget.tsx`
- Modify: `components/BookingBottomSheet.tsx`
- Modify: `app/success/page.tsx` (428 lignes — non lu intégralement, auditer)
- Modify: `components/book/BookLandingMarketing.tsx` (référencé par `app/book/page.tsx`, non lu — auditer)

**Interfaces:**
- Consomme : `tServer` + `getServerLocale` (`app/book/page.tsx`, `app/success/page.tsx` sont server components) ; `useLocale()` pour `HeroSearchWidget.tsx`/`BookingBottomSheet.tsx` si `"use client"`.
- Produit : `success.*` (à définir selon audit), `booking.landing_*` (à définir selon audit de `BookLandingMarketing.tsx`). Réutilise `villa.not_found`, `checkout.villa_not_found`, `checkout.return_catalog` déjà existants.

- [ ] **Step 1: Câbler `app/book/page.tsx` (fichier lu intégralement, seul texte en dur confirmé)**

Ajouter l'import et la locale, remplacer les 3 chaînes du bloc "villa non trouvée" :

```tsx
import { CheckoutView } from "@/components/booking/CheckoutView";
import { BookLandingMarketing } from "@/components/book/BookLandingMarketing";
import type { CheckoutVilla } from "@/components/booking/checkout-types";
import { getSupabaseServer } from "@/lib/supabase-server";
import { unstable_noStore as noStore } from "next/cache";
import Link from "next/link";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { getServerLocale, tServer } from "@/lib/i18n";

export const dynamic = "force-dynamic";

// ... metadata inchangée (hors périmètre SEO) ...

export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  noStore();
  const locale = getServerLocale(await headers());

  const sp = await searchParams;
  const villaId = typeof sp.villaId === "string" ? sp.villaId : "";
  const checkin = typeof sp.checkin === "string" ? sp.checkin : "";
  const checkout = typeof sp.checkout === "string" ? sp.checkout : "";
  const guestsParam = parseInt((typeof sp.guests === "string" ? sp.guests : "") || "1", 10);

  if (villaId && checkin && checkout) {
    const supabase = await getSupabaseServer();
    const { data } = await supabase
      .from("villas")
      .select(CHECKOUT_VILLA_SELECT)
      .eq("id", villaId)
      .maybeSingle();

    if (!data || data.is_published === false) {
      return (
        <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-offwhite px-6 pt-20">
          <p className="font-display text-2xl text-navy">{tServer(locale, "checkout.villa_not_found")}</p>
          <p className="text-sm text-navy/55">{tServer(locale, "villa.not_found")}</p>
          <Link
            href="/villas"
            className="text-[10px] font-bold uppercase tracking-[0.28em] text-gold hover:text-navy"
          >
            {tServer(locale, "checkout.return_catalog")}
          </Link>
        </main>
      );
    }

    const villa = data as CheckoutVilla;
    return <CheckoutView villa={villa} checkin={checkin} checkout={checkout} guestsCount={guestsParam} />;
  }

  const catalogueHref =
    checkin && checkout
      ? `/villas?checkin=${encodeURIComponent(checkin)}&checkout=${encodeURIComponent(checkout)}&guests=${encodeURIComponent(String(guestsParam))}`
      : "/villas";

  const hasDateOnly = Boolean(checkin && checkout && !villaId);

  return (
    <main className="min-h-dvh bg-offwhite">
      <BookLandingMarketing
        catalogueHref={catalogueHref}
        hasDateOnly={hasDateOnly}
        checkin={checkin}
        checkout={checkout}
        guestsParam={guestsParam}
      />
    </main>
  );
}
```

Note : le texte affiché ("Cette propriété n'est plus disponible à la réservation.") ne correspond pas exactement à la clé existante `villa.not_found` ("Villa introuvable") — au moment de l'implémentation, comparer les deux textes dans `lib/i18n.ts:121` et choisir : soit réutiliser `villa.not_found` en acceptant le léger changement de libellé, soit créer une clé dédiée `checkout.villa_unavailable` avec le texte exact dans les 3 langues. Documenter le choix dans le commit.

- [ ] **Step 2: Auditer et migrer `HeroSearchWidget.tsx`, `BookingBottomSheet.tsx`, `BookLandingMarketing.tsx`, `app/success/page.tsx`**

```bash
grep -nE '>[A-ZÀ-Üa-zà-ÿ][^<{]{3,}<|placeholder="[^"]+"|aria-label="[^"]+"|title="[^"]+"' components/HeroSearchWidget.tsx components/BookingBottomSheet.tsx components/book/BookLandingMarketing.tsx app/success/page.tsx
```

Pour chaque résultat : vérifier d'abord si une clé `booking.*`/`checkout.*`/`common.*` existante convient (ex. `booking.select_dates`, `booking.total_amount`, `checkout.title`). Sinon, créer les clés manquantes en `fr`/`en`/`es` dans le namespace `booking.*` (widgets de recherche/réservation) ou un nouveau namespace `success.*` pour `app/success/page.tsx`.

- [ ] **Step 3: Re-vérifier + vérification visuelle**

```bash
grep -nE '>[A-ZÀ-Üa-zà-ÿ][^<{]{3,}<|placeholder="[^"]+"|aria-label="[^"]+"|title="[^"]+"' app/book/page.tsx components/HeroSearchWidget.tsx components/BookingBottomSheet.tsx components/book/BookLandingMarketing.tsx app/success/page.tsx
npm run dev
```

Tester `/book` sans paramètres (landing marketing), `/book?villaId=...&checkin=...&checkout=...` avec un id inexistant (message d'erreur), et `/success` après un parcours de réservation test — dans les 3 langues.

- [ ] **Step 4: Commit**

```bash
git add lib/i18n.ts app/book/page.tsx components/HeroSearchWidget.tsx components/BookingBottomSheet.tsx components/book/BookLandingMarketing.tsx app/success/page.tsx
git commit -m "i18n: migrate remaining booking flow (book, success, widgets) to translation system"
```

---

## Task 5: Auth (`login`)

**Files:**
- Modify: `lib/i18n.ts` (nouvelles clés `auth.*`)
- Modify: `app/login/page.tsx` (646 lignes — non lu intégralement, extrait audité au brainstorming)
- `app/register/page.tsx` : aucune modification (pure redirection vers `/login?tab=signup`, aucun texte affiché — confirmé par lecture intégrale, 14 lignes).

**Interfaces:**
- Consomme : `useLocale()` si `app/login/page.tsx` est `"use client"` (à confirmer à l'implémentation), sinon `tServer` + `getServerLocale`.
- Produit : `auth.check_email_title`, `auth.confirm_email_title`, `auth.name_placeholder`, `auth.email_placeholder`, `auth.password_placeholder`, `auth.region_tag`, `auth.brand_tag`, `auth.login_title`, `auth.login_subtitle`.

- [ ] **Step 1: Confirmer qu'`app/register/page.tsx` n'a rien à migrer**

```bash
cat app/register/page.tsx
```

Expected : 14 lignes, redirection serveur pure, aucun JSX rendu. Ne rien modifier.

- [ ] **Step 2: Auditer `app/login/page.tsx` en entier**

```bash
grep -nE '>[A-ZÀ-Üa-zà-ÿ][^<{]{3,}<|placeholder="[^"]+"|aria-label="[^"]+"|title="[^"]+"' app/login/page.tsx
```

Confirmé lors du brainstorming (extrait, non exhaustif — relire le fichier en entier à l'implémentation pour la liste complète) :
- Ligne 229 : `Vérifiez vos emails` → `auth.check_email_title`
- Ligne 260 : `Confirmez votre email` → `auth.confirm_email_title`
- Ligne 317 : `placeholder="Prénom Nom"` → `auth.name_placeholder`
- Ligne 343 : `placeholder="vous@exemple.com"` → `auth.email_placeholder`
- Lignes 370, 413 : `placeholder="••••••••"` → `auth.password_placeholder`
- Ligne 584 : `Martinique` → nom propre, ne pas traduire
- Ligne 605 : `Kayvila` → nom de marque, ne pas traduire
- Ligne 608 : `Connexion` → `auth.login_title`
- Ligne 610 : `Accédez à votre espace Kayvila.` → `auth.login_subtitle`

Relire le fichier en entier pour capturer les textes des formulaires de signup, boutons submit, messages d'erreur de validation non couverts par cet extrait (le fichier fait 646 lignes, cet audit est partiel).

- [ ] **Step 3: Ajouter les clés dans `lib/i18n.ts`**

Bloc `fr` (nouveau namespace, après le bloc `Prestations` ligne 262) :

```ts
    // ── Auth ─────────────────────────────────────────────────
    "auth.check_email_title": "Vérifiez vos emails",
    "auth.confirm_email_title": "Confirmez votre email",
    "auth.name_placeholder": "Prénom Nom",
    "auth.email_placeholder": "vous@exemple.com",
    "auth.password_placeholder": "••••••••",
    "auth.login_title": "Connexion",
    "auth.login_subtitle": "Accédez à votre espace Kayvila.",
```

Bloc `en` (après le bloc `Prestations`, ligne ~500) :

```ts
    // ── Auth ─────────────────────────────────────────────────
    "auth.check_email_title": "Check your emails",
    "auth.confirm_email_title": "Confirm your email",
    "auth.name_placeholder": "First Last name",
    "auth.email_placeholder": "you@example.com",
    "auth.password_placeholder": "••••••••",
    "auth.login_title": "Login",
    "auth.login_subtitle": "Access your Kayvila account.",
```

Bloc `es` (après le bloc `Prestations`, ligne ~738) :

```ts
    // ── Auth ─────────────────────────────────────────────────
    "auth.check_email_title": "Revise sus correos",
    "auth.confirm_email_title": "Confirme su email",
    "auth.name_placeholder": "Nombre Apellido",
    "auth.email_placeholder": "usted@ejemplo.com",
    "auth.password_placeholder": "••••••••",
    "auth.login_title": "Iniciar sesión",
    "auth.login_subtitle": "Acceda a su espacio Kayvila.",
```

- [ ] **Step 4: Câbler `app/login/page.tsx`**

Vérifier en tête de fichier si `"use client"` est présent (probable, vu l'usage de formulaires interactifs). Ajouter `import { useLocale } from "@/contexts/LocaleContext";` et `const { t } = useLocale();` dans le composant principal, puis remplacer chaque occurrence listée au Step 2 par l'appel `t("clé")` correspondant (`placeholder={t("auth.name_placeholder")}`, etc.). Si le fichier mélange des sections server/client (peu probable pour une page de login interactive), adapter avec `tServer`/`getServerLocale` pour les parties server uniquement.

- [ ] **Step 5: Re-vérifier + vérification visuelle**

```bash
grep -nE '>[A-ZÀ-Üa-zà-ÿ][^<{]{3,}<|placeholder="[^"]+"|aria-label="[^"]+"|title="[^"]+"' app/login/page.tsx
npm run dev
```

Ouvrir `/login` dans les 3 langues, tester les onglets connexion/inscription si présents, vérifier les placeholders et messages d'état ("Vérifiez vos emails", "Confirmez votre email").

- [ ] **Step 6: Commit**

```bash
git add lib/i18n.ts app/login/page.tsx
git commit -m "i18n: migrate login page to translation system"
```

---

## Task 6: Espace-client — partie 1 (shell, profil, réservations)

**Files:**
- Modify: `lib/i18n.ts` (nouveau namespace `espace.*`)
- Modify: `app/espace-client/EspaceClientShell.tsx`
- Modify: `app/espace-client/layout.tsx`
- Modify: `app/espace-client/page.tsx` (379 lignes — non lu, auditer)
- Modify: `app/espace-client/profil/page.tsx` (239 lignes — non lu, auditer)
- Modify: `app/espace-client/reservations/[id]/page.tsx` (383 lignes — non lu, auditer)
- `app/espace-client/parrainage/page.tsx` : aucune modification (redirection pure vers `/espace-client`, confirmé par lecture intégrale, 6 lignes).

**Interfaces:**
- Consomme : `useLocale()` (client) ou `tServer`/`getServerLocale` (server) selon le type de chaque fichier — à déterminer à l'implémentation (les pages `espace-client` mêlent probablement les deux, comme `messagerie/page.tsx` du Task 7 qui est un server component pur).
- Produit : namespace `espace.*` — clés exactes déterminées lors de l'audit du Step 2 (non prédéfinies ici car les fichiers n'ont pas été lus).

- [ ] **Step 1: Confirmer que `parrainage/page.tsx` n'a rien à migrer**

```bash
cat app/espace-client/parrainage/page.tsx
```

Expected : 6 lignes, `redirect("/espace-client")`, commentaire `Parrainage désactivé`, aucun texte affiché. Ne rien modifier.

- [ ] **Step 2: Auditer les fichiers du groupe**

```bash
grep -nE '>[A-ZÀ-Üa-zà-ÿ][^<{]{3,}<|placeholder="[^"]+"|aria-label="[^"]+"|title="[^"]+"' app/espace-client/EspaceClientShell.tsx app/espace-client/layout.tsx app/espace-client/page.tsx app/espace-client/profil/page.tsx "app/espace-client/reservations/[id]/page.tsx"
```

Noter pour chaque fichier : type (server/client — chercher `"use client"` en ligne 1), et pour chaque texte trouvé, si une clé `client.*` existante convient (`client.my_bookings`, `client.my_profile`, `client.documents`, etc. — `lib/i18n.ts:232-241`) avant de créer une clé `espace.*`.

- [ ] **Step 3: Ajouter les clés identifiées dans `lib/i18n.ts`**

Créer un nouveau bloc de section après `// ── Espace client ──` existant (ligne 231 en `fr`, ligne 469 en `en`, ligne 708 en `es`) — étendre ce namespace `client.*` existant plutôt que d'en créer un nouveau `espace.*`, pour éviter la duplication (le namespace `client.*` couvre déjà ce domaine fonctionnel). Ajouter les clés trouvées au Step 2 dans les 3 blocs, avec des noms explicites (`client.shell_*`, `client.profil_*`, `client.reservation_detail_*`).

- [ ] **Step 4: Câbler chaque fichier**

Pour chaque fichier server component : ajouter `import { headers } from "next/headers";` et `import { getServerLocale, tServer } from "@/lib/i18n";`, puis `const locale = getServerLocale(await headers());` en tête de la fonction async, et remplacer chaque texte par `tServer(locale, "clé")`. Pour chaque fichier `"use client"` : `import { useLocale } from "@/contexts/LocaleContext";`, `const { t } = useLocale();`, remplacer par `t("clé")`.

- [ ] **Step 5: Re-vérifier + vérification visuelle**

```bash
grep -nE '>[A-ZÀ-Üa-zà-ÿ][^<{]{3,}<|placeholder="[^"]+"|aria-label="[^"]+"|title="[^"]+"' app/espace-client/EspaceClientShell.tsx app/espace-client/layout.tsx app/espace-client/page.tsx app/espace-client/profil/page.tsx "app/espace-client/reservations/[id]/page.tsx"
npm run dev
```

Se connecter avec un compte locataire de test (cf. mémoire "Comptes de test Kayvila"), ouvrir `/espace-client`, `/espace-client/profil`, `/espace-client/reservations/[id]` dans les 3 langues.

- [ ] **Step 6: Commit**

```bash
git add lib/i18n.ts app/espace-client/EspaceClientShell.tsx app/espace-client/layout.tsx app/espace-client/page.tsx app/espace-client/profil/page.tsx "app/espace-client/reservations/[id]/page.tsx"
git commit -m "i18n: migrate espace-client shell, profile and reservation detail to translation system"
```

---

## Task 7: Espace-client — partie 2 (checklist, conciergerie, documents, favoris, livret, messagerie, notifications, demandes)

**Files:**
- Modify: `lib/i18n.ts` (extension du namespace `client.*`)
- Modify: `app/espace-client/checklist/page.tsx` (384 lignes — non lu, auditer)
- Modify: `app/espace-client/conciergerie/page.tsx` (128 lignes — non lu, auditer)
- Modify: `app/espace-client/documents/page.tsx` (148 lignes — non lu, auditer)
- Modify: `app/espace-client/favoris/page.tsx` (131 lignes — non lu, auditer)
- Modify: `app/espace-client/livret/page.tsx` (446 lignes — non lu, auditer)
- Modify: `app/espace-client/livret/print/page.tsx` (179 lignes — non lu, auditer)
- Modify: `app/espace-client/messagerie/page.tsx` (fichier lu intégralement, contenu ci-dessous)
- Modify: `app/espace-client/notifications/page.tsx` (149 lignes — non lu, auditer)
- Modify: `app/espace-client/demandes/page.tsx` (78 lignes — non lu, auditer)
- Modify: `components/espace-client/TenantSectionHeader.tsx` (consommateur des props `title`/`description` traduites — vérifier s'il a lui-même du texte en dur)

**Interfaces:**
- Consomme : `tServer` + `getServerLocale` (`messagerie/page.tsx` est confirmé server component async).
- Produit : `client.messagerie_title`, `client.messagerie_desc`, et les clés issues de l'audit des 8 autres fichiers (à définir au Step 3).

- [ ] **Step 1: Câbler `app/espace-client/messagerie/page.tsx` (exemple représentatif, fichier lu intégralement)**

Ajouter dans `lib/i18n.ts`, bloc `fr` (dans l'extension du namespace `client.*` du Task 6) :

```ts
    "client.messagerie_title": "Notre équipe",
    "client.messagerie_desc": "Une question, un besoin pendant votre séjour ? Écrivez-nous, on vous répond sous 24h.",
```

Bloc `en` :

```ts
    "client.messagerie_title": "Our team",
    "client.messagerie_desc": "A question or need during your stay? Write to us, we reply within 24h.",
```

Bloc `es` :

```ts
    "client.messagerie_title": "Nuestro equipo",
    "client.messagerie_desc": "¿Una pregunta o necesidad durante su estancia? Escríbanos, respondemos en 24h.",
```

Remplacer le contenu de `app/espace-client/messagerie/page.tsx` :

```tsx
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getSupabaseServer, getCurrentUser } from "@/lib/supabase-server";
import { tenantBookingsOrFilter } from "@/lib/booking-tenant";
import { TenantSectionHeader } from "@/components/espace-client/TenantSectionHeader";
import { TenantTeamThread } from "@/components/espace-client/TenantTeamThread";
import { getServerLocale, tServer } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function MessageriePage() {
  const locale = getServerLocale(await headers());
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await getCurrentUser();
  if (!user) redirect("/login?redirect=/espace-client/messagerie");

  const [{ data: profile }, { data: bookingRows }] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
    supabase
      .from("bookings")
      .select("id, villa_id")
      .or(tenantBookingsOrFilter(user.id, user.email))
      .in("status", ["confirmed", "pending"])
      .gt("end_date", new Date().toISOString())
      .order("start_date", { ascending: true })
      .limit(1),
  ]);

  const firstName = profile?.full_name?.split(" ")[0] ?? "";
  const booking = bookingRows?.[0] ?? null;

  let villaName: string | null = null;
  if (booking?.villa_id) {
    const { data: villa } = await supabase
      .from("villas")
      .select("name")
      .eq("id", booking.villa_id)
      .maybeSingle();
    villaName = villa?.name ?? null;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <TenantSectionHeader
        title={tServer(locale, "client.messagerie_title")}
        description={tServer(locale, "client.messagerie_desc")}
      />
      <TenantTeamThread guestId={user.id} firstName={firstName} villaName={villaName} />
    </div>
  );
}
```

- [ ] **Step 2: Vérifier `TenantSectionHeader.tsx`**

```bash
grep -nE '>[A-ZÀ-Üa-zà-ÿ][^<{]{3,}<|placeholder="[^"]+"|aria-label="[^"]+"|title="[^"]+"' components/espace-client/TenantSectionHeader.tsx
```

Ce composant ne fait que rendre les props `title`/`description` reçues (déjà traduites par ses appelants) — s'il contient un texte en dur propre (ex. un libellé de bouton "fermer"), le migrer avec une clé `client.*` dédiée en suivant le même procédé.

- [ ] **Step 3: Auditer et migrer les 8 fichiers restants**

```bash
grep -nE '>[A-ZÀ-Üa-zà-ÿ][^<{]{3,}<|placeholder="[^"]+"|aria-label="[^"]+"|title="[^"]+"' app/espace-client/checklist/page.tsx app/espace-client/conciergerie/page.tsx app/espace-client/documents/page.tsx app/espace-client/favoris/page.tsx app/espace-client/livret/page.tsx app/espace-client/livret/print/page.tsx app/espace-client/notifications/page.tsx app/espace-client/demandes/page.tsx
```

Pour chaque fichier : déterminer server vs client (`"use client"` en ligne 1), réutiliser les clés `client.*` existantes quand le sens correspond (`client.checklist`, `client.documents`, `client.no_bookings`, `client.contact_sav`, `client.sav_prompt` existent déjà), sinon créer des clés `client.<page>_*` suivant la convention établie aux Steps 1 et 3 du Task 6. Appliquer `tServer`/`getServerLocale` ou `useLocale()` selon le type de composant.

- [ ] **Step 4: Re-vérifier + vérification visuelle**

```bash
grep -nE '>[A-ZÀ-Üa-zà-ÿ][^<{]{3,}<|placeholder="[^"]+"|aria-label="[^"]+"|title="[^"]+"' app/espace-client/checklist/page.tsx app/espace-client/conciergerie/page.tsx app/espace-client/documents/page.tsx app/espace-client/favoris/page.tsx app/espace-client/livret/page.tsx app/espace-client/livret/print/page.tsx app/espace-client/messagerie/page.tsx app/espace-client/notifications/page.tsx app/espace-client/demandes/page.tsx
npm run dev
```

Parcourir chaque page listée dans les 3 langues avec un compte locataire de test connecté, y compris `/espace-client/livret/print` (vérifier le rendu impression/PDF si applicable).

- [ ] **Step 5: Commit**

```bash
git add lib/i18n.ts app/espace-client/checklist/page.tsx app/espace-client/conciergerie/page.tsx app/espace-client/documents/page.tsx app/espace-client/favoris/page.tsx app/espace-client/livret/page.tsx "app/espace-client/livret/print/page.tsx" app/espace-client/messagerie/page.tsx app/espace-client/notifications/page.tsx app/espace-client/demandes/page.tsx components/espace-client/TenantSectionHeader.tsx
git commit -m "i18n: migrate remaining espace-client pages to translation system"
```
