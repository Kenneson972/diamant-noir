# Facturation — Reçus locataire & relevés propriétaire — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generate, persist, and deliver two PDF documents per réservation payée en direct via Stripe Checkout — un reçu de paiement pour le locataire et un relevé informatif pour le propriétaire — en remplaçant le faux bouton "Facture" actuel et les deux routes d'export PDF ad-hoc du dashboard propriétaire.

**Architecture:** Une nouvelle table `booking_documents` (numérotée, immuable, stockée dans un bucket Supabase Storage privé) alimentée par un générateur PDF central (`lib/invoicing/generate-booking-document.ts`, basé sur `@react-pdf/renderer`, déjà une dépendance) déclenché depuis le webhook Stripe existant sur `checkout.session.completed`. Les PDF sont attachés aux emails déjà envoyés (`booking-confirmation`, `owner-new-booking`) — aucun nouvel email créé. Le téléchargement passe par une route API RLS-protégée (`GET /api/documents/[id]/download`).

**Tech Stack:** Next.js 14 (App Router, route handlers), Supabase (Postgres + Storage + RLS), `@react-pdf/renderer` 4.5.1, Resend (email + attachments), Vitest (unit), Playwright (E2E, pattern existant `tests/stripe-webhooks.spec.ts`).

## Global Constraints

- Calculs financiers : réutiliser exclusivement `lib/revenue/booking-revenue.ts` (`getCommissionRate`, `grossCentsFromBooking`, `ownerNetCents`, `platformFeeCents`) — ne jamais dupliquer la logique de commission.
- Ne jamais lancer `npm run build` (corrompt `.next` sur cet environnement) — utiliser `npm run lint` / `npx vitest run` / `npx tsc --noEmit` pour valider.
- Les réservations OTA (Airbnb/Booking/Expedia/Vrbo/Trivago/iCal) n'entrent jamais dans `checkout.session.completed` (elles arrivent par import iCal/sync) — le relevé propriétaire (Type B) ne concerne donc naturellement que les réservations directes/Stripe. La facture de commission OTA mensuelle (CGV art. 4.2/4.6) est **hors périmètre** de ce plan.
- Toute génération de document est non-bloquante : un échec (PDF, storage, email) ne doit jamais empêcher la confirmation de réservation ni les emails déjà existants. Toujours `try/catch` + `console.error`, jamais de `throw` qui remonte au webhook.
- Documents immuables : aucune route `UPDATE`/`DELETE` sur `booking_documents` n'est créée dans ce plan.
- Style PDF : Helvetica, navy `#0a1929`, or `#D4AF37` — cohérent avec `components/dashboard/proprio/RelevePDF.tsx` existant (qui sera supprimé, cf. Task 11).
- Formatage dates/euros dans les PDF : réutiliser `formatDateFr` et `formatEuros` de `lib/emails/format.ts` (fonctions pures, sans dépendance React Email) plutôt que de dupliquer.
- Portée des tests de téléchargement : ce repo n'a pas de fixture Playwright avec session authentifiée (aucun `storageState`/login flow existant dans `tests/`). L'automatisation E2E se limite donc à la génération des documents via le webhook (Task 12, pattern `tests/stripe-webhooks.spec.ts`) ; la vérification du téléchargement authentifié (locataire/propriétaire) reste un test manuel documenté dans Task 10 et Task 11. Construire une fixture d'auth Playwright serait un chantier séparé, hors périmètre de cette feature.

---

### Task 1: Migration — table `booking_documents`, numérotation, bucket, RLS

**Files:**
- Create: `supabase/migrations/20260707120000_booking_documents.sql`

**Interfaces:**
- Produces: table `public.booking_documents` (colonnes : `id`, `booking_id`, `document_type`, `document_number`, `recipient_id`, `pdf_storage_path`, `amount_cents`, `generated_at`, `emailed_at`), fonction `public.next_document_number(p_type text) returns text`, bucket storage `booking-documents` (privé).

- [ ] **Step 1: Écrire la migration SQL**

```sql
-- Migration: booking_documents — reçus locataire & relevés propriétaire par réservation
-- Date: 2026-07-07

-- 1. Séquences de numérotation (une par type de document)
CREATE SEQUENCE IF NOT EXISTS public.owner_statement_seq START 1;
CREATE SEQUENCE IF NOT EXISTS public.tenant_receipt_seq START 1;

-- 2. Fonction de numérotation atomique
CREATE OR REPLACE FUNCTION public.next_document_number(p_type text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_seq bigint;
  v_prefix text;
  v_year text := to_char(now(), 'YYYY');
BEGIN
  IF p_type = 'owner_statement' THEN
    v_seq := nextval('public.owner_statement_seq');
    v_prefix := 'KAY-RELV';
  ELSIF p_type = 'tenant_receipt' THEN
    v_seq := nextval('public.tenant_receipt_seq');
    v_prefix := 'KAY-RECU';
  ELSE
    RAISE EXCEPTION 'unknown document type: %', p_type;
  END IF;
  RETURN v_prefix || '-' || v_year || '-' || lpad(v_seq::text, 6, '0');
END;
$$;

GRANT EXECUTE ON FUNCTION public.next_document_number(text) TO authenticated, service_role;

-- 3. Table booking_documents
CREATE TABLE IF NOT EXISTS public.booking_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  document_type text NOT NULL CHECK (document_type IN ('owner_statement', 'tenant_receipt')),
  document_number text NOT NULL UNIQUE,
  recipient_id uuid REFERENCES public.profiles(id),
  pdf_storage_path text NOT NULL,
  amount_cents integer NOT NULL,
  generated_at timestamptz NOT NULL DEFAULT now(),
  emailed_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_booking_documents_booking_id ON public.booking_documents(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_documents_recipient_id ON public.booking_documents(recipient_id);
CREATE INDEX IF NOT EXISTS idx_booking_documents_type ON public.booking_documents(document_type);

ALTER TABLE public.booking_documents ENABLE ROW LEVEL SECURITY;

-- 4. RLS — lecture seule, aucune policy INSERT/UPDATE/DELETE pour authenticated
--    (seul le service_role, qui bypass RLS, peut écrire — génération serveur uniquement)

DROP POLICY IF EXISTS admin_read_all_booking_documents ON public.booking_documents;
CREATE POLICY admin_read_all_booking_documents ON public.booking_documents
  FOR SELECT TO authenticated
  USING (public.is_staff_admin());

DROP POLICY IF EXISTS owner_read_own_statements ON public.booking_documents;
CREATE POLICY owner_read_own_statements ON public.booking_documents
  FOR SELECT TO authenticated
  USING (document_type = 'owner_statement' AND recipient_id = auth.uid());

DROP POLICY IF EXISTS tenant_read_own_receipts ON public.booking_documents;
CREATE POLICY tenant_read_own_receipts ON public.booking_documents
  FOR SELECT TO authenticated
  USING (
    document_type = 'tenant_receipt'
    AND (
      recipient_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.bookings b
        WHERE b.id = booking_documents.booking_id
          AND b.guest_email IS NOT NULL
          AND lower(b.guest_email) = lower(COALESCE(auth.jwt() ->> 'email', ''))
      )
    )
  );

-- 5. Bucket storage privé (créé via SQL — pas d'étape manuelle dashboard)
INSERT INTO storage.buckets (id, name, public)
VALUES ('booking-documents', 'booking-documents', false)
ON CONFLICT (id) DO NOTHING;

-- 6. RLS storage — accès admin uniquement (le téléchargement passe toujours par
--    la route API /api/documents/[id]/download qui utilise le service role après
--    vérification RLS sur booking_documents ; ces policies sont une défense en
--    profondeur, pas le chemin d'accès normal).
DROP POLICY IF EXISTS admin_read_booking_documents_storage ON storage.objects;
CREATE POLICY admin_read_booking_documents_storage ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'booking-documents' AND public.is_staff_admin());
```

- [ ] **Step 2: Appliquer la migration**

Run: `npx supabase db push` (ou via le MCP Supabase `apply_migration` si `supabase db push` n'est pas configuré en local)
Expected: migration appliquée sans erreur, table `booking_documents` visible dans `list_tables`.

- [ ] **Step 3: Vérifier la fonction de numérotation**

Run (SQL Editor Supabase ou `execute_sql` MCP) :
```sql
select public.next_document_number('owner_statement');
select public.next_document_number('tenant_receipt');
select public.next_document_number('owner_statement');
```
Expected: retourne respectivement `KAY-RELV-2026-000001`, `KAY-RECU-2026-000001`, `KAY-RELV-2026-000002` (les séquences sont indépendantes et incrémentales).

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260707120000_booking_documents.sql
git commit -m "feat(db): table booking_documents + numérotation + bucket storage privé"
```

---

### Task 2: Calcul pur des montants — `lib/invoicing/booking-document-amounts.ts`

**Files:**
- Create: `lib/invoicing/booking-document-amounts.ts`
- Test: `lib/invoicing/booking-document-amounts.test.ts`

**Interfaces:**
- Consumes: `getCommissionRate`, `grossCentsFromBooking`, `ownerNetCents`, `platformFeeCents` de `lib/revenue/booking-revenue.ts` (signatures existantes, déjà lues).
- Produces: `computeBookingDocumentAmounts(booking, type): BookingDocumentAmounts` — utilisé par Task 5 (générateur) et par les tests des composants PDF (Task 3/4).

- [ ] **Step 1: Écrire le test**

```typescript
import { describe, it, expect } from "vitest";
import { computeBookingDocumentAmounts } from "./booking-document-amounts";

describe("computeBookingDocumentAmounts", () => {
  const directBooking = {
    price: 1000,
    cleaning_fee: 80,
    service_fee: 20,
    total_price_cents: null,
    source: "direct",
  };

  it("owner_statement : amountCents = net reversé au propriétaire", () => {
    const result = computeBookingDocumentAmounts(directBooking, "owner_statement");
    // 1000€ nuitées, commission 22% = 220€ → net nuitées 780€
    // + ménage/service 100% Kayvila (pas reversés au propriétaire)
    expect(result.grossCents).toBe(110000);
    expect(result.commissionRate).toBe(22);
    expect(result.commissionCents).toBe(32000); // 220€ commission + 80€ + 20€ frais
    expect(result.netCents).toBe(78000);
    expect(result.amountCents).toBe(result.netCents);
  });

  it("tenant_receipt : amountCents = montant brut payé", () => {
    const result = computeBookingDocumentAmounts(directBooking, "tenant_receipt");
    expect(result.amountCents).toBe(result.grossCents);
    expect(result.amountCents).toBe(110000);
  });

  it("source OTA → taux 20% appliqué (même si Type B ne cible que le direct en pratique)", () => {
    const result = computeBookingDocumentAmounts(
      { ...directBooking, source: "airbnb" },
      "owner_statement"
    );
    expect(result.commissionRate).toBe(20);
  });

  it("cleaning_fee/service_fee absents → 0", () => {
    const result = computeBookingDocumentAmounts(
      { price: 500, cleaning_fee: null, service_fee: null, total_price_cents: null, source: null },
      "owner_statement"
    );
    expect(result.cleaningFeeCents).toBe(0);
    expect(result.serviceFeeCents).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/invoicing/booking-document-amounts.test.ts`
Expected: FAIL — `Cannot find module './booking-document-amounts'`

- [ ] **Step 3: Implémenter**

```typescript
import {
  getCommissionRate,
  grossCentsFromBooking,
  ownerNetCents,
  platformFeeCents,
  type BookingRevenueInput,
} from "@/lib/revenue/booking-revenue";

export type BookingDocumentType = "owner_statement" | "tenant_receipt";

export type BookingDocumentAmountsInput = BookingRevenueInput & {
  source?: string | null;
};

export type BookingDocumentAmounts = {
  grossCents: number;
  commissionCents: number;
  netCents: number;
  cleaningFeeCents: number;
  serviceFeeCents: number;
  commissionRate: number;
  /** Montant "principal" affiché comme total du document : net reversé (owner) ou brut payé (tenant). */
  amountCents: number;
};

export function computeBookingDocumentAmounts(
  booking: BookingDocumentAmountsInput,
  type: BookingDocumentType
): BookingDocumentAmounts {
  const commissionRate = getCommissionRate(booking.source ?? null);
  const grossCents = grossCentsFromBooking(booking);
  const commissionCents = platformFeeCents(booking, commissionRate);
  const netCents = ownerNetCents(booking, commissionRate);
  const cleaningFeeCents = Math.round(Number(booking.cleaning_fee ?? 0) * 100);
  const serviceFeeCents = Math.round(Number(booking.service_fee ?? 0) * 100);

  return {
    grossCents,
    commissionCents,
    netCents,
    cleaningFeeCents,
    serviceFeeCents,
    commissionRate,
    amountCents: type === "owner_statement" ? netCents : grossCents,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/invoicing/booking-document-amounts.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/invoicing/booking-document-amounts.ts lib/invoicing/booking-document-amounts.test.ts
git commit -m "feat(invoicing): calcul pur des montants pour reçus/relevés par réservation"
```

---

### Task 3: Constante identité légale Kayvila + composant `TenantReceiptPDF`

**Files:**
- Modify: `lib/legal.ts`
- Create: `components/pdf/TenantReceiptPDF.tsx`
- Test: `components/pdf/TenantReceiptPDF.test.ts`

**Interfaces:**
- Consumes: `computeBookingDocumentAmounts` (Task 2), `formatDateFr`/`formatEuros` de `lib/emails/format.ts`.
- Produces: `KAYVILA_LEGAL_ENTITY` (export de `lib/legal.ts`) réutilisé par Task 4 ; `TenantReceiptPDF(props): ReactElement` — appelé comme fonction (pas JSX) par Task 5, à l'identique du pattern existant `RelevePDF({...})` dans `app/api/proprio/revenus/export-pdf/route.ts`.

- [ ] **Step 1: Ajouter la constante d'identité légale dans `lib/legal.ts`**

Ajouter à la fin du fichier (après `CONFIDENTIALITE_TEXT`, ligne 249) :

```typescript
/** Identité légale Kayvila — source unique pour les documents financiers (reçus, relevés). */
export const KAYVILA_LEGAL_ENTITY = {
  name: "Kayvila Conciergerie",
  legalForm: "SARLU au capital social de 1 000 €",
  siret: "106 394 489 00012",
  tva: "FR32106394489",
  address: "Quartier Palmène, 97270 Saint-Esprit, Martinique",
  phone: "+596 696 68 18 69",
  email: "contact@kayvila.com",
} as const;
```

- [ ] **Step 2: Écrire le test du composant**

```typescript
import { describe, it, expect } from "vitest";
import { renderToBuffer } from "@react-pdf/renderer";
import { TenantReceiptPDF } from "./TenantReceiptPDF";

describe("TenantReceiptPDF", () => {
  it("génère un PDF valide (magic bytes %PDF)", async () => {
    const buffer = await renderToBuffer(
      TenantReceiptPDF({
        documentNumber: "KAY-RECU-2026-000001",
        guestName: "Jean Dupont",
        guestEmail: "jean@example.com",
        villaName: "Villa Étoile",
        startDate: "2026-08-01",
        endDate: "2026-08-08",
        cleaningFeeCents: 8000,
        serviceFeeCents: 2000,
        totalCents: 110000,
      })
    );
    expect(buffer.subarray(0, 4).toString()).toBe("%PDF");
    expect(buffer.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run components/pdf/TenantReceiptPDF.test.ts`
Expected: FAIL — `Cannot find module './TenantReceiptPDF'`

- [ ] **Step 4: Implémenter le composant**

```tsx
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { formatDateFr, formatEuros } from "@/lib/emails/format";
import { KAYVILA_LEGAL_ENTITY } from "@/lib/legal";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica", color: "#0a1929" },
  header: { marginBottom: 20, borderBottom: "1 solid #D4AF37", paddingBottom: 12 },
  brand: { fontSize: 16, fontFamily: "Helvetica-Bold", color: "#0a1929" },
  legalLine: { fontSize: 8, color: "#666", marginTop: 2 },
  title: { fontSize: 14, fontFamily: "Helvetica-Bold", marginTop: 16, marginBottom: 4 },
  docNumber: { fontSize: 9, color: "#666", marginBottom: 16 },
  sectionLabel: { fontSize: 9, fontFamily: "Helvetica-Bold", color: "#D4AF37", marginTop: 12, marginBottom: 4, textTransform: "uppercase" },
  line: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
  lineLabel: { color: "#333" },
  lineValue: { color: "#0a1929" },
  totalLine: { flexDirection: "row", justifyContent: "space-between", borderTop: "1 solid #0a1929", marginTop: 8, paddingTop: 8 },
  totalLabel: { fontFamily: "Helvetica-Bold" },
  totalValue: { fontFamily: "Helvetica-Bold", color: "#D4AF37" },
  mention: { fontSize: 8, color: "#666", marginTop: 24, lineHeight: 1.5 },
  footer: { position: "absolute", bottom: 30, left: 40, right: 40, fontSize: 8, color: "#999", textAlign: "center" },
});

export type TenantReceiptPDFProps = {
  documentNumber: string;
  guestName: string;
  guestEmail: string;
  villaName: string;
  startDate: string;
  endDate: string;
  cleaningFeeCents: number;
  serviceFeeCents: number;
  totalCents: number;
};

export function TenantReceiptPDF({
  documentNumber,
  guestName,
  guestEmail,
  villaName,
  startDate,
  endDate,
  cleaningFeeCents,
  serviceFeeCents,
  totalCents,
}: TenantReceiptPDFProps) {
  const stayCents = totalCents - cleaningFeeCents - serviceFeeCents;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.brand}>{KAYVILA_LEGAL_ENTITY.name}</Text>
          <Text style={styles.legalLine}>
            {KAYVILA_LEGAL_ENTITY.legalForm} — SIRET {KAYVILA_LEGAL_ENTITY.siret} — TVA {KAYVILA_LEGAL_ENTITY.tva}
          </Text>
          <Text style={styles.legalLine}>{KAYVILA_LEGAL_ENTITY.address}</Text>
        </View>

        <Text style={styles.title}>Reçu de paiement</Text>
        <Text style={styles.docNumber}>
          N° {documentNumber} — émis le {formatDateFr(new Date().toISOString())}
        </Text>

        <Text style={styles.sectionLabel}>Voyageur</Text>
        <View style={styles.line}>
          <Text style={styles.lineLabel}>Nom</Text>
          <Text style={styles.lineValue}>{guestName}</Text>
        </View>
        <View style={styles.line}>
          <Text style={styles.lineLabel}>Email</Text>
          <Text style={styles.lineValue}>{guestEmail}</Text>
        </View>

        <Text style={styles.sectionLabel}>Séjour</Text>
        <View style={styles.line}>
          <Text style={styles.lineLabel}>Villa</Text>
          <Text style={styles.lineValue}>{villaName}</Text>
        </View>
        <View style={styles.line}>
          <Text style={styles.lineLabel}>Dates</Text>
          <Text style={styles.lineValue}>
            {formatDateFr(startDate)} → {formatDateFr(endDate)}
          </Text>
        </View>

        <Text style={styles.sectionLabel}>Détail du paiement</Text>
        <View style={styles.line}>
          <Text style={styles.lineLabel}>Montant nuitées</Text>
          <Text style={styles.lineValue}>{formatEuros(stayCents / 100)}</Text>
        </View>
        <View style={styles.line}>
          <Text style={styles.lineLabel}>Frais de ménage</Text>
          <Text style={styles.lineValue}>{formatEuros(cleaningFeeCents / 100)}</Text>
        </View>
        <View style={styles.line}>
          <Text style={styles.lineLabel}>Frais de service</Text>
          <Text style={styles.lineValue}>{formatEuros(serviceFeeCents / 100)}</Text>
        </View>
        <View style={styles.totalLine}>
          <Text style={styles.totalLabel}>Total payé</Text>
          <Text style={styles.totalValue}>{formatEuros(totalCents / 100)}</Text>
        </View>

        <Text style={styles.mention}>
          Reçu de paiement — ne constitue pas une facture avec TVA déductible. Le contrat de
          location se forme directement entre le Voyageur et le Propriétaire, {KAYVILA_LEGAL_ENTITY.name}{" "}
          agissant en qualité d&apos;intermédiaire technique (cf. Conditions Générales de Vente Voyageurs).
        </Text>

        <Text style={styles.footer}>
          {KAYVILA_LEGAL_ENTITY.email} — document généré automatiquement, ne pas répondre à cet email.
        </Text>
      </Page>
    </Document>
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run components/pdf/TenantReceiptPDF.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add lib/legal.ts components/pdf/TenantReceiptPDF.tsx components/pdf/TenantReceiptPDF.test.ts
git commit -m "feat(invoicing): constante identité légale Kayvila + composant PDF reçu locataire"
```

---

### Task 4: Composant `OwnerStatementPDF`

**Files:**
- Create: `components/pdf/OwnerStatementPDF.tsx`
- Test: `components/pdf/OwnerStatementPDF.test.ts`

**Interfaces:**
- Consumes: `KAYVILA_LEGAL_ENTITY` (Task 3), `formatDateFr`/`formatEuros`.
- Produces: `OwnerStatementPDF(props): ReactElement` — appelé comme fonction par Task 5.

- [ ] **Step 1: Écrire le test**

```typescript
import { describe, it, expect } from "vitest";
import { renderToBuffer } from "@react-pdf/renderer";
import { OwnerStatementPDF } from "./OwnerStatementPDF";

describe("OwnerStatementPDF", () => {
  it("génère un PDF valide (magic bytes %PDF)", async () => {
    const buffer = await renderToBuffer(
      OwnerStatementPDF({
        documentNumber: "KAY-RELV-2026-000001",
        ownerName: "Marie Curie",
        villaName: "Villa Étoile",
        guestName: "Jean Dupont",
        startDate: "2026-08-01",
        endDate: "2026-08-08",
        grossCents: 110000,
        commissionCents: 32000,
        commissionRate: 22,
        cleaningFeeCents: 8000,
        serviceFeeCents: 2000,
        netCents: 78000,
      })
    );
    expect(buffer.subarray(0, 4).toString()).toBe("%PDF");
    expect(buffer.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/pdf/OwnerStatementPDF.test.ts`
Expected: FAIL — `Cannot find module './OwnerStatementPDF'`

- [ ] **Step 3: Implémenter le composant**

```tsx
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { formatDateFr, formatEuros } from "@/lib/emails/format";
import { KAYVILA_LEGAL_ENTITY } from "@/lib/legal";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica", color: "#0a1929" },
  header: { marginBottom: 20, borderBottom: "1 solid #D4AF37", paddingBottom: 12 },
  brand: { fontSize: 16, fontFamily: "Helvetica-Bold", color: "#0a1929" },
  legalLine: { fontSize: 8, color: "#666", marginTop: 2 },
  title: { fontSize: 14, fontFamily: "Helvetica-Bold", marginTop: 16, marginBottom: 4 },
  docNumber: { fontSize: 9, color: "#666", marginBottom: 16 },
  sectionLabel: { fontSize: 9, fontFamily: "Helvetica-Bold", color: "#D4AF37", marginTop: 12, marginBottom: 4, textTransform: "uppercase" },
  line: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
  lineLabel: { color: "#333" },
  lineValue: { color: "#0a1929" },
  negative: { color: "#b91c1c" },
  totalLine: { flexDirection: "row", justifyContent: "space-between", borderTop: "1 solid #0a1929", marginTop: 8, paddingTop: 8 },
  totalLabel: { fontFamily: "Helvetica-Bold" },
  totalValue: { fontFamily: "Helvetica-Bold", color: "#D4AF37" },
  mention: { fontSize: 8, color: "#666", marginTop: 24, lineHeight: 1.5 },
  footer: { position: "absolute", bottom: 30, left: 40, right: 40, fontSize: 8, color: "#999", textAlign: "center" },
});

export type OwnerStatementPDFProps = {
  documentNumber: string;
  ownerName: string;
  villaName: string;
  guestName: string;
  startDate: string;
  endDate: string;
  grossCents: number;
  commissionCents: number;
  commissionRate: number;
  cleaningFeeCents: number;
  serviceFeeCents: number;
  netCents: number;
};

export function OwnerStatementPDF({
  documentNumber,
  ownerName,
  villaName,
  guestName,
  startDate,
  endDate,
  grossCents,
  commissionCents,
  commissionRate,
  cleaningFeeCents,
  serviceFeeCents,
  netCents,
}: OwnerStatementPDFProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.brand}>{KAYVILA_LEGAL_ENTITY.name}</Text>
          <Text style={styles.legalLine}>
            {KAYVILA_LEGAL_ENTITY.legalForm} — SIRET {KAYVILA_LEGAL_ENTITY.siret} — TVA {KAYVILA_LEGAL_ENTITY.tva}
          </Text>
          <Text style={styles.legalLine}>{KAYVILA_LEGAL_ENTITY.address}</Text>
        </View>

        <Text style={styles.title}>Relevé de réservation</Text>
        <Text style={styles.docNumber}>
          N° {documentNumber} — émis le {formatDateFr(new Date().toISOString())}
        </Text>

        <Text style={styles.sectionLabel}>Propriétaire</Text>
        <View style={styles.line}>
          <Text style={styles.lineLabel}>Nom</Text>
          <Text style={styles.lineValue}>{ownerName}</Text>
        </View>

        <Text style={styles.sectionLabel}>Réservation</Text>
        <View style={styles.line}>
          <Text style={styles.lineLabel}>Villa</Text>
          <Text style={styles.lineValue}>{villaName}</Text>
        </View>
        <View style={styles.line}>
          <Text style={styles.lineLabel}>Voyageur</Text>
          <Text style={styles.lineValue}>{guestName}</Text>
        </View>
        <View style={styles.line}>
          <Text style={styles.lineLabel}>Dates</Text>
          <Text style={styles.lineValue}>
            {formatDateFr(startDate)} → {formatDateFr(endDate)}
          </Text>
        </View>

        <Text style={styles.sectionLabel}>Répartition financière</Text>
        <View style={styles.line}>
          <Text style={styles.lineLabel}>Brut encaissé</Text>
          <Text style={styles.lineValue}>{formatEuros(grossCents / 100)}</Text>
        </View>
        <View style={styles.line}>
          <Text style={styles.lineLabel}>Commission Kayvila ({commissionRate}%)</Text>
          <Text style={[styles.lineValue, styles.negative]}>
            -{formatEuros(commissionCents / 100)}
          </Text>
        </View>
        <View style={styles.line}>
          <Text style={styles.lineLabel}>dont frais de ménage</Text>
          <Text style={styles.lineValue}>{formatEuros(cleaningFeeCents / 100)}</Text>
        </View>
        <View style={styles.line}>
          <Text style={styles.lineLabel}>dont frais de service</Text>
          <Text style={styles.lineValue}>{formatEuros(serviceFeeCents / 100)}</Text>
        </View>
        <View style={styles.totalLine}>
          <Text style={styles.totalLabel}>Net reversé</Text>
          <Text style={styles.totalValue}>{formatEuros(netCents / 100)}</Text>
        </View>

        <Text style={styles.mention}>
          Document informatif — la répartition entre {KAYVILA_LEGAL_ENTITY.name} et le Propriétaire a
          déjà été effectuée automatiquement lors du paiement via Stripe Connect. Ce relevé ne
          constitue pas un appel de fonds.
        </Text>

        <Text style={styles.footer}>
          {KAYVILA_LEGAL_ENTITY.email} — document généré automatiquement, ne pas répondre à cet email.
        </Text>
      </Page>
    </Document>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/pdf/OwnerStatementPDF.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add components/pdf/OwnerStatementPDF.tsx components/pdf/OwnerStatementPDF.test.ts
git commit -m "feat(invoicing): composant PDF relevé propriétaire par réservation"
```

---

### Task 5: Générateur central — `lib/invoicing/generate-booking-document.ts`

**Files:**
- Create: `lib/invoicing/generate-booking-document.ts`

**Interfaces:**
- Consumes: `computeBookingDocumentAmounts` (Task 2), `TenantReceiptPDF`/`OwnerStatementPDF` (Task 3/4), table `booking_documents` + RPC `next_document_number` + bucket `booking-documents` (Task 1).
- Produces: `generateBookingDocument(supabase, bookingId, type): Promise<GeneratedBookingDocument | null>` — consommé par Task 7 (tenant) et Task 8 (owner). `GeneratedBookingDocument = { documentId: string; documentNumber: string; pdfBuffer: Buffer }`.

Ce fichier fait de l'I/O (fetch Supabase, upload storage, insert DB) — pas de test unitaire dédié, conformément à la convention du repo (aucun test n'existe pour `lib/emails/send.ts` ni les handlers webhook ; la couverture vient du test d'intégration webhook, Task 12).

- [ ] **Step 1: Implémenter le générateur**

```typescript
import type { SupabaseClient } from "@supabase/supabase-js";
import { renderToBuffer } from "@react-pdf/renderer";
import { computeBookingDocumentAmounts, type BookingDocumentType } from "@/lib/invoicing/booking-document-amounts";
import { OwnerStatementPDF } from "@/components/pdf/OwnerStatementPDF";
import { TenantReceiptPDF } from "@/components/pdf/TenantReceiptPDF";

export type { BookingDocumentType };

export type GeneratedBookingDocument = {
  documentId: string;
  documentNumber: string;
  pdfBuffer: Buffer;
};

const STORAGE_BUCKET = "booking-documents";

export async function generateBookingDocument(
  supabase: SupabaseClient,
  bookingId: string,
  type: BookingDocumentType
): Promise<GeneratedBookingDocument | null> {
  const { data: booking } = await supabase
    .from("bookings")
    .select(
      "id, villa_id, start_date, end_date, guest_name, guest_email, price, cleaning_fee, service_fee, source, total_price_cents, client_user_id"
    )
    .eq("id", bookingId)
    .maybeSingle();

  if (!booking) {
    console.error(`generateBookingDocument: booking ${bookingId} introuvable`);
    return null;
  }

  const { data: villa } = await supabase
    .from("villas")
    .select("id, name, owner_id")
    .eq("id", booking.villa_id)
    .maybeSingle();

  if (!villa) {
    console.error(`generateBookingDocument: villa ${booking.villa_id} introuvable (booking ${bookingId})`);
    return null;
  }

  const amounts = computeBookingDocumentAmounts(booking, type);

  if (type === "owner_statement") {
    if (!villa.owner_id) {
      console.error(`generateBookingDocument: villa ${villa.id} sans owner_id, relevé annulé`);
      return null;
    }

    const { data: ownerProfile } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", villa.owner_id)
      .maybeSingle();

    const documentNumber = await nextDocumentNumber(supabase, "owner_statement");
    if (!documentNumber) return null;

    const pdfBuffer = await renderToBuffer(
      OwnerStatementPDF({
        documentNumber,
        ownerName: ownerProfile?.full_name ?? "Propriétaire",
        villaName: villa.name ?? "Villa",
        guestName: booking.guest_name ?? "Voyageur",
        startDate: booking.start_date,
        endDate: booking.end_date,
        grossCents: amounts.grossCents,
        commissionCents: amounts.commissionCents,
        commissionRate: amounts.commissionRate,
        cleaningFeeCents: amounts.cleaningFeeCents,
        serviceFeeCents: amounts.serviceFeeCents,
        netCents: amounts.netCents,
      })
    );

    return persistDocument(supabase, {
      bookingId,
      type,
      documentNumber,
      recipientId: villa.owner_id,
      pdfBuffer,
      amountCents: amounts.amountCents,
    });
  }

  // tenant_receipt
  const documentNumber = await nextDocumentNumber(supabase, "tenant_receipt");
  if (!documentNumber) return null;

  const pdfBuffer = await renderToBuffer(
    TenantReceiptPDF({
      documentNumber,
      guestName: booking.guest_name ?? "Voyageur",
      guestEmail: booking.guest_email ?? "",
      villaName: villa.name ?? "Villa",
      startDate: booking.start_date,
      endDate: booking.end_date,
      cleaningFeeCents: amounts.cleaningFeeCents,
      serviceFeeCents: amounts.serviceFeeCents,
      totalCents: amounts.amountCents,
    })
  );

  return persistDocument(supabase, {
    bookingId,
    type,
    documentNumber,
    recipientId: booking.client_user_id ?? null,
    pdfBuffer,
    amountCents: amounts.amountCents,
  });
}

async function nextDocumentNumber(
  supabase: SupabaseClient,
  type: BookingDocumentType
): Promise<string | null> {
  const { data, error } = await supabase.rpc("next_document_number", { p_type: type });
  if (error || !data) {
    console.error(`generateBookingDocument: numérotation ${type} échouée`, error);
    return null;
  }
  return data as string;
}

async function persistDocument(
  supabase: SupabaseClient,
  args: {
    bookingId: string;
    type: BookingDocumentType;
    documentNumber: string;
    recipientId: string | null;
    pdfBuffer: Buffer;
    amountCents: number;
  }
): Promise<GeneratedBookingDocument | null> {
  const storagePath = `${args.recipientId ?? "unassigned"}/${args.documentNumber}.pdf`;

  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(storagePath, args.pdfBuffer, { contentType: "application/pdf", upsert: false });

  if (uploadError) {
    console.error("generateBookingDocument: upload storage échoué", uploadError);
    return null;
  }

  const { data: row, error: insertError } = await supabase
    .from("booking_documents")
    .insert({
      booking_id: args.bookingId,
      document_type: args.type,
      document_number: args.documentNumber,
      recipient_id: args.recipientId,
      pdf_storage_path: storagePath,
      amount_cents: args.amountCents,
    })
    .select("id")
    .single();

  if (insertError || !row) {
    console.error("generateBookingDocument: insertion booking_documents échouée", insertError);
    return null;
  }

  return {
    documentId: row.id,
    documentNumber: args.documentNumber,
    pdfBuffer: args.pdfBuffer,
  };
}
```

- [ ] **Step 2: Vérifier la compilation TypeScript**

Run: `npx tsc --noEmit`
Expected: aucune nouvelle erreur liée à `lib/invoicing/generate-booking-document.ts`

- [ ] **Step 3: Commit**

```bash
git add lib/invoicing/generate-booking-document.ts
git commit -m "feat(invoicing): générateur central des documents PDF par réservation"
```

---

### Task 6: Support des pièces jointes dans les emails existants

**Files:**
- Modify: `lib/emails/send.ts:28-105` (`sendBookingConfirmationEmail`)
- Modify: `lib/emails/send.ts:176-238` (`sendOwnerNewBookingEmail`)

**Interfaces:**
- Consumes: type `Attachment` de `resend` (`{ filename?: string; content?: string | Buffer }`).
- Produces: `sendBookingConfirmationEmail(booking, villa, attachment?)` et `sendOwnerNewBookingEmail(booking, villa, owner, attachment?)` acceptent un 4ᵉ paramètre optionnel `attachment?: { filename: string; content: Buffer }` — consommé par Task 7 et Task 8.

- [ ] **Step 1: Modifier la signature et l'appel Resend de `sendBookingConfirmationEmail`**

Dans `lib/emails/send.ts`, remplacer la signature (ligne 28) :

```typescript
export async function sendBookingConfirmationEmail(booking: {
  id: string;
  guest_name: string | null;
  guest_email: string | null;
  start_date: string;
  end_date: string;
  price?: number | null;
  total_price_cents?: number | null;
  status?: string | null;
  villa_id?: string | null;
}, villa: { name?: string | null; location?: string | null } | null, attachment?: { filename: string; content: Buffer }) {
```

Puis remplacer l'appel Resend (lignes 62-68) :

```typescript
    const { error } = await getResend().emails.send({
      from: RESEND_FROM,
      to: [guestEmail],
      subject: `Confirmation — ${villa?.name || "Villa"} — ${SITE_BRAND_DISPLAY}`,
      html,
      attachments: attachment ? [attachment] : undefined,
    });
```

- [ ] **Step 2: Modifier la signature et l'appel Resend de `sendOwnerNewBookingEmail`**

Dans `lib/emails/send.ts`, remplacer la signature (lignes 176-192) :

```typescript
export async function sendOwnerNewBookingEmail(
  booking: {
    id: string;
    guest_name: string | null;
    start_date: string;
    end_date: string;
    price?: number | null;
    total_price_cents?: number | null;
    villa_id?: string | null;
  },
  villa: {
    name?: string | null;
    owner_id?: string | null;
    commission_rate?: number | null;
  } | null,
  owner: { email?: string | null; full_name?: string | null } | null,
  attachment?: { filename: string; content: Buffer }
) {
```

Puis remplacer l'appel Resend (lignes 225-230) :

```typescript
  const { error } = await getResend().emails.send({
    from: RESEND_FROM,
    to: [ownerEmail],
    subject: `Nouvelle réservation — ${villa.name} (${ownerPct} % revenu)`,
    html,
    attachments: attachment ? [attachment] : undefined,
  });
```

- [ ] **Step 3: Vérifier la compilation**

Run: `npx tsc --noEmit`
Expected: aucune nouvelle erreur — les deux fonctions restent appelables sans 4ᵉ argument partout ailleurs dans le code (paramètre optionnel, rétrocompatible).

- [ ] **Step 4: Commit**

```bash
git add lib/emails/send.ts
git commit -m "feat(emails): support des pièces jointes PDF sur confirmation locataire et notification propriétaire"
```

---

### Task 7: Générer le reçu locataire lors de la confirmation de réservation

**Files:**
- Modify: `app/api/send-booking-confirmation/route.ts`

**Interfaces:**
- Consumes: `generateBookingDocument` (Task 5), `sendBookingConfirmationEmail(booking, villa, attachment?)` (Task 6).

- [ ] **Step 1: Étendre la requête booking et générer le reçu avant l'envoi email**

Remplacer le corps de la fonction `POST` (lignes 19-46) :

```typescript
  try {
    const { bookingId } = await request.json();
    if (!bookingId) {
      return NextResponse.json({ error: "Missing bookingId" }, { status: 400 });
    }

    const supabase = supabaseAdmin();
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select(
        "id, villa_id, start_date, end_date, guest_name, guest_email, price, cleaning_fee, service_fee, source, total_price_cents, status, client_user_id"
      )
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const { data: villa } = await supabase
      .from("villas")
      .select("name, location")
      .eq("id", booking.villa_id)
      .single();

    let attachment: { filename: string; content: Buffer } | undefined;
    try {
      const doc = await generateBookingDocument(supabase, bookingId, "tenant_receipt");
      if (doc) {
        attachment = { filename: `${doc.documentNumber}.pdf`, content: doc.pdfBuffer };
      }
    } catch (e) {
      console.error("send-booking-confirmation: génération reçu locataire échouée", e);
    }

    const result = await sendBookingConfirmationEmail(booking, villa, attachment);

    return NextResponse.json({ success: true, emailSent: result.sent });
  } catch (error) {
    console.error("Send booking confirmation error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
```

- [ ] **Step 2: Ajouter l'import**

En haut du fichier, ajouter :

```typescript
import { generateBookingDocument } from "@/lib/invoicing/generate-booking-document";
```

- [ ] **Step 3: Vérifier la compilation**

Run: `npx tsc --noEmit`
Expected: aucune nouvelle erreur

- [ ] **Step 4: Commit**

```bash
git add app/api/send-booking-confirmation/route.ts
git commit -m "feat(invoicing): génère et attache le reçu de paiement locataire à la confirmation"
```

---

### Task 8: Générer le relevé propriétaire dans le webhook Stripe

**Files:**
- Modify: `app/api/webhooks/stripe/route.ts:179-211`

**Interfaces:**
- Consumes: `generateBookingDocument` (Task 5), `sendOwnerNewBookingEmail(booking, villa, owner, attachment?)` (Task 6).

- [ ] **Step 1: Étendre la sélection booking et générer le relevé avant l'envoi email**

Remplacer le bloc `try { const { data: bookingForOwner } ... } catch (e) { console.error("Notify owner booking email failed:", e); }` (lignes 179-211) par :

```typescript
      try {
        const { data: bookingForOwner } = await supabase
          .from("bookings")
          .select(
            "id, villa_id, start_date, end_date, guest_name, price, cleaning_fee, service_fee, source, total_price_cents"
          )
          .eq("id", bookingId)
          .single();

        if (bookingForOwner?.villa_id) {
          const { data: villaForOwner } = await supabase
            .from("villas")
            .select("name, owner_id, commission_rate")
            .eq("id", bookingForOwner.villa_id)
            .single();

          if (villaForOwner?.owner_id) {
            const { data: ownerProfile } = await supabase
              .from("profiles")
              .select("email, full_name")
              .eq("id", villaForOwner.owner_id)
              .maybeSingle();

            let attachment: { filename: string; content: Buffer } | undefined;
            try {
              const doc = await generateBookingDocument(supabase, bookingId, "owner_statement");
              if (doc) {
                attachment = { filename: `${doc.documentNumber}.pdf`, content: doc.pdfBuffer };
              }
            } catch (e) {
              console.error("Génération relevé propriétaire échouée:", e);
            }

            await sendOwnerNewBookingEmail(
              bookingForOwner,
              villaForOwner,
              ownerProfile,
              attachment
            );
          }
        }
      } catch (e) {
        console.error("Notify owner booking email failed:", e);
      }
```

- [ ] **Step 2: Ajouter l'import**

En haut du fichier, ajouter :

```typescript
import { generateBookingDocument } from "@/lib/invoicing/generate-booking-document";
```

- [ ] **Step 3: Vérifier la compilation**

Run: `npx tsc --noEmit`
Expected: aucune nouvelle erreur

- [ ] **Step 4: Commit**

```bash
git add app/api/webhooks/stripe/route.ts
git commit -m "feat(invoicing): génère et attache le relevé propriétaire à la notification de réservation"
```

---

### Task 9: Route de téléchargement — `GET /api/documents/[id]/download`

**Files:**
- Create: `app/api/documents/[id]/download/route.ts`

**Interfaces:**
- Consumes: `getSupabaseServer` (`lib/supabase-server.ts`), `supabaseAdmin` (`lib/supabase.ts`), RLS policies de Task 1 sur `booking_documents`.
- Produces: réponse `application/pdf` en téléchargement, ou 401/404 — consommé par Task 10 (UI locataire) et Task 11 (UI propriétaire) via lien `<a href="/api/documents/{id}/download">`.

- [ ] **Step 1: Implémenter la route**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  // RLS sur booking_documents : ne retourne la ligne que si l'utilisateur a le
  // droit de la voir (owner_read_own_statements / tenant_read_own_receipts /
  // admin_read_all_booking_documents) — cf. supabase/migrations/20260707120000_booking_documents.sql
  const { data: doc } = await supabase
    .from("booking_documents")
    .select("document_number, pdf_storage_path")
    .eq("id", id)
    .maybeSingle();

  if (!doc) {
    return NextResponse.json({ error: "Document introuvable" }, { status: 404 });
  }

  const admin = supabaseAdmin();
  const { data: file, error } = await admin.storage
    .from("booking-documents")
    .download(doc.pdf_storage_path);

  if (error || !file) {
    console.error("download document: fichier storage introuvable", error);
    return NextResponse.json({ error: "Fichier introuvable" }, { status: 404 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${doc.document_number}.pdf"`,
    },
  });
}
```

- [ ] **Step 2: Vérifier la compilation**

Run: `npx tsc --noEmit`
Expected: aucune nouvelle erreur

- [ ] **Step 3: Commit**

```bash
git add "app/api/documents/[id]/download/route.ts"
git commit -m "feat(invoicing): route de téléchargement RLS des documents (reçus/relevés)"
```

---

### Task 10: UI locataire — remplacer le faux bouton "Facture" par un vrai téléchargement

**Files:**
- Modify: `app/espace-client/documents/page.tsx`

**Interfaces:**
- Consumes: `GET /api/documents/[id]/download` (Task 9), table `booking_documents` (Task 1, via RLS `tenant_read_own_receipts`).

- [ ] **Step 1: Étendre l'interface et la requête pour récupérer les reçus générés**

Remplacer l'interface `BookingDoc` (lignes 14-19) :

```typescript
interface BookingDoc {
  id: string;
  villa_name: string;
  start_date: string;
  end_date: string;
  receiptDocumentId: string | null;
}
```

Remplacer le `useEffect` (lignes 26-49) :

```typescript
  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.email) { setLoading(false); return; }

      const { data } = await supabase
        .from("bookings")
        .select("id, start_date, end_date, villa_id, villas(name)")
        .or(tenantBookingsOrFilter(session.user.id, session.user.email))
        .eq("status", "confirmed")
        .order("start_date", { ascending: false });

      const bookingRows = (data || []) as any[];
      const bookingIds = bookingRows.map((b) => b.id);

      const { data: docs } = bookingIds.length > 0
        ? await supabase
            .from("booking_documents")
            .select("id, booking_id")
            .eq("document_type", "tenant_receipt")
            .in("booking_id", bookingIds)
        : { data: [] };

      const docByBooking = new Map((docs || []).map((d: any) => [d.booking_id, d.id]));

      setBookings(
        bookingRows.map((b) => ({
          id: b.id,
          villa_name: b.villas?.name ?? "Villa Kayvila",
          start_date: b.start_date,
          end_date: b.end_date,
          receiptDocumentId: docByBooking.get(b.id) ?? null,
        }))
      );
      setLoading(false);
    })();
  }, [supabase]);
```

- [ ] **Step 2: Supprimer `printInvoice` et remplacer le bouton par un lien de téléchargement**

Supprimer entièrement la fonction `printInvoice` (lignes 56-64).

Remplacer le bloc du bouton (lignes 125-133). Le composant `Button` (HeroUI) est retiré au profit d'un `<a>` stylé directement, à l'identique du lien "Livret d'accueil PDF" déjà présent plus haut dans ce même fichier (lignes 98-104) :

```tsx
                      {b.receiptDocumentId ? (
                        <a
                          href={`/api/documents/${b.receiptDocumentId}/download`}
                          className="inline-flex min-h-[44px] items-center gap-1.5 rounded-none border border-navy/20 bg-white px-4 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-navy/80 no-underline transition-colors hover:border-navy hover:text-navy"
                        >
                          <FileText size={14} aria-hidden />
                          Télécharger
                        </a>
                      ) : (
                        <span className="text-[10px] uppercase tracking-[0.14em] text-navy/40">
                          Reçu indisponible
                        </span>
                      )}
```

Le composant `Button` de `@heroui/react` (importé ligne 6) devient inutilisé dans ce fichier si aucun autre bouton ne le référence — vérifier et retirer l'import si c'est le cas.

- [ ] **Step 3: Vérifier la compilation**

Run: `npx tsc --noEmit`
Expected: aucune nouvelle erreur

- [ ] **Step 4: Test manuel dans le navigateur**

Run: `npm run dev` (si pas déjà lancé sur le port 3001), se connecter avec un compte locataire de test ayant un séjour terminé (cf. mémoire `reference_test_accounts`), aller sur `/espace-client/documents`, cliquer "Télécharger" sur un séjour ayant un reçu généré.
Expected: le PDF se télécharge, contient le bon montant et numéro de reçu.

- [ ] **Step 5: Commit**

```bash
git add app/espace-client/documents/page.tsx
git commit -m "fix(espace-client): remplace le faux bouton Facture par un vrai téléchargement de reçu"
```

---

### Task 11: UI propriétaire — relevés par réservation + suppression des exports ad-hoc

**Files:**
- Modify: `app/(proprio)/dashboard/revenus/page.tsx`
- Modify: `components/dashboard/proprio/RevenueBreakdownTable.tsx`
- Modify: `components/dashboard/proprio/RevenuePageClient.tsx`
- Delete: `app/api/proprio/releve/route.ts`
- Delete: `app/api/proprio/revenus/export-pdf/route.ts`
- Delete: `components/dashboard/proprio/RelevePDF.tsx`

**Interfaces:**
- Consumes: `GET /api/documents/[id]/download` (Task 9), table `booking_documents` (Task 1, via RLS `owner_read_own_statements`).
- Produces: `RevenueRow.statementDocumentId: string | null` — nouveau champ consommé par `RevenueBreakdownTable`.

- [ ] **Step 1: Ajouter le champ `statementDocumentId` au type `RevenueRow`**

Dans `components/dashboard/proprio/RevenueBreakdownTable.tsx`, modifier le type (lignes 5-21) :

```typescript
export type RevenueRow = {
  id: string;
  checkIn: string;
  guestName: string;
  villaName: string;
  nights: number;
  gross: number;
  commissionRate: number;
  commission: number;
  cleaningFee: number;
  net: number;
  paymentStatus: string;
  stripeTransferId: string | null;
  stripeTransferDate: string | null;
  stripeTransferStatus: string | null;
  villaId: string;
  statementDocumentId: string | null;
};
```

- [ ] **Step 2: Ajouter le lien de téléchargement dans la ligne de détail dépliée**

Dans `components/dashboard/proprio/RevenueBreakdownTable.tsx`, juste avant `<a href={\`/dashboard/reservations/...\`}>Voir la réservation complète →</a>` (ligne 221), ajouter :

```tsx
                        {row.statementDocumentId && (
                          <a
                            href={`/api/documents/${row.statementDocumentId}/download`}
                            className="mt-4 mr-4 inline-block text-xs text-gold hover:underline"
                          >
                            Télécharger le relevé →
                          </a>
                        )}
```

- [ ] **Step 3: Retirer le bouton "Exporter en PDF" (route supprimée)**

Dans `components/dashboard/proprio/RevenuePageClient.tsx`, remplacer tout le fichier :

```tsx
"use client";

import { RevenueBreakdownTable, type RevenueRow } from "@/components/dashboard/proprio/RevenueBreakdownTable";

export function RevenuePageClient({ rows }: { rows: RevenueRow[] }) {
  return (
    <div className="space-y-6">
      <RevenueBreakdownTable rows={rows} />
    </div>
  );
}
```

- [ ] **Step 4: Retirer le bouton "Télécharger le relevé" mensuel et alimenter `statementDocumentId`**

Dans `app/(proprio)/dashboard/revenus/page.tsx`, retirer le bloc (lignes 132-141) :

```tsx
        <div className="flex items-center gap-4 mb-4">
          <a
            href={`/api/proprio/releve?month=${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`}
            download
            className="inline-flex items-center gap-2 rounded-xl bg-gold px-4 py-2 text-sm font-semibold text-white hover:bg-gold/90"
          >
            <KayvilaPngIcon name="download" size={20} />
            Télécharger le relevé
          </a>
        </div>
```

Puis, après la requête `bookings` (après ligne 51), ajouter la récupération des relevés générés :

```typescript
  const bookingIds = (bookings ?? []).map((b: any) => b.id);
  const { data: statementDocs } = bookingIds.length > 0
    ? await supabase
        .from("booking_documents")
        .select("id, booking_id")
        .eq("document_type", "owner_statement")
        .in("booking_id", bookingIds)
    : { data: [] };
  const statementByBooking = new Map(
    (statementDocs ?? []).map((d: any) => [d.booking_id, d.id])
  );
```

Puis, dans la construction de `revenueRows` (lignes 54-86), ajouter le champ (juste après `villaId: b.villa_id,` ligne 84) :

```typescript
      villaId: b.villa_id,
      statementDocumentId: statementByBooking.get(b.id) ?? null,
```

Enfin, retirer l'import désormais inutile `KayvilaPngIcon` si plus utilisé ailleurs dans le fichier (vérifier avant suppression), et mettre à jour l'appel à `RevenuePageClient` (ligne 152) pour retirer la prop `period` désormais inutile :

```tsx
          <RevenuePageClient rows={revenueRows} />
```

- [ ] **Step 5: Supprimer les 3 fichiers ad-hoc**

```bash
git rm app/api/proprio/releve/route.ts
git rm app/api/proprio/revenus/export-pdf/route.ts
git rm components/dashboard/proprio/RelevePDF.tsx
```

- [ ] **Step 6: Vérifier la compilation**

Run: `npx tsc --noEmit`
Expected: aucune erreur — en particulier vérifier qu'aucun autre fichier n'importe `RelevePDF` ou n'appelle `/api/proprio/releve` / `/api/proprio/revenus/export-pdf` :

```bash
grep -rn "RelevePDF\|proprio/releve\|revenus/export-pdf" app components --include="*.tsx" --include="*.ts"
```
Expected: aucun résultat restant.

- [ ] **Step 7: Test manuel dans le navigateur**

Run: se connecter avec un compte propriétaire de test (cf. mémoire `reference_test_accounts`), aller sur `/dashboard/revenus`, déplier une ligne de réservation directe ayant un relevé généré, cliquer "Télécharger le relevé →".
Expected: le PDF se télécharge, montants cohérents avec la ligne du tableau.

- [ ] **Step 8: Commit**

```bash
git add app/(proprio)/dashboard/revenus/page.tsx components/dashboard/proprio/RevenueBreakdownTable.tsx components/dashboard/proprio/RevenuePageClient.tsx
git commit -m "feat(dashboard-proprio): relevés par réservation téléchargeables, suppression des exports PDF ad-hoc"
```

---

### Task 12: Test d'intégration webhook — génération des deux documents

**Files:**
- Modify: `tests/stripe-webhooks.spec.ts`

**Interfaces:**
- Consumes: pattern existant `seedPendingBooking`, `sbSelect`, `sbDelete`, `makeEvent`, `sign`, `postWebhook` (déjà définis dans le fichier).

- [ ] **Step 1: Ajouter un helper de seed avec email + montants (nécessaires pour générer les 2 documents)**

Après la fonction `seedPendingBooking` existante (après ligne 133), ajouter :

```typescript
/** Seed une réservation confirmable (email + montants) pour tester la génération de documents. */
async function seedConfirmableBooking(
  request: APIRequestContext
): Promise<string | null> {
  const villas = await sbSelect(request, "villas", "select=id,owner_id&limit=1");
  if (villas.length === 0 || !villas[0].owner_id) return null;

  const res = await request.post(`${SUPABASE_URL}/rest/v1/bookings`, {
    headers: { ...sbHeaders(), Prefer: "return=representation" },
    data: {
      villa_id: villas[0].id,
      start_date: "2027-04-01",
      end_date: "2027-04-08",
      status: "pending",
      payment_status: "unpaid",
      source: "direct",
      guest_name: `E2E Doc Test ${RUN_ID}`,
      guest_email: `e2e-doc-${RUN_ID}@example.com`,
      guests: 2,
      price: 1000,
      cleaning_fee: 80,
      service_fee: 20,
    },
  });
  if (!res.ok()) return null;
  const rows = await res.json();
  return rows[0]?.id ?? null;
}
```

- [ ] **Step 2: Ajouter le test de génération des documents**

Déclarer une variable de suivi près de `seededBookingId` (ligne 37) :

```typescript
let seededDocBookingId: string | null = null;
```

Ajouter le nettoyage dans `test.afterAll` (après le bloc `if (seededBookingId) { ... }`, ligne 158) :

```typescript
    if (seededDocBookingId) {
      const docs = await sbSelect(
        request,
        "booking_documents",
        `select=pdf_storage_path&booking_id=eq.${seededDocBookingId}`
      );
      for (const doc of docs) {
        await request.delete(
          `${SUPABASE_URL}/storage/v1/object/booking-documents/${doc.pdf_storage_path}`,
          { headers: sbHeaders() }
        );
      }
      await sbDelete(request, "booking_documents", `booking_id=eq.${seededDocBookingId}`);
      await sbDelete(request, "order_status_history", `booking_id=eq.${seededDocBookingId}`);
      await sbDelete(request, "bookings", `id=eq.${seededDocBookingId}`);
    }
```

Ajouter le test (après le test `"checkout.session.expired → booking cancelled"`, après ligne 228) :

```typescript
  test("checkout.session.completed → génère reçu locataire + relevé propriétaire", async ({
    request,
  }) => {
    test.skip(!SERVICE_KEY, "SUPABASE_SERVICE_ROLE_KEY absent");

    seededDocBookingId = await seedConfirmableBooking(request);
    test.skip(!seededDocBookingId, "Seed impossible (aucune villa avec owner_id en base)");

    const payload = makeEvent("checkout.session.completed", {
      id: `cs_e2e_docs_${RUN_ID}`,
      object: "checkout.session",
      metadata: { bookingId: seededDocBookingId },
      payment_intent: `pi_e2e_docs_${RUN_ID}`,
      customer_email: `e2e-doc-${RUN_ID}@example.com`,
      customer_details: { email: `e2e-doc-${RUN_ID}@example.com` },
    });
    const res = await postWebhook(request, payload, sign(payload));
    expect(res.status()).toBe(200);

    // Laisser le temps aux fetch internes (send-booking-confirmation) de traiter.
    await new Promise((r) => setTimeout(r, 2000));

    const docs = await sbSelect(
      request,
      "booking_documents",
      `select=document_type,document_number,amount_cents&booking_id=eq.${seededDocBookingId}`
    );

    expect(docs.length).toBe(2);

    const tenantDoc = docs.find((d: any) => d.document_type === "tenant_receipt");
    const ownerDoc = docs.find((d: any) => d.document_type === "owner_statement");

    expect(tenantDoc).toBeDefined();
    expect(tenantDoc.document_number).toMatch(/^KAY-RECU-\d{4}-\d{6}$/);
    expect(tenantDoc.amount_cents).toBeGreaterThan(0);

    expect(ownerDoc).toBeDefined();
    expect(ownerDoc.document_number).toMatch(/^KAY-RELV-\d{4}-\d{6}$/);
    expect(ownerDoc.amount_cents).toBeGreaterThan(0);
  });
```

- [ ] **Step 3: Lancer le test**

Run: `npx playwright test tests/stripe-webhooks.spec.ts -g "génère reçu locataire"`
Expected: PASS — 2 lignes `booking_documents` créées avec les bons formats de numéro.

Si le test échoue avec `Seed impossible` : vérifier qu'au moins une villa en base a un `owner_id` non nul (cas attendu en environnement de dev seedé).

- [ ] **Step 4: Lancer la suite complète pour non-régression**

Run: `npx playwright test tests/stripe-webhooks.spec.ts`
Expected: tous les tests passent (y compris les tests existants inchangés).

- [ ] **Step 5: Commit**

```bash
git add tests/stripe-webhooks.spec.ts
git commit -m "test(webhooks): vérifie la génération du reçu locataire et du relevé propriétaire"
```

---

## Vérification finale

- [ ] **Run complet des tests unitaires**

Run: `npx vitest run`
Expected: tous les tests passent, y compris les 3 nouveaux fichiers (`booking-document-amounts.test.ts`, `TenantReceiptPDF.test.ts`, `OwnerStatementPDF.test.ts`) et les fichiers existants (aucune régression sur `booking-revenue.test.ts`, `monthly-detail.test.ts`, etc.)

- [ ] **Run `tsc --noEmit` sur l'ensemble du projet**

Run: `npx tsc --noEmit`
Expected: 0 erreur

- [ ] **Run `npm run lint`**

Run: `npm run lint`
Expected: 0 erreur (warnings pré-existants tolérés, ne pas en introduire de nouveaux)

- [ ] **Ne pas lancer `npm run build`** (règle du projet — corrompt `.next` sur cet environnement)
