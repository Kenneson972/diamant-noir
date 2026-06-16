# Spec — Campagne de correction Audit Batch (Juin 2026)

**Date** : 16 Juin 2026
**Périmètre** : 135 items issus de 2 audits Élise
**Stratégie** : risque d'abord, hybride (Opus solo sur P0 / subagents Sonnet-Haiku sur polish)
**Branche** : `fix/audit-batch-juin`

---

## 1. Contexte

Deux audits ont été produits :
- `docs/audit-kayvila-complet-2026-06-16.md` — **69 bugs** UX/layout/composants (11 🔴, majeurs, modérés, mineurs + 16 reco HeroUI)
- `docs/audit-securite-perf-seo-2026-06-16.md` — **66 problèmes** (18 sécurité, 11 perf, 30 SEO ; Lighthouse estimé ~55-65/100)

Total ≈ 135 items à corriger pour rendre le site production-ready.

## 2. Objectif

Corriger **tous** les items, par lots ordonnés du plus risqué au plus cosmétique, chaque lot livré sur un commit atomique avec build vert.

## 3. Alertes de cadrage (faux positifs probables — VÉRIFIER l'existant)

Les LEARNINGS imposent de vérifier le code réel avant de re-corriger. Items potentiellement DÉJÀ faits (session 16 juin) :
- **UX #4** messagerie `min-h` → fait (`min-h-[calc(100dvh-12rem)]`)
- **UX #65** HeroDatePicker → remplacé par RangeCalendar HeroUI
- **UX #8** VillaImageManager en création admin → ajouté (commit `f0b56a2`)
- **UX #64** hover header → fait (commit `43257ab`)
- **UX #60** `NotificationBell` annoncé « code mort » par l'audit, mais branché dans `DashboardHeader` (session 15 juin) → audit périmé, NE PAS supprimer.

Règles dures applicables :
- Vérifier le **schéma Supabase live** avant toute colonne DB (aucune migration prévue ici, mais si un item en révèle une → stop + vérif + prévenir).
- `NEXT_PUBLIC_` obligatoire pour tout env var lu côté client.
- `next build` = vérité (next dev ment) ; texte ≥11px informatif ; tokens unifiés ; pas de side-stripe.

## 4. Décomposition en lots (risque d'abord)

| Lot | Thème | Items source | Exécutant | Gate |
|-----|-------|--------------|-----------|------|
| **0** | Triage faux positifs + Quick-wins P0 : `npm update next`(15.2.4→15.5.18)+`node-ical`+`audit fix` (48 vulns), CORS `*`→domaine (5 routes), `app/sitemap.ts`, `app/robots.ts`, `og-default.jpg` 1200×630 | Sec#1,3,4 · SEO#1,2,3 | Opus (moi) | build |
| **1** | Sécurité HAUTE : `escapeHtml()` templates email, Zod + `checkRateLimit` + `checkCsrf` sur `villa-submissions` POST & `create-villa`, git-secrets pre-commit (advisory) | Sec#2,5,6,7,8 | Opus | build + **vitest** |
| **2** | Bloquants UX 🔴 : DashboardShell `overflow-y-auto`, Chatbot/CopilotPanel/DashboardSidebar safe-area + Drawer, AdminReservationsKanban mobile (Tabs), VillaPastBookingsDrawer overflow, ICON_MAP fallback | UX#1,2,3,5,6,7,11 | Opus | build + **mobile** |
| **3** | Unification formulaires villa (gros chantier) : fusion `AdminVillaForm`+`VillaEditorForm`, création proprio (route + form unifié), photos & iCal unifiés admin/proprio | UX#9,10,30,31 | Opus | build + mobile |
| **4** | Perf critique : pagination `.limit(20)` sur 6 pages, cache HTTP / `unstable_cache`, skeletons admin + espace-client | Perf#1,2,3 | Opus | build + vitest |
| **5** | SEO bloquant+majeur : métadonnées (login, update-password, comparateur, espace-client), canonicals, OG, JSON-LD (WebSite/SearchAction, BreadcrumbList, FAQPage, LocalBusiness), twitter:card, headings, `robots:{index:false}` admin | SEO#4-17 | Subagents (Sonnet) | build |
| **6** | Layout majeurs mobile : VillaGallery, Navbar dégradé, VillaCard aspect, HomeServices, VillasMapView toggle, BookingBottomSheet, PageHero, NotificationBell dropdown, CompareBar safe-area | UX#12-20 | Subagents (Sonnet) | build + mobile |
| **7** | UX/Visuel polish : `EmptyState` partout, `Toast` feedback save, transitions inputs, icônes boutons, hovers, overlays | UX#21-29,33-52 | Subagents (Haiku/Sonnet) | build |
| **8** | Mineurs + code mort : icônes affordance, nettoyage composants orphelins (après vérif #59,61 ; PAS #60), duplications | UX#53-66 | Subagents (Haiku) | build |
| **9** | Backlog Perf/Sec/SEO : CSP, hero.webm 11Mo→compressé, 561 frames webp, image sizes/priority, lazy `@react-pdf`, `optimizePackageImports`, vulns MODÉRÉE/FAIBLE | Perf#4-11 · Sec#9-18 · SEO modéré/mineur | Subagents (Sonnet) | build |

## 5. Modèle d'exécution

Boucle par lot :
1. **Triage** — vérifier l'existant pour chaque item (✅ déjà-fait / 🔧 à-faire / ❓ contradiction). Purger les faux positifs §3.
2. **Fix** — Opus (moi) en séquentiel pour lots 0-4 ; subagents parallèles (2-4 max/vague, fichiers disjoints) pour lots 5-9.
3. **Gate** — `npm run build` 0 erreur (obligatoire tous lots) ; vérif visuelle mobile 375px (lots 2,3,6) ; `npx vitest run` (lots 1,4).
4. **Commit** — atomique `fix(audit): lot N — <thème>`, liste items fermés, co-author claude-flow.
5. **Journal** — append `docs/auto-learn/LEARNINGS.md` si nouvelle règle ; cocher dans ce spec.

### Model routing (règle dure Kenneson — « ne pas travailler que sous Opus »)
- **Opus** : lots 0-4 (P0 — sécurité, unification, perf, raisonnement).
- **Sonnet** : subagents lots 5,6,9 (travail standard).
- **Haiku** : subagents lots 7,8 (transforms répétitifs simples — icônes, transitions, safe-areas, empty states, alt text).
- Passer `model` au tool Agent en conséquence. Je relis **chaque** diff subagent avant commit.

## 6. Risques & mitigations

| Risque | Mitigation |
|--------|------------|
| `npm update next` casse le build | Lot 0 isolé en premier ; rollback du paquet si build rouge, traiter à part. |
| Faux positifs audit (§3) | Triage en tête de chaque lot ; ne pas re-corriger l'existant. |
| Drawer HeroUI change scroll/focus | Vérif mobile obligatoire ; `shouldBlockScroll={false}` pour panneaux non bloquants. |
| Unification formulaires (Lot 3) = régression | Opus solo séquentiel ; parcours manuel création+édition villa avant commit. |
| Migrations Supabase imprévues | Aucune attendue ; si nécessaire → vérif schéma live + prévenir avant. |
| CSP (Lot 9) casse ressources externes | Whitelister Supabase/Stripe/Cloudinary/Leaflet/Airbnb déjà autorisés. |

## 7. Livraison

- Branche `fix/audit-batch-juin` depuis `main` (déjà à jour après pull `5f6ecbd`).
- 1 commit par lot terminé + build vert.
- Merge en fin de campagne (ou par paliers si livraison intermédiaire demandée).

## 8. Définition de « terminé »

- Les 135 items adressés (corrigés, ou marqués déjà-fait/non-applicable avec justification).
- `next build` vert sur la branche finale.
- Lighthouse réévalué (cible : Perf >75, SEO >90).
- `LEARNINGS.md` + ce spec à jour.
