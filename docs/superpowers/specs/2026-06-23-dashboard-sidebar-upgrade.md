# Spec — Dashboard Sidebar Upgrade (Kayvila)

**Date :** 2026-06-23  
**Scope :** Admin + Proprio dashboards  
**Approche :** Enrichissement ciblé du `DashboardSidebar` existant (Approche A)

---

## Objectif

Améliorer les dashboards admin et proprio sans changer l'essence visuelle Kayvila (bg-navy, gold, icônes PNG) en ajoutant trois features : sidebar rétractable, menus groupés avec sous-menus animés, et badges dynamiques depuis la DB. Bonus léger : breadcrumb dans le header.

---

## Section 1 — Sidebar rétractable

### Comportement

- `DashboardShell` gère `collapsed: boolean` initialisé depuis `localStorage("kayvila-sidebar-collapsed")`.
- En mode normal : `w-64`, labels visibles, groupes visibles, sous-menus accessibles.
- En mode collapsed : `w-16`, icônes seules (28px PNG / 26px Lucide), labels masqués via `sr-only`, groupes headings masqués, sous-menus désactivés.
- `main` content transite `md:pl-64 → md:pl-16` avec `transition-[padding] duration-300`.
- Tooltip natif `title={item.label}` sur chaque item en mode collapsed pour l'accessibilité.
- En mode collapsed, un badge devient un dot `w-2 h-2 rounded-full bg-gold` sans chiffre.

### Toggle

- Bouton `PanelLeftClose` / `PanelLeftOpen` (Lucide, 18px, strokeWidth=1.5) en bas de la sidebar desktop, au-dessus de la zone user.
- Le bouton mobile existant dans `DashboardHeader` reste inchangé (gère le drawer overlay).

### Contraintes

- Pas de breakpoint mobile pour le collapse — le collapse desktop n'existe que sur `md:`. Sur mobile, le comportement actuel (drawer) est inchangé.
- `DashboardShell` passe `collapsed` + `onToggleCollapsed` en props à `DashboardSidebar`.
- `DashboardShell` ajuste `md:pl-64` → `md:pl-16` dynamiquement.

---

## Section 2 — Menus groupés + sous-menus animés

### Type `SidebarMenuItem` étendu

`AdminMenuItems.ts` et `ProprioMenuItems.ts` définissent actuellement leur propre type `MenuItem` local. Il faut le supprimer et importer `SidebarMenuItem` depuis `DashboardSidebar` (source unique).

```ts
// components/dashboard/shared/DashboardSidebar.tsx — export
export interface SidebarMenuItem {
  label: string;
  href: string;
  icon: string;
  exact?: boolean;
  badge?: number;        // count live, masqué si 0
  group?: string;        // heading de section (ex. "GESTION")
  children?: SidebarMenuItem[];  // sous-items (niveau 1 seulement)
}
```

### Animation sous-menus

CSS grid pur — même pattern que le composant de référence :

```css
/* ouvert */   grid-rows-[1fr] opacity-100
/* fermé */    grid-rows-[0fr] opacity-0
transition: grid-template-rows 300ms ease, opacity 300ms ease
```

Ligne guide verticale `border-l border-white/10` absolue sur les enfants, décalée de 17px.

Les sous-items héritent du `SidebarMenuItems` type sans `children` (un seul niveau de nesting).

Un item parent avec `children` s'expand/collapse au clic (état local `useState`). Il est auto-expanded si un enfant est la route active au montage.

En mode `collapsed`, les sous-menus sont entièrement masqués — cliquer un parent en collapsed force `setCollapsed(false)` puis expand.

### Menu admin restructuré (15 items → 4 groupes)

```ts
// Sans groupe
{ label: "Tableau de bord", href: "/admin", icon: "LayoutDashboard", exact: true }

// group: "GESTION"
{ label: "Villas", href: "/admin/villas", icon: "Building2", badge: <count> }
{ label: "Réservations", href: "/admin/reservations", icon: "CalendarDays", badge: <count> }
{ label: "Clients", href: "/admin/clients", icon: "UserCircle" }
{ label: "Propriétaires", href: "/admin/proprietaires", icon: "Users" }
{ label: "Soumissions", href: "/admin/soumissions", icon: "Home", badge: <count> }
{ label: "Demandes", href: "/admin/demandes", icon: "ClipboardList", badge: <count> }

// group: "FINANCES"
{ label: "Revenus", href: "/admin/revenus", icon: "DollarSign" }
{
  label: "Outils", icon: "Zap", href: "#", children: [
    { label: "Tarification", href: "/admin/tarification", icon: "Percent" },
    { label: "Sync OTA", href: "/admin/sync-ota", icon: "Zap" },
  ]
}

// group: "OUTILS"
{ label: "Avis", href: "/admin/avis", icon: "Star", badge: <count> }
{ label: "Documents", href: "/admin/documents", icon: "FileText" }
{ label: "Messagerie", href: "/admin/messagerie", icon: "MessageCircle" }
{ label: "Concierge IA", href: "/admin/concierge", icon: "Sparkles" }
{ label: "Paramètres", href: "/admin/parametres", icon: "Settings" }
```

### Menu proprio restructuré (8 items → 3 groupes)

```ts
// Sans groupe
{ label: "Tableau de bord", href: "/dashboard", icon: "LayoutDashboard", exact: true }

// group: "MES PROPRIÉTÉS"
{ label: "Mes Villas", href: "/dashboard/villas", icon: "Building2" }
{ label: "Réservations", href: "/dashboard/reservations", icon: "CalendarDays", badge: <count> }
{ label: "Tâches", href: "/dashboard/taches", icon: "ClipboardList", badge: <count> }

// group: "FINANCES & SUIVI"
{ label: "Revenus", href: "/dashboard/revenus", icon: "DollarSign" }
{ label: "Statistiques", href: "/dashboard/statistiques", icon: "BarChart3" }

// group: "SERVICES"
{ label: "Mon concierge", href: "/dashboard/concierge", icon: "Sparkles" }
{ label: "Mes documents", href: "/dashboard/documents", icon: "FileText" }
```

### Rendu des groupes

La sidebar itère les items et insère un heading `<p>` avant le premier item de chaque nouveau groupe :

```tsx
<p className="px-4 pt-5 pb-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/30">
  {group}
</p>
```

En mode collapsed, les headings sont masqués (`hidden`).

---

## Section 3 — Badges dynamiques

### Fetch admin (dans `app/(admin)/admin/layout.tsx`)

```ts
const [reservations, soumissions, avis, demandes] = await Promise.all([
  supabase.from("bookings").select("id", { count: "exact", head: true }).eq("status", "pending"),
  supabase.from("villa_submissions").select("id", { count: "exact", head: true }).eq("status", "pending"),
  supabase.from("reviews").select("id", { count: "exact", head: true }).eq("status", "pending"),
  supabase.from("requests").select("id", { count: "exact", head: true }).eq("priority", "urgent").neq("status", "resolved"),
])
```

Ces counts sont injectés dans `adminMenuItems` avant de passer à `DashboardShell`.

### Fetch proprio (dans `app/(proprio)/dashboard/layout.tsx`)

```ts
// ownerVillaIds déjà fetchés dans le layout
const ownerVillaIds = (ownerVillas ?? []).map((v) => v.id);

// Guard : .in() sur tableau vide = erreur Postgres → skip si aucune villa
const [reservations, taches] = ownerVillaIds.length > 0
  ? await Promise.all([
      supabase.from("bookings").select("id", { count: "exact", head: true })
        .in("villa_id", ownerVillaIds).eq("status", "pending"),
      supabase.from("tasks").select("id", { count: "exact", head: true })
        .in("villa_id", ownerVillaIds).neq("status", "done"),
    ])
  : [{ count: 0 }, { count: 0 }];
```

### Rendu badge

```tsx
{item.badge && item.badge > 0 && !collapsed && (
  <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-gold/80 px-1.5 text-[10px] font-bold text-navy">
    {item.badge > 99 ? "99+" : item.badge}
  </span>
)}
{item.badge && item.badge > 0 && collapsed && (
  <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-gold" />
)}
```

---

## Section 4 — Bonus : Breadcrumb dans DashboardHeader

`DashboardHeader` reçoit `menu: SidebarMenuItem[]` (déjà disponible depuis `DashboardShell`).

Fonction utilitaire `findBreadcrumb(menu, pathname)` retourne `[parentLabel?, currentLabel]` en cherchant dans les items et leurs children.

Affiché entre le toggle mobile et le titre "Kayvila" :

```
Admin / Réservations
```

Style : `text-[12px] text-navy/50` → `text-navy` pour la page courante. Masqué sur mobile (`hidden md:flex`).

---

## Fichiers modifiés (7 fichiers, 0 nouveau)

| Fichier | Changement |
|---------|-----------|
| `components/dashboard/shared/DashboardSidebar.tsx` | Collapse + NavItem récursif + groupes + badges |
| `components/dashboard/shared/DashboardShell.tsx` | État collapsed + pl dynamique |
| `components/dashboard/shared/DashboardHeader.tsx` | Breadcrumb + reçoit `menu` |
| `components/dashboard/admin/AdminMenuItems.ts` | Restructuration groupes + children + badge slots |
| `components/dashboard/proprio/ProprioMenuItems.ts` | Restructuration groupes + badge slots |
| `app/(admin)/admin/layout.tsx` | Fetch badge counts + inject dans menu |
| `app/(proprio)/dashboard/layout.tsx` | Fetch badge counts + inject dans menu |

---

## Contraintes Kayvila à respecter

- `bg-navy` sidebar, jamais `bg-card` / `bg-sidebar`
- Icônes : PNG 28px (`invert`) pour les noms mappés, Lucide 26px sinon
- Texte ≥ 11px partout
- Gold uniquement pour les signaux (actif, badge) — jamais décoratif
- Pas de `<main>` nested
- Lucide icons = strings (Server→Client)
- `"use client"` inline interdit dans un Server Component — extraire si besoin
