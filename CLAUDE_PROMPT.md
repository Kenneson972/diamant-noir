# 🏗️ MEGA-PROMPT KAYVILA — Audit Frontend Complet
## Prompt pour Claude Code — 18 Juin 2026

---

Tu travailles sur Kayvila (diamant-noir), une conciergerie de villa de luxe en Martinique.
Stack : Next.js 15 + HeroUI v2/v3 + Tailwind 4 + Supabase + Stripe Connect.
Tu es dans le repo `/opt/data/kayvila-audit` (clone du repo `Kenneson972/diamant-noir`, branche `main`).
Dernier commit : `216d59e`. 594 fichiers TSX.

---

## ⚠️ CRITIQUE — NE PAS REDESIGNER

Le design actuel de Kayvila est **validé et intentionnel**. C'est un luxe strict minimaliste :
- **Aucune bordure visible** sur les cartes (juste `border-navy/8` subtil)
- **Aucun shadow** sur les cartes publiques (shadow réservé au dashboard admin)
- **Aucun border-radius** sur les éléments publics (angles droits = luxe)
- **Pas de glassmorphism** sur les pages principales
- **Pas de dégradé partout** — le dégradé gold est utilisé avec parcimonie

Tu fais du **POLISH** et des **CORRECTIONS**, PAS un redesign.
Si un élément n'est pas listé explicitement dans ce document, **ne le change pas**.

## RÈGLES ABSOLUES

1. **Mobile-first** — tout doit fonctionner sur mobile d'abord
2. **npm run build doit passer** à chaque commit
3. **Commits atomiques** — un commit par phase, message en français
4. **Ne pas casser les fonctionnalités existantes** — le checkout Stripe, les réservations, le chatbot doivent continuer à marcher
5. **Pas de régression sur le reste**
6. **Zéro bordure inutile, zéro shadow inutile** — design luxe strict
7. **Palette : gold #D4AF37 (accent), navy #0A0A0A (texte), offwhite #FAFAFA (fond)**
8. **Typo : Playfair Display (titres), Instrument Sans (body), Sora (dashboard admin seulement)**

---

## PHASE 1 — P0 BLOQUANTS (urgent, à livrer en premier)

### 1.1 Cookie Consent (RGPD)
**Fichiers à créer :** `components/ui/CookieConsent.tsx`
- Bannière cookie RGPD complète
- Catégories : Essentiels (toujours on), Analytics, Marketing
- Stockage dans localStorage `kayvila-cookie-consent`
- Boutons "Tout accepter" / "Tout refuser" / "Personnaliser"
- Design : fond offwhite, bordures navy/10, boutons gold pour accepter
- Position : fixed bottom, animation slide-up
- Intégrer dans `app/layout.tsx` (après le dernier Provider)

### 1.2 i18n — Traduire les 7 pages full français
**Pages à traduire :**
- `app/villas/page.tsx` — listing villas
- `app/faq/page.tsx` — FAQ
- `app/contact/page.tsx` — contact
- `app/soumettre-ma-villa/page.tsx` — soumission villa
- `app/qui-sommes-nous/page.tsx` — about
- `app/prestations/page.tsx` — prestations
- `app/prestations/services/[slug]/page.tsx` (×5)

**Méthode :** Créer un fichier de traduction `lib/i18n/translations.ts` avec les clés fr/en. Remplacer toutes les chaînes hardcodées par `t('key')` via le `LocaleContext` existant.

### 1.3 i18n — Sécuriser l'import
**Fichier :** Tout composant utilisant `await import("@/lib/i18n")`
- Ajouter `try/catch` autour de l'import
- Fallback vers français si échec
- Logger l'erreur en console en dev

### 1.4 Contraste gold (accessibilité)
**Problème :** `#D4AF37` sur blanc → ratio ~1.9:1 (échec WCAG AA)
**Fix :** Remplacer `text-gold` pour le TEXTE (pas les décorations) par `#B8860B` (DarkGoldenRod → ratio 4.6:1)
**Fichiers concernés :** `tailwind.config.ts` (couleur `gold`), `VillaSelectionCard.tsx`, `CheckoutView.tsx`, `VillaListingCard.tsx`

### 1.5 Error Boundaries
**Fichiers à créer :** `app/error.tsx` (déjà existant, vérifier), `app/global-error.tsx` (créer si absent)
- UI de fallback élégante avec bouton "Réessayer"
- Design cohérent avec la marque Kayvila

---

## PHASE 2 — DESIGN SYSTEM (incohérences)

### 2.1 Border radius — Standardiser
**Règle :**
- **Public** (landing, villas, marketing) : `rounded-none` — luxe strict
- **Dashboard/Admin** : `rounded-xl` pour les cards, `rounded-2xl` pour les modals
- **UI Kit partagé** (`components/ui/`) : aligner sur `rounded-none`

**Fichiers à corriger :**
- `components/ui/input.tsx` : `rounded-xl` → `rounded-none`
- `components/ui/card.tsx` : `rounded-3xl` → `rounded-none`

### 2.2 Formulaires — Unifier le style d'input
**Standard unique :**
```
rounded-none border-navy/15 focus:border-gold focus:ring-1 focus:ring-gold/30
h-12 px-4 text-base
```
**Fichiers à corriger :**
- `components/ui/input.tsx` — appliquer le standard
- `espace-client/tenant-form-styles.ts` — aligner
- `VillaSubmissionForm.tsx` — aligner
- `VillaWizard.tsx` — aligner
- Créer `components/ui/Select.tsx`, `Textarea.tsx`, `Checkbox.tsx`

### 2.3 Boutons — Compléter le composant
**Fichier :** `components/ui/button.tsx`
**Ajouter les variants :**
- `gold` : `bg-gold text-white hover:bg-gold/90`
- `danger` : `bg-red-600 text-white`
- `secondary` : `bg-navy/5 text-navy hover:bg-navy/10`

**Tailles standardisées :** `sm` = `h-9`, `default` = `h-11`, `lg` = `h-12`

### 2.4 Supprimer Sora des pages publiques
**Fichier :** `app/layout.tsx`
- Garder le chargement de Sora mais le restreindre au dashboard
- Dans le layout public, ne pas inclure `--font-sora` dans `<body>`
- Ou créer un `DashboardLayout` séparé qui inclut Sora

### 2.5 Nettoyer les classes inutilisées
**Fichier :** `app/globals.css`
- Supprimer `.card-shadow-sm`, `.card-shadow`, `.card-shadow-lg`, `.card-shadow-xl` (jamais utilisées)
- Supprimer `rounded-*` custom inutilisés

### 2.6 Migrer tailwind.config.ts → @theme uniquement
- Tout migrer de `tailwind.config.ts` vers `@theme` dans `globals.css`
- Supprimer `tailwind.config.ts`

---

## PHASE 3 — ANIMATIONS & MICRO-INTERACTIONS

### 3.1 Hover lift sur les boutons
**Règle :** Tous les boutons interactifs : `transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]`
**Fichier :** `components/ui/button.tsx` et `kayvila-pressable-button.tsx`

### 3.2 Skeleton shimmer
**Fichier :** `components/ui/skeleton.tsx`
- Remplacer `animate-pulse` par `animate-shimmer` (le keyframe existe déjà dans `globals.css` !)
- Ajouter le dégradé shimmer : `bg-gradient-shimmer` ou `bg-navy/5 via-navy/10 to-navy/5 animate-shimmer`

### 3.3 Transition sur les inputs au focus
**Fichier :** `components/ui/input.tsx`
- Ajouter `transition-all duration-300` sur le wrapper
- Au focus : `scale-[1.01]` subtil + ring gold

### 3.4 Page transitions
**Fichier :** `app/layout.tsx`
- Activer les View Transitions API (déjà partiellement configurée)
- Ajouter `animate-fade-in` sur le contenu principal

### 3.5 Grain overlay global
**Fichiers :** `app/globals.css` + `app/layout.tsx`
- Ajouter un overlay grain/noise SVG sur tout le site
- `opacity-[0.015]` pour ne pas gêner la lisibilité
- `pointer-events-none fixed inset-0 z-50`

---

## PHASE 4 — SEO + METADATA

### 4.1 Pages sans metadata (P0)
- `app/success/page.tsx` — ajouter `generateMetadata` avec title "Réservation confirmée — Kayvila" + noindex
- `app/update-password/page.tsx` — ajouter title "Mise à jour du mot de passe — Kayvila" + noindex

### 4.2 Pages sans canonical (P1)
Ajouter `alternates: { canonical }` dans `generateMetadata` de :
- `app/villas/[id]/page.tsx`
- `app/soumettre-ma-villa/page.tsx`
- `app/book/page.tsx`
- `app/prestations/services/[slug]/page.tsx`

### 4.3 JSON-LD enrichi
- `app/villas/page.tsx` — ajouter `ItemList` (liste de `Product`)
- `app/page.tsx` — enrichir avec `LocalBusiness` (adresse, geo, telephone)

### 4.4 Og:image sur les pages marketing
Ajouter `openGraph.images` dans les pages sans : `qui-sommes-nous`, `faq`, `villas/comparer`, `soumettre-ma-villa`, `book`

### 4.5 Sitemap — Ajouter les pages manquantes
**Fichier :** `app/sitemap.ts`
Ajouter : `/villas/comparer`, `/prestations/services/marketing`, `/prestations/services/operations`, `/prestations/services/voyageurs`, `/prestations/services/menage`, `/prestations/services/finance`

### 4.6 Robots.txt
**Fichier :** `app/robots.ts`
- `/login` sans trailing slash n'est pas couvert → ajouter
- Ajouter `/success` et `/share/` si pas déjà

---

## PHASE 5 — PERFORMANCE

### 5.1 Villa détail — Remplacer force-dynamic
**Fichier :** `app/villas/[id]/page.tsx`
- Remplacer `force-dynamic` + `unstable_noStore()` par `revalidate = 900`
- Utiliser `generateStaticParams` pour pré-rendre les villas populaires
- `revalidateTag` dans les webhooks admin

### 5.2 Home — Remplacer https.get par fetch
**Fichier :** `app/page.tsx`
- Remplacer `https.get` par `fetch()` standard
- Ajouter `next: { revalidate: 3600 }`

### 5.3 Lazy-load recharts
**Fichiers :** `StatsView.tsx`, `FinancesView.tsx`
- Wrapper `recharts` avec `dynamic(() => import(...), { ssr: false })`

### 5.4 Lazy-load @react-pdf/renderer
**Fichier :** `RelevePDF.tsx`
- `dynamic(() => import('@react-pdf/renderer'), { ssr: false })`

---

## PHASE 6 — ACCESSIBILITÉ

### 6.1 Focus indicators sur le bouton principal
**Fichier :** `kayvila-pressable-button.tsx`
- Ajouter `focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gold`

### 6.2 Focus trap dans les modales/drawers
**Fichiers :** `VillaQuickView.tsx`, `BookingBottomSheet.tsx`, `Chatbot.tsx`, `Navbar.tsx`
- Implémenter un hook `useFocusTrap` ou utiliser `FocusScope` HeroUI

### 6.3 aria-live sur les zones dynamiques
**Fichiers :** `Chatbot.tsx`, `SearchResults.tsx`
- Ajouter `aria-live="polite"` sur les conteneurs de messages chatbot
- Annoncer les changements de filtres

---

## PHASE 7 — CONVERSION FUNNEL

### 7.1 CTA "Payer" sticky desktop
**Fichier :** `CheckoutView.tsx`
- Rendre le bouton "Confirmer et payer" sticky dans la sidebar prix desktop

### 7.2 Confiance — Ajouter icône sécurité
**Fichier :** `BookingForm.tsx`
- Ajouter `ShieldCheck` + texte "Paiement sécurisé · Aucun débit maintenant" près du CTA Réserver

### 7.3 Prix estimé avant sélection
**Fichier :** `BookingForm.tsx`
- Afficher "À partir de X€ pour Y nuits" en estimé quand les dates ne sont pas encore sélectionnées

---

## PHASE 8 — COMPOSANTS MANQUANTS

Créer les wrappers Kayvila pour :
- `components/ui/Select.tsx`
- `components/ui/Textarea.tsx`
- `components/ui/Checkbox.tsx`
- `components/ui/Badge.tsx`
- `components/ui/Tooltip.tsx`

Uniformiser `Tabs` : utiliser le wrapper `components/ui/tabs.tsx` PARTOUT (pas d'import direct `@heroui/react` Tabs).

---

## CE QU'ON NE TOUCHE PAS (zone interdite)

- ❌ **Stripe Connect** — le flux de paiement est validé, ne pas y toucher
- ❌ **Auth flow** — login, register, reset password, magic link — tout fonctionne
- ❌ **Dashboard admin** — sauf les corrections de border-radius listées en Phase 2
- ❌ **Chatbot** — sauf `aria-live` en Phase 6
- ❌ **API routes** — sauf si explicitement listé
- ❌ **Palette de couleurs globale** — gold/navy/offwhite restent exactement les mêmes
- ❌ **Typo globale** — Playfair Display + Instrument Sans restent
- ❌ **Layout général** — navbar, footer, grilles — ne pas restructurer

## VÉRIFICATION FINALE

Après toutes les phases :
1. `npm run build` doit passer sans erreur
2. `npm run dev` → parcourir les pages publiques (/villas, /villas/[id], /faq, /contact, /soumettre-ma-villa, /book, /success, / qui-sommes-nous, /prestations)
3. Vérifier le checkout Stripe (mode test) — le flux ne doit pas être cassé
4. Vérifier le chatbot — il doit toujours répondre
5. Vérifier que la bannière cookie apparaît et se souvient du choix
6. Vérifier le contraste gold sur le texte (le prix doit être lisible)
7. Vérifier que le i18n fonctionne (passer de FR à EN)
