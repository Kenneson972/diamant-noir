# Critique P2 Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Corriger les incohérences P2 relevées par la critique impeccable du 2026-07-04 : dates de séjour décalées d'un jour (bug de fuseau horaire), libellé de frais divergent selon l'écran, heure de check-in contradictoire, pourcentage de frais manipulable côté client, et lien de carte villa inaccessible.

**Architecture:** Correctifs ciblés, aucun changement de schéma DB. Un helper de parsing de date timezone-safe centralisé dans `lib/utils.ts`, une constante de frais partagée dans `lib/price-engine.ts`, unification sur une clé i18n déjà existante, et un `aria-label` sur un lien existant.

**Tech Stack:** Next.js 15 App Router, TypeScript, Zod, Vitest, i18n maison (`lib/i18n.ts` / `contexts/LocaleContext.tsx`).

## Global Constraints

- Ne toucher à aucun schéma de base de données (aucune migration Supabase dans ce plan).
- Ne pas modifier `components/legal/CgvContent.tsx` ni le tunnel de checkout voyageur pour d'autres raisons que celles listées ici.
- Ne pas modifier les 7 chips de filtre restants sur `/villas` (décision actée : hors scope).
- Ne pas toucher `components/booking/PriceCalculator.tsx` (composant mort, hors scope).
- Chaque tâche se termine par : tests verts + `npm run build` sans erreur nouvelle.
- Commits fréquents, un par tâche minimum.

---

### Task 1: Helper de parsing de date timezone-safe (`lib/utils.ts`)

**Files:**
- Modify: `lib/utils.ts`
- Test: `lib/utils.test.ts` (nouveau fichier)

**Interfaces:**
- Produces: `export function parseDateOnly(value: string): Date` — si `value` matche `/^\d{4}-\d{2}-\d{2}$/`, retourne une `Date` ancrée à minuit **local** ; sinon retourne `new Date(value)` inchangé. `export function formatDate(dateStr: string, opts?: Intl.DateTimeFormatOptions): string` (signature externe inchangée, utilise `parseDateOnly` en interne).

- [ ] **Step 1: Write the failing tests**

Créer `lib/utils.test.ts` :

```ts
import { describe, it, expect } from "vitest";
import { parseDateOnly, formatDate } from "./utils";

describe("parseDateOnly", () => {
  it("ancre une date-only (YYYY-MM-DD) à minuit local, pas UTC", () => {
    const d = parseDateOnly("2026-08-15");
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(7); // août = index 7
    expect(d.getDate()).toBe(15);
    expect(d.getHours()).toBe(0);
    expect(d.getMinutes()).toBe(0);
  });

  it("laisse un timestamp complet (avec heure/zone) inchangé", () => {
    const iso = "2026-08-15T23:30:00.000Z";
    expect(parseDateOnly(iso).toISOString()).toBe(iso);
  });

  it("gère les dates de fin/début de mois sans décalage", () => {
    expect(parseDateOnly("2026-01-01").getDate()).toBe(1);
    expect(parseDateOnly("2026-01-01").getMonth()).toBe(0);
    expect(parseDateOnly("2026-12-31").getDate()).toBe(31);
    expect(parseDateOnly("2026-12-31").getMonth()).toBe(11);
  });
});

describe("formatDate", () => {
  it("formate une date-only avec le jour exact, quel que soit le fuseau d'exécution", () => {
    expect(
      formatDate("2026-08-15", { day: "2-digit", month: "2-digit", year: "numeric" })
    ).toBe("15/08/2026");
  });

  it("accepte toujours un timestamp complet (comportement historique préservé)", () => {
    const label = formatDate("2026-01-15T10:00:00.000Z", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    expect(label).toMatch(/^\d{2}\/\d{2}\/2026$/);
  });

  it("fonctionne sans options (comportement par défaut)", () => {
    expect(formatDate("2026-03-05")).toBe(new Date(2026, 2, 5).toLocaleDateString("fr-FR"));
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run lib/utils.test.ts`
Expected: FAIL — `parseDateOnly` n'existe pas encore (`SyntaxError` ou `TypeError: parseDateOnly is not a function`).

- [ ] **Step 3: Implement `parseDateOnly` and fix `formatDate`**

Remplacer dans `lib/utils.ts` la fonction `formatDate` existante (lignes 36-39) par :

```ts
const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Parse une chaîne de date. Si c'est une date "pure" (YYYY-MM-DD, sans heure),
 * l'ancre à minuit LOCAL plutôt que de laisser JS l'interpréter en UTC minuit
 * (ce qui décale l'affichage d'un jour pour les fuseaux négatifs par rapport à UTC).
 * Un timestamp complet (avec heure/zone) est laissé inchangé.
 */
export function parseDateOnly(value: string): Date {
  return DATE_ONLY_RE.test(value) ? new Date(`${value}T00:00:00`) : new Date(value);
}

/** Formate une date en français avec options. */
export function formatDate(dateStr: string, opts?: Intl.DateTimeFormatOptions): string {
  return parseDateOnly(dateStr).toLocaleDateString("fr-FR", opts);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run lib/utils.test.ts`
Expected: PASS (toutes les tests verts)

- [ ] **Step 5: Commit**

```bash
git add lib/utils.ts lib/utils.test.ts
git commit -m "fix(utils): formatDate/parseDateOnly timezone-safe pour les dates sans heure"
```

---

### Task 2: Corriger `BookingForm.tsx` (widget fiche villa)

**Files:**
- Modify: `components/BookingForm.tsx:107-111`

**Interfaces:**
- Consumes: `parseDateOnly(value: string): Date` de Task 1 (`@/lib/utils`).

- [ ] **Step 1: Remplacer `dateLabel` par le helper sécurisé**

Dans `components/BookingForm.tsx`, ajouter l'import (après la ligne 4) :

```ts
import { parseDateOnly } from "@/lib/utils";
```

Remplacer (lignes 107-111) :

```ts
  const dateLabel = (value: string) =>
    new Date(value).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
    });
```

par :

```ts
  const dateLabel = (value: string) =>
    parseDateOnly(value).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
    });
```

- [ ] **Step 2: Vérifier qu'il n'y a pas d'autre `new Date(` non sécurisé dans ce fichier**

Run: `grep -n "new Date(" components/BookingForm.tsx`
Expected: seules les occurrences `new Date(start)` / `new Date(end)` passées à `calculatePrice` (lignes 86-87) et `new Date()` (aujourd'hui, ligne 98) doivent rester — elles ne servent qu'au calcul de nuits ou à la date du jour, non affectées par le bug d'affichage (voir spec, note non-régression).

- [ ] **Step 3: Build check**

Run: `npm run build 2>&1 | tail -20`
Expected: `✓ Compiled successfully`, aucune nouvelle erreur TypeScript.

- [ ] **Step 4: Commit**

```bash
git add components/BookingForm.tsx
git commit -m "fix(booking-form): dateLabel utilise parseDateOnly (corrige le décalage d'un jour)"
```

---

### Task 3: Corriger les copies locales du bug (dashboard proprio)

**Files:**
- Modify: `components/dashboard/proprio/QuickReservationsList.tsx`
- Modify: `components/dashboard/proprio/UpcomingBookings.tsx`

**Interfaces:**
- Consumes: `formatDate(dateStr: string, opts?: Intl.DateTimeFormatOptions): string` de Task 1 (`@/lib/utils`).

- [ ] **Step 1: `QuickReservationsList.tsx` — utiliser le formatDate partagé**

Modifier l'import existant (ligne 5) :

```ts
import { cn } from "@/lib/utils";
```

en :

```ts
import { cn, formatDate } from "@/lib/utils";
```

Supprimer la fonction locale (lignes 12-14) :

```ts
function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("fr-FR");
}
```

(les deux appels `formatDate(booking.start_date)` / `formatDate(booking.end_date)` restent inchangés — signature compatible).

- [ ] **Step 2: `UpcomingBookings.tsx` — utiliser le formatDate partagé**

Ajouter l'import (après la ligne 3) :

```ts
import { formatDate } from "@/lib/utils";
```

Supprimer la fonction locale (lignes 12-17) :

```ts
function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
  });
}
```

Les appels existants `formatDate(booking.start_date)` restent tels quels mais ne passent plus les options `{day: "numeric", month: "long"}` — il faut les ajouter explicitement pour préserver le format d'affichage. Remplacer (lignes 57-59) :

```tsx
                <p className="text-xs text-muted">
                  {formatDate(booking.start_date)} —{" "}
                  {formatDate(booking.end_date)}
                </p>
```

par :

```tsx
                <p className="text-xs text-muted">
                  {formatDate(booking.start_date, { day: "numeric", month: "long" })} —{" "}
                  {formatDate(booking.end_date, { day: "numeric", month: "long" })}
                </p>
```

- [ ] **Step 3: Build check**

Run: `npm run build 2>&1 | tail -20`
Expected: `✓ Compiled successfully`

- [ ] **Step 4: Commit**

```bash
git add components/dashboard/proprio/QuickReservationsList.tsx components/dashboard/proprio/UpcomingBookings.tsx
git commit -m "fix(dashboard-proprio): supprime les copies locales du bug de date, réutilise lib/utils formatDate"
```

---

### Task 4: Constante `SERVICE_FEE_PERCENT` partagée

**Files:**
- Modify: `lib/price-engine.ts`
- Modify: `components/BookingForm.tsx`
- Modify: `components/booking/CheckoutView.tsx`

**Interfaces:**
- Produces: `export const SERVICE_FEE_PERCENT = 5;` depuis `@/lib/price-engine`.
- Consumes (Task 6 en dépendra aussi) : cette même constante.

- [ ] **Step 1: Ajouter la constante dans `lib/price-engine.ts`**

Ajouter en haut du fichier, après l'import (ligne 1) :

```ts
import type { BookingPriceInput, BookingPriceResult } from "@/types";

/** Pourcentage des frais de service Kayvila appliqué sur le montant des nuitées (hors ménage). */
export const SERVICE_FEE_PERCENT = 5;

const DAY_MS = 24 * 60 * 60 * 1000;
```

- [ ] **Step 2: Utiliser la constante dans `BookingForm.tsx`**

Modifier l'import (ligne 4) :

```ts
import { calculatePrice } from "@/lib/price-engine";
```

en :

```ts
import { calculatePrice, SERVICE_FEE_PERCENT } from "@/lib/price-engine";
```

Remplacer les deux occurrences de `0.05` (lignes 207 et 211) :

```tsx
            <span>{formatPrice(Math.round(price.total * 0.05))}</span>
          </div>
          <div className="flex justify-between font-bold text-navy pt-4 border-t border-navy/10 text-lg">
            <span>Total</span>
            <span>{formatPrice(Math.round(price.total + cleaningFee + price.total * 0.05))}</span>
```

par :

```tsx
            <span>{formatPrice(Math.round(price.total * (SERVICE_FEE_PERCENT / 100)))}</span>
          </div>
          <div className="flex justify-between font-bold text-navy pt-4 border-t border-navy/10 text-lg">
            <span>Total</span>
            <span>{formatPrice(Math.round(price.total + cleaningFee + price.total * (SERVICE_FEE_PERCENT / 100)))}</span>
```

- [ ] **Step 3: Utiliser la constante dans `CheckoutView.tsx`**

Modifier l'import (ligne 9) :

```ts
import { calculatePrice } from "@/lib/price-engine";
```

en :

```ts
import { calculatePrice, SERVICE_FEE_PERCENT } from "@/lib/price-engine";
```

Remplacer (ligne 75) :

```ts
  const serviceFee = Math.round(priceResult.total * 0.05);
```

par :

```ts
  const serviceFee = Math.round(priceResult.total * (SERVICE_FEE_PERCENT / 100));
```

- [ ] **Step 4: Build check**

Run: `npm run build 2>&1 | tail -20`
Expected: `✓ Compiled successfully`

- [ ] **Step 5: Commit**

```bash
git add lib/price-engine.ts components/BookingForm.tsx components/booking/CheckoutView.tsx
git commit -m "refactor(booking): extrait SERVICE_FEE_PERCENT en constante partagée (était dupliqué en dur)"
```

---

### Task 5: Unifier le libellé des frais de service

**Files:**
- Modify: `components/BookingForm.tsx`
- Modify: `components/booking/CheckoutPriceSummary.tsx`

**Interfaces:**
- Consumes: clé i18n existante `booking.service_fee` (`lib/i18n.ts`, déjà = "Frais de service Kayvila" en fr, présente aussi en/es) ; `SERVICE_FEE_PERCENT` de Task 4.

- [ ] **Step 1: `BookingForm.tsx` — utiliser `t()` au lieu du texte en dur**

Modifier (ligne 44) :

```ts
  const { formatPrice } = useLocale();
```

en :

```ts
  const { formatPrice, t } = useLocale();
```

Remplacer (ligne 206) :

```tsx
            <span className="underline decoration-navy/20 underline-offset-4">Frais de service Kayvila</span>
```

par :

```tsx
            <span className="underline decoration-navy/20 underline-offset-4">{t("booking.service_fee")}</span>
```

- [ ] **Step 2: `CheckoutPriceSummary.tsx` — importer `useLocale` et unifier le libellé**

Ajouter l'import (après la ligne 4) :

```ts
import { useLocale } from "@/contexts/LocaleContext";
import { SERVICE_FEE_PERCENT } from "@/lib/price-engine";
```

Ajouter au début du corps de la fonction (après la ligne 28, avant `const imageSrc = ...`) :

```ts
  const { t } = useLocale();
```

Remplacer (ligne 71) :

```tsx
            <dt>Frais de conciergerie Kayvila (5 %)</dt>
```

par :

```tsx
            <dt>{t("booking.service_fee")} ({SERVICE_FEE_PERCENT} %)</dt>
```

- [ ] **Step 3: Vérifier que `CheckoutPriceSummary` est toujours rendu sous `LocaleProvider`**

Run: `grep -rln "CheckoutPriceSummary" components app | grep -v ".next"`
Expected: seul `components/booking/CheckoutView.tsx` l'utilise (déjà rendu dans `/book`, qui est sous `LocaleProvider` global via `app/layout.tsx`) — pas de risque de contexte manquant.

- [ ] **Step 4: Build check**

Run: `npm run build 2>&1 | tail -20`
Expected: `✓ Compiled successfully`

- [ ] **Step 5: Commit**

```bash
git add components/BookingForm.tsx components/booking/CheckoutPriceSummary.tsx
git commit -m "fix(booking): unifie le libellé des frais de service sur la clé i18n booking.service_fee"
```

---

### Task 6: Durcir le calcul serveur du pourcentage de frais

**Files:**
- Modify: `types/stripe.ts`
- Modify: `app/api/booking/route.ts`
- Test: `types/stripe.test.ts` (nouveau fichier)

**Interfaces:**
- Consumes: `SERVICE_FEE_PERCENT` de Task 4 (`@/lib/price-engine`).
- Produces: `BookingRequestSchema` (Zod) n'accepte/ne lit plus `serviceFeePercent`.

- [ ] **Step 1: Write the failing test**

Créer `types/stripe.test.ts` :

```ts
import { describe, it, expect } from "vitest";
import { BookingRequestSchema } from "./stripe";

describe("BookingRequestSchema", () => {
  const validPayload = {
    startDate: "2026-08-15",
    endDate: "2026-08-20",
    villaId: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    cgvAccepted: true as const,
  };

  it("accepte un payload valide sans serviceFeePercent", () => {
    const result = BookingRequestSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it("ignore un serviceFeePercent envoyé par le client (n'est plus dans le schéma)", () => {
    const result = BookingRequestSchema.safeParse({
      ...validPayload,
      serviceFeePercent: 0,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).serviceFeePercent).toBeUndefined();
    }
  });
});
```

- [ ] **Step 2: Run test to verify current behavior**

Run: `npx vitest run types/stripe.test.ts`
Expected: le premier test passe déjà ; le second peut aussi passer si Zod strip les clés inconnues par défaut — mais `serviceFeePercent` est ENCORE dans le schéma actuel avec un défaut à 5, donc `result.data.serviceFeePercent` vaudrait `0` (pas `undefined`) tant que le Step 3 n'est pas fait. Vérifier que le test échoue bien sur cette assertion avant de continuer.

- [ ] **Step 3: Retirer `serviceFeePercent` du schéma**

Dans `types/stripe.ts`, remplacer :

```ts
export const BookingRequestSchema = z.object({
  startDate: z.string().min(1, "Date de début requise"),
  endDate: z.string().min(1, "Date de fin requise"),
  villaId: z.string().uuid("ID de villa invalide"),
  guests: z.number().int().positive("Nombre de voyageurs invalide").optional(),
  guestName: z.string().optional(),
  guestEmail: z.string().email("Email invalide").optional().nullable(),
  serviceFeePercent: z.number().min(0).max(100).optional().default(5),
  cgvAccepted: z.literal(true, { message: "Acceptation des CGV requise" }),
});
```

par :

```ts
export const BookingRequestSchema = z.object({
  startDate: z.string().min(1, "Date de début requise"),
  endDate: z.string().min(1, "Date de fin requise"),
  villaId: z.string().uuid("ID de villa invalide"),
  guests: z.number().int().positive("Nombre de voyageurs invalide").optional(),
  guestName: z.string().optional(),
  guestEmail: z.string().email("Email invalide").optional().nullable(),
  cgvAccepted: z.literal(true, { message: "Acceptation des CGV requise" }),
});
```

- [ ] **Step 4: Mettre à jour `app/api/booking/route.ts` pour utiliser la constante serveur**

Modifier l'import (ligne 3) :

```ts
import { calculatePrice } from "@/lib/price-engine";
```

en :

```ts
import { calculatePrice, SERVICE_FEE_PERCENT } from "@/lib/price-engine";
```

Remplacer (ligne 82) :

```ts
    const { startDate, endDate, villaId, guests, guestName, guestEmail, serviceFeePercent } = parsed.data;
```

par :

```ts
    const { startDate, endDate, villaId, guests, guestName, guestEmail } = parsed.data;
```

Remplacer (ligne 214) :

```ts
    const serviceFeeCents = Math.round(price.total * serviceFeePercent / 100 * 100);
```

par :

```ts
    const serviceFeeCents = Math.round(price.total * SERVICE_FEE_PERCENT / 100 * 100);
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run types/stripe.test.ts`
Expected: PASS (les deux tests verts)

- [ ] **Step 6: Build check**

Run: `npm run build 2>&1 | tail -20`
Expected: `✓ Compiled successfully` — vérifier qu'aucun autre appelant de `BookingRequestSchema`/`serviceFeePercent` n'est cassé :

Run: `grep -rln "serviceFeePercent" --include="*.ts" --include="*.tsx" app components lib types 2>/dev/null | grep -v ".next"`
Expected: aucun résultat (toutes les références supprimées).

- [ ] **Step 7: Commit**

```bash
git add types/stripe.ts types/stripe.test.ts app/api/booking/route.ts
git commit -m "fix(security): serviceFeePercent n'est plus dicté par le client, calculé côté serveur"
```

---

### Task 7: Heure de check-in/check-out dynamique dans le fallback du règlement intérieur

**Files:**
- Modify: `components/booking/CheckoutView.tsx:82-94`

- [ ] **Step 1: Interpoler les vraies heures de la villa**

Remplacer (lignes 82-94) :

```ts
  const houseRules = useMemo(() => {
    if (villa.checkout_instructions?.trim()) {
      return villa.checkout_instructions
        .split(/\n+/)
        .map((line) => line.trim())
        .filter(Boolean);
    }
    return [
      "Arrivée à partir de 17h, départ avant 10h sauf accord conciergerie.",
      "Respect du voisinage et des équipements de la villa.",
      "Non-fumeur à l'intérieur. Animaux sur demande préalable.",
    ];
  }, [villa.checkout_instructions]);
```

par :

```ts
  const houseRules = useMemo(() => {
    if (villa.checkout_instructions?.trim()) {
      return villa.checkout_instructions
        .split(/\n+/)
        .map((line) => line.trim())
        .filter(Boolean);
    }
    const checkIn = villa.check_in_time ?? "17:00";
    const checkOut = villa.check_out_time ?? "10:00";
    return [
      `Arrivée à partir de ${checkIn}, départ avant ${checkOut} sauf accord conciergerie.`,
      "Respect du voisinage et des équipements de la villa.",
      "Non-fumeur à l'intérieur. Animaux sur demande préalable.",
    ];
  }, [villa.checkout_instructions, villa.check_in_time, villa.check_out_time]);
```

- [ ] **Step 2: Vérifier que `CheckoutVilla` expose bien ces champs**

Run: `grep -n "check_in_time\|check_out_time" components/booking/checkout-types.ts`
Expected: les deux champs `check_in_time: string | null` et `check_out_time: string | null` sont bien présents dans le type `CheckoutVilla` (déjà confirmé à l'exploration — pas de changement de type nécessaire).

- [ ] **Step 3: Build check**

Run: `npm run build 2>&1 | tail -20`
Expected: `✓ Compiled successfully`

- [ ] **Step 4: Commit**

```bash
git add components/booking/CheckoutView.tsx
git commit -m "fix(checkout): le règlement intérieur de secours affiche les vraies heures de check-in/out de la villa"
```

---

### Task 8: Accessibilité — nom accessible du lien carte villa

**Files:**
- Modify: `components/villas/VillaListingCard.tsx:175-181`

- [ ] **Step 1: Ajouter `aria-label` sur le `<Link>` enveloppant le carrousel**

Remplacer (lignes 175-181) :

```tsx
      <Link
        href={href}
        className="block w-full min-w-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-offwhite"
        tabIndex={villa.dimmed ? -1 : 0}
      >
        <CardImageBlock villa={villa} formatPrice={formatPrice} />
      </Link>
```

par :

```tsx
      <Link
        href={href}
        aria-label={villa.name}
        className="block w-full min-w-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-offwhite"
        tabIndex={villa.dimmed ? -1 : 0}
      >
        <CardImageBlock villa={villa} formatPrice={formatPrice} />
      </Link>
```

- [ ] **Step 2: Vérification manuelle via Playwright (accessibility snapshot)**

Naviguer sur `/villas`, prendre un snapshot d'accessibilité (`browser_snapshot`), vérifier que le lien de la première carte porte le nom de la villa réelle (ex. "Appartement · Le Lamentin...") et non "Previous slide Next slide".

- [ ] **Step 3: Build check**

Run: `npm run build 2>&1 | tail -20`
Expected: `✓ Compiled successfully`

- [ ] **Step 4: Commit**

```bash
git add components/villas/VillaListingCard.tsx
git commit -m "fix(a11y): aria-label sur le lien carte villa (le carrousel polluait le nom accessible)"
```

---

### Task 9: Régression complète

**Files:** aucun (vérification uniquement)

- [ ] **Step 1: Suite de tests complète**

Run: `npx vitest run 2>&1 | tail -20`
Expected: tous les tests passent, y compris les nouveaux (`lib/utils.test.ts`, `types/stripe.test.ts`) et les 122 préexistants — total attendu ≥ 129 tests verts, 0 échec.

- [ ] **Step 2: Build complet**

Run: `npm run build 2>&1 | tail -30`
Expected: `✓ Compiled successfully`, aucune erreur TypeScript.

- [ ] **Step 3: Vérification manuelle Playwright — cohérence de bout en bout**

1. Ouvrir une fiche villa (`/villas/[id]`), sélectionner des dates (ex. 15→20 août) dans le widget `BookingForm`, noter les dates affichées ("Séjour du 15 août au 20 août").
2. Cliquer "Réserver", vérifier que `/book` affiche les **mêmes** dates (15 août → 20 août), pas de décalage.
3. Sur `/book`, vérifier que le libellé "Frais de service Kayvila" est identique dans le résumé de prix (`CheckoutPriceSummary`) et cohérent avec le montant.
4. Vérifier la section règlement intérieur : l'heure de check-in affichée correspond à celle de la villa (pas "17h" en dur si la villa a une autre heure).
5. Retour sur `/villas`, snapshot d'accessibilité sur une carte villa : le lien annonce le nom de la villa.

- [ ] **Step 4: Commit final (si des ajustements ont été faits pendant la vérification)**

```bash
git add -A
git commit -m "test: vérification régression complète post-fixes P2"
```

(Ne committer que s'il y a des changements réels — sinon, ignorer cette étape.)
