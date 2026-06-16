# Campagne Audit Batch Juin 2026 — Suivi de progression

> **Point de reprise.** Lire ce fichier + `docs/auto-learn/LEARNINGS.md` pour reprendre.

**Branche :** `fix/audit-batch-juin` (depuis `main` @ `5f6ecbd`) — **NON poussée** (commits locaux uniquement).
**Spec :** `docs/superpowers/specs/2026-06-16-correction-audit-batch-design.md`
**Périmètre :** 135 items (2 audits) — `docs/audit-kayvila-complet-2026-06-16.md` (69 UX) + `docs/audit-securite-perf-seo-2026-06-16.md` (66 sec/perf/SEO).
**Stratégie :** risque d'abord · 10 lots · hybride (Opus P0 / subagents Sonnet-Haiku polish) · 1 commit/lot · gate `next build` + mobile + vitest(lib).

---

## État des lots

| Lot | Thème | État | Plan |
|-----|-------|------|------|
| 0 | Triage + Quick-wins P0 | ✅ FAIT | `plans/2026-06-16-audit-batch-lot0.md` |
| 1 | Sécurité HAUTE | ✅ FAIT | `plans/2026-06-16-audit-batch-lot1.md` |
| 2 | Bloquants UX 🔴 (mobile) | ⏭️ **PROCHAIN** | à écrire |
| 3 | Unification formulaires villa | ⬜ | à écrire |
| 4 | Perf critique | ⬜ | — |
| 5 | SEO bloquant+majeur | ⬜ | — |
| 6 | Layout majeurs mobile | ⬜ | — |
| 7 | UX/Visuel polish | ⬜ | — |
| 8 | Mineurs + code mort | ⬜ | — |
| 9 | Backlog perf/sec/SEO + montée Next 15.5.x | ⬜ | — |

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

## ⚠️ Blocages / décisions en attente
- **Next 15.5.x impossible** (cible audit Sec#3) : next ≥15.3 + node-ical ≥0.23 → polyfill Temporal/BigInt casse webpack SSR (conflit zod v4) `g.BigInt is not a function`. Resté à 15.2.9 (corrige CVE phares). **À traiter au Lot 9** (résoudre BigInt/webpack ou migrer zod). Décision Kenneson attendue si priorité.
- **Branche non poussée** — à pousser au prochain démarrage (preview Vercel) si Kenneson OK.

## Reprise — faux positifs UX déjà corrigés (16 juin, NE PAS refaire)
Bugs audit UX déjà faits : **#4** (messagerie min-h), **#8** (VillaImageManager création), **#64** (hover header), **#65** (HeroDatePicker→RangeCalendar). **#60** (NotificationBell "code mort") = audit périmé, le composant EST utilisé.

## Prochaine action
Écrire le plan **Lot 2** (triage existant d'abord), puis exécuter en subagent-driven. Lot 2 = mobile → screenshots Playwright 375px obligatoires.
