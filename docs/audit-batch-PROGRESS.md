# Campagne Audit Batch Juin 2026 — Suivi de progression

> **Point de reprise.** Lire ce fichier + `docs/auto-learn/LEARNINGS.md` pour reprendre.

> ✅ **STATUT 2026-06-16 (fin de session) : Lots 0–8 MERGÉS sur `main`** (PR #2). Fixes post-merge mergés aussi : sitemap build (PR #2), CSP/favicon/pages légales (PR #3), calendar hero HeroUI + fin clipping (PR #4 + `77c78e3`). **Reste uniquement le Lot 9** (backlog — voir « Prochaine action »). Tout est sur `main`, aucune branche en attente.

**Branche :** `fix/audit-batch-juin` (depuis `main` @ `5f6ecbd`) — **MERGÉE sur main** (PR #2).
**Spec :** `docs/superpowers/specs/2026-06-16-correction-audit-batch-design.md`
**Périmètre :** 135 items (2 audits) — `docs/audit-kayvila-complet-2026-06-16.md` (69 UX) + `docs/audit-securite-perf-seo-2026-06-16.md` (66 sec/perf/SEO).
**Stratégie :** risque d'abord · 10 lots · hybride (Opus P0 / subagents Sonnet-Haiku polish) · 1 commit/lot · gate `next build` + mobile + vitest(lib).

---

## État des lots

| Lot | Thème | État | Plan |
|-----|-------|------|------|
| 0 | Triage + Quick-wins P0 | ✅ FAIT | `plans/2026-06-16-audit-batch-lot0.md` |
| 1 | Sécurité HAUTE | ✅ FAIT | `plans/2026-06-16-audit-batch-lot1.md` |
| 2 | Bloquants UX 🔴 (mobile) | ✅ FAIT | inline (triage) |
| 3 | Création villa proprio (#10) | ✅ FAIT | inline (triage) |
| 4 | Perf critique | ✅ FAIT | inline (triage) |
| 5 | SEO bloquant+majeur | ✅ FAIT | inline (triage) |
| 6 | Layout majeurs mobile | ✅ FAIT | inline (triage) |
| 7 | UX/Visuel polish | ✅ FAIT | inline (triage) |
| 8 | Mineurs + code mort | ✅ FAIT | inline (triage) |
| 9 | Backlog perf/sec/SEO + montée Next 15.5.x | ⏭️ **PROCHAIN** | à écrire |

## Détail réalisé

### Lot 0 ✅ (commits `10d0e7e`, `c707bdd`, `63294c0`, `52f66b1`)
- next `15.2.4→15.2.9`, node-ical `0.16→0.22.1`, `npm audit fix` (48→38 vulns, restantes = devDep vercel)
- Helper CORS `lib/cors.ts` (+test) sur 5 routes, fin du wildcard `*`
- robots disallow `/admin/` + `/espace-client/`
- `public/og-default.jpg` 1200×630 généré (sharp)
- **Faux positifs écartés** : sitemap.ts + robots.ts existaient déjà

### Lot 1 ✅ (commits `db0b700`, `9eb3bef`, `dd430eb`, `3f73494`)
- `escapeHtml` (+test) sur email admin `villa-submissions` (Sec#2 XSS)
- POST `villa-submissions` : CSRF + rate-limit 5/h/IP + zod `villaSubmissionSchema` (+test) (Sec#5/6)
- `create-villa` : strip champs admin-only pour non-admins (Sec#7)
- `.env*` déjà gitignored (Sec#8 OK)
- vitest global : **48/0**

### Lot 2 ✅ (commit `1d6f64c`)
- #1 DashboardShell : fullBleed `overflow-hidden`→`overflow-y-auto` (clavier mobile)
- #3 VillaPastBookingsDrawer : wrapper `overflow-x-auto` sur `<table>`
- #6 CopilotPanel : overlay `bg-black/10`→`/30` (+#43) + `pt-[env(safe-area-inset-top)]`
- #7 DashboardSidebar : drawer mobile `safe-area-inset-top` + bouton fermeture repositionné
- #11 DashboardSidebar : `ICON_MAP[...] ?? LayoutDashboard` (fallback)
- **Faux positifs écartés** : #2 Kanban (wrapper `overflow-x-auto` existe déjà L145) · #5 Chatbot (`max-h-[85dvh]`+fullscreen mobile déjà présents). #4 fait au Lot 1.
- Build ✅ · vitest 48/0 ✅. Pas de subagent (polish CSS, cf model-routing).

### Lot 3 ✅ (commit `ddf55e7`) — création villa proprio (#10)
- `VillaEditorForm` : mode création via `!villa.id` → POST `create-villa` (sinon `update-villa`), redirect post-création, livret masqué en création, libellés adaptés.
- Route `app/(proprio)/dashboard/villas/nouvelle/page.tsx` (VillaEditorForm villa vide).
- CTA « Ajouter une villa » sur liste proprio + `EmptyDashboard`.
- Backend déjà prêt (Lot 1) : non-admin → villa **non publiée**, `owner_id` = session. Pas de conflit avec flux soumission.
- **#8** (VillaImageManager création admin) = **faux positif** : déjà rendu L540 de `AdminVillaForm`.
- **#9** (fusion `AdminVillaForm` HTML / `VillaEditorForm` HeroUI) = **reporté** (décision Kenneson : #10 d'abord, valeur/risque). Blocage parité : VillaEditorForm n'a pas les contrôles admin (sélecteur propriétaire `/api/admin/owners`, `is_published`, `commission_rate`) → unification admin nécessite variante admin conditionnelle dans VillaFormFields.
- Build ✅ · vitest 48/0 ✅.

### Lot 4 ✅ (commit `21f91b5`) — perf critique
- **perf#1 pagination** : `.limit()` de sécurité sur 5 requêtes non bornées — `/villas` (60), admin villas/soumissions/proprietaires/clients (100). Décision Kenneson : limites maintenant, **pagination UI complète reportée** (lot dédié). ⚠️ masque au-delà du cap.
- **optimizePackageImports** += `leaflet`, `shiki`, `date-fns`.
- **Faux positifs** : perf#3 skeletons (loading.tsx existent : admin/dashboard/villas/book/root) · `@react-pdf` lazy (server-only, 2 routes API + composant importé serveur, hors bundle client) · N+1 admin villas (déjà `Promise.all([profiles,bookings])`) · recharts (pas une dépendance).
- **perf#2 cache HTTP reporté** (force-dynamic/noStore) : risque fraîcheur dispos → double-booking. À traiter avec validation Kenneson.
- Build ✅ · vitest 48/0 ✅.

### Lot 5 ✅ (commit `c4c9a6f`) — SEO bloquant + majeur
- **seo#4/#5/#6** (pages `"use client"` → `layout.tsx` serveur) : login + update-password (metadata + `robots: noindex`), comparateur (title/description + canonical, indexable).
- **seo#7** espace-client : metadata title + noindex.
- **twitter:card** `summary_large_image` au root (site-wide) + openGraph title/description explicites.
- **JSON-LD WebSite** ajouté (Organization existait déjà).
- **noindex** zones privées : admin, dashboard proprio, espace-client.
- Retrait **meta keywords** obsolètes.
- **Faux positifs** : seo#1 sitemap, #2 robots, #3 og-default.jpg = **déjà faits au Lot 0**.
- **Reportés** (besoin data/per-page) : JSON-LD LocalBusiness (NAP via client.config), BreadcrumbList, FAQPage, SearchAction (besoin endpoint recherche fonctionnel), canonical par page publique, hreflang `/en` `/es` (routes inexistantes), hiérarchie headings, alt images.
- Build ✅ · vitest 48/0 ✅.

### Lot 6 ✅ (commit `9176674`) — layout majeurs mobile
- #12 VillaGallery `h-[60vh]`→responsive+max-h-600 · #14 VillaCard `h-[300px]`→200/260/300 · #15 HomeServices `h-[40vw]`→`h-[35vw] min-h-160` · #16 VillasMapView : liste `hidden md:block` quand carte visible (fin double-scroll mobile) · #17 BookingBottomSheet cap `max-w` retiré sur mobile · #18 PageHero `pt-24`→`pt-16` mobile · #19 NotificationBell dropdown +`max-w-[calc(100vw-2rem)]`.
- **Faux positifs** : #13 Navbar (vitrage conditionnel déjà géré ; transparence seulement sur hero sombre) · #20 CompareBar (`env(safe-area-inset-bottom)` déjà présent L30).
- Build ✅ · vitest 48/0 ✅.

### Lot 7 ✅ (commit `86e0ea9`) — UX/visuel polish
- #21 HeroBackgroundMedia (fondu poster→vidéo via videoReady) · #22 AdminVillaBlocks (icône Calendar empty) · #23 Kanban (icône Inbox colonnes vides) · #26 SeasonalRatesManager (Loader2) · #27 CreateBookingModal (transition-colors inputs) · #29 ReportIssueButton (transition textarea).
- **Faux positif** : #28 Footer (hover déjà L139).
- **Code mort → Lot 8** : #24/#25 BookingTable (jamais importé).
- **Reportés (refactors)** : #30 photos proprio inline (VillaImageManagerWrapper), #31 unif iCal sur VillaIcalPanel (admin=PlanningIcalSyncCard), #32 Copilot admin (optionnel).
- Build ✅ · vitest 48/0 ✅.

### Lot 8 ✅ (commit `0f24c2d`) — code mort + mineurs
- **Code mort supprimé** : `BookingTable.tsx` (#24/#25 caducs), `VillaAmenitiesEditorWrapper.tsx` (#59). −113 lignes.
- **Mineurs** : #33 OwnerContactFAB safe-area-inset-bottom · #47 icône Send bouton Envoyer · #48 ProprioBookingDataGrid icône Inbox empty · #50 DashboardSidebar contraste /50→/65 (WCAG AA).
- **Faux positifs** : #40 RevenueBreakdownTable (overflow-x déjà L63) · #60 NotificationBell + #61 AdminCommandPalette (utilisés, pas morts).
- **Reporté** : #34 DashboardHeader safe-area-top (risque hauteur header fixe). Autres mineurs cosmétiques (#53–#58, #62, #63, #66) non traités (très faible valeur).
- Build ✅ · vitest 48/0 ✅.

## ⚠️ Blocages / décisions en attente
- **Next 15.5.x impossible** (cible audit Sec#3) : next ≥15.3 + node-ical ≥0.23 → polyfill Temporal/BigInt casse webpack SSR (conflit zod v4) `g.BigInt is not a function`. Resté à 15.2.9 (corrige CVE phares). **À traiter au Lot 9** (résoudre BigInt/webpack ou migrer zod). Décision Kenneson attendue si priorité.
- **Branche non poussée** — à pousser au prochain démarrage (preview Vercel) si Kenneson OK.

## Reprise — faux positifs UX déjà corrigés (16 juin, NE PAS refaire)
Bugs audit UX déjà faits : **#4** (messagerie min-h), **#8** (VillaImageManager création), **#64** (hover header), **#65** (HeroDatePicker→RangeCalendar). **#60** (NotificationBell "code mort") = audit périmé, le composant EST utilisé.

## Prochaine action
**Lot 9 — Backlog + montée Next 15.5.x** (dernier lot). Contient surtout des chantiers nécessitant une **décision/validation Kenneson** :
- **Montée Next 15.5.x** (Sec#3) — ⚠️ BLOCAGE BigInt/webpack (cf section blocages). Investiguer résolution zod v4 / polyfill, ou décider de rester en 15.2.9.
- **perf#2 cache HTTP** (force-dynamic/noStore) — risque double-booking, valider stratégie.
- **pagination UI** complète (6 pages) — feature, pas un quick-win.
- **#9 fusion formulaires admin** (variante admin VillaEditorForm).
- **Incohérences #30/#31/#32** (photos proprio inline, unif iCal, Copilot admin).
- **SEO reportés** : JSON-LD LocalBusiness/BreadcrumbList/FAQPage, SearchAction, canonical par page, hreflang.

➡️ **Demander à Kenneson** quelles priorités attaquer (chacun mérite son propre cadrage). Les 8 premiers lots couvrent l'essentiel actionnable bas-risque.
