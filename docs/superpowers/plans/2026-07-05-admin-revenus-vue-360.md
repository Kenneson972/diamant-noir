# Vue 360 revenus/historique — /admin/revenus — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enrichir `/admin/revenus` avec un graphique 12 mois cliquable et un panneau de détail complet par mois sélectionné (CA, commission décomposée, occupation, ADR, annulé/pipeline, ventilation villa+canal, réservations groupées par villa, export CSV du mois).

**Architecture:** Le serveur (`page.tsx`) fetch les réservations confirmées/payées (déjà tout l'historique, inchangé) + une nouvelle requête légère pour les réservations annulées/remboursées/en attente des 12 derniers mois. Une fonction pure `buildMonthlyDetails()` transforme ces données en un `Record<monthKey, MonthDetail>` pour les 12 derniers mois + un `Record<monthKey, number>` d'historique complet du CA brut (pour les comparaisons N-1/N-12). Le client (`AdminRevenusClient`) garde tout en mémoire et bascule instantanément entre mois sans nouveau fetch.

**Tech Stack:** Next.js 14 App Router, Supabase (service role côté serveur), Recharts 3, Vitest, Playwright.

## Global Constraints

- Aucun round-trip réseau supplémentaire pour changer de mois affiché (tout est déjà en mémoire côté client après le chargement de la page).
- Fenêtre historique : 12 derniers mois glissants uniquement (pas de sélecteur d'année).
- Pas de nouvelle route ni de nouvelle entrée de menu — tout reste sur `/admin/revenus`.
- CA/commission/ADR/nuitées vendues/annulé/pipeline sont rattachés au **mois de `start_date`** (check-in). Le taux d'occupation utilise un **découpage nuit par nuit avec chevauchement** — deux conventions différentes, documentées en commentaire dans le code, pas d'invention d'une troisième règle.
- `channelLabel()` réutilise la liste `OTA_SOURCES` déjà existante dans `lib/revenue/booking-revenue.ts` — ne pas dupliquer cette liste.
- Le champ `nightsSold` (et l'ADR qui en dérive) compte les nuits **entières** des réservations rattachées au mois par `start_date` — différent des nuits utilisées en interne pour `occupancyRate` (chevauchement).
- Aucune modification de `/admin/reservations` ni de `/admin` (accueil) — seul un lien sortant `?villa=` est ajouté.
- Aucun changement du modèle de commission ni de `calculateTransferAmounts()`.

---

### Task 1: `channelLabel()` — normalisation des canaux

**Files:**
- Modify: `lib/revenue/booking-revenue.ts`
- Test: `lib/revenue/booking-revenue.test.ts`

**Interfaces:**
- Produces: `channelLabel(source: string | null): string`, exporté depuis `lib/revenue/booking-revenue.ts`, réutilisé par `lib/revenue/monthly-detail.ts` (Task 3) et `components/dashboard/admin/RevenueMonthDetail.tsx` (Task 9, valeur déjà normalisée dans les données, pas d'appel direct).

- [ ] **Step 1: Write the failing tests**

Ajouter à la fin de `lib/revenue/booking-revenue.test.ts` :

```ts
import { channelLabel } from "./booking-revenue";

describe("channelLabel", () => {
  it('"airbnb" → "Airbnb"', () => {
    expect(channelLabel("airbnb")).toBe("Airbnb");
  });

  it('"booking" → "Booking.com"', () => {
    expect(channelLabel("booking")).toBe("Booking.com");
  });

  it('"expedia" → "Expedia"', () => {
    expect(channelLabel("expedia")).toBe("Expedia");
  });

  it('"vrbo" → "VRBO"', () => {
    expect(channelLabel("vrbo")).toBe("VRBO");
  });

  it('"trivago" → "Trivago"', () => {
    expect(channelLabel("trivago")).toBe("Trivago");
  });

  it('"ical" → "Import iCal"', () => {
    expect(channelLabel("ical")).toBe("Import iCal");
  });

  it('"direct" → "Direct"', () => {
    expect(channelLabel("direct")).toBe("Direct");
  });

  it('"manual" → "Direct"', () => {
    expect(channelLabel("manual")).toBe("Direct");
  });

  it("null → \"Direct\"", () => {
    expect(channelLabel(null)).toBe("Direct");
  });

  it('valeur inconnue → "Direct" (fallback)', () => {
    expect(channelLabel("some_unknown_source")).toBe("Direct");
  });
});
```

Add `import { channelLabel } from "./booking-revenue";` alongside the existing import at the top of the file (merge into the existing `import { getCommissionRate, grossCentsFromBooking } from "./booking-revenue";` line instead of a second import line).

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run lib/revenue/booking-revenue.test.ts`
Expected: FAIL — `channelLabel is not a function` (or similar import error).

- [ ] **Step 3: Implement `channelLabel()`**

Add to `lib/revenue/booking-revenue.ts`, after the existing `OTA_SOURCES` constant (do not duplicate the list — reuse it for the display-label map keys):

```ts
const CHANNEL_LABELS: Record<string, string> = {
  airbnb: 'Airbnb',
  booking: 'Booking.com',
  expedia: 'Expedia',
  vrbo: 'VRBO',
  trivago: 'Trivago',
  ical: 'Import iCal',
};

/** Libellé affichable d'un canal de réservation ; tout ce qui n'est pas une OTA connue → "Direct". */
export function channelLabel(source: string | null): string {
  if (!source) return 'Direct';
  return CHANNEL_LABELS[source] ?? 'Direct';
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run lib/revenue/booking-revenue.test.ts`
Expected: PASS — all tests including the new `channelLabel` describe block.

- [ ] **Step 5: Commit**

```bash
git add lib/revenue/booking-revenue.ts lib/revenue/booking-revenue.test.ts
git commit -m "feat(revenue): add channelLabel() for normalized channel display names"
```

---

### Task 2: `computeMomChange()` + `shiftMonthKey()` — comparaisons de périodes

**Files:**
- Create: `lib/revenue/monthly-comparison.ts`
- Test: `lib/revenue/monthly-comparison.test.ts`

**Interfaces:**
- Produces: `computeMomChange(current: number, previous: number): number | null`, `shiftMonthKey(monthKey: string, monthsDelta: number): string` — les deux consommés par `AdminRevenusClient.tsx` (Task 10).

- [ ] **Step 1: Write the failing tests**

Create `lib/revenue/monthly-comparison.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { computeMomChange, shiftMonthKey } from "./monthly-comparison";

describe("computeMomChange", () => {
  it("hausse : 1200 vs 1000 → +20", () => {
    expect(computeMomChange(1200, 1000)).toBe(20);
  });

  it("baisse : 800 vs 1000 → -20", () => {
    expect(computeMomChange(800, 1000)).toBe(-20);
  });

  it("mois précédent à 0 → null (pas de division par zéro)", () => {
    expect(computeMomChange(500, 0)).toBeNull();
  });

  it("les deux mois à 0 → null", () => {
    expect(computeMomChange(0, 0)).toBeNull();
  });

  it("valeur identique → 0", () => {
    expect(computeMomChange(1000, 1000)).toBe(0);
  });
});

describe("shiftMonthKey", () => {
  it("mois précédent dans la même année : 2026-07 → 2026-06", () => {
    expect(shiftMonthKey("2026-07", -1)).toBe("2026-06");
  });

  it("changement d'année : 2026-01 → 2025-12", () => {
    expect(shiftMonthKey("2026-01", -1)).toBe("2025-12");
  });

  it("un an en arrière : 2026-07 → 2025-07", () => {
    expect(shiftMonthKey("2026-07", -12)).toBe("2025-07");
  });

  it("décalage positif : 2025-11 → 2026-01", () => {
    expect(shiftMonthKey("2025-11", 2)).toBe("2026-01");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run lib/revenue/monthly-comparison.test.ts`
Expected: FAIL — module `./monthly-comparison` not found.

- [ ] **Step 3: Implement**

Create `lib/revenue/monthly-comparison.ts`:

```ts
/** Variation en % entre deux montants (cents ou unité quelconque, cohérente des deux côtés). Null si la base de comparaison est à 0 (évite une division par zéro / un pourcentage infini). */
export function computeMomChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

/** Décale une clé "YYYY-MM" de `monthsDelta` mois (peut être négatif). */
export function shiftMonthKey(monthKey: string, monthsDelta: number): string {
  const [yearStr, monthStr] = monthKey.split("-");
  const date = new Date(Number(yearStr), Number(monthStr) - 1 + monthsDelta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run lib/revenue/monthly-comparison.test.ts`
Expected: PASS — 9 tests green.

- [ ] **Step 5: Commit**

```bash
git add lib/revenue/monthly-comparison.ts lib/revenue/monthly-comparison.test.ts
git commit -m "feat(revenue): add computeMomChange() and shiftMonthKey() period helpers"
```

---

### Task 3: `buildMonthlyDetails()` — cœur de l'agrégation mensuelle (CA/commission/villa/canal)

**Files:**
- Create: `lib/revenue/monthly-detail.ts`
- Test: `lib/revenue/monthly-detail.test.ts`

**Interfaces:**
- Consumes: `getCommissionRate`, `stayCentsFromBooking`, `grossCentsFromBooking`, `channelLabel` from `./booking-revenue` (Task 1) ; `calculateTransferAmounts` from `@/lib/stripe/connect`.
- Produces: types `ConfirmedBookingInput`, `MinimalBookingInput`, `VillaInfo`, `VillaMonthRow`, `ChannelMonthRow`, `MonthBookingRow`, `MonthDetail`, `BuildMonthlyDetailsResult`, et la fonction `buildMonthlyDetails(params): BuildMonthlyDetailsResult` — tous exportés depuis `lib/revenue/monthly-detail.ts`. Consommés par `app/(admin)/admin/revenus/page.tsx` (Task 6), `components/dashboard/admin/AdminRevenusClient.tsx` (Task 10) et `components/dashboard/admin/RevenueMonthDetail.tsx` (Tasks 7-9).
- Dans cette tâche, `cancelled`/`pending`/`occupancyRate` restent à leur valeur initiale (`{count:0, lostGross:0}` / `{count:0, potentialGross:0}` / `0`) — complétés par les Tasks 4 et 5 sans changer la signature.

- [ ] **Step 1: Write the failing tests**

Create `lib/revenue/monthly-detail.test.ts` :

```ts
import { describe, it, expect } from "vitest";
import { buildMonthlyDetails, type ConfirmedBookingInput, type VillaInfo } from "./monthly-detail";

const villas: VillaInfo[] = [
  { id: "v1", name: "Villa A" },
  { id: "v2", name: "Villa B" },
];

const confirmedBookings: ConfirmedBookingInput[] = [
  {
    id: "b1",
    villa_id: "v1",
    guest_name: "Jean Martin",
    start_date: "2026-07-01",
    end_date: "2026-07-08", // 7 nuits
    price: 1000,
    cleaning_fee: 100,
    service_fee: 50,
    total_price_cents: null,
    source: "direct",
  },
  {
    id: "b2",
    villa_id: "v1",
    guest_name: "Marie Dubois",
    start_date: "2026-07-10",
    end_date: "2026-07-12", // 2 nuits
    price: 300,
    cleaning_fee: 0,
    service_fee: 0,
    total_price_cents: null,
    source: "airbnb",
  },
  {
    id: "b3",
    villa_id: "v2",
    guest_name: "Paul Petit",
    start_date: "2026-07-05",
    end_date: "2026-07-10", // 5 nuits
    price: 500,
    cleaning_fee: 50,
    service_fee: 0,
    total_price_cents: null,
    source: null,
  },
];

function build(monthKeys = ["2026-06", "2026-07"]) {
  return buildMonthlyDetails({
    confirmedBookings,
    cancelledBookings: [],
    pendingBookings: [],
    villas,
    monthKeys,
  });
}

describe("buildMonthlyDetails — agrégats du mois", () => {
  it("matérialise un MonthDetail pour chaque monthKey demandé", () => {
    const { monthlyDetails } = build();
    expect(Object.keys(monthlyDetails).sort()).toEqual(["2026-06", "2026-07"]);
    expect(monthlyDetails["2026-07"].label).toBe("Juillet 2026");
  });

  it("un mois sans réservation a tous ses champs à 0", () => {
    const { monthlyDetails } = build();
    const june = monthlyDetails["2026-06"];
    expect(june.gross).toBe(0);
    expect(june.bookingCount).toBe(0);
    expect(june.byVilla).toEqual([]);
    expect(june.byChannel).toEqual([]);
    expect(june.bookings).toEqual([]);
  });

  it("calcule le CA brut, la commission décomposée et le reversement du mois", () => {
    const { monthlyDetails } = build();
    const july = monthlyDetails["2026-07"];
    // gross = (1000+100+50)€ + 300€ + (500+50)€ = 1150+300+550 = 2000€
    expect(july.gross).toBe(200000);
    expect(july.bookingCount).toBe(3);
    // commission sur nuitées : b1 22%*1000€=220€, b2 20%*300€=60€, b3 22%*500€=110€ → 390€
    expect(july.platformOnStay).toBe(39000);
    expect(july.platformCleaning).toBe(15000); // 100+0+50 €
    expect(july.platformService).toBe(5000); // 50+0+0 €
    expect(july.platformTotal).toBe(59000); // 390+150+50
    expect(july.ownerNet).toBe(141000); // 2000-59€... vérifié ci-dessous
  });

  it("calcule les nuitées vendues et l'ADR (CA nuitées uniquement / nuitées)", () => {
    const { monthlyDetails } = build();
    const july = monthlyDetails["2026-07"];
    expect(july.nightsSold).toBe(14); // 7+2+5
    // stay only = 1000+300+500 = 1800€ / 14 nuits = 128.57€ → 12857 cents arrondi
    expect(july.adr).toBe(12857);
  });

  it("calcule le panier moyen", () => {
    const { monthlyDetails } = build();
    expect(monthlyDetails["2026-07"].avgBasket).toBe(66667); // 200000/3 arrondi
  });

  it("regroupe par villa avec sous-totaux et part du CA du mois", () => {
    const { monthlyDetails } = build();
    const byVilla = monthlyDetails["2026-07"].byVilla;
    expect(byVilla).toHaveLength(2);
    const v1 = byVilla.find((v) => v.villaId === "v1")!;
    expect(v1.gross).toBe(145000); // b1+b2 = 115000+30000
    expect(v1.bookingCount).toBe(2);
    expect(v1.shareOfMonthPct).toBe(73); // 145000/200000
    const v2 = byVilla.find((v) => v.villaId === "v2")!;
    expect(v2.gross).toBe(55000);
    expect(v2.shareOfMonthPct).toBe(28); // 55000/200000
  });

  it("regroupe par canal normalisé avec le taux de commission associé", () => {
    const { monthlyDetails } = build();
    const byChannel = monthlyDetails["2026-07"].byChannel;
    const direct = byChannel.find((c) => c.channel === "Direct")!;
    expect(direct.gross).toBe(170000); // b1(direct)+b3(null→Direct) = 115000+55000
    expect(direct.commissionRate).toBe(22);
    const airbnb = byChannel.find((c) => c.channel === "Airbnb")!;
    expect(airbnb.gross).toBe(30000);
    expect(airbnb.commissionRate).toBe(20);
  });

  it("liste les réservations du mois triées par date d'arrivée", () => {
    const { monthlyDetails } = build();
    const ids = monthlyDetails["2026-07"].bookings.map((b) => b.id);
    expect(ids).toEqual(["b1", "b3", "b2"]); // 07-01, 07-05, 07-10
  });

  it("alimente monthlyGrossHistory même pour des mois hors fenêtre affichée", () => {
    // Fenêtre affichée = seulement août : juillet est hors fenêtre (pas de
    // MonthDetail matérialisé) mais doit quand même apparaître dans l'historique
    // complet du CA, utilisé pour les comparaisons N-1/N-12.
    const { monthlyDetails, monthlyGrossHistory } = buildMonthlyDetails({
      confirmedBookings,
      cancelledBookings: [],
      pendingBookings: [],
      villas,
      monthKeys: ["2026-08"],
    });
    expect(monthlyDetails["2026-07"]).toBeUndefined();
    expect(monthlyGrossHistory["2026-07"]).toBe(200000);
  });

  it("cancelled/pending/occupancyRate restent à zéro tant que non implémentés (Tasks 4-5)", () => {
    const { monthlyDetails } = build();
    const july = monthlyDetails["2026-07"];
    expect(july.cancelled).toEqual({ count: 0, lostGross: 0 });
    expect(july.pending).toEqual({ count: 0, potentialGross: 0 });
    expect(july.occupancyRate).toBe(0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run lib/revenue/monthly-detail.test.ts`
Expected: FAIL — module `./monthly-detail` not found.

- [ ] **Step 3: Implement**

Create `lib/revenue/monthly-detail.ts` :

```ts
import { calculateTransferAmounts } from "@/lib/stripe/connect";
import { getCommissionRate, stayCentsFromBooking, grossCentsFromBooking, channelLabel } from "./booking-revenue";

export type ConfirmedBookingInput = {
  id: string;
  villa_id: string;
  guest_name: string | null;
  start_date: string;
  end_date: string;
  price: number | null;
  cleaning_fee: number | null;
  service_fee: number | null;
  total_price_cents: number | null;
  source: string | null;
};

export type MinimalBookingInput = {
  villa_id: string;
  start_date: string;
  price: number | null;
  cleaning_fee: number | null;
  service_fee: number | null;
  total_price_cents: number | null;
};

export type VillaInfo = { id: string; name: string };

export type VillaMonthRow = {
  villaId: string;
  name: string;
  gross: number;
  nightsSold: number;
  occupancyRate: number;
  adr: number;
  platformTotal: number;
  ownerNet: number;
  bookingCount: number;
  shareOfMonthPct: number;
};

export type ChannelMonthRow = {
  channel: string;
  gross: number;
  sharePct: number;
  commissionRate: number;
};

export type MonthBookingRow = {
  id: string;
  villaId: string;
  villaName: string;
  guestName: string;
  startDate: string;
  endDate: string;
  nights: number;
  channel: string;
  gross: number;
  platform: number;
  owner: number;
};

export type MonthDetail = {
  monthKey: string;
  label: string;
  gross: number;
  platformTotal: number;
  platformOnStay: number;
  platformCleaning: number;
  platformService: number;
  ownerNet: number;
  bookingCount: number;
  nightsSold: number;
  adr: number;
  avgBasket: number;
  occupancyRate: number;
  cancelled: { count: number; lostGross: number };
  pending: { count: number; potentialGross: number };
  byVilla: VillaMonthRow[];
  byChannel: ChannelMonthRow[];
  bookings: MonthBookingRow[];
};

export type BuildMonthlyDetailsResult = {
  /** MonthDetail complet, uniquement pour les monthKeys demandés (fenêtre affichée). */
  monthlyDetails: Record<string, MonthDetail>;
  /** CA brut par mois sur tout l'historique fourni (pour les comparaisons N-1/N-12, même hors fenêtre affichée). */
  monthlyGrossHistory: Record<string, number>;
};

const MONTH_LABELS_FR = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

function monthKeyOf(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabelOf(monthKey: string): string {
  const [year, month] = monthKey.split("-").map(Number);
  return `${MONTH_LABELS_FR[month - 1]} ${year}`;
}

function nightsBetween(startDate: string, endDate: string): number {
  const ms = new Date(endDate).getTime() - new Date(startDate).getTime();
  return Math.max(0, Math.round(ms / 86400000));
}

function emptyMonthDetail(monthKey: string): MonthDetail {
  return {
    monthKey,
    label: monthLabelOf(monthKey),
    gross: 0,
    platformTotal: 0,
    platformOnStay: 0,
    platformCleaning: 0,
    platformService: 0,
    ownerNet: 0,
    bookingCount: 0,
    nightsSold: 0,
    adr: 0,
    avgBasket: 0,
    occupancyRate: 0,
    cancelled: { count: 0, lostGross: 0 },
    pending: { count: 0, potentialGross: 0 },
    byVilla: [],
    byChannel: [],
    bookings: [],
  };
}

export function buildMonthlyDetails(params: {
  confirmedBookings: ConfirmedBookingInput[];
  cancelledBookings: MinimalBookingInput[];
  pendingBookings: MinimalBookingInput[];
  villas: VillaInfo[];
  monthKeys: string[];
}): BuildMonthlyDetailsResult {
  const { confirmedBookings, villas, monthKeys } = params;
  const villaNameById = new Map(villas.map((v) => [v.id, v.name]));
  const monthKeySet = new Set(monthKeys);

  const monthlyGrossHistory: Record<string, number> = {};
  const monthlyDetails: Record<string, MonthDetail> = {};
  for (const key of monthKeys) monthlyDetails[key] = emptyMonthDetail(key);

  // Accumulateurs intermédiaires, uniquement pour les mois affichés.
  const villaAcc: Record<string, Record<string, {
    gross: number; nightsSold: number; stayGross: number;
    platformTotal: number; ownerNet: number; bookingCount: number;
  }>> = {};
  const channelAcc: Record<string, Record<string, { gross: number; rate: number }>> = {};
  const stayGrossByMonth: Record<string, number> = {};

  for (const b of confirmedBookings) {
    // Rattachement CA/commission/nuitées : mois de la date d'arrivée (check-in),
    // cf. Global Constraints — différent de la convention utilisée pour l'occupation (Task 5).
    const key = monthKeyOf(b.start_date);
    const gross = grossCentsFromBooking(b);

    // Historique complet (comparaisons N-1/N-12), y compris hors fenêtre affichée.
    monthlyGrossHistory[key] = (monthlyGrossHistory[key] ?? 0) + gross;

    if (!monthKeySet.has(key)) continue;

    const detail = monthlyDetails[key];
    const rate = getCommissionRate(b.source);
    const stayCents = stayCentsFromBooking(b);
    const cleaningCents = Math.round(Number(b.cleaning_fee ?? 0) * 100);
    const serviceCents = Math.round(Number(b.service_fee ?? 0) * 100);
    const { ownerAmountCents, platformFeeCents: platformCents } = calculateTransferAmounts(
      stayCents, cleaningCents, serviceCents, rate
    );
    const commissionOnStay = Math.round(stayCents * (rate / 100));
    const nights = nightsBetween(b.start_date, b.end_date);
    const channel = channelLabel(b.source);
    const villaName = villaNameById.get(b.villa_id) ?? b.villa_id.slice(0, 8);

    detail.gross += gross;
    detail.platformTotal += platformCents;
    detail.platformOnStay += commissionOnStay;
    detail.platformCleaning += cleaningCents;
    detail.platformService += serviceCents;
    detail.ownerNet += ownerAmountCents;
    detail.bookingCount += 1;
    detail.nightsSold += nights;
    stayGrossByMonth[key] = (stayGrossByMonth[key] ?? 0) + stayCents;

    detail.bookings.push({
      id: b.id,
      villaId: b.villa_id,
      villaName,
      guestName: b.guest_name ?? "Anonyme",
      startDate: b.start_date,
      endDate: b.end_date,
      nights,
      channel,
      gross,
      platform: platformCents,
      owner: ownerAmountCents,
    });

    villaAcc[key] ??= {};
    villaAcc[key][b.villa_id] ??= { gross: 0, nightsSold: 0, stayGross: 0, platformTotal: 0, ownerNet: 0, bookingCount: 0 };
    const vAcc = villaAcc[key][b.villa_id];
    vAcc.gross += gross;
    vAcc.nightsSold += nights;
    vAcc.stayGross += stayCents;
    vAcc.platformTotal += platformCents;
    vAcc.ownerNet += ownerAmountCents;
    vAcc.bookingCount += 1;

    channelAcc[key] ??= {};
    channelAcc[key][channel] ??= { gross: 0, rate };
    channelAcc[key][channel].gross += gross;
  }

  for (const key of monthKeys) {
    const detail = monthlyDetails[key];
    detail.adr = detail.nightsSold > 0 ? Math.round((stayGrossByMonth[key] ?? 0) / detail.nightsSold) : 0;
    detail.avgBasket = detail.bookingCount > 0 ? Math.round(detail.gross / detail.bookingCount) : 0;

    detail.byVilla = Object.entries(villaAcc[key] ?? {})
      .map(([villaId, acc]) => ({
        villaId,
        name: villaNameById.get(villaId) ?? villaId.slice(0, 8),
        gross: acc.gross,
        nightsSold: acc.nightsSold,
        occupancyRate: 0, // complété par Task 5
        adr: acc.nightsSold > 0 ? Math.round(acc.stayGross / acc.nightsSold) : 0,
        platformTotal: acc.platformTotal,
        ownerNet: acc.ownerNet,
        bookingCount: acc.bookingCount,
        shareOfMonthPct: detail.gross > 0 ? Math.round((acc.gross / detail.gross) * 100) : 0,
      }))
      .sort((a, b) => b.gross - a.gross);

    detail.byChannel = Object.entries(channelAcc[key] ?? {})
      .map(([channel, acc]) => ({
        channel,
        gross: acc.gross,
        sharePct: detail.gross > 0 ? Math.round((acc.gross / detail.gross) * 100) : 0,
        commissionRate: acc.rate,
      }))
      .sort((a, b) => b.gross - a.gross);

    detail.bookings.sort((a, b) => a.startDate.localeCompare(b.startDate));
  }

  return { monthlyDetails, monthlyGrossHistory };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run lib/revenue/monthly-detail.test.ts`
Expected: PASS — all 10 tests green.

- [ ] **Step 5: Commit**

```bash
git add lib/revenue/monthly-detail.ts lib/revenue/monthly-detail.test.ts
git commit -m "feat(revenue): add buildMonthlyDetails() core aggregation (gross, commission, villa, channel)"
```

---

### Task 4: `buildMonthlyDetails()` — annulations et pipeline (en attente)

**Files:**
- Modify: `lib/revenue/monthly-detail.ts`
- Test: `lib/revenue/monthly-detail.test.ts`

**Interfaces:**
- Consumes: signature de `buildMonthlyDetails()` inchangée depuis Task 3 (les params `cancelledBookings`/`pendingBookings` existaient déjà, non exploités).
- Produces: `MonthDetail.cancelled` et `MonthDetail.pending` correctement calculés.

- [ ] **Step 1: Write the failing tests**

Add to `lib/revenue/monthly-detail.test.ts`, in a new `describe` block :

```ts
describe("buildMonthlyDetails — annulé et pipeline", () => {
  it("compte les réservations annulées/remboursées du mois et le CA perdu associé", () => {
    const { monthlyDetails } = buildMonthlyDetails({
      confirmedBookings,
      cancelledBookings: [
        { villa_id: "v1", start_date: "2026-07-15", price: 200, cleaning_fee: 0, service_fee: 0, total_price_cents: null },
      ],
      pendingBookings: [],
      villas,
      monthKeys: ["2026-06", "2026-07"],
    });
    expect(monthlyDetails["2026-07"].cancelled).toEqual({ count: 1, lostGross: 20000 });
    expect(monthlyDetails["2026-06"].cancelled).toEqual({ count: 0, lostGross: 0 });
  });

  it("compte les réservations en attente du mois et le CA potentiel associé", () => {
    const { monthlyDetails } = buildMonthlyDetails({
      confirmedBookings,
      cancelledBookings: [],
      pendingBookings: [
        { villa_id: "v2", start_date: "2026-07-20", price: 400, cleaning_fee: 0, service_fee: 0, total_price_cents: null },
      ],
      villas,
      monthKeys: ["2026-06", "2026-07"],
    });
    expect(monthlyDetails["2026-07"].pending).toEqual({ count: 1, potentialGross: 40000 });
  });

  it("les annulations/pending hors fenêtre affichée sont ignorées", () => {
    const { monthlyDetails } = buildMonthlyDetails({
      confirmedBookings,
      cancelledBookings: [
        { villa_id: "v1", start_date: "2025-01-15", price: 200, cleaning_fee: 0, service_fee: 0, total_price_cents: null },
      ],
      pendingBookings: [],
      villas,
      monthKeys: ["2026-06", "2026-07"],
    });
    expect(monthlyDetails["2026-07"].cancelled.count).toBe(0);
    expect(monthlyDetails["2026-06"].cancelled.count).toBe(0);
  });

  it("annulé/pending ne modifient jamais gross/platformTotal/ownerNet", () => {
    const { monthlyDetails } = buildMonthlyDetails({
      confirmedBookings,
      cancelledBookings: [
        { villa_id: "v1", start_date: "2026-07-15", price: 200, cleaning_fee: 0, service_fee: 0, total_price_cents: null },
      ],
      pendingBookings: [
        { villa_id: "v2", start_date: "2026-07-20", price: 400, cleaning_fee: 0, service_fee: 0, total_price_cents: null },
      ],
      villas,
      monthKeys: ["2026-07"],
    });
    expect(monthlyDetails["2026-07"].gross).toBe(200000); // inchangé par rapport au test Task 3
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run lib/revenue/monthly-detail.test.ts`
Expected: FAIL — les 4 nouveaux tests échouent (`cancelled`/`pending` restent à `{count:0,...}` par défaut).

- [ ] **Step 3: Implement**

Dans `lib/revenue/monthly-detail.ts`, remplacer la ligne de destructuring des params :

```ts
const { confirmedBookings, villas, monthKeys } = params;
```

par :

```ts
const { confirmedBookings, cancelledBookings, pendingBookings, villas, monthKeys } = params;
```

Puis ajouter, juste après la boucle `for (const b of confirmedBookings) { ... }` (avant la boucle finale `for (const key of monthKeys) { ... }` qui calcule `adr`/`byVilla`/`byChannel`) :

```ts
  for (const b of cancelledBookings) {
    const key = monthKeyOf(b.start_date);
    if (!monthKeySet.has(key)) continue;
    monthlyDetails[key].cancelled.count += 1;
    monthlyDetails[key].cancelled.lostGross += grossCentsFromBooking(b);
  }

  for (const b of pendingBookings) {
    const key = monthKeyOf(b.start_date);
    if (!monthKeySet.has(key)) continue;
    monthlyDetails[key].pending.count += 1;
    monthlyDetails[key].pending.potentialGross += grossCentsFromBooking(b);
  }
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run lib/revenue/monthly-detail.test.ts`
Expected: PASS — tous les tests (Task 3 + Task 4) verts.

- [ ] **Step 5: Commit**

```bash
git add lib/revenue/monthly-detail.ts lib/revenue/monthly-detail.test.ts
git commit -m "feat(revenue): compute cancelled/pending totals per month in buildMonthlyDetails"
```

---

### Task 5: `buildMonthlyDetails()` — taux d'occupation (chevauchement nuit par nuit)

**Files:**
- Modify: `lib/revenue/monthly-detail.ts`
- Test: `lib/revenue/monthly-detail.test.ts`

**Interfaces:**
- Consumes: signature inchangée depuis Task 3.
- Produces: `MonthDetail.occupancyRate` et `VillaMonthRow.occupancyRate` correctement calculés.

- [ ] **Step 1: Write the failing tests**

Add to `lib/revenue/monthly-detail.test.ts`, in a new `describe` block. Fixture dédiée et isolée (mois de 30 jours pour des calculs ronds) :

```ts
describe("buildMonthlyDetails — taux d'occupation (chevauchement)", () => {
  const occVillas: VillaInfo[] = [
    { id: "v1", name: "Villa A" },
    { id: "v2", name: "Villa B" },
  ];

  it("compte les nuits occupées avec chevauchement, indépendamment du mois de rattachement du CA", () => {
    const result = buildMonthlyDetails({
      confirmedBookings: [
        {
          id: "b1",
          villa_id: "v1",
          guest_name: "Client A",
          start_date: "2026-06-01",
          end_date: "2026-06-16", // 15 nuits, entièrement en juin
          price: 1500,
          cleaning_fee: 0,
          service_fee: 0,
          total_price_cents: null,
          source: "direct",
        },
        {
          id: "b2",
          villa_id: "v2",
          guest_name: "Client B",
          // À cheval mai → juin : rattaché à mai pour le CA (start_date), mais
          // ses nuits de juin doivent compter dans l'occupation de juin.
          start_date: "2026-05-25",
          end_date: "2026-06-10", // 9 nuits en juin (06-01 → 06-10)
          price: 1600,
          cleaning_fee: 0,
          service_fee: 0,
          total_price_cents: null,
          source: "direct",
        },
      ],
      cancelledBookings: [],
      pendingBookings: [],
      villas: occVillas,
      monthKeys: ["2026-06"], // mai hors fenêtre affichée
    });

    const june = result.monthlyDetails["2026-06"];
    // v1 : 15 nuits / 30 jours = 50%
    const v1 = june.byVilla.find((v) => v.villaId === "v1")!;
    expect(v1.occupancyRate).toBe(50);

    // v2 n'a aucun check-in en juin (son check-in est en mai, hors fenêtre)
    // → pas de ligne dans byVilla, limitation documentée. Ses nuits comptent
    // quand même dans le taux global.
    expect(june.byVilla.find((v) => v.villaId === "v2")).toBeUndefined();

    // Global : (15 + 9) nuits occupées / (30 jours * 2 villas) = 24/60 = 40%
    expect(june.occupancyRate).toBe(40);
  });

  it("mois sans aucune réservation → occupancyRate à 0, pas d'exception", () => {
    const result = buildMonthlyDetails({
      confirmedBookings: [],
      cancelledBookings: [],
      pendingBookings: [],
      villas: occVillas,
      monthKeys: ["2026-06"],
    });
    expect(result.monthlyDetails["2026-06"].occupancyRate).toBe(0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run lib/revenue/monthly-detail.test.ts`
Expected: FAIL — `occupancyRate` reste à `0` pour v1 (attendu `50`), test échoue.

- [ ] **Step 3: Implement**

Dans `lib/revenue/monthly-detail.ts`, ajouter la fonction utilitaire après `nightsBetween` :

```ts
function daysInMonthOf(monthKey: string): number {
  const [year, month] = monthKey.split("-").map(Number);
  return new Date(year, month, 0).getDate();
}
```

Puis ajouter, juste avant le `return { monthlyDetails, monthlyGrossHistory };` final, une nouvelle boucle sur `monthKeys` dédiée à l'occupation (indépendante de `monthKeySet`/`continue` utilisé pour le CA — elle doit regarder TOUT `confirmedBookings`, y compris les réservations dont `start_date` tombe hors fenêtre mais dont les nuits débordent dans un mois affiché) :

```ts
  // Occupation : chevauchement nuit par nuit, indépendant du mois de rattachement
  // du CA (cf. Global Constraints) — itère tout confirmedBookings, pas seulement
  // les réservations dont le check-in tombe dans la fenêtre affichée.
  for (const key of monthKeys) {
    const [year, month] = key.split("-").map(Number);
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 1); // exclusif (1er du mois suivant)
    const days = daysInMonthOf(key);

    const occupiedByVilla: Record<string, number> = {};
    for (const b of confirmedBookings) {
      const bStart = new Date(b.start_date);
      const bEnd = new Date(b.end_date);
      const overlapStart = bStart > monthStart ? bStart : monthStart;
      const overlapEnd = bEnd < monthEnd ? bEnd : monthEnd;
      if (overlapEnd > overlapStart) {
        const nights = Math.round((overlapEnd.getTime() - overlapStart.getTime()) / 86400000);
        occupiedByVilla[b.villa_id] = (occupiedByVilla[b.villa_id] ?? 0) + nights;
      }
    }

    const detail = monthlyDetails[key];
    // Note : une villa dont TOUTE l'occupation du mois vient d'une réservation à
    // cheval (check-in le mois précédent, aucun check-in ce mois-ci) n'aura pas
    // de ligne dans byVilla (pas de CA ce mois-là côté rattachement check-in),
    // mais compte bien dans occupancyRate global ci-dessous.
    for (const row of detail.byVilla) {
      const occupied = occupiedByVilla[row.villaId] ?? 0;
      row.occupancyRate = days > 0 ? Math.round((occupied / days) * 100) : 0;
    }
    const totalOccupiedNights = Object.values(occupiedByVilla).reduce((sum, n) => sum + n, 0);
    detail.occupancyRate = villas.length > 0 && days > 0
      ? Math.round((totalOccupiedNights / (days * villas.length)) * 100)
      : 0;
  }
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run lib/revenue/monthly-detail.test.ts`
Expected: PASS — tous les tests (Tasks 3, 4, 5) verts.

- [ ] **Step 5: Commit**

```bash
git add lib/revenue/monthly-detail.ts lib/revenue/monthly-detail.test.ts
git commit -m "feat(revenue): compute occupancy rate (nightly overlap) in buildMonthlyDetails"
```

---

### Task 6: brancher `buildMonthlyDetails()` dans `app/(admin)/admin/revenus/page.tsx`

**Files:**
- Modify: `app/(admin)/admin/revenus/page.tsx`

**Interfaces:**
- Consumes: `buildMonthlyDetails`, types de `lib/revenue/monthly-detail.ts` (Tasks 3-5).
- Produces: props `monthlyDetails: Record<string, MonthDetail>` et `monthlyGrossHistory: Record<string, number>` passées à `AdminRevenusClient` (consommées Task 10) ; `monthlyData` gagne un champ `monthKey: string` par point.

- [ ] **Step 1: Modifier les imports**

En haut de `app/(admin)/admin/revenus/page.tsx`, remplacer :

```ts
import {
  grossCentsFromBooking,
  ownerNetCents,
  platformFeeCents,
  getCommissionRate,
} from "@/lib/revenue/booking-revenue";
```

par :

```ts
import {
  grossCentsFromBooking,
  ownerNetCents,
  platformFeeCents,
  getCommissionRate,
} from "@/lib/revenue/booking-revenue";
import {
  buildMonthlyDetails,
  type ConfirmedBookingInput,
  type MinimalBookingInput,
  type VillaInfo,
  type MonthDetail,
} from "@/lib/revenue/monthly-detail";
```

- [ ] **Step 2: Étendre le type `monthlyData` et l'état par défaut**

Remplacer :

```ts
  let monthlyData: { month: string; revenue: number }[] = [];
  let byVilla: VillaRevenueRow[] = [];
  let error: string | null = null;
```

par :

```ts
  let monthlyData: { monthKey: string; month: string; revenue: number }[] = [];
  let byVilla: VillaRevenueRow[] = [];
  let monthlyDetails: Record<string, MonthDetail> = {};
  let monthlyGrossHistory: Record<string, number> = {};
  let error: string | null = null;
```

- [ ] **Step 3: Étendre la requête bookings et ajouter la requête annulé/pending**

Remplacer le `Promise.all` existant :

```ts
    const [{ data: bookings }, { data: villas }] = await Promise.all([
      supabase
        .from("bookings")
        .select("id, villa_id, start_date, status, payment_status, price, cleaning_fee, service_fee, total_price_cents, source, villas(name, commission_rate)")
        .in("status", CONFIRMED_STATUSES)
        .order("start_date", { ascending: false }),
      supabase.from("villas").select("id, name, commission_rate"),
    ]);
```

par :

```ts
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

    const [{ data: bookings }, { data: villas }, { data: recentNonConfirmed }] = await Promise.all([
      supabase
        .from("bookings")
        .select("id, villa_id, start_date, end_date, guest_name, status, payment_status, price, cleaning_fee, service_fee, total_price_cents, source, villas(name, commission_rate)")
        .in("status", CONFIRMED_STATUSES)
        .order("start_date", { ascending: false }),
      supabase.from("villas").select("id, name, commission_rate"),
      supabase
        .from("bookings")
        .select("villa_id, start_date, price, cleaning_fee, service_fee, total_price_cents, status")
        .in("status", ["cancelled", "refunded", "pending"])
        .gte("start_date", twelveMonthsAgo.toISOString()),
    ]);
```

(`now` est déjà déclaré juste au-dessus dans le fichier existant, avant `monthStart`/`yearStart` — vérifier qu'il est bien déclaré **avant** ce bloc, sinon le remonter avant le `Promise.all`.)

- [ ] **Step 4: Retirer `monthBuckets` (devient redondant) et construire `monthlyData` depuis `monthlyDetails`**

Supprimer la ligne :

```ts
    // Monthly aggregation
    const monthBuckets: Record<string, number> = {};
```

Supprimer, dans la boucle `for (const b of (bookings ?? []) as any[]) { ... }`, le bloc :

```ts
      // Monthly bucket
      const monthKey = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, "0")}`;
      monthBuckets[monthKey] = (monthBuckets[monthKey] ?? 0) + gross;
```

Remplacer le bloc existant qui construisait `monthlyData` :

```ts
    // Monthly chart data (last 12 months)
    const monthNames = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];
    monthlyData = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthlyData.push({
        month: monthNames[d.getMonth()],
        revenue: Math.round((monthBuckets[key] ?? 0) / 100),
      });
    }
```

par :

```ts
    // Fenêtre glissante 12 mois (oldest → newest)
    const monthKeys: string[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      monthKeys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    }

    const villasForDetail: VillaInfo[] = (villas ?? []).map((v: any) => ({ id: v.id, name: v.name }));
    const confirmedForDetail: ConfirmedBookingInput[] = (bookings ?? []).map((b: any) => ({
      id: b.id,
      villa_id: b.villa_id,
      guest_name: b.guest_name,
      start_date: b.start_date,
      end_date: b.end_date,
      price: b.price,
      cleaning_fee: b.cleaning_fee,
      service_fee: b.service_fee,
      total_price_cents: b.total_price_cents,
      source: b.source,
    }));
    const cancelledForDetail: MinimalBookingInput[] = (recentNonConfirmed ?? [])
      .filter((b: any) => b.status === "cancelled" || b.status === "refunded")
      .map((b: any) => ({
        villa_id: b.villa_id,
        start_date: b.start_date,
        price: b.price,
        cleaning_fee: b.cleaning_fee,
        service_fee: b.service_fee,
        total_price_cents: b.total_price_cents,
      }));
    const pendingForDetail: MinimalBookingInput[] = (recentNonConfirmed ?? [])
      .filter((b: any) => b.status === "pending")
      .map((b: any) => ({
        villa_id: b.villa_id,
        start_date: b.start_date,
        price: b.price,
        cleaning_fee: b.cleaning_fee,
        service_fee: b.service_fee,
        total_price_cents: b.total_price_cents,
      }));

    const detailResult = buildMonthlyDetails({
      confirmedBookings: confirmedForDetail,
      cancelledBookings: cancelledForDetail,
      pendingBookings: pendingForDetail,
      villas: villasForDetail,
      monthKeys,
    });
    monthlyDetails = detailResult.monthlyDetails;
    monthlyGrossHistory = detailResult.monthlyGrossHistory;

    const monthNames = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];
    monthlyData = monthKeys.map((key) => {
      const monthIndex = Number(key.split("-")[1]) - 1;
      return {
        monthKey: key,
        month: monthNames[monthIndex],
        revenue: Math.round((monthlyDetails[key]?.gross ?? 0) / 100),
      };
    });
```

- [ ] **Step 5: Passer les nouvelles props au client**

Remplacer :

```ts
  return <AdminRevenusClient stats={stats} monthlyData={monthlyData} byVilla={byVilla} error={error} />;
```

par :

```ts
  return (
    <AdminRevenusClient
      stats={stats}
      monthlyData={monthlyData}
      byVilla={byVilla}
      monthlyDetails={monthlyDetails}
      monthlyGrossHistory={monthlyGrossHistory}
      error={error}
    />
  );
```

- [ ] **Step 6: Vérifier les types et le rendu**

Run: `npx tsc --noEmit`
Expected: aucune erreur dans `app/(admin)/admin/revenus/page.tsx` (des erreurs préexistantes sans rapport peuvent subsister ailleurs, ex. `tests/a11y.spec.ts` — ignorer).

Puis démarrer le serveur de dev et vérifier visuellement que `/admin/revenus` charge toujours sans erreur (le nouveau contenu n'est pas encore affiché par le client, Task 10) :

Run: `npm run dev` (si pas déjà lancé), puis ouvrir `http://localhost:3000/admin/revenus` connecté en admin.
Expected: la page se charge normalement (KPIs, graphique, ventilation par villa identiques à avant), aucune erreur dans la console serveur/navigateur liée aux nouvelles props (elles sont acceptées mais pas encore utilisées par `AdminRevenusClient` avant Task 10 — TypeScript peut nécessiter que les props soient présentes dans le type du composant ; si `AdminRevenusClient` n'accepte pas encore ces props, `tsc --noEmit` échouera : dans ce cas, passer directement à Task 10 juste après cette étape avant de committer, ou committer ce Task 6 avec la vérification `tsc` incluant Task 10 — voir note ci-dessous).

**Note d'ordonnancement** : Task 6 passe des props que `AdminRevenusClient` (Task 10) n'accepte pas encore. Pour garder `tsc --noEmit` vert à chaque commit, traiter Tasks 6 et 10 comme un couple : implémenter Task 6, puis enchaîner immédiatement sur Task 7-9 (nouveau composant, n'affecte pas `page.tsx`) et Task 10 avant de committer Task 6 seul si l'on veut un historique commit-par-commit sans état intermédiaire cassé. Alternative plus simple : committer Task 6 en élargissant temporairement le type de props de `AdminRevenusClient` avec `monthlyDetails?: Record<string, MonthDetail>; monthlyGrossHistory?: Record<string, number>;` (optionnels, non utilisés) pour rester vert, puis Task 10 les rend obligatoires et les utilise. **Choisir cette alternative** pour ce plan.

Dans `components/dashboard/admin/AdminRevenusClient.tsx`, ajouter dès Task 6 (avant Task 7-9) les deux props optionnelles au type existant, sans les utiliser :

```ts
  monthlyDetails,
  monthlyGrossHistory,
```

comme props destructurées ignorées, et dans le type :

```ts
  monthlyDetails?: Record<string, import("@/lib/revenue/monthly-detail").MonthDetail>;
  monthlyGrossHistory?: Record<string, number>;
```

- [ ] **Step 7: Commit**

```bash
git add "app/(admin)/admin/revenus/page.tsx" components/dashboard/admin/AdminRevenusClient.tsx
git commit -m "feat(admin): wire buildMonthlyDetails into /admin/revenus data fetch"
```

---

### Task 7: `RevenueMonthDetail.tsx` — en-tête, cartes de synthèse, widgets annulé/pipeline, état vide

**Files:**
- Create: `components/dashboard/admin/RevenueMonthDetail.tsx`

**Interfaces:**
- Consumes: `MonthDetail` type from `@/lib/revenue/monthly-detail` (Task 3) ; `formatCurrency` from `@/lib/utils` ; `KayvilaPngIcon` from `@/components/icons/KayvilaPngIcon`.
- Produces: `RevenueMonthDetail({ detail, momChangePct, yoyChangePct }: { detail: MonthDetail; momChangePct: number | null; yoyChangePct: number | null })` — export nommé, consommé par `AdminRevenusClient.tsx` (Task 10). Étendu en Task 8 (tableaux villa/canal) et Task 9 (accordéon + export CSV) dans le même fichier.

- [ ] **Step 1: Créer le composant**

Create `components/dashboard/admin/RevenueMonthDetail.tsx` :

```tsx
"use client";

import { KayvilaPngIcon } from "@/components/icons/KayvilaPngIcon";
import { formatCurrency } from "@/lib/utils";
import type { MonthDetail } from "@/lib/revenue/monthly-detail";

function ComparisonBadge({ label, pct }: { label: string; pct: number | null }) {
  if (pct === null) {
    return (
      <span className="inline-flex items-center rounded-full bg-navy/[0.05] px-2.5 py-1 text-[11px] font-medium text-navy/50">
        {label} : nouveau
      </span>
    );
  }
  const positive = pct >= 0;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium ${
        positive ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
      }`}
    >
      {positive ? "+" : ""}
      {pct}% {label}
    </span>
  );
}

export function RevenueMonthDetail({
  detail,
  momChangePct,
  yoyChangePct,
}: {
  detail: MonthDetail;
  momChangePct: number | null;
  yoyChangePct: number | null;
}) {
  const summaryCards = [
    { label: "CA brut", value: formatCurrency(detail.gross) },
    {
      label: "Commission Kayvila",
      value: formatCurrency(detail.platformTotal),
      subtitle: `Nuitées ${formatCurrency(detail.platformOnStay)} · Ménage ${formatCurrency(detail.platformCleaning)} · Service ${formatCurrency(detail.platformService)}`,
    },
    { label: "Reversement propriétaires", value: formatCurrency(detail.ownerNet) },
    { label: "Réservations confirmées", value: String(detail.bookingCount) },
    { label: "Nuitées vendues", value: String(detail.nightsSold) },
    { label: "Prix moyen/nuit (ADR)", value: formatCurrency(detail.adr) },
    { label: "Taux d'occupation", value: `${detail.occupancyRate}%` },
    { label: "Panier moyen", value: formatCurrency(detail.avgBasket) },
  ];

  return (
    <div className="space-y-6 rounded-lg border bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-navy">Détail — {detail.label}</h3>
        <div className="flex flex-wrap gap-2">
          <ComparisonBadge label="vs mois précédent" pct={momChangePct} />
          <ComparisonBadge label="vs année dernière" pct={yoyChangePct} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card) => (
          <div key={card.label} className="rounded-lg border border-navy/[0.06] bg-navy/[0.015] p-4">
            <span className="text-[11px] uppercase tracking-[0.08em] text-navy/45">{card.label}</span>
            <p className="mt-1 text-xl font-semibold text-navy">{card.value}</p>
            {card.subtitle ? <p className="mt-1 text-[11px] text-navy/40">{card.subtitle}</p> : null}
          </div>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-red-100 bg-red-50/50 p-4">
          <span className="text-[11px] uppercase tracking-[0.08em] text-red-700/70">Annulé ce mois</span>
          <p className="mt-1 text-lg font-semibold text-red-700">
            {detail.cancelled.count} · {formatCurrency(detail.cancelled.lostGross)}
          </p>
        </div>
        <div className="rounded-lg border border-navy/10 bg-navy/[0.02] p-4">
          <span className="text-[11px] uppercase tracking-[0.08em] text-navy/50">En attente (pipeline)</span>
          <p className="mt-1 text-lg font-semibold text-navy">
            {detail.pending.count} · {formatCurrency(detail.pending.potentialGross)}
          </p>
        </div>
      </div>

      {detail.bookingCount === 0 ? (
        <div className="rounded-lg border border-dashed border-navy/15 p-8 text-center">
          <KayvilaPngIcon name="calendar" size={28} alt="" className="mx-auto opacity-40" />
          <p className="mt-3 text-sm text-navy/50">Aucune réservation confirmée ce mois-ci.</p>
        </div>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 2: Vérifier les types**

Run: `npx tsc --noEmit`
Expected: aucune nouvelle erreur liée à `RevenueMonthDetail.tsx` (le composant n'est pas encore utilisé ailleurs, donc pas d'erreur d'import cassé possible à ce stade).

- [ ] **Step 3: Commit**

```bash
git add components/dashboard/admin/RevenueMonthDetail.tsx
git commit -m "feat(admin): add RevenueMonthDetail base (summary cards, comparison badges, empty state)"
```

---

### Task 8: `RevenueMonthDetail.tsx` — tableau récap par villa et répartition par canal

**Files:**
- Modify: `components/dashboard/admin/RevenueMonthDetail.tsx`

**Interfaces:**
- Consumes: `detail.byVilla: VillaMonthRow[]`, `detail.byChannel: ChannelMonthRow[]` (déjà dans `MonthDetail`, Task 3).

- [ ] **Step 1: Remplacer le bloc d'état vide par la branche conditionnelle complète**

Remplacer :

```tsx
      {detail.bookingCount === 0 ? (
        <div className="rounded-lg border border-dashed border-navy/15 p-8 text-center">
          <KayvilaPngIcon name="calendar" size={28} alt="" className="mx-auto opacity-40" />
          <p className="mt-3 text-sm text-navy/50">Aucune réservation confirmée ce mois-ci.</p>
        </div>
      ) : null}
```

par :

```tsx
      {detail.bookingCount === 0 ? (
        <div className="rounded-lg border border-dashed border-navy/15 p-8 text-center">
          <KayvilaPngIcon name="calendar" size={28} alt="" className="mx-auto opacity-40" />
          <p className="mt-3 text-sm text-navy/50">Aucune réservation confirmée ce mois-ci.</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-navy/[0.02] border-b border-navy/[0.05]">
                <tr className="text-left text-[11px] font-semibold uppercase tracking-[0.1em] text-navy/50">
                  <th className="px-4 py-3">Villa</th>
                  <th className="px-4 py-3 text-right">CA brut</th>
                  <th className="px-4 py-3 text-right">Nuitées</th>
                  <th className="px-4 py-3 text-right">Occupation</th>
                  <th className="px-4 py-3 text-right">ADR</th>
                  <th className="px-4 py-3 text-right">Commission</th>
                  <th className="px-4 py-3 text-right">Reversement</th>
                  <th className="px-4 py-3 text-right">Résas</th>
                  <th className="px-4 py-3 text-right">% du mois</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy/[0.05]">
                {detail.byVilla.map((v) => (
                  <tr key={v.villaId} className="hover:bg-navy/[0.01]">
                    <td className="px-4 py-3 font-medium text-navy">{v.name}</td>
                    <td className="px-4 py-3 text-right text-navy">{formatCurrency(v.gross)}</td>
                    <td className="px-4 py-3 text-right text-navy/70">{v.nightsSold}</td>
                    <td className="px-4 py-3 text-right text-navy/70">{v.occupancyRate}%</td>
                    <td className="px-4 py-3 text-right text-navy/70">{formatCurrency(v.adr)}</td>
                    <td className="px-4 py-3 text-right text-gold">{formatCurrency(v.platformTotal)}</td>
                    <td className="px-4 py-3 text-right text-navy/70">{formatCurrency(v.ownerNet)}</td>
                    <td className="px-4 py-3 text-right text-navy/60">{v.bookingCount}</td>
                    <td className="px-4 py-3 text-right text-navy/60">{v.shareOfMonthPct}%</td>
                  </tr>
                ))}
                <tr className="bg-navy/[0.02] font-semibold text-navy">
                  <td className="px-4 py-3">Total</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(detail.gross)}</td>
                  <td className="px-4 py-3 text-right">{detail.nightsSold}</td>
                  <td className="px-4 py-3 text-right">{detail.occupancyRate}%</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(detail.adr)}</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(detail.platformTotal)}</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(detail.ownerNet)}</td>
                  <td className="px-4 py-3 text-right">{detail.bookingCount}</td>
                  <td className="px-4 py-3 text-right">100%</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-navy/[0.02] border-b border-navy/[0.05]">
                <tr className="text-left text-[11px] font-semibold uppercase tracking-[0.1em] text-navy/50">
                  <th className="px-4 py-3">Canal</th>
                  <th className="px-4 py-3 text-right">CA brut</th>
                  <th className="px-4 py-3 text-right">% du mois</th>
                  <th className="px-4 py-3 text-right">Taux commission</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy/[0.05]">
                {detail.byChannel.map((c) => (
                  <tr key={c.channel} className="hover:bg-navy/[0.01]">
                    <td className="px-4 py-3 font-medium text-navy">{c.channel}</td>
                    <td className="px-4 py-3 text-right text-navy">{formatCurrency(c.gross)}</td>
                    <td className="px-4 py-3 text-right text-navy/60">{c.sharePct}%</td>
                    <td className="px-4 py-3 text-right text-navy/60">{c.commissionRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
```

- [ ] **Step 2: Vérifier les types**

Run: `npx tsc --noEmit`
Expected: aucune nouvelle erreur.

- [ ] **Step 3: Commit**

```bash
git add components/dashboard/admin/RevenueMonthDetail.tsx
git commit -m "feat(admin): add villa and channel breakdown tables to RevenueMonthDetail"
```

---

### Task 9: `RevenueMonthDetail.tsx` — réservations groupées par villa (accordéon) + export CSV du mois

**Files:**
- Modify: `components/dashboard/admin/RevenueMonthDetail.tsx`

**Interfaces:**
- Consumes: `detail.bookings: MonthBookingRow[]` (Task 3).
- Produces: comportement d'export CSV déclenché par un clic bouton, testé en Playwright (Task 11).

- [ ] **Step 1: Ajouter les imports et l'état d'ouverture des accordéons**

Remplacer :

```tsx
"use client";

import { KayvilaPngIcon } from "@/components/icons/KayvilaPngIcon";
import { formatCurrency } from "@/lib/utils";
import type { MonthDetail } from "@/lib/revenue/monthly-detail";
```

par :

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { KayvilaPngIcon } from "@/components/icons/KayvilaPngIcon";
import { formatCurrency } from "@/lib/utils";
import type { MonthDetail, MonthBookingRow } from "@/lib/revenue/monthly-detail";
```

- [ ] **Step 2: Ajouter l'état et les fonctions dans le corps du composant**

Juste après `}: { ... }) {` (début du corps de `RevenueMonthDetail`), avant `const summaryCards = [...]`, ajouter :

```tsx
  const [openVillaIds, setOpenVillaIds] = useState<Set<string>>(new Set());
  const toggleVilla = (villaId: string) => {
    setOpenVillaIds((prev) => {
      const next = new Set(prev);
      if (next.has(villaId)) next.delete(villaId);
      else next.add(villaId);
      return next;
    });
  };

  const bookingsByVilla = new Map<string, MonthBookingRow[]>();
  for (const b of detail.bookings) {
    const list = bookingsByVilla.get(b.villaId) ?? [];
    list.push(b);
    bookingsByVilla.set(b.villaId, list);
  }

  const handleExportMonth = () => {
    const rows = [
      ["Client", "Villa", "Arrivée", "Départ", "Nuits", "Canal", "CA brut (€)", "Commission (€)", "Reversement (€)"],
      ...detail.bookings.map((b) => [
        b.guestName,
        b.villaName,
        b.startDate,
        b.endDate,
        String(b.nights),
        b.channel,
        (b.gross / 100).toFixed(0),
        (b.platform / 100).toFixed(0),
        (b.owner / 100).toFixed(0),
      ]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `revenus-${detail.monthKey}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };
```

- [ ] **Step 3: Ajouter l'accordéon et le bouton d'export dans le JSX**

Dans la branche `: (<> ... </>)` de Task 8, juste après la fermeture du `<div>` du tableau canal (avant le `</>`), ajouter :

```tsx
          <div className="space-y-2">
            {detail.byVilla.map((v) => {
              const rows = bookingsByVilla.get(v.villaId) ?? [];
              const isOpen = openVillaIds.has(v.villaId);
              return (
                <div key={v.villaId} className="rounded-lg border">
                  <button
                    type="button"
                    onClick={() => toggleVilla(v.villaId)}
                    className="flex w-full items-center justify-between px-4 py-3 text-left"
                  >
                    <span className="flex items-center gap-2 text-sm font-medium text-navy">
                      <KayvilaPngIcon name="villa" size={16} alt="" />
                      {v.name}
                      <Link
                        href={`/admin/reservations?villa=${v.villaId}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-[11px] font-normal text-gold hover:underline"
                      >
                        voir tout
                      </Link>
                    </span>
                    <span className="text-xs text-navy/60">
                      {formatCurrency(v.gross)} brut · {formatCurrency(v.ownerNet)} reversé
                    </span>
                  </button>
                  {isOpen ? (
                    <table className="w-full border-t text-sm">
                      <thead className="bg-navy/[0.02]">
                        <tr className="text-left text-[11px] uppercase tracking-[0.08em] text-navy/45">
                          <th className="px-4 py-2">Client</th>
                          <th className="px-4 py-2">Dates</th>
                          <th className="px-4 py-2 text-right">Nuits</th>
                          <th className="px-4 py-2 text-right">Canal</th>
                          <th className="px-4 py-2 text-right">Brut</th>
                          <th className="px-4 py-2 text-right">Commission</th>
                          <th className="px-4 py-2 text-right">Net</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-navy/[0.05]">
                        {rows.map((b) => (
                          <tr key={b.id}>
                            <td className="px-4 py-2 text-navy">{b.guestName}</td>
                            <td className="px-4 py-2 text-navy/70">
                              {b.startDate} → {b.endDate}
                            </td>
                            <td className="px-4 py-2 text-right text-navy/70">{b.nights}</td>
                            <td className="px-4 py-2 text-right text-navy/60">{b.channel}</td>
                            <td className="px-4 py-2 text-right text-navy">{formatCurrency(b.gross)}</td>
                            <td className="px-4 py-2 text-right text-gold">{formatCurrency(b.platform)}</td>
                            <td className="px-4 py-2 text-right text-navy/70">{formatCurrency(b.owner)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : null}
                </div>
              );
            })}
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleExportMonth}
              className="inline-flex items-center gap-2 rounded-xl border border-navy/10 px-4 py-2.5 text-sm font-semibold text-navy hover:bg-navy/5"
            >
              <KayvilaPngIcon name="download" size={18} alt="" />
              Exporter ce mois
            </button>
          </div>
```

- [ ] **Step 4: Vérifier les types et le rendu**

Run: `npx tsc --noEmit`
Expected: aucune nouvelle erreur.

- [ ] **Step 5: Commit**

```bash
git add components/dashboard/admin/RevenueMonthDetail.tsx
git commit -m "feat(admin): add per-villa booking accordion and month CSV export to RevenueMonthDetail"
```

---

### Task 10: `AdminRevenusClient.tsx` — graphique cliquable, sélecteur de mois, intégration du panneau détail

**Files:**
- Modify: `components/dashboard/admin/AdminRevenusClient.tsx`

**Interfaces:**
- Consumes: `RevenueMonthDetail` (Tasks 7-9), `computeMomChange`/`shiftMonthKey` (Task 2), `MonthDetail` (Task 3).
- Produces: composant final assemblé, testé end-to-end en Task 11.

- [ ] **Step 1: Remplacer le fichier entier**

Le fichier change sur suffisamment de points (imports, state, props, JSX du graphique) pour le réécrire en entier plutôt qu'en diffs partiels. Remplacer tout le contenu de `components/dashboard/admin/AdminRevenusClient.tsx` par :

```tsx
"use client";

import { useState } from "react";
import { BarChart3, DollarSign } from "lucide-react";
import { KayvilaPngIcon } from "@/components/icons/KayvilaPngIcon";
import { formatCurrency } from "@/lib/utils";
import { AdminPageIntro } from "@/components/dashboard/admin/AdminPageIntro";
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { VillaRevenueRow, RevenueStats } from "@/app/(admin)/admin/revenus/page";
import type { MonthDetail } from "@/lib/revenue/monthly-detail";
import { computeMomChange, shiftMonthKey } from "@/lib/revenue/monthly-comparison";
import { RevenueMonthDetail } from "./RevenueMonthDetail";

type MonthlyChartPoint = { monthKey: string; month: string; revenue: number };

export function AdminRevenusClient({
  stats,
  monthlyData,
  byVilla,
  monthlyDetails,
  monthlyGrossHistory,
  error,
}: {
  stats: RevenueStats;
  monthlyData: MonthlyChartPoint[];
  byVilla: VillaRevenueRow[];
  monthlyDetails: Record<string, MonthDetail>;
  monthlyGrossHistory: Record<string, number>;
  error: string | null;
}) {
  const defaultMonthKey = monthlyData[monthlyData.length - 1]?.monthKey ?? "";
  const [selectedMonthKey, setSelectedMonthKey] = useState(defaultMonthKey);

  const exportCSV = () => {
    const rows = [
      ["Villa", "CA total (€)", "Commission Kayvila (€)", "Reversement proprio (€)", "Réservations"],
      ...byVilla.map((v) => [
        v.name,
        (v.gross / 100).toFixed(0),
        (v.platform / 100).toFixed(0),
        (v.owner / 100).toFixed(0),
        v.count,
      ]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kayvila-revenus-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const selectedDetail = monthlyDetails[selectedMonthKey];
  const momChangePct = selectedDetail
    ? computeMomChange(selectedDetail.gross, monthlyGrossHistory[shiftMonthKey(selectedMonthKey, -1)] ?? 0)
    : null;
  const yoyChangePct = selectedDetail
    ? computeMomChange(selectedDetail.gross, monthlyGrossHistory[shiftMonthKey(selectedMonthKey, -12)] ?? 0)
    : null;

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <AdminPageIntro
          title="Revenus"
          description="Commission selon canal de réservation (20% OTA · 22% direct)"
        />
        {byVilla.length > 0 && (
          <button
            onClick={exportCSV}
            className="inline-flex shrink-0 items-center gap-2 self-start rounded-xl bg-navy px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy/90"
          >
            <KayvilaPngIcon name="download" size={18} alt="" />
            Export CSV
          </button>
        )}
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="grid gap-6 sm:grid-cols-3">
        {[
          { label: "Ce mois (brut)", value: stats.monthGross, icon: "trending-up" },
          { label: "Cette année (brut)", value: stats.yearGross, icon: "barChart3" },
          { label: "Total historique (brut)", value: stats.allTimeGross, icon: "dollarSign" },
        ].map(({ label, value, icon }) => (
          <div key={label} className="rounded-lg border bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">{label}</span>
              {icon === "trending-up" ? (
                <KayvilaPngIcon name="trending-up" size={18} alt="" />
              ) : icon === "barChart3" ? (
                <BarChart3 className="h-4 w-4 text-gray-400" />
              ) : (
                <DollarSign className="h-4 w-4 text-gray-400" />
              )}
            </div>
            <p className="mt-2 text-3xl font-semibold text-navy">{formatCurrency(value)}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        <div className="rounded-lg border bg-gradient-to-br from-gold/5 to-gold/[0.02] p-6 shadow-sm">
          <span className="text-sm text-navy/60">Commission Kayvila (net plateforme)</span>
          <p className="mt-2 text-3xl font-semibold text-gold">
            {formatCurrency(stats.allTimePlatform)}
          </p>
        </div>
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <span className="text-sm text-gray-500">Reversement propriétaires (net)</span>
          <p className="mt-2 text-3xl font-semibold text-navy">
            {formatCurrency(stats.allTimeOwner)}
          </p>
        </div>
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <span className="text-sm text-gray-500">Réservations totales</span>
          <p className="mt-2 text-3xl font-semibold text-navy">{stats.total}</p>
        </div>
      </div>

      {monthlyData.length > 0 ? (
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-navy">CA mensuel brut (12 derniers mois)</h3>
            <select
              aria-label="Sélectionner un mois"
              value={selectedMonthKey}
              onChange={(e) => setSelectedMonthKey(e.target.value)}
              className="min-h-[40px] rounded-full border border-navy/10 bg-white px-3 py-2 text-[11px] text-navy/70 focus:border-gold/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/40"
            >
              {monthlyData.map((point) => (
                <option key={point.monthKey} value={point.monthKey}>
                  {monthlyDetails[point.monthKey]?.label ?? point.month}
                </option>
              ))}
            </select>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}€`} />
              <Tooltip />
              <Bar
                dataKey="revenue"
                radius={[4, 4, 0, 0]}
                cursor="pointer"
                onClick={(data: any) => setSelectedMonthKey(data.payload.monthKey)}
              >
                {monthlyData.map((point) => (
                  <Cell
                    key={point.monthKey}
                    fill={point.monthKey === selectedMonthKey ? "#D4AF37" : "#D4AF3766"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="rounded-lg border bg-white p-8 text-center">
          <BarChart3 className="mx-auto h-10 w-10 text-gray-300" />
          <p className="mt-4 text-sm text-gray-500">Aucune donnée de revenus disponible.</p>
        </div>
      )}

      {selectedDetail ? (
        <RevenueMonthDetail
          detail={selectedDetail}
          momChangePct={momChangePct}
          yoyChangePct={yoyChangePct}
        />
      ) : null}

      {byVilla.length > 0 && (
        <div className="rounded-lg border bg-white shadow-sm">
          <div className="px-6 py-4 border-b border-navy/[0.06]">
            <h3 className="text-sm font-semibold text-navy flex items-center gap-2">
              <KayvilaPngIcon name="villa" size={18} alt="" className="text-navy/60" />
              Ventilation par villa
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-navy/[0.02] border-b border-navy/[0.05]">
                <tr className="text-left text-[11px] font-semibold uppercase tracking-[0.1em] text-navy/50">
                  <th className="px-6 py-3">Villa</th>
                  <th className="px-6 py-3 text-right">CA brut</th>
                  <th className="px-6 py-3 text-right">Commission Kayvila</th>
                  <th className="px-6 py-3 text-right">Reversement</th>
                  <th className="px-6 py-3 text-right">Résas</th>
                  <th className="px-6 py-3 text-right">Canal maj.</th>
                  <th className="px-6 py-3 text-right">Taux</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy/[0.05]">
                {byVilla.map((v) => (
                  <tr key={v.name} className="hover:bg-navy/[0.01]">
                    <td className="px-6 py-3 font-medium text-navy">{v.name}</td>
                    <td className="px-6 py-3 text-right font-medium text-navy">
                      {formatCurrency(v.gross)}
                    </td>
                    <td className="px-6 py-3 text-right text-gold font-medium">
                      {formatCurrency(v.platform)}
                    </td>
                    <td className="px-6 py-3 text-right text-navy/70">
                      {formatCurrency(v.owner)}
                    </td>
                    <td className="px-6 py-3 text-right text-navy/60">{v.count}</td>
                    <td className="px-6 py-3 text-right text-navy/60 text-xs">{v.dominantSource}</td>
                    <td className="px-6 py-3 text-right">
                      <span className={`text-xs font-medium ${v.commissionRate === 20 ? 'text-amber-600' : 'text-navy'}`}>
                        {v.commissionRate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Vérifier les types**

Run: `npx tsc --noEmit`
Expected: aucune erreur dans `AdminRevenusClient.tsx`, `RevenueMonthDetail.tsx` ou `page.tsx`.

- [ ] **Step 3: Vérifier visuellement**

Run: `npm run dev` (si pas déjà lancé), ouvrir `http://localhost:3000/admin/revenus` connecté en admin.
Expected : le graphique 12 mois s'affiche, la barre du mois courant est en or plein (les autres légèrement translucides), un menu déroulant au-dessus du graphique liste les 12 mois avec leur nom complet, cliquer une barre ou changer le menu déroulant met à jour le panneau "Détail — {Mois Année}" en dessous avec les cartes, widgets, tableaux et l'accordéon par villa.

- [ ] **Step 4: Commit**

```bash
git add components/dashboard/admin/AdminRevenusClient.tsx
git commit -m "feat(admin): clickable revenue chart with month selector and detail panel"
```

---

### Task 11: test Playwright end-to-end

**Files:**
- Create: `tests/e2e/admin-revenus-month-detail.spec.ts`

**Interfaces:**
- Consumes: flux de login admin déjà établi dans `tests/e2e/admin-copilot.spec.ts` (mêmes sélecteurs `#email-pass`/`#password-pass`, même variables d'env `ADMIN_E2E_EMAIL`/`ADMIN_E2E_PASSWORD`).

- [ ] **Step 1: Écrire le test**

Create `tests/e2e/admin-revenus-month-detail.spec.ts` :

```ts
import { test, expect } from "@playwright/test";

const BASE = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";
const ADMIN_EMAIL = process.env.ADMIN_E2E_EMAIL || "admin@diamantnoir.com";
const ADMIN_PASSWORD = process.env.ADMIN_E2E_PASSWORD || "Admin123!";

test("admin revenus — sélection de mois affiche le panneau détail", async ({ page }) => {
  await page.goto(`${BASE}/login?redirect=/admin/revenus`);
  await page.locator("#email-pass").fill(ADMIN_EMAIL);
  await page.locator("#password-pass").fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: /accéder/i }).click();
  await page.waitForURL("**/admin/revenus", { timeout: 15000 });

  await expect(page.getByText("Détail — ", { exact: false })).toBeVisible({ timeout: 10000 });

  const monthSelect = page.getByLabel("Sélectionner un mois");
  const options = await monthSelect.locator("option").allTextContents();
  expect(options.length).toBe(12);

  const otherMonthLabel = options[0];
  await monthSelect.selectOption({ label: otherMonthLabel });
  await expect(page.getByText(`Détail — ${otherMonthLabel}`)).toBeVisible({ timeout: 10000 });

  // Répartition par canal et tableau villa présents seulement s'il y a des réservations ce mois
  const emptyState = page.getByText("Aucune réservation confirmée ce mois-ci.");
  const exportButton = page.getByRole("button", { name: "Exporter ce mois" });
  const isEmpty = await emptyState.isVisible().catch(() => false);

  if (isEmpty) {
    await expect(exportButton).not.toBeVisible();
  } else {
    await expect(page.getByRole("columnheader", { name: "Occupation" })).toBeVisible();
    const downloadPromise = page.waitForEvent("download");
    await exportButton.click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/^revenus-\d{4}-\d{2}\.csv$/);
  }
});
```

- [ ] **Step 2: Run the test**

Run: `npx playwright test tests/e2e/admin-revenus-month-detail.spec.ts`
Expected: PASS. Si le test échoue à l'étape de login, vérifier que `ADMIN_E2E_EMAIL`/`ADMIN_E2E_PASSWORD` correspondent à un compte admin existant dans l'environnement de test (mêmes variables que `tests/e2e/admin-copilot.spec.ts`, déjà en usage).

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/admin-revenus-month-detail.spec.ts
git commit -m "test(e2e): cover month selection and CSV export on /admin/revenus"
```
