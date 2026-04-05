# Prompt Claude Code — Bug critique : refresh obligatoire après « Changer de parcours » (+ header mobile en build)

> **Usage** : coller le bloc **« PROMPT À COPIER »** en début de session Claude Code. Objectif : **cause racine** + correctif **vérifiable** (sans F5).  
> **Contexte déjà en place** : `docs/audits/home-audience-gate.md` et `docs/superpowers/prompts/claude-code-home-audience-navigation.md`.

---

## Symptômes (repro à confirmer)

1. **Changer de parcours** (Navbar menu ou lien Footer) : l’utilisateur doit encore **rafraîchir la page** pour que le choix d’audience / le gate se comporte correctement.
2. **Après `npm run build` / prod** : le **header en mobile** se comporte mal (chevauchement, menu cassé, scroll, couleurs, etc.) — à préciser selon ce que tu observes en `next start` vs `next dev`.

---

## Fichiers à auditer en priorité

| Fichier | Pourquoi |
|---------|----------|
| `components/home/HomeAudienceGate.tsx` | `decision`, `gateReopenSignal`, `readGateInitialShow()`, effet `[gateReopenSignal, pathname]` |
| `contexts/HomeAudienceContext.tsx` | `requestGateReopen`, `gateReopenSignal` (compteur monotonique), clés `sessionStorage` |
| `lib/homeAudienceNavigation.ts` | `replaceHomeAndRequestGateReopen` — si déjà sur `/`, `router.replace("/")` peut **ne pas remonter** le gate |
| `components/layout/SiteFrame.tsx` | `resetBodyScrollLock` sur `pathname` — interaction avec réouverture |
| `components/layout/Navbar.tsx` | `changeParcours`, `menuOpen`, `acquireBodyScrollLock`, z-index drawer vs gate |
| `components/layout/Footer.tsx` | même flux que Navbar |

---

## Pistes cause racine (à trancher par le code / logs)

1. **Même URL `/`** : si l’utilisateur est déjà sur l’accueil, `router.replace("/")` peut **ne pas déclencher** de remontage du `HomeAudienceGate` ni de navigation réelle → le signal `gateReopenSignal` est consommé mais le gate ne se réaffiche pas correctement → envisager **`router.refresh()`**, **`startTransition`**, ou navigation **hard** (`window.location.href = "/"`) **en dernier recours** documenté.
2. **Ordre des effets** : `resetBodyScrollLock` (parent) vs `setDecision` (gate) — vérifier qu’aucun reset n’annule un état nécessaire au premier frame après réouverture.
3. **`pathname` retardé** (App Router) : l’effet du gate avec `pathname !== "/"` peut ignorer un bump ; la séquence actuelle fait un second `requestGateReopen` en `requestAnimationFrame` — si insuffisant, tester **`queueMicrotask`**, **double `rAF`**, ou **`setTimeout(0, …)`** avec limite claire pour éviter les doubles modales.
4. **Header mobile en prod** : comparer **`next dev`** vs **`next start`** ; vérifier **hydration** (pas de `window` au render SSR), **`inert`** sur le drawer, **safe-area**, **z-index** (gate `z-[110]` vs nav `z-[115]` overlay), **CSS** (ordre des chunks, `backdrop-blur`).

---

## PROMPT À COPIER (Claude Code)

```
Tu travailles sur le repo Next.js « diamant-noir » (Diamant Noir).

## Bug P0 — Refresh obligatoire après « Changer de parcours »
Malgré `replaceHomeAndRequestGateReopen`, `requestGateReopen`, `bodyScrollLock` et le reset dans `SiteFrame`, l’utilisateur doit encore faire F5 pour que tout soit correct. Tu dois trouver la **cause racine** (ne pas empiler des timeouts au hasard) et livrer un **correctif minimal** avec scénarios de test.

### Étapes imposées
1. Lis : `docs/audits/home-audience-gate.md`, `components/home/HomeAudienceGate.tsx`, `contexts/HomeAudienceContext.tsx`, `lib/homeAudienceNavigation.ts`, `components/layout/SiteFrame.tsx`, `components/layout/Navbar.tsx`, `components/layout/Footer.tsx`.
2. Reproduis le scénario **mentalement puis en local** : audience déjà choisie → « Changer de parcours » depuis **menu mobile** et depuis **footer** ; cas **déjà sur `/`** vs **autre route** (ex. `/villas` → `/`).
3. Vérifie spécifiquement : est-ce que `router.replace("/")` **sans changement d’URL** empêche le gate de se mettre à jour ? Si oui, propose une solution **propre** (ex. `router.refresh()`, clé de remontage, ou navigation documentée) et justifie le compromis SEO/UX.
4. Vérifie que le traitement de `gateReopenSignal` (ref « dernière génération ») et les conditions sur `pathname` / `sessionStorage` ne **mangent** pas la réouverture.
5. Lance `npx tsc --noEmit` et `npm run build` ; teste aussi `npm run start` pour le point ci‑dessous.

## Bug P1 — Header mobile « cassé » après build
Après build, le header mobile pose problème (layout, menu, scroll). Compare dev vs prod (`next start`), identifie si c’est **hydration**, **CSS**, **z-index**, **inert**, ou **scroll lock**. Corrige avec impact minimal sur le desktop.

## Livrables
- Code corrigé + commentaire court si le comportement « déjà sur `/` » nécessite un cas spécial.
- Append `docs/ACTIONS_LOG.md` + `docs/logs/YYYY-MM-DD.md` (date du jour).
- Pas de secrets ; garder l’accessibilité (focus menu, gate).

Contrainte : une seule cause racine documentée en 3–6 phrases dans le message de fin ou dans le journal de session.
```

---

## Vérifications manuelles après correctif

- [ ] « Changer de parcours » depuis `/villas` → gate visible **sans F5**
- [ ] « Changer de parcours » **en étant déjà sur `/`** → gate visible **sans F5**
- [ ] Menu mobile : ouverture / fermeture / scroll page derrière
- [ ] `npm run build` puis `npm run start` : header mobile sur 375px de large
- [ ] Chrome + au moins un autre navigateur si le bug était spécifique (Opera, Safari)
