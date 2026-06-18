# Spec — Audit Frontend Kayvila (18 Juin 2026)

## Contexte

Kayvila est une conciergerie de villa de luxe en Martinique.
Stack : Next.js 15 · HeroUI v2/v3 · Tailwind 4 · Supabase · Stripe Connect.
Repo : `Kenneson972/diamant-noir`, branche `main`, dernier commit `216d59e`.

**Design figé — luxe strict minimaliste.** Ce spec ne redesigne rien : polish + corrections uniquement.

### Contraintes absolues

- Mobile-first
- `npm run build` vert après chaque commit
- Zone interdite : Stripe Connect, auth flow, dashboard admin, chatbot, API routes, palette gold/navy/offwhite, typo Playfair/Instrument Sans, layout navbar/footer
- Palette : gold `#D4AF37` (décoration), navy `#0A0A0A`, offwhite `#FAFAFA`

---

## Architecture d'exécution — Option B (6 phases / 6 commits)

### Phase A — P0 Bloquants

**Fichiers créés / modifiés :**

| Tâche | Fichier | Description |
|---|---|---|
| 1.1 Cookie Consent | `components/ui/CookieConsent.tsx` + `app/layout.tsx` | Bannière RGPD : Essentiels/Analytics/Marketing, `localStorage kayvila-cookie-consent`, fixed bottom slide-up, bouton gold = accepter |
| 1.2 i18n 7 pages | `app/villas/page.tsx`, `app/faq/page.tsx`, `app/contact/page.tsx`, `app/soumettre-ma-villa/page.tsx`, `app/qui-sommes-nous/page.tsx`, `app/prestations/page.tsx`, `app/prestations/services/[slug]/page.tsx` | Remplacer chaînes en dur par `t('key')` via LocaleContext (déjà en place) |
| 1.3 i18n try/catch | Tout composant avec `await import("@/lib/i18n")` | Fallback fr + console.error en dev |
| 1.4 Contraste gold | `tailwind.config.ts`, `VillaSelectionCard.tsx`, `CheckoutView.tsx`, `VillaListingCard.tsx` | `text-gold` sur texte → `#B8860B` (ratio 4.6:1 WCAG AA). Décoration/icône : inchangé |
| 1.5 global-error | `app/global-error.tsx` | Fallback élégant Kayvila + bouton Réessayer |

**Sortie :** 1 commit `fix(p0): cookie consent RGPD + i18n pages marketing + contraste gold + global-error`

---

### Phase B — Design System + Composants manquants

**Fichiers créés / modifiés :**

| Tâche | Fichier | Description |
|---|---|---|
| 2.1 Border radius | `components/ui/input.tsx`, `components/ui/card.tsx` | `rounded-xl` → `rounded-none`, `rounded-3xl` → `rounded-none` |
| 2.2 Inputs | `components/ui/input.tsx`, `espace-client/tenant-form-styles.ts`, `VillaSubmissionForm.tsx`, `VillaWizard.tsx` | Standard : `rounded-none border-navy/15 focus:border-gold focus:ring-1 focus:ring-gold/30 h-12 px-4 text-base` |
| 2.3 Boutons | `components/ui/button.tsx` | Variants : `gold`, `danger`, `secondary`. Tailles : `sm=h-9`, `default=h-11`, `lg=h-12` |
| 2.4 Sora | `app/layout.tsx` | Retirer `--font-sora` du `<body>` public (garder Sora chargé mais sans l'appliquer globalement) |
| 2.5 CSS nettoyage | `app/globals.css` | Supprimer `.card-shadow-*` inutilisées |
| 2.6 Tailwind config | `tailwind.config.ts` + `app/globals.css` | Migrer vers `@theme` uniquement, supprimer `tailwind.config.ts` |
| 8 Composants | `components/ui/Select.tsx`, `Textarea.tsx`, `Checkbox.tsx`, `Badge.tsx`, `Tooltip.tsx` | Wrappers Kayvila (rounded-none, palette navy/gold) |
| 8 Tabs | Toutes pages avec import direct HeroUI Tabs | Pointer vers `components/ui/tabs.tsx` |

**Sortie :** 1 commit `feat(design-system): border-radius, inputs, boutons, Sora, composants manquants`

---

### Phase C — Animations & Micro-interactions

| Tâche | Fichier | Description |
|---|---|---|
| 3.1 Hover boutons | `components/ui/button.tsx`, `kayvila-pressable-button.tsx` | `transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]` |
| 3.2 Skeleton shimmer | `components/ui/skeleton.tsx` | `animate-pulse` → `animate-shimmer` + dégradé shimmer (keyframe déjà dans globals.css) |
| 3.3 Focus inputs | `components/ui/input.tsx` | `transition-all duration-300` + `scale-[1.01]` au focus |
| 3.4 Page transitions | `app/layout.tsx` | View Transitions API + `animate-fade-in` sur contenu principal |
| 3.5 Grain overlay | `app/globals.css` + `app/layout.tsx` | SVG noise `opacity-[0.015]` `pointer-events-none fixed inset-0 z-50` |

**Sortie :** 1 commit `feat(animations): hover lift, skeleton shimmer, grain overlay, page transitions`

---

### Phase D — SEO + Metadata

| Tâche | Fichier | Description |
|---|---|---|
| 4.1 Pages noindex | `app/success/page.tsx`, `app/update-password/page.tsx` | `generateMetadata` + noindex |
| 4.2 Canonical | `app/villas/[id]/page.tsx`, `app/soumettre-ma-villa/page.tsx`, `app/book/page.tsx`, `app/prestations/services/[slug]/page.tsx` | `alternates: { canonical }` |
| 4.3 JSON-LD | `app/villas/page.tsx`, `app/page.tsx` | `ItemList` + `LocalBusiness` (adresse geo tel Martinique) |
| 4.4 OG images | `app/qui-sommes-nous/page.tsx`, `app/faq/page.tsx`, `app/villas/comparer/page.tsx`, `app/soumettre-ma-villa/page.tsx`, `app/book/page.tsx` | `openGraph.images` |
| 4.5 Sitemap | `app/sitemap.ts` | Ajouter `/villas/comparer` + 5 sous-pages prestations |
| 4.6 Robots | `app/robots.ts` | Ajouter `/login` (sans slash), `/success`, `/share/` |

**Sortie :** 1 commit `feat(seo): metadata, canonical, JSON-LD, og:image, sitemap, robots`

---

### Phase E — Performance

| Tâche | Fichier | Description |
|---|---|---|
| 5.1 Villa détail | `app/villas/[id]/page.tsx` | `force-dynamic` → `revalidate = 900` + `generateStaticParams` villas populaires |
| 5.2 Home fetch | `app/page.tsx` | `https.get` → `fetch()` + `next: { revalidate: 3600 }` |
| 5.3 Recharts lazy | `StatsView.tsx`, `FinancesView.tsx` | `dynamic(() => import('recharts'), { ssr: false })` |
| 5.4 PDF lazy | `RelevePDF.tsx` | `dynamic(() => import('@react-pdf/renderer'), { ssr: false })` |

**Sortie :** 1 commit `perf: revalidate villa, fetch home, lazy recharts + pdf`

---

### Phase F — Accessibilité + Conversion

| Tâche | Fichier | Description |
|---|---|---|
| 6.1 Focus ring | `kayvila-pressable-button.tsx` | `focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gold` |
| 6.2 Focus trap | `VillaQuickView.tsx`, `BookingBottomSheet.tsx`, `Chatbot.tsx`, `Navbar.tsx` | Hook `useFocusTrap` ou `FocusScope` HeroUI |
| 6.3 aria-live | `Chatbot.tsx`, `SearchResults.tsx` | `aria-live="polite"` sur zones dynamiques |
| 7.1 CTA sticky | `CheckoutView.tsx` | Bouton "Confirmer et payer" sticky sidebar desktop |
| 7.2 Sécurité | `BookingForm.tsx` | `ShieldCheck` + "Paiement sécurisé · Aucun débit maintenant" |
| 7.3 Prix estimé | `BookingForm.tsx` | "À partir de X€ pour Y nuits" avant sélection de dates |

**Sortie :** 1 commit `feat(a11y+conversion): focus trap, aria-live, CTA sticky, trust signals`

---

## Vérification finale post-toutes-phases

1. `npm run build` sans erreur
2. Parcourir : `/villas`, `/villas/[id]`, `/faq`, `/contact`, `/soumettre-ma-villa`, `/book`, `/success`, `/qui-sommes-nous`, `/prestations`
3. Checkout Stripe mode test — flux intact
4. Chatbot — toujours fonctionnel
5. Bannière cookie — apparaît + mémorise le choix
6. Contraste gold — texte lisible
7. i18n — switch FR/EN fonctionnel
