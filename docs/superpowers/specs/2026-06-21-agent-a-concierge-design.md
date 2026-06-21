# Design — Agent A « Concierge » Kayvila (Fusion v3)

> Date : 2026-06-21
> Statut : approuvé (brainstorming)
> Périmètre : workflow n8n Agent A (visiteur) + frontend `Chatbot.tsx` + micro-ajout `app/api/chat/route.ts`

## Contexte et constat

Le prompt source (`~/Downloads/prompt-claude-agent-a-kayvila.md`) demande de transformer le chatbot visiteur en concierge de luxe qui guide vers la réservation. **L'exploration du code a révélé que le projet est nettement plus avancé que le prompt ne le suppose** :

- `app/api/chat/route.ts` parse et transmet déjà `preBooking`, `ownerLead`, notifie les hot leads, strippe le markdown, gère fallback + rate-limit + sanitisation.
- **`app/api/chat/pre-book/route.ts` fait DÉJÀ toute la « section 3 » du prompt** : validation, vérif villa publiée, `INSERT pre_booking_requests`, notif admin cappée, retour `bookingUrl`.
- Le workflow `Build Context` construit déjà catalogue villas (avec `(ref: id)`), faits conciergerie, heure Martinique, et assemble un `systemMessage`.
- `Parse Response` extrait déjà `reply/stage/suggestedQuickReplies/preBooking/ownerLead` + strip markdown.

**Décisions de brainstorming :**
1. Pré-réservation persistée via `/api/chat/pre-book` (réutilisation). La « section 3 » n8n (INSERT direct) est **abandonnée** — elle dupliquerait la logique et contournerait la vérif villa publiée. Pattern projet : *n8n = cerveau, API = bras*.
2. Édition du **fichier JSON fourni** `~/Downloads/Kayvibot A — Visiteur (Fusion v3 — Dalcielo_Elise).json` uniquement (pas de déploiement live ; Élise/Kenneson déploient).
3. Fallback LLM GPT-4o-mini (section 4) **différé** (DeepSeek seul ; l'API a déjà son propre fallback si n8n KO ; pas de dépendance OpenAI).

**Incohérences du prompt corrigées :**
- Le prompt émet `shouldEscalate` ; l'API lit `shouldEscalateToHuman` → on aligne sur `shouldEscalateToHuman`.
- Le prompt propose une carte avec emojis (🏡📅👥) ; les règles design Kayvila interdisent les emojis → icônes lucide-react + accent or.

## Fichier n8n canonique

`~/Downloads/Kayvibot A — Visiteur (Fusion v3 — Dalcielo_Elise).json` (21 nœuds, DeepSeek natif `lmChatDeepSeek`). NB : une copie plus ancienne existe dans `docs/n8n/kayvibot-agent-a-visiteur-fusion.json` (16 KB, `lmChatOpenAi`) — **ne pas la confondre** ; la source de vérité est le fichier Downloads.

## Architecture & flux

```
Visiteur → Chatbot.tsx → POST /api/chat → webhook n8n (Agent A Fusion v3)
   Build Context (persona + 9 stages) → AI Agent DeepSeek → Parse Response
   → { reply, stage, suggestedQuickReplies, preBooking, ownerLead, shouldEscalateToHuman }
/api/chat normalise et renvoie au front (déjà fait, + 1 notif escalade)
Chatbot.tsx :
   • si preBooking → POST /api/chat/pre-book (persiste + notifie) → bookingUrl → PreBookingCard
   • si shouldEscalateToHuman → bandeau handoff
```

Principe directeur : **n8n décide, l'API persiste/notifie**. Aucune logique DB dans n8n.

## Unités de travail

### Unité 1 — n8n `Build Context` : persona concierge + stages
Append au `systemMessage` déjà assemblé (après catalogue villas / dispos / faits) le bloc concierge complet :
- **TON** : vouvoiement, phrases courtes, chaleureux/fier Martinique, aucun emoji, pas de formules vides.
- **RÈGLES ABSOLUES** : ne jamais confirmer une dispo non vérifiée, ne jamais inventer prix/équipement, info inconnue → « Nous vérifions et vous confirmons cela dans la journée », demande humain → stage handoff.
- **9 STAGES** (ordre impératif) : greet → discover → clarify → recommend → qualify → verify → prebook → handoff → fallback, avec le nombre d'échanges par stage.
- **LEAD TEMPERATURE** : cold / warm / hot.
- **SLOTS OBLIGATOIRES PRE-BOOKING** : checkIn (YYYY-MM-DD futur), checkOut (> checkIn, min 2 nuits), totalGuests (1..capacité), email valide.
- **ORDRE DE COLLECTE** : firstName → totalGuests → checkIn+checkOut → email → phone (optionnel).
- **ESCALADE** : passer à handoff si demande humain / suivi de résa / frustration / 3 échanges sans progression.
- **FORMAT JSON de sortie** : `{ reply, stage, intent, leadTemperature, suggestedQuickReplies, preBooking, ownerLead, shouldEscalateToHuman }` — JSON pur, rien avant/après.
- **PRE-BOOKING** : remplir `preBooking { villaId, email, startDate, endDate, guests, firstName }` quand le visiteur confirme en stage verify ; `villaId` = la valeur `(ref: ...)` du catalogue, jamais inventée.

Contrainte : zéro emoji, texte brut (déjà la règle existante du nœud).

### Unité 2 — n8n `Parse Response` : escalade + champs
Étendre l'objet extrait depuis le JSON LLM :
- Lire `p.shouldEscalateToHuman ?? p.shouldEscalate ?? false` → émettre `shouldEscalateToHuman`.
- Émettre aussi `intent` et `leadTemperature` (déjà lus par l'API, actuellement absents de la sortie n8n).
- Conserver strip markdown + extraction `reply/stage/suggestedQuickReplies/preBooking/ownerLead`.

### Unité 3 — n8n `Postgres Chat Memory`
`contextWindowLength: 10 → 20`.

### Unité 4 — Frontend `Chatbot.tsx`
- Étendre le type message : `{ role: "user" | "assistant"; content: string; preBookingCard?: PreBookingCard }`.
- Dans `sendMessage`, après réception de `data` :
  - Si `data.shouldEscalateToHuman` → marquer un état handoff (bandeau).
  - Si `data.preBooking` → `POST /api/chat/pre-book` avec `{ villaId, email, startDate, endDate, guests, name: firstName, sessionId }` ; **sur succès** (`{ success, bookingUrl }`) attacher `preBookingCard: { startDate, endDate, guests, bookingUrl }` au message assistant. Le `bookingUrl` provient de la réponse de l'API (source de vérité), pas reconstruit côté client.
- Rendu **PreBookingCard** : conteneur `border border-gold/30 bg-gold/[0.06] rounded-xl p-4`, titre « Réservation proposée », lignes avec icônes lucide (`CalendarDays` dates, `Users` voyageurs), bouton or « Réserver cette villa » → `bookingUrl`. Aucun emoji.
- **Bandeau handoff** : ligne discrète sous le message (« Notre équipe vous contactera personnellement dans les plus brefs délais. »).

### Unité 5 — API `app/api/chat/route.ts` : notif escalade
- Ajouter `notifyHandoffOnce(sessionId, summary)` calqué sur `notifyHotLeadOnce` (Set mémoire de throttle + cap 50/h), insert notif `{ user_id: null, type: "human_handoff", title: "Demande de contact humain", body }`.
- Appeler quand `parsed.shouldEscalateToHuman === true`.
- **Pré-requis DB** : vérifier que `human_handoff` est autorisé par la contrainte CHECK `notifications_type_check`. Sinon micro-migration DROP CONSTRAINT + ADD CONSTRAINT (jamais d'ALTER seul — règle connue PostgreSQL).

## Gestion d'erreurs

- `POST /api/chat/pre-book` échoue (400/500) → afficher quand même `reply`, **pas** de carte, log silencieux. La pré-résa n'est pas bloquante pour la conversation.
- preBooking incomplet ou villa dépubliée → `pre-book` renvoie 400 → pas de carte (comportement voulu).
- n8n KO / timeout → l'API renvoie déjà son `buildFallbackResponse`. Inchangé.

## Tests

- **Playwright `Chatbot.tsx`** :
  - preBooking reçu → `/api/chat/pre-book` appelé → carte rendue avec le `bookingUrl` exact retourné par l'API (mock des deux endpoints).
  - `shouldEscalateToHuman` → bandeau handoff visible.
  - pré-book en échec (mock 400) → pas de carte, message présent.
- **n8n** : non testable E2E ici. Validation = import du JSON dans n8n sans erreur + revue manuelle du prompt `Build Context` et de `Parse Response`.

## Hors périmètre

- Section 3 du prompt (INSERT n8n direct) — abandonnée.
- Section 4 (fallback GPT-4o-mini) — différée.
- `app/book/page.tsx` et `app/api/chat/pre-book/route.ts` — **ne pas modifier** (existants, validés).
- Pipeline sécurité n8n (anti-ban, anti-toxicité) — ne pas toucher.
- Déploiement live n8n — fait par Élise/Kenneson après livraison du JSON.

## Fichiers touchés

| Fichier | Nature |
|---|---|
| `~/Downloads/Kayvibot A — Visiteur (Fusion v3 — Dalcielo_Elise).json` | n8n : Build Context, Parse Response, Postgres Chat Memory |
| `components/chatbot/Chatbot.tsx` | type message + appel pre-book + PreBookingCard + bandeau handoff |
| `app/api/chat/route.ts` | `notifyHandoffOnce` + appel sur escalade |
| `supabase/migrations/*` | (si besoin) autoriser `human_handoff` dans `notifications_type_check` |
| `tests/*` | tests Playwright PreBookingCard + handoff |
