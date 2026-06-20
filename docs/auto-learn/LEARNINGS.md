# Kayvila — Apprentissages

---

## 2026-06-20 (soir) — Copilot Diamant : section dashboard intégrée + 3 actions

### Fait
- **Copilot migré de FAB flottant → section dashboard** : CopilotButton + CopilotPanel supprimés, nouveau `DashboardCopilotChat` en pleine largeur sous les KPIs. Plus pro, plus accessible.
- **3 actions ajoutées** : BLOCK_DATE (déjà codé), SET_PRICE (nouveau — update villas.price_per_night), SHOW_BOOKING (nouveau — prochaine résa + séjours en cours via OR clause).
- **Split Server/Client** : `DashboardPageClient` (Client Component) reçoit les données du Server Component en props objets simples (⚠️ jamais de callbacks).
- **CopilotActionCard** : affiche le résultat des actions dans le flux du chat (confirmation ou erreur).

### Règles apprises (dures)
- **Ne JAMAIS passer de fonction/callback/promesse en props Server→Client** : Next.js App Router rejette les props non-sérialisables. Commentaire ⚠️ dans `page.tsx` pour prévenir.
- **SHOW_BOOKING doit couvrir les séjours EN COURS** : `start_date.gte.today` seul ne suffit pas — ajouter `or(start_date.lte.today,end_date.gte.today)` pour répondre à "qui est chez moi en ce moment ?".
- **Le CopilotProvider n'a pas besoin de changer** : retirer juste le Button+Panel suffit. Le contexte/hook/API restent identiques.

---

## 2026-06-20 (soir) — Implémentation couche proactive Agent B ✅

### Fait
- **9 tâches implémentées** (subagent-driven) : migration `owner_daily_digest` + 2 endpoints API + hook + composant + injection dashboard + exclusion NotificationBell + branche cron n8n (6 nœuds : Schedule Trigger 8h MQ, HTTP fetch, Split per owner, LLM Chain DeepSeek, Postgres INSERT) + test E2E Playwright.
- **CRON_API_KEY générée** (`ea9b64...`) et ajoutée à Vercel production.
- **Workflow B déployé** sur n8n Cloud avec les credentials liés automatiquement (nouvelle clé API propriétaire) — build/déploiement Vercel OK.
- Branche : `worktree-proactive-agent-b` (pushée, non mergée).

### Règles apprises (dures)
- **API key n8n "public-api" ne peut PAS référencer de credentials sur de nouveaux nœuds** (PUT 400 `You don't have access to the credentials`). Il faut une clé API owner-level (celle de Kenneson). Les credentials existants sur des nœuds pré-existants passent, mais tout nouveau nœud credential-dépendant est rejeté. Contournement : déployer sans creds puis les ajouter dans l'UI, ou utiliser une clé owner.
- **`n8n-nodes-base.splitOut`** = paramètre `fieldToSplitOut` (pas `sourceData` + `jsonField` comme documenté dans certaines versions).
- **Sandbox bloque les connexions Postgres directes** (DNS + port 5432) et l'API Supabase Management (403 error 1010) → la migration doit être appliquée manuellement (SQL Editor).
- **`vercel env add` nécessite `--yes` ET le répertoire lié** (`.vercel/project.json`). Dans un worktree, symlink `.vercel` vers le repo principal.

### ⚠️ Reste à faire (1 étape manuelle)
- **Appliquer la migration SQL** : ouvrir https://supabase.com/dashboard/project/wsdawdxucyuyopkpgjij/sql/new, coller le contenu de `supabase/migrations/20260620_notifications_owner_daily_digest.sql`, cliquer Run.
- **Merger `worktree-proactive-agent-b` → `main`** après validation.

---

## 2026-06-20 (soir) — Design couche proactive Agent B (digest matinal)

### Décidé (spec : `docs/specs/proactive-agent-b.md`)
- **Agent B proactif** : Schedule Trigger n8n `0 8 * * *` (tz Martinique) → digest chaleureux quotidien par owner, affiché en haut du dashboard proprio. Implémentation **non démarrée** (repris plus tard).
- **Réutiliser la table `notifications`** (pas de nouvelle table) : elle a déjà `user_id` + `is_read`/`read_at` + RLS service-role + `NotificationBell`. Nouveau type `owner_daily_digest`.

### Règles apprises (dures)
- **Vérifier la pré-existence AVANT de créer** : la demande disait « table `users` role=owner » + « nouvelle table `proactive_notifications` ». En réalité : rôles dans **`profiles`** (valeur `owner`, pas `proprietaire`/`proprio`), et la table **`notifications` existait déjà** avec `user_id` → mappait 1:1. Toujours interroger le schéma live (Supabase MCP) avant d'écrire migration/UI.
- **Un cron n'a pas de token utilisateur** : `/api/agent/owner-context` est token-gated (anti-IDOR) → inappelable par un Schedule Trigger. Pattern correct = endpoint interne protégé par secret (`verifyApiKey`/`CRON_API_KEY`, déjà utilisé par `send-checkin-reminders`) qui réutilise `buildOwnerContextPackCached`.
- **Dédup côté requête, pas côté schéma** : « 1 digest/owner/jour » géré en excluant les owners déjà traités du jour (tz Martinique) dans l'endpoint de contexte → cron idempotent sans index/contrainte ad hoc.

---

## 2026-06-20 — Publication agents n8n A/B/C (Fusion) via API REST

### Fait
- **Publié les 3 agents Kayvibot Fusion** sur n8n Cloud via l'API REST publique (clé `X-N8N-API-KEY`, in-session uniquement) : A mis à jour (PUT `xiSB7mej6eH8INfM`), B créé (`q4DAjw1uG19fDfr8`), C créé (`7gtgluMV6cft6H7X`), tous activés.
- Smoke tests directs des 3 webhooks → 200 + vraies réponses DeepSeek.
- Vercel : `N8N_OWNER_WEBHOOK_URL` (B) + `N8N_ADMIN_WEBHOOK_URL` (C) renseignées + redéploiement prod (alias `kayvila.vercel.app`).

### Règles apprises (dures)
- **`process.env` ET `$env` sont BLOQUÉS sur n8n Cloud** → `process is not defined` (Code node) / `access to env vars denied` (expression `{{ $env.X }}`). Les 3 agents fusion avaient `{{ $env.KAYVILA_URL || 'https://kayvila.vercel.app' }}` dans l'URL du nœud HTTP de contexte → le fetch plantait (continueOnFail) → **contexte vide → "aucune villa disponible"** alors que le catalogue existe. **Bug invisible en smoke test** (HTTP 200, réponse plausible) : seul le test métier ("il y a des villas !") l'a révélé. Fix : URL en dur `https://kayvila.vercel.app` (pas d'expression `=`). Toujours hardcoder, jamais `$env`/`process.env`.
- **Les JSON fusion exportés référencent un credential DeepSeek placeholder `openAiApi/DEEPSEEK_CRED` (inexistant)**. À l'import, remplacer le nœud LLM par le natif `@n8n/n8n-nodes-langchain.lmChatDeepSeek` relié au credential réel `KARIBLOOM DEEPSEEK` (`s16Eub8KTcJLPBw5`) — config éprouvée de l'agent A live. Aucun secret requis.
- **Webhook paths stables** : A=`kayvibot-visitor`, B=`kayvibot-owner`, C=`kayvibot-admin`. URL prod = `https://kenneson.app.n8n.cloud/webhook/<path>`.
- **Import API REST** : POST `/api/v1/workflows` n'accepte que `{name, nodes, connections, settings}` (pas `active`/`id`/`tags`). Activation séparée via POST `/workflows/{id}/activate`.
- **Vercel env "Sensitive"** : `vercel env pull` les affiche vides (non déchiffrables). Ne pas conclure qu'elles sont vides sans vérifier le type. `vercel env rm` + `env add` les repasse en "Encrypted" (perd le flag sensitive).

### Copilot propriétaire (dashboard) — 3 bugs app trouvés au test E2E
- **Le hook `useCopilot` n'envoyait aucun `Authorization: Bearer`** → `/api/dashboard/owner-assistant` (getUserFromRequest = Bearer only) répondait **401** → "je n'arrive pas à me connecter". Fix : attacher `Bearer ${session.access_token}` (via `getSupabaseBrowser().auth.getSession()`) sur les fetches. NB : l'admin concierge marche car `requireAdmin`→`getSessionUser` lit le **cookie** d'abord.
- **Contrat de réponse n8n incohérent** : l'agent B (fusion) renvoie `{ reply }` (format visiteur) mais la route owner-assistant ne lisait que `data.response` (format admin) → fallback permanent "analyse temporairement indisponible" malgré n8n OK (exec success ~9s). Fix : accepter `response || reply` (et `suggested_prompts || suggestedPrompts`).
- **Un type error casse SILENCIEUSEMENT tous les déploiements** : `villa.bathrooms`/`villa.surface` (au lieu de `bathrooms_count`/`surface_m2`) → `next build` échoue → Vercel garde l'ancien build → les fixes ne partent jamais live alors que `git push` réussit. **Toujours `npx tsc --noEmit` AVANT de pousser** un changement TSX, et vérifier le statut du déploiement (`vercel ls --prod` → Error vs Ready), pas juste l'exit code de la commande.

### Agent B "voit pas les données" — debug en cascade (test data réel)
- **L'app doit envoyer ce que l'agent lit** : owner-assistant envoyait `owner_id`, l'agent B lit `body.userId`/`body.token` → ajouter `userId` + `token` (bearer) au payload webhook.
- **n8n HTTP node mangle les query params** : `?userId=&token=` → owner-context renvoyait 401 puis 403 (`requestedUserId !== resolvedUserId`) alors qu'un `curl` identique passe en 200. **Solution : auth par HEADER `Authorization: Bearer {{ $json.token }}`, retirer userId/token du query.** Règle générale : pour un nœud HTTP n8n qui appelle une API authentifiée, passer le token par header, jamais par query.
- **Latence agent vs timeout app** : une fois les vraies données chargées (3 bookings → gros contexte DeepSeek), le run B prend ~22s. L'app coupait à `AbortSignal.timeout(15_000)` → fallback "analyse indisponible". Monter à 30s **ET** ajouter `export const maxDuration = 35` (sinon Vercel tue la fonction serverless avant). Un HTTP 200 en smoke test ne garantit pas que l'UI marche : tester avec de la vraie data et regarder la latence réelle.

---

## 2026-06-19 (soir) — Migration agents n8n vers pré-fetch Postgres

### Fait
- **Refonte 3 agents Kayvibot** via brainstorming → spec → plan → subagent-driven (4 commits sur main)
- Suppression de tous les `ai_tool` (non fonctionnels) → pré-fetch Postgres dans le flux principal (pattern CieloBot)
- Agent B/C : 1 nœud Postgres consolidé (json_build_object) gaté par l'auth API
- **Revue finale a rattrapé un IDOR Critical** dans `owner-context` → corrigé (token = seule source d'identité)

### Règles apprises (dures)
- **Les `ai_tool` n8n échouent chez Kayvila** → ne plus en utiliser. Pré-fetch tout dans le flux principal (HTTP/Postgres) AVANT l'AI Agent, comme CieloBot. L'agent n'a que `ai_languageModel` + `ai_memory`.
- **Anti-IDOR** : un filtre SQL n8n (`WHERE owner_id=$1`) ne doit JAMAIS utiliser une valeur client. L'identité vient de `getUser(token)` côté API. Une route qui accepte `?userId=` en query SANS le valider contre le token est une faille (cas réel : `owner-context`). Rejet 403 si query userId ≠ token userId.
- **Nœud Postgres admin (sans filtre)** = doit être sur la branche AUTORISÉE de l'IF (gaté `requireAdmin`), jamais en amont.
- **Toujours vérifier `information_schema` live avant d'écrire du SQL** (types/supabase.ts périmé) : le spec avait 4 colonnes fausses (check_in, total_price, last_sync_at, status).
- **Revue finale whole-branch indispensable** même quand les revues par tâche sont clean : l'IDOR venait d'une hypothèse du spec (« userId vérifié ») fausse au niveau cross-fichier, invisible tâche par tâche.

---

## 2026-06-19 — Chatbot Audit Complet (9 bugs)

### Fait
- **Sprint pré-prod polish** mergé sur main (Task 6 → final review → 3 critical fixes → push)
- **Admin soumissions** : page détail `/admin/soumissions/[id]` + SubmissionActions avec `router.refresh()`
- **HoverCard supprimé** de `VillaListingCard.tsx` (modal desktop redondant)
- **Audit chatbot** : comparatif Dalcielo + Elise → 9 problèmes identifiés, 7 corrigés dans Next.js
- **2 actions n8n restantes** pour Kenneson (ai_memory + contexte sans emojis)

### Règles apprises

**Architecture chatbot n8n :**
- Un `@n8n/n8n-nodes-langchain.agent` **sans nœud `ai_memory` branché = stateless** — chaque message est une nouvelle conversation
- Le nœud "Build Context" ne doit **jamais** injecter d'emojis dans le contexte (ils contaminent les réponses IA)
- `toolHttpRequest` = nœud tool (`ai_tool`) uniquement, jamais dans la séquence principale

**Chatbot Next.js :**
- Toujours stripper markdown (`**`, `---`, `##`, `` ` ``) dans `api/chat/route.ts` avant renvoi au client
- Le prompt système doit **interdire explicitement** emojis et markdown — pas juste "répondre en JSON"
- `data.suggestedQuickReplies` de l'API doit être **prioritaire** sur les suggestions statiques hardcodées
- `currentStage` doit être suivi côté client (`useState`) et renvoyé dans chaque requête
- Branding : l'avatar du chatbot doit matcher le nom du client actuel (K = Kayvila, pas D = Diamant Noir)

---

## 2026-05-10 — Session Audit + Uniformisation Dashboards

### Fait
- **Audit impeccable** des 3 espaces dashboard (score 13/20 → ~18/20)
- **Corrections P0-P2** : suppression side-stripes, texte ≥11px, tokens Tailwind dans globals.css et pages
- **Spec + Plan + Implémentation** uniformisation des 3 layouts (Admin, Proprio, Espace Client)
- **DashboardShell unique** créé avec DashboardSidebar + DashboardHeader partagés
- **9 anciens fichiers supprimés** (AdminLayout, AdminHeader, AdminSidebar, AdminMain, OwnerLayout, OwnerHeader, OwnerSidebar, EspaceClientShell, EspaceClientProviders)
- **4 créés** : DashboardShell, DashboardSidebar, DashboardHeader, TenantMenuItems
- **Fix icônes** : Lucide React → noms string pour éviter erreur sérialisation Server→Client

### Règles apprises
- Pas de `border-l-2` ni `before:w-[Npx]` sur les sidebars — remplacer par `border + bg-tint`
- Texte minimum 11px partout dans les dashboards
- Couleurs unifiées : `bg-offwhite`, `text-navy`, `text-gold` via tokens Tailwind
- `<main>` ne doit pas être nested — les pages dashboard ne doivent pas avoir leur propre `<main>`
- LucideIcon ne passe pas la frontière Server→Client dans Next.js 15

---

## 2026-05-11 — FAQ + Vision Espace Client

### Fait
- **Correction FAQ** : 4 contradictions corrigées dans `data/conciergerie-faq.ts` (commission, frais bancaires, réservations directes, pack démarrage)
- **Spec Vision** : Espace Client Super Fonctionnel — 16 fonctionnalités en 3 phases
- **Document vision** pour le gérant : `docs/vision-espace-client-kayvila.md`

### Règles apprises
- La commission Kayvila = 20% sur le montant brut (ménage INCLUS), pas de déduction avant calcul
- Réservations directes Kayvila = 5% frais de traitement (pas 0%)
- Les textes FAQ doivent être cohérents entre eux (Q1 et Q2 ne doivent pas se contredire)

---

## 2026-05-11 — Phase 1 Espace Client Fonctionnel ✅ TERMINÉ

### Fait (7 créés, 4 modifiés, 1 SQL)
- **Migration Supabase** : table `requests` + colonnes `profiles` + colonne `villas.house_manual`
- **Request System** : RequestForm, RequestList, page `/espace-client/demandes`
- **Check-in autonome** : CheckinGuide (digicode 24h avant, photos, plan)
- **Check-out instructions** : CheckoutInstructions (checklist J-1)
- **Facture PDF** : imprimable dans Documents (séjours passés)
- **Profil enrichi** : allergies, occasion spéciale, heure arrivée, lit bébé/chaise haute
- **Vue admin** : `/admin/demandes` avec filtres + actions (résoudre/refuser/en cours)
- **Menus** : "Demandes" ajouté aux sidebars tenant + admin
- **RequestList** intégré dans la page Séjour
- **CheckinGuide + CheckoutInstructions** intégrés dans le Livret

### Règles apprises
- Le Request System est le socle : chaque action voyageur → tâche admin avec statut
- CheckinGuide s'affiche seulement 24h avant l'arrivée (condition `hoursUntil <= 24`)
- CheckoutInstructions s'affiche seulement la veille du départ
- Les hooks React (`useState`, `useEffect`) doivent être avant tout early return
- Le profil enrichi se sauvegarde dans la table `profiles` (pas dans `auth.users` metadata)
- `border-l-2` → `border border-gold/30 bg-gold/[0.08]` (border complète + fond teinté)

---

## 2026-05-11 — Phase 2 Espace Client Confort ✅ TERMINÉ

### Fait (3 créés, 2 modifiés)
- **Partage séjour** : page `/share/[token]` publique sans auth, lien copiable (btoa/atob)
- **Calendrier .ics** : export Google/Apple/Outlook, `lib/generate-ics.ts`
- **Services ponctuels** : ménage, linge, gaz dans la page Conciergerie
- **Boutons Séjour** : calendrier + partage ajoutés sous la grille Accès rapide

### Règles apprises
- `Buffer.from()` n'existe pas côté client → utiliser `btoa()` / `atob()`
- L'export .ics utilise le format `YYYYMMDDTHHmmssZ` pour DTSTART/DTEND
- Les hooks React doivent TOUJOURS être avant tout `if (condition) return`

---

## 2026-05-11 — Phase 3 — Centre de Notifications ✅ TERMINÉ

### Fait (1 créé, 10 modifiés, 1 migration)
- **Migration Supabase** : colonne `user_id` sur `notifications`, 4 nouveaux types, RLS pour authenticated
- **NotificationBell** : adapté pour guests (filtre userId, lien footer par rôle, nouveaux types)
- **DashboardHeader** : cloche placeholder remplacée par `<NotificationBell>` fonctionnel
- **DashboardShell** : passe `userId` et `role` au header
- **Page notifications** : `/espace-client/notifications` avec historique, mark all read, empty state
- **Menu tenant** : entrée "Notifications" (Bell) ajoutée
- **Triggers** : admin résout/refuse → notif guest ; guest crée demande → notif confirmation

### Règles apprises
- Toujours vérifier si un composant existe déjà avant d'en créer un nouveau (NotificationBell était orphelin)
- La table `notifications` existait déjà avec un schéma admin — l'adapter plutôt que d'en créer une nouvelle
- Pour qu'un admin insère une notif pour un guest, il faut une RLS policy `authenticated_insert` avec `with check (true)` — pas juste un `authenticated_insert_own`
- Les notifications temps réel utilisent Supabase Realtime via `postgres_changes`

---

## 2026-05-11 — Phase 3 — Avis, Parrainage, Favoris, Re-réserver ✅ TERMINÉ

### Fait (6 créés, 5 modifiés, 2 migrations)
- **Table reviews** : rating 1-5, commentaire, photos, statut pending/approved/rejected, RLS (public lit approved, guest own, admin all)
- **Table referrals** : code KAYVILA-XXXXX, statut invited/registered/booked, RLS referrer_own
- **Page `/espace-client/favoris`** : utilise WishlistContext, grille villas avec bouton retirer, empty state
- **Page `/espace-client/parrainage`** : formulaire invitation email, dashboard filleuls avec statuts
- **Page `/admin/avis`** : filtres statut, approuver/rejeter, affichage étoiles + commentaire
- **ReviewForm** : étoiles cliquables 1-5, condition post-checkout, submit vers reviews
- **Page Séjour enrichie** : re-réserver, villas similaires (3), formulaire avis intégré
- **Menus** : Favoris (Heart) + Parrainage (Gift) tenant, Avis (Star) admin

### Règles apprises
- Le wishlist/favoris existait déjà (`wishlist` table, `WishlistContext`, `WishlistProvider`) — toujours vérifier avant de créer
- Pour la RLS admin : `exists (select 1 from profiles where id = auth.uid() and role = 'admin')` permet aux admins de gérer toutes les reviews
- La contrainte `unique(booking_id)` empêche les doublons d'avis sur un même séjour
- Le code de parrainage utilise `KAYVILA-` préfixe + 6 caractères alphanumériques pour être identifiable

---

## 2026-05-11 — Phase A — Fondations Refonte Admin ✅

### Fait (7 créés, 13 modifiés, 3 supprimés, 3 migrations)
- **`lib/constants.ts`** : centralise REQUEST_TYPE_LABELS, REQUEST_STATUS_STYLES/LABELS, BOOKING_STATUS_STYLES/LABELS, REFERRAL_STATUS_STYLES/LABELS, NOTIF_TYPE_CONFIG
- **`lib/utils.ts`** : ajout `timeAgo()` et `formatDate()` partagés, supprimés de NotificationBell + notifications/page
- **`types/supabase.ts`** : ajout tables requests, reviews, referrals, wishlist
- **RLS** : `requests` (guest_own + admin_all), fix `villa_submissions` (DROP policy permissive)
- **Suppression 3 re-exports** : hub-classique, assistant, submissions
- **Menu admin** : 10 entrées (retrait Hub classique, Assistant, Soumissions, Propriétaires)
- **`conciergerie_settings`** : table pour contacts/horaires/services éditables

### Règles apprises
- 4 définitions de `STATUS_STYLES` coexistaient avec des clés différentes (demandes, réservations, parrainage) → nommer avec préfixe (`REQUEST_`, `BOOKING_`, `REFERRAL_`)
- Les re-exports `export { default } from "..."` cassent la navigation naturelle → pages natives uniquement
- `NOTIF_TYPE_CONFIG` utilise des strings d'icônes pour la page notifs, des composants React pour NotificationBell → on garde les deux versions car le contexte est différent (Server→Client)
- La table `requests` était la seule table critique sans RLS — toujours auditer les nouvelles tables
- `grep -r "STATUS_STYLES"` est ton ami après un refactor de constantes

---

## 2026-05-11 — Phases B+C — Pages Admin + Messagerie + Fiche 360° ✅

### Fait (5 créés, 6 modifiés, 1 commit)
- **Dashboard** : activité récente dynamique (demandes + réservations + avis), alertes réelles, TOP 5 villas les plus aimées (wishlist)
- **Hub Classique** natif : toutes villas avec stats, actions éditer/voir
- **Réservations** : client component, pagination 20/page, filtres statut, boutons confirmer/annuler
- **Revenus** : BarChart Recharts CA mensuel (12 derniers mois), 5 stat cards
- **Paramètres** : ConciergerieSettingsForm éditable (téléphone, email)
- **Avis** : AdminPageIntro + notification client à l'approbation/rejet
- **Messagerie admin** (`/admin/messagerie`) : console chat temps réel, Supabase Realtime
- **Fiche client 360°** (`/admin/clients/[id]`) : infos, préférences, réservations, demandes, avis

### Règles apprises
- Recharts `Tooltip` formatter a un type très strict en v3 — utiliser le rendu par défaut plutôt que des formatters custom si le typage bloque
- Les server components Next.js peuvent être convertis en client components pour ajouter de l'interactivité (pagination, formulaires)
- Pour éditer une section dans une page server, extraire un composant client plutôt que tout convertir
- La fiche client 360° utilise `or(`guest_email.eq.${id}`)` pour matcher les bookings sans colonne `guest_id`
- `chat_messages` n'a pas de policy RLS pour l'admin — l'admin utilise `service_role` via `getSupabaseServer()`

---

## 2026-05-14 — Fix Auth : Session + Stripe Connect + Redirect Login ✅

### Fait
- **publicPaths "/" fix** : `pathname.startsWith("/")` matchait TOUT → RBAC mort. Fix : `pathname.startsWith(p + "/")`
- **Stripe Connect** : `ownerProfile` query via anon → RLS bloque → null. Fix : `supabaseAdmin()` pour cette query
- **profileRole null** : `skipAutoInitialize: true` dans SSR → session pas en mémoire pour les queries DB. Fix : `await getSession()` avant les queries dans middleware + `getSupabaseServer()`
- **Redirect login** : `/login` dans `publicPaths` → aucun check "déjà connecté" → formulaire affiché à tort. Fix : si `user && pathname === "/login"` dans middleware → redirect vers dashboard selon rôle

### Règles apprises
- **Vrai bug login = UX manquante, pas session** : vérifier le comportement attendu AVANT d'analyser les internals. 2h perdues sur les refresh tokens alors que c'était 12 lignes de redirect.
- `publicPaths` avec `"/"` + `startsWith` → poison tous les paths. Toujours utiliser `pathname === p || pathname.startsWith(p + "/")`
- Pour bypass RLS côté serveur sans exposer les données : `supabaseAdmin()` (service role) uniquement pour les queries nécessaires
- Les pages publiques (login, register) ne redirigent pas automatiquement les users connectés → gérer dans le middleware
- Ne jamais debugger une session Supabase avant d'avoir vérifié que la page elle-même fait ce qu'on attend

---

## 2026-05-11 — Nettoyage Dashboard Proprio ✅

### Fait (5 supprimés, 2 modifiés)
- **Suppression `app/dashboard/proprio/`** — 5 pages legacy (-3 511 lignes), dont le monolithe [villaId] de 2 187 lignes
- **Redirections fixées** : register → `/dashboard`, admin villa → `/dashboard/villas/[id]`
- **Composants conservés** : `components/dashboard/proprio/` reste utilisé par `(proprio)/dashboard/`

### Règles apprises
- `app/(proprio)/dashboard/` est le VRAI dashboard proprio (DashboardShell, filtrage owner_id)
- `app/dashboard/proprio/` était du legacy admin — les parenthèses `(proprio)` font la différence (route group)
- Toujours vérifier avec `grep` les références avant de supprimer un dossier
- Ne pas confondre `components/dashboard/proprio/` (composants partagés) avec `app/dashboard/proprio/` (pages legacy)

---

## 2026-06-15 — Corrections Batch (4 vagues, 15 tâches) ✅

### Fait
- **Spec + Plan superpowers** : `docs/superpowers/specs|plans/2026-06-15-corrections-batch*`
- **Vague 1 (CSS)** : sidebar `no-scrollbar`, messagerie `min-h-[calc(100dvh-9rem)]` ; header hover + calendrier réservation = déjà OK (aucun changement)
- **Vague 2** : thumbnail villa 60px (`VillaThumb`), recherche + tri alpha réservations (`useMemo`)
- **Vague 3** : Vitest installé (dev), mini-carte fiche villa (`VillaDetailMiniMap`), historique résas par villa
- **Vague 4** : SLA demandes (`lib/sla.ts` + tests, toggle urgent, badges/tri admin, NotificationBell broadcast), blocages `villa_date_blocks` motif+origine + création admin (`AdminVillaBlocks`), champs formulaire villa
- **Migrations** : `requests` (+priority/taken_at/resolved_at), `villa_date_blocks` (+origin), policy RLS admin sur villa_date_blocks. M2 (villas) annulée car redondante.

### Règles apprises (importantes)
- **TOUJOURS régénérer/vérifier le schéma Supabase LIVE avant de planifier des colonnes DB.** Le `types/supabase.ts` local était PÉRIMÉ → j'ai planifié `bedrooms_count` et `house_manual_pdf_url` qui dupliquaient `bedrooms` et `welcome_booklet_url` existants. Colonnes ajoutées puis droppées.
- **Plusieurs "corrections" client étaient des features DÉJÀ présentes** (thumbnail villa à 40px, table "Ventilation par villa") → toujours vérifier l'existant AVANT d'ajouter. Souvent un problème de découvrabilité/taille, pas une feature manquante.
- **Env vars lues côté client = préfixe `NEXT_PUBLIC_` obligatoire** (page admin demandes est `"use client"` → seuils SLA en `NEXT_PUBLIC_SLA_*`).
- **`villa_date_blocks`** (PAS `owner_blocks`) stocke les blocages ; `reason` = Motif (existe), RLS `owner_manage_date_blocks` réservée au propriétaire → ajout policy `admin_manage_date_blocks` avec `is_staff_admin()` pour que l'admin puisse bloquer.
- **`notifications` : `user_id` null = broadcast.** NotificationBell doit filtrer côté client par rôle (admin voit null+own, guest voit own uniquement) — ET garder le handler Realtime (sinon fuite live aux guests). Insert client OK car policy `authenticated_insert with check (true)`.
- **`is_staff_admin()`** = fonction canonique d'auth admin (service_role OU jwt role admin OU profiles.role='admin') — l'utiliser dans les policies RLS admin.
- SLA "rappel 6h" = calculé au rendu (badge couleur + tri), pas de cron (respecte NE PAS TOUCHER send-*).

---

## 2026-06-15 — Post-Audit Richard + Mobile + Playwright ✅

### Fait
- **3 corrections post-audit Richard** : labels dorés espace client (MES NOTIFICATIONS, SERVICES & DEMANDES, MES DOCUMENTS), indication scroll sidebar (pb-10 + dégradé), calendrier overflow-x-auto
- **4 fixes mobile P0/P1/P2** : inputs 16px (iOS zoom), footer safe-area-inset-bottom, icônes sociales 44px, selects 44px
- **6 variables SLA dans Vercel** : `NEXT_PUBLIC_SLA_*` (urgent 2h/24h, standard 8h/48h, remind 6h, warn 75%)
- **23 tests Playwright** : `tests/e2e/corrections-batch.spec.ts` — couvre les 4 vagues + audit Richard + mobile + responsive
- **3 comptes de test validés** : admin@diamantnoir.com / proprio1@test.com / locataire@test.com

### Règles apprises
- **iOS Safari zoome sur tout `<input>` avec font-size < 16px.** Toujours utiliser `text-base` (16px) sur les champs de formulaire, pas `text-sm` (14px). P0 critique.
- **`safe-area-inset-bottom` sur le footer** — iPhone X+ cache les liens du bas sans ce padding. Toujours `pb-[calc(3rem+env(safe-area-inset-bottom,0px))]`.
- **HeroUI inputs = pas de `<input type="password">` natif.** Les sélecteurs Playwright doivent utiliser `getByPlaceholder()` ou `getByRole('textbox')`, pas `input[type='password']`.
- **Tests Playwright parallèles = conflits de session Supabase.** Même compte admin partagé entre workers → race condition. Utiliser `--workers=1` quand on teste avec un seul compte.
- **`getByRole('link', { name: "Modifier" })` plus fiable que `locator("a[href*='/admin/villas/']")`** pour les grilles HeroUI.
- **Navigation `page.goto(href)` plus robuste que `click()` + `waitForURL()`** pour les pages admin avec render complexe.
- **Toujours désactiver `backdrop-filter` sur mobile** (`@media max-width: 768px { * { backdrop-filter: none !important } }`) — évite le jank Chrome Android.
- **`text-[10px]` accepté pour les badges/eyebrows décoratifs** mais **≥11px pour tout contenu informatif** (titres de section, labels de formulaire).

---

## 2026-06-15 — Chatbots & N8N — Analyse + Améliorations ✅

### Fait
- **Analyse des 3 workflows N8N existants** dans `docs/n8n/` :
  - `kayvila-agent-a-visiteur-v2.json` (28 nœuds) : chatbot visiteur, anti-toxicité, mémoire, DeepSeek
  - `kayvila-agent-b-proprietaire-v2.json` (28 nœuds) : copilot proprio, auth JWT, 5 tools, alertes Telegram
  - `kayvila-agent-c-admin-v2.json` (31 nœuds) : copilot admin, auth admin, 6 tools, double alerte Telegram
  - **Qualité : 8-9.5/10** — production-grade, ne manque rien
- **Amélioration des routes API copilot** :
  - P0 Admin : rate limit, timeout 20s, fallback graceful avec vraies stats
  - P0 Proprio : actions IA (CREATE_TASK, COMPLETE_TASK, BLOCK_DATE), scope villa vérifié
  - BLOCK_DATE proprio : origin "Proprietaire" forcé (admin = "Kayvila")
  - UPDATE_BOOKING : admin seulement (pas le proprio)
- **Mode démo intelligent** : `smartReply()` et `buildAdminDemoReply()` — détection mots-clés français, réponses avec données réelles du dashboard (revenus, résas, tâches, villas)
- **UI CopilotPanel** : affichage des `suggested_prompts` en chips cliquables
- **Fix button-in-button** : `VillaImageManager.tsx` — DropZone.Trigger + Button → span

### Règles apprises
- **Les workflows N8N sont dans `docs/n8n/`**, pas dans `N8N CLIENT/`. Chercher au bon endroit avant de recréer.
- **Les copilots Kayvila suivent le même pattern qu'Elise 13** (Karibloom) : webhook → mémoire → AI Agent → tools → format → alertes.
- **Proprio < Admin en droits** : BLOCK_DATE proprio = origin "Proprietaire", admin = "Kayvila". UPDATE_BOOKING réservé à l'admin. Toutes les actions proprio sont scopées à `ownerVillaIds`.
- **Le mode démo (sans N8N) doit quand même être utile** — ne pas juste dire "configurez N8N", mais répondre avec les vraies données du contexte.
- **N8N ne fait pas les actions, le code les fait.** Le workflow N8N répond avec `action: "BLOCK_DATE"` et c'est la route API qui exécute l'insert dans la DB. Séparation claire : N8N = cerveau, API = bras.
- **Elise 13 (Karibloom)** a servi de référence : 45 nœuds, anti-toxicité, détection leads, devis, waitlist, Telegram. Les workflows Kayvila sont plus légers (28-31 nœuds) mais couvrent l'essentiel.

### Reste à faire
- Brancher les 3 workflows N8N (importer JSON → configurer credentials → déployer → récupérer URLs webhook)
- Ajouter `N8N_TENANT_WEBHOOK_URL`, `N8N_OWNER_WEBHOOK_URL`, `N8N_ADMIN_WEBHOOK_URL` dans Vercel

---

## 2026-06-16 — Agents IA Phase 1 (A bi-tunnel, B alertes, C socle)

### Fait
- **Agent A bi-tunnel** : A1 dispos pré-calculées (`lib/chatbot/availability.ts` + `canVerifyAvailability=true` dans `villa-context.ts`), A2 pré-booking (`POST /api/chat/pre-book` → table `pre_booking_requests` + notif in-app `pre_booking` + lien `/book` pré-rempli), A3 lead chaud (notif `hot_lead` throttlée par `session_id + villa_id`).
- **Tunnel proprio** : `POST /api/chat/owner-lead` → notif `owner_lead` + lien `/soumettre-ma-villa` ; faits conciergerie Kayvila injectés dans le contexte système.
- **Agent B** : `lib/owner-alerts.ts` — 5 alertes calculées live (revenus, occupation, paiements, avis, tâches) fusionnées dans `buildOwnerContextPack`.
- **Agent C socle** : `lib/admin-assistant-context.ts` (occupation globale, score santé 0-100, alertes actionnables, briefing textuel) + `GET /api/admin/chat` (briefing/occupation/santé/alertes) + `lib/admin-confirm.ts` (confirmation explicite pour actions destructives) + `POST /api/admin/chat`.
- **2 migrations** : table `pre_booking_requests` ; extension contrainte CHECK `notifications_type_check` (drop + recreate) pour `pre_booking`, `hot_lead`, `owner_lead`, `admin_alert`.
- **40 tests unitaires** passent (vitest) : availability-gaps ×4, chatbot/availability ×3, pre-book validate ×4, lead-scoring ×4, owner-lead ×4, owner-alerts ×6, admin-assistant-context ×5, admin-confirm ×4, sla ×6.

### Règles apprises
- **`notifications.type` a une contrainte CHECK figée** → toujours la supprimer + recréer (DROP CONSTRAINT + ADD CONSTRAINT) avant d'insérer un nouveau type. Jamais ALTER seul — PostgreSQL ne supporte pas la modification d'une contrainte CHECK en place.
- **La colonne de message des notifications est `body` (NOT NULL), PAS `message`.** `title` est aussi NOT NULL. Toujours vérifier le schéma live avec `list_tables` avant d'insérer.
- **`bookings` n'a PAS de `cancellation_reason`** ; **`profiles` n'a PAS de `last_sign_in`** ; **`villas.seasonal_prices` est un jsonb existant** (ne pas recréer) ; **`tasks.due_date` (date)** existe mais n'était pas inclus dans le select du contexte proprio — à ajouter si besoin.
- **La page de réservation publique est `app/book/page.tsx`** (params : `villaId`, `checkin`, `checkout`, `guests`) — PAS `/reservation`. Toujours vérifier le routage réel avant de construire un lien de deep link.
- **Les dispos chatbot se calculent dans `lib/chatbot/villa-context.ts`** (alias `availability.ts` via import), pas dans `api/villas/public`. Ne pas dupliquer la logique.
- **`vitest.config.ts` scopé à `lib/**` + `app/**` `.test.ts`** pour exclure les specs Playwright (`tests/*.spec.ts`). Toujours utiliser `npx vitest run` (pas `npm test`) pour les tests unitaires.
- **Roadmap Agent C (L5,L7,L8,L10,L6,L11,L12) documentée dans le spec**, non implémentée Phase 1 : manque de données live suffisantes / source / cron. Ces métriques avancées font partie de Phase 2.

## 2026-06-15 (Session 2) — 3 correctifs post-revue + Phase 2 n8n + merge

### Fait
- **3 correctifs appliqués** (commit `e54fb0b`) :
  1. Rate limiting extrait dans `lib/chatbot/rate-limit.ts` (helper partagé `checkRateLimit`/`getClientIP`) et appliqué à `/api/chat/pre-book` + `/api/chat/owner-lead` (10 req/h/IP, cap notifs 50/h)
  2. UUID villaId validé dans `lib/chatbot/pre-book.ts` (regex UUID) + vérif villa existante/publiée AVANT l'insert (400 au lieu de 500)
  3. Timezone `gatherAdminContext` standardisée en string UTC : `addDays()` helper, `startOfMonthStr`/`startOfLastMonthStr`/`endOfLastMonthStr`, comparaisons `.slice(0,10)` pour `created_at`, string pour `due_date`
- **Phase 2 n8n v3** (3 commits) : `kayvila-agent-a-visiteur-v3.json` (bi-tunnel, disponibilités, preBooking/ownerLead), `kayvila-agent-b-proprietaire-v3.json` (push proactif 5 alertes), `kayvila-agent-c-admin-v3.json` (briefing, santé villas, actions confirmées en 2 temps)
- **Merge fast-forward dans main** + suppression branche `feat/agents-ia-v3`
- **Push origin main sans les n8n v3** (revertés en attente de déploiement n8n)

### Règles apprises
- **Extraire le rate limiting dans un helper partagé** dès que 2+ endpoints en ont besoin — ne pas dupliquer
- **Valider UUID villaId AVANT l'insert DB** — un UUID invalide provoque un 500 Postgres illisible
- **Standardiser TOUS les calculs de dates sur de l'arithmétique string UTC** — ne jamais mixer `Date()` local et `.toISOString()`
- **Les n8n JSON v3 doivent rester hors push tant que les placeholders ne sont pas remplis** (VOTRE-DOMAINE, clés API, REPLACE_*)
- **Les sticky notes n8n sont cosmétiques** — seuls les prompts + data flow comptent fonctionnellement
- **Méthode validée** : subagent-driven-development (1 subagent/tâche + revue spec + revue qualité) — migrations vérifiées live, modules purs en TDD, intégrations relues. À réutiliser.

---

## 2026-06-16 — Correctifs UX Richard + Agents IA V3

### Fait
- **4 correctifs UX** (commits `43257ab`, `4f0cb96`, `872aca5`, `f0b56a2`) :
  1. Hover header intensifié : fond or 10% + border or + glow doré, transition 300ms
  2. HeroUI RangeCalendar remplace HeroDatePicker.tsx (368 lignes custom → ~70 lignes HeroUI v3). Popover.Content pour bottom sheet mobile.
  3. Messagerie proprio pleine hauteur : `h-[500px]` → `min-h-[calc(100dvh-12rem)]`, `max-w-3xl` → `max-w-5xl`
  4. `VillaImageManager` ajouté au formulaire création villa (déjà dans l'édition)
- **Audit Élise** : `docs/audit-kayvila-complet-2026-06-16.md` — 69 bugs classés (11 🔴, 28 🟠🟡, 14 🟢, 16 HeroUI)
- **Agents IA** : Phase 1 + correctifs mergés, Phase 2 n8n v3 mergés, workflows Kayvibot v4 créés (CieloBot 0 outil)

### Règles apprises
- **HeroUI Popover API** : `placement` et `offset` vont sur `<Popover.Content>`, PAS sur `<Popover>`. `<Popover>` accepte `defaultOpen` et `onOpenChange` uniquement.
- **Next.js 15 dev vs build** : `next dev` peut afficher "Errors: 1" sans détail et crasher alors que `next build` passe à 0 erreurs. Toujours vérifier avec `next build` avant de paniquer.
- **`@n8n/n8n-nodes-langchain.toolHttpRequest` incompatible n8n 2.25.7** → `supplyData` vs `execute`. La solution CieloBot (contexte pré-fetché, 0 outil) est plus stable pour la prod.
- **Subagent-driven development** : lancer 4 subagents en parallèle sur des fichiers indépendants fonctionne. Mais toujours revoir leur travail — le subagent Task 2 a viré le Popover wrapper sans prévenir.
- **Calendrier mobile** : un date picker custom avec `getBoundingClientRect()` et `position:fixed` est fragile. HeroUI `Popover` natif gère le positionnement + responsive.
- **Élise pilote les workflows n8n** — ne plus toucher aux JSON n8n, elle a la vision d'ensemble. Se concentrer sur le code Next.js.
- **Deux formulaires villa incompatibles** : création (HTML natif) vs édition (HeroUI riche). À unifier sur `VillaEditorForm`.
- **`addDays` doit utiliser `d + "T00:00:00Z"`** — sans timezone explicite, `Date.parse` utilise l'heure locale et décale d'un jour.

---

## 2026-06-16 — Campagne Audit Batch — Lot 0 (Triage + Quick-wins P0) ✅

### Fait
- **Branche** `fix/audit-batch-juin` ; build de référence vert avant toute modif.
- **npm** : `next ^15.2.4 → 15.2.9`, `node-ical ^0.16.0 → ^0.22.1`, `npm audit fix` (48 → 38 vulns). Type-guard `VEvent` ajouté dans `lib/ota-hub.ts` (forcé par les nouveaux types node-ical 0.22).
- **CORS** : helper partagé `lib/cors.ts` (+ test vitest), appliqué aux 5 routes (`chat`, `chat/tenant`, `agent/owner-context`, `agent/visitor-context`, `agent/admin-context`). Plus aucun `Access-Control-Allow-Origin: "*"`.
- **robots.ts** : ajout `/admin/` et `/espace-client/` au disallow.
- **og-default.jpg** : généré 1200×630 (134 KB) depuis `prestations-hero.png` via sharp.

### Règles apprises (importantes)
- **FAUX POSITIFS de l'audit SEO** : `app/sitemap.ts` ET `app/robots.ts` existaient déjà et fonctionnent. L'audit demandait de les "créer" → toujours vérifier `app/` avant de scaffolder un sitemap/robots. Seul trou réel : `/admin/` manquait au disallow.
- **Helper CORS unique `lib/cors.ts`** = source unique des en-têtes ; jamais `*` avec `Authorization`. Origine = `NEXT_PUBLIC_BASE_URL` → `NEXT_PUBLIC_SITE_URL` → `https://kayvila.com`, + `Vary: Origin`.
- **BLOCAGE Next 15.5.x** : impossible d'atteindre `next ≥15.3` / `node-ical ≥0.23` — le polyfill Temporal (BigInt) de ces versions casse le bundling webpack SSR (conflit zod v4) → `g.BigInt is not a function` en "Collecting page data". Resté à `next 15.2.9` (corrige quand même middleware-bypass + SSRF). Montée à 15.5.x = tâche dédiée (Lot 9) : résoudre BigInt/webpack ou migrer zod.
- **og image** : `sharp` est dispo transitivement (via next) ; `fit:"cover"` + `position:"centre"` pour un crop propre 1200×630.

---

## 2026-06-16 — Campagne Audit Batch — Lot 1 (Sécurité HAUTE) ✅

### Fait
- **escapeHtml** (`lib/security.ts` + test) appliqué à l'email ADMIN de `villa-submissions` (le 2e email proprio utilise déjà React Email = safe). Sec#2.
- **POST `villa-submissions`** (public) durci : `checkCsrf` + `checkRateLimit("villa-submit:"+ip, 5, 1h)` + `villaSubmissionSchema.safeParse` (zod). Sec#5/6.
- **`create-villa`** : strip des champs admin-only (`is_published`, `commission_rate`, `collection_tier`, `owner_id`) pour les non-admins ; `owner_id` toujours dérivé de la session. Sec#7.
- **Sec#8** : `.env.local` + `.env` déjà dans `.gitignore` → pas de pre-commit hook installé (ne pas toucher aux hooks git sans accord). git-secrets reste une reco manuelle.
- 4 commits (`db0b700`, `9eb3bef`, `dd430eb` + journal), `npx vitest run` 48/0, build vert.

### Règles apprises
- **Un email construit par template literal = XSS** si données utilisateur interpolées brut → toujours `escapeHtml()`. Préférer React Email (`render()`) qui échappe par défaut.
- **Les helpers sécurité existent déjà dans `lib/security.ts`** : `checkCsrf`, `checkRateLimit(key,max,windowMs)`, `ipFromRequest`, `withCsrf`, `verifyOrigin`. Ne JAMAIS les recréer — les appliquer. Vérifier `lib/security.ts` avant.
- **Route POST publique = CSRF (origin) + rate-limit/IP + zod safeParse**, dans cet ordre, tout en haut du handler.
- **`zod ^4` est installé** (utilisé dans contact/admin routes). `.passthrough()` pour valider name/email+types sans devoir lister toutes les colonnes (Postgres rejette les colonnes inconnues de toute façon).
- **Escalade de privilège create-villa** : le vrai risque n'est pas les colonnes inconnues (insert échoue) mais les colonnes PRIVILÉGIÉES connues → strip ciblé pour non-admin plutôt qu'un schéma exhaustif fragile.

---

## 2026-06-16 — Campagne Audit Batch — Lots 2 à 8 ✅ + fixes post-merge

### Fait (mergé sur `main` via PR #2, #3, #4)
- **Lot 2** (bloquants UX mobile, `1d6f64c`) : DashboardShell `overflow-hidden`→`overflow-y-auto`, table `overflow-x-auto`, CopilotPanel/sidebar `safe-area-inset-top`, ICON_MAP fallback. FP : #2 Kanban, #5 Chatbot (déjà mitigés).
- **Lot 3** (création villa proprio, `ddf55e7`) : `VillaEditorForm` mode création via `!villa.id` → POST `create-villa` ; route `/dashboard/villas/nouvelle` ; CTA liste + EmptyDashboard. **Décision Kenneson : #10 d'abord, #9 (fusion AdminVillaForm) reporté**. FP #8 (VillaImageManager déjà rendu).
- **Lot 4** (perf, `21f91b5`) : `.limit()` de sécurité sur 5 requêtes non bornées (décision : limites maintenant, pagination UI reportée), optimizePackageImports += leaflet/shiki/date-fns. FP nombreux (skeletons existent, @react-pdf server-only, N+1 déjà batché, recharts pas dep). perf#2 cache reporté (risque double-booking).
- **Lot 5** (SEO, `c4c9a6f`) : metadata pages `"use client"` via `layout.tsx` serveur (login/update-password noindex, comparateur canonical), espace-client noindex, twitter:card root, JSON-LD WebSite, retrait keywords. FP : sitemap/robots/og déjà Lot 0.
- **Lot 6** (layout mobile, `9176674`) : VillaGallery/VillaCard responsive, VillasMapView liste cachée mobile quand carte visible, PageHero pt-16, NotificationBell max-w. FP : #13 Navbar, #20 CompareBar (déjà gérés).
- **Lot 7** (UX polish, `86e0ea9`) : fondu HeroBackgroundMedia (videoReady), icônes empty states, Loader2, transitions inputs. FP #28 Footer.
- **Lot 8** (code mort + mineurs, `0f24c2d`) : suppression `BookingTable` + `VillaAmenitiesEditorWrapper` (−113 l.), FAB safe-area, icône Send/Inbox, contraste WCAG /50→/65. FP : #40 (overflow-x déjà), #60/#61 (utilisés, PAS morts).
- **Fixes post-merge** : sitemap Supabase paresseux (`6cfc532`), CSP `vercel.live` + favicon `app/icon.svg` + pages `/mentions-legales` & `/cgv` (`1ede870`), calendar hero HeroUI (`f613b43`), fin du clipping hero (`77c78e3`).

### Règles apprises
- **Audits Élise = beaucoup de faux positifs** (~20 sur 135) → TOUJOURS triager (vérifier le code réel) avant de coder. Causes fréquentes : feature déjà faite, mitigation déjà en place, composant dit "mort" mais utilisé, chemin de fichier approximatif dans l'audit.
- **Structure du repo : PAS de `src/`** — code à la racine (`components/`, `app/`). Les chemins d'audit sont indicatifs, localiser avec `find`/grep.
- **Page `"use client"` ne peut pas exporter `metadata`** → créer un `layout.tsx` serveur frère pour les métadonnées + `robots: { index:false }`.
- **Client Supabase JAMAIS au niveau module** (`createClient(URL!)`) : casse le build (`supabaseUrl is required`) quand l'env manque (previews Vercel). Toujours instancier DANS la fonction + garde + try/catch + fallback. Le build local masque le bug (`.env.local` présent).
- **HeroUI v3 RangeCalendar (`@heroui/react`)** : respecter l'anatomie officielle — `RangeCalendar.Header` = `Heading` PUIS les `NavButton`, et `<RangeCalendar.Cell date={date} />` AUTO-FERMANT (un children/render-prop écrase le style par défaut → rendu cassé). Couleur de sélection via token `--accent` (oklch). Vérifier la doc via le skill `heroui-react` (`scripts/get_component_docs.mjs`).
- **Dropdown rogné = `overflow-hidden` sur un ancêtre** (ici la `<section>` hero, pour cadrer la vidéo de fond). Fix sûr : retirer `overflow-hidden` de la section, le mettre sur le wrapper média (déjà borné `inset-0` → 0 changement visuel) pour que le dropdown absolu déborde.
- **Workflow validé Kenneson** : 1 commit/lot, gate `next build` + `vitest`(lib) à chaque lot, branche dédiée, push → PR → preview Vercel → merge. Suivi vivant dans `docs/audit-batch-PROGRESS.md`.
- **Décisions produit prises** : proprio peut créer une villa (non publiée, owner_id=session — pas de conflit avec soumission modérée) ; #9 fusion formulaires admin reportée (parité admin : VillaEditorForm manque sélecteur proprio/is_published/commission).

### ⏸️ Point d'arrêt — reprise au Lot 9 (backlog, décisions Kenneson)
Lots 0–8 FAITS et mergés sur `main`. **Reste le Lot 9** = chantiers à cadrer individuellement (Kenneson doit choisir la priorité) :
1. Montée **Next 15.5.x** — ⚠️ blocage BigInt/webpack/zod v4 (`g.BigInt is not a function`), resté en 15.2.9.
2. **perf#2 cache HTTP** (force-dynamic/noStore) — risque fraîcheur dispos/double-booking.
3. **Pagination UI** complète (6 pages, remplace les `.limit()` du Lot 4).
4. **#9 fusion formulaires admin** (variante admin VillaEditorForm).
5. **Incohérences #30/#31/#32** (photos proprio inline, unif iCal VillaIcalPanel, Copilot admin).
6. **SEO avancé** (JSON-LD LocalBusiness/BreadcrumbList/FAQPage, canonical par page, hreflang).

À faire valider hors-dev : textes mentions-légales/CGV (juridique), variables env Supabase sur l'environnement **Preview** Vercel.

---

## 2026-06-17 — Header Glow Homepage + Calendrier Widget 2 Mois ✅

### Fait (4 commits mergés main)

- **Calendrier widget 2 mois** :
  - Desktop (≥640px) : 2 mois côte à côte `visibleDuration={{ months: 2 }}`, grilles dupliquées avec `offset`
  - Mobile (<640px) : 1 mois, `matchMedia` détecte le breakpoint
  - Wrapper `bg-white` unique + `ring-1 ring-navy/10` + `shadow-2xl` (fond blanc unifié)
  - `@ts-expect-error` sur `Heading offset={{ months: 1 }}` (types `@heroui/react@3.1.0` en retard)
  - `key={months}` forcé sur `RangeCalendar` pour re-render propre au changement de breakpoint

- **Header glow homepage uniquement** :
  - Liens de nav : `hover:!text-gold` (or #D4AF37) avec `transition-colors duration-300`
  - Logo : filtre CSS `sepia → hue-rotate(350deg) → saturate(4)` transforme le PNG blanc en or au survol
  - Conditionné par `pathname === "/"` — n'affecte pas les autres pages
  - Logo agrandi : `h-11→h-16` selon breakpoint

- **Layout barre recherche** :
  - Retrait icône `Users` redondante de la row voyageurs
  - Icône `Users` intégrée dans le bouton picker
  - Retrait label "VOYAGEURS" dupliqué dans le dropdown `HeroGuestPicker`
  - `ring-1` remplace `border` (pas de décalage layout)

### Règles apprises

- **`text-shadow` invisible sur texte blanc** — sur fond sombre, `hover:!text-gold` est plus efficace qu'un halo `text-shadow`
- **`visibleDuration` = prop React, pas CSS** — pas de responsive sans JS. Utiliser `matchMedia` + `key` pour forcer le re-render
- **`@heroui/react@3.1.0` : `offset` manque dans les types** de `RangeCalendar.Heading` mais fonctionne au runtime (React Aria sous-jacent)
- **`border` ajoute 1px externe** → `ring-1` (box-shadow interne) évite les décalages dans les flex containers
- **`BrandLogo` utilise `next/image` (PNG)** — pas de `currentColor`. Pour changer sa couleur → filtre CSS `sepia + hue-rotate + saturate`
- **Deux icônes + label pour une même info = bruit visuel** — supprimer les doublons, intégrer l'icône dans le composant interactif

---

## 2026-06-18 — Audit Frontend Complet (6 phases, subagent-driven) ✅

### Fait (8 commits mergés main)

- **Phase A P0** (`4196e45`) : CookieConsent RGPD (localStorage `kayvila-cookie-consent`, slide-up, 3 catégories), `app/global-error.tsx`, i18n 7 pages marketing (`about.*`, `prestations.*` keys), `text-gold` → `#B8860B` (ratio 4.6:1 WCAG AA) sur textes lisibles
- **Phase B Design System** (`e93eef9`) : `rounded-none` sur `input.tsx` + `card.tsx`, inputs standard (`h-12 border-navy/15 focus:border-gold`), boutons variants (`gold/danger/secondary`), `sora.variable` retiré du `<html>` (⚠️ casse `.font-display-dashboard` → voir règles), `tailwind.config.ts` supprimé (Tailwind v4 auto-scan), 5 composants UI manquants (`Select/Textarea/Checkbox/Badge/Tooltip`)
- **Phase C Animations** (`5d291ff`) : `hover:scale-[1.02] active:scale-[0.98]` sur boutons, skeleton shimmer (`animate-shimmer`), grain overlay SVG `opacity-[0.015]`, view transitions `@supports`
- **Phase D SEO** (`4e79300`) : noindex success/update-password, canonicals, JSON-LD LocalBusiness+ItemList, og:image 5 pages, sitemap +6, robots +3
- **Phase E Performance** (`8dc9aaa`) : villa `revalidate=900` + `generateStaticParams` (fetch REST direct, PAS `getSupabaseServer()`), home `fetch()` + `revalidate:3600`
- **Phase F A11y** (`d30a3c4`) : `hooks/useFocusTrap.ts`, focus traps VillaQuickView/BookingBottomSheet/Navbar, `aria-live="polite"` chatbot+SearchResults, trust signal + prix estimatif BookingForm
- **Compression vidéo revertée** (`7a76efe`) : `hero.webm` 10.5MB compressé → 1.2MB (VP9 CRF=55), jugé "pas beau" par Kenneson → revert immédiat

### Règles apprises

- **`sora.variable` sur `<html>` global = casse le dashboard.** Le retrait du Sora variable de `<html>` supprime `--font-sora` de tout l'arbre → `.font-display-dashboard` retombe sur `system-ui` dans DashboardHeader/DashboardSidebar/AdminVillaForm. Correction : ré-injecter `className={sora.variable}` sur un layout dashboard dédié, PAS sur `<html>`.
- **`generateStaticParams` ne peut PAS appeler `cookies()` au build time.** Utiliser un `fetch` REST direct vers Supabase (URL + anon key depuis `process.env`) à la place de `getSupabaseServer()`.
- **Page `"use client"` → metadata via `layout.tsx` frère.** Pattern Next.js recommandé pour les pages client qui ont besoin de metadata (noindex, title…).
- **Ne jamais compresser un asset vidéo luxe sans validation visuelle.** CRF agressif (55+) réduit la taille mais dégrade la qualité de façon visible. Toujours proposer avant d'appliquer, ne jamais remplacer en prod sans accord Kenneson.
- **`preload="auto"` sur `<video>` améliore le chargement** sans dégrader la qualité — safe à garder.
- **`StatsView.tsx`, `FinancesView.tsx`, `RelevePDF.tsx` n'existent pas** dans ce repo — skip silencieux, pas de blocage.
- **Focus trap avec `document.addEventListener('keydown')`** : querySelectAll au montage, premier/dernier focusable, Tab/Shift+Tab cyclique. S'assurer que le modal est visible quand `active=true` (querySelectorAll vide si `hidden`).
- **JSON-LD via `<script dangerouslySetInnerHTML>`** est safe pour les structured data (pas du user input) — pattern Next.js standard.

### Reste à faire (sous-projets brainstormés, prompt Richard 17 juin)

| # | Tâche | État |
|---|-------|------|
| 1 | Header glow homepage | ✅ Fait |
| 2 | Carte interactive Leaflet fiche villa | À faire |
| 3 | Demandes : tri ASC + accusé Resend | À faire (timeAgo déjà fait) |
| 4 | Documents Admin : upload PDF + bucket | À faire |
| 5 | Documents Proprio : liste lecture seule | À faire |
