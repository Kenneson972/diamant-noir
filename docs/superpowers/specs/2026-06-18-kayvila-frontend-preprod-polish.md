# Kayvila — Frontend Pré-prod Polish

**Date :** 18 Juin 2026  
**Auteur :** Kenneson + Claude (brainstorming)  
**Source :** Prompt Élise (Hermes) — 70 problèmes filtrés → 45 retenus  
**Statut :** Approuvé

---

## Contexte

Le site est actuellement sur `diamant-noir.vercel.app`. Le switch vers `kayvila.com` est imminent. Ce sprint pré-prod corrige les blocants SEO, conformité RGPD, accessibilité, i18n et polish luxe — sans redesign, sans toucher aux fonctionnalités existantes.

## Périmètre — Ce qu'on NE touche PAS

- `hero.webm` et frames scroll (561 fichiers) → fluide sur Vercel, pas de régression à risquer
- Composants manquants Radio/Toggle/Toast → pas bloquant pour le lancement
- Stripe Connect, auth flow, API routes, dashboard admin widgets
- Palette globale (gold #D4AF37, navy, offwhite) et typographie (Instrument Sans + Playfair Display)

---

## Phase 1 — Images PNG → WebP

**Priorité :** P1 (après SEO)  
**Effort :** ~1h

### Fichiers à convertir
| Fichier | Taille actuelle | Taille cible |
|---------|----------------|--------------|
| `public/notregestion.png` | 3.9 MB | ~80 KB |
| `public/marketing.png` | 3.4 MB | ~70 KB |
| `public/relation.png` | 3.2 MB | ~65 KB |
| `public/terrain.png` | 2.9 MB | ~60 KB |
| `public/finance.png` | 3.1 MB | ~65 KB |
| `public/menage.png` | 2.3 MB | ~50 KB |

### Contrainte qualité
Qualité WebP 85 — visuellement identique au PNG, aucune différence perceptible.

### Implémentation
1. Conversion via `npx sharp-cli` (qualité 85)
2. Remplacement des imports `.png` → `.webp` dans les composants impactés :
   - `HomeServicesSection.tsx`
   - `HomeOwnersSection.tsx`
   - `HomeFeaturedAudience.tsx`
   - `PageHero.tsx`
3. Garder les PNG originaux dans `/public/originals/` (pas de suppression)

---

## Phase 2 — Design System : Radius + Contraste

**Priorité :** P1  
**Effort :** ~30min

### Radius — `rounded-none` partout
Le site est `rounded-none` (46 occurrences) = identité éditoriale luxe intentionnelle. Les boutons arrondis sont des incohérences.

| Composant | Fichier | Fix |
|-----------|---------|-----|
| `Button` | `components/ui/button.tsx:23` | Ajouter `rounded-none` dans les variants |
| `KayvilaPressableButton` | `components/ui/pro/kayvila-pressable-button.tsx:14` | `rounded-xl` → `rounded-none` |

**Exception documentée :** Badges de statut (pills `Oui/Non`, filtres) → conservent `rounded-full`. C'est de la micro-UI fonctionnelle, pas du design statement.

### Contraste WCAG AA
`text-navy/60` sur fond offwhite = ratio 2.8:1 (minimum requis : 4.5:1).  
Fix : `text-navy/60` → `text-navy/80` (ratio ~5.2:1) via find+replace ciblé sur tous les fichiers `.tsx`.

---

## Phase 3 — SEO (pré-switch domaine) ⚡ EN PREMIER

**Priorité :** P0 — À faire AVANT le switch DNS vers kayvila.com  
**Effort :** ~1h

**Risque si non fait :** Google indexe les deux domaines en parallèle → contenu dupliqué dès le lancement.

### Corrections
| Item | Fix |
|------|-----|
| `og:url` absent sur toutes les pages | Ajouter `openGraph: { url: 'https://kayvila.com' }` dans `app/layout.tsx` metadata |
| `og:type` absent sur 12/17 pages | `og:type: 'website'` par défaut en layout, `'product'` sur fiches villa |
| Canonicals → `diamant-noir.vercel.app` | Remplacer toutes les occurrences par `https://kayvila.com` |
| Canonical manquant sur `/mentions-legales` et `/cgv` | Ajouter `metadata.alternates.canonical` |
| Image héro `alt=""` vide | Ajouter alt descriptif : `"Villa de luxe avec piscine en Martinique — Kayvila"` |
| Sitemap incohérent | Uniformiser sur `kayvila.com` |

### Recherche exhaustive
Grep `diamant-noir.vercel.app` dans tout le projet avant de commencer.

---

## Phase 4 — i18n Complet

**Priorité :** P1  
**Effort :** ~2h (audit + corrections)

### Problèmes identifiés
- 9 clés `checkout.*` absentes en espagnol dans `lib/i18n.ts`
- URLs `/en` et `/es` redirigent vers `/login` (manque dans `middleware.ts` → `publicPaths`)
- Textes hardcodés FR sur : pages `/cookies`, footer (10+ chaînes), pages d'erreur

### Approche
1. **Audit exhaustif** : parcourir toutes les pages publiques + dashboard et repérer les chaînes non passées par `t()` ou équivalent i18n
2. **Fix middleware** : ajouter `/en/*` et `/es/*` dans `publicPaths`
3. **Compléter `lib/i18n.ts`** : ajouter toutes les clés manquantes EN + ES
4. **Vérification manuelle** : basculer langue → vérifier que 100% des textes changent

---

## Phase 5 — Cookie Consent RGPD

**Priorité :** P1 (version simplifiée pour le lancement)  
**Effort :** ~1h

### Version lancement (v1 — immédiate)
- Bannière i18n complète (FR/EN/ES) : titre, description, boutons, lien vers `/cookies`
- Stockage localStorage existant conservé
- Ajout du lien `Politique cookies` manquant

### Version post-lancement (v2 — Phase 7)
Le blocage conditionnel réel des scripts tiers (Stripe, analytics) est techniquement plus complexe (lazy-loading conditionnel, fallback si refus). C'est un chantier à part qui ne doit pas bloquer le lancement.

**Note :** Stripe est un script de paiement fonctionnel, pas de tracking. Priorité RGPD réelle = analytics/tracking. À documenter dans le composant.

---

## Phase 6 — Micro-interactions Luxe

**Priorité :** P2 (polish)  
**Effort :** ~45min

### Parallax hero subtil
- **Composant :** `components/home/HeroBackgroundMedia.tsx`
- **Kill switch :** `const ENABLE_PARALLAX = true` en tête du composant
- **Effet :** `transform: translateY(${scrollY * 0.06}px)` sur la vidéo — 2-4px max, imperceptible mais présent
- **Contrainte :** `will-change: transform` + `prefers-reduced-motion` respecté

### Border glow dorée au hover (cartes villa)
- **Composant :** `components/villas/VillaListingCard.tsx`
- **Kill switch :** `const ENABLE_BORDER_GLOW = true` en tête du composant
- **Effet :**
```css
border-color: rgba(212, 175, 55, 0.6);
box-shadow: 0 0 0 1px rgba(212, 175, 55, 0.15), 0 8px 32px rgba(0,0,0,0.06);
```
- **Transition :** `transition: border-color 250ms ease, box-shadow 250ms ease`

---

## Ordre d'exécution

```
Phase 3 (SEO)       ← EN PREMIER — switch domaine imminent
Phase 1 (Images)    ← Gain immédiat, risque zéro
Phase 2 (Design)    ← Rapide, impact global
Phase 4 (i18n)      ← Le plus long, le plus complet
Phase 5 (Cookie)    ← Version simplifiée v1 seulement
Phase 6 (Micro)     ← En dernier, avec validation visuelle
```

## Règles globales

1. `npm run build` doit passer après chaque phase
2. Un commit atomique par phase
3. Si un effet déplaît (Phase 6), le kill switch suffit — un booléen
4. Pas de redesign — polish et corrections uniquement
5. Les PNG originaux sont conservés dans `/public/originals/`
