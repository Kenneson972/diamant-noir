# Session 2026-05-01 (fin) — Ajout entretien piscine & jardin

## Changement
Ajout d'un 5e item "Entretien piscine & jardin (abonnement non inclus)" dans le pilier Ménage & Blanchisserie.

## Fichiers modifiés

### `data/prestations-scroll-sections.ts`
- Section `id: "menage"` : ajout de `"Entretien piscine & jardin (abonnement non inclus)"` dans `items`

### `data/prestations-service-details.ts`
- Section `SERVICE_DETAILS.menage.items` : ajout d'un 5e objet avec titre et description détaillée :
  - Titre : "Entretien piscine & jardin (abonnement non inclus)"
  - Desc : prestataire agréé, traitement eau, nettoyage piscine, tonte, taille, désherbage — service facturé en sus, Kayvila coordonne et supervise

## Build
```bash
npm run build → ✅ OK (0 erreurs)
```
