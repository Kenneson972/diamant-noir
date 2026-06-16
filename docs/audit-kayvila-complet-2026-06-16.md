# Kayvila — Audit Complet (Bugs + Recommandations HeroUI)

**Date** : 15-16 Juin 2026
**Source** : 3 sous-agents Élise (layout mobile, incohérences composants, UX/visuels)
**Total bugs trouvés** : 69 (11 🔴 bloquants, 28 🟠🟡 majeurs/modérés, 14 🟢 mineurs, 16 recommandations HeroUI)

---

## 🔴 BLOQUANTS (11 bugs)

### Layout Mobile

| # | Fichier | Ligne | Problème | Fix |
|---|---------|-------|----------|-----|
| 1 | `DashboardShell.tsx` | 75 | `h-[calc(100dvh-4rem)] overflow-hidden` → tout le dashboard cassé sur mobile avec clavier ouvert | `overflow-y-auto` ou HeroUI `Drawer` |
| 2 | `AdminReservationsKanban.tsx` | 90 | 4 colonnes × `min-w-[220px]` = 880px → inutilisable sur mobile | HeroUI `Tabs` par statut sur mobile, `Table.ScrollContainer` sur desktop |
| 3 | `VillaPastBookingsDrawer.tsx` | 61-119 | `<table>` sans `overflow-x-auto` → déborde sur mobile | HeroUI `Table.ScrollContainer` |
| 4 | `OwnerMessaging.tsx` | 94 | `h-[500px]` fixe | `min-h-[calc(100dvh-10rem)]` (déjà identifié par Claude) |
| 5 | `Chatbot.tsx` | 284-288 | `h-[600px]` ne tient pas sur laptop 13" | `min(600px, 80dvh)` ou HeroUI `Drawer` |
| 6 | `CopilotPanel.tsx` | 49 | `fixed` sans `safe-area-inset-top` | `pt-[env(safe-area-inset-top)]` ou HeroUI `Drawer` |
| 7 | `DashboardSidebar.tsx` | 148 | `fixed inset-0` sans safe-area, bouton fermeture sous l'encoche | `pt-[env(safe-area-inset-top)]` ou HeroUI `Drawer` |

### Incohérences Composants

| # | Problème | Où | Fix |
|---|----------|-----|-----|
| 8 | **VillaImageManager absent création admin** | `AdminVillaForm.tsx` → textarea URLs uniquement | Ajouter `VillaImageManager` au formulaire création (il existe déjà dans l'édition) |
| 9 | **Deux stacks formulaire incompatibles** | `AdminVillaForm` (création : HTML natif) vs `VillaEditorForm` + `VillaFormFields` (édition : HeroUI riche) | Unifier sur `VillaEditorForm` — la création devient un cas particulier de l'édition avec `villa={}` |
| 10 | **Proprio ne peut pas créer de villa** | Pas de route/page création dans dashboard proprio | Ajouter page création proprio avec `VillaEditorForm` unifié |

### UX Critique

| # | Fichier | Problème | Fix |
|---|---------|----------|-----|
| 11 | `DashboardSidebar.tsx` | `ICON_MAP[item.icon]` retourne `undefined` si icône déclarée absente → trou visuel | Icône fallback `LayoutDashboard` |

---

## 🟠 MAJEURS (21 bugs)

### Layout (9 bugs)

| # | Fichier | Ligne | Problème | Fix |
|---|---------|-------|----------|-----|
| 12 | `VillaGallery.tsx` | 44-79 | `h-[60vh]` / `h-[70vh] max-h-[640px]` non responsive | `min-h-[40vh] sm:min-h-[60vh] max-h-[600px]` |
| 13 | `Navbar.tsx` | 163-306 | Header fixed sans dégradé quand transparent → texte illisible au scroll | Dégradé subtil derrière header transparent sur mobile |
| 14 | `VillaCard.tsx` | 48 | `h-[300px]` image → disproportionné sur mobile 320px | `aspect-[4/3]` ou `h-[200px] sm:h-[260px] md:h-[300px]` |
| 15 | `HomeServicesSection.tsx` | 164 | `h-[40vw] min-h-[200px]` → disproportionné sur petit écran | `h-[35vw] min-h-[160px]` sur mobile |
| 16 | `VillasMapView.tsx` | 144-157 | Carte `h-[60dvh]` + barre + liste empilées → double scroll | Toggle "Voir sur la carte" qui remplace la liste |
| 17 | `BookingBottomSheet.tsx` | 55 | `max-w-[min(180px,42vw)]` → bouton "Réserver" trop étroit sur mobile | `w-full sm:max-w-[min(180px,42vw)]` |
| 18 | `PageHero.tsx` | 37 | `min-h-[42dvh]` + `pt-24` → 376px sur iPhone SE | `pt-16` sur mobile |
| 19 | `NotificationBell.tsx` | 236-242 | Dropdown `w-80` (320px) déborde sur mobile <320px | `max-w-[calc(100vw-2rem)] sm:w-80` |
| 20 | `CompareBar.tsx` | 49-63 | `fixed` en bas sans `safe-area-inset-bottom` | `pb-[env(safe-area-inset-bottom)]` |

### UX/Visuel (9 bugs)

| # | Fichier | Problème | Fix |
|---|---------|----------|-----|
| 21 | `HeroBackgroundMedia.tsx` | Passage poster→vidéo brutal, sans fondu | `transition-opacity duration-700` + état `videoReady` |
| 22 | `AdminVillaBlocks.tsx` | "Aucun blocage enregistré." — pas d'icône | Icône `Calendar` avec `opacity-30` |
| 23 | `AdminReservationsKanban.tsx` | Colonnes vides sans icône | Icône subtile par colonne |
| 24 | `BookingTable.tsx` | `hover:bg-navy/[0.02]` quasi invisible | `hover:bg-navy/[0.04]` minimum |
| 25 | `BookingTable.tsx` | `return null` si vide → composant disparaît | `KayvilaEmptyState` ou HeroUI `emptyContent` |
| 26 | `SeasonalRatesManager.tsx` | "Chargement..." texte brut | `<Loader2 className="animate-spin" />` |
| 27 | `CreateBookingModal.tsx` | Inputs sans `transition-colors` | Ajouter `transition-colors` uniformément |
| 28 | `Footer.tsx` | Bouton "Changer de parcours" sans hover | `hover:underline` |
| 29 | `ReportIssueButton.tsx` | Textarea sans transition | `transition-colors` |

### Incohérences (3 bugs)

| # | Problème | Détail | Fix |
|---|----------|--------|-----|
| 30 | Photos admin vs proprio | Admin : `VillaImageManagerWrapper` intégré. Proprio : lien vers page `/photos` séparée | Intégrer `VillaImageManagerWrapper` dans l'édition proprio |
| 31 | iCal deux implémentations | Admin : `PlanningIcalSyncCard`. Proprio : `VillaIcalPanel` (plus riche) | Utiliser `VillaIcalPanel` partout |
| 32 | Copilot IA proprio uniquement | `CopilotProvider` dans layout proprio, absent layout admin | Ajouter au layout admin (optionnel) |

---

## 🟡 MODÉRÉS (20 bugs)

| # | Fichier | Problème | Fix |
|---|---------|----------|-----|
| 33 | `OwnerContactFAB.tsx` | FAB fixed sans safe-area bottom | `bottom-[calc(6rem+env(safe-area-inset-bottom))]` |
| 34 | `DashboardHeader.tsx` | `sticky top-0` sans safe-area top | `pt-[env(safe-area-inset-top)]` |
| 35 | `BookLandingMarketing.tsx` | `pb-20` mobile excessif | `pb-12` sur mobile |
| 36 | `VillaFilterBar.tsx` | Badges `shrink-0` → scroll horizontal sur mobile | `flex-wrap` ou HeroUI `Chip` |
| 37 | `TenantChatbot.tsx` | `max-w-[78%]` messages → peut être `85%` sur très petit écran | `max-w-[85%] xs:max-w-[78%]` |
| 38 | `HomeExperiencesGrid.tsx` | `w-1/4` images sans `flex-wrap` | `min-w-[150px]` ou `flex-wrap` |
| 39 | `VideoScrollHero.tsx` | `h-[55vh]` transition → 55% viewport sur mobile acceptable mais lourd | `h-[40vh] sm:h-[55vh]` |
| 40 | `RevenueBreakdownTable.tsx` | `<table>` sans `overflow-x-auto` | `overflow-x-auto` sur wrapper |
| 41 | `AdminVillaForm.tsx` | `ownersLoading` → select désactivé avec texte "Chargement…" | `Loader2` à côté du select |
| 42 | `Footer.tsx` | Liens Facebook/TikTok = `href="#"` | Vraies URLs ou suppression |
| 43 | `CopilotPanel.tsx` | Overlay `bg-black/10` presque invisible | `bg-black/30` minimum |
| 44 | `NotificationBell.tsx` | Animation `wiggle` dépend de config Tailwind externe | Vérifier présence keyframe ou définir inline |
| 45 | `AdminReservationsDataGrid.tsx` | Input recherche sans `transition-colors` | `transition-colors duration-200` |
| 46 | `RevenueChart.tsx` | "Pas assez d'historique" sans icône | `BarChart3` en grisé |
| 47 | `OwnerContactFAB.tsx` | Bouton Envoyer sans icône | `Send` ou `Mail` |
| 48 | `ProprioBookingDataGrid.tsx` | "Aucune réservation." sans icône | `CalendarX` ou `Inbox` |
| 49 | `OwnerInfoTab.tsx` | Bouton Save sans feedback succès | État `saved` avec `Check` icon |
| 50 | `DashboardSidebar.tsx` | "Retour au site public" contraste 2.5:1 (< WCAG AA 4.5:1) | `text-white/65` minimum + icône |
| 51 | `CreateBookingModal.tsx` | `z-[1080]` excessif vs `z-50` standard | Valeur cohérente avec le système |
| 52 | `AdminVillaBlocks.tsx` | Proprios ne peuvent pas bloquer dispos, seulement admins | Ajouter blocage dispo dans dashboard proprio |

---

## 🟢 MINEURS (14 bugs)

| # | Fichier | Problème |
|---|---------|----------|
| 53 | `Navbar.tsx` | Logo qui chevauche burger+user sur ≤320px |
| 54 | `Chatbot.tsx` | Emoji picker potentiel débordement en fenêtre 400px |
| 55 | `KpiCard.tsx` | Grands nombres peuvent déborder sur <360px |
| 56 | `DashboardSidebar.tsx` | Indicateur scroll (dégradé) — bien pensé ✅ |
| 57 | `AdminReservationsDataGrid.tsx` | "Voir", "Confirmer", "Annuler" sans icônes → faible affordance |
| 58 | `AdminVillasDataGrid.tsx` | "Modifier" sans icône, "Voir ↗" sans `ExternalLink` |
| 59 | `VillaAmenitiesEditorWrapper` | **Code mort** — jamais importé |
| 60 | `NotificationBell` | **Code mort** — jamais importé dans aucune page |
| 61 | `AdminCommandPalette` | **Code mort** — jamais importé |
| 62 | `SeasonalRatesManager` vs `SeasonalPricesEditor` | Duplication fonctionnelle admin/proprio |
| 63 | `BookingDetailCard.tsx` | Icônes DetailRow toutes `text-navy/55` — pas de couleur sémantique |
| 64 | `HeroAudienceCards.tsx` | Hover quasi invisible (déjà identifié par Claude) |
| 65 | `HeroDatePicker.tsx` | 334 lignes de code custom buggé (déjà identifié par Claude) |
| 66 | `AdminReservationsDataGrid.tsx` | `<a target="_blank">` sans icône ExternalLink |

---

## 🧩 MAPPING HEROUI — Composants recommandés

### Composant le plus impactant : `Drawer`

Résout **7 bugs** d'un coup : DashboardShell, VillaGallery, OwnerMessaging, CopilotPanel, Chatbot, DashboardSidebar, CompareBar.

```tsx
// Pattern recommandé
<Drawer placement="bottom" shouldBlockScroll={false}>
  <DrawerContent>
    <DrawerHeader>
      <DrawerBody>{/* scroll natif */}</DrawerBody>
    </DrawerHeader>
  </DrawerContent>
</Drawer>
```

### Tableau complet des mappings

| Priorité | Composant HeroUI | Bugs résolus |
|----------|-----------------|--------------|
| 🔴 | `Drawer` | #1, #2, #4, #5, #6, #7, #20 (7 bugs) |
| 🔴 | `Table` + `Table.ScrollContainer` + `emptyContent` | #3, #7, #24, #25 (4 bugs) |
| 🔴 | `RangeCalendar` / `DateRangePicker` | #65 — remplace 334 lignes HeroDatePicker |
| 🔴 | `Form` + `Fieldset` + `TextField`/`Select`/`DatePicker` | #9, #10 — unifie création/édition |
| 🟠 | `Toast` + `toast()` | #49 — feedback après sauvegarde |
| 🟠 | `EmptyState` | #22, #23, #25, #46, #47, #48 (6 bugs) |
| 🟠 | `Skeleton` + `Spinner` | #26 — remplace "Chargement..." |
| 🟠 | `Card` (`isHoverable`) | #64 — hover header |
| 🟡 | `Chip` | #36 — badges/filtres |
| 🟡 | `Popover` / `Dropdown` | #19 — menus et dropdowns |
| 🟡 | `Tabs` | #2 — kanban mobile (une par statut) |
| 🟡 | `ScrollShadow` | #1, #3, #38 — indicateurs scroll |
| 🟡 | `Link` (`isExternal`) | #42 — liens sociaux |
| 🟡 | `Image` (`aspect-*`) | #14 — remplacer hauteurs fixes |
| 🟡 | `Alert` | #46 — empty states avec icône |
| 🟡 | `Modal` (`motionProps`) | #27, #29 — transitions formulaires |

---

## 🎯 Plan d'action recommandé

### Batch 1 — Critique (les 4 items Richard + top bugs)
1. ✅ Hover header → `Card isHoverable` (déjà en cours par Claude)
2. ✅ Calendrier mobile → `RangeCalendar` + `Drawer` (déjà en cours)
3. ✅ Messagerie → `min-h-[calc(100dvh-10rem)]` (déjà en cours)
4. ✅ Upload photos création → `VillaImageManager` (déjà en cours)
5. 🔴 **DashboardShell** → `overflow-y-auto` (fix rapide, 1 ligne)
6. 🔴 **Proprio création villa** → route + `VillaEditorForm` unifié

### Batch 2 — Mobile
7. Remplacer les panneaux fixed par `Drawer` (CopilotPanel, Chatbot, VillaGallery)
8. `Table.ScrollContainer` sur toutes les tables
9. Safe-area sur tous les fixed/sticky

### Batch 3 — Polish UX
10. `EmptyState` partout
11. `Toast` feedback
12. Icônes dans les boutons d'action
13. Nettoyage code mort (3 composants orphelins)

### Batch 4 — Unification
14. Unifier `AdminVillaForm` + `VillaEditorForm` → un seul `VillaEditorForm`
15. `VillaIcalPanel` admin + proprio
16. `VillaImageManagerWrapper` admin + proprio
