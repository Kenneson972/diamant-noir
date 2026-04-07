# Audit technique complet — Diamant Noir

**Date :** 2026-04-07  
**Périmètre :** codebase `diamant-noir/` (Next.js 15 App Router)  
**Référentiel de règles :** pack Karibloom Client Builder (`.cursor/rules/client-builder/`), règles racine projet (architecture, SEO, forms, perf, mobile, sécurité, async/bundle, workflow), skills projet (dont `mobile-responsive`).

**Méthode :** revue statique du code + `npm run build` (OK au moment de l’audit). Pas de Lighthouse automatisé ni d’audit réseau dans ce document.

---

## 1. Synthèse exécutive

| Domaine | Verdict | Commentaire court |
|---------|---------|---------------------|
| **Stack & layout** | Bon | App Router, `viewport` exporté (`device-width`, `viewportFit: cover`), polices Google limitées et via `next/font`. |
| **Mobile & tactile** | Bon | `min-h-dvh` / `dvh`, safe areas, blur atténué sur petits écrans, `overflow-x` global, `touch-action: manipulation` sur contrôles. |
| **Performance perçue** | À surveiller | Modale galerie `backdrop-blur-xl` ; `heroui.min.css` chargé globalement dans le layout — vérifier nécessité réelle. |
| **SEO & découvrabilité** | Bon | Métadonnées racine, `robots.txt` / `sitemap.xml` présents. Pages dynamiques : compléter metadata par route si besoin acquisition. |
| **Sécurité HTTP / API** | Bon | En-têtes `nosniff`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy` ; API dashboard avec Bearer + vérif propriétaire. |
| **Sécurité avancée** | Moyen | Pas de `middleware.ts` global (rate limit, CSRF double-submit) ; à évaluer selon menaces. |
| **Accessibilité** | Bon | `:focus-visible`, corps 16px, classe `.tap-target`, typo ≥10px sur passes récentes. |
| **Données & import** | Bon | Import Airbnb enrichi, normalisation équipements, migrations Supabase documentées. |

---

## 2. Architecture & workflow (kb-architecture, kb-core-workflow)

- Structure `app/`, `components/`, `lib/`, `types/` cohérente avec la doctrine Karibloom Next.js.
- Pas de baril d’imports massif signalé comme bloquant dans cet audit.
- **Traçabilité :** `docs/ACTIONS_LOG.md` (append-only) + `docs/logs/YYYY-MM-DD.md` par session — conforme à `kb-action-documentation`.

---

## 3. UI & gouvernance (kb-ui-routing)

- Couche `components/ui` (Radix + Tailwind) utilisée pour les primitives.
- Fichier `public/heroui.min.css` référencé dans `app/layout.tsx` : **vérifier** si HeroUI est encore requis ou si c’est un reliquat (doctrine : une lib principale ; éviter CSS global inutile).

---

## 4. Mobile & responsive (kb-mobile-responsive, skill mobile-responsive)

**Conforme :**

- `export const viewport` avec `viewportFit: "cover"` pour encoches / safe area.
- `html, body { overflow-x: hidden }` dans `globals.css`.
- Headers sticky dashboard / navbar : `backdrop-blur-none md:backdrop-blur-*` sur les zones critiques.
- Barre réservation mobile fiche villa : `backdrop-blur-none`, padding bas safe area, `pb-24` sur `<main>` pour ne pas masquer le contenu.
- `CompareBar`, `VillasMapView`, assistant, messagerie : patterns `dvh` / safe area documentés en session.

**Points de vigilance :**

| Fichier / zone | Observation |
|----------------|-------------|
| `VillaGallery.tsx` | Lightbox `backdrop-blur-xl` sur overlay plein écran — acceptable desktop ; coût GPU mobile si ouvert souvent. |
| `proprietaires/page.tsx` | Plusieurs `backdrop-blur-sm` sur cartes — surface limitée, risque modéré. |
| `Navbar` (hero clair) | Boutons gardent `backdrop-blur-sm` sur fond transparent — OK visuellement ; surveiller si jank sur Android bas de gamme. |

---

## 5. Performance & Core Web Vitals (kb-performance, karibloom perf)

- `next.config.mjs` : `optimizePackageImports` pour `lucide-react` et Radix — aligné async/bundle.
- **Images :** `remotePatterns` explicites pour Supabase, Airbnb, etc.
- **Pas de `min-h-screen` / `100vh` résiduels** dans le code applicatif (ts/tsx/css) — migration vers unités dynamiques effectuée.
- **Recommandation :** document PSI mobile/desktop dans `MESURES_BASELINE.md` si pas déjà fait (règle perf Karibloom).

---

## 6. SEO (kb-seo)

- Layout racine : `metadata` avec title template, description, keywords, `openGraph` de base.
- Routes `/robots.txt`, `/sitemap.xml` en statique.
- **Amélioration possible :** `generateMetadata` sur `/villas/[id]` pour titre/description dynamiques par villa (à confirmer dans le code de la page).

---

## 7. Formulaires & leads (kb-forms)

- Formulaires métier (contact, réservation, dashboard) : à maintenir avec validation côté client + serveur ; cet audit ne liste pas chaque endpoint.
- **CSRF :** les API utilisent surtout `Authorization: Bearer` (session Supabase) — modèle différent des formulaires PHP classiques du pack ; cohérent pour une API tokenisée.

---

## 8. Sécurité (kb-security)

**Points positifs :**

- Pas de `eval` / `dangerouslySetInnerHTML` détectés dans `app/` et `components/` (grep).
- `SUPABASE_SERVICE_ROLE_KEY` uniquement via `process.env` côté serveur.
- En-têtes de sécurité sur toutes les routes.

**Écarts / pistes :**

- Pas de **Content-Security-Policy** stricte dans `next.config.mjs` (souvent ajoutée progressivement avec nonces).
- Pas de **middleware** Next pour limitation de débit ou contrôle d’origine sur `/api/*` (hors scope Vercel firewall).

---

## 9. Backend & données (kb-backend, Supabase)

- CRON `vercel.json` vers `/api/sync` documenté dans RECAP.
- Migrations SQL sous `supabase/migrations/` ; RLS — vérifier politiques par feature (ex. réservations locataire) lors des évolutions.

---

## 10. Accessibilité (kb-core-ui-ux)

- Focus visible global dans `globals.css`.
- Cibles tactiles : barre villa mobile avec `min-h` sur CTA ; classe `.tap-target` disponible.
- **Motion :** `@media (prefers-reduced-motion: reduce)` partiellement couvert (animations `.reveal`).

---

## 11. Plan d’actions priorisé

| Priorité | Action |
|----------|--------|
| **P1** | Confirmer utilité de `heroui.min.css` ; retirer ou charger conditionnellement si inutile. |
| **P2** | Baseline Lighthouse (mobile) + fichier `MESURES_BASELINE.md`. |
| **P2** | Metadata dynamique fiches villa / catalogue pour partage social. |
| **P3** | CSP report-only ou progressive sur domaine de prod. |
| **P3** | Rate limiting sur endpoints sensibles (`/api/contact`, `/api/chat`) si abus observés. |

---

## 12. Références internes

| Ressource | Contenu |
|-----------|---------|
| `RECAP.md` | Vue produit + stack + état d’avancement actualisé. |
| `docs/ACTIONS_LOG.md` | Journal global des changements (agent `cursor` / `claude`). |
| `docs/logs/2026-04-06.md`, `2026-04-07.md` | Journaux de session détaillés. |
| `docs/superpowers/prompts/claude-code-*.md` | Prompts pour sessions Claude Code (n8n, home, etc.). |

**Note « terminal Claude » :** le dépôt ne versionne pas les sorties brutes des terminaux. Les interventions **Claude Code** suivies sont consignées dans `ACTIONS_LOG.md` avec **`agent: claude`** et dans les fichiers `docs/logs/*.md` ; pour une session donnée, reprendre ces entrées plutôt qu’un dump CLI.

---

**Vérification :** `npm run build` — succès (2026-04-07). Un warning ESLint `react-hooks/exhaustive-deps` peut subsister sur `Chatbot.tsx` (à traiter si bruyant en CI).
