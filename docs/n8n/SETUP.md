# Diamant Noir — Setup Workflow n8n V1

## Prérequis

- Instance n8n active (`https://kenneson.app.n8n.cloud`)
- Compte OpenAI avec accès API (`gpt-4o-mini` ou `gpt-4o`)
- Projet Supabase Diamant Noir (`wsdawdxucyuyopkpgjij`)
- Application Next.js déployée (variable `N8N_WEBHOOK_URL` à configurer)

---

## Étape 1 — Importer le workflow

1. Ouvrir n8n → **Workflows** → bouton **Import**
2. Sélectionner le fichier `docs/n8n/diamant-noir-chatbot-v1.json`
3. Le workflow apparaît avec 11 nœuds

---

## Étape 2 — Configurer les credentials

### OpenAI

1. **Settings** → **Credentials** → **Add Credential** → **OpenAI API**
2. Nom : `OpenAI API`
3. API Key : votre clé `sk-...`
4. Sauvegarder
5. Dans le workflow, cliquer sur le nœud **OpenAI Chat Model** → sélectionner ce credential

### Supabase

1. **Settings** → **Credentials** → **Add Credential** → **Supabase**
2. Nom : `Supabase Diamant Noir`
3. Host : `https://wsdawdxucyuyopkpgjij.supabase.co`
4. Service Role Key : votre clé `service_role` (depuis Supabase → Project Settings → API)
5. Sauvegarder
6. Dans le workflow, cliquer sur **Upsert Lead (Supabase)** et **Create Pre-booking (Supabase)** → sélectionner ce credential

---

## Étape 3 — Créer les tables Supabase

Exécuter ces migrations dans **Supabase → SQL Editor** :

### Table `chatbot_leads`

```sql
create table public.chatbot_leads (
  id uuid primary key default gen_random_uuid(),
  session_id text not null unique,
  first_name text,
  email text,
  phone text,
  total_guests integer,
  check_in date,
  check_out date,
  villa_preference text,
  budget text,
  stay_purpose text,
  special_requests text,
  lead_temperature text default 'cold' check (lead_temperature in ('cold', 'warm', 'hot')),
  qualification_score integer default 0,
  current_stage text default 'greet',
  last_intent text,
  should_escalate boolean default false,
  source_page text,
  villa_id_context text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Index pour les lookups par session
create index idx_chatbot_leads_session on public.chatbot_leads(session_id);
create index idx_chatbot_leads_email on public.chatbot_leads(email);
create index idx_chatbot_leads_temperature on public.chatbot_leads(lead_temperature);

-- RLS : lecture/écriture service role uniquement
alter table public.chatbot_leads enable row level security;
```

### Table `pre_bookings`

```sql
create table public.pre_bookings (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  first_name text,
  email text not null,
  phone text,
  total_guests integer not null,
  check_in date not null,
  check_out date not null,
  villa_id text references public.villas(id) on delete set null,
  special_requests text,
  budget_indicated text,
  stay_purpose text,
  status text default 'pending' check (status in ('pending', 'confirmed', 'cancelled', 'expired')),
  source text default 'chatbot_v1',
  admin_notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Index
create index idx_pre_bookings_session on public.pre_bookings(session_id);
create index idx_pre_bookings_email on public.pre_bookings(email);
create index idx_pre_bookings_status on public.pre_bookings(status);

-- RLS
alter table public.pre_bookings enable row level security;
```

---

## Étape 4 — Récupérer l'URL du webhook

1. Dans le workflow, cliquer sur le nœud **Webhook**
2. Copier l'URL de production (onglet **Production URL**) :
   ```
   https://kenneson.app.n8n.cloud/webhook/diamant-noir-chat
   ```
3. Activer le workflow (toggle en haut à droite)

---

## Étape 5 — Configurer Next.js

Dans le fichier `.env.local` de l'application Next.js :

```bash
# URL du webhook n8n — coller l'URL copiée à l'étape 4
N8N_WEBHOOK_URL=https://kenneson.app.n8n.cloud/webhook/diamant-noir-chat

# Secret optionnel pour authentifier les requêtes (configurer aussi dans n8n si activé)
# N8N_WEBHOOK_SECRET=votre-secret-aleatoire
```

Redémarrer le serveur Next.js après modification.

---

## Étape 6 — Configurer les notifications équipe

Le nœud **Notify Team** envoie un POST vers `CONCIERGE_NOTIFICATION_WEBHOOK`.

Par défaut, il pointe vers `https://kenneson.app.n8n.cloud/webhook/chatbot-admin`.

Pour personnaliser :
- Créer un second workflow n8n pour recevoir les notifications admin
- Ou modifier l'URL directement dans le nœud **Notify Team**

Les notifications se déclenchent pour :
- Lead chaud (`leadTemperature = "hot"`)
- Escalade humaine (`shouldEscalateToHuman = true`)
- Pre-booking prêt (tous les champs obligatoires remplis)

---

## Architecture du workflow (11 nœuds)

```
Webhook (POST)
  └─ Normalize Input        — valide message, sessionId, locale
       └─ Build Live Context — formate villas + lead en texte LLM
            └─ AI Agent      — orchestre la conversation (Claude/OpenAI)
                 └─ Parse Response — extrait JSON, calcule score, prépare preBooking
                      ├─ IF — Escalade humain ?
                      │    ├─ TRUE  → Notify Team ──────────────────┐
                      │    └─ FALSE → Upsert Lead (Supabase) ───────┤
                      └─ IF — Pre-booking prêt ?                    │
                           ├─ TRUE  → Create Pre-booking (Supabase) │
                           │               └─ Notify Team ──────────┤
                           └─ FALSE → Upsert Lead (Supabase) ───────┤
                                                                     │
                                                           Format Reply
                                                                └─ Respond to Webhook
```

**Principes clés :**
- `continueOnFail: true` sur Supabase et HTTP Request — une erreur de persistance ne bloque jamais la réponse
- `responseMode: "responseNode"` sur le Webhook — contrôle explicite du moment de la réponse
- Le nœud **Format Reply** construit un payload `ChatbotResponse` compatible avec le contrat TypeScript de l'application

---

## Modèle LLM

Le workflow utilise **OpenAI Chat Model** configuré sur `gpt-4o-mini` (température 0.3, max 900 tokens).

Pour utiliser Claude (recommandé pour la qualité du français) :
1. Supprimer le nœud **OpenAI Chat Model**
2. Ajouter un nœud **Anthropic Chat Model** (`@n8n/n8n-nodes-langchain.lmChatAnthropic`)
3. Modèle : `claude-sonnet-4-6`
4. Connecter via le port `ai_languageModel` → **AI Agent**
5. Ajouter le credential Anthropic (`ANTHROPIC_API_KEY`)

---

## Test du workflow

### Test rapide (curl)

```bash
curl -X POST https://kenneson.app.n8n.cloud/webhook/diamant-noir-chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Bonjour, je cherche une villa pour 6 personnes en août",
    "sessionId": "test-session-001",
    "locale": "fr",
    "source": "website_chatbot",
    "timestamp": "2026-08-01T10:00:00.000Z",
    "currentPage": "/villas",
    "currentStage": "greet",
    "context": {
      "villaCount": 0,
      "availableAmenities": [],
      "villas": []
    },
    "capabilities": {
      "canVerifyAvailability": false,
      "canCreateBooking": false,
      "canSendEmail": false
    }
  }'
```

### Réponse attendue

```json
{
  "success": true,
  "reply": "Bonjour. Pour un groupe de 6 personnes en août, je vais vous orienter vers nos propriétés les plus adaptées. Avez-vous une préférence pour la localisation ou le cadre du séjour ?",
  "sessionId": "test-session-001",
  "intent": "ask_villa_recommendation",
  "stage": "discover",
  "leadTemperature": "cold",
  "leadUpdate": { "totalGuests": 6 },
  "suggestedVillas": [],
  "cta": { "type": "none" },
  "suggestedQuickReplies": ["Face à la mer", "Piscine privée", "Voir toutes les villas"],
  "shouldEscalateToHuman": false
}
```

---

## Variables d'environnement de référence

| Variable | Où | Valeur |
|---|---|---|
| `N8N_WEBHOOK_URL` | `.env.local` Next.js | `https://kenneson.app.n8n.cloud/webhook/diamant-noir-chat` |
| `N8N_WEBHOOK_SECRET` | `.env.local` + n8n | Optionnel — secret partagé pour authentifier |
| `OPENAI_API_KEY` | n8n Credentials | Clé OpenAI (`sk-...`) |
| `ANTHROPIC_API_KEY` | n8n Credentials | Clé Anthropic si Claude utilisé |
| `CONCIERGE_NOTIFICATION_WEBHOOK` | n8n Environment | URL admin pour notifications équipe |

---

## Checklist mise en production

- [ ] Workflow importé et actif dans n8n
- [ ] Credential OpenAI configuré
- [ ] Credential Supabase configuré (service role)
- [ ] Tables `chatbot_leads` et `pre_bookings` créées
- [ ] `N8N_WEBHOOK_URL` configuré dans `.env.local`
- [ ] Webhook URL testée avec curl
- [ ] Test depuis l'interface chatbot du site
- [ ] Vérifier que les leads s'enregistrent dans Supabase
- [ ] Vérifier que les notifications équipe arrivent

---

## TODOs V2

- [ ] Authentification webhook (header `X-Webhook-Secret`)
- [ ] Vérification disponibilité réelle via iCal
- [ ] Persistance mémoire conversationnelle (historique Supabase)
- [ ] Rate limiting côté n8n
- [ ] Envoi email de confirmation lead (Resend)
- [ ] A/B testing tone of voice
- [ ] Analytics intent/stage/conversion
