# Spec : Redesign Dashboard Propriétaire + Copilot IA

> **Date :** 2026-05-01
> **Projet :** Diamant Noir / Kayvila
> **Stack :** Next.js 15 App Router + Supabase + Tailwind 3.4
> **Design skill :** impeccable (blanc/noir/navy, pas d'or)

---

## 1. Direction créative

### Brand voice
Sobre, précis, autoritaire. Un outil de gestion pour propriétaires exigeants. Le luxe est dans la rigueur — pas de fioritures, palette monochrome, typographie distinctive.

### Audience
Propriétaires de villas de luxe en Martinique. Utilisation quotidienne, sur desktop principalement (mais responsive). Ils veulent voir leurs chiffres rapidement, gérer leurs réservations, et avoir un copilot qui répond à leurs questions.

### Palette
```
navy-900: oklch(0.18 0.04 250)    /* #0B1D2E — sidebar, headings */
navy-800: oklch(0.22 0.05 250)    /* #132A41 — sidebar hover */
cream:    oklch(0.97 0.005 80)     /* #F7F5F0 — fond page */
white:    oklch(1 0 0)             /* #FFFFFF — cards */
black:    oklch(0.15 0 0)          /* #1A1A1A — textes forts */
muted:    oklch(0.6 0.01 250)      /* #8B8B8B — textes secondaires */
border:   oklch(0.92 0.005 80)     /* #E5E3DB — bordures */
success:  oklch(0.55 0.15 160)     /* #059669 */
warning:  oklch(0.65 0.18 75)      /* #D97706 */
error:    oklch(0.55 0.2 25)       /* #DC2626 */
```

### Typographie
- **Display :** `Sora` (géométrique, élégant) — titres, KPIs, navigation
- **Body :** `Instrument Sans` (propre, neutre, très lisible) — tout le texte courant
- **Mono :** `JetBrains Mono` — uniquement pour les données chiffrées si pertinent

Échelle : `clamp()` sur les headings marketing, `rem` fixe sur le dashboard.

---

## 2. Layout global & Sidebar

### Structure
```
┌─────────────┬──────────────────────────────────────────┐
│             │  HEADER (titre page, date, notif, avatar) │
│   SIDEBAR   ├──────────────────────────────────────────┤
│   (fixe)    │                                          │
│   240px     │         CONTENU PRINCIPAL                 │
│   navy-900  │         (scrollable)                      │
│             │                                          │
│             │                              [💎] Copilot │
└─────────────┴──────────────────────────────────────────┘
```

### Sidebar
- Fond `navy-900`, largeur 240px, hauteur 100dvh
- Logo "Kayvila" : `text-[10px] font-bold tracking-[0.38em] text-white/60` en haut, padding 24px
- Menu items : icône lucide `size-4` + label, `gap-3`, padding `py-2.5 px-6`
- Liens : `text-white/50 hover:text-white transition-colors`
- Item actif : `text-white bg-white/8` + pastille blanche 3px à gauche (`border-l-2 border-white`)
- Espacement entre items : `gap-1`
- Menu du bas : nom proprio + avatar + déconnexion, ancré en bas (`mt-auto`)
- Largeur responsive : sidebar se réduit à 64px (icônes seulement) sur `md`, cachée sur mobile avec bouton hamburger

### Header
- Transparent, `h-16`, `border-b border-border`, padding `px-8`
- Titre de page : `font-display text-xl font-semibold text-black`
- À droite : date (format FR, `text-sm text-muted`), notification bell (avec badge rouge), avatar circulaire 32px

### Fichiers impactés
- `app/(proprio)/dashboard/layout.tsx` — layout serveur (auth guard)
- `components/dashboard/proprio/OwnerSidebar.tsx` — refonte complète
- `components/dashboard/proprio/OwnerHeader.tsx` — refonte complète

---

## 3. Page d'accueil (Tableau de bord)

### Zone 1 — KPIs exécutifs (3 cartes cliquables)

```
┌─────────────────────┬─────────────────────┬─────────────────────┐
│                     │                     │                     │
│  Revenus du mois    │ Réservations à venir│ Taux d'occupation   │
│  €6 200             │  12                 │  78%                │
│  ↑ +12% vs mars     │  +3 cette semaine   │  ↑ 5pts vs mars     │
│                     │                     │                     │
└─────────────────────┴─────────────────────┴─────────────────────┘
```

Chaque carte :
- Fond `white`, `border border-border`, `rounded-xl`, padding `p-6`
- Label : `text-[11px] font-bold uppercase tracking-[0.2em] text-muted`
- Valeur : `font-display text-3xl font-bold text-black` (Sora)
- Tendance : `text-xs font-medium text-success` (ou muted si négatif)
- `cursor-pointer`, `transition-all hover:-translate-y-0.5 hover:shadow-md`
- Clic : `/dashboard/revenus`, `/dashboard/reservations`, `/dashboard/statistiques/[firstVillaId]`

### Zone 2 — Aujourd'hui & Alertes (2 colonnes)

```
┌──────────────────────────┬──────────────────────────┐
│  AUJOURD'HUI             │  ALERTES                 │
│                          │                          │
│  ● 14:00  ARRIVÉE        │  ⚠ Tâche ménage en      │
│    Jean Dupont           │    retard - Villa         │
│    Villa Alizés          │    Alizés                 │
│                          │                          │
│  ● 11:00  DÉPART         │  ✓ Toutes les alertes    │
│    Marie Laurent         │    sont traitées         │
│    Villa Azur            │                          │
└──────────────────────────┴──────────────────────────┘
```

**Timeline "Aujourd'hui" :**
- Titre : `text-[11px] font-bold uppercase tracking-[0.2em] text-muted`
- Événements du jour récupérés depuis Supabase (bookings avec check_in/check_out = today)
- Pastilles : `w-2 h-2 rounded-full` verte (arrivée), rouge (départ), bleue (séjour)
- Texte : nom client, villa
- Si aucun événement : "Aucun événement aujourd'hui" en `text-muted italic`

**Alertes :**
- Même titre que la timeline
- Récupérées depuis la table `villa_events` ou `tasks` (statut pending avec priorité high)
- Cartes compactes `bg-cream rounded-lg p-3 text-sm`
- Pas de bordure latérale (interdit par impeccable)
- Si aucune alerte : message "Tout est calme" en `text-muted italic`

### Zone 3 — Graphique + Prochaines réservations (2 colonnes)

```
┌──────────────────────────┬──────────────────────────┐
│                          │  PROCHAINES RÉSERVATIONS  │
│  [GRAPH REVENUS          │                          │
│   MENSUELS]              │  Jean Dupont             │
│                          │  14 juin - 21 juin       │
│                          │  Villa Alizés · €4 200   │
│                          │                          │
│                          │  Marie Laurent            │
│                          │  22 juin - 28 juin       │
│                          │  Villa Azur · €3 800     │
│                          │                          │
│                          │  → Voir toutes les résas  │
└──────────────────────────┴──────────────────────────┘
```

**Graphique :**
- `RevenueChart.tsx` refait avec le Recharts en un seul dynamic import
- Hauteur 280px, pas de légende, tooltip minimaliste
- Barres fines (`maxBarSize: 32`), couleur `navy-900` (pas d'or)

**Prochaines résas :**
- Mini-liste des 3 prochaines bookings (check_in à venir, status != cancelled)
- Chaque ligne : nom invité, dates, villa, prix
- Lien "→ Voir toutes les réservations" en bas

### Fichiers impactés
- `app/(proprio)/dashboard/page.tsx` — refonte complète
- `components/dashboard/proprio/KpiCard.tsx` — refonte (version cliquable)
- `components/dashboard/proprio/KpiRow.tsx` — grid 3 colonnes
- `components/dashboard/proprio/RevenueChart.tsx` — déjà refait
- `components/dashboard/proprio/TodayTimeline.tsx` — NOUVEAU
- `components/dashboard/proprio/AlertsWidget.tsx` — NOUVEAU
- `components/dashboard/proprio/UpcomingBookings.tsx` — NOUVEAU

---

## 4. Copilot "Diamant"

### Architecture

```
┌─────────────────────┐     POST /api/chatbot-owner
│  CopilotButton      │ ───────────────────────►  n8n Webhook
│  (floating, fixed)  │                              │
└─────────────────────┘     JSON body:                │
       │                   { message,                 │
       │                     context: { portfolio,    │
       │                       today, alerts, ... },  │
       │                     messages_history,        │
       │                     owner_id }               │
       ▼                              │
┌─────────────────────┐              │
│  CopilotPanel       │ ◄────────────┘
│  (slide-over 380px) │     { response, action,
│  Messages +         │       action_data,
│  suggestions +      │       suggested_prompts }
│  input              │
└─────────────────────┘
```

### Bouton flottant (CopilotButton)
- `fixed bottom-6 right-6`, `z-40`
- Cercle `w-12 h-12 rounded-full bg-navy-900`
- Icône diamant (lucide `Gem`), `text-white`, `size-5`
- `shadow-lg`, hover : `shadow-xl scale-105`, transition 200ms
- Petit badge de notification si alerte stratégique active

### Panel latéral (CopilotPanel)
- Slide-over depuis la droite, `w-[380px] max-w-[90vw]`, `h-dvh`
- Fond `white`, `shadow-2xl`, `z-50`
- Animation : `translate-x` 0 → 380px, `300ms ease-out`

**Header :**
- Fond `navy-900`, padding `p-5`
- Titre : "Diamant" en `font-display text-lg text-white`
- Sous-titre : "Votre copilot Kayvila" en `text-xs text-white/50`
- Bouton fermer (X) en haut à droite

**Messages :**
- Zone scrollable, padding `p-4`
- Message utilisateur : aligné droite, `bg-navy-900 text-white rounded-xl rounded-br-sm`, `max-w-[85%]`, `p-3`
- Message Diamant : aligné gauche, `bg-cream text-black rounded-xl rounded-bl-sm`, `max-w-[85%]`, `p-3`
- Avatar Diamant : petite icône gem dans un cercle avant chaque message

**Suggestions rapides (chips) :**
- En dessous des messages, avant l'input
- 3 chips horizontales, scrollables si overflow
- Chaque chip : `bg-cream border border-border rounded-full px-3 py-1.5 text-xs text-navy-900 hover:bg-border cursor-pointer`
- Contenu : les `suggested_prompts` retournés par le workflow n8n

**Input :**
- Barre fixe en bas du panel
- Champ `flex-1` + bouton envoi (icône `ArrowUp`)
- Placeholder : "Posez votre question..."
- Envoi au webhook n8n, loading state sur le bouton

### Flux de données

1. Le bouton est cliqué → `CopilotPanel` s'ouvre
2. Le panel charge le contexte depuis Supabase (via API route locale `/api/chatbot-owner-context`)
3. L'utilisateur envoie un message → POST `/api/chatbot-owner` → n8n → OpenAI → réponse
4. La réponse est parsée : `response` affiché dans les messages, `action` utilisé pour naviguer si pertinent
5. Les `suggested_prompts` sont affichés en chips

### Fichiers à créer
- `components/dashboard/proprio/CopilotButton.tsx`
- `components/dashboard/proprio/CopilotPanel.tsx`
- `components/dashboard/proprio/CopilotMessage.tsx`
- `components/dashboard/proprio/CopilotContext.tsx` (contexte React pour l'état du copilot)
- `hooks/useCopilot.ts` (logique d'envoi, historique)
- `app/api/chatbot-owner-context/route.ts` (API locale pour agréger le contexte proprio)
- `types/copilot.ts` (types partagés)

### Intégration au layout
- `CopilotButton` et `CopilotPanel` dans `OwnerLayout.tsx`

---

## 5. Pages filles (rafraîchissement visuel)

Pas de changement structurel majeur — les routes existantes sont bonnes. On applique la nouvelle palette et la typographie.

### Modifications communes à toutes les pages :
- Titres : `font-display text-2xl font-bold text-black` (Sora)
- Sous-titres : `text-sm text-muted`
- Cards : `bg-white border border-border rounded-xl p-6`
- Tableaux : lignes `border-b border-border`, pas de bg alterné
- Boutons : `bg-navy-900 text-white rounded-lg px-4 py-2 text-sm font-medium`

### Pages impactées
- `app/(proprio)/dashboard/reservations/page.tsx` (existe déjà, ajuster palette)
- `app/(proprio)/dashboard/reservations/[villaId]/page.tsx`
- `app/(proprio)/dashboard/reservations/[villaId]/[bookingId]/page.tsx`
- `app/(proprio)/dashboard/revenus/page.tsx`
- `app/(proprio)/dashboard/taches/page.tsx`
- `app/(proprio)/dashboard/villas/page.tsx`
- `app/(proprio)/dashboard/villas/[villaId]/page.tsx`
- `app/(proprio)/dashboard/statistiques/page.tsx` (existe déjà)
- `app/(proprio)/dashboard/statistiques/[villaId]/page.tsx`

---

## 6. Composants à créer / refondre

### Nouveaux composants
| Composant | Type | Description |
|-----------|------|-------------|
| `TodayTimeline.tsx` | Server | Timeline des check-in/out du jour |
| `AlertsWidget.tsx` | Server | Alertes actives pour le proprio |
| `UpcomingBookings.tsx` | Server | Mini-liste des 3 prochaines résas |
| `CopilotButton.tsx` | Client | Bouton flottant "Diamant" |
| `CopilotPanel.tsx` | Client | Slide-over panel du copilot |
| `CopilotMessage.tsx` | Client | Bulle de message unique |
| `CopilotContext.tsx` | Client | Contexte React pour état copilot |
| `useCopilot.ts` | Hook | Logique d'envoi + historique |

### Composants à refondre
| Composant | Changement |
|-----------|------------|
| `OwnerSidebar.tsx` | Nouvelle palette, layout, pastille item actif |
| `OwnerHeader.tsx` | Nouveau header transparent + date |
| `KpiCard.tsx` | Version cliquable + nouvelle palette |
| `KpiRow.tsx` | Grid 3 colonnes responsive |
| `RevenueChart.tsx` | Déjà refait, appliquer nouvelle palette |
| `BookingList.tsx` | Palette + typographie |
| `BookingDetailCard.tsx` | Palette + typographie |

---

## 7. API Route : `/api/chatbot-owner-context`

Endpoint GET qui agrège le contexte du propriétaire pour le copilot :

```typescript
// GET /api/chatbot-owner-context
// Auth: middleware (token)
// Response:
{
  portfolio: {
    total_villas: number,
    published_villas: number,
    total_revenue_paid: number,
    revenue_current_month: number,
    revenue_last_month: number,
    upcoming_bookings_count: number,
    pending_tasks_count: number
  },
  today: Array<{
    kind: "check_in" | "check_out" | "stay",
    villa_name: string,
    guest_name: string,
    start_date: string,
    end_date: string
  }>,
  alerts: Array<{
    severity: "high" | "medium" | "low",
    title: string,
    body?: string
  }>,
  tasks_preview: Array<{
    villa_name: string,
    content: string
  }>,
  villas_summary: Array<{
    name: string,
    is_published: boolean
  }>,
  current_date_iso: string
}
```

### Fichier à créer
- `app/api/chatbot-owner-context/route.ts`

---

## 8. Tests & vérification

- Build TypeScript : `tsc --noEmit` → 0 erreurs
- Build Next : `npm run build` → OK
- Tests manuels : navigation complète du dashboard
- Copilot : POST manuel vers `/api/chatbot-owner-context` → JSON valide
- Responsive : sidebar réduite à 64px, pas d'overflow horizontal

---

## 9. Plans d'implémentation (lots)

### Lot 1 — Palette + typographie (front)
1. Ajouter `Sora` et `Instrument Sans` dans `app/layout.tsx`
2. Définir les tokens CSS dans `app/globals.css` (variables oklch)
3. Créer les classes utilitaires Tailwind si nécessaire

### Lot 2 — Sidebar + Header
1. Refondre `OwnerSidebar.tsx` (nouveau design)
2. Refondre `OwnerHeader.tsx` (date, notif, avatar)
3. Ajuster `OwnerLayout.tsx` pour la nouvelle largeur

### Lot 3 — Page d'accueil
1. Refondre `KpiCard.tsx` (version cliquable)
2. Créer `TodayTimeline.tsx`
3. Créer `AlertsWidget.tsx`
4. Créer `UpcomingBookings.tsx`
5. Refondre `app/(proprio)/dashboard/page.tsx`

### Lot 4 — Copilot IA
1. Créer `useCopilot.ts` + `CopilotContext.tsx`
2. Créer `CopilotButton.tsx`
3. Créer `CopilotMessage.tsx`
4. Créer `CopilotPanel.tsx`
5. Créer `app/api/chatbot-owner-context/route.ts`
6. Intégrer dans `OwnerLayout.tsx`

### Lot 5 — Rafraîchissement pages filles
1. Appliquer nouvelle palette aux 9 pages filles

### Lot 6 — Vérification + logs
1. Build, test, documentation
