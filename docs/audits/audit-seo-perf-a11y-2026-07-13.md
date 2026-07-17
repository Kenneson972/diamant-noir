# Audit SEO / Performance / Accessibilité — 2026-07-13

> Diagnostic uniquement — aucun correctif appliqué. Ken décide.
> Environnement : local (dev 3001), code du repo + `.env.local`. Inspection statique + Playwright (mesures runtime en mode dev, non minifié — les tailles de bundle ne sont pas représentatives de la prod).
> Complète l'angle mort de `audit-preprod-2026-07-11.md` (qui ne couvrait ni SEO, ni perf, ni a11y).

## Résumé exécutif

La base SEO/a11y est **solide et déjà professionnelle** : sitemap dynamique, robots.txt, JSON-LD Organization + WebSite + VacationRental, metadata par page, canonical, hreflang, `next/font` en `display:swap`, `next/image` partout (aucun `<img>` brut dans les composants publics), skip-link, un seul `<h1>` par page. Le point noir principal est le **contraste de l'or `#d4af37` sur fond clair** (2.0:1, sous le seuil WCAG AA de 4.5:1), présent sur tout le site. Aucun bloquant SEO. Les autres constats sont des optimisations de confort.

---

## 🔴 P0 — Bloquant (accessibilité légale / SEO cassé)

### 1. Contraste de l'or sur fond clair — échec WCAG AA généralisé
- **Constat mesuré** (Playwright, styles calculés) : texte or `#d4af37` (rgb 212,175,55) sur fond blanc/offwhite `#fafafa` → **ratio 2.0:1**. Seuil WCAG AA : 4.5:1 pour le texte normal, 3:1 pour le grand texte (≥24px ou ≥18.66px gras). L'or échoue même au seuil « grand texte ».
- **Portée** : c'est un token global (`app/globals.css:7` `--color-gold: #d4af37`) utilisé comme accent signature sur toutes les surfaces claires — wordmark « Kayvila » (20px), eyebrows, prix, labels, liens dorés, micro-copy.
- **Nuance importante** : l'or sur fond **navy `#0a0a0a`** passe très bien (~8:1) — le problème n'existe QUE sur fonds clairs. La signature de marque sur fond sombre (hero, footer) n'est pas concernée.
- **Impact** : accessibilité légale (RGAA/EAD en France), lisibilité pour malvoyants et en plein soleil (cible = voyageurs en extérieur), risque juridique conformité.
- **Recommandation** (à valider client, car touche l'identité visuelle) : ne PAS changer l'or partout. Introduire une variante « or foncé » réservée au **texte sur fond clair** (ex. `#8a6d1f` ≈ 4.6:1, ou `#7a5f18` pour marge), en gardant `#d4af37` pour : (a) l'or sur fond navy, (b) les éléments purement décoratifs non textuels (filets, icônes, bordures — non soumis au critère). Ne pas toucher au `gold-shimmer` sur fond sombre.

---

## 🟠 P1 — Important (SEO/perf à traiter avant montée en charge SEO)

### 2. `NEXT_PUBLIC_BASE_URL` pointe vers localhost — OG images villas cassées en prod
- `.env.local:29` → `NEXT_PUBLIC_BASE_URL=http://localhost:3000`. Cette variable sert à construire l'URL absolue de l'image OG des pages villa (`app/villas/[id]/page.tsx:58,66-68`). Si elle n'est pas surchargée en prod (Vercel), les partages de fiches villa sur les réseaux/WhatsApp/iMessage **n'auront pas d'aperçu image** (URL `http://localhost:3000/...` inaccessible).
- **Note** : à croiser avec l'env Vercel de prod (non vérifiable en local). Si déjà surchargée côté Vercel, ce point tombe. À confirmer par Ken.
- **Recommandation** : définir `NEXT_PUBLIC_BASE_URL=https://kayvila.com` dans l'env de prod, ou remplacer par une valeur en dur `https://kayvila.com` dans le code métadonnées (le reste du site utilise déjà `https://kayvila.com` en dur).

### 3. `siteUrl` en dev codé sur le port 3000, serveur sur 3001
- `app/layout.tsx:39-41` : en `development`, `siteUrl = "http://localhost:3000"` alors que le dev tourne sur **3001**. `metadataBase` est donc faux en local. Sans effet en prod (branche `else` → `https://kayvila.com`), mais fausse la résolution d'URL relatives lors des tests locaux OG/canonical. Cosmétique, mais trompeur pour les futurs audits.

### 4. Nombre de chunks JS élevé + poids en dev
- Mesure Playwright (dev, non représentatif du poids réel) : **42 chunks** `_next/static/chunks` sur la home. Le mode dev n'est pas minifié, donc les ~10 Mo transférés ne sont PAS le chiffre de prod — **mais le nombre de chunks et la surface de dépendances lourdes le sont** : `leaflet`, `recharts`, `shiki`, `@heroui/react`, `@heroui-pro/react`, `motion`, `react-aria-components`. `optimizePackageImports` est déjà configuré (`next.config.mjs:25-37`), bon réflexe.
- **Recommandation** : lancer un vrai build de prod + `@next/bundle-analyzer` pour mesurer les tailles réelles (non fait ici — ne pas lancer `npm run build` sans nécessité, cf. consigne). Vérifier surtout que `leaflet`/`recharts`/`shiki` (lourds) sont bien en `dynamic import` côté client et absents des pages publiques qui n'en ont pas besoin.

---

## 🟡 P2 — Confort / robustesse

### 5. FCP dev ~1.76s, DOMContentLoaded ~2.36s (home)
- Mesures dev, gonflées par la compilation à la volée. Non exploitables telles quelles. **Recommandation** : mesurer LCP/CLS/FCP réels via Lighthouse sur un build de prod (ou l'URL Vercel de preview) — c'est le seul chiffre fiable. À documenter comme action, pas à corriger à l'aveugle.

### 6. Preconnect Google Fonts alors que `next/font` self-host déjà
- `app/layout.tsx:112-113` : `preconnect` vers `fonts.googleapis.com` / `fonts.gstatic.com`. Or `next/font/google` (`layout.tsx:3,15-31`) **télécharge et self-host les polices au build** — aucune requête runtime vers Google Fonts. Ces preconnect sont donc inutiles (2 connexions ouvertes pour rien). Micro-optimisation : les retirer. À l'inverse, les preconnect Supabase/Stripe (`:111,114`) sont pertinents.

### 7. `sizes` manquant sur ~2 images `fill`
- 15 `Image fill` vs 13 `sizes=` dans `components/home` + `components/villas`. 2 images `fill` sans attribut `sizes` → Next sert du `100vw` par défaut, potentiellement une image trop lourde sur mobile. Faible impact (la plupart sont couvertes). **Recommandation** : identifier les 2 restantes et ajouter un `sizes` réaliste.

### 8. Redirections `/tarifs` et `/experience` non déclarées côté SEO
- `app/tarifs/page.tsx` et `app/experience/page.tsx` sont des `redirect("/prestations")` server-side (301 implicite Next). OK fonctionnellement, mais ces URLs ne sont pas dans le sitemap (normal) — juste vérifier qu'aucun lien interne ne pointe encore vers `/tarifs` ou `/experience` (sinon hop de redirection inutile). Vérification rapide recommandée.

---

## ✅ Points déjà conformes (à ne PAS toucher)

- **`sitemap.ts`** : pages statiques + villas publiées dynamiques, dégradation gracieuse si Supabase indispo. Priorités/changeFrequency cohérents.
- **`robots.ts`** : `/admin`, `/dashboard`, `/api`, `/espace-client`, `/success`, `/share` bien bloqués ; règles dédiées ChatGPT-User / PerplexityBot / Google-Extended ; sitemap déclaré.
- **JSON-LD** : Organization (NAP, sameAs réseaux, contactPoint multilingue) + WebSite dans le layout ; **VacationRental** complet par villa (adresse, geo, offre, équipements) — excellent pour le SEO local Martinique.
- **Metadata** : title/description par page, `template: "%s | Kayvila"`, OpenGraph + Twitter card, `og-default.jpg` valide (1200×630, sert en 200), canonical par page, **hreflang** fr/en/es, OG locale dynamique selon cookie.
- **Structure de titres** : **un seul `<h1>` par page** vérifié — `PageHero` porte le h1 des pages secondaires, `HeroWordmarkBaseline` sur la home (avec `aria-label`), villa detail h1→h2 propre. Le chatbot global utilise `<h3>` (`Chatbot.tsx:348`), ne pollue pas la hiérarchie. **La règle « 1 h1/page » de l'espace client est respectée partout ailleurs.**
- **Images** : `next/image` partout (0 `<img>` brut dans les composants publics), formats `avif`/`webp` configurés (`next.config.mjs:44`), hero poster en `priority` (LCP), images décoratives en `alt=""` (correct : décoratives, pas de texte alt parasite), `remotePatterns` propre.
- **Polices** : `Sora` / `Instrument_Sans` / `Playfair_Display` via `next/font/google`, toutes en **`display: swap`** (pas de FOIT, pas de blocage de rendu), self-hostées.
- **A11y interactions** : skip-link fonctionnel (`layout.tsx:156`), `#main-content` avec `tabIndex={-1}`, labels de formulaire + `htmlFor` sur login (et aria-label sur les toggles), 0 bouton/lien sans nom accessible détecté.
- **En-têtes** : CSP, X-Frame-Options, Referrer-Policy, Permissions-Policy, compression, sourcemaps prod désactivées (`next.config.mjs:14`) — bonnes pratiques perf/sécu déjà en place.

---

## Limites de cet audit

- Mesures runtime faites en **mode dev** (non minifié) : FCP, poids JS, nombre de chunks ne reflètent PAS la prod. Un **Lighthouse sur build de prod / URL Vercel** reste à faire pour des Core Web Vitals fiables (recommandé, non lancé ici conformément à la consigne).
- Session navigateur **connectée en admin** pendant l'audit : le middleware redirige vers `/admin` — les pages publiques ont donc été majoritairement auditées en **statique (lecture du code)** plutôt qu'en navigation anonyme. Le contraste or a été confirmé sur styles calculés réels ; la hiérarchie de titres a été vérifiée dans le source. Un repassage Playwright en **session déconnectée** confirmerait le rendu anonyme (contraste in-context sur `/`, `/villas`, `/prestations`).
- Env de **prod Vercel non inspecté** : le point #2 (`NEXT_PUBLIC_BASE_URL`) dépend de la config Vercel réelle — à confirmer par Ken.
