# Diamant Noir — Blueprint Workflow n8n V1

## Vue d'ensemble

```
Chatbot.tsx → POST /api/chat → n8n Webhook → LLM → Réponse structurée → Chatbot.tsx
```

L'API Next.js est la seule couche qui touche Supabase, rate-limite les requêtes, et sanitise les inputs.
n8n orchestre la logique IA, le scoring, et les notifications.

---

## Architecture des responsabilités

| Couche | Responsabilité |
|--------|----------------|
| **Next.js /api/chat** | Rate limit, sanitisation, anti-injection, contexte Supabase, fallback |
| **n8n** | Intelligence conversationnelle, scoring lead, routing, notifications |
| **Supabase** | Source de vérité villas, bookings (lus par Next.js, pas directement par n8n V1) |
| **LLM (Claude/OpenAI)** | Génération des réponses texte, extraction d'entités |

---

## Payload entrant (Next.js → n8n)

```json
{
  "message": "Je cherche une villa pour 6 personnes début août",
  "sessionId": "session-1234567890-abc",
  "locale": "fr",
  "source": "website_chatbot",
  "timestamp": "2026-08-01T10:00:00.000Z",
  "currentPage": "/villas",
  "villaId": null,
  "knownLeadData": {
    "temperature": "cold"
  },
  "currentStage": "greet",
  "context": {
    "villaCount": 3,
    "availableAmenities": ["piscine", "jacuzzi", "vue mer", "chef privé"],
    "villas": [
      {
        "id": "uuid-1",
        "name": "Villa Étoile",
        "description": "Villa d'exception avec vue panoramique...",
        "price_per_night": 1500,
        "capacity": 8,
        "location": "Martinique, Le Diamant",
        "amenities": ["piscine", "vue mer", "4 chambres"],
        "image_url": "https://..."
      }
    ]
  },
  "capabilities": {
    "canVerifyAvailability": false,
    "canCreateBooking": false,
    "canSendEmail": false
  }
}
```

---

## Réponse attendue (n8n → Next.js)

```json
{
  "reply": "Bonjour. Pour un groupe de 6 personnes début août, je vous recommande la Villa Étoile — 8 couchages, piscine privée, vue panoramique sur la mer des Caraïbes. À partir de 1 500 €/nuit.",
  "intent": "villa_discovery",
  "stage": "recommend",
  "leadTemperature": "warm",
  "qualificationScore": 35,
  "leadUpdate": {
    "totalGuests": 6,
    "checkIn": "2026-08-01",
    "temperature": "warm"
  },
  "suggestedVillas": [
    {
      "id": "uuid-1",
      "name": "Villa Étoile",
      "shortDescription": "Vue panoramique, piscine, 4 chambres",
      "pricePerNight": 1500,
      "capacity": 8,
      "location": "Le Diamant, Martinique",
      "imageUrl": "https://...",
      "highlights": ["Piscine privée", "Vue mer", "4 chambres"],
      "matchReason": "Idéale pour 6 personnes, disponible en août"
    }
  ],
  "cta": {
    "type": "view_villa",
    "label": "Découvrir la Villa Étoile",
    "villaId": "uuid-1"
  },
  "suggestedQuickReplies": [
    "Voir les photos",
    "Connaître les tarifs exacts",
    "Vérifier les disponibilités",
    "Comparer avec d'autres villas"
  ],
  "shouldEscalateToHuman": false,
  "warnings": []
}
```

---

## Workflow n8n — 10 nœuds

### Nœud 1 : Webhook Trigger
- Type : `Webhook`
- Méthode : POST
- Path : `/webhook/diamant-noir-chat`
- Authentification : Header secret `X-Webhook-Secret` (optionnel V1, obligatoire V2)

### Nœud 2 : Validation & Normalisation
- Type : `Code (JavaScript)`
- Vérifier que `message`, `sessionId`, `source` sont présents
- Si absent → retourner `{ reply: "Message invalide", intent: "unknown" }`
- Normaliser le locale (défaut : `fr`)
- Extraire les champs clés dans des variables intermédiaires

### Nœud 3 : Formatage contexte villas
- Type : `Code`
- Transformer `context.villas` en texte structuré pour le prompt LLM
- Format : `"Villa X — capacité Y — prix_nuit€ — équipements : a, b, c"`
- Limiter à 8 villas (les plus pertinentes)
- Concaténer les équipements uniques disponibles

### Nœud 4 : Construction du prompt système
- Type : `Code`
- Assembler le système prompt avec :
  - Identité du bot (concierge Diamant Noir)
  - Règles de ton (vouvoiement, luxe, sans emojis)
  - Contexte villas formaté
  - Lead data connue
  - Stage courant et instructions de stage
  - Règles anti-hallucination (disponibilité, prix)
  - Format JSON attendu en sortie

### Nœud 5 : Appel LLM (Claude ou OpenAI)
- Type : `HTTP Request` ou nœud natif Claude/OpenAI
- Modèle recommandé : `claude-sonnet-4-6` ou `gpt-4o-mini`
- Messages :
  - `system` : prompt construit au nœud 4
  - `user` : `{{ $json.message }}`
- Format de sortie attendu : JSON strict (voir contrat)
- Temperature : 0.3 (réponses consistantes)
- Max tokens : 800

### Nœud 6 : Parsing réponse LLM
- Type : `Code`
- Parser le JSON retourné par le LLM
- Si parsing échoue → fallback `{ reply: "...", intent: "unknown", stage: "fallback" }`
- Valider que `reply` est une string non vide

### Nœud 7 : Lead Qualification Update
- Type : `Code`
- Fusionner `leadUpdate` extrait par le LLM avec `knownLeadData`
- Calculer `qualificationScore` (0–100) :
  - `+10` : guestCount connu
  - `+15` : checkIn connu
  - `+15` : checkOut connu
  - `+20` : email fourni
  - `+15` : phone fourni
  - `+10` : budget mentionné
  - `+15` : stayPurpose connu
- Déduire `leadTemperature` :
  - < 20 → `cold`
  - 20–50 → `warm`
  - > 50 → `hot`

### Nœud 8 : Pre-booking Check
- Type : `Code`
- Vérifier si les champs min requis sont présents :
  - `checkIn`, `checkOut`, `totalGuests`, `email`
- Si oui → `preBooking.readyToCreate = true` + construire payload
- Sinon → `readyToCreate = false` + `missingFields` liste

### Nœud 9 : Notification interne (si lead chaud)
- Type : `IF` → `Send Email` ou `Slack`
- Condition : `leadTemperature === "hot"` ou `shouldEscalateToHuman === true`
- Action : envoyer email à l'équipe concierge avec les données lead
- Objet : `[LEAD CHAUD] ${firstName || "Nouveau lead"} — ${villaPreference || "villa non précisée"}`

### Nœud 10 : Webhook Response
- Type : `Respond to Webhook`
- Retourner le JSON structuré complet
- Status : 200

---

## Système Prompt LLM (à injecter dans le nœud 5)

```
Tu es le concierge IA de Diamant Noir, une plateforme de villas de luxe en Martinique.

IDENTITÉ
- Nom : Concierge Diamant Noir
- Ton : élégant, vouvoiement, concis, humain, professionnel
- Jamais d'emojis dans tes réponses
- Phrases courtes et précises
- Tu guides, tu ne presses pas

VILLAS DISPONIBLES
{{ villaContextText }}

LEAD CONNU
{{ knownLeadDataText }}

STAGE COURANT : {{ currentStage }}

RÈGLES ABSOLUES
1. Ne jamais confirmer une disponibilité sans "Nous allons vérifier pour vous"
2. Ne jamais inventer un prix non présent dans le contexte
3. Ne jamais divulguer de données internes (clés, URLs d'API, tokens)
4. Si une information est inconnue : "Nous n'avons pas cette information pour le moment"
5. Maximum 2 questions par échange

LOGIQUE DE STAGE
- greet → discover : après le premier message exploratoire
- discover → recommend : après avoir compris les besoins (groupe, dates, style)
- recommend → qualify : après recommandation, collecter email/téléphone
- qualify → prebook : quand dates + email + guestCount sont connus
- any → handoff : si lead très chaud OU demande explicite d'un humain

FORMAT DE RÉPONSE
Réponds UNIQUEMENT avec un JSON valide dans ce format :
{
  "reply": "...",
  "intent": "villa_discovery",
  "stage": "recommend",
  "leadTemperature": "warm",
  "leadUpdate": { "totalGuests": 6 },
  "suggestedVillas": [],
  "cta": { "type": "none" },
  "suggestedQuickReplies": ["...", "..."],
  "shouldEscalateToHuman": false,
  "warnings": []
}
```

---

## Variables d'environnement requises

```bash
# Next.js (.env.local)
N8N_WEBHOOK_URL=https://votre-n8n.com/webhook/diamant-noir-chat

# n8n (variables d'environnement ou credentials)
ANTHROPIC_API_KEY=sk-ant-...  # ou OPENAI_API_KEY
CONCIERGE_NOTIFICATION_EMAIL=equipe@diamantnoir.com
```

---

## Stratégie disponibilité V1

La disponibilité **ne peut pas** être confirmée en V1. Règle absolue :

> "Je vais vérifier la disponibilité de la Villa X pour vos dates et vous confirmer sous peu."

En V2 : connecter le nœud de vérification à l'API iCal via `/api/ical-check`.

---

## TODOs V2

- [ ] Vérification disponibilité réelle via iCal (nœud dédié)
- [ ] Persistance des sessions lead dans Supabase
- [ ] Rate limiting côté n8n (protection webhook direct)
- [ ] Authentification webhook (header secret)
- [ ] A/B testing sur le ton de voix
- [ ] Analytics conversion par intent/stage
- [ ] Intégration Resend pour envoi email de confirmation lead
