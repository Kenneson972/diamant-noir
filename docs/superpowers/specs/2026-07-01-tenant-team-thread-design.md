# Design — Fil de relation humaine locataire "Notre équipe"

Date : 2026-07-01
Origine : suite directe du projet "Hub relation propriétaire" (même jour) — Kenneson a demandé le même traitement côté locataire.

## Contexte et découverte

Le hub "Mon concierge" côté propriétaire (livré et mergé plus tôt le même jour) donnait au propriétaire un vrai fil de discussion à deux sens avec l'équipe Kayvila, séparé du chatbot IA. Kenneson a demandé la même chose côté locataire.

**Exploration avant conception** — deux découvertes ont changé le périmètre initial :

1. **Le "chatbot IA locataire" n'est pas fonctionnel.** `TenantChatbot.tsx` (page `espace-client/messagerie`) appelle bien `/api/chat/tenant`, qui route vers `N8N_TENANT_WEBHOOK_URL` avec fallback sur `N8N_WEBHOOK_URL` (le webhook de l'Agent A visiteur/marketing — donc un contexte totalement inadapté à un locataire en séjour) ou, si aucune variable n'est configurée, affiche un message de démo statique. Confirmé en listant `docs/n8n/` : seuls 3 workflows existent (`agent-a-visiteur`, `agent-b-proprietaire`, `agent-c-admin`), aucun agent locataire. Décision : ce projet ne construit PAS d'agent IA locataire (chantier séparé, futur). La page `messagerie` locataire est donc remplacée entièrement par le nouveau fil humain, pas organisée en 2 onglets comme côté propriétaire.

2. **Règle absolue posée par Kenneson : aucune relation directe locataire ↔ propriétaire.** Le nouveau fil est strictement locataire ↔ admin Kayvila, comme `owner_messages` est strictement propriétaire ↔ admin. Le propriétaire n'a et n'aura aucun accès à ce fil ; le locataire ne voit jamais les coordonnées ou l'identité du propriétaire dans l'échange (au mieux, le nom de la villa concernée, à titre de contexte).

Côté admin, l'onglet "Locataires" de la page unifiée `/admin/messages` (livrée le même jour) affiche aujourd'hui les logs du chatbot non fonctionnel (`session_id`/`role`/`content`, table de chat voyageur). Décision : cet onglet change de source de données pour afficher le nouveau fil humain, sans changer son nom ni sa position dans la navigation.

## Architecture

### Côté locataire — page `espace-client/messagerie` devient "Notre équipe"

Écran unique (pas d'onglets, contrairement au propriétaire) : le rendu de `TenantChatbot` est retiré de cette page. Le composant `TenantChatbot.tsx` et la route `/api/chat/tenant` restent dans le code, simplement plus affichés — récupérables si un Agent D locataire est construit plus tard.

Header :
```tsx
<h1 className="font-display text-xl text-navy">Notre équipe</h1>
<p className="mt-1 text-[11px] text-navy/50">
  Une question, un besoin pendant votre séjour ? Écrivez-nous, on vous répond sous 24h.
</p>
```

**Contenu, dans l'ordre :**

1. **Carte d'accueil** : "Bonjour {prénom}", "Une question ? Un besoin ? C'est ici que ça se passe.", badge "✅ Équipe disponible — réponse sous 24h", bouton d'appel `tel:+596696681869`.
2. **Actions rapides** (3 boutons) : Signaler un problème / Mon séjour / Autre demande — pré-remplissent le sujet et scrollent jusqu'à la zone de saisie.
3. **Fil de messages** :
   - Sélecteur de sujet : Problème / Mon séjour / Ma réservation / Autre
   - Bulles locataire : fond navy, texte blanc
   - Bulles équipe Kayvila : fond doré + badge "Kayvila"
   - Message non lu de l'équipe : bordure gauche dorée
   - Badge de statut sur chaque message envoyé par le locataire : 🟡 Envoyé / 🟢 Lu par l'équipe / ✅ Répondu
   - État vide : "Vous n'avez pas encore échangé avec nous. C'est le bon moment !"
   - Compteur de caractères, placeholder "Dites-nous tout — on est là pour vous aider..."
   - Realtime Supabase sur `tenant_messages`
   - Pas de sélecteur de séjour/villa (contrairement au propriétaire qui peut avoir plusieurs villas) : résolution du `booking_id` identique à ce que fait déjà `DemandesPage` (première réservation confirmée/en attente, non terminée, du locataire connecté)

### Modèle de données — nouvelle table `tenant_messages`

| Colonne | Type | Notes |
|---|---|---|
| `id` | uuid, PK | |
| `guest_id` | uuid, NOT NULL | FK `auth.users`, locataire concerné (`auth.uid()`) |
| `booking_id` | uuid, nullable | FK `bookings`, séjour concerné — contexte uniquement (ex. afficher le nom de la villa côté admin), jamais utilisé pour relier au propriétaire |
| `subject` | text | `probleme` \| `sejour` \| `reservation` \| `autre` |
| `content` | text | |
| `sender_role` | text | `'guest'` \| `'admin'` |
| `sender_id` | uuid | utilisateur auteur du message |
| `read_at` | timestamptz, nullable | quand l'autre partie a lu ce message précis — même sémantique symétrique qu'`owner_messages` |
| `created_at` | timestamptz | |

**Statut calculé** (non stocké), identique à `owner_messages` : 🟡 Envoyé (`read_at IS NULL`) / 🟢 Lu par l'équipe (`read_at` renseigné, aucun message admin après) / ✅ Répondu (un message `sender_role='admin'` existe après, même `guest_id`).

RLS : locataire ne voit que ses lignes (`guest_id = auth.uid()`), admin voit tout via `public.is_staff_admin()` (convention établie, cf. projet propriétaire). **Contrairement au projet propriétaire, le trigger `BEFORE UPDATE` restreignant les updates locataire à `read_at` uniquement est inclus dès la migration initiale** (pas en correctif après-coup — leçon tirée de la review finale du projet précédent).

Règle absolue : aucune policy, aucune vue, aucun code ne doit permettre à un `owner_id` (propriétaire) de lire ou écrire dans `tenant_messages`, ni l'inverse.

### Côté admin — onglet "Locataires" (contenu remplacé, position/nom inchangés)

`components/dashboard/admin/AdminTravelerChatPanel.tsx` (même nom de fichier, même emplacement dans `AdminMenuItems.ts` et dans la page `/admin/messages`) : sa logique interne est réécrite pour lire `tenant_messages` au lieu de `/api/admin/messages` (logs chatbot). Structure identique à `AdminOwnerMessagesPanel.tsx` : liste des locataires groupés par `guest_id`, triée par dernier message, réponse admin (insert `sender_role:'admin'` + marque `read_at` sur les messages locataire non lus du fil), affichage du nom de la villa concernée (via `booking_id`) à titre de contexte — jamais les coordonnées ou l'identité du propriétaire.

L'ancien code lisant `/api/admin/messages` est retiré de ce composant. La route API et la table de chat voyageur sous-jacentes ne sont PAS supprimées (pas touchées) — elles restent disponibles si un Agent D locataire est construit plus tard et qu'on souhaite les réintégrer ailleurs.

## Tests

- **Vitest** : réutilisation de la logique de `getOwnerMessageStatus` (`lib/messages/status.ts`). **Précision technique (trouvée en auto-review de cette spec)** : cette fonction est aujourd'hui typée pour accepter `OwnerMessageRow[]`, dont `sender_role: "owner" | "admin"` — un `TenantMessageRow` (`sender_role: "guest" | "admin"`) n'y est pas structurellement assignable tel quel. La fonction elle-même n'utilise que `sender_role`, `created_at` et `read_at` (jamais `owner_id`) : son paramètre doit donc être élargi à une forme structurelle minimale du type `{ sender_role: string; created_at: string; read_at: string | null }`, satisfaite par `OwnerMessageRow` ET `TenantMessageRow` sans casser les appels existants côté propriétaire. Pas de renommage de fonction nécessaire, uniquement un élargissement de signature — à traiter comme une tâche du plan (modifier `lib/messages/status.ts` + son test existant reste valide sans changement).
- **Playwright** :
  - Locataire envoie un message → apparaît côté admin (onglet Locataires)
  - Admin répond → statut du message locataire passe à "Répondu", badge non-lu apparaît sur "Notre équipe" côté locataire
  - Actions rapides pré-remplissent bien le sujet
  - **Vérification explicite de la règle absolue** : un compte propriétaire n'a aucun moyen d'accéder à `tenant_messages` (test RLS négatif : requête directe avec un JWT propriétaire sur la table échoue/retourne vide)

## Migration / rollout

- Nouvelle migration unique : table `tenant_messages` + RLS (4 policies : select/insert locataire, select/insert admin, update locataire, update admin) + trigger de restriction UPDATE + activation Realtime — tout en une seule migration (pas de correctif en deux temps comme pour `owner_messages`)
- `app/espace-client/messagerie/page.tsx` : retrait du rendu de `TenantChatbot`, remplacé par le nouveau composant de fil
- `TenantChatbot.tsx` et `app/api/chat/tenant/route.ts` : conservés dans le code, non supprimés, simplement non rendus sur cette page
- `AdminTravelerChatPanel.tsx` : réécriture du contenu interne uniquement (nom de fichier, export, et entrée dans `AdminMenuItems.ts`/page `/admin/messages` inchangés)
- Aucun changement sur `AdminMenuItems.ts` (l'onglet "Locataires" existe déjà)
- Aucun changement sur `owner_messages`, `requests`, ou tout autre schéma existant

## Hors périmètre

- Construction d'un Agent D (chatbot IA locataire réel via n8n) — chantier séparé, futur, non traité ici.
- Notifications proactives automatiques dans le fil (déjà différé côté propriétaire dans le projet précédent, même logique ici).
- Toute forme de canal de communication direct locataire ↔ propriétaire — explicitement exclu par règle absolue.
