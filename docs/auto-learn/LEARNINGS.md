# Kayvila — Apprentissages

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
