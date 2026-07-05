# Amélioration des 3 agents IA Kayvila — Design

**Date** : 2026-07-05
**Statut** : validé (brainstorming avec Kenneson)

## Contexte

Trois agents IA tournent en production via des webhooks n8n (DeepSeek + mémoire Postgres),
avec fallbacks locaux dans les routes Next.js. Objectif : améliorer leur pertinence, leur
base de connaissances FAQ et leur capacité à convertir. Le code Next.js ne raisonne pas :
il valide, enrichit le contexte, route, gère les fallbacks et les side effects.

## Périmètre — les 3 agents réels

| Agent | Route chat | Route contexte n8n | Contexte / fallback | Bot n8n |
|---|---|---|---|---|
| 1. Public (visiteur) | `app/api/chat/route.ts` | `app/api/agent/visitor-context/route.ts` | `lib/chatbot/*` | Kayvibot A |
| 2. Admin (dashboard) | `app/api/admin/chat/route.ts` | `app/api/agent/admin-context/route.ts` | `lib/admin-assistant-context.ts` | Kayvibot C |
| 3. Propriétaire (dashboard proprio) | `app/api/dashboard/owner-assistant/route.ts` | `app/api/agent/owner-context/route.ts` | `lib/owner-assistant-context.ts` | Kayvibot B |

**Point d'architecture décisif** : les workflows n8n ne lisent PAS le `context` envoyé
dans le payload du chat. Chaque bot fait son propre `Fetch Context` HTTP vers
`/api/agent/*-context`, qui renvoie le `systemPrompt` (source de vérité) + les données.
**Toute amélioration de connaissance des bots (FAQ, insights, règle 22/20) passe donc par
ces 3 routes**, pas par le payload.

**Inclus aussi** : améliorations des workflows n8n eux-mêmes, livrées sous forme de JSON
corrigés dans `~/Downloads/KAYVILABOT/` (voir section dédiée) — Kenneson les réimporte
manuellement dans n8n.

**Hors périmètre** : `app/api/chat/tenant/route.ts` (espace client voyageur) n'est pas un
des 3 agents et reste intact. La catégorie FAQ `sejour` est néanmoins créée dans
`lib/chatbot/faq.ts`, prête à être branchée plus tard.

## Décisions clés (règles dures)

1. **Tarification** : commission Kayvila **22 % sur les nuitées pour les résas directes,
   20 % pour les résas OTA** (Airbnb/Booking). Ménage et blanchisserie exclus de la base.
   Les frais de service et de ménage sont **configurés sur le dashboard admin** : les bots
   ne citent jamais de montant fixe pour ces frais, ils renvoient vers la FAQ du site ou le
   contact. `data/conciergerie-faq.ts` et `CONCIERGERIE_FACTS` sont mis à jour pour rester
   cohérents (l'ancien « 5 % frais de traitement résas directes » est remplacé).
2. **Feedback** : nouvelle table Supabase `chatbot_feedback` (migration) — les questions
   sans réponse en fallback y sont loggées en fire-and-forget.
3. **Note client (admin)** : pas de table notes → une note se matérialise en tâche
   « Note — client Y » (visible dans le dashboard, zéro migration).
4. **Villas sans photo** : pas de date d'ajout photo en base → l'insight est « villas
   publiées sans photo » (sans le critère > 30 j).

## Contraintes (à ne PAS faire)

- Ne pas modifier les webhooks n8n en production directement — les workflows améliorés
  sont livrés en JSON versionnés, importés manuellement par Kenneson.
- Ne pas changer la signature des fonctions **déjà** exportées (en ajouter est permis).
- Ne pas modifier le frontend.
- Pas d'API externe — tout le fallback marche offline.
- Réponses de fallback < 500 tokens, tout en français.

## Architecture

### Socle transverse

**`lib/chatbot/faq.ts` (nouveau)** — fonctions pures, testables :

```ts
export type FaqCategoryId = "voyageur" | "proprietaire" | "admin" | "sejour";
export type FaqEntry = {
  id: string;
  keywords: string[];        // mots-clés normalisés pour le matching
  question: string;
  answer: string;            // < 500 tokens, français
  quickReplies?: string[];
  link?: string;             // ex. "/villas", "/contact", "/soumettre-ma-villa"
};
export const FAQ_CATEGORIES: Record<FaqCategoryId, FaqEntry[]>;
export function normalizeText(s: string): string;   // minuscules, accents, ponctuation
export function matchFaq(message: string, entries: FaqEntry[]):
  { entry: FaqEntry; score: number } | null;         // scoring mots-clés + seuil
```

- Contenu `voyageur` : tarifs, réserver, animaux, dernière minute, annulation,
  disponibilités, contact humain… (FAQ du prompt).
- Contenu `proprietaire` : condensé depuis `data/conciergerie-faq.ts` (source de vérité)
  avec la règle 22/20 — minimum 50 €/mois après 3 mois d'essai, inoccupation, ménage
  (mise en relation prestataires, coût inclus dans la résa), services supplémentaires,
  imprévus (intervention 24h/24, petites réparations < 100 € gérées directement,
  propriétaire informé).
- Contenu `admin` : occupation, top villas, OTA sync, check-ins semaine, demandes en
  attente (mappé vers les réponses chiffrées locales).
- Contenu `sejour` : check-in/digicode, wifi, contacter concierge (+596 696 68 18 69,
  24h/24), prolonger, annuler (CGV), ménage séjour — non branché pour l'instant.

**`lib/chatbot/feedback.ts` (nouveau)** — `logUnmatchedQuestion({ agent, sessionId,
question, matched })` : insert fire-and-forget dans `chatbot_feedback`, erreurs avalées
(console.warn).

**Migration Supabase** `chatbot_feedback` : `id uuid pk`, `agent text`, `session_id text`,
`question text`, `matched boolean`, `created_at timestamptz default now()`. RLS activée,
accès service-role uniquement.

**`types/chatbot.ts`** : ajout des types FAQ + extensions de contexte (champs additifs,
rien de cassé).

### Agent 1 — Public (`app/api/chat/route.ts`)

- `buildFallbackResponse()` devient un moteur FAQ : match partiel sur
  `voyageur + proprietaire` → réponse FAQ + quick replies de l'entrée ; sinon message
  générique + suggestions. Question non matchée → log `chatbot_feedback`.
- Détections locales dans le fallback :
  - demande de contact → suggestion du formulaire (`/contact`, CTA) ;
  - demande de prix → redirection `/villas` ;
  - **estimation prix locale** : détection de dates françaises dans le message
    (« du 12 au 19 août », « 5 nuits ») → nuits × `price_per_night` (villa consultée si
    `villaId`, sinon fourchette min–max des villas publiées) + lien.
- Quick replies contextuels par stage : `greet` → « Voir les villas », « Comment ça
  marche ? » / `villas` → « Avec piscine », « Moins de 200 € » / `booking` →
  « Disponibilités », « Annulation » / `contact` → « Parler à un humain ».
- **`app/api/agent/visitor-context/route.ts`** (ce que le bot n8n lit vraiment) :
  - FAQ `voyageur` + `proprietaire` ajoutées au `context` et résumées dans le
    `systemPrompt` (section « FAQ — réponses officielles ») ;
  - `systemPrompt` consolidé : intègre le tunnel de stages complet
    (greet → discover → clarify → recommend → qualify → verify → prebook → handoff),
    aujourd'hui hardcodé dans le nœud n8n — une seule source de vérité ;
  - règle tarifaire 22/20 dans les faits conciergerie.

### Agent 2 — Admin (`app/api/admin/chat/route.ts` + `lib/admin-assistant-context.ts`)

- `buildAdminDemoReply()` enrichi et **réutilisé comme fallback** quand n8n est down ou en
  erreur (aujourd'hui le fallback est un snapshot pauvre distinct du mode démo) :
  - taux d'occupation global + par villa (réutilise `computeOccupancyByVilla`) ;
  - top 3 villas par revenu ;
  - erreurs OTA récentes détaillées ;
  - check-ins sous 7 jours avec nom du client + villa ;
  - demandes en attente détaillées par type (contact, soumission, réclamation).
- **Briefing du matin** : message de salutation (« bonjour », « salut »…) →
  `buildDailyBriefing` + alertes du jour.
- **Alertes proactives** : `computeAdminAlerts` (conflits de résa, soumissions en retard)
  remontées en tête de réponse fallback.
- **Actions locales sans n8n** (uniquement quand n8n est indisponible) —
  `parseAdminCommand(message)` (fonction pure) :
  - « crée une tâche X [pour villa Y] [pour demain] » → INSERT `tasks` ;
  - « marque la tâche #123 faite » → UPDATE `tasks` (id ou début de titre) ;
  - « ajoute une note sur le client Y : … » → INSERT `tasks` type `other`,
    titre « Note — {client} ».
  Le garde-fou `requiresConfirmation` existant s'applique aussi à ces actions.
- **Insights proactifs** dans le contexte (`gatherAdminContext` → nouvelles fonctions pures
  dans `admin-assistant-context.ts`) :
  - CA ce mois vs mois dernier (delta %) ;
  - villas publiées sans photo ;
  - proprios sans Stripe Connect (`profiles.stripe_connect_onboarding_completed`) ;
  - top 3 actions recommandées (dérivées des alertes + insights).
  Injectés dans `contextData` et exploités par le fallback.
- **`app/api/agent/admin-context/route.ts`** : FAQ `admin` + insights proactifs ajoutés au
  contexte servi au bot n8n (c'est lui que Kayvibot C lit, pas le payload).
- Questions non matchées en fallback → log `chatbot_feedback`.

### Agent 3 — Propriétaire (`app/api/dashboard/owner-assistant/route.ts` + `lib/owner-assistant-context.ts`)

- **FAQ propriétaire intégrée** : `smartReply`/`fallbackReply` matchent d'abord la FAQ
  `proprietaire` (commission 22/20, minimum 50 €, inoccupation, imprévus, services) avant
  les réponses génériques ; les entrées FAQ condensées sont ajoutées à
  `buildCompactContext` pour n8n.
- **Réponses chiffrées en fallback** : « mes revenus ce mois ? », « prochaine arrivée ? »,
  « mes tâches ? » → réponses avec les vrais chiffres du `OwnerContextPack` déjà chargé,
  même n8n down.
- **Insights proactifs** dans `buildCompactContext` : revenus vs mois dernier, occupation
  30 j, prochaine arrivée — pour des réponses n8n plus pertinentes.
- **`app/api/agent/owner-context/route.ts`** : FAQ `proprietaire` + règle 22/20 + insights
  ajoutés au `systemPrompt`/`context` servi à Kayvibot B.
- Questions non matchées en fallback → log `chatbot_feedback`.

## Améliorations des workflows n8n (livrées en JSON, import manuel)

Nouveaux fichiers dans `~/Downloads/KAYVILABOT/` (les originaux sont conservés) :

1. **Kayvibot A v4** — le méga-prompt CONCIERGE hardcodé dans le nœud « Build Context »
   est supprimé : le bot utilise uniquement le `systemPrompt` servi par
   `/api/agent/visitor-context` (consolidé côté site, voir Agent 1). Élimine le conflit
   actuel des deux listes de stages contradictoires envoyées au LLM.
2. **Kayvibot B v5 / C v5** —
   - troncature sûre des données : le `JSON.stringify(data).slice(0, 6000)` actuel peut
     couper le JSON en plein milieu → remplacement par une sérialisation compacte champ
     par champ avec budget de caractères ;
   - garde anti-injection légère sur le message entrant (le bot A a déjà sa modération,
     B/C n'ont rien) : longueur max + neutralisation des tentatives « ignore tes
     instructions ».
3. Aucun changement d'URL de webhook, de credentials, ni de structure de réponse —
   ré-import sans risque, rollback = ré-importer l'ancien JSON.

**Validation** : après import, un message de test par bot (visiteur : question commission
→ doit répondre 22 % direct / 20 % OTA ; proprio : « mes revenus ce mois ? » ; admin :
« bonjour » → briefing).

## Gestion d'erreurs

- FAQ/fallback : jamais d'exception non gérée — sur erreur interne, réponse générique.
- `chatbot_feedback` : fire-and-forget, jamais bloquant, erreurs en console.warn.
- Actions locales admin : résultat `{ success, error? }` renvoyé comme les actions n8n.

## Tests (Vitest)

- `lib/chatbot/faq.test.ts` : normalisation (accents, majuscules), matching avec variations
  de formulation, seuil de non-match, chaque catégorie a ses entrées, réponses < 500 tokens.
- Agent public : moteur de fallback (helpers purs exportés) — FAQ match, détection
  contact/prix, estimation de dates, quick replies par stage.
- Agent admin : `parseAdminCommand` (chaque commande + cas ambigus), insights purs
  (delta CA, villas sans photo, proprios sans Connect, top 3 actions), briefing matin.
- Agent proprio : matching FAQ proprio, réponses chiffrées depuis un pack fixture,
  insights compact context.

## Plan de commits

1. `feat(chatbot): socle FAQ centralisée + migration chatbot_feedback + types + tests`
2. `feat(chatbot): agent public — moteur FAQ fallback, estimation prix, visitor-context consolidé`
3. `feat(admin-chat): fallback enrichi, actions locales, briefing, alertes, insights + admin-context`
4. `feat(owner-assistant): FAQ proprio, réponses chiffrées fallback, insights + owner-context`

Les JSON n8n mis à jour (hors repo git) sont livrés dans `~/Downloads/KAYVILABOT/` à la
fin, avec un mini guide d'import.
