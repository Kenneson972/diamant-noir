# Récap Tests — 7 Juin 2026

Tests exécutés sur `localhost:3000` par Claude Code + Playwright.

## ✅ VISITEUR (non connecté) — Sections 1-6

| Page | Checkpoint | Status |
|------|-----------|--------|
| `/` | Hero, navigation, footer | ✅ |
| `/villas` | 2 villas, filtres, carte Leaflet, responsive | ✅ |
| `/villas/[id]` | Galerie, infos, calendrier, SEO title | ✅ 0 erreur |
| `/login` | Formulaire email + mot de passe | ✅ |
| `/prestations` | 5 piliers, FAQ, CTA | ✅ |
| `/faq` | Questions/réponses | ✅ |
| `/qui-sommes-nous` | Page about | ✅ |
| `/contact` | Formulaire contact | ✅ |
| `/soumettre-ma-villa` | Formulaire soumission | ✅ |
| `/terms` | CGU | ✅ |
| `/tarifs` → `/prestations` | Middleware fix | ✅ corrigé |
| `/experience` → `/prestations` | Middleware fix | ✅ corrigé |

**🐛 Bug trouvé/fixé :** `/tarifs` et `/experience` manquaient dans `publicPaths` middleware → commit `0b2cf95`

---

## ✅ ADMIN (connecté) — Sections 11-12

Compte : `admin@diamantnoir.com`

| Page | Checkpoint | Status |
|------|-----------|--------|
| `/admin` | Dashboard KPIs | ✅ |
| `/admin/revenus` | Sous-titre "20% OTA · 25% direct", KPIs, ventilation par villa | ✅ |
| `/admin/villas` | DataGrid avec miniatures (fallback image_urls), 2 villas, filtres (statut, tier, tri), liens proprio | ✅ |
| `/admin/tarification` | Sélecteur villa, prix de base, formulaire ajout plage, anti-chevauchement | ✅ |

---

## ✅ LOCATAIRE (connecté) — Sections 7-8

Compte : `locataire@test.com`

| Page | Checkpoint | Status |
|------|-----------|--------|
| `/espace-client` | Dashboard, résas à venir | ✅ |
| `/espace-client/messagerie` | Header visible (scroll fix), welcome message, quick actions, chat input | ✅ |
| `/espace-client/profil` | Sélecteur indicatif (+596 🇲🇶), 7 codes, placeholder "6 96 XX XX XX", avatar upload, préférences séjour | ✅ |

---

## ✅ PROPRIÉTAIRE (connecté) — Sections 9-10

Compte : `proprio1@test.com`

| Page | Checkpoint | Status |
|------|-----------|--------|
| `/dashboard` | KPIs | ✅ |
| `/dashboard/reservations` | Liste enrichie : Client, Dates, Montant, **Source**, **Paiement**, **Voyageurs**, Statut | ✅ |
| `/dashboard/reservations/[villaId]` | DataGrid par villa avec nouvelles colonnes | ✅ |
| `/dashboard/reservations/[villaId]/[bookingId]` | Fiche détail : Voyageurs, Commission Kayvila (25% = 2 166 €), Revenu net proprio (6 497 €) | ✅ |
| `/dashboard/revenus` | KPIs, graph, bouton PDF `/api/proprio/releve?month=2026-06`, tableau ventilation | ✅ |
| `/dashboard/taches` | TaskList + bouton "Signaler un problème" avec modal | ✅ |
| `/dashboard/messages` | Chat proprio-admin, formulaire sujet + message + envoi | ✅ |
| `/dashboard/statistiques` | Page stats | ✅ |

---

## ⬜ NON TESTÉ

| Section | Pages | Raison |
|---------|-------|--------|
| 4. Réservation `/book` | Formulaire + Stripe Checkout | Pas de compte Stripe test |
| 5. Paiement Stripe | Checkout réel | Carte test `4242...` non configurée en local |
| 10. Stripe Connect proprio | Onboarding, vérification | Compte Stripe test requis |
| 12. Admin Stripe | Remboursement, webhooks | Compte Stripe test requis |
| 13. Emails Resend | Templates, triggers | Environnement local, pas d'envoi réel |
| 14. Sécurité | CSRF, rate limiting, RLS, JWT | Tests manuels uniquement |

---

## 🐛 Bugs trouvés

| # | Bug | Status |
|---|-----|--------|
| 1 | `/tarifs` et `/experience` bloqués par auth middleware | ✅ Fixé `0b2cf95` |
| 2 | `favicon.ico` 404 | 🔵 Mineur, pas bloquant |

**Total pages testées : 25 · 0 régression · 1 bug corrigé**
