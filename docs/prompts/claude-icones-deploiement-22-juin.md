# PROMPT CLAUDE — Déploiement Complet des Icônes PNG Kayvila

**Contexte** : Tu travailles sur le repo `/opt/data/repos/diamant-noir`. Le composant `<KayvilaPngIcon name="…" size={…} />` est déjà fonctionnel dans `components/icons/KayvilaPngIcon.tsx` avec **45 noms canoniques**. 18 fichiers ont déjà été branchés (RECAP_2026-06-22.md). Ce prompt couvre TOUT ce qui reste à faire pour que les icônes Kayvila soient visibles **partout** sur le site.

**Règle d'or** : Ne JAMAIS remplacer les icônes Lucide suivantes (elles restent en Lucide) : ChevronLeft/Right/Up/Down, X (fermeture), Menu, Search, Plus/Minus, Loader2, ArrowLeft/Right/Up/Down (navigation), Heart (wishlist interactif), Eye/EyeOff (toggle password), Copy, Share2, Save, Trash2, Edit3, Filter, ArrowUpDown, SlidersHorizontal, Maximize2, Check (inline status).

**Import standard à utiliser partout** :
```tsx
import { KayvilaPngIcon } from "@/components/icons/KayvilaPngIcon";
```

---

## ÉTAPE 1 — Nettoyage des 9 fichiers orphelins

Supprime ces fichiers dans `public/brand/icons-png/` (fautes de frappe/doublons) :

```bash
rm public/brand/icons-png/checkcircle.png
rm public/brand/icons-png/clock24.png
rm public/brand/icons-png/messages.png
rm public/brand/icons-png/shieldcheck.png
rm public/brand/icons-png/pillierfinance.png
rm public/brand/icons-png/pilliermarket.png
rm public/brand/icons-png/pilliermenage.png
rm public/brand/icons-png/pillieroperation.png
rm public/brand/icons-png/pilliervoyageurs.png
```

---

## ÉTAPE 2 — Remonter TOUTES les tailles < 20px à 20-24px minimum

Parcourt chaque fichier listé ci-dessous et change UNIQUEMENT la valeur `size={N}` pour les `KayvilaPngIcon` qui sont < 20px. Laisse tout le reste du code intact.

### 2.1 — `app/espace-client/favoris/page.tsx`
- **Ligne ~105** : `size={16}` → `size={20}`

### 2.2 — `app/espace-client/conciergerie/page.tsx`
- **Ligne ~93** : `size={18}` → `size={20}`

### 2.3 — `app/espace-client/reservations/[id]/page.tsx`
- **Ligne ~226** : `size={18}` → `size={20}`
- **Ligne ~253** : `size={18}` → `size={20}`

### 2.4 — `app/espace-client/page.tsx`
- **Ligne ~353** : `size={18}` → `size={20}`

### 2.5 — `components/espace-client/CheckinGuide.tsx`
- **Ligne ~44** : `size={18}` → `size={20}`
- **Ligne ~82** : `size={18}` → `size={20}`
- **Ligne ~95** : `size={16}` → `size={20}`

### 2.6 — `components/booking/VillaSelectionCard.tsx`
- **Ligne ~91** : `size={18}` → `size={20}`
- **Ligne ~119** : `size={18}` → `size={20}`
- **Ligne ~137** : `size={18}` → `size={20}`

### 2.7 — `components/dashboard/assistant-views/PlanningView.tsx`
- **Ligne ~55** : `size={14}` → `size={20}`
- **Ligne ~79** : `size={18}` → `size={20}`

### 2.8 — `components/dashboard/assistant-views/BookingsView.tsx`
- **Ligne ~50** : `size={18}` → `size={20}`
- **Ligne ~60** : `size={14}` → `size={20}`

### 2.9 — `components/dashboard/assistant-views/FinancesView.tsx`
- **Ligne ~44** : `size={18}` → `size={20}`
- **Ligne ~66** : `size={16}` → `size={20}` (×2 occurrences : `trending-up` et `trend-down`)
- **Ligne ~93** : `size={18}` → `size={20}`

### 2.10 — `components/dashboard/assistant-views/VillasView.tsx`
- **Ligne ~63** : `size={18}` → `size={20}`
- **Ligne ~67** : `size={18}` → `size={20}`

**Vérification** : Après ces changements, `npx tsc --noEmit` ne doit produire AUCUNE nouvelle erreur.

---

## ÉTAPE 3 — Ajouter des icônes Kayvila sur les pages qui n'en ont pas

### 3.1 — Page Login : ajouter une icône de marque

**Fichier** : `app/login/page.tsx`

Ajoute l'import KayvilaPngIcon (vers ligne 17, après les imports lucide-react) :
```tsx
import { KayvilaPngIcon } from "@/components/icons/KayvilaPngIcon";
```

Remplace la ligne ~570 (le `<p>` "Kayvila" nu) :
```tsx
// AVANT :
<p className="text-[8px] font-bold uppercase tracking-[0.38em] text-navy">Kayvila</p>

// APRÈS :
<div className="flex items-center gap-2">
  <KayvilaPngIcon name="villa" size={24} alt="" className="opacity-80" />
  <p className="text-[8px] font-bold uppercase tracking-[0.38em] text-navy">Kayvila</p>
</div>
```

### 3.2 — Page Success : remplacer TOUTES les icônes Lucide « contenu » par des PNG

**Fichier** : `app/success/page.tsx`

**Étape 3.2a** — Remplacer l'import Lucide (lignes 8-20) :
```tsx
// AVANT :
import {
  Check,
  Calendar,
  MapPin,
  ArrowRight,
  Mail,
  Lock,
  ExternalLink,
  PartyPopper,
  CreditCard,
  ShieldCheck,
  LogIn,
} from "lucide-react";

// APRÈS :
import { Check, ArrowRight } from "lucide-react";
import { KayvilaPngIcon } from "@/components/icons/KayvilaPngIcon";
```

> Note : `ArrowRight` et `Check` restent en Lucide (UI navigation / inline status).

**Étape 3.2b** — Remplacer les icônes dans le JSX :

| Ligne approx. | Avant (Lucide) | Après (KayvilaPngIcon) |
|---|---|---|
| ~205 | `<PartyPopper className="h-9 w-9 text-emerald-500" strokeWidth={1.5} />` | `<KayvilaPngIcon name="sparkle" size={36} alt="" className="text-emerald-500" />` |
| ~224 | `<MapPin size={20} />` | `<KayvilaPngIcon name="location" size={20} alt="" />` |
| ~244 | `<Calendar size={18} />` | `<KayvilaPngIcon name="calendar" size={20} alt="" />` |
| ~263 | `<CreditCard size={18} />` | `<KayvilaPngIcon name="credit-card" size={20} alt="" />` |
| ~284 | `<Lock size={20} />` | `<KayvilaPngIcon name="lock" size={20} alt="" />` |
| ~294 | `<Mail size={16} className="shrink-0 text-navy/30" />` | `<KayvilaPngIcon name="mail" size={16} alt="" className="shrink-0 text-navy/30" />` |
| ~326 | `<LogIn size={16} />` | `<KayvilaPngIcon name="login" size={16} alt="" />` |
| ~353 | `<ExternalLink size={16} />` | `<KayvilaPngIcon name="arrow-right" size={16} alt="" />` |
| ~365 | `<Mail size={18} />` | `<KayvilaPngIcon name="mail" size={20} alt="" />` |
| ~374 | `<ShieldCheck size={18} />` | `<KayvilaPngIcon name="shield-check" size={20} alt="" />` |
| ~383 | `<Calendar size={18} />` | `<KayvilaPngIcon name="calendar" size={20} alt="" />` |

### 3.3 — VillaListingCard : Users → PNG

**Fichier** : `components/villas/VillaListingCard.tsx`

**Étape 3.3a** — Modifier l'import (ligne 7) :
```tsx
// AVANT :
import { Users, Maximize2 } from "lucide-react";

// APRÈS :
import { Maximize2 } from "lucide-react";
import { KayvilaPngIcon } from "@/components/icons/KayvilaPngIcon";
```

**Étape 3.3b** — Remplacer ligne ~87 :
```tsx
// AVANT :
<Users className="size-3.5" />

// APRÈS :
<KayvilaPngIcon name="users" size={20} alt="" />
```

### 3.4 — DashboardSidebar : ajouter une icône Kayvila dans le header

**Fichier** : `components/dashboard/shared/DashboardSidebar.tsx`

**Étape 3.4a** — Ajouter l'import (après la ligne 12, parmi les imports) :
```tsx
import { KayvilaPngIcon } from "@/components/icons/KayvilaPngIcon";
```

**Étape 3.4b** — Remplacer les lignes 62-71 (le `<Link>` du header sidebar) :
```tsx
// AVANT :
<Link
  href={homeHref}
  className="flex shrink-0 items-center gap-2 border-b border-white/10 px-6 py-6"
  onClick={onClose}
>
  <span className="font-display-dashboard text-xl font-semibold tracking-wide text-gold">
    Kayvila
  </span>
  <span className="rounded-md bg-gold/20 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-gold">
    {roleLabel}
  </span>
</Link>

// APRÈS :
<Link
  href={homeHref}
  className="flex shrink-0 items-center gap-2 border-b border-white/10 px-6 py-6"
  onClick={onClose}
>
  <KayvilaPngIcon name="villa" size={28} alt="" invert className="shrink-0" />
  <span className="font-display-dashboard text-xl font-semibold tracking-wide text-gold">
    Kayvila
  </span>
  <span className="rounded-md bg-gold/20 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-gold">
    {roleLabel}
  </span>
</Link>
```

> Note : `invert` est nécessaire car la sidebar a un fond navy foncé.

---

## ÉTAPE 4 — Remplacer les icônes Lucide « contenu » restantes par du PNG

### 4.1 — VillaHostCard : ShieldCheck + Mail → PNG

**Fichier** : `components/villas/VillaHostCard.tsx`

**Étape 4.1a** — Remplacer l'import (ligne 1) :
```tsx
// AVANT :
import { ShieldCheck, Mail } from "lucide-react";

// APRÈS :
import { KayvilaPngIcon } from "@/components/icons/KayvilaPngIcon";
```

**Étape 4.1b** — Remplacer ligne ~57 (ShieldCheck dans le badge « Hôte vérifié ») :
```tsx
// AVANT :
<ShieldCheck size={11} className="text-gold" />

// APRÈS :
<KayvilaPngIcon name="shield-check" size={20} alt="" className="text-gold" />
```

> ⚠️ Le badge conteneur utilise `text-[10px]` et `px-3 py-0.5`, vérifie visuellement que l'icône 20px ne casse pas le layout. Si nécessaire, ajuste le padding du badge à `px-3 py-1`.

**Étape 4.1c** — Remplacer ligne ~68 (Mail dans le bouton « Contacter l'hôte ») :
```tsx
// AVANT :
<Mail size={12} />

// APRÈS :
<KayvilaPngIcon name="mail" size={20} alt="" />
```

### 4.2 — BookingCard : Calendar + MapPin → PNG

**Fichier** : `components/espace-client/BookingCard.tsx`

**Étape 4.2a** — Remplacer l'import (ligne 4) :
```tsx
// AVANT :
import { Calendar, MapPin, ArrowRight } from "lucide-react";

// APRÈS :
import { ArrowRight } from "lucide-react";
import { KayvilaPngIcon } from "@/components/icons/KayvilaPngIcon";
```

**Étape 4.2b** — Remplacer ligne ~77 (MapPin dans la localisation) :
```tsx
// AVANT :
<MapPin size={10} strokeWidth={1.25} aria-hidden />

// APRÈS :
<KayvilaPngIcon name="location" size={20} alt="" aria-hidden />
```

**Étape 4.2c** — Remplacer ligne ~84 (Calendar dans les dates) :
```tsx
// AVANT :
<Calendar size={13} strokeWidth={1.25} className="shrink-0 text-gold" aria-hidden />

// APRÈS :
<KayvilaPngIcon name="calendar" size={20} alt="" className="shrink-0 text-gold" aria-hidden />
```

### 4.3 — WelcomeBook : Wifi, LogOut, Star, Phone → PNG

**Fichier** : `components/espace-client/WelcomeBook.tsx`

**Étape 4.3a** — Remplacer l'import (ligne 3) :
```tsx
// AVANT :
import { Wifi, LogOut, Star, Phone } from "lucide-react";

// APRÈS :
import { KayvilaPngIcon } from "@/components/icons/KayvilaPngIcon";
```

**Étape 4.3b** — Remplacer les icônes dans le JSX :

| Ligne approx. | Avant (Lucide) | Après (KayvilaPngIcon) |
|---|---|---|
| ~47 | `<Wifi size={16} className="shrink-0 text-gold" />` | `<KayvilaPngIcon name="wifi" size={20} alt="" className="shrink-0 text-gold" />` |
| ~74 | `<LogOut size={16} className="shrink-0 text-gold" />` | `<KayvilaPngIcon name="logout" size={20} alt="" className="shrink-0 text-gold" />` |
| ~87 | `<Star size={16} className="shrink-0 text-gold" />` | `<KayvilaPngIcon name="star" size={20} alt="" className="shrink-0 text-gold" />` |
| ~100 | `<Phone size={16} className="shrink-0 text-gold" />` | `<KayvilaPngIcon name="phone" size={20} alt="" className="shrink-0 text-gold" />` |

### 4.4 — UpcomingStayHero : BookOpen → PNG (bonus, évalué comme faisable)

**Fichier** : `components/espace-client/UpcomingStayHero.tsx`

**Étape 4.4a** — Remplacer l'import (ligne 4) :
```tsx
// AVANT :
import { ArrowRight, BookOpen } from "lucide-react";

// APRÈS :
import { ArrowRight } from "lucide-react";
import { KayvilaPngIcon } from "@/components/icons/KayvilaPngIcon";
```

**Étape 4.4b** — Chercher `<BookOpen` dans le fichier et remplacer par :
```tsx
<KayvilaPngIcon name="book" size={20} alt="" />
```

### 4.5 — TenantQuickLinks : Wifi, FileDown → PNG (bonus)

**Fichier** : `components/espace-client/TenantQuickLinks.tsx`

**Étape 4.5a** — Remplacer l'import (ligne 4) :
```tsx
// AVANT :
import { CheckSquare, Wifi, FileDown, ArrowRight } from "lucide-react";

// APRÈS :
import { ArrowRight } from "lucide-react";
import { KayvilaPngIcon } from "@/components/icons/KayvilaPngIcon";
```

**Étape 4.5b** — Remplacer les icônes :
- `<Wifi size={...} />` → `<KayvilaPngIcon name="wifi" size={20} alt="" />`
- `<FileDown size={...} />` → `<KayvilaPngIcon name="download" size={20} alt="" />`

> `CheckSquare` et `ArrowRight` restent en Lucide (UI / status).

---

## ÉTAPE 5 — Vérification finale

Après avoir exécuté toutes les étapes ci-dessus, lance ces commandes dans l'ordre :

```bash
cd /opt/data/repos/diamant-noir

# 1. Vérifie qu'il ne reste aucun import problématique
grep -r "from \"lucide-react\"" --include="*.tsx" --include="*.ts" components/villas/VillaHostCard.tsx components/villas/VillaListingCard.tsx components/espace-client/BookingCard.tsx components/espace-client/WelcomeBook.tsx app/success/page.tsx

# 2. Type-check
npx tsc --noEmit

# 3. Build check
npm run build 2>&1 | tail -20
```

**Critère de succès** : 0 erreur TypeScript, build vert.

---

## 📋 Récapitulatif des fichiers modifiés par étape

| Étape | Fichier | Nature |
|---|---|---|
| 1 | `public/brand/icons-png/*.png` | Suppression 9 orphelins |
| 2 | 10 fichiers modifiés | Taille 14-18 → 20px |
| 3.1 | `app/login/page.tsx` | Ajout icône branding |
| 3.2 | `app/success/page.tsx` | 11 Lucide → PNG |
| 3.3 | `components/villas/VillaListingCard.tsx` | Users → PNG |
| 3.4 | `components/dashboard/shared/DashboardSidebar.tsx` | Ajout icône header |
| 4.1 | `components/villas/VillaHostCard.tsx` | 2 Lucide → PNG |
| 4.2 | `components/espace-client/BookingCard.tsx` | 2 Lucide → PNG |
| 4.3 | `components/espace-client/WelcomeBook.tsx` | 4 Lucide → PNG |
| 4.4 | `components/espace-client/UpcomingStayHero.tsx` | BookOpen → PNG |
| 4.5 | `components/espace-client/TenantQuickLinks.tsx` | 2 Lucide → PNG |

**Total** : ~20 fichiers touchés, ~9 suppressions, ~40 modifications de lignes.

---

## ⚠️ Points d'attention

1. **Ne touche PAS** aux icônes de formulaire dans `app/login/page.tsx` (User, Mail, Lock dans les champs de saisie) — elles restent en Lucide car ce sont des affordances UI.
2. **Ne touche PAS** à `Maximize2` dans `VillaListingCard.tsx` — c'est une icône de mesure/surface sans équivalent PNG.
3. **Ne touche PAS** à `CheckSquare` dans `TenantQuickLinks.tsx` — icône de statut checklist.
4. **Invert sur fond sombre** : dans `DashboardSidebar.tsx`, utilise `invert` car le fond est navy.
5. **Les classes CSS existantes** (comme `className="text-gold"`, `className="shrink-0"`) doivent être conservées sur les `<KayvilaPngIcon>`.
6. Si une icône PNG n'existe pas dans le pack des 45 noms canoniques, laisse le Lucide en place et note-le.
