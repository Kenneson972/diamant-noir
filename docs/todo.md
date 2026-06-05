# Reste à faire — Kayvila (26 Mai 2026)

## Bloquant

- [ ] **RESEND_API_KEY** — ajouter dans `.env.local` pour que les emails de confirmation "Confier ma villa" partent
- [ ] **Migration Supabase `20260521_add_villa_submission_fields.sql`** — vérifier que les colonnes (chambres, salles_de_bains, etc.) existent bien dans `villa_submissions`
- [ ] **Migration Supabase `20260526_stripe_disputes.sql`** — appliquer pour créer la table `stripe_disputes`

## Important

- [ ] **Workflow n8n `villa-submission`** — activer sur `kenneson.app.n8n.cloud`
- [ ] **Tester page villa** — `localhost:3000/villas/[id]` avec une villa qui a des équipements + un owner_id lié à un profil
- [ ] **Tester login** — vérifier que la boucle de redirect est corrigée

## Nice to have

- [ ] Clean `.worktrees/feat-owner-availability-blocking` (embedded git repo)
- [ ] Merge ou supprimer la branche `wip-may`
- [ ] Nettoyer les specs/plans en doublon dans `docs/superpowers/`
