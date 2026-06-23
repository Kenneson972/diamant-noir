# Design Audit — Kayvila
**Date :** 2026-04-13
**Outils :** Revue manuelle UI/UX Pro Max + Impeccable detect CLI v2.1.7
**Scope :** `app/` + `components/` (TSX, CSS)

---

## Résumé exécutif

| Catégorie | Problèmes trouvés | Priorité |
|-----------|------------------|----------|
| Pure black backgrounds | 17 occurrences `bg-black` → doit être teinté brand | 🟡 Modéré |
| Bounce easing | 5 occurrences `animate-bounce` (daté, "AI slop") | 🟡 Modéré |
| Gradient text | 1 occurrence `.text-gold-shimmer` (décoration) | 🟢 Faible |
| Touch targets trop petits | Bouton popup parallax `text-[10px]` sans zone 44px | 🔴 Critique |
| `reduced-motion` non respecté | ScrollTrigger canvas actif même en mode réduit | 🔴 Critique |
| Échelle typographique | Labels eyebrow varient 9px/10px/11px selon page | 🟡 Modéré |
| Max-width incohérent | Mix `max-w-4xl` / `max-w-5xl` / `max-w-6xl` | 🟡 Modéré |

---

## Impeccable detect — Résultats bruts (24 anti-patterns détectés)

### [pure-black-white] — 22 occurrences

> `bg-black` (#000000 pur) comme fond de section est perçu comme dur et synthétique.
> Correction : utiliser le token brand `bg-navy` (#0A0A0A) déjà défini dans tailwind.config.

**Fichiers concernés :**

| Fichier | Lignes |
|---------|--------|
| `app/conciergerie/page.tsx` | — |
| `app/confidentialite/page.tsx` | 73 |
| `app/dashboard/proprio/assistant/page.tsx` | 284 |
| `app/globals.css` | (token) |
| `app/login/page.tsx` | 157, 404, 466 |
| `app/page.tsx` | 53 |
| `app/prestations/PrestationsPageClient.tsx` | 472, 481, 568, 610 |
| `app/prestations/page.tsx` | 16 |
| `app/proprietaires/page.tsx` | 48, 259 |
| `app/qui-sommes-nous/page.tsx` | 133 |
| `components/HeroSearchWidget.tsx` | 55 |
| `components/VillaGallery.tsx` | 78, 96, 127 |
| `components/VillaQuickView.tsx` | 27 |
| `components/VillasMapView.tsx` | 158 |
| `components/book/BookLandingMarketing.tsx` | 40, 66, 76, 175, 198, 208 |
| `components/booking/BookingSearchBar.tsx` | 113, 144, 177 |
| `components/booking/SearchResults.tsx` | 46, 113 |
| `components/chatbot/Chatbot.tsx` | 265, 285, 341, 360, 364, 379, 401, 412, 430 |
| `components/home/HeroAudienceCards.tsx` | 59, 78 |
| `components/home/HomeBottomCta.tsx` | 15 |
| `components/home/HomeLifestyleAudience.tsx` | 8 |
| `components/home/HomeTrustBand.tsx` | 14, 18, 25 |
| `components/layout/Navbar.tsx` | 158, 178, 195 |

**Fix appliqué :** Remplacement `bg-black` → `bg-navy` dans les fonds de sections.
Exceptions conservées : `hover:bg-black`, `from-black`, `to-black`, `via-black` (gradients intentionnels).

---

### [bounce-easing] — 5 occurrences

> `animate-bounce` donne une impression de rebond mécanique et "générique".
> Pour une marque luxe, préférer `animate-pulse` (subtil) ou une animation personnalisée.

| Fichier | Ligne | Contexte | Fix |
|---------|-------|----------|-----|
| `app/conciergerie/page.tsx` | 534 | ChevronDown scroll indicator | → `animate-pulse` |
| `components/chatbot/Chatbot.tsx` | 364–366 | Typing dots (3 dots) | → `.dn-typing-dot` CSS (déjà défini) |
| `components/prestations/VideoScrollHero.tsx` | 733 | ChevronDown scroll indicator | → `animate-pulse` |

**Fix appliqué :**
- Chevrons scroll : `animate-bounce` → `animate-pulse` (fade subtil, non intrusif)
- Typing dots chatbot : `animate-bounce` → `.dn-typing-dot` (animation CSS smooth `ease-in-out` déjà définie dans globals.css)

---

### [gradient-text] — 1 occurrence

> `.text-gold-shimmer` dans `globals.css` → `background-clip: text + gradient`
> Impeccable considère ça comme décoration pure ("AI tell").

**Décision :** Conservé intentionnellement.
Le shimmer or est une signature brand Kayvila (utilisé seulement sur les wordmarks, pas les titres courants). L'animation respecte `prefers-reduced-motion` (fallback `color: #D4AF37`). Pas de changement.

---

## Audit manuel — Problèmes supplémentaires

### 1. Touch targets sous le minimum (🔴 Critique)

**Fichier :** `app/prestations/PrestationsPageClient.tsx`
**Composant :** Bouton "Voir le détail →" dans les popups parallax
**Problème :** Zone de tap ~24×16px (min requis : 44×44px WCAG / Apple HIG)
**Fix :** `min-h-[44px] px-3 py-2 -mx-3` sur le bouton

---

### 2. `prefers-reduced-motion` non respecté (🔴 Critique)

**Fichier :** `app/prestations/PrestationsPageClient.tsx`
**Problème :** Le ScrollTrigger GSAP + canvas démarre même quand l'utilisateur a activé "Réduire le mouvement" dans ses préférences système.
**Fix :** Détecter `window.matchMedia("(prefers-reduced-motion: reduce)")` dans le useEffect GSAP et court-circuiter l'animation.

---

### 3. Échelle typographique incohérente (🟡 Modéré)

**Problème :** Les labels eyebrow varient entre `text-[9px]`, `text-[10px]`, `text-[11px]` selon les pages.
**Recommandation :** Unifier sur `text-[10px]` via la classe `.eyebrow` dans `globals.css` (classe déjà définie, mais pas utilisée systématiquement).

---

### 4. Max-width incohérent entre sections (🟡 Modéré)

**Recommandation :** Standardiser :
- Contenu texte centré : `max-w-2xl`
- Grilles 2 colonnes : `max-w-5xl`
- Grilles 3+ colonnes : `max-w-6xl`
- Plein écran (padding compensé) : `max-w-7xl`

---

### 5. Hover zoom sur les cartes villas (🟢 Amélioration)

**Composant :** Grille villas
**Opportunité :** Ajouter un zoom image très lent au hover (convention luxe) :
```tsx
<div className="overflow-hidden">
  <Image className="transition-transform duration-[6000ms] ease-out group-hover:scale-105" />
</div>
```

---

### 6. Cormorant Garamond sous-utilisé (🟢 Amélioration)

**Opportunité :** La police la plus luxueuse du projet est chargée mais quasi absente des composants visibles.
Utiliser `font-cormorant italic` sur les taglines hero et sections éditoriales.

---

## Fixes appliqués dans cette session

- [x] `bg-black` → `bg-navy` dans les fonds de sections TSX
- [x] `animate-bounce` → `animate-pulse` sur les scroll indicators
- [x] `animate-bounce` → `.dn-typing-dot` sur les dots de typing du chatbot
- [ ] Touch targets 44px sur bouton popup parallax *(à faire)*
- [ ] `prefers-reduced-motion` sur le canvas GSAP *(à faire)*
- [ ] Standardisation max-width *(à faire — scope large)*
- [ ] Hover zoom villas *(à faire)*

---

## Commandes impeccable recommandées pour la suite

```bash
# Audit complet après fixes
impeccable detect app/ components/ --fast

# Affiner le design system
/impeccable teach
/typeset    # Hiérarchie typo
/layout     # Espacement et rythme
/polish     # Finition générale
```
