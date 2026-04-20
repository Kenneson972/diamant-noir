# Design — Fiche membre admin (lecture + édition)

**Date :** 2026-04-18 — **Révision :** 2026-04-18 (historique commandes, bilans, événements)  
**Contexte :** Un seul opérateur admin ; pas besoin de workflows multi-admin ou d’audit avancé en v1. Priorité sur la **fiche membre** avant la refonte UI des bilans.

## Décisions produit validées

1. **Navigation :** liste `/admin/membres` (cartes) → clic → page dédiée **`/admin/membres/:memberId`** (pas de drawer).
2. **E-mail :** **affiché en lecture seule** ; modification = hors application (ex. tableau Supabase Auth / procédure manuelle). Afficher une phrase d’aide discrète.
3. **Stripe :** aucun appel API Stripe depuis le navigateur ; champs `stripe_subscription_id` (et futurs IDs client) **affichés en lecture seule** pour repérage.

## Objectif

Permettre à l’admin de **voir** l’identité, l’**activité** du membre (commandes, bilans, événements) et l’**abonnement**, et d’**éditer** le profil (nom, téléphone) et l’abonnement (plan, statut, dates, prix, renouvellement) — le tout sur une page stable (refresh, lien direct). Les blocs d’activité sont **strictement en lecture seule** sur cette page (pas de modification des commandes ou inscriptions depuis la fiche en v1).

## Options techniques (chargement de la fiche)

| Option | Description | Retenu ? |
|--------|-------------|----------|
| A | **`select` par `id`** au montage : `profiles` + `subscriptions`, puis requêtes parallèles pour **commandes**, **bilans**, **inscriptions événements** | **Oui** — deep links, refresh, source de vérité serveur |
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
5. **Bloc commandes (lecture seule)** : liste des **`orders`** où `user_id` = membre, tri **date décroissante**. Pour chaque commande : date, statut, total ; détail des lignes via **`order_items`** (nom produit, quantité, prix). Si aucune commande : message « Aucune commande ».  
6. **Bloc bilans (lecture seule)** : liste des **`bilan_bookings`** où `user_id` = membre, tri **date décroissante** (ou par `date_rdv` / création selon les colonnes réelles). Afficher : date/heure du RDV, **statut** (`en_attente` / `confirme` / `annule`), éventuellement message court si colonne prévue. Si vide : « Aucune réservation bilan ».  
   - *Note réservations sans `user_id`* (invité) : **hors scope v1** sur cette fiche ; liaison par e-mail pourrait être une **v2** si besoin métier.  
7. **Bloc événements (lecture seule)** : lignes dans **`event_registrations`** où `user_id` = membre, avec jointure **`events`** pour afficher **titre**, **date** (et type si utile). Tri date décroissante. Si vide : « Aucune inscription ».  
8. **Actions** : deux boutons d’enregistrement distincts — **Enregistrer le profil** et **Enregistrer l’abonnement** — dans les blocs 3 et 4 (pas dans les blocs historique).

### États

- Chargement : squelette cohérent avec le reste de l’admin.
- Membre introuvable ou non autorisé : message clair + lien retour.
- Succès : message non bloquant (toast ou bandeau) après `update`.
- Erreur : message explicite (ex. politique RLS, validation).

## Données et contrats

- **Source** : table `public.profiles` et `public.subscriptions` (une ligne d’abonnement par `user_id` selon le schéma actuel du projet).
- **Champs profil** : alignés sur `src/types/database.ts` — pas d’`email` dans le type `Profile` si l’e-mail vit ailleurs en base ; à l’implémentation, **vérifier la source réelle** (colonne `profiles.email` vs vue vs autre) et documenter dans le code si besoin. L’affichage reste **lecture seule** dans tous les cas.
- **Commandes** : `orders` filtrées par `user_id` ; `order_items` par `order_id` (select imbriqué ou requête séparée). Types : `Order`, `OrderItem` dans `database.ts`.
- **Bilans** : `bilan_bookings` filtrées par `user_id` ; aligner l’affichage sur les colonnes réelles du dépôt (`date_rdv` / `heure_rdv` vs relation `bilan_slots` si l’UI admin bilan utilise encore la jointure — une seule vérité affichée côté fiche membre).
- **Événements** : `event_registrations` + `events` (foreign key `event_id`) pour titre et date.
- **Chargement** : après chargement profil + abonnement, **requêtes en parallèle** (`Promise.all`) pour les trois historiques ; squelette ou spinners sectionnels acceptables.
- **Validation côté client** : réservée aux blocs éditables (profil, abonnement) ; pas de logique Stripe.

## Sécurité (RLS)

- **Profil** : la migration documentée `docs/supabase_migration_dashboard.sql` prévoit déjà `UPDATE` sur `profiles` pour les admins (`is_admin()`).
- **Abonnements** : vérifier en production qu’une politique autorise **`UPDATE` (et si besoin `INSERT`) sur `subscriptions` pour `is_admin()`**. Si seul le `SELECT` existe, **ajouter une migration** (fichier dans `supabase/migrations/`) avant de livrer l’édition abonnement depuis l’app.
- **Lecture des historiques** : l’admin doit pouvoir **`SELECT`** sur `orders`, `order_items` (via politique sur la table parent ou jointure), `bilan_bookings`, `event_registrations` et `events` pour les lignes concernées. Si une requête échoue en RLS, afficher un message clair sur la section concernée (sans bloquer le reste de la page si possible).

## Hors périmètre (rappel)

- Promotion / révocation du rôle **admin** depuis l’UI.
- Notes internes CRM sur le membre.
- Modification de l’e-mail depuis l’application.
- Intégration Stripe temps réel (webhooks, Edge Functions).
- **Refonte de l’interface Bilans / créneaux** : lot séparé, après cette fiche.
- **Édition** des commandes, réservations bilan ou inscriptions événements **depuis la fiche membre** (la gestion reste sur les écrans dédiés ou le flux métier existant).
- Rattacher à la fiche les réservations **sans `user_id`** (invités) par matching e-mail — **v2** si besoin.

## Suite (hors brainstorming)

Après validation de ce document : rédiger un **plan d’implémentation** (tâches ordonnées : migration RLS si besoin → route → page → tests manuels → revue).
