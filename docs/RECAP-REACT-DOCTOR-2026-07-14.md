# Recap — React Doctor sur Kayvila (Diamant Noir)

**Date** : 2026-07-14
**Outil** : React Doctor v0.7.7
**Score initial** : 30/100 — 622 issues (56 security errors, 31 security warnings)

---

## Installation

React Doctor installé sur le projet avec :
- Script `npm run doctor`
- GitHub Actions (`.github/workflows/react-doctor.yml`)
- Pre-commit hook
- Skill agent pour Cursor / Claude Code

---

## Corrections appliquées

### 1. Sécurité — GET handler CSRF (1 fichier)

**`app/api/booking-session/route.ts`** : le endpoint `GET` effectuait une mutation en base (sync Stripe → booking) via `syncBookingFromStripeSession()`. Un GET avec side effect est vulnérable au CSRF puisqu'un `<img>` ou `<script>` tiers peut le déclencher. Changé en `POST`.

*Les 2 autres GET handlers (`send-checkin-reminders`, `send-review-requests`) sont protégés par `verifyApiKey()` — pas de vulnérabilité réelle.*

### 2. Bugs — Effects sans cleanup (3 fichiers)

| Fichier | Problème | Correction |
|---------|----------|------------|
| `components/BookingBottomSheet.tsx` | `setTimeout` non cleanup + event listener `keydown` qui leak au unmount | Timer ID capturé + `clearTimeout` ; listener enregistré unconditionnellement |
| `components/dashboard/NotificationBell.tsx` | `setTimeout` dans Realtime INSERT handler jamais cleanup | Timer IDs collectés dans un array + `clearTimeout` dans le cleanup |

### 3. Bugs — Boutons sans type explicite (35 fichiers, ~71 boutons)

Tous les `<button>` sans `type` ajoutés avec `type="button"`. Cela empêche les soumissions accidentelles de formulaire (le défaut HTML est `type="submit"`).

- Composant base `components/ui/button.tsx` : `type="button"` par défaut
- ~70 boutons bruts dans `app/` et `components/` corrigés

### 4. Bugs — Hydration mismatch dates (20 fichiers, 27 occurrences)

Les appels `toLocaleDateString()`, `toLocaleString()`, `toLocaleTimeString()` en SSR causent des mismatch d'hydration car le serveur (UTC) et le navigateur (fuseau local) n'ont pas le même fuseau horaire.

- **Cas données statiques** (dates venant des props) : `suppressHydrationWarning` ajouté
- **Cas `new Date()` courant** : `useEffect` + state avec rendu conditionnel (`DashboardHeader.tsx`, `AutosaveIndicator.tsx`)

---

## Problèmes volontairement non traités

| Issue | Raison |
|---|---|
| **39 RLS policies permissives** | Beaucoup dans des fichiers `.worktrees/` legacy. Les migrations réelles sont dans `supabase/migrations/` et méritent une revue manuelle avec la base de prod |
| **3 tables sans RLS** | Idem — à auditer avec la base Supabase |
| **Missing effect dependencies** | Warnings ESLint pré-existants, sans impact fonctionnel |
| **Array index keys (×43)** | Faux positifs sur listes statiques ou composants contrôlés |
| **Unversioned localStorage keys** | À traiter si on change le format des données stockées |
| **Intl formatter (×8)** | Perf négligeable |

---

## Commandes utiles

```bash
# Relancer un scan complet
npm run doctor

# Scan des fichiers modifiés seulement
npx react-doctor --scope changed

# Voir le rapport détaillé
npx react-doctor --verbose
```
