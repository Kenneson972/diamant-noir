# Actions Log

Journal des changements notables (qui / quoi / pourquoi). Les entrées peuvent préciser l’agent :

| Champ | Valeurs typiques |
|--------|------------------|
| **agent** | `cursor` — modifications depuis Cursor IDE · `claude` — session **Claude Code** (CLI terminal) |
| **session** | Détail du jour : `docs/logs/YYYY-MM-DD.md` (section *Claude Code* si besoin) |

> **Astuce :** après une session Claude Code, ajouter une entrée ici **et** un bloc dans `docs/logs/<date>.md` sous `### Claude Code` pour garder l’historique lisible.

---

## 2026-03-31T21:05:00Z | type: ui+config | Cursor — Retrait Chakra/HeroUI, espace client sur Radix+Tailwind
- **agent**: `cursor`
- **summary**: Suppression de `@heroui/react` et `@chakra-ui/react` (et assets CSS HeroUI) ; migration des routes `/espace-client` (layout, pages, components) vers `components/ui` + HTML/Tailwind ; retrait de `optimizePackageImports` pour HeroUI et de l’injection CSS globale. Fix lint/hooks sur `WelcomeBook` + correction syntaxe `SearchResults`.
- **files**: [`app/layout.tsx`, `next.config.mjs`, `app/espace-client/layout.tsx`, `app/espace-client/head.tsx`, `app/espace-client/page.tsx`, `app/espace-client/messagerie/page.tsx`, `app/espace-client/profil/page.tsx`, `app/espace-client/reservations/[id]/page.tsx`, `components/espace-client/*`, `components/booking/SearchResults.tsx`, `components/chatbot/Chatbot.tsx`, `package.json`, `package-lock.json`]
- **why**: Uniformiser la stack UI sur Radix + Tailwind, éliminer la dette multi-lib et éviter les fuites CSS / divergences visuelles.
- **impact**: UI plus cohérente et maintenable ; bundle allégé (suppression 2 libs UI) ; `/espace-client` reste premium sans dépendance HeroUI.
- **verify**: `npm run build` OK.
- **session**: `docs/logs/2026-03-31.md`

---

## 2026-03-31T21:06:00Z | type: ui | Cursor — Nettoyage assets HeroUI
- **agent**: `cursor`
- **summary**: Suppression des fichiers `public/heroui.min.css` et `public/heroui-v3.min.css` devenus inutiles après la migration de `/espace-client`.
- **files**: [`public/heroui.min.css`, `public/heroui-v3.min.css`]
- **why**: Éviter des assets morts et toute tentation de réintroduction implicite de HeroUI.
- **impact**: Repo plus propre, moins d’ambiguïté sur la stack UI.
- **verify**: `npm run build` OK.
- **session**: `docs/logs/2026-03-31.md`

---

## 2026-03-31T21:15:00Z | type: docs | Cursor — Mise à jour récap projet
- **agent**: `cursor`
- **summary**: Mise à jour du récap global (`RECAP.md`) et alignement du `README.md` sur l’état actuel (Next 15/React 19, UI unifiée Radix+Tailwind, espace client, fiche villa data-driven, note calendrier).
- **files**: [`RECAP.md`, `README.md`]
- **why**: Garder une vue projet fiable pour onboarding, décisions UI et état réel du repo.
- **impact**: Documentation plus exacte, décisions UI figées noir sur blanc.
- **verify**: Relecture + cohérence avec `docs/ACTIONS_LOG.md` et `docs/logs/2026-03-31.md`.
- **session**: `docs/logs/2026-03-31.md`

---

## 2026-03-31T21:28:00Z | type: docs+ui+config | Claude Code (terminal) — Récap actions session
- **agent**: `claude`
- **summary**: Actions opérées via terminal (Claude Code) durant la session : nettoyage dépendances UI (retrait Chakra/HeroUI), régénération lockfile (`npm install`), builds de validation (`npm run build`) et relance du serveur local, plus corrections associées (fallback villas → 404/empty state, styles calendrier disponibilité, corrections lint/syntaxe).
- **files**: [`package.json`, `package-lock.json`, `next.config.mjs`, `app/layout.tsx`, `app/villas/page.tsx`, `app/villas/[id]/page.tsx`, `components/booking/AvailabilityCalendar.tsx`, `components/booking/SearchResults.tsx`, `components/espace-client/*`, `components/chatbot/Chatbot.tsx`, `README.md`, `RECAP.md`, `docs/logs/2026-03-31.md`]
- **why**: Assurer traçabilité “terminal Claude Code” demandée (audit), et garantir stabilité via build/dev répétés après refactors UI.
- **impact**: Historique complet des actions terminal, build vert, environnement local relancé.
- **verify**: `npm run build` OK ; `npm run dev -- -p 3000` OK.
- **session**: `docs/logs/2026-03-31.md`

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
