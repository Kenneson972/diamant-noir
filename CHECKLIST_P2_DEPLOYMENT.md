# Checklist Déploiement — Corrections P2

## Avant le Merge

- [ ] `npm run build` — vérifier aucune erreur de build
- [ ] `npm run lint` — vérifier aucune erreur ESLint
- [ ] Ouvrir PR avec description des changements
- [ ] Revoir les diffs (5 fichiers modifiés)

## Après le Merge sur Main

- [ ] Pull latest main dans local
- [ ] `npm run build` final
- [ ] `npm run start` en local et tester `/prestations`
  - [ ] Scroll hero 100vh + 500vh fonctionne
  - [ ] Sections below-the-fold se chargent au scroll
  - [ ] Pas de layout shift (CLS)
  - [ ] Images chargent correctement

## Lighthouse Re-audit

- [ ] Lancer Lighthouse sur `/prestations`
  - [ ] TBT < 300ms (visé -150ms)
  - [ ] LCP < 2.5s (visé -200ms)
  - [ ] CLS < 0.1 (visé -0.1)
  - [ ] SEO > 90 (visé +15 points)

## Performance Lab

- [ ] DevTools Network : vérifier compression gzip/brotli
- [ ] DevTools Coverage : vérifier JS inutilisé réduit
- [ ] DevTools Rendering : vérifier no forced reflows during scroll

## Déploiement Production

- [ ] Deploy sur Vercel/hosting (auto après merge si CI/CD)
- [ ] Vérifier health checks en prod
- [ ] Monitoring : vérifier aucune anomalie Core Web Vitals
- [ ] Analytics : TBT, LCP, CLS avant/après

## Rollback (si needed)

- [ ] Git revert `<commit-hash>`
- [ ] Deployer nouveau version

---

## Fichiers Modifiés (Summary)

| Fichier | Lignes | Backup | Status |
|---------|--------|--------|--------|
| `app/prestations/page.tsx` | +67 | ✓ .backup_p2 | ✅ |
| `app/prestations/layout.tsx` | +40 | ✓ .backup_p2 | ✅ |
| `components/prestations/VideoScrollHero.tsx` | +12 | ✓ .backup_p2 | ✅ |
| `app/layout.tsx` | +15 | ✓ .backup_p2 | ✅ |
| `next.config.mjs` | +1 | — | ✅ |

---

**Date :** 2026-04-13  
**Audit :** Lighthouse P2 Prestations
