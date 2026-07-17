# Audit responsive mobile — 2026-07-13

**Diagnostic uniquement — aucun correctif appliqué.** Ken décide des priorités.

## Contexte et périmètre

Angle mort de l'audit préprod du 2026-07-11 (`audit-preprod-2026-07-11.md`), qui couvrait Stripe + fonctionnel UI mais pas le responsive mobile en tant que tel. Cet audit couvre : site vitrine public, espace client, dashboard proprio, dashboard admin — viewport testé 390×844 (iPhone-like).

**Note méthodologique** : le dev server tournait déjà sur `localhost:3001` (non relancé). La navigation live Playwright a été partagée avec un agent d'audit concurrent (dashboard admin), ce qui a provoqué des collisions de session en cours de test (redirections inattendues). Une partie du diagnostic s'appuie donc sur une analyse statique du code (grep + lecture ciblée) recoupée avec les captures obtenues avant collision, plutôt que sur une navigation live exhaustive de bout en bout. Recommandation : refaire une passe de vérification visuelle live (Playwright ou device réel) sur les pages listées en P1 une fois qu'aucun autre agent n'utilise le même navigateur.

---

## 🟠 P1 — à corriger avant/peu après bascule

### 1. Tableau "Registre des Séjours" (assistant dashboard) coupe le contenu au lieu de scroller
`components/dashboard/assistant-views/BookingsView.tsx:22-23`

Le wrapper du tableau utilise `overflow-hidden` au lieu de `overflow-x-auto` :
```tsx
<div className="overflow-hidden rounded-[32px] border border-white/5 bg-[#0D0D14]">
  <table className="w-full text-left border-collapse">
```
4 colonnes (Client & Villa / Dates / Paiement / Montant) avec padding généreux (`p-6`) sur un tableau `w-full` — sur un viewport 390px, les colonnes de droite (Paiement, Montant) seront **invisibles et inaccessibles**, pas seulement compressées : `overflow-hidden` empêche tout scroll horizontal de rattrapage.

**Impact** : dans cette vue assistant/admin, impossible de voir le montant ou le statut de paiement d'une réservation sur mobile.

### 2. Tableau "Tarifs saisonniers" (éditeur de villa, admin) — même bug
`components/dashboard/admin/SeasonalRatesManager.tsx:176-177`

Même pattern : `overflow-hidden` sur le wrapper d'un tableau à 6 colonnes (Saison / Début / Fin / Prix nuit / vs base / actions). Sur mobile, les colonnes de fin de tableau (notamment la colonne actions) sont hors champ et non récupérables par scroll.

**Comparer avec le bon pattern déjà utilisé ailleurs dans le repo** (`overflow-x-auto`), présent correctement dans 9 autres tableaux du dashboard (`AdminRevenusClient.tsx`, `OwnerRevenueTab.tsx`, `DocumentsTable.tsx`, `RevenueMonthDetail.tsx`, `VillaBookingsRegistry.tsx`, `RevenueBreakdownTable.tsx`, `SeasonalStatsSection.tsx`, `DocumentsList.tsx`, `VillaPastBookingsDrawer.tsx`) — ces deux fichiers sont les seules exceptions repérées.

### 3. Label "Notifications" non masqué sur mobile dans le header dashboard
`components/dashboard/shared/DashboardHeader.tsx:65` appelle `<NotificationBell userId={userId} role={role} />` sans passer `collapsed`.

Dans `components/dashboard/NotificationBell.tsx:239-241`, le label texte n'est masqué que si `collapsed` est vrai :
```tsx
{!collapsed && (
  <span className="text-sm font-medium truncate">Notifications</span>
)}
```
Comme `collapsed` défaut à `false` et n'est jamais passé depuis `DashboardHeader`, le texte "Notifications" (avec `truncate`) s'affiche à côté de la cloche **même sur mobile**, dans un header déjà serré (hamburger + label rôle + logo + heure + cloche + avatar sur 390px). Résultat observé en capture d'écran live (espace client, compte "Sophie") : le texte est visuellement tronqué en "Notificat…", illisible et purement décoratif à cette taille — de l'espace perdu sans information utile.

**Recommandation (constat, pas correction)** : passer `collapsed` (ou un équivalent `hidden sm:inline`) sur mobile pour ne garder que l'icône avec badge, comme c'est probablement déjà fait ailleurs dans la sidebar collapsed.

---

## 🟡 P2 — confort

- Rien d'autre de confirmé à ce niveau de profondeur d'analyse — une passe visuelle live complète (non biaisée par la collision de navigateur) permettrait probablement d'en remonter d'autres, notamment sur les vues secondaires du dashboard admin/proprio non inspectées ici (calendriers, formulaires d'édition villa).

---

## ✅ Points solides confirmés (pas de régression à craindre)

- **Navbar public** (`components/layout/Navbar.tsx`) : hamburger `md:hidden` bien implémenté, tous les liens/boutons du menu mobile en `min-h-[44px]`, `aria-label` présents sur les triggers (déjà conforme aux règles Apple HIG / WCAG 2.5.5).
- **`safe-area-inset`** : correctement géré dans 12 fichiers clés (Navbar, Footer, BookingBottomSheet, CheckoutView, Chatbot, MobileBottomNav, FilterBottomSheet, DashboardShell, VillasMapView, CompareBar, villa detail, prestations) — pas de zone masquée par l'encoche/barre de gestes iPhone détectée.
- **Éléments à largeur fixe suspects** (`Chatbot.tsx` `w-[400px]`, `VillaPastBookingsDrawer.tsx` `w-[640px]`) : vérifiés, tous deux correctement encadrés par `max-w-[calc(100vw-2rem)]` ou équivalent — pas de débordement horizontal réel.
- **Page d'accueil publique** (390px) : aucun débordement horizontal (`scrollWidth === clientWidth`), pas d'erreur console.
- **`BookingBottomSheet`** (flux de réservation, page critique) : touch targets déjà en `min-h-[48px] min-w-[44px]`.

---

## Non couvert par manque de temps / collision navigateur

- Dashboard admin (pages hors tableaux ci-dessus) : calendriers, éditeur villa complet, gestion propriétaires — voir l'audit dédié `audit-dashboard-admin-2026-07-13.md` en parallèle.
- Formulaires (checkout, contact, soumettre-ma-villa) : vérification statique rapide OK (labels, `tap-target`), pas de test de saisie tactile réel avec clavier virtuel.
- Vérification live des breakpoints intermédiaires (tablette 768px).

**How to apply** : si Ken demande de corriger le responsive, commencer par les 2 tableaux `overflow-hidden` (P1.1, P1.2) — fix mécanique d'une ligne chacun — puis le label Notifications (P1.3). Le reste du site est dans un état responsive globalement sain, pas de refonte nécessaire.
