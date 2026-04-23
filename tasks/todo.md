# TODO — NAORIVA
## 📌 Dernière session : 2026-04-14

---

## ✅ Terminé

- [x] Init projet Next.js 14 App Router + Supabase + Stripe + Tailwind
- [x] Landing page (hero, collection villas)
- [x] Catalogue villas + fiche villa (galerie, calendrier dispo)
- [x] Checkout 2 étapes + Stripe
- [x] Dashboard proprio (CRUD villas, réservations, publié/brouillon)
- [x] Assistant IA admin (Command Center) + KPIs
- [x] Import villa depuis URL Airbnb
- [x] Sync iCal Airbnb (cron Vercel horaire)
- [x] Pages publiques : Prestations, Qui sommes-nous, Contact, Soumettre ma villa
- [x] Analytics par villa (clics, visites)
- [x] Google Maps par villa
- [x] Conditions annulation / règlement / sécurité sur fiche villa
- [x] Partage villa (WhatsApp, Facebook)
- [x] Devise EUR/USD + Langue FR/EN (base)
- [x] Mail confirmation client (webhook n8n)
- [x] Soumissions villa → dashboard Richard
- [x] SEO : sitemap, robots.txt, pages légales
- [x] Optimisation bundle (optimizePackageImports)
- [x] Chatbot responsive (useMediaQuery)
- [x] Règles client-builder-rules dans .cursor/rules
- [x] **Hub multi-OTA** : Airbnb, Expedia, Trivago, Vrbo, Booking (`lib/ota-hub.ts`)
- [x] **API sync-ota** : endpoint manuel par villa + ajout URL à la volée
- [x] **OTAChannelsManager UI** : onglet canaux OTA dans dashboard villa
- [x] **Emails auto soumission villa** : accusé réception, validation, refus (`lib/email-templates.ts`)
- [x] **Espagnol** : 3ème langue FR/EN/ES dans `lib/i18n.ts`
- [x] **Flow sans photos** : case + champ disponibilités, badge "Shooting requis" dashboard
- [x] **FAQ** : 5 questions dans page Contact
- [x] **Page Services Propriétaires** : `/services-proprietaires` + lien Navbar
- [x] **Import Airbnb côté public** : URL → pré-remplissage formulaire soumission
- [x] **Page `/prestations`** : refonte complète "use client", animation canvas scroll GSAP 561 frames WebP, 5 sections glassmorphism, TypeScript clean
- [x] **Copilot propriétaire — hardening** : types partagés (`OwnerAssistantAction`), cache contexte 30s, métriques rolling 30j, rate limit 20 req/min, validation input, timeout n8n 15s, fallback propre, hint d'aide UX

---

## ⚠️ Actions manuelles requises (Kenneson)

- [ ] Exécuter `supabase-ota-migration.sql` dans Supabase SQL Editor (projet NAORIVA)
- [ ] Vérifier RLS dans Supabase > Auth > Policies (chat_logs, admin_chat_logs, support_tickets)
- [ ] Configurer webhook n8n : `email_confirmation`, `email_approved`, `email_rejected`
- [ ] Vérifier `.env.local` → URL + clés du projet NAORIVA (pas KARIBLOOM)
- [ ] Clés Stripe réelles dans `.env.local`

---

## 🔄 En cours / Prochaine session

- [ ] **n8n copilot proprio** : configurer `N8N_OWNER_WEBHOOK_URL` + `N8N_OWNER_WEBHOOK_SECRET`, workflow LLM avec payload structuré + `suggested_prompts`
- [ ] **Digest lundi matin** : cron n8n 08h00 → `buildOwnerContextPackCached` → email résumé propriétaire
- [ ] **Alerte gap calendrier** : trigger Supabase sur annulation → détection trou 3+ nuits → `owner_alerts`
- [ ] 2.2 Branding : hero Rocher du Diamant (photo Martinique), slides présentation conciergerie, logo final
- [ ] 3.3 Modularité : découper `app/dashboard/proprio/[villaId]/page.tsx` en sous-composants
- [ ] 3.4 Hydration sans flicker : langue/devise depuis cookie serveur dans layout

---

## 📋 À faire (déploiement)

- [ ] Configurer ESLint (`next lint` init interactive)
- [ ] CSP/headers sécurité production
- [ ] Tests e2e parcours booking + dashboard
- [ ] Déploiement Vercel + vérification cron sync
- [ ] Livret d'accueil digital par villa (QR code)
- [ ] Domaine custom + Cloudflare
