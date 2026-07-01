# Design — Hub relation propriétaire "Mon concierge" + Messages admin unifiées

Date : 2026-07-01
Origine : `kayvila-prompt-concierge-v2.md` (Richard, via Kenneson)

## Contexte et découverte

La page propriétaire "Mon concierge" (`app/(proprio)/dashboard/concierge/page.tsx`) affiche aujourd'hui uniquement le chatbot IA (`DashboardCopilotChat`). Richard veut en faire un vrai espace de relation humaine, avec un interlocuteur direct, la certitude que les messages sont lus, et un suivi des demandes.

**Exploration du code existant avant conception** — deux systèmes de contact propriétaire→Kayvila coexistent déjà, tous deux partiels :

1. **`OwnerContactFAB`** (bouton flottant global, tout le dashboard proprio) : écrit dans `owner_contact_messages` (owner_id, villa_id, subject, message, created_at, resolved_at), déclenche l'edge function `send-owner-contact` qui envoie un email à `support@kayvila.com`. Sens unique : pas de fil, pas de statut visible côté propriétaire, pas de réponse dans l'app.
2. **`OwnerMessaging`** (composant prévu pour un fil à deux sens, utilisé par la page orpheline `/dashboard/messages`, absente du menu) : interroge une table `messages` — **vérifié absente de la base de données live** (`information_schema.columns` et `list_tables` ne la retournent pas). Code mort.

Côté admin, aucune page ne lit `owner_contact_messages` (juste l'email). Il existe en revanche deux pages fonctionnelles pour d'autres publics :
- `admin/demandes` (table `requests`, écrite par `RequestForm.tsx` côté espace-client locataire) — SLA coloré, filtres statut, assignation équipe.
- `admin/messagerie` (conversations chatbot voyageur, `session_id`/`role`/`content`) — thread + réponse.

Décision prise avec Kenneson : construire un vrai système propriétaire↔admin (nouvelle table, nouvelle inbox admin) plutôt que de rafistoler l'existant, et en profiter pour unifier l'admin en une seule page "Messages" (remplace Demandes + Messagerie) avec un filtre par type de conversation — sans fusionner les schémas de données sous-jacents (trop risqué de toucher `requests`/`chat_messages` utilisés ailleurs).

## Architecture

### Côté propriétaire — page "Mon concierge" à 2 onglets

- **Onglet "Concierge IA"** : inchangé, `DashboardCopilotChat` actuel.
- **Onglet "Notre équipe"** : nouveau fil de discussion à deux sens, remplace `OwnerContactFAB` (supprimé) et `OwnerMessaging`/`/dashboard/messages` (supprimés, code mort).

Header (identique au prompt) :
```tsx
<h1 className="font-display text-xl text-navy">Mon concierge</h1>
<p className="mt-1 text-[11px] text-navy/50">
  Votre conseiller Kayvila — écrivez-nous, on vous répond sous 24h.
</p>
```

L'onglet "Notre équipe" badge un point si au moins un message `sender_role='admin'` a `read_at IS NULL` pour ce propriétaire (réponse pas encore vue). Le badge se résout quand le propriétaire ouvre l'onglet : chaque message admin non lu visible à ce moment reçoit `read_at = now()`.

**Contenu de l'onglet "Notre équipe", dans l'ordre :**

1. **Carte d'accueil** : message personnalisé avec le prénom du propriétaire, "Vous avez une question ? Un besoin ? C'est ici que ça se passe.", badge "✅ Équipe disponible — réponse sous 24h", bouton d'appel `tel:+596696681869` visible.
2. **Actions rapides** (3 boutons en ligne) : Reversement / Disponibilités / Autre demande. Cliquer pré-remplit le sélecteur de sujet du formulaire et scrolle jusqu'à la zone de saisie.
3. **Fil de messages** :
   - Sélecteur de sujet (remplace le champ texte libre) : Reversement / Facturation, Disponibilités, Mon contrat, Autre
   - Bulles propriétaire : fond navy, texte blanc (style actuel conservé)
   - Bulles équipe Kayvila : fond doré/gold + badge "Kayvila"
   - Message non lu de l'équipe (par le propriétaire) : bordure gauche dorée
   - Badge de statut sur chaque message envoyé par le propriétaire : 🟡 Envoyé / 🟢 Lu par l'équipe / ✅ Répondu
   - État vide : "Vous n'avez pas encore échangé avec nous. C'est le bon moment !"
   - Compteur de caractères, placeholder "Dites-nous tout — on est là pour vous aider..."
   - Date en français lisible
   - Realtime Supabase (canal sur `owner_messages`) — plus de polling 30s

### Modèle de données — nouvelle table `owner_messages`

| Colonne | Type | Notes |
|---|---|---|
| `id` | uuid, PK | |
| `owner_id` | uuid | FK `profiles`, propriétaire concerné |
| `villa_id` | uuid, nullable | villa concernée (optionnel) |
| `subject` | text | `reversement` \| `disponibilites` \| `contrat` \| `autre` |
| `content` | text | |
| `sender_role` | text | `'owner'` \| `'admin'` |
| `sender_id` | uuid | utilisateur auteur du message |
| `read_at` | timestamptz, nullable | quand **l'autre partie** a lu ce message précis : si `sender_role='owner'`, c'est l'admin qui a lu ; si `sender_role='admin'`, c'est le propriétaire qui a lu. Symétrique, sert aux deux badges de non-lu (onglet "Notre équipe" côté owner ET liste des conversations côté admin). |
| `created_at` | timestamptz | |

**Statut calculé** (non stocké) pour un message envoyé par le propriétaire :
- 🟡 Envoyé : `read_at IS NULL`
- 🟢 Lu par l'équipe : `read_at` renseigné, aucun message `sender_role='admin'` après ce message dans le fil
- ✅ Répondu : un message `sender_role='admin'` existe après ce message dans le fil (même owner_id)

RLS : propriétaire ne voit que ses lignes (`owner_id = auth.uid()`), admin voit tout (cohérent avec les autres tables du dashboard admin).

### Côté admin — page "Messages" unifiée

Remplace "Demandes" et "Messagerie" dans `AdminMenuItems.ts`. Layout liste (gauche) + détail/réponse (droite), repris du pattern déjà utilisé par `admin/demandes` et `admin/messagerie`.

**3 filtres/onglets** :
- **Propriétaires** (nouveau) : lit `owner_messages`, groupé par `owner_id`, liste triée par dernier message, réponse admin = insert `sender_role:'admin'` + marque `read_at` sur les messages owner non lus du fil.
- **Locataires** : reprend l'affichage actuel de `admin/messagerie` (conversations chatbot `session_id`/`role`/`content`), extrait en composant réutilisable.
- **Demandes** : reprend l'affichage actuel de `admin/demandes` (table `requests`, SLA coloré, filtres statut, assignation équipe), extrait en composant réutilisable.

Chaque onglet garde la logique de données de sa page d'origine ; seule la coquille (navigation entre les 3, layout commun) est nouvelle. Aucune perte de fonctionnalité sur Demandes/Messagerie.

## Tests

- **Vitest** : calcul du statut (Envoyé/Lu/Répondu) à partir d'une liste de messages ; RLS `owner_messages` (un owner ne voit que ses propres messages).
- **Playwright** :
  - Propriétaire envoie un message → apparaît côté admin (onglet Propriétaires)
  - Admin répond → statut du message propriétaire passe à "Répondu", badge non-lu apparaît sur l'onglet "Notre équipe" côté owner
  - Nouveau message visible sans reload (Realtime) des deux côtés
  - Actions rapides pré-remplissent bien le sujet

## Migration / rollout

- Nouvelle migration Supabase : table `owner_messages` + RLS + activation Realtime
- Suppression : `components/dashboard/proprio/OwnerContactFAB.tsx`, `components/dashboard/proprio/OwnerMessaging.tsx`, `app/(proprio)/dashboard/messages/` (route orpheline), edge function `send-owner-contact`, table `owner_contact_messages` (0 lignes en prod — suppression sans risque). Retirer aussi l'import/rendu de `OwnerContactFAB` dans `app/(proprio)/dashboard/layout.tsx` (sinon build cassé).
- `proprio-menu-items.ts` : pas de nouvelle entrée (page "Mon concierge" déjà présente) ; vérifier qu'aucune entrée orpheline "Messages" ne subsiste
- `AdminMenuItems.ts` : retirer "Demandes" et "Messagerie", ajouter "Messages"
- `app/(admin)/admin/demandes/page.tsx` et `app/(admin)/admin/messagerie/page.tsx` : logique extraite en composants réutilisés par la nouvelle page, routes supprimées

## Hors périmètre (phase 2 future)

Notifications proactives automatiques dans le fil (réservation confirmée, avis 5★ reçu, relevé mensuel disponible) — reporté car chaque trigger touche un système métier distinct (webhook booking, table `reviews` actuellement vide/sans flux, cron mensuel). Sera une demande séparée une fois cette base validée en usage réel.
