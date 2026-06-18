# Kayvila — Audit Frontend Complet — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Appliquer les 6 phases de polish et corrections front-end (P0 bloquants, design system, animations, SEO, performance, a11y+conversion) sans rien casser du flux Stripe, auth, chatbot et dashboard.

**Architecture:** Chaque phase est un commit atomique indépendant ; les phases B et C modifient les mêmes composants UI donc B précède C. Les phases D, E, F n'ont pas de dépendance entre elles mais arrivent après A+B+C pour garantir un build vert stable.

**Tech Stack:** Next.js 15 · Tailwind v4 (@theme CSS) · HeroUI v2/v3 · TypeScript · Supabase · `lib/i18n.ts` (t + tServer + useLocale)

## Global Constraints

- `npm run build` DOIT passer après chaque commit — vérifier impérativement
- Mobile-first : tester viewport 375px
- Zone interdite : Stripe Connect, auth flow (login/register/reset), dashboard admin, chatbot (sauf aria-live Phase F), API routes, palette gold `#D4AF37` / navy `#0A0A0A` / offwhite `#FAFAFA`, typo Playfair Display + Instrument Sans, layout navbar/footer
- Palette texte : gold décoratif = `#D4AF37`, gold TEXTE accessible = `#B8860B`
- `t(locale, key)` = fonction serveur depuis `lib/i18n.ts` ; `useLocale()` = hook client depuis `contexts/LocaleContext.tsx`
- Locale cookie = `dn_locale` (lire via `cookies()` dans les Server Components)

---

## Task 1: Phase A — P0 Bloquants

**Files:**
- Create: `components/ui/CookieConsent.tsx`
- Create: `app/global-error.tsx`
- Modify: `app/layout.tsx` (intégration CookieConsent + retrait sora.variable de `<html>` → différé à Phase B)
- Modify: `app/villas/page.tsx`, `app/faq/page.tsx`, `app/contact/page.tsx`, `app/soumettre-ma-villa/page.tsx`, `app/qui-sommes-nous/page.tsx`, `app/prestations/page.tsx`, `app/prestations/services/[slug]/page.tsx` (i18n)
- Modify: `lib/i18n.ts` (ajout clés manquantes pour qui-sommes-nous et prestations)
- Modify: `components/booking/CheckoutView.tsx`, `components/VillaListingCard.tsx` ou équivalents (contraste gold texte)

**Interfaces:**
- Consumes: `useLocale()` de `contexts/LocaleContext.tsx` (hook client)
- Consumes: `cookies()` de `next/headers` (server pages)
- Consumes: `t(locale, key)` de `lib/i18n.ts`
- Produces: `CookieConsent` (exported default) utilisé dans `app/layout.tsx`

---

- [ ] **Step 1 : Créer `components/ui/CookieConsent.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "kayvila-cookie-consent";

type ConsentState = {
  essentials: true;
  analytics: boolean;
  marketing: boolean;
};

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [customizing, setCustomizing] = useState(false);
  const [prefs, setPrefs] = useState<ConsentState>({ essentials: true, analytics: false, marketing: false });

  useEffect(() => {
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

  return (
    <div
      role="dialog"
      aria-label="Gestion des cookies"
      aria-modal="true"
      className="fixed bottom-0 left-0 right-0 z-[9999] animate-slide-up border-t border-navy/10 bg-offwhite px-4 py-5 shadow-lg sm:bottom-4 sm:left-4 sm:right-auto sm:max-w-sm sm:rounded-none sm:border"
    >
      <p className="text-[11px] leading-relaxed text-navy/70">
        Kayvila utilise des cookies pour améliorer votre expérience. Vous pouvez
        personnaliser vos préférences.
      </p>

      {customizing && (
        <div className="mt-3 space-y-2 border-t border-navy/10 pt-3">
          <label className="flex items-center justify-between text-[11px] text-navy/80">
            <span>Essentiels</span>
            <input type="checkbox" checked disabled className="accent-gold" />
          </label>
          <label className="flex items-center justify-between text-[11px] text-navy/80">
            <span>Analytics</span>
            <input
              type="checkbox"
              checked={prefs.analytics}
              onChange={(e) => setPrefs((p) => ({ ...p, analytics: e.target.checked }))}
              className="accent-gold"
            />
          </label>
          <label className="flex items-center justify-between text-[11px] text-navy/80">
            <span>Marketing</span>
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
          Tout accepter
        </button>
        <button
          onClick={() => save({ essentials: true, analytics: false, marketing: false })}
          className="h-9 border border-navy/15 px-4 text-[11px] text-navy/70 transition-colors hover:bg-navy/5"
        >
          Tout refuser
        </button>
        {!customizing ? (
          <button
            onClick={() => setCustomizing(true)}
            className="h-9 px-4 text-[11px] text-navy/50 underline underline-offset-2"
          >
            Personnaliser
          </button>
        ) : (
          <button
            onClick={() => save(prefs)}
            className="h-9 border border-navy/15 px-4 text-[11px] text-navy/70 transition-colors hover:bg-navy/5"
          >
            Enregistrer
          </button>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2 : Intégrer CookieConsent dans `app/layout.tsx`**

Ajouter l'import et le composant juste avant la fermeture de `</body>` :

```tsx
// En haut du fichier — ajouter à la liste des imports :
import CookieConsent from "@/components/ui/CookieConsent";

// Dans le JSX, avant </body> (après </LocaleProvider>) :
<CookieConsent />
```

La ligne `<body>` devient :
```tsx
<body className="bg-offwhite font-sans">
  {/* ... contenu existant ... */}
  <CookieConsent />
</body>
```

- [ ] **Step 3 : Créer `app/global-error.tsx`**

```tsx
"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="fr">
      <body className="flex min-h-screen items-center justify-center bg-offwhite font-sans">
        <div className="max-w-md px-6 text-center">
          <p className="font-display text-2xl text-navy">Une erreur est survenue</p>
          <p className="mt-2 text-[11px] text-navy/50">
            {error.digest ? `Référence : ${error.digest}` : "Veuillez réessayer ou contacter le support."}
          </p>
          <button
            onClick={reset}
            className="mt-6 h-11 border border-navy/15 px-8 text-sm text-navy transition-colors hover:bg-navy/5"
          >
            Réessayer
          </button>
        </div>
      </body>
    </html>
  );
}
```

- [ ] **Step 4 : Fix contraste gold — identifier et corriger**

Chercher les usages de `text-gold` sur du TEXTE lisible (prix, labels) :
```bash
grep -rn "text-gold" components/booking/ components/checkout/ components/villas/ --include="*.tsx"
```

Pour chaque occurrence de `text-gold` sur du texte (pas des icônes/séparateurs), remplacer par `text-[#B8860B]`. Exemples typiques :
- Prix affichés : `<span className="text-gold font-bold">` → `text-[#B8860B]`
- Labels tarif : `text-gold` → `text-[#B8860B]`
- NE PAS changer : icônes décoratives, séparateurs, dégradés (keep `text-gold` pour la déco)

- [ ] **Step 5 : i18n — ajouter les clés manquantes dans `lib/i18n.ts`**

Les pages `qui-sommes-nous` et `prestations` n'ont pas de clés i18n. Ajouter dans le bloc `fr` de `translations` (et idem pour `en`, `es`) :

```ts
// Dans translations.fr, après les clés existantes :
"about.title": "Notre mission",
"about.subtitle": "La conciergerie de villa de luxe en Martinique",
"about.intro": "Kayvila accompagne les propriétaires de villas d'exception dans la mise en valeur et la gestion sereine de leur patrimoine.",
"about.adn_title": "Notre ADN",
"about.cta_villas": "Découvrir nos villas",
"about.cta_submit": "Confier ma villa",

"prestations.title": "Nos prestations",
"prestations.subtitle": "Des services pensés pour les propriétaires exigeants",
"prestations.discover": "Découvrir",

// Dans translations.en :
"about.title": "Our mission",
"about.subtitle": "The luxury villa concierge in Martinique",
"about.intro": "Kayvila supports exceptional villa owners in showcasing and serenely managing their property.",
"about.adn_title": "Our DNA",
"about.cta_villas": "Discover our villas",
"about.cta_submit": "Entrust my villa",
"prestations.title": "Our services",
"prestations.subtitle": "Services designed for discerning owners",
"prestations.discover": "Discover",

// Dans translations.es :
"about.title": "Nuestra misión",
"about.subtitle": "La conserjería de villas de lujo en Martinica",
"about.intro": "Kayvila acompaña a los propietarios de villas excepcionales en la valorización y gestión serena de su patrimonio.",
"about.adn_title": "Nuestro ADN",
"about.cta_villas": "Descubrir nuestras villas",
"about.cta_submit": "Confiar mi villa",
"prestations.title": "Nuestros servicios",
"prestations.subtitle": "Servicios diseñados para propietarios exigentes",
"prestations.discover": "Descubrir",
```

- [ ] **Step 6 : i18n — convertir les Server Component pages**

Pour chaque page **server component** (`villas`, `faq`, `qui-sommes-nous`), ajouter en tête du composant default :

```tsx
import { cookies } from "next/headers";
import { tServer } from "@/lib/i18n";

// Dans la fonction :
const cookieStore = await cookies();
const locale = (cookieStore.get("dn_locale")?.value ?? "fr") as "fr" | "en" | "es";

// Utilisation :
<h1>{tServer(locale, "faq.title")}</h1>
// au lieu de :
<h1>Questions fréquentes</h1>
```

Faire de même pour les clés identifiables dans chaque page. Se limiter aux titres, sous-titres, CTA — ne pas re-traduire le contenu éditorial long qui est déjà en fr hardcodé (YAGNI : les FAQ entries, descriptions longues).

- [ ] **Step 7 : i18n — convertir les Client Component pages**

Pour `contact/page.tsx` (déjà `"use client"`) et `prestations/page.tsx` (client dynamique) :

```tsx
import { useLocale } from "@/contexts/LocaleContext";

// Dans le composant :
const { locale, t } = useLocale();

// Utilisation :
<h1>{t("contact.title")}</h1>
```

**Note sur i18n try/catch :** Aucun `await import("@/lib/i18n")` n'existe dans la codebase (imports statiques uniquement) — cette tâche est un no-op, passer à la suivante.

- [ ] **Step 8 : Vérifier le build**

```bash
npm run build
```

Attendu : `✓ Compiled successfully` sans erreur TypeScript. Corriger toute erreur de type avant de continuer.

- [ ] **Step 9 : Commit Phase A**

```bash
git add components/ui/CookieConsent.tsx app/global-error.tsx app/layout.tsx lib/i18n.ts app/villas/page.tsx app/faq/page.tsx app/contact/page.tsx app/soumettre-ma-villa/page.tsx app/qui-sommes-nous/page.tsx app/prestations/page.tsx app/prestations/services/
git commit -m "fix(p0): cookie consent RGPD + global-error + i18n 7 pages + contraste gold"
```

---

## Task 2: Phase B — Design System + Composants manquants

**Files:**
- Modify: `components/ui/input.tsx`
- Modify: `components/ui/card.tsx`
- Modify: `components/ui/button.tsx`
- Modify: `app/layout.tsx` (Sora — retirer sora.variable du className `<html>`)
- Modify: `app/globals.css` (supprimer .card-shadow-*)
- Delete: `tailwind.config.ts`
- Create: `components/ui/Select.tsx`
- Create: `components/ui/Textarea.tsx`
- Create: `components/ui/Checkbox.tsx`
- Create: `components/ui/Badge.tsx`
- Create: `components/ui/Tooltip.tsx`
- Modify: `components/ui/index.ts` (exporter les nouveaux composants)
- Scan + modify: toute page avec `import.*Tabs.*from "@heroui/react"` → rediriger vers `@/components/ui/tabs`

**Interfaces:**
- Produces: `Button` variants `"gold" | "danger" | "secondary"` + tailles `sm=h-9 default=h-11 lg=h-12`
- Produces: `Input` avec standard `rounded-none border-navy/15 focus:border-gold focus:ring-1 focus:ring-gold/30 h-12 px-4`
- Produces: `Select`, `Textarea`, `Checkbox`, `Badge`, `Tooltip` (wrappers Kayvila)

---

- [ ] **Step 1 : Mettre à jour `components/ui/input.tsx`**

```tsx
import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-12 w-full rounded-none border border-navy/15 bg-white px-4 py-2 text-base",
          "ring-offset-white placeholder:text-navy/40",
          "focus-visible:outline-none focus-visible:border-gold focus-visible:ring-1 focus-visible:ring-gold/30",
          "transition-all duration-300",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
```

- [ ] **Step 2 : Mettre à jour `components/ui/card.tsx`**

Remplacer `rounded-3xl` par `rounded-none` et `rounded-xl` par `rounded-none` dans tous les `className` :

```tsx
// Card — ligne className :
"rounded-none border border-navy/5 bg-white text-navy shadow-sm transition-all hover:shadow-md"
```

Le reste du fichier (CardHeader, CardTitle, etc.) reste identique — aucun n'a de rounded.

- [ ] **Step 3 : Mettre à jour `components/ui/button.tsx`**

```tsx
import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "gold" | "danger" | "secondary"
  size?: "default" | "sm" | "lg"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    const variants = {
      default:   "bg-navy text-white hover:bg-navy/90",
      outline:   "border border-navy/15 bg-white hover:bg-navy/5 text-navy",
      ghost:     "hover:bg-navy/5 text-navy",
      gold:      "bg-gold text-white hover:bg-gold/90",
      danger:    "bg-red-600 text-white hover:bg-red-700",
      secondary: "bg-navy/5 text-navy hover:bg-navy/10",
    }
    const sizes = {
      sm:      "h-9 px-3 text-sm",
      default: "h-11 px-4 py-2 text-sm",
      lg:      "h-12 px-8 text-base",
    }

    return (
      <button
        className={cn(
          "inline-flex items-center justify-center font-medium transition-all duration-300",
          "focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
          variants[variant],
          sizes[size],
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
```

- [ ] **Step 4 : Retirer Sora du `<html>` public dans `app/layout.tsx`**

Garder l'import Sora (préchargement font nécessaire pour les layouts dashboard qui en auront besoin), mais retirer `sora.variable` du className de `<html>` :

```tsx
// Avant :
className={`${sora.variable} ${instrumentSans.variable} ${playfairDisplay.variable} scroll-smooth`}

// Après :
className={`${instrumentSans.variable} ${playfairDisplay.variable} scroll-smooth`}
```

Le layout `app/(admin)/layout.tsx` ou `app/(proprio)/layout.tsx` peut ajouter `sora.variable` localement si besoin — vérifier s'ils existent et si Sora y est utilisé.

- [ ] **Step 5 : Nettoyer `app/globals.css` — supprimer .card-shadow-***

Trouver et supprimer les 4 lignes :
```css
/* À supprimer : */
.card-shadow-sm  { box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 1px 0 rgba(0,0,0,0.04); }
.card-shadow     { box-shadow: 0 4px 16px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04); }
.card-shadow-lg  { box-shadow: 0 12px 40px rgba(0,0,0,0.10), 0 2px 6px rgba(0,0,0,0.06); }
.card-shadow-xl  { box-shadow: 0 20px 60px rgba(0,0,0,0.14), 0 4px 12px rgba(0,0,0,0.08); }
```

Vérifier d'abord qu'elles ne sont utilisées nulle part :
```bash
grep -rn "card-shadow" --include="*.tsx" --include="*.ts" .
```
Si 0 résultats → supprimer.

- [ ] **Step 6 : Supprimer `tailwind.config.ts`**

Tous les tokens (colors, keyframes, animations, screens) sont déjà dans `app/globals.css` `@theme`. La suppression est sûre car `content: []` était déjà vide. En Tailwind v4 (`@import "tailwindcss"`), la détection de contenu est automatique.

```bash
rm tailwind.config.ts
npm run build   # vérifier immédiatement
```

Si le build échoue, annuler : `git checkout tailwind.config.ts` et investiguer.

- [ ] **Step 7 : Créer `components/ui/Select.tsx`**

```tsx
import * as React from "react"
import { cn } from "@/lib/utils"

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => (
    <select
      className={cn(
        "flex h-12 w-full appearance-none rounded-none border border-navy/15 bg-white px-4 text-base text-navy",
        "focus-visible:outline-none focus-visible:border-gold focus-visible:ring-1 focus-visible:ring-gold/30",
        "transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    >
      {children}
    </select>
  )
)
Select.displayName = "Select"

export { Select }
```

- [ ] **Step 8 : Créer `components/ui/Textarea.tsx`**

```tsx
import * as React from "react"
import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      className={cn(
        "flex min-h-[120px] w-full rounded-none border border-navy/15 bg-white px-4 py-3 text-base text-navy",
        "placeholder:text-navy/40 resize-y",
        "focus-visible:outline-none focus-visible:border-gold focus-visible:ring-1 focus-visible:ring-gold/30",
        "transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    />
  )
)
Textarea.displayName = "Textarea"

export { Textarea }
```

- [ ] **Step 9 : Créer `components/ui/Checkbox.tsx`**

```tsx
import * as React from "react"
import { cn } from "@/lib/utils"

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, id, ...props }, ref) => (
    <label htmlFor={id} className="flex cursor-pointer items-center gap-2">
      <input
        id={id}
        type="checkbox"
        ref={ref}
        className={cn("h-4 w-4 accent-gold cursor-pointer", className)}
        {...props}
      />
      {label && <span className="text-[13px] text-navy/80">{label}</span>}
    </label>
  )
)
Checkbox.displayName = "Checkbox"

export { Checkbox }
```

- [ ] **Step 10 : Créer `components/ui/Badge.tsx`**

```tsx
import * as React from "react"
import { cn } from "@/lib/utils"

type BadgeVariant = "default" | "gold" | "success" | "warning" | "danger"

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-navy/5 text-navy/70",
  gold:    "bg-gold/10 text-[#B8860B]",
  success: "bg-green-50 text-green-700",
  warning: "bg-amber-50 text-amber-700",
  danger:  "bg-red-50 text-red-600",
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
        variantClasses[variant],
        className
      )}
      {...props}
    />
  )
}
```

- [ ] **Step 11 : Créer `components/ui/Tooltip.tsx`**

```tsx
"use client";

import * as React from "react"
import { cn } from "@/lib/utils"

interface TooltipProps {
  content: string
  children: React.ReactNode
  className?: string
}

export function Tooltip({ content, children, className }: TooltipProps) {
  return (
    <span className={cn("group relative inline-flex", className)}>
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 mb-1.5 -translate-x-1/2 whitespace-nowrap bg-navy px-2 py-1 text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
      >
        {content}
      </span>
    </span>
  )
}
```

- [ ] **Step 12 : Mettre à jour `components/ui/index.ts`**

```ts
export { Button } from "./button"
export { Input } from "./input"
export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent } from "./card"
export { Skeleton } from "./skeleton"
export { Select } from "./Select"
export { Textarea } from "./Textarea"
export { Checkbox } from "./Checkbox"
export { Badge } from "./Badge"
export { Tooltip } from "./Tooltip"
```

- [ ] **Step 13 : Uniformiser les imports Tabs**

```bash
grep -rn "from \"@heroui/react\"" --include="*.tsx" . | grep -i "tabs" | grep -v node_modules
```

Pour chaque fichier trouvé, remplacer le Tabs HeroUI direct par le wrapper Kayvila :
```tsx
// Avant :
import { Tabs, Tab } from "@heroui/react"
// Après :
import { Tabs, Tab } from "@/components/ui/tabs"
```

- [ ] **Step 14 : Vérifier le build**

```bash
npm run build
```

Attendu : `✓ Compiled successfully`. Corriger toute erreur.

- [ ] **Step 15 : Commit Phase B**

```bash
git add components/ui/ app/layout.tsx app/globals.css
git rm tailwind.config.ts
git commit -m "feat(design-system): border-radius none, inputs standard, boutons variants, Sora retiré, composants UI manquants"
```

---

## Task 3: Phase C — Animations & Micro-interactions

**Files:**
- Modify: `components/ui/button.tsx` (hover lift)
- Modify: `components/ui/pro/kayvila-pressable-button.tsx` (hover lift + focus ring)
- Modify: `components/ui/skeleton.tsx` (shimmer)
- Modify: `app/layout.tsx` (grain overlay + View Transitions)
- Modify: `app/globals.css` (classe grain si nécessaire)

**Interfaces:**
- Consumes: keyframe `animate-shimmer` et `animate-slide-up` déjà dans `globals.css`

---

- [ ] **Step 1 : Ajouter hover lift dans `components/ui/button.tsx`**

Dans le `cn(...)` du Button, ajouter après les classes existantes :
```tsx
"hover:scale-[1.02] active:scale-[0.98]",
```

La ligne complète du `cn` devient :
```tsx
className={cn(
  "inline-flex items-center justify-center font-medium transition-all duration-300",
  "focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
  "hover:scale-[1.02] active:scale-[0.98]",
  variants[variant],
  sizes[size],
  className
)}
```

- [ ] **Step 2 : Mettre à jour `components/ui/pro/kayvila-pressable-button.tsx`**

Lire le fichier, puis ajouter :
- `transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]` dans le className principal
- `focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gold focus-visible:outline-none`

- [ ] **Step 3 : Mettre à jour `components/ui/skeleton.tsx`**

```tsx
import * as React from "react";
import { cn } from "@/lib/utils";

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "bg-gradient-to-r from-navy/5 via-navy/10 to-navy/5 bg-[length:200%_100%] animate-shimmer",
        className
      )}
      {...props}
    />
  );
}
```

- [ ] **Step 4 : Ajouter le grain overlay dans `app/layout.tsx`**

Juste après `<body className="bg-offwhite font-sans">`, ajouter avant `<script` :

```tsx
{/* Grain overlay — texture subtile luxe */}
<div
  aria-hidden="true"
  className="pointer-events-none fixed inset-0 z-50 opacity-[0.015]"
  style={{
    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
    backgroundSize: "128px 128px",
  }}
/>
```

- [ ] **Step 5 : Activer View Transitions dans `app/layout.tsx`**

Dans le `<html>` tag, ajouter :
```tsx
<html
  lang={initialLocale}
  className={`${instrumentSans.variable} ${playfairDisplay.variable} scroll-smooth`}
  // @ts-expect-error — experimental
  style={{ viewTransitionName: "root" }}
>
```

Et dans `app/globals.css`, ajouter (avant la fin du fichier) :
```css
@supports (view-transition-name: root) {
  ::view-transition-old(root) {
    animation: 180ms ease-out both fade-out;
  }
  ::view-transition-new(root) {
    animation: 220ms ease-in both animate-fade-in;
  }

  @keyframes fade-out {
    from { opacity: 1; }
    to   { opacity: 0; }
  }
}
```

- [ ] **Step 6 : Vérifier le build**

```bash
npm run build
```

- [ ] **Step 7 : Commit Phase C**

```bash
git add components/ui/button.tsx components/ui/pro/kayvila-pressable-button.tsx components/ui/skeleton.tsx app/layout.tsx app/globals.css
git commit -m "feat(animations): hover lift boutons, skeleton shimmer, grain overlay, view transitions"
```

---

## Task 4: Phase D — SEO + Metadata

**Files:**
- Modify: `app/success/page.tsx` (generateMetadata + noindex)
- Modify: `app/update-password/page.tsx` (generateMetadata + noindex)
- Modify: `app/villas/[id]/page.tsx` (canonical)
- Modify: `app/soumettre-ma-villa/page.tsx` (canonical)
- Modify: `app/book/page.tsx` (canonical)
- Modify: `app/prestations/services/[slug]/page.tsx` (canonical)
- Modify: `app/villas/page.tsx` (JSON-LD ItemList)
- Modify: `app/page.tsx` (JSON-LD LocalBusiness enrichi)
- Modify: `app/qui-sommes-nous/page.tsx`, `app/faq/page.tsx`, `app/villas/comparer/page.tsx`, `app/soumettre-ma-villa/page.tsx`, `app/book/page.tsx` (openGraph.images)
- Modify: `app/sitemap.ts` (6 pages manquantes)
- Modify: `app/robots.ts` (3 paths manquants)

---

- [ ] **Step 1 : generateMetadata pour `app/success/page.tsx`**

Ajouter avant `export default function` :
```tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Réservation confirmée — Kayvila",
  robots: { index: false, follow: false },
};
```

- [ ] **Step 2 : generateMetadata pour `app/update-password/page.tsx`**

```tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mise à jour du mot de passe — Kayvila",
  robots: { index: false, follow: false },
};
```

- [ ] **Step 3 : Canonical URL pour `app/villas/[id]/page.tsx`**

Dans la fonction `generateMetadata` existante, ajouter `alternates` :
```tsx
alternates: {
  canonical: `https://kayvila.com/villas/${params.id}`,
},
```

- [ ] **Step 4 : Canonicals pour les 3 autres pages**

Dans `app/soumettre-ma-villa/page.tsx` — metadata existante, ajouter :
```tsx
alternates: { canonical: "https://kayvila.com/soumettre-ma-villa" },
```

Dans `app/book/page.tsx` — ajouter (ou créer) metadata :
```tsx
export const metadata: Metadata = {
  title: "Réserver — Kayvila",
  alternates: { canonical: "https://kayvila.com/book" },
};
```

Dans `app/prestations/services/[slug]/page.tsx` — dans generateMetadata :
```tsx
alternates: { canonical: `https://kayvila.com/prestations/services/${params.slug}` },
```

- [ ] **Step 5 : JSON-LD ItemList dans `app/villas/page.tsx`**

Lire la page, identifier le composant retourné. Après la récupération des villas, ajouter avant le `return` :

```tsx
const itemListSchema = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "Villas Kayvila — Martinique",
  url: "https://kayvila.com/villas",
  numberOfItems: villas.length,
  itemListElement: villas.slice(0, 10).map((v, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: v.name,
    url: `https://kayvila.com/villas/${v.id}`,
  })),
};
```

Dans le JSX, ajouter dans `<head>` ou directement dans le composant :
```tsx
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
/>
```

- [ ] **Step 6 : JSON-LD LocalBusiness enrichi dans `app/page.tsx`**

Dans `app/layout.tsx`, le JSON-LD Organization existe déjà (lignes 116-134). Enrichir avec `address` et `geo` :

```tsx
// Remplacer le bloc Organization existant :
{
  "@context": "https://schema.org",
  "@type": ["LocalBusiness", "Organization"],
  name: "Kayvila",
  url: "https://kayvila.com",
  telephone: "+596 696 00 00 00",
  email: "contact@kayvila.com",
  description: "Conciergerie de luxe en Martinique. Villas d'exception, réservation en ligne, entretien et gestion.",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Le Diamant",
    addressRegion: "Martinique",
    addressCountry: "FR",
    postalCode: "97223",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: "14.4736",
    longitude: "-61.0236",
  },
  sameAs: [
    "https://www.instagram.com/kayvila",
    "https://www.facebook.com/kayvila",
  ],
  openingHoursSpecification: {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    opens: "08:00",
    closes: "20:00",
  },
}
```

- [ ] **Step 7 : OG images sur 5 pages**

Pour chaque page listée, dans l'objet `metadata` ou la fonction `generateMetadata`, ajouter :
```tsx
openGraph: {
  images: [{ url: "/og-default.jpg", width: 1200, height: 630, alt: "Kayvila — Villas de luxe Martinique" }],
},
```

Pages : `qui-sommes-nous`, `faq`, `villas/comparer`, `soumettre-ma-villa`, `book`.

- [ ] **Step 8 : Ajouter les 6 pages manquantes dans `app/sitemap.ts`**

Dans le tableau `staticPages`, ajouter :
```tsx
{ url: `${BASE}/villas/comparer`,                      lastModified: new Date(), priority: 0.5, changeFrequency: "monthly" as const },
{ url: `${BASE}/prestations/services/marketing`,       lastModified: new Date(), priority: 0.6, changeFrequency: "monthly" as const },
{ url: `${BASE}/prestations/services/operations`,      lastModified: new Date(), priority: 0.6, changeFrequency: "monthly" as const },
{ url: `${BASE}/prestations/services/voyageurs`,       lastModified: new Date(), priority: 0.6, changeFrequency: "monthly" as const },
{ url: `${BASE}/prestations/services/menage`,          lastModified: new Date(), priority: 0.6, changeFrequency: "monthly" as const },
{ url: `${BASE}/prestations/services/finance`,         lastModified: new Date(), priority: 0.6, changeFrequency: "monthly" as const },
```

- [ ] **Step 9 : Compléter `app/robots.ts`**

```tsx
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin/",
        "/dashboard/",
        "/login",
        "/login/",
        "/api/",
        "/espace-client/",
        "/success",
        "/share/",
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
```

- [ ] **Step 10 : Build + commit Phase D**

```bash
npm run build
git add app/success/page.tsx app/update-password/page.tsx app/villas/ app/soumettre-ma-villa/ app/book/ app/prestations/ app/qui-sommes-nous/ app/faq/ app/sitemap.ts app/robots.ts app/layout.tsx app/page.tsx
git commit -m "feat(seo): metadata noindex, canonicals, JSON-LD LocalBusiness+ItemList, og:image, sitemap+robots"
```

---

## Task 5: Phase E — Performance

**Files:**
- Modify: `app/villas/[id]/page.tsx` (revalidate + generateStaticParams)
- Modify: `app/page.tsx` (https.get → fetch)
- Modify: `components/dashboard/assistant-views/StatsView.tsx` (lazy recharts)
- Modify: `components/dashboard/assistant-views/FinancesView.tsx` (lazy recharts)
- Modify: `components/dashboard/proprio/RelevePDF.tsx` (lazy @react-pdf/renderer)

---

- [ ] **Step 1 : Remplacer force-dynamic dans `app/villas/[id]/page.tsx`**

Lire le fichier. Remplacer :
```tsx
// Supprimer :
export const dynamic = "force-dynamic";
// et tout import unstable_noStore si présent

// Ajouter en remplacement :
export const revalidate = 900; // 15 minutes

export async function generateStaticParams() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data } = await supabase
    .from("villas")
    .select("id")
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(20);
  return (data ?? []).map((v) => ({ id: v.id }));
}
```

Vérifier que `createClient` est déjà importé dans le fichier — sinon ajouter :
```tsx
import { createClient } from "@supabase/supabase-js";
```

- [ ] **Step 2 : Remplacer https.get dans `app/page.tsx`**

Lire le fichier. Localiser la fonction qui utilise `https.get`. La remplacer par `fetch` :

```tsx
// Supprimer :
import https from "https";

// La logique https.get ressemble à :
// https.get(url, { headers }, (res) => { ... })
// Remplacer par :
const res = await fetch(url, {
  headers,
  next: { revalidate: 3600 },
});
const data = await res.json();
```

Adapter selon la structure exacte du code existant.

- [ ] **Step 3 : Lazy-load recharts dans `StatsView.tsx`**

Lire le fichier. Trouver les imports recharts (ex: `import { BarChart, ... } from "recharts"`).

Remplacer par dynamic import :
```tsx
import dynamic from "next/dynamic";

const BarChart = dynamic(() => import("recharts").then((m) => m.BarChart), { ssr: false });
const Bar = dynamic(() => import("recharts").then((m) => m.Bar), { ssr: false });
const XAxis = dynamic(() => import("recharts").then((m) => m.XAxis), { ssr: false });
const YAxis = dynamic(() => import("recharts").then((m) => m.YAxis), { ssr: false });
const Tooltip = dynamic(() => import("recharts").then((m) => m.Tooltip), { ssr: false });
const ResponsiveContainer = dynamic(() => import("recharts").then((m) => m.ResponsiveContainer), { ssr: false });
```

Adapter selon les composants recharts réellement utilisés dans chaque fichier.

Faire la même chose pour `FinancesView.tsx`.

- [ ] **Step 4 : Lazy-load @react-pdf dans `RelevePDF.tsx`**

Lire le fichier. Si le composant est déjà exporté avec `dynamic`, vérifier qu'il a `{ ssr: false }`.

Si pas encore lazy :
```tsx
// Dans le parent qui importe RelevePDF, remplacer l'import statique par :
import dynamic from "next/dynamic";
const RelevePDF = dynamic(() => import("@/components/dashboard/proprio/RelevePDF"), { ssr: false });
```

Si c'est RelevePDF lui-même qui importe `@react-pdf/renderer` :
```tsx
// En tête de RelevePDF.tsx, remplacer :
import { Document, Page, ... } from "@react-pdf/renderer";
// Par : conserver tel quel — le ssr: false du parent suffit.
// (next/dynamic ssr: false empêche le rendu serveur du composant entier)
```

- [ ] **Step 5 : Build + commit Phase E**

```bash
npm run build
git add app/villas/ app/page.tsx components/dashboard/
git commit -m "perf: revalidate villa ISR, fetch home, lazy recharts+PDF"
```

---

## Task 6: Phase F — Accessibilité + Conversion

**Files:**
- Modify: `components/ui/pro/kayvila-pressable-button.tsx` (focus ring — déjà partiellement fait Phase C)
- Create: `hooks/useFocusTrap.ts`
- Modify: `components/VillaQuickView.tsx`, `components/BookingBottomSheet.tsx`, `components/chatbot/Chatbot.tsx` ou `ChatbotDynamic.tsx`, `components/layout/Navbar.tsx` (focus trap)
- Modify: `components/chatbot/Chatbot.tsx` (aria-live)
- Modify: `components/booking/SearchResults.tsx` (aria-live)
- Modify: `components/booking/CheckoutView.tsx` (CTA sticky)
- Modify: `components/BookingForm.tsx` (trust signal + prix estimé)

---

- [ ] **Step 1 : Créer `hooks/useFocusTrap.ts`**

```ts
import { useEffect, useRef } from "react";

const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

export function useFocusTrap<T extends HTMLElement>(active: boolean) {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (!active || !ref.current) return;
    const el = ref.current;
    const focusables = Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE));
    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    first?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "Tab") return;
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    }

    el.addEventListener("keydown", onKeyDown);
    return () => el.removeEventListener("keydown", onKeyDown);
  }, [active]);

  return ref;
}
```

- [ ] **Step 2 : Appliquer useFocusTrap dans `VillaQuickView.tsx`**

Lire le fichier. Identifier l'état `open`/`isOpen`. Ajouter :
```tsx
import { useFocusTrap } from "@/hooks/useFocusTrap";

// Dans le composant :
const trapRef = useFocusTrap<HTMLDivElement>(isOpen);

// Sur le div principal du modal :
<div ref={trapRef} ...>
```

Faire la même chose pour `BookingBottomSheet.tsx` et `Navbar.tsx` (menu mobile).

- [ ] **Step 3 : Ajouter aria-live dans `Chatbot.tsx`**

Lire le fichier chatbot. Trouver le conteneur des messages. Ajouter :
```tsx
<div
  aria-live="polite"
  aria-atomic="false"
  aria-label="Messages du chatbot"
  className="..." // garder classes existantes
>
  {messages}
</div>
```

- [ ] **Step 4 : Ajouter aria-live dans `SearchResults.tsx`**

```tsx
<div aria-live="polite" aria-atomic="true" className="sr-only">
  {results.length} résultat{results.length !== 1 ? "s" : ""} affiché{results.length !== 1 ? "s" : ""}
</div>
```

Ajouter ce div juste avant la liste de résultats.

- [ ] **Step 5 : CTA sticky dans `CheckoutView.tsx`**

Lire le fichier. Trouver la sidebar prix desktop. Ajouter `sticky top-6` sur le wrapper de la sidebar + `sticky bottom-0` sur le bouton si nécessaire :
```tsx
// Sur le div sidebar :
<div className="sticky top-6 space-y-4">
  {/* recap prix existant */}
  <button className="w-full h-12 bg-gold text-white font-semibold hover:bg-gold/90 transition-colors">
    Confirmer et payer
  </button>
</div>
```

- [ ] **Step 6 : Trust signal dans `BookingForm.tsx`**

Lire le fichier. Trouver le bouton CTA "Réserver" principal. Ajouter juste dessous :
```tsx
import { ShieldCheck } from "lucide-react";

// Après le bouton CTA :
<p className="mt-2 flex items-center justify-center gap-1.5 text-[10px] text-navy/40">
  <ShieldCheck className="h-3.5 w-3.5" />
  Paiement sécurisé · Aucun débit maintenant
</p>
```

- [ ] **Step 7 : Prix estimé dans `BookingForm.tsx`**

Lire le fichier. Trouver la section où les dates sont affichées / saisies. Ajouter un état conditionnel :
```tsx
// Identifier la prop pricePerNight ou pricePerNight depuis la villa
// Si les dates ne sont pas encore sélectionnées (startDate && endDate sont null) :
{!startDate && !endDate && pricePerNight && (
  <p className="text-[11px] text-navy/50">
    À partir de <span className="font-semibold text-[#B8860B]">{pricePerNight}€</span> / nuit
  </p>
)}
```

Adapter selon les props/state réels du composant.

- [ ] **Step 8 : Build final + commit Phase F**

```bash
npm run build
git add hooks/ components/VillaQuickView.tsx components/BookingBottomSheet.tsx components/layout/Navbar.tsx components/chatbot/ components/booking/ components/BookingForm.tsx components/ui/pro/kayvila-pressable-button.tsx
git commit -m "feat(a11y+conversion): focus trap, aria-live, CTA sticky, prix estimé, trust signal"
```

---

## Vérification finale post-toutes-phases

- [ ] `npm run build` — 0 erreur
- [ ] `npm run dev` → ouvrir `/villas`, `/villas/[id]`, `/faq`, `/contact`, `/soumettre-ma-villa`, `/book`, `/success`, `/qui-sommes-nous`, `/prestations`
- [ ] Checkout Stripe mode test : le bouton "Confirmer et payer" mène à Stripe, le retour `/success` fonctionne
- [ ] Chatbot : toujours fonctionnel, `aria-live` présent dans le DOM
- [ ] Bannière cookie : apparaît à la première visite, localStorage persiste le choix
- [ ] Contraste gold : prix affichés en `#B8860B` sur fond blanc (ratio ≥ 4.5:1)
- [ ] i18n : switch FR → EN dans le menu → textes de navigation changent bien
- [ ] Grain overlay : visible mais subtil (très léger, `opacity-[0.015]`)
- [ ] Boutons : hover légèrement agrandi, active légèrement rétréci
