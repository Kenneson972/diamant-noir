# Actions Log

Journal des changements notables (qui / quoi / pourquoi). Les entrées peuvent préciser l’agent :

| Champ | Valeurs typiques |
|--------|------------------|
| **agent** | `cursor` — modifications depuis Cursor IDE · `claude` — session **Claude Code** (CLI terminal) |
| **session** | Détail du jour : `docs/logs/YYYY-MM-DD.md` (section *Claude Code* si besoin) |

> **Astuce :** après une session Claude Code, ajouter une entrée ici **et** un bloc dans `docs/logs/<date>.md` sous `### Claude Code` pour garder l’historique lisible.

---

## 2026-04-13T21:40:00Z | type: ui | Cursor — Prestations hub : navbar transparente au scroll

- **agent**: `cursor`
- **summary**: **`Navbar`** — sur **`/prestations` uniquement**, **`isSolid`** reste faux au scroll (barre non blanche, fond **`bg-transparent`** comme en haut de page) ; chrome blanc conservé via **`isDarkHeroRoute`**.
- **files**: [`components/layout/Navbar.tsx`, `docs/ACTIONS_LOG.md`, `docs/logs/2026-04-13.md`]
- **why**: Demande client : conserver la transparence de la nav pendant le défilement sur la page prestations.
- **verify**: scroll long sur `/prestations` ; sous-routes `/prestations/services/*` inchangées (barre blanche au scroll si besoin lisibilité).

---

## 2026-04-13T21:25:00Z | type: ui | Cursor — Prestations : fondu transition (retrait bg-black opaque)

- **agent**: `cursor`
- **summary**: Zone **transition** après le scroll : suppression du **`bg-black`** sur le conteneur (il masquait tout le canvas → bloc noir uniforme). Dégradé **`transparent → #000`** pour retrouver le fondu sur la dernière frame vidéo avant le strip CTA.
- **files**: [`app/prestations/PrestationsPageClient.tsx`, `docs/ACTIONS_LOG.md`, `docs/logs/2026-04-13.md`]
- **why**: Régression visuelle : le dégradé ne pouvait pas révéler la vidéo car peint sur un fond noir opaque.
- **verify**: contrôle visuel `/prestations` en bas de séquence scroll.

---

## 2026-04-13T21:05:00Z | type: ui | Cursor — Prestations : masquer la pile vidéo fixed après la zone scroll

- **agent**: `cursor`
- **summary**: **`PrestationsPageClient`** — wrapper **`videoScrollZoneRef`** (hero + driver 500vh + transition) ; **ScrollTrigger** `end: "bottom top"` avec **`onLeave` / `onEnterBack`** pour passer **`visibility: hidden | visible`** sur canvas, vignette, dots et popups `#pvsh-*`. Évite que la dernière frame reste visible sous le hub / footer (éléments `fixed` en `z-0`–`z-20`).
- **files**: [`app/prestations/PrestationsPageClient.tsx`, `docs/ACTIONS_LOG.md`, `docs/logs/2026-04-13.md`]
- **why**: L’image canvas en bas de page malgré sections opaques — stacking / viewport : la couche fixed continuait d’être peinte.
- **verify**: `npm run build` OK ; contrôle manuel `/prestations` en scroll jusqu’au footer puis retour haut.

---

## 2026-04-13T19:15:00Z | type: ui | Cursor — Prestations scroll : plus de bandes claires en fin de séquence

- **agent**: `cursor`
- **summary**: **`PrestationsPageClient`** + **`VideoScrollHero`** — avant chaque `drawImage`, **remplissage noir** du canvas + dimensions cover en **`Math.ceil`** / position en **`Math.floor`** pour éviter les pixels transparents (body offwhite visible en haut/bas). Zone **transition** vidéo → contenu : fond **`bg-black`** + dégradé plus tôt opaque pour masquer la fin de frame.
- **files**: [`app/prestations/PrestationsPageClient.tsx`, `components/prestations/VideoScrollHero.tsx`, `docs/ACTIONS_LOG.md`, `docs/logs/2026-04-13.md`]
- **why**: À la fin du scroll, apparition de bandes claires / sensation de « fin d’image » due au canvas non entièrement peint ou transition trop transparente.
- **verify**: `npm run build` OK ; en dev, rechargement `/prestations`.

---

## 2026-04-13T18:30:00Z | type: ui | Cursor — Popups prestations : recalage frames + glass blanc lisible

- **agent**: `cursor`
- **summary**: **`PrestationsPageClient`** + **`VideoScrollHero`** — recalage **Ménage** à `337–420` (plus d’affichage sur la séquence cuisine), maintien de **Finance** à `505–560`, suppression du libellé de scène dans les popups (`section.scene` non affiché), refonte visuelle des popups en **glass blanc** lisible (sans accents or/noir), harmonisation des points de progression et des accents du hub `#piliers`.
- **files**: [`data/prestations-scroll-sections.ts`, `app/prestations/PrestationsPageClient.tsx`, `components/prestations/VideoScrollHero.tsx`, `docs/ACTIONS_LOG.md`, `docs/logs/2026-04-13.md`]
- **why**: Corriger le décalage perçu de contenu popup (ménage vu sur la cuisine), supprimer les mentions de plans, et appliquer une direction visuelle claire et lisible demandée.
- **verify**: `npm run build` OK.

---

## 2026-04-11T20:00:00Z | type: ui | Cursor — Prestations : hub #piliers + Finance sur frames café/tablette

- **agent**: `cursor`
- **summary**: **`PrestationsPageClient`** — après le scroll canvas : strip CTA, chiffres, grille **`#piliers`** (liens `/prestations/services/[slug]`), bloc soumettre + FAQ ; suppression du long contenu dupliqué (process, copilot, témoignages, inclusions inline). Popups scroll : **« Voir le détail »** → **`router.push`**. CTAs hero/strip → **`#piliers`**. **`VideoScrollHero`** : **Finance `startFrame` 505** (trou 449–504), liens détail en routes service ; **`Link`** sans `preventDefault` scroll.
- **files**: [`app/prestations/PrestationsPageClient.tsx`, `components/prestations/VideoScrollHero.tsx`, `data/prestations-scroll-sections.ts` (déjà505–560), `docs/ACTIONS_LOG.md`, `docs/logs/2026-04-11.md`]
- **why**: Popup Finance alignée sur le plan café + tablette ; page prestations moins chargée, profondeur sur pages service.
- **verify**: `npm run build` OK.

---

## 2026-04-13T16:00:00Z | type: ui | Cursor — Prestations popups : GSAP ne casse plus le centrage vertical

- **agent**: `cursor`
- **summary**: **`PrestationsPageClient`** + **`VideoScrollHero`** — le `y` GSAP était appliqué sur le même nœud que **`translate-y`** Tailwind, ce qui écrasait le positionnement vertical. **`opacity`** reste sur le panneau **`#pvsh-*`**, **`y`** sur un enfant **`.pvsh-motion`** ; léger ajustement **upper/lower** (`30%` / `68%`).
- **files**: [`app/prestations/PrestationsPageClient.tsx`, `components/prestations/VideoScrollHero.tsx`, `docs/ACTIONS_LOG.md`]
- **why**: Cartes scroll mal placées malgré classes `top` / `vertical`.
- **verify**: `npm run build` OK.

---

## 2026-04-13T14:30:00Z | type: ui | Cursor — Prestations : plus d’hydratation sur le hero (dynamic ssr:false)

- **agent**: `cursor`
- **summary**: **`app/prestations/page.tsx`** — coquille légère + **`dynamic(..., { ssr: false })`** vers **`PrestationsPageClient.tsx`** (contenu inchangé) + fallback **« Nos Prestations »** pendant le chargement du chunk. Le hero canvas / GSAP / overlays **ne sont plus sérialisés en HTML serveur**, donc plus de mismatch SSR vs bundle client (cache HMR / ancien JS).
- **files**: [`app/prestations/page.tsx`, `app/prestations/PrestationsPageClient.tsx`, `docs/ACTIONS_LOG.md`, `docs/logs/2026-04-13.md`]
- **why**: Erreur React « Hydration failed » sur `/prestations` (HTML serveur ≠ premier rendu client).
- **impact**: Brève vue fallback avant l’expérience scroll ; métadonnées inchangées (`layout.tsx`).
- **verify**: `npm run build` OK.

---

## 2026-04-12T18:00:00Z | type: ui | Cursor — Prestations scroll : glass lisible + popups masqués en haut + hydration

- **agent**: `cursor`
- **summary**: **`app/prestations/page.tsx`** — cartes **glass** (fond `rgba(14,14,18,0.58)`, **`md:backdrop-blur-xl`**, mobile **~92 % opaque sans blur**), **text-shadow / drop-shadow** sur textes ; **aucune carte** tant que **`ScrollTrigger.progress <= POPUP_MIN_PROGRESS`** (hero / retour haut de page) ; **`activateSection`** met à jour **`currentSectionRef`** ; **`suppressHydrationWarning`** sur wrappers `pvsh-*` (écart SSR/client si HMR).
- **files**: [`app/prestations/page.tsx`, `docs/ACTIONS_LOG.md`, `docs/logs/2026-04-12.md`]
- **why**: Hydration mismatch signalement + demande glass lisible + premier popup qui ne disparaissait pas en remontant.
- **verify**: `npm run build` OK.

---

## 2026-04-12T14:00:00Z | type: ui | Cursor — Prestations page : overlays réels (inline) + mobile + calibrage

- **agent**: `cursor`
- **summary**: **`app/prestations/page.tsx`** — le hero scroll est **inline** (pas `VideoScrollHero`) : cartes **`pvsh-*`** passées en **navy/or opaque** (fin glass), liste **`text-sm text-white`**, CTA or ; **mobile** : carte **`bottom` + safe-area**, **`max-h` + overflow-y** ; **desktop** : **`vertical`** par section (`upper` / `center` / `lower`) via `scrollSectionVerticalClasses` ; doc calibrage **`startFrame`/`endFrame`** + log opt. **`window.__PVSH_LOG_FRAMES`**.
- **files**: [`app/prestations/page.tsx`, `docs/ACTIONS_LOG.md`, `docs/logs/2026-04-12.md`]
- **why**: Capture utilisateur = ancien glass dans la page ; cartes centrales masquaient le sujet sur mobile ; timing à ajuster avec frames réelles.
- **impact**: Lisibilité et composition ; outil de debug pour bornes frames.
- **verify**: `npm run build` OK.

---

## 2026-04-11T20:00:00Z | type: ui | Cursor — Prestations : overlays vidéo scroll navy/or + lisibilité

- **agent**: `cursor`
- **summary**: **`VideoScrollHero`** — cartes section scroll-driven : fond **`bg-navy` solide** (fin du glass / blur), **`border-gold/30`** + barre **`border-l-4` / `border-r-4`** selon côté, ombre renforcée ; typo **liste `text-sm` `text-white/90`**, scène **`text-white/50`**, tagline **`text-gold`**, CTA **`text-gold`** + hover underline.
- **files**: [`components/prestations/VideoScrollHero.tsx`, `docs/ACTIONS_LOG.md`, `docs/logs/2026-04-11.md`]
- **why**: Textes illisibles sur verre flouté ; alignement identité noir/or Diamant Noir.
- **impact**: Contraste stable sur toutes les frames ; meilleure accessibilité lecture.
- **verify**: `npm run build` OK.

---

## 2026-04-11T12:00:00Z | type: ui | Cursor — Login mobile : bandeau média + fondu vers formulaire

- **agent**: `cursor`
- **summary**: **`LoginSideVideo`** : hauteur mobile **`clamp(220px, 42svh, 420px)`** à la place de **`h-[200px]`** ; overlay **`gradient-to-b`** (transparent → blanc, `lg:hidden`) pour adoucir la jonction avec le panneau blanc quand le formulaire inscription est long.
- **files**: [`app/login/page.tsx`, `docs/ACTIONS_LOG.md`, `docs/logs/2026-04-11.md`]
- **why**: Formulaire inscription élargi — le média restait trop bas ; coupure visuelle nette entre wallpaper et zone formulaire.
- **impact**: Plus de bandeau immersif proportionnel à l’écran ; transition moins « bâton » sur mobile.
- **verify**: relecture JSX / lint OK.

---

## 2026-04-09T18:00:00Z | type: script | Cursor — Import workflow n8n (owner-copilot v2)

- **agent**: `cursor`
- **summary**: Script **`scripts/import-owner-copilot-n8n.mjs`** : POST `N8N_BASE_URL` + `N8N_API_KEY` → `/api/v1/workflows` avec `docs/n8n/owner-copilot-workflow-v2.json`. Doc **`OWNER_COPILOT_AUTOMATION.md`** : import UI + import API. Impossible d’exécuter l’import sans clé API n8n (non présente dans le dépôt).
- **files**: [`scripts/import-owner-copilot-n8n.mjs`, `docs/n8n/OWNER_COPILOT_AUTOMATION.md`, `docs/ACTIONS_LOG.md`]
- **why**: Demande d’import du workflow v2 sur n8n.
- **verify**: `node scripts/import-owner-copilot-n8n.mjs` → message d’aide si env manquant.

---

## 2026-04-09T16:00:00Z | type: docs | Cursor — Guide n8n copilot + payload enrichi

- **agent**: `cursor`
- **summary**: **`docs/n8n/OWNER_COPILOT_AUTOMATION.md`** : explication sans/s avec n8n, contrat payload/réponse, prompt FR, secret optionnel. **`owner-copilot-n8n-response.example.json`**. **`POST owner-assistant`** : `context` enrichi (`alerts`, `tasks_open`, `villas`, `stats` complet), header **`X-Webhook-Secret`** si `N8N_OWNER_WEBHOOK_SECRET`. Mise à jour **RECAP_COPILOT**, **OWNER_ASSISTANT**, **`.env.local.example`**.
- **files**: [`app/api/dashboard/owner-assistant/route.ts`, `docs/n8n/OWNER_COPILOT_AUTOMATION.md`, `docs/n8n/owner-copilot-n8n-response.example.json`, `docs/RECAP_COPILOT_PROPRIETAIRE.md`, `docs/OWNER_ASSISTANT_COPILOT.md`, `.env.local.example`, `docs/ACTIONS_LOG.md`]
- **why**: Automatisation LLM réelle + compréhension du repli local sans n8n.
- **verify**: `npx tsc --noEmit` OK.

---

## 2026-04-09T14:30:00Z | type: sql | Cursor — Migration owner_alerts appliquée (Supabase MCP)

- **agent**: `cursor`
- **summary**: Migration **`owner_alerts_ai_action_logs`** appliquée sur le projet Supabase **DIAMANT NOIR** (`apply_migration` MCP) : tables `owner_alerts`, `ai_action_logs`, RLS + policies.
- **files**: [`supabase/migrations/20260408180000_owner_alerts_ai_action_logs.sql`, `docs/ACTIONS_LOG.md`]
- **why**: Aligner la base distante sur le schéma attendu par le copilot propriétaire.
- **verify**: MCP `apply_migration` success ; `list_migrations` inclut la nouvelle version.

---

## 2026-04-09T12:00:00Z | type: security | Cursor — Admin chat allowlist + snapshot tâches

- **agent**: `cursor`
- **summary**: **`/api/admin/chat`** : Bearer JWT obligatoire + **`isAdminChatAllowedUser`** ([`lib/admin-chat-allowlist.ts`](../lib/admin-chat-allowlist.ts)) via `ADMIN_CHAT_ALLOWED_EMAILS` / `ADMIN_CHAT_ALLOWED_USER_IDS` (sinon 403). **`GET /api/dashboard/owner-assistant`** : champ **`tasks_open`** (aperçu tâches). Page assistant : bloc **Tâches ouvertes**. **`.env.local.example`** mis à jour. Docs **RECAP**, **RECAP_COPILOT**, **OWNER_ASSISTANT** alignés.
- **files**: [`app/api/admin/chat/route.ts`, `lib/admin-chat-allowlist.ts`, `app/api/dashboard/owner-assistant/route.ts`, `app/dashboard/proprio/assistant/page.tsx`, `.env.local.example`, `RECAP.md`, `docs/RECAP_COPILOT_PROPRIETAIRE.md`, `docs/OWNER_ASSISTANT_COPILOT.md`, `docs/ACTIONS_LOG.md`]
- **why**: Séparation nette propriétaire (`owner-assistant`) / équipe (`admin/chat`) ; MVP copilot avec points d’attention tâches visibles.
- **verify**: `npm run build`.

---

## 2026-04-08T21:00:00Z | type: docs | Cursor — Récap séparé copilot propriétaire

- **agent**: `cursor`
- **summary**: Ajout de **`docs/RECAP_COPILOT_PROPRIETAIRE.md`** : récap autonome (hors `RECAP.md` général), tables, routes, fichiers, suite infra. Liens depuis **`RECAP.md`** et note en tête de **`OWNER_ASSISTANT_COPILOT.md`**.
- **files**: [`docs/RECAP_COPILOT_PROPRIETAIRE.md`, `RECAP.md`, `docs/OWNER_ASSISTANT_COPILOT.md`, `docs/ACTIONS_LOG.md`]
- **why**: Demande d’un récap dédié uniquement à cette fonctionnalité.
- **impact**: Point d’entrée lisible ; la spec technique reste dans `OWNER_ASSISTANT_COPILOT.md`.

---

## 2026-04-08T20:00:00Z | type: docs | Cursor — Spec copilot propriétaire (MD)

- **agent**: `cursor`
- **summary**: Ajout de **`docs/OWNER_ASSISTANT_COPILOT.md`** : récapitulatif complet (objectif, architecture, fichiers, schéma DB, contrat API, n8n, robustesse, vérifs). Mise à jour de **`RECAP.md`** (route assistant, table API, variables `N8N_OWNER_WEBHOOK_URL`, section Dashboard & IA, arborescence `docs/`).
- **files**: [`docs/OWNER_ASSISTANT_COPILOT.md`, `RECAP.md`, `docs/ACTIONS_LOG.md`]
- **why**: Point de référence unique pour ne pas se perdre sur le copilot propriétaire.
- **impact**: Onboarding et maintenance alignés sur l’implémentation réelle.
- **verify**: relecture Markdown ; liens relatifs vers `app/` et `lib/` OK.

---

## 2026-04-07T23:30:00Z | type: ui | Cursor — Accueil : retrait triplet hero + Vercel prod

- **agent**: `cursor`
- **summary**: `HeroWordmarkBaseline` : prop **`showValuesTriplet`** (défaut `true`). **`app/page.tsx`** : `showValuesTriplet={false}` — suppression des trois valeurs micro *Confiance · Réactivité · Excellence* sur l’index ; `titleLabel` a11y sans cette mention. `/proprietaires` inchangé (triplet conservé).
- **files**: [`components/marketing/HeroWordmarkBaseline.tsx`, `app/page.tsx`, `docs/ACTIONS_LOG.md`, `docs/logs/2026-04-07.md`]
- **why**: Brief — alléger le hero d’accueil.
- **verify**: `npm run build` OK ; `npx vercel deploy --prod --yes` (voir entrée session pour id déploiement) ; `npm run dev` relancé.

---

## 2026-04-08T17:00:00Z | type: docs | Cursor — RECAP projet mis à jour

- **agent**: `cursor`
- **summary**: `RECAP.md` réécrit : positionnement conciergerie-first, routes & API à jour, structure dossiers, fonctionnalités (navbar, hero, Leaflet/z-index, prestations), chronologie 2026-04-05 → 08, déploiement Vercel, traçabilité, dettes connues.
- **files**: [`RECAP.md`, `docs/ACTIONS_LOG.md`]
- **why**: Référence unique alignée sur l’état réel du repo.
- **impact**: Onboarding et revue projet facilités.

---

## 2026-04-08T16:00:00Z | type: ui | Cursor — Header : clic logo → accueil fiable

- **agent**: `cursor`
- **summary**: Colonne centrale du `Navbar` : retrait de `pointer-events-none` (les clics ne remontaient pas correctement vers le `<Link>` du logo selon navigateurs). Colonne `z-[1030]` pour rester au-dessus d’un éventuel chevauchement de grille. `BrandLogo` : `aria-label` + `scroll` sur le `Link` vers `/`.
- **files**: [`components/layout/Navbar.tsx`, `components/layout/BrandLogo.tsx`, `docs/ACTIONS_LOG.md`]
- **why**: Logo header ne ramenait pas à l’accueil de façon fiable.
- **impact**: Navigation client vers `/` et scroll en haut de page au clic sur le logo.

---

## 2026-04-08T15:00:00Z | type: ui | Cursor — `/prestations` : bande noire CTA centrée

- **agent**: `cursor`
- **summary**: `text-center` sur le conteneur ; `justify-center` sur la rangée bouton + lien ; second lien en `inline-flex` + `min-h-[44px]` pour alignement vertical homogène.
- **files**: [`app/prestations/page.tsx`, `docs/ACTIONS_LOG.md`]
- **impact**: Texte commission et CTAs alignés au centre.

---

## 2026-04-08T14:00:00Z | type: ui | Cursor — `/prestations` : bande noire CTA plus compacte

- **agent**: `cursor`
- **summary**: Section sous hero (fond noir) : `py-8`/`md:py-10` → `py-4`/`md:py-5`, `mt-5` ligne commission → `mt-2.5`/`md:mt-3`, gaps et padding bouton légèrement réduits.
- **files**: [`app/prestations/page.tsx`, `docs/ACTIONS_LOG.md`]
- **why**: Bande trop haute visuellement par rapport au contenu.
- **impact**: Hauteur de la zone noire diminuée, hiérarchie hero → CTA plus serrée.

---

## 2026-04-08T12:00:00Z | type: ui | Cursor — Hero `/prestations` : image dédiée

- **agent**: `cursor`
- **summary**: `public/prestations-hero.png` (visuel indoor-outdoor luxe tropical) ; `EditorialHeroImmersive` sur `app/prestations/page.tsx` : `imageSrc` + `imageAlt` mis à jour.
- **files**: [`app/prestations/page.tsx`, `public/prestations-hero.png`, `docs/ACTIONS_LOG.md`]
- **why**: Brief — hero conciergerie avec visuel aligné prestations.
- **impact**: Fond hero `/prestations` remplace le placeholder générique.
- **verify**: non demandé (`npm run build` volontairement non lancé).

---

## 2026-04-07T22:00:00Z | type: ui | Claude Code — Repositionnement « conciergerie first » + build + Vercel prod

- **agent**: `claude`
- **summary**: Livraison alignée `docs/superpowers/specs/2026-04-07-conciergerie-first-design.md` : hero — carte **Conciergerie** en premier, navigation vers `/prestations` ; **TrustBand** — Conciergerie 24/7 en tête ; **`HomeConciergeHighlight`** — grille services + CTA prestations ; **ordre sections** home — highlight avant villas, `HomeOwnersSection` avant catalogue mis en avant ; **HomeLifestyleAudience** — CTA vers `/prestations` ; **HomeBottomCta** — action principale conciergerie, villas secondaire ; enrichissements highlight (piliers, inclusions, tarif) ; page **`/prestations`** — hero CTA, bande stats, témoignage, inclusions par catégories, FAQ + rassurances. Spec + plan : `docs/superpowers/specs/2026-04-07-conciergerie-first-design.md`, `docs/superpowers/plans/2026-04-07-conciergerie-first.md`. Commits `main` (extrait) : `830329a` … `3d35c71`.
- **files**: home (`app/page.tsx`, `components/home/*`), `app/prestations/page.tsx`, navbar / hero selon commits ; docs spec/plan ; `docs/ACTIONS_LOG.md`, `docs/logs/2026-04-07.md`
- **why**: Brief gérant — marque perçue comme maison de conciergerie privée, pas plateforme de location.
- **impact**: Parcours marketing et hiérarchie CTA orientés conciergerie ; catalogue villas relégué visuellement après.
- **verify**: `npm run build` OK (warning ESLint existant `Chatbot.tsx` hooks) ; `npx vercel deploy --prod --yes` → **READY**, alias `https://diamant-noir.vercel.app` ; déploiement `dpl_7YjcUErBrKh68G6VBczQ8TPYrir4`.

---

## 2026-04-06T18:30:00Z | type: ui | Cursor — Navbar lisible sur fiches villas + z-index au-dessus de Leaflet

- **agent**: `cursor`
- **summary**: `isDarkHeroRoute` : `/villas/[id]` n’est plus traité comme hero sombre (galerie / fond clair en tête → chrome navy + vitrage). Header / overlay menu / drawer : z-index **1020 / 1030 / 1040** pour passer au-dessus des panneaux Leaflet (~400–1000). `VillaGallery` lightbox **z-[1100]** ; `VillaQuickView` **1050 / 1060** pour l’aperçu catalogue au-dessus de la carte.
- **files**: [`components/layout/Navbar.tsx`, `components/VillaGallery.tsx`, `components/VillaQuickView.tsx`, `docs/ACTIONS_LOG.md`, `docs/logs/2026-04-06.md`]
- **why**: Texte blanc sur photo claire = header « invisible » ; carte sticky pouvait recouvrir la barre et le menu (z-100 &lt; Leaflet).
- **impact**: Navigation toujours visible et cliquable sur `/villas` et fiches villa.
- **verify**: `npm run build` OK ; `npm run dev` relancé.

---

## 2026-04-06T12:00:00Z | type: ui | Cursor — Wording : « Conciergerie privée » (sans « en »)

- **agent**: `cursor`
- **summary**: Remplacement de **Conciergerie en privée** par **Conciergerie privée** dans `titleLabel` (`app/page.tsx`, `app/proprietaires/page.tsx`) et dans `HomeLifestyleAudience` (« Notre conciergerie privée s’occupe… »). Le hero `HeroWordmarkBaseline` était déjà à jour.
- **files**: [`app/page.tsx`, `app/proprietaires/page.tsx`, `components/home/HomeLifestyleAudience.tsx`, `docs/ACTIONS_LOG.md`, `docs/logs/2026-04-06.md`]
- **why**: Formulation française correcte (nom + adjectif), alignée avec le brief.
- **impact**: Libellés visibles et a11y cohérents.
- **verify**: `npm run build` OK.

---

## 2026-04-09T14:00:00Z | type: ui | Cursor — Wording « Conciergerie en privée » + cartes hero masquées après choix

- **agent**: `cursor`
- **summary**: `HeroWordmarkBaseline` + `titleLabel` accueil/propriétaires : **Conciergerie en privée**. `HomeLifestyleAudience` : phrase alignée (grammaire + accord). `HeroAudienceCards` : après **Espace Voyageur** → cartes retirées, affichage **uniquement** `HeroSearchWidget` ; après **Espace Propriétaire** → `null` (disparition + scroll `#offre-proprietaire`). Correction ancien bug `setShowSearch((p) => !p)` sur le clic voyageur.
- **files**: [`components/marketing/HeroWordmarkBaseline.tsx`, `app/page.tsx`, `app/proprietaires/page.tsx`, `components/home/HeroAudienceCards.tsx`, `components/home/HomeLifestyleAudience.tsx`, `docs/ACTIONS_LOG.md`]
- **why**: Brief — formulation exacte + ne plus afficher le duo de cartes une fois le parcours choisi.
- **verify**: `npm run build` OK ; `npm run dev` relancé.

---

## 2026-04-09T12:00:00Z | type: ui | Cursor — Hero : Conciergerie privée + triplet micro-typo ; suppression gate orphelin

- **agent**: `cursor`
- **summary**: `HeroWordmarkBaseline` : ligne *Conciergerie privée* (font-display, tracking) sous le wordmark ; *Confiance · Réactivité · Excellence* en **micro** (7–8px, tracking large, opacité basse). `app/page.tsx` / `app/proprietaires/page.tsx` : `titleLabel` a11y mis à jour. Suppression de `components/home/HomeAudienceGate.tsx` (non importé, imports cassés vs `HomeAudienceContext` — bloquait `npm run build`). Commentaire `bodyScrollLock` généralisé.
- **files**: [`components/marketing/HeroWordmarkBaseline.tsx`, `app/page.tsx`, `app/proprietaires/page.tsx`, `lib/bodyScrollLock.ts`, `docs/ACTIONS_LOG.md`]
- **why**: Brief gérant — intention principale visible, valeurs en discret ; build vert après refacto contexte sans gate.
- **impact**: Hero plus lisible hiérarchiquement ; plus d’erreur TS sur fichier gate mort.
- **verify**: `npm run build` OK ; `npm run dev` relancé après build.

---

## 2026-04-07T18:00:00Z | type: docs | Cursor — Audit complet Karibloom + RECAP + traçabilité journaux

- **agent**: `cursor`
- **summary**: Nouveau document `docs/audits/audit-complet-2026-04-07.md` : audit statique multi-domaines (viewport/safe area, mobile blur/dvh, SEO racine, headers sécurité, API Bearer+owner, import/normalisation équipements, a11y, P1–P3 recommandations). `RECAP.md` réécrit en profondeur : sections audit, traçabilité (ACTIONS_LOG, `docs/logs/`, clarification absence de dumps terminal versionnés ; sessions Claude documentées via `agent: claude`), chronologie 2026-04-05 / 06 / 07, tâches alignées audit. `docs/logs/2026-04-07.md` complété.
- **files**: [`docs/audits/audit-complet-2026-04-07.md`, `RECAP.md`, `docs/logs/2026-04-07.md`, `docs/ACTIONS_LOG.md`]
- **why**: Demande utilisateur — audit avec toutes les règles disponibles + récap projet unifié incluant références « terminal Claude » (journalisation via ACTIONS_LOG / logs, pas stdout archivé).
- **impact**: Point d’entrée unique pour l’état qualité du code et l’historique des livraisons récentes.
- **verify**: `npm run build` OK.

---

## 2026-04-06T23:55:00Z | type: ui+perf | Cursor — Mobile : padding fiche villa, tap delay, overlay menu

- **agent**: `cursor`
- **summary**: Fiche villa (`/villas/[id]`) : `pb-24 sm:pb-0` sur `<main>` pour ne pas masquer le contenu derrière la barre fixe mobile. `globals.css` : `touch-action: manipulation` sur boutons/contrôles pour réduire le délai de tap. `Navbar` overlay mobile menu : `backdrop-blur-none md:backdrop-blur-sm`, fond légèrement renforcé (`bg-black/50`).
- **files**: [`app/villas/[id]/page.tsx`, `app/globals.css`, `components/layout/Navbar.tsx`, `docs/ACTIONS_LOG.md`]
- **why**: Skill mobile-responsive — safe reading above sticky bar ; perf Chrome Android sur blur plein écran ; réactivité tactile.
- **impact**: Dernière section de la fiche villa lisible sur mobile ; overlay menu moins coûteux sur petit écran.
- **verify**: `npm run build` OK.

---

## 2026-04-06T23:30:00Z | type: ui+perf | Cursor — Mobile-responsive : overflow, dvh, assistant, navbar blur

- **agent**: `cursor`
- **summary**: `globals.css` : `overflow-x: hidden` sur `html`/`body`. `Navbar` : `backdrop-blur` actif à partir de `md:` seulement (Chrome Android). Assistant admin : `100dvh`, colonne terminal `w-full` + split vertical mobile / `md:w-[450px]`, padding droit responsive. Messagerie locataire : `calc(100dvh - 280px)`. `VillasMapView` : hauteur carte `100dvh` + `min-h-[280px]`.
- **files**: [`app/globals.css`, `components/layout/Navbar.tsx`, `app/dashboard/proprio/assistant/page.tsx`, `app/espace-client/messagerie/page.tsx`, `components/VillasMapView.tsx`, `docs/ACTIONS_LOG.md`, `docs/logs/2026-04-06.md`]
- **why**: Skill mobile-responsive — réduire scroll horizontal, barre d’adresse mobile, GPU blur, largeurs fixes.
- **impact**: Meilleure stabilité viewport tactile ; moins de coût blur sur petit écran ; assistant utilisable sur téléphone.
- **verify**: `npm run build` OK.

---

## 2026-04-06T22:00:00Z | type: docs | Cursor — Sync règles Builder, skill mobile-responsive, audit mobile diamant-noir

- **agent**: `cursor`
- **summary**: Synchronisation du pack `client-builder` (DIAMANTNOIR → `CLIENT BUILDER KARIBLOOM/client-builder-rules/`) ; `kb-mobile-responsive.mdc` du pack = redirecteur vers le skill ; création du skill `.cursor/skills/mobile-responsive/` (copie miroir `client-builder-rules/skills/mobile-responsive/`) ; `kb-action-documentation` alignée (fichier racine + `01-core` dans Builder) ; `_INDEX` mis à jour. Audit mobile statique du projet `diamant-noir` (viewport OK, gaps overflow-x / vh / largeurs fixes / backdrop).
- **files**: [`.cursor/rules/client-builder/`, `.cursor/skills/mobile-responsive/`, `.cursor/rules/kb-action-documentation.mdc`, `CLIENT BUILDER KARIBLOOM/client-builder-rules/`, `docs/ACTIONS_LOG.md`, `docs/logs/2026-04-06.md`]
- **why**: Alignement agence après mise à jour des règles ; skill mobile réutilisable ; traçabilité audit.
- **impact**: Builder et projet client partagent le même pack + skill ; checklist d’amélioration mobile documentée.
- **verify**: Revue fichiers ; pas de `npm run build` requis (docs + markdown + copie).

---

## 2026-04-06T18:45:00Z | type: ui | Cursor — Éditeur villa : TOC, filtres réservations, sync iCal, checklist, extractions

- **agent**: `cursor`
- **summary**: Correction JSX (section équipements) ; onglet Contenu : TOC ancres + CTA fiche publique + checklist publication non bloquante ; Planning : filtres recherche/statut/source sur le registre, export CSV client, carte sync iCal alimentée par `villa_ical_feeds` + rafraîchissement après `/api/sync` ; Contenu : encart état sync sous bloc iCal. Composants extraits sous `components/dashboard/villa-editor/` (`VillaBookingsRegistry`, `PlanningIcalSyncCard`, `VillaPublishChecklist`, `IcalConnectivityStatus`).
- **files**: [`app/dashboard/proprio/[villaId]/page.tsx`, `components/dashboard/villa-editor/VillaBookingsRegistry.tsx`, `components/dashboard/villa-editor/PlanningIcalSyncCard.tsx`, `components/dashboard/villa-editor/VillaPublishChecklist.tsx`, `components/dashboard/villa-editor/IcalConnectivityStatus.tsx`, `docs/ACTIONS_LOG.md`, `docs/logs/2026-04-06.md`]
- **why**: Plan « éditeur complet » sans changer le modèle de données ; lisibilité, confiance produit (sync réelle), guidance publication.
- **impact**: Propriétaire filtre/exporte les réservations, voit dernière sync quand les feeds existent, suit une checklist avant publication.
- **verify**: `npm run build` OK.

---

## 2026-04-06T12:00:00Z | type: ui | Cursor — Éditeur villa : onglets simplifiés, analyses factices retirées

- **agent**: `cursor`
- **summary**: Suppression des onglets **Réservations**, **Analyses** et **Maintenance** dans la barre d’édition. Le registre des réservations est regroupé sous **Planning** ; le carnet de maintenance et un lien vers `/dashboard/proprio/analytics` (données réelles multi-villas) sont sous **Réglages**. Retrait de l’import **recharts** sur cette page (graphiques en dur). Conseil conciergerie adapté à la Martinique. Bouton **Ajouter** tâche branché sur un `ref` + `handleAddTask`.
- **files**: [`app/dashboard/proprio/[villaId]/page.tsx`, `docs/ACTIONS_LOG.md`, `docs/logs/2026-04-06.md`]
- **why**: Moins d’onglets redondants ou trompeurs ; une seule entrée pour les analyses basées sur l’API existante.
- **impact**: Navigation plus courte ; pas de courbes factices dans l’éditeur ; planning + tableau des résas au même endroit.
- **verify**: `npm run build` OK.

---

## 2026-04-07T02:00:00Z | type: api+sql | Cursor — Migration Supabase MCP + normalisation équipements import

- **agent**: `cursor`
- **summary**: Migration `amenities_import_labels` appliquée sur projet Supabase **DIAMANT NOIR** (MCP `apply_migration`). Nouveau module `lib/amenity-import-normalize.ts` : alias FR/EN, règles « contient », déduplication → pastilles catalogue cochées auto après import ; `POST /api/import-airbnb` passe `amenities` par `normalizeImportedAmenities`.
- **files**: [`lib/amenity-import-normalize.ts`, `app/api/import-airbnb/route.ts`, `docs/ACTIONS_LOG.md`, `docs/logs/2026-04-07.md`]
- **why**: Aligner les libellés OTA sur le catalogue dashboard et activer les suggestions sans saisie manuelle.
- **impact**: Import Airbnb remplit souvent directement les cases suggestion (Wi-Fi, Lave-linge, Piscine, etc.) ; le reste reste en personnalisés.
- **verify**: MCP migration success ; `npm run build` ; test tsx sur échantillon FR.

---

## 2026-04-07T01:00:00Z | type: ui+sql | Cursor — Équipements : grille catalogue + perso + marque Import persistée

- **agent**: `cursor`
- **summary**: Grille **Suggestions** toujours visible (`lib/villa-amenities-suggested.ts`) ; section **Personnalisés** pour libellés hors catalogue (import Airbnb = texte exact) avec pastilles **Import** (vert) ou **Perso** (violet) ; colonne `amenities_import_labels` + migration SQL ; import et save alimentent / filtrent les marques ; collage multi-lignes synchronise les marques Import restantes.
- **files**: [`lib/villa-amenities-suggested.ts`, `app/dashboard/proprio/[villaId]/page.tsx`, `supabase/migrations/20260407120000_villas_amenities_import_labels.sql`, `docs/ACTIONS_LOG.md`, `docs/logs/2026-04-07.md`]
- **why**: Pastilles présentes dans l’éditeur + distinguer équipements issus de l’OTA des ajouts manuels, sans catalogue « luxe » hors sujet.
- **impact**: Après migration Supabase et enregistrement, les marques Import survivent au rechargement.
- **verify**: `npm run build` OK.

---

## 2026-04-07T00:15:00Z | type: ui | Cursor — Dashboard équipements : badges = items importés / liste réelle

- **agent**: `cursor`
- **summary**: Pastilles cliquables pour chaque entrée de `amenities` (libellés réels import Airbnb), retrait au clic ; champ + bouton « Ajouter » ; zone repliable saisie multi-lignes pour collage / édition masse.
- **files**: [`app/dashboard/proprio/[villaId]/page.tsx`, `docs/ACTIONS_LOG.md`, `docs/logs/2026-04-07.md`]
- **why**: Reprendre le confort visuel des anciens badges tout en liant 1:1 aux équipements importés, sans catalogue prédéfini.
- **impact**: Après import, la liste apparaît en badges ; même donnée sauvegardée qu’avant.
- **verify**: `read_lints`.

---

## 2026-04-06T23:30:00Z | type: ui | Cursor — Dashboard : équipements = liste libre (plus de badges prédéfinis)

- **agent**: `cursor`
- **summary**: Suppression des pastilles « luxe » (Piscine Infinity, Héliport, etc.) ; un seul champ **Équipements** (textarea 1 ligne = 1 item) lié à `amenities`. Détail intérieur / extérieur renommé en optionnel avec texte d’aide aligné.
- **files**: [`app/dashboard/proprio/[villaId]/page.tsx`, `docs/ACTIONS_LOG.md`, `docs/logs/2026-04-07.md`]
- **why**: Les badges n’étaient pas les vrais équipements (import Airbnb / réalité du logement) et créaient une double logique.
- **impact**: Les propriétaires éditent la même liste que celle stockée en base et affichée sur la fiche / les cartes.
- **verify**: `read_lints` sur le fichier modifié.

---

## 2026-04-06T22:45:00Z | type: ui | Cursor — Équipements fiche villa + dashboard

- **agent**: `cursor`
- **summary**: Fiche `villas/[id]` : `getEquipmentDisplayLists` — intérieur = `equipment_interior` ou repli sur `amenities` ; **extérieur sans repli** (suppression du doublon liste identique). Section « Tous les équipements » masquée si aucune liste ; grille 1 ou 2 colonnes. Icônes incontournables : jacuzzi, coffee, plage, réfrigérateur. Dashboard : aide contextuelle sous les zones int/ext et renommage « Badges incontournables ».
- **files**: [`app/villas/[id]/page.tsx`, `app/dashboard/proprio/[villaId]/page.tsx`, `docs/ACTIONS_LOG.md`, `docs/logs/2026-04-07.md`]
- **why**: La colonne extérieur reprenait par erreur `amenities`, donc doublon intérieur/extérieur après import OTA.
- **impact**: Lecture cohérente pour les voyageurs ; propriétaire comprend le rôle badges vs listes.
- **verify**: `read_lints` ; dev relancé sur le port 3000.

---

## 2026-04-06T20:30:00Z | type: api | Cursor — Import Airbnb : règles, horaires, équipements (HTML profond)

- **agent**: `cursor`
- **summary**: Extraction depuis le JSON embarqué Airbnb loin dans la page : bloc `houseRules` (texte + `check_in` / `check_out`), liste `Amenity` avec `available:true`. Avertissement explicite si `price_per_night` absent (prix souvent non inclus dans le HTML serveur, `structuredDisplayPrice` / `bookingPrefetchData.price` null).
- **files**: [`lib/listing-import.ts`, `docs/ACTIONS_LOG.md`, `docs/logs/2026-04-07.md`]
- **why**: Les heuristiques sur `textBlob` (120 ko) ne voyaient pas `houseRules` ni les équipements ; champs restaient vides malgré des données présentes dans la réponse HTTP.
- **impact**: Import plus complet pour annonces type `airbnb.fr/rooms/29571602` (horaires, règlement, ~30+ équipements) ; prix à compléter manuellement si non servi en SSR.
- **verify**: `parseListingFromHtml` sur HTML réel + fetch live URL ; `npm run build` OK.

---

## 2026-04-07T12:00:00Z | type: api | Cursor — Import annonce : prix LLM + parser Airbnb

- **agent**: `cursor`
- **summary**: `unwrapN8nListingBody` mappe les alias `price`, `nightlyPrice`, `prix`, etc. vers `price_per_night` ; `coerceNumber` tolère € / ESP / texte ; fallback OpenAI fusionne avec `forceOverride` comme n8n ; consigne LLM explicite sur `price_per_night`. Parser HTML : `amountMicros`, `qualifyingPrice.amount` (Airbnb).
- **files**: [`lib/listing-import-ai.ts`, `lib/listing-import.ts`, `docs/ACTIONS_LOG.md`]
- **why**: Le workflow renvoie souvent `price` au lieu de `price_per_night`, ignoré avant merge ; prix parfois seulement en micro-unités dans le HTML.
- **impact**: Prix et capacité mieux repris après enrichissement / parse.
- **verify**: `read_lints` sur fichiers modifiés.

---

## 2026-04-06T12:00:00Z | type: docs | Cursor — Prompt Claude Code + MCP n8n (Listing Import Enrich)

- **agent**: `cursor`
- **summary**: Ajout de `docs/superpowers/prompts/claude-code-n8n-listing-import-enrich.md` : contexte contrat Next↔n8n, problèmes du workflow actuel, checklist d’amélioration (system/user, suspectKeys, secret via env, max tokens, erreurs HTTP), bloc **PROMPT À COPIER** pour Claude Code avec MCP n8n.
- **files**: [`docs/superpowers/prompts/claude-code-n8n-listing-import-enrich.md`, `docs/ACTIONS_LOG.md`]
- **why**: Automatiser l’enrichissement réel des annonces via n8n sans casser `unwrapN8nListingBody` / `callN8nEnrich`.
- **impact**: Session Claude Code guidée pour modifier le workflow plutôt qu’improviser.
- **verify**: Relecture markdown ; pas de secret dans le fichier.

---

## 2026-04-05T23:55:00Z | type: ui | Cursor — Passage global héros / sections marketing (gabarit accueil)

- **agent**: `cursor`
- **summary**: Harmonisation **EditorialHeroImmersive** (prestations, qui-sommes-nous) avec `min-h` index, `max-w-4xl`, `px-5 sm:px-6`, ligne or ; **LandingHero** `md:min-h` aligné index ; **LandingSection** / **LandingCtaBand** / blocs **Editorial** (intro, grille, quotes, figure, image split) en `px-5 sm:px-6` ; **villas** hero header ; **soumettre-ma-villa** hero + corps ; **BookLandingMarketing** (2 variantes) ; témoignage **proprietaires**.
- **files**: [`components/marketing/editorial-blocks.tsx`, `components/marketing/landing-sections.tsx`, `components/book/BookLandingMarketing.tsx`, `app/villas/page.tsx`, `app/soumettre-ma-villa/page.tsx`, `app/proprietaires/page.tsx`, `docs/ACTIONS_LOG.md`]
- **why**: Les pages tierces ne partageaient pas le même retrait horizontal ni les mêmes hauteurs de bandeau que l’accueil.
- **impact**: Colonnes et bandeaux alignés sur une grille commune sur le site public.
- **verify**: Pas de `npm run build` (session dev localhost) ; `read_lints` sur fichiers modifiés.

---

## 2026-04-05T23:30:00Z | type: ui | Cursor — Heroes marketing : alignement accueil (pt-24, colonne, ligne or)

- **agent**: `cursor`
- **summary**: `LandingHero` et `LandingHeroCompact` alignés sur le rythme de l’index / propriétaires : `pt-24` sous navbar fixe, `min-h` progressifs, conteneur `max-w-4xl` + `px-5 sm:px-6`, ligne dorée `h-px w-10` sous le titre ; variante `split` inchangée pour le texte (gauche desktop).
- **files**: [`components/marketing/landing-sections.tsx`, `docs/ACTIONS_LOG.md`, `docs/logs/2026-04-05.md`]
- **why**: Pages tierces (contact, cookies, CGU, confidentialité) paraissaient plus « fines » ou décalées vs l’accueil.
- **impact**: Bandeau hero plus cohérent visuellement avec la home sur toute la largeur utile.
- **verify**: `npm run build` OK.

---

## 2026-04-05T22:00:00Z | type: ui+a11y+docs | Claude Code — Mobile hero, typo 9→10px, screenshots 390px

- **agent**: `claude`
- **summary**: **EditorialHeroImmersive** (`editorial-blocks.tsx`) : `min-h-[88vh]` remplacé par des hauteurs progressives (`min-h-[400px]` → `xs:min-h-[460px]` → `md:min-h-[88vh]`) pour éviter un hero ~743px sur petit mobile (pages `/prestations`, `/qui-sommes-nous`). **Typo** : remplacement global des `text-[9px]` par `text-[10px]` sur ~13 fichiers (AvailabilityAlert, CompareBar/CompareButton, BookingCard, ProfileForm, login, espace-client profil/réservations/livret, `NotificationBell`, `VillasView`, assistant proprio, etc.). **Docs visuels** : suppression des anciennes captures `docs/screenshots/mobile-390px/*.png`, régénération via script Playwright (dev `next` ; retake home après attente gate). Tableau récap pages (home, propriétaires, prestations, livret, book, villas, login).
- **files**: [`components/marketing/editorial-blocks.tsx`, `components/booking/AvailabilityAlert.tsx`, `components/villas/CompareBar.tsx`, `components/villas/CompareButton.tsx`, `components/espace-client/BookingCard.tsx`, `components/espace-client/ProfileForm.tsx`, `app/login/page.tsx`, `app/espace-client/profil/page.tsx`, `app/espace-client/reservations/[id]/page.tsx`, `app/espace-client/livret/page.tsx`, `components/dashboard/NotificationBell.tsx`, `components/dashboard/assistant-views/VillasView.tsx`, `app/dashboard/proprio/assistant/page.tsx`, `docs/screenshots/mobile-390px/` (régénéré), `docs/ACTIONS_LOG.md`, `docs/logs/2026-04-05.md`]
- **why**: Lisibilité WCAG / confort mobile ; héros éditorial trop haut sur iPhone ; jeu de captures à jour pour revue design.
- **impact**: UI plus lisible ; héros proportionné ; assets screenshot pour documentation.
- **verify**: Session Claude : `curl` localhost → 200 après rebuild dev ; script Playwright OK sur les vues ciblées.

---

## 2026-04-05T18:00:00Z | type: sql+security+api | Cursor — Espace client : RLS bookings, vue calendrier, checklist, session Stripe

- **agent**: `cursor`
- **summary**: Migration `tenant_bookings_rls_calendar_fix.sql` : vue `booking_calendar_slots` (dates sans PII), suppression de `bookings_public_read`, policy `tenant_own_bookings_update` pour la checklist ; nettoyage RLS `support_tickets`. UI : `AvailabilityCalendar` + `BookingForm` lisent la vue ; checklist filtre `status = confirmed` + comparaison de dates ; `/api/booking-session` utilise `supabaseAdmin()` pour lire la réservation par `stripe_session_id` sans dépendre du SELECT public.
- **files**: [`supabase/migrations/tenant_bookings_rls_calendar_fix.sql`, `components/booking/AvailabilityCalendar.tsx`, `components/BookingForm.tsx`, `app/espace-client/checklist/page.tsx`, `app/api/booking-session/route.ts`, `docs/ACTIONS_LOG.md`, `docs/logs/2026-04-05.md`]
- **why**: Fuite des lignes `bookings` via l’API anon ; checklist non persistée (pas d’UPDATE RLS) ; filtre `upcoming` incohérent avec le schéma ; route session Stripe cassée si SELECT public retiré.
- **impact**: Calendrier public inchangé fonctionnellement ; données invités non exposées en masse ; locataires peuvent sauver la checklist ; récupération post-paiement fiable.
- **verify**: `npm run build` (à lancer après `supabase db push` ou SQL Editor sur le projet).

---

## 2026-04-04T22:30:00Z | type: ui | Cursor — Header : max-width logo vs colonne droite (anti-chevauchement sm–md)

- **agent**: `cursor`
- **summary**: Colonne centrale (logo) : suppression du `sm:max-w-none` qui levait toute limite dès `sm` alors que téléphone + favoris s’ajoutent ; remplacement par `max-w` responsive (`8rem` → `13rem` → `20rem`, puis `lg:max-w-none`) pour réserver l’espace des actions et éviter le débordement de grille.
- **files**: [`components/layout/Navbar.tsx`, `docs/ACTIONS_LOG.md`, `docs/logs/2026-04-04.md`]
- **why**: Grille `1fr / auto / 1fr` + colonne `auto` sans plafond : la zone logo pouvait forcer un dépassement de viewport quand la droite devenait large (icônes + CTA texte).
- **impact**: Plus de chevauchement visuel entre logo et actions sur tablette / `sm`–`md`.
- **verify**: `npm run build` OK.

---

## 2026-04-05T01:45:00Z | type: ui | Cursor — Header mobile réellement responsive (densité réduite)

- **agent**: `cursor`
- **summary**: `Navbar` mobile : réduction des actions visibles (<`sm`) ; téléphone + favoris cachés en très petit écran, CTA compact en icône jusqu’à `md`, texte CTA uniquement à partir de `md`.
- **files**: [`components/layout/Navbar.tsx`, `docs/ACTIONS_LOG.md`, `docs/logs/2026-04-05.md`]
- **why**: Chevauchement persistant sur mobile (trop d’éléments dans la colonne droite + CTA texte précoce).
- **impact**: Header stable sur petit viewport, sans overlap.
- **verify**: `npm run build` OK.

---

## 2026-04-05T01:30:00Z | type: ui | Cursor — Header mobile : numéro concierge stabilisé

- **agent**: `cursor`
- **summary**: `Navbar` mobile/tablette : le numéro complet est repoussé à `lg` (`lg:inline-flex`) avec `whitespace-nowrap`; l’icône téléphone reste visible jusqu’à `lg` (`lg:hidden`) pour éviter le wrap cassé du header.
- **files**: [`components/layout/Navbar.tsx`, `docs/ACTIONS_LOG.md`, `docs/logs/2026-04-05.md`]
- **why**: Sur certains breakpoints mobiles, le numéro `+596 96 00 00 00` apparaissait trop tôt et se cassait sur plusieurs lignes, déformant la barre.
- **impact**: Header mobile plus compact et stable (plus de bloc téléphone en 2-3 lignes).
- **verify**: `npm run build` OK.

---

## 2026-04-05T01:10:00Z | type: ui | Cursor — Gate voyageur : suppression du `?pour=locataire` au clic

- **agent**: `cursor`
- **summary**: `HomeAudienceGate.chooseVoyageur` n’appelle plus `router.replace('/?pour=locataire')`; le choix voyageur persiste en storage puis ferme simplement le gate.
- **files**: [`components/home/HomeAudienceGate.tsx`, `docs/ACTIONS_LOG.md`, `docs/logs/2026-04-05.md`]
- **why**: Le passage par query déclenchait la logique `HomeAudienceScroll` (replace + scroll de section) et introduisait un comportement de scroll instable côté index.
- **impact**: Parcours voyageur aligné au ressenti du parcours propriétaire (pas de scroll forcé, fermeture propre du gate).
- **verify**: `PLAYWRIGHT_BROWSERS_PATH=0 node <voyageur click check>` OK (`url: '/'`, `overflow: 'visible'`, gate démonté) ; `npm run build` OK ; `npx tsc --noEmit` OK.

---

## 2026-04-05T00:55:00Z | type: ui | Cursor — Fix « Je réserve un séjour » (gate restait monté, scroll lock bloqué)

- **agent**: `cursor`
- **summary**: `HomeAudienceGate` : le guard `mounted` est réinitialisé au montage d’effet (`mounted.current = true`) pour éviter un état `false` persistant ; la fermeture `startExit` après clic voyageur (`Je réserve un séjour`) s’applique à nouveau correctement à chaque cycle.
- **files**: [`components/home/HomeAudienceGate.tsx`, `docs/ACTIONS_LOG.md`, `docs/logs/2026-04-05.md`]
- **why**: Après plusieurs cycles, l’overlay restait en `opacity-0` (toujours monté) avec `body overflow: hidden` ; l’utilisateur devait refresh. Cause: garde `mounted` non réarmé dans certains cycles dev/navigation.
- **impact**: Parcours voyageur répétable sans blocage ni refresh.
- **verify**: `PLAYWRIGHT_BROWSERS_PATH=0 node <repro voyageur x6>` OK (`overlay:null`, `overflow:visible`) ; `npm run build` OK.

---

## 2026-04-05T00:35:00Z | type: ui | Cursor — Gate audience : overlay non-bloquant + ouverture sans dépendance RAF

- **agent**: `cursor`
- **summary**: `HomeAudienceGate` : overlay masqué en `pointer-events-none` (évite interception des clics quand `opacity-0`) ; ouverture du gate rendue déterministe via `setEntered(show)` dans `useLayoutEffect` et `pageshow` (plus de dépendance à `requestAnimationFrame`).
- **files**: [`components/home/HomeAudienceGate.tsx`, `docs/ACTIONS_LOG.md`, `docs/logs/2026-04-05.md`]
- **why**: En repro multi-cycles, le gate pouvait rester monté mais invisible et capter les interactions ; dans certains timings le RAF ne rejouait pas l’entrée du gate, donnant l’impression d’un état bloqué sans F5.
- **impact**: « Changer de parcours » répétable sans blocage d’UI (menu/nav/footer) et réouverture plus fiable.
- **verify**: `PLAYWRIGHT_BROWSERS_PATH=0 node <repro script>` (cycles navbar + footer) ; `npx tsc --noEmit` OK ; `npm run build` OK.

---

## 2026-03-31T22:30:00Z | type: ui | Cursor — Gate audience : remontage par clé + suppression effet `gateReopenSignal`

- **agent**: `cursor`
- **summary**: **`HomeAudienceGateLoader`** (`key={gateReopenSignal}`) ; **`HomeAudienceGate`** : retrait **`useHomeAudience`**, ref **`lastHandledReopenGen`** et **`useEffect`** de réouverture (redondants avec le remontage) ; **`replaceHomeAndRequestGateReopen`** : **`router.refresh()`** si déjà sur **`/`** sans query.
- **files**: [`components/home/HomeAudienceGate.tsx`, `components/home/HomeAudienceGateLoader.tsx`, `app/page.tsx`, `lib/homeAudienceNavigation.ts`, `docs/ACTIONS_LOG.md`, `docs/logs/2026-03-31.md`]
- **why**: **`router.replace("/")`** no-op sur `/` + doubles cycles ; le remontage réexécute **`readGateInitialShow()`** dans **`useLayoutEffect`** à chaque instance.
- **impact**: « Changer de parcours » répété sans dépendre d’un effet fragile ni F5.
- **verify**: `npx tsc --noEmit` OK ; `npm run build` OK.

---

## 2026-04-05T14:00:00Z | type: ui | Cursor — `gateReopenSignal` monotonique (suppression `consume` → 0)

- **agent**: `cursor`
- **summary**: Suppression **`consumeGateReopenSignal`** ; **`gateReopenSignal`** n’est plus remis à **0** ; **`HomeAudienceGate`** : ref **`lastHandledReopenGen`** pour traiter chaque incrément une seule fois (bug 2ᵉ / 3ᵉ « Changer de parcours » sans gate).
- **files**: [`contexts/HomeAudienceContext.tsx`, `components/home/HomeAudienceGate.tsx`, `docs/ACTIONS_LOG.md`, `docs/logs/2026-04-05.md`, `docs/superpowers/prompts/claude-code-fix-changer-parcours-refresh.md`]
- **why**: `setState(0)` + doubles **`requestGateReopen`** pouvaient faire **perdre** un nouveau tick ou réappliquer un état incohérent après plusieurs cycles.
- **impact**: Réouvertures répétées du gate fiables.
- **verify**: `npx tsc --noEmit` OK.

---

## 2026-04-05T12:00:00Z | type: ui | Cursor — « Changer de parcours » répété : anti-race `?pour=` + rAF après tout `replace`

- **agent**: `cursor`
- **summary**: **`hydrateAudienceFromUrlIfNeeded`** ignore l’hydratation si **`dn_gate_reopen_pending`** ; **`replaceHomeAndRequestGateReopen`** : **`requestAnimationFrame(requestGateReopen)`** après **chaque** **`router.replace("/")`** (y compris `/?pour=…` → `/`) ; effet gate : si storage audience + pending réouverture → **purge** du storage puis ouverture.
- **files**: [`contexts/HomeAudienceContext.tsx`, `lib/homeAudienceNavigation.ts`, `components/home/HomeAudienceGate.tsx`, `docs/ACTIONS_LOG.md`, `docs/logs/2026-04-05.md`]
- **why**: `?pour=` pouvait re-remplir **`dn_home_audience`** entre **`clearAudience`** et l’effet → early return sans gate ; le 2ᵉ bump manquait quand **`isHome && hasParams`**.
- **impact**: Gate visible en boucle sans F5.
- **verify**: `npx tsc --noEmit` OK.

---

## 2026-03-31T21:15:00Z | type: ui | Cursor — Audit gate audience : scroll lock global + BFCache + nav

- **agent**: `cursor`
- **summary**: **`lib/bodyScrollLock`** (compteur) ; **`SiteFrame`** : `resetBodyScrollLock` sur `pathname` (`useLayoutEffect`) + **`pageshow` persisted** ; **`HomeAudienceGate`** / **Navbar** : `acquireBodyScrollLock` ; **`readGateInitialShow`** + resync BFCache ; **`replaceHomeAndRequestGateReopen`** (Navbar/Footer). Doc **`docs/audits/home-audience-gate.md`**.
- **files**: [`lib/bodyScrollLock.ts`, `lib/homeAudienceNavigation.ts`, `components/layout/SiteFrame.tsx`, `components/home/HomeAudienceGate.tsx`, `components/layout/Navbar.tsx`, `components/layout/Footer.tsx`, `contexts/HomeAudienceContext.tsx` (commentaire), `docs/audits/home-audience-gate.md`, `docs/superpowers/prompts/claude-code-opera-home-gate-bug.md`]
- **why**: Courses **`body.overflow`** gate vs menu ; cleanups manquants ; état gate après BFCache ; séquence « Changer de parcours » dupliquée.
- **impact**: Navigation vers `/` fiable (scroll utilisable) ; cohérence multi-navigateurs.
- **verify**: `npx tsc --noEmit`, `npm run build` OK.

---

## 2026-03-31T20:30:00Z | type: ui | Cursor — Opera : « Changer de parcours » sans F5 (`requestGateReopen` + rAF)

- **agent**: `cursor`
- **summary**: Suppression du pipeline **`CustomEvent`** / **`scheduleHomeAudienceGateReopen`** ; **`requestGateReopen()`** incrémente **`gateReopenSignal`** dans le provider ; **Navbar / Footer** appellent **`requestGateReopen()`** puis **`requestAnimationFrame(() => requestGateReopen())`** après **`router.replace("/")`** (2ᵉ signal si **`pathname`** n’est pas encore `/`).
- **files**: [`contexts/HomeAudienceContext.tsx`, `components/layout/Navbar.tsx`, `components/layout/Footer.tsx`, `docs/ACTIONS_LOG.md`]
- **why**: Opera ordonne différemment microtasks / navigation ; le chemin direct + bump après paint évite de devoir rafraîchir.
- **impact**: Même comportement qu’en Chrome sur « Changer de parcours ».
- **verify**: `npx tsc --noEmit` OK.

---

## 2026-03-31T19:00:00Z | type: ui | Cursor — Gate réouverture : `gateReopenSignal` dans le provider (fix refresh obligatoire)

- **agent**: `cursor`
- **summary**: **`gateReopenSignal` / `consumeGateReopenSignal`** ; provider écoute **`HOME_AUDIENCE_GATE_REOPEN_EVENT`** avec coalesce ; gate : effet **`[gateReopenSignal, pathname]`** ; **`scheduleHomeAudienceGateReopen`** allégé (sync + microtask + 80 ms).
- **files**: [`contexts/HomeAudienceContext.tsx`, `components/home/HomeAudienceGate.tsx`, `docs/ACTIONS_LOG.md`]
- **why**: Événements window sans listener si gate démonté ; `pathname` pas `/` au tick sync ; boucles si plusieurs bumps après consume.
- **impact**: « Changer de parcours » sans F5.
- **verify**: tsc OK.

---

## 2026-03-31T17:00:00Z | type: ui | Cursor — « Changer de parcours » réouvre le gate sur `/`

- **agent**: `cursor`
- **summary**: **`HOME_AUDIENCE_GATE_REOPEN_EVENT`** + **`requestHomeAudienceGateReopen()`** ; **`HomeAudienceGate`** écoute et réaffiche le dialog si storage vide ; **Navbar / Footer** après **`clearAudience` + `replace("/")`** appellent **`setTimeout(..., 0)`** pour laisser monter le gate depuis une autre route.
- **files**: [`contexts/HomeAudienceContext.tsx`, `components/home/HomeAudienceGate.tsx`, `components/layout/Navbar.tsx`, `components/layout/Footer.tsx`, `docs/ACTIONS_LOG.md`]
- **why**: Même URL `/` sans remount → état local `decision` restait à `false`.
- **impact**: Retour explicite au choix voyageur / propriétaire.
- **verify**: tsc OK.

---

## 2026-03-31T18:00:00Z | type: ui | Cursor — Gate réouverture fiable (flag + relances + skip hydrate)

- **agent**: `cursor`
- **summary**: **`scheduleHomeAudienceGateReopen()`** remplace **`request`** : **`dn_gate_reopen_pending`** en sessionStorage, **plusieurs `dispatch`** (0 / 50 / 120 / 300 ms). **`HomeAudienceGate`** : `useLayoutEffect` avec `wantReopen` → **pas** d’**`hydrateAudienceFromUrlIfNeeded`** si réouverture (évite `?pour=` qui re-remplit le storage) ; **`tryOpenGateFromReopenRequest`** ; **`usePathname`** pour consommer le flag quand la route devient **`/`** (gate monté après navigation). **Navbar / Footer** : **`scheduleHomeAudienceGateReopen()`** après **`replace("/")`**.
- **files**: [`contexts/HomeAudienceContext.tsx`, `components/home/HomeAudienceGate.tsx`, `components/layout/Navbar.tsx`, `components/layout/Footer.tsx`, `docs/ACTIONS_LOG.md`]
- **why**: Événement seul ou `setTimeout(0)` perdus si le gate n’est pas monté ; course avec hydrate URL.
- **impact**: Réouverture du gate cohérente depuis toute page et depuis `/` avec ancienne query.
- **verify**: tsc OK.

---

## 2026-03-31T16:00:00Z | type: ui | Cursor — Audience : hydratation `/?pour=` → sessionStorage (cohérence gate / home)

- **agent**: `cursor`
- **summary**: **`hydrateAudienceFromUrlIfNeeded()`** — sur `/` uniquement, si pas de valeur en storage, map **`pour=locataire|locataires` → voyageur**, **`pour=proprietaire|proprietaires` → propriétaire** ; évite gate masqué par `hasPour` avec contexte encore `null` (nav neutre, mauvaise section featured, scroll vers `#offre-proprietaire` absent). **`useLayoutEffect`** dans le provider pour sync état avant paint ; gate appelle la même hydratation avant la règle d’affichage.
- **files**: [`contexts/HomeAudienceContext.tsx`, `components/home/HomeAudienceGate.tsx`, `docs/ACTIONS_LOG.md`]
- **why**: Double source de vérité URL vs storage sans pont.
- **impact**: Deep links et partages `?pour=` alignés avec nav, blocs home et scroll.
- **verify**: lint OK.

---

## 2026-03-31T14:00:00Z | type: ui | Cursor — Changer de parcours dans le menu + `replace("/")`

- **agent**: `cursor`
- **summary**: Bouton **Changer de parcours** dans le **tiroir nav** (`clearAudience` + fermeture menu + `router.replace("/")`) quand audience voyageur ou propriétaire ; footer aligné sur **`replace`** au lieu de **`push`** pour `/` sans query (`pour=locataire`) et moins d’empilement historique.
- **files**: [`components/layout/Navbar.tsx`, `components/layout/Footer.tsx`, `docs/ACTIONS_LOG.md`]
- **why**: Accès au gate depuis le menu ; cohérence avec le footer.
- **impact**: Réaffichage du gate sur l’accueil après reset + navigation propre.
- **verify**: lint OK.

---

## 2026-03-31T12:00:00Z | type: ui | Cursor — Navbar moins imposante (logo + padding)

- **agent**: `cursor`
- **summary**: Taille **`BrandLogo` `nav`** réduite (≈40–56px au lieu de 56–112px) ; **`sizes`** image alignés ; grille header **`min-h-10`** ; **`headerSurfaceClass`** avec **padding vertical** un peu resserré (barre moins haute).
- **files**: [`components/layout/BrandLogo.tsx`, `components/layout/Navbar.tsx`, `docs/ACTIONS_LOG.md`]
- **why**: Feedback — barre trop dominante, surtout à cause du pictogramme trop grand.
- **impact**: Header plus discret, hiérarchie plus équilibrée avec le contenu.
- **verify**: lint OK.

---

## 2026-04-01T00:35:00Z | type: ui | Cursor — Navbar illisible sur heroes sombres (contact, villas…) + z-index

- **agent**: `cursor`
- **summary**: **`isDarkHeroRoute`** étendu à **`/contact`**, **`/villas`**, **`/soumettre-ma-villa`**, **`/prestations`**, **`/qui-sommes-nous`** (et sous-chemins villas/prestations) — même chrome **texte blanc / logo clair** qu’à l’accueil sur hero sombre ; évite **navy sur fond sombre** à travers le vitrage. **Header `z-[100]`** ; overlay menu **`z-[112]`**, tiroir **`z-[115]`** ; **`HomeAudienceGate` `z-[110]`** pour rester au-dessus de la barre.
- **files**: [`components/layout/Navbar.tsx`, `components/home/HomeAudienceGate.tsx`, `docs/ACTIONS_LOG.md`]
- **why**: Bug — barre « invisible » : encre navy (#0A0A0A) confondue avec hero **bg-navy** derrière le blur.
- **impact**: Nav lisible sur toutes les landing à bandeau sombre ; gate accueil toujours au-dessus de la nav.
- **verify**: lint OK.

---

## 2026-04-01T00:25:00Z | type: ui | Cursor — Navbar : header invisible en haut des pages claires (fix vitrage)

- **agent**: `cursor`
- **summary**: Sur routes **sans** hero sombre, en `scrollY ≤ 24` la barre n’était plus **`bg-transparent` seule** (texte navy peu visible / ressenti « pas de header ») : **`headerSurfaceClass`** avec **`bg-white/92 backdrop-blur-md`** + bord léger ; hero sombre (`/`, `/proprietaires`, `/book`) conserve **transparence** jusqu’au scroll.
- **files**: [`components/layout/Navbar.tsx`, `docs/ACTIONS_LOG.md`]
- **why**: Bug rapporté — header visible seulement après scroll sur les autres pages.
- **impact**: Nav toujours lisible en haut de page sur fond clair ; effet « glass » cohérent avec le passage barre pleine au scroll.
- **verify**: lint OK.

---

## 2026-04-01T00:10:00Z | type: ui | Cursor — Navbar : barre transparente → blanche au scroll sur tout le site

- **agent**: `cursor`
- **summary**: Suppression du cas **`pathname === "/"`** seul pour la transparence : **`isSolid = scrollY > 24`** partout (hors `/dashboard`, `/login`). **`isDarkHeroRoute`** (`/`, `/proprietaires`, `/book`) : texte / logo **clair** tant que la barre est transparente ; **autres pages** : chrome **navy** en haut de page pour lisibilité sur fond clair. **CTA** primaire : style blanc sur hero noir, style navy sur fond clair. Resync scroll au **`pathname`**. **`logoVariant`** dérivé de `isDarkHeroRoute` + scroll.
- **files**: [`components/layout/Navbar.tsx`, `docs/ACTIONS_LOG.md`, `docs/logs/2026-03-31.md`]
- **why**: Même comportement qu’à l’accueil (effet scroll) sur toutes les pages marketing.
- **impact**: Nav cohérente ; pas de texte blanc illisible sur pages claires.
- **verify**: relecture logique + lint fichier.

---

## 2026-03-31T23:55:00Z | type: ui | Cursor — Hero wordmark + baseline partagés ; `/proprietaires` aligné accueil

- **agent**: `cursor`
- **summary**: **`HeroWordmarkBaseline`** (`components/marketing/HeroWordmarkBaseline.tsx`) — mot **DIAMANT NOIR** + *Confiance · Réactivité · Excellence* ; **`app/page.tsx`** refactor pour l’utiliser. **`app/proprietaires/page.tsx`** : même hero (remplace pictogramme, filet or, paragraphe) ; **CTAs** Soumettre / Espace propriétaire conservés sous la baseline via `children`.
- **files**: [`components/marketing/HeroWordmarkBaseline.tsx`, `app/page.tsx`, `app/proprietaires/page.tsx`, `docs/ACTIONS_LOG.md`, `docs/logs/2026-03-31.md`]
- **why**: Cohérence visuelle accueil ↔ landing propriétaires.
- **impact**: Première lecture identique ; conversion proprio inchangée sous le hero.
- **verify**: compilation OK ; `next build` échoue ailleurs sur routes API manquantes (projet).

---

## 2026-03-31T23:45:00Z | type: ui | Cursor — Hero : échange header/logo + baseline Confiance / Réactivité / Excellence

- **agent**: `cursor`
- **summary**: **Navbar** : pictogramme seul (`showIcon`, `showWordmark={false}`) au centre. **Accueil hero** : mot **DIAMANT NOIR** (wordmark `BrandLogo`, taille fluide) + seul sous-texte visible *Confiance · Réactivité · Excellence* (tracking, filet discret). Suppression **`HomeHeroAudience`** du hero (CTA audience déjà couverts par sections suivantes + `HomeBottomCta`).
- **files**: [`components/layout/Navbar.tsx`, `app/page.tsx`, `components/home/HomeHeroAudience.tsx` (supprimé), `docs/ACTIONS_LOG.md`, `docs/logs/2026-03-31.md`]
- **why**: Demande design — inverser logo header / titre hero et alléger le hero à une baseline élégante.
- **impact**: Première lecture plus premium et moins chargée ; parcours proprio/voyageur passe par le contenu sous le hero.
- **verify**: `npm run build` OK.

---

## 2026-03-31T22:30:00Z | type: ui | Cursor — Home & book orientés audience (proprio / locataire)

- **agent**: `cursor`
- **summary**: **`HomeHeroAudience`**, **`HomeTrustBand`**, **`HomeFeaturedAudience`** (section proprio `#offre-proprietaire` vs grille villas `#locataire`), **`HomeLifestyleAudience`** ; **`HomeAudienceScroll`** : `?pour=proprietaire` → `/` + scroll `#offre-proprietaire` (plus de redirect `/proprietaires`). **`Navbar`** : ordre + libellé **Locations** pour proprio ; **`login`** → `/login?redirect=/dashboard/proprio` si audience proprio. **`Footer`** : colonne explore + baseline adaptées proprio. **`BookLandingMarketing`** : variante marketing `/book` propriétaire vs voyageur. **`HomeBottomCta`** : libellé secondaire catalogue.
- **files**: [`app/page.tsx`, `components/home/HomeHeroAudience.tsx`, `components/home/HomeTrustBand.tsx`, `components/home/HomeFeaturedAudience.tsx`, `components/home/HomeLifestyleAudience.tsx`, `components/home/HomeAudienceScroll.tsx`, `components/home/HomeBottomCta.tsx`, `components/book/BookLandingMarketing.tsx`, `app/book/page.tsx`, `components/layout/Navbar.tsx`, `components/layout/Footer.tsx`, `docs/ACTIONS_LOG.md`, `docs/logs/2026-03-31.md`]
- **why**: Demande — l’accueil et les pages marketing doivent être réellement tournés propriétaire vs locataire (pas seulement navbar/footer).
- **impact**: Parcours propriétaire : hero, bandeau confiance, section centrale et lifestyle dédiés ; `/book` ne force plus le copy « réserver un séjour » pour les proprios.
- **verify**: `npm run build` OK.

---

## 2026-03-31T20:15:00Z | type: ui | Cursor — Parcours site selon gate (audience locataire / propriétaire)

- **agent**: `cursor`
- **summary**: **`HomeAudienceContext`** + **`SiteFrame`** (`HomeAudienceProvider` autour de Navbar / children / Footer) ; lecture **`sessionStorage`** `dn_home_audience` + événement **`dn-home-audience`** après choix gate (`HomeAudienceGate`). **`Navbar`** : masquer **Propriétaires** si `voyageur` ; CTA principal **Confier ma villa** → `/proprietaires` si `proprietaire` + lien secondaire **Voir les villas** dans le tiroir. **`Footer`** : masquer **Soumettre ma villa** si `voyageur` ; bouton **Changer de parcours** (clear + `/`). **`HomeBottomCta`** (client) : variantes voyageur / propriétaire / neutre. **`/login`** : liens croisés masqués selon audience + flow.
- **files**: [`contexts/HomeAudienceContext.tsx`, `components/layout/SiteFrame.tsx`, `app/layout.tsx`, `components/layout/Navbar.tsx`, `components/layout/Footer.tsx`, `components/home/HomeBottomCta.tsx`, `components/home/HomeAudienceGate.tsx`, `app/page.tsx`, `app/login/page.tsx`, `tests/login/redesign.spec.ts`, `docs/ACTIONS_LOG.md`, `docs/logs/2026-03-31.md`]
- **why**: Demande produit — après le gate, parcours unique (location vs confier) sans bloquer les URLs directes.
- **impact**: Navigation et CTA alignés sur le choix gate ; possibilité de réinitialiser le choix.
- **verify**: `npm run build` OK ; Playwright login specs mis à jour + cas audience.

---

## 2026-03-31T18:30:00Z | type: ui | Cursor — Espace client plans 1–3 (layout shell, hero, chat)

- **agent**: `cursor`
- **summary**: Restauration alignée sur les plans Superpowers : **`app/espace-client/layout.tsx`** — auth obligatoire (redirect `/login?redirect=`), **`EspaceClientShell`** + **`EspaceClientProviders`**, contenu paddé ; **`PageTopbar`** visible mobile ; **`page.tsx`** — hero séjour **blanc** (bordure or), suppression garde « connexion » dupliquée ; **`TenantChatbot`** v2 (design clair, `role="log"`, points `dn-typing-dot`, persistance `chat_messages`, session `localStorage`) ; **`messagerie/page.tsx`** — `dynamic()` lazy, **`PageTopbar`**, bandeau villa/dates, retrait badge « En ligne ». Migration SQL **`checklist_state`** + **`chat_messages`** + RLS.
- **files**: [`app/espace-client/layout.tsx`, `app/espace-client/page.tsx`, `app/espace-client/messagerie/page.tsx`, `components/espace-client/TenantChatbot.tsx`, `components/espace-client/PageTopbar.tsx`, `supabase/migrations/20260403120000_espace_client_chat_checklist.sql`, `docs/ACTIONS_LOG.md`, `docs/logs/2026-03-31.md`]
- **why**: Annulation utilisateur ayant retiré l’implémentation ; réalignement specs plans 1–3.
- **impact**: Parcours locataire cohérent (shell sidebar/blanc) ; messagerie allégée ; chat persisté après migration Supabase.
- **verify**: `npm run build` OK.

---

## 2026-04-04T06:00:00Z | type: ui | Cursor — Catalogue unique `/villas` ; `/book` sans liste dupliquée

- **agent**: `cursor`
- **summary**: **Suppression de la redondance** entre liste catalogue et page réservation : **`/villas`** = seul catalogue (carte + liste) avec bannière optionnelle si **`?checkin=&checkout=&guests=`** ; **`/book`** sans `SearchResults` — page d’orientation + rappel tunnel (checkout inchangé si **`villaId`+dates**). **Navigation** : Navbar / accueil / `HomeAudienceScroll` / `HeroSearchWidget` / `BookingSearchBar` → **`/villas`** (dates en query). **Stripe** `cancel_url` → **`/villas`**. Fiche villa : barre mobile **Réserver** → **`#reserver-sejour`** (calendrier). Composants **`SearchResults`** / **`VillaSelectionCard`** toujours dans le repo (réutilisables), plus montés sur `/book`.
- **files**: [`app/book/page.tsx`, `app/villas/page.tsx`, `app/villas/[id]/page.tsx`, `components/booking/BookingSearchBar.tsx`, `components/HeroSearchWidget.tsx`, `components/layout/Navbar.tsx`, `app/page.tsx`, `components/home/HomeAudienceScroll.tsx`, `components/booking/CheckoutView.tsx`, `app/success/page.tsx`, `app/api/booking/route.ts`, `docs/ACTIONS_LOG.md`]
- **why**: Éviter deux listes de villas quasi identiques (UX / maintenance).
- **impact**: Un seul parcours « choisir une villa » ; `/book` sert au tunnel explicatif + paiement Stripe.
- **verify**: `npm run build` OK.

---

## 2026-04-04T05:15:00Z | type: docs | Journal — travail Claude Code (terminal) consigné

- **agent**: `claude` (session **Claude Code** CLI)
- **summary**: Traçabilité dans `docs/logs/2026-04-04.md` : workflow n8n importable **Diamant Noir — Chatbot Concierge V1** (`docs/n8n/diamant-noir-chatbot-v1.json`) — webhook, contexte villas, agent OpenAI, parsing JSON, branches IF, Supabase (`continueOnFail`), notification équipe ; guide **`docs/n8n/SETUP.md`** (import, credentials, SQL `chatbot_leads` / `pre_bookings`, curl, prod) ; installation plugin officiel **frontend-design** (Anthropic) dans le cache `~/.claude/plugins/...` ; mémoire session : variable **`N8N_WEBHOOK_URL`**, intégration avec l’API **`/api/chat`** existante.
- **files**: [`docs/n8n/diamant-noir-chatbot-v1.json`, `docs/n8n/SETUP.md`, `docs/ACTIONS_LOG.md`, `docs/logs/2026-04-04.md`]
- **why**: Demande utilisateur de documenter dans les logs ce que Claude Code a réalisé (audit / reprise d’équipe).
- **impact**: Historique lisible côté projet ; pas de changement runtime applicatif.
- **verify**: Fichiers relus.

---

## 2026-03-31T12:00:00Z | type: ui | Cursor — Login vidéo webm ; hero sans double CTA ; gate blanc plein écran

- **agent**: `cursor`
- **summary**: **`/login`** : source vidéo alignée sur **`/public/login-side.webm`** (fichier réel ; l’ancienne ref `.mp4` ne chargeait rien). **Hero** : suppression des deux blocs Voyageurs/Propriétaires (`HomeHeroPrimaryActions` supprimé) ; un seul lien « Réserver un séjour » → **`/book`**. **`HomeAudienceGate`** : fond **`bg-white`** plein écran, **`z-[100]`** au-dessus de la navbar, **`overflow: hidden`** sur le body tant que le gate est visible ; cartes et typo en thème clair (navy / or).
- **files**: [`app/login/page.tsx`, `app/page.tsx`, `components/home/HomeAudienceGate.tsx`, `components/home/HomeHeroPrimaryActions.tsx` (supprimé), `docs/ACTIONS_LOG.md`]
- **why**: Undo utilisateur + demande : vidéo login visible, pas de double choix dans le hero, gate masque tout le site avec rendu blanc premium.
- **impact**: Login : vidéo de nouveau visible. Accueil : hero simplifié ; gate couvre entièrement l’UI au premier chargement.
- **verify**: `npm run build` OK.

---

## 2026-04-05T14:00:00Z | type: ui | Cursor — Accueil sans barre recherche hero ; landing proprio progressive disclosure

- **agent**: `cursor`
- **summary**: **`HomeHeroPrimaryActions`** : plus de `BookingSearchBar` ; « Réserver un séjour » → **`/book`** en `Link`. **`HomeAudienceScroll`** : `?pour=sejour|voyageur` → `router.replace('/book')`. **`HomeAudienceGate`** : choix voyageur → `router.push('/book')` (plus d’événement reveal). **`/proprietaires`** : piliers avec texte court + `<details>` « En savoir plus » ; commission 20 % avec **`EditorialFigureBand`** `detailsCaption` ; 4 inclusions visibles + `<details>` liste complète + paragraphe première location ; données **`WHY_PILLARS`**, **`INCLUSIONS_*`**, **`PREMIERE_LOCATION_SUPPLEMENT`** dans `lib/proprietaires-data.ts`. **`EditorialFigureBand`** : props optionnelles `detailsCaption` / `detailsSummaryLabel` (rétrocompat prestations).
- **files**: [`components/home/HomeHeroPrimaryActions.tsx`, `components/home/HomeAudienceScroll.tsx`, `components/home/HomeAudienceGate.tsx`, `app/proprietaires/page.tsx`, `lib/proprietaires-data.ts`, `components/marketing/editorial-blocks.tsx`, `docs/ACTIONS_LOG.md`, `docs/logs/2026-04-05.md`]
- **why**: Plan « moins d’info proprio + hero voyageur sans recherche ».
- **impact**: Hero plus léger ; landing proprio moins dense au premier scroll ; contenu légal conservé dans les replis.
- **verify**: `npm run build` OK.

---

## 2026-04-04T15:00:00Z | type: docs | Cursor — Prompt Claude Code : gate audience accueil + UI Pro Max

- **agent**: `cursor`
- **summary**: Nouveau fichier `docs/superpowers/prompts/claude-code-home-audience-gate.md` — prompt prêt à coller pour implémenter l’option B (choix voyageur / propriétaire à l’ouverture de `/`), animations luxe discret, invocation obligatoire du skill **ui-ux-pro-max**, intégration `HomeHeroPrimaryActions` / `HomeAudienceScroll`, stockage localStorage ou sessionStorage, motion CSS/Tailwind sans framer par défaut.
- **files**: [`docs/superpowers/prompts/claude-code-home-audience-gate.md`, `docs/ACTIONS_LOG.md`]
- **why**: Demande utilisateur : bon prompt pour Claude Code et références design Pro Max.
- **impact**: Réutilisable pour une session Claude Code / Superpowers sans repartir de zéro.
- **verify**: Fichier relu ; pas d’impact build.

---

## 2026-04-04T12:00:00Z | type: ui | Cursor — Navbar : logo centré écran (plus de hamburger sur le « D »)

- **agent**: `cursor`
- **summary**: Grille `auto – 1fr – auto` : colonne droite plus large que la gauche, le bloc « centre » était décalé ; le wordmark se retrouvait sous l’icône menu (traits blancs sur le D). Passage à `minmax(0,1fr) auto minmax(0,1fr)` + lien logo `pointer-events-auto` dans un wrapper `pointer-events-none` ; bouton menu sans classe `.tap-target` globale (conflit `inline-flex`/largeur) ; `whitespace-nowrap` + `max-w` sur le logo.
- **files**: [`components/layout/Navbar.tsx`, `docs/ACTIONS_LOG.md`]
- **why**: Capture utilisateur : header visuellement « cassé », logo téléphone/icônes tassés.
- **impact**: Logo réellement centré ; Menu et actions restent aux bandeaux gauche/droite équilibrés.
- **verify**: `npm run build` OK.

---

## 2026-04-03T23:10:00Z | type: config | Cursor — Dépendance manquante `recharts` (build Vercel)

- **agent**: `cursor`
- **summary**: Imports `recharts` dans `app/dashboard/proprio/[villaId]/page.tsx` et `components/dashboard/assistant-views/StatsView.tsx` sans entrée `package.json` → module not found en CI. Ajout `recharts@^3.8.1` (peer React 19 OK).
- **files**: [`package.json`, `package-lock.json`, `docs/ACTIONS_LOG.md`]
- **why**: Aligner dépendances avec le code dashboard.
- **impact**: Graphiques villa + assistant compilent sur Vercel.
- **verify**: `npm run build` OK.

---

## 2026-04-03T23:05:00Z | type: config | Cursor — Dépendances manquantes `@dnd-kit/*` (build Vercel)

- **agent**: `cursor`
- **summary**: `SortableImage` + `app/dashboard/proprio/[villaId]/page.tsx` importent `@dnd-kit/core`, `sortable`, `utilities` sans les déclarer dans `package.json` → échec `next build` sur Vercel. Ajout `@dnd-kit/core@^6.3.1`, `@dnd-kit/sortable@^10.0.0`, `@dnd-kit/utilities@^3.2.2` ; `npm install` met à jour le lockfile.
- **files**: [`package.json`, `package-lock.json`, `docs/ACTIONS_LOG.md`]
- **why**: Module not found en CI.
- **impact**: Build dashboard proprio (réordonnancement galerie) résout les packages.
- **verify**: `npm run build` OK.

---

## 2026-04-03T22:55:00Z | type: config | Cursor — Vercel : `npm install` + HeroUI / Tailwind peers

- **agent**: `cursor`
- **summary**: Échec CI Vercel — `@heroui/react@3` peer `tailwindcss@>=4` vs projet en Tailwind 3. Ajout `.npmrc` avec `legacy-peer-deps=true` (aligné sur l’install locale documentée). Régénération `package-lock.json` après install propre.
- **files**: [`.npmrc`, `package-lock.json`, `docs/ACTIONS_LOG.md`]
- **why**: `npm install` sur Vercel sans legacy échoue sur les peer dependencies.
- **impact**: Install + build Vercel reprennent ; comportement runtime inchangé (styles HeroUI via `public/heroui-v3.min.css`).
- **verify**: `rm -rf node_modules package-lock.json && npm install && npm run build` OK en local.

---

## 2026-03-31T18:45:00Z | type: ui | Cursor — Navbar mobile : plus de chevauchement logo / actions

- **agent**: `cursor`
- **summary**: Colonne droite trop large sur <400px (tél. + favoris + compte + « Réserver ») — le wordmark manquait d’espace. Suppression du `pt` safe-area en double sur `<header>`, retrait du préfixe Tailwind invalide `xs:inline`, grille plus serrée (`px-2`, `gap-x-1.5`), logo un peu plus petit via clamp, icônes `h-9` sous 400px. Sous 400px : pas d’icône téléphone dans la barre (numéro dans le tiroir), CTA réservation en icône calendrier + `aria-label` ; à partir de 400px : libellé « Réserver » comme avant.
- **files**: [`components/layout/Navbar.tsx`, `docs/ACTIONS_LOG.md`, `docs/logs/2026-03-31.md`]
- **why**: Plainte utilisateur : header mobile toujours cassé (chevauchement).
- **impact**: Barre utilisable sur iPhone étroit ; appel et résa restent accessibles (menu / libellé selon breakpoint).
- **verify**: `npm run build` OK ; ESLint fichier Navbar OK.

---

## 2026-04-05T17:30:00Z | type: config | Cursor — Vercel : modules manquants `components/home`

- **agent**: `cursor`
- **summary**: Le `main` référencait `@/components/home/*` sans fichiers versionnés → échec build Vercel. Ajout commit `components/home/` (4 fichiers) + push ; restauration locale `.gitignore` depuis HEAD.
- **files**: [`components/home/HomeAudienceScroll.tsx`, `components/home/HomeHeroPrimaryActions.tsx`, `components/home/ProprietairesTransitionLink.tsx`, `components/home/use-view-transition-navigate.ts`, `.gitignore`, `docs/ACTIONS_LOG.md`]
- **why**: Module not found sur le déploiement.
- **impact**: Build Vercel peut repasser au vert sur le commit poussé.
- **verify**: `git push` OK.

---

## 2026-04-05T16:00:00Z | type: ui | Cursor — Accueil : transitions hero (résa + proprio)

- **agent**: `cursor`
- **summary**: Composant client `HomeHeroPrimaryActions` — sur mobile la barre de recherche est repliée jusqu’au clic « Réserver un séjour » (grid `0fr` → `1fr`, fade/slide, scroll smooth, hash `#reserver-un-sejour`) ; desktop inchangé visuellement (barre visible). « Confier ma villa » (hero + bas de page) : `ProprietairesTransitionLink` + `useViewTransitionNavigate` (`document.startViewTransition` si dispo, sinon `router.push` ; respect `prefers-reduced-motion`). `HomeAudienceScroll` : `?pour=sejour` met le hash, émet `diamant-reveal-booking`, puis scroll. CSS `::view-transition-old/new(root)` dans `globals.css`.
- **files**: [`app/page.tsx`, `app/globals.css`, `components/home/HomeHeroPrimaryActions.tsx`, `components/home/HomeAudienceScroll.tsx`, `components/home/ProprietairesTransitionLink.tsx`, `components/home/use-view-transition-navigate.ts`, `docs/ACTIONS_LOG.md`, `docs/logs/2026-04-05.md`]
- **why**: Demande animations à l’interaction et révélation de la recherche réservation.
- **impact**: Parcours voyageur plus guidé sur mobile ; navigation propriétaires plus fluide sur Chrome/Edge récents.
- **verify**: `npm run build` OK.

---

## 2026-04-05T14:15:00Z | type: config | Cursor — Build Next : cache `.next` incohérent

- **agent**: `cursor`
- **summary**: Échec `next build` (PageNotFoundError sur routes API existantes) résolu par `rm -rf .next` puis rebuild ; `npm run dev` relancé sur le port 3000.
- **files**: [`docs/ACTIONS_LOG.md`, `docs/logs/2026-04-05.md`]
- **why**: Artefacts `.next` désynchronisés ou build partiel dans un environnement restreint.
- **impact**: Build vert à nouveau ; en cas d’erreurs « Cannot find module for page » sur des fichiers présents, nettoyer `.next` puis reconstruire.
- **verify**: `npm run build` OK (50 routes) ; dev server démarre.

---

## 2026-04-05T12:00:00Z | type: ui | Cursor — `/proprietaires` : flux sous-hero épuré + médias centralisés

- **agent**: `cursor`
- **summary**: Fusion intro « Pourquoi » et 3 piliers dans un seul `EditorialImageSplit` ; inclusions en split sur fond `offwhite`, listes et pack allégés ; témoignage pleine largeur sur fond blanc voilé ; `PROPRIO_LANDING_IMAGES` / `PROPRIO_LANDING_IMAGE_ALTS` dans `lib/proprietaires-data.ts` (fallback `villa-hero` jusqu’à dépôt `public/proprietaires/*`) ; `EditorialImageSplit` : `sectionClassName`, `textColClassName`, `imageWrapperClassName`, typo/colonnes plus aérées.
- **files**: [`app/proprietaires/page.tsx`, `lib/proprietaires-data.ts`, `components/marketing/editorial-blocks.tsx`, `docs/ACTIONS_LOG.md`, `docs/logs/2026-04-04.md`]
- **why**: Disposition sous le hero jugée chargée ; besoin d’emplacements clairs pour futures images dédiées.
- **impact**: Parcours plus lisible, alternance blanc/offwhite maîtrisée ; remplacer les chemins média dans `proprietaires-data` quand les assets existent.
- **verify**: `read_lints` sur fichiers modifiés ; build local peut échouer si routes API manquantes (env).

---

## 2026-04-04T18:30:00Z | type: ui | Cursor — `/proprietaires` : enrichissement visuel sans nouveau copy

- **agent**: `cursor`
- **summary**: Hero : retrait de l’eyebrow « Programme propriétaires · Martinique » au profit d’une règle or ; deux `EditorialImageSplit` (pourquoi + inclusions/pack) avec cadrages `object-position` sur `/villa-hero.jpg` ; grille 3 piliers seule ; témoignage sur fond image léger + dégradé ; `EditorialImageSplit` accepte `eyebrow?` et `imageClassName?`.
- **files**: [`app/proprietaires/page.tsx`, `components/marketing/editorial-blocks.tsx`, `docs/ACTIONS_LOG.md`, `docs/logs/2026-04-04.md`]
- **why**: Landing propriétaires plus éditoriale / moins « brochure programme », sans texte additionnel.
- **impact**: Parcours visuel plus riche, même wording métier et metadata SEO inchangés.
- **verify**: `read_lints` (fichiers modifiés) ; `npm run build` OK.

---

## 2026-04-04T14:00:00Z | type: ui | Cursor — Accueil : retrait bloc « Programme propriétaires »

- **agent**: `cursor`
- **summary**: Suppression de la section `id="proprietaires"` (doublon avec `/proprietaires`), sous-titre hero recentré voyageurs ; entrées propriétaires conservées via carte hero + CTA bas + navbar.
- **files**: [`app/page.tsx`, `docs/ACTIONS_LOG.md`, `docs/logs/2026-04-04.md`]
- **why**: Demande client — index locataire sans le long bloc programme proprio désormais couvert par la landing dédiée.
- **impact**: Page d’accueil plus courte, message réservation/clé en main voyageurs en premier.
- **verify**: `read_lints` sur `app/page.tsx`.

---

## 2026-04-04T12:00:00Z | type: ui | Cursor — HomeAudienceScroll : `?pour=proprietaire` → `/proprietaires`

- **agent**: `cursor`
- **summary**: Alignement avec la landing dédiée : sur `/`, `pour=proprietaire|proprietaires` déclenche `router.replace('/proprietaires')` au lieu du scroll vers l’ancre `#proprietaires` ; parcours séjour inchangé (scroll `#reserver-un-sejour`).
- **files**: [`components/home/HomeAudienceScroll.tsx`, `docs/ACTIONS_LOG.md`, `docs/logs/2026-04-04.md`]
- **why**: Session Claude Code a livré `/proprietaires` + liens directs ; anciens bookmarks `/?pour=proprietaire` restaient sur la home.
- **impact**: Un seul parcours propriétaire « canon » vers la landing.
- **verify**: `read_lints` sur fichier modifié ; recette manuelle `/?pour=proprietaire`.

---

## 2026-04-04T11:55:00Z | type: ui | Claude Code (terminal) — Landing `/proprietaires` + data partagée + navigation + sitemap

- **agent**: `claude`
- **summary**: Page `app/proprietaires/page.tsx` (hero vidéo, sections marketing, CTA soumission / login proprio), extraction `lib/proprietaires-data.ts` (INCLUSIONS + témoignage), imports depuis `app/prestations/page.tsx`, liens home + navbar vers `/proprietaires`, `app/sitemap.ts` avec entrée `/proprietaires` et `NEXT_PUBLIC_BASE_URL`, correctifs build (imports login / `TenantMagicLinkFlow`, retrait prop `basePrice` sur `AvailabilityCalendar`). Refus des flags `ignoreBuildErrors` / `ignoreDuringBuilds` sur `next.config.mjs`.
- **files**: (voir `git log` diamant-noir : commits ~7347692, 0c610f3, 6cbf7dc, fix imports + villa detail)
- **why**: Spec `2026-04-03-proprietaires-landing-design.md` + plan Superpowers.
- **impact**: Parcours propriétaires dédié, SEO/sitemap, une seule source pour les inclusions prestations/landing.
- **verify**: `npm run build` OK (rapport terminal session Claude).

---

## 2026-04-03T23:45:00Z | type: docs | Cursor — Prompt Superpowers landing propriétaires

- **agent**: `cursor`
- **summary**: Ajout d’un prompt autonome pour Claude Code (workflow Superpowers) : page `/proprietaires`, CTA prioritaire vers `/soumettre-ma-villa`, MAJ liens « Confier ma villa », navbar, sitemap, SEO, règles UI/audit.
- **files**: [`docs/superpowers/prompts/claude-code-landing-proprietaires.md`, `docs/ACTIONS_LOG.md`]
- **why**: Demande utilisateur pour cibler les propriétaires au clic « Confier ma villa » sans dictée d’implémentation manuelle ligne à ligne.
- **impact**: Fichier prêt à coller dans Claude Code ; exécution du prompt = nouvelle route + redirections à faire par l’agent cible.
- **verify**: relecture du markdown ; pas de changement runtime tant que le prompt n’est pas exécuté.

---

## 2026-04-03T22:30:00Z | type: api+ui | Cursor — Restauration import annonces (listing-import + n8n/OpenAI)

- **agent**: `cursor`
- **summary**: Réintroduction du flux import multi-OTA : `lib/listing-import` (allowlist, garde-fous hostname, JSON-LD/OG/regex), `lib/listing-import-ai` (n8n puis OpenAI, unwrap réponse), `POST /api/import-airbnb` avec `{ url, useAi }`, dashboard propriétaire avec case IA et mapping étendu (lieu, prix, SdB, surface, horaires, coords, règles, équipements, images). Doc n8n + variables `LISTING_IMPORT_*` dans `.env.local.example`.
- **files**: [`lib/listing-import-types.ts`, `lib/listing-import.ts`, `lib/listing-import-ai.ts`, `app/api/import-airbnb/route.ts`, `app/dashboard/proprio/[villaId]/page.tsx`, `.env.local.example`, `docs/n8n/PROMPT_CLAUDE_CODE_LISTING_IMPORT_N8N.md`, `docs/ACTIONS_LOG.md`, `docs/logs/2026-04-03.md`]
- **why**: Audit des transcripts : le module avait été livré puis perdu (undo / non commit) ; alignement avec discussions import intelligent + enrichissement n8n.
- **impact**: Import au-delà d’Airbnb strict, champs formulaire mieux préremplis ; enrichissement IA optionnel comme avant.
- **verify**: `read_lints` OK sur fichiers modifiés ; `tsc --noEmit` échoue sur `SearchResults.tsx` (erreur pré-existante hors périmètre).

---

## 2026-04-03T20:15:00Z | type: ui | Cursor — Home : duo voyageurs / propriétaires (même index)

- **agent**: `cursor`
- **summary**: Hero avec deux chemins (« Réserver un séjour » / « Confier ma villa »), barre `BookingSearchBar` sous l’ancre `#reserver-un-sejour`, section `#proprietaires` (arguments + CTA soumission / espace proprio), défilement automatique via `?pour=proprietaire|sejour`, entrée menu « Propriétaires » vers `/?pour=proprietaire`, CTA bas de page dual + lien connexion proprio.
- **files**: [`app/page.tsx`, `components/home/HomeAudienceScroll.tsx`, `components/layout/Navbar.tsx`, `docs/ACTIONS_LOG.md`, `docs/logs/2026-04-03.md`]
- **why**: Retour client (visiteurs perdus) + demande de réappliquer les changements après undo ; une seule home avec différenciation par ancres / query.
- **impact**: Parcours clairs locataires vs propriétaires sans URL d’accueil séparée ; liens marketing `/?pour=proprietaire` possibles.
- **verify**: `read_lints` OK sur fichiers touchés ; `npm run build` échoue côté dépôt sur `@heroui/react` manquant (pré-existant hors périmètre).

---

## 2026-03-31T18:27:00Z | type: ui | Cursor — Villa detail: ajout bloc hôte + retrait Collection Signature + UI disponibilité
- **agent**: `cursor`
- **summary**: Ajout d’un bloc “Votre hôte” sur la fiche villa, suppression des libellés “Collection Signature/Iconic” dans la zone description/services, et amélioration visuelle de la section disponibilités (badges horaires, légende, navigation calendrier plus premium).
- **files**: [`app/villas/[id]/page.tsx`, `components/booking/AvailabilityCalendar.tsx`, `docs/ACTIONS_LOG.md`, `docs/logs/2026-03-31.md`]
- **why**: Demande utilisateur directe pour afficher clairement l’hôte, retirer la mention collection, et améliorer l’UI des dates de disponibilité.
- **impact**: Fiche villa plus claire et plus premium, meilleure lisibilité du calendrier et des informations d’arrivée/départ.
- **verify**: Validation lints sur fichiers modifiés.

---

## 2026-03-31T18:13:30Z | type: ui+sql+config | Cursor — Villas detail data-driven (comparatif LC → implémentation pilote)
- **agent**: `cursor`
- **summary**: Refonte data-driven de la page `villas/[id]` selon audit comparatif avec la référence (check-in/check-out dynamiques, équipements intérieur/extérieur, services maison + collection + à la carte, conditions de réservation FAQ, CTA contact, recommandations). Ajout d’une migration SQL pour nouveaux champs premium et branchement dashboard propriétaire pour édition complète de ces données.
- **files**: [`supabase/migrations/20260331_01_villa_detail_premium_fields.sql`, `app/dashboard/proprio/[villaId]/page.tsx`, `app/villas/[id]/page.tsx`, `components/BookingForm.tsx`, `docs/ACTIONS_LOG.md`, `docs/logs/2026-03-31.md`]
- **why**: Demande utilisateur explicite de comparatif complet avec la page de référence avant amélioration, en évitant les hardcodes et en conservant le travail déjà fait.
- **impact**: Les fiches villas peuvent désormais reproduire la richesse de structure attendue sans copier visuellement, avec données pilotées depuis le dashboard et fallbacks sûrs pour les villas incomplètes.
- **verify**: `rm -rf .next && npm run build` OK ; `npm run dev -- -p 3000` relancé et prêt.

---

## 2026-03-27T22:00:00Z | type: ui | Cursor — Espace client : feuille HeroUI v3 réintégrée

- **agent**: `cursor`
- **summary**: Réintroduction de `<link rel="stylesheet" href="/heroui-v3.min.css" />` dans `app/espace-client/layout.tsx`. Sans ce fichier, les composants `@heroui/react` (Card, Button, Chip, Spinner…) restent quasi non stylés sur une base Tailwind 3. Écran `checking` désormais sous `EspaceClientProviders` pour cohérence I18n + styles.
- **files**: [`app/espace-client/layout.tsx`]
- **why**: L’utilisateur ne voyait pas l’apparence HeroUI dans l’espace locataire (CSS absente après refacto).
- **impact**: Rendu visuel cohérent des widgets HeroUI sous `/espace-client`.
- **verify**: `npm run build` OK.
- **session**: `docs/logs/2026-03-27.md`

---

## 2026-03-31T20:10:00Z | type: ui | Cursor — TenantChatbot : onChange TextArea HeroUI

- **agent**: `cursor`
- **summary**: Suite session Claude Code interrompue au `npm run build` : le `TextArea` HeroUI attend un `ChangeEvent<HTMLTextAreaElement>`, pas une `string`. Correction `onChange` dans `TenantChatbot.tsx` (`e.target.value`). Build vert.
- **files**: [`components/espace-client/TenantChatbot.tsx`]
- **why**: Débloquer la compilation après refacto messagerie locataire (HeroUI).
- **impact**: Saisie chat SAV fonctionnelle à l’exécution.
- **verify**: `npm run build` OK.
- **session**: reprise terminal Claude Code (limite atteinte)

---

## 2026-03-31T16:55:00Z | type: ui | Cursor — Espace client : fin mode démo + HeroUI CSS dans head

- **agent**: `cursor`
- **summary**: Suppression du mode démo (`dn_demo_bypass`, fausses villas) sur `/espace-client` (dashboard, messagerie, profil, détail). Ajout de `app/espace-client/head.tsx` pour charger `public/heroui-v3.min.css` dans le `<head>` (styles HeroUI visibles) + quelques actions converties en `Button` HeroUI. Ajustement largeur/spacing du layout.
- **files**: [`app/espace-client/head.tsx`, `app/espace-client/layout.tsx`, `app/espace-client/page.tsx`, `app/espace-client/messagerie/page.tsx`, `app/espace-client/profil/page.tsx`, `app/espace-client/reservations/[id]/page.tsx`, `components/auth/TenantMagicLinkFlow.tsx`, `components/espace-client/BookingCard.tsx`]
- **why**: Demande client — espace locataire “réel” (données Supabase) et UI correctement stylée (HeroUI).
- **impact**: L’espace client n’affiche plus de contenu fictif ; les composants HeroUI ont leurs styles et une hiérarchie plus lisible.
- **verify**: `rm -rf .next && npm run build` OK ; `npm run dev -p 3000` relancé.
- **session**: `docs/logs/2026-03-31.md`

---

## 2026-03-31T17:40:00Z | type: security | Cursor — Hardening API + RLS + headers + lint

- **agent**: `cursor`
- **summary**: Durcissement sécurité: `booking-session` ne renvoie plus de PII, exige un `session_id` valide, applique rate limit, et ne divulgue que les réservations `paid+confirmed`. Suppression des policies RLS trop permissives sur `notifications` pour `authenticated`. Ajout de headers de sécurité globaux et `Cache-Control: no-store` sur `/api/*`. Mise en place ESLint non interactif (config + deps) et lint OK (warnings restants).
- **files**: [`app/api/booking-session/route.ts`, `supabase/migrations/notifications.sql`, `next.config.mjs`, `.eslintrc.json`, `package.json`, `package-lock.json`]
- **why**: Réduire l’exposition de données sensibles et améliorer la qualité (lint) selon règles sécurité/perf.
- **impact**: Moins de risques de fuite de données et meilleure hygiène sécurité en prod.
- **verify**: `npm run lint` OK (warnings) ; `npm run build` OK ; `npm run dev -p 3000` relancé.
- **session**: `docs/logs/2026-03-31.md`

---

## 2026-03-31T19:15:00Z | type: ui | Cursor — Hero : titre visible retiré
- **agent**: `cursor`
- **summary**: Suppression du `h1` typographique « Diamant Noir » dans le hero ; conservation d’un seul `h1` en `sr-only` pour SEO / lecteurs d’écran ; lien `aria-labelledby` sur la section.
- **files**: [`app/page.tsx`]
- **why**: Demande client — hero visuel = logo + accroche uniquement.
- **impact**: Outline page cohérente ; pas de double titre visible.
- **verify**: Lighthouse / outline ; rendu hero.
- **session**: docs/logs/2026-03-31.md

---

## 2026-03-31T19:00:00Z | type: ui | Cursor — Hero : retrait baseline sous le titre
- **agent**: `cursor`
- **summary**: Suppression du sous-titre « Là où l’horizon devient votre seul voisin. » sous `h1` Diamant Noir sur l’accueil ; ajustement léger du `delay` sur le bloc barre de recherche.
- **files**: [`app/page.tsx`]
- **why**: Demande client — alléger le hero après logo + accroche Martinique + titre.
- **impact**: Moins de texte above-the-fold.
- **verify**: visuel hero.
- **session**: docs/logs/2026-03-31.md

---

## 2026-03-31T18:45:00Z | type: ui | Cursor — Hero : logo XXL, header mot seul
- **agent**: `cursor`
- **summary**: `BrandLogo` : taille `hero` (grand pictogramme), prop `showIcon` (masquer le picto). Accueil : logo `size="hero"` seul, phrase « Martinique · Collection privée » conservée en dessous. `Navbar` : `showIcon={false}` — seul le mot « DIAMANT NOIR » reste centré.
- **files**: [`components/layout/BrandLogo.tsx`, `components/layout/Navbar.tsx`, `app/page.tsx`]
- **why**: Demande client — gros logo dans le hero, pas d’icône à côté du nom dans la barre fixe.
- **impact**: Footer / espace client / login inchangés (icône + mot si non surchargé).
- **verify**: relecture JSX ; build si doute.
- **session**: docs/logs/2026-03-31.md

---

## 2026-03-31T18:00:00Z | type: ui | Cursor — Copy Martinique (retrait Côte d’Azur)
- **agent**: `cursor`
- **summary**: Remplacement des fallbacks / placeholders « Côte d’Azur » et texte méditerranéen du `fallbackVilla` par Martinique (accueil, fiche villa, dashboards propriétaire) ; exemple SQL dans `GUIDE_INSERT_VILLAS.md`.
- **files**: [`app/page.tsx`, `app/villas/[id]/page.tsx`, `app/dashboard/proprio/page.tsx`, `app/dashboard/proprio/[villaId]/page.tsx`, `GUIDE_INSERT_VILLAS.md`]
- **why**: Le site conciergerie est en Martinique, pas sur la Côte d’Azur.
- **impact**: Libellés et données de démo alignés lieu réel.
- **verify**: grep sur le code source sans « Côte d’Azur » ; pas de build requis pour du texte.
- **session**: docs/logs/2026-03-31.md

---

## 2026-03-31T17:30:00Z | type: ui | Cursor — Hero accueil : vidéo WebM
- **agent**: `cursor`
- **summary**: Copie de la vidéo fournie (`0328(1).webm`) vers `public/hero.webm` ; hero `app/page.tsx` utilise `<source src="/hero.webm" type="video/webm" />` à la place de `hero.mp4`.
- **files**: [`public/hero.webm`, `app/page.tsx`, `docs/logs/2026-03-31.md`]
- **why**: Remplacer le média du hero par le fichier envoyé par le client.
- **impact**: Fichier ~11 Mo versionné côté `public/` ; navigateurs sans WebM voient encore le `poster` (`/villa-hero.jpg`).
- **verify**: Fichier présent ; pas de changement breaking sur la mise en page.
- **session**: docs/logs/2026-03-31.md

---

## 2026-03-31T16:45:00Z | type: ui+config | Cursor — Réintégration HeroUI v3 (espace client)
- **agent**: `cursor`
- **summary**: Réinstallation `@heroui/react@3.0.1` (OK avec React 19). `I18nProvider` (fr-FR) dans `EspaceClientProviders`, `<link href="/heroui-v3.min.css">` dans le layout espace client. Composants : `TenantAvatar`, `BookingCard` (Card, Chip), `ProfileForm` (TextField, Button), pages espace client (Skeleton, Separator), détail réservation (Alert, Breadcrumbs). `optimizePackageImports` pour `@heroui/react`.
- **files**: [`package.json`, `package-lock.json`, `next.config.mjs`, `components/espace-client/EspaceClientProviders.tsx`, `TenantAvatar.tsx`, `BookingCard.tsx`, `ProfileForm.tsx`, `app/espace-client/layout.tsx`, `app/espace-client/page.tsx`, `app/espace-client/messagerie/page.tsx`, `app/espace-client/reservations/[id]/page.tsx`, `docs/logs/2026-03-31.md`]
- **why**: Demande utilisateur après migration React 19 pour profiter des composants HeroUI sans erreur runtime.
- **impact**: Styles HeroUI limités aux routes sous `app/espace-client` via la feuille dédiée ; bundle espace client plus lourd (attendu).
- **verify**: `npm run build` OK.
- **session**: docs/logs/2026-03-31.md

---

## 2026-03-31T15:30:00Z | type: config+ui | Cursor — Next 15 + React 19
- **agent**: `cursor`
- **summary**: Montée `next@15` / `react@19` / `react-dom@19`, `@types/react-dom`. App Router : `RootLayout` async + `await cookies()` ; `params` / `searchParams` typés en `Promise<…>` + `await` sur `app/villas/[id]/page.tsx`, `app/book/page.tsx`, `app/register/page.tsx`. Chatbot : `dynamic(..., { ssr: false })` déplacé dans `components/chatbot/ChatbotDynamic.tsx` (interdit dans Server Components en Next 15). Dashboard villa : garde `villaId` avant requêtes Supabase ; `handleBlockDates` utilise `vid` après check. `next.config.mjs` : `outputFileTracingRoot` pour lockfile parent. `unstable_noStore` conservé (pas d’export `noStore` côté types sur cette version).
- **files**: [`package.json`, `package-lock.json`, `next.config.mjs`, `app/layout.tsx`, `app/villas/[id]/page.tsx`, `app/book/page.tsx`, `app/register/page.tsx`, `app/page.tsx`, `app/villas/page.tsx`, `components/chatbot/ChatbotDynamic.tsx`, `app/dashboard/proprio/[villaId]/page.tsx`, `docs/logs/2026-03-31.md`]
- **why**: Permettre les libs peer React 19 (ex. `@heroui/react` v3, `react-leaflet` 5) sans erreur runtime / peer incohérents.
- **impact**: Build + routes alignés Next 15 ; premières pages avec `params`/`searchParams` déjà migrées (autres routes à surveiller si nouvelles erreurs TS).
- **verify**: `npm install --legacy-peer-deps`, `npm run build` OK.
- **session**: docs/logs/2026-03-31.md

---

## 2026-03-31T14:15:00Z | type: ui+config | Cursor — Retrait HeroUI (fix `render is not a function` React 18)
- **agent**: `cursor`
- **summary**: `@heroui/react@3` exige React ≥ 19 ; avec Next 14 + React 18, l’espace client plantait (`TypeError: render is not a function` / `updateContextConsumer`). Dépendance retirée ; UI espace client réécrite avec `Card`/`Input`/`Button` existants, nouveau `components/ui/skeleton`, avatar Next/Image, alertes et fil d’Ariane en HTML. `EspaceClientProviders` ne wrap plus `I18nProvider`. Feuille `heroui-v3.min.css` et entrée `optimizePackageImports` retirées.
- **files**: [`package.json`, `package-lock.json`, `next.config.mjs`, `components/ui/skeleton.tsx`, `components/espace-client/EspaceClientProviders.tsx`, `TenantAvatar.tsx`, `BookingCard.tsx`, `ProfileForm.tsx`, `app/espace-client/layout.tsx`, `app/espace-client/page.tsx`, `app/espace-client/messagerie/page.tsx`, `app/espace-client/reservations/[id]/page.tsx`, `docs/logs/2026-03-31.md`]
- **why**: Corriger l’erreur runtime due au décalage de versions React / contextes compilés pour React 19.
- **impact**: Espace client stable sur React 18 ; une future intégration HeroUI nécessite migration Next 15+ / React 19 ou autre lib compatible.
- **verify**: `npm install --legacy-peer-deps`, `npm run build` OK.
- **session**: docs/logs/2026-03-31.md

---

## 2026-03-30T12:00:00Z | type: ui+config | Cursor — HeroUI v3 sur `/espace-client` (dashboard locataire)
- **agent**: `cursor`
- **summary**: Ajout `@heroui/react@3.0.1` (install avec `--legacy-peer-deps` : peer React 19 / Tailwind 4 déclarés par HeroUI alors que le projet reste React 18 + Tailwind 3). Styles : fichier `public/heroui-v3.min.css` (extrait de `@heroui/styles`) chargé via `<link>` dans le layout espace client (évite PostCSS qui rejette le CSS Tailwind v4). `I18nProvider` (fr-FR) dans `EspaceClientProviders`. Composants : `TenantAvatar`, page accueil (Skeleton, Separator, liens style bouton), `BookingCard` (Card, Chip), messagerie et détail réservation (Skeleton), erreur réservation (Alert), fil d’Ariane (Breadcrumbs), `ProfileForm` (TextField, Label, Input, Description, Button HeroUI). `optimizePackageImports` pour `@heroui/react`.
- **files**: [`package.json`, `public/heroui-v3.min.css`, `next.config.mjs`, `components/espace-client/EspaceClientProviders.tsx`, `components/espace-client/TenantAvatar.tsx`, `app/espace-client/layout.tsx`, `app/espace-client/page.tsx`, `app/espace-client/messagerie/page.tsx`, `app/espace-client/reservations/[id]/page.tsx`, `components/espace-client/BookingCard.tsx`, `components/espace-client/ProfileForm.tsx`, `docs/logs/2026-03-30.md`]
- **why**: Plan d’intégration HeroUI pour un dashboard locataire plus cohérent (« premium ») sans migrer tout le site.
- **impact**: Espace client uniquement ; risque mineur de conflits CSS globaux via la feuille minifiée (chargée sur les routes sous ce layout). Navigation interne : `Button` HeroUI sans `href` typé → liens hero / détail réservation en `Link` Next + classes `button--*`.
- **verify**: `npm run build` OK.
- **session**: docs/logs/2026-03-30.md

---

## 2026-03-27T18:30:00Z | type: ui+sql | Cursor — Reprise plan « Dashboard locataire premium v2 » (avatars + cards + hero)
- **agent**: `cursor`
- **summary**: Finalisation après session Claude interrompue : `BookingCard` avec bannière villa 16:7 + badge ; `ProfileForm` upload vers bucket `profile-avatars` + `updateUser(avatar_url)` ; `profil/page` props + mode démo sans upload ; `UpcomingStayHero` image depuis `villa.image_url` / `image_urls` ; migration SQL bucket + policies (insert/select/update).
- **files**: [`components/espace-client/BookingCard.tsx`, `components/espace-client/ProfileForm.tsx`, `app/espace-client/profil/page.tsx`, `app/espace-client/page.tsx`, `supabase/migrations/20260327120000_profile_avatars_bucket.sql`, `docs/logs/2026-03-27.md`]
- **why**: Espace client premium : identité visuelle (avatar, images villas) alignée sur le plan utilisateur / Claude.
- **impact**: Cartes et hero plus riches ; photo de profil stockée en Storage et référencée dans les métadonnées utilisateur.
- **verify**: `npm run build` OK.
- **session**: docs/logs/2026-03-27.md

---

## 2026-03-27T12:00:00Z | type: ui | Cursor — Flux locataire : copy directe (sans tutoriel)
- **agent**: `cursor`
- **summary**: Allègement des textes dans `TenantMagicLinkFlow` : retrait du panneau explicatif login/inscription + liste d’étapes ; OTP et profil avec libellés courts ; erreurs et CGU raccourcis ; bouton démo simplifié.
- **files**: [`components/auth/TenantMagicLinkFlow.tsx`, `docs/logs/2026-03-27.md`]
- **why**: Demande utilisateur — pas de style « tuto », interface directe.
- **impact**: Moins de lecture sur mobile ; flux inchangé fonctionnellement.
- **verify**: Lint OK sur le composant.
- **session**: docs/logs/2026-03-27.md

---

## 2026-03-23T17:05:00Z | type: fix+docs | Cursor — Chakra v3, Navbar, logs session & relance localhost
- **agent**: `cursor`
- **summary**:
  1. **Chakra UI v3** : `app/providers.tsx` — `ChakraProvider` avec `value={defaultSystem}` pour corriger l’erreur `_config` / styled-system.
  2. **Navbar** : suppression du `Drawer` Chakra (API v2, incompatible) → menu mobile **Tailwind** (overlay + panneau) pour corriger `Element type is invalid`.
  3. **BookingDetailModal** : retrait de `useToast` Chakra ; conservation Radix `Dialog`.
  4. **Soumettre ma villa** : retrait `Stepper` / `useToast` Chakra ; stepper **Tailwind** + alerte validation étape contact.
  5. **Vérification** : `npm run build` OK.
  6. **Dev** : kill process sur port 3000 puis `npm run dev -- -p 3000`.
  7. **Documentation** : entrée session `docs/logs/2026-03-23.md` ; règles routing UI + **HeroUI en pause** (`kb-ui-ux-pro-max.mdc`, `kb-heroui.mdc`, alignement `kb-chakra-ui` / `kb-radix-ui-themes`).
- **files**: [`app/providers.tsx`, `components/layout/Navbar.tsx`, `components/dashboard/BookingDetailModal.tsx`, `app/soumettre-ma-villa/page.tsx`, `.cursor/rules/kb-ui-ux-pro-max.mdc`, `.cursor/rules/kb-heroui.mdc`, `docs/logs/2026-03-23.md`]
- **why**: Erreurs runtime Chakra v3 + stabilité Navbar ; demande utilisateur de tout tracer dans les logs.
- **impact**: App démarre sans crash sur ces écrans ; base documentée pour la session du 23/03.
- **verify**: `npm run build` réussi ; serveur dev relancé sur localhost:3000.
- **session**: docs/logs/2026-03-23.md

---

## 2026-03-17T22:00:00Z | type: ui | Cursor — Intégration avancée Chakra UI & Radix (Toasts, Stepper, Skeletons)
- **agent**: `cursor`
- **summary**: Application concrète des bibliothèques Radix Themes et Chakra UI. Remplacement du Drawer natif par Chakra `<Drawer>` dans la Navbar. Utilisation de Chakra `useToast()` pour les notifications de `BookingDetailModal` et `SoumettreMaVilla`. Transformation du formulaire `SoumettreMaVilla` en processus par étapes avec Chakra `<Stepper>`. Remplacement des loaders textuels par des `<Skeleton>` Radix dans le Dashboard propriétaire. Remplacement du modal custom par Radix `<Dialog>` dans `BookingDetailModal`.
- **files**: [`components/layout/Navbar.tsx`, `components/dashboard/BookingDetailModal.tsx`, `app/soumettre-ma-villa/page.tsx`, `app/dashboard/proprio/page.tsx`, `components/dashboard/FinancesOverview.tsx`]
- **why**: Demande "carte blanche" de l'utilisateur pour appliquer les nouvelles règles de design et améliorer l'UX/UI avec des composants premium.
- **impact**: Expérience utilisateur grandement améliorée (fluidité, animations, accessibilité), réduction du code manuel (overlay, modals), et respect des guidelines `kb-ui-ux-pro-max.mdc`.
- **verify**: Composants mis à jour sans erreurs de compilation.
- **session**: docs/logs/2026-03-17.md

---

- timestamp: 2026-03-16T02:59:11Z
  type: config
  summary: Optimisation du bundling Next avec `optimizePackageImports` pour les packages UI/icones.
  files: [`next.config.mjs`]
  why: Réduire le coût des imports barrel et améliorer les cold starts/dev builds.
  impact: Imports `lucide-react` et Radix optimisés automatiquement par Next.
  verify: Relecture config effectuée + vérification par lint/build ci-dessous.

- timestamp: 2026-03-16T02:59:11Z
  type: ui
  summary: Passage du chatbot à un `useMediaQuery` pour éviter la logique resize ad hoc.
  files: [`components/chatbot/Chatbot.tsx`, `lib/use-media-query.ts`]
  why: Appliquer les rules re-render/derived state et stabiliser le comportement mobile.
  impact: Moins de re-renders inutiles liés à `window.innerWidth` et logique responsive plus propre.
  verify: Vérification locale du composant et lint/build en cours.

---

## 2026-03-16T22:00:00Z | type: docs | Analyse memo visio gérant + audit projet
- **summary**: Nettoyage du memo visio (2 fév 2026), croisement avec V1, identification de 10 fonctionnalités manquantes.
- **files**: `ROADMAP_CURSOR_CLAUDECODE.md`
- **why**: Préparer la deadline juin/juillet 2026 (haute saison).
- **impact**: Roadmap priorisée P1/P2/P3 transmise à Cursor et Claude Code.
- **verify**: Croisement avec `RECAP_PROJET_COMPLET.md` et `RECAP_JOURNEE_2026-03-15.md`.
- **session**: docs/logs/2026-03-16.md

---

## 2026-03-16T22:30:00Z | type: api | Hub multi-OTA (Airbnb, Expedia, Trivago, Vrbo, Booking)
- **summary**: Création du hub de synchronisation iCal multi-sources avec auto-détection OTA, sync parallèle, backward-compatible.
- **files**: `lib/ota-hub.ts`, `app/api/sync/route.ts`, `app/api/sync-ota/route.ts`, `supabase-ota-migration.sql`
- **why**: Le projet ne synchronisait que Airbnb. Le gérant veut un hub multi-agences (Expedia, Trivago, Vrbo, Booking).
- **impact**: N canaux OTA par villa, sync parallèle, contrainte source étendue, RLS corrigé sur 3 tables.
- **verify**: Code TypeScript OK. Migration SQL à exécuter manuellement dans Supabase SQL Editor.
- **session**: docs/logs/2026-03-16.md

---

## 2026-03-16T23:00:00Z | type: ui+api+i18n | Cursor — Priorités 1, 2, 3 roadmap
- **summary**: Cursor a appliqué la roadmap : OTAChannelsManager UI, emails auto soumission villa, espagnol i18n, flow sans photos, FAQ Contact, page Services Propriétaires, import Airbnb public.
- **files**: `components/dashboard/OTAChannelsManager.tsx`, `lib/email-templates.ts`, `app/api/villa-submissions/route.ts`, `lib/i18n.ts`, `app/soumettre-ma-villa/page.tsx`, `app/services-proprietaires/page.tsx`, `app/contact/page.tsx`, Navbar
- **why**: Fonctionnalités identifiées dans le memo visio gérant.
- **impact**: Plateforme quasi-complète avant deadline haute saison. Reste : branding, perf P0, déploiement.
- **verify**: Cursor a validé. ⚠️ Migration Supabase + webhook n8n à configurer manuellement.
- **session**: docs/logs/2026-03-16.md

---

## 2026-03-17T12:00:00Z | type: feature+auth | Claude Code — Espace client locataire
- **agent**: `claude`
- **summary**: Espace **locataire** (magic link) : réservations par email invité, détail séjour + livret, messagerie chatbot tenant, profil ; API `/api/chat/tenant` + callback auth ; migration `support_tickets`.
- **files**:
  - `supabase/migrations/espace_client_tenant.sql`
  - `app/auth/callback/route.ts`
  - `app/api/chat/tenant/route.ts`
  - `app/espace-client/layout.tsx`, `app/espace-client/page.tsx`
  - `app/espace-client/reservations/[id]/page.tsx`, `messagerie/page.tsx`, `profil/page.tsx`
  - `components/espace-client/BookingCard.tsx`, `WelcomeBook.tsx`, `TenantChatbot.tsx`, `ProfileForm.tsx`
  - `app/login/page.tsx` (magic link si `?redirect=/espace-client`)
  - `components/layout/Navbar.tsx` (masquée sur `/espace-client`)
- **why**: Parcours invité distinct du dashboard propriétaire ; SAV via n8n contextualisé locataire.
- **impact**: Locataires connectés par OTP voient leurs bookings ; chat rate-limité côté API.
- **verify**: `npm run build` OK (fixes TS `NotificationBell`, `WishlistContext`). Ruflo : `auth/callback` risque élevé (normal).
- **session**: docs/logs/2026-03-17.md

---

## 2026-03-17T18:00:00Z | type: ui+refactor | Cursor — `/book` alignée sur `/villas` + catalogue partagé
- **agent**: `cursor`
- **summary**: La page **Réserver** (`/book`) reprend le **même hero navy** (grille, filet or) que le catalogue, la **barre `HeroSearchWidget`** (préremplie depuis l’URL : `zone`, `checkin`, `checkout`, `guests`), le **split liste + carte** via `VillasMapView` et les cartes `VillaListingCard`. Branche **checkout** (`villaId` + dates) : hero dédié + `CheckoutView` en mode `embedInBookLayout`. Extraction **`lib/villas-catalog.ts`** (`fetchPublishedVillasForMap`, `filterVillasByZone`, coords). **`/villas`** simplifié pour consommer ce module.
- **files**:
  - `lib/villas-catalog.ts` ← **NOUVEAU**
  - `app/book/page.tsx` ← réécriture
  - `app/villas/page.tsx` ← utilise `fetchPublishedVillasForMap`
  - `components/HeroSearchWidget.tsx` ← props initiales + `useEffect` sync URL
  - `components/booking/CheckoutView.tsx` ← prop `embedInBookLayout`
- **why**: Demande utilisateur — même expérience visuelle et fonctionnelle entre catalogue et réservation ; une seule source de vérité pour les villas affichées sur carte.
- **impact**: `SearchResults` / `VillaSelectionCard` plus utilisés sur `/book` (composants orphelins possibles). Filtre par zone via query `zone=`.
- **verify**: **Pas de `npm run build`** sur demande — à valider manuellement sur **localhost** (dev).
- **session**: docs/logs/2026-03-17.md (section Cursor)

---

## 2026-03-17T18:15:00Z | type: docs | Cursor — Journal + règle `kb-action-documentation`
- **agent**: `cursor`
- **summary**: Entrée ci-dessus consignée ; `docs/logs/2026-03-17.md` section Cursor complétée ; règle **`.cursor/rules/kb-action-documentation.mdc`** mise à jour (champ `agent`, chemins `diamant-noir/docs/…`, note verify si pas de build).
- **files**: [`docs/ACTIONS_LOG.md`, `docs/logs/2026-03-17.md`, `.cursor/rules/kb-action-documentation.mdc`]
- **why**: Rappel utilisateur : chaque action doit suivre la règle de documentation projet.
- **impact**: Traçabilité ; prochaines sessions Cursor alignées sur les chemins réels du repo.
- **verify**: Relecture markdown.
- **session**: docs/logs/2026-03-17.md

---

## 2026-03-17T18:30:00Z | type: ui | Cursor — Restauration design de `/book` (inspiré)
- **agent**: `cursor`
- **summary**: Restauration du Hero immersif (`h-[60vh]`) et du composant `SearchResults` originaux sur la page `/book`. Le `HeroSearchWidget` fonctionnel a été intégré dans ce Hero, et les données réelles sont mappées pour `VillaSelectionCard`.
- **files**: [`app/book/page.tsx`]
- **why**: Demande de l'utilisateur : la page ne devait pas être un clone 1:1 de `/villas`, mais s'en inspirer tout en gardant son identité "Réserver l'Exception".
- **impact**: La page `/book` retrouve son identité visuelle originelle (Hero grand format, cartes horizontales) mais avec le widget de recherche fonctionnel.
- **verify**: Pas de `npm run build` selon la demande, test à réaliser sur localhost.
- **session**: docs/logs/2026-03-17.md

---

## 2026-03-17T18:45:00Z | type: ui | Cursor — Design `/book` (Éditorial + Grille épurée)
- **agent**: `cursor`
- **summary**: Troisième itération de la page `/book` : création d'une identité propre inspirée du catalogue mais sans être un clone. Hero éditorial "Réserver l'Exception" ferré à gauche (navy, grille, filet or). Le `HeroSearchWidget` est intégré sous le texte. Remplacement de la carte Leaflet et de l'ancienne liste par une grille épurée (1 à 4 colonnes) utilisant les `VillaListingCard` luxueuses. Le bloc conciergerie de bas de page est allégé et élégant.
- **files**: [`app/book/page.tsx`]
- **why**: L'utilisateur souhaitait s'inspirer du catalogue sans en faire un clone exact 1:1, et a demandé une proposition d'idées (pas besoin de la carte sur la page de réservation).
- **impact**: La page de réservation a maintenant un design très haut de gamme et épuré, centré uniquement sur la recherche de dates et le parcours de la grille de résultats, sans les distractions de la carte.
- **verify**: Pas de `npm run build` exécuté selon consigne, à valider sur localhost.
- **session**: docs/logs/2026-03-17.md

---

## 2026-03-17T19:15:00Z | type: ui | Cursor — Bar de recherche "Ultra Luxe" (Popovers + Calendar)
- **agent**: `cursor`
- **summary**: Refonte complète du `HeroSearchWidget` pour un standard "plateforme luxe" (type Airbnb Luxe / Le Collectionist). Remplacement des inputs natifs inélégants (`<select>`, `<input type="date">`) par des modales sur-mesure utilisant `@radix-ui/react-popover` et `react-day-picker`. Le champ Date ouvre un vrai calendrier double-mois, le champ Destination un menu liste avec sous-titres, et le champ Voyageurs un compteur interactif (-/+).
- **files**: [`components/HeroSearchWidget.tsx`, `package.json`]
- **why**: Demande utilisateur pour un rendu de modal plus "luxe", les éléments natifs du navigateur brisant l'immersion premium.
- **impact**: Expérience de recherche transformée, avec des interactions fluides, des popups animées et un design très haut de gamme.
- **verify**: Installation locale de `date-fns` et `react-day-picker`. À tester sur localhost.
- **session**: docs/logs/2026-03-17.md

---

## 2026-03-17T19:30:00Z | type: ui+config | Cursor — Radix UI Themes & ajustements search bar
- **agent**: `cursor`
- **summary**: Installation de `@radix-ui/themes` pour étendre les capacités de design haut de gamme. Enveloppement de l'application dans `<Theme>` (`app/layout.tsx`) avec les couleurs `gold` et `slate`. Micro-ajustements des marges de dates dans le `HeroSearchWidget` pour un alignement parfait au pixel près.
- **files**: [`package.json`, `app/layout.tsx`, `components/HeroSearchWidget.tsx`]
- **why**: Demande utilisateur d'explorer Radix UI Themes pour récupérer de beaux composants de luxe.
- **impact**: Le projet bénéficie maintenant des tokens et de l'infrastructure de design Radix (typographie, radius, couleurs) prêts à être utilisés pour les futures modales et UI.
- **verify**: Installation NPM OK.
- **session**: docs/logs/2026-03-17.md

---

## 2026-03-17T20:30:00Z | type: docs+config | Cursor — Installation Chakra UI et règle associée
- **agent**: `cursor`
- **summary**: Installation de `@chakra-ui/react` et `@emotion/react`. Ajout du `<ChakraProvider>` dans `app/layout.tsx` à côté du `<Theme>` de Radix. Création de la règle `.cursor/rules/kb-chakra-ui.mdc`.
- **files**: [`package.json`, `app/layout.tsx`, `.cursor/rules/kb-chakra-ui.mdc`]
- **why**: Demande utilisateur d'intégrer l'écosystème Chakra UI au projet et d'établir une règle front-end claire sur son utilisation (pour le projet et le Client Builder).
- **impact**: Le projet possède maintenant deux des bibliothèques de composants React les plus puissantes (Radix et Chakra). La règle explique comment éviter les conflits CSS avec Tailwind et quand préférer l'un ou l'autre (ex: Toasts, Drawers, Accordions pour Chakra).
- **verify**: NPM install validé.
- **session**: docs/logs/2026-03-17.md

---

## 2026-03-17T21:00:00Z | type: docs | Cursor — Amélioration règles UI (Radix vs Chakra)
- **agent**: `cursor`
- **summary**: Mise à jour des règles `kb-ui-ux-pro-max.mdc`, `kb-radix-ui-themes.mdc` et `kb-chakra-ui.mdc` suite à l'analyse de l'index complet des composants (112 pour Chakra, 56 pour Radix).
- **files**: [`.cursor/rules/kb-ui-ux-pro-max.mdc`, `.cursor/rules/kb-radix-ui-themes.mdc`, `.cursor/rules/kb-chakra-ui.mdc`]
- **why**: Demande utilisateur pour affiner la répartition des rôles entre Radix et Chakra afin que le Client Builder choisisse de manière experte le bon composant parmi les listes complètes.
- **impact**: Le Client Builder sait maintenant qu'il doit utiliser Radix pour `<Dialog>`, `<Popover>`, `<Select>`, `<HoverCard>`, et Chakra pour `<Drawer>`, `<PinInput>`, `<Stepper>`, `<Carousel>`, `<Stat>`, `<Rating>`.
- **verify**: Relecture des fichiers MDC.
- **session**: docs/logs/2026-03-17.md

---

## 2026-03-17T20:45:00Z | type: docs | Cursor — Mise à jour `kb-ui-ux-pro-max.mdc`
- **agent**: `cursor`
- **summary**: Intégration de l'utilisation intelligente des deux écosystèmes UI ajoutés (Radix et Chakra) dans la règle maîtresse de design `.cursor/rules/kb-ui-ux-pro-max.mdc`.
- **files**: [`.cursor/rules/kb-ui-ux-pro-max.mdc`]
- **why**: L'utilisateur a demandé d'intégrer intelligemment ces nouvelles bibliothèques au workflow global décrit dans "UI/UX Pro Max" pour que le Client Builder utilise le bon outil au bon moment.
- **impact**: Le workflow Karibloom dicte désormais l'utilisation de Tailwind pour le layout, Radix pour les petits widgets headless/accessibles (Dialog, Popover, Select), et Chakra UI pour les grosses modales complexes (Drawers, Toasts, Steppers).
- **verify**: Relecture markdown.
- **session**: docs/logs/2026-03-17.md

---

## 2026-03-17T20:00:00Z | type: docs | Cursor — Création règle `kb-radix-ui-themes`
- **agent**: `cursor`
- **summary**: Création de la règle `.cursor/rules/kb-radix-ui-themes.mdc` décrivant comment et quand utiliser Radix Themes dans les projets orientés "luxe" ou tableaux de bord.
- **files**: [`.cursor/rules/kb-radix-ui-themes.mdc`]
- **why**: Demande utilisateur de faire un tour sur Radix et d'établir une règle front-end réutilisable pour le client builder.
- **impact**: Le modèle de développement dispose d'une guideline claire pour tirer parti de Radix UI Themes (Dialog, Popover, Select, etc.) tout en le couplant correctement à Tailwind.
- **verify**: Fichier créé et validé visuellement.
- **session**: docs/logs/2026-03-17.md

---

## 2026-03-17T19:00:00Z | type: ui | Cursor — Redesign `HeroSearchWidget` (Barre de recherche luxe)
- **agent**: `cursor`
- **summary**: Refonte visuelle de la barre de recherche (`HeroSearchWidget.tsx`) pour lui donner un aspect "luxe" premium. Passage d'une barre carrée basique à une forme en "pilule" arrondie (`rounded-full`), ajout d'icônes dorées (`MapPin`, `Calendar`, `Users`) pour chaque champ, amélioration de la typographie (labels espacés), et refonte du bouton de recherche avec icône.
- **files**: [`components/HeroSearchWidget.tsx`]
- **why**: Demande utilisateur pour rendre la barre de recherche plus belle, alignée avec le standing des villas d'exception et le style éditorial adopté.
- **impact**: Expérience de recherche grandement améliorée sur les pages `/` et `/book`.
- **verify**: Validé visuellement dans le code, pas de `npm run build` selon la demande.
- **session**: docs/logs/2026-03-17.md

---

## 2026-03-27T12:00:00Z | type: config+docs | Cursor — Intégration du pack Client Builder dans `.cursor/rules`
- **agent**: `cursor`
- **summary**:
  1. Synchronisation du répertoire `CLIENT BUILDER KARIBLOOM/client-builder-rules/` vers `DIAMANTNOIR/.cursor/rules/client-builder/` (structure `01-core/` … `07-optional/`, `_INDEX.mdc`, `docs/`).
  2. Mise à jour du point d’entrée `.cursor/rules/karibloom-client-builder.mdc` : section « Pack Client Builder », ligne de tableau vers l’index et `02-stack/`, règle de priorité racine vs pack.
- **files**: [`.cursor/rules/client-builder/` (arborescence complète), `.cursor/rules/karibloom-client-builder.mdc`, `diamant-noir/docs/ACTIONS_LOG.md`, `diamant-noir/docs/logs/2026-03-27.md`]
- **why**: Demande utilisateur d’intégrer les règles du Client Builder dans le projet Diamant Noir pour une gouvernance stack/UI et une carte des règles alignées sur l’agence.
- **impact**: Cursor charge le pack numéroté en complément des règles à la racine ; les choix déjà figés dans ce repo restent explicitement prioritaires via la règle racine.
- **verify**: Arborescence `client-builder/` présente ; relecture du markdown du point d’entrée.
- **session**: docs/logs/2026-03-27.md

---

## 2026-03-27T14:30:00Z | type: config | Cursor — Skills « Impeccable » (pbakaus/impeccable)
- **agent**: `cursor`
- **summary**: Copie du dossier `.cursor/skills` du dépôt [impeccable](https://github.com/pbakaus/impeccable/tree/main/.cursor/skills) vers `DIAMANTNOIR/.cursor/skills/` (21 skills : `adapt`, `animate`, `arrange`, `audit`, `bolder`, `clarify`, `colorize`, `critique`, `delight`, `distill`, `extract`, `frontend-design`, `harden`, `normalize`, `onboard`, `optimize`, `overdrive`, `polish`, `quieter`, `teach-impeccable`, `typeset` + fichiers `reference/` où présents).
- **files**: [`.cursor/skills/**`, `diamant-noir/docs/ACTIONS_LOG.md`, `diamant-noir/docs/logs/2026-03-27.md`]
- **why**: Demande utilisateur d’ajouter ces skills au projet pour les agents Cursor.
- **impact**: Les skills Impeccable sont disponibles localement sous `.cursor/skills/` (même convention qu’upstream : un dossier par skill, `SKILL.md` + références).
- **verify**: `rsync` OK ; 21 `SKILL.md` listés sous `.cursor/skills/`.
- **session**: docs/logs/2026-03-27.md

---

## 2026-03-27T16:00:00Z | type: fix | Cursor — Runtime `next/dynamic` + Chatbot (factory undefined)
- **agent**: `cursor`
- **summary**: Correction du chargement dynamique du `Chatbot` dans `app/layout.tsx` : le loader renvoie désormais `{ default: mod.Chatbot }` au lieu de `mod.Chatbot` seul, conforme à ce qu’attend `React.lazy` / le bundler Next.
- **files**: [`app/layout.tsx`, `diamant-noir/docs/ACTIONS_LOG.md`]
- **why**: Erreur runtime `TypeError: Cannot read properties of undefined (reading 'call')` dans `webpack.js` / `mountLazyComponent` au chargement client.
- **impact**: Le layout hydrate correctement le widget chatbot chargé en différé (`ssr: false`).
- **verify**: `rm -rf .next && npm run build` OK.

---

## 2026-03-27T18:00:00Z | type: docs | Cursor — Mise à jour `RECAP_PROJET_COMPLET.md` (design + terminal)
- **agent**: `cursor`
- **summary**: Réalignement du récap projet sur le terminal Claude Code (plan luxe éditorial, implémentations Tailwind/globals/page/Navbar/Footer, retour utilisateur fonds blanc/noir, hero épuré). Section **Design system** réécrite (principes, tokens, utilitaires CSS, détail accueil `/`, tableau fichiers). Mise à jour date, stack styling, route `/`, historique §10.
- **files**: [`RECAP_PROJET_COMPLET.md`, `diamant-noir/docs/ACTIONS_LOG.md`]
- **why**: Demande utilisateur de synchroniser la documentation avec l’état réel du design après les sessions terminal.
- **impact**: Source de vérité projet à jour pour l’équipe et les agents.
- **verify**: Relecture markdown.

---

## 2026-03-27T20:00:00Z | type: ui | Cursor — Pages marketing « landing » (arrange + luxe)
- **agent**: `cursor`
- **summary**:
  1. Composants réutilisables `components/marketing/landing-sections.tsx` (`LandingShell`, `LandingHero`, `LandingHeroCompact`, `LandingSection`, `LandingSectionNarrow`, `LandingBlockTitle`, `LandingCtaBand`).
  2. Refonte **qui-sommes-nous**, **prestations**, **contact** : sections alternées, grilles asymétriques, rythme vertical, hiérarchie typographique, boutons `btn-luxury` / bordures fines.
  3. Pages **confidentialité**, **terms**, **cookies** : même langage visuel + **`NEXT_PUBLIC_MARKETING_SIMPLE_LEGAL=1`** pour réafficher l’ancienne version compacte (fallback).
  4. `lib/marketing-layout.ts` — lecture du flag.
- **files**: [`components/marketing/landing-sections.tsx`, `lib/marketing-layout.ts`, `app/qui-sommes-nous/page.tsx`, `app/prestations/page.tsx`, `app/contact/page.tsx`, `app/confidentialite/page.tsx`, `app/terms/page.tsx`, `app/cookies/page.tsx`, `.env.local.example`, `diamant-noir/docs/ACTIONS_LOG.md`]
- **why**: Demande utilisateur — pages « landing » cohérentes avec le luxe éditorial, sans bloc titre + mur de texte ; fallback si le rendu ne convient pas.
- **impact**: Parcours marketing plus lisible et premium ; pages légales structurées.
- **verify**: `npm run build` OK.

---

## 2026-03-28T12:00:00Z | type: ui | Cursor — Pages Prestations / Qui sommes-nous façon « Le Collectionist »
- **agent**: `cursor`
- **summary**:
  1. Nouveau module `components/marketing/editorial-blocks.tsx` : hero immersif pleine hauteur (image + dégradé, titre display), intro éditoriale centrée, grille services « best-sellers », split image/texte, bandeau chiffre, témoignages sur fond sombre.
  2. Refonte **`/prestations`** et **`/qui-sommes-nous`** pour se rapprocher du rythme [Le Collectionist — Conciergerie](https://www.lecollectionist.com/fr/notre-conciergerie-de-luxe) (sections successives, hiérarchie magazine, pas uniquement titre + bloc).
  3. Contenus témoignages / sous-titres adaptés Diamant Noir / Martinique ; image `/public/villa-hero.jpg` (LCP prioritaire sur hero).
- **files**: [`components/marketing/editorial-blocks.tsx`, `app/prestations/page.tsx`, `app/qui-sommes-nous/page.tsx`, `diamant-noir/docs/ACTIONS_LOG.md`]
- **why**: Demande utilisateur — rendu plus « landing » premium aligné sur la référence Le Collectionist.
- **impact**: Parcours conciergerie / marque plus narratif et visuel.
- **verify**: `npm run build` OK.

---

## 2026-03-28T14:00:00Z | type: ui | Cursor — Catalogue `/villas` : angles droits
- **agent**: `cursor`
- **summary**: Cartes liste + image sans `rounded-3xl` ; lien carte avec bordure fine au survol ; bouton « Masquer la carte » en `rounded-none` ; badge tier rectangulaire ; popups Leaflet sans arrondi (`border-radius: 0`) + bordure légère dans `globals.css`.
- **files**: [`components/VillasMapView.tsx`, `app/globals.css`, `diamant-noir/docs/ACTIONS_LOG.md`]
- **why**: Demande utilisateur — alignement luxe éditorial (UI/UX Pro Max : cohérence visuelle, pas de « cartes app » arrondies).
- **impact**: `/villas` et mini-cartes carte aux bords nets.
- **verify**: `npm run build` OK.

---

## 2026-03-28T16:30:00Z | type: ui | Cursor — Réintégration logo marque (`/public/brand/diamant-noir-logo.png`)
- **agent**: `cursor`
- **summary**: Composant `BrandLogo` (Image Next + wordmark « DIAMANT NOIR », variantes `onDark` / `onLight` pour fonds sombres/clairs). Remplacement des pictos SVG placeholder dans `Navbar`, `Footer`, `espace-client/layout`, panneaux login, et ajout du pictogramme sur le hero d’accueil.
- **files**: [`components/layout/BrandLogo.tsx`, `components/layout/Navbar.tsx`, `components/layout/Footer.tsx`, `app/espace-client/layout.tsx`, `app/login/page.tsx`, `app/page.tsx`, `docs/ACTIONS_LOG.md`, `docs/logs/2026-03-27.md`]
- **why**: Refonte UX — le logo image avait été retiré au profit d’icônes génériques ; rétablissement de l’identité visuelle avec l’asset déjà présent dans `public/brand/`.
- **impact**: Logo visible header, footer, connexion, espace locataire et hero.
- **verify**: Lint OK sur fichiers modifiés ; `npm run build` échoue sur route manquante `/api/chat/tenant` (préexistant, hors périmètre logo).

---

## 2026-03-28T18:00:00Z | type: ui | Cursor — Header vitrine : téléphone, séparateur, favoris, compte (sans « Obtenir l’app »)
- **agent**: `cursor`
- **summary**: Rangée utilitaire à droite (réf. Collectionist) : lien `tel`, séparateur vertical, cœur → `/villas` avec pastille si wishlist, icône compte → espace client ou login, puis CTA Réserver. Couleurs blanches sur header transparent (accueil non scrollé), marine sur barre blanche au scroll ; icônes Lucide `stroke` 1.25, cibles ≥44px.
- **files**: [`components/layout/Navbar.tsx`, `docs/ACTIONS_LOG.md`]
- **why**: Demande utilisateur — même design que la capture (sans bouton app).
- **impact**: Parcours cohérent avec le drawer et le hero sombre.
- **verify**: Lint OK.

---

## 2026-03-28T19:00:00Z | type: ui | Cursor — `/book` aligné sur la refonte (adapt)
- **agent**: `cursor`
- **summary**: Hero plein noir + dégradé vers `offwhite`, barre recherche identique à l’accueil (blanc, `border-white/20`, CTA navy), section catalogue avec titrage caps, toolbar filtres/liste/grille sans pills arrondis, cartes liste/grille sans or ni `rounded-[40px]`, bandeau conciergerie sobre + lien `/contact`. Checkout wrapper `bg-offwhite`.
- **files**: [`app/book/page.tsx`, `components/booking/SearchResults.tsx`, `components/booking/VillaSelectionCard.tsx`, `docs/ACTIONS_LOG.md`]
- **why**: La page Réserver ne suivait pas le nouveau langage visuel (navbar / index).
- **impact**: Parcours réservation cohérent avec le reste du site.
- **verify**: Lint OK sur fichiers modifiés.

---

## 2026-03-28T20:00:00Z | type: ui | Cursor — Hero accueil : hauteur et rythme type Collectionist
- **agent**: `cursor`
- **summary**: Section hero en `min-h` plafonnée (72vh / 720px) + padding vertical modéré au lieu de `h-screen` ; empilement titre/sous-titre/barre avec `space-y-3–4` ; logo `md` ; barre recherche plus basse (`py-3`, CTA « Rechercher ») ; ligne « Arrivée → Départ » ; dégradé ajusté. Balise `<video>` + `poster` conservées pour intégration fichier.
- **files**: [`app/page.tsx`, `docs/ACTIONS_LOG.md`]
- **why**: Réduire l’espace vertical comme la ref Collectionist tout en gardant le slot vidéo.
- **impact**: Hero moins « vide », scroll vers le contenu plus rapide.
- **verify**: Lint OK.

---

## 2026-03-28T21:00:00Z | type: ui | Cursor — Page `/login` alignée site + slot vidéo droite
- **agent**: `cursor`
- **summary**: Formulaire sur fond `offwhite` / champs blancs / texte `navy`, CTA navy. Split desktop : colonne formulaire à gauche, panneau droit `<video>` `/public/login-side.mp4` + poster `villa-hero.jpg`, `object-cover`, dégradé léger. Mobile : bandeau vidéo en haut puis formulaire. Commentaire ratio 9:16 dans `app/login/page.tsx`.
- **files**: [`app/login/page.tsx`, `docs/ACTIONS_LOG.md`]
- **why**: Couleurs incohérentes avec la refonte ; vidéo à intégrer à droite.
- **impact**: `/login` homogène avec le site ; footer déjà masqué sur `/login`.
- **verify**: Lint OK.

---

## 2026-03-27T23:15:00Z | type: ui | Cursor — Login : onglets Connexion / Inscription cliquables (mobile)
- **agent**: `cursor`
- **summary**: Onglets lien magique + mot de passe : grille 2 colonnes (`gap-px`) à la place de flex + séparateur, `min-h-[48px]`, `touch-manipulation`, `cursor-pointer`, état inactif `text-navy/60` + hover léger ; `pointer-events-none` sur la `<video>` du hero login ; colonne formulaire et panneau auth en `relative z-[1]` pour éviter interception des touches.
- **files**: [`app/login/page.tsx`, `docs/ACTIONS_LOG.md`]
- **why**: L’utilisateur ne pouvait pas activer l’onglet Inscription sur mobile (zone tactile / vidéo / contraste « désactivé »).
- **impact**: Cibles tactiles fiables, onglet inactif plus lisible comme action possible.
- **verify**: `npx tsc --noEmit` OK.

---

## 2026-03-27T23:55:00Z | type: ui+api | Cursor — Locataires : flux email → code 6 chiffres → profil (type Collectionist)
- **agent**: `cursor`
- **summary**: Nouveau `components/auth/TenantMagicLinkFlow.tsx` : après `signInWithOtp`, écran saisie OTP (6 cases, collage, auto-vérification, renvoi avec cooldown) via `verifyOtp` (`email` puis repli `magiclink`) ; **inscription** enchaîne formulaire profil (civilité, prénom, nom, téléphone, cases à cocher, CGU) puis `updateUser` métadonnées ; **connexion** redirige après OTP. Ancien `MagicLinkPanel` retiré de `app/login/page.tsx`.
- **files**: [`components/auth/TenantMagicLinkFlow.tsx`, `app/login/page.tsx`, `docs/ACTIONS_LOG.md`]
- **why**: Alignement UX sur un parcours premium multi-étapes ; le code affiché dans l’e-mail nécessite le template Supabase avec `{{ .Token }}`.
- **impact**: Parcours locataire plus explicite ; métadonnées enrichies après inscription.
- **verify**: `npx tsc --noEmit` OK.

---

## 2026-03-27T23:45:00Z | type: ui | Cursor — Lien magique : connexion vs inscription visuellement distincts
- **agent**: `cursor`
- **summary**: `MagicLinkPanel` : bloc contextuel (titres « Déjà client » / « Nouveau compte », fond et bordure différents, textes + liste à puces en mode inscription), champ optionnel prénom/nom uniquement à l’inscription (`user_metadata` via `signInWithOtp` `data`), champ email stylé différemment en inscription ; `emailRedirectTo` avec `encodeURIComponent(redirectTo)`.
- **files**: [`app/login/page.tsx`, `docs/ACTIONS_LOG.md`]
- **why**: Connexion et inscription ne changeaient qu’un libellé alors que le flux OTP est le même — besoin de feedback visuel et fonctionnel clair.
- **impact**: L’utilisateur voit immédiatement le mode actif ; le nom peut être enregistré côté Supabase pour les nouveaux comptes.
- **verify**: `npx tsc --noEmit` OK.

---

## 2026-03-27T22:30:00Z | type: ui+security | Cursor — Inscription propriétaire fonctionnelle (Supabase `signUp`)
- **agent**: `cursor`
- **summary**: Panneau mot de passe `/login` : onglets Connexion / Inscription, `supabase.auth.signUp` (email, mot de passe, confirmation), nom optionnel en `user_metadata`, redirection email via `/auth/callback`, message si confirmation email requise, affichage/masquage mots de passe, validation longueur minimale et messages d’erreur lisibles. Route `/register` → `/login?tab=signup`. Lien « S’inscrire » vers `/register`.
- **files**: [`app/login/page.tsx`, `app/register/page.tsx`, `docs/ACTIONS_LOG.md`, `docs/logs/2026-03-27.md`]
- **why**: L’inscription n’était pas distincte de la connexion par mot de passe ; besoin d’un parcours d’inscription réel.
- **impact**: Les propriétaires peuvent créer un compte ; selon la config Supabase (confirmation email), session immédiate ou email de validation.
- **verify**: `npx tsc --noEmit` OK.

---

---

## 2026-04-04 — HomeAudienceGate (/)
Nouveau composant `HomeAudienceGate` : écran de choix d'audience (voyageur / propriétaire) au premier chargement. sessionStorage `dn_home_audience`. Overlay glassmorphism z-40, focus trap, Escape + skip. Dispatch `diamant-reveal-booking` pour voyageur, `router.push('/proprietaires')` pour proprio.

---

## 2026-04-08T14:50:19Z | type: api | Cursor — Copilot propriétaire (owner-assistant)

- **agent**: `cursor`
- **summary**: Migration `owner_alerts` + `ai_action_logs` (RLS). Module `lib/owner-assistant-context.ts` (portfolio, aujourd’hui, alertes, filtrage `owner_id`). Route `GET/POST /api/dashboard/owner-assistant` (Bearer JWT, log `ai_action_logs`, n8n optionnel `N8N_OWNER_WEBHOOK_URL`). Page `app/dashboard/proprio/assistant/page.tsx` : snapshot GET + chat POST, plus d’appel à `/api/admin/chat`.
- **files**: [`supabase/migrations/20260408180000_owner_alerts_ai_action_logs.sql`, `lib/owner-assistant-context.ts`, `app/api/dashboard/owner-assistant/route.ts`, `app/dashboard/proprio/assistant/page.tsx`, `docs/ACTIONS_LOG.md`, `docs/logs/2026-04-08.md`]
- **why**: MVP copilot scoped propriétaire, traçabilité, pas de contexte global admin.
- **impact**: Propriétaires utilisent uniquement l’API dédiée ; appliquer la migration Supabase pour alertes/logs persistants.
- **verify**: `npm run build` OK.

