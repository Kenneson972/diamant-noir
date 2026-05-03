# ACTIONS_LOG — PessÓra

Journal append-only des actions majeures (features, migrations, sécurité, UI, config).
Format : `ISO` · `type` · résumé · fichiers · vérif.

---

## 2026-05-03

### 2026-05-03T · ui · Accueil — restauration layout éditorial (Timeline Cursor) + persistance Git

- **Contexte** : une version non commitée de `Home.tsx` avait été écrasée ; la **Timeline locale Cursor** contenait encore un snapshot (`~/Library/Application Support/Cursor/User/History/70e9343/5U7a.tsx`, voir `entries.json` du même dossier) avec hero vidéo, `HomeProductCarousel`, `OraPlusTeaserStrip`, `HomeGoogleReviews`, `publicAssetWithCache` pour la carte Communauté.
- **Summary** :
  - `Home.tsx` — réintégration de cette version + `useEffect` pour `document.title` + flèches carrousel en `onPress` (HeroUI v3).
- **Why** : ne plus dépendre uniquement de l’historique machine ; version figée dans Git + trace écrite.
- **Files** : `src/pages/Home.tsx`, `docs/ACTIONS_LOG.md` (détail session aussi appendé dans `docs/logs/2026-05-03.md` — dossier `docs/logs` ignoré par le `.gitignore` du dépôt racine `~`, donc non commité là-bas)
- **Verify** : `npx tsc --noEmit` OK, `npm run build` OK

### 2026-05-03T · ui · Refonte page Gammes (NosProduits) + HeaderSubNav Segment HeroUI Pro

- **Contexte** : redesign complet de `/nos-produits` — layout éditorial alterné image/texte (comme Concept/Événements), retrait des produits de la page principale, sous-nav header migrée vers Segment HeroUI Pro centré. Suite à critique design : retrait des numéros de collection, renforcement section finale, shimmer loading, `from-noir` pour le gradient overlay.
- **Summary** :
  - `NosProduits.tsx` — réécriture complète : sections alternées avec `flex-row-reverse`, badges thématiques, compteur produits, CTA "Découvrir la collection" avec hover lift, `sizes` attribute, shimmer `animate-pulse`, ancres `id="collection-{id}"` pour scroll natif
  - `HeaderSubNav.tsx` — remplacement de l'ancienne sous-nav scrollable (chevrons, overflow-x-auto) par un Segment HeroUI Pro centré avec navigation vers les pages collection + scroll vers ancres depuis la page d'ensemble
  - `RangeDetail.tsx` — bouton "Renseignements" passe en `<Link>` vers `/nos-produits/:rangeId/:slug`
  - `headerNav.ts` — `SUBNAV_PRODUITS` remis en direct links (pas d'ancre)
- **Why** : la page était jugée "moche" par l'utilisateur ; besoin d'une expérience éditoriale premium cohérente avec le reste du site
- **Files** : `src/pages/NosProduits.tsx`, `src/components/layout/HeaderSubNav.tsx`, `src/pages/RangeDetail.tsx`, `src/data/headerNav.ts`, `docs/ACTIONS_LOG.md`, `docs/logs/2026-05-03.md`
- **Verify** : `npm run build` → OK (warnings CSS HeroUI uniquement)

### 2026-05-03T · feat · Pages détail produit (GammeProductDetail) + slug helper

- **Contexte** : implémentation des pages de détail pour les produits individuels dans les gammes, suite à redesign des gammes. Route : `/nos-produits/:rangeId/:slug`.
- **Summary** :
  - `src/lib/toSlug.ts` — nouveau helper : slugify (NFD + remove diacritics + lowercase + hyphens)
  - `src/lib/getGammeProduct.ts` — nouveau helper : lookup produit par rangeId + slug (fallback static)
  - `src/pages/GammeProductDetail.tsx` — nouvelle page : breadcrumb, split hero image/info, sélecteur quantité, add-to-cart avec `useCart`, caractéristiques, cross-sell, final CTA
  - `src/App.tsx` — route lazy `/nos-produits/:rangeId/:slug` avant `/nos-produits/:rangeId`
- **Why** : permettre aux visiteurs d'explorer chaque produit d'une gamme en détail avant achat
- **Files** : `src/pages/GammeProductDetail.tsx` (créé), `src/lib/toSlug.ts` (créé), `src/lib/getGammeProduct.ts` (créé), `src/App.tsx`
- **Verify** : `npm run build` → OK (après cleanup variables inutilisées)

### 2026-05-03T · feat · Tailles et prix dans DrinkDetail

- **Contexte** : les boissons au menu ont des prix par taille (`price_small`, `price_medium`, `price_large`) mais `DrinkDetail.tsx` n'utilisait qu'un seul `drink.price`. Ajout d'un sélecteur de taille avec calcul dynamique du prix.
- **Summary** :
  - `DrinkDetail.tsx` — ajout state `selectedSize`, sélecteur visuel small/medium/large, calcul `sizeBasePrice`, mise à jour de tous les appels `buildDrinkCartOptions` avec `sizePrice`
  - `src/lib/cartLine.ts` — `buildDrinkCartOptions` accepte `sizePrice?: number` optionnel
- **Why** : aligner le détail produit sur les prix réels par taille affichés dans le menu
- **Files** : `src/pages/DrinkDetail.tsx`, `src/lib/cartLine.ts`
- **Verify** : `npm run build` → OK

### 2026-05-03T · fix · Stripe double slash redirect / redirection commande annulée/succès + Edge Function siteUrl

- **Contexte** : retour Stripe vers `http://localhost:3000//commande/annulee` (double slash). Cause racine : `SITE_URL` potentiellement avec trailing slash dans l'Edge Function.
- **Summary** :
  - Frontend : `CommandeAnnulee.tsx` + `CommandeSucces.tsx` — refonte design complète (breadcrumb, typo, CTA) + `useEffect` correcteur d'URLs à double slash (`//commande/annulee` → `/commande/annulee`)
  - Backend : `supabase/functions/create-checkout-session/index.ts` — strip trailing slash sur `siteUrl`
  - `CartDrawer.tsx` — fix `isLoading` → `isDisabled` (HeroUI v3 ne supporte pas `isLoading`)
- **Why** : les retours Stripe échouaient sur la redirection à cause du double slash
- **Files** : `src/pages/CommandeAnnulee.tsx`, `src/pages/CommandeSucces.tsx`, `supabase/functions/create-checkout-session/index.ts`, `src/components/cart/CartDrawer.tsx`
- **Verify** : `npm run build` → OK

### 2026-05-03T · ui · Déplacement CTA Rejoindre Óra+ du Hero vers section Privilèges

- **Contexte** : demande utilisateur de déplacer le CTA "Rejoindre Óra+" du Hero vers une autre partie de la page, pour que l'utilisateur découvre d'abord les avantages avant la conversion.
- **Summary** :
  - `OraPlus.tsx` — retrait du bouton "Rejoindre Óra+" (primaire) du Hero, ne garde que "En savoir plus"
  - Ajout d'un nouveau bloc CTA "Rejoindre Óra+" juste après les 4 cartes Privilèges, avec sous-texte "30 jours satisfait ou remboursé · Sans engagement" et gestion `subError`
- **Why** : améliorer le parcours utilisateur en plaçant la proposition de conversion après la démonstration des bénéfices
- **Files** : `src/pages/OraPlus.tsx`
- **Verify** : `npm run build` → OK

### 2026-05-03T · fix · Requête AdminOverview — colonne capacity inexistante

- **Contexte** : erreur 400 sur la requête Supabase `events` dans `AdminOverview.tsx`. La colonne `capacity` n'existe pas dans la table `events`, le nom correct est `places_max`.
- **Summary** : correction du `.select()` et du type attendu dans `Promise.all` + `.map()`
- **Files** : `src/pages/admin/AdminOverview.tsx`
- **Verify** : `npm run build` → OK

### 2026-05-03T · feat · Page Mes bilans dans l'espace membre

- **Contexte** : le lien "Bilans bien-être" dans la sidebar membre redirigeait vers la page publique `/bilan-bien-etre`. Besoin d'une vraie page intégrée à l'espace membre avec historique + réservation simplifiée (champs pré-remplis).
- **Summary** :
  - `src/pages/member/MesBilans.tsx` (nouveau) — page complète avec stats (confirmés/en attente), historique chronologique (date tile, statut visuel, bouton annuler), et réservation simplifiée (calendrier + créneaux, formulaire allégé avec nom/prénom/téléphone/email pré-remplis depuis le profil, seulement notes + checkbox RGPD)
  - `src/App.tsx` — ajout route `{ segment: 'bilans', element: <MesBilans /> }` dans `MEMBER_ROUTE_SEGMENTS`
  - `MemberLayout.tsx` — lien sidebar passe de `/bilan-bien-etre` à `${prefix}/bilans`
  - `Dashboard.tsx` — correction des perks Óra+ (retrait "2 bilans/mois offerts", alignement sur les vrais bénéfices)
- **Design doc** : `docs/superpowers/specs/2026-05-03-member-bilans-design.md`
- **Plan** : `docs/superpowers/plans/2026-05-03-member-bilans.md`
- **Why** : offrir une expérience réservation cohérente dans l'espace membre, sans avoir à quitter le dashboard
- **Files** : `src/pages/member/MesBilans.tsx` (créé), `src/App.tsx`, `src/components/member/MemberLayout.tsx`, `src/pages/member/Dashboard.tsx`, `docs/superpowers/specs/2026-05-03-member-bilans-design.md`, `docs/superpowers/plans/2026-05-03-member-bilans.md`
- **Verify** : `npm run build` → OK (0 erreur TS)

## 2026-04-26

### 2026-04-26T10:30 · security · RLS event registrations (public insert + proper policy)

- **Contexte** : les inscriptions aux événements (page publique) et le wizard post-inscription (survey) échouaient en prod à cause de RLS trop restrictive. Deux migrations appliquées.
- **Summary** :
  - `20260426120000_event_registrations_rls_public_insert.sql` — policy `Anyone can insert event_registrations` avec `USING true` puis `WITH CHECK (true)`, plus `(user_id IS NULL OR user_id = auth.uid())`. Grant `INSERT, SELECT` sur `public.event_registrations` au rôle `anon`.
  - `20260426123000_cleanup_event_registrations_rls.sql` — correction : supprime la policy trop large, la remplace par `WITH CHECK (true)` uniquement. Supprime les grants `INSERT`/`SELECT` redondants (déjà hérités via `public`). Rétablit le comportement par défaut de Supabase (RLS activée, pas de `USING` en lecture = ligne vide pour anon = safe).
- **Impact** : les utilisateurs non connectés peuvent désormais s'inscrire à un événement et répondre au questionnaire post-inscription sans erreur RLS 42501.
- **Verify** : testé en local via API directe Supabase → insert OK, select anon retourne 0 ligne (RLS respectée).
