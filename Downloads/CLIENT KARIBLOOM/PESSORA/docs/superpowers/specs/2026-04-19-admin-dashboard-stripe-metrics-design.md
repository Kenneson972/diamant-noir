# Admin dashboard — produits Supabase, membres éditables, Stripe, métriques

**Date :** 2026-04-19  
**Statut :** Spécification validée côté produit (itérations brainstorming : RLS dashboard appliquée, source produits = A, membres = B + Stripe + agrégats).

## 1. Objectifs

- Corriger l’écart **prix sur le site vs liste admin vide** : le site doit consommer **`public.products`** comme source de vérité en production.
- Rendre l’**admin membres** actionnable : édition **profil** (prénom, nom, téléphone) et **abonnement** (plan, statut — champs existants sur `subscriptions`).
- **Préparer Stripe** : lier les comptes aux IDs Stripe (clients / abonnements existants + futurs webhooks).
- **Exposer des métriques** par membre et au niveau dashboard : bilans, commandes / boissons, abonnement.

## 2. Prérequis (déjà validés)

- Migration type `docs/supabase_migration_dashboard.sql` **déjà appliquée** : fonction `is_admin()`, policies lecture/écriture admin sur `profiles` et `subscriptions`.
- En cas de liste membres encore incorrecte : vérifier côté exécution (requête, erreurs réseau) et **données** (`first_name` / `last_name` souvent null si non saisis à l’inscription).

## 3. Produits — source de vérité Supabase

- **Lecture publique** : Menu, fiche boisson, recherche — alimentés par **`products`** (filtres `active`, catégorie, etc. selon schéma).
- **`menuData.ts`** : réservé au **fallback** (dev hors ligne, tests) ou supprimé après bascule ; pas de double vérité en prod.
- **Bootstrap** : fournir un **script SQL** ou un flux admin « import initial » aligné sur le référentiel actuel (noms, prix, catégories, champs nutritionnels, `active`).
- **Schéma** : aligner les colonnes front avec `Product` (`ingredients`, `benefits`, `active`, etc.) ; migrations si écart avec une ancienne table vide.

## 4. Admin membres (périmètre B)

### 4.1 Affichage

- Colonne **Membre** : `first_name` + `last_name` ; si les deux vides → afficher **email** (et éventuellement téléphone) pour éviter les cellules vides.
- Colonnes existantes : email, plan, statut abonnement, date d’inscription.

### 4.2 Actions

- **Édition profil** : `first_name`, `last_name`, `phone` sur `profiles` (updates via client authentifié admin, conformes RLS).
- **Édition abonnement** : `plan`, `status`, `end_date`, `auto_renew`, `price` sur `subscriptions` (ligne unique par `user_id` — respecter la contrainte `unique(user_id)`).
- **Hors périmètre v1** : promotion `role` admin depuis l’UI (traiter dans une itération sécurisée avec audit) ; **notes internes** membre (nouvelle colonne) — optionnel plus tard.

### 4.3 UX

- Panneau latéral ou ligne dépliante avec formulaire + **Enregistrer / Annuler**.
- Retour utilisateur explicite (succès / erreur serveur ou RLS).

## 5. Stripe — préparation et synchronisation

### 5.1 Modèle de données

- **`subscriptions`** : déjà `stripe_subscription_id` ; compléter par **`stripe_customer_id`** si stocké au niveau abonnement, ou **`profiles.stripe_customer_id`** (choisir **un seul** lieu canonique pour le customer — recommandation : **profiles** pour tout lien client, **subscriptions** pour l’abonnement récurrent).
- Optionnel : `stripe_price_id` pour tracer le prix Stripe utilisé.

### 5.2 Données existantes (hors site)

- **Backfill manuel ou script ponctuel** : associer `user_id` / email aux **customer** et **subscription** Stripe existants (one-shot, documenté, exécuté par un admin technique).
- Aucune exposition de **secret** Stripe côté navigateur ; toute synchro « live » avec l’API Stripe = **Edge Function** ou backend avec `STRIPE_SECRET_KEY`.

### 5.3 Webhooks (phase suivante, décrite ici pour alignement)

- Endpoints typiques : `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid` (selon modèle de facturation).
- Effet attendu : mettre à jour `subscriptions.status`, `end_date`, et éventuellement `plan` si mappé depuis Stripe.

## 6. Métriques — collecte et affichage

### 6.1 Par membre (dans admin membres ou fiche détail)

- **Bilans** : nombre de lignes dans **`bilan_bookings`** où `user_id` = id membre (exclure annulés si besoin métier).
- **Boissons / CA** : agrégats sur **`orders`** + **`order_items`** (quantités, montants) pour `user_id` ; si commandes encore peu utilisées, afficher 0 avec message explicite.
- **Abonnement** : lecture directe depuis **`subscriptions`**.

### 6.2 Vue d’ensemble (`/admin`)

- KPIs v1 : nombre de membres, abonnements actifs par plan (agrégation SQL), bilans sur période, commandes sur période — implémentation par **requêtes** ou **vue SQL** matérialisée si volume augmente.

## 7. Approche retenue (trade-offs)

- **Métriques** : agrégations à la demande / vues SQL (**approche pragmatique**), pas de table `user_stats` ni triggers tant que le volume ne l’exige pas.
- **Stripe** : colonnes + backfill + webhooks planifiés ; pas de dépendance à un outil BI externe pour le MVP.

## 8. Risques et sécurité

- Vérifier les policies **INSERT** sur `subscriptions` si création depuis l’admin (aujourd’hui souvent trigger à l’inscription uniquement).
- Ne jamais utiliser **`user_metadata`** seul pour le rôle admin (déjà le cas : `profiles.role`).
- Valider les mises à jour d’abonnement pour éviter les incohérences avec Stripe une fois les webhooks actifs.

## 9. Ordre d’implémentation suggéré

1. Schéma + seed **`products`** + bascule lecture menu public vers Supabase.  
2. RLS / erreurs admin produits ; liste stable.  
3. Admin membres : affichage robuste + édition profil + édition subscription.  
4. Colonnes Stripe + documentation backfill.  
5. KPIs dashboard + détail métriques par membre.  
6. Webhooks Stripe (Edge Function) + tests.

## 10. Hors scope (v1)

- Notes internes CRM sur le membre.  
- Promotion / révocation admin depuis l’UI.  
- Synchronisation bidirectionnelle temps réel avec Stripe sans webhooks.
