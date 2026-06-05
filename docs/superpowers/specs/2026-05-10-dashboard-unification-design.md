# Uniformisation des espaces client Kayvila

**Date** : 2026-05-10 | **Statut** : Validé

## Contexte

Kayvila dispose de 3 espaces client distincts :
- **Admin** (`/admin`) — gestion complète de la plateforme
- **Propriétaire** (`/dashboard`) — gestion des villas et revenus
- **Voyageur** (`/espace-client`) — suivi de séjour et conciergerie

Chaque espace a été construit indépendamment, résultant en 3 designs différents (3 fonds, 3 couleurs de texte, 2 systèmes d'icônes, 3 structures de sidebar). L'audit du 2026-05-10 a révélé des incohérences critiques et des régressions par rapport aux corrections déjà appliquées.

## Objectif

**Uniformiser le design des 3 espaces** avec une structure de dashboard unique. La distinction entre les rôles se fait uniquement par le contenu et les entrées de menu, pas par le design.

## Décisions design

| Propriété | Avant (3 designs) | Après (unifié) |
|-----------|------------------|-----------------|
| Fond | `#FAFAFA` / `#F5F0E8` / `#FAFAF8` | `bg-offwhite` (#FAFAFA) |
| Texte | `#0A0A0A` / `#0B1D2E` / `#0D1B2A` | `text-navy` (#0A0A0A) |
| Sidebar | dark / dark / blanche | dark unique (`bg-navy` #0A0A0A) |
| Icônes nav | Lucide / Lucide / SVG customs | Lucide-react partout |
| Polices | Sora+Instrument / défaut / Playfair+inline | Sora + Instrument Sans partout |
| Header desktop | Oui / Minimal / Aucun | Oui pour les 3 espaces |
| Side-stripe actif | ✅ Corrigé / ❌ border-l-2 / ❌ before:w-[2px] | Aucun — bordure complète + fond teinté |
| Skip-to-content | Oui / Oui / Non | Oui pour les 3 espaces |
| Bottom bar mobile | Non / Non / Oui (6px texte) | Oui standardisée (11px min) |
| Copilot (✨) | Non / Oui / Non | Supprimé du layout proprio |

## Architecture

### Composants partagés extraits

```
components/dashboard/shared/
  DashboardShell.tsx      — Layout commun (sidebar + header + main)
  DashboardSidebar.tsx    — Sidebar dark avec menu dynamique
  DashboardHeader.tsx     — Header avec date, notifs, avatar
  KpiCard.tsx            — Carte statistique réutilisable
  EmptyState.tsx         — État vide standardisé
  PageTopbar.tsx         — Titre + breadcrumb
```

### Layouts refactorés

Chaque layout devient un wrapper fin autour du `DashboardShell` :

- `(admin)/admin/layout.tsx` → `<DashboardShell role="admin" menu={adminMenu}>{children}</DashboardShell>`
- `(proprio)/dashboard/layout.tsx` → `<DashboardShell role="owner" menu={ownerMenu}>{children}</DashboardShell>`
- `espace-client/layout.tsx` → `<DashboardShell role="tenant" menu={tenantMenu}>{children}</DashboardShell>`

### Props de DashboardShell

```ts
interface DashboardShellProps {
  role: "admin" | "owner" | "tenant";
  menu: MenuItem[];
  children: ReactNode;
}
```

### Système de navigation unifié

Chaque rôle a son `MenuItem[]` :

```ts
interface MenuItem {
  label: string;
  href: string;
  icon: LucideIcon;
  exact?: boolean;
}
```

### Règles design strictes

1. **Tout texte ≥ 11px** — pas de 8px, 9px, 10px nulle part
2. **Hiérarchie par graisse, pas par opacité** — `font-semibold text-navy/60` au lieu de `font-bold opacity-55`
3. **Aucun side-stripe** — ni `border-l-2`, ni `before:w-[2px]`, ni `box-shadow` inset
4. **Or = signal uniquement** — chiffres clés, état actif, jamais décoratif
5. **Sidebar dark unique** — `bg-navy #0A0A0A` pour tous les rôles
6. **Header présent dans les 3 espaces** — date + notifications + avatar

## Fichiers à supprimer

- `components/dashboard/admin/AdminLayout.tsx` → remplacé par DashboardShell
- `components/dashboard/admin/AdminHeader.tsx` → remplacé par DashboardHeader
- `components/dashboard/admin/AdminSidebar.tsx` → remplacé par DashboardSidebar
- `components/dashboard/admin/AdminMain.tsx` → logique dans DashboardShell
- `components/dashboard/proprio/OwnerLayout.tsx` → remplacé par DashboardShell
- `components/dashboard/proprio/OwnerHeader.tsx` → remplacé par DashboardHeader
- `components/dashboard/proprio/OwnerSidebar.tsx` → remplacé par DashboardSidebar
- `components/espace-client/EspaceClientShell.tsx` → remplacé par DashboardShell
- `components/espace-client/EspaceClientProviders.tsx` → inutile (coquille vide)

## Fichiers à modifier

- `app/(admin)/admin/layout.tsx` — wrapper DashboardShell
- `app/(proprio)/dashboard/layout.tsx` — wrapper DashboardShell
- `app/espace-client/layout.tsx` — wrapper DashboardShell
- `app/espace-client/page.tsx` — ajuster imports (icônes Lucide, polices)
- Fichiers utilisant les composants supprimés → nouvel import

## Fichiers à conserver

- `components/dashboard/proprio/ProprioMenuItems.ts` — renommé ou absorbé
- `components/dashboard/admin/AdminMenuItems.ts` — idem
- Tous les composants de page (KpiRow, BookingCard, TodayTimeline, etc.)
- `components/espace-client/tenant-ui.tsx` — conserver Skeleton, Card
- `components/espace-client/BookingCard.tsx` — mise à jour imports

## Ordre d'implémentation

1. Créer `DashboardShell` + `DashboardSidebar` + `DashboardHeader` (composants partagés)
2. Migrer l'espace Admin vers DashboardShell (le plus simple, déjà dark)
3. Migrer l'espace Proprio vers DashboardShell
4. Migrer l'espace Client vers DashboardShell (le plus de changements : sidebar blanche → dark)
5. Nettoyer les fichiers supprimés
6. Corriger les imports dans les pages enfants
7. Build + vérification

## Risques

- L'espace client avait une identité visuelle distincte (sidebar blanche) — la migration vers dark peut surprendre mais est validée
- Nombre de fichiers touchés (~20) — bien vérifier chaque page après migration
