# Prompt Claude Code — Gate d’audience & navigation `/` (état du repo + maintenance)

> **Rôle de ce fichier** : brief pour **Claude Code** (coller le bloc **« PROMPT À COPIER »** en début de session). Il décrit **ce qui est déjà en place** (audit + correctifs) et comment **étendre ou débugger** sans réintroduire les anciens pièges.  
> **Référence détaillée** : `docs/audits/home-audience-gate.md`.  
> **Bug actif (refresh après « Changer de parcours », header mobile en build)** → **`claude-code-fix-changer-parcours-refresh.md`** (prompt dédié).

---

## Ce qui a été livré (ne pas refaire « from scratch »)

| Fichier / module | Rôle |
|------------------|------|
| `lib/bodyScrollLock.ts` | `acquireBodyScrollLock()` — compteur de refs ; `resetBodyScrollLock()` — reset forcé. **Ne pas** réassigner `document.body.style.overflow` à la main ailleurs pour menu ou gate. |
| `components/layout/SiteFrame.tsx` | `useLayoutEffect([pathname])` → `resetBodyScrollLock()` (parent avant enfants) ; `pageshow` si `event.persisted` (BFCache). |
| `components/home/HomeAudienceGate.tsx` | `readGateInitialShow()` — logique unique premier paint + resync **`pageshow` persisted** ; scroll lock via **`acquireBodyScrollLock`** uniquement. |
| `components/layout/Navbar.tsx` | Menu mobile : **`acquireBodyScrollLock`** ; « Changer de parcours » : **`replaceHomeAndRequestGateReopen(router, requestGateReopen)`** après `clearAudience()`. |
| `components/layout/Footer.tsx` | Idem : `clearAudience()` puis **`replaceHomeAndRequestGateReopen`**. |
| `lib/homeAudienceNavigation.ts` | `replaceHomeAndRequestGateReopen` = `router.replace("/")` + `requestGateReopen()` + `requestAnimationFrame(() => requestGateReopen())`. |
| `contexts/HomeAudienceContext.tsx` | `requestGateReopen` (signal + flag `dn_gate_reopen_pending`) ; pas de `CustomEvent` pour la réouverture. |

---

## Règles à respecter lors de toute modification

1. **Scroll** : tout nouveau overlay plein écran qui bloque le scroll doit passer par **`acquireBodyScrollLock`** (ou étendre ce module si besoin d’un 2ᵉ type de lock documenté).
2. **« Changer de parcours » / retour accueil avec gate** : toujours **`replaceHomeAndRequestGateReopen`** — ne pas dupliquer la séquence à la main.
3. **Gate** : toute logique « afficher ou non le dialog au premier chargement de `/` » doit rester **alignée** entre `readGateInitialShow()` et l’effet `pageshow` (ou factoriser si tu ajoutes un 3ᵉ point d’entrée).
4. **Ne pas supprimer** le reset `pathname` dans `SiteFrame` sans alternative — c’est le filet contre scroll figé / overflow orphelin.

---

## PROMPT À COPIER (Claude Code)

Coller tel quel (adapter la section « Ta mission » si le ticket est précis : bug, feature, refacto léger).

```
Tu travailles sur le repo Next.js « diamant-noir » (Diamant Noir).

## Contexte déjà implémenté (lis avant de modifier)
- Audit : `docs/audits/home-audience-gate.md`
- Scroll document : `lib/bodyScrollLock.ts` — gate (`HomeAudienceGate`) et menu mobile (`Navbar`) utilisent `acquireBodyScrollLock()` ; `SiteFrame` appelle `resetBodyScrollLock()` dans un `useLayoutEffect` sur `pathname` + `pageshow` (BFCache).
- Navigation « Changer de parcours » : `lib/homeAudienceNavigation.ts` → `replaceHomeAndRequestGateReopen(router, requestGateReopen)` utilisé par Navbar et Footer après `clearAudience()`.
- Gate : `readGateInitialShow()` dans `HomeAudienceGate.tsx` ; resync BFCache sur `pageshow` avec `persisted`.

## Ta mission (selon le ticket utilisateur)
1. Lis les fichiers listés dans l’audit + tout fichier que tu touches pour la demande.
2. Ne réintroduis pas `document.body.style.overflow = …` direct dans des composants (sauf dans `bodyScrollLock.ts` si extension justifiée).
3. Pour tout changement touchant l’accueil, le gate, ou le retour sur `/` : vérifie la cohérence `sessionStorage` (`dn_home_audience`, `dn_gate_reopen_pending`), `gateReopenSignal`, et `usePathname()`.
4. Implémente le changement demandé avec impact minimal ; documente la cause si c’est un bugfix.
5. Vérifie : `npx tsc --noEmit` et `npm run build`. Ajoute une entrée append-only dans `docs/ACTIONS_LOG.md` + ligne dans `docs/logs/YYYY-MM-DD.md` (date du jour).

Contraintes : pas de secrets dans le code ; accessibilité du gate (focus, Escape, piège focus) à préserver ; pas de refactor massif hors périmètre du ticket.
```

---

## Tests manuels rapides (après changement)

- `/` → autre route → `/` (lien Accueil, logo).
- Menu mobile ouvert puis navigation ; gate ouvert puis navigation.
- « Changer de parcours » (Navbar si présent, Footer).
- Retour navigateur vers `/`.
- Au moins un navigateur WebKit + Chromium (Opera inclus si disponible).
