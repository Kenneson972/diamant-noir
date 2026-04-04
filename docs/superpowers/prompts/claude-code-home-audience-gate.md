# Prompt Claude Code — Choix d’audience à l’ouverture (`/`)

> **Usage** : au début de la session Claude Code, **invoquer le skill `ui-ux-pro-max`** (design intelligence : hiérarchie, accessibilité, motion, styles glass / luxe). Puis coller le bloc **« PROMPT À COPIER »** ci‑dessous.

---

## Contexte produit

- **Marque** : Diamant Noir — conciergerie luxe Martinique.
- **Problème** : retours utilisateurs — **trop d’information** sur l’accueil ; la barre de recherche + les deux gros blocs voyageurs / propriétaires chargent la hero.
- **Direction retenue (B)** : au **premier chargement** de la page d’accueil `https://…/`, proposer un **écran de choix** élégant :
  - **« Je réserve un séjour »** (voyageur) → fermer le volet avec **animation** ; enchaîner sur l’expérience **voyageur** (hero allégée ou scroll vers réservation selon implémentation propre).
  - **« Je suis propriétaire »** → **`router.push('/proprietaires')`** (ou équivalent) avec transition soignée.
- **Persistance** : ne **pas** redemander à chaque navigation interne si le choix est déjà fait (ex. **`localStorage`** clé stable type `dn_home_audience` = `voyageur` | `proprietaire`, ou `sessionStorage` si tu préfères une session navigateur seulement — **documenter le choix** + migration possible).
- **Existant à réutiliser** :
  - `components/home/HomeHeroPrimaryActions.tsx` — blocs + `BookingSearchBar`.
  - `components/home/HomeAudienceScroll.tsx` — query `?pour=sejour|proprietaires|…`.
  - `app/page.tsx` — hero vidéo + sections suivantes.
- **Contraintes stack** : Next.js 15 App Router, React 19, **pas de `framer-motion` dans le dépôt actuellement** — privilégier **CSS / Tailwind** (`transition`, `transform`, `opacity`), keyframes déjà dans `tailwind.config.ts` (`fade-up`, `blur-fade`, etc.) ; n’ajouter `framer-motion` **que** si tu justifies le bundle (sinon rester sur CSS + `motion-reduce:transition-none`).

---

## PROMPT À COPIER (Claude Code)

```
Tu travailles sur le repo Next.js 15 « diamant-noir » (Diamant Noir).

## 0) Design — UI/UX Pro Max (obligatoire)
- **Invoque et applique le skill `ui-ux-pro-max`** pour toute décision visuelle : accessibilité (contraste, focus, reduced-motion), tailles tactiles 44px+, hiérarchie typo, espacement, feedback au clic.
- **Ambiance** : luxe discret, pas de look « template IA » — cohérent avec `text-navy`, `bg-offwhite`, or / blanc sur hero sombre, `font-display` où c’est pertinent.
- **Motion** (Pro Max) : durées **150–300 ms** pour micro-interactions ; entrées de panneau **400–600 ms** max ; **uniquement** `transform` + `opacity` ; **`prefers-reduced-motion: reduce`** → réduire ou désactiver les animations décoratives.
- **Style visuel suggéré** pour le volet de choix : **glassmorphism léger** (backdrop-blur, bordure blanche/low opacity) sur fond **vidéo/hero assombrie** ou overlay dédié, **deux cartes CTA** larges et claires + **lien discret** « Continuer sans choisir » (accessibilité + pas de piège).

## 1) Mission fonctionnelle
1. Implémenter un **composant client** dédié (ex. `components/home/HomeAudienceGate.tsx`) affiché **uniquement sur `/`** quand **aucun choix** n’est stocké (localStorage ou sessionStorage — une seule stratégie, documentée en commentaire en tête de fichier).
2. Le gate **recouvre** le hero (fixed ou absolute, `z-index` au-dessus du contenu hero mais **sous** la `Navbar` si elle doit rester utilisable — sinon masquer temporairement : **choisir explicitement** et comment gérer le focus piège / Escape si modal).
3. **Clic voyageur** : enregistrer le choix, **animer la sortie** du gate (fade + slide ou scale subtil), puis :
   - soit afficher la hero « normale » avec parcours voyageur ;
   - soit **ouvrir** la zone réservation comme aujourd’hui (`#reserver-un-sejour` + événement `diamant-reveal-booking` déjà utilisé dans `HomeHeroPrimaryActions`) — **une seule voie**, pas de duplication de logique.
4. **Clic propriétaire** : enregistrer le choix (optionnel avant navigation), **transition** puis `router.push('/proprietaires')`.
5. **Hydratation** : éviter flash de contenu (FOUC) — pattern « pas de gate SSR bloquant » : placeholder neutre ou `null` jusqu’à `useEffect` qui lit le storage, ou classe `opacity-0` jusqu’à prêt si acceptable pour l’UX.
6. **Intégration `?pour=`** : conserver / harmoniser avec `HomeAudienceScroll` — si l’URL porte déjà `pour=proprietaire|sejour`, **ne pas** forcer le gate (ou fermer automatiquement après application du deeplink).
7. **Alléger la hero après choix (recommandé)** : une fois le choix fait, **retirer ou simplifier** les deux gros blocs redondants si le gate les remplace (éviter double CTA identique). La **barre de recherche** : soit **seulement après** « Je réserve » / desktop inchangé selon décision — mais **ne plus** afficher tout en même temps au premier contact.

## 2) Fichiers attendus (indicatif)
- `components/home/HomeAudienceGate.tsx` (nouveau, `"use client"`).
- `app/page.tsx` : monter le gate dans la hero (ou wrapper client minimal).
- Ajustements : `HomeHeroPrimaryActions.tsx`, `HomeAudienceScroll.tsx` si nécessaire pour éviter conflits et duplication.

## 3) Qualité
- **A11y** : titre visible ou `aria-labelledby` sur le conteneur du choix ; boutons **pleinement clavier** ; pas de piège de focus sans issue.
- **Perf** : pas d’import lourd inutile ; pas de re-renders en cascade.
- **Vérif** : `npm run build` + test manuel : premier chargement → gate ; refresh après choix → pas de gate ; `?pour=proprietaire` → comportement cohérent.

## 4) Documentation projet
- Entrée courte dans `docs/ACTIONS_LOG.md` + ligne dans `docs/logs/YYYY-MM-DD.md` (date du jour).
```

---

## Notes agence Karibloom (référence rapide)

| Sujet | Rappel |
|--------|--------|
| **UI Pro Max** | Accessibilité &gt; touch &gt; perf ; motion signifiante ; pas d’emoji comme icônes structurelles. |
| **Marque** | Navy / offwhite / touches or ; typo `font-display` pour les titres d’exception. |
| **Async** | Si chargement de données hero + gate client : éviter waterfalls inutiles côté `page.tsx`. |

---

## Checklist avant merge

- [ ] Choix persisté + pas de régression `?pour=`.
- [ ] `prefers-reduced-motion` respecté.
- [ ] Build vert ; pas de clé ou secret dans le code.
- [ ] Journal `ACTIONS_LOG` à jour.
