# Récap session — Diamant Noir / Kayvila

**Pour** : Elise  
**Date** : 6 juin 2026  
**Projet** : `diamant-noir` (conciergerie Kayvila)  
**Branche** : `main` · dernier commit : `92c993b`

---

## En bref

Session focalisée sur **fiabiliser l’admin** et **débloquer le déploiement Vercel**.  
Les réservations admin, l’annulation, la wishlist et la cohérence Supabase ont été corrigées. Le build prod nécessitait un token HeroUI Pro sur Vercel (configuré par Kenneson).

---

## Problèmes corrigés

| # | Symptôme | Cause | Correctif |
|---|----------|-------|-----------|
| 1 | Fiches proprio sans villas | Colonne `slug` absente + mauvais client Supabase admin | Migration + pages admin sur `getAdminDb()` |
| 2 | Réservations admin vides / 500 | Double lien DB villas (PGRST201) + page en RLS browser | API `/api/admin/bookings` + embed FK explicite |
| 3 | Favoris espace client en 404 | Table `wishlist` absente en prod | Migration + création table prod |
| 4 | Impossible d’annuler une résa | Contrainte SQL n’autorisait que `pending`/`confirmed` | Migration statuts `cancelled`, `paid`, `refunded` |
| 5 | Build Vercel en échec | HeroUI Pro : token CI manquant en prod | `HEROUI_AUTH_TOKEN` sur Vercel + config install |

---

## Migrations Supabase prod appliquées

Projet : `wsdawdxucyuyopkpgjij`

1. `20260606200000_admin_supabase_standardize.sql` — rôle admin unifié (`is_staff_admin()`), RLS
2. `20260606210000_wishlist_table.sql` — table favoris
3. `20260606220000_bookings_status_source_check.sql` — statuts et sources réservations alignés code

---

## Commits Git (session)

| SHA | Résumé |
|-----|--------|
| `152f8c6` | Standardisation admin Supabase + types regen |
| `4a40b60` | API réservations admin + wishlist + fix embed villas |
| `61425af` | Annulation réservations (contrainte status) |
| `92c993b` | Config Vercel HeroUI Pro |

---

## À tester (checklist Elise / QA)

- [ ] **Vercel** : dernier deploy vert après redeploy + clear cache
- [ ] `/admin/reservations` — liste visible, filtres, annuler / confirmer, actions groupées
- [ ] `/admin/clients/[id]` — historique réservations du client
- [ ] `/admin/proprietaires` — villas affichées sur chaque fiche
- [ ] `/espace-client/favoris` — plus d’erreur 404

**Compte admin test** : `admin@diamantnoir.com`  
**Données prod** : 6 réservations, 3 propriétaires, 2 villas liées

---

## Reprise technique (dev)

```bash
cd diamant-noir
git pull origin main
npm run dev    # http://localhost:3000
```

Commandes utiles : `npm run build` · `npm run check:schema`

---

## Backlog (non bloquant)

- Migrer vues admin `demandes` / `avis` vers API admin dédiée
- Nettoyage FK dupliquée `fk_bookings_villa` en base
- Admin proprio : graphique revenus, commission dynamique (aujourd’hui 25 % en dur)
- Workflows n8n Kayvila — voir `docs/n8n/README.md`

---

## Fichiers de référence

| Fichier | Contenu |
|---------|---------|
| `docs/logs/2026-06-05.md` | Journal technique détaillé |
| `docs/todo.md` | Todo prochaine session |
| `docs/lessons.md` | Leçons (ne pas refaire les mêmes erreurs) |
| `docs/ACTIONS_LOG.md` | Journal global des actions |
| `lib/admin/db.ts` | Client Supabase admin (pages RSC) |
| `app/api/admin/bookings/route.ts` | API réservations admin |

---

## État fin de session

- Localhost : **arrêté**
- Git : **à jour** avec `origin/main`
- Vercel : token HeroUI ajouté — **valider que le deploy passe**

*Rédigé pour handoff équipe — Karibloom / session Cursor 2026-06-06.*
