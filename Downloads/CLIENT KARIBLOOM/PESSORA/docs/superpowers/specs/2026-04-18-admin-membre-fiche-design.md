# Design — Fiche membre admin (lecture + édition)

**Date :** 2026-04-18  
**Contexte :** Un seul opérateur admin ; pas besoin de workflows multi-admin ou d’audit avancé en v1. Priorité sur la **fiche membre** avant la refonte UI des bilans.

## Décisions produit validées

1. **Navigation :** liste `/admin/membres` (cartes) → clic → page dédiée **`/admin/membres/:memberId`** (pas de drawer).
2. **E-mail :** **affiché en lecture seule** ; modification = hors application (ex. tableau Supabase Auth / procédure manuelle). Afficher une phrase d’aide discrète.
3. **Stripe :** aucun appel API Stripe depuis le navigateur ; champs `stripe_subscription_id` (et futurs IDs client) **affichés en lecture seule** pour repérage.

## Objectif

Permettre à l’admin de **voir** l’identité et l’abonnement d’un membre et d’**éditer** le profil (nom, téléphone) et l’abonnement (plan, statut, dates, prix, renouvellement) sans quitter une interface claire et stable (refresh, lien direct).

## Options techniques (chargement de la fiche)

| Option | Description | Retenu ? |
|--------|-------------|----------|
| A | **`select` par `id`** au montage : `profiles` + `subscriptions` (nested ou jointure) | **Oui** — deep links, refresh, source de vérité serveur |
| B | Données passées via **state du routeur** depuis la liste | Non — casse F5 et partage d’URL |
| C | **Cache** type React Query | Non nécessaire pour un seul admin en MVP |

## Architecture UI

- **Composant page** : `AdminMemberDetail` (ex. `src/pages/admin/AdminMemberDetail.tsx`).
- **Route** : sous `/admin`, enfant du layout admin existant :  
  `path="/admin/membres/:memberId"`.
- **Liste** : chaque carte (ou bouton « Ouvrir ») utilise `<Link to={/admin/membres/${id}}>` ou `useNavigate`.

### Structure de la page (ordre vertical)

1. **Barre de contexte** : lien « ← Membres », titre = nom affiché (ou e-mail si nom vide).
2. **Bloc identité (lecture)** : e-mail (non éditable) + texte d’aide ; optionnel : `id` avec bouton copier.
3. **Bloc profil (édition)** : `first_name`, `last_name`, `phone` — champs alignés sur le design system existant (labels uppercase tracking, inputs `rounded-[2px]`).
4. **Bloc abonnement (édition + lecture)** :  
   - Éditable : `plan` (select), `status`, `start_date`, `end_date`, `auto_renew`, `price` (nombre).  
   - Lecture seule : `stripe_subscription_id`, `created_at` / `updated_at` de la ligne si utile au debug.
5. **Actions** : au minimum deux actions d’enregistrement distinctes — **Enregistrer le profil** et **Enregistrer l’abonnement** — pour limiter les effets de bord et clarifier les erreurs RLS.

### États

- Chargement : squelette cohérent avec le reste de l’admin.
- Membre introuvable ou non autorisé : message clair + lien retour.
- Succès : message non bloquant (toast ou bandeau) après `update`.
- Erreur : message explicite (ex. politique RLS, validation).

## Données et contrats

- **Source** : table `public.profiles` et `public.subscriptions` (une ligne d’abonnement par `user_id` selon le schéma actuel du projet).
- **Champs profil** : alignés sur `src/types/database.ts` — pas d’`email` dans le type `Profile` si l’e-mail vit ailleurs en base ; à l’implémentation, **vérifier la source réelle** (colonne `profiles.email` vs vue vs autre) et documenter dans le code si besoin. L’affichage reste **lecture seule** dans tous les cas.
- **Validation côté client** : champs requis raisonnables (ex. téléphone format souple) ; pas de logique Stripe.

## Sécurité (RLS)

- **Profil** : la migration documentée `docs/supabase_migration_dashboard.sql` prévoit déjà `UPDATE` sur `profiles` pour les admins (`is_admin()`).
- **Abonnements** : vérifier en production qu’une politique autorise **`UPDATE` (et si besoin `INSERT`) sur `subscriptions` pour `is_admin()`**. Si seul le `SELECT` existe, **ajouter une migration** (fichier dans `supabase/migrations/`) avant de livrer l’édition abonnement depuis l’app.

## Hors périmètre (rappel)

- Promotion / révocation du rôle **admin** depuis l’UI.
- Notes internes CRM sur le membre.
- Modification de l’e-mail depuis l’application.
- Intégration Stripe temps réel (webhooks, Edge Functions).
- **Refonte de l’interface Bilans / créneaux** : lot séparé, après cette fiche.

## Suite (hors brainstorming)

Après validation de ce document : rédiger un **plan d’implémentation** (tâches ordonnées : migration RLS si besoin → route → page → tests manuels → revue).
