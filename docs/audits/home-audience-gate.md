# Audit — Gate d’audience & navigation accueil (`/`)

**Date** : 2026-03-31  
**Objectif** : traiter les blocages multi-navigateurs (scroll figé, écran blanc, refresh) et aligner le comportement produit.

## Incohérences identifiées

| Sujet | Problème | Impact |
|--------|-----------|--------|
| **`document.body.style.overflow`** | Deux consommateurs indépendants : `HomeAudienceGate` et menu mobile `Navbar`. Chacun sauvegardait `prev` puis restaurait : enchaînement gate ouvert + menu, ou navigation au mauvais ordre → **valeur restaurée incorrecte** (scroll bloqué ou débloqué à tort). | Scroll « figé » sur toute la page, besoin de refresh. |
| **Navigation sans reset global** | Aucun filet si un `cleanup` React ne s’exécute pas (timing navigation, BFCache). | Overflow laissé à `hidden`. |
| **BFCache / retour arrière** | État React du gate pouvait diverger du `sessionStorage` après restauration cache. | UI incohérente (gate fermé ou ouvert de façon erronée). |
| **« Changer de parcours »** | Séquence `replace` + `requestGateReopen` dupliquée Navbar / Footer. | Maintenance difficile, risque d’oublier un bump différé. |

## Ce qui n’est pas un bug

- **`sessionStorage` + `?pour=`** : `hydrateAudienceFromUrlIfNeeded()` et `HomeAudienceScroll` sont complémentaires ; le gate évite d’hydrater depuis `?pour=` quand `wantReopen` est actif (réouverture explicite).
- **Provider au-dessus du site** : `HomeAudienceProvider` dans `SiteFrame` reste pertinent pour Navbar / Footer / blocs home.

## Solution mise en œuvre

1. **`lib/bodyScrollLock.ts`** — `acquireBodyScrollLock()` par **compteur de références** ; `resetBodyScrollLock()` pour forcer la libération.
2. **`SiteFrame`** — `useLayoutEffect([pathname])` appelle `resetBodyScrollLock()` **avant** les enfants (ordre React parent → enfant) ; `pageshow` avec `event.persisted` pour BFCache.
3. **`HomeAudienceGate` + `Navbar`** — utilisent `acquireBodyScrollLock()` au lieu de manipuler `body` à la main.
4. **`readGateInitialShow()`** — logique unique pour le premier paint ; réutilisée sur **`pageshow` `persisted`** pour réaligner le gate.
5. **`lib/homeAudienceNavigation.ts`** — `replaceHomeAndRequestGateReopen(router, requestGateReopen)` centralise `replace("/")` + double signal.

## Vérifications manuelles recommandées

- Accueil → autre route → Accueil (lien, logo, retour navigateur).
- Menu mobile ouvert / fermé + gate.
- « Changer de parcours » depuis Navbar et Footer.
- Chrome, Safari, Firefox, Opera (desktop + mobile si possible).
