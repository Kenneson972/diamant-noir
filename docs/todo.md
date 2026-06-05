# Todo — Kayvila / Diamant Noir

> Dernière mise à jour : 2026-06-06 — session Supabase + admin réservations

## Session suivante — démarrage

```bash
cd diamant-noir
git pull origin main
npm run dev   # localhost:3000
```

Dernier commit : `61425af` · Dev server **arrêté** · Détail : `docs/logs/2026-06-05.md` (section handoff)

## Bloquant Vercel deploy

- [ ] **HEROUI_AUTH_TOKEN** — Vercel → Settings → Environment Variables → Production + Preview  
  Token CI/CD : [heroui.pro/dashboard](https://heroui.pro/dashboard) (pas le personal token)  
  Puis **Redeploy** avec « Clear build cache »

## À valider manuellement (priorité)

- [ ] `/admin/reservations` — annuler, confirmer, bulk, filtres, kanban
- [ ] `/admin/clients/[id]` — historique réservations
- [ ] `/admin/proprietaires` — liste + fiche villa
- [ ] `/espace-client/favoris` — sync wishlist sans 404

## Backlog technique

- [ ] Migrer `demandes` / `avis` admin → `/api/admin/*`
- [x] Drop FK dupliquée `fk_bookings_villa` (migration `20260606230000`)
- [x] Commission dynamique admin proprio (`lib/commission.ts`)
- [ ] `npm run check:schema` → regen `types/supabase.ts` si drift
- [ ] Admin proprio : graph revenus, suspendre compte
- [ ] n8n Kayvila — `docs/n8n/README.md`

## Ancien (à trier / peut être obsolète)

- [ ] RESEND_API_KEY dans `.env.local` (emails villa submission)
- [ ] Workflow n8n `villa-submission` actif
- [ ] Clean `.worktrees/feat-owner-availability-blocking`
