# 🔧 KAYVILA — Mega Prompt Claude — Audit Complet + Publication

**Projet** : Kayvila — Conciergerie de luxe en Martinique
**Repo** : `diamant-noir` (GitHub)
**Stack** : Next.js 14, HeroUI, Supabase, Stripe Connect, n8n Cloud, Resend, Tailwind CSS 4
**Dernier commit** : Vérifier avec `git log -1`
**Fichiers** : ~195 composants TSX, 47 routes API, 70+ pages, 3 workflows n8n

---

## ⚠️ CRITIQUE — NE PAS REDESIGNER

Le design Kayvila est intentionnel. Règles :
- Palette : or (`#d4af37`) / navy (`#0a0a0a`) / offwhite (`#fafafa`) / cream (`#f5f0e8`)
- Typo : Instrument Sans (body), Playfair Display (titres), Sora (dashboard)
- Radius : volontairement anguleux (luxe moderne), pas de `rounded-full` sauf chips/badges
- Bordures : fines, `border-navy/5` à `border-navy/20`, `border-gold/30` pour accents
- Animations : CSS native + `motion` (ex-Framer Motion), `prefers-reduced-motion` respecté
- Tu fais du POLISH et des CORRECTIONS, PAS un redesign.

---

## 📊 Synthèse Globale

| Domaine | P0 | P1 | P2 | Total |
|---------|-----|-----|-----|-------|
| Build local | 1 | 0 | 0 | 1 |
| Tests end-to-end | 3 | 2 | 0 | 5 |
| Agents n8n | 1 | 0 | 0 | 1 |
| Stripe Connect | 1 | 1 | 0 | 2 |
| SEO/Metadata | 2 | 1 | 0 | 3 |
| Formulaires | 1 | 2 | 0 | 3 |
| Performance | 0 | 2 | 1 | 3 |
| Accessibilité | 1 | 2 | 0 | 3 |
| **TOTAL** | **10** | **10** | **1** | **21** |

---

## Phase 1 — P0 BLOQUANTS : Build Local & Déploiement

### 1.1 Token HeroUI Pro
- **Problème** : `@heroui-pro/react` bloque le build local
- **Fichier** : `.npmrc`, 10 composants (DropZone, Sheet, KPI, Carousel, Stepper, Kanban, Command, Widget, EmptyState, NumberStepper, ActionBar, PressableFeedback, Rating, NumberValue)
- **Action** : Configurer le token de licence HeroUI Pro en local (`.npmrc` ou `npx heroui-pro login`)

### 1.2 Vérification build Vercel
- Vérifier que le dernier build Vercel passe (`vercel logs` ou dashboard)
- Vérifier les variables d'environnement Vercel (Stripe, Supabase, n8n webhooks, Resend)

---

## Phase 2 — P0 BLOQUANTS : Tests Playwright End-to-End

**Tu vas ÉCRIRE ET EXÉCUTER des tests Playwright pour TOUS les flows.** Pas de tests manuels. Du vrai code Playwright qui vérifie que chaque page charge, que chaque flow fonctionne, que les API répondent.

### 2.1 Setup Playwright
```bash
npx playwright install
```
Vérifier que `playwright.config.ts` est configuré avec `baseURL: "http://localhost:3000"`

### 2.2 Tests à écrire — Flow Client (6 tests)
1. **Accueil** : charger `/`, vérifier hero, featured villas, CTA
2. **Catalogue** : charger `/villas`, vérifier carte Leaflet, filtres, liste villas
3. **Fiche villa** : charger `/villas/[id]`, vérifier galerie, calendrier, booking form
4. **Réservation** : remplir dates → guests → vérifier prix → cliquer Réserver → vérifier redirection Stripe Checkout
5. **Confirmation** : simuler retour Stripe → charger `/success` → vérifier détails réservation
6. **Chatbot** : ouvrir le chatbot, taper un message, vérifier réponse

### 2.3 Tests à écrire — Flow Propriétaire (4 tests)
7. **Login proprio** : se connecter → redirection `/dashboard`
8. **Dashboard** : vérifier KPIs, timeline, alertes, villas
9. **Gestion villa** : ajouter/modifier villa, upload photo, calendrier dispos
10. **Revenus** : charger page revenus, vérifier graphiques, bouton export PDF

### 2.4 Tests à écrire — Flow Admin (5 tests)
11. **Login admin** : se connecter → redirection `/admin`
12. **Dashboard admin** : vérifier KPIs, checkins, alertes
13. **Réservations** : vérifier data grid, kanban, calendrier
14. **Soumissions** : liste, accepter/refuser une soumission
15. **Stripe refund** : rembourser une réservation (mode test)

### 2.5 Tests à écrire — API (3 tests)
16. **POST /api/booking** : créer réservation → vérifier réponse 200 + session Stripe
17. **GET /api/agent/owner-context** : avec token → vérifier contexte proprio
18. **POST /api/webhooks/stripe** : simuler `checkout.session.completed` → vérifier booking confirmé

**Total : 18 tests Playwright minimum.**

---

## Phase 3 — P0 BLOQUANTS : Publication Agents n8n

### 3.1 Workflows à publier
Les 3 workflows fusion sont dans `docs/n8n/` :
- `kayvibot-agent-a-visiteur-fusion.json` (Agent A — Visiteur, 16 nœuds)
- `kayvibot-agent-b-proprietaire-fusion.json` (Agent B — Propriétaire, 15 nœuds)
- `kayvibot-agent-c-admin-fusion.json` (Agent C — Admin, 13 nœuds)

### 3.2 Actions
1. Importer chaque workflow dans n8n Cloud
2. Configurer les credentials : `DIAMANT NOIR` (Postgres), `DeepSeek API`, `RESEND_API_KEY`
3. Activer les webhooks et récupérer les URLs
4. Mettre à jour les variables d'environnement Vercel :
   - `N8N_WEBHOOK_URL` = URL Agent A
   - `N8N_OWNER_WEBHOOK_URL` = URL Agent B
   - `N8N_ADMIN_WEBHOOK_URL` = URL Agent C
   - `N8N_TENANT_WEBHOOK_URL` = URL Agent SAV locataire (si workflow séparé)
5. Tester chaque agent depuis l'UI correspondante

---

## Phase 4 — P0 BLOQUANTS : Stripe Connect

### 4.1 Vérification mode test
- Clés Stripe en mode test sur l'environnement de dev/staging
- Créer un compte Connect test et vérifier le flow onboarding → réservation → paiement → transfert
- Vérifier les webhooks Stripe (endpoint configuré dans Stripe Dashboard)

### 4.2 Points de vérification
- Split correct : 75% proprio / 25% Kayvila (séjour) ; 80% / 20% (OTA)
- `application_fee_amount` correct
- `transfer_data.destination` = bon compte Connect
- Email confirmation après paiement

---

## Phase 5 — P1 IMPORTANT : SEO & Metadata

### 5.1 Pages sans title/description
Vérifier TOUTES les pages (70 routes) pour :
- `<title>` unique et descriptif
- `<meta name="description">` présent
- `openGraph` et `twitter:card` sur les pages clés
- `canonical` URL sur chaque page
- JSON-LD (schema.org) sur les fiches villa, page accueil

### 5.2 Sitemap & Robots
- Vérifier `sitemap.xml` généré (Next.js)
- Vérifier `robots.txt`
- Vérifier que les pages admin/dashboard ne sont pas indexées

---

## Phase 6 — P1 IMPORTANT : Formulaires

### 6.1 Validation
- Mettre en place `react-hook-form` + `zod` sur `BookingForm`, `VillaSubmissionForm`, `ContactForm`
- Ajouter `aria-invalid` et `aria-describedby` sur les champs en erreur
- Ajouter debounce sur les inputs de recherche

### 6.2 Feedback
- Standardiser les messages succès/erreur (bannière verte/toast)
- Vérifier que tous les formulaires ont un état `loading` pendant la soumission

---

## Phase 7 — P1 IMPORTANT : Accessibilité

### 7.1 Points à corriger
- Ajouter `aria-invalid` sur les champs formulaire en erreur
- Vérifier les contrastes (or sur blanc = potentiellement problématique)
- Vérifier la navigation au clavier (tab order, focus traps dans modales)
- Vérifier les labels sur tous les inputs (associés via `htmlFor`/`id`)

### 7.2 Tests
- `tests/` existants : `espace-client/layout.spec.ts`, `search.spec.ts`
- Ajouter des tests mobile-first (viewport 375px)
- Ajouter un test de réservation complète (E2E)

---

## Phase 8 — P2 POLISH : Performance & Micro-interactions

### 8.1 Performance
- Vérifier `next/image` sur toutes les images (pas de `<img>` nu)
- Activer ISR sur les pages catalogue (`revalidate`)
- Vérifier le bundle size (`next build` → analyzer)

### 8.2 Loading states
- Ajouter des `loading.tsx` sur les segments dashboard qui n'en ont pas

### 8.3 Empty states
- Standardiser `KayvilaEmptyState` dans les 2-3 cas manuels restants

---

## ⛔ CE QU'ON NE TOUCHE PAS (Zone Interdite)

- Le design system (couleurs, typos, radius, espacement)
- Les animations CSS (sauf correction de bugs)
- L'architecture des APIs (sécurité, rate limiting, CSRF)
- Les webhooks Stripe (sauf test de bout en bout)
- La configuration Supabase RLS
- Le middleware RBAC

---

## 📋 Règles Globales

1. Chaque phase est indépendante — tu peux les exécuter dans l'ordre
2. Fichiers et lignes exacts dans les corrections, pas de descriptions vagues
3. Après chaque phase, vérifier que le build passe
4. Ne pas modifier les variables d'environnement Vercel sans prévenir
5. Les tests E2E se font sur l'environnement de staging/test, PAS en production
6. Pour les workflows n8n : sauvegarder les URLs de webhook après activation
