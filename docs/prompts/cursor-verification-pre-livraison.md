# Prompt Cursor — Vérification Pré-Livraison Kayvila

**Date** : 6 juin 2026
**Objectif** : Vérifier l'état de tous les systèmes, lister les gaps, NE RIEN CODER — juste auditer et rapporter.

---

## Contexte

Kayvila (Diamant Noir) est à J-10 de la livraison (16 juin 2026). 
3 chantiers ont du code dans le repo mais personne n'a vérifié s'ils sont complets.

**Règle absolue** : tu ne modifies aucun fichier. Tu lis, tu analyses, tu rapportes.

---

## CHANTIER 1 — Synchronisation OTA (iCal)

### Ce qui existe
- `lib/ota-hub.ts` — moteur de sync complet (Airbnb, Expedia, Trivago, Vrbo, Booking)
- Supporte iCal multi-sources, détection auto, upsert avec external_id
- Supporte format legacy (`ical_url`) et nouveau (`ota_channels` JSONB)

### Ce qu'il faut vérifier

1. **Route API sync** — Cherche `app/api/sync/route.ts` ou équivalent. 
   - Si absente : note "🔴 Route /api/sync manquante — le cron Vercel n'a rien à appeler"
   - Si présente : vérifie qu'elle appelle `syncAllVillasOTA()`

2. **Cron Vercel** — Lis `vercel.json`. Vérifie si un cron pointe vers `/api/sync`.
   - Si absent : note "🔴 Cron Vercel manquant — la sync ne tournera jamais automatiquement"

3. **Colonne `ota_channels`** — Vérifie dans `supabase/migrations/` si une migration crée cette colonne JSONB sur la table `villas`.
   - Si absente : note "🔴 Colonne ota_channels manquante — les proprios ne peuvent pas configurer leurs URLs iCal"

4. **UI Dashboard proprio** — Cherche dans `components/dashboard/proprio/` ou `app/dashboard/` un composant qui permet de saisir des URLs iCal.
   - Si absent : note "🟡 UI configuration iCal manquante — le proprio ne peut pas ajouter ses flux"

5. **Table `villa_ical_feeds`** — Vérifie si la migration existe et si elle est appliquée en prod.
   - Si absente : note "🟡 Pas de table dédiée pour les feeds iCal (utilise juste ota_channels JSONB)"

**Format de sortie pour ce chantier** :
```
## CHANTIER 1 — OTA Sync
| Élément | Statut | Détail |
|---------|--------|--------|
| Route /api/sync | 🔴/🟢 | ... |
| Cron Vercel | 🔴/🟢 | ... |
| Colonne ota_channels | 🔴/🟢 | ... |
| UI proprio | 🔴/🟢 | ... |
| Table ical_feeds | 🔴/🟢 | ... |
```

---

## CHANTIER 2 — Agents IA (n8n)

### Ce qui existe
- `docs/n8n/kayvila-agent-a-visiteur-v2.json` — Agent Chatbot (893 lignes)
- `docs/n8n/kayvila-agent-b-proprietaire-v2.json` — Agent Copilot Propriétaire
- `docs/n8n/kayvila-agent-c-admin-v2.json` — Agent Copilot Admin
- `supabase/migrations/20260528_agents_memory.sql` — Table conversation_memory
- `docs/prompts/opus-4.5-agents-kayvila-v2.md` — Spec architecture

### Ce qu'il faut vérifier

1. **Migration agents_memory** — Vérifie que `conversation_memory` existe dans les migrations Supabase ET qu'elle est appliquée en prod.
   - Si pas appliquée : note "🔴 Migration agents_memory pas en prod — les agents n'ont pas de mémoire"

2. **Webhook Agent A (Chatbot)** — Cherche si le site appelle un webhook n8n pour le chatbot.
   - Regarde `components/chatbot/Chatbot.tsx` — vérifie l'URL du webhook
   - Si URL absente ou placeholder : note "🔴 Chatbot non connecté à n8n"

3. **Webhook Agent B (Proprio)** — Cherche une intégration Telegram ou dashboard pour le copilot proprio.
   - Si rien : note "🟡 Agent B non connecté — le proprio n'a pas accès à son copilot"

4. **Webhook Agent C (Admin)** — Cherche une intégration Telegram admin.
   - Si rien : note "🟡 Agent C non connecté — l'admin n'a pas de copilot"

5. **Variables d'environnement n8n** — Cherche `N8N_WEBHOOK_URL` ou équivalent dans `.env.example` / `.env.local`.
   - Si absent : note "🔴 URL webhook n8n non configurée"

6. **gbrain** — Vérifie si un container gbrain est mentionné quelque part (docker-compose, docs).
   - Si absent : note "🟡 gbrain non provisionné (mémoire sémantique non disponible)"

**Format de sortie** :
```
## CHANTIER 2 — Agents IA
| Élément | Statut | Détail |
|---------|--------|--------|
| Migration agents_memory | 🔴/🟢 | ... |
| Chatbot → n8n | 🔴/🟢 | URL webhook: ... |
| Agent B connecté | 🔴/🟢 | ... |
| Agent C connecté | 🔴/🟢 | ... |
| N8N_WEBHOOK_URL | 🔴/🟢 | ... |
| gbrain | 🔴/🟢 | ... |
```

---

## CHANTIER 3 — Stripe Connect

### Ce qui existe
- Audit complet : `docs/audits/stripe-connect-audit-2026-06-05.md`
- `lib/stripe/connect.ts` — Helpers Connect
- `app/api/webhooks/stripe/route.ts` — Webhook handler (298 lignes)
- `app/api/stripe/connect-onboarding/route.ts` — Onboarding
- `app/api/stripe/connect-verify/route.ts` — Vérification statut

### Ce qu'il faut vérifier

1. **P0 — Handler `account.updated`** — Vérifie dans `webhooks/stripe/route.ts` si cet event est traité.
   - Si absent : note "🔴 P0-01: Pas de handler account.updated"

2. **P0 — Blocage résa comptes non-onboardés** — Vérifie dans `app/api/booking/route.ts` si le statut Connect est vérifié avant de créer une session Stripe.
   - Si absent : note "🔴 P0-02: Pas de vérification statut Connect avant réservation"

3. **P0 — Handler `charge.refunded`** — Vérifie si traité.
   - Si absent : note "🔴 P0-03: Pas de handler charge.refunded"

4. **P1 — Idempotence webhook** — Vérifie si c'est un upsert ou SELECT+INSERT.
   - Si SELECT+INSERT : note "🟡 P1-02: Race condition idempotence"

5. **P1 — `checkout.session.async_payment_failed`** — Vérifie si traité.
   - Si absent : note "🟡 P1-03: Paiements async (SEPA) non gérés"

6. **Migration `stripe_disputes`** — Vérifie si appliquée en prod.
   - Si non : note "🔴 P2-12: Table stripe_disputes pas en production"

7. **Route admin refund** — Cherche `POST /api/stripe/admin-refund`.
   - Si absente : note "🟡 P1-05: Pas d'API de remboursement admin"

**Format de sortie** :
```
## CHANTIER 3 — Stripe Connect
| Bug | Sévérité | Statut | Détail |
|-----|----------|--------|--------|
| P0-01 account.updated | P0 | 🔴/🟢 | ... |
| P0-02 blocage non-onboardé | P0 | 🔴/🟢 | ... |
| P0-03 charge.refunded | P0 | 🔴/🟢 | ... |
| P1-02 idempotence | P1 | 🔴/🟢 | ... |
| P1-03 async_payment_failed | P1 | 🔴/🟢 | ... |
| P2-12 migration disputes | P2 | 🔴/🟢 | ... |
| P1-05 admin refund | P1 | 🔴/🟢 | ... |
```

---

## SYNTHÈSE FINALE

À la fin, produis UN tableau récapitulatif :

```
## SYNTHÈSE — J-10 Livraison

| Chantier | % Complété | Bloquants | Quick Wins |
|----------|------------|-----------|------------|
| OTA Sync | ...% | X 🔴 | Y 🟡 |
| Agents IA | ...% | X 🔴 | Y 🟡 |
| Stripe Connect | ...% | X 🔴 | Y 🟡 |

### TOP 5 actions prioritaires
1. ...
2. ...
3. ...
4. ...
5. ...

### Estimation temps restant
- Minimum : ...h (quick wins uniquement)
- Serein : ...h (P0 + P1 + quick wins)
```

---

**Ne modifie rien. Ne corrige rien. Juste l'audit et le rapport.**
