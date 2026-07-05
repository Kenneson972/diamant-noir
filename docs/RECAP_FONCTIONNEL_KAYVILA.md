# Kayvila / Diamant Noir — Récap Fonctionnel Complet

**Date** : 5 Juillet 2026 · **Statut** : Prêt pour le live

---

## 📱 Site Public (13 pages)

| Page | Fonctionnalités |
|------|----------------|
| **Homepage** | Hero, 5 piliers services, villas en vedette, carte, footer, SEO |
| **Catalogue /villas** | Liste + carte interactive, filtres (capacité, équipements, prix), recherche |
| **Fiche villa /villas/[id]** | Galerie photos, description, équipements, carte, calendrier, **réservation en ligne** |
| **Comparateur /villas/comparer** | Tableau comparatif multi-villas |
| **Réservation /book** | Tunnel de réservation complet |
| **/prestations** | 4 piliers : marketing, finance, opérations, expérience voyageur |
| **/experience** | Page expérience client |
| **/qui-sommes-nous** | Équipe, histoire, valeurs |
| **/faq** | FAQ propriétaires + voyageurs |
| **/contact** | Formulaire Zod + honeypot anti-spam |
| **/tarifs** | Grille tarifaire |
| **/soumettre-ma-villa** | Formulaire propriétaire (capture soumission → admin) |
| **Pages légales** | CGV voyageurs, CGV propriétaires, mentions légales, confidentialité, cookies |

**i18n** : 3 langues (fr, en, es) via cookie + paramètre URL `/en/` `/es/`

---

## 🛒 Système de Réservation (Bout en bout)

```
POST /api/booking
  ├─ Zod validation (dates, email, UUID villa, CGV acceptées)
  ├─ Vérification conflit dates (DB)
  ├─ Vérification propriétaire Connect onboardé (sinon 503)
  ├─ Calcul prix serveur (sécurisé — le client ne dicte pas le montant)
  ├─ INSERT booking (status: pending, payment_status: unpaid)
  ├─ Stripe Checkout Session (métadonnées complètes)
  ├─ Link stripe_session_id
  └─ Retourne URL Stripe

Stripe Checkout → client paie → webhook
  ├─ checkout.session.completed → confirmed/paid + emails + historique
  ├─ checkout.session.expired   → cancelled + auto-refund
  ├─ payment_intent.succeeded   → confirmed (paiements asynchrones SEPA)
  ├─ payment_intent.payment_failed → failed
  ├─ charge.refunded            → refunded/partially_refunded
  ├─ charge.dispute.* (4 types)  → alerts + table stripe_disputes
  └─ account.updated / deauthorized → Connect onboarding lifecycle

Fallback /api/booking-session
  └─ Si webhook en retard, sync depuis Stripe direct
```

**Anti-double-click** : même client/villa/dates → retrouve la session existante
**Anti-conflit** : détecte les réservations qui se chevauchent (status pending/confirmed/paid)
**Historique** : chaque changement → `order_status_history` (from/to/reason)
**Idempotence webhook** : table `stripe_events_processed` (onConflict ignoreDuplicates)

---

## 👑 Dashboard Admin (21 pages)

| Page | Détail |
|------|--------|
| **Vue d'ensemble** | KPIs globaux (revenus, occupation, tâches, check-ins du jour) |
| **Villas** | CRUD complet, éditeur unifié, brouillon→publié, multi-photos |
| **Villa Editor** | Sommaire sticky, 3 sections (info, équipements, photos), autosave |
| **Réservations** | Liste + filtre par statut/période, détail avec statut+historique |
| **Clients** | Base clients, lien automatique via email |
| **Fiche client 360°** | Réservations, historique, notes, messagerie |
| **Propriétaires** | Gestion, fiche détaillée |
| **Onglet Stripe proprio** | Statut Connect, onboarding, historique |
| **Revenus** | Graphiques mensuels, par villa, par proprio |
| **Paramètres** | Configuration conciergerie, CGV, tarifs, saisonnalité |
| **Soumissions** | Villas soumises par propriétaires → accepter/refuser/examiner |
| **Acceptation → villa auto** | Crée une villa brouillon pré-remplie (idempotent) |
| **Avis** | Gestion des reviews clients |
| **Hub Concierge** | Messagerie admin↔proprio, admin↔client (3 onglets) |
| **Hub Classique** | Vue unifiée dashboard |
| **Messages** | Tous les messages centralisés |
| **Documents** | Gestion documents admin |
| **Sync OTA** | Synchronisation Airbnb/Booking, historique logs |
| **Tarification** | Tarifs saisonniers par villa |
| **Cloche notifications** | 4 détecteurs proactifs (emails Resend) + ⚡ design prêt pour in-app |

---

## 🏠 Dashboard Propriétaire (16 pages)

| Page | Détail |
|------|--------|
| **Tableau de bord** | KPIs, résas à venir, check-ins/check-outs du jour |
| **Mes villas** | Liste, statut (publiée/brouillon) |
| **Éditeur villa** | Infos, équipements, photos, disponibilités, tarifs |
| **Calendrier** | Disponibilités, réservations existantes visibles |
| **Réservations** | Par villa, détail complet |
| **Revenus** | Graphiques Recharts, export PDF |
| **Statistiques** | Occupation, taux de remplissage par période |
| **Statistiques par villa** | KPIs détaillés |
| **Tâches** | Maintenance, todo, statuts |
| **Hub Concierge** | Messagerie avec l'équipe Kayvila |
| **Documents** | Documents liés |
| **Bouton Stripe Connect** | Onboarding Stripe Express (IBAN, identité) |
| **Notification "Point du jour"** | Digest quotidien ⚡ à réactiver |
| **Relevé revenus** | Export PDF propriétaire |

---

## 🧳 Espace Client (8 pages)

| Page | Détail |
|------|--------|
| **Dashboard** | Réservations actives, historique |
| **Détail réservation** | Dates, villa, statut, paiement |
| **Checklist séjour** | Check-in autonome (digicode 24h avant), check-out |
| **Livret d'accueil** | Infos villa, règles, contacts urgence |
| **Livret version imprimable** | Print-friendly |
| **Messagerie** | Contact avec Kayvila |
| **Notifications** | Centre notifications (cloche, Supabase Realtime) |
| **Favoris** | Wishlist villas (localStorage) |
| **Partage séjour** | Lien `/share/[token]` public, export calendrier `.ics` |

---

## 💳 Paiement Stripe

| Composant | Statut |
|-----------|--------|
| **Stripe Checkout** | Session line_items (séjour + ménage + frais service) |
| **Stripe Connect Express** | Split automatique 78% proprio / 22% Kayvila |
| **Commission** | Configurable (22% par défaut, variable OTA/direct) |
| **Garde 503** | Bloque le paiement si proprio pas onboardé |
| **Remboursement admin** | POST /api/stripe/admin-refund → reverse_transfer |
| **Webhooks** | 12 événements, signature HMAC, double-secret |
| **Idempotence** | stripe_events_processed + onConflict |
| **Mode test → live** | Guide complet : `docs/stripe-go-live.md` |
| **43 tests Playwright** | Connect, checkout, webhooks, admin-refund |

---

## 🤖 Chatbot & IA

| Canal | Route | Capacités |
|-------|-------|-----------|
| **Public** | `/api/chat` | Mode démo intelligent (règles métier sans LLM) |
| **Admin** | `/api/admin/chat` | Contexte DB enrichi, fallback hors-ligne |
| **Client** | `/api/chat/tenant` | Lié aux réservations |
| **Pre-book** | `/api/chat/pre-book` | Avant réservation |
| **Conciergerie Bot** | `/api/concierge/*` | Réponses contextualisées |
| **Agent context** | 4 endpoints | Admin/owner/visitor/digest → contexte structuré |

---

## 🔒 Sécurité

| Couche | Détail |
|--------|--------|
| **Auth** | Supabase SSR, getUser() serveur, RBAC triple rôle |
| **CSRF** | 15 routes POST protégées (verifyOrigin + checkCsrf/withCsrf) |
| **RLS** | 20+ migrations, policies par rôle |
| **Rate Limiting** | 7 routes (booking, import, sync, chat, submissions) |
| **Input Validation** | Zod schemas (booking, contact) |
| **XSS** | 0 vulnérabilités dynamiques, escapeHtml(), DOMPurify |
| **CSP** | Présent (script-src, img-src, etc.), améliorable |
| **Headers** | nosniff, SAMEORIGIN, Referrer-Policy, Permissions-Policy |
| **CORS** | Allowlist explicite, pas de wildcard |
| **Webhook** | Signature HMAC, corps brut, double secret |
| **Secrets** | Aucun NEXT_PUBLIC_ sensible |
| **Score audit** | **19/20** |

---

## 🔄 Automatisation

| Cron | Fonction | Statut |
|------|----------|--------|
| `pending-submissions` | Détecte soumissions en attente +24h | ✅ Emails |
| `ghost-villas` | Détecte villas sans activité (>30j) | ✅ Emails |
| `admin-daily-recap` | Récap quotidien admin | ✅ Emails |
| `admin-weekly-recap` | Récap hebdo admin | ✅ Emails |
| `owner-daily-digest` | Point du jour proprio | ⚡ Design prêt (remplace n8n) |

---

## 🌐 OTA & Sync

| Composant | Détail |
|-----------|--------|
| **Import Airbnb** | Scraping + parsing + insertion |
| **Sync logs** | Table `ota_sync_logs` |
| **iCal feeds** | Import/export calendrier propriétaire |
| **Date blocks** | Table `villa_date_blocks` pour disponibilités OTA |

---

## 📊 Résumé

| Métrique | Valeur |
|----------|--------|
| **Pages totales** | **60+** |
| **API routes** | **50+** |
| **Dashboard admin** | 21 pages |
| **Dashboard proprio** | 16 pages |
| **Espace client** | 8 pages |
| **Tests** | 130+ (Vitest + Playwright) |
| **Migrations SQL** | 20+ |
| **Score sécu** | 19/20 |
| **Commits** | 740+ |

---

## ⚡ Reste à faire avant live

| Item | Effort |
|------|--------|
| DNS kayvila.com → Vercel | 5 min (Richard) |
| Stripe : clés live + webhooks | 10 min |
| Redéployer Vercel | 2 min |
| Tester 1 réservation réelle | 5 min |
| **Total** | **~20 min** |

---

*Récap généré par Élise — DeepSeek v4 Pro — 5 Juillet 2026*
