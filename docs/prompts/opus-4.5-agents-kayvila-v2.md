# Prompt Opus 4.5 — 3 Agents Kayvila (n8n) — Inspiré d'Élise 13

> **Base :** Le workflow Élise 13 (45 nœuds n8n) qui tourne sur karibloom.net.
> Tu vas créer 3 agents pour Kayvila (plateforme de location de villas de luxe en Martinique)
> en adaptant cette architecture. Chaque agent = 1 workflow n8n autonome.

---

## ARCHITECTURE DE RÉFÉRENCE — Élise 13

Voici les composants clés que TU DOIS REPRODUIRE pour chaque agent :

### 1. Sécurité (2 nœuds)
- **Check Banned Session** (Postgres) → vérifie si la session est bannie
- **IF Session Bannie** → bloque ou laisse passer

### 2. Mémoire conversationnelle (2 nœuds)
- **Get Long-Term Memory** → `SELECT conversation_data FROM conversation_memory WHERE session_id = '{{ sessionId }}' ORDER BY created_at ASC LIMIT 20`
- **Save Memory** → INSERT dans `conversation_memory` après chaque échange

### 3. Cœur IA (2 nœuds)
- **Chat Model** → DeepSeek V4 Pro (OpenAI-compatible)
- **AI Agent** → avec outils (Tool Workflow, Postgres Chat Memory)

### 4. Post-traitement (4+ nœuds)
- **FORMAT RESPONSE** → nettoyer markdown, enlever balises
- **PREPARE SUMMARY PROMPT** → extraire intention, mood, secteur
- **IF Lead Chaud / Frustré** → alertes Telegram
- **Respond to Webhook** → renvoyer la réponse JSON

### 5. Logique métier (nœuds conditionnels)
- **Check Doublon** → vérifier si prospect déjà connu
- **IF Devis Requis** → déclencher générateur de devis
- **IF Waitlist Détecté** → gérer liste d'attente
- **IF Toxique** → bloquer les messages abusifs

### 6. Intégrations
- **Supabase** → CRUD sur les tables métier
- **Telegram** → alertes en temps réel
- **Email** → suivi prospect
- **HTTP Request** → appels API externes

---

## STOCKAGE — Hybride Supabase + gbrain

### Supabase (état temps réel)
- `conversation_memory` → historique des messages (20-50 derniers)
- Tables Kayvila → villas, réservations, stats, tâches

### gbrain (mémoire sémantique long-terme) — Agents B et C uniquement
gbrain tourne en container Docker sur le VPS. Il expose une API REST.

**Pourquoi gbrain en plus de Supabase ?**
- Supabase = "QUOI" (état, faits bruts)
- gbrain = "POURQUOI" (contexte, décisions passées, patterns)

**2 nœuds n8n à ajouter aux Agents B et C :**

**1. gbrain Recall** (avant le LLM) :
```
HTTP Request POST → https://gbrain-kayvila:PORT/query
Body: { "query": "{{ dernier message }}", "entity": "owner-{{ userId }}", "limit": 5 }
```
→ Récupère les décisions passées, préférences, contexte

**2. gbrain Capture** (après le LLM) :
```
HTTP Request POST → https://gbrain-kayvila:PORT/put_page
Body: { "slug": "memory/owner-{{ userId }}/{{ date }}", "content": "décision importante" }
```
→ Sauvegarde ce qui mérite d'être retenu

**Ce que gbrain apporte :**
- Agent B : "Le mois dernier tu as baissé le prix de Corail de 500€ à 400€. Résultat : occupation passée de 40% à 80%."
- Agent C : "3ème fois ce trimestre que la synchro Airbnb de Corail échoue. Pattern : toujours un samedi, toujours après double résa."

### Agent A — Pas de gbrain
Le chatbot visiteur n'a pas besoin de mémoire sémantique. Supabase seul suffit.

---

## LES 3 AGENTS À CRÉER

### Agent A — Chatbot Visiteur Kayvila
**Inspiration Élise 13 :** Architecture simplifiée (pas de CRM, pas de devis, pas de Telegram)

**Nœuds requis :**
1. **Webhook** → POST depuis le site Kayvila
2. **Get Villa Catalog** → HTTP Request → `GET /api/villas/public`
3. **Get Long-Term Memory** → Supabase (20 derniers messages)
4. **DeepSeek Chat Model** → température 0.7
5. **AI Agent** → avec outils :
   - `kayvila-search` → chercher villa par critères (capacité, localisation, prix)
   - `postgres-chat-memory` → mémoire conversationnelle
6. **FORMAT RESPONSE** → nettoie le markdown
7. **Save Memory** → Supabase `conversation_memory`
8. **IF Toxique** → bloque et répond poliment
9. **Respond to Webhook**

**Prompt système AI Agent :**
```
Tu es le guide virtuel de Kayvila, une plateforme de location de villas de luxe en Martinique.

TON RÔLE :
- Aider les visiteurs à trouver la villa parfaite
- Répondre aux questions sur les villas et la Martinique
- Rediriger vers le formulaire de réservation

TON TON :
- Chaleureux et fier de la Martinique
- Tutoiement naturel
- Pas d'emojis sauf si le visiteur en utilise

RÈGLES ABSOLUES :
- Ne JAMAIS inventer un prix ou une disponibilité
- Si tu ne sais pas → "Je vérifie et je te confirme"
- Ne parler QUE de Kayvila et de la Martinique
- Si le visiteur est indécis → poser 2-3 questions (dates, capacité, budget)
- Rediriger vers le site pour réserver

OUTILS DISPONIBLES :
- kayvila-search : chercher des villas par mots-clés
- postgres-chat-memory : te souvenir de la conversation
```

---

### Agent B — Copilot Propriétaire
**Inspiration Élise 13 :** Reprend l'analyse CRM + alertes Telegram + gbrain

**Nœuds requis :**
1. **Webhook** → POST depuis le dashboard ou Telegram
2. **Auth JWT** → vérifier le token proprio (extraire `user_id` + `role`)
3. **Get Owner Context** → HTTP Request → `GET /api/dashboard/villas` (filtré par proprio)
4. **Get Long-Term Memory** → Supabase (30 derniers messages)
5. **gbrain Recall** → HTTP Request → `POST /query` (contexte sémantique)
6. **DeepSeek Chat Model** → température 0.3 (plus factuel)
7. **AI Agent** → avec outils :
   - `kayvila-my-villas` → lister ses villas
   - `kayvila-my-bookings` → lister ses réservations
   - `kayvila-my-stats` → revenus mensuels
   - `kayvila-my-tasks` → tâches de maintenance
   - `kayvila-ota-status` → santé synchros OTA
   - `postgres-chat-memory`
8. **FORMAT RESPONSE**
9. **PREPARE SUMMARY PROMPT** → analyse business (intention, urgence, villa concernée)
10. **IF Urgent** → alerte Telegram au proprio ("Check-in dans 2h, ménage pas fait")
11. **Save Memory** → Supabase
12. **gbrain Capture** → HTTP Request → `POST /put_page` (sauvegarde contexte important)
13. **Respond to Webhook**

**Prompt système AI Agent :**
```
Tu es le copilote d'un propriétaire de villa sur Kayvila.

TON RÔLE :
- Répondre aux questions business du propriétaire
- Lui donner des insights sur ses performances
- L'alerter sur les problèmes (tâches en retard, conflits de réservation)
- Ne JAMAIS modifier une réservation ou un prix sans confirmation explicite

TON TON :
- Respectueux et direct
- Créole bienvenu si le proprio l'utilise
- Toujours sourcer les chiffres ("Selon ton dashboard...")

CAPACITÉS :
- "Combien j'ai gagné ce mois-ci ?" → chiffres + comparer au mois précédent
- "Qui arrive cette semaine ?" → liste des check-ins avec détails
- "La villa Corail est dispo en juillet ?" → vérifier le calendrier
- "Tâches en retard ?" → lister avec priorité
- "Comment va la synchro Airbnb ?" → diagnostiquer

DONNÉES DISPONIBLES (injectées avant chaque réponse) :
- Ses villas, leurs calendriers à 30 jours
- Réservations à venir et récentes
- Revenus du mois en cours vs mois précédent
- Tâches de maintenance

RÈGLES :
- Ne contacter un client qu'avec validation explicite
- Ne jamais modifier les prix
- Alerter proactivement si problème détecté
```

---

### Agent C — Copilot Admin
**Inspiration Élise 13 :** Reprend CRM + alertes + gestion des soumissions + gbrain

**Nœuds requis :**
1. **Webhook** → POST depuis Telegram admin
2. **Auth JWT** → vérifier `role = admin`
3. **Get Admin Context** → HTTP Request → `GET /api/admin/villas` + `GET /api/admin/villa-submissions`
4. **Get Long-Term Memory** → Supabase (50 derniers messages)
5. **gbrain Recall** → HTTP Request → `POST /query` (contexte sémantique global)
6. **DeepSeek Chat Model** → température 0.2 (très factuel)
7. **AI Agent** → avec outils :
   - `kayvila-all-villas` → toutes les villas
   - `kayvila-all-bookings` → toutes les réservations
   - `kayvila-submissions` → soumissions en attente
   - `kayvila-global-stats` → revenus globaux Stripe
   - `kayvila-ota-all` → santé synchros globales
   - `kayvila-users` → lister les utilisateurs
   - `postgres-chat-memory`
8. **FORMAT RESPONSE**
9. **PREPARE SUMMARY PROMPT** → catégoriser l'intention admin
10. **IF Problème Critique** → alerte Telegram au fondateur
11. **IF Soumission Prioritaire** → notifier pour validation
12. **Save Memory** → Supabase
13. **gbrain Capture** → HTTP Request → `POST /put_page` (sauvegarde insights)
14. **Respond to Webhook**

**Prompt système AI Agent :**
```
Tu es le copilote admin de Kayvila. Tu supervises TOUTES les villas et tous les propriétaires.

TON RÔLE :
- Donner une vue d'ensemble de la plateforme
- Détecter les problèmes (OTA, impayés, soumissions en attente)
- Alerter proactivement sur les anomalies
- Ne JAMAIS modifier la base de données sans confirmation explicite

TON TON :
- Franche et incisive
- Tutoiement avec le fondateur
- Pas de blabla — faits et chiffres

CAPACITÉS :
- "Top 3 villas ce mois ?" → classement avec revenus
- "Y a des soumissions en attente ?" → liste avec date de soumission
- "Problème synchro Airbnb ?" → diagnostic par villa
- "Rapport mensuel" → résumé complet (revenus, occupancy, problèmes)
- "Quel proprio n'a pas payé sa commission ?" → vérifier Stripe

RÈGLES :
- Alerter, ne pas décider
- Toujours donner le chiffre ET le contexte
- Proactivité : signaler les anomalies sans attendre qu'on demande
```

---

## TABLE DE MÉMOIRE SUPABASE (commune aux 3 agents)

```sql
CREATE TABLE conversation_memory (
  id BIGSERIAL PRIMARY KEY,
  session_id TEXT NOT NULL,
  conversation_data JSONB NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_session_id ON conversation_memory(session_id, created_at);
```

---

## FORMAT DE SORTIE ATTENDU

Pour CHAQUE agent, produis un fichier JSON exportable dans n8n contenant :
- `nodes` → tous les nœuds avec leur configuration complète
- `connections` → comment les nœuds sont reliés

Le JSON doit être IMPORTABLE directement dans n8n.

Commence par l'Agent A, puis B, puis C.
