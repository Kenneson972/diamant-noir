# Actes techniques — DIAMANTNOIR

> Journal des actions techniques significatives. Chaque entrée suit le format défini dans `kb-action-documentation.mdc`.

---

## 2026-05-01 — Correction routage admin (RBAC login + middleware)

- **type**: `api | security | config`
- **summary**: Correction du routage post-login pour que les admins atterrissent bien sur `/admin` et non `/dashboard`. Mise en place d'un fallback via `STAFF_ADMIN_EMAILS` dans `.env.local`.
- **files**: [`lib/auth/admin-access.ts`, `middleware.ts`, `app/(admin)/admin/layout.tsx`, `app/login/page.tsx`, `app/auth/callback/route.ts`, `components/auth/TenantMagicLinkFlow.tsx`, `.env.local.example`, `docs/ACTIONS_LOG.md`]
- **why**: Back-office semblait inaccessible (callback auth + rôle DB).
- **impact**: Accès `/admin` prévisible ; secours par variable d’environnement.
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
  3. **Placeholder villa hub proprio** — gradient + icône au lieu d’une image 404 (`dashboard/proprio/page.tsx`).
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
