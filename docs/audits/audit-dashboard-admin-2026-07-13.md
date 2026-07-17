# Audit dashboard admin / staff Kayvila — 2026-07-13

> **Diagnostic uniquement — aucun correctif appliqué, aucun fichier modifié.**
> Environnement : local (dev 3001), code du repo + base Supabase prod (`wsdawdxucyuyopkpgjij`).
> Compte utilisé : `admin@diamantnoir.com` (rôle `admin`).
> Périmètre : toutes les pages `/admin/*` (le dashboard proprio `/dashboard` et l'espace client
> avaient déjà été couverts ou le sont ailleurs). Comble l'angle mort de
> l'audit préprod du 2026-07-11 (`docs/audits/audit-preprod-2026-07-11.md`), qui ne
> couvrait pas l'admin interne.

## Méthode

- Cartographie des routes admin dans le code (`app/(admin)/admin/*`, middleware RBAC, layout guard).
- Navigation réelle Playwright sur chaque page, avec relevé des erreurs console et réseau.
- Test fonctionnel des actions clés (messagerie, concierge IA, éditeur villa).
- Revue de code ciblée sur la protection des routes (middleware + API).

## Synthèse

**Le dashboard admin est globalement sain et fonctionnel.** 20+ pages testées, la
majorité sans erreur console. Les données sont réelles et cohérentes (4 villas, 8
réservations, 3 propriétaires, 4 clients, revenus calculés correctement). La
**sécurité RBAC est solide** (double barrière middleware + API). Trois familles de
problèmes ressortent : (1) le **Concierge IA admin est cassé** en local, (2) **2 villas
sur 4 ont un `name` corrompu** issu de l'import Airbnb, visible partout dans l'admin,
(3) une **image fallback manquante** génère des erreurs 400. Aucun bloquant P0 propre à
l'admin ; les vrais bloquants go-live (Stripe live, publication des villas) sont déjà
suivis ailleurs.

## Tableau de bord des trouvailles

| # | Priorité | Zone | Problème |
|---|----------|------|----------|
| 1 | 🟠 P1 | `/admin/concierge` | Concierge IA admin répond « Désolé, problème technique » — chaîne n8n non fonctionnelle |
| 2 | 🟠 P1 | Données villas (transverse) | 2 villas sur 4 ont un `name` = résumé concaténé (« Appartement · Le Lamentin · ★4,89 · … ») |
| 3 | 🟡 P2 | `/admin/villas` (transverse) | Image fallback `/images/villa-hero.jpg` absente → erreur 400 `_next/image` |
| 4 | 🟡 P2 | `/admin/villas` | Image Airbnb importée morte (404 `a0.muscache.com`) |
| 5 | 🟡 P2 | Middleware | Redirection transitoire `/admin/*` → `/villas` au premier hit (race refresh token) |
| 6 | 🟢 P3 | Sidebar admin (transverse) | Warnings a11y react-aria « Expandable tree items must contain a expand button » |
| 7 | 🟢 P3 | `/admin/*` | 4 villas sur 4 « Non publiée » — rappel go-live (déjà suivi), catalogue public vide |

---

## Détail par priorité

### 🟠 P1 — #1 Concierge IA admin non fonctionnel

- **Page** : `/admin/concierge` (« Concierge IA — supervision globale »).
- **Constat** : la page se charge proprement, la conversation démarre (« Bonjour, je
  suis Diamant… »). En envoyant une question de lecture simple (« Combien de
  réservations confirmées ce mois ? »), après ~22 s la réponse est :
  **« Désolé, problème technique. Réessayez. »**
- **Cause (revue de code — `app/api/concierge/admin/route.ts:129-132`)** : ce message
  est le fallback `catch` du `fetch` vers n8n (`request_id: "fallback"`). Il se
  déclenche quand l'appel n8n throw ou renvoie un statut non-2xx. Comme la réponse
  n'est **pas** « Mode démo » (ligne 80), la variable `N8N_ADMIN_WEBHOOK_URL` **est**
  configurée en local — donc l'échec vient soit du webhook n8n (down / 401 sur
  `X-Webhook-Secret`), soit du timeout 22 s (`route.ts:94`), soit de
  `buildAdminAgentPayload` qui throw.
- **Impact** : c'est une fonctionnalité destinée à Richard/l'équipe au quotidien
  (poser des questions, piloter prix / blocages / soumissions). Elle est
  actuellement inutilisable dans cet environnement.
- **Réserve** : impossible depuis le local de trancher entre « n8n prod down » et
  « bug applicatif ». La mémoire projet note déjà que **les bots B (proprio) et C
  (admin) n'ont jamais été validés en conditions réelles** (seul le bot A public l'est).
  À vérifier avant bascule : le workflow n8n admin est-il déployé, actif, et le
  `N8N_WEBHOOK_SECRET` du repo correspond-il à celui du nœud « IF - Secret OK ? » ?
- **Recommandation** : tester le webhook n8n admin directement (POST avec le header
  `X-Webhook-Secret`) et confirmer que le workflow renvoie bien `{response}` en < 22 s.

### 🟠 P1 — #2 Noms de villas corrompus (données)

- **Constat** : 2 villas sur 4 ont pour `name` **le résumé concaténé de la fiche** au
  lieu d'un vrai nom :
  - `Appartement · Le Lamentin · ★4,89 · Studio · 1 lit · 1 salle de bain`
  - `Bungalow · Fort-de-France · ★4,79 · Studio · 1 lit · 1 salle de bain`
- **Nature** : ce n'est **pas** un bug d'affichage — la valeur est stockée telle
  quelle dans la colonne `villas.name`. Vérifié dans l'éditeur villa : le champ
  `NOM DE LA VILLA *` (input `vf-name`) contient littéralement cette chaîne.
- **Origine probable** : l'import Airbnb a rempli `name` avec un libellé récapitulatif
  au lieu du titre de l'annonce.
- **Portée (transverse)** : la chaîne remonte partout dans l'admin — dashboard
  (activité récente, taux d'occupation), liste villas, réservations, revenus
  (tableaux + ventilation), filtres, et même le `<title>` de l'onglet de la page
  d'édition. C'est le défaut le plus visible du dashboard.
- **Impact** : cosmétique dans l'admin, mais ces 2 villas concentrent **toutes** les
  réservations et revenus réels — si elles étaient publiées, le nom s'afficherait
  côté voyageur. À corriger avant publication.
- **Recommandation** : renommer proprement ces 2 villas (via l'éditeur, le champ est
  éditable et l'autosave fonctionne), et vérifier/corriger le mapping `name` de
  l'import Airbnb pour éviter la récidive.

### 🟡 P2 — #3 Image fallback `/images/villa-hero.jpg` absente

- **Constat** : sur `/admin/villas`, erreur console récurrente
  `400 Bad Request` sur `/_next/image?url=%2Fimages%2Fvilla-hero.jpg&w=96&q=75`.
- **Cause** : le fichier `public/images/villa-hero.jpg` **n'existe pas** (vérifié).
  C'est l'image de repli utilisée pour les villas sans photo valide → le fallback
  lui-même est cassé.
- **Impact** : mineur (vignette manquante dans l'admin), mais bruit console constant
  et vignette vide. Ajouter le fichier manquant, ou pointer le fallback vers un asset
  existant.

### 🟡 P2 — #4 Image Airbnb importée morte (404)

- **Constat** : `404 Not Found` sur une URL `a0.muscache.com/im/pictures/...jpeg`
  proxifiée par `_next/image`.
- **Cause** : le domaine `a0.muscache.com` **est** bien autorisé dans
  `next.config.mjs` (remotePatterns + CSP `img-src`). L'URL elle-même est morte —
  photo Airbnb supprimée depuis l'import. Ce n'est **pas** un problème de config.
- **Impact** : mineur, une vignette manquante. Lié à #2 (données d'import obsolètes).
  À nettoyer lors de la reprise des fiches villas importées.

### 🟡 P2 — #5 Redirection transitoire au premier accès `/admin/*`

- **Constat** : lors de la première navigation vers `/admin/sync-ota`, redirection
  inattendue vers la page publique `/villas`. Un second accès immédiat charge la page
  admin normalement. Observé aussi une fois vers `/admin/villas`.
- **Cause probable** : course dans le middleware sur le rafraîchissement du token
  Supabase (`getUser()` renvoie temporairement `null` pendant un refresh → chute dans
  la branche « pas admin »). Non reproductible de façon déterministe.
- **Impact** : gênant mais non bloquant (un rechargement suffit). À surveiller ; si ça
  se produit en prod, envisager de ne pas rediriger vers `/villas` mais de retenter
  la résolution de session.

### 🟢 P3 — #6 Warnings accessibilité sidebar

- **Constat** : ~8 warnings console par page :
  « Expandable tree items must contain a expand button so screen reader users can
  expand/collapse the item » (react-aria-components, composant Sidebar HeroUI Pro).
- **Impact** : accessibilité lecteur d'écran de la navigation. Non bloquant, mais à
  corriger pour la conformité a11y (déjà noté comme pattern HeroUI dans la mémoire projet).

### 🟢 P3 — #7 Toutes les villas « Non publiée »

- **Constat** : les 4 villas sont marquées « Non publiée » dans l'admin → catalogue
  public vide (explique l'« absence de villas » de l'audit du 11/07).
- **Statut** : ce n'est pas un bug admin, c'est un **rappel go-live** déjà suivi
  côté actions Kenneson (publier les villas de production). Mentionné ici car
  directement visible et actionnable depuis le dashboard admin.

---

## Ce qui fonctionne bien (vérifié)

- **Sécurité RBAC — solide, double barrière** :
  - Middleware (`middleware.ts:192-217`) : redirige tout non-admin hors de `/admin`
    (proprio → `/dashboard`, locataire → `/espace-client`), et inversement empêche un
    admin de rester sur `/dashboard`/`/espace-client`.
  - Layout admin (`app/(admin)/admin/layout.tsx:35-46`) : re-vérifie `isStaffAdmin` et
    redirige, avec `robots: noindex`.
  - **Toutes** les routes `app/api/admin/*` appellent `requireAdmin` qui valide le
    rôle via `profiles.role` et throw 403 (`lib/auth/server.ts:71-95`) — défense en
    profondeur au-delà du middleware.
- **Pages fonctionnelles sans erreur** : dashboard, réservations (filtres + modes
  d'affichage + action Annuler), propriétaires (+ détail, Stripe Connect, commission),
  clients, revenus (KPIs, graphe 12 mois, détail mensuel, ventilation villa/canal,
  export CSV), soumissions, messages (3 onglets, thread, réponse), avis, tarification,
  sync-ota, documents, paramètres, éditeur villa (autosave OK).
- **Cohérence des données financières** : commission 2 228 € + reversement 6 435 € =
  8 663 € brut ; taux 22 % direct correctement appliqué ; 1 seule résa confirmée
  pilote bien tous les agrégats.
- **Messagerie admin** : thread propriétaire chargé, bouton « Envoyer » correctement
  désactivé à vide et activé dès saisie.

---

## Recommandations avant bascule (priorisées)

1. **P1** — Diagnostiquer et réparer le Concierge IA admin (webhook n8n admin :
   déployé ? actif ? secret aligné ?). C'est un outil quotidien de l'équipe.
2. **P1** — Renommer les 2 villas au `name` corrompu et corriger le mapping `name`
   de l'import Airbnb.
3. **P2** — Ajouter l'asset `public/images/villa-hero.jpg` (ou repointer le fallback).
4. **P2** — Nettoyer les URLs d'images Airbnb mortes sur les villas importées.
5. **P3** — Corriger les warnings a11y de la sidebar ; publier les villas de prod
   (go-live, déjà suivi).
