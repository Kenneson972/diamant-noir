# Template Karibloom — Pack SCALE

**Base de référence :** Kayvila / Conciergerie Diamant Noir · **Stack :** Next.js · React · TypeScript · Supabase · Stripe · FullCalendar · Tailwind

Ce template sert à démarrer un nouveau client **SCALE** (entreprise multi-acteurs avec booking, paiement, synchro agendas/OTA, espaces sécurisés client + admin + partenaires) : conciergerie, location saisonnière, réseau de prestataires, gestion immobilière, hôtellerie.

---

## 1. Ce que le pack SCALE illustre ici

| Promesse SCALE | Implémentation Kayvila |
|---|---|
| 8-10 pages + landing | Accueil, Villas, Expérience, Prestations, Tarifs, FAQ, Qui sommes-nous, Contact + soumission villa |
| IA niveau 4 — orchestration | Chatbot + workflows (notifications, rappels, demandes) |
| CRM / pipeline | Espace admin (réservations, demandes, parrainage, proprios) |
| Booking multi-agendas | FullCalendar + synchro iCal / OTA (Airbnb/Booking) |
| Espaces sécurisés multi-rôles | `/(admin)`, `/(proprio)`, `/espace-client` |
| Rappels SMS + email | check-in/checkout reminders, request updates |
| Multilingue | fr / en / es |

---

## 2. Sources de vérité

Donnée variable centralisée dans **`template/client.config.ts`**. Fichiers pivots du repo :

- `src/data/site-brand.ts` → `SITE_BRAND_DISPLAY` (nom de marque UI)
- `src/data/conciergerie-faq.ts`, `prestations-*.ts`, `seasons.ts` → contenu métier
- `tailwind.config.ts` → palette (gold/navy/cream…)
- `src/app/layout.tsx` → métadonnées multilingues

⚠️ Le nom de marque est éclaté dans **~103 fichiers** (le plus dispersé des 3 templates). Prioriser `site-brand.ts` puis traiter le reste par grep.

---

## 3. Procédure « nouveau client »

1. **Dupliquer** `diamant-noir/` → nouveau dossier client.
2. **Remplir** `template/client.config.ts`.
3. **Marque** → `src/data/site-brand.ts` (`SITE_BRAND_DISPLAY`) + chasse au grep (§4).
4. **Métadonnées i18n** → `src/app/layout.tsx` (title/description par locale).
5. **Couleurs** → `tailwind.config.ts` → `theme.extend.colors` (gold, navy, cream, champagne, sand…) + vérifier `src/app/globals.css`.
6. **Contenu métier** → `src/data/` (prestations, FAQ, saisons), pages `experience/`, `prestations/`, `qui-sommes-nous/`, `tarifs/`.
7. **Catalogue** → villas/unités en base (voir `GUIDE_INSERT_VILLAS.md`, `insert-villas-test.sql`).
8. **Supabase** → nouveau projet + migrations (`supabase/`, `supabase-migrations-v1.sql`, `schema.sql`), clés via `GUIDE_RECUPERER_CLES_SUPABASE.md`.
9. **Stripe / OTA** → clés `.env`, config iCal.
10. **Build & vérif** — `npm install && npm run build` + checklist §5.

---

## 4. Checklist fichiers à modifier (audit)

Strings client dans ~103 fichiers. Points chauds :

**Données / config**
- `src/data/site-brand.ts` — nom de marque (à importer partout, éviter les répétitions)
- `src/data/conciergerie-faq.ts`, `prestations-scroll-sections.ts`, `prestations-service-details.ts`, `seasons.ts`
- `tailwind.config.ts` — palette
- `src/lib/constants.ts` — labels statuts (génériques, peu à changer)

**Pages**
- `src/app/layout.tsx` — métas multilingues, siteName
- `src/app/page.tsx` + pages `experience/`, `prestations/`, `tarifs/`, `faq/`, `qui-sommes-nous/`, `villas/`
- `src/app/(admin)/`, `(proprio)/`, `espace-client/` — libellés UI

**Légal**
- `confidentialite/`, `cookies/`, `terms/` — raison sociale, adresse

> `grep -rIl -E "Kayvila|kayvila|Diamant Noir|Diamant" src/app src/components src/data src/lib` liste le reste. Beaucoup d'occurrences sont du texte éditorial (à réécrire), pas du code.

---

## 5. Vérification avant livraison

- [ ] `npm run build` passe (Next build)
- [ ] `grep -rI "Kayvila\|Diamant Noir" src/` → ne reste que l'intentionnel
- [ ] Les 3 espaces (client / admin / proprio) se chargent et s'authentifient
- [ ] Réservation test → Stripe + statut en base OK
- [ ] Synchro iCal OTA fonctionnelle (si activée)
- [ ] i18n : les 3 langues commutent correctement
- [ ] Notifications / rappels déclenchés
- [ ] Responsive mobile (375px)

---

## 6. Ne PAS toucher

- Logique booking / iCal / Stripe / webhooks
- RLS Supabase, middleware, auth multi-rôles
- Composants FullCalendar, stores, hooks
- Migrations existantes (en créer de nouvelles plutôt)
