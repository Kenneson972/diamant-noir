# Récap Travail — Diamant Noir / Kayvila

> Synthèse de tout le travail effectué sur la conciergerie de luxe Diamant Noir.
> Mise à jour : 11 mai 2026

---

## 1. Stack technique

| Couche | Technologie |
|--------|------------|
| Framework | Next.js 15 App Router |
| Langage | TypeScript strict |
| Base de données | Supabase (Postgres) |
| Auth | Supabase Auth + @supabase/ssr |
| Paiement | Stripe (Checkout + Webhooks) |
| CSS | Tailwind CSS 3 |
| UI | Composants maison + Recharts |
| Tests | Playwright |
| Hébergement | Vercel (prévu) |

---

## 2. Fonctionnalités livrées

### Site public
- [x] Page d'accueil avec hero section minimaliste (palette navire/or re-travaillée)
- [x] Catalogue villas avec fiches détaillées
- [x] Page tarifs
- [x] Page prestations (marketing, finance, opérations, voyageurs)
- [x] Page expérience
- [x] Page propriétaires
- [x] Page "Qui sommes-nous"
- [x] Formulaire de contact (validation Zod + honeypot)
- [x] Formulaire "Soumettre ma villa"
- [x] Cookie Consent Banner
- [x] Newsletter signup
- [x] SEO metadata sur toutes les pages

### Espace client
- [x] Compte client avec réservations
- [x] Messagerie client
- [x] Checklist séjour
- [x] Livret d'accueil

### Dashboard propriétaire (10 pages)
- [x] Tableau de bord (KPIs, résas à venir)
- [x] Mes villas (liste + édition + photos)
- [x] Réservations par villa (liste + détail)
- [x] Revenus (graphiques Recharts)
- [x] Tâches de maintenance
- [x] Statistiques par villa (occupation)

### Dashboard admin (7 pages)
- [x] Vue d'ensemble (KPIs globaux)
- [x] Gestion villas (toutes)
- [x] Gestion propriétaires
- [x] Réservations globales
- [x] Clients
- [x] Revenus
- [x] Paramètres

### Paiements
- [x] Stripe Checkout Session
- [x] Webhook Stripe avec idempotence
- [x] Acompte 30% (configurable)
- [x] Remboursement automatique si annulation

### Sécurité
- [x] RLS sur toutes les tables (8+ policies)
- [x] Middleware auth guard
- [x] CSP headers
- [x] Rate limiting (booking, contact, import)
- [x] API key protection (notifications)
- [x] Validation Zod (booking, contact)
- [x] Honeypot anti-spam

---

## 3. Problèmes connus / à résoudre

### Bloquant
- **Login → redirect loop** : après login, le middleware ne détecte pas la session utilisateur. Suspecté : cookies Supabase non lus par `@supabase/ssr` dans le middleware. Le serveur tourne sur le port 3003. À diagnostiquer.

### Migrations DB restantes
- **Table `public.villa_events`** manquante (analytics)
- Créer les profiles pour les utilisateurs existants (trigger OK pour les nouveaux)

### Non migré de l'ancien monolithe
- Assistant IA propriétaire
- Submissions (soumettre ma villa)
- Analytics détaillés

---

## 4. Migrations SQL exécutées

| Migration | Objet | Statut |
|-----------|-------|--------|
| `tenant_bookings_rls_calendar_fix.sql` | Fix RLS bookings + calendar | OK |
| `20260501_stripe_idempotence.sql` | Idempotence Stripe + historique statuts | OK |
| `20260501_rls_audit.sql` | Policies RLS (10 tables) + index | OK |
| `20260501_create_profiles.sql` | Table profiles + trigger | OK |

---

## 5. Tests

| Test | Statut |
|------|--------|
| `npm run build` (TypeScript) | OK (0 erreurs) |
| `npx tsc --noEmit` | OK (0 erreurs) |
| Playwright : search | Créé |
| Playwright : login | Créé |
| Playwright : booking | Créé |

---

## 6. Structure du projet (extrait)

```
app/
├── (proprio)/dashboard/     # Dashboard propriétaire (10 pages)
│   ├── page.tsx             # KPIs, résas
│   ├── villas/              # Liste + édition + photos
│   ├── reservations/        # Résas par villa + détail
│   ├── revenus/             # Graphiques
│   ├── taches/              # Maintenance
│   └── statistiques/        # Occupancy
├── (admin)/admin/           # Dashboard admin (7 pages)
│   ├── page.tsx             # KPIs globaux
│   ├── villas/              # Toutes villas
│   ├── proprietaires/       # Gestion
│   ├── reservations/        # Toutes résas
│   ├── clients/             # Base clients
│   ├── revenus/             # Résumé
│   └── parametres/          # Configuration
├── espace-client/           # Espace client
├── dashboard/proprio/       # Ancien monolithe (à migrer)
└── ...
components/
├── dashboard/proprio/       # 18 composants typés
├── dashboard/admin/         # 4 fichiers
├── dashboard/villa-editor/  # VillaFormFields, Amenities, ImageManager
└── ui/                      # Primitives (barrel export)
types/
├── domain.ts                # 28 interfaces métier
├── supabase.ts              # Database 18 tables
└── index.ts
lib/
├── security.ts              # Auth API, rate limiting, CSP
├── schemas.ts               # Validations Zod
├── supabase.ts              # Client browser
└── supabase-server.ts       # Client server
middleware.ts                # Auth guard
```

---

## 7. Travail récent (mai 2026)

### 11 mai — Phase 1 Espace Client Fonctionnel ✅
- **Request System** : 7 créés (RequestForm, RequestList, CheckinGuide, CheckoutInstructions, /demandes, /admin/demandes, migration SQL)
- **Fonctionnalités** : demandes voyageur→admin, check-in autonome (digicode 24h avant), check-out checklist, facture PDF, profil enrichi (allergies, occasion, bébé)
- **Vision** : Spec 16 fonctionnalités en 3 phases. Document gérant : `docs/vision-espace-client-kayvila.md`

### 11 mai — Uniformisation Dashboards ✅
- **DashboardShell unique** : sidebar dark, fond offwhite, Lucide, ≥11px, zéro side-stripe
- **9 fichiers supprimés** : Admin/Owner/Tenant layouts remplacés par 3 composants partagés

### 10 mai — Audit + Corrections ✅
- **Audit 5 dimensions** (score 13→18/20) : accessibilité, performance, theming, responsive, anti-patrons
- **Corrections** : tokens Tailwind (21+ hex migrés), texte ≥11px, skip-to-content, FAQ (4 contradictions corrigées)

## 8. Prochaines étapes

1. **Stripe** : intégration paiement en ligne
2. **Phase 2 Espace Client** : partage séjour, calendrier, guide alentours, services ponctuels
3. **Phase 3 Espace Client** : notifications, avis, parrainage, favoris
4. **Déploiement Vercel** : lier le repo, configurer env vars
5. **Tests end-to-end** : valider le tunnel complet login → réservation → demande → admin
