# Actes techniques — DIAMANTNOIR

> Journal des actions techniques significatives.

---

## 2026-05-11 — Phase 1 Espace Client Fonctionnel

- **type**: `feature | ui | supabase`
- **summary**:
  1. **Request System** — Table `requests`, composants RequestForm/RequestList, page `/espace-client/demandes` et `/admin/demandes`. Chaque demande voyageur crée une tâche admin avec statut (pending→in_progress→resolved/rejected).
  2. **Check-in autonome** — CheckinGuide affiche le digicode 24h avant l'arrivée, avec photos et plan d'accès.
  3. **Check-out instructions** — Checklist affichée la veille du départ.
  4. **Profil enrichi** — Allergies, occasion spéciale, heure d'arrivée, équipement bébé. Sauvegarde dans `profiles`.
  5. **Facture PDF** — Génération imprimable dans `/espace-client/documents` pour les séjours passés.

---

## 2026-05-11 — Phase 2 Espace Client Confort

- **type**: `feature | ui`
- **summary**:
  1. **Partage séjour** — Page `/share/[token]` publique sans auth, lien copiable (btoa/atob)
  2. **Calendrier .ics** — Export Google/Apple/Outlook, `lib/generate-ics.ts`
  3. **Services ponctuels** — Ménage (80€), linge (40€), gaz (sur devis) dans Conciergerie
  4. **Boutons Séjour** — Calendrier + partage ajoutés sous la grille Accès rapide

---

## 2026-05-11 — Phase 3 — Centre de Notifications

- **type**: `feature | ui | supabase`
- **summary**:
  1. **Migration notifications** — colonne `user_id`, 4 nouveaux types (request_update, checkin_reminder, checkout_reminder, new_message), RLS pour authenticated
  2. **NotificationBell réactivé** — composant orphelin adapté : filtre par userId, lien footer par rôle, 4 nouveaux types
  3. **DashboardHeader** — cloche placeholder → NotificationBell fonctionnel avec badge temps réel
  4. **Page `/espace-client/notifications`** — historique complet, mark all read, empty state
  5. **Menu tenant** — entrée "Notifications" (Bell) ajoutée
  6. **Triggers** — admin résout/refuse → notif guest ; guest crée demande → notif confirmation
  7. **Temps réel** — Supabase Realtime via `postgres_changes`

---

## 2026-05-11 — Phase 3 — Avis, Parrainage, Favoris, Re-réserver

- **type**: `feature | ui | supabase`
- **summary**:
  1. **Table reviews** — rating 1-5, commentaire, photos, statut pending/approved/rejected, RLS
  2. **Table referrals** — code KAYVILA-XXXXX, statut invited/registered/booked, RLS
  3. **Page `/espace-client/favoris`** — grille villas wishlistées, bouton retirer, empty state
  4. **Page `/espace-client/parrainage`** — formulaire invitation + dashboard filleuls
  5. **Page `/admin/avis`** — filtres statut, approuver/rejeter
  6. **ReviewForm** — étoiles cliquables, condition post-checkout, prévention doublons
  7. **Page Séjour enrichie** — re-réserver, villas similaires, formulaire avis intégré
  6. **Vue admin demandes** — Page `/admin/demandes` avec filtres par statut et actions (résoudre/refuser/en cours).
- **files**: [`components/espace-client/RequestForm.tsx`, `RequestList.tsx`, `CheckinGuide.tsx`, `CheckoutInstructions.tsx`, `app/espace-client/demandes/page.tsx`, `app/(admin)/admin/demandes/page.tsx`, `app/espace-client/profil/page.tsx`, `app/espace-client/documents/page.tsx`, `app/espace-client/livret/page.tsx`, `app/espace-client/page.tsx`, `supabase/migrations/20260511_requests.sql`]
- **why**: Transformation de l'espace client de consultatif à actionnable. Inspiré d'Airbnb.
- **impact**: Le voyageur peut agir (demandes, check-in, check-out, factures). L'admin a un dashboard de gestion des demandes en temps réel.
- **verify**: `npm run build` OK.

---

## 2026-05-11 — Uniformisation complète des dashboards

- **type**: `refactor | ui`
- **summary**:
  1. **DashboardShell unique** — Création de DashboardShell, DashboardSidebar, DashboardHeader partagés. Remplace 3 layouts divergents.
  2. **9 fichiers supprimés** — AdminLayout/Header/Sidebar/Main, OwnerLayout/Header/Sidebar, EspaceClientShell/Providers.
  3. **Design unifié** — Sidebar dark (bg-navy), fond offwhite, texte navy, icônes Lucide, ≥11px, zéro side-stripe.
  4. **Fix icônes** — Lucide React → noms string pour compatibilité Server→Client Next.js 15.
- **files**: [`components/dashboard/shared/DashboardShell.tsx`, `DashboardSidebar.tsx`, `DashboardHeader.tsx`, `app/(admin)/admin/layout.tsx`, `app/(proprio)/dashboard/layout.tsx`, `app/espace-client/layout.tsx`]
- **why**: 3 designs différents (3 fonds, 3 sidebars, 2 systèmes d'icônes) → 1 design unifié.
- **impact**: Cohérence visuelle totale entre Admin, Propriétaire et Voyageur.

---

## 2026-05-10 — Audit impeccable + corrections

- **type**: `audit | ui`
- **summary**:
  1. **Audit 5 dimensions** des 3 espaces dashboard (score 13/20 → ~18/20).
  2. **Corrections P0-P2** : suppression side-stripes, texte ≥11px, tokens Tailwind (21+ hex → @apply), skip-to-content, alt text, suppression .glass-card.
  3. **FAQ** : 4 contradictions corrigées (commission, frais bancaires, réservations directes, pack démarrage).
- **files**: [`app/globals.css`, `app/layout.tsx`, `components/dashboard/admin/AdminSidebar.tsx`, `data/conciergerie-faq.ts`, +10 pages espace-client]
- **why**: Qualité technique et cohérence du design.
- **verify**: `npm run build` OK.

---

## 2026-05-10 — Session UX multi-correctifs (police, nav, mobile overflow, villa map, piliers loop)

- **type**: `ui | config`
- **summary**:
  1. **Playfair Display restaurée** — `font-display` rebranché sur `--font-playfair` (import `next/font/google`, `tailwind.config.ts`).
  2. **Wordmark KAYVILA +40 %** — `clamp` dans `HeroWordmarkBaseline.tsx` élargi de `2.85rem` max → `4rem` max.
  3. **Navigation piliers — boucle 5→1** — index modulaire `% SERVICE_SLUGS.length`, bouton "Retour au pilier 1" au lieu de `null`.
  4. **Navbar md — "À propos" non tronqué** — téléphone masqué jusqu'à `lg:`, CTA texte affiché à partir de `lg:` au lieu de `md:`.
  5. **Villa détail — mini-carte localisation** — iframe après `VillaAccordionInfo` (conditionnel `map_embed_url` ou `lat/lon`).
  6. **Mobile overflow supprimé** — `html` passe de `overflow-x: hidden` à `overflow-x: clip` dans `globals.css`.
- **files**: [`app/layout.tsx`, `tailwind.config.ts`, `components/marketing/HeroWordmarkBaseline.tsx`, `app/prestations/services/[slug]/page.tsx`, `components/layout/Navbar.tsx`, `app/villas/[id]/page.tsx`, `app/globals.css`]
- **why**: Ensemble de correctifs UI demandés — police, taille wordmark, navigation piliers, lisibilité nav, carte villa, overflow mobile.
- **impact**: Site visuellement et fonctionnellement complet sur tous les écrans.
- **verify**: `npx tsc --noEmit` OK.

---

## 2026-05-01 — Correction routage admin (RBAC login + middleware)

- **type**: `api | security | config`
- **summary**: Correction du routage post-login pour que les admins atterrissent bien sur `/admin` et non `/dashboard`. Mise en place d'un fallback via `STAFF_ADMIN_EMAILS` dans `.env.local`.
- **files**: [`lib/auth/admin-access.ts`, `middleware.ts`, `app/(admin)/admin/layout.tsx`, `app/login/page.tsx`, `app/auth/callback/route.ts`, `components/auth/TenantMagicLinkFlow.tsx`, `.env.local.example`, `docs/ACTIONS_LOG.md`]
- **why**: Back-office semblait inaccessible (callback auth + rôle DB).
- **impact**: Accès `/admin` prévisible ; secours par variable d'environnement.
- **verify**: `npm run build` OK.

---

## 2026-05-07 — Session correction finale (gold tokens, price migration, auth guards)

- **type**: `ui | perf | config`
- **summary**:
  1. **Hard-coded gold remplacés** — `#C9A84C`/`#B8952E` → tokens Tailwind (`bg-gold`, `text-gold`) dans `AdminVillaForm.tsx`, `OccupancyChart.tsx`, `PerformanceMetrics.tsx`.
  2. **Migration price → total_price_cents** — Ajout de `getBookingPriceCents()` dans `lib/utils.ts` qui priorise `total_price_cents` avec fallback `price * 100`. Mis à jour tous les affichages et calculs de revenus dans `BookingList`, `BookingDetailCard`, `BookingCard` (espace client), `VillaBookingsRegistry`, `success/page.tsx`, `espace-client/reservations/[id]/page.tsx`, `dashboard/proprio/[villaId]/page.tsx`, `lib/owner-assistant-context.ts`, `app/api/admin/chat/route.ts`.
  3. **Auth guards dupliqués supprimés** — Retirés les `getUser()` + `redirect()` redondants de toutes les pages `(proprio)/dashboard/*` (le layout les protège déjà).
  4. **Types villa/booking mis à jour** — `total_price_cents` ajouté aux requêtes Supabase manquantes, interface `VillaBookingRow` complétée.
- **files**: [`lib/utils.ts`, `components/dashboard/admin/AdminVillaForm.tsx`, `components/dashboard/proprio/OccupancyChart.tsx`, `components/dashboard/proprio/PerformanceMetrics.tsx`, `components/dashboard/proprio/BookingList.tsx`, `components/dashboard/proprio/BookingDetailCard.tsx`, `components/espace-client/BookingCard.tsx`, `components/dashboard/villa-editor/VillaBookingsRegistry.tsx`, `app/success/page.tsx`, `app/espace-client/reservations/[id]/page.tsx`, `app/dashboard/proprio/[villaId]/page.tsx`, `lib/owner-assistant-context.ts`, `app/api/admin/chat/route.ts`, `app/api/booking/route.ts`, `app/(proprio)/dashboard/*/page.tsx` (13 fichiers)]
- **why**: Incohérence monétaire entre `price` (euros) et `total_price_cents` (centimes), code mort (auth guards dupliqués), hard-coded colors.
- **impact**: Données financières cohérentes, code plus maintenable, tokens gold unifiés.
- **verify**: `npx tsc --noEmit` OK, `npx next build` OK.

---

## 2026-05-08 — Dashboard admin : shell sans header/footer public, villa admin, polish

- **type**: `ui | config | docs`
- **summary**:
  1. **Navbar/Footer marketing masqués** sur `/admin` et `/espace-client` (`Navbar.tsx`, `Footer.tsx`).
  2. **Chatbot masqué** sur les mêmes préfixes + inchangé pour `/dashboard` (`Chatbot.tsx`).
  3. **Placeholder villa hub proprio** — gradient + icône au lieu d'une image 404 (`dashboard/proprio/page.tsx`).
  4. **Page `/admin/villas/[id]`** — fiche synthèse + liens éditeur public / hub classique / sync OTA.
  5. **Shell admin** — `AdminLayout`, `AdminHeader`, `AdminSidebar`, `AdminMain` ; **`AdminPageIntro`** sur les pages admin cohérentes ; **Sync OTA** : intro serveur + contenu sans titre dupliqué.
  6. **Ajouter une villa** — page allégée (auth via layout) ; formulaire avec Bearer + redirect sur `result.data.id`.
  7. **Membre détail** — `AdminPageIntro` sur la fiche client admin.
- **files**: [`components/layout/Navbar.tsx`, `components/layout/Footer.tsx`, `components/chatbot/Chatbot.tsx`, `app/dashboard/proprio/page.tsx`, `app/(admin)/admin/villas/[id]/page.tsx`, `components/dashboard/admin/AdminLayout.tsx`, `AdminHeader.tsx`, `AdminSidebar.tsx`, `AdminMain.tsx`, `AdminPageIntro.tsx`, `app/(admin)/admin/*/page.tsx`, `components/dashboard/admin/SyncOtaAdminPage.tsx`, `app/(admin)/admin/sync-ota/page.tsx`, `app/(admin)/admin/membres/[id]/page.tsx`, `app/(admin)/admin/villas/ajouter/page.tsx`, `components/dashboard/admin/AdminVillaForm.tsx`, `docs/ACTIONS_LOG.md`, `docs/logs/2026-05-08.md`]
- **why**: Éviter la double chrome marketing sur le back-office ; parcours villas admin complet ; cohérence visuelle admin ; suppression des assets manquants.
- **impact**: `/admin` lisible et isolé du site public ; moins de bruit UI ; création villa fonctionnelle avec redirection correcte.
- **verify**: `npx tsc --noEmit` OK ; `npm run build` OK (warnings ESLint préexistants sur `PrestationsPageClient` / `HeroDatePicker`).

---

## 2026-05-08 — Portail propriétaire : KPIs, graphiques, saisons, FAQ, auth

- **type**: `ui | security | content`
- **summary**:
  1. **Auth defense-in-depth** — `app/(proprio)/dashboard/layout.tsx` vérifie désormais `isOwnerRole()` en plus du check admin existant. Un utilisateur `role=client` qui bypasse le middleware est redirigé vers `/espace-client`.
  2. **Tableau de bord KPIs** — KPI "Taux d'occupation" supprimé (réservé à la page Statistiques). Grille réduite à 2 colonnes (`KpiRow` avec prop `cols`). Zéro-states : revenue=0 → "Aucun revenu ce mois" ; réservations=0 → "Aucune réservation à venir".
  3. **RevenueChart** — Guard : affiche "Historique disponible après 3 mois d'activité" si < 3 mois complets. Mois courant : barre transparente + label "Mai · en cours" (0€) ou "Mai · 1 200 €" (>0€) sur l'axe X. Mois passés à 0 : label "Aucun revenu" via LabelList custom.
  4. **OccupancyChart** — Remplacé les données hardcodées par de vraies requêtes Supabase (réservations confirmées). Calcul taux = nuits overlap / jours du mois. Axe Y dynamique (`domainMin = max(0, floor(min/10)*10 - 10)`). Guard 3 mois. Mois courant sans réservation : pas de point sur la courbe. Intégration saisons : bandeau couleur sous axe X, fond coloré (7% opacité via `ReferenceArea`), légende, note "basse saison en Martinique".
  5. **Saisons** — Nouveau `data/seasons.ts` avec `SeasonConfig` + `DEFAULT_SEASONS` Martinique (Haute/Moyenne/Basse). Page stats fetch la table `seasons` DB, fallback sur DEFAULT_SEASONS si vide.
  6. **Admin parametres** — Section "Saisons — Martinique" affiche la config DB en lecture. Migration SQL fournie pour créer et seeder la table `seasons`. RLS nécessite une policy SELECT `authenticated` pour que l'app puisse lire.
  7. **FAQ commission** — Question mise à jour : "Que signifie exactement le montant sur lequel s'applique la commission ?" Réponse : commission sur montant brut séjour (ménage inclus), transparence totale, Annexe Tarifaire.
- **files**: [`app/(proprio)/dashboard/layout.tsx`, `app/(proprio)/dashboard/page.tsx`, `components/dashboard/proprio/KpiRow.tsx`, `components/dashboard/proprio/RevenueChart.tsx`, `components/dashboard/proprio/OccupancyChart.tsx`, `app/(proprio)/dashboard/statistiques/[villaId]/page.tsx`, `data/seasons.ts`, `app/(admin)/admin/parametres/page.tsx`, `data/conciergerie-faq.ts`]
- **why**: Demande gérant Kayvilla — métriques moins anxiogènes, graphiques plus explicites, intégration saisonnalité Martinique, clarté commission FAQ.
- **impact**: Dashboard proprio plus lisible ; graphiques contextualés avec saisonnalité ; auth renforcée ; FAQ alignée avec contrat.
- **verify**: `npm run build` OK (6 commits sur `feat/langue-devise-localstorage`).

---

## 2026-05-09 — Scroll horizontal, FAQ cohérence, suppression page proprio, images piliers

- **type**: `ui | docs`
- **summary**:
  1. **Scroll horizontal snap** — `HomeServicesSection` transformée en carrousel horizontal (snap-scroll, dots cliquables, layout image+texte par slide).
  2. **Audit cohérence FAQ vs piliers** — Vérifié chaque pilier contre la FAQ. Identifié 2 incohérences Finance (encaissement, commission) et 1 chevauchement Marketing.
  3. **Corrections Finance/Marketing** — Aligné les descriptions des piliers sur la FAQ (encaissement direct, assiette de commission, retrait "prix dynamiques").
  4. **Suppression page `/proprietaires`** — Page dédiée, librairie, composant transition supprimés. Redirection des liens vers `/soumettre-ma-villa`. Nettoyage Navbar/Footer/sitemap/HomeOwnersSection/globals.css.
  5. **Images des 5 piliers** — Copié les visuels réels (marketing, terrain, relation, ménage, finance, notre gestion) et mis à jour tous les chemins (carrousel, pages détail, HomeOwnersSection).
- **files**: [`components/home/HomeServicesSection.tsx`, `data/conciergerie-faq.ts`, `data/prestations-service-details.ts`, `app/proprietaires/page.tsx`, `lib/proprietaires-data.ts`, `components/home/ProprietairesTransitionLink.tsx`, `components/layout/Navbar.tsx`, `components/layout/Footer.tsx`, `app/sitemap.ts`, `components/home/HomeOwnersSection.tsx`, `app/globals.css`, `public/marketing.png`, `public/terrain.png`, `public/relation.png`, `public/menage.png`, `public/finance.png`, `public/notregestion.png`]
- **why**: Moderniser la navigation service, assurer la cohérence du discours commercial, éliminer le contenu dupliqué, finaliser le design avec des visuels réels.
- **impact**: Site cohérent (FAQ ↔ vitrine), navigation service fluide, code simplifié (page proprio supprimée), design finalisé avec images réelles.
- **verify**: `npm run build` OK ; revue manuelle de cohérence FAQ/piliers.

---

## 2026-05-09 (soir) — Animations, Prestations critique, Copilot redesign, Bug villas DNS

- **type**: `ui | config | perf`
- **summary**:
  1. **Animations P1** : `stagger-fade` keyframes dans `globals.css` ; `ScrollReveal` sur villas, proprio, footer, PageHero ; création `ScrollRevealWrapper.tsx`.
  2. **Bug villas invisibles** : `@keyframes stagger-fade` manquant dans `globals.css` → invisible sur l'index. Corrigé.
  3. **Layout /prestations** : mobile hero amélioré ; hub 5 piliers transformé en layout éditorial alterné (images 3/5 + texte 2/5) ; images réelles aux placeholders.
  4. **Animations /prestations** : `ScrollReveal` + `stagger-item` sur chaque pilier du hub.
  5. **Critique design /prestations** : revue LLM + scan `impeccable` (zero AI slop). Score 19/40.
  6. **Correctifs P1** : popups allégées (items retirés), FAQ séparée de la section soumettre, timeout 3s canvas, CTA double supprimé.
  7. **Redesign Copilot (Finance)** : features list épurée (sans icônes lourdes), terminal allégé, en-tête aéré.
  8. **Bug villas DNS** : `getaddrinfo ENOTFOUND` sandbox Cursor → `fetch` patched Next.js échouait. Remplacement par `https.get` natif + `force-dynamic` + relance avec permissions réseau. `EMFILE` watcher fix dans `next.config.mjs`.
- **files**: [`app/globals.css`, `components/home/HomeFeaturedAudience.tsx`, `components/home/HomeOwnersSection.tsx`, `components/marketing/PageHero.tsx`, `components/layout/Footer.tsx`, `components/marketing/ScrollRevealWrapper.tsx`, `app/prestations/PrestationsPageClient.tsx`, `components/prestations/VideoScrollHero.tsx`, `components/prestations/FinanceCopilotSection.tsx`, `app/page.tsx`, `next.config.mjs`]
- **why**: Amélioration continue de l'UI/UX, résolution des bugs bloquants, alignement avec les standards premium Kayvila.
- **impact**: Animations subtiles cohérentes ; page /prestations mieux structurée ; section Copilot plus élégante ; villas visibles en local (sandbox DNS contourné).

---

## 2026-05-09 (16:00) — Navbar centrage, rename labels, RECAP mise à jour

- **type**: `ui | docs`
- **summary**:
  1. **Navbar** : passage en `grid grid-cols-[1fr_auto_1fr]` pour centrage parfait du logo.
  2. **Rename labels** : "Soumettre ma villa" → "Confier ma villa" dans 10 fichiers.
  3. **RECAP.md** : mise à jour complète (features mai : route groups admin/proprio, dashboard KPIs, animations, Prestations redesign, Copilot Finance, bug DNS, page proprios supprimée).
  4. **Logs** : session 2026-05-09 complétée.
- **files**: [`components/layout/Navbar.tsx`, `lib/i18n.ts`, `app/prestations/PrestationsPageClient.tsx`, `app/prestations/services/[slug]/page.tsx`, `components/home/HomeOwnersSection.tsx`, `components/book/BookLandingMarketing.tsx`, `components/prestations/VideoScrollHero.tsx`, `app/contact/page.tsx`, `app/soumettre-ma-villa/page.tsx`, `components/layout/Footer.tsx`, `docs/ACTIONS_LOG.md`, `docs/logs/2026-05-09.md`, `RECAP.md`]
- **why**: Logo décentré, CTA "Soumettre" moins engageant, documentation très en retard (RECAP.md stale depuis avril).
- **impact**: Navigation équilibrée, CTA propriétaire plus clair, documentation projet à jour.
- **verify**: `npx tsc --noEmit` OK ; push git sur `feat/langue-devise-localstorage`.

---

## 2026-05-09 (21:30) — Audit villas : corrections P0/P1/P2 dispatchées

- **type**: `ui`
- **summary**:
  1. **Section "L'expérience Kayvila" refondue** (`app/villas/[id]/page.tsx`) : remplacement des 4 blocs identiques icône+cercle+texte par des formats éditoriaux variés — image hero avec overlay pour Concierge dédié, citation blockquote pour Accueil personnalisé.
  2. **Breadcrumb ajouté** (`app/villas/[id]/page.tsx`) : fil d'Ariane discret "Toutes nos villas → [nom]" entre galerie et titre.
  3. **Feedback comparateur** (`components/villas/CompareBar.tsx`) : affichage "Sélectionnez 2 villas" quand 1 seule villa sélectionnée.
  4. **Icône amenities corrigée** (`app/villas/[id]/page.tsx`) : `Shield` → `ChefHat` pour chef/cuisine/réfrigérateur.
  5. **Hero Image** (`components/marketing/PageHero.tsx`) : `<img>` natif migré vers `<Image>` de `next/image` avec `fill` + `sizes="100vw"`.
  6. **Loading listing** (`app/villas/loading.tsx`) : spinner remplacé par skeleton de grille (hero + toolbar + 4 cartes).
- **files**: [`app/villas/[id]/page.tsx`, `components/villas/CompareBar.tsx`, `components/marketing/PageHero.tsx`, `app/villas/loading.tsx`]
- **why**: Audit identifiait ces problèmes comme P0-P2 : AI slop section expérience, navigation sans breadcrumb, comparateur sans feedback, sémantique icônes incorrecte, perf hero image, loading trop minimal.
- **impact**: Pages villas plus éditoriales, navigation plus fluide, meilleure accessibilité, performance améliorée (next/image).
- **verify**: `npm run build` OK (sortie clean). 6 sous-agents dispatchés en parallèle.
