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
