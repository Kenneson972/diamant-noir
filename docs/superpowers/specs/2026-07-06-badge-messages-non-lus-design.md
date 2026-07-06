# Badge messages non lus — sidebar admin & propriétaire

## Problème

L'admin doit ouvrir manuellement la page Messages pour découvrir qu'un propriétaire ou un locataire lui a écrit — aucun signal visible ailleurs dans le dashboard. Le propriétaire a le même problème pour les réponses de l'admin : le seul indicateur existant est un petit point doré sur l'onglet « Notre équipe », invisible tant qu'on n'a pas déjà ouvert la page « Mon concierge ».

## Solution

Étendre le mécanisme de badge de sidebar déjà en place (`applyMenuBadges` + `badgeMap`, utilisé aujourd'hui pour Réservations/Tâches/Soumissions/Avis) avec deux comptages supplémentaires, calculés côté serveur à chaque chargement de layout — même pattern que l'existant, aucune nouvelle infrastructure.

### Côté admin — `app/(admin)/admin/layout.tsx`

Le badge sur l'entrée sidebar « Messages » (`/admin/messages`) passe de :
```
demandes urgentes non résolues
```
à :
```
demandes urgentes non résolues
+ messages propriétaires non lus (owner_messages, sender_role='owner', read_at is null)
+ messages locataires non lus (tenant_messages, sender_role='guest', read_at is null)
```
Un seul chiffre agrégé, car les trois catégories vivent sous les onglets de la même page Messages (Propriétaires / Locataires / Demandes).

### Côté propriétaire — `app/(proprio)/dashboard/layout.tsx`

Nouveau badge sur l'entrée sidebar « Mon concierge » (`/dashboard/concierge`) :
```
réponses admin non lues pour ce propriétaire
(owner_messages, owner_id = user.id, sender_role='admin', read_at is null)
```
Calcul identique à celui déjà fait dans `app/(proprio)/dashboard/concierge/page.tsx` pour le point doré de l'onglet — dupliqué intentionnellement au niveau layout (pas de couche de cache partagée introduite, cohérent avec le reste du codebase où chaque badge est recalculé indépendamment).

## Ce qui ne change pas

- Le point doré sur l'onglet « Notre équipe » (`ConciergeTabs`) reste tel quel — il indique *quel* onglet contient du nouveau une fois déjà sur la page, ce qui est complémentaire au badge sidebar (qui prévient *avant* d'y aller), pas redondant.
- Aucune ligne insérée dans la table `notifications` — la cloche du header (`NotificationBell`) n'est pas concernée par ce changement, elle reste dédiée aux notifications système (soumissions, litiges, digests).
- Aucune migration RLS nécessaire : les policies `owner_messages_select_admin`, `tenant_messages_select_admin`, `owner_messages_select_owner` existantes autorisent déjà ces comptages via le client Supabase authentifié standard (`getSupabaseServer()`), pas besoin du client service-role.

## Edge cases

- Propriétaire sans conversation ou admin sans message en attente → count = 0 → `applyMenuBadges` masque déjà le badge quand la valeur est ≤ 0 (comportement existant, pas de changement nécessaire).
- Propriétaire sans villa (`ownerVillaIds.length === 0`) : le calcul du badge concierge est indépendant du calcul des villas — il n'a pas besoin de villa_id, seulement du profil owner_id, donc ce cas n'affecte pas ce badge.

## Fichiers modifiés

- `app/(admin)/admin/layout.tsx` — ajout de 2 requêtes de comptage dans le `Promise.all` existant, ajustement de la valeur `/admin/messages` dans `badgeMap`.
- `app/(proprio)/dashboard/layout.tsx` — ajout d'1 requête de comptage, ajout de l'entrée `/dashboard/concierge` dans `badgeMap`.

## Tests

- Vérification manuelle en navigateur (Playwright) : envoyer un message propriétaire → admin voit le badge incrémenté sur « Messages » après navigation ; envoyer une réponse admin → propriétaire voit le badge sur « Mon concierge ».
- Pas de test automatisé dédié prévu (cohérent avec les badges existants Réservations/Tâches qui n'ont pas de couverture de test spécifique).
