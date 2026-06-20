# Spec — Copilot "Diamant" intégré dashboard + Actions

**Date** : 2026-06-20 · **Statut** : Design validé — implémentation à venir

## Objectif

Remplacer le copilot "Diamant" en chatbulle flottante (FAB + slide-in panel) par une **section dashboard intégrée en pleine largeur** avec des **actions concrètes** que le copilot peut exécuter pour le propriétaire, pas seulement répondre.

## Partie A — UI : chat intégré au dashboard

### Suppressions
- `components/dashboard/proprio/CopilotButton.tsx` — FAB flottant (cercle navy en bas à droite)
- `components/dashboard/proprio/CopilotPanel.tsx` — slide-in panel 380px right side

### Création
- `components/dashboard/DashboardCopilotChat.tsx` — carte chat intégrée

### Modifications
- `app/(proprio)/dashboard/layout.tsx` : retirer les imports + rendus de `CopilotButton` et `CopilotPanel`. Garder `CopilotProvider`.
- `app/(proprio)/dashboard/page.tsx` : le Server Component existant délègue son rendu à un `DashboardPageClient` (nouveau Client Component dans le même dossier ou inline) qui wrappe tout le contenu — pour pouvoir consommer `useCopilotContext()`.
  - ⚠️ **Piège Server→Client** : ne JAMAIS passer de callback, promesse, ou fonction dans les props du Server Component vers `DashboardPageClient`. Next.js App Router interdit les fonctions non-sérialisables en props Server→Client. Les données sont passées comme objets simples (villages, KPIs, events). Toute logique interactive vit DANS le Client Component.

### Architecture finale
```
layout.tsx
  └─ CopilotProvider                    ← inchangé (juste plus de Button/Panel)
       └─ DashboardShell
            └─ page.tsx (Server) → DashboardPageClient (Client)
                 ├─ <h1>Tableau de bord</h1>
                 ├─ ProactiveNotification
                 ├─ StripeConnectButton
                 ├─ KpiRow
                 ├─ DashboardCopilotChat   ← NOUVEAU
                 ├─ grid (TodayTimeline + Alerts)
                 └─ grid (UpcomingBookings + Revenue)
```

### DashboardCopilotChat — design visuel

Carte pleine largeur, charte or/navy (zéro redesign), border `border-navy/10` ou `border-gold/20`, fond `bg-offwhite` ou `white`.

```
┌──────────────────────────────────────────────────┐
│ ✨ Diamant — Votre copilot Kayvila       [Reset] │ ← header
├──────────────────────────────────────────────────┤
│ (zone messages scrollable, max-h 400px)          │
│  bulles assistant (gauche, fond cream/navy)      │
│  bulles utilisateur (droite, fond gold/10)       │
│  chips suggestions (ronds, border navy/15)       │
│  cartes d'action (voir Partie B)                 │
│  typing dots pendant le chargement               │
├──────────────────────────────────────────────────┤
│ [ Posez votre question...               ] [ ↑ ]  │ ← input form
└──────────────────────────────────────────────────┘
```

- **Header** : `font-display`, icône `Sparkles`, texte "Diamant — Votre copilot Kayvila", bouton Reset discret
- **Messages** : réutiliser le composant `CopilotMessage` existant
- **Suggestions** : chips arrondies, réutiliser le style du CopilotPanel existant
- **Loading** : typing dots (réutiliser les classes CSS `dn-typing-dot` existantes)
- **Input** : même style que l'existant (border, bg-cream, focus ring)
- **Responsive** : max-h 400px desktop, 300px mobile ; pleine largeur

### CopilotProvider / useCopilotContext
- **Aucun changement** au contexte, au hook `useCopilot`, ou aux types `CopilotMessage`/`CopilotResponse`
- L'API `/api/dashboard/owner-assistant` continue de fonctionner à l'identique
- Le contrat `{ response, action, action_data, action_result, suggested_prompts }` est conservé

## Partie B — 3 actions du copilot

Principe : l'agent DeepSeek détecte l'intention → renvoie `{ reply, action, action_data }` → la route `owner-assistant` exécute (vérification propriété) → `action_result` → le frontend affiche une **carte de confirmation** via `CopilotActionCard`.

### B1. BLOCK_DATE — Blocage de dates ✅ (déjà codé)

- **Handler** : déjà présent dans `owner-assistant/route.ts` (lignes 457-477)
- **Vérification** : `ownerVillaIds.has(block.villa_id)` → 403 si non
- **INSERT** : `villa_date_blocks` avec `origin = 'Proprietaire'`
- **UI** : `CopilotActionCard` affiche "✅ Dates bloquées" avec villa, dates, motif
- **Zéro changement backend**

### B2. SET_PRICE — Modification de prix 🆕

- **Détection agent** : phrases type "passe la villa X à 2000€", "baisse le prix", "augmente à", "nouveau tarif"
- **Handler route** : nouveau bloc `if (action === "SET_PRICE")` dans owner-assistant
  ```typescript
  if (action === "SET_PRICE" && actionData.price) {
    const pd = actionData as { villa_id?: string; price_per_night?: number };
    if (!pd.villa_id || !ownerVillaIds.has(pd.villa_id)) {
      actionResult = { success: false, error: "Villa non autorisée" };
    } else if (typeof pd.price_per_night === "number" && pd.price_per_night > 0) {
      const { data: updated, error } = await admin
        .from("villas")
        .update({ price: pd.price_per_night, price_per_night: pd.price_per_night })
        .eq("id", pd.villa_id)
        .select("id, name, price_per_night")
        .single();
      actionResult = { success: !error, villa: updated, error: error?.message };
    }
  }
  ```
- **Vérification** : `ownerVillaIds.has(pd.villa_id)` avant toute écriture
- **UPDATE** : `villas SET price = <value>, price_per_night = <value>`
- **UI** : `CopilotActionCard` affiche "✅ Prix mis à jour" avec nom villa, ancien prix → nouveau prix

### B3. SHOW_BOOKING — Détail réservation 🆕

- **Détection agent** : phrases type "ma prochaine réservation", "qui arrive demain", "détail de la résa", "réservation en cours", "qui est chez moi en ce moment"
- **Handler route** : nouveau bloc `if (action === "SHOW_BOOKING")`
  ```typescript
  if (action === "SHOW_BOOKING") {
    const villaIdList = Array.from(ownerVillaIds);
    const today = new Date().toISOString().split("T")[0];
    // Couvre les check-ins futurs ET les séjours en cours
    const { data: nextBooking } = await admin
      .from("bookings")
      .select("id, guest_name, villa_id, start_date, end_date, status, total_price_cents")
      .in("villa_id", villaIdList)
      .or(`start_date.gte.${today},and(start_date.lte.${today},end_date.gte.${today})`)
      .order("start_date", { ascending: true })
      .limit(1)
      .maybeSingle();
    actionResult = { success: true, booking: nextBooking || null };
  }
  ```
- **Lecture seule** — aucune écriture
- **UI** : `CopilotActionCard` affiche la résa (nom voyageur, villa, dates, statut, montant) ou "Aucune réservation à venir"
- **Cas en cours** : si un séjour est en cours (`start_date <= today AND end_date >= today`), il est remonté même si le check-in est passé. Couvre "qui est chez moi en ce moment ?"
      .in("villa_id", villaIdList)
      .gte("start_date", new Date().toISOString().split("T")[0])
      .order("start_date", { ascending: true })
      .limit(1)
      .maybeSingle();
    actionResult = { success: true, booking: nextBooking || null };
  }
  ```
- **Aucune écriture** — lecture seule
- **UI** : `CopilotActionCard` affiche la résa (nom voyageur, villa, dates, statut, montant) ou "Aucune réservation à venir"

### Nouveau composant : `CopilotActionCard`

```tsx
// components/dashboard/CopilotActionCard.tsx
type ActionCardProps = {
  action: "BLOCK_DATE" | "SET_PRICE" | "SHOW_BOOKING";
  result: { success: boolean; [key: string]: unknown };
};
```

Affiche une carte compacte (icône + titre + détails) selon le type d'action :
- `BLOCK_DATE` : icône 📅 + "Dates bloquées" + villa + période
- `SET_PRICE` : icône 💰 + "Prix mis à jour" + villa + ancien → nouveau
- `SHOW_BOOKING` : icône 🏠 + "Prochaine réservation" + détails ou "Aucune"

Intégrée dans le flux des messages du chat (rendue comme un message assistant spécial).

### Séquence type

```
1. Utilisateur tape "Passe ma villa à 1800€/nuit"
2. Message utilisateur affiché dans le chat
3. Loading dots
4. Le message assistant apparaît avec le texte de reply
5. En dessous, la CopilotActionCard "✅ Prix mis à jour" avec le détail
```

## Fichiers touchés — récap

| Fichier | Action |
|---------|--------|
| `components/dashboard/DashboardCopilotChat.tsx` | Créer |
| `components/dashboard/CopilotActionCard.tsx` | Créer |
| `app/(proprio)/dashboard/layout.tsx` | Modifier (retirer Button+Panel) |
| `app/(proprio)/dashboard/page.tsx` | Modifier (split Server/Client + injecter chat) |
| `app/api/dashboard/owner-assistant/route.ts` | Modifier (+SET_PRICE +SHOW_BOOKING) |
| `components/dashboard/proprio/CopilotButton.tsx` | Supprimer |
| `components/dashboard/proprio/CopilotPanel.tsx` | Supprimer |

## Note — ProactiveNotification

Le composant `ProactiveNotification` (digest matinal chaleureux, spec `docs/specs/proactive-agent-b.md`, implémenté et déployé sur `main`) est déjà injecté en haut du dashboard, juste sous le titre. Il s'affiche UNIQUEMENT si une notification `owner_daily_digest` non lue existe. Il est complètement indépendant du copilot Diamant — les deux cohabitent dans le même flux :

```
<h1>Tableau de bord</h1>
<ProactiveNotification />    ← digest (si présent, puis disparaît après lecture)
<StripeConnectButton />
<KpiRow />
<DashboardCopilotChat />     ← chat permanent
...
```

Pas de conflit : le digest est une notification push (n8n cron → DB → carte), le copilot est un outil conversationnel pull (le proprio pose des questions).

## Règles dures
- Zéro redesign (or/navy/offwhite, radius anguleux, Instrument/Playfair/Sora)
- Toute action vérifie l'appartenance de la villa au proprio AVANT exécution
- L'agent suggère, la route valide et exécute — jamais l'inverse
- Pas de création de tâche (CREATE_TASK désactivé ou non proposé)
- Pas de `process.env`/`$env` dans les fichiers (règle apprise)
- `client.config.ts` source de vérité
- `tsc --noEmit` avant push
