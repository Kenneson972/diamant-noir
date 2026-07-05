# Nettoyage textes redondants — Espace Client Kayvila

**Date** : 2026-07-05
**Périmètre** : espace client (tenant), pages listées ci-dessous

## Contexte / diagnostic

L'espace client souffre de redondance sur 3 couches d'information qui se répètent :

1. **Header global** (`DashboardHeader`) : kicker "CLIENT" + fil d'ariane gris (ex: "Espace client / Mon séjour")
2. **Barre secondaire** (`PageTopbar`) : un `section` gris + titre — doublon avec le header et le titre de page
3. **Titre de page** dans le contenu

Résultat : confusion visuelle, surcharge d'information, bugs en responsive mobile.

## Décision

1. **Supprimer le fil d'ariane** du `DashboardHeader` (le texte gris sous le kicker doré) — il fait doublon avec le nom de page affiché dans la sidebar.
2. **Remplacer `roleLabel` statique par un kicker contextuel par page** — le kicker doré doit situer le contexte (où / quand / quel type), jamais répéter le titre.
3. **Supprimer `PageTopbar`** entièrement — chaque page gère son propre titre dans son contenu.
4. **Corriger le responsive mobile** de l'espace client.

## Architecture

```
EspaceClientShell (layout.tsx)
  │  mapping pathname → kicker (Map<string, string>)
  │
  ▼
DashboardShell
  │  prop: kicker (string) — remplace l'ancien roleLabel
  │
  ▼
DashboardHeader
  │  affiche kicker en doré (existant, déjà stylé)
  │  retire le bloc breadcrumb (lignes 61-75)
  │
  ▼
Page (contenu)
  │  plus de <PageTopbar> — remplacé par un <h1> ou titre existant
```

### Mapping kicker par route

| Route | Kicker |
|-------|--------|
| `/espace-client` (racine) | CONCIERGERIE KAYVILA |
| `/espace-client/livret` | VOTRE VILLA |
| `/espace-client/favoris` | VOS COUPS DE CŒUR |
| `/espace-client/messagerie` | VOTRE CONCIERGE |
| `/espace-client/notifications` | RESTEZ INFORMÉ |
| `/espace-client/demandes` | PENDANT VOTRE SÉJOUR |
| `/espace-client/checklist` | VOTRE SÉJOUR |
| `/espace-client/profil` | VOTRE COMPTE |
| `/espace-client/documents` | VOTRE DOSSIER |
| `/espace-client/conciergerie` | NOUS JOINDRE |

### Changements de titre

- Notifications : "Mes notifications" → "Notifications" (retrait du "Mes")

## Fichiers touchés

| Fichier | Action |
|---------|--------|
| `components/dashboard/shared/DashboardHeader.tsx` | **Modifié** — retirer le bloc breadcrumb (lignes 61-75), renommer `roleLabel` en `kicker` |
| `components/dashboard/shared/DashboardShell.tsx` | **Modifié** — propager `kicker` (ex-`roleLabel`) à `DashboardHeader` |
| `app/espace-client/EspaceClientShell.tsx` | **Modifié** — ajouter le mapping `pathname → kicker`, passer `kicker` au lieu de `roleLabel` |
| `components/espace-client/PageTopbar.tsx` | **Supprimé** |
| `app/espace-client/livret/page.tsx` | **Modifié** — retirer `<PageTopbar>`, ajouter titre inline |
| `app/espace-client/favoris/page.tsx` | **Modifié** — retirer `<PageTopbar>`, ajouter titre inline |
| `app/espace-client/messagerie/page.tsx` | **Modifié** — retirer `<PageTopbar>`, ajouter titre inline |
| `app/espace-client/notifications/page.tsx` | **Modifié** — retirer `<PageTopbar>`, titre "Notifications" (sans "Mes") |
| `app/espace-client/demandes/page.tsx` | **Modifié** — retirer `<PageTopbar>`, ajouter titre inline |
| `app/espace-client/checklist/page.tsx` | **Modifié** — retirer `<PageTopbar>`, ajouter titre inline |
| `app/espace-client/profil/page.tsx` | **Modifié** — retirer `<PageTopbar>`, ajouter titre inline |
| `app/espace-client/documents/page.tsx` | **Modifié** — retirer `<PageTopbar>`, ajouter titre inline |
| `app/espace-client/conciergerie/page.tsx` | **Modifié** — retirer `<PageTopbar>`, ajouter titre inline |

## Fichiers NON touchés

- `app/(admin)/**` et `app/(proprio)/**` — le `DashboardHeader` reçoit déjà `roleLabel` de leurs shells respectifs, inchangés. Seul le fil d'ariane est retiré (impact visuel identique pour tous les rôles).
- `app/espace-client/page.tsx` (Séjour) — déjà bon (kicker via `TenantPageHeader.subtitle`, pas de `PageTopbar`).

## Responsive mobile

Le retrait du breadcrumb et de `PageTopbar` libère de l'espace vertical. Points à vérifier :
- Le header sans breadcrumb reste à 4rem de hauteur sur mobile
- Les pages sans `PageTopbar` commencent directement avec leur contenu
- Le padding du conteneur (`p-5 md:p-10`) reste inchangé

## Tests

- **Visuel** : vérifier chaque page sur viewport 360px et 1280px après modification
- Pas de nouveau test unitaire — changement purement cosmétique, pas de logique métier

## Hors périmètre

- Bugs de données (email `locataire@test.com`, prix identiques 8 250 €) — spec séparée
- Amélioration ergonomique — discussion ultérieure
- Pages admin et proprio — seul le retrait du breadcrumb les affecte, pas de changement de kicker
