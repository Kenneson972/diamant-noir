# AUDIT COMPLET — Diamant Noir vs Devis DEV-2026-003
> Date : 2026-05-09 | Projet : Next.js 15.2.4 + Supabase | Deadline livraison : 1er juin 2026

---

## ÉTAT GLOBAL : ~75% livré — 3 bugs critiques corrigés, manques identifiés

---

## A. PAGES PUBLIQUES (vs Devis)

| Page | Devis | État | Notes |
|------|-------|------|-------|
| Accueil (Hero + villas + mission) | ✅ | ✅ Complet | Hero vidéo, ISR 60s |
| Barre de recherche date + ville | ✅ | ⚠️ À vérifier | `/book` wizard existe, barre sur accueil à confirmer |
| Nos Logements + filtres | ✅ | ✅ Complet | Filtres + comparaison |
| Carte interactive géolocalisée | ✅ | ❌ Manquant | Google Maps / Mapbox non trouvé |
| Qui Sommes-Nous | ✅ | ✅ Complet | |
| Services aux Propriétaires | ✅ | ✅ Complet | `/prestations` + `/proprietaires` |
| Sous-onglet "Nos Formules" | ✅ | ⚠️ Flou | `/tarifs` existe — vérifier correspondance |
| Contact (formulaire + carte) | ✅ | ✅ Complet | |
| FAQ | ✅ | ✅ Complet | |

---

## B. FONCTIONNALITÉS CORE (vs Devis)

| Fonctionnalité | Devis | État | Notes |
|---------------|-------|------|-------|
| Fiche villa (galerie, dispo, conditions, règlement) | ✅ | ✅ Complet | 665 lignes `/villas/[id]` |
| Réservation online — checkout 2 étapes | ✅ | ✅ Complet | `/book` wizard + Stripe |
| Espace client locataire (suivi + documents + messagerie) | ✅ | ⚠️ Partiel | Tout existe SAUF annulation booking |
| Espace client propriétaire (dashboard) | ✅ | ✅ Complet | |
| Chatbot IA Concierge 24/7 | ✅ | ✅ Complet | Intégré N8N |
| Partage villa WhatsApp / Facebook | ✅ | ❓ Non trouvé | À vérifier sur fiche villa |
| Multi-langue FR / EN / ES | ✅ | ⚠️ Partiel | Seulement nav/footer traduit — contenu métier reste FR |
| Multi-devise EUR / USD | ✅ | ⚠️ Partiel | Fonctionne mais taux 1.08 hardcodé |
| Emails confirmation automatiques (client + admin) | ✅ | ✅ Complet | Via webhook Stripe |
| SEO avancé + performance | ✅ | ✅ Complet | ISR, next/image, parallel fetches |

---

## C. SYNCHRONISATION PLATEFORMES (vs Devis)

| Fonctionnalité | Devis | État | Notes |
|---------------|-------|------|-------|
| Import villa depuis URL Airbnb | ✅ | ✅ Existe | `/api/import-airbnb` — UI à confirmer |
| Sync iCal Airbnb / Expedia / Trivago | ✅ | ✅ Complet | `villa_ical_feeds` + `/admin/sync-ota` |
| Hub centralisé disponibilités (cron Vercel) | ✅ | ✅ Complet | `ota-hub.ts` |
| Mise à jour auto sur toutes les plateformes | ✅ | ✅ Complet | |

---

## D. DASHBOARD ADMIN + ASSISTANT IA (vs Devis)

| Fonctionnalité | Devis | État | Notes |
|---------------|-------|------|-------|
| Gestion villas (ajout, édition, publication, suppression) | ✅ | ✅ Complet | CRUD complet |
| Gestion réservations (validation, annulation, historique) | ✅ | ⚠️ Partiel | Liste OK, détail/modification limitée |
| Gestion soumissions propriétaires (workflow validation) | ✅ | ✅ Complet | `/admin/submissions` Kanban |
| Assistant IA Copilot Command Center | ✅ | ✅ Complet | `/admin/assistant` |
| KPIs & statistiques par villa (clics, visites, CA) | ✅ | ⚠️ Partiel | Stats partielles |
| Smart Insights (recommandations auto) | ✅ | ❌ Manquant | Non implémenté |
| Paiement Stripe intégré | ✅ | ✅ Complet | |

---

## E. BUGS CRITIQUES

### ✅ BUG 1 CORRIGÉ — `ota_sync_logs.synced_at` inexistant
**Fichier** : `app/api/admin/chat/route.ts`  
**Problème** : `.order("synced_at")` + `otaLogs[0]?.synced_at` → champ inexistant en BD (colonne réelle : `created_at`)  
**Fix** : Remplacé par `.created_at` sur les 3 occurrences

---

### ✅ BUG 2 CORRIGÉ — Revenus propriétaire hardcodés (données FAUX)
**Fichier** : `app/(proprio)/dashboard/revenus/page.tsx`  
**Problème** : `monthlyData` statique avec fausses valeurs (Jan: 4200, Mai: 6200, etc.)  
**Fix** : Requête réelle Supabase depuis `bookings` (6 derniers mois, filtré par `villa_id`, agrégé par mois depuis `total_price_cents`)

---

### ✅ BUG 3 CORRIGÉ — `has_photos` manquant dans interface TypeScript
**Fichier** : `types/domain.ts` — interface `VillaSubmission`  
**Problème** : Champ `has_photos` présent en BD mais absent du type → erreur silencieuse  
**Fix** : Ajout de `has_photos: boolean` dans l'interface

---

### ⚠️ Note — Table `seasons`
La table `seasons` n'existe pas dans les migrations SQL mais l'utilisateur confirme l'avoir créée directement dans Supabase. Colonne attendue : `id, name, color, months[]`.  
**À faire** : Ajouter une migration SQL de rattrapage pour documenter le schéma.

---

## F. INCOHÉRENCES MÉTIER (à corriger)

| Problème | Fichier | Impact |
|---------|---------|--------|
| Dual pricing : `price` (EUR legacy) + `total_price_cents` | `bookings` table | Confusion Stripe webhook |
| `commission_rate` créé en BD, jamais utilisé | `lib/price-engine.ts` | Commissions jamais déduites |
| `seasonal_prices[]` créé en BD, jamais utilisé | `lib/price-engine.ts` | Tarification saisonnière absente |
| `bookings.check_in/check_out` jamais écrits | `/api/booking` | Workflow arrivée/départ incomplet |
| 31 occurrences `any` en TypeScript | Divers composants | Erreurs runtime silencieuses |
| Annulation booking absente côté locataire | `/espace-client/reservations/[id]` | Client bloqué |

---

## G. CE QUI MANQUE vs DEVIS (à implémenter)

| Élément | Priorité | Complexité |
|---------|---------|-----------|
| **Carte interactive géolocalisée** sur `/villas` (Google Maps / Mapbox) | Haute | Moyenne |
| **Partage villa WhatsApp / Facebook** sur fiche villa | Haute | Faible |
| **Traductions complètes** FR/EN/ES (contenu métier) | Haute | Moyenne |
| **Smart Insights** (recommandations auto propriétaire) | Moyenne | Haute |
| **Statistiques réelles** par villa (taux occupation, CA réel) | Haute | Moyenne |
| **Annulation booking** côté espace client locataire | Haute | Faible |
| **Migration SQL** pour table `seasons` (rattrapage doc) | Basse | Faible |
| **Taux de change live** EUR/USD (actuellement 1.08 hardcodé) | Basse | Faible |

---

## H. BASE DE DONNÉES — État du schéma

### Tables existantes (14 principales)

| Table | État | Notes |
|-------|------|-------|
| `villas` | ✅ Riche | 50+ colonnes, seasonal_prices[], ota_channels[], commission_rate |
| `bookings` | ⚠️ Dual pricing | `price` (legacy EUR) + `total_price_cents` (source de vérité) |
| `villa_submissions` | ✅ Complet | `no_photos` + `has_photos` (deux champs distincts) + `platforms` JSONB |
| `villa_ical_feeds` | ✅ Complet | Feeds OTA par villa, sync n8n |
| `ota_sync_logs` | ✅ Corrigé | Colonne `created_at` (pas `synced_at`) |
| `profiles` | ✅ Complet | role: admin/owner/tenant, trigger auto-insert |
| `tasks` | ✅ Complet | Gestion tâches propriétaire |
| `chat_messages` | ✅ Complet | Messagerie client |
| `admin_chat_logs` | ✅ Complet | Logs copilot admin |
| `owner_alerts` | ✅ Complet | Alertes propriétaires |
| `support_tickets` | ✅ Complet | Support client |
| `seasons` | ✅ Créée manuellement | Pas de migration SQL — à documenter |
| `notifications` | ✅ Basic | Peu utilisé |
| `stripe_events_processed` | ✅ Complet | Idempotence webhook |

### Champs BD non utilisés par le code

| Champ | Table | Utilisé |
|-------|-------|---------|
| `commission_rate` | `villas` | ❌ Jamais |
| `seasonal_prices[]` | `villas` | ❌ Jamais |
| `amenities_import_labels` | `villas` | ❌ Jamais |
| `check_in/check_out` | `bookings` | ❌ Jamais écrits |
| `price` | `bookings` | ⚠️ Legacy |

### RLS

✅ Bien implémenté (migration `20260501_rls_audit.sql`) — policies sur toutes les tables sensibles

---

## I. ARCHITECTURE & SÉCURITÉ

### ✅ Points forts
- Next.js 15 App Router, Server/Client components bien séparés
- Supabase Auth (JWT) + RLS policies + RBAC triple-couche (profil BD / JWT / email fallback)
- Rate limiting sur routes critiques
- Stripe webhook avec validation signature
- ISR sur landing page, dynamic imports pour `/prestations`
- Parallel data fetches avec `Promise.all()`

### ⚠️ Points faibles
- `API_SECRET_KEY` définie en env mais jamais utilisée dans le code
- `ADMIN_CHAT_ALLOWED_EMAILS` / `ADMIN_CHAT_ALLOWED_USER_IDS` non documentées dans `.env.local.example`
- Pas d'audit logging des actions admin (qui a supprimé quoi ?)
- 0 tests (Playwright installé mais aucun fichier de test)
- Select `*` sur 5 tables dans `/api/admin/chat` (perf)

---

## J. PLAN DE FINITION

### Sprint 1 — Bugs critiques ✅ FAIT (2026-05-09)
- [x] Fix `synced_at` → `created_at` dans `/api/admin/chat/route.ts`
- [x] Fix revenus proprio — données réelles depuis Supabase
- [x] Fix `has_photos` manquant dans `types/domain.ts`

### Sprint 2 — Manques devis (estimé 2-3 jours)
- [ ] Carte Google Maps / Mapbox sur `/villas`
- [ ] Boutons partage WhatsApp / Facebook sur fiche villa `/villas/[id]`
- [ ] Bouton annulation booking sur `/espace-client/reservations/[id]`
- [ ] Traductions EN/ES complètes (contenu métier)

### Sprint 3 — Polissage (estimé 1-2 jours)
- [ ] Activer `seasonal_prices` dans `lib/price-engine.ts`
- [ ] Activer `commission_rate` dans le calcul de prix
- [ ] Smart Insights propriétaire (recommandations simples)
- [ ] Statistiques réelles par villa (taux occupation)
- [ ] Migration SQL rattrapage `seasons` table

### Sprint 4 — Nice-to-have
- [ ] Taux de change live EUR/USD
- [ ] Audit logging actions admin
- [ ] Tests Playwright E2E
- [ ] Pagination listings admin
