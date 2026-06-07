# Retours Richard — Plan d'implémentation (2026-06-07)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implémenter les 9 retours de Richard du 7 Juin 2026 sur les espaces Admin, Locataire, et Propriétaire.

**Architecture:** Modifications ciblées sur l'existant : fix scroll (1 ligne), enrichissement calculs de revenus (OTA 20% / Direct 25%), nouvelles API routes (seasonal-rates CRUD, PDF relevé), nouveaux composants (ReportIssueButton, OwnerMessaging), et améliorations UI (indicatif téléphonique, miniatures villas, empty states).

**Tech Stack:** Next.js 14, Supabase, Stripe Connect, Resend, Tailwind CSS, HeroUI Pro, @react-pdf/renderer

---

## Fichiers modifiés ou créés

| Fichier | Action |
|---------|--------|
| `components/espace-client/TenantChatbot.tsx` | Modifier — fix scroll |
| `lib/revenue/booking-revenue.ts` | Modifier — getCommissionRate() |
| `app/api/admin/revenue/route.ts` | Modifier — source, taux, canal |
| `app/(admin)/admin/revenus/page.tsx` | Modifier — sous-titre, colonnes |
| `app/(proprio)/dashboard/reservations/page.tsx` | Modifier — empty state |
| `app/(proprio)/dashboard/revenus/page.tsx` | Modifier — tableau + PDF btn |
| `app/api/proprio/releve/route.ts` | Créer — PDF mensuel |
| `components/dashboard/admin/AdminVillasDataGrid.tsx` | Modifier — fallback image_urls |
| `app/(admin)/admin/villas/page.tsx` | Modifier — select image_urls |
| `components/dashboard/admin/SeasonalRatesManager.tsx` | Modifier — validation + API |
| `app/api/admin/seasonal-rates/route.ts` | Créer — CRUD + validation |
| `components/espace-client/ProfileForm.tsx` | Modifier — sélecteur indicatif |
| `components/dashboard/proprio/ReportIssueButton.tsx` | Créer — signalement |
| `app/(proprio)/dashboard/taches/page.tsx` | Modifier — bouton signalement |
| `app/(proprio)/dashboard/messages/page.tsx` | Créer — messagerie |
| `components/dashboard/proprio/OwnerMessaging.tsx` | Créer — composant chat |

**Total : 16 fichiers (10 modifiés, 6 créés)**

---

### Task 1: 🔴 Fix scroll messagerie locataire

**Files:**
- Modify: `components/espace-client/TenantChatbot.tsx`

- [ ] **Step 1: Ajouter un useRef sur le conteneur de messages**

Lire le fichier. Ligne ~26 (imports), ajouter `useRef` si absent (il l'est déjà pour `endRef`). Ligne ~76, ajouter un nouveau ref :

```typescript
const messagesContainerRef = useRef<HTMLDivElement>(null);
```

- [ ] **Step 2: Remplacer scrollIntoView par scrollTop sur le conteneur**

Remplacer le `useEffect` lignes 113-115 :

```typescript
// AVANT (lignes 113-115)
useEffect(() => {
  endRef.current?.scrollIntoView({ behavior: "smooth" });
}, [messages, loading]);

// APRÈS
useEffect(() => {
  if (messagesContainerRef.current) {
    messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
  }
}, [messages, loading]);
```

- [ ] **Step 3: Lier le ref au conteneur de messages**

Trouver le div avec `overflow-y-auto` (ligne ~201) et ajouter le ref :

```tsx
// AVANT
<div
  className="flex-1 min-h-0 overflow-y-auto px-5 py-5 space-y-4"
  role="log"
  ...
>

// APRÈS
<div
  ref={messagesContainerRef}
  className="flex-1 min-h-0 overflow-y-auto px-5 py-5 space-y-4"
  role="log"
  ...
>
```

Garder le `<div ref={endRef} />` à la fin — il ne fait plus rien mais ne gêne pas.

- [ ] **Step 4: Vérifier visuellement**

```bash
cd diamant-noir && npm run dev
```

Ouvrir `/espace-client/messagerie`, vérifier que le header `PageTopbar` reste visible au chargement et que la conversation est scrollée au dernier message.

- [ ] **Step 5: Commit**

```bash
git add components/espace-client/TenantChatbot.tsx
git commit -m "fix: scroll messagerie locataire — scrollTop conteneur au lieu de scrollIntoView page"
```

---

### Task 2: 🟡 Lib revenus — getCommissionRate()

**Files:**
- Modify: `lib/revenue/booking-revenue.ts`

- [ ] **Step 1: Ajouter la fonction getCommissionRate et les constantes OTA**

Avant la fonction `stayCentsFromBooking` (ligne ~11), ajouter :

```typescript
const OTA_SOURCES = ['airbnb', 'expedia', 'trivago', 'vrbo', 'booking', 'ical'];

export function getCommissionRate(source: string | null): number {
  if (source && OTA_SOURCES.includes(source)) return 20;
  return 25; // direct, manual, admin, ou null → 25%
}
```

- [ ] **Step 2: Modifier ownerNetCents pour accepter source**

```typescript
// AVANT
export function ownerNetCents(
  b: BookingRevenueInput,
  commissionRate = 25
): number { ... }

// APRÈS
export function ownerNetCents(
  b: BookingRevenueInput,
  commissionRateOrSource?: number | string | null
): number {
  const commissionRate = typeof commissionRateOrSource === 'number'
    ? commissionRateOrSource
    : getCommissionRate(commissionRateOrSource ?? null);
  // ... reste inchangé
}
```

- [ ] **Step 3: Modifier platformFeeCents pour accepter source**

Même transformation que `ownerNetCents` — le paramètre `commissionRate` devient `commissionRateOrSource` avec la même logique.

- [ ] **Step 4: Vérifier que la fonction existante fonctionne encore**

```bash
cd diamant-noir && npm run build
```

- [ ] **Step 5: Commit**

```bash
git add lib/revenue/booking-revenue.ts
git commit -m "feat: getCommissionRate — 20% OTA, 25% direct selon booking.source"
```

---

### Task 3: 🟡 Admin revenus — API route + page

**Files:**
- Modify: `app/api/admin/revenue/route.ts`
- Modify: `app/(admin)/admin/revenus/page.tsx`

- [ ] **Step 1: API — Ajouter source dans la query et passer aux calculs**

Dans `app/api/admin/revenue/route.ts`, modifier la query Supabase ligne ~22 pour ajouter `source` :

```typescript
// AVANT
.select("id, villa_id, start_date, status, payment_status, price, cleaning_fee, service_fee, total_price_cents, villas(name, commission_rate)")

// APRÈS
.select("id, villa_id, start_date, status, payment_status, price, cleaning_fee, service_fee, total_price_cents, source, villas(name, commission_rate)")
```

Puis importer `getCommissionRate` en haut du fichier :

```typescript
import {
  grossCentsFromBooking,
  ownerNetCents,
  platformFeeCents,
  getCommissionRate,
} from "@/lib/revenue/booking-revenue";
```

- [ ] **Step 2: API — Passer source aux calculs**

Modifier les appels dans la boucle `villaRevenue` (lignes ~86-89). Remplacer le paramètre `rate` par `b.source` :

```typescript
// AVANT
const rate = rateFor(b);
villaRevenue[vid].platform += platformFeeCents(b, rate);
villaRevenue[vid].owner += ownerNetCents(b, rate);

// APRÈS
const rate = rateFor(b);
villaRevenue[vid].platform += platformFeeCents(b, (b as any).source ?? null);
villaRevenue[vid].owner += ownerNetCents(b, (b as any).source ?? null);
```

Même chose pour `sumPlatform` et `sumOwner` (lignes ~43-46) — utiliser `(b as any).source` au lieu du taux fixe.

- [ ] **Step 3: API — Ajouter canal majoritaire par villa**

Dans la boucle `villaRevenue`, ajouter un compteur de sources :

```typescript
// Après l'initialisation de villaRevenue[vid]
if (!villaRevenue[vid].sourceCounts) {
  (villaRevenue[vid] as any).sourceCounts = {};
}
const src = (b as any).source ?? 'direct';
(villaRevenue[vid] as any).sourceCounts[src] = ((villaRevenue[vid] as any).sourceCounts[src] ?? 0) + 1;
```

Après la boucle, calculer le canal majoritaire et la mapper en français :

```typescript
const SOURCE_LABELS: Record<string, string> = {
  airbnb: 'Airbnb', expedia: 'Expedia', trivago: 'Trivago',
  vrbo: 'Vrbo', booking: 'Booking', ical: 'iCal',
  direct: 'Direct', manual: 'Manuel', admin: 'Admin',
};

// Dans le map final (après la boucle for)
const sourceEntries = Object.entries((v as any).sourceCounts as Record<string, number>);
const dominantSource = sourceEntries.sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'direct';
```

Ajouter dans l'objet retourné :

```typescript
byVilla.push({
  name: v.name,
  gross: v.gross,
  platform: v.platform,
  owner: v.owner,
  count: v.count,
  dominantSource: SOURCE_LABELS[dominantSource] ?? dominantSource,
  commissionRate: getCommissionRate(dominantSource),
});
```

- [ ] **Step 4: Page admin — Modifier le sous-titre**

Dans `app/(admin)/admin/revenus/page.tsx` ligne ~75 :

```tsx
// AVANT
description="CA et commissions via calculateTransferAmounts (25 % séjour + frais)."

// APRÈS
description="Commission selon canal de réservation (20% OTA · 25% direct)"
```

- [ ] **Step 5: Page admin — Mettre à jour le type VillaRow**

```typescript
type VillaRow = {
  name: string;
  gross: number;
  platform: number;
  owner: number;
  count: number;
  dominantSource: string;   // ajouté
  commissionRate: number;   // ajouté
};
```

- [ ] **Step 6: Page admin — Ajouter colonnes Canal + Taux dans le tableau**

Dans le `<thead>` (après `<th className="...">Résas</th>`) :

```tsx
<th className="px-6 py-3 text-right">Canal maj.</th>
<th className="px-6 py-3 text-right">Taux</th>
```

Dans le `<tbody>`, après `<td className="...">{v.count}</td>` :

```tsx
<td className="px-6 py-3 text-right text-navy/60 text-xs">
  {v.dominantSource}
</td>
<td className="px-6 py-3 text-right">
  <span className={`text-xs font-medium ${v.commissionRate === 20 ? 'text-amber-600' : 'text-navy'}`}>
    {v.commissionRate}%
  </span>
</td>
```

- [ ] **Step 7: Build check**

```bash
cd diamant-noir && npm run build
```

- [ ] **Step 8: Commit**

```bash
git add app/api/admin/revenue/route.ts app/(admin)/admin/revenus/page.tsx
git commit -m "feat: admin revenus — taux OTA/direct, canal majoritaire, sous-titre"
```

---

### Task 4: 🟡 Réservations proprio — Empty state

**Files:**
- Modify: `app/(proprio)/dashboard/reservations/page.tsx`

- [ ] **Step 1: Améliorer l'empty state (0 villa)**

Modifier le bloc ligne ~34-50. Remplacer le message actuel :

```tsx
// AVANT (dans le return du cas !villas || villas.length === 0)
<p className="text-sm text-muted">Aucune villa avec des réservations pour le moment.</p>

// APRÈS
<p className="text-sm font-medium text-muted">
  Aucune réservation pour le moment.
</p>
<p className="mt-1 text-xs text-muted">
  Vos réservations apparaîtront ici dès qu'un voyageur réservera votre villa.
</p>
```

- [ ] **Step 2: Build check**

```bash
cd diamant-noir && npm run build
```

- [ ] **Step 3: Commit**

```bash
git add app/(proprio)/dashboard/reservations/page.tsx
git commit -m "feat: empty state réservations proprio amélioré"
```

---

### Task 5: 🟡 Revenus proprio — Tableau ventilation

**Files:**
- Modify: `app/(proprio)/dashboard/revenus/page.tsx`

- [ ] **Step 1: Ajouter le type pour les lignes de réservation**

En haut du fichier, après les imports :

```typescript
type BookingRow = {
  id: string;
  start_date: string;
  villa_name: string;
  guest_name: string;
  gross: number;
  commission: number;
  net: number;
  source: string;
};
```

- [ ] **Step 2: Ajouter la query détaillée**

Après la query `bookings` existante, enrichir avec les champs manquants. Modifier le select pour inclure `guest_name` et `source` :

```typescript
const { data: bookings } = villaIds.length > 0
  ? await supabase
      .from("bookings")
      .select("id, price, cleaning_fee, service_fee, villa_id, start_date, guest_name, source, status")
      .in("villa_id", villaIds)
      .in("status", ["confirmed", "paid"])
      .gte("start_date", sixMonthsAgo)
      .order("start_date", { ascending: false })
  : { data: [] };
```

- [ ] **Step 3: Transformer les données pour le tableau**

```typescript
const bookingRows: BookingRow[] = (bookings ?? []).map((b: any) => {
  const stayCents = Math.round((b.price ?? 0) * 100);
  const cleaningCents = Math.round((b.cleaning_fee ?? 0) * 100);
  const serviceCents = Math.round((b.service_fee ?? 0) * 100);
  const grossCents = stayCents + cleaningCents + serviceCents;
  const rate = getCommissionRate(b.source ?? null);
  const { ownerAmountCents, platformFeeCents } = calculateTransferAmounts(stayCents, cleaningCents, serviceCents, rate);
  return {
    id: b.id,
    start_date: b.start_date,
    villa_name: villaMap.get(b.villa_id) ?? '—',
    guest_name: b.guest_name ?? '—',
    gross: grossCents,
    commission: platformFeeCents,
    net: ownerAmountCents,
    source: b.source ?? 'direct',
  };
});
```

Ajouter `import { getCommissionRate } from "@/lib/revenue/booking-revenue";` en haut.

- [ ] **Step 4: Ajouter le tableau dans le JSX**

Avant le `</div>` final (fin du return), ajouter un état `selectedMonth` pour le filtre et le tableau :

```tsx
const [selectedMonth, setSelectedMonth] = useState<string>(
  `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`
);
```

Puis ajouter le JSX :

```tsx
{bookingRows.length > 0 && (
  <div className="dashboard-card mt-6">
    <div className="flex items-center justify-between mb-4">
      <h3 className="font-display text-lg font-semibold text-navy-900">
        Détail des réservations
      </h3>
      <select
        value={selectedMonth}
        onChange={(e) => setSelectedMonth(e.target.value)}
        className="border border-navy/10 rounded-lg px-3 py-1.5 text-sm bg-white"
      >
        {/* générer les 6 derniers mois */}
        {Array.from({ length: 6 }, (_, i) => {
          const d = new Date(currentYear, currentMonth - i, 1);
          const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          const label = d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
          return <option key={val} value={val}>{label}</option>;
        })}
      </select>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="border-b border-navy/10">
          <tr className="text-left text-[11px] font-semibold uppercase tracking-[0.1em] text-navy/50">
            <th className="px-3 py-2">Date</th>
            <th className="px-3 py-2">Villa</th>
            <th className="px-3 py-2">Voyageur</th>
            <th className="px-3 py-2 text-right">Brut</th>
            <th className="px-3 py-2 text-right">Commission</th>
            <th className="px-3 py-2 text-right">Net</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-navy/5">
          {bookingRows
            .filter((r) => r.start_date.startsWith(selectedMonth))
            .map((r) => (
              <tr key={r.id} className="hover:bg-navy/[0.02]">
                <td className="px-3 py-2 text-navy/70">
                  {new Date(r.start_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                </td>
                <td className="px-3 py-2 font-medium text-navy">{r.villa_name}</td>
                <td className="px-3 py-2 text-navy/70">{r.guest_name}</td>
                <td className="px-3 py-2 text-right text-navy">{formatCurrency(r.gross)}</td>
                <td className="px-3 py-2 text-right text-gold">{formatCurrency(r.commission)}</td>
                <td className="px-3 py-2 text-right font-medium text-navy">{formatCurrency(r.net)}</td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  </div>
)}
```

Ajouter `import { useState } from "react";` en haut.

Ajouter `import { formatCurrency } from "@/lib/utils";` en haut.

- [ ] **Step 5: Build check**

```bash
cd diamant-noir && npm run build
```

- [ ] **Step 6: Commit**

```bash
git add app/(proprio)/dashboard/revenus/page.tsx
git commit -m "feat: proprio revenus — tableau ventilation avec filtre mois"
```

---

### Task 6: 🟡 Revenus proprio — PDF relevé mensuel

**Files:**
- Create: `app/api/proprio/releve/route.ts`
- Create: `components/dashboard/proprio/RelevePDF.tsx` (composant document @react-pdf/renderer)
- Modify: `app/(proprio)/dashboard/revenus/page.tsx`

- [ ] **Step 1: Installer @react-pdf/renderer si absent**

```bash
cd diamant-noir && npm ls @react-pdf/renderer 2>/dev/null || npm install @react-pdf/renderer
```

- [ ] **Step 2: Créer le composant PDF**

Créer `components/dashboard/proprio/RelevePDF.tsx` :

```tsx
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica" },
  header: { marginBottom: 24, borderBottom: "1 solid #D4AF37", paddingBottom: 12 },
  title: { fontSize: 18, color: "#0a1929", marginBottom: 4, fontFamily: "Helvetica-Bold" },
  subtitle: { fontSize: 10, color: "#666" },
  table: { width: "100%", marginTop: 16 },
  th: { flexDirection: "row", borderBottom: "1 solid #0a1929", paddingBottom: 8, marginBottom: 8 },
  thCell: { flex: 1, fontFamily: "Helvetica-Bold", color: "#0a1929" },
  tr: { flexDirection: "row", paddingVertical: 4, borderBottom: "1 solid #eee" },
  td: { flex: 1, color: "#333" },
  totals: { marginTop: 16, borderTop: "1 solid #0a1929", paddingTop: 8 },
  footer: { position: "absolute", bottom: 30, left: 40, right: 40, fontSize: 8, color: "#999", textAlign: "center" },
});

interface Row {
  date: string;
  villa: string;
  guest: string;
  gross: string;
  commission: string;
  net: string;
}

interface RelevePDFProps {
  month: string;
  monthLabel: string;
  rows: Row[];
  totalGross: number;
  totalCommission: number;
  totalNet: number;
}

export function RelevePDF({ month, monthLabel, rows, totalGross, totalCommission, totalNet }: RelevePDFProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Relevé de revenus — Kayvila</Text>
          <Text style={styles.subtitle}>{monthLabel}</Text>
        </View>
        <View style={styles.table}>
          <View style={styles.th}>
            <Text style={styles.thCell}>Date</Text>
            <Text style={styles.thCell}>Villa</Text>
            <Text style={styles.thCell}>Voyageur</Text>
            <Text style={{ ...styles.thCell, textAlign: "right" }}>Brut</Text>
            <Text style={{ ...styles.thCell, textAlign: "right" }}>Commission</Text>
            <Text style={{ ...styles.thCell, textAlign: "right" }}>Net</Text>
          </View>
          {rows.map((r, i) => (
            <View style={styles.tr} key={i}>
              <Text style={styles.td}>{new Date(r.date).toLocaleDateString("fr-FR")}</Text>
              <Text style={styles.td}>{r.villa}</Text>
              <Text style={styles.td}>{r.guest}</Text>
              <Text style={{ ...styles.td, textAlign: "right" }}>{r.gross} €</Text>
              <Text style={{ ...styles.td, textAlign: "right" }}>{r.commission} €</Text>
              <Text style={{ ...styles.td, textAlign: "right" }}>{r.net} €</Text>
            </View>
          ))}
        </View>
        <View style={styles.totals}>
          <View style={styles.tr}>
            <Text style={styles.thCell}>Totaux</Text>
            <Text style={styles.td}></Text>
            <Text style={styles.td}></Text>
            <Text style={{ ...styles.thCell, textAlign: "right" }}>{totalGross} €</Text>
            <Text style={{ ...styles.thCell, textAlign: "right" }}>{totalCommission} €</Text>
            <Text style={{ ...styles.thCell, textAlign: "right" }}>{totalNet} €</Text>
          </View>
        </View>
        <Text style={styles.footer}>
          Kayvila — {new Date().toLocaleDateString("fr-FR")} — Ce document est généré automatiquement.
        </Text>
      </Page>
    </Document>
  );
}
```

- [ ] **Step 3: Créer l'API route PDF**

Créer `app/api/proprio/releve/route.ts` :

```typescript
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getSupabaseServer } from "@/lib/supabase-server";
import { getCommissionRate } from "@/lib/revenue/booking-revenue";
import { renderToBuffer } from "@react-pdf/renderer";
import { RelevePDF } from "@/components/dashboard/proprio/RelevePDF";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month");

  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json({ error: "Paramètre month requis (YYYY-MM)" }, { status: 400 });
  }

  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { data: villas } = await supabase.from("villas").select("id, name").eq("owner_id", user.id);
  const villaMap = new Map((villas ?? []).map((v) => [v.id, v.name]));
  const villaIds = (villas ?? []).map((v) => v.id);

  const monthStart = `${month}-01`;
  const [year, mon] = month.split("-");
  const monthEnd = new Date(Number(year), Number(mon), 0).toISOString().slice(0, 10);

  const admin = supabaseAdmin();
  const { data: bookings } = villaIds.length > 0
    ? await admin
        .from("bookings")
        .select("id, start_date, villa_id, guest_name, price, cleaning_fee, service_fee, source")
        .in("villa_id", villaIds)
        .in("status", ["confirmed", "paid"])
        .gte("start_date", monthStart)
        .lte("start_date", monthEnd)
        .order("start_date", { ascending: true })
    : { data: [] };

  const rows = (bookings ?? []).map((b: any) => {
    const stayCents = Math.round((b.price ?? 0) * 100);
    const cleaningCents = Math.round((b.cleaning_fee ?? 0) * 100);
    const serviceCents = Math.round((b.service_fee ?? 0) * 100);
    const grossCents = stayCents + cleaningCents + serviceCents;
    const rate = getCommissionRate(b.source ?? null);
    const commissionCents = Math.round(stayCents * (rate / 100)) + cleaningCents + serviceCents;
    const netCents = grossCents - commissionCents;
    return {
      date: b.start_date,
      villa: villaMap.get(b.villa_id) ?? "—",
      guest: b.guest_name ?? "—",
      gross: (grossCents / 100).toFixed(0),
      commission: (commissionCents / 100).toFixed(0),
      net: (netCents / 100).toFixed(0),
    };
  });

  const totalGross = rows.reduce((s, r) => s + Number(r.gross), 0);
  const totalCommission = rows.reduce((s, r) => s + Number(r.commission), 0);
  const totalNet = rows.reduce((s, r) => s + Number(r.net), 0);

  const monthLabel = new Date(monthStart).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

  const pdfBuffer = await renderToBuffer(
    RelevePDF({ month, monthLabel, rows, totalGross, totalCommission, totalNet })
  );

  return new NextResponse(pdfBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="releve-${month}-kayvila.pdf"`,
    },
  });
}
```

- [ ] **Step 3: Ajouter le bouton PDF dans la page revenus**

Dans `app/(proprio)/dashboard/revenus/page.tsx`, après le titre :

```tsx
import { Download } from "lucide-react";

// Dans le JSX, après le <h1> :
<div className="flex items-center gap-4 mb-4">
  <a
    href={`/api/proprio/releve?month=${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`}
    download
    className="inline-flex items-center gap-2 rounded-xl bg-gold px-4 py-2 text-sm font-semibold text-white hover:bg-gold/90"
  >
    <Download size={16} />
    Télécharger le relevé
  </a>
</div>
```

- [ ] **Step 3: Build check**

```bash
cd diamant-noir && npm run build
```

- [ ] **Step 5: Commit**

```bash
git add app/api/proprio/releve/route.ts components/dashboard/proprio/RelevePDF.tsx app/(proprio)/dashboard/revenus/page.tsx
git commit -m "feat: proprio revenus — PDF relevé mensuel + bouton téléchargement"
```

---

### Task 7: 🔵 Miniatures villas admin

**Files:**
- Modify: `components/dashboard/admin/AdminVillasDataGrid.tsx`
- Modify: `app/(admin)/admin/villas/page.tsx`

- [ ] **Step 1: DataGrid — Utiliser image_urls comme fallback**

Lire `AdminVillasDataGrid.tsx`. Modifier l'interface `AdminVillaRow` ligne ~12 pour ajouter `image_urls` :

```typescript
export type AdminVillaRow = {
  // ... existant
  image_url: string | null;
  image_urls?: string[] | null;  // ajouté
  // ...
};
```

Modifier la cellule image (lignes ~39-57) :

```typescript
// AVANT
cell: (item) =>
  item.image_url ? (
    <Image src={item.image_url} ... />
  ) : (
    <div className="flex h-10 w-10 ...">...</div>
  ),

// APRÈS
cell: (item) => {
  const imgSrc = item.image_url ?? item.image_urls?.[0];
  return imgSrc ? (
    <Image src={imgSrc} alt="" width={40} height={40} className="h-10 w-10 rounded object-cover" />
  ) : (
    <div className="flex h-10 w-10 items-center justify-center rounded bg-navy/5">
      <Building2 className="h-5 w-5 text-navy/20" aria-hidden />
    </div>
  );
},
```

- [ ] **Step 2: Page villas — Ajouter image_urls au select**

Dans `app/(admin)/admin/villas/page.tsx` ligne ~40 :

```typescript
// AVANT
.select("id, name, location, price_per_night, capacity, collection_tier, owner_id, is_published, image_url")

// APRÈS
.select("id, name, location, price_per_night, capacity, collection_tier, owner_id, is_published, image_url, image_urls")
```

- [ ] **Step 3: Build check**

```bash
cd diamant-noir && npm run build
```

- [ ] **Step 4: Commit**

```bash
git add components/dashboard/admin/AdminVillasDataGrid.tsx app/(admin)/admin/villas/page.tsx
git commit -m "feat: miniatures villas — fallback image_urls[0] si image_url absent"
```

---

### Task 8: 🔵 Anti-chevauchement tarifs saisonniers

**Files:**
- Create: `app/api/admin/seasonal-rates/route.ts`
- Modify: `components/dashboard/admin/SeasonalRatesManager.tsx`

- [ ] **Step 1: Créer l'API route seasonal-rates**

Créer `app/api/admin/seasonal-rates/route.ts` :

```typescript
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAdmin, AuthError } from "@/lib/auth/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST — ajouter un tarif avec validation anti-chevauchement
export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);
    const body = await request.json();
    const { villa_id, label, start_date, end_date, price_per_night } = body;

    if (!villa_id || !label || !start_date || !end_date || !price_per_night) {
      return NextResponse.json({ error: "Tous les champs sont obligatoires." }, { status: 400 });
    }

    if (end_date < start_date) {
      return NextResponse.json({ error: "La date de fin doit être après la date de début." }, { status: 400 });
    }

    const admin = supabaseAdmin();

    // Vérifier chevauchement
    const { data: overlapping } = await admin
      .from("seasonal_rates")
      .select("id, label, start_date, end_date")
      .eq("villa_id", villa_id)
      .lte("start_date", end_date)
      .gte("end_date", start_date);

    if (overlapping && overlapping.length > 0) {
      const overlap = overlapping[0];
      const start = new Date(overlap.start_date).toLocaleDateString("fr-FR");
      const end = new Date(overlap.end_date).toLocaleDateString("fr-FR");
      return NextResponse.json({
        error: `Cette période chevauche une plage existante (${overlap.label} : ${start} – ${end}). Veuillez ajuster les dates.`,
        overlapping: overlap,
      }, { status: 409 });
    }

    const { data, error } = await admin
      .from("seasonal_rates")
      .insert({ villa_id, label, start_date, end_date, price_per_night: Math.round(price_per_night) })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true, rate: data }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[seasonal-rates POST]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE — supprimer un tarif
export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 });

    const { error } = await supabaseAdmin().from("seasonal_rates").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[seasonal-rates DELETE]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
```

- [ ] **Step 2: SeasonalRatesManager — Ajouter validation client**

Dans `SeasonalRatesManager.tsx`, modifier `handleAdd` pour ajouter la vérification avant l'API call :

```typescript
const handleAdd = async () => {
  if (!selectedVilla) return;
  setError("");

  if (!newRate.label || !newRate.start_date || !newRate.end_date || !newRate.price_per_night) {
    setError("Tous les champs sont obligatoires.");
    return;
  }

  if (newRate.end_date < newRate.start_date) {
    setError("La date de fin doit être après la date de début.");
    return;
  }

  // Validation client anti-chevauchement
  const overlap = rates.find((r) =>
    r.start_date <= newRate.end_date && r.end_date >= newRate.start_date
  );
  if (overlap) {
    const start = new Date(overlap.start_date).toLocaleDateString("fr-FR");
    const end = new Date(overlap.end_date).toLocaleDateString("fr-FR");
    setError(`Cette période chevauche une plage existante (${overlap.label} : ${start} – ${end}). Veuillez ajuster les dates.`);
    return;
  }

  setSaving(true);

  const res = await fetch("/api/admin/seasonal-rates", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      villa_id: selectedVilla,
      label: newRate.label,
      start_date: newRate.start_date,
      end_date: newRate.end_date,
      price_per_night: parseInt(newRate.price_per_night),
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    setError(data.error || "Erreur lors de l'ajout.");
  } else {
    setNewRate({ label: "", start_date: "", end_date: "", price_per_night: "" });
    // Recharger
    const { data: fresh } = await supabase
      .from("seasonal_rates")
      .select("*")
      .eq("villa_id", selectedVilla)
      .order("start_date", { ascending: true });
    setRates(fresh ?? []);
  }
  setSaving(false);
};
```

- [ ] **Step 3: SeasonalRatesManager — Migrer handleDelete vers l'API**

```typescript
const handleDelete = async (id: string) => {
  const res = await fetch(`/api/admin/seasonal-rates?id=${id}`, { method: "DELETE" });
  if (res.ok) {
    setRates((prev) => prev.filter((r) => r.id !== id));
  }
};
```

- [ ] **Step 4: Build check**

```bash
cd diamant-noir && npm run build
```

- [ ] **Step 5: Commit**

```bash
git add app/api/admin/seasonal-rates/route.ts components/dashboard/admin/SeasonalRatesManager.tsx
git commit -m "feat: anti-chevauchement tarifs saisonniers — validation client + API"
```

---

### Task 9: 🔵 Indicatif téléphonique locataire

**Files:**
- Modify: `components/espace-client/ProfileForm.tsx`

- [ ] **Step 1: Ajouter l'état countryCode et la logique d'extraction**

Dans `ProfileForm.tsx`, après les states existants (~ligne 33) :

```typescript
const COUNTRY_CODES = [
  { code: "+596", label: "+596 🇲🇶" },
  { code: "+33", label: "+33 🇫🇷" },
  { code: "+1", label: "+1 🇺🇸" },
  { code: "+44", label: "+44 🇬🇧" },
  { code: "+49", label: "+49 🇩🇪" },
  { code: "+39", label: "+39 🇮🇹" },
  { code: "+34", label: "+34 🇪🇸" },
];

// Extraire l'indicatif du numéro stocké
function extractPhoneParts(fullPhone: string): { countryCode: string; localNumber: string } {
  for (const { code } of COUNTRY_CODES) {
    if (fullPhone.startsWith(code)) {
      return { countryCode: code, localNumber: fullPhone.slice(code.length).trim() };
    }
  }
  return { countryCode: "+596", localNumber: fullPhone };
}

const [phoneParts, setPhoneParts] = useState(() => extractPhoneParts(initialPhone));
const [countryCode, setCountryCode] = useState(phoneParts.countryCode);
const [localPhone, setLocalPhone] = useState(phoneParts.localNumber);
```

- [ ] **Step 2: Remplacer le champ téléphone**

Remplacer le bloc `Field id="profile-phone"` (lignes ~192-201) :

```tsx
<Field id="profile-phone" label="Téléphone">
  <div className="flex gap-2">
    <select
      value={countryCode}
      onChange={(e) => setCountryCode(e.target.value)}
      className="w-28 border border-navy/10 bg-white px-3 py-2.5 text-sm rounded-lg focus:outline-none focus:border-gold/50"
      aria-label="Indicatif pays"
    >
      {COUNTRY_CODES.map(({ code, label }) => (
        <option key={code} value={code}>{label}</option>
      ))}
    </select>
    <FieldInput
      id="profile-phone"
      type="tel"
      value={localPhone}
      onChange={(e) => setLocalPhone(e.target.value)}
      disabled={demoMode}
      placeholder="6 96 XX XX XX"
      className="flex-1"
    />
  </div>
</Field>
```

- [ ] **Step 3: Modifier handleSave pour concaténer**

Dans `handleSave` (~ligne 109), remplacer `phone` par la concaténation :

```typescript
const fullPhone = `${countryCode}${localPhone}`.trim();

const { error: updateError } = await supabase.auth.updateUser({
  data: { full_name: name, phone: fullPhone },
});
```

- [ ] **Step 4: Nettoyer — supprimer l'ancien état phone**

Supprimer `const [phone, setPhone] = useState(initialPhone);` (ligne ~33). Remplacer toute référence à `phone` par `localPhone`.

- [ ] **Step 5: Build check**

```bash
cd diamant-noir && npm run build
```

- [ ] **Step 6: Commit**

```bash
git add components/espace-client/ProfileForm.tsx
git commit -m "feat: sélecteur indicatif téléphonique locataire (+596 par défaut)"
```

---

### Task 10: 🔵 Signalement tâches proprio — Composant

**Files:**
- Create: `components/dashboard/proprio/ReportIssueButton.tsx`

- [ ] **Step 1: Créer le composant ReportIssueButton**

Créer `components/dashboard/proprio/ReportIssueButton.tsx` :

```typescript
"use client";

import { useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase";
import { AlertTriangle, Send } from "lucide-react";

const ISSUE_TYPES = [
  "Plomberie", "Électricité", "Clim", "Piscine", "Jardin", "Ménage", "Autre"
] as const;

const PRIORITIES = ["Normal", "Urgent"] as const;

interface ReportIssueButtonProps {
  villaId: string;
  userId: string;
}

export function ReportIssueButton({ villaId, userId }: ReportIssueButtonProps) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<string>("Plomberie");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<string>("Normal");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!description.trim()) {
      setError("Veuillez décrire le problème.");
      return;
    }
    setError("");
    setSending(true);

    const supabase = getSupabaseBrowser();
    if (!supabase) { setSending(false); return; }

    const { error: insertErr } = await supabase.from("tasks").insert({
      villa_id: villaId,
      title: type,
      description: description.trim(),
      status: "pending",
      assigned_to: priority === "Urgent" ? "admin" : null,
    });

    if (insertErr) {
      setError("Erreur lors du signalement. Veuillez réessayer.");
      setSending(false);
      return;
    }

    // Notifier admin via fetch
    try {
      await fetch("/api/admin/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "owner_issue_reported",
          villa_id: villaId,
          issue_type: type,
          description: description.trim(),
          priority,
          reported_by: userId,
        }),
      });
    } catch { /* non-bloquant */ }

    setSuccess(true);
    setSending(false);
    setTimeout(() => { setOpen(false); setSuccess(false); setDescription(""); }, 2500);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
      >
        <AlertTriangle size={16} />
        Signaler un problème
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setOpen(false)}>
          <div
            className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-display text-lg font-semibold text-navy">Signaler un problème</h3>

            {success ? (
              <div className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                Signalement envoyé. L'équipe Kayvila vous contactera rapidement.
              </div>
            ) : (
              <>
                <div>
                  <label className="text-[10px] uppercase tracking-[0.1em] text-navy/50 block mb-1">Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full border border-navy/10 rounded-lg px-3 py-2 text-sm bg-white"
                  >
                    {ISSUE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-[0.1em] text-navy/50 block mb-1">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    placeholder="Décrivez le problème rencontré..."
                    className="w-full border border-navy/10 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-gold/50"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-[0.1em] text-navy/50 block mb-1">Priorité</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full border border-navy/10 rounded-lg px-3 py-2 text-sm bg-white"
                  >
                    {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>

                {error && <p className="text-sm text-red-600">{error}</p>}

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setOpen(false)}
                    className="flex-1 rounded-lg border border-navy/10 px-4 py-2 text-sm text-navy/60 hover:bg-gray-50"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={sending}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy/90 disabled:opacity-50"
                  >
                    <Send size={14} />
                    {sending ? "Envoi..." : "Envoyer"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
```

- [ ] **Step 2: Build check**

```bash
cd diamant-noir && npm run build
```

- [ ] **Step 3: Commit**

```bash
git add components/dashboard/proprio/ReportIssueButton.tsx
git commit -m "feat: composant ReportIssueButton — signalement problème proprio"
```

---

### Task 11: 🔵 Signalement tâches proprio — Intégration page

**Files:**
- Modify: `app/(proprio)/dashboard/taches/page.tsx`

- [ ] **Step 1: Ajouter le bouton dans la page**

Modifier le return de la page pour ajouter le bouton en haut. Le composant a besoin de `villaId` et `userId`. Ajouter après le `<h1>` :

```tsx
import { ReportIssueButton } from "@/components/dashboard/proprio/ReportIssueButton";

// Dans le JSX, après <h1> :
<div className="flex items-center justify-between mb-6">
  <p className="text-sm text-muted">Suivez l'état des maintenances de vos villas.</p>
  {villas && villas.length > 0 && (
    <ReportIssueButton villaId={villas[0].id} userId={user!.id} />
  )}
</div>
```

Noter que `villas[0].id` est un simplificateur — si le proprio a plusieurs villas, on utilise la première. Pour une V2, on pourrait ajouter un sélecteur de villa dans le modal.

- [ ] **Step 2: Build check**

```bash
cd diamant-noir && npm run build
```

- [ ] **Step 3: Commit**

```bash
git add app/(proprio)/dashboard/taches/page.tsx
git commit -m "feat: bouton signalement intégré dans page tâches proprio"
```

---

### Task 12: 🔵 Messagerie proprio — Composant chat

**Files:**
- Create: `components/dashboard/proprio/OwnerMessaging.tsx`

- [ ] **Step 1: Créer le composant OwnerMessaging**

Créer `components/dashboard/proprio/OwnerMessaging.tsx` :

```typescript
"use client";

import { useState, useEffect, useRef } from "react";
import { getSupabaseBrowser } from "@/lib/supabase";
import { Send, MessageSquare } from "lucide-react";

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  subject: string;
  content: string;
  created_at: string;
  read_at: string | null;
}

interface OwnerMessagingProps {
  userId: string;
}

export function OwnerMessaging({ userId }: OwnerMessagingProps) {
  const supabase = getSupabaseBrowser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newSubject, setNewSubject] = useState("");
  const [newContent, setNewContent] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    (async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .order("created_at", { ascending: false });

      setMessages((data ?? []) as Message[]);
      setLoading(false);
    })();
  }, [supabase, userId]);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages]);

  // Polling toutes les 30s
  useEffect(() => {
    if (!supabase) return;
    const interval = setInterval(async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .order("created_at", { ascending: false });
      if (data) setMessages(data as Message[]);
    }, 30000);
    return () => clearInterval(interval);
  }, [supabase, userId]);

  const handleSend = async () => {
    if (!supabase || !newContent.trim() || sending) return;
    setSending(true);
    const subject = newSubject.trim() || "Sans objet";
    const { data, error } = await supabase.from("messages").insert({
      sender_id: userId,
      receiver_id: null, // admin — sera récupéré par le dashboard admin
      subject,
      content: newContent.trim(),
    }).select().single();

    if (!error && data) {
      setMessages((prev) => [data as Message, ...prev]);
      setNewSubject("");
      setNewContent("");
    }
    setSending(false);
  };

  if (loading) {
    return <div className="dashboard-card p-8 text-center text-sm text-muted">Chargement...</div>;
  }

  return (
    <div className="dashboard-card flex flex-col h-[500px]">
      <div ref={containerRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageSquare className="h-10 w-10 text-muted mb-3" />
            <p className="text-sm text-muted">Aucun message pour le moment.</p>
            <p className="text-xs text-muted mt-1">Utilisez le formulaire ci-dessous pour contacter l'équipe Kayvila.</p>
          </div>
        ) : (
          [...messages].reverse().map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender_id === userId ? "items-end" : "items-start"}`}
            >
              <div className={`max-w-[70%] px-4 py-2.5 text-sm ${
                msg.sender_id === userId
                  ? "bg-navy text-white rounded-xl rounded-br-sm"
                  : "bg-gray-100 text-navy rounded-xl rounded-bl-sm"
              }`}>
                <p className="text-[10px] font-semibold uppercase tracking-wide opacity-60 mb-1">
                  {msg.subject}
                </p>
                <p className="whitespace-pre-line">{msg.content}</p>
              </div>
              <span className="text-[9px] text-muted mt-1 px-2">
                {new Date(msg.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          ))
        )}
      </div>

      <div className="border-t border-navy/10 p-4 space-y-3">
        <input
          type="text"
          value={newSubject}
          onChange={(e) => setNewSubject(e.target.value)}
          placeholder="Sujet du message"
          className="w-full border border-navy/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gold/50"
        />
        <div className="flex gap-2">
          <textarea
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder="Votre message..."
            rows={2}
            className="flex-1 border border-navy/10 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-gold/50"
          />
          <button
            onClick={handleSend}
            disabled={sending || !newContent.trim()}
            className="shrink-0 inline-flex items-center justify-center w-10 h-10 bg-navy text-white rounded-lg hover:bg-gold hover:text-navy disabled:opacity-40 transition-colors"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Build check**

```bash
cd diamant-noir && npm run build
```

- [ ] **Step 3: Commit**

```bash
git add components/dashboard/proprio/OwnerMessaging.tsx
git commit -m "feat: composant OwnerMessaging — chat proprio-admin"
```

---

### Task 13: 🔵 Messagerie proprio — Page

**Files:**
- Create: `app/(proprio)/dashboard/messages/page.tsx`

- [ ] **Step 1: Créer la page messages**

Créer `app/(proprio)/dashboard/messages/page.tsx` :

```typescript
import { getSupabaseServer } from "@/lib/supabase-server";
import type { Metadata } from "next";
import { OwnerMessaging } from "@/components/dashboard/proprio/OwnerMessaging";

export const metadata: Metadata = {
  title: "Messages — Kayvila",
};

export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div>
      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold text-navy-900">
            Messages
          </h1>
          <p className="text-sm text-muted">
            Communiquez directement avec l'équipe Kayvila.
          </p>
        </div>
        <OwnerMessaging userId={user!.id} />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Vérifier que la table messages existe**

```bash
cd diamant-noir
# Si la table n'existe pas, la créer via Supabase SQL Editor :
```

```sql
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES profiles(id),
  receiver_id UUID REFERENCES profiles(id),
  subject TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  read_at TIMESTAMPTZ
);
```

- [ ] **Step 3: Build check**

```bash
cd diamant-noir && npm run build
```

- [ ] **Step 4: Commit**

```bash
git add app/(proprio)/dashboard/messages/page.tsx
git commit -m "feat: page messagerie proprio — chat avec admin Kayvila"
```

---

### Task 14: Données test + Vérification finale

- [ ] **Step 0: Créer 2-3 réservations test pour validation Richard**

Dans le Supabase SQL Editor ou via l'API, insérer des réservations test avec des données réalistes :

```sql
INSERT INTO bookings (villa_id, guest_name, guest_email, start_date, end_date, price, cleaning_fee, service_fee, source, status)
VALUES
  ('<villa_id_1>', 'Sophie Martin', 'sophie@example.com', '2026-07-15', '2026-07-22', 2800, 150, 80, 'direct', 'confirmed'),
  ('<villa_id_1>', 'Jean Dupont', 'jean@example.com', '2026-08-01', '2026-08-05', 1600, 150, 80, 'airbnb', 'confirmed'),
  ('<villa_id_2>', 'Marie Lambert', 'marie@example.com', '2026-06-20', '2026-06-27', 3500, 200, 100, 'booking', 'paid');
```

Remplacer `<villa_id_1>` et `<villa_id_2>` par des vrais IDs de villas en production.

- [ ] **Step 1: Build complet**

```bash
cd diamant-noir && npm run build
```

Corriger les éventuelles erreurs de type ou d'import.

- [ ] **Step 2: Lint**

```bash
cd diamant-noir && npm run lint
```

- [ ] **Step 3: Vérifier les pages clés en dev**

```bash
cd diamant-noir && npm run dev
```

Tester :
- `/espace-client/messagerie` — scroll dans conteneur, header visible
- `/admin/revenus` — sous-titre mis à jour, colonnes canal + taux
- `/admin/villas` — miniatures avec fallback
- `/admin/tarification` — validation chevauchement
- `/dashboard/reservations` — empty state amélioré
- `/dashboard/revenus` — tableau ventilation + bouton PDF
- `/dashboard/taches` — bouton signalement
- `/dashboard/messages` — messagerie proprio
- `/espace-client/profil` — sélecteur indicatif

- [ ] **Step 4: Commit final**

```bash
git add -A
git commit -m "chore: build & lint OK — retours Richard 7 Juin 2026"
```

---

## Récapitulatif des commits

| Ordre | Commit | Fichiers |
|-------|--------|----------|
| 1 | `fix: scroll messagerie locataire — scrollTop conteneur` | TenantChatbot.tsx |
| 2 | `feat: getCommissionRate — 20% OTA, 25% direct` | booking-revenue.ts |
| 3 | `feat: admin revenus — taux OTA/direct, canal majoritaire` | revenue/route.ts, admin/revenus/page.tsx |
| 4 | `feat: empty state réservations proprio amélioré` | proprio/reservations/page.tsx |
| 5 | `feat: proprio revenus — tableau ventilation avec filtre mois` | proprio/revenus/page.tsx |
| 6 | `feat: proprio revenus — PDF relevé mensuel + bouton` | releve/route.ts, RelevePDF.tsx, proprio/revenus/page.tsx |
| 7 | `feat: miniatures villas — fallback image_urls[0]` | AdminVillasDataGrid.tsx, admin/villas/page.tsx |
| 8 | `feat: anti-chevauchement tarifs saisonniers — validation` | seasonal-rates/route.ts, SeasonalRatesManager.tsx |
| 9 | `feat: sélecteur indicatif téléphonique locataire` | ProfileForm.tsx |
| 10 | `feat: composant ReportIssueButton` | ReportIssueButton.tsx |
| 11 | `feat: bouton signalement intégré page tâches` | proprio/taches/page.tsx |
| 12 | `feat: composant OwnerMessaging` | OwnerMessaging.tsx |
| 13 | `feat: page messagerie proprio` | proprio/messages/page.tsx |
| 14 | `chore: données test + build & lint OK` | — |
