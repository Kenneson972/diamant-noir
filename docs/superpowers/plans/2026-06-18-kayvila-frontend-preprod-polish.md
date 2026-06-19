# Kayvila Frontend Pré-prod Polish — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Corriger les 45 problèmes pré-prod sélectionnés (SEO, images, design system, i18n, cookie consent, micro-interactions) sans toucher aux fonctionnalités existantes.

**Architecture:** 6 tâches indépendantes, chacune commitée séparément. L'ordre est : SEO d'abord (switch domaine imminent), puis images, design system, i18n, cookie consent, micro-interactions.

**Tech Stack:** Next.js 15, Tailwind CSS, TypeScript, sharp CLI (conversion images), @heroui-pro/react

## Global Constraints

- `npm run build` doit passer après chaque tâche — vérifier systématiquement
- Un commit atomique par tâche — message en français
- NE PAS TOUCHER : hero.webm, frames scroll, Stripe, auth, API routes, dashboard admin, palette gold/navy/offwhite
- Domaine cible : `https://kayvila.com` (pas `diamant-noir.vercel.app`)
- Qualité images WebP : 85 (visuellement identique au PNG)
- Tous les changements `text-navy/60` → `text-navy/80` sont dans les fichiers `.tsx` uniquement (pas dans les composants admin)

---

## Tâche 1 — SEO : canonicals, og:url, og:type, alt héro

**Fichiers :**
- Modifier : `app/layout.tsx` (openGraph url + metadataBase hardcodé)
- Modifier : `app/page.tsx` (canonical + og:type)
- Modifier : `app/villas/page.tsx` (canonical)
- Modifier : `app/villas/[id]/page.tsx` (og:type product + canonical)
- Modifier : `app/faq/page.tsx` (canonical)
- Modifier : `app/contact/layout.tsx` (canonical)
- Modifier : `app/qui-sommes-nous/page.tsx` (canonical)
- Modifier : `app/soumettre-ma-villa/page.tsx` (canonical)
- Modifier : `app/mentions-legales/page.tsx` (canonical — à créer si absent)
- Modifier : `app/cgv/page.tsx` (canonical — à créer si absent)
- Modifier : `app/prestations/layout.tsx` (canonical)
- Modifier : `components/home/HeroBackgroundMedia.tsx` (alt image poster)

**Interfaces :**
- Consomme : Next.js `Metadata` type
- Produit : pages avec `alternates.canonical` et `openGraph.url` corrects

- [ ] **Étape 1 : Hardcoder le domaine dans layout.tsx**

Remplacer la logique siteUrl dynamique par une constante. Dans `app/layout.tsx`, modifier le bloc `const siteUrl = ...` :

```typescript
// Avant (lignes 39-43) :
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
  "http://localhost:3000";

// Après :
const siteUrl = process.env.NODE_ENV === "development"
  ? "http://localhost:3000"
  : "https://kayvila.com";
```

- [ ] **Étape 2 : Ajouter og:url dans le openGraph de layout.tsx**

Dans `app/layout.tsx`, ajouter `url` dans l'objet `openGraph` (après `siteName`) :

```typescript
openGraph: {
  type: "website",
  locale: ogLocale,
  siteName: "Kayvila",
  url: "https://kayvila.com",   // ← ajouter cette ligne
  title,
  description,
  images: [{ url: "/og-default.jpg", width: 1200, height: 630 }],
},
```

- [ ] **Étape 3 : Ajouter canonical dans alternates du layout**

Dans `app/layout.tsx`, dans l'objet `alternates`, ajouter le canonical :

```typescript
alternates: {
  canonical: "https://kayvila.com",   // ← ajouter cette ligne
  languages: {
    fr: "/",
    en: "/en",
    es: "/es",
  },
},
```

- [ ] **Étape 4 : Corriger l'alt vide sur le poster héro**

Dans `components/home/HeroBackgroundMedia.tsx`, ligne 62-63 :

```typescript
// Avant :
<Image
  src="/villa-hero.jpg"
  alt=""

// Après :
<Image
  src="/villa-hero.jpg"
  alt="Villa de luxe avec piscine en Martinique — Kayvila"
```

- [ ] **Étape 5 : Ajouter canonicals sur les pages publiques principales**

Pour chaque fichier ci-dessous, ajouter (ou compléter) l'export `metadata` :

**`app/page.tsx`** — ajouter dans l'objet metadata existant :
```typescript
alternates: { canonical: "https://kayvila.com" },
openGraph: { ...(existant), url: "https://kayvila.com", type: "website" },
```

**`app/villas/page.tsx`** — ajouter :
```typescript
alternates: { canonical: "https://kayvila.com/villas" },
openGraph: { ...(existant), url: "https://kayvila.com/villas", type: "website" },
```

**`app/villas/[id]/page.tsx`** — dans `generateMetadata`, changer `og:type` en `"product"` et ajouter canonical dynamique :
```typescript
alternates: { canonical: `https://kayvila.com/villas/${id}` },
openGraph: { ...(existant), url: `https://kayvila.com/villas/${id}`, type: "product" },
```

**`app/faq/page.tsx`** :
```typescript
alternates: { canonical: "https://kayvila.com/faq" },
```

**`app/contact/layout.tsx`** :
```typescript
alternates: { canonical: "https://kayvila.com/contact" },
```

**`app/qui-sommes-nous/page.tsx`** :
```typescript
alternates: { canonical: "https://kayvila.com/qui-sommes-nous" },
```

**`app/soumettre-ma-villa/page.tsx`** :
```typescript
alternates: { canonical: "https://kayvila.com/soumettre-ma-villa" },
```

**`app/prestations/layout.tsx`** :
```typescript
alternates: { canonical: "https://kayvila.com/prestations" },
```

- [ ] **Étape 6 : Canonicals sur mentions-légales et CGV**

Vérifier si `app/mentions-legales/page.tsx` et `app/cgv/page.tsx` ont un export `metadata`. Si oui, ajouter le canonical. Si non, créer l'export :

```typescript
export const metadata: Metadata = {
  title: "Mentions légales",
  alternates: { canonical: "https://kayvila.com/mentions-legales" },
};
```

Même chose pour CGV :
```typescript
export const metadata: Metadata = {
  title: "Conditions générales de vente",
  alternates: { canonical: "https://kayvila.com/cgv" },
};
```

- [ ] **Étape 7 : Vérifier le build**

```bash
cd diamant-noir && npm run build
```
Attendu : build réussi, zéro erreur TypeScript.

- [ ] **Étape 8 : Commit**

```bash
git add app/layout.tsx app/page.tsx app/villas/page.tsx "app/villas/[id]/page.tsx" app/faq/page.tsx app/contact/layout.tsx app/qui-sommes-nous/page.tsx app/soumettre-ma-villa/page.tsx app/prestations/layout.tsx app/mentions-legales/page.tsx app/cgv/page.tsx components/home/HeroBackgroundMedia.tsx
git commit -m "seo: canonicals kayvila.com + og:url + og:type + alt héro"
```

---

## Tâche 2 — Images : PNG → WebP (qualité 85)

**Fichiers :**
- Créer : `public/marketing.webp`, `public/relation.webp`, `public/terrain.webp`, `public/finance.webp`, `public/menage.webp`, `public/notregestion.webp`
- Garder les originaux dans `public/originals/` (créer le dossier)
- Modifier : composants qui importent ces PNG (voir étape 3)

**Interfaces :**
- Consomme : fichiers PNG dans `public/`
- Produit : fichiers WebP dans `public/` + imports mis à jour

- [ ] **Étape 1 : Installer sharp-cli si nécessaire**

```bash
cd diamant-noir && npx sharp-cli --version 2>/dev/null || npm install -g sharp-cli
```

- [ ] **Étape 2 : Copier les originaux et convertir**

```bash
cd diamant-noir
mkdir -p public/originals

# Copier les originaux
cp public/marketing.png public/originals/
cp public/relation.png public/originals/
cp public/terrain.png public/originals/
cp public/finance.png public/originals/
cp public/menage.png public/originals/
cp public/notregestion.png public/originals/

# Convertir en WebP qualité 85
for img in marketing relation terrain finance menage notregestion; do
  npx sharp-cli --input public/${img}.png --output public/${img}.webp --format webp --quality 85
done
```

Vérifier que les fichiers .webp sont créés :
```bash
ls -lh public/*.webp
```
Attendu : 6 fichiers, chacun < 200 KB.

- [ ] **Étape 3 : Remplacer les imports PNG → WebP dans les composants**

Grep pour trouver tous les composants qui importent ces images :
```bash
grep -rn "marketing\.png\|relation\.png\|terrain\.png\|finance\.png\|menage\.png\|notregestion\.png" components/ app/
```

Pour chaque fichier trouvé, remplacer `.png"` par `.webp"` sur les lignes concernées.

Les composants probables d'après la spec Élise :
- `components/home/HomeServicesSection.tsx`
- `components/home/HomeOwnersSection.tsx`
- `components/home/HomeFeaturedAudience.tsx`
- `app/(home)/PageHero.tsx` ou similaire

Pattern de remplacement (adapter par fichier) :
```typescript
// Avant :
src="/marketing.png"
// Après :
src="/marketing.webp"
```
Ou si import statique :
```typescript
// Avant :
import marketingImg from "@/public/marketing.png"
// Après :
import marketingImg from "@/public/marketing.webp"
```

- [ ] **Étape 4 : Vérifier le build**

```bash
npm run build
```
Attendu : build réussi.

- [ ] **Étape 5 : Commit**

```bash
git add public/*.webp public/originals/ components/ app/
git commit -m "perf: PNG → WebP qualité 85 (6 images, ~13 MB économisés)"
```

---

## Tâche 3 — Design System : rounded-none + contraste

**Fichiers :**
- Modifier : `components/ui/pro/kayvila-pressable-button.tsx` (ligne 14)
- Modifier : `components/ui/button.tsx` (ligne 23)
- Modifier : tous les `.tsx` contenant `text-navy/60` (158 occurrences, hors admin)

**Interfaces :**
- Consomme : classes Tailwind existantes
- Produit : boutons avec `rounded-none`, textes secondaires avec contraste WCAG AA

- [ ] **Étape 1 : Corriger KayvilaPressableButton**

Dans `components/ui/pro/kayvila-pressable-button.tsx`, ligne 14, remplacer `rounded-xl` par `rounded-none` :

```typescript
// Avant :
"flex items-center justify-center gap-2 rounded-xl bg-gold text-sm font-bold ..."

// Après :
"flex items-center justify-center gap-2 rounded-none bg-gold text-sm font-bold ..."
```

- [ ] **Étape 2 : Corriger Button**

Dans `components/ui/button.tsx`, trouver le className principal et ajouter `rounded-none` s'il n'y est pas. Si le composant utilise `cva` ou similar :

```typescript
// Chercher la ligne avec les classes de base du bouton
// Ajouter "rounded-none" dans les classes de base
// Exemple : "... px-4 py-2 font-semibold rounded-none ..."
```

Vérifier après avec :
```bash
grep -n "rounded" components/ui/button.tsx
```
Attendu : seuls `rounded-none` ou `rounded-full` (pour les pills) doivent rester.

- [ ] **Étape 3 : Remplacer text-navy/60 → text-navy/80 (hors admin)**

Lancer le remplacement sur les composants publics et pages publiques uniquement (pas les fichiers dans `app/(admin)/` ni `components/dashboard/admin/`) :

```bash
# Lister les fichiers concernés (hors admin)
grep -rln "text-navy/60" components/ app/ --include="*.tsx" | grep -v "(admin)\|dashboard/admin"
```

Pour chaque fichier listé, faire le remplacement `text-navy/60` → `text-navy/80`. Si le nombre est gérable, utiliser sed :

```bash
# Remplacer dans components/ public (hors admin)
find components -name "*.tsx" -not -path "*/admin/*" -not -path "*/dashboard/admin/*" \
  -exec sed -i '' 's/text-navy\/60/text-navy\/80/g' {} \;

# Remplacer dans app/ (hors admin)
find app -name "*.tsx" -not -path "*/(admin)/*" \
  -exec sed -i '' 's/text-navy\/60/text-navy\/80/g' {} \;
```

**Important :** Ne pas toucher aux fichiers dans `app/(admin)/` et `components/dashboard/admin/` — le design admin a ses propres règles.

- [ ] **Étape 4 : Vérifier visuellement**

```bash
npm run build
```
Puis inspecter visuellement une page public (villas, contact, homepage) pour confirmer que le contraste est meilleur sans être trop fort.

- [ ] **Étape 5 : Commit**

```bash
git add components/ui/pro/kayvila-pressable-button.tsx components/ui/button.tsx components/ app/
git commit -m "design: rounded-none sur boutons + contraste text-navy/80 WCAG AA"
```

---

## Tâche 4 — i18n : audit complet + middleware + clés ES

**Fichiers :**
- Modifier : `middleware.ts` (publicPaths pour /en et /es)
- Modifier : `lib/i18n.ts` (9 clés checkout ES manquantes)
- Modifier : composants avec textes hardcodés FR (audit à faire)

**Interfaces :**
- Consomme : `SUPPORTED_LOCALES`, fonctions `t()` existantes
- Produit : toutes les routes /en et /es accessibles + 9 clés checkout ES présentes

- [ ] **Étape 1 : Fix middleware — ajouter /en et /es dans publicPaths**

Dans `middleware.ts`, après la lecture du fichier, trouver comment `publicPaths` est utilisé pour matcher les routes. Ajouter le support des préfixes de langue.

Lire d'abord les lignes 60-80 du middleware pour comprendre le matching :
```bash
sed -n '60,80p' diamant-noir/middleware.ts
```

Puis ajouter au tableau `publicPaths` en début de liste ou ajuster le matcher. Le pattern doit couvrir `/en`, `/en/villas`, `/es`, `/es/villas`, etc. :

```typescript
// Dans la logique de vérification isPublic (ligne ~64), 
// avant le check publicPaths.some(...), ajouter :
const langPrefixMatch = pathname.match(/^\/(en|es)(\/.*)?$/);
if (langPrefixMatch) {
  const pathWithoutLang = langPrefixMatch[2] || "/";
  const isLangPublic = publicPaths.some((p) =>
    pathWithoutLang === p || pathWithoutLang.startsWith(p + "/")
  );
  if (isLangPublic) {
    return NextResponse.next();
  }
}
```

- [ ] **Étape 2 : Ajouter les 9 clés checkout manquantes en espagnol**

Dans `lib/i18n.ts`, dans le bloc `es: { ... }`, après la section `booking.*` (autour de la ligne 652), ajouter :

```typescript
// Checkout
"checkout.email_required": "Por favor, ingrese su dirección de email",
"checkout.invalid_email": "Dirección de email inválida",
"checkout.name_required": "Por favor, ingrese su nombre",
"checkout.booking_failed": "La reserva ha fallado",
"checkout.confirm": "Confirmar reserva",
"checkout.title": "Confirmar y pagar",
"checkout.change_selection": "Modificar la selección",
"checkout.villa_not_found": "Villa no encontrada",
"checkout.return_catalog": "Volver al catálogo",
// Booking additional
"booking.nights": "{{n}} noches",
"booking.cleaning": "Gastos de limpieza",
"booking.service_fee": "Comisión de servicio Kayvila",
"booking.not_charged": "Aún no se le cobrará",
"booking.no_overlap": "Villa disponible en estas fechas",
"booking.overlap": "Villa ya reservada en estas fechas",
```

- [ ] **Étape 3 : Audit des textes hardcodés FR**

Grep pour les chaînes françaises typiques non passées par i18n :
```bash
grep -rn "Découvrir\|Confier\|Réserver\|Bienvenue\|Bonjour\|Accueil\|Retour\|Envoyer\|Annuler\|Confirmer" \
  components/ app/ --include="*.tsx" | grep -v "i18n\|//\|\.md\|test\|node_modules" | grep -v "admin"
```

Pour chaque occurrence trouvée sur une page publique (pas admin/dashboard), vérifier si une clé i18n équivalente existe dans `lib/i18n.ts`. Si oui, remplacer le texte hardcodé par `t("clé.existante")`.

Si la clé n'existe pas, ajouter la clé en FR + EN + ES dans `lib/i18n.ts`.

**Note :** Utiliser le hook ou contexte i18n existant dans le projet. Grep pour comprendre le pattern :
```bash
grep -rn "useI18n\|useTranslation\|const t\b" components/ app/ --include="*.tsx" | head -10
```

- [ ] **Étape 4 : Vérifier le build**

```bash
npm run build
```

- [ ] **Étape 5 : Commit**

```bash
git add middleware.ts lib/i18n.ts components/ app/
git commit -m "i18n: middleware /en /es + 9 clés checkout ES + textes hardcodés FR corrigés"
```

---

## Tâche 5 — Cookie Consent v1 : i18n + lien politique cookies

**Fichiers :**
- Modifier : `components/ui/CookieConsent.tsx`

**Interfaces :**
- Consomme : locale depuis `localStorage` clé `dn_locale` (même convention que le reste du projet)
- Produit : bannière trilingue FR/EN/ES avec lien `/cookies`

**Note :** Cette version v1 conserve le localStorage existant et NE bloque PAS les scripts tiers. Le blocage conditionnel de Stripe/analytics est une tâche post-lancement (v2).

- [ ] **Étape 1 : Réécrire CookieConsent.tsx avec i18n**

Remplacer le contenu de `components/ui/CookieConsent.tsx` par :

```typescript
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const STORAGE_KEY = "kayvila-cookie-consent";

type ConsentState = {
  essentials: true;
  analytics: boolean;
  marketing: boolean;
};

const STRINGS = {
  fr: {
    description: "Kayvila utilise des cookies pour améliorer votre expérience. Vous pouvez personnaliser vos préférences.",
    acceptAll: "Tout accepter",
    rejectAll: "Tout refuser",
    customize: "Personnaliser",
    save: "Enregistrer",
    essentials: "Essentiels",
    analytics: "Analytics",
    marketing: "Marketing",
    cookiePolicy: "Politique cookies",
  },
  en: {
    description: "Kayvila uses cookies to improve your experience. You can customize your preferences.",
    acceptAll: "Accept all",
    rejectAll: "Reject all",
    customize: "Customize",
    save: "Save",
    essentials: "Essential",
    analytics: "Analytics",
    marketing: "Marketing",
    cookiePolicy: "Cookie policy",
  },
  es: {
    description: "Kayvila utiliza cookies para mejorar su experiencia. Puede personalizar sus preferencias.",
    acceptAll: "Aceptar todo",
    rejectAll: "Rechazar todo",
    customize: "Personalizar",
    save: "Guardar",
    essentials: "Esenciales",
    analytics: "Analytics",
    marketing: "Marketing",
    cookiePolicy: "Política de cookies",
  },
} as const;

type Locale = keyof typeof STRINGS;

function getLocale(): Locale {
  try {
    const stored = localStorage.getItem("dn_locale") as Locale | null;
    if (stored && stored in STRINGS) return stored;
  } catch {}
  return "fr";
}

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [customizing, setCustomizing] = useState(false);
  const [locale, setLocale] = useState<Locale>("fr");
  const [prefs, setPrefs] = useState<ConsentState>({ essentials: true, analytics: false, marketing: false });

  useEffect(() => {
    setLocale(getLocale());
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  function save(consent: ConsentState) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(consent));
    } catch {}
    setVisible(false);
  }

  if (!visible) return null;

  const s = STRINGS[locale];
  const cookiesPath = locale === "en" ? "/en/cookies" : locale === "es" ? "/es/cookies" : "/cookies";

  return (
    <div
      role="dialog"
      aria-label={s.cookiePolicy}
      aria-modal="true"
      className="fixed bottom-0 left-0 right-0 z-[9999] animate-slide-up border-t border-navy/10 bg-offwhite px-4 py-5 shadow-lg sm:bottom-4 sm:left-4 sm:right-auto sm:max-w-sm sm:rounded-none sm:border"
    >
      <p className="text-[11px] leading-relaxed text-navy/70">
        {s.description}{" "}
        <Link href={cookiesPath} className="underline underline-offset-2 hover:text-navy">
          {s.cookiePolicy}
        </Link>
      </p>

      {customizing && (
        <div className="mt-3 space-y-2 border-t border-navy/10 pt-3">
          <label className="flex items-center justify-between text-[11px] text-navy/80">
            <span>{s.essentials}</span>
            <input type="checkbox" checked disabled className="accent-gold" />
          </label>
          <label className="flex items-center justify-between text-[11px] text-navy/80">
            <span>{s.analytics}</span>
            <input
              type="checkbox"
              checked={prefs.analytics}
              onChange={(e) => setPrefs((p) => ({ ...p, analytics: e.target.checked }))}
              className="accent-gold"
            />
          </label>
          <label className="flex items-center justify-between text-[11px] text-navy/80">
            <span>{s.marketing}</span>
            <input
              type="checkbox"
              checked={prefs.marketing}
              onChange={(e) => setPrefs((p) => ({ ...p, marketing: e.target.checked }))}
              className="accent-gold"
            />
          </label>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={() => save({ essentials: true, analytics: true, marketing: true })}
          className="h-9 bg-gold px-4 text-[11px] font-semibold text-white transition-colors hover:bg-gold/90"
        >
          {s.acceptAll}
        </button>
        <button
          onClick={() => save({ essentials: true, analytics: false, marketing: false })}
          className="h-9 border border-navy/15 px-4 text-[11px] text-navy/70 transition-colors hover:bg-navy/5"
        >
          {s.rejectAll}
        </button>
        {!customizing ? (
          <button
            onClick={() => setCustomizing(true)}
            className="h-9 px-4 text-[11px] text-navy/50 underline underline-offset-2"
          >
            {s.customize}
          </button>
        ) : (
          <button
            onClick={() => save(prefs)}
            className="h-9 border border-navy/15 px-4 text-[11px] text-navy/70 transition-colors hover:bg-navy/5"
          >
            {s.save}
          </button>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Étape 2 : Vérifier le build**

```bash
npm run build
```

- [ ] **Étape 3 : Commit**

```bash
git add components/ui/CookieConsent.tsx
git commit -m "rgpd: cookie consent i18n FR/EN/ES + lien politique cookies"
```

---

## Tâche 6 — Micro-interactions luxe (kill switch)

**Fichiers :**
- Modifier : `components/home/HeroBackgroundMedia.tsx`
- Modifier : `components/villas/VillaListingCard.tsx`

**Interfaces :**
- Consomme : scroll position (window.scrollY), classes Tailwind, transitions CSS
- Produit : parallax subtil sur hero + border glow dorée sur cartes villa

- [ ] **Étape 1 : Parallax hero dans HeroBackgroundMedia.tsx**

En tête du fichier, après `"use client";`, ajouter le kill switch et le hook scroll :

```typescript
const ENABLE_PARALLAX = true; // mettre false pour désactiver

// Dans le composant HeroBackgroundMedia, ajouter :
const [scrollY, setScrollY] = useState(0);

useEffect(() => {
  if (!ENABLE_PARALLAX) return;
  const handler = () => setScrollY(window.scrollY);
  window.addEventListener("scroll", handler, { passive: true });
  return () => window.removeEventListener("scroll", handler);
}, []);
```

Sur la `<div>` racine qui contient la vidéo (ligne 59), ajouter le style de transform :

```typescript
<div
  className="absolute inset-0 h-full w-full overflow-hidden"
  style={ENABLE_PARALLAX ? { transform: `translateY(${scrollY * 0.06}px)`, willChange: "transform" } : undefined}
  aria-hidden
>
```

**Note :** `prefers-reduced-motion` est déjà géré dans ce composant (ligne 46-56), le parallax se coupe naturellement.

- [ ] **Étape 2 : Border glow dorée sur VillaListingCard.tsx**

En tête du fichier (après les imports), ajouter :

```typescript
const ENABLE_BORDER_GLOW = true; // mettre false pour désactiver
```

Dans `VillaListingCard`, trouver l'élément racine de la carte (le `<Link>` ou `<div>` principal qui wrape tout). Ajouter la classe conditionnelle et le style inline :

```typescript
// Trouver le wrapper principal de la carte et ajouter :
className={cn(
  "group ...(classes existantes)...",
  ENABLE_BORDER_GLOW && "transition-[border-color,box-shadow] duration-250"
)}
style={ENABLE_BORDER_GLOW ? {
  // géré via CSS hover — ajouter via Tailwind arbitrary values
} : undefined}
```

Ajouter dans `app/globals.css` (ou Tailwind config) la règle hover :

```css
/* Kayvila — border glow villa card */
.villa-card-luxe {
  transition: border-color 250ms ease, box-shadow 250ms ease;
}
.villa-card-luxe:hover {
  border-color: rgba(212, 175, 55, 0.6);
  box-shadow: 0 0 0 1px rgba(212, 175, 55, 0.15), 0 8px 32px rgba(0, 0, 0, 0.06);
}
```

Et ajouter la classe `villa-card-luxe` sur l'élément wrapper de la carte dans `VillaListingCard.tsx` (conditionnellement si `ENABLE_BORDER_GLOW`).

- [ ] **Étape 3 : Vérifier le build**

```bash
npm run build
```

- [ ] **Étape 4 : Valider visuellement**

Ouvrir le site en dev (`npm run dev`) et vérifier :
- Le parallax hero est subtil (pas de saut brutal au scroll)
- La border glow apparaît au hover sur les cartes villa (or, doux)
- Aucune régression sur mobile (le parallax peut être désactivé sur mobile si saccadé)

Si un effet déplaît : mettre `ENABLE_PARALLAX = false` ou `ENABLE_BORDER_GLOW = false` et committer.

- [ ] **Étape 5 : Commit**

```bash
git add components/home/HeroBackgroundMedia.tsx components/villas/VillaListingCard.tsx app/globals.css
git commit -m "feat: micro-interactions luxe — parallax hero + border glow villa (kill switch)"
```

---

## Auto-review du plan

**Couverture spec :**
- ✅ Phase 1 Images (6 PNG → WebP) → Tâche 2
- ✅ Phase 2 Design System (radius + contraste) → Tâche 3
- ✅ Phase 3 SEO (canonicals kayvila.com, og:url, og:type, alt) → Tâche 1
- ✅ Phase 4 i18n (middleware /en /es + 9 clés ES + audit FR hardcodé) → Tâche 4
- ✅ Phase 5 Cookie Consent v1 (i18n + lien politique) → Tâche 5
- ✅ Phase 6 Micro-interactions (parallax + border glow) → Tâche 6

**Ordre d'exécution :** Tâche 1 (SEO) → Tâche 2 → Tâche 3 → Tâche 4 → Tâche 5 → Tâche 6

**Points d'attention :**
- Tâche 3 étape 3 : le find/sed doit exclure `(admin)/` et `dashboard/admin/` sinon les couleurs admin changent
- Tâche 4 étape 1 : lire le middleware.ts complet pour comprendre le pattern exact de matching avant de modifier
- Tâche 6 étape 2 : identifier précisément l'élément wrapper de `VillaListingCard` avant d'ajouter la classe (le composant est client-side avec HoverCard)
